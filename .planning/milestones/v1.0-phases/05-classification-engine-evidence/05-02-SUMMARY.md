---
phase: 05-classification-engine-evidence
plan: 02
subsystem: evidence
tags: [evidence, case-files, enforcement-text, idempotency, audit-trail]
dependency_graph:
  requires: [agent/src/scan-loop.js, agent/tools/scrape-stubhub.js]
  provides: [agent/src/evidence.js, agent/tests/test-evidence.js, agent/cases/]
  affects: [05-03 scan-loop integration, phase-06 escrow enforcement]
tech_stack:
  added: []
  patterns: [node:fs/promises writeFile, node:crypto SHA-256 URL hash, ESM module, category-switch enforcement text]
key_files:
  created:
    - agent/src/evidence.js
    - agent/tests/test-evidence.js
  modified: []
decisions:
  - "Log to stderr (not stdout) — keeps stdout clean for JSON piping, same pattern as scrapers"
  - "FRAUD_CONFIDENCE_THRESHOLD read from env at call time (not module init) — allows test override without process restart"
  - "cases/ directory created by writeCaseFile mkdir(recursive) — gitignore-safe, no pre-commit step needed"
metrics:
  duration: 2m 5s
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
requirements: [EVID-01, EVID-02, EVID-03]
---

# Phase 05 Plan 02: Evidence Case File Writer Summary

**One-liner:** Timestamped markdown case files in agent/cases/ with idempotency check, full evidence fields, and category-specific enforcement text (takedown/platform report/public warning/no action).

## What Was Built

`agent/src/evidence.js` — the audit trail module for the fraud detection agent. Every classified listing produces a markdown case file judges can read to understand exactly what the agent detected and why it acted.

### Exports

- `writeCaseFile(listing, classificationResult, actionTaken)` — async, creates `agent/cases/{ts}-{platform}-{urlHash}.md` with full evidence package
- `isCaseFileExists(url)` — async boolean, checks if URL's SHA-256 hash appears in any existing case filename (idempotency gate)

### Case File Structure

Each markdown file contains:
1. Header: `# Fraud Case: {platform} — {category}`
2. Generated timestamp + classification source
3. Listing Details table: Platform, Seller, Price, Face Value, Price Delta, URL, Listing Date, Data Source, Screenshot placeholder
4. Red Flags bulleted list (or "None detected")
5. Classification Result table: Category (bold), Confidence %, Classification Source
6. Reasoning paragraph
7. Enforcement Action table: Action Taken, Threshold Met (YES/NO from FRAUD_CONFIDENCE_THRESHOLD env), Etherscan Link placeholder
8. Drafted Enforcement Text (category-specific)
9. Apache 2.0 footer

### Enforcement Text Categories

| Category | Drafted Text |
|----------|-------------|
| SCALPING_VIOLATION | Takedown request citing price delta % and face value |
| LIKELY_SCAM | Platform report citing below-face-value pricing |
| COUNTERFEIT_RISK | Public warning citing specific red flag signals |
| LEGITIMATE | No Action — monitoring continues |

### Test Results

`node agent/tests/test-evidence.js` — **26/26 tests passed**

| Test Group | Tests | Result |
|-----------|-------|--------|
| Case file creation | 2 | PASS |
| Content validation (14 fields) | 14 | PASS |
| Idempotency (true/false) | 2 | PASS |
| LEGITIMATE enforcement + threshold | 3 | PASS |
| Filename naming pattern | 4 | PASS |
| Cleanup verification | N/A | Files deleted |

## Commits

| Hash | Task | Description |
|------|------|-------------|
| f959667 | Task 1 | feat(05-02): evidence case file writer with enforcement text drafting |
| c300845 | Task 2 | feat(05-02): evidence integration tests — 26/26 passing |

## Deviations from Plan

None — plan executed exactly as written. The research file (05-RESEARCH.md) contained a complete reference implementation that matched the plan spec exactly.

## Decisions Made

1. **stderr for Evidence logs** — `process.stderr.write()` used (not `console.error`) to match the scraper log pattern and avoid any stdout contamination in JSON-piping scenarios.

2. **Threshold read at call time** — `parseInt(process.env.FRAUD_CONFIDENCE_THRESHOLD ?? '85', 10)` evaluated inside `writeCaseFile()` (not cached at module load). This allows tests to set the env var and see the effect without reloading the module.

3. **cases/ dir creation** — `mkdir(CASES_DIR, { recursive: true })` at top of every `writeCaseFile()` call (idempotent). The directory is gitignore-safe; no pre-commit hook or setup step needed.

4. **Test cleanup** — test tracks all created files and deletes them in a cleanup phase. The cases/ directory itself is left in place (it's an expected runtime artifact).

## Self-Check

- [x] `agent/src/evidence.js` exports `writeCaseFile` and `isCaseFileExists` — verified by `node -e "import(...).then(m => console.log(Object.keys(m)))"`
- [x] `agent/tests/test-evidence.js` exits 0 — verified by `node agent/tests/test-evidence.js`
- [x] No leftover test case files in `agent/cases/` — verified by `ls agent/cases/` (empty)
- [x] Commits f959667 and c300845 exist in git log

## Self-Check: PASSED
