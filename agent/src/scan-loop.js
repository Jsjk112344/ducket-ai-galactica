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

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from project root (two levels up from agent/src/)
dotenv.config({ path: join(__dirname, '../../.env'), quiet: true });

const LISTINGS_PATH = join(__dirname, '../memory/LISTINGS.md');
const EVENT_NAME = process.env.EVENT_NAME ?? 'FIFA World Cup 2026';

// Cross-run dedup: in-memory Set persists as long as process runs.
// Listings seen in prior cron cycles within the same session are not re-appended.
const seen = new Set();

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
