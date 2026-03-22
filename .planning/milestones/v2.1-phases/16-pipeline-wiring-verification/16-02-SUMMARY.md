---
phase: 16-pipeline-wiring-verification
plan: "02"
subsystem: openclaw-pipeline
tags: [openclaw, pipeline, orchestrator, demo, regression]
dependency_graph:
  requires: [16-01]
  provides: [openclaw-loop, demo-3-process, green-test-suite]
  affects: [package.json, agent/src/openclaw-loop.js, .gitignore]
tech_stack:
  added: []
  patterns:
    - runPipeline().then(exit) — avoids top-level await import side effects
    - Promise.allSettled — scraper resilience pattern (mirrors scan-loop.js)
    - isCaseFileExists() — cross-run idempotency without session Set
key_files:
  created:
    - agent/src/openclaw-loop.js
  modified:
    - package.json
    - .gitignore
decisions:
  - "openclaw-loop.js uses runPipeline().then(exit) instead of top-level await to avoid import side effects (top-level await in scan-loop.js is why that file cannot be imported)"
  - "No session-level dedup Set in openclaw-loop.js — OpenClaw controls invocation frequency, isCaseFileExists() provides cross-run idempotency"
  - "caseFilePath: null in dispatchEscrowAction call — case file already written before escrow dispatch, no update needed"
  - "agent/cases/ added to .gitignore — generated runtime output, not source files"
  - "--allow-unconfigured flag in demo script — machine may not have ~/.openclaw/openclaw.json, this skips the gateway.mode=local config requirement"
metrics:
  duration_seconds: 334
  completed_date: "2026-03-22"
  tasks_completed: 3
  files_created: 1
  files_modified: 2
---

# Phase 16 Plan 02: OpenClaw Pipeline Wiring + Demo Startup Summary

**One-liner:** OpenClaw-triggered one-shot scan-classify-enforce orchestrator wired into 3-process demo startup with green regression suite.

## What Was Built

**Task 1: agent/src/openclaw-loop.js** — One-shot pipeline orchestrator that runs the full scan -> classify -> enforce cycle once and exits 0. No cron scheduling. Imports classify.js, evidence.js, and escrow.js directly (never imports scan-loop.js which has top-level await that starts the cron job on import). Uses `runPipeline().then(exit)` pattern so the module is safe to import from tests. Mirrors scan-loop.js's Promise.allSettled scraper pattern and enforcement gate logic. Exits 0 on success, 1 on uncaught pipeline error.

**Task 2: package.json demo script** — Updated `demo` script from 2-process to 3-process: OpenClaw gateway (cyan), scan-loop agent (blue), dashboard (green). Added `demo:fallback` script preserving original 2-process command for easy revert. No `--kill-others-on-fail` so openclaw failure doesn't kill the fallback scan-loop.js process.

**Task 3: Regression verification** — All 5 test suites pass (23+27+27+15+15 = 107 checks). scan-loop.js unmodified. CLAW-06 gate satisfied.

## Verification Results

```
node agent/src/openclaw-loop.js
→ [OpenClawLoop] Pipeline start: 2026-03-22T00:16:51Z
→ [OpenClawLoop] StubHub: 4 listings (mock fallback)
→ [OpenClawLoop] Viagogo: 3 listings (mock fallback)
→ [OpenClawLoop] Facebook: 3 listings (mock fallback)
→ [OpenClawLoop] 10 total listings from 3 sources
→ [classified all 10, none met 85% threshold]
→ [OpenClawLoop] Summary: {"listings":10,"classified":10,"gated":0,"enforced":0,"skipped":0}
→ [OpenClawLoop] Pipeline complete: 2026-03-22T00:19:22Z
→ EXIT: 0
```

```
node agent/tests/test-classify.js && node agent/tests/test-evidence.js && node agent/tests/test-escrow.js && node agent/tests/test-escrow-pipeline.js && node agent/tests/test-pipeline.js
→ ALL TESTS PASSED (107 checks)
```

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | badc0bc | feat(16-02): create OpenClaw pipeline orchestrator |
| 2 | 4d4aa12 | feat(16-02): update demo script with OpenClaw gateway process |
| 3 | 8b14feb | chore(16-02): add agent/cases/ and LISTINGS.md to .gitignore |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Add agent/cases/ to .gitignore**
- **Found during:** Task 3 (git status after pipeline run)
- **Issue:** Pipeline run created 16 untracked case files in agent/cases/ that would be committed as source files. These are generated runtime output (evidence files from pipeline runs), not source.
- **Fix:** Added `agent/cases/` and `agent/memory/LISTINGS.md` to .gitignore
- **Files modified:** .gitignore
- **Commit:** 8b14feb

## Success Criteria Verification

- [x] CLAW-04: openclaw-loop.js runs full scan-classify-enforce pipeline end-to-end, exits 0
- [x] CLAW-05: package.json demo script starts 3 processes (openclaw, agent, dashboard)
- [x] CLAW-06: All 5 agent test suites pass (107/107 checks), 0 regressions
- [x] scan-loop.js unmodified — node-cron fallback preserved, `demo:fallback` for easy revert

## Self-Check: PASSED

Files exist:
- agent/src/openclaw-loop.js: FOUND (121 lines)
- package.json: FOUND (contains openclaw gateway run)
- .gitignore: FOUND (contains agent/cases/)

Commits exist:
- badc0bc: FOUND
- 4d4aa12: FOUND
- 8b14feb: FOUND
