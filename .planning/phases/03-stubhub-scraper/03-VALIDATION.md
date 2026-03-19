---
phase: 03
slug: stubhub-scraper
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner + manual CLI verification |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `node agent/tools/scrape-stubhub.js "FIFA World Cup 2026"` |
| **Full suite command** | `node agent/tools/scrape-stubhub.js "FIFA World Cup 2026" && echo "PASS"` |
| **Estimated runtime** | ~35 seconds (30s timeout + parse) |

---

## Sampling Rate

- **After every task commit:** Run `node agent/tools/scrape-stubhub.js "FIFA World Cup 2026"`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 35 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SCAN-02 | integration | `node agent/tools/scrape-stubhub.js "FIFA World Cup 2026"` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | SCAN-05 | integration | `node agent/tools/scrape-stubhub.js "FIFA World Cup 2026" \| node -e "..."` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `patchright` npm package installed in agent workspace
- [ ] `agent/tools/scrape-stubhub.js` — stub file created

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bot detection bypass | SCAN-02 | Depends on live StubHub response | Run scraper, verify no bot-detection error in output |
| Mock fallback activation | SCAN-02 | Requires blocking condition | Block network to StubHub, verify mock data returned with `source: "mock"` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 35s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
