---
phase: 11
slug: resale-flow-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — manual browser walkthrough + TypeScript build check |
| **Config file** | none |
| **Quick run command** | `cd dashboard && npm run build` |
| **Full suite command** | `cd dashboard && npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd dashboard && npm run build`
- **After every plan wave:** Run `cd dashboard && npm run build` + manual browser walkthrough of all 4 steps
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | RESALE-01 | smoke | `cd dashboard && npm run build` | ✅ | ⬜ pending |
| 11-01-02 | 01 | 1 | RESALE-01 | smoke + curl | `curl -s -X POST http://localhost:3001/api/listings -H "Content-Type: application/json" -d '{"eventName":"Test","section":"A","quantity":1,"price":200,"faceValue":100}'` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 1 | RESALE-02 | smoke | `cd dashboard && npm run build` | ✅ | ⬜ pending |
| 11-01-04 | 01 | 1 | RESALE-03 | manual | Visual: Agent Decision Panel shows 50+ word reasoning | N/A | ⬜ pending |
| 11-01-05 | 01 | 1 | RESALE-04 | manual | Visual: Settlement outcome label + Etherscan link present | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No test framework — `npm run build` (TypeScript compile) is the automated gate
- [ ] `POST /api/listings` smoke test curl one-liner can be run manually against running server

*Existing infrastructure covers automated verification via TypeScript build.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Seller form renders 5 fields and submits | RESALE-01 | Browser interaction required | Open localhost:5173, fill form, submit, verify listing appears |
| Lock button triggers WDK deposit | RESALE-02 | Requires browser + mock wallet | Click Lock on a listing, verify wallet address + Etherscan link appear |
| Agent Decision Panel shows 50+ word reasoning | RESALE-03 | Visual word count verification | Navigate to step 3, read reasoning text, verify references listing fields |
| Settlement outcome with tx link + label | RESALE-04 | Visual verification of outcome display | Navigate to step 4, verify color-coded label + Etherscan link |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
