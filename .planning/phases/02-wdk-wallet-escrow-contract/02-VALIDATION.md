---
phase: 2
slug: wdk-wallet-escrow-contract
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell one-liners + node scripts |
| **Config file** | none |
| **Quick run command** | `node agent/tools/wallet-smoke-test.js` |
| **Full suite command** | `node agent/tools/wallet-smoke-test.js && npx hardhat compile --config contracts/hardhat.config.ts` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | WLLT-01, WLLT-02 | smoke | `node agent/tools/wallet-smoke-test.js` | W0 | pending |
| 02-01-02 | 01 | 1 | WLLT-03 | smoke | `grep -rn "privateKey\|private_key\|secret" agent/src/ --include="*.ts" \| grep -v "// NEVER"` | existing | pending |
| 02-01-03 | 01 | 1 | WLLT-04 | manual | `/wdk-check` skill run | N/A | pending |
| 02-02-01 | 02 | 2 | ESCR-contract | smoke | `npx hardhat compile --config contracts/hardhat.config.ts` | W0 | pending |

---

## Wave 0 Requirements

- [ ] `agent/tools/wallet-smoke-test.js` — WDK wallet smoke test script
- [ ] Hardhat installed in contracts workspace

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Non-custodial compliance | WLLT-04 | Requires /wdk-check skill | Run `/wdk-check` and verify zero violations |
| Sepolia deployment | ESCR-contract | Requires network access + funded deployer | Run deploy script, verify contract address on Etherscan |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
