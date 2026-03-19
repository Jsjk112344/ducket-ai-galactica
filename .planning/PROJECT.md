# Ducket AI Galactica — Ticket Fraud & Scalping Detection Agent

## What This Is

An autonomous agent that scans secondary ticketing marketplaces (Carousell, Viagogo, Telegram/Facebook Marketplace) for fraudulent or overpriced ticket listings, classifies each listing (scalping, scam, counterfeit, legitimate), and enforces outcomes on-chain via USDT escrow — all without human intervention. Built for the Tether Hackathon Galáctica: WDK Edition 1 (deadline: March 22, 2026) as an extension of Ducket's existing anti-fraud ticketing platform.

## Core Value

An organizer defines the rules once. The agent monitors, detects, and enforces — autonomously. Value settles on-chain. No human in the loop.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Agent autonomously scans 3 secondary platforms for ticket listings matching a given event
- [ ] Agent classifies each listing as scalping violation, likely scam, counterfeit risk, or legitimate
- [ ] Agent manages USDT escrow wallet per event using WDK (deposit, release, refund, slash)
- [ ] Agent drafts enforcement actions (takedown requests, platform reports, public warnings)
- [ ] Agent aggregates timestamped evidence into structured fraud case files
- [ ] Organizers can stake USDT as legitimacy bond; agent slashes or releases based on fraud activity
- [ ] React dashboard shows live listings, classifications, and USDT escrow status
- [ ] Full demo flow: event input → scan → classify → escrow action (deposit → fraud → refund)
- [ ] All wallet operations are self-custodial via WDK (no centralized custody)
- [ ] All settlement in USDT/Tether tokens on testnet (Sepolia)

### Out of Scope

- Mobile app — web-first for hackathon demo
- Real mainnet USDT — testnet only (Sepolia with faucets)
- OAuth/social login — not needed for agent-first product
- Historical analytics/reporting beyond case files — post-hackathon
- Integration with Ducket's existing Polygon ticket NFT contracts — separate chains OK, not a requirement for this build

## Context

**Hackathon:** Tether Hackathon Galáctica: WDK Edition 1. Deadline March 22, 2026. Judging criteria in priority order: (1) Agent Intelligence/autonomy, (2) WDK Wallet Integration, (3) Technical Execution, (4) Agentic Payment Design, (5) Originality, (6) Polish & Shipability, (7) Presentation & Demo.

**Existing Ducket platform:** Mature ERC1155 ticketing contracts on Polygon (V1→DucketV2) with resale price caps, burning, marketplace metadata. These exist in sibling repo `ducket-web` but are NOT being integrated into this build. The agent is a complementary product, not an extension of the existing contracts.

**Demo event:** Guns N' Roses Singapore (https://ticketmaster.sg/activity/detail/26sg_gunsnroses). A real event with active secondary market listings to demonstrate against.

**Team familiarity:**
- OpenClaw agent framework: experienced, have built agents before
- WDK (Tether Wallet Development Kit): completely new — integration is a known risk area
- Web scraping: building all 3 platform scrapers from scratch
- React/TypeScript/Tailwind: comfortable

**Custom skills created for quality gates:**
- `/hackathon-check` — audit against 7 judging criteria + 6 hard rules
- `/wdk-check` — verify WDK integration correctness & non-custodial compliance
- `/demo-ready` — verify all 4 demo segments work in ≤5 min
- `/judge-review` — simulate judge evaluation, surface weaknesses
- `/hackathon-submit` — pre-submission compliance checklist

## Constraints

- **WDK mandatory**: All wallet operations must use Tether's WDK — no centralized custody, JS/TS only for wallet ops. Disqualified without it.
- **USDT settlement**: Tether tokens must be the primary settlement asset — no ETH, no other stablecoins.
- **Apache 2.0**: All code must be Apache 2.0 licensed.
- **Deadline**: March 22, 2026 — 3 days from now. Architecture > polish when time is tight.
- **Demo ≤ 5 min**: Video demo must cover 4 segments: agent logic, wallet flow, payment lifecycle, live full loop.
- **Out of the box**: Must be runnable by judges without special setup.
- **Public repo**: GitHub repo must be public, no secrets committed.
- **Third-party disclosure**: Must disclose all external services (Claude API, TinyFish/Playwright, OpenClaw, etc.).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| OpenClaw as agent framework | Team already experienced with it, runs locally, open-source | — Pending |
| WDK for all wallet ops | Hackathon mandatory requirement | — Pending |
| Separate chains (Polygon NFTs vs USDT escrow) | WDK dictates escrow chain; existing ticket NFTs stay on Polygon | — Pending |
| New standalone React app (not inside ducket-web) | Different product type, but borrow styling from ducket-web | — Pending |
| Claude API (claude-sonnet-4-20250514) for LLM | Reliable, fast enough for real-time classification | — Pending |
| 3 platforms for demo (Carousell, Viagogo, Telegram/FB) | Full breadth shows real-world applicability to judges | — Pending |
| Guns N' Roses Singapore as demo event | Real upcoming event with active secondary market | — Pending |
| Agent autonomy prioritized over UI polish | Judging criteria #1 is agent intelligence, #6 is polish | — Pending |

---
*Last updated: 2026-03-19 after initialization*
