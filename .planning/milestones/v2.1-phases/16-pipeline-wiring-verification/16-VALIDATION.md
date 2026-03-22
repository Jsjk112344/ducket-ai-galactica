---
phase: 16
slug: pipeline-wiring-verification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js test runner (built-in `node --test`) |
| **Config file** | none — tests run directly via node |
| **Quick run command** | `node --test agent/tests/test-classify.js` |
| **Full suite command** | `node --test agent/tests/test-*.js` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test agent/tests/test-classify.js`
- **After every plan wave:** Run `node --test agent/tests/test-*.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | CLAW-04 | integration | `node agent/openclaw/openclaw-loop.js --once 2>&1 \| grep "pipeline complete"` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | CLAW-05 | smoke | `npm run demo -- --help 2>&1 \| grep openclaw` | ❌ W0 | ⬜ pending |
| 16-01-03 | 01 | 1 | CLAW-06 | regression | `node --test agent/tests/test-*.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `agent/openclaw/openclaw-loop.js` — OpenClaw agent loop entry point
- [ ] Fix 5 pre-existing test failures in test-classify.js and test-evidence.js

*Existing test infrastructure covers regression requirements (CLAW-06).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Fallback to node-cron | CLAW-04 | Requires reverting demo script | Remove openclaw from `npm run demo` concurrently args, verify scan-loop.js runs alone |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
