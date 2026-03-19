---
phase: 05-classification-engine-evidence
plan: 01
subsystem: agent
tags: [anthropic, claude, fraud-detection, classification, rule-based, llm, esm]

requires:
  - phase: 04-viagogo-fb-scrapers-scan-loop
    provides: Listing schema with priceDeltaPct, redFlags, source fields consumed by classifier

provides:
  - "classifyByRules(listing): synchronous rule-based classification returning {category, confidence, reasoning, classificationSource}"
  - "classifyListing(listing): async hybrid classifier (rules + Claude API with structured JSON output)"
  - "@anthropic-ai/sdk installed in agent workspace"
  - "23-test classification unit test suite covering all 4 categories + enforcement gate"

affects:
  - 05-classification-engine-evidence (plan 02 — evidence case files use classify.js output)
  - 06-enforcement (scan-loop integration calls classifyListing per listing)

tech-stack:
  added:
    - "@anthropic-ai/sdk ^0.80.0 — Claude API client with output_config structured JSON"
  patterns:
    - "Rule-based first pass, then Claude API for ambiguous cases (confidence < 85)"
    - "mock source guard: source==='mock' returns rules-mock, never calls Claude API"
    - "output_config.format with json_schema for guaranteed valid JSON from Claude"
    - "stderr log pattern: [Classify] platform | category | confidence% | source:label"
    - "Exported classifyByRules() for unit testing without API dependency"

key-files:
  created:
    - agent/src/classify.js
    - agent/tests/test-classify.js
  modified:
    - agent/package.json (added @anthropic-ai/sdk)
    - .env.example (CLAUDE_MODEL updated to claude-sonnet-4-6)

key-decisions:
  - "Rule threshold at priceDeltaPct > 100 (not 200) for SCALPING_VIOLATION — catches 2x markup (not just 3x)"
  - "Confidence formula min(95, 70 + round(priceDeltaPct/20)) — scales with markup magnitude, caps at 95"
  - "priceDeltaPct exactly -10 does NOT trigger LIKELY_SCAM (rule is < -10 strictly) — boundary tested via COUNTERFEIT mock"
  - "CLAUDE_MODEL updated to claude-sonnet-4-6 in .env.example (was claude-opus-4-5) — output_config requires supported model"
  - "classifyByRules exported as named export for unit testing without touching Claude API"

patterns-established:
  - "Classify module: rules first, Claude for ambiguous, fallback to rules-only on API failure"
  - "Test pattern: standalone node script, no framework, exit 0/1, [TEST] prefix on all output lines"
  - "mock source guard prevents synthetic data from consuming API quota"

requirements-completed: [CLAS-01, CLAS-02, CLAS-03, CLAS-04]

duration: 8min
completed: 2026-03-19
---

# Phase 5 Plan 01: Classification Engine Summary

**Hybrid fraud classifier with deterministic rule-based first pass and Claude API structured-JSON fallback covering SCALPING_VIOLATION, LIKELY_SCAM, COUNTERFEIT_RISK, and LEGITIMATE — 23/23 tests passing**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-19T09:52:00Z
- **Completed:** 2026-03-19T10:00:00Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- `classifyByRules()` implements all 4 fraud categories with correct priority order and confidence formula
- `classifyListing()` hybrid engine: rules first, Claude API for ambiguous cases (confidence < 85), mock guard, API failure fallback
- 23-assertion test suite validates categories, confidence formula, field integrity, and enforcement gate logic — all PASS
- `@anthropic-ai/sdk` installed; `.env.example` updated to `claude-sonnet-4-6` (required for `output_config` support)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @anthropic-ai/sdk and create hybrid classifier module** - `beef5d7` (feat)
2. **Task 2: Create classification test script validating all 4 categories and enforcement gate** - `4ba709e` (test)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified

- `agent/src/classify.js` — Hybrid fraud classifier with classifyByRules and classifyListing exports
- `agent/tests/test-classify.js` — 23-test unit script covering categories, field integrity, enforcement gate
- `agent/package.json` — Added @anthropic-ai/sdk ^0.80.0 dependency
- `.env.example` — Updated CLAUDE_MODEL from claude-opus-4-5 to claude-sonnet-4-6

## Decisions Made

- `priceDeltaPct > 100` (strictly greater) for SCALPING_VIOLATION so exactly 100% above face value falls to Claude — correct per plan spec
- `priceDeltaPct < -10` (strictly less) for LIKELY_SCAM so -10% exactly hits COUNTERFEIT_RISK rule if applicable, tested explicitly via counterfeit mock listing with priceDeltaPct=-10
- `classifyByRules` exported as named export (not internal) to enable testing without any Claude API dependency
- `.env.example` CLAUDE_MODEL corrected to `claude-sonnet-4-6` — `output_config.format` with `json_schema` requires supported model; claude-opus-4-5 is unsupported

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. All verification commands passed on first run.

## User Setup Required

`CLAUDE_API_KEY` is already in `.env.example`. Users must copy `.env.example` to `.env` and populate `CLAUDE_API_KEY` before the Claude API path in `classifyListing()` will function. Rule-based classification and tests work without any API key.

## Next Phase Readiness

- `classifyListing(listing)` ready for scan-loop integration (Phase 5 Plan 02 / 06-enforcement)
- `classifyByRules(listing)` ready for additional test coverage if needed
- Evidence case file writer (`agent/src/evidence.js`) is the next deliverable (05-02)

## Self-Check: PASSED

- agent/src/classify.js — FOUND
- agent/tests/test-classify.js — FOUND
- Commit beef5d7 — FOUND
- Commit 4ba709e — FOUND

---
*Phase: 05-classification-engine-evidence*
*Completed: 2026-03-19*
