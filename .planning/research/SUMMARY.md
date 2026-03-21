# Research Summary: OpenClaw Integration

**Domain:** Agent orchestration framework integration for autonomous fraud detection platform
**Researched:** 2026-03-22
**Overall confidence:** MEDIUM (WebSearch-verified across multiple sources; official docs not directly fetchable)

## Executive Summary

OpenClaw is a daemon-based AI agent framework (240K+ GitHub stars, npm package `openclaw@2026.3.11+`) that runs as a standalone Gateway process on `ws://127.0.0.1:18789`. It is NOT an embeddable library -- you do not import it into your Node.js app. Instead, it runs alongside your application as a sidecar daemon, with your code wrapped as "Skills" (SKILL.md files with YAML frontmatter and natural-language instructions) that the Gateway dispatches during its agent loop.

The integration model for Ducket is: OpenClaw Gateway replaces node-cron as the scheduling/orchestration layer. The existing scan-loop.js logic (scrape, classify, escrow) is decomposed into 3 OpenClaw Skills (ducket-scan, ducket-classify, ducket-escrow). OpenClaw's built-in cron system triggers the scan cycle every 5 minutes. The agent loop (intake -> context assembly -> model inference -> tool execution -> persistence) provides structured orchestration that satisfies the hackathon's "agent framework" requirement. Crucially, no existing code needs modification -- skills are additive SKILL.md files that reference existing modules.

The main risk is operational complexity on a deadline-day integration. OpenClaw requires daemon management (install, onboard, configure LLM provider, workspace setup) in addition to writing skill files. The fallback is clean: if OpenClaw breaks the demo, revert to node-cron by just changing the start script. Existing scan-loop.js is untouched and still works independently.

Node.js compatibility is confirmed: OpenClaw requires >= 22.16, project runs 25.2.1. ESM-only requirement matches the project's existing `"type": "module"` setup. The same ANTHROPIC_API_KEY already in .env works for OpenClaw's Claude provider.

## Key Findings

**Stack:** Install `openclaw` globally (not as project dep). No new npm packages in agent workspace. Keep @anthropic-ai/sdk for direct classification calls alongside OpenClaw's orchestration LLM usage.

**Architecture:** Gateway daemon + 3 Skills (scan, classify, escrow) replacing node-cron loop. Skills are markdown files, not code. OpenClaw calls existing JS modules as tools.

**Critical pitfall:** OpenClaw is a full daemon that must be running for the demo. If Gateway crashes or fails to start, the entire agent pipeline stops. Keep node-cron as dead-code fallback with a one-line script swap.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Phase 1: OpenClaw Setup + Skill Authoring** - Install, configure, write 3 SKILL.md files
   - Addresses: Agent framework requirement, skill-based architecture
   - Avoids: Modifying existing working code

2. **Phase 2: Cron Migration + Session State** - Replace node-cron with OpenClaw cron, migrate in-memory state to session persistence
   - Addresses: Scheduling, state persistence across restarts
   - Avoids: Breaking demo by keeping node-cron as fallback

3. **Phase 3: Demo Script Update + Verification** - Update npm scripts, verify end-to-end flow, confirm classification quality preserved
   - Addresses: Judge runnability, demo reliability
   - Avoids: Last-minute integration failures

**Phase ordering rationale:**
- Phase 1 is zero-risk (additive files only, no code changes)
- Phase 2 has moderate risk (replacing the scheduling mechanism) so it comes after skills are proven
- Phase 3 is verification -- must be last to catch any regressions

**Research flags for phases:**
- Phase 1: Standard patterns, well-documented skill format
- Phase 2: May need deeper research on OpenClaw cron configuration syntax (not fully documented in search results)
- Phase 3: Standard verification, unlikely to need research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (what to install) | MEDIUM | npm package name and version confirmed across multiple sources. Install method confirmed. Could not fetch official docs directly. |
| Features (skill format) | MEDIUM | SKILL.md YAML frontmatter format confirmed across 5+ sources including GitHub examples. Markdown body is natural-language instructions. |
| Architecture (Gateway + skills) | MEDIUM | Agent loop lifecycle confirmed by multiple blog posts and docs references. Daemon model confirmed. Programmatic embedding limited to `--local` CLI flag. |
| Pitfalls (daemon complexity) | MEDIUM | Operational risks inferred from architecture. Real-world reports of cron jobs not waking confirm scheduling fragility. |

## Gaps to Address

- **OpenClaw cron configuration syntax:** Exact format for defining cron schedules in workspace config not found in search results. May need to reference `openclaw onboard` output or docs directly during implementation.
- **Skill-to-code bridging:** How skills actually invoke Node.js modules (shell commands? direct imports? MCP servers?) is not fully clear from search results. Most examples show skills calling CLI tools (`curl`, `node script.js`). May need to wrap existing modules as CLI-callable scripts.
- **Session persistence format:** How session state maps to markdown files, and whether custom state (like the `seen` Set) can be stored, is not documented in search results. May need experimentation.
- **Demo startup sequence:** Whether `openclaw daemon start` + `npm run dev:dashboard` can be combined in a single `concurrently` command needs testing.

---
*Research summary for: Ducket AI Galactica v2.1 -- OpenClaw Integration*
*Researched: 2026-03-22*
