// Ducket AI Galactica — CLI Wrapper: Scan
// Apache 2.0 License
//
// Thin shim: calls all three scrapers for a single scan cycle.
// Does NOT import scan-loop.js (that starts a cron job and never exits).
// Exit 0 = success, Exit 1 = all scrapers failed.
// Run with: node agent/scripts/cli-scan.js

import * as dotenv from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env'), quiet: true });

import { scrapeStubHub } from '../tools/scrape-stubhub.js';
import { scrapeViagogo } from '../tools/scrape-viagogo.js';
import { scrapeFacebook } from '../tools/scrape-facebook.js';

async function run() {
  const EVENT_NAME = process.env.EVENT_NAME ?? 'FIFA World Cup 2026';
  console.log(`[cli-scan] Scanning for: ${EVENT_NAME}`);

  const results = await Promise.allSettled([
    scrapeStubHub(EVENT_NAME),
    scrapeViagogo(EVENT_NAME),
    scrapeFacebook(EVENT_NAME),
  ]);

  const sources = ['StubHub', 'Viagogo', 'Facebook'];
  let totalListings = 0;
  let successCount = 0;

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'fulfilled') {
      const count = results[i].value?.length ?? 0;
      console.log(`[cli-scan] ${sources[i]}: ${count} listings`);
      totalListings += count;
      successCount++;
    } else {
      console.error(`[cli-scan] ${sources[i]}: FAILED — ${results[i].reason?.message ?? 'unknown'}`);
    }
  }

  console.log(`[cli-scan] Total: ${totalListings} listings from ${successCount}/3 sources`);

  if (successCount === 0) {
    console.error('[cli-scan] All scrapers failed');
    process.exit(1);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('[cli-scan] Error:', err.message);
  process.exit(1);
});
