# Ducket AI Galactica — Ticket Fraud & Scalping Detection Agent

## What This Is

An autonomous agent that scans secondary ticketing marketplaces (StubHub, Viagogo, Facebook Marketplace) for fraudulent or overpriced ticket listings, classifies each listing using a hybrid rules + Claude AI engine, and enforces outcomes on-chain via USDT escrow on Sepolia — all without human intervention. Built for the Tether Hackathon Galáctica: WDK Edition 1 (deadline: March 22, 2026) as an extension of Ducket's existing anti-fraud ticketing platform.

## Core Value

An organizer defines the rules once. The agent monitors, detects, and enforces — autonomously. Value settles on-chain. No human in the loop.

## Requirements

### Validated

- ✓ Agent autonomously scans 3 secondary platforms for ticket listings matching a given event — v1.0
- ✓ Agent classifies each listing as scalping violation, likely scam, counterfeit risk, or legitimate — v1.0
- ✓ Agent manages USDT escrow wallet per event using WDK (deposit, release, refund, slash) — v1.0
- ✓ Agent drafts enforcement actions (takedown requests, platform reports, public warnings) — v1.0
- ✓ Agent aggregates timestamped evidence into structured fraud case files — v1.0
- ✓ Organizers can stake USDT as legitimacy bond; agent slashes or releases based on fraud activity — v1.0
- ✓ React dashboard shows live listings, classifications, and USDT escrow status — v1.0
- ✓ Full demo flow: event input → scan → classify → escrow action — v1.0
- ✓ All wallet operations are self-custodial via WDK (no centralized custody) — v1.0
- ✓ All settlement in USDT/Tether tokens on testnet (Sepolia) — v1.0

### Active

(None — all v1 requirements validated)

### Out of Scope

- Mobile app — web-first for hackathon demo
- Real mainnet USDT — testnet only (Sepolia with faucets)
- OAuth/social login — not needed for agent-first product
- Historical analytics/reporting beyond case files — post-hackathon
- Integration with Ducket's existing Polygon ticket NFT contracts — separate chains OK
- Real-time WebSocket updates — polling every 30s indistinguishable in 5-min demo
- ML model fine-tuning — Claude API with strong prompts outperforms small fine-tuned models
- Actual takedown submission — legal risk in demo; draft text sufficient

## Context

**Shipped v1.0 MVP** on 2026-03-19 with 6,057 LOC across JS/TS/TSX/Sol/CSS.
**Tech stack:** Node.js (ESM), WDK (@tetherto/wdk-wallet-evm), Hardhat 3, Patchright, @anthropic-ai/sdk (Claude), React 19, Vite 8, Tailwind v4, Express, ethers.js.
**Demo event:** FIFA World Cup 2026 — universally recognized, massive secondary market.
**Architecture:** Monorepo with `agent/`, `dashboard/`, `contracts/` workspaces via npm workspaces.

**Hackathon:** Tether Hackathon Galáctica: WDK Edition 1. Deadline March 22, 2026. Judging criteria: (1) Agent Intelligence/autonomy, (2) WDK Wallet Integration, (3) Technical Execution, (4) Agentic Payment Design, (5) Originality, (6) Polish & Shipability, (7) Presentation & Demo.

**Custom quality gates:** `/hackathon-check`, `/wdk-check`, `/demo-ready`, `/judge-review`, `/hackathon-submit`

## Constraints

- **WDK mandatory**: All wallet operations must use Tether's WDK — no centralized custody, JS/TS only.
- **USDT settlement**: Tether tokens must be the primary settlement asset.
- **Apache 2.0**: All code must be Apache 2.0 licensed.
- **Deadline**: March 22, 2026.
- **Demo ≤ 5 min**: Video demo must cover 4 segments: agent logic, wallet flow, payment lifecycle, live full loop.
- **Out of the box**: Must be runnable by judges without special setup.
- **Public repo**: GitHub repo must be public, no secrets committed.
- **Third-party disclosure**: Must disclose all external services.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| OpenClaw as agent framework | Team already experienced with it, runs locally, open-source | ✓ Good — scan loop runs autonomously |
| WDK for all wallet ops | Hackathon mandatory requirement | ✓ Good — non-custodial, deposit works via WDK |
| Separate chains (Polygon NFTs vs USDT escrow) | WDK dictates escrow chain; existing ticket NFTs stay on Polygon | ✓ Good — clean separation |
| New standalone React app (not inside ducket-web) | Different product type, but borrow styling from ducket-web | ✓ Good — fast setup with Vite 8 |
| Claude API (claude-sonnet-4-6) for LLM | Reliable, fast enough for real-time classification | ✓ Good — structured output via output_config |
| 3 platforms (StubHub, Viagogo, Facebook Marketplace) | Global platforms, broad reach, resonates with any judge | ✓ Good — mock fallback handles anti-bot |
| FIFA World Cup 2026 as demo event | Universally recognized, massive scalping problem | ✓ Good — compelling demo narrative |
| Agent autonomy prioritized over UI polish | Judging criteria #1 is agent intelligence, #6 is polish | ✓ Good — full autonomous pipeline shipped |
| npm workspaces over Turbo | No build pipeline needed yet, zero-setup npm install for judges | ✓ Good — judges clone and npm install |
| Hardhat 3 with mocha-ethers toolbox | hardhat-toolbox@7 exits with code 1 on Hardhat 3 | ✓ Good — 9 passing unit tests |
| Patchright for scraping | DataDome-class bot protection on targets | ✓ Good — XHR interception pattern works |
| Hybrid classifier (rules + Claude) | Rule-based first pass skips API when confidence >= 85 | ✓ Good — fast, cheap, accurate |
| Two-key pattern for escrow | WDK for deposit (mandatory), ethers for owner calls | ✓ Good — satisfies WDK req + contract access |
| Mock fallback for all scrapers | Anti-bot detection on non-residential IPs | ✓ Good — demo resilience, labeled as mock |

---
*Last updated: 2026-03-19 after v1.0 milestone*
