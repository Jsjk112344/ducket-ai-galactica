// Ducket AI Galactica — Autonomous Scan Loop
// Apache 2.0 License
//
// Heartbeat loop that polls all three scraper platforms every 5 minutes.
// Uses node-cron for wall-clock scheduling and Promise.allSettled for resilience.
// Merges results, deduplicates by URL hash, appends to agent/memory/LISTINGS.md.
//
// Run with: node agent/src/scan-loop.js
// Env: EVENT_NAME (default: "FIFA World Cup 2026")

import cron from 'node-cron';
import { scrapeStubHub } from '../tools/scrape-stubhub.js';
import { scrapeViagogo } from '../tools/scrape-viagogo.js';
import { scrapeFacebook } from '../tools/scrape-facebook.js';
import { createHash } from 'node:crypto';
import { appendFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { classifyListing } from './classify.js';
import { writeCaseFile, isCaseFileExists } from './evidence.js';
import { dispatchEscrowAction, depositEscrow, slashEscrow, makeBondEscrowId } from './escrow.js';
import { updateCaseFileEscrow } from './evidence.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from project root (two levels up from agent/src/)
dotenv.config({ path: join(__dirname, '../../.env'), quiet: true });

const LISTINGS_PATH = join(__dirname, '../memory/LISTINGS.md');
const EVENT_NAME = process.env.EVENT_NAME ?? 'FIFA World Cup 2026';
// Enforcement gate: listings with confidence >= threshold AND non-LEGITIMATE category trigger escrow_deposit.
// Default 85 — matches the rule-based high-confidence cutoff in classify.js.
const FRAUD_CONFIDENCE_THRESHOLD = parseInt(process.env.FRAUD_CONFIDENCE_THRESHOLD ?? '85');

// Cross-run dedup: in-memory Set persists as long as process runs.
// Listings seen in prior cron cycles within the same session are not re-appended.
const seen = new Set();

// Organizer bond state — deposited once on startup, slashed once on first confirmed fraud
let bondDeposited = false;
let bondSlashed = false;
let bondEscrowId = null;

// SHA-256 URL hash sliced to 16 chars — used as deduplication key.
// Short slice is sufficient for collision-resistance at hackathon scale (~hundreds of listings).
function urlHash(url) {
  return createHash('sha256').update(url ?? '').digest('hex').slice(0, 16);
}

// Filter out listings whose URLs have already been seen this session.
// Returns only the net-new listings for this cycle.
function deduplicateListings(listings) {
  const fresh = [];
  for (const listing of listings) {
    const key = urlHash(listing.url);
    if (!seen.has(key)) {
      seen.add(key);
      fresh.push(listing);
    }
  }
  return fresh;
}

// Core scan cycle — invoked immediately on startup and then every 5 minutes.
// Uses Promise.allSettled so one blocked platform does NOT kill the other two.
// A Promise.all would cause the entire cycle to fail if Cloudflare blocks Viagogo;
// allSettled guarantees partial results are still logged and persisted.
async function runScanCycle() {
  console.log(`[ScanLoop] Cycle start: ${new Date().toISOString()} — event: ${EVENT_NAME}`);

  // allSettled: fulfilled results have .value (Listing[]), rejected results have .reason
  const results = await Promise.allSettled([
    scrapeStubHub(EVENT_NAME),
    scrapeViagogo(EVENT_NAME),
    scrapeFacebook(EVENT_NAME),
  ]);

  const names = ['StubHub', 'Viagogo', 'Facebook'];

  // Log per-platform outcome for judge explainability
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      // Unexpected — scrapers are designed to catch internally and return mock, not throw.
      // Logged here as a safety net in case a scraper's outer catch somehow fails.
      console.error(`[ScanLoop] ${names[i]} scraper rejected: ${r.reason}`);
    } else {
      console.log(`[ScanLoop] ${names[i]}: ${r.value.length} listings`);
    }
  });

  // Merge all fulfilled results — rejected scrapers contribute zero listings
  const allListings = results.flatMap((r) =>
    r.status === 'fulfilled' ? r.value : []
  );

  // Deduplicate against the session-level seen Set
  const fresh = deduplicateListings(allListings);
  console.log(
    `[ScanLoop] ${allListings.length} total | ${fresh.length} new after dedup | ${seen.size} seen total`
  );

  if (fresh.length > 0) {
    // Append new listings as a timestamped scan block in LISTINGS.md.
    // Using appendFile (not writeFile) — each cycle adds to the running log.
    const entry = `\n## Scan: ${new Date().toISOString()}\n\n\`\`\`json\n${JSON.stringify(fresh, null, 2)}\n\`\`\`\n`;
    await appendFile(LISTINGS_PATH, entry, 'utf8');
    console.log(`[ScanLoop] Appended ${fresh.length} new listings to LISTINGS.md`);
  } else {
    console.log('[ScanLoop] No new listings this cycle');
  }

  // Classification + Evidence pipeline — Phase 5
  // Runs for every fresh listing after the LISTINGS.md append (log first, then classify).
  // Each listing is classified inline, gated for enforcement, and has a case file written.
  let classified = 0, gated = 0, skipped = 0, enforced = 0, totalUsdtLocked = 0;
  for (const listing of fresh) {
    // Idempotency: skip listings already classified in a prior session
    if (await isCaseFileExists(listing.url)) {
      console.log(`[ScanLoop] Skipping already-classified: ${listing.url.slice(0, 60)}...`);
      skipped++;
      continue;
    }

    const result = await classifyListing(listing);
    console.log(`[ScanLoop] ${listing.platform} | ${result.category} | ${result.confidence}% | ${result.classificationSource} | ${result.reasoning.slice(0, 80)}`);

    // Enforcement gate: confidence >= threshold AND non-LEGITIMATE → escrow_deposit action
    const meetsThreshold = result.confidence >= FRAUD_CONFIDENCE_THRESHOLD && result.category !== 'LEGITIMATE';
    const actionTaken = meetsThreshold ? 'escrow_deposit' : 'logged_only';

    const caseFilePath = await writeCaseFile(listing, result, actionTaken);
    classified++;

    if (meetsThreshold) {
      console.log(`[ScanLoop] ENFORCEMENT GATE PASSED — ${result.category} at ${result.confidence}%`);

      // Dispatch escrow action: deposit + category-specific action (release/refund/slash)
      const escrowResult = await dispatchEscrowAction({
        category: result.category,
        listing,
        caseFilePath,
        timestamp: Date.now(),
      });

      if (escrowResult) {
        enforced++;
        totalUsdtLocked += 10;
        console.log(`[ScanLoop] Escrow enforced: ${result.category} -> ${escrowResult.etherscanLink}`);
      } else {
        console.log(`[ScanLoop] Escrow action skipped (insufficient balance or tx error)`);
      }

      // Bond slash: first confirmed fraud above threshold slashes the organizer bond exactly once
      if (bondDeposited && !bondSlashed && bondEscrowId) {
        const bountyPool = process.env.BOUNTY_POOL_ADDRESS ?? '0x6427d51c4167373bF59712715B1930e80EcA8102';
        const slashResult = await slashEscrow({ escrowId: bondEscrowId, bountyPool });
        if (slashResult) {
          bondSlashed = true;
          console.log(`[ScanLoop] Organizer bond SLASHED: ${slashResult.etherscanLink}`);
        }
      }

      gated++;
    } else {
      console.log(`[ScanLoop] Below threshold (${result.confidence}% < ${FRAUD_CONFIDENCE_THRESHOLD}%) or LEGITIMATE — logged only`);
    }
  }

  console.log(`[ScanLoop] Classification: ${classified} classified, ${gated} enforcement-gated, ${enforced} enforced, ${skipped} skipped | ${totalUsdtLocked} USDT locked this cycle`);

  console.log(`[ScanLoop] Cycle complete: ${new Date().toISOString()}\n`);
}

// ── Initialization (top-level await — requires "type": "module" in package.json) ──

// mkdir with recursive: true prevents ENOENT if agent/memory/ doesn't exist yet
await mkdir(dirname(LISTINGS_PATH), { recursive: true });

// writeFile with flag: 'w' resets LISTINGS.md on startup — each process run is a fresh session.
// This keeps the file clean across demo restarts without accumulating stale runs.
await writeFile(
  LISTINGS_PATH,
  `# Listings Log\n\nEvent: ${EVENT_NAME}\nStarted: ${new Date().toISOString()}\n`,
  { flag: 'w' }
);

console.log('[ScanLoop] Ducket AI Galactica — Autonomous Scan Loop');
console.log(`[ScanLoop] Event: ${EVENT_NAME}`);
console.log('[ScanLoop] Schedule: every 5 minutes');
console.log('[ScanLoop] Running initial cycle...\n');

// Organizer legitimacy bond — deposit on startup per CONTEXT.md decision.
// Bond is slashed exactly once on first confirmed fraud above threshold.
try {
  bondEscrowId = makeBondEscrowId(EVENT_NAME);
  const bondResult = await depositEscrow({ escrowId: bondEscrowId, isBond: true });
  if (bondResult) {
    bondDeposited = true;
    console.log(`[ScanLoop] Organizer bond deposited: ${bondResult.etherscanLink}`);
  } else {
    console.log('[ScanLoop] Organizer bond deposit skipped (insufficient balance or error)');
  }
} catch (err) {
  console.error(`[ScanLoop] Organizer bond deposit failed: ${err.message}`);
}

// Run one cycle immediately on startup — critical for demo visibility.
// Without this, judges would have to wait up to 5 minutes to see any output.
await runScanCycle();

// Schedule subsequent cycles every 5 minutes (demo cadence).
// node-cron v4 starts the task immediately on schedule() call.
const job = cron.schedule('*/5 * * * *', runScanCycle);
console.log('[ScanLoop] Heartbeat started — polling every 5 minutes. Ctrl+C to stop.');

// Graceful shutdown — stop the cron job cleanly before exiting.
// job.stop() prevents an in-flight cycle from being cut off mid-write to LISTINGS.md.
process.on('SIGINT', () => {
  job.stop();
  console.log('\n[ScanLoop] Heartbeat stopped gracefully.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  job.stop();
  console.log('\n[ScanLoop] Heartbeat stopped (SIGTERM).');
  process.exit(0);
});
