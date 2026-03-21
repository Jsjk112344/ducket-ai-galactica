# Feature Landscape: OpenClaw Integration for Ducket AI Galactica

**Domain:** Agent orchestration framework integration for existing autonomous fraud detection + USDT escrow platform
**Researched:** 2026-03-22
**Confidence:** MEDIUM (OpenClaw docs accessed via search summaries only; WebFetch denied)
**Focus:** What OpenClaw adds beyond the existing node-cron scan loop

---

## Context: What Is Already Built (v1.0/v2.0 -- Not To Rebuild)

These are existing dependencies. OpenClaw integration wraps them, never replaces them.

| Built Capability | What It Provides to OpenClaw Integration |
|-----------------|----------------------------------------|
| `scan-loop.js` — node-cron 5-min heartbeat | Orchestration logic to be replaced by agent loop; scraper calls preserved |
| `scrape-*.js` — 3 platform scrapers (StubHub, Viagogo, Facebook) | Functions wrapped as OpenClaw skills |
| `classify.js` — hybrid rules + Claude classifier with 5 weighted signals | Classification function wrapped as OpenClaw skill |
| `escrow.js` — WDK deposit, release, refund, slash on Sepolia | Escrow functions wrapped as OpenClaw skill |
| `evidence.js` — timestamped case file writer | Evidence function wrapped as OpenClaw skill |
| In-memory `seen` Set for deduplication | Replaced by OpenClaw session JSONL persistence |
| `LISTINGS.md` append log | Replaced by session transcript |
| React dashboard + Express API | Unchanged -- reads results written by agent |

---

## Table Stakes

Features that OpenClaw MUST deliver to justify integration. If these don't work, the migration is net-negative because the existing cron pipeline already handles them.

| Feature | Why Expected | Complexity | Dependency on Existing | Notes |
|---------|--------------|------------|----------------------|-------|
| **Skill-based pipeline decomposition** | The whole point of adopting a framework -- wrapping scan, classify, escrow, evidence into discrete OpenClaw skills | Medium | Wraps `scrape-*.js`, `classify.js`, `escrow.js`, `evidence.js` as individual skills | Each skill is a `SKILL.md` file with YAML frontmatter + natural language instructions. The description field is the primary trigger mechanism. |
| **Agent loop replacing cron** | OpenClaw's agentic loop (intake -> context assembly -> model inference -> tool execution -> persistence) replaces the node-cron 5-min heartbeat | Medium | Replaces `scan-loop.js` orchestration; preserves all function calls inside skills | OpenClaw Gateway supports native cron scheduling -- jobs persist under `~/.openclaw/cron/` and survive restarts. Three patterns: one-shot, interval-based, cron expressions. |
| **Session persistence across runs** | Agent must remember what it has already scanned/classified across restarts -- currently lost when process dies (in-memory `seen` Set) | Low | Replaces the ephemeral `seen` Set with JSONL transcript persistence | Sessions stored as append-only JSONL at `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`. Context compaction summarizes older conversation. Eliminates "restart = re-scan everything." |
| **MCP tool integration** | OpenClaw has native MCP server support -- custom tools defined in TypeScript callable from agent loop | Low | WDK wallet ops and Claude API classification become MCP tools | Configure MCP servers in `openclaw.json`. Custom servers can be written in TypeScript using official MCP SDKs. |
| **Hooks for audit and control** | PreToolUse and PostToolUse hooks intercept every skill invocation for logging, validation, security | Low | Replaces `console.log` audit trail with structured hook-based logging | PreToolUse fires BEFORE tool execution (can block). PostToolUse fires AFTER (audit logging). Also: `before_model_resolve`, `before_prompt_build`, `session_start/end`. |

### How Skills Look in Code

An OpenClaw skill is a directory containing a `SKILL.md` file:

```
agent/skills/
  scan-platforms/
    SKILL.md
  classify-listing/
    SKILL.md
  enforce-escrow/
    SKILL.md
  write-evidence/
    SKILL.md
```

Each `SKILL.md` has YAML frontmatter + natural language instructions:

```yaml
---
name: scan-platforms
description: "Scan StubHub, Viagogo, and Facebook Marketplace for ticket listings matching a given event. Use when the agent needs to discover new listings for fraud analysis. Triggers on scheduled scan cycles or when a new event is registered."
version: 1.0.0
---

# Scan Platforms Skill

Scrape all three ticket resale platforms for the target event.
Use Promise.allSettled so one blocked platform does not kill the others.
Deduplicate results by URL hash against previously seen listings.
Return only net-new listings for classification.

## Steps
1. Call scrapeStubHub, scrapeViagogo, scrapeFacebook with the event name
2. Merge results, filter duplicates against session memory
3. Return the fresh listing array for downstream classification
```

**CRITICAL YAML pitfall:** Values containing `: ` (colon + space) in the description field are interpreted as nested YAML mappings unless quoted. Skills with YAML parse errors are silently dropped with no user feedback (confirmed: openclaw/openclaw#22134). Always quote description values.

### How the Agent Decides When to Invoke Skills

OpenClaw injects a compact XML list of eligible skills into the system prompt (base overhead: ~195 characters + ~97 characters per skill plus description length). The LLM decides which skills to invoke based on conversation context and skill descriptions. This is fundamentally different from cron -- the agent reasons about WHAT to do, not just executes a hardcoded sequence.

For Ducket: the cron trigger sends a message to the agent session ("Time for your scheduled scan"). The LLM matches this to the `scan-platforms` skill via description matching, then chains: scan -> classify each listing -> enforce escrow for flagged ones -> write evidence. The LLM orchestrates this chain based on skill descriptions, not hardcoded `runScanCycle()` function calls.

Skill loading precedence: `<workspace>/skills` (highest) -> `~/.openclaw/skills` -> bundled skills (lowest). Extra dirs configurable via `skills.load.extraDirs` in `openclaw.json`. Skills snapshot on session start and reuse that list for subsequent turns.

### Agent Loop Lifecycle vs Cron

The existing `scan-loop.js` lifecycle:
```
node-cron timer fires -> runScanCycle() -> scrape -> classify -> enforce -> log -> wait 5 min
```

The OpenClaw agent loop lifecycle:
```
1. INTAKE:      Cron trigger sends message to agent session
2. CONTEXT:     Gateway loads session JSONL, compacts if needed, assembles system prompt + skill list
3. INFERENCE:   LLM reasons about what to do (which skills, in what order, with what parameters)
4. EXECUTION:   Agent invokes skills via tool calls, each skill runs the wrapped function
5. STREAMING:   Results stream back, agent reasons about outcomes (retry? escalate? continue?)
6. PERSISTENCE: Session state saved to JSONL, cron job marked complete
```

**Key differences:**
- Steps 2-3 are entirely new: the agent REASONS about what to do, not just executes a hardcoded sequence
- Step 5 allows adaptive behavior: the agent can change its plan mid-execution based on results
- Step 6 gives durable state: no more losing progress on restart
- This directly serves hackathon judging criteria #1 (Agent Intelligence/autonomy)

---

## Differentiators

Features OpenClaw enables which the existing cron pipeline cannot do. These make the integration worth the effort for hackathon judges.

| Feature | Value Proposition | Complexity | Dependency on Existing | Notes |
|---------|-------------------|------------|----------------------|-------|
| **Explainable agent decision chain** | Full session transcript showing WHY the agent chose to scan, classify, and enforce -- not just WHAT it did | Low | Replaces `console.log` breadcrumbs with structured JSONL session transcript | JSONL transcripts capture every model inference, tool call, and result. Judges can inspect the full reasoning chain. Directly serves criterion #1. |
| **Adaptive scan reasoning** | Agent decides scan behavior based on context -- e.g., increase frequency closer to event date, skip platforms known to be blocked | Medium | Enhances fixed 5-min cron with LLM-driven decisions | Currently scan runs every 5 min regardless. With OpenClaw, the agent can reason: "StubHub blocked last 3 cycles, skip and focus on Viagogo." |
| **Multi-step tool chaining with error recovery** | Agent loop handles tool failures gracefully -- retries, falls back, or escalates based on LLM reasoning | Low | Improves on current `try/catch` fallback in `classify.js` and `Promise.allSettled` in `scan-loop.js` | Agent can reason: "Viagogo scraper failed, I'll rely on StubHub and Facebook results and note reduced confidence." |
| **Context compaction and memory flush** | Before context window fills, agent writes important state to persistent memory files | Low | Replaces ephemeral `seen` Set + `LISTINGS.md` append pattern | Memory flush writes state to `memory/YYYY-MM-DD.md`. Classification history persists properly across sessions. |
| **Gateway-managed process lifecycle** | OpenClaw Gateway owns the process -- handles restarts, crash recovery, session resumption | Medium | Replaces manual `SIGINT`/`SIGTERM` handlers in `scan-loop.js` | Gateway persists cron jobs across restarts. No more "restart process = lose all seen listings." |
| **Webhook delivery for scan results** | Cron job results POSTed to HTTP endpoint -- feeds dashboard without polling | Medium | Could replace Express polling with webhook push | `delivery.mode = "webhook"` + `delivery.to = "<url>"` on cron jobs. Nice-to-have, not essential. |

---

## Anti-Features

Features to explicitly NOT build during this integration.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full multi-agent architecture** | Inter-session communication (`sessions_send`) and supervisor agents are over-scoped for hackathon deadline. Complexity explosion for marginal judge impact. | Single agent with multiple skills. One session, one loop. Skills provide separation of concerns. |
| **Chat-based interaction with the agent** | OpenClaw is designed for conversational agents on WhatsApp/Telegram/etc. Ducket's agent is autonomous -- no human in the loop. Building a chat UI contradicts the "no human triggers" design principle. | Use OpenClaw's cron trigger to start scans. Agent talks to itself through skills. Dashboard remains read-only. |
| **ClawHub community skill installation** | 13,729 community skills exist but none solve ticket fraud detection. Installing random skills adds attack surface and judge confusion. | Write 4-5 custom skills specific to Ducket's pipeline. Keep the skill set minimal and auditable. |
| **Browser automation via OpenClaw** | OpenClaw has built-in browser tools (headless Chromium). But Ducket already uses Patchright for scraping with XHR interception -- a superior pattern for anti-bot evasion on StubHub/Viagogo. Switching would regress scraping quality. | Keep Patchright scrapers as-is. Wrap them in OpenClaw skills that call existing scraper functions. |
| **Memory/knowledge base/RAG features** | OpenClaw supports vector search and knowledge bases. Over-engineered for ~100 listings per scan at hackathon scale. | Use existing `LISTINGS.md` + case files + session persistence. |
| **Plugin system (Gateway extensions)** | OpenClaw plugins are TypeScript/JS extensions compiled into the Gateway. Harder for judges to follow than skills. | Skills (SKILL.md) are the right abstraction -- natural language, easy to read, no compilation step. |
| **Webhook delivery to dashboard** | Pushing results via webhook sounds better than polling, but the dashboard already works with Express endpoints + 30s polling. Changing the data flow risks breaking the demo. | Keep Express API serving dashboard data. Agent writes results to files that Express reads. |

---

## Feature Dependencies

```
Gateway setup -> Cron job configuration -> Agent session creation
                                                    |
                                                    v
Skills definition (4x SKILL.md files) -----> Agent loop activation
    |             |            |              |
    v             v            v              v
scan-platforms   classify     enforce-escrow  write-evidence
(wraps           (wraps       (wraps          (wraps
 scrape-*.js)     classify.js) escrow.js)      evidence.js)
    |
    v
Session persistence (JSONL) replaces in-memory `seen` Set
    |
    v
Hooks (PreToolUse/PostToolUse) for structured audit logging
```

**Critical path:** Gateway setup -> Skills -> Cron trigger -> Agent loop. Everything else layers on top.

**Dependency on existing code:** All four skills wrap existing functions. No existing code needs rewriting -- only wrapping. The `scan-loop.js` orchestration logic moves into the agent loop, but the actual scraping/classification/escrow/evidence functions stay identical.

---

## Session Persistence Model

| Aspect | Current (scan-loop.js) | With OpenClaw |
|--------|----------------------|---------------|
| Dedup state | In-memory `seen` Set -- lost on restart | JSONL transcript -- persists across restarts |
| Scan history | LISTINGS.md append log -- reset on restart (`flag: 'w'`) | Session transcript + memory flush to persistent files |
| Classification results | Case files in `agent/cases/` (durable) | Same case files + session transcript showing reasoning chain |
| Escrow state | In-memory `bondDeposited`/`bondSlashed` flags -- lost on restart | Session state in JSONL -- recoverable, queryable |
| Error context | `console.error` to stdout -- lost | Structured in session transcript with tool call/result pairing |

---

## Mapping to Existing Pipeline

| Existing Component | OpenClaw Equivalent | Migration Effort |
|-------------------|---------------------|-----------------|
| `scan-loop.js` (orchestration) | Agent loop + cron trigger | Medium -- rewrite orchestration, keep functions |
| `scan-loop.js` (cron scheduling) | OpenClaw Gateway cron | Low -- configure in `openclaw.json` |
| `scrape-*.js` (3 scrapers) | `scan-platforms` skill calling existing functions | Low -- wrap, don't rewrite |
| `classify.js` (hybrid rules+Claude) | `classify-listing` skill calling `classifyListing()` | Low -- wrap, don't rewrite |
| `escrow.js` (WDK + ethers) | `enforce-escrow` skill calling existing functions | Low -- wrap, don't rewrite |
| `evidence.js` (case file writer) | `write-evidence` skill calling `writeCaseFile()` | Low -- wrap, don't rewrite |
| `index.ts` (wallet init) | Agent startup hook or `session_start` lifecycle event | Low -- move to hook |
| In-memory `seen` Set | Session JSONL persistence (automatic) | Zero -- OpenClaw handles this |
| `LISTINGS.md` append log | Session transcript + optional file write | Low |
| `console.log` audit trail | Session JSONL + PostToolUse hooks | Low -- structured by default |

---

## MVP Recommendation

Prioritize (in order):

1. **Skill-based pipeline decomposition** -- Table stakes. Define 4 skills wrapping existing functions. This is the minimum viable OpenClaw integration and the most visible to judges.

2. **Agent loop replacing cron** -- Table stakes. Configure OpenClaw Gateway cron to trigger scan cycles. Without this, there is no reason to have OpenClaw.

3. **Session persistence** -- Table stakes. Let OpenClaw's JSONL handle dedup state. Eliminates the "restart loses state" weakness. Zero implementation effort -- comes free with the framework.

4. **Explainable decision chain** -- Differentiator. The JSONL session transcript showing the agent's reasoning chain is the strongest hackathon demo feature. Judges see WHY the agent acted, not just WHAT it did.

5. **PostToolUse audit hooks** -- Differentiator. Replace `console.log` with structured event logging per skill invocation. Low effort, high judge impression.

**Defer:**
- **Adaptive scan reasoning**: Impressive but risky -- LLM might make bad scheduling decisions during a 5-minute demo. Keep fixed cron intervals for reliability.
- **Inter-session communication**: Over-scoped for deadline. Single session is sufficient.
- **Webhook delivery**: Dashboard already works with polling. Don't break it.
- **Context compaction**: Only matters for long-running agents. Hackathon demo is 5 minutes.

---

## Complexity Budget

| Feature | Estimated Effort | Risk | Priority |
|---------|-----------------|------|----------|
| Write 4 SKILL.md files | 1-2 hours | LOW -- just markdown with YAML | Must-have |
| Configure Gateway + cron | 1-2 hours | MEDIUM -- first-time setup, env config | Must-have |
| Wire skills to existing functions (MCP tools) | 2-3 hours | MEDIUM -- MCP tool wrapping, import paths | Must-have |
| Session persistence (automatic) | 0 hours | LOW -- OpenClaw provides by default | Free |
| PostToolUse audit hooks | 1 hour | LOW -- straightforward hook registration | Should-have |
| Verify demo flow works end-to-end | 1-2 hours | HIGH -- integration bugs, timing issues | Must-have |
| **Total** | **5-10 hours** | | |

---

## Sources

- [OpenClaw Skills Documentation](https://docs.openclaw.ai/tools/skills) -- MEDIUM confidence (search summaries)
- [OpenClaw Agent Loop](https://docs.openclaw.ai/concepts/agent-loop) -- MEDIUM confidence (search summaries)
- [OpenClaw Session Management (DeepWiki)](https://deepwiki.com/openclaw/openclaw/2.4-session-management) -- MEDIUM confidence
- [OpenClaw Cron Jobs](https://docs.openclaw.ai/automation/cron-jobs) -- MEDIUM confidence (search summaries)
- [OpenClaw Skill Format Spec](https://github.com/openclaw/clawhub/blob/main/docs/skill-format.md) -- HIGH confidence (official repo)
- [OpenClaw npm package](https://www.npmjs.com/package/openclaw) -- HIGH confidence (npm registry)
- [OpenClaw GitHub AGENTS.md](https://github.com/openclaw/openclaw/blob/main/AGENTS.md) -- HIGH confidence (official repo)
- [YAML parse error silent drop issue #22134](https://github.com/openclaw/openclaw/issues/22134) -- HIGH confidence (official issue tracker)
- [Claude Agent SDK TypeScript](https://github.com/anthropics/claude-agent-sdk-typescript) -- HIGH confidence (official Anthropic repo)
- [OpenClaw Architecture Overview (Substack)](https://ppaolo.substack.com/p/openclaw-system-architecture-overview) -- LOW confidence (third-party analysis)

**Confidence note:** WebFetch was denied during research, so official docs were not directly read. All OpenClaw-specific claims are MEDIUM confidence based on web search summaries and should be validated against actual documentation during implementation.

---
*Feature research for: OpenClaw integration into Ducket AI Galactica v2.1*
*Researched: 2026-03-22*
