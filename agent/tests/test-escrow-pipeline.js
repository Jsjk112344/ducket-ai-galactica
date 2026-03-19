// Ducket AI Galactica — Escrow Pipeline Integration Test
// Apache 2.0 License
//
// Validates that the escrow module is correctly wired into the scan-loop and evidence
// modules without launching the agent. Uses static analysis (source-as-string regex) for
// scan-loop.js (which has top-level await that would start the cron on import) and
// live imports for escrow.js and evidence.js.
//
// Tests covered:
//   1.  escrow.js exports depositEscrow as a function
//   2.  escrow.js exports releaseEscrow as a function
//   3.  escrow.js exports refundEscrow as a function
//   4.  escrow.js exports slashEscrow as a function
//   5.  escrow.js exports makeEscrowId as a function
//   6.  escrow.js exports makeBondEscrowId as a function
//   7.  escrow.js exports dispatchEscrowAction as a function
//   8.  evidence.js exports updateCaseFileEscrow as a function
//   9.  scan-loop.js imports dispatchEscrowAction from escrow
//  10.  scan-loop.js imports updateCaseFileEscrow from evidence
//  11.  scan-loop.js contains makeBondEscrowId (bond logic)
//  12.  scan-loop.js contains bondSlashed (slash-once guard)
//  13.  scan-loop.js contains dispatchEscrowAction call (enforcement dispatch)
//  14.  scan-loop.js per-cycle summary includes 'enforced' counter
//  15.  updateCaseFileEscrow placeholder replacement works on a temp case file
//
// Run with: node agent/tests/test-escrow-pipeline.js
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
import { readFileSync } from 'node:fs';
import { writeFile, readFile, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

// ── Test utilities ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`[TEST] PASS — ${label}`);
    passed++;
  } else {
    console.error(`[TEST] FAIL — ${label}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

// ── Tests 1-7: escrow.js exports all 7 functions ──────────────────────────────

console.log('\n[Pipeline] Tests 1-7: escrow.js exports');

const ESCROW_EXPORTS = [
  ['depositEscrow', depositEscrow],
  ['releaseEscrow', releaseEscrow],
  ['refundEscrow', refundEscrow],
  ['slashEscrow', slashEscrow],
  ['makeEscrowId', makeEscrowId],
  ['makeBondEscrowId', makeBondEscrowId],
  ['dispatchEscrowAction', dispatchEscrowAction],
];

for (const [name, fn] of ESCROW_EXPORTS) {
  check(
    `escrow.js exports ${name} as a function`,
    typeof fn === 'function',
    `got ${typeof fn}`
  );
}

// ── Test 8: evidence.js exports updateCaseFileEscrow ─────────────────────────

console.log('\n[Pipeline] Test 8: evidence.js exports');

check(
  'evidence.js exports updateCaseFileEscrow as a function',
  typeof updateCaseFileEscrow === 'function',
  `got ${typeof updateCaseFileEscrow}`
);

// ── Tests 9-14: scan-loop.js static analysis (source-as-string) ──────────────
// scan-loop.js has top-level await that starts cron — importing it would launch the agent.
// Reading as a string and regex-checking is the safe approach for CI.

console.log('\n[Pipeline] Tests 9-14: scan-loop.js wiring patterns (static analysis)');

const scanLoopSource = readFileSync(join(ROOT, 'agent/src/scan-loop.js'), 'utf8');

// Test 9: escrow import contains dispatchEscrowAction
check(
  'scan-loop.js imports dispatchEscrowAction from escrow module',
  /import\s*\{[^}]*dispatchEscrowAction[^}]*\}\s*from\s*['"]\.\/escrow\.js['"]/.test(scanLoopSource),
  'Pattern not found: import { dispatchEscrowAction } from ./escrow.js'
);

// Test 10: evidence import contains updateCaseFileEscrow
check(
  'scan-loop.js imports updateCaseFileEscrow from evidence module',
  /import\s*\{[^}]*updateCaseFileEscrow[^}]*\}\s*from\s*['"]\.\/evidence\.js['"]/.test(scanLoopSource),
  'Pattern not found: import { updateCaseFileEscrow } from ./evidence.js'
);

// Test 11: makeBondEscrowId usage (bond logic present)
check(
  'scan-loop.js uses makeBondEscrowId for organizer bond',
  scanLoopSource.includes('makeBondEscrowId'),
  'makeBondEscrowId not found in scan-loop.js'
);

// Test 12: bondSlashed guard (slash-once protection)
const bondSlashedMatches = (scanLoopSource.match(/bondSlashed/g) ?? []).length;
check(
  'scan-loop.js contains bondSlashed guard (>= 2 occurrences: declaration + check)',
  bondSlashedMatches >= 2,
  `found ${bondSlashedMatches} occurrence(s), expected >= 2`
);

// Test 13: dispatchEscrowAction call in enforcement path
check(
  'scan-loop.js calls dispatchEscrowAction in enforcement gate',
  scanLoopSource.includes('await dispatchEscrowAction('),
  'await dispatchEscrowAction() call not found in scan-loop.js'
);

// Test 14: enforced counter in per-cycle summary log
check(
  "scan-loop.js per-cycle summary log includes 'enforced' counter",
  scanLoopSource.includes('enforced') && scanLoopSource.includes('USDT locked'),
  "enforced counter or USDT locked not found in per-cycle summary"
);

// ── Test 15: updateCaseFileEscrow placeholder replacement (live I/O) ──────────

console.log('\n[Pipeline] Test 15: updateCaseFileEscrow live I/O check');

const tempPath = `/tmp/test-escrow-pipeline-${Date.now()}.md`;
const FAKE_TX = '0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678';
const ACTION = 'escrow_deposit';

const caseFileContent = `# Fraud Case: StubHub — SCALPING_VIOLATION

## Enforcement Action

| Field | Value |
|-------|-------|
| Action Taken | ${ACTION} |
| Threshold Met | YES |
| Etherscan Link | _(pending escrow transaction)_ |
`;

await writeFile(tempPath, caseFileContent, 'utf8');
await updateCaseFileEscrow(tempPath, FAKE_TX, ACTION);
const updatedContent = await readFile(tempPath, 'utf8');

check(
  'updateCaseFileEscrow replaces Etherscan placeholder with real link',
  !updatedContent.includes('_(pending escrow transaction)_') &&
    updatedContent.includes('https://sepolia.etherscan.io/tx/'),
  'Etherscan placeholder still present or link not written'
);

// Clean up temp file
try {
  await unlink(tempPath);
} catch (_) {
  // Best-effort cleanup
}

// ── Summary ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n[Pipeline] ${passed}/${total} passed, ${failed === 0 ? '0 failed' : failed + ' failed'}`);

if (failed > 0) {
  console.log(`[Pipeline] FAILED — ${failed} check(s) failed`);
  process.exit(1);
} else {
  console.log('[Pipeline] ALL ESCROW PIPELINE CHECKS PASSED — escrow module correctly wired into scan-loop and evidence');
  process.exit(0);
}
