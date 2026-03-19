# Roadmap: Ducket AI Galactica

## Overview

Eight phases ordered strictly by risk and dependency. WDK wallet integration is validated first on Day 1 because failure there means disqualification — no fallback exists. Scraping is validated against real anti-bot targets before classification is written on top of it. The agent autonomy loop, escrow enforcement, and dashboard follow in dependency order. A dedicated final phase for demo integration ensures the full 5-minute loop runs clean before submission. Compliance artifacts are wired in at the start, not bolted on at the end.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Project Scaffold + Compliance** - Monorepo structure, license, secrets hygiene, and CI baseline so the repo is always submittable (completed 2026-03-19)
- [ ] **Phase 2: WDK Wallet + Escrow Contract** - Self-custodial USDT wallet on Sepolia via WDK smoke-tested and FraudEscrow.sol deployed
- [x] **Phase 3: StubHub Scraper** - First and highest-risk scraper validated against live FIFA World Cup 2026 listings with anti-bot resolution (completed 2026-03-19)
- [x] **Phase 4: Viagogo + Facebook Marketplace Scrapers + Scan Loop** - Complete the scan pipeline: all three platforms returning structured JSON, deduplication, autonomous heartbeat polling (completed 2026-03-19)
- [x] **Phase 5: Classification Engine + Evidence** - Claude-powered fraud classification with confidence gating, Zod validation, and timestamped case file output (completed 2026-03-19)
- [ ] **Phase 6: Escrow Enforcement Wiring** - Full escrow lifecycle (deposit, release, refund, slash, legitimacy bond) end-to-end with on-chain confirmation
- [ ] **Phase 7: React Dashboard** - Live listings table, classification badges with reasoning panels, escrow status, wallet inspector, Ducket brand styling
- [ ] **Phase 8: Demo Integration + Submission** - Full 5-minute demo loop rehearsed 3 consecutive times, mock fallback configured, submission checklist passed

## Phase Details

### Phase 1: Project Scaffold + Compliance
**Goal**: The repo is structured, licensed, and clean — a judge can clone it and find no disqualifying issues before a single feature is built
**Depends on**: Nothing (first phase)
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):
  1. `LICENSE` file at repo root contains Apache 2.0 text
  2. `.gitignore` blocks `.env`, `*.key`, `node_modules`, and all secret patterns — no secrets appear in `git status`
  3. `README.md` lists every third-party service (Claude API, WDK, Patchright, OpenClaw, Sepolia) with disclosure language
  4. Monorepo directories exist for `agent/`, `dashboard/`, `contracts/`, `.planning/` and each has a working `package.json`
  5. Public GitHub repo is accessible without authentication and passes `/hackathon-submit` pre-flight checklist for compliance items
**Plans:** 1/1 plans complete
Plans:
- [x] 01-01-PLAN.md — Compliance files, monorepo scaffold, and README with third-party disclosures

### Phase 2: WDK Wallet + Escrow Contract
**Goal**: The agent holds a self-custodial USDT wallet on Sepolia that survives restarts and can send a real transaction — and FraudEscrow.sol is deployed with a confirmed contract address
**Depends on**: Phase 1
**Requirements**: WLLT-01, WLLT-02, WLLT-03, WLLT-04
**Success Criteria** (what must be TRUE):
  1. Running `node agent/tools/wallet-smoke-test.js` generates a wallet, reads a Sepolia USDT balance, and sends 0 USDT to itself — returning a confirmed txHash within 60 seconds
  2. Restarting the agent process produces the same wallet address (seed phrase persists via `ESCROW_WALLET_SEED` env var; startup refuses if env var is missing)
  3. Private key is never written to disk or logged — only the seed phrase in `.env` (which is git-ignored)
  4. `FraudEscrow.sol` is deployed to Sepolia with a verified contract address in `contracts/deployed.json`
  5. Running `/wdk-check` reports zero non-custodial violations
**Plans:** 2 plans
Plans:
- [ ] 02-01-PLAN.md — WDK wallet module with singleton pattern, startup guard, and smoke test script
- [ ] 02-02-PLAN.md — FraudEscrow.sol smart contract with Hardhat tooling, deploy script, and unit tests

### Phase 3: StubHub Scraper
**Goal**: The agent can fetch real FIFA World Cup 2026 ticket listings from StubHub and return structured JSON — anti-bot protection is resolved
**Depends on**: Phase 1 (can run parallel with Phase 2)
**Requirements**: SCAN-02, SCAN-05
**Success Criteria** (what must be TRUE):
  1. Running `node agent/tools/scrape-stubhub.js "FIFA World Cup 2026"` returns at least one listing object with all required fields: `platform`, `seller`, `price`, `url`, `listingDate`, `redFlags`
  2. The scraper does not throw a bot-detection error or return an empty array against the live StubHub site
  3. Price is parsed as a numeric value in USD (not a raw string like "$280")
  4. Re-running the scraper within 5 minutes returns the same listings deduplicated by URL hash (no duplicates in output)
**Plans:** 1/1 plans complete
Plans:
- [ ] 03-01-PLAN.md — Patchright scraper with XHR interception, structured JSON output, and mock fallback

### Phase 4: Viagogo + Facebook Marketplace Scrapers + Scan Loop
**Goal**: All three platform scrapers return structured listing JSON and the autonomous heartbeat loop polls them on schedule without human trigger
**Depends on**: Phase 3
**Requirements**: SCAN-01, SCAN-03, SCAN-04, SCAN-05
**Success Criteria** (what must be TRUE):
  1. Running `node agent/tools/scrape-viagogo.js "FIFA World Cup 2026"` returns at least one listing with all required fields — Cloudflare protection is bypassed via XHR JSON interception
  2. Running `node agent/tools/scrape-facebook.js "FIFA World Cup 2026"` returns at least one listing from Facebook Marketplace without requiring manual intervention
  3. The OpenClaw heartbeat loop runs every 5 minutes (demo cadence) and invokes all three scrapers via `Promise.all()` without human trigger — visible in agent log output
  4. Listings from all three platforms are merged, deduplicated by URL hash, and written to `agent/memory/LISTINGS.md`
**Plans**: TBD

### Phase 5: Classification Engine + Evidence
**Goal**: The agent classifies every scraped listing into one of four fraud categories with a confidence score and reasoning text, gates enforcement on confidence threshold, and writes a timestamped case file per listing
**Depends on**: Phase 4
**Requirements**: CLAS-01, CLAS-02, CLAS-03, CLAS-04, EVID-01, EVID-02, EVID-03
**Success Criteria** (what must be TRUE):
  1. Every listing returned by the scan pipeline is classified as one of `SCALPING_VIOLATION`, `LIKELY_SCAM`, `COUNTERFEIT_RISK`, or `LEGITIMATE` — no unclassified listings remain
  2. Every classification includes a numeric confidence score (0-100) and a `reasoning` string explaining the signals used — both are present in the output JSON
  3. Price delta percentage vs official face value is calculated and stored on every listing object
  4. Escrow enforcement action is only triggered when confidence exceeds the configured threshold (default 85%) — a listing with confidence 60% produces no escrow action
  5. A timestamped case file exists in `agent/cases/` for every classified listing, containing screenshot path, URL, prices, classification result, confidence, action taken, and drafted enforcement text
**Plans:** 3/3 plans complete
Plans:
- [ ] 05-01-PLAN.md — Hybrid fraud classifier (rules + Claude API) with @anthropic-ai/sdk structured output
- [ ] 05-02-PLAN.md — Evidence case file writer with enforcement text drafting and idempotency
- [ ] 05-03-PLAN.md — Wire classification + evidence into scan loop with enforcement gating

### Phase 6: Escrow Enforcement Wiring
**Goal**: The agent executes the full USDT escrow lifecycle on Sepolia in response to classification outcomes — deposit, release, refund, and slash all produce confirmed on-chain transactions
**Depends on**: Phase 5
**Requirements**: ESCR-01, ESCR-02, ESCR-03, ESCR-04, ESCR-05, ESCR-06
**Success Criteria** (what must be TRUE):
  1. When the agent detects a new event, it deposits USDT into escrow via `FraudEscrow.sol` and receives a confirmed Sepolia txHash
  2. A listing classified as `LEGITIMATE` triggers a release transaction — USDT moves from escrow to seller address with a confirmed txHash
  3. A listing classified as `LIKELY_SCAM` or `COUNTERFEIT_RISK` triggers a refund transaction — USDT returns to buyer address with a confirmed txHash
  4. A listing classified as `SCALPING_VIOLATION` above the confidence threshold triggers a slash transaction — USDT moves to bounty pool with a confirmed txHash
  5. An organizer legitimacy bond is deposited and slashed correctly when fraud is confirmed above threshold
  6. Every escrow action has a clickable Sepolia Etherscan link stored in its case file — the transaction is verifiable externally
**Plans**: TBD

### Phase 7: React Dashboard
**Goal**: The React dashboard displays the live agent state — listings, classifications, escrow status, and wallet inspector — in real time using Ducket brand styling
**Depends on**: Phase 6
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. The dashboard shows a live table of all scanned listings with color-coded classification badges (`SCALPING_VIOLATION` red, `LIKELY_SCAM` orange, `COUNTERFEIT_RISK` yellow, `LEGITIMATE` green) that update within 30 seconds of the agent writing a new case file
  2. Clicking a listing row expands an "Agent Decision" panel showing the classification reasoning text and confidence score
  3. The dashboard shows current USDT escrow balance per event and wallet address — both update after each escrow action
  4. A wallet inspector element shows the key storage location as "client-side only (WDK non-custodial)" with a visual indicator that no private key is held server-side
  5. Dashboard styling uses Ducket brand colors and typography consistent with ducket-web
**Plans**: TBD

### Phase 8: Demo Integration + Submission
**Goal**: The full 5-minute demo loop runs end-to-end three consecutive times without failure, mock fallback is configured for flaky scrapers, and all submission checklist items pass
**Depends on**: Phase 7
**Requirements**: DEMO-01, DEMO-02, DEMO-03, DEMO-04
**Success Criteria** (what must be TRUE):
  1. The full demo loop (event input → scan → classify → escrow action) completes in under 5 minutes, covering all 4 required segments: agent logic, wallet flow, payment lifecycle, live full loop
  2. The demo uses FIFA World Cup 2026 with live secondary market data from at least one platform (others may use mock fallback if scrapers are flaky)
  3. Running `/demo-ready` reports all 4 demo segments as passing with no blockers
  4. A new developer can clone the repo, follow `README.md` setup instructions, and reach a running agent + dashboard without contacting the team — `/hackathon-submit` checklist passes with zero failures
**Plans**: TBD

## Progress

**Execution Order:**
Phase 1 first, then two parallel tracks converge at Phase 6:

```
Phase 1 (scaffold)
    ├── Track A: Phase 2 (WDK wallet) ──────────────────┐
    └── Track B: Phase 3 (StubHub) → Phase 4 (all scrapers) → Phase 5 (classification) ──┤
                                                                                          ▼
                                                                                     Phase 6 (escrow wiring)
                                                                                          │
                                                                                     Phase 7 (dashboard)
                                                                                          │
                                                                                     Phase 8 (demo + submit)
```

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Scaffold + Compliance | 1/1 | Complete   | 2026-03-19 |
| 2. WDK Wallet + Escrow Contract (Track A) | 0/2 | Planning complete | - |
| 3. StubHub Scraper (Track B) | 1/1 | Complete   | 2026-03-19 |
| 4. Viagogo + Facebook Marketplace + Scan Loop | 2/2 | Complete   | 2026-03-19 |
| 5. Classification Engine + Evidence | 3/3 | Complete   | 2026-03-19 |
| 6. Escrow Enforcement Wiring (needs A+B) | 0/TBD | Not started | - |
| 7. React Dashboard | 0/TBD | Not started | - |
| 8. Demo Integration + Submission | 0/TBD | Not started | - |
