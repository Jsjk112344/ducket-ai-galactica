// Ducket AI Galactica — Evidence Module Integration Tests
// Apache 2.0 License
//
// Validates case file creation, content completeness, enforcement text drafting,
// and idempotency checks in agent/src/evidence.js.
//
// Run with: node agent/tests/test-evidence.js
// Exit 0 = all tests passed, Exit 1 = one or more tests failed

import { writeCaseFile, isCaseFileExists } from '../src/evidence.js';
import { access, readFile, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// ── Test Utilities ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const createdFiles = []; // Track files to clean up after tests

function assert(condition, label) {
  if (condition) {
    console.log(`[TEST] PASS: ${label}`);
    passed++;
  } else {
    console.error(`[TEST] FAIL: ${label}`);
    failed++;
  }
}

function urlHash(url) {
  return createHash('sha256').update(url ?? '').digest('hex').slice(0, 16);
}

// ── Test Data ─────────────────────────────────────────────────────────────────

const SCALPING_LISTING = {
  platform: 'StubHub',
  seller: 'TestSeller',
  price: 840,
  faceValue: 200,
  priceDeltaPct: 320,
  url: 'https://test-evidence-stubhub.com/12345',
  redFlags: ['price 4x face value'],
  listingDate: '2026-03-19',
  eventName: 'FIFA World Cup 2026',
  source: 'mock',
};

const SCALPING_RESULT = {
  category: 'SCALPING_VIOLATION',
  confidence: 92,
  reasoning: 'Price 320% above face value.',
  classificationSource: 'rules',
};

const LEGITIMATE_LISTING = {
  platform: 'Viagogo',
  seller: 'LegitSeller',
  price: 210,
  faceValue: 200,
  priceDeltaPct: 5,
  url: 'https://test-evidence-viagogo.com/99888',
  redFlags: [],
  listingDate: '2026-03-19',
  eventName: 'FIFA World Cup 2026',
  source: 'mock',
};

const LEGITIMATE_RESULT = {
  category: 'LEGITIMATE',
  confidence: 55,
  reasoning: 'No strong rule signals detected.',
  classificationSource: 'rules',
};

// ── Test Suite ────────────────────────────────────────────────────────────────

async function runTests() {
  console.log('[TEST] Starting evidence module tests...\n');

  // ── Test 1: Write SCALPING_VIOLATION case file ─────────────────────────────
  console.log('[TEST] --- Test 1: Write SCALPING_VIOLATION case file ---');
  let scalpingFilepath;
  try {
    scalpingFilepath = await writeCaseFile(SCALPING_LISTING, SCALPING_RESULT, 'escrow_deposit');
    createdFiles.push(scalpingFilepath);

    assert(typeof scalpingFilepath === 'string', 'writeCaseFile returns a string filepath');
    assert(scalpingFilepath.endsWith('.md'), 'Returned filepath ends with .md');
  } catch (err) {
    console.error(`[TEST] FAIL: writeCaseFile threw: ${err.message}`);
    failed++;
  }

  // ── Test 2: Case file exists on disk ──────────────────────────────────────
  console.log('\n[TEST] --- Test 2: Case file exists on disk ---');
  if (scalpingFilepath) {
    try {
      await access(scalpingFilepath);
      assert(true, 'Case file exists on disk after writeCaseFile');
    } catch {
      assert(false, 'Case file exists on disk after writeCaseFile');
    }
  } else {
    assert(false, 'Case file exists on disk (skipped — no filepath returned)');
  }

  // ── Test 3: Content validation ────────────────────────────────────────────
  console.log('\n[TEST] --- Test 3: Case file content validation ---');
  if (scalpingFilepath) {
    const content = await readFile(scalpingFilepath, 'utf8');

    assert(content.includes('SCALPING_VIOLATION'), 'Content includes SCALPING_VIOLATION');
    assert(content.includes('StubHub'), 'Content includes platform (StubHub)');
    assert(content.includes('TestSeller'), 'Content includes seller (TestSeller)');
    assert(content.includes('$840'), 'Content includes price ($840)');
    assert(content.includes('320%'), 'Content includes price delta (320%)');
    assert(content.includes('escrow_deposit'), 'Content includes actionTaken (escrow_deposit)');
    assert(content.includes('Takedown Request'), 'Content includes Takedown Request enforcement text');
    assert(content.includes('Price 320% above face value'), 'Content includes reasoning text');
    assert(content.includes('92%'), 'Content includes confidence (92%)');
    assert(content.includes('$200'), 'Content includes face value ($200)');
    assert(content.includes('price 4x face value'), 'Content includes red flag');
    // Threshold: 92% >= 85% → YES
    assert(content.includes('Threshold Met'), 'Content includes Threshold Met row');
    assert(content.includes('YES'), 'Threshold Met = YES for 92% confidence');
    // Structured seller/listing fields (replaced screenshot placeholder in Phase 5)
    assert(
      content.includes('Seller Age'),
      'Content includes Seller Age field (replaced screenshot placeholder)'
    );
    assert(
      content.includes('Transfer Method'),
      'Content includes Transfer Method field'
    );
  } else {
    assert(false, 'Case file content (skipped — no filepath returned)');
  }

  // ── Test 4: Idempotency — isCaseFileExists returns true ──────────────────
  console.log('\n[TEST] --- Test 4: Idempotency check ---');
  const existingCheck = await isCaseFileExists('https://test-evidence-stubhub.com/12345');
  assert(existingCheck === true, 'isCaseFileExists returns true for already-written URL');

  const unknownCheck = await isCaseFileExists('https://never-seen-url.com/99999');
  assert(unknownCheck === false, 'isCaseFileExists returns false for unseen URL');

  // ── Test 5: LEGITIMATE case file — enforcement text and threshold ─────────
  console.log('\n[TEST] --- Test 5: Write LEGITIMATE case file ---');
  let legitimateFilepath;
  try {
    legitimateFilepath = await writeCaseFile(LEGITIMATE_LISTING, LEGITIMATE_RESULT, 'logged_only');
    createdFiles.push(legitimateFilepath);

    const content = await readFile(legitimateFilepath, 'utf8');
    assert(content.includes('No Action'), 'LEGITIMATE case file contains "No Action" enforcement text');
    // Threshold: 55% < 85% → NO
    assert(content.includes('NO'), 'Threshold Met = NO for 55% confidence');
    assert(content.includes('logged_only'), 'LEGITIMATE case file contains actionTaken = logged_only');
  } catch (err) {
    console.error(`[TEST] FAIL: LEGITIMATE writeCaseFile threw: ${err.message}`);
    failed++;
  }

  // ── Test 6: Filename follows naming pattern ───────────────────────────────
  console.log('\n[TEST] --- Test 6: Filename naming pattern ---');
  if (scalpingFilepath) {
    const filename = scalpingFilepath.split('/').pop();
    const hash = urlHash('https://test-evidence-stubhub.com/12345');
    assert(filename.includes('stubhub'), 'Filename includes lowercase platform name (stubhub)');
    assert(filename.includes(hash), `Filename includes URL hash (${hash})`);
    assert(filename.endsWith('.md'), 'Filename ends with .md');
    // Timestamp format: YYYY-MM-DDTHH-MM-SS-sssZ (colons and dots replaced)
    assert(/^\d{4}-\d{2}-\d{2}T/.test(filename), 'Filename starts with ISO timestamp');
  } else {
    assert(false, 'Filename naming pattern (skipped — no filepath returned)');
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────
  console.log('\n[TEST] --- Cleanup: deleting test-generated case files ---');
  for (const filepath of createdFiles) {
    try {
      await unlink(filepath);
      console.log(`[TEST] Deleted: ${filepath.split('/').pop()}`);
    } catch (err) {
      console.error(`[TEST] WARNING: Could not delete ${filepath}: ${err.message}`);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log(`\n[TEST] ${passed}/${total} passed`);

  if (failed > 0) {
    console.error(`[TEST] ${failed} test(s) FAILED`);
    process.exit(1);
  } else {
    console.log('[TEST] All tests passed.');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('[TEST] Unexpected error:', err);
  process.exit(1);
});
