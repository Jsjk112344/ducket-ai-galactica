---
phase: 1
slug: project-scaffold-compliance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell one-liners (no test framework needed — file existence checks) |
| **Config file** | none |
| **Quick run command** | `ls LICENSE README.md .gitignore package.json agent/package.json dashboard/package.json contracts/package.json` |
| **Full suite command** | `cat LICENSE | grep -q "Apache License" && cat README.md | grep -q "Third-Party" && echo ALL_PASS` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | COMP-03 | smoke | `cat .gitignore | grep -q ".env" && echo PASS` | W0 | pending |
| 01-01-02 | 01 | 1 | COMP-01 | smoke | `cat LICENSE | grep -q "Apache License" && echo PASS` | W0 | pending |
| 01-01-03 | 01 | 1 | COMP-02 | smoke | `cat README.md | grep -q "Third-Party" && echo PASS` | W0 | pending |
| 01-01-04 | 01 | 1 | COMP-04 | smoke | `npm install --dry-run 2>&1 | tail -1` | W0 | pending |

---

## Wave 0 Requirements

- [ ] `.gitignore` — covers COMP-03
- [ ] `LICENSE` — covers COMP-01
- [ ] `README.md` — covers COMP-02, COMP-04 (partial)
- [ ] `package.json` (root + 3 workspaces) — covers COMP-04 (installability)

No test framework needed — all validations are shell one-liners.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Public GitHub repo accessible | COMP-04 | Requires browser/network access | Visit repo URL without auth, verify page loads |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
