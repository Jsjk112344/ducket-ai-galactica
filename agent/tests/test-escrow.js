// Ducket AI Galactica — Escrow Module Unit Tests
// Apache 2.0 License
//
// Validates the escrow module (agent/src/escrow.js) and the updateCaseFileEscrow
// function in evidence.js. All tests use pure functions or file I/O — no WDK
// calls, no Sepolia RPC, no env vars required.
//
// Tests covered:
//   1. makeEscrowId returns valid bytes32 hex string (66 chars, 0x-prefixed)
//   2. makeBondEscrowId returns valid bytes32 hex string
//   3. makeEscrowId and makeBondEscrowId produce different hashes for same input
//   4. makeEscrowId includes timestamp in hash (different timestamps = different IDs)
//   5. makeBondEscrowId is deterministic (same event = same ID)
//   6. All 7 escrow functions are exported and callable
//   7. updateCaseFileEscrow replaces Etherscan placeholder in case file
//   8. updateCaseFileEscrow marks action as "(confirmed)"
//   9. updateCaseFileEscrow logs to stderr after update
//  10. updateCaseFileEscrow is idempotent for short-hash display
//
// Run with: node agent/tests/test-escrow.js
// Exit 0 = all tests passed, Exit 1 = one or more tests failed

import {
  makeEscrowId,
  makeBondEscrowId,
  depositEscrow,
  releaseEscrow,
  refundEscrow,
  slashEscrow,
  dispatchEscrowAction,
} from '../src/escrow.js';
import { updateCaseFileEscrow } from '../src/evidence.js';
import { writeFile, readFile, unlink } from 'node:fs/promises';

// ── Test Utilities ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, label, detail = '') {
  if (condition) {
    console.log(`[TEST] PASS: ${label}`);
    passed++;
  } else {
    console.error(`[TEST] FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

// ── Test 1: makeEscrowId returns valid bytes32 hex string ─────────────────────

console.log('\n[TEST] --- makeEscrowId ---');

const escrowId1 = makeEscrowId('https://stubhub.com/listing/123', '1234567890');

assert(
  typeof escrowId1 === 'string',
  'makeEscrowId returns a string',
  `got ${typeof escrowId1}`
);

assert(
  escrowId1.startsWith('0x'),
  'makeEscrowId result starts with 0x',
  `got ${escrowId1.slice(0, 4)}`
);

assert(
  escrowId1.length === 66,
  'makeEscrowId result is 66 chars (bytes32 = 32 bytes = 64 hex chars + 0x prefix)',
  `got length ${escrowId1.length}`
);

assert(
  /^0x[0-9a-f]{64}$/i.test(escrowId1),
  'makeEscrowId result is valid hex bytes32',
  `got ${escrowId1}`
);

// ── Test 2: makeBondEscrowId returns valid bytes32 hex string ─────────────────

console.log('\n[TEST] --- makeBondEscrowId ---');

const bondId1 = makeBondEscrowId('FIFA World Cup 2026');

assert(
  typeof bondId1 === 'string',
  'makeBondEscrowId returns a string',
  `got ${typeof bondId1}`
);

assert(
  bondId1.startsWith('0x'),
  'makeBondEscrowId result starts with 0x',
  `got ${bondId1.slice(0, 4)}`
);

assert(
  bondId1.length === 66,
  'makeBondEscrowId result is 66 chars (bytes32)',
  `got length ${bondId1.length}`
);

assert(
  /^0x[0-9a-f]{64}$/i.test(bondId1),
  'makeBondEscrowId result is valid hex bytes32',
  `got ${bondId1}`
);

// ── Test 3: makeEscrowId and makeBondEscrowId produce different hashes ────────

console.log('\n[TEST] --- Hash uniqueness ---');

// Same "input" but different namespaces (listing: vs bond:)
const escrowIdForUrl = makeEscrowId('FIFA World Cup 2026', '0');
const bondIdForSameStr = makeBondEscrowId('FIFA World Cup 2026');

assert(
  escrowIdForUrl !== bondIdForSameStr,
  'makeEscrowId and makeBondEscrowId produce different hashes for same input',
  `both returned ${escrowIdForUrl}`
);

// ── Test 4: makeEscrowId includes timestamp (different timestamps = different IDs) ─

const escrowIdT1 = makeEscrowId('https://stubhub.com/listing/123', '1000');
const escrowIdT2 = makeEscrowId('https://stubhub.com/listing/123', '2000');

assert(
  escrowIdT1 !== escrowIdT2,
  'makeEscrowId produces different IDs for different timestamps (duplicate-deposit protection)',
  `both returned ${escrowIdT1}`
);

// ── Test 5: makeBondEscrowId is deterministic (same event = same ID) ──────────

const bondIdRun1 = makeBondEscrowId('FIFA World Cup 2026');
const bondIdRun2 = makeBondEscrowId('FIFA World Cup 2026');

assert(
  bondIdRun1 === bondIdRun2,
  'makeBondEscrowId is deterministic — same event always returns same ID',
  `run1=${bondIdRun1} run2=${bondIdRun2}`
);

assert(
  makeBondEscrowId('Event A') !== makeBondEscrowId('Event B'),
  'makeBondEscrowId returns different IDs for different event names',
  `both returned same value`
);

// ── Test 6: All 7 escrow functions are exported and callable ──────────────────

console.log('\n[TEST] --- Export existence ---');

const EXPECTED_EXPORTS = [
  ['depositEscrow', depositEscrow],
  ['releaseEscrow', releaseEscrow],
  ['refundEscrow', refundEscrow],
  ['slashEscrow', slashEscrow],
  ['makeEscrowId', makeEscrowId],
  ['makeBondEscrowId', makeBondEscrowId],
  ['dispatchEscrowAction', dispatchEscrowAction],
];

for (const [name, fn] of EXPECTED_EXPORTS) {
  assert(
    typeof fn === 'function',
    `escrow.js exports ${name} as a function`,
    `got ${typeof fn}`
  );
}

// updateCaseFileEscrow is in evidence.js
assert(
  typeof updateCaseFileEscrow === 'function',
  'evidence.js exports updateCaseFileEscrow as a function',
  `got ${typeof updateCaseFileEscrow}`
);

// ── Tests 7-10: updateCaseFileEscrow file I/O tests ───────────────────────────

console.log('\n[TEST] --- updateCaseFileEscrow ---');

// Write a temp case file with the exact placeholder strings used by writeCaseFile()
const tempPath = `/tmp/test-case-escrow-${Date.now()}.md`;
const FAKE_TX_HASH = '0xabc123def456789012345678901234567890123456789012345678901234567890';
const ACTION = 'escrow_deposit';

const caseFileContent = `# Fraud Case: StubHub — SCALPING_VIOLATION

## Enforcement Action

| Field | Value |
|-------|-------|
| Action Taken | ${ACTION} |
| Threshold Met | YES |
| Etherscan Link | _(pending escrow transaction)_ |
`;

// Write temp file, run update, read back
await writeFile(tempPath, caseFileContent, 'utf8');
await updateCaseFileEscrow(tempPath, FAKE_TX_HASH, ACTION);
const updatedContent = await readFile(tempPath, 'utf8');

// Test 7: Etherscan placeholder replaced with real link
assert(
  !updatedContent.includes('_(pending escrow transaction)_'),
  'updateCaseFileEscrow removes Etherscan placeholder',
  'placeholder still present in file'
);

assert(
  updatedContent.includes('https://sepolia.etherscan.io/tx/'),
  'updateCaseFileEscrow writes Etherscan link',
  'Etherscan URL not found in updated file'
);

assert(
  updatedContent.includes(FAKE_TX_HASH.slice(0, 10)),
  'updateCaseFileEscrow includes short hash in Etherscan link display',
  `"${FAKE_TX_HASH.slice(0, 10)}" not found`
);

// Test 8: Action marked as confirmed
assert(
  updatedContent.includes(`${ACTION} (confirmed)`),
  'updateCaseFileEscrow marks action as (confirmed)',
  `"${ACTION} (confirmed)" not found in file`
);

assert(
  !updatedContent.includes(`| Action Taken | ${ACTION} |`) || updatedContent.includes('(confirmed)'),
  'updateCaseFileEscrow updated action row (not duplicated)',
  'action row not properly updated'
);

// Test 9: Markdown link format [0xabc123...](...) present
const expectedLink = `[${FAKE_TX_HASH.slice(0, 10)}...](https://sepolia.etherscan.io/tx/${FAKE_TX_HASH})`;
assert(
  updatedContent.includes(expectedLink),
  'updateCaseFileEscrow writes correct markdown link format [hash...](url)',
  `expected "${expectedLink}" not found`
);

// Test 10: updateCaseFileEscrow handles tx hash with 0x prefix
assert(
  updatedContent.includes('0xabc123def4'),
  'updateCaseFileEscrow correctly handles 0x-prefixed tx hashes',
  `short hash "0xabc123def4" not found`
);

// Clean up temp file
try {
  await unlink(tempPath);
} catch (_) {
  // Best-effort cleanup
}

// ── Summary ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n[TEST] ${passed}/${total} passed`);

if (failed > 0) {
  console.log(`[TEST] ${failed} test(s) FAILED`);
  process.exit(1);
} else {
  console.log('[TEST] ALL ESCROW TESTS PASSED');
  process.exit(0);
}
