# Technology Stack

**Project:** Ducket AI Galactica - v2.1 OpenClaw Integration
**Researched:** 2026-03-22
**Scope:** OpenClaw integration additions ONLY. All v1.0/v2.0 stack validated and unchanged.

---

## Critical Architecture Finding

**OpenClaw is a daemon, not an embeddable library.** It runs as a standalone Gateway process (WebSocket on `ws://127.0.0.1:18789`) with its own agent loop, session management, and LLM orchestration. You do not `import openclaw from 'openclaw'` into your app and call functions.

**Integration model:** OpenClaw Gateway runs as a sidecar process. Ducket's scraping, classification, and escrow modules become OpenClaw Skills (SKILL.md files). OpenClaw's cron system replaces `node-cron`. The Gateway orchestrates; Ducket code executes.

**Confidence:** MEDIUM -- based on multiple WebSearch sources cross-referenced. Official docs could not be directly fetched for verification.

---

## Recommended Stack

### Core Addition

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| openclaw | 2026.3.11+ (latest: 2026.3.13) | Agent orchestration daemon | Replaces node-cron scan loop with proper agent framework. Provides cron+heartbeat scheduling, session persistence, skill dispatch, and multi-tool orchestration. Hackathon "Must Have" requirement for agent framework. |

### No Other New Dependencies

OpenClaw is installed **globally** (`npm install -g openclaw@latest`), not as a project workspace dependency. It runs as its own daemon process. Zero changes to `agent/package.json`.

The existing `@anthropic-ai/sdk` stays -- OpenClaw reads `ANTHROPIC_API_KEY` from env to use Claude as its LLM provider. No new API keys needed.

---

## What Changes (OpenClaw vs Current)

| Current (node-cron) | After OpenClaw | Why |
|----------------------|---------------|-----|
| `node-cron` schedules `runScanCycle()` every 5 min | OpenClaw cron job triggers scan skill on schedule | OpenClaw owns scheduling; config is declarative, not code |
| `scan-loop.js` is the entry point (`node agent/src/scan-loop.js`) | OpenClaw Gateway is entry point; skills call existing modules | Separation of orchestration from execution |
| Process state in JS variables (`seen` Set, `bondDeposited` bool) | OpenClaw session persistence (markdown files in workspace) | State survives process restarts |
| `Promise.allSettled` for scraper resilience | OpenClaw handles tool failure natively per-skill | Less boilerplate, same resilience |
| `@anthropic-ai/sdk` called directly in `classify.js` | Skills still call Claude SDK directly for structured classification | OpenClaw uses Claude for orchestration reasoning; direct SDK for classification output format control |
| Manual `console.log` for observability | OpenClaw session logs + lifecycle events | Structured audit trail |

## What Does NOT Change

| Technology | Why Kept |
|------------|----------|
| @anthropic-ai/sdk ^0.80.0 | Skills need fine-grained control over structured output for classification. OpenClaw's LLM calls are for orchestration reasoning, not classification. |
| @tetherto/wdk-wallet-evm ^1.0.0-beta.8 | Mandatory hackathon requirement. OpenClaw decides WHEN; WDK handles HOW. |
| ethers.js ^6.16.0 | Smart contract owner calls for FraudEscrow.sol. Unchanged. |
| patchright ^1.58.2 | Scraper automation. Wrapped as skill but code unchanged. |
| Express, React 19, Vite 8, Tailwind v4 | Dashboard/API layer unaffected by agent orchestration change. |
| Hardhat 3 | Contract tooling unaffected. |
| node-cron ^4.2.1 | Keep as dependency but no longer primary loop driver. Fallback if OpenClaw integration fails on demo day. |

---

## OpenClaw Core Concepts

### Gateway
Single long-lived Node.js daemon on `ws://127.0.0.1:18789`. Owns messaging, scheduling, session management. Always running, routing events to the agent loop. Think: the "brain stem."

### Agent Loop
The core cycle: **intake -> context assembly -> model inference -> tool execution -> streaming replies -> persistence**. Serialized per session. This replaces `runScanCycle()`.

Five input types feed the loop:
1. **Messages** -- human chat input (not used in Ducket's autonomous mode)
2. **Heartbeats** -- periodic awareness check (default 30 min)
3. **Cron** -- scheduled triggers ("every 5 min, scan listings")
4. **Hooks** -- internal state events
5. **Webhooks** -- external system triggers

All enter a single queue -> processed -> agent executes (LLM + tools) -> state persists -> loop continues.

### Skills (SKILL.md)
A folder with a `SKILL.md` file. YAML frontmatter declares metadata. Markdown body contains natural-language instructions loaded into agent context. **No SDK, no compilation, no runtime library.** Just prompt engineering in markdown.

```yaml
---
name: ducket-scan
description: Scan secondary ticket marketplaces for listings matching the target event.
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - ANTHROPIC_API_KEY
        - SEPOLIA_RPC_URL
      bins:
        - node
---

# Ducket Scan Skill

When triggered by cron or user request, execute the scan pipeline:
1. Call scrapeStubHub(), scrapeViagogo(), scrapeFacebook() with the target event name
2. Deduplicate results by URL hash
3. For each new listing, call the classify skill
4. Persist results to agent/memory/LISTINGS.md
...
```

### Sessions
Persistent conversation context stored as markdown files in workspace. Survives Gateway restarts. Replaces the in-memory `seen` Set and `bondDeposited` flags in `scan-loop.js`.

**Key behavior:** OpenClaw snapshots eligible skills when a session starts. Changes to skills take effect on the next new session.

### Cron vs Heartbeat
- **Cron:** Time-based triggers. Direct replacement for `cron.schedule('*/5 * * * *', runScanCycle)`. Use for: "every 5 minutes, scan for new listings."
- **Heartbeat:** Periodic awareness. Default 30 min. Use for: "check if anything needs attention, stay silent if not." Could monitor bond status.

### Plugin API (Advanced -- Do NOT Use for Hackathon)
Extension points via `register(api)` function. Hooks: `before_model_resolve`, `session_start`, `session_end`, `gateway_start`. Methods: `api.registerProvider()`, `api.registerTool()`, `api.registerHook()`. **Too complex for today's deadline.**

---

## Installation

```bash
# 1. Install OpenClaw globally (Node >= 22.16 required; project on Node 25.2.1 -- COMPATIBLE)
npm install -g openclaw@latest

# 2. Run onboarding wizard
openclaw onboard --install-daemon

# 3. Configure Claude as LLM provider
# Set in OpenClaw config or workspace:
#   ANTHROPIC_API_KEY=sk-ant-... (already in .env)
#   Default model: claude-sonnet-4-6

# 4. Create workspace-local skills directory
mkdir -p agent/skills/ducket-scan
mkdir -p agent/skills/ducket-classify
mkdir -p agent/skills/ducket-escrow

# 5. Write SKILL.md files (see Architecture research for templates)

# No changes to agent/package.json
# No npm install in agent workspace
```

## Node.js Compatibility

| Requirement | Project Status | Verdict |
|-------------|---------------|---------|
| OpenClaw minimum: Node >= 22.16 | Node 25.2.1 installed | COMPATIBLE |
| ESM modules (`"type": "module"`) | All workspaces are ESM | COMPATIBLE |
| OpenClaw recommended: Node 24 | Node 25 is fine | COMPATIBLE |

## Environment Variables (New/Changed)

| Variable | Status | Purpose |
|----------|--------|---------|
| ANTHROPIC_API_KEY | Already exists | OpenClaw reads this for Claude provider |
| OPENCLAW_WORKSPACE | NEW (optional) | Path to workspace dir. Defaults to `~/.config/openclaw/workspace`. Set to project-local path for hackathon portability. |
| EVENT_NAME | Already exists | Passed to scan skill via OpenClaw session context |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Agent framework | OpenClaw (skills + cron) | Keep node-cron only | SUBMISSION.md claims OpenClaw. Judges will check. Must actually orchestrate. |
| Integration style | Gateway daemon + skills | Embedded library import | OpenClaw is not designed as embeddable. Gateway daemon is the intended runtime. |
| LLM routing | Keep direct @anthropic-ai/sdk in skills | Let OpenClaw handle all LLM calls | Direct SDK gives control over structured output format for classification. Keep both: OpenClaw for orchestration, SDK for classification. |
| Skill granularity | 3 skills (scan, classify, escrow) | 1 monolithic skill | 3 skills maps to existing module boundaries. More impressive for judging. Each skill is independently testable. |
| Scheduling | OpenClaw cron | Keep node-cron alongside | Redundant. OpenClaw cron is the point of integrating OpenClaw. node-cron stays as dead code fallback only. |

---

## Risk Assessment: Hackathon Deadline

OpenClaw adds operational complexity (daemon process, workspace config, skill files). For a hackathon due **today** (March 22, 2026):

**Minimum viable integration (2-3 hours):**
1. Install OpenClaw globally
2. Create 3 SKILL.md files wrapping existing code
3. Configure cron schedule in workspace
4. Update `npm run demo` to start Gateway + dashboard
5. Verify existing classification quality preserved

**Do NOT attempt:**
- Custom plugins or hook handlers
- Multi-agent routing
- OpenClaw's live canvas or voice features
- Session-to-session memory migration
- Any OpenClaw feature beyond skills + cron

**Fallback plan:** If OpenClaw integration breaks the demo, revert to node-cron. The scan-loop.js still works independently. OpenClaw skills are additive files (SKILL.md) that don't modify existing code.

---

## Sources

- [OpenClaw GitHub](https://github.com/openclaw/openclaw) -- version, architecture, README (MEDIUM confidence)
- [OpenClaw Skills Docs](https://docs.openclaw.ai/tools/skills) -- SKILL.md format, YAML frontmatter (MEDIUM confidence)
- [OpenClaw Agent Loop Docs](https://docs.openclaw.ai/concepts/agent-loop) -- lifecycle: intake->context->inference->execution->persistence (MEDIUM confidence)
- [OpenClaw Cron vs Heartbeat](https://docs.openclaw.ai/automation/cron-vs-heartbeat) -- scheduling model (MEDIUM confidence)
- [OpenClaw Plugin Docs](https://docs.openclaw.ai/tools/plugin) -- register(api) surface (MEDIUM confidence)
- [OpenClaw Node.js Requirements](https://docs.openclaw.ai/install/node) -- Node >= 22.16 (MEDIUM confidence)
- [OpenClaw npm](https://www.npmjs.com/package/openclaw) -- version 2026.3.11+ (MEDIUM confidence)
- [OpenClaw ClawHub Skill Format](https://github.com/openclaw/clawhub/blob/main/docs/skill-format.md) -- YAML metadata schema (MEDIUM confidence)

All findings are WebSearch-sourced and cross-referenced across 3+ independent results. Could not verify via Context7 (OpenClaw not indexed). Official docs URLs consistent across sources but direct page fetch was not available.

---
*Stack research for: Ducket AI Galactica v2.1 -- OpenClaw Integration*
*Researched: 2026-03-22*
