# Phase 15: OpenClaw Workspace + Skills - Research

**Researched:** 2026-03-22
**Domain:** OpenClaw agent workspace files (SOUL.md, SKILL.md), CLI wrapper scripts in Node.js (ESM)
**Confidence:** MEDIUM (SOUL.md/SKILL.md format verified via official docs; CLI wrapper pattern inferred from project conventions — no complex new libraries needed)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLAW-01 | OpenClaw workspace configured with SOUL.md defining Ducket agent identity and mission | SOUL.md format confirmed: plain markdown with Core Truths/Boundaries/Vibe sections. Identity content derived from CLAUDE.md project context. |
| CLAW-02 | Three OpenClaw skills registered as SKILL.md files (scan, classify, escrow) with correct YAML frontmatter | SKILL.md frontmatter verified: required fields are `name` and `description`. Optional `metadata.openclaw` for env/bin gating. Skill directories go in `<workspace>/skills/`. |
| CLAW-03 | CLI wrapper scripts (cli-scan.js, cli-classify.js, cli-escrow.js) bridge OpenClaw exec tool to existing agent modules | Existing modules are ESM (`"type": "module"`) with top-level await. CLI wrappers must use `import()` and handle process.exit(0/1). No new dependencies needed. |
</phase_requirements>

---

## Summary

Phase 15 creates an OpenClaw workspace for the Ducket agent by adding three categories of new files only — zero modifications to any existing file. The workspace lives at `agent/openclaw/` (a new directory). It contains a `SOUL.md` defining the Ducket agent identity, a `skills/` subdirectory with three `SKILL.md` files (one per pipeline step), and a `scripts/` subdirectory with three CLI wrapper scripts.

OpenClaw's workspace and skill formats are plain-text markdown. The format is intentionally simple: a YAML frontmatter block followed by natural-language instructions. No compilation, no special runtime, no new npm packages. The most technically precise requirement is that the CLI wrappers integrate with the existing ESM modules (`agent/src/scan-loop.js`, `classify.js`, `escrow.js`) which use top-level await and ES module syntax — this means the wrappers must be `.js` files with `"type": "module"` in scope (or use dynamic `import()`), and must exit with a numeric status code.

**Primary recommendation:** Create five new files — one `SOUL.md`, three `SKILL.md` directories each with one `SKILL.md`, and three `cli-*.js` wrapper scripts. Keep all wrappers as thin shims that import from existing modules and exit with 0 on success, 1 on error. Do not inline logic.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins only | Node >= 20 (already required) | CLI wrapper runtime | No new deps; project already on Node 20+ |
| OpenClaw workspace files | Plain markdown + YAML | Agent identity and skill definitions | OpenClaw's native format |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:process` | built-in | `process.exit(0/1)` in CLI wrappers | Always — each wrapper must signal success/failure |
| `dotenv` | already in `agent/package.json` | Load `.env` in CLI wrappers | Same pattern as existing modules |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dynamic ESM `import()` in wrappers | CJS `require()` | CJS won't work — `agent/` has `"type": "module"`. Dynamic import is the only correct pattern for ESM |
| Inline copy of module logic | `import` from existing module | Inline copy defeats the CLAW-03 "bridge" requirement and risks drift |

**Installation:** No new packages required. All wrappers use the same module resolution as `agent/`.

---

## Architecture Patterns

### Recommended Project Structure

```
agent/
└── openclaw/
    ├── SOUL.md                  # Agent identity (CLAW-01)
    └── skills/
        ├── ducket-scan/
        │   └── SKILL.md         # Scan skill definition (CLAW-02)
        ├── ducket-classify/
        │   └── SKILL.md         # Classify skill definition (CLAW-02)
        └── ducket-escrow/
            └── SKILL.md         # Escrow skill definition (CLAW-02)

agent/scripts/                   # CLI wrappers (CLAW-03)
├── cli-scan.js
├── cli-classify.js
└── cli-escrow.js
```

> **Note on workspace path:** OpenClaw discovers skills from `<workspace>/skills/`. The workspace root should be whatever directory OpenClaw is pointed at — for this project, `agent/openclaw/` is the natural home since it keeps all OpenClaw artifacts under `agent/`. Skills must be in `agent/openclaw/skills/<skill-name>/SKILL.md`.

> **Note on CLI wrapper location:** The success criteria says `node cli-scan.js` should work standalone. Place scripts in `agent/scripts/` and document the invocation path in SKILL.md. The exact path prefix matters for the `node` command in Phase 16's exec integration.

### Pattern 1: SOUL.md — Agent Identity File

**What:** A plain markdown file with no frontmatter. Read by OpenClaw at session start to establish agent persona and boundaries. Loaded every session.

**When to use:** Once per workspace — defines WHO the agent is, not what it can do (skills define that).

**Content structure (based on official OpenClaw template):**
```markdown
# [Agent Name]

## Identity
[Who this agent is and its primary mission — 2-3 sentences]

## Mission
[The specific job: safe P2P ticket resale pipeline]

## Pipeline
[The three-step flow this agent runs: scan → classify → escrow]

## Core Truths
[Operational principles: explain decisions, surface all reasoning, never route around WDK wallet]

## Boundaries
[What the agent never does: no human-triggered fund movement, no modifying case files after settlement]
```

**Source:** [OpenClaw SOUL.md template](https://docs.openclaw.ai/reference/templates/SOUL.md) — HIGH confidence on structure; content is project-specific.

### Pattern 2: SKILL.md — Skill Definition File

**What:** A markdown file with YAML frontmatter. Lives in `skills/<skill-name>/SKILL.md`. Defines when and how the agent should invoke a specific capability.

**When to use:** One per skill (capability). Describes inputs, workflow, output format, and failure handling in natural language.

**Minimum valid SKILL.md:**
```yaml
---
name: ducket-scan
description: Scrape StubHub, Viagogo, and Facebook Marketplace for FIFA World Cup 2026 ticket listings and append results to LISTINGS.md.
---

# Ducket Scan

## When to use
[Natural language conditions for invocation]

## Inputs
[What parameters or environment variables are needed]

## Workflow
[Step-by-step instructions in natural language]

## Output
[What the agent should expect back]

## Failure handling
[How to handle errors]
```

**Frontmatter fields confirmed by official docs:**

| Field | Required | Type | Purpose |
|-------|----------|------|---------|
| `name` | YES | string (snake_case) | Unique skill identifier |
| `description` | YES | string | One-line summary shown to agent |
| `metadata.openclaw.requires.env` | NO | string[] | Env vars needed (e.g. `ANTHROPIC_API_KEY`) |
| `metadata.openclaw.requires.bins` | NO | string[] | Binaries that must be on PATH |
| `metadata.openclaw.emoji` | NO | string | Display emoji |
| `user-invocable` | NO | boolean | Makes skill appear in slash commands |

**Source:** [OpenClaw Skills documentation](https://docs.openclaw.ai/tools/skills.md) — HIGH confidence. [ClawHub skill format](https://github.com/openclaw/clawhub/blob/main/docs/skill-format.md) — HIGH confidence for extended fields.

**YAML parsing caveat (HIGH confidence):** The OpenClaw YAML parser does NOT support multi-line frontmatter values. Values with colons must be quoted. Example:
```yaml
# WRONG — colon in value breaks parser
description: Scan tickets. Use when: agent needs listings

# CORRECT
description: "Scan tickets. Use when: agent needs listings"
```
Source: [GitHub issue #22134](https://github.com/openclaw/openclaw/issues/22134) — skills with YAML parse errors are silently dropped with no feedback. This is a critical pitfall.

### Pattern 3: CLI Wrapper — ESM Bridge Script

**What:** A standalone Node.js script (`node cli-scan.js`) that imports from the existing agent module and exits with a status code. No business logic — thin shim only.

**When to use:** One per skill. Provides the `node` command that OpenClaw's exec tool can call.

**Template for `cli-scan.js`:**
```javascript
// Ducket AI Galactica — CLI Wrapper: Scan
// Apache 2.0 License
//
// Thin shim that invokes the scan pipeline once (single cycle, no cron).
// Exit 0 = success, Exit 1 = error.
// Run with: node agent/scripts/cli-scan.js

import * as dotenv from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env'), quiet: true });

// Import only the scan helpers needed for a single cycle (not the cron loop)
// The cron loop runs indefinitely — the CLI wrapper must call a discrete function
import { scrapeStubHub } from '../tools/scrape-stubhub.js';
import { scrapeViagogo } from '../tools/scrape-viagogo.js';
import { scrapeFacebook } from '../tools/scrape-facebook.js';

async function run() {
  const EVENT_NAME = process.env.EVENT_NAME ?? 'FIFA World Cup 2026';
  // ... single scan cycle logic ...
  process.exit(0);
}

run().catch((err) => {
  console.error('[cli-scan] Error:', err.message);
  process.exit(1);
});
```

**Critical design constraint for `cli-scan.js`:** The existing `scan-loop.js` uses top-level await AND starts a node-cron job — it runs forever and cannot be `import()`'d as a library without executing the loop. The CLI wrapper for scan must re-implement the single-cycle logic by importing the scraper tools and classifier directly, NOT by importing `scan-loop.js`. The other two wrappers (`cli-classify.js`, `cli-escrow.js`) can import from `classify.js` and `escrow.js` directly since those export named functions.

**Template for `cli-classify.js`:**
```javascript
// Ducket AI Galactica — CLI Wrapper: Classify
// Apache 2.0 License
//
// Accepts a JSON listing from stdin or a --listing flag and classifies it.
// Exit 0 = success (prints JSON result to stdout), Exit 1 = error.
// Run with: node agent/scripts/cli-classify.js

import { classifyListing } from '../src/classify.js';
import * as dotenv from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env'), quiet: true });

async function run() {
  // Accept mock listing as demo input
  const listing = { source: 'mock', platform: 'StubHub', /* ... */ };
  const result = await classifyListing(listing);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

run().catch((err) => {
  console.error('[cli-classify] Error:', err.message);
  process.exit(1);
});
```

**Template for `cli-escrow.js`:**
```javascript
// Ducket AI Galactica — CLI Wrapper: Escrow
// Apache 2.0 License
//
// Smoke-tests the escrow module: calls dispatchEscrowAction with a mock listing.
// Demonstrates the full deposit → classify → enforce flow without a cron scheduler.
// Exit 0 = success, Exit 1 = error or skipped (insufficient balance is not an error).
// Run with: node agent/scripts/cli-escrow.js

import { dispatchEscrowAction } from '../src/escrow.js';
import * as dotenv from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env'), quiet: true });

async function run() {
  // Use a mock listing — demo never fails on network issues
  const listing = { url: 'https://demo.ducket.test/listing/1', platform: 'Ducket', sellerAddress: null };
  const result = await dispatchEscrowAction({
    category: 'SCALPING_VIOLATION',
    listing,
    caseFilePath: null,
    timestamp: Date.now(),
  });
  if (result) {
    console.log('[cli-escrow] Escrow dispatched:', result.etherscanLink);
  } else {
    console.log('[cli-escrow] Escrow skipped (insufficient balance or dry-run)');
  }
  process.exit(0);
}

run().catch((err) => {
  console.error('[cli-escrow] Error:', err.message);
  process.exit(1);
});
```

### Anti-Patterns to Avoid

- **Importing scan-loop.js in cli-scan.js:** `scan-loop.js` has top-level await that starts a cron job and runs forever. Importing it executes the loop. The CLI wrapper must call scrapers directly.
- **CJS syntax (`require`) in any agent/ file:** The entire `agent/` package has `"type": "module"`. Any `require()` call throws `ERR_REQUIRE_ESM`.
- **Multi-line YAML frontmatter values:** OpenClaw silently drops skills with YAML parse errors. All frontmatter values that contain colons must be quoted.
- **Putting CLI wrappers inside the openclaw workspace directory:** OpenClaw scans `skills/` for SKILL.md files. Plain `.js` files in that path are ignored, but keeping the workspace clean prevents confusion. CLI wrappers go in `agent/scripts/`.
- **Modifying existing files:** CLAW-01 through CLAW-03 (and the phase success criteria) explicitly require all changes to be additive. Do not touch `scan-loop.js`, `classify.js`, `escrow.js`, or any dashboard files.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing for SKILL.md | Custom YAML validator | OpenClaw reads it natively | SKILL.md is read by OpenClaw, not by project code |
| Agent identity management | Custom config loader | SOUL.md plain markdown | OpenClaw injects SOUL.md automatically at session start |
| Skill registry | Custom discovery mechanism | `skills/<name>/SKILL.md` directory convention | OpenClaw auto-discovers by folder structure |
| Process lifecycle in CLI wrappers | Daemon management | `process.exit(0/1)` | Wrappers must be discrete-exit scripts, not daemons |

**Key insight:** OpenClaw's entire workspace format is plain-text markdown. There is nothing to install, compile, or register. The skill discovery is purely filesystem-based. The CLI wrappers are the only code to write, and they are thin shims over existing modules.

---

## Common Pitfalls

### Pitfall 1: Importing scan-loop.js as a module

**What goes wrong:** `cli-scan.js` does `import '../src/scan-loop.js'` and the process hangs forever because the cron job starts and never exits.

**Why it happens:** `scan-loop.js` uses top-level await to run `await runScanCycle()` and then `cron.schedule(...)` — both execute at import time.

**How to avoid:** The `cli-scan.js` wrapper must import the underlying scraper tools (`scrape-stubhub.js`, `scrape-viagogo.js`, `scrape-facebook.js`) and the classifier/escrow functions directly. Implement one discrete scan cycle inline in the wrapper, or extract a `runOnce()` function from `scan-loop.js` (but that would modify an existing file, violating the phase constraint). The cleanest approach is to call the scrapers directly in the wrapper.

**Warning signs:** The `node cli-scan.js` command does not return to the shell prompt.

### Pitfall 2: YAML parse errors silently drop skills

**What goes wrong:** A SKILL.md is created with a description containing a colon (e.g., `description: Scan listings. Use when: agent needs data`). OpenClaw silently ignores the skill file with no error message.

**Why it happens:** OpenClaw's embedded YAML parser treats `key: value` patterns strictly. An unquoted colon in a value creates a nested key.

**How to avoid:** Always wrap description strings in double quotes. Test with `openclaw skills check` after creating skills.

**Warning signs:** `openclaw skills list` does not show the skill after creation.

### Pitfall 3: ESM vs CJS module resolution in CLI wrappers

**What goes wrong:** A wrapper uses `require()` or omits a file extension in an import path, causing `ERR_REQUIRE_ESM` or `ERR_MODULE_NOT_FOUND`.

**Why it happens:** `agent/package.json` has `"type": "module"`. All `.js` files in the `agent/` subtree are treated as ESM. ESM requires explicit file extensions in import paths.

**How to avoid:** All imports must use `import` syntax with explicit `.js` extensions (e.g., `import { classifyListing } from '../src/classify.js'`). Never omit the extension.

**Warning signs:** Error on `node agent/scripts/cli-classify.js`: `Cannot use import statement in a module` or `require is not defined`.

### Pitfall 4: Missing __dirname in ESM wrappers

**What goes wrong:** A wrapper tries `__dirname` but gets `ReferenceError: __dirname is not defined` — it's a CJS global, not available in ESM.

**Why it happens:** ESM modules don't have `__dirname` or `__filename`. This matters for loading `.env` from the project root.

**How to avoid:** Use the `fileURLToPath` + `dirname` pattern (already established in the existing agent modules):
```javascript
import { dirname } from 'node:path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
```

**Warning signs:** `dotenv.config()` can't find `.env` and environment variables are undefined.

---

## Code Examples

Verified patterns from the existing codebase (the wrappers MUST follow these conventions):

### ESM File Header Pattern (from scan-loop.js)
```javascript
// Ducket AI Galactica — [Module Name]
// Apache 2.0 License
//
// [Description]
// Run with: node agent/scripts/cli-X.js

import * as dotenv from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env'), quiet: true });
```

### Importing Named Exports from classify.js
```javascript
// Source: agent/src/classify.js exports
import { classifyListing, classifyByRules } from '../src/classify.js';
// classifyListing(listing) → Promise<{ category, confidence, reasoning, classificationSource, signals }>
// classifyByRules(listing) → { category, confidence, reasoning, classificationSource, signals } (sync)
```

### Importing Named Exports from escrow.js
```javascript
// Source: agent/src/escrow.js exports
import { dispatchEscrowAction, depositEscrow, makeEscrowId } from '../src/escrow.js';
// dispatchEscrowAction({ category, listing, caseFilePath, timestamp }) → Promise<result|null>
// Returns null if insufficient balance — not an error, safe to exit 0
```

### Importing Scraper Tools (for cli-scan.js)
```javascript
// Source: agent/tools/scrape-*.js
import { scrapeStubHub } from '../tools/scrape-stubhub.js';
import { scrapeViagogo } from '../tools/scrape-viagogo.js';
import { scrapeFacebook } from '../tools/scrape-facebook.js';
// All return: Promise<Listing[]> — designed to never throw (catch internally)
```

### SOUL.md Content Derivation (from CLAUDE.md)
The Ducket agent identity comes from `CLAUDE.md`:
- **Mission:** Safe P2P ticket resale — buyer locks USDT in escrow, AI agent verifies ticket legitimacy, smart contract releases or refunds automatically
- **Core pipeline:** List → Lock USDT → AI Verify → Settle (no human triggers)
- **Priority:** Agent Intelligence first, then WDK wallet integration
- **Hard rule:** WDK mandatory, seller never touches buyer funds, escrow is agent-driven and conditional

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Skills as code plugins | Skills as plain markdown SKILL.md files | OpenClaw v2 (2025) | No compilation step; skills are instructions, not code |
| Agent identity in system prompt | SOUL.md injected at session start | OpenClaw workspace concept | Persistent identity across sessions without prompt duplication |
| Global skill registry | Filesystem-based discovery (`skills/<name>/SKILL.md`) | OpenClaw v1 | Workspace-local skills override global ones — no central registry needed |

**Deprecated/outdated:**
- Registering skills via `openclaw skills install`: Only needed for marketplace skills. Local workspace skills are auto-discovered from the `skills/` directory — no install command required.

---

## Open Questions

1. **Should cli-scan.js duplicate runScanCycle() or stay minimal?**
   - What we know: `scan-loop.js` exports nothing — it runs as a script with top-level await. A single-cycle scan requires calling all three scrapers + dedup + classifyListing + dispatchEscrowAction.
   - What's unclear: How much of the full pipeline should `cli-scan.js` replicate vs. how minimal it should be for Phase 15 (Phase 16 handles full integration).
   - Recommendation: For Phase 15 (CLAW-03 only), keep `cli-scan.js` minimal — just call the three scrapers with `Promise.allSettled`, log the results, and exit 0. Full pipeline integration is Phase 16's job (CLAW-04).

2. **Where exactly should the openclaw workspace directory live?**
   - What we know: OpenClaw discovers skills from `<workspace>/skills/` where workspace is the directory pointed to at startup. The project has `agent/` as the agent root.
   - What's unclear: Whether OpenClaw should be configured to treat `agent/openclaw/` or `agent/` as workspace root.
   - Recommendation: Use `agent/openclaw/` as the workspace root. This keeps OpenClaw artifacts separated from agent source code. The SKILL.md instructions then reference `node agent/scripts/cli-X.js` for execution paths.

---

## Validation Architecture

nyquist_validation is enabled in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js custom test runner (no external framework) |
| Config file | None — tests run via `node agent/tests/test-X.js` |
| Quick run command | `node agent/tests/test-classify.js` |
| Full suite command | `node agent/tests/test-classify.js && node agent/tests/test-evidence.js && node agent/tests/test-pipeline.js` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLAW-01 | SOUL.md exists with correct sections | smoke | `node -e "import('node:fs').then(fs=>fs.promises.access('agent/openclaw/SOUL.md')).then(()=>console.log('PASS')).catch(()=>{console.error('FAIL');process.exit(1)})"` | ❌ Wave 0 |
| CLAW-02 | Three SKILL.md files exist with valid YAML frontmatter | smoke | `node agent/scripts/check-skills.js` (to be created) | ❌ Wave 0 |
| CLAW-03 | cli-scan.js exits 0 | smoke | `node agent/scripts/cli-scan.js && echo PASS` | ❌ Wave 0 |
| CLAW-03 | cli-classify.js exits 0 with JSON output | smoke | `node agent/scripts/cli-classify.js && echo PASS` | ❌ Wave 0 |
| CLAW-03 | cli-escrow.js exits 0 (balance insufficient is OK) | smoke | `node agent/scripts/cli-escrow.js && echo PASS` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `node agent/tests/test-classify.js` (existing tests must still pass)
- **Per wave merge:** `node agent/tests/test-classify.js && node agent/scripts/cli-classify.js && node agent/scripts/cli-scan.js`
- **Phase gate:** All three CLI wrappers exit 0 + SOUL.md and SKILL.md files present

### Wave 0 Gaps

- [ ] `agent/openclaw/SOUL.md` — covers CLAW-01
- [ ] `agent/openclaw/skills/ducket-scan/SKILL.md` — covers CLAW-02
- [ ] `agent/openclaw/skills/ducket-classify/SKILL.md` — covers CLAW-02
- [ ] `agent/openclaw/skills/ducket-escrow/SKILL.md` — covers CLAW-02
- [ ] `agent/scripts/cli-scan.js` — covers CLAW-03
- [ ] `agent/scripts/cli-classify.js` — covers CLAW-03
- [ ] `agent/scripts/cli-escrow.js` — covers CLAW-03

*(All seven deliverables are new files — no existing test infrastructure covers them. The existing test suite (`test-classify.js`, etc.) must remain green and is the regression guard.)*

---

## Sources

### Primary (HIGH confidence)
- [docs.openclaw.ai/tools/skills.md](https://docs.openclaw.ai/tools/skills.md) — SKILL.md minimum required frontmatter (`name`, `description`), command-dispatch pattern
- [docs.openclaw.ai/tools/skills-config.md](https://docs.openclaw.ai/tools/skills-config.md) — Skill discovery paths, `<workspace>/skills/` convention, env var injection
- [docs.openclaw.ai/reference/templates/SOUL.md](https://docs.openclaw.ai/reference/templates/SOUL.md) — SOUL.md section structure (Core Truths, Boundaries, Vibe, Continuity)
- [github.com/openclaw/clawhub/blob/main/docs/skill-format.md](https://github.com/openclaw/clawhub/blob/main/docs/skill-format.md) — Extended frontmatter fields (`metadata.openclaw.requires.*`, `emoji`, `homepage`, `always`, `skillKey`)
- `agent/src/scan-loop.js`, `classify.js`, `escrow.js` — Export signatures, ESM patterns, `__dirname` workaround, error handling conventions

### Secondary (MEDIUM confidence)
- [lumadock.com/tutorials/build-custom-openclaw-skills](https://lumadock.com/tutorials/build-custom-openclaw-skills) — SKILL.md production template with workflow/inputs/output/failure sections; skill directory structure confirmed
- [openclawlab.com/en/docs/tools/skills/](https://openclawlab.com/en/docs/tools/skills/) — Skills CLI commands (`openclaw skills list`, `openclaw skills check`)

### Tertiary (LOW confidence — needs validation)
- [github.com/openclaw/openclaw/issues/22134](https://github.com/openclaw/openclaw/issues/22134) — Silent YAML parse error behavior; confirms skills are dropped without feedback (single source — validate with `openclaw skills check` during implementation)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all patterns from official OpenClaw docs and existing project code
- Architecture: HIGH — SOUL.md/SKILL.md format verified from official templates; CLI wrapper patterns from existing codebase conventions
- Pitfalls: MEDIUM — ESM/CJS pitfalls are HIGH (verified); silent YAML drop is LOW (single GitHub issue source)

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days — OpenClaw workspace format is stable; skill YAML spec unlikely to change)
