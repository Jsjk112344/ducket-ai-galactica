# Architecture Research

**Domain:** P2P Ticket Resale Platform — AI Fraud Detection + USDT Escrow
**Researched:** 2026-03-20
**Confidence:** HIGH (based on direct codebase inspection + official shadcn/ui docs)

---

## Standard Architecture

### System Overview

```
+---------------------------------------------------------------------+
|                         DASHBOARD (React 19 / Vite 8)               |
|  +---------------+  +--------------+  +---------------+  +---------+|
|  |  ResaleFlow   |  | ListingsTable|  | EscrowStatus  |  | Wallet  ||
|  |  (NEW tab)    |  |  (existing)  |  |  (existing)   |  |Inspector||
|  +-------+-------+  +------+-------+  +-------+-------+  +----+----+|
|          |                 |                  |               |     |
|  +------------------------------------------------------------------------+
|  |          Express API (server/api.ts) -- port 3001                  |   |
|  |  /api/listings  /api/wallet  /api/cases/:hash                      |   |
|  |  /api/resale/listings  /api/resale/submit  (NEW)                   |   |
|  |  /api/resale/lock  /api/resale/verify  /api/resale/settle  (NEW)   |   |
|  +------------------------------------------------------------------------+
+---------------------------------------------------------------------+
          |
+---------+-----------------------------------------------------------+
|         |              AGENT (Node.js ESM)                           |
|  +------+--------+  +------------+  +------------+  +------------+ |
|  |  scan-loop.js |  | classify.js|  |  escrow.js |  |evidence.js | |
|  | (existing)    |  | (existing) |  | (existing) |  | (existing) | |
|  +---------------+  +------------+  +------------+  +------------+ |
|                                                                      |
|         agent/memory/LISTINGS.md     <-- scraper file bus (read by API)   |
|         agent/memory/RESALE_LISTINGS.json  <-- NEW P2P file bus      |
|         agent/cases/*.md             <-- case files with AI reasoning|
+---------------------------------------------------------------------+
          |
+---------+-----------------------------------------------------------+
|         |              ON-CHAIN (Sepolia)                            |
|  +------+------------------------------------------------------------+
|  |  FraudEscrow.sol                                                  |
|  |  deposit(escrowId, amount)   <-- WDK wallet (buyer locks USDT)   |
|  |  release(escrowId, to)       <-- deployer key (AI: legitimate)   |
|  |  refund(escrowId)            <-- deployer key (AI: fraud/scam)   |
|  |  slash(escrowId, pool)       <-- deployer key (AI: scalping)     |
|  +-------------------------------------------------------------------+
+---------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Status |
|-----------|----------------|--------|
| `dashboard/src/App.tsx` | Tab routing, polling orchestration | MODIFY — add ResaleFlow tab |
| `dashboard/src/components/ResaleFlow.tsx` | 4-step wizard: list, lock, verify, settle | NEW |
| `dashboard/src/components/SellerListForm.tsx` | Step 1: seller submits ticket details | NEW |
| `dashboard/src/components/BuyerLockForm.tsx` | Step 2: buyer locks USDT | NEW |
| `dashboard/src/components/AIVerifyStatus.tsx` | Step 3: AI verification in progress + result | NEW |
| `dashboard/src/components/SettleActions.tsx` | Step 4: settlement outcome display | NEW |
| `dashboard/src/components/ListingsTable.tsx` | Show scanned external listings, AI reasoning | MODIFY — improve reasoning display |
| `dashboard/src/components/AgentDecisionPanel.tsx` | AI classification detail (already exists) | REUSE — wire into ResaleFlow step 3 |
| `dashboard/src/components/EscrowStatus.tsx` | Aggregate escrow stats | MODIFY — show P2P escrows too |
| `dashboard/server/api.ts` | Express REST API, reads agent file bus | MODIFY — add /api/resale/* endpoints |
| `dashboard/src/types.ts` | Shared TypeScript contracts | MODIFY — add ResaleListing, P2PEscrowState |
| `dashboard/src/hooks/useResale.ts` | Polling hook for resale listings state | NEW |
| `dashboard/src/index.css` | Tailwind v4 @theme tokens | MODIFY — add Ducket brand + shadcn vars |
| `agent/src/classify.js` | Hybrid rules + Claude classifier | KEEP — API imports directly |
| `agent/src/escrow.js` | WDK deposit + deployer release/refund/slash | KEEP — API imports directly |
| `contracts/src/FraudEscrow.sol` | On-chain escrow lifecycle | NO CHANGE — covers P2P already |

---

## Recommended Project Structure (New Files Only)

```
dashboard/
+-- server/
|   +-- api.ts                    # MODIFY: add /api/resale/* route group
+-- src/
|   +-- components/
|   |   +-- ResaleFlow.tsx         # NEW: 4-step wizard orchestrator
|   |   +-- SellerListForm.tsx     # NEW: step 1 form
|   |   +-- BuyerLockForm.tsx      # NEW: step 2 USDT lock CTA
|   |   +-- AIVerifyStatus.tsx     # NEW: step 3 AI status + AgentDecisionPanel
|   |   +-- SettleActions.tsx      # NEW: step 4 outcome
|   |   +-- ui/                    # NEW: shadcn components (card, button, etc.)
|   +-- hooks/
|   |   +-- useResale.ts           # NEW: polling hook for P2P listings
|   +-- lib/
|   |   +-- utils.ts               # NEW: cn() helper required by shadcn
|   +-- types.ts                   # MODIFY: add ResaleListing, P2PEscrowState

agent/memory/
+-- RESALE_LISTINGS.json           # NEW: file-bus store for P2P listings

scripts/
+-- seed-cases.js                  # NEW: seed realistic case files for demo AI reasoning
```

### Structure Rationale

- **ResaleFlow.tsx as orchestrator:** Manages `step` state (1-4) and `resaleListing` object. Child components are dumb — they receive step data and callbacks. Keeps demo flow linear.
- **Separate RESALE_LISTINGS.json (not LISTINGS.md):** LISTINGS.md is append-only markdown written by the scraper. P2P listings need structured read/write by the API. JSON file in `agent/memory/` keeps the shared file-bus pattern consistent.
- **No new contracts:** FraudEscrow.sol already handles the P2P lifecycle. `escrowId` is `keccak256(sellerAddress + ticketId + timestamp)`. The contract does not care about the semantic meaning of the depositor.
- **No new agent loops:** classify.js exports `classifyListing()` as a pure function. The API can call it synchronously (no side effects, no file I/O). This avoids adding a new scan loop for P2P.

---

## P2P Resale Flow Mapping to Existing Escrow

### How seller listing -> buyer lock -> AI verify -> settle maps to FraudEscrow.sol

```
Step 1: Seller submits listing
  POST /api/resale/submit
  --> Write to agent/memory/RESALE_LISTINGS.json
  --> Generate escrowId = keccak256(seller + ticketId + timestamp)
  --> Return { listingId, escrowId, status: 'LISTED' }

Step 2: Buyer locks USDT
  POST /api/resale/lock { listingId }
  --> api.ts calls escrow.js depositForListing(escrowId, amount)
      --> WDK wallet: USDT.approve(FraudEscrow, 10 USDT)
      --> WDK wallet: FraudEscrow.deposit(escrowId, 10 USDT)
  --> Update RESALE_LISTINGS.json status --> 'LOCKED'
  --> Return { txHash, escrowId }

Step 3: AI verification
  POST /api/resale/verify { listingId }
  --> api.ts calls classify.js classifyListing(listing) directly
      --> Rules pass --> Claude API if confidence < 85
      --> Returns { category, confidence, reasoning, classificationSource }
  --> Write classification to listing record in RESALE_LISTINGS.json
  --> Update status --> 'VERIFIED'
  --> Return { classification }

Step 4: Settlement
  POST /api/resale/settle { listingId }
  --> api.ts reads classification from listing record
  --> LEGITIMATE                      --> escrow.js release(escrowId, sellerAddress)
  --> LIKELY_SCAM / COUNTERFEIT_RISK  --> escrow.js refund(escrowId)
  --> SCALPING_VIOLATION              --> escrow.js slash(escrowId, BOUNTY_POOL)
  --> Update status --> 'RELEASED' | 'REFUNDED' | 'SLASHED'
  --> Return { outcome, txHash, etherscanLink }
```

### Key constraint: escrow.js deposit() uses WDK

The existing escrow.js does `approve()` and `deposit()` via WDK. For P2P, the "buyer" is conceptually the depositor. In the demo context (one wallet), this satisfies the WDK requirement — the WDK wallet locks USDT on behalf of the buyer. Make this explicit in UI copy: "Buyer locks USDT via WDK non-custodial wallet."

---

## Surfacing Claude AI Reasoning in the UI

### What already exists

`AgentDecisionPanel.tsx` already renders:
- `category` — fraud classification badge
- `confidence` — percentage bar
- `reasoning` — text paragraph (from `classificationSource: 'claude-3-5-sonnet'`)
- `classificationSource` — rules vs. Claude API
- `actionTaken` — what escrow action was triggered
- `etherscanLink` — on-chain evidence

`classify.js` already emits `reasoning` strings in structured output from both the rules engine and Claude API. The `classificationSource` field is either `'rules'` or the model string from the Claude SDK response.

### What needs to change for demo visibility

Mock/seed data listings have no `classification` attached (the agent has not processed them in demo mode). Two approaches:

**Option A — Pre-seed case files (recommended for demo):** Write a seed script that generates realistic case `.md` files in `agent/cases/` for mock listings. The API's `lookupClassification()` parser already reads these. Zero new code path, 100% reliable during demo. Takes ~30 minutes.

**Option B — Inline classification on API response:** Add a `classifyOnRead: true` query param to `GET /api/listings` that calls `classifyListing()` synchronously for listings without a case file. More code, adds latency, Claude API call during demo = risky.

**Recommendation: Option A.** Seed data covers all four categories with distinct reasoning strings. AgentDecisionPanel renders immediately without any live API risk during the demo.

---

## shadcn/ui Integration with Tailwind v4

### Compatibility status (HIGH confidence)

shadcn/ui fully supports Tailwind v4 as of early 2026. Components ship with `@theme inline` CSS variable wiring. React 19 is explicitly supported. Installation adds components as local files — not a package dependency — so there is no version lock risk.

Source: https://ui.shadcn.com/docs/tailwind-v4

### Key integration requirement

shadcn/ui's `components.json` expects an `aliases.utils` path pointing to a `cn()` helper (`clsx` + `tailwind-merge`). This is the only new dependency required:

```bash
npm install clsx tailwind-merge --save
```

shadcn CLI adds the `lib/utils.ts` helper automatically during `npx shadcn@latest init`.

### CSS variable conflict risk: NONE

The existing `index.css` uses `@theme { --color-accent: #6366F1; ... }`. shadcn/ui uses its own namespace: `--primary`, `--secondary`, `--background`, `--foreground`, etc. These are separate namespaces — no collision. shadcn components reference `var(--primary)`, not `var(--color-accent)`.

**Resolution:** Map Ducket brand tokens to shadcn variable names inside the `@theme` block. Existing components are unaffected because they reference `--color-*` names, not shadcn's names.

### Which shadcn components to install

Install only what is needed for the resale flow. Do not install the full registry.

| Component | Used by | Why |
|-----------|---------|-----|
| `card` | ResaleFlow steps | Consistent step card layout |
| `button` | All CTA actions | Replaces raw `<button>` classes |
| `badge` | Status labels | Augments or replaces custom Badge.tsx |
| `input` | SellerListForm, BuyerLockForm | Form fields |
| `label` | Forms | Paired with input |
| `separator` | Step dividers | Visual flow |
| `progress` | AIVerifyStatus | Confidence bar |

Do NOT install: `table`, `dialog`, `sheet`, `toast`, `dropdown-menu`. ListingsTable already has custom table CSS that works.

---

## Brand Theming Approach

### Recommended: augment existing @theme block (15-minute change)

The Ducket brand uses:
- Primary: purple (`#7C3AED` / violet-700)
- Accent: yellow/gold (`#F59E0B` / amber-400)
- Font headings: Outfit
- Font body: Inter (already loaded)

Change strategy:
1. Update `--color-accent` in `index.css` from `#6366F1` (indigo) to `#7C3AED` (Ducket purple) — all existing components using `text-accent`, `bg-accent`, `border-accent` shift automatically.
2. Add `--color-accent-yellow: #F59E0B` for highlight elements.
3. Add Outfit font `@import` alongside Inter.
4. Add `--font-family-display: 'Outfit', sans-serif` to `@theme`.
5. Apply `font-display` to `<h1>` and section headings in App.tsx and ResaleFlow.tsx.
6. Add shadcn CSS variable mappings (`--primary`, `--background`, etc.) inside `@theme`.

This is additive — existing components are not broken.

---

## Data Flow

### P2P Resale Request Flow

```
User fills SellerListForm
    |
    v
POST /api/resale/submit
    |
    v
api.ts writes to agent/memory/RESALE_LISTINGS.json
    |
    v
Returns { listingId, escrowId, status: 'LISTED' }
    |
    v
UI advances to Step 2 (BuyerLockForm)

User clicks "Lock USDT"
    |
    v
POST /api/resale/lock { listingId }
    |
    v
api.ts imports escrow.js depositForListing()
    |
    v
WDK approve() --> WDK deposit() --> FraudEscrow.deposit(escrowId, 10 USDT)
    |
    v
RESALE_LISTINGS.json status --> 'LOCKED'
    |
    v
Returns { txHash, escrowId }
    |
    v
UI advances to Step 3 (AIVerifyStatus)

User clicks "Verify Listing"
    |
    v
POST /api/resale/verify { listingId }
    |
    v
api.ts imports classify.js classifyListing()
    |
    v
Rules pass --> Claude API (if confidence < 85)
    |
    v
Returns { category, confidence, reasoning, classificationSource }
    |
    v
RESALE_LISTINGS.json status --> 'VERIFIED', classification attached
    |
    v
UI renders AgentDecisionPanel inline

User (or auto-advance) clicks "Settle"
    |
    v
POST /api/resale/settle { listingId }
    |
    v
api.ts reads classification --> calls escrow.js release / refund / slash
    |
    v
Returns { outcome, txHash, etherscanLink }
    |
    v
UI advances to Step 4 (SettleActions), shows outcome + Etherscan link
```

### State Management

No Redux/Zustand needed. `ResaleFlow.tsx` manages local `step` state (1-4) and a `resaleListing` object built up across steps. `useResale.ts` polls `GET /api/resale/listings` every 10 seconds for a listings overview panel — same polling pattern as `useListings.ts`.

---

## New vs Modified Components — Explicit List

### New Files

| File | Type | Description |
|------|------|-------------|
| `dashboard/src/components/ResaleFlow.tsx` | NEW | 4-step wizard orchestrator |
| `dashboard/src/components/SellerListForm.tsx` | NEW | Step 1 UI (ticket details form) |
| `dashboard/src/components/BuyerLockForm.tsx` | NEW | Step 2 UI (USDT lock CTA) |
| `dashboard/src/components/AIVerifyStatus.tsx` | NEW | Step 3 UI (AI in progress + result) |
| `dashboard/src/components/SettleActions.tsx` | NEW | Step 4 UI (outcome display) |
| `dashboard/src/hooks/useResale.ts` | NEW | Polling hook for resale listings |
| `dashboard/src/lib/utils.ts` | NEW | cn() helper required by shadcn |
| `dashboard/src/components/ui/` | NEW | shadcn/ui components (card, button, etc.) |
| `agent/memory/RESALE_LISTINGS.json` | NEW | File-bus store for P2P listings |
| `scripts/seed-cases.js` | NEW | Seed realistic case files for demo AI reasoning |

### Modified Files

| File | Change |
|------|--------|
| `dashboard/src/App.tsx` | Add "Resale" tab + ResaleFlow component |
| `dashboard/src/types.ts` | Add ResaleListing, P2PEscrowState interfaces |
| `dashboard/server/api.ts` | Add /api/resale/* route group (submit, lock, verify, settle, listings) |
| `dashboard/src/index.css` | Ducket purple accent, Outfit font, shadcn CSS var mappings |
| `dashboard/src/components/ListingsTable.tsx` | Improve AI reasoning display if needed |

### Unchanged Files

| File | Reason |
|------|--------|
| `agent/src/classify.js` | Already exports classifyListing() as pure function |
| `agent/src/escrow.js` | Already handles deposit/release/refund/slash |
| `agent/src/scan-loop.js` | Scanning external platforms is separate from P2P resale |
| `contracts/src/FraudEscrow.sol` | Contract already covers P2P lifecycle |
| `contracts/deployed.json` | No redeployment required |
| `agent/src/wallet/index.ts` | WDK wallet unchanged |

---

## Suggested Build Order (2-Day Deadline)

Dependencies drive the order: types -> API -> hooks -> UI -> brand.

### Day 1 — Foundation + data layer

| Order | Task | File(s) | Est. Time |
|-------|------|---------|-----------|
| 1 | Extend types | `dashboard/src/types.ts` | 20 min |
| 2 | Add resale API routes | `dashboard/server/api.ts` | 90 min |
| 3 | Write seed script + run it | `scripts/seed-cases.js` | 30 min |
| 4 | Add useResale hook | `dashboard/src/hooks/useResale.ts` | 20 min |
| 5 | Stub ResaleFlow + wire tab | `App.tsx`, `ResaleFlow.tsx` | 30 min |
| 6 | Install shadcn + cn helper | npm install, shadcn init | 15 min |

### Day 2 — UI + rebrand + polish

| Order | Task | File(s) | Est. Time |
|-------|------|---------|-----------|
| 7 | Build 4-step components | SellerListForm, BuyerLockForm, AIVerifyStatus, SettleActions | 120 min |
| 8 | Wire steps end-to-end | ResaleFlow.tsx step state machine | 45 min |
| 9 | Brand rebrand | index.css — purple accent, Outfit font | 20 min |
| 10 | Verify AI reasoning on seed data | AgentDecisionPanel renders from seed case files | 20 min |
| 11 | Demo run-through | Full 5-min flow, fix blockers | 60 min |
| 12 | README + narrative reframe | README.md, CLAUDE.md | 30 min |

### Why this order

- Types first so API and UI both compile against shared contracts from the start.
- API before UI so components call real endpoints, not stubs.
- Seed script early so AI reasoning display works from day 1, removing demo risk.
- shadcn init before building step components so shadcn imports resolve.
- Rebrand last — purely visual, no logic dependencies, zero risk to the core flow.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Sepolia RPC | ethers.JsonRpcProvider in api.ts (existing) | No change — escrow.js reused |
| WDK (@tetherto/wdk-wallet-evm) | wallet/index.ts, escrow.js (existing) | No change — deposit path unchanged |
| Claude API (@anthropic-ai/sdk) | classify.js (existing) | No change — api.ts imports classify.js directly |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| API -> agent/classify.js | Direct ESM import | classify.js is a pure function, no side effects, safe to import from API |
| API -> agent/escrow.js | Direct ESM import | escrow.js requires .env vars — api.ts process shares the same env |
| API -> agent/memory/ | fs read/write | JSON file bus pattern, consistent with existing LISTINGS.md approach |
| React -> API | HTTP polling (10s interval) | Same pattern as useListings.ts — replicate for useResale.ts |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Rebuilding the escrow contract for P2P

**What people do:** Add seller/buyer address fields to the contract, add a `list()` function, redeploy.
**Why it's wrong:** FraudEscrow.sol already handles all four outcomes. Adding UI fields to the contract for a demo is wasted time and introduces redeployment risk. `escrowId` is an opaque bytes32 — it can encode any semantic meaning the API assigns to it.
**Do this instead:** Keep all P2P state in RESALE_LISTINGS.json. The contract is purely the payment rail.

### Anti-Pattern 2: Adding a separate Express server for resale

**What people do:** Create `server/resale-api.ts` with its own `app.listen()`.
**Why it's wrong:** Two servers = two ports = Vite proxy reconfiguration = demo complexity.
**Do this instead:** Add `/api/resale/*` as a route group in the existing `server/api.ts`. It already runs on port 3001 with Vite proxy wired.

### Anti-Pattern 3: Installing too many shadcn components

**What people do:** `npx shadcn@latest add --all` for completeness.
**Why it's wrong:** Adds 40+ files with potentially conflicting utility class patterns. Tailwind v4's JIT compiles everything it finds — large unused files bloat the build and may conflict with existing custom CSS.
**Do this instead:** Install only the 7 components listed above. The rest of the UI uses existing custom components that already match the design.

### Anti-Pattern 4: Calling Claude API at render time

**What people do:** Call classifyListing() in a useEffect for each listing row to show AI reasoning.
**Why it's wrong:** 20 listings = 20 concurrent Claude API calls = rate limit errors + slow UI + API cost.
**Do this instead:** Classify once per listing (in the verify step or at seed time), persist to RESALE_LISTINGS.json or case files, read classification from storage.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Hackathon demo (1 user) | JSON file bus is sufficient; Express in-process is fine |
| Post-hackathon (100 users) | Replace JSON file bus with SQLite; keep same API route shapes |
| Production (10k+ users) | Job queue for AI classification; WebSocket for live status; dedicated WDK custody solution |

---

## Sources

- shadcn/ui Tailwind v4 official docs: https://ui.shadcn.com/docs/tailwind-v4 (HIGH confidence)
- Direct codebase inspection: `dashboard/server/api.ts`, `agent/src/escrow.js`, `agent/src/classify.js`, `contracts/src/FraudEscrow.sol`, `dashboard/src/types.ts`, `dashboard/src/index.css` (HIGH confidence)

---
*Architecture research for: Ducket AI Galactica v2.0 P2P Resale pivot*
*Researched: 2026-03-20*
