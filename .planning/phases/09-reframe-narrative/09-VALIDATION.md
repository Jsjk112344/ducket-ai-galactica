---
phase: 9
slug: reframe-narrative
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (text-only changes — grep-based validation) |
| **Config file** | none |
| **Quick run command** | `grep -cin "fraud\|monitoring tool\|scan and report" README.md CLAUDE.md docs/DEMO-SCRIPT.md` |
| **Full suite command** | Same — phase has no automated test suite |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `grep -cin "fraud detection\|monitoring tool\|scan and report" <modified_file>`
- **After every plan wave:** Run full banned-phrase grep across all three target files
- **Before `/gsd:verify-work`:** Full suite must return 0 matches
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | NARR-01 | smoke | `grep -c "monitoring tool\|scan and report\|fraud detection" README.md` (expect: 0) | ✅ | ⬜ pending |
| 09-01-02 | 01 | 1 | NARR-01 | smoke | `grep -c "buyer locks\|seller lists\|AI verif" README.md` (expect: >= 1 each) | ✅ | ⬜ pending |
| 09-01-03 | 01 | 1 | NARR-02 | smoke | `grep -c "buyer\|seller\|resale" CLAUDE.md` (expect: >= 6) | ✅ | ⬜ pending |
| 09-01-04 | 01 | 1 | NARR-03 | smoke | `grep -c "Alice\|Bob" docs/DEMO-SCRIPT.md` (expect: >= 2) + `grep -c "fraud monitoring" docs/DEMO-SCRIPT.md` (expect: 0) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `docs/DEMO-SCRIPT.md` — stubs for NARR-03 (file does not exist yet)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| README narrative reads as P2P resale platform | NARR-01 | Semantic coherence not greppable | Read README top-to-bottom; confirm 4-step resale flow is the primary mental model |
| Demo script maps steps to dashboard screens | NARR-03 | Screen name correctness needs visual check | Verify each step references a named screen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
