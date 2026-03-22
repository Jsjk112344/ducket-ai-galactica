# Phase 16: Pipeline Wiring + Verification - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire OpenClaw skills into a unified agent loop that orchestrates scan -> classify -> escrow end-to-end, update `npm run demo` to start the OpenClaw daemon, and verify all existing agent tests pass with no regressions.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Key areas:
- How the OpenClaw agent loop invokes the three CLI skills (child_process, direct import, or OpenClaw SDK)
- Whether the loop lives in a new file or extends scan-loop.js
- How `npm run demo` is updated (concurrently config, new script entry, or wrapper)
- Fallback mechanism for reverting to node-cron scan loop (env flag vs script swap)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `agent/src/scan-loop.js` — existing node-cron pipeline (scan + classify + escrow inline)
- `agent/scripts/cli-scan.js`, `cli-classify.js`, `cli-escrow.js` — CLI wrappers for each skill
- `agent/openclaw/SOUL.md` — agent identity definition
- `agent/openclaw/skills/ducket-{scan,classify,escrow}/SKILL.md` — skill declarations

### Established Patterns
- Promise.allSettled for resilient multi-source scanning
- Inline classification + enforcement in the scan loop
- node-cron for scheduling, concurrently for multi-process demo startup
- Case file evidence trail with escrow action annotation

### Integration Points
- `package.json` `demo` script — currently runs `scan-loop.js` + dashboard
- `agent/src/classify.js`, `escrow.js`, `evidence.js` — core modules wrapped by skills
- `.env` for API keys (ANTHROPIC_API_KEY, WDK_MNEMONIC)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
