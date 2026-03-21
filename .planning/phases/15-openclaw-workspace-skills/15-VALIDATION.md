---
phase: 15
slug: openclaw-workspace-skills
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js custom test runner (no external framework) |
| **Config file** | None — tests run via `node agent/tests/test-X.js` |
| **Quick run command** | `node agent/tests/test-classify.js` |
| **Full suite command** | `node agent/tests/test-classify.js && node agent/tests/test-evidence.js && node agent/tests/test-pipeline.js` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node agent/tests/test-classify.js`
- **After every plan wave:** Run `node agent/tests/test-classify.js && node agent/scripts/cli-classify.js && node agent/scripts/cli-scan.js`
- **Before `/gsd:verify-work`:** Full suite must be green + all 3 CLI wrappers exit 0
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | CLAW-01 | smoke | `test -f agent/openclaw/SOUL.md && echo PASS` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | CLAW-02 | smoke | `test -f agent/openclaw/skills/ducket-scan/SKILL.md && echo PASS` | ❌ W0 | ⬜ pending |
| 15-01-03 | 01 | 1 | CLAW-02 | smoke | `test -f agent/openclaw/skills/ducket-classify/SKILL.md && echo PASS` | ❌ W0 | ⬜ pending |
| 15-01-04 | 01 | 1 | CLAW-02 | smoke | `test -f agent/openclaw/skills/ducket-escrow/SKILL.md && echo PASS` | ❌ W0 | ⬜ pending |
| 15-01-05 | 01 | 1 | CLAW-03 | smoke | `node agent/scripts/cli-scan.js && echo PASS` | ❌ W0 | ⬜ pending |
| 15-01-06 | 01 | 1 | CLAW-03 | smoke | `node agent/scripts/cli-classify.js && echo PASS` | ❌ W0 | ⬜ pending |
| 15-01-07 | 01 | 1 | CLAW-03 | smoke | `node agent/scripts/cli-escrow.js && echo PASS` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `agent/openclaw/SOUL.md` — CLAW-01 identity file
- [ ] `agent/openclaw/skills/ducket-scan/SKILL.md` — CLAW-02 scan skill
- [ ] `agent/openclaw/skills/ducket-classify/SKILL.md` — CLAW-02 classify skill
- [ ] `agent/openclaw/skills/ducket-escrow/SKILL.md` — CLAW-02 escrow skill
- [ ] `agent/scripts/cli-scan.js` — CLAW-03 scan wrapper
- [ ] `agent/scripts/cli-classify.js` — CLAW-03 classify wrapper
- [ ] `agent/scripts/cli-escrow.js` — CLAW-03 escrow wrapper

*All seven deliverables are new files. Existing test suite (`test-classify.js`, etc.) is the regression guard.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SOUL.md content quality | CLAW-01 | Natural language identity can't be auto-verified for quality | Read SOUL.md, confirm it mentions Ducket identity, safe P2P resale mission, and 3-step pipeline |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
