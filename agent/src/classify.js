// Ducket AI Galactica — Hybrid Fraud Classification Engine
// Apache 2.0 License
//
// Classifies every ticket listing into one of four fraud categories:
//   SCALPING_VIOLATION, LIKELY_SCAM, COUNTERFEIT_RISK, LEGITIMATE
//
// Architecture: Rule-based first pass (deterministic, fast, no API cost).
// High-confidence rule results (>=85) skip the Claude API entirely.
// Ambiguous cases are forwarded to Claude API with structured JSON output.
// On Claude API failure, falls back to rules-only result — never blocks pipeline.
//
// Export: classifyListing(listing) → { category, confidence, reasoning, classificationSource }
// Export: classifyByRules(listing) — exported for unit testing

import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from project root (two levels up from agent/src/)
dotenv.config({ path: join(__dirname, '../../.env'), quiet: true });

// All operational logs go to stderr — keeps stdout clean when piped.
const log = (...args) => process.stderr.write(args.join(' ') + '\n');

// Exhaustive list of valid fraud categories enforced throughout the pipeline.
// Adding a new category requires updating: this array, classifyByRules(), the Claude schema.
const CATEGORIES = ['SCALPING_VIOLATION', 'LIKELY_SCAM', 'COUNTERFEIT_RISK', 'LEGITIMATE'];

/**
 * Rule-based first pass — deterministic, synchronous, no API call.
 * Exported for unit testing so tests never trigger the Claude API.
 *
 * Rules (applied in priority order):
 *   1. priceDeltaPct > 100  → SCALPING_VIOLATION (confidence scales with markup)
 *   2. priceDeltaPct < -10  → LIKELY_SCAM (below face value = scam signal)
 *   3. redFlags contains 'new seller' or 'no proof' → COUNTERFEIT_RISK
 *   4. None matched → LEGITIMATE (ambiguous, low confidence — Claude will re-evaluate)
 *
 * @param {Object} listing - Canonical listing schema from scrapers
 * @returns {{ category: string, confidence: number, reasoning: string, classificationSource: 'rules' }}
 */
export function classifyByRules(listing) {
  const { priceDeltaPct, redFlags } = listing;
  const flags = redFlags ?? [];

  // Rule 1: Price significantly above face value → scalping
  // Confidence formula: min(95, 70 + priceDeltaPct/20)
  //   priceDeltaPct=100 → confidence=75, priceDeltaPct=300 → confidence=85, priceDeltaPct=500 → confidence=95
  if (priceDeltaPct !== null && priceDeltaPct !== undefined && priceDeltaPct > 100) {
    const confidence = Math.min(95, 70 + Math.round(priceDeltaPct / 20));
    return {
      category: 'SCALPING_VIOLATION',
      confidence,
      reasoning: `Price is ${priceDeltaPct}% above face value (threshold: 100%). Confidence ${confidence}% based on markup magnitude.`,
      classificationSource: 'rules',
    };
  }

  // Rule 2: Price below face value by more than 10% → likely scam
  // Common fraud pattern: too-good-to-be-true pricing to lure victims.
  if (priceDeltaPct !== null && priceDeltaPct !== undefined && priceDeltaPct < -10) {
    return {
      category: 'LIKELY_SCAM',
      confidence: 72,
      reasoning: `Price is ${Math.abs(priceDeltaPct)}% below face value — common ticket fraud pattern (below-face-value bait).`,
      classificationSource: 'rules',
    };
  }

  // Rule 3: Red flags containing 'new seller' or 'no proof' → counterfeit risk
  // These signals indicate a seller without established reputation or verifiable ticket provenance.
  if (flags.some((f) => f.toLowerCase().includes('new seller') || f.toLowerCase().includes('no proof'))) {
    return {
      category: 'COUNTERFEIT_RISK',
      confidence: 68,
      reasoning: `Seller red flags detected: ${flags.join(', ')}. Counterfeit risk from unverified seller or missing proof.`,
      classificationSource: 'rules',
    };
  }

  // Rule 4: No signals matched → ambiguous, low-confidence LEGITIMATE
  // classifyListing() will forward this to Claude for reasoning unless source is 'mock'.
  return {
    category: 'LEGITIMATE',
    confidence: 55,
    reasoning: 'No strong rule signals detected.',
    classificationSource: 'rules',
  };
}

/**
 * Claude API classification — called for ambiguous cases (rule confidence < 85).
 * Uses structured JSON output (output_config.format) to guarantee a valid
 * {category, confidence, reasoning} object — no retry loop or manual JSON parsing needed.
 *
 * @param {Object} listing - Canonical listing schema from scrapers
 * @param {Anthropic} client - Initialized Anthropic SDK client
 * @returns {{ category: string, confidence: number, reasoning: string, classificationSource: 'claude' }}
 */
async function classifyWithClaude(listing, client) {
  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 512,
    system: `You are a fraud detection agent for ticket marketplaces at FIFA World Cup 2026.
Classify each ticket listing into exactly one category:

SCALPING_VIOLATION: Price significantly above official face value (>2x, i.e. >100% markup). Core enforcement target.
LIKELY_SCAM: Price below face value, missing legitimacy proof, or suspicious seller signals. Classic bait pricing.
COUNTERFEIT_RISK: Known scam patterns — new accounts, no verifiable ticket source, missing seller proof.
LEGITIMATE: Normal pricing (within 100% of face value), no red flags present.

Your reasoning must explain which signals drove the decision. Be specific about price percentages and flag details.
Return ONLY the structured JSON object. Do not add commentary outside the JSON.`,
    messages: [
      {
        role: 'user',
        content: `Classify this ticket listing:\n${JSON.stringify(listing, null, 2)}`,
      },
    ],
    // output_config with json_schema enforces valid JSON — eliminates parse errors.
    // Supported on claude-sonnet-4-6, claude-opus-4-6, claude-sonnet-4-5, claude-haiku-4-5.
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: CATEGORIES },
            confidence: { type: 'number', minimum: 0, maximum: 100 },
            reasoning: { type: 'string' },
          },
          required: ['category', 'confidence', 'reasoning'],
          additionalProperties: false,
        },
      },
    },
  });

  // Structured output returns a text block with guaranteed-valid JSON.
  // Fallback to '{}' handles edge case where API returns no text block.
  const text = response.content.find((b) => b.type === 'text')?.text ?? '{}';
  const parsed = JSON.parse(text);
  return { ...parsed, classificationSource: 'claude' };
}

/**
 * Main classification entry point — hybrid rules + Claude API.
 *
 * Flow:
 *   1. Run rule-based first pass (always)
 *   2. If source === 'mock': return rules result with classificationSource 'rules-mock' (never call Claude)
 *   3. If rule confidence >= 85: return rules result as-is (skip Claude to save tokens)
 *   4. Otherwise: call Claude API for ambiguous reasoning
 *   5. On Claude failure: fallback to rules result with classificationSource 'rules-only'
 *
 * Logs every classification to stderr: platform | category | confidence% | source
 *
 * @param {Object} listing - Canonical listing schema from scrapers
 * @returns {{ category: string, confidence: number, reasoning: string, classificationSource: string }}
 */
export async function classifyListing(listing) {
  const rulesResult = classifyByRules(listing);

  // Mock listings: rules only, never call Claude API.
  // Prevents synthetic data from consuming API quota and ensures
  // mock-gated enforcement gate (see scan-loop integration) uses labeled source.
  if (listing.source === 'mock') {
    const result = { ...rulesResult, classificationSource: 'rules-mock' };
    log(`[Classify] ${listing.platform} | ${result.category} | ${result.confidence}% | source:${result.classificationSource}`);
    return result;
  }

  // High-confidence rule result: skip Claude to save tokens + latency.
  // Rule threshold set at 85 — matches FRAUD_CONFIDENCE_THRESHOLD in .env.
  if (rulesResult.confidence >= 85) {
    log(`[Classify] ${listing.platform} | ${rulesResult.category} | ${rulesResult.confidence}% | source:${rulesResult.classificationSource}`);
    return rulesResult;
  }

  // Ambiguous case: call Claude API for deeper reasoning.
  try {
    const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    const claudeResult = await classifyWithClaude(listing, client);
    log(`[Classify] ${listing.platform} | ${claudeResult.category} | ${claudeResult.confidence}% | source:${claudeResult.classificationSource}`);
    return claudeResult;
  } catch (err) {
    // Claude API failure must never block the pipeline.
    // Fallback to rules result with 'rules-only' source label for transparency.
    log(`[Classify] Claude API error (${err.message}) — falling back to rules-only`);
    const fallback = { ...rulesResult, classificationSource: 'rules-only' };
    log(`[Classify] ${listing.platform} | ${fallback.category} | ${fallback.confidence}% | source:${fallback.classificationSource}`);
    return fallback;
  }
}
