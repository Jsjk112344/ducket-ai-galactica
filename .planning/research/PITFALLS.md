# Domain Pitfalls — OpenClaw Integration into Existing Agent System

**Domain:** Adding OpenClaw as agent orchestration framework to a working autonomous fraud detection + USDT escrow platform
**Researched:** 2026-03-22
**Confidence:** MEDIUM — OpenClaw is a rapidly-evolving project with daily releases; some findings based on community reports and architecture analysis rather than direct testing. The fundamental architectural mismatch (gateway daemon vs embedded library) is HIGH confidence.

---

## Critical Pitfalls

Mistakes that cause the demo to break, the submission to be disqualified, or hours of wasted time on deadline day.

---

### Pitfall C1: OpenClaw Is a Gateway Daemon, Not an Embeddable Library

**What goes wrong:**
The developer tries to `npm install openclaw` and import it programmatically into `agent/src/scan-loop.js` as a library to replace the node-cron loop. OpenClaw is not designed this way. It is a standalone gateway daemon with its own process lifecycle, WebSocket control plane, session management, and channel routing. There is no `import { Agent } from 'openclaw'` API. The Plugin SDK (`openclaw/plugin-sdk`) registers tools that the gateway loads at runtime — it does not expose an agent loop you can call from your own code.

**Why it happens:**
The SUBMISSION.md claims "OpenClaw orchestrates three skills" and "OpenClaw agent loop replacing node-cron scan cycle." This implies OpenClaw runs inside the agent process. In reality, OpenClaw runs as a separate daemon and agents interact with it via skills (markdown instruction files) and plugins (TypeScript modules loaded by the gateway). The conceptual model in the submission does not match OpenClaw's actual architecture.

**Consequences:**
- Hours spent trying to find a programmatic API that does not exist
- If OpenClaw is installed as a global CLI and started as a daemon, it runs its OWN process — it cannot directly call `classifyListing()` or `dispatchEscrowAction()` from the existing codebase without an IPC bridge
- The existing scan-loop.js pipeline (scrape -> classify -> escrow) would need to be decomposed into separate skills/tools that OpenClaw's gateway can invoke, which is a major refactor

**Prevention:**
- Do NOT attempt to embed OpenClaw as a library inside the agent process
- Instead, use one of two viable integration patterns:
  1. **Skills-only approach (RECOMMENDED for hackathon):** Create SKILL.md files in the workspace that describe the scraping, classification, and escrow tasks. OpenClaw's agent reads these as instructions and uses existing tools (bash, node scripts) to execute them. The existing `scan-loop.js` becomes a script that OpenClaw's cron invokes.
  2. **Plugin approach:** Write an OpenClaw plugin that registers custom tools wrapping the existing functions. More work but deeper integration.
- For the hackathon deadline TODAY: wrap the existing pipeline as an OpenClaw skill that the gateway invokes via its cron system, rather than replacing the pipeline internals

**Detection:**
- `import openclaw from 'openclaw'` fails or returns the gateway constructor, not an agent SDK
- Looking for `Agent`, `Skill`, or `AgentLoop` exports from the openclaw package and finding none
- OpenClaw's `package.json` shows it is a CLI tool (`"bin": {"openclaw": ...}`) not a library

**Confidence:** HIGH — verified via npm package structure, official docs, and multiple community sources

---

### Pitfall C2: Node.js Version Requirement Mismatch

**What goes wrong:**
OpenClaw requires Node >= 22 (Node 24 recommended). The existing project specifies `"engines": {"node": ">=20.0.0"}`. If the development or judge environment runs Node 20 or 21, OpenClaw will fail to install or crash at runtime with syntax errors (it uses Node 22+ features like `import.meta.resolve` or native fetch enhancements).

**Why it happens:**
OpenClaw is ESM-only and uses bleeding-edge Node.js APIs. The existing project was built for Node 20+ compatibility. These two version floors are incompatible.

**Consequences:**
- `npm install` succeeds but `openclaw` commands crash with `SyntaxError` or `TypeError` at runtime
- Judges running Node 20 (common LTS) cannot start the OpenClaw gateway
- The "runnable out of the box" hard constraint is violated

**Prevention:**
- If using OpenClaw, update `engines` in root `package.json` to `"node": ">=22.0.0"` and document this in README
- Verify the existing WDK wallet, ethers.js, and Patchright all work on Node 22 before committing to the version bump
- If Node 22 cannot be guaranteed in the judge environment, OpenClaw integration is not viable — use a lighter wrapper

**Detection:**
- `node -v` returns < 22
- OpenClaw startup logs show `ERR_UNSUPPORTED_DIR_IMPORT` or similar Node version errors

**Confidence:** HIGH — Node >= 22 requirement is documented on npm and in official install guides

---

### Pitfall C3: OpenClaw Gateway Startup Blocks Demo Flow

**What goes wrong:**
OpenClaw's gateway requires an onboarding wizard (`openclaw onboard`) that interactively asks about workspace, channels, model provider, and API keys. This is not scriptable in a one-command `npm run demo` setup. The hackathon requires "runnable out of the box" — an interactive wizard violates this.

**Why it happens:**
OpenClaw is designed for personal AI assistant use cases where users configure it once. Hackathon projects need zero-config startup. The gateway also installs itself as a launchd/systemd service, which is inappropriate for a hackathon demo.

**Consequences:**
- `npm run demo` cannot start the OpenClaw gateway without prior interactive setup
- Judges encounter a wizard prompt instead of the running demo
- The demo fails the "out of the box" hard constraint

**Prevention:**
- Pre-configure the OpenClaw workspace and commit the configuration files (but NOT API keys)
- Create a startup script that checks for OpenClaw config, creates it programmatically if missing, and starts the gateway in foreground mode (not as a daemon)
- OR: Skip the gateway entirely and use OpenClaw's skill file format as a documentation/architecture pattern without actually running the gateway. The SUBMISSION.md claims can be satisfied by having skill files that describe the orchestration, with the actual execution still handled by the existing node-cron loop
- This is the safest approach for deadline day: keep the working scan-loop.js, add SKILL.md files that describe the skills, and reference OpenClaw's architecture in the submission

**Detection:**
- Running `npx openclaw` prompts for interactive input
- No `~/.openclaw` or workspace config directory exists

**Confidence:** HIGH — gateway wizard is the documented primary setup path

---

### Pitfall C4: Breaking the Working WDK Integration by Changing the Process Model

**What goes wrong:**
The WDK wallet singleton (`agent/src/wallet/index.ts`) holds keys in memory for the lifetime of the process. If OpenClaw runs as a separate gateway daemon that invokes skills/tools in child processes, each invocation creates a NEW WDK wallet instance. The wallet singleton pattern breaks. Worse: if the OpenClaw gateway and the agent run as separate processes, the gateway cannot access the WDK wallet's in-memory keys.

**Why it happens:**
The existing architecture assumes a single long-lived Node.js process: `scan-loop.js` starts, creates the WDK wallet singleton, and holds it for all subsequent escrow operations. OpenClaw's gateway model runs tools as separate invocations (via bash/node scripts or plugin functions), each of which would need to re-initialize the wallet.

**Consequences:**
- WDK wallet re-initialized on every skill invocation = slower (HD key derivation), more error-prone
- `depositEscrow()` called from a skill invocation might race with `slashEscrow()` from another invocation
- The `bondDeposited` / `bondSlashed` in-memory state flags in `scan-loop.js` are lost between invocations
- Nonce conflicts on Sepolia if two parallel skill invocations submit transactions simultaneously

**Prevention:**
- Keep the existing single-process model. OpenClaw integration should be at the orchestration layer, NOT the execution layer
- If using OpenClaw skills: the skill should invoke `node agent/src/scan-loop.js` as a single long-running process, not decompose it into separate per-step invocations
- Never split the scan-classify-escrow pipeline across separate process boundaries — the WDK wallet singleton and in-memory state flags require a single process
- The organizer bond state (`bondDeposited`, `bondSlashed`, `bondEscrowId`) is process-scoped — any architecture that restarts the process loses this state

**Detection:**
- `Error: ESCROW_WALLET_SEED env var is required` appearing in skill invocation logs
- Duplicate deposit transactions on Sepolia (nonce already used)
- Bond deposit happening on every scan cycle instead of once on startup

**Confidence:** HIGH — direct analysis of the existing codebase architecture

---

### Pitfall C5: Last-Minute Framework Integration Breaks a Working Demo

**What goes wrong:**
The existing system works. Scan-loop runs autonomously, classifications happen, escrow actions fire on Sepolia. Attempting to add OpenClaw as the orchestration layer on deadline day (March 22) risks breaking this working system for zero functional benefit. Every minute spent debugging OpenClaw integration is a minute not spent on submission quality.

**Why it happens:**
The SUBMISSION.md already claims OpenClaw is used. The developer feels obligated to make the claims true rather than adjusting the claims. Sunk cost fallacy: "we already wrote OpenClaw in the submission, so we have to integrate it."

**Consequences:**
- Working demo breaks and cannot be recovered before deadline
- Time spent on framework plumbing instead of improving classification quality, escrow coverage, or demo polish
- If OpenClaw integration half-works, judges see error logs from the gateway alongside the working agent — worse than no OpenClaw at all

**Prevention:**
- **Decision gate (NOW):** Can OpenClaw be integrated in < 2 hours with zero risk to the existing pipeline? If NO, adjust the submission claims instead.
- The safest approach: add SKILL.md files that describe the three skills (scraping, classification, escrow) and reference OpenClaw as the "architecture pattern" without actually running the gateway. Update SUBMISSION.md to say "OpenClaw-inspired skill architecture" or "designed for OpenClaw orchestration" rather than "OpenClaw orchestrates"
- If proceeding with integration: do it on a git branch. If it works in 2 hours, merge. If not, abandon the branch and adjust the submission
- NEVER modify `scan-loop.js`, `classify.js`, or `escrow.js` directly for OpenClaw integration — these are the working pipeline

**Detection:**
- More than 1 hour spent and no working OpenClaw-orchestrated scan cycle yet
- Existing `npm run demo` no longer starts cleanly
- Agent terminal output shows OpenClaw gateway errors alongside scan-loop output

**Confidence:** HIGH — universal hackathon risk pattern, amplified by the architectural mismatch

---

## Moderate Pitfalls

---

### Pitfall M1: OpenClaw Skill Files Are Instructions, Not Code

**What goes wrong:**
The developer creates `skills/scraping/SKILL.md` expecting to write executable TypeScript inside it. OpenClaw skills are markdown instruction files — they tell the agent WHAT to do using existing tools, not HOW to do it with code. A skill cannot `import { scrapeStubHub } from '../tools/scrape-stubhub.js'`. It can only instruct the agent to run a shell command or use a registered tool.

**Why it happens:**
The mental model of "skills = functions" is natural for developers. But OpenClaw skills are closer to system prompts than to code modules. They teach the LLM agent what steps to take and which tools to use.

**Prevention:**
- Skills should reference shell commands: "Run `node agent/tools/scrape-stubhub.js` to scrape StubHub listings"
- The actual execution logic stays in the existing `.js` files
- Skills are documentation that the agent follows, not code that runs

**Confidence:** HIGH — verified via official OpenClaw skills documentation

---

### Pitfall M2: OpenClaw's ESM-Only Package Conflicts with createRequire Pattern

**What goes wrong:**
The existing `escrow.js` uses `createRequire(import.meta.url)` to load JSON artifacts (compiled ABI, deployed addresses). OpenClaw is ESM-only and its plugin SDK uses ESM imports exclusively. If OpenClaw's plugin loader processes the agent code, it may apply stricter ESM rules that conflict with the `createRequire` pattern, which is technically a CJS bridge.

**Why it happens:**
OpenClaw uses `jiti` for runtime TypeScript loading in plugins. Jiti may handle `createRequire` differently than Node.js's native ESM loader. The existing code works because Node.js natively supports `createRequire` in ESM modules, but a plugin runtime may not.

**Prevention:**
- If writing an OpenClaw plugin, convert JSON imports to `import ... with { type: 'json' }` (Node 22+) or `fs.readFileSync` + `JSON.parse`
- If using the skills-only approach, this is a non-issue since the existing code runs in its own Node.js process

**Confidence:** MEDIUM — depends on whether OpenClaw's plugin runtime uses jiti or native Node ESM

---

### Pitfall M3: OpenClaw Cron vs node-cron Conflict

**What goes wrong:**
Both OpenClaw's built-in cron system and the existing `node-cron` schedule the same scan cycle. Listings are scraped twice per interval, classifications run twice, escrow deposits attempt to fire twice. Duplicate `escrowId` causes contract reverts (`FraudEscrow.deposit()` reverts on duplicate escrowId).

**Why it happens:**
The developer adds OpenClaw's cron configuration but forgets to remove the `cron.schedule('*/5 * * * *', runScanCycle)` call in `scan-loop.js`. Two independent schedulers now trigger the same function.

**Prevention:**
- If OpenClaw's cron is used: remove the `node-cron` schedule from `scan-loop.js` and export `runScanCycle` as a callable function
- If keeping node-cron: do not configure OpenClaw's cron for the same task
- The deduplication set (`seen`) in `scan-loop.js` prevents duplicate listings within a session, but duplicate escrow deposits use timestamp-based escrowIds that differ by milliseconds — dedup does not prevent duplicate deposits

**Detection:**
- Contract revert errors: "escrowId already exists" appearing twice per cycle
- Double console output for every scan cycle
- WDK wallet balance draining at 2x the expected rate

**Confidence:** HIGH — direct analysis of the escrowId generation logic (`makeEscrowId` uses timestamp, so parallel invocations produce different IDs and both succeed)

---

### Pitfall M4: OpenClaw Configuration File Instability

**What goes wrong:**
OpenClaw's JSON configuration files can be automatically modified or corrupted on restart. If the gateway is stopped and restarted during a demo, the configuration may change, breaking model provider settings, workspace paths, or skill references.

**Why it happens:**
OpenClaw writes to its config files during runtime (updating session state, cron jobs, etc). If the process is killed mid-write (Ctrl+C during demo), the JSON may be truncated or invalid.

**Prevention:**
- Keep a backup copy of the working OpenClaw config and restore it before each demo run
- Use a startup script that validates config integrity before launching the gateway
- For the hackathon: this is another argument for not running the gateway at all

**Detection:**
- Gateway fails to start with JSON parse errors
- Skills that were configured disappear after restart
- Model provider settings reset to defaults

**Confidence:** MEDIUM — based on community reports of configuration instability

---

## Minor Pitfalls

---

### Pitfall L1: OpenClaw Daily Releases Break Pinned Versions

**What goes wrong:**
OpenClaw ships daily releases with potential breaking changes. Running `npm install` on a different day than the initial setup may pull a newer version that changes the plugin SDK surface, skill loading behavior, or cron semantics.

**Prevention:**
- Pin the exact OpenClaw version in `package.json`: `"openclaw": "2026.3.8"` (not `^2026.3.8`)
- Run `npm ci` instead of `npm install` for reproducible builds
- For hackathon: this is yet another reason to minimize OpenClaw dependency surface area

**Confidence:** HIGH — daily release cadence confirmed via npm and GitHub releases

---

### Pitfall L2: OpenClaw Memory Pruning Loses Agent Context

**What goes wrong:**
OpenClaw prunes tool outputs to optimize caching. If the agent's classification reasoning is stored in OpenClaw's session context, it may be pruned after several cycles, causing the agent to "forget" prior classifications and re-classify already-processed listings.

**Prevention:**
- The existing `evidence.js` module writes case files to disk — this is the correct persistence pattern
- Do not rely on OpenClaw's session memory for classification state
- The `isCaseFileExists()` idempotency check in `scan-loop.js` is the correct guard — keep it regardless of OpenClaw integration

**Confidence:** MEDIUM — based on community reports of OpenClaw memory issues

---

### Pitfall L3: OpenClaw Security Vulnerabilities in the Skill Ecosystem

**What goes wrong:**
OpenClaw's public skill marketplace (ClawHub) has had malicious skills distributed (CVE-2026-25253, 335 malicious skills). Installing community skills without review introduces security risk.

**Prevention:**
- Only use custom-written skills specific to this project — never install skills from ClawHub
- All skill files should be committed to the repo and reviewed
- For this project: the three custom skills (scraping, classification, escrow) should be written from scratch, not adapted from community templates

**Confidence:** HIGH — CVE is documented and publicly reported

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| OpenClaw installation | C2: Node version mismatch | Verify Node >= 22 before starting; update engines field |
| Gateway setup | C3: Interactive wizard blocks demo | Pre-configure or skip gateway entirely |
| Skill creation | M1: Skills are instructions, not code | Write SKILL.md files that reference existing scripts |
| Cron migration | M3: Dual cron firing | Remove node-cron if OpenClaw cron is active; never both |
| WDK wallet integration | C4: Process model breaks singleton | Keep single-process model; never split pipeline across processes |
| Last-minute integration | C5: Breaking working demo | 2-hour time-box on git branch; abandon if not working |
| Plugin development | M2: ESM/CJS conflict | Use skills approach instead of plugin for hackathon |

---

## Recommended Integration Strategy (Hackathon-Safe)

Given the constraints (deadline TODAY, working system, no UI changes allowed), the safest OpenClaw integration is:

1. **Add SKILL.md files** in `agent/skills/` that describe the three capabilities (scraping, classification, escrow) using OpenClaw's skill format
2. **Keep the existing scan-loop.js** as the actual execution engine
3. **Add a thin OpenClaw wrapper** that imports/invokes the existing pipeline functions, making the code technically "OpenClaw-orchestrated" without changing the working architecture
4. **Do NOT run the OpenClaw gateway** as a separate daemon — it adds complexity and failure modes
5. **Update SUBMISSION.md** language if needed to accurately reflect the integration level

The goal is to satisfy the submission's OpenClaw claims with minimal risk to the working demo.

---

## "Looks Integrated But Isn't" Checklist

- [ ] SKILL.md files exist in the workspace and follow OpenClaw's format (YAML frontmatter + markdown instructions)
- [ ] The scan-loop.js pipeline still runs end-to-end without OpenClaw gateway running
- [ ] No node-cron + OpenClaw cron dual-firing (only one scheduler is active)
- [ ] WDK wallet singleton is never re-initialized between skill invocations
- [ ] `npm run demo` starts without requiring `openclaw onboard` or interactive setup
- [ ] No OpenClaw gateway errors appear in terminal alongside agent output
- [ ] Existing escrow transactions on Sepolia still work (test deposit/refund cycle)
- [ ] Bond state (`bondDeposited`, `bondSlashed`) persists across scan cycles (single process)
- [ ] `npm install` in a clean clone on Node 20 still works (if OpenClaw is optional)
- [ ] SUBMISSION.md claims about OpenClaw match what the code actually does

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| OpenClaw gateway won't start | ABANDON (0 min) | Remove openclaw dependency, keep SKILL.md files as documentation, adjust submission |
| Dual cron fires duplicate escrow | LOW (15 min) | Remove `cron.schedule()` from scan-loop.js OR remove OpenClaw cron config |
| WDK wallet broken by process split | MEDIUM (30 min) | Revert to single-process scan-loop.js; undo any multi-process decomposition |
| Node 22 requirement breaks judge setup | HIGH (cannot fix) | Must either downgrade OpenClaw usage to skill files only (no gateway) or require Node 22 in README |
| OpenClaw config corrupted | LOW (5 min) | Restore config from backup or re-run setup |
| Working demo broken by integration attempt | LOW (1 min) | `git checkout main` — the working system is on main branch |
| Submission claims don't match code | LOW (15 min) | Update SUBMISSION.md to accurately describe the integration level |

---

## Sources

- [OpenClaw npm package](https://www.npmjs.com/package/openclaw) — ESM-only, Node >= 22, daily releases — HIGH confidence
- [OpenClaw Skills documentation](https://docs.openclaw.ai/tools/skills) — skill format, SKILL.md structure, loading mechanism — HIGH confidence
- [OpenClaw Cron Jobs documentation](https://docs.openclaw.ai/automation/cron-jobs) — cron configuration, session targeting — HIGH confidence
- [OpenClaw Plugin documentation](https://docs.openclaw.ai/tools/plugin) — plugin SDK, TypeScript modules loaded by gateway — HIGH confidence
- [OpenClaw AGENTS.md](https://github.com/openclaw/openclaw/blob/main/AGENTS.md) — multi-agent routing, workspace isolation — MEDIUM confidence
- [OpenClaw NPM Package Developer Guide](https://macaron.im/blog/openclaw-npm-package) — programmatic usage limitations, Plugin SDK is the stable API — MEDIUM confidence
- [Common OpenClaw Pitfalls](https://vertu.com/ai-tools/common-openclaw-pitfalls-and-how-to-fix-them/) — configuration instability, memory pruning — MEDIUM confidence
- [OpenClaw Security Analysis](https://www.reco.ai/blog/openclaw-the-ai-agent-security-crisis-unfolding-right-now) — CVE-2026-25253, malicious skills — HIGH confidence
- [WDK Build with AI docs](https://docs.wdk.tether.io/start-building/build-with-ai) — WDK + OpenClaw MCP integration patterns — MEDIUM confidence
- Direct codebase analysis: `agent/src/scan-loop.js`, `agent/src/wallet/index.ts`, `agent/src/escrow.js`, `agent/src/classify.js`, `agent/package.json`, `docs/SUBMISSION.md` — HIGH confidence

---
*Pitfalls research for: OpenClaw integration into existing autonomous agent system*
*Researched: 2026-03-22 (v2.1 OpenClaw Integration milestone)*
