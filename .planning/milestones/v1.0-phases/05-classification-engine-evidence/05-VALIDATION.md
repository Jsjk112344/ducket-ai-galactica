---
phase: 05
slug: classification-engine-evidence
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js test script + CLI verification |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `node agent/tools/classify.js --test` |
| **Full suite command** | `node agent/tools/classify.js --test && ls agent/cases/*.md` |
| **Estimated runtime** | ~10 seconds (Claude API call + file writes) |

---

## Sampling Rate

- **After every task commit:** Run `node agent/tools/classify.js --test`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | CLAS-01, CLAS-02 | integration | `node agent/tools/classify.js --test` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | CLAS-03, CLAS-04 | integration | `node agent/tools/classify.js --test` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | EVID-01, EVID-02, EVID-03 | integration | `ls agent/cases/*.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `@anthropic-ai/sdk` npm package installed in agent workspace
- [ ] `agent/tools/classify.js` — stub file created
- [ ] `agent/cases/` — directory created

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Claude API reasoning quality | CLAS-02 | Subjective output quality | Read reasoning text in case file, verify it references specific signals |
| Enforcement text coherence | EVID-03 | Subjective text quality | Read drafted enforcement text in case file |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
