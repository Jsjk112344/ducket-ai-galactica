---
phase: 15-openclaw-workspace-skills
plan: 01
subsystem: agent/openclaw
tags: [openclaw, workspace, skills, cli, esm]
dependency_graph:
  requires: []
  provides:
    - agent/openclaw/SOUL.md
    - agent/openclaw/skills/ducket-scan/SKILL.md
    - agent/openclaw/skills/ducket-classify/SKILL.md
    - agent/openclaw/skills/ducket-escrow/SKILL.md
    - agent/scripts/cli-scan.js
    - agent/scripts/cli-classify.js
    - agent/scripts/cli-escrow.js
  affects:
    - Phase 16 (OpenClaw daemon integration)
tech_stack:
  added: []
  patterns:
    - OpenClaw SOUL.md workspace identity file
    - OpenClaw SKILL.md skill definitions with YAML frontmatter
    - ESM CLI wrapper scripts with fileURLToPath __dirname pattern
key_files:
  created:
    - agent/openclaw/SOUL.md
    - agent/openclaw/skills/ducket-scan/SKILL.md
    - agent/openclaw/skills/ducket-classify/SKILL.md
    - agent/openclaw/skills/ducket-escrow/SKILL.md
    - agent/scripts/cli-scan.js
    - agent/scripts/cli-classify.js
    - agent/scripts/cli-escrow.js
  modified: []
decisions:
  - "cli-scan.js imports scrapers directly from tools/ — NOT scan-loop.js which hangs forever with cron"
  - "All SKILL.md descriptions double-quoted to avoid OpenClaw silent YAML parse drop pitfall"
  - "cli-escrow.js exits 0 on null result (insufficient balance expected in demo mode)"
metrics:
  duration_seconds: 254
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_created: 7
  files_modified: 0
---

# Phase 15 Plan 01: OpenClaw Workspace + Skills Summary

**One-liner:** OpenClaw workspace with SOUL.md agent identity + 3 SKILL.md files (scan/classify/escrow) + 3 ESM CLI wrapper scripts bridging OpenClaw exec to existing agent modules.

## What Was Built

Seven new files — zero modifications to existing code:

1. `agent/openclaw/SOUL.md` — Ducket agent identity with Identity, Mission, Pipeline, Core Truths, Boundaries sections. Defines the agent's mission (safe P2P ticket resale), pipeline (scan → classify → escrow), and hard boundaries (WDK-only fund movement, no human-triggered escrow).

2. `agent/openclaw/skills/ducket-scan/SKILL.md` — Scan skill definition. YAML frontmatter with quoted description and emoji. Documents the multi-scraper pattern using `Promise.allSettled` and graceful single-source failure handling.

3. `agent/openclaw/skills/ducket-classify/SKILL.md` — Classify skill definition. Requires `ANTHROPIC_API_KEY` declared in frontmatter metadata. Documents AI-first with rule-based fallback.

4. `agent/openclaw/skills/ducket-escrow/SKILL.md` — Escrow skill definition. Requires `WDK_MNEMONIC`. Documents that null result on insufficient balance exits 0 (expected in demo).

5. `agent/scripts/cli-scan.js` — Calls all three scrapers via `Promise.allSettled`. Does NOT import scan-loop.js (prevents cron hang). Exits 0 if any source returns data.

6. `agent/scripts/cli-classify.js` — Calls `classifyListing()` with a demo FIFA World Cup listing. Prints full JSON classification result including category, confidence, reasoning, classificationSource, and signals.

7. `agent/scripts/cli-escrow.js` — Calls `dispatchEscrowAction()` with a mock SCALPING_VIOLATION listing. Handles null result (insufficient balance) gracefully with exit 0.

## Verification Results

| Check | Result |
|-------|--------|
| All 7 files exist | PASS |
| cli-classify.js exits 0, prints JSON | PASS — outputs LEGITIMATE verdict with full reasoning |
| cli-escrow.js exits 0 (balance skip) | PASS |
| cli-scan.js exits 0 (Facebook + Viagogo return data) | PASS |
| No existing files modified | PASS — 0 diffs in agent/src/ or agent/tools/ |
| Regression guard (test-classify.js) | 19/23 pass — 4 failures are pre-existing, not regressions |

## Decisions Made

1. **Import scrapers directly in cli-scan.js, not scan-loop.js** — scan-loop.js has top-level await that starts a node-cron job and runs forever. Importing it hangs the CLI. The wrapper calls `scrapeStubHub`, `scrapeViagogo`, `scrapeFacebook` directly from `tools/`.

2. **Double-quote all SKILL.md YAML descriptions** — OpenClaw silently drops skills with YAML parse errors (no error message). Values containing colons must be quoted. All three SKILL.md files use `description: "..."` format.

3. **cli-escrow.js exits 0 on null** — `dispatchEscrowAction()` returns null when escrow balance is insufficient. This is documented behavior (demo mode), not an error. The CLI logs "Escrow skipped" and exits 0.

## Deviations from Plan

None — plan executed exactly as written. The CLI wrapper scripts were found pre-committed in `1e4bc7a` (included in a prior planning/README commit), and the Write operations confirmed the content matched the plan specification exactly.

**Pre-existing test failures (not regressions):**
- `test-classify.js` has 4 pre-existing failures (SCALPING enforcement gate and confidence formula tests). These failures existed before this plan and are out of scope per deviation rules. Logged to deferred-items.

## Self-Check: PASSED

All 7 files confirmed to exist on disk. Commit `75cff1a` (Task 1) verified in git log. CLI scripts were pre-committed in `1e4bc7a` — content matches plan specification.
