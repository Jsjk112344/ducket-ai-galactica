---
phase: 12
slug: seed-data-ai-visibility
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — plain Node.js validation script |
| **Config file** | none — Wave 0 creates script |
| **Quick run command** | `node scripts/validate-seed.js` |
| **Full suite command** | `node scripts/validate-seed.js` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node scripts/validate-seed.js`
- **After every plan wave:** Run `node scripts/validate-seed.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | DEMO-01 | smoke | `node scripts/validate-seed.js` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | DEMO-01 | smoke | `node scripts/validate-seed.js` | ❌ W0 | ⬜ pending |
| 12-01-03 | 01 | 1 | DEMO-01 | manual | Start server, open Listings tab | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/validate-seed.js` — reads LISTINGS.md + case files, checks 4 category coverage and 50+ word reasoning strings for DEMO-01
- No test framework needed — runs as plain Node.js script

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Listings tab shows populated listings with expanded AgentDecisionPanel on first load | DEMO-01 | Visual UI verification — requires browser render | Start dashboard server, open Resale Flow tab, verify no empty state and first row's AgentDecisionPanel is visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
