# Phase 1: Project Scaffold + Compliance - Research

**Researched:** 2026-03-19
**Domain:** Monorepo scaffolding, Apache 2.0 compliance, secrets hygiene, TypeScript project structure
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-01 | Apache 2.0 LICENSE file at repo root | Apache 2.0 full text retrieved from apache.org; boilerplate appendix format documented below |
| COMP-02 | All third-party services disclosed in README | Disclosure pattern documented; service list confirmed from CLAUDE.md and STATE.md |
| COMP-03 | No secrets or credentials committed to repo | Comprehensive .gitignore patterns documented; git pre-commit scan approach included |
| COMP-04 | Public GitHub repo ready for judges | GitHub public repo checklist documented; `hackathon-submit` skill maps exactly to this requirement |
</phase_requirements>

---

## Summary

Phase 1 creates all compliance and structural artifacts from scratch. The current repo contains only `CLAUDE.md` and `.planning/` — there is no `LICENSE`, no `.gitignore`, no `README.md`, and no monorepo package directories (`agent/`, `dashboard/`, `contracts/`). Every deliverable in this phase is a file-creation or directory-creation task with no existing code to integrate against.

The phase has zero technical risk. All four requirements (COMP-01 through COMP-04) are pure file operations: write the Apache 2.0 text, write a `.gitignore`, write a `README.md` with the service disclosure table, and create stub `package.json` files in each monorepo workspace. The only judgment calls are: which gitignore patterns cover the project's secret surface area, and what wording satisfies the "third-party disclosure" rule from the hackathon.

The project uses npm workspaces (not Turbo) for monorepo management — chosen for simplicity since there is no build pipeline yet and judges need a zero-setup clone experience. TypeScript 5.9 is current as of this writing; each workspace gets its own `tsconfig.json` extending a root config.

**Primary recommendation:** Create all files in a single wave. There are no dependencies between the four compliance artifacts — they can be written in parallel. Start with `.gitignore` first so no accidental secret commit can happen during the rest of the phase.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| npm workspaces | built-in | Monorepo package management | No install needed; judges clone and `npm install` from root |
| TypeScript | 5.9.3 | Language for agent and dashboard | Confirmed via `npm view typescript version` |
| Node.js | 25.8.1 (LTS: 22.x) | Runtime | Confirmed via npm registry |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | latest | Node.js type definitions | Every workspace that touches Node APIs |
| tsx | latest | Run TypeScript directly in dev | Agent development without build step |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| npm workspaces | Turbo (v2.8.19) | Turbo adds build caching but requires `turbo.json` config — overkill for a 3-day hackathon with no build pipeline yet |
| npm workspaces | pnpm workspaces | pnpm is faster but judges might not have it installed; npm is universal |
| Separate tsconfig per workspace | Single root tsconfig | Separate configs allow workspace-specific settings (e.g., React JSX for dashboard) |

**Installation (root):**
```bash
# No install needed for workspace manager — npm built-in
# Root devDependencies only:
npm install --save-dev typescript @types/node
```

---

## Architecture Patterns

### Recommended Project Structure

```
/                            # repo root
├── LICENSE                  # Apache 2.0 full text (COMP-01)
├── .gitignore               # Secrets hygiene (COMP-03)
├── README.md                # Third-party disclosure + setup (COMP-02, COMP-04)
├── package.json             # npm workspaces root (workspaces: ["agent","dashboard","contracts"])
├── tsconfig.base.json       # Shared TypeScript config extended by workspaces
├── CLAUDE.md                # Already exists
├── .planning/               # Already exists
├── agent/
│   ├── package.json         # name: "@ducket/agent", scripts: {dev, build, start}
│   ├── tsconfig.json        # extends: "../tsconfig.base.json"
│   └── src/
│       └── index.ts         # Placeholder: "Agent entry point — Phase 2"
├── dashboard/
│   ├── package.json         # name: "@ducket/dashboard", scripts: {dev, build}
│   ├── tsconfig.json        # extends: "../tsconfig.base.json", jsx: "react-jsx"
│   └── src/
│       └── index.tsx        # Placeholder: "Dashboard entry point — Phase 7"
└── contracts/
    ├── package.json         # name: "@ducket/contracts", scripts: {compile, deploy}
    ├── tsconfig.json        # extends: "../tsconfig.base.json"
    └── src/
        └── FraudEscrow.sol  # Placeholder: "Escrow contract — Phase 2"
```

### Pattern 1: npm Workspaces Root package.json

**What:** A root `package.json` with `"workspaces"` array that causes `npm install` at root to hoist shared deps and link workspace packages.
**When to use:** Any multi-package repo where `npm install` should work from root.

```json
{
  "name": "ducket-ai-galactica",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["agent", "dashboard", "contracts"],
  "scripts": {
    "dev:agent": "npm run dev --workspace=agent",
    "dev:dashboard": "npm run dev --workspace=dashboard"
  },
  "devDependencies": {
    "typescript": "^5.9.3"
  }
}
```

### Pattern 2: Workspace-Specific package.json

**What:** Each workspace declares its own name (scoped), version, and scripts. Root `npm install` makes `@ducket/agent` importable by other workspaces.
**When to use:** Always in a workspaces setup.

```json
{
  "name": "@ducket/agent",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.0.0"
  }
}
```

### Pattern 3: Shared tsconfig.base.json

**What:** Root TypeScript config that all workspaces extend. Sets shared strictness and module resolution.
**When to use:** Always in a TypeScript monorepo.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "declaration": true
  },
  "exclude": ["node_modules", "dist"]
}
```

### Pattern 4: Apache 2.0 LICENSE File

**What:** The full license text from https://www.apache.org/licenses/LICENSE-2.0.txt placed verbatim at repo root as `LICENSE`.
**When to use:** Required for COMP-01. Must be the complete text, not a summary.

The hackathon rule is "Apache 2.0 license on all code." A `LICENSE` file at root satisfies this for the whole repo.

### Pattern 5: .gitignore for Node.js + Secrets

**What:** Comprehensive gitignore covering Node.js artifacts and every secret pattern this project will produce.
**When to use:** Must exist before any `.env` file or key material is created.

```gitignore
# Node.js
node_modules/
dist/
build/
*.tsbuildinfo

# Secrets — NEVER commit these
.env
.env.*
!.env.example
*.key
*.pem
*.p12
*.pfx
*.secret
*_secret*
*_private*
*credentials*
*.keystore
wallet.json
keystore/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/

# Logs
*.log
npm-debug.log*

# Test artifacts
coverage/
.nyc_output/

# Build artifacts
*.js.map
```

Key entries for this project:
- `.env` and `.env.*` — ESCROW_WALLET_SEED and CLAUDE_API_KEY will live here (Phase 2+)
- `*.key` — any raw private key files
- `wallet.json` — WDK may write local wallet state
- `!.env.example` — whitelists the example file (positive pattern must follow negative)

### Pattern 6: README Third-Party Disclosure

**What:** A "Third-Party Services" section in README.md that lists every external service. Required for COMP-02 and the `hackathon-submit` skill.
**When to use:** Required at submission; build it now so it doesn't get missed.

Services to disclose per CLAUDE.md, STATE.md, and ROADMAP.md:
| Service | Purpose | Notes |
|---------|---------|-------|
| Anthropic Claude API | Fraud classification (CLAS-01 through CLAS-04) | Requires CLAUDE_API_KEY |
| WDK (TinyFish / Tetherto) | Non-custodial USDT wallet on Sepolia | Requires WDK configuration |
| Patchright | Anti-bot browser automation for scraping | Apache 2.0 compatible |
| OpenClaw | Autonomous agent heartbeat loop | Agent orchestration |
| Sepolia Testnet (Ethereum) | Testnet blockchain for USDT escrow | Candide/Pimlico bundler |

### Anti-Patterns to Avoid

- **Creating `.env` with real values then committing it:** Happens when developers rush. The `.gitignore` must exist before any `.env` is written.
- **Putting Apache 2.0 only in `package.json` `"license"` field:** Not sufficient — the `LICENSE` file must exist as a file at root.
- **Using placeholder `README.md` that says "TBD":** If the repo goes public before this is written, it fails the hackathon-submit checklist.
- **Setting package.json `"private": false` on workspaces:** Each workspace should be `"private": true` to prevent accidental npm publish.
- **Not including `.env.example`:** Judges need to know what environment variables to set. A `.env.example` with placeholder values (no real secrets) is both helpful and required for DEMO-04.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Secrets scanning | Custom regex to scan for leaked secrets | `.gitignore` + `git status` check before commit | git already tracks what would be committed — check the output |
| Monorepo linking | Symlinks or path aliases | npm workspaces | npm workspaces handles hoisting and `@ducket/*` resolution automatically |
| License compliance | Writing license text from memory | Copy verbatim from https://www.apache.org/licenses/LICENSE-2.0.txt | Any deviation from official text creates license validity questions |

**Key insight:** Phase 1 is entirely about file content, not code. The risk is omission (forgetting a gitignore pattern, missing a service in the disclosure table), not implementation complexity.

---

## Common Pitfalls

### Pitfall 1: .gitignore Created After Secrets Are Staged

**What goes wrong:** Developer creates `.env` file, then creates `.gitignore`. If `.env` was ever `git add`-ed before `.gitignore` existed, git tracks it even after `.gitignore` is added.
**Why it happens:** Order of operations.
**How to avoid:** Create `.gitignore` as the very first file in this phase, before any `.env` or key material.
**Warning signs:** `git status` shows `.env` as modified or staged after `.gitignore` exists.

### Pitfall 2: Incomplete Service Disclosure

**What goes wrong:** README lists Claude API and WDK but omits Patchright, OpenClaw, or Sepolia endpoints.
**Why it happens:** Services added in later phases weren't in the original mental model.
**How to avoid:** Build the disclosure table from the full ROADMAP.md now, not from what's currently implemented.
**Warning signs:** `hackathon-submit` checklist flags missing disclosures at Phase 8 — too late.

### Pitfall 3: npm workspaces `npm install` Fails for Judges

**What goes wrong:** A workspace `package.json` references a local workspace package that doesn't resolve, causing `npm install` to fail.
**Why it happens:** Workspace package names in `dependencies` must match exactly what's in the workspace's `"name"` field.
**How to avoid:** Keep inter-workspace dependencies out of Phase 1 stub packages. Only add cross-references when Phase 2+ actually needs them.
**Warning signs:** `npm install` at root exits with `npm ERR! Cannot read properties of undefined`.

### Pitfall 4: `.env.example` Missing or Has Real Values

**What goes wrong:** Either judges don't know what env vars to set (missing file) or real credentials leak (file has real values).
**How to avoid:** Create `.env.example` with all variable names set to placeholder strings (e.g., `CLAUDE_API_KEY=your_key_here`).

---

## Code Examples

### Root package.json with workspaces

```json
{
  "name": "ducket-ai-galactica",
  "version": "1.0.0",
  "private": true,
  "description": "Autonomous fraud detection agent with USDT escrow enforcement",
  "workspaces": ["agent", "dashboard", "contracts"],
  "scripts": {
    "dev:agent": "npm run dev --workspace=agent",
    "dev:dashboard": "npm run dev --workspace=dashboard",
    "build": "npm run build --workspaces --if-present"
  },
  "devDependencies": {
    "typescript": "^5.9.3"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/[owner]/ducket-ai-galactica"
  }
}
```

### .env.example (safe to commit — no real values)

```bash
# Ducket AI Galactica — Environment Variables
# Copy to .env and fill in real values (never commit .env)

# Anthropic Claude API
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-opus-4-5

# WDK Wallet
ESCROW_WALLET_SEED=twelve word seed phrase here never commit real seed
WDK_API_KEY=your_wdk_api_key_here

# Sepolia Network
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
SEPOLIA_USDT_CONTRACT=0x7169d38820dfd117c3fa1f22a697dba58d90ba06

# Agent Config
SCAN_INTERVAL_MINUTES=5
FRAUD_CONFIDENCE_THRESHOLD=85
```

### README.md Third-Party Disclosure Section

```markdown
## Third-Party Services Disclosure

This project uses the following external services. See individual service terms for usage restrictions.

| Service | Provider | Purpose | Required? |
|---------|----------|---------|-----------|
| Claude API | Anthropic | AI-powered fraud classification engine | Yes |
| WDK (Wallet Development Kit) | TinyFish / Tetherto | Non-custodial USDT wallet on Sepolia | Yes |
| Patchright | microsoft/playwright fork | Anti-bot browser automation for scraping | Yes |
| OpenClaw | OpenClaw | Autonomous agent heartbeat loop orchestration | Yes |
| Sepolia Testnet | Ethereum Foundation | Testnet blockchain for USDT escrow (no real funds) | Yes |

All third-party services are used in accordance with their respective terms of service.
No mainnet funds are used — Sepolia testnet only.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Lerna monorepo | npm workspaces (built-in) | npm 7+ (2020) | No extra tool install needed |
| Separate tsconfig inheritance via `paths` | `extends` in tsconfig | TypeScript 3+ | Simpler, no hacks needed |
| `.npmignore` for secret exclusion | `.gitignore` as source of truth | Always | `.gitignore` is what matters for repo security |

**Deprecated/outdated:**
- Lerna: Still exists but npm workspaces replaces its core feature for this use case
- `"files"` field in package.json for secret exclusion: Controls what npm publishes, NOT what git tracks — irrelevant here since packages are `private: true`

---

## Open Questions

1. **GitHub repo visibility timing**
   - What we know: COMP-04 requires the repo to be public
   - What's unclear: Should the repo be made public during Phase 1, or at Phase 8 (submission)? Making it public at Phase 1 means partial code is visible throughout development.
   - Recommendation: Make it public at the end of Phase 1 once LICENSE and .gitignore are in place. Any partial code visible is acceptable — the important thing is no secrets are committed.

2. **`.env.example` variable completeness at Phase 1**
   - What we know: Full variable list isn't known until Phase 2+ (WDK, scraper configs)
   - What's unclear: Should `.env.example` list only known variables now, or leave placeholders for future phases?
   - Recommendation: Include all variables visible in REQUIREMENTS.md and STATE.md now. Update in each subsequent phase as new vars are added. This is better than creating a stub that becomes stale.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None yet — Wave 0 creates scaffold checks |
| Config file | None — see Wave 0 |
| Quick run command | `git status --short \| grep -E "\.env\|\.key\|secret" \|\| echo "clean"` |
| Full suite command | `npm install --dry-run && ls LICENSE README.md .gitignore` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-01 | LICENSE file contains Apache 2.0 text | smoke | `cat LICENSE \| grep -q "Apache License" && echo PASS \|\| echo FAIL` | Wave 0 |
| COMP-02 | README lists all disclosed services | smoke | `cat README.md \| grep -q "Third-Party" && echo PASS \|\| echo FAIL` | Wave 0 |
| COMP-03 | No secrets in git status | smoke | `git status --short \| grep -vE "^\?\? \|^M " \| grep -E "\.env\|\.key" && echo FAIL \|\| echo PASS` | Wave 0 |
| COMP-04 | npm install succeeds from root | smoke | `npm install --dry-run` | Wave 0 |

### Sampling Rate

- **Per task commit:** `git status --short | grep -E "\.env|\.key|secret" || echo "clean"`
- **Per wave merge:** `npm install --dry-run && cat LICENSE | grep -q "Apache License" && echo ALL_PASS`
- **Phase gate:** All smoke commands return PASS before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No test runner installed yet — smoke tests are shell one-liners, no framework needed for this phase
- [ ] `LICENSE` — covers COMP-01
- [ ] `.gitignore` — covers COMP-03
- [ ] `README.md` — covers COMP-02, COMP-04 (partial)
- [ ] `package.json` (root + 3 workspaces) — covers COMP-04 (installability)

---

## Sources

### Primary (HIGH confidence)

- Apache.org https://www.apache.org/licenses/LICENSE-2.0.txt — Apache 2.0 full text confirmed
- npm workspaces docs https://docs.npmjs.com/cli/v10/using-npm/workspaces — workspace configuration
- TypeScript 5.9.3 — confirmed via `npm view typescript version` run 2026-03-19
- Turbo 2.8.19 — confirmed via `npm view turbo version` run 2026-03-19 (not recommended for this use case)

### Secondary (MEDIUM confidence)

- hackathon-submit skill (`/Users/justinsoon/Desktop/others/ducket-ai-galactica/.claude/skills/hackathon-submit/skill.md`) — defines the exact checklist COMP-04 must pass
- hackathon-check skill (`/Users/justinsoon/Desktop/others/ducket-ai-galactica/.claude/skills/hackathon-check/skill.md`) — defines hard rule audit items
- STATE.md blockers section — lists `ESCROW_WALLET_SEED` and other env vars the project will use

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm workspaces and TypeScript are stable, version-verified
- Architecture: HIGH — monorepo structure is deterministic; no external dependencies to validate
- Pitfalls: HIGH — based on known git behavior and npm workspace semantics, not speculation

**Research date:** 2026-03-19
**Valid until:** 2026-06-19 (90 days — all tools are stable, not fast-moving)
