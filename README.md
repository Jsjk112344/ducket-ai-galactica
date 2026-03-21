# Ducket AI Galactica

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)

Safe P2P ticket resale powered by an autonomous AI agent and USDT escrow. Seller lists a ticket, buyer locks USDT, an OpenClaw-orchestrated agent verifies legitimacy, and a smart contract releases or refunds — no human in the loop.

## How It Works

1. **Seller Lists Ticket** — Seller posts event details (event name, section, quantity, price, face value) to the platform. The listing enters a "Pending Verification" state.

2. **Buyer Locks USDT** — Buyer selects a listing and deposits USDT into escrow via WDK non-custodial wallet on Sepolia. Funds are held by the smart contract — not by the seller or the platform.

3. **AI Agent Verifies** — An OpenClaw-orchestrated agent dispatches three skills autonomously: scrape market data, classify the listing (5-signal risk scoring + Claude AI for ambiguous cases), and route the verdict to escrow. The agent produces a confidence score and detailed reasoning — no human trigger required.

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
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    OpenClaw Agent Gateway                         │   │
│  │          Orchestration · Skill Dispatch · Session State           │   │
│  │                                                                   │   │
│  │  ┌─────────────┐   ┌──────────────────┐   ┌─────────────────┐   │   │
│  │  │ Scan Skill   │   │ Classify Skill    │   │ Escrow Skill    │   │   │
│  │  │ (SKILL.md)   │   │ (SKILL.md)        │   │ (SKILL.md)      │   │   │
│  │  │              │   │                   │   │                 │   │   │
│  │  │ StubHub      │   │ Tier 1: Rules     │   │ deposit (WDK)   │   │   │
│  │  │ Viagogo      │   │  85%+ → instant   │   │ release         │   │   │
│  │  │ Facebook     │   │ Tier 2: Claude AI │   │ refund          │   │   │
│  │  │ (Patchright) │   │  <85% → reasoning │   │ slash           │   │   │
│  │  └──────┬───────┘   └────────┬──────────┘   └────────┬────────┘   │   │
│  │         │                    │                        │            │   │
│  │         └────────────────────┼────────────────────────┘            │   │
│  │                              │                                     │   │
│  │         Agent decides autonomously: scan → classify → enforce      │   │
│  └──────────────────────────────┼────────────────────────────────────┘   │
│                                 │                                        │
│                    ┌────────────┴────────────┐                           │
│                    ▼                         ▼                           │
│         ┌──────────────────┐     ┌──────────────────┐                   │
│         │  ✅ LEGITIMATE    │     │  ❌ VIOLATION     │                   │
│         │  Release USDT    │     │  Slash/Refund    │                   │
│         │  to seller       │     │  to buyer/pool   │                   │
│         └────────┬─────────┘     └────────┬─────────┘                   │
│                  └──────────┬─────────────┘                             │
│                             ▼                                           │
│              ┌──────────────────────────────────┐                       │
│              │      FraudEscrow.sol (Sepolia)    │                       │
│              │  deposit / release / refund / slash│                      │
│              │  SafeERC20 · ReentrancyGuard      │                       │
│              └──────────────────────────────────┘                       │
│                                                                          │
│   OpenClaw owns orchestration · Claude AI owns reasoning · WDK owns funds│
└──────────────────────────────────────────────────────────────────────────┘
```

## How the AI Agent Decides

The agent separates **orchestration** (OpenClaw), **reasoning** (Claude AI), and **execution** (WDK):

**OpenClaw** manages the autonomous agent loop — it decides *when* to act, dispatches skills, and maintains session state across scan cycles. Three skills are registered:

| Skill | Purpose | Invokes |
|-------|---------|---------|
| **ducket-scan** | Scrape listings from 3 platforms | Patchright scrapers (StubHub, Viagogo, Facebook) |
| **ducket-classify** | Score and classify each listing | 5-signal risk engine + Claude AI escalation |
| **ducket-escrow** | Execute on-chain settlement | WDK wallet operations on FraudEscrow.sol |

**Classification** uses a two-tier engine — deterministic rules first, Claude AI for ambiguous cases:

| Tier | When | Speed | Cost |
|------|------|-------|------|
| **Rules** | Confidence ≥ 85% (obvious scalping, scam bait) | Instant | Free |
| **Claude** | Confidence < 85% (borderline pricing, mixed signals) | ~2s | API call |

The classification skill scores **5 weighted risk signals**: pricing risk (30%), seller trust (25%), listing quality (20%), temporal patterns (15%), and platform trust (10%). High-confidence zones are decided instantly by rules. Ambiguous cases (composite risk 25-70) are escalated to Claude AI with the full signal breakdown for nuanced reasoning.

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

- Node.js >= 22.16.0
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
    tools/           Market data sources (Patchright scrapers)
    skills/          OpenClaw skill definitions (SKILL.md files)
    cli/             CLI wrapper scripts bridging OpenClaw to agent modules
    memory/          Listing records
    cases/           Verification evidence per listing
    SOUL.md          OpenClaw agent identity and mission
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
| OpenClaw | Agent orchestration — skill dispatch, session management, autonomous loop |
| @anthropic-ai/sdk (Claude) | Classification reasoning — structured verdicts with 5-signal analysis |
| @tetherto/wdk + wdk-wallet-evm | Non-custodial USDT wallet — escrow deposits, approvals, settlements |
| ethers v6 | ABI encoding, contract reads, Sepolia provider |
| Patchright | Anti-bot scraping (StubHub, Viagogo, Facebook Marketplace) |
| React 19 + Vite 8 | Dashboard UI with resale flow wizard |
| Tailwind CSS v4 | Dashboard styling (M3 dark theme) |
| Hardhat 3 | FraudEscrow.sol compilation and testing |
| Ethereum Sepolia | Testnet — all transactions are real on-chain |

## Third-Party Disclosures

All third-party services are used in accordance with their respective terms of service.
No mainnet funds are used — Sepolia testnet only. See tech stack above for full list.

## Environment Variables

See `.env.example` for all required variables with explaining comments.

## License

Apache 2.0 — see [LICENSE](./LICENSE)
