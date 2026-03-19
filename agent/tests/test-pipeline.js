// Ducket AI Galactica — End-to-End Pipeline Validation
// Apache 2.0 License
//
// Validates the full Scan -> Classify -> Evidence pipeline integration:
//   1. classify.js unit tests pass
//   2. evidence.js integration tests pass
//   3. scan-loop.js syntax is valid with the new imports
//   4. scan-loop.js contains all required integration strings
//   5. classify.js and evidence.js exports resolve correctly
//
// Run with: node agent/tests/test-pipeline.js
// Exit 0 = all checks passed, Exit 1 = one or more checks failed

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Project root is two levels up from agent/tests/
const ROOT = join(__dirname, '../..');

// ── Test utilities ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function pass(label) {
  console.log(`[TEST] PASS — ${label}`);
  passed++;
}

function fail(label, detail = '') {
  console.log(`[TEST] FAIL — ${label}${detail ? ': ' + detail : ''}`);
  failed++;
}

function check(label, condition, detail = '') {
  if (condition) {
    pass(label);
  } else {
    fail(label, detail);
  }
}

// ── Test 1: classify.js unit tests pass ───────────────────────────────────────

console.log('\n[Pipeline] Test 1: classify.js unit tests');
try {
  const output = execSync('node agent/tests/test-classify.js', {
    cwd: ROOT,
    stdio: 'pipe',
  }).toString();
  // The test script exits 0 if all pass — no throw means success
  check('classify.js tests exit 0', true);
  // Also confirm the output mentions passing
  check(
    'classify.js output contains PASS lines',
    output.includes('PASS'),
    'No PASS lines found in output'
  );
} catch (err) {
  fail('classify.js tests exit 0', `exited with non-zero: ${err.message}`);
  fail('classify.js output contains PASS lines', 'test script failed');
}

// ── Test 2: evidence.js integration tests pass ────────────────────────────────

console.log('\n[Pipeline] Test 2: evidence.js integration tests');
try {
  const output = execSync('node agent/tests/test-evidence.js', {
    cwd: ROOT,
    stdio: 'pipe',
  }).toString();
  check('evidence.js tests exit 0', true);
  check(
    'evidence.js output contains PASS lines',
    output.includes('PASS'),
    'No PASS lines found in output'
  );
} catch (err) {
  fail('evidence.js tests exit 0', `exited with non-zero: ${err.message}`);
  fail('evidence.js output contains PASS lines', 'test script failed');
}

// ── Test 3: scan-loop.js syntax check ────────────────────────────────────────

console.log('\n[Pipeline] Test 3: scan-loop.js syntax check');
try {
  execSync('node --check agent/src/scan-loop.js', { cwd: ROOT, stdio: 'pipe' });
  check('scan-loop.js syntax valid (--check passes)', true);
} catch (err) {
  fail('scan-loop.js syntax valid (--check passes)', err.message);
}

// ── Test 4: scan-loop.js contains all integration strings ─────────────────────

console.log('\n[Pipeline] Test 4: scan-loop.js integration string checks');
const scanLoopCode = readFileSync(join(ROOT, 'agent/src/scan-loop.js'), 'utf8');

const integrationStrings = [
  ['imports classifyListing', 'classifyListing'],
  ['imports writeCaseFile', 'writeCaseFile'],
  ['imports isCaseFileExists', 'isCaseFileExists'],
  ['defines FRAUD_CONFIDENCE_THRESHOLD', 'FRAUD_CONFIDENCE_THRESHOLD'],
  ['uses escrow_deposit action', 'escrow_deposit'],
  ['uses logged_only fallback', 'logged_only'],
];

for (const [label, str] of integrationStrings) {
  check(
    `scan-loop.js ${label}`,
    scanLoopCode.includes(str),
    `"${str}" not found in scan-loop.js`
  );
}

// ── Test 5: classify.js and evidence.js exports resolve ───────────────────────

console.log('\n[Pipeline] Test 5: module export resolution');

const classify = await import('../src/classify.js');
check(
  'classifyListing is a function',
  typeof classify.classifyListing === 'function',
  `got: ${typeof classify.classifyListing}`
);
check(
  'classifyByRules is a function',
  typeof classify.classifyByRules === 'function',
  `got: ${typeof classify.classifyByRules}`
);

const evidence = await import('../src/evidence.js');
check(
  'writeCaseFile is a function',
  typeof evidence.writeCaseFile === 'function',
  `got: ${typeof evidence.writeCaseFile}`
);
check(
  'isCaseFileExists is a function',
  typeof evidence.isCaseFileExists === 'function',
  `got: ${typeof evidence.isCaseFileExists}`
);

// ── Summary ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n[Pipeline] Results: ${passed}/${total} checks passed`);

if (failed > 0) {
  console.log(`[Pipeline] FAILED — ${failed} check(s) failed`);
  process.exit(1);
} else {
  console.log('[Pipeline] ALL CHECKS PASSED — Scan -> Classify -> Evidence pipeline validated');
  process.exit(0);
}
