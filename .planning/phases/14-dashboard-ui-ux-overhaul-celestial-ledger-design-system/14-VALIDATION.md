---
phase: 14
slug: dashboard-ui-ux-overhaul-celestial-ledger-design-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vite dev server + browser visual inspection |
| **Config file** | dashboard/vite.config.ts |
| **Quick run command** | `cd dashboard && npx vite build --mode development 2>&1 | tail -5` |
| **Full suite command** | `cd dashboard && npx vite build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd dashboard && npx vite build --mode development 2>&1 | tail -5`
- **After every plan wave:** Run `cd dashboard && npx vite build`
- **Before `/gsd:verify-work`:** Full build must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | M3 tokens | build | `cd dashboard && npx vite build` | ✅ | ⬜ pending |
| 14-01-02 | 01 | 1 | JetBrains Mono | grep | `grep -r 'JetBrains' dashboard/src/index.css` | ❌ W0 | ⬜ pending |
| 14-01-03 | 01 | 1 | Logo assets | file | `test -f dashboard/public/images/Logo_2.png` | ❌ W0 | ⬜ pending |
| 14-01-04 | 01 | 1 | Nav component | grep | `grep -r 'fixed.*top' dashboard/src/` | ❌ W0 | ⬜ pending |
| 14-01-05 | 01 | 1 | Stat cards | grep | `grep -r 'border-l-4' dashboard/src/` | ❌ W0 | ⬜ pending |
| 14-01-06 | 01 | 1 | Table redesign | grep | `grep -r 'Active Order Book' dashboard/src/` | ❌ W0 | ⬜ pending |
| 14-01-07 | 01 | 1 | Expandable rows | grep | `grep -r 'expandedUrl\|expanded' dashboard/src/components/ListingsTable.tsx` | ✅ | ⬜ pending |
| 14-01-08 | 01 | 1 | Trust badges | grep | `grep -r 'hover:scale' dashboard/src/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `dashboard/public/images/Logo_2.png` — copy from ../ducket-web/public/images/
- [ ] `@fontsource-variable/jetbrains-mono` — npm install

*Existing Vite build infrastructure covers compilation verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual match to mockup | Celestial Ledger design | Visual comparison only | Open dev server, compare layout/colors/typography to HTML mockup |
| Hover/transition effects | Interactivity | Requires browser interaction | Hover stat cards, table rows, trust badges — verify transitions |
| Glass panel effect | backdrop-filter | Requires visual check | Verify blur effect on expanded panels |
| Responsive layout | Mobile breakpoints | Requires viewport resize | Test at 375px, 768px, 1280px widths |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
