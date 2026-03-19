---
phase: 07
slug: react-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vite build check + Express API test |
| **Config file** | dashboard/vite.config.ts |
| **Quick run command** | `cd dashboard && npx vite build --mode production 2>&1 | tail -5` |
| **Full suite command** | `cd dashboard && npx vite build && node tests/test-api.js` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick build check
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | DASH-01 | build | `cd dashboard && npx vite build` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | DASH-02, DASH-03, DASH-04 | visual | manual browser check | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `dashboard/` workspace with Vite + React + Tailwind configured
- [ ] `dashboard/src/App.tsx` — stub component

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Classification badge colors | DASH-01 | Visual | Open dashboard, verify red/orange/yellow/green badges |
| Expandable Agent Decision panel | DASH-02 | Interactive | Click listing row, verify reasoning + confidence shown |
| WDK non-custodial badge | DASH-04 | Visual | Check wallet inspector for "client-side only" indicator |
| Ducket brand styling | DASH-01 | Visual | Verify dark theme, indigo accent, Inter font |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
