---
phase: 03-stubhub-scraper
plan: "01"
subsystem: scraper
tags: [patchright, playwright, browser-automation, anti-bot, xhr-interception, scan-pipeline]
dependency_graph:
  requires: []
  provides: [agent/tools/scrape-stubhub.js, scrapeStubHub export]
  affects: [phase-04-scan-loop]
tech_stack:
  added: [patchright@1.58.2]
  patterns: [xhr-response-interception, exponential-backoff-retry, mock-fallback, url-hash-dedup]
key_files:
  created: [agent/tools/scrape-stubhub.js]
  modified: [agent/package.json]
decisions:
  - "Logs route to stderr via log() helper — keeps stdout clean for JSON piping (discovered during verification)"
  - "dotenv quiet:true suppresses library tip message on stdout"
  - "Outer try/catch wraps entire scrapeStubHub body — ensures function never throws to caller"
  - "STUBHUB_TIMEOUT env var controls navigation timeout — allows fast test runs without code changes"
metrics:
  duration: "14 minutes"
  completed: "2026-03-19"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Phase 3 Plan 1: StubHub Scraper Summary

**One-liner:** Patchright Chromium scraper with XHR response interception, SHA-256 URL dedup, exponential backoff, and 4-archetype mock fallback for Akamai bot detection.

## What Was Built

`agent/tools/scrape-stubhub.js` — 306-line dual-mode tool (CLI + importable ES module) that:

1. Launches Patchright-patched Chromium (headless, stealth patches applied)
2. Registers `page.on('response')` handler to intercept StubHub's internal listing API
3. Navigates to `stubhub.com/secure/search?q={eventName}` with exponential backoff retry
4. Transforms raw API fields to SCAN-05 schema (numeric price, redFlags array, priceDeltaPct)
5. Deduplicates by SHA-256 URL hash (in-memory Map, per-run)
6. Falls back to labeled mock data if Akamai blocks or XHR yields no listings

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install Patchright + build scraper tool | 2b751cb | agent/package.json, agent/tools/scrape-stubhub.js |
| 1b (fix) | Route logs to stderr, quiet dotenv | 099cb13 | agent/tools/scrape-stubhub.js |
| 2 | Verify scraper runs against live StubHub | checkpoint:approved | — |

## Verification Results

Automated schema check passed (mock fallback path, Akamai blocked live scraping):

```
Schema OK: 4 listings
Price type: int = 840
Source: mock
redFlags: ['price 4x face value', 'significant markup over face value']
```

Stdout is clean JSON (logs on stderr), enabling `node scrape-stubhub.js | jq` usage.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Logs mixed into stdout polluted JSON output when piped**
- **Found during:** Task 1 verification (automated schema check failed due to dotenv tip on stdout)
- **Issue:** `console.log` and dotenv's own tip message wrote to stdout, breaking `| python3 -c 'json.loads(data)'`
- **Fix:** Added `log()` helper routing to `console.error` (stderr); replaced all scraper `console.log` with `log()`; added `quiet: true` to dotenv config to suppress library tip
- **Files modified:** agent/tools/scrape-stubhub.js
- **Commit:** 099cb13

## Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| patchright in agent/package.json | PASS |
| `import { chromium } from 'patchright'` | PASS |
| `export { scrapeStubHub }` | PASS |
| `page.on('response')` XHR interception | PASS |
| `getMockListings` function | PASS |
| `source: 'mock'` in mock listings | PASS |
| `source: 'live'` in schema transform | PASS |
| `createHash('sha256')` for URL dedup | PASS |
| `FIFA_2026_FACE_VALUES` lookup table | PASS |
| `parseFloat` for price parsing | PASS |
| `redFlags` array construction | PASS |
| `browser?.close()` in finally block | PASS |
| `withRetry` with exponential backoff | PASS |
| `Apache 2.0` in header comment | PASS |
| `node -e "import('patchright')"` exits 0 | PASS |
| min_lines >= 120 (actual: 306) | PASS |

## Key Decisions

1. **Logs to stderr:** All `[StubHub]` operational logs go to stderr via `log()` helper. This is critical for Phase 4 import — when the scan loop calls `scrapeStubHub()`, it needs a clean return value, not console output. Also enables `node scrape-stubhub.js | jq` for quick demos.

2. **Outer try/catch design:** The scraper has two layers — inner `try/finally` (browser cleanup) + outer `try/catch` (mock fallback). This guarantees browser processes are always closed AND the function never throws. Demo resilience is non-negotiable.

3. **STUBHUB_TIMEOUT env var:** Defaults to 30000ms but overridable. Enables fast test cycles (`STUBHUB_TIMEOUT=5000 node scrape-stubhub.js`) without code changes. Used in verification above.

4. **Akamai behavior observed:** On this machine (non-residential IP), Akamai's `waitUntil: 'networkidle'` times out after 30s even with Patchright stealth patches. The mock fallback fires correctly. For demo, this is acceptable — `source: 'mock'` is labeled.

## Module Export

Verified importable as ES module:

```javascript
import { scrapeStubHub } from './agent/tools/scrape-stubhub.js';
// Returns Promise<ListingObject[]> — always resolves, never rejects
```

Ready for Phase 4 scan loop consumption.

## Task 2 Verification Result

Human-approved. Automated schema check output confirmed by user:
- 4 listings returned
- source: "mock" (Akamai blocked live scraping — mock fallback activated as designed)
- price: int (not string) — SCAN-05 numeric requirement satisfied
- redFlags: array of strings — correct type
- All 6 required fields present: platform, seller, price, url, listingDate, redFlags
- All enrichment fields present: eventName, section, quantity, faceValue, priceDeltaPct, source
- All required fields present: True

## Self-Check: PASSED

- agent/tools/scrape-stubhub.js: FOUND
- agent/package.json: FOUND
- 03-01-SUMMARY.md: FOUND
- Commit 2b751cb (feat): FOUND
- Commit 099cb13 (fix): FOUND
- Task 2 checkpoint: APPROVED by human
