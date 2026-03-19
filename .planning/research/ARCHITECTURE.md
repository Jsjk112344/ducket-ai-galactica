# Architecture Research

**Domain:** Autonomous ticket fraud detection agent with on-chain USDT escrow enforcement
**Researched:** 2026-03-19
**Confidence:** MEDIUM — OpenClaw architecture verified via official docs; WDK patterns verified via official docs; escrow patterns from established Solidity conventions; data flow is inferred from component interactions.

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                              │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  React Dashboard (Vite + TypeScript + Tailwind)                  │   │
│  │  • Live listings feed     • USDT escrow status                   │   │
│  │  • Classification badges  • Fraud case timeline                  │   │
│  │  • Agent heartbeat log    • Per-event escrow balance             │   │
│  └─────────────────────┬────────────────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────────────────┘
                         │ REST + SSE (Server-Sent Events)
┌────────────────────────┼────────────────────────────────────────────────┐
│                        │    AGENT LAYER (OpenClaw on Node.js)           │
│                        │                                                 │
│  ┌─────────────────────▼────────────────────────────────────────────┐   │
│  │                   GATEWAY (WebSocket :18789)                      │   │
│  │   Orchestrates all components. Owns channel lifecycle.           │   │
│  │   Runs Heartbeat loop (every 30 min by default, configurable).   │   │
│  └──────┬────────────────┬────────────────┬────────────────┬────────┘   │
│         │                │                │                │            │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐    │
│  │    BRAIN    │  │   MEMORY    │  │   SKILLS   │  │  HEARTBEAT │    │
│  │  Claude API │  │ LISTINGS.md │  │ scan.md    │  │ 30-min cron│    │
│  │  (ReAct     │  │ CASES.md    │  │ classify.md│  │ HEARTBEAT  │    │
│  │   loop)     │  │ QUEUE.md    │  │ enforce.md │  │ .md config │    │
│  │             │  │ SQLite      │  │ wallet.md  │  │            │    │
│  └──────┬──────┘  └─────────────┘  └─────┬──────┘  └─────┬──────┘    │
│         │                                 │               │            │
│         └─────────────────────────────────┘               │            │
│                          ↓ Tool invocation                │            │
│  ┌───────────────────────────────────────────────────────▼─────────┐   │
│  │                        HANDS (Execution Layer)                   │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │  Scraping   │  │  Classifier  │  │  Escrow  │  │  Case    │ │   │
│  │  │  Tool       │  │  Tool        │  │  Tool    │  │  Writer  │ │   │
│  │  │ (Playwright)│  │ (Claude API) │  │  (WDK)   │  │  Tool    │ │   │
│  │  └──────┬──────┘  └──────┬───────┘  └────┬─────┘  └────┬─────┘ │   │
│  └─────────┼────────────────┼───────────────┼──────────────┼───────┘   │
└────────────┼────────────────┼───────────────┼──────────────┼───────────┘
             │                │               │              │
             ▼                ▼               ▼              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL LAYER                                  │
│                                                                         │
│  ┌────────────┐  ┌───────────┐  ┌──────────────────┐  ┌────────────┐  │
│  │ Carousell  │  │  Claude   │  │  WDK + Sepolia   │  │  Evidence  │  │
│  │ Viagogo    │  │  API      │  │  (USDT ERC-20)   │  │  Store     │  │
│  │ Telegram   │  │           │  │  Escrow Contract │  │  (SQLite / │  │
│  │ FB Market  │  │           │  │                  │  │   files)   │  │
│  └────────────┘  └───────────┘  └──────────────────┘  └────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| React Dashboard | Display live listings, classifications, escrow balances, fraud cases; UI for event/escrow configuration | Vite + React 18 + TypeScript + Tailwind CSS; polls or subscribes to API |
| API Server | Bridge between dashboard and OpenClaw state; expose SSE stream of agent events | Express or Fastify on Node.js; reads agent memory files or SQLite |
| OpenClaw Gateway | Single long-running process; routes messages between channels; owns heartbeat loop; orchestrates agent turns | OpenClaw runtime on Node.js (local process) |
| Brain (Claude API) | LLM reasoning via ReAct loop; decides which skill/tool to call; classifies listings when invoked | Claude API (claude-sonnet-4-20250514); stateless per-call |
| Memory | Persists agent state across heartbeat cycles: seen listings, open fraud cases, event config, task queue | Markdown files + SQLite in `~/.openclaw/` workspace |
| Heartbeat | Triggers autonomous agent loop every N minutes without human input; reads HEARTBEAT.md for standing instructions | OpenClaw built-in cron; every 30 min default, set to ~5 min for demo |
| Skills | Declarative Markdown files defining agent capabilities: how to scan, classify, enforce, manage escrow | `.openclaw/skills/` directory; loaded contextually per turn |
| Scraping Tool (Hands) | Executes browser automation to fetch listings from Carousell, Viagogo, Telegram, FB Marketplace | Node.js script using Playwright; invoked by agent as a shell/tool call |
| Classifier Tool (Hands) | Sends structured listing data to Claude API with fraud-classification prompt; returns label + confidence | Node.js function called by agent skill; outputs `scalping | scam | counterfeit | legitimate` |
| Escrow Tool (Hands) | Creates/queries/slashes/releases USDT escrow using WDK; all self-custodial on Sepolia | TypeScript module using `@tetherto/wdk` + `@tetherto/wdk-wallet-evm` |
| Case Writer Tool (Hands) | Writes structured fraud case files with evidence, screenshots, timestamps, classification | File writes to `cases/` directory; later readable by API server |
| WDK Wallet | Self-custodial USDT wallet for agent-controlled escrow; never centrally custodied | `@tetherto/wdk` with EVM module; seed phrase stored in env; Sepolia testnet |
| Escrow Contract | On-chain holding contract: locks organizer USDT bond, allows conditional release or slash | Minimal Solidity ERC-20 escrow (3 parties: organizer, agent, arbiter = agent key) |

## Recommended Project Structure

```
ducket-ai-galactica/
├── agent/                        # OpenClaw agent workspace
│   ├── skills/                   # OpenClaw skill definitions (Markdown)
│   │   ├── scan-listings.md      # Instructs agent how to invoke scraper
│   │   ├── classify-listing.md   # Instructs agent how to invoke classifier
│   │   ├── enforce-fraud.md      # Instructs agent escrow slash/report logic
│   │   └── manage-escrow.md      # Deposit, release, refund instructions
│   ├── HEARTBEAT.md              # Standing instructions for each cycle
│   ├── MEMORY.md                 # Agent long-term memory (preferences, event config)
│   └── QUEUE.md                  # Pending tasks kanban (Ready/In Progress/Done)
│
├── tools/                        # Invocable tools (called by agent as shell/JS)
│   ├── scraper/
│   │   ├── carousell.ts          # Playwright scraper for Carousell
│   │   ├── viagogo.ts            # Playwright scraper for Viagogo
│   │   ├── telegram.ts           # Scraper/API for Telegram listings
│   │   └── index.ts              # CLI entry point: --platform --query --output
│   ├── classifier/
│   │   ├── classify.ts           # Claude API call with classification prompt
│   │   ├── prompts.ts            # Fraud classification prompt templates
│   │   └── types.ts              # Classification result types
│   ├── wallet/
│   │   ├── wdk.ts                # WDK initialization and wallet management
│   │   ├── escrow.ts             # Deposit/release/slash/refund operations
│   │   └── types.ts              # Escrow state types
│   └── cases/
│       ├── writer.ts             # Write structured fraud case files
│       └── types.ts              # Case file schema
│
├── contracts/                    # Solidity escrow contract
│   ├── FraudEscrow.sol           # ERC-20 escrow: deposit, slash, release, refund
│   └── deploy.ts                 # Hardhat/ethers deploy script for Sepolia
│
├── api/                          # API server (bridge to dashboard)
│   ├── server.ts                 # Express server + SSE endpoint
│   ├── routes/
│   │   ├── listings.ts           # GET /listings — recent scanned listings
│   │   ├── cases.ts              # GET /cases — fraud case files
│   │   └── escrow.ts             # GET /escrow/:eventId — WDK balance queries
│   └── sse.ts                    # SSE event emitter for live agent updates
│
├── dashboard/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ListingsFeed.tsx   # Live listing cards with classification badges
│   │   │   ├── EscrowStatus.tsx   # USDT balance, deposit/slash/release history
│   │   │   ├── FraudCases.tsx     # Case file viewer with evidence
│   │   │   └── AgentHeartbeat.tsx # Log of recent agent cycles
│   │   ├── hooks/
│   │   │   └── useAgentEvents.ts  # SSE subscription hook
│   │   └── App.tsx
│   └── vite.config.ts
│
├── cases/                        # Agent-written fraud case files (runtime output)
│   └── [case-id].json            # Timestamped evidence: screenshots, classification
│
└── .env                          # ANTHROPIC_API_KEY, WDK_SEED_PHRASE, RPC_URL
```

### Structure Rationale

- **agent/**: OpenClaw workspace lives here — skills define agent behavior declaratively. Separating skills from executable tools keeps prompt logic decoupled from implementation.
- **tools/**: Shell-invocable Node.js scripts. The agent calls these as subprocesses or via a tool-calling interface. Isolation means each tool is independently testable.
- **contracts/**: Minimal Solidity escrow. Kept separate so deploy scripts can target Sepolia without touching agent code.
- **api/**: Thin bridge server — reads from agent memory files and SQLite, exposes REST + SSE. The dashboard never talks directly to agent internals.
- **dashboard/**: Standard Vite React app. Subscribes to SSE for live updates; never writes to agent state directly.
- **cases/**: Runtime output directory — agent writes, API reads, dashboard displays. Decoupled via filesystem.

## Architectural Patterns

### Pattern 1: Heartbeat-Driven Autonomous Loop

**What:** The agent runs on a cron cycle (OpenClaw Heartbeat, every 5-30 min). Each cycle: read HEARTBEAT.md standing instructions → invoke scan skill → invoke classify skill → invoke enforce skill → update memory → write to QUEUE.md. No human trigger required.

**When to use:** Any time the agent must operate continuously without user input. Core to this project's autonomy requirement.

**Trade-offs:** Simple to reason about; risk of redundant runs if prior cycle hasn't completed. Mitigation: write cycle-lock to QUEUE.md before starting, clear on completion.

**Example:**
```markdown
<!-- HEARTBEAT.md — Standing instructions injected every cycle -->
# Fraud Detection Cycle

On each heartbeat:
1. Check QUEUE.md for pending scans. If none, initiate new scan for active events.
2. For each new listing found: classify it using the classify-listing skill.
3. For any listing classified as `scalping` or `scam` with confidence > 0.8: invoke enforce-fraud skill.
4. Write a cycle summary to QUEUE.md with timestamp.
5. If escrow balance for any event is below configured threshold: alert via log.
Return HEARTBEAT_OK if no alerts, otherwise describe what was found.
```

### Pattern 2: Tool-as-Subprocess (Hands Pattern)

**What:** Agent invokes external tools as shell commands or JS function calls through OpenClaw's execution layer ("Hands"). Each tool is a standalone script with a CLI interface and JSON output. The agent parses stdout as structured data.

**When to use:** When a capability is too complex for a skill prompt alone — web scraping, WDK wallet ops, smart contract calls. Keeps LLM reasoning separate from brittle implementation.

**Trade-offs:** Clean separation, independently testable, easy to mock in tests. Adds subprocess overhead (~200-500ms per call). Acceptable for a 5-30 min cycle.

**Example:**
```typescript
// tools/scraper/index.ts — invocable by agent
// Agent calls: node tools/scraper/index.ts --platform carousell --query "guns n roses tickets"
import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

const { platform, query } = parseArgs(process.argv)
const listings = await scrape(platform, query)
// Agent reads JSON output from stdout
console.log(JSON.stringify({ listings, scrapedAt: new Date().toISOString() }))
```

### Pattern 3: Event-Scoped Escrow (Per-Event Wallet Derivation)

**What:** Each monitored event gets a dedicated WDK-derived account (using BIP-44 index derivation from a single seed phrase). Organizer deposits USDT bond to that address. Agent's enforcement actions target that specific account.

**When to use:** Necessary here because escrow must be per-event, not global. WDK's `getAccount(chain, index)` makes this clean — index 0 = event 0, index 1 = event 1, etc.

**Trade-offs:** Clean isolation between events; single seed phrase means a single backup. Risk: if seed phrase is lost, all event escrows are unrecoverable. For demo/hackathon, this is acceptable.

**Example:**
```typescript
// tools/wallet/wdk.ts
import WDK from '@tetherto/wdk'
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'

const wdk = new WDK(process.env.WDK_SEED_PHRASE!)
  .registerWallet('sepolia', WalletManagerEvm, {
    provider: process.env.SEPOLIA_RPC_URL!
  })

export async function getEventWallet(eventIndex: number) {
  return wdk.getAccount('sepolia', eventIndex)
}
// Agent calls: getEventWallet(0) for event 0, getEventWallet(1) for event 1
```

### Pattern 4: File-Based State (Memory-as-Markdown)

**What:** Agent persists state in structured Markdown files that the OpenClaw Memory system reads on each cycle. LISTINGS.md tracks seen listings (deduplication), CASES.md tracks open fraud cases, QUEUE.md is the task backlog.

**When to use:** OpenClaw's native pattern. Avoids needing a separate database for agent state. Files are human-readable and debuggable.

**Trade-offs:** Works well up to thousands of entries; not appropriate for high-volume production. For a hackathon demo scanning one event across 3 platforms, file-based state is correct.

## Data Flow

### Primary Autonomous Cycle (Heartbeat → Enforcement)

```
[Heartbeat fires (every 5 min)]
        ↓
[Agent reads HEARTBEAT.md + MEMORY.md]
        ↓
[Brain (Claude) decides: run scan cycle]
        ↓
[Scraping Tool called for each platform]
   Carousell.ts → { listings[] }
   Viagogo.ts   → { listings[] }
   Telegram.ts  → { listings[] }
        ↓
[Dedup against LISTINGS.md (seen before?)]
        ↓ (new listings only)
[Classifier Tool called per new listing]
   classify.ts → Claude API → { label, confidence, reasoning }
        ↓
[Brain decides: enforce?]
   if label=scalping AND confidence>0.8:
        ↓
[Escrow Tool: slash or flag bond]
   escrow.ts → WDK → sendTransaction() → Sepolia
        ↓
[Case Writer Tool: create evidence file]
   writer.ts → cases/[id].json (screenshot + classification + tx hash)
        ↓
[Memory updated: LISTINGS.md, CASES.md, QUEUE.md]
        ↓
[API Server picks up new case files]
        ↓
[SSE event pushed to React Dashboard]
        ↓
[Dashboard re-renders: new listing card, escrow balance update]
```

### Organizer Deposit Flow (Human-Triggered, One-Time)

```
[Organizer opens Dashboard]
        ↓
[Enters event details + USDT bond amount]
        ↓
[API writes event config to agent MEMORY.md]
        ↓
[Dashboard calls POST /escrow/:eventId/deposit]
        ↓
[API triggers Escrow Tool: deposit()]
   WDK → getEventWallet(index) → sendTransaction(escrowContract, amount)
        ↓
[Escrow contract locks USDT]
        ↓
[Dashboard shows "Bond Active" + balance]
```

### Classification Decision Flow

```
[Raw listing data]
  { title, price, platform, seller, listingUrl, scrapedAt }
        ↓
[Classifier Tool: classify.ts]
  Prompt includes:
    - Original face value (from event config)
    - Platform max resale cap (if known)
    - Listing details
    - Examples of each fraud type
        ↓
[Claude API → structured output]
  {
    label: "scalping" | "scam" | "counterfeit" | "legitimate",
    confidence: 0.0–1.0,
    reasoning: string,
    flaggedFields: string[]
  }
        ↓
[Agent Brain receives result]
  if confidence < 0.6 → log as uncertain, skip enforcement
  if label=legitimate → update LISTINGS.md, no action
  if label=scalping|scam|counterfeit AND confidence≥0.8 → enforce
```

### Dashboard Data Flow (Pull + Push)

```
[React Dashboard]
        │
        ├── GET /api/listings     → API reads LISTINGS.md / SQLite → returns last 50
        ├── GET /api/cases        → API reads cases/*.json → returns case summaries
        ├── GET /api/escrow/:id   → API calls WDK getBalance() → returns USDT amount
        │
        └── SSE /api/events       → persistent connection
              ↑
        [API Server watches cases/ dir with chokidar]
              ↑
        [Agent writes new case file]
              → SSE broadcasts { type: "new_case", payload: case }
              → React updates ListingsFeed, EscrowStatus in real-time
```

## Scaling Considerations

This is a hackathon project. Scale considerations are minimal but noted for correctness.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Demo (1 event, 3 platforms) | File-based memory, single Node process, SQLite — correct choice |
| 10 events | Increase WDK account index range; move memory to SQLite exclusively; add per-event heartbeat config |
| 100+ events | Replace file-based memory with PostgreSQL; run multiple agent workers; use a proper task queue (BullMQ) instead of QUEUE.md |

### Scaling Priorities

1. **First bottleneck:** Agent runs sequentially per heartbeat — 3 platforms × N listings × Claude API call = slow at high volume. Fix: batch classify calls, parallelize scrapers.
2. **Second bottleneck:** File-based memory becomes slow at thousands of listings. Fix: migrate LISTINGS.md to SQLite with an index on listing hash.

## Anti-Patterns

### Anti-Pattern 1: Human-Triggered Classification

**What people do:** Build a dashboard where an analyst clicks "classify" per listing.
**Why it's wrong:** Defeats the autonomy requirement, which is judging criterion #1. The agent must scan-classify-enforce without human triggers.
**Do this instead:** All classification happens in the Heartbeat cycle. Dashboard is read-only — it displays what the agent already did, not what a human decided.

### Anti-Pattern 2: Centralized Wallet Custody

**What people do:** Store USDT in a backend-controlled hot wallet or use a payment processor.
**Why it's wrong:** Disqualifies from hackathon (WDK mandatory requirement). Also defeats the "self-custodial" value prop.
**Do this instead:** All wallet operations through WDK. Seed phrase in environment variable. No centralized key management.

### Anti-Pattern 3: Coupling Agent State to React State

**What people do:** React app directly calls OpenClaw APIs and writes to agent memory.
**Why it's wrong:** Creates circular dependencies; agent memory becomes inconsistent; OpenClaw's file-based memory is not designed for concurrent writes.
**Do this instead:** Dashboard is strictly read — it reads via the API bridge (REST/SSE). Writes to agent config happen through a defined API endpoint that safely writes to memory files.

### Anti-Pattern 4: Single Monolithic Skill

**What people do:** Put all logic (scan + classify + enforce + escrow) into one mega-skill prompt.
**Why it's wrong:** LLM context becomes too long; harder to debug which step failed; can't independently test classify vs enforce.
**Do this instead:** Separate skills per capability: `scan-listings.md`, `classify-listing.md`, `enforce-fraud.md`, `manage-escrow.md`. The Heartbeat skill orchestrates calling them in sequence.

### Anti-Pattern 5: Scraping Without Deduplication

**What people do:** Re-classify listings seen in prior cycles.
**Why it's wrong:** Wastes Claude API tokens; bloats case files; causes duplicate enforcement actions (double-slash on escrow).
**Do this instead:** Hash each listing (platform + listing ID or URL). Check against LISTINGS.md before classifying. Only process new listings each cycle.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Claude API | HTTP POST from classifier tool; also OpenClaw Brain for agent reasoning | Two distinct uses: (1) LLM reasoning in Brain (OpenClaw handles), (2) direct API call in classifier tool. Keep prompts separate. |
| WDK (`@tetherto/wdk`) | npm module imported in wallet tool; seed phrase from env var | Must be JS/TS — no other language. Seed phrase never committed. Use `getRandomSeedPhrase()` on first init, then persist. |
| Playwright | npm module in scraper tool; runs headless Chromium | Each platform needs its own scraper because DOM structures differ. Run in headless mode. Handle anti-bot measures (random delays, user-agent rotation). |
| Sepolia RPC | WDK provider URL (Alchemy or Infura Sepolia endpoint) | Must be Sepolia, not mainnet. USDT on Sepolia: `0x7169D38820dfd117C3FA1f22a697dBA58d90BA06`. |
| Escrow Contract | ethers.js or WDK internal ABI calls | Simple ERC-20 escrow. Deploy once on Sepolia before demo. Store contract address in env/config. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| OpenClaw Agent ↔ Scraper Tool | Shell subprocess call; stdout JSON | Agent invokes `node tools/scraper/index.ts --platform X`; reads stdout. Clean boundary. |
| OpenClaw Agent ↔ Classifier Tool | Shell subprocess call or direct JS import | If OpenClaw supports JS tool registration, prefer direct import over subprocess for speed. |
| OpenClaw Agent ↔ Wallet Tool | Shell subprocess or direct JS import | WDK requires JS/TS; can be imported directly into OpenClaw skill execution context. |
| Agent Memory ↔ API Server | Filesystem (read-only by API) | API server reads SQLite/markdown files written by agent. Uses `chokidar` to watch for new case files. Never writes to agent memory. |
| API Server ↔ React Dashboard | REST (polling) + SSE (push) | SSE for real-time case updates; REST for initial data load and escrow balance queries. |
| WDK ↔ Escrow Contract | ethers.js ABI call via WDK account | WDK `sendTransaction()` with encoded contract call for deposit/slash/release functions. |

## Build Order Implications

Based on component dependencies, the correct build order is:

1. **Escrow Contract** (no dependencies — foundational, deploy to Sepolia first)
2. **WDK Wallet Tool** (depends on: contract address, Sepolia RPC — needed before any escrow action)
3. **Scraping Tools** (no dependencies — can be built and tested in isolation)
4. **Classifier Tool** (depends on: Claude API key — can be built and tested in isolation)
5. **Case Writer Tool** (no dependencies — pure file I/O)
6. **OpenClaw Skills + Heartbeat** (depends on: all tools existing and testable)
7. **API Server** (depends on: agent memory schema being defined, case file schema being defined)
8. **React Dashboard** (depends on: API server endpoints being defined)

The critical path is: **Contract → WDK Tool → Skills → API → Dashboard**. Scraper and classifier can be developed in parallel with the WDK/contract path.

## Sources

- OpenClaw core concepts and Heartbeat: [http://clawdocs.org/getting-started/core-concepts/](http://clawdocs.org/getting-started/core-concepts/) (MEDIUM confidence — official docs)
- OpenClaw Heartbeat mechanism: [https://docs.openclaw.ai/gateway/heartbeat](https://docs.openclaw.ai/gateway/heartbeat) (HIGH confidence — official docs)
- OpenClaw architecture overview: [https://ppaolo.substack.com/p/openclaw-system-architecture-overview](https://ppaolo.substack.com/p/openclaw-system-architecture-overview) (MEDIUM confidence — community source)
- OpenClaw skills system: [https://github.com/VoltAgent/awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills) (MEDIUM confidence — community registry)
- WDK overview: [https://docs.wdk.tether.io/overview/about](https://docs.wdk.tether.io/overview/about) (HIGH confidence — official docs)
- WDK Node.js quickstart: [https://github.com/tetherto/wdk-docs/blob/main/start-building/nodejs-bare-quickstart.md](https://github.com/tetherto/wdk-docs/blob/main/start-building/nodejs-bare-quickstart.md) (HIGH confidence — official docs)
- WDK EVM wallet module: [https://docs.wdk.tether.io/sdk/wallet-modules/wallet-evm](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-evm) (HIGH confidence — official docs)
- Escrow smart contract patterns: [https://dev.to/entuziaz/building-an-escrow-smart-contract-1dl9](https://dev.to/entuziaz/building-an-escrow-smart-contract-1dl9) (MEDIUM confidence)
- Agentic AI fraud detection architecture: [https://www.intellectyx.com/ai-agent-technical-architecture-in-financial-payment-systems-for-real-time-fraud-detection/](https://www.intellectyx.com/ai-agent-technical-architecture-in-financial-payment-systems-for-real-time-fraud-detection/) (MEDIUM confidence — industry source)
- Playwright for web scraping: [https://www.promptcloud.com/blog/playwright-vs-puppeteer-for-web-scraping/](https://www.promptcloud.com/blog/playwright-vs-puppeteer-for-web-scraping/) (HIGH confidence)

---
*Architecture research for: Autonomous ticket fraud detection agent with on-chain USDT escrow*
*Researched: 2026-03-19*
