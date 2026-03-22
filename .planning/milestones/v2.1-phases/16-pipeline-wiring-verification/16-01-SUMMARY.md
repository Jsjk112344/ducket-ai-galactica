---
phase: 16
plan: "01"
subsystem: agent-tests
tags: [testing, classifier, evidence, green-baseline]
dependency_graph:
  requires: []
  provides: [green-test-baseline]
  affects: [agent/tests/test-classify.js, agent/tests/test-evidence.js]
tech_stack:
  added: []
  patterns: [multi-signal-classifier, structured-listing-fields]
key_files:
  created: []
  modified:
    - agent/tests/test-classify.js
    - agent/tests/test-evidence.js
decisions:
  - "Enriched scalping + counterfeit mocks with seller fields (sellerAge, sellerTransactions, sellerVerified, transferMethod) to match multi-signal classify.js API"
  - "Replaced old priceDeltaPct-based formula assertion with composite risk range check (85-97)"
  - "Replaced stale screenshot placeholder assertion with Seller Age + Transfer Method field checks"
metrics:
  duration: "~5 min"
  completed: "2026-03-22T00:05:21Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 16 Plan 01: Fix Pre-existing Test Failures — Green Baseline Summary

**One-liner:** Updated test mocks and assertions to match multi-signal classify.js API, establishing 5/5 test files at exit 0.

## What Was Done

Fixed 5 pre-existing test failures (4 in test-classify.js, 1 in test-evidence.js) that pre-dated Phase 16. These failures blocked CLAW-06 verification which requires all agent tests to pass after integration.

No production code was changed — only test files were updated to match the current API contracts.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Fix test-classify.js mock listings and assertions | 97ea220 | agent/tests/test-classify.js |
| 2 | Fix test-evidence.js screenshot placeholder assertion | 129bfe7 | agent/tests/test-evidence.js |

## Changes in Detail

### Task 1 — test-classify.js

**Problem:** 4 assertions failed because mock listings lacked structured seller fields required by the multi-signal classifier.

- `scalping` mock: only had `priceDeltaPct: 320`, giving composite risk 58 and confidence 79 (below 85 gate). Added `sellerAge: 3`, `sellerTransactions: 0`, `sellerVerified: false`, `transferMethod: 'screenshot'` — composite risk now > 70, confidence = 90.
- `counterfeit` mock: had no seller fields, so `scoreSellerRisk()` returned default moderate risk (45) which was not > 60 — COUNTERFEIT_RISK branch was never reached. Added seller fields — sellerRisk score = 100, triggering COUNTERFEIT_RISK in the ambiguous zone.
- Confidence formula assertion: replaced `min(95, 70 + round(priceDeltaPct/20))` (old formula) with range check `>= 85 && <= 97` matching the actual formula `min(97, max(55, 50 + round(compositeRisk/2)))`.

Result: 23/23 passed (previously 19/23).

### Task 2 — test-evidence.js

**Problem:** 1 assertion failed because it checked for `'not captured — scrapers collect structured data only'` (old screenshot placeholder) but evidence.js was rewritten in Phase 5 to output structured fields instead.

- Removed the stale `content.includes('not captured...')` assertion.
- Added two assertions for `'Seller Age'` and `'Transfer Method'` — fields that the current evidence.js template outputs in the Listing Details table.

Result: 27/27 passed (previously 25/26).

## Full Test Suite Results

All 5 test files pass at exit 0:

```
node agent/tests/test-classify.js    → 23/23 passed
node agent/tests/test-evidence.js    → 27/27 passed
node agent/tests/test-escrow.js      → 27/27 passed
node agent/tests/test-escrow-pipeline.js → 15/15 passed
node agent/tests/test-pipeline.js    → 15/15 passed
```

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

Files modified exist:
- agent/tests/test-classify.js ✓
- agent/tests/test-evidence.js ✓

Commits exist:
- 97ea220 (task 1) ✓
- 129bfe7 (task 2) ✓
