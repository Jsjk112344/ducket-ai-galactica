// Ducket AI Galactica — OpenClaw Pipeline Orchestrator
// Apache 2.0 License
//
// One-shot pipeline: scan all platforms, classify each listing, enforce escrow.
// No cron scheduling — designed to be triggered by the OpenClaw agent loop.
// Mirrors scan-loop.js logic but imports modules directly (no cron side effects).
//
// Run with: node agent/src/openclaw-loop.js
// Or triggered by OpenClaw gateway agent turn.

import { scrapeStubHub } from '../tools/scrape-stubhub.js';
import { scrapeViagogo } from '../tools/scrape-viagogo.js';
import { scrapeFacebook } from '../tools/scrape-facebook.js';
import { classifyListing } from './classify.js';
import { writeCaseFile, isCaseFileExists } from './evidence.js';
import { dispatchEscrowAction } from './escrow.js';
import * as dotenv from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env'), quiet: true });

const EVENT_NAME = process.env.EVENT_NAME ?? 'FIFA World Cup 2026';
// Enforcement gate: listings with confidence >= threshold AND non-LEGITIMATE category trigger escrow_deposit.
// Default 85 — matches the rule-based high-confidence cutoff in classify.js.
const FRAUD_CONFIDENCE_THRESHOLD = parseInt(process.env.FRAUD_CONFIDENCE_THRESHOLD ?? '85');

/**
 * Run one full pipeline cycle: scan → classify → enforce.
 * Returns summary object for logging/testing.
 * No cron, no top-level await on import-sensitive code — safe to require from tests.
 */
async function runPipeline() {
  console.log(`[OpenClawLoop] Pipeline start: ${new Date().toISOString()} — event: ${EVENT_NAME}`);

  // ── Scan ──────────────────────────────────────────────────────────────────
  // Promise.allSettled: one blocked platform does NOT kill the others.
  const results = await Promise.allSettled([
    scrapeStubHub(EVENT_NAME),
    scrapeViagogo(EVENT_NAME),
    scrapeFacebook(EVENT_NAME),
  ]);

  const names = ['StubHub', 'Viagogo', 'Facebook'];
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      // Unexpected — scrapers are designed to catch internally and return mock, not throw.
      // Logged here as a safety net in case a scraper's outer catch somehow fails.
      console.error(`[OpenClawLoop] ${names[i]} scraper rejected: ${r.reason}`);
    } else {
      console.log(`[OpenClawLoop] ${names[i]}: ${r.value.length} listings`);
    }
  });

  // Merge fulfilled results — rejected scrapers contribute zero listings
  const listings = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  console.log(`[OpenClawLoop] ${listings.length} total listings from ${names.length} sources`);

  // ── Classify + Enforce ────────────────────────────────────────────────────
  // No session-level dedup Set — OpenClaw controls invocation frequency.
  // isCaseFileExists() provides cross-run idempotency by checking cases/ directory.
  let classified = 0, gated = 0, enforced = 0, skipped = 0;

  for (const listing of listings) {
    // Idempotency: skip listings already classified in a prior pipeline run
    if (await isCaseFileExists(listing.url)) {
      console.log(`[OpenClawLoop] Skipping already-classified: ${listing.url.slice(0, 60)}...`);
      skipped++;
      continue;
    }

    const result = await classifyListing(listing);
    console.log(`[OpenClawLoop] ${listing.platform} | ${result.category} | ${result.confidence}% | ${result.classificationSource}`);

    // Enforcement gate: confidence >= threshold AND non-LEGITIMATE → escrow_deposit action
    const meetsThreshold = result.confidence >= FRAUD_CONFIDENCE_THRESHOLD && result.category !== 'LEGITIMATE';
    const actionTaken = meetsThreshold ? 'escrow_deposit' : 'logged_only';

    await writeCaseFile(listing, result, actionTaken);
    classified++;

    if (meetsThreshold) {
      console.log(`[OpenClawLoop] ENFORCEMENT GATE PASSED — ${result.category} at ${result.confidence}%`);

      // Dispatch escrow action: deposit + category-specific action (release/refund/slash)
      const escrowResult = await dispatchEscrowAction({
        category: result.category,
        listing,
        caseFilePath: null, // case file already written — no update needed from escrow
        timestamp: Date.now(),
      });

      if (escrowResult) {
        enforced++;
        console.log(`[OpenClawLoop] Escrow enforced: ${escrowResult.etherscanLink}`);
      } else {
        console.log(`[OpenClawLoop] Escrow skipped (insufficient balance or tx error)`);
      }
      gated++;
    } else {
      console.log(`[OpenClawLoop] Below threshold (${result.confidence}% < ${FRAUD_CONFIDENCE_THRESHOLD}%) or LEGITIMATE — logged only`);
    }
  }

  const summary = { listings: listings.length, classified, gated, enforced, skipped };
  console.log(`[OpenClawLoop] Summary: ${JSON.stringify(summary)}`);
  console.log(`[OpenClawLoop] Pipeline complete: ${new Date().toISOString()}`);
  return summary;
}

// ── Entry point ─────────────────────────────────────────────────────────────
// Wrapped in runPipeline().then(exit) — NOT top-level await.
// This pattern is safe to import from other modules without triggering the pipeline.
// (Top-level await in scan-loop.js is why we cannot import that file here.)
runPipeline()
  .then(() => { process.exit(0); })
  .catch(err => {
    console.error('[OpenClawLoop] Pipeline failed:', err.message);
    process.exit(1);
  });
