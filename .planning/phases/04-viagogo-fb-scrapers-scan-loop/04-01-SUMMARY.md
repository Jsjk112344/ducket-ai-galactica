---
phase: 04-viagogo-fb-scrapers-scan-loop
plan: "01"
subsystem: scan-pipeline
tags: [patchright, scraping, viagogo, facebook-marketplace, mock-fallback, scan-05]
dependency_graph:
  requires: [agent/tools/scrape-stubhub.js, patchright]
  provides: [agent/tools/scrape-viagogo.js, agent/tools/scrape-facebook.js]
  affects: [04-02-scan-loop]
tech_stack:
  added: [node-cron@4.2.1]
  patterns: [patchright-xhr-interception, patchright-dom-extraction, mock-fallback, dual-mode-cli-module]
key_files:
  created:
    - agent/tools/scrape-viagogo.js
    - agent/tools/scrape-facebook.js
  modified:
    - agent/package.json
decisions:
  - "Logs routed to stderr via log() helper — keeps stdout clean for JSON piping (same pattern as Phase 3 StubHub)"
  - "Mock fallback is PRIMARY path for both platforms — Cloudflare Enterprise (Viagogo) and Meta WAF (Facebook) both block datacenter IPs at high rates"
  - "Facebook uses domcontentloaded (NOT networkidle) — networkidle triggers full auth wall before DOM tiles render"
  - "node-cron installed at package.json install-time (npm install node-cron) — available for Plan 02 scan loop without re-install"
metrics:
  duration: "5 minutes"
  completed_date: "2026-03-19T09:37:05Z"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 4 Plan 1: Viagogo + Facebook Marketplace Scrapers Summary

**One-liner:** Patchright scrapers for Viagogo (XHR interception) and Facebook Marketplace (DOM extraction) with labeled mock fallbacks — completing the three-platform scan pipeline to identical SCAN-05 schema.

## What Was Built

### Task 1: Viagogo Scraper (`agent/tools/scrape-viagogo.js`)

Replicates the Phase 3 StubHub pattern for Viagogo:

- **Browser automation:** Patchright Chromium launch with `--no-sandbox` flags
- **Interception strategy:** `page.on('response')` XHR listener targeting `/api/`, `listing`, `inventory`, `catalog`, `search`, `ticket` URL fragments
- **Schema transform:** `toViagogoSchema()` maps raw XHR fields to SCAN-05 shape — defensive field access covers `Price`/`price`/`amount`/`currentPrice.amount` variants
- **Mock fallback:** `getMockViagogo()` returns 2 labeled listings (scalper at 650 USD, scam below face at 180 USD) when Cloudflare blocks
- **Deduplication:** SHA-256 URL hash (16-char slice) eliminates overlapping XHR responses
- **CLI + module:** Dual-mode via `process.argv[1]` check; `export { scrapeViagogo }`

Also added `node-cron@4.2.1` to `agent/package.json` for the Plan 02 scan loop.

### Task 2: Facebook Marketplace Scraper (`agent/tools/scrape-facebook.js`)

Same structural pattern as Viagogo but adapted for Facebook's login-wall reality:

- **Navigation:** `waitUntil: 'domcontentloaded'` (critical — networkidle triggers full auth wall)
- **Modal dismissal:** Three-method approach (Escape key, body click at (10,10), `[aria-label="Close"]` click) — each wrapped in try/catch
- **Extraction strategy:** `page.evaluate()` DOM extraction targeting `[href*="/marketplace/item/"]`, `[data-testid="marketplace_item"]`, `[aria-label*="$"]` selectors
- **Price parsing:** Regex `\$[\d,.]+` from raw tile text — Facebook DOM doesn't expose structured price data
- **Mock fallback:** `getMockFacebook()` returns 2 labeled listings (scalper at 500 USD, scam at 75 USD) when Meta WAF blocks
- **CLI + module:** Same dual-mode pattern; `export { scrapeFacebook }`

## Schema Output (SCAN-05 Compliant)

Both scrapers produce identical schema to Phase 3 StubHub:

```json
{
  "platform": "Viagogo",
  "seller": "mock-viagogo-seller-001",
  "price": 650,
  "url": "https://www.viagogo.com/ticket/mock-001",
  "listingDate": "2026-03-19T09:37:05.000Z",
  "redFlags": ["price 3x face value", "significant markup over face value"],
  "eventName": "FIFA World Cup 2026",
  "section": "Category 2",
  "quantity": 2,
  "faceValue": 200,
  "priceDeltaPct": 225,
  "source": "mock"
}
```

## Verification Results

All 6 plan checks passed:

| Check | Result |
|-------|--------|
| node-cron in agent/package.json | PASS |
| scrapeViagogo named export | PASS |
| scrapeFacebook named export | PASS |
| Viagogo CLI exits 0, valid JSON array, SCAN-05 fields, numeric price | PASS |
| Facebook CLI exits 0, valid JSON array, SCAN-05 fields, numeric price | PASS |
| All listings have source field (mock or live) | PASS |

## Deviations from Plan

None — plan executed exactly as written.

The Viagogo and Facebook scrapers behaved as expected per research (RESEARCH.md): both fell back to mock data on datacenter IPs, which is the documented primary path. The mock fallbacks are correctly labeled `source: "mock"` and the CLI tools exit 0 in both cases.

## Requirements Satisfied

| ID | Description | Status |
|----|-------------|--------|
| SCAN-03 | Viagogo scraper returns structured listing JSON (live or mock with `source: "mock"`) | DONE |
| SCAN-04 | Facebook scraper returns structured listing JSON (live or mock with `source: "mock"`) | DONE |
| SCAN-05 | Both scrapers produce identical schema: platform, seller, price (numeric), url, listingDate, redFlags | DONE |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1: Viagogo scraper + node-cron | `39f4179` | feat(04-01): Viagogo scraper with Patchright XHR interception and mock fallback |
| 2: Facebook scraper | `6feba18` | feat(04-01): Facebook Marketplace scraper with DOM extraction and mock fallback |

## Self-Check: PASSED

Files verified:
- `agent/tools/scrape-viagogo.js` — EXISTS (248 lines)
- `agent/tools/scrape-facebook.js` — EXISTS (252 lines)
- `agent/package.json` — contains "node-cron": "^4.2.1"

Commits verified:
- `39f4179` — FOUND in git log
- `6feba18` — FOUND in git log
