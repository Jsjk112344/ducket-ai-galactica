---
phase: 10
slug: dashboard-rebrand
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — build-only smoke tests |
| **Config file** | none |
| **Quick run command** | `cd dashboard && npm run build` |
| **Full suite command** | `cd dashboard && npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd dashboard && npm run build`
- **After every plan wave:** Run `cd dashboard && npm run build` + manual visual check
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | BRAND-01 | smoke | `cd dashboard && npm run build` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | BRAND-02 | smoke | `grep -r "fonts.googleapis.com" dashboard/src/ && echo "FAIL" \|\| echo "PASS"` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 1 | BRAND-03 | smoke | `ls dashboard/tailwind.config.js 2>/dev/null && echo "FAIL" \|\| echo "PASS"` | ❌ W0 | ⬜ pending |
| 10-01-04 | 01 | 1 | BRAND-04 | manual | Open localhost:5173, verify trust badges above fold | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No automated test framework — build smoke test (`npm run build`) serves as validation
- [ ] BRAND-02 partial automation: `grep -r "fonts.googleapis.com" dashboard/src/ && echo "FAIL" || echo "PASS"`
- [ ] BRAND-03 partial automation: `ls dashboard/tailwind.config.js 2>/dev/null && echo "FAIL" || echo "PASS"`

*Existing infrastructure (Vite build) covers TypeScript compile + bundle validation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Ducket colors visible in header and cards | BRAND-01 | Visual color verification requires browser rendering | Open localhost:5173, inspect header/cards for #3D2870 purple and #F5C842 yellow |
| Trust badges visible without scrolling | BRAND-04 | Above-fold positioning requires viewport context | Open localhost:5173 on Listings tab, verify badges visible without scroll |
| Outfit font renders on headings | BRAND-02 | Font rendering verification requires DevTools | Open DevTools → Computed → font-family on h1 should show "Outfit Variable" |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
