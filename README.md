# Ducket AI Galactica

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)

Safe P2P ticket resale powered by AI and USDT escrow. Seller lists a ticket, buyer locks USDT, an autonomous AI agent verifies legitimacy, and a smart contract releases or refunds — no human in the loop.

## How It Works

1. **Seller Lists Ticket** — Seller posts event details (event name, section, quantity, price, face value) to the platform. The listing enters a "Pending Verification" state.

2. **Buyer Locks USDT** — Buyer selects a listing and deposits USDT into escrow via WDK non-custodial wallet on Sepolia. Funds are held by the smart contract — not by the seller or the platform.

3. **AI Agent Verifies** — An autonomous verification agent analyzes the listing against market data, price caps, and cross-platform signals using Claude. The agent produces a confidence score and detailed reasoning — no human trigger required.

4. **Escrow Settles** — The smart contract releases USDT to the seller (legitimate listing) or refunds the buyer (failed verification) based entirely on the agent's verdict.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         DUCKET AI GALACTICA                              │
│                       Safe P2P Ticket Resale                             │
│                                                                          │
│  ┌──────────┐  1. list ticket   ┌──────────────────────────────────┐    │
│  │  Seller  │ ────────────────> │         React Dashboard          │    │
│  └──────────┘                   │     localhost:5173 (read-only)   │    │
│                                 │                                  │    │
│  ┌──────────┐  2. lock USDT    │  Resale Flow: List → Lock →      │    │
│  │  Buyer   │ ────────────────> │  Verify → Settle                 │    │
│  └──────────┘   (WDK wallet)   └──────────────┬───────────────────┘    │
│                                                │                        │
│                                                ▼                        │
│                                 ┌──────────────────────────────────┐    │
│                                 │     AI Verification Agent        │    │
│                                 │                                  │    │
│                                 │  Tier 1: Deterministic Rules     │    │
│                                 │  • price > 100% above face → ❌  │    │
│                                 │  • price < -10% face → ❌        │    │
│                                 │  • confidence ≥ 85% → done       │    │
│                                 │                                  │    │
│                                 │  Tier 2: Claude AI (ambiguous)   │    │
│                                 │  • structured JSON verdict       │    │
│                                 │  • category + confidence + why   │    │
│                                 └──────────┬───┬──────────────────┘    │
│                                            │   │                        │
│                          ┌─────────────────┘   └──────────────────┐     │
│                          ▼                                        ▼     │
│               ┌─────────────────────┐              ┌─────────────────┐  │
│               │  ✅ LEGITIMATE       │              │  ❌ VIOLATION    │  │
│               │  Release USDT       │              │  Slash/Refund   │  │
│               │  to seller          │              │  to buyer/pool  │  │
│               └─────────┬───────────┘              └────────┬────────┘  │
│                         │                                   │           │
│                         └──────────────┬────────────────────┘           │
│                                        ▼                                │
│                         ┌──────────────────────────────────┐            │
│                         │      FraudEscrow.sol (Sepolia)   │            │
│                         │  deposit / release / refund / slash │         │
│                         │  SafeERC20 · ReentrancyGuard     │            │
│                         └──────────────────────────────────┘            │
│                                                                          │
│            All wallet ops via WDK — non-custodial, keys never persisted │
└──────────────────────────────────────────────────────────────────────────┘

Data sources (agent-sourced, not seller-reported):
  StubHub ──┐
  Viagogo ──┼── Patchright scrapers ──> price comparison + fraud signals
  Facebook ─┘
  FIFA 2026 face value database ──> baseline for markup calculations
```

## How the AI Agent Decides

The agent uses a **two-tier classification engine** — deterministic rules first, Claude AI for ambiguous cases:

| Tier | When | Speed | Cost |
|------|------|-------|------|
| **Rules** | Confidence ≥ 85% (obvious scalping, scam bait) | Instant | Free |
| **Claude** | Confidence < 85% (borderline pricing, mixed signals) | ~2s | API call |

**Classification categories and escrow outcomes:**

| Category | Trigger | Escrow Action |
|----------|---------|---------------|
| SCALPING_VIOLATION | Price > 100% above face value | Slash to bounty pool |
| LIKELY_SCAM | Price < 10% below face value (bait pricing) | Refund to buyer |
| COUNTERFEIT_RISK | Red flags (new seller, no proof of ticket) | Refund to buyer |
| LEGITIMATE | Fair price, no red flags | Release to seller |

Face values are **agent-sourced** from an independent FIFA 2026 database — the seller never sets their own baseline.

## What the Demo Shows

`npm run demo` runs both cycles automatically:

**Cycle 1 — Legitimate listing:** Seller lists FIFA World Cup tickets at a fair price → buyer locks USDT → agent approves (rules: 25% markup, within bounds) → escrow released to seller.

**Cycle 2 — Scalper caught:** Same event, 608% markup → buyer locks USDT → agent rejects (rules: SCALPING_VIOLATION, 95% confidence) → escrow slashed. Same pipeline, opposite outcome — the agent decided, the contract enforced.

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0

### Setup

```bash
git clone https://github.com/niccoloducket/ducket-ai-galactica.git
cd ducket-ai-galactica
npm install
cp .env.example .env
# Fill in your API keys (see .env.example for details)
```

### Run

```bash
npm run demo
# Starts AI verification agent + React dashboard simultaneously
# Agent verifies ticket listings against market data
# Dashboard: http://localhost:5173
```

## Project Structure

```
ducket-ai-galactica/
  agent/             AI verification agent
    src/             Core pipeline (verification loop, AI analysis, escrow settlement)
    tools/           Market data sources
    memory/          Listing records
    cases/           Verification evidence per listing
  dashboard/         React dashboard (Vite + Tailwind v4)
    src/             Resale flow UI components
    server/          Express API serving listing and escrow data
  contracts/         FraudEscrow.sol (Hardhat 3)
```

## Demo Video

[VIDEO LINK — to be added before submission]

## Tech Stack

| Technology | Usage |
|-----------|-------|
| @tetherto/wdk + wdk-wallet-evm | Non-custodial USDT wallet — escrow deposits, approvals, settlements |
| @anthropic-ai/sdk (Claude) | Tier 2 AI classification — structured verdicts with reasoning |
| ethers v6 | ABI encoding, contract reads, Sepolia provider |
| Patchright | Anti-bot scraping (StubHub, Viagogo, Facebook Marketplace) |
| React 19 + Vite 8 | Dashboard UI with resale flow wizard |
| Tailwind CSS v4 | Dashboard styling |
| Hardhat 3 | FraudEscrow.sol compilation and testing |
| node-cron | Autonomous 5-minute scan loop |
| Ethereum Sepolia | Testnet — all transactions are real on-chain |

## Third-Party Disclosures

All third-party services are used in accordance with their respective terms of service.
No mainnet funds are used — Sepolia testnet only. See tech stack above for full list.

## Environment Variables

See `.env.example` for all required variables with explaining comments.

## License

Apache 2.0 — see [LICENSE](./LICENSE)
