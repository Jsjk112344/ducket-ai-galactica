// Ducket AI Galactica — Multi-Signal Risk Scoring Classification Engine
// Apache 2.0 License
//
// Classifies every ticket listing using a weighted multi-signal risk model.
// Five independent signals are scored 0-100, then combined with weights:
//
//   Pricing Risk    (30%) — market-adjusted price analysis (not just face value)
//   Seller Risk     (25%) — account age, transaction history, verification
//   Listing Risk    (20%) — description quality, transfer method, section specificity
//   Temporal Risk   (15%) — account age vs listing timing patterns
//   Platform Risk   (10%) — platform-level trust (StubHub > Viagogo > Facebook)
//
// The composite risk score maps to a verdict:
//   < 30  → LEGITIMATE (high confidence)
//   30-50 → ambiguous → Claude API for deep analysis
//   > 50  → fraud category assigned by strongest signal, Claude confirms
//
// Export: classifyListing(listing) → { category, confidence, reasoning, classificationSource, signals }
// Export: classifyByRules(listing) — exported for unit testing

import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env'), quiet: true });

const log = (...args) => process.stderr.write(args.join(' ') + '\n');

const CATEGORIES = ['SCALPING_VIOLATION', 'LIKELY_SCAM', 'COUNTERFEIT_RISK', 'LEGITIMATE'];

// ── Signal Weights ──────────────────────────────────────────────────────────
const WEIGHTS = {
  pricing:  0.30,
  seller:   0.25,
  listing:  0.20,
  temporal: 0.15,
  platform: 0.10,
};

// ── Signal Scoring Functions ────────────────────────────────────────────────

/**
 * Pricing Risk — market-aware price analysis.
 * Accounts for event demand: sold-out events legitimately trade at 2-3x face.
 * Below-face pricing is always suspicious regardless of demand.
 */
function scorePricingRisk(listing) {
  const { priceDeltaPct, eventDemand } = listing;
  if (priceDeltaPct == null) return { score: 50, detail: 'No face value data — unable to verify pricing' };

  // Demand-adjusted markup thresholds (% above face value considered "normal")
  const normalMarkup = {
    sold_out: 250,   // sold-out Finals legitimately trade at 3.5x
    high: 120,       // high-demand matches: up to ~2.2x is market rate
    moderate: 60,    // moderate demand: up to ~1.6x
    low: 25,         // low demand: anything above 1.25x is suspicious
  };
  const threshold = normalMarkup[eventDemand] ?? 80; // default moderate-high

  if (priceDeltaPct < -50) {
    return { score: 95, detail: `${Math.abs(priceDeltaPct)}% below face value — extreme underpricing, classic scam bait` };
  }
  if (priceDeltaPct < -25) {
    return { score: 78, detail: `${Math.abs(priceDeltaPct)}% below face value — suspicious underpricing` };
  }
  if (priceDeltaPct < -10) {
    return { score: 55, detail: `${Math.abs(priceDeltaPct)}% below face value — unusual discount` };
  }
  if (priceDeltaPct <= threshold) {
    const ratio = Math.max(0, priceDeltaPct / threshold);
    const score = Math.round(ratio * 25); // 0-25 range for normal pricing
    return { score, detail: `${priceDeltaPct}% markup within ${eventDemand ?? 'expected'} demand range (threshold: ${threshold}%)` };
  }
  // Above demand-adjusted threshold
  const excess = priceDeltaPct - threshold;
  const score = Math.min(95, 40 + Math.round(excess / 3));
  return { score, detail: `${priceDeltaPct}% markup exceeds ${eventDemand ?? 'expected'} demand threshold of ${threshold}% by ${excess}pp` };
}

/**
 * Seller Risk — account trust signals.
 * New accounts with no history are high risk regardless of price.
 */
function scoreSellerRisk(listing) {
  const age = listing.sellerAge;
  const txns = listing.sellerTransactions;
  const verified = listing.sellerVerified;

  // If no seller data available, moderate default risk
  if (age == null && txns == null && verified == null) {
    return { score: 45, detail: 'No seller history data available — moderate default risk' };
  }

  let score = 0;
  const details = [];

  // Account age scoring (0-35 points)
  if (age != null) {
    if (age < 7)        { score += 35; details.push(`account ${age}d old (very new)`); }
    else if (age < 30)  { score += 28; details.push(`account ${age}d old (new)`); }
    else if (age < 90)  { score += 18; details.push(`account ${age}d old`); }
    else if (age < 365) { score += 8;  details.push(`account ${Math.round(age/30)}mo old`); }
    else                { score += 2;  details.push(`account ${Math.round(age/365)}yr old`); }
  }

  // Transaction history scoring (0-35 points)
  if (txns != null) {
    if (txns === 0)      { score += 35; details.push('0 prior transactions'); }
    else if (txns < 5)   { score += 25; details.push(`${txns} transactions (low)`); }
    else if (txns < 20)  { score += 15; details.push(`${txns} transactions`); }
    else if (txns < 50)  { score += 6;  details.push(`${txns} transactions`); }
    else                 { score += 2;  details.push(`${txns} transactions (established)`); }
  }

  // Verification status (0-30 points)
  if (verified === false) { score += 30; details.push('unverified seller'); }
  else if (verified === true) { score += 0; details.push('verified seller'); }
  else { score += 15; details.push('verification unknown'); }

  return { score: Math.min(100, score), detail: details.join(', ') };
}

/**
 * Listing Quality Risk — how detailed and legitimate the listing appears.
 * Vague listings with no section or transfer method are higher risk.
 */
function scoreListingRisk(listing) {
  const { listingDescription, transferMethod, section } = listing;
  let score = 0;
  const details = [];

  // Description quality (0-35 points)
  const desc = listingDescription ?? '';
  if (desc.length === 0)       { score += 30; details.push('no description'); }
  else if (desc.length < 15)   { score += 25; details.push('vague description'); }
  else if (desc.length < 40)   { score += 15; details.push('brief description'); }
  else                         { score += 3;  details.push('detailed description'); }

  // Transfer method (0-35 points)
  const methodScores = {
    verified_transfer: 2,
    email_transfer: 12,
    screenshot: 35,
    will_email: 28,
    dm_only: 40,
    unspecified: 25,
  };
  const methodScore = methodScores[transferMethod] ?? 25;
  score += methodScore;
  details.push(`transfer: ${transferMethod ?? 'unspecified'}`);

  // Section specificity (0-30 points)
  if (!section)              { score += 30; details.push('no section specified'); }
  else if (section.length < 5) { score += 18; details.push('vague section'); }
  else                       { score += 2;  details.push(`section: ${section}`); }

  return { score: Math.min(100, score), detail: details.join(', ') };
}

/**
 * Temporal Risk — timing patterns that indicate fraud.
 * New account + expensive listing = very suspicious.
 * Last-minute listing + below face = could be scam or motivated seller.
 */
function scoreTemporalRisk(listing) {
  const { sellerAge, price, faceValue, matchDate, listingDate } = listing;
  let score = 0;
  const details = [];

  // New account + high-value listing (0-50 points)
  if (sellerAge != null && sellerAge < 14 && price > 300) {
    score += 45;
    details.push(`new account (${sellerAge}d) selling $${price} tickets`);
  } else if (sellerAge != null && sellerAge < 30 && price > 500) {
    score += 30;
    details.push(`young account (${sellerAge}d) selling high-value tickets`);
  }

  // Event proximity analysis
  if (matchDate) {
    const daysUntilEvent = Math.max(0, Math.round((new Date(matchDate) - new Date()) / 86400000));
    if (daysUntilEvent < 2 && price < (faceValue ?? price) * 0.7) {
      score += 35;
      details.push(`last-minute below-face listing (${daysUntilEvent}d to event)`);
    } else if (daysUntilEvent < 7) {
      score += 10;
      details.push(`event in ${daysUntilEvent} days`);
    } else {
      details.push(`event in ${daysUntilEvent} days`);
    }
  }

  // Listing recency
  if (listingDate) {
    const listingAge = Math.round((Date.now() - new Date(listingDate).getTime()) / 86400000);
    if (listingAge < 1) { details.push('listed today'); }
    else { details.push(`listed ${listingAge}d ago`); }
  }

  return { score: Math.min(100, score), detail: details.join(', ') || 'no temporal signals' };
}

/**
 * Platform Risk — inherent trust level of the selling platform.
 * StubHub and Viagogo have buyer protection; Facebook Marketplace does not.
 */
function scorePlatformRisk(listing) {
  const platform = (listing.platform ?? '').toLowerCase();
  if (platform.includes('stubhub')) {
    return { score: 12, detail: 'StubHub — buyer guarantee, verified inventory' };
  }
  if (platform.includes('viagogo')) {
    return { score: 25, detail: 'Viagogo — buyer protection, mixed seller quality' };
  }
  if (platform.includes('facebook')) {
    return { score: 55, detail: 'Facebook Marketplace — no verification, P2P risk' };
  }
  if (platform.includes('ducket')) {
    return { score: 10, detail: 'Ducket — escrow-protected listing' };
  }
  return { score: 40, detail: `${listing.platform} — unknown platform trust` };
}

// ── Composite Scoring ───────────────────────────────────────────────────────

/**
 * Compute all five risk signals and the weighted composite score.
 * Returns the full signal breakdown for transparency in the Agent Decision Panel.
 */
function computeRiskSignals(listing) {
  const pricingRisk  = scorePricingRisk(listing);
  const sellerRisk   = scoreSellerRisk(listing);
  const listingRisk  = scoreListingRisk(listing);
  const temporalRisk = scoreTemporalRisk(listing);
  const platformRisk = scorePlatformRisk(listing);

  const compositeRisk = Math.round(
    pricingRisk.score  * WEIGHTS.pricing +
    sellerRisk.score   * WEIGHTS.seller +
    listingRisk.score  * WEIGHTS.listing +
    temporalRisk.score * WEIGHTS.temporal +
    platformRisk.score * WEIGHTS.platform
  );

  return { pricingRisk, sellerRisk, listingRisk, temporalRisk, platformRisk, compositeRisk };
}

/**
 * Map composite risk + individual signals to a fraud category.
 * The strongest individual signal can override the composite when extreme.
 */
function riskToCategory(signals, listing) {
  const { pricingRisk, sellerRisk, compositeRisk } = signals;
  const priceDelta = listing.priceDeltaPct ?? 0;

  // Critical override: extreme underpricing is always LIKELY_SCAM
  if (priceDelta < -40) return 'LIKELY_SCAM';

  // Critical override: extreme markup on non-sold-out event
  if (priceDelta > 300 && listing.eventDemand !== 'sold_out') return 'SCALPING_VIOLATION';

  // Composite-driven classification
  if (compositeRisk < 30) return 'LEGITIMATE';

  // Ambiguous zone (30-65): determine category from dominant signal
  if (compositeRisk <= 65) {
    if (priceDelta < -10) return 'LIKELY_SCAM';
    if (sellerRisk.score > 60) return 'COUNTERFEIT_RISK';
    if (priceDelta > 100) return 'SCALPING_VIOLATION';
    return 'LEGITIMATE'; // moderate risk but no dominant fraud signal
  }

  // High risk (>65): assign from strongest signal
  if (priceDelta < -10) return 'LIKELY_SCAM';
  if (priceDelta > 100) return 'SCALPING_VIOLATION';
  if (sellerRisk.score > 50) return 'COUNTERFEIT_RISK';
  return 'LIKELY_SCAM'; // high composite with no dominant signal → suspicious
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Rule-based multi-signal classification — deterministic, synchronous, no API call.
 * Exported for unit testing so tests never trigger the Claude API.
 */
export function classifyByRules(listing) {
  const signals = computeRiskSignals(listing);
  const category = riskToCategory(signals, listing);

  // Confidence: inverse of risk for LEGITIMATE, proportional for fraud
  let confidence;
  if (category === 'LEGITIMATE') {
    confidence = Math.min(95, Math.max(55, 95 - signals.compositeRisk));
  } else {
    confidence = Math.min(97, Math.max(55, 50 + Math.round(signals.compositeRisk / 2)));
  }

  // Build reasoning from signal details
  const topSignals = [
    { name: 'Pricing', ...signals.pricingRisk, weight: WEIGHTS.pricing },
    { name: 'Seller', ...signals.sellerRisk, weight: WEIGHTS.seller },
    { name: 'Listing', ...signals.listingRisk, weight: WEIGHTS.listing },
    { name: 'Temporal', ...signals.temporalRisk, weight: WEIGHTS.temporal },
    { name: 'Platform', ...signals.platformRisk, weight: WEIGHTS.platform },
  ].sort((a, b) => b.score * b.weight - a.score * a.weight);

  const reasoning = `Composite risk score: ${signals.compositeRisk}/100. ` +
    `Dominant signal: ${topSignals[0].name} (${topSignals[0].score}/100 — ${topSignals[0].detail}). ` +
    `${topSignals[1].name}: ${topSignals[1].score}/100 (${topSignals[1].detail}). ` +
    `${topSignals[2].name}: ${topSignals[2].score}/100 (${topSignals[2].detail}). ` +
    `Agent-sourced face value verified independently — not seller-reported.`;

  return {
    category,
    confidence,
    reasoning,
    classificationSource: 'rules',
    signals,
  };
}

/**
 * Claude API classification — called for ambiguous cases (composite risk 30-65).
 * Receives the full signal breakdown so Claude can reason about the combination.
 */
async function classifyWithClaude(listing, signals, client) {
  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 600,
    system: `You are a fraud detection agent for ticket resale at FIFA World Cup 2026.
You receive listings with a multi-signal risk breakdown. Your job is to weigh ALL signals together and make a nuanced classification.

CRITICAL: Price alone does NOT determine fraud. Consider the full picture:
- A 200% markup on a sold-out Final is LEGITIMATE market pricing, not scalping
- A 5% discount from a 2-day-old account with no history is COUNTERFEIT_RISK despite fair price
- A 60% discount from an established seller before event day might be a motivated seller, not a scam

Categories:
SCALPING_VIOLATION: Excessive markup that exploits buyers, CONSIDERING event demand. A sold-out event at 2-3x is market rate, not scalping.
LIKELY_SCAM: Suspicious signals that suggest the seller may not have valid tickets. Below-face bait pricing, DM-only communication, new accounts.
COUNTERFEIT_RISK: Seller cannot prove ticket authenticity. Unverified accounts, no transfer proof, vague listings.
LEGITIMATE: Fair pricing for demand level, trustworthy seller signals, specific listing details.

Face values are agent-sourced from the official FIFA database — never seller-reported.
Your reasoning MUST reference at least 3 different signals and explain how they interact.
Return ONLY the structured JSON object.`,
    messages: [
      {
        role: 'user',
        content: `Classify this listing. Signal breakdown:\n${JSON.stringify({ listing, signals }, null, 2)}`,
      },
    ],
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: CATEGORIES },
            confidence: { type: 'number' },
            reasoning: { type: 'string' },
          },
          required: ['category', 'confidence', 'reasoning'],
          additionalProperties: false,
        },
      },
    },
  });

  const text = response.content.find((b) => b.type === 'text')?.text ?? '{}';
  const parsed = JSON.parse(text);
  if (parsed.confidence != null && parsed.confidence <= 1) {
    parsed.confidence = Math.round(parsed.confidence * 100);
  }
  return { ...parsed, classificationSource: 'claude', signals };
}

/**
 * Main classification entry point — hybrid multi-signal rules + Claude API.
 *
 * Flow:
 *   1. Compute all 5 risk signals (always)
 *   2. If source === 'mock': return rules result (never call Claude)
 *   3. If composite risk < 25 or > 70: high-confidence rules result (skip Claude)
 *   4. If composite risk 25-70 (ambiguous): call Claude with full signal context
 *   5. On Claude failure: fallback to rules result
 */
export async function classifyListing(listing) {
  const rulesResult = classifyByRules(listing);

  // Mock listings: rules only, never call Claude API
  if (listing.source === 'mock') {
    const result = { ...rulesResult, classificationSource: 'rules-mock' };
    log(`[Classify] ${listing.platform} | ${result.category} | ${result.confidence}% | risk:${result.signals.compositeRisk} | source:${result.classificationSource}`);
    return result;
  }

  // High-confidence zones: skip Claude to save tokens + latency
  const risk = rulesResult.signals.compositeRisk;
  if (risk < 25 || risk > 70) {
    log(`[Classify] ${listing.platform} | ${rulesResult.category} | ${rulesResult.confidence}% | risk:${risk} | source:${rulesResult.classificationSource}`);
    return rulesResult;
  }

  // Ambiguous zone (25-70): call Claude API for deeper reasoning
  try {
    const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    const claudeResult = await classifyWithClaude(listing, rulesResult.signals, client);
    log(`[Classify] ${listing.platform} | ${claudeResult.category} | ${claudeResult.confidence}% | risk:${risk} | source:${claudeResult.classificationSource}`);
    return claudeResult;
  } catch (err) {
    log(`[Classify] Claude API error (${err.message}) — falling back to rules-only`);
    const fallback = { ...rulesResult, classificationSource: 'rules-only' };
    log(`[Classify] ${listing.platform} | ${fallback.category} | ${fallback.confidence}% | risk:${risk} | source:${fallback.classificationSource}`);
    return fallback;
  }
}
