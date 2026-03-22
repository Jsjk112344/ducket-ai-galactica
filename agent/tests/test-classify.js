// Ducket AI Galactica — Classification Engine Unit Tests
// Apache 2.0 License
//
// Validates the rule-based classifier (classifyByRules) against mock listings
// covering all 4 fraud categories. No Claude API calls are made — rules only.
// Includes enforcement gate logic tests.
//
// Run with: node agent/tests/test-classify.js
// Exit 0 = all tests passed, Exit 1 = one or more failures

import { classifyByRules } from '../src/classify.js';

// ── Test helpers ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

// Simple assertion: prints PASS or FAIL with reason, tracks counts.
function assert(name, condition, reason = '') {
  if (condition) {
    console.log(`[TEST] ${name} ... PASS`);
    passed++;
  } else {
    console.log(`[TEST] ${name} ... FAIL: ${reason}`);
    failed++;
  }
}

// ── Mock Listings (source:'mock' — never trigger Claude API in classifyListing) ──

// SCALPING_VIOLATION: price 320% above face value → rule confidence should be >=85
const scalping = {
  platform: 'StubHub',
  price: 840,
  faceValue: 200,
  priceDeltaPct: 320,
  sellerAge: 3,
  sellerTransactions: 0,
  sellerVerified: false,
  transferMethod: 'screenshot',
  redFlags: ['price 4x face value'],
  url: 'https://stubhub.com/test1',
  source: 'mock',
};

// LIKELY_SCAM: price 75% below face value → below-face-value scam signal
const scam = {
  platform: 'Facebook',
  price: 50,
  faceValue: 200,
  priceDeltaPct: -75,
  redFlags: ['price below face value'],
  url: 'https://facebook.com/test2',
  source: 'mock',
};

// COUNTERFEIT_RISK: priceDeltaPct=-10 (exactly at threshold, no scalping/scam rule),
// sellerRisk > 60 (new account, 0 transactions, unverified) → COUNTERFEIT_RISK in ambiguous zone
const counterfeit = {
  platform: 'Viagogo',
  price: 180,
  faceValue: 200,
  priceDeltaPct: -10,
  sellerAge: 5,
  sellerTransactions: 0,
  sellerVerified: false,
  transferMethod: 'dm_only',
  redFlags: ['new seller account', 'no proof of ticket'],
  url: 'https://viagogo.com/test3',
  source: 'mock',
};

// LEGITIMATE: slight markup (10%), no red flags
const legitimate = {
  platform: 'StubHub',
  price: 220,
  faceValue: 200,
  priceDeltaPct: 10,
  redFlags: [],
  url: 'https://stubhub.com/test4',
  source: 'mock',
};

// ── Classification Results ────────────────────────────────────────────────────

const scalpingResult = classifyByRules(scalping);
const scamResult = classifyByRules(scam);
const counterfeitResult = classifyByRules(counterfeit);
const legitimateResult = classifyByRules(legitimate);

// ── Category Tests ────────────────────────────────────────────────────────────

console.log('\n[TEST] --- Category Classification ---');

assert(
  'SCALPING listing → SCALPING_VIOLATION',
  scalpingResult.category === 'SCALPING_VIOLATION',
  `got category=${scalpingResult.category}`
);

assert(
  'SCALPING listing → confidence >= 85',
  scalpingResult.confidence >= 85,
  `got confidence=${scalpingResult.confidence}`
);

assert(
  'SCAM listing → LIKELY_SCAM',
  scamResult.category === 'LIKELY_SCAM',
  `got category=${scamResult.category}`
);

assert(
  'SCAM listing → confidence > 0',
  scamResult.confidence > 0,
  `got confidence=${scamResult.confidence}`
);

assert(
  'COUNTERFEIT listing → COUNTERFEIT_RISK',
  counterfeitResult.category === 'COUNTERFEIT_RISK',
  `got category=${counterfeitResult.category}`
);

assert(
  'COUNTERFEIT listing → confidence > 0',
  counterfeitResult.confidence > 0,
  `got confidence=${counterfeitResult.confidence}`
);

assert(
  'LEGITIMATE listing → LEGITIMATE',
  legitimateResult.category === 'LEGITIMATE',
  `got category=${legitimateResult.category}`
);

// ── Field Integrity Tests ─────────────────────────────────────────────────────

console.log('\n[TEST] --- Field Integrity ---');

// Every result must have a non-empty reasoning string
for (const [name, result] of [
  ['scalping', scalpingResult],
  ['scam', scamResult],
  ['counterfeit', counterfeitResult],
  ['legitimate', legitimateResult],
]) {
  assert(
    `${name} result has non-empty reasoning`,
    typeof result.reasoning === 'string' && result.reasoning.length > 0,
    `reasoning=${JSON.stringify(result.reasoning)}`
  );

  assert(
    `${name} result has classificationSource string`,
    typeof result.classificationSource === 'string' && result.classificationSource.length > 0,
    `classificationSource=${JSON.stringify(result.classificationSource)}`
  );

  assert(
    `${name} result has confidence between 0-100`,
    typeof result.confidence === 'number' && result.confidence >= 0 && result.confidence <= 100,
    `confidence=${result.confidence}`
  );
}

// ── Enforcement Gate Tests ────────────────────────────────────────────────────
// Gate passes when: confidence >= THRESHOLD AND category !== 'LEGITIMATE'

console.log('\n[TEST] --- Enforcement Gate ---');

const FRAUD_CONFIDENCE_THRESHOLD = parseInt(process.env.FRAUD_CONFIDENCE_THRESHOLD ?? '85');

// SCALPING should pass the gate: high confidence, non-LEGITIMATE category
const scalpingGatePasses =
  scalpingResult.confidence >= FRAUD_CONFIDENCE_THRESHOLD &&
  scalpingResult.category !== 'LEGITIMATE';

assert(
  `SCALPING gate passes (confidence ${scalpingResult.confidence}% >= ${FRAUD_CONFIDENCE_THRESHOLD}% AND not LEGITIMATE)`,
  scalpingGatePasses === true,
  `gate check returned ${scalpingGatePasses}`
);

// LEGITIMATE should NOT pass the gate: category is LEGITIMATE regardless of confidence
const legitimateGatePasses =
  legitimateResult.confidence >= FRAUD_CONFIDENCE_THRESHOLD &&
  legitimateResult.category !== 'LEGITIMATE';

assert(
  `LEGITIMATE gate blocked (category is LEGITIMATE)`,
  legitimateGatePasses === false,
  `gate check returned ${legitimateGatePasses} (should be false)`
);

// LIKELY_SCAM at confidence 72 should NOT pass the gate: below 85 threshold
const scamGatePasses =
  scamResult.confidence >= FRAUD_CONFIDENCE_THRESHOLD &&
  scamResult.category !== 'LEGITIMATE';

assert(
  `LIKELY_SCAM gate blocked (confidence ${scamResult.confidence}% < ${FRAUD_CONFIDENCE_THRESHOLD}%)`,
  scamGatePasses === false,
  `gate check returned ${scamGatePasses} (should be false, confidence=${scamResult.confidence})`
);

// ── Confidence Formula Verification ──────────────────────────────────────────

console.log('\n[TEST] --- Confidence Formula ---');

// Confidence formula for non-LEGITIMATE: min(97, max(55, 50 + round(compositeRisk / 2)))
// We verify the scalping result has a reasonable confidence above the enforcement gate
assert(
  'SCALPING confidence formula produces value >= 85 with enriched listing data',
  scalpingResult.confidence >= 85 && scalpingResult.confidence <= 97,
  `got ${scalpingResult.confidence}, expected 85-97 range`
);

// ── Summary ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n[TEST] ${passed}/${total} passed`);

if (failed > 0) {
  console.log(`[TEST] ${failed} test(s) FAILED`);
}

process.exit(failed > 0 ? 1 : 0);
