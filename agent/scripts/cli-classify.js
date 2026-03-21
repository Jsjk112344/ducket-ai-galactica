// Ducket AI Galactica — CLI Wrapper: Classify
// Apache 2.0 License
//
// Classifies a demo listing using the AI/rules classification pipeline.
// Exit 0 = success (prints JSON result to stdout), Exit 1 = error.
// Run with: node agent/scripts/cli-classify.js

import * as dotenv from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env'), quiet: true });

import { classifyListing } from '../src/classify.js';

async function run() {
  // Demo listing — exercises the full classification pipeline
  const listing = {
    url: 'https://demo.ducket.test/listing/classify-1',
    title: 'FIFA World Cup 2026 Final — Category 1',
    price: 450,
    faceValue: 200,
    source: 'StubHub',
    section: 'Lower Bowl',
    quantity: 4,
    sellerRating: 72,
    daysUntilEvent: 30,
    eventName: 'FIFA World Cup 2026',
    platform: 'StubHub',
  };

  console.log('[cli-classify] Classifying demo listing...');
  const result = await classifyListing(listing);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

run().catch((err) => {
  console.error('[cli-classify] Error:', err.message);
  process.exit(1);
});
