---
phase: 06
slug: escrow-enforcement-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js test scripts + on-chain verification |
| **Config file** | none |
| **Quick run command** | `node agent/tests/test-escrow.js` |
| **Full suite command** | `node agent/tests/test-escrow.js && node agent/tests/test-escrow-pipeline.js` |
| **Estimated runtime** | ~30 seconds (Sepolia tx confirmations) |

---

## Sampling Rate

- **After every task commit:** Run `node agent/tests/test-escrow.js`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | ESCR-01, ESCR-02, ESCR-03, ESCR-04 | integration | `node agent/tests/test-escrow.js` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | ESCR-05, ESCR-06 | integration | `node agent/tests/test-escrow-pipeline.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `agent/src/escrow.js` — stub file
- [ ] `agent/cases/` — directory exists (from Phase 5)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Etherscan link clickability | ESCR-06 | Requires browser | Open case file, click Etherscan link, verify tx exists |
| USDT balance sufficiency | ESCR-01 | Depends on faucet | Check wallet USDT balance on Sepolia Etherscan |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
