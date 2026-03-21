# Architecture: OpenClaw Integration

**Domain:** OpenClaw agent orchestration layer for existing fraud detection + USDT escrow platform
**Researched:** 2026-03-22
**Confidence:** MEDIUM (OpenClaw docs verified via multiple web sources; integration patterns inferred from architecture docs + existing codebase inspection)

---

## How OpenClaw Works (Summary for This Integration)

OpenClaw is a config-first, local-first AI agent framework. Its core model:

1. **Workspace files** define agent behavior: `SOUL.md` (identity/purpose), `AGENTS.md` (operating instructions), `TOOLS.md` (tool notes), `HEARTBEAT.md` (periodic checklist)
2. **Skills** are modular SKILL.md files with YAML frontmatter that teach the agent how to accomplish tasks using tools (exec, memory, etc.)
3. **The agent loop** reads workspace files + skills, searches memory for context, builds a system prompt, ships to configured LLM (Claude), and executes tool calls (primarily `exec` for shell commands)
4. **Heartbeat** replaces cron: a configurable interval (default 30min, tunable) where the agent reads HEARTBEAT.md and performs checklist items
5. **Memory** persists across sessions via `MEMORY.md` (permanent) + daily logs `memory/YYYY-MM-DD.md` (ephemeral)
6. **Session state** is managed per session key, with context compaction when conversations get long

**Critical insight:** OpenClaw skills do NOT execute code directly. A skill is a SKILL.md file that teaches the agent what commands to run via the `exec` tool. The agent reads the skill, decides what to do, and invokes `exec` to run shell commands (e.g., `node agent/src/scan-loop.js`). This is fundamentally different from a programmatic SDK.

---

## Recommended Architecture

### Integration Strategy: Wrapper, Not Rewrite

OpenClaw wraps the existing agent pipeline via skills that invoke existing modules through the `exec` tool. The existing `classify.js`, `escrow.js`, `evidence.js`, and scraper tools remain unchanged. OpenClaw provides orchestration intelligence on top.

```
+------------------------------------------------------------------+
|                    OPENCLAW GATEWAY (daemon)                      |
|  +------------------+  +------------------+  +------------------+|
|  |    SOUL.md       |  |   AGENTS.md      |  |  HEARTBEAT.md    ||
|  | "I am Ducket AI  |  | "Operating rules |  | "Every 5 min:    ||
|  |  fraud detection  |  |  for scanning,   |  |  run scan cycle, ||
|  |  agent..."        |  |  classification, |  |  check results,  ||
|  |                   |  |  and escrow"     |  |  update memory"  ||
|  +------------------+  +------------------+  +------------------+|
|                                                                   |
|  +-------------------------------------------------------------+ |
|  |                     SKILLS LAYER                             | |
|  |  skills/                                                     | |
|  |    scan-platforms/SKILL.md   — invokes scraper scripts       | |
|  |    classify-listing/SKILL.md — invokes classify.js           | |
|  |    escrow-enforce/SKILL.md  — invokes escrow.js              | |
|  |    evidence-case/SKILL.md   — invokes evidence.js            | |
|  +-------------------------------------------------------------+ |
|           |                                                       |
|           | exec tool (shell commands)                            |
|           v                                                       |
+------------------------------------------------------------------+
           |
+----------+-------------------------------------------------------+
|          |          EXISTING AGENT (Node.js ESM)                  |
|  +-------v-------+  +-------------+  +------------+  +----------+|
|  | scan-loop.js  |  | classify.js |  | escrow.js  |  |evidence.js|
|  | (scan cycle   |  | (5-signal   |  | (WDK+ethers|  |(case file ||
|  |  function)    |  |  scoring)   |  |  lifecycle)|  | writer)   ||
|  +---------------+  +------+------+  +------+-----+  +----------+|
|                            |                |                     |
|                     +------v------+  +------v------+              |
|                     | Claude API  |  | WDK Wallet  |              |
|                     | (reasoning) |  | (escrow tx) |              |
|                     +-------------+  +-------------+              |
+-------------------------------------------------------------------+
           |
+----------v--------------------------------------------------------+
|           EXPRESS API (dashboard/server/api.ts) — port 3001       |
|  GET /api/listings   POST /api/listings   GET /api/wallet         |
|  GET /api/cases/:h   POST /api/escrow/deposit                     |
+-------------------------------------------------------------------+
           |
+----------v--------------------------------------------------------+
|           DASHBOARD (React 19 / Vite 8) — port 5173               |
+-------------------------------------------------------------------+
```

### Key Architectural Decision: Heartbeat vs. Direct Agent Loop

**Option A (Recommended): Heartbeat replaces node-cron**
- Configure OpenClaw heartbeat interval to 5 minutes (matches current cron)
- HEARTBEAT.md checklist: "Run scan cycle, classify new listings, enforce escrow"
- The agent reads HEARTBEAT.md, decides what to do, and invokes exec to run a scan script
- Advantage: agent has autonomy to decide whether to scan, skip, or prioritize

**Option B (Rejected): OpenClaw as pure orchestrator calling functions directly**
- OpenClaw does not have a programmatic Node.js SDK for direct function invocation
- Skills teach the agent to run commands, not import modules
- Trying to make OpenClaw call `classifyListing()` directly would require building a CLI wrapper anyway

**Option C (Rejected): Keep node-cron, add OpenClaw only for classification reasoning**
- Defeats the purpose: hackathon judges want to see the agent framework doing orchestration
- Splitting control between node-cron and OpenClaw creates confusing architecture

---

## Component Boundaries

### New Files to Create

| File | Purpose | Location |
|------|---------|----------|
| `SOUL.md` | Agent identity: "I am Ducket AI, a fraud detection agent..." | `agent/openclaw/SOUL.md` |
| `AGENTS.md` | Operating instructions: scan rules, classification thresholds, escrow logic | `agent/openclaw/AGENTS.md` |
| `HEARTBEAT.md` | 5-minute checklist: scan, classify, enforce, log | `agent/openclaw/HEARTBEAT.md` |
| `TOOLS.md` | Notes about available tools (node, scrapers, env vars) | `agent/openclaw/TOOLS.md` |
| `skills/scan-platforms/SKILL.md` | Skill: how to invoke the three platform scrapers | `agent/openclaw/skills/scan-platforms/SKILL.md` |
| `skills/classify-listing/SKILL.md` | Skill: how to invoke classify.js on a listing | `agent/openclaw/skills/classify-listing/SKILL.md` |
| `skills/escrow-enforce/SKILL.md` | Skill: how to invoke escrow.js for deposit/release/refund/slash | `agent/openclaw/skills/escrow-enforce/SKILL.md` |
| `skills/evidence-case/SKILL.md` | Skill: how to write/update case files via evidence.js | `agent/openclaw/skills/evidence-case/SKILL.md` |
| `agent/src/cli-scan.js` | CLI entry point for single scan cycle (exec-friendly) | `agent/src/cli-scan.js` |
| `agent/src/cli-classify.js` | CLI entry point: accepts listing JSON, outputs classification JSON | `agent/src/cli-classify.js` |
| `agent/src/cli-escrow.js` | CLI entry point: accepts escrow command + params, executes | `agent/src/cli-escrow.js` |
| `openclaw.json` | OpenClaw gateway config: model, workspace, heartbeat interval | project root |

### Existing Files to Modify

| File | Change | Scope |
|------|--------|-------|
| `agent/src/scan-loop.js` | Extract `runScanCycle()` as importable + add CLI invocation guard | Small: add `if (import.meta.url === ...)` gate |
| `agent/package.json` | Add `openclaw` to dependencies, add CLI scripts | Small: 3-4 lines |
| Root `package.json` | Add openclaw dev dependency + workspace script | Small: 2-3 lines |

### Files NOT Modified

| File | Why Unchanged |
|------|---------------|
| `agent/src/classify.js` | Already exports `classifyListing()` and `classifyByRules()` cleanly |
| `agent/src/escrow.js` | Already exports all lifecycle functions; CLI wrapper calls these |
| `agent/src/evidence.js` | Already exports `writeCaseFile()` and helpers |
| `agent/src/wallet/index.ts` | WDK singleton pattern unchanged; escrow.js still lazy-imports it |
| `dashboard/server/api.ts` | Express API unchanged; it already imports from agent/src/ directly |
| All scraper tools | Already standalone scripts with clean exports |

---

## Data Flow: OpenClaw Agent Loop

### Heartbeat Cycle (Every 5 Minutes)

```
1. OpenClaw daemon triggers heartbeat
2. Agent reads HEARTBEAT.md checklist:
   "- Run scan cycle for {EVENT_NAME}
    - Classify any new listings
    - Enforce escrow on fraud above threshold
    - Log results to daily memory"
3. Agent decides to execute scan (reads scan-platforms skill)
4. Agent runs: exec("node agent/src/cli-scan.js")
   - cli-scan.js calls runScanCycle() from scan-loop.js
   - Returns JSON: { scanned: 12, new: 3, listings: [...] }
5. Agent reads classify-listing skill
6. For each new listing, agent runs:
   exec("node agent/src/cli-classify.js '${JSON.stringify(listing)}'")
   - cli-classify.js calls classifyListing() from classify.js
   - Returns JSON: { category, confidence, reasoning, signals }
7. Agent evaluates result against threshold (from AGENTS.md instructions)
8. If fraud detected, agent reads escrow-enforce skill and runs:
   exec("node agent/src/cli-escrow.js deposit --listing-url '${url}'")
   exec("node agent/src/cli-escrow.js slash --escrow-id '${id}'")
9. Agent writes summary to daily memory log
```

### Key Data Flow Change: CLI Wrappers

The critical new layer is CLI entry points that bridge OpenClaw's exec-based tool invocation with the existing module exports:

```javascript
// agent/src/cli-scan.js (NEW)
// Imports runScanCycle() from scan-loop.js, runs it, outputs JSON to stdout
import { runScanCycle } from './scan-loop.js';
const result = await runScanCycle();
console.log(JSON.stringify(result));

// agent/src/cli-classify.js (NEW)
// Reads listing JSON from argv[2] or stdin, classifies, outputs result JSON
import { classifyListing } from './classify.js';
const listing = JSON.parse(process.argv[2] || await readStdin());
const result = await classifyListing(listing);
console.log(JSON.stringify(result));

// agent/src/cli-escrow.js (NEW)
// Reads command + params from argv, dispatches to escrow.js functions
import { depositEscrow, slashEscrow, refundEscrow, releaseEscrow } from './escrow.js';
const [command, ...args] = process.argv.slice(2);
// dispatch based on command...
```

### scan-loop.js Modification

The existing `scan-loop.js` runs top-level await and starts node-cron on import. For OpenClaw integration, it needs a guard so the function can be imported without auto-starting the cron loop:

```javascript
// At the bottom of scan-loop.js, replace the current initialization block:

// Export for CLI/OpenClaw invocation
export { runScanCycle };

// Only auto-start cron when run directly (not imported by CLI wrapper)
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  // ... existing initialization code (mkdir, writeFile, depositBond, cron.schedule)
}
```

---

## OpenClaw Workspace Configuration

### openclaw.json (Project Root)

```json
{
  "identity": {
    "name": "Ducket",
    "emoji": "🎫"
  },
  "agent": {
    "workspace": "./agent/openclaw",
    "model": "anthropic/claude-sonnet-4-5"
  },
  "heartbeat": {
    "every": "5m",
    "lightContext": true
  },
  "tools": {
    "exec": {
      "enabled": true,
      "timeout": 60000
    }
  }
}
```

### SOUL.md

```markdown
# Ducket AI Galactica

I am an autonomous fraud detection agent for P2P ticket resale.

## Mission
Scan secondary ticket marketplaces (StubHub, Viagogo, Facebook Marketplace),
classify listings using multi-signal risk analysis, and enforce outcomes via
USDT escrow on Sepolia -- all without human intervention.

## Decision Framework
- Composite risk score < 30: LEGITIMATE
- Composite risk score 30-65: ambiguous, use Claude API for deep analysis
- Composite risk score > 65: fraud, assign category from strongest signal
- Confidence >= 85% AND non-LEGITIMATE: trigger escrow enforcement

## Core Values
- Buyer protection is paramount
- Every decision must be explainable (case files with signal breakdowns)
- WDK wallet handles all on-chain operations (non-custodial)
- Agent-sourced face values only -- never trust seller-reported prices
```

### HEARTBEAT.md

```markdown
# Heartbeat Checklist

Every cycle:
- [ ] Run scan cycle: `node agent/src/cli-scan.js`
- [ ] Review new listings count from scan output
- [ ] For each new listing, classify: `node agent/src/cli-classify.js '<listing-json>'`
- [ ] If classification is fraud (confidence >= 85%), enforce escrow
- [ ] Log cycle summary to daily memory
- [ ] Note any scraper failures or unusual patterns
```

### SKILL.md Example (skills/scan-platforms/SKILL.md)

```yaml
---
name: scan-platforms
description: "Scan StubHub, Viagogo, and Facebook Marketplace for ticket listings"
version: 1.0.0
openclaw:
  emoji: "🔍"
  requires:
    bins:
      - node
    env:
      - EVENT_NAME
---

# Scan Platforms

## When to Use
Run this skill during every heartbeat cycle to discover new ticket listings.

## How to Run
Execute the scan CLI:
```bash
node agent/src/cli-scan.js
```

## Expected Output
JSON object with:
- `scanned`: total listings found across all platforms
- `new`: net-new listings after deduplication
- `listings`: array of listing objects

## Error Handling
If a platform scraper fails, the scan continues with remaining platforms.
The output will indicate which platforms succeeded or failed.
```

---

## Session State Management

### What State Exists Today

| State | Current Location | Lifecycle |
|-------|-----------------|-----------|
| Dedup set (`seen`) | In-memory Set in scan-loop.js | Process lifetime |
| Bond status | `bondDeposited`, `bondSlashed` variables | Process lifetime |
| Classified seeds cache | `_classifiedSeeds` in api.ts | Server lifetime |
| Case files | `agent/cases/*.md` on disk | Persistent |
| Listings log | `agent/memory/LISTINGS.md` | Reset each run |

### How OpenClaw Manages This

OpenClaw's memory system maps naturally to the existing state:

| State | OpenClaw Approach |
|-------|-------------------|
| Dedup set | Daily memory log (`memory/YYYY-MM-DD.md`): agent notes which URLs were already scanned |
| Bond status | `MEMORY.md`: "Bond deposited for FIFA World Cup 2026 at tx 0x..." — persists across sessions |
| Scan results | Case files remain on disk; agent reads them via exec |
| Cycle history | Daily memory logs capture each heartbeat's actions and results |

**Key change:** The in-memory `seen` Set in scan-loop.js becomes unreliable across heartbeat invocations (each exec spawns a new process). The dedup must shift to:
1. **Case file existence check** (already implemented via `isCaseFileExists()`) -- this is the primary dedup
2. **LISTINGS.md append** still works for logging, but dedup relies on case files, not in-memory Set

This is actually an improvement: case-file-based dedup persists across process restarts, while the current in-memory Set does not.

### Bond Deposit Handling

The organizer bond deposit currently runs once on scan-loop.js startup. Under OpenClaw:
- Agent checks `MEMORY.md` on first heartbeat: "Has bond been deposited?"
- If no, runs: `node agent/src/cli-escrow.js deposit-bond --event "FIFA World Cup 2026"`
- Records result in `MEMORY.md`: "Bond deposited: tx 0x..."
- On subsequent heartbeats, reads memory and skips bond deposit

---

## Express API Impact

**The Express API (dashboard/server/api.ts) requires NO changes.**

Why:
- API already imports directly from `agent/src/classify.js` and `agent/src/escrow.js`
- API does NOT depend on scan-loop.js or node-cron
- OpenClaw runs as a separate daemon process alongside the Express server
- Dashboard continues to poll `/api/listings` and `/api/wallet` as before
- Case files written by OpenClaw-triggered scans are read by the same `lookupClassification()` function

The only change is operational: instead of running `node agent/src/scan-loop.js` as a separate process, OpenClaw's heartbeat triggers the scan cycle. But the Express server does not care who writes the case files.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Trying to Use OpenClaw as a Programmatic SDK
**What:** Importing OpenClaw into scan-loop.js and calling agent functions
**Why bad:** OpenClaw is a daemon + config system, not a library. It orchestrates via exec.
**Instead:** Create CLI wrappers that OpenClaw can invoke via exec tool.

### Anti-Pattern 2: Duplicating Classification Logic in SOUL.md
**What:** Writing risk scoring rules in SOUL.md and having the LLM re-implement classify.js
**Why bad:** The existing 5-signal scoring engine is deterministic and tested. LLM re-implementation would be slower, more expensive, and less reliable.
**Instead:** SOUL.md describes the decision framework conceptually. Actual scoring runs via `node agent/src/cli-classify.js`.

### Anti-Pattern 3: Passing Large JSON Through exec Arguments
**What:** `exec("node cli-classify.js '${JSON.stringify(hugeListingObject)}'")`
**Why bad:** Shell argument length limits, escaping issues with special characters
**Instead:** Write listing to a temp JSON file, pass the file path: `exec("node cli-classify.js --file /tmp/listing-abc.json")`

### Anti-Pattern 4: Running OpenClaw Heartbeat Without lightContext
**What:** Using full context on every 5-minute heartbeat
**Why bad:** Each heartbeat consumes significant tokens loading the full workspace. At 5-minute intervals, this becomes a major token sink (documented in OpenClaw issue #11042).
**Instead:** Enable `lightContext: true` in heartbeat config. Only HEARTBEAT.md loads, not the full workspace.

### Anti-Pattern 5: Abandoning node-cron Before OpenClaw Is Verified Working
**What:** Removing scan-loop.js's cron capability before OpenClaw heartbeat is confirmed
**Why bad:** If OpenClaw integration fails, there is no fallback
**Instead:** Keep the `if (import.meta.url === ...)` guard so scan-loop.js can still run standalone with cron

---

## Build Order (Dependency-Aware)

### Phase 1: CLI Wrappers (No OpenClaw Yet)

**Files created:**
1. `agent/src/cli-scan.js` -- wraps `runScanCycle()`
2. `agent/src/cli-classify.js` -- wraps `classifyListing()`
3. `agent/src/cli-escrow.js` -- wraps escrow lifecycle functions

**Files modified:**
1. `agent/src/scan-loop.js` -- add `export { runScanCycle }` + import guard

**Verification:** Run CLI wrappers directly to confirm they work:
```bash
node agent/src/cli-scan.js              # should output scan results as JSON
echo '{"url":"...","price":100}' | node agent/src/cli-classify.js  # should output classification
```

**Rationale:** CLI wrappers are independently testable without OpenClaw. If OpenClaw integration fails, these still add value as standalone tools.

### Phase 2: OpenClaw Workspace Setup

**Files created:**
1. `openclaw.json` -- gateway config at project root
2. `agent/openclaw/SOUL.md` -- agent identity
3. `agent/openclaw/AGENTS.md` -- operating instructions
4. `agent/openclaw/TOOLS.md` -- tool notes
5. `agent/openclaw/HEARTBEAT.md` -- 5-minute checklist

**Verification:** `openclaw` daemon starts and reads workspace files without errors.

### Phase 3: Skills

**Files created:**
1. `agent/openclaw/skills/scan-platforms/SKILL.md`
2. `agent/openclaw/skills/classify-listing/SKILL.md`
3. `agent/openclaw/skills/escrow-enforce/SKILL.md`
4. `agent/openclaw/skills/evidence-case/SKILL.md`

**Verification:** OpenClaw heartbeat triggers, reads skills, and invokes CLI wrappers successfully.

### Phase 4: Memory + State Migration

**Files modified:**
1. `agent/openclaw/MEMORY.md` -- initial state (bond status, event name)

**Verification:** Bond deposit happens once, recorded in MEMORY.md, not repeated on subsequent heartbeats.

---

## Confidence Assessment

| Aspect | Confidence | Reasoning |
|--------|-----------|-----------|
| OpenClaw workspace structure (SOUL/AGENTS/HEARTBEAT/TOOLS.md) | HIGH | Consistent across 6+ independent sources |
| Skills as SKILL.md with YAML frontmatter | HIGH | Official docs + multiple tutorials confirm |
| Heartbeat replacing cron at configurable interval | HIGH | Official docs at docs.openclaw.ai/automation/cron-vs-heartbeat |
| exec tool for shell command invocation | HIGH | Official docs + multiple sources |
| lightContext for heartbeat token savings | MEDIUM | Referenced in GitHub discussion #11042, not verified in latest docs |
| Exact openclaw.json schema fields | MEDIUM | Multiple sources show slightly different schemas; `heartbeat.every` format needs verification |
| CLI wrapper pattern for bridging exec to modules | HIGH | Standard Node.js pattern; not OpenClaw-specific |
| Express API requiring no changes | HIGH | Direct codebase inspection confirms no dependency on scan-loop's cron |

---

## Sources

- [OpenClaw npm package](https://www.npmjs.com/package/openclaw)
- [OpenClaw Official Docs](https://openclaw.im/docs)
- [OpenClaw AGENTS.md Reference](https://docs.openclaw.ai/reference/AGENTS.default)
- [OpenClaw Skills Documentation](https://docs.openclaw.ai/tools/skills)
- [OpenClaw Cron vs Heartbeat](https://docs.openclaw.ai/automation/cron-vs-heartbeat)
- [OpenClaw Heartbeat Docs (GitHub)](https://github.com/openclaw/openclaw/blob/main/docs/gateway/heartbeat.md)
- [OpenClaw Memory Docs](https://docs.openclaw.ai/concepts/memory)
- [OpenClaw Configuration](https://docs.openclaw.ai/gateway/configuration)
- [OpenClaw Agent Loop Architecture (Substack)](https://practiceoverflow.substack.com/p/the-agent-loop-and-skills-how-openclaw)
- [OpenClaw Design Patterns (Substack)](https://kenhuangus.substack.com/p/openclaw-design-patterns-part-1-of)
- [OpenClaw Complete Tutorial (Towards AI)](https://pub.towardsai.net/openclaw-complete-guide-setup-tutorial-2026-14dd1ae6d1c2)
- [OpenClaw Custom Skills Guide (LumaDock)](https://lumadock.com/tutorials/build-custom-openclaw-skills)
- [OpenClaw Exec Tool](https://docs.openclaw.ai/tools/exec)
- [Heartbeat Token Sink Discussion (GitHub #11042)](https://github.com/openclaw/openclaw/discussions/11042)
- [OpenClaw Workspace Files Explained (Medium)](https://capodieci.medium.com/ai-agents-003-openclaw-workspace-files-explained-soul-md-agents-md-heartbeat-md-and-more-5bdfbee4827a)
