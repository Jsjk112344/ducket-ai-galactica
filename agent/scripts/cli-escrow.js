// Ducket AI Galactica — CLI Wrapper: Escrow
// Apache 2.0 License
//
// Smoke-tests the escrow module: calls dispatchEscrowAction with a mock listing.
// Insufficient balance returns null and exits 0 (expected in demo mode).
// Exit 0 = success or expected skip, Exit 1 = unrecoverable error.
// Run with: node agent/scripts/cli-escrow.js

import * as dotenv from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env'), quiet: true });

import { dispatchEscrowAction } from '../src/escrow.js';

async function run() {
  // Mock listing for demo — exercises the escrow dispatch path
  const listing = {
    url: 'https://demo.ducket.test/listing/escrow-1',
    platform: 'Ducket',
    sellerAddress: null,
  };

  console.log('[cli-escrow] Dispatching escrow action for SCALPING_VIOLATION...');
  const result = await dispatchEscrowAction({
    category: 'SCALPING_VIOLATION',
    listing,
    caseFilePath: null,
    timestamp: Date.now(),
  });

  if (result) {
    console.log('[cli-escrow] Escrow dispatched:', JSON.stringify(result, null, 2));
  } else {
    console.log('[cli-escrow] Escrow skipped (insufficient balance or dry-run)');
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('[cli-escrow] Error:', err.message);
  process.exit(1);
});
