# Feature Research

**Domain:** P2P ticket resale with AI fraud verification + USDT escrow (Ducket AI Galactica v2.0)
**Researched:** 2026-03-20
**Confidence:** HIGH (v1.0 capabilities confirmed by codebase; P2P resale flow patterns HIGH from competitor analysis)

---

## Context: What Is Already Built (v1.0 — Not To Rebuild)

These are existing dependencies. v2.0 builds on top of them, not replacing them.

| Built Capability | What It Provides to v2.0 |
|-----------------|--------------------------|
| Autonomous scanner (StubHub, Viagogo, FB Marketplace) | Listing discovery with mock fallback for demo resilience |
| Hybrid classifier (rules + Claude API) | `SCALPING_VIOLATION`, `LIKELY_SCAM`, `COUNTERFEIT_RISK`, `LEGITIMATE` + confidence + `reasoning` string |
| WDK self-custodial USDT escrow | deposit, release, refund, slash on Sepolia via `/api/escrow/:action` |
| React dashboard | Listings table, classification badges, escrow status, wallet inspector |
| Express API | `/api/listings`, `/api/wallet`, `/api/scan`, `/api/escrow/:action` |
| `Listing`, `Classification`, `WalletInfo` TypeScript contracts | Shared types across agent + dashboard |
| Evidence case files | Timestamped JSON per classified listing with on-chain tx hash |

---

## Feature Landscape

### Table Stakes (Judges Won't Take the Pivot Seriously Without These)

These are the baseline features a judge expects from any P2P resale product. Missing them makes the "safe P2P resale" framing feel like a rebrand with no substance.

| Feature | Why Expected | Complexity | Dependency on v1.0 | Notes |
|---------|--------------|------------|---------------------|-------|
| Seller listing form | Core of any P2P flow — there must be a way for a seller to submit a ticket. Without it there is no "P2P", just a monitoring tool. | LOW | None (new UI component) | Fields: event name, section, quantity, asking price, face value. On submit, trigger classification pipeline. |
| Buyer USDT lock step | Without a visible "buyer locks funds" moment there is no escrow story. Judges will ask "where does the money come from?" | LOW | Escrow deposit via WDK (already built) | UI button that calls `/api/escrow/deposit` with listing ID. WDK wallet executes the actual transfer on Sepolia. |
| AI verification step (visible) | Judges expect to see the AI make a decision — not just a badge but a narrative. "The AI checked and said..." | LOW | `Classification.reasoning` already populated | Surface full `Classification.reasoning` string in a prominent per-listing panel, not buried in a tooltip. |
| Escrow settlement outcome | The escrow lifecycle needs a visible end state. Release on legitimate, refund/slash on fraud. | LOW | release/refund/slash already built | UI calls `/api/escrow/release` or `/api/escrow/refund` based on classification result. Show Etherscan link. |
| Ducket brand styling | Dashboard must look like a product, not a scaffold. Judges score polish and judges watch a video demo. | MEDIUM | None (new CSS/components) | Purple `#7C3AED`, yellow `#FACC15`, Outfit headings, shadcn component library. Replace plain Tailwind scaffold. |
| Demo narrative framing | README and demo script must use "safe P2P resale" language, not "fraud monitoring tool". The story shapes how judges receive everything else. | LOW | None (writing, not code) | Update README intro, CLAUDE.md overview, demo script buyer/seller persona framing. |

### Differentiators (What Wins vs. What Just Qualifies)

Features that make Ducket stand out vs other hackathon submissions and vs TicketSwap/StubHub. These directly hit the top judging criteria.

| Feature | Value Proposition | Complexity | Dependency on v1.0 | Notes |
|---------|-------------------|------------|---------------------|-------|
| Non-custodial USDT escrow (no middleman) | TicketSwap holds funds in a bank for up to 5 business days. Ducket holds on-chain in a WDK self-custodial wallet — neither party can be stiffed or exit-scammed. | LOW (already built) | WDK + escrow contract | Strongest differentiator. Emphasize "no platform custody" explicitly in UI and README. |
| Full AI reasoning per listing | Competitors use black-box moderation. Ducket shows "flagged for 340% markup over face value; seller account 2 days old; FIFA scalping pattern detected across 3 platforms. Confidence: 94%." | LOW (render existing data) | `Classification.reasoning` | Turn into a full-width Agent Decision Panel component per listing. The existing reasoning string is rich enough — it just needs to be prominent. |
| Cross-platform scan (3 marketplaces) | No single marketplace enforces rules across all resale channels. Ducket's agent watches StubHub, Viagogo, and Facebook Marketplace simultaneously. | NONE (already built) | Scanner | Demo narrative: "agent detected same FIFA ticket listed on both StubHub and Viagogo at 3x face value." |
| Conditional escrow slash (fraud has a cost) | TicketSwap refunds buyers but does not penalize sellers financially. Ducket's contract slashes a legitimacy bond when fraud is confirmed. This is enforceable, not advisory. | LOW (already built) | Escrow slash | Frame as "fraud has a cost — bad actors lose their stake." Judges scoring Agentic Payment Design (#4) respond strongly to this. |
| Autonomous pipeline (not a button that calls AI) | The scan → classify → escrow action loop runs without human trigger. The UI is evidence the agent already acted, not a control panel waiting for input. | NONE (already built) | Scan loop | Make the autonomy narrative explicit: show "Agent last ran: 30s ago" and a log of actions taken without prompting. |
| Seed data with pre-classified FIFA listings | Demo resilience — if live scrapers hit anti-bot blocks during video recording, the narrative runs end-to-end on seed data. | LOW | Mock fallback already exists | Prepare 4 seed listings: 1 LEGITIMATE, 1 SCALPING_VIOLATION, 1 LIKELY_SCAM, 1 COUNTERFEIT_RISK — each with rich reasoning text. |

### Anti-Features (Deliberately Not Building)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real user accounts / auth | "Real P2P needs real users" | Adds auth complexity blocking demo in under 5 min; judges don't create accounts in a video demo | Hardcode two mock personas — "Seller: Alice", "Buyer: Bob". Tells the story without any login friction. |
| Real USDT on mainnet | "More impressive with real money" | Hackathon rules require testnet; mainnet introduces irreversible financial risk and legal exposure | Sepolia testnet USDT with explicit "TESTNET" label. Judges in Web3 hackathons understand this convention. |
| WebSocket real-time updates | "Listings should update live" | Socket infrastructure adds setup complexity; 30s polling is visually indistinguishable in a 5-min demo | Keep existing polling. Add "Last updated: X seconds ago" timestamp to signal freshness. |
| Barcode invalidation (SecureSwap pattern) | "TicketSwap invalidates original barcodes — we should too" | Requires integration with ticketing providers' APIs (not available); weeks of partnership negotiation | Frame AI verification as the replacement: "We verify legitimacy before funds release, eliminating the need to invalidate barcodes after entry." |
| Multi-step dispute resolution | "What if buyer and seller disagree?" | Dispute resolution is a full product in itself — arbitration, multi-sig, timers, appeals | State in README: "v1.0 auto-resolves via AI verdict. Human dispute resolution is on the roadmap." |
| Mobile-responsive UI | "Users are on mobile" | Extra CSS work consuming time from core agent story; adds risk of breaking desktop layout | Widescreen dashboard is appropriate framing for an "AI command center". Judges watch a demo, not try the app on their phone. |
| Historical analytics / charts | "Show trends over time" | Polish (#6) not autonomy (#1); Chart.js time-series takes a day to implement correctly | Case files already capture timestamped evidence. Link to them as the audit trail — structured JSON is sufficient. |
| Polygon NFT ticket contract integration | "Full Ducket stack" | Different chain from WDK escrow; cross-chain complexity with zero judging benefit; extreme scope risk | Reference Ducket's existing Polygon contracts in README as context for the broader product vision. |

---

## Feature Dependencies

```
[Seller Listing Form]
    └──triggers──> [Hybrid Classifier] (v1.0)
                       └──populates──> [Classification.reasoning]
                                           └──renders in──> [Agent Decision Panel]
                                           └──drives──> [Escrow Settlement Outcome]

[Buyer USDT Lock Step]
    └──calls──> [Escrow Deposit via WDK] (v1.0)
                    └──unlocks──> [Escrow Settlement Outcome]
                                      ├──LEGITIMATE──> [Release to seller]
                                      ├──SCAM/COUNTERFEIT──> [Refund to buyer]
                                      └──SCALPING──> [Slash legitimacy bond]

[Seed Data with Pre-classified Listings]
    └──powers──> [Full demo without live scrapers]
                     └──uses──> [Mock fallback] (v1.0)

[Ducket Brand Styling]
    └──wraps──> [All UI components]
                    └──replaces──> [Plain Tailwind scaffold] (v1.0)

[Demo Narrative Framing]
    └──contextualizes──> [All UI features]
    └──updates──> [README + demo script]
```

### Dependency Notes

- **Seller listing form requires classifier:** The form submission must trigger or simulate a classification call so the AI reasoning panel has data to display. Without this the "AI verifies" step is empty.
- **Buyer USDT lock requires escrow deposit:** WDK wallet must execute the deposit. This is already built — the UI is a thin wrapper calling existing API endpoints.
- **Escrow settlement requires classification result:** The release vs refund vs slash decision is driven by the `category` field on the `Classification` object. This wiring is the only new backend logic in v2.0.
- **Agent Decision Panel enhances both listing form and buyer lock step:** Showing reasoning at each stage of the flow makes the AI feel active throughout the transaction, not just as a post-hoc badge.
- **Ducket brand styling does NOT block logic features:** Apply after the buyer/seller flow is wired. Never let styling work gate the escrow demo path.
- **Seed data does NOT block any feature:** Prepare it in parallel. It is a fixture file, not a dependency.

---

## MVP Definition

### Launch With (v2.0 — Hackathon Deadline March 22, 2026)

The minimum set needed to tell the P2P resale story credibly to judges in under 5 minutes.

- [ ] **Seller listing form** — Submit ticket details, trigger AI classification, show reasoning immediately
- [ ] **Agent Decision Panel** — Full `Classification.reasoning` text visible per listing in a prominent, styled component
- [ ] **Buyer USDT lock step** — UI button calling escrow deposit, shows WDK wallet address and Etherscan link
- [ ] **Escrow settlement outcome** — UI shows release/refund/slash result with on-chain tx link, driven by classification
- [ ] **Ducket brand styling** — Purple/yellow theme, Outfit headings, shadcn components applied to existing dashboard
- [ ] **Seed data with pre-classified FIFA listings** — 4 listings covering all classification types, each with rich reasoning text
- [ ] **Demo narrative reframe** — README intro and demo script updated to P2P resale framing with buyer/seller personas

### Add After Validation (v2.x — Post-hackathon)

- [ ] **Real seller/buyer accounts** — Add when auth is needed for real users (post-hackathon product decision)
- [ ] **Barcode invalidation** — Add when a ticketing provider API partnership is in place
- [ ] **Dispute resolution flow** — Add when user research surfaces it as a trust blocker

### Future Consideration (v3+)

- [ ] **Mobile UI** — Defer until product-market fit is established
- [ ] **Historical analytics** — Defer until time-series data pipeline is in place
- [ ] **Multi-chain escrow** — Defer until WDK supports additional chains beyond Sepolia

---

## Feature Prioritization Matrix

| Feature | Judge Value | Implementation Cost | Priority |
|---------|-------------|---------------------|----------|
| Agent Decision Panel (surface existing reasoning) | HIGH — Criterion #1 Agent Intelligence | LOW — render `Classification.reasoning` string | P1 |
| Buyer USDT lock step | HIGH — Criterion #2 WDK Integration | LOW — call existing deposit API | P1 |
| Escrow settlement outcome | HIGH — Criterion #4 Agentic Payment Design | LOW — call existing release/refund/slash | P1 |
| Seller listing form | HIGH — makes P2P pivot credible to judges | LOW — form component + classify trigger | P1 |
| Seed data (pre-classified FIFA listings) | HIGH — demo resilience, no blank state | LOW — JSON fixture file | P1 |
| Ducket brand styling | MEDIUM — Criterion #6 Polish | MEDIUM — rebrand existing components with shadcn | P2 |
| Demo narrative reframe (README, script) | MEDIUM — Criterion #7 Presentation | LOW — writing, not code | P2 |

**Priority key:**
- P1: Must have — without this the demo fails or the P2P pivot is not believable
- P2: Should have — measurably improves score, completable within deadline
- P3: Nice to have — post-hackathon

---

## Competitor Feature Analysis

| Feature | TicketSwap | StubHub | Ducket v2.0 |
|---------|------------|---------|-------------|
| Fraud prevention | SecureSwap barcode invalidation (partner events only); manual review otherwise | Seller guarantee + refund policy | AI classification with full visible reasoning + on-chain evidence hash |
| Payment security | Platform holds funds in bank for up to 5 business days | Fiat payout 5-10 days after event | WDK non-custodial USDT — funds on-chain, auto-release by AI verdict |
| Price cap enforcement | 20% above face value (soft; no financial penalty) | No cap | Scalping classification triggers refund/slash — economically enforceable |
| Transparency | Seller name/photo/sales history visible | Limited | Full AI reasoning log + Etherscan tx link per classification |
| Decentralization | None — centralized platform custody | None | Self-custodial WDK wallet; no platform holds funds |
| Settlement speed | Up to 5 business days | 5-10 business days | Near-instant on Sepolia testnet |
| Cross-platform enforcement | No | No | Agent scans 3 platforms simultaneously; same ticket flagged across venues |

**Key insight from research:** TicketSwap's SecureSwap is the closest competitor feature — but it only works for partnered events, applies only to barcodes (not AI reasoning), and gives buyers no visibility into why a ticket was accepted or rejected. Ducket's differentiator is not just safety — it is *explainable, enforceable* safety backed by on-chain funds that don't depend on platform goodwill or partnership agreements.

---

## What Makes AI Verification Compelling for Judges

Based on winning agentic payment hackathon patterns (Arc/USDC, AgentVerse, x402 Berlin ideathon) and the Tether Hackathon's explicit judging criteria:

**1. Visible reasoning, not just a verdict.**
"This ticket is suspicious" scores low. "Price is 340% above face value. Seller account created 2 days ago. Listing pattern matches FIFA scalping campaigns detected across StubHub and Viagogo simultaneously. Confidence: 94%." scores high. The `Classification.reasoning` string from the Claude API already contains this — it just needs to be front and center in the UI.

**2. Money movement that is conditional on AI output.**
The agent deciding whether USDT releases or gets slashed makes the AI consequential — not decorative. Criterion #4 (Agentic Payment Design) is directly satisfied by this conditional escrow pattern. Judges from the agentic payments space understand "AI-gated funds release" as a novel primitive.

**3. Autonomous pipeline, not a button that calls an API.**
The scan → classify → escrow action loop running without a human trigger is the core story. The UI is evidence the agent already acted. Judges evaluating Criterion #1 (Agent Intelligence) distinguish between "agent that waits for prompts" and "agent that monitors and acts on its own schedule."

**4. Escrow as trust infrastructure, not just payment.**
The framing "buyer's USDT is held until the AI certifies the ticket is legitimate" positions escrow as a trust primitive that replaces platform reputation. This is the novel payment design angle. Competitors (TicketSwap, StubHub) use escrow as a payment delay — Ducket uses it as a conditional trust mechanism.

**5. Economic consequence for fraud.**
The slash action (confirmed fraud → legitimacy bond burned) is what separates detection from enforcement. Hackathon judges in the agentic finance space consistently reward designs where the agent's decisions have real (testnet) economic consequences.

---

## Sources

- [TicketSwap: How it works](https://www.ticketswap.com/how-does-it-work) — Buyer/seller flow reference, SecureSwap verification pattern
- [TicketSwap SecureSwap feature](https://help.ticketswap.com/en/articles/5123901-what-is-secureswap) — Competitor verification mechanism details
- [P2PTIX platform](https://p2ptix.com/) — P2P escrow-hold flow pattern (payment held until receipt confirmed)
- [Smart Escrow for Marketplaces 2026](https://rebelfi.io/blog/how-smart-escrow-unlocks-new-business-models-for-marketplaces-and-b2b) — Smart escrow market context and conditional release patterns
- [x402 Ideathon Berlin: agentic commerce patterns](https://algorand.co/blog/x402-ideathon-berlin-recap-web3-builders-exploring-agentic-commerce) — Winning hackathon agentic payment patterns
- [Agentic Payments Hackathon (YC HQ)](https://events.ycombinator.com/agenticpaymentshackathon) — Judging criteria context for agentic payment design
- [NFT Ticketing 2026 market context](https://www.ticketfairy.com/blog/mastering-nft-ticketing-for-event-marketing-in-2026-blockchain-boosts-security-fan-engagement) — Blockchain ticket verification market and demand
- [Smart Contract Escrow Development 2026](https://ericaai.tech.blog/2026/03/13/smart-contract-escrow-development/) — Technical escrow flow patterns
- Ducket v1.0 codebase — `dashboard/src/types.ts`, `dashboard/src/components/` — confirmed built capabilities

---
*Feature research for: P2P ticket resale with AI fraud verification + USDT escrow (Ducket AI Galactica v2.0)*
*Researched: 2026-03-20*
