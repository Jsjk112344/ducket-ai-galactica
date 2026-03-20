---
phase: 4
slug: viagogo-fb-scrapers-scan-loop
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | CLI smoke tests (no formal test framework — scrapers are the tests) |
| **Config file** | none |
| **Quick run command** | `node agent/tools/scrape-viagogo.js "FIFA World Cup 2026"` |
| **Full suite command** | Run all three scrapers + `node agent/src/scan-loop.js` (observe 2 cycles) |
| **Estimated runtime** | ~30 seconds per scraper, ~10 minutes for 2 scan-loop cycles |

---

## Sampling Rate

- **After every task commit:** Run the specific scraper CLI: `node agent/tools/scrape-<platform>.js "FIFA World Cup 2026"`
- **After every plan wave:** Run all three scrapers sequentially; check LISTINGS.md output
- **Before `/gsd:verify-work`:** Full suite must be green — all scrapers return valid JSON (live or mock)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SCAN-03 | smoke | `node agent/tools/scrape-viagogo.js "FIFA World Cup 2026"` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | SCAN-04 | smoke | `node agent/tools/scrape-facebook.js "FIFA World Cup 2026"` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | SCAN-01 | smoke (manual observe) | `node agent/src/scan-loop.js` — watch for 2 cycles | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | SCAN-05 | integration | `cat agent/memory/LISTINGS.md` after loop runs | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `agent/tools/scrape-viagogo.js` — Viagogo scraper with XHR interception + mock fallback
- [ ] `agent/tools/scrape-facebook.js` — Facebook scraper with DOM extraction + mock fallback
- [ ] `agent/src/scan-loop.js` — Autonomous heartbeat loop with node-cron
- [ ] `agent/memory/` directory exists for LISTINGS.md output
- [ ] `npm install node-cron` in agent/ workspace
- [ ] Verify node-cron v4 ESM import syntax

*Discovery steps (manual, pre-code):*
- [ ] Live Viagogo XHR endpoint URL via DevTools inspection
- [ ] Live Facebook DOM listing selectors via DevTools inspection

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Viagogo XHR endpoint discovery | SCAN-03 | Requires live Chrome DevTools | Open viagogo.com, search FIFA WC 2026, Network tab → find XHR with listing JSON |
| Facebook DOM selector discovery | SCAN-04 | Requires live Chrome DevTools | Open facebook.com/marketplace/search, inspect listing tile elements |
| Scan loop heartbeat runs autonomously | SCAN-01 | Requires 10-minute observation | Run `node agent/src/scan-loop.js`, observe 2 full cycles in terminal |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
