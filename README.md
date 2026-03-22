# Ducket AI Galactica

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)

Trustless Event Ticket Reselling — List tickets, buy with confidence. An OpenClaw agent scrapes live marketplaces via real Chrome, verifies every listing across five fraud signals, and enforces verdicts through USDT escrow.

## The Problem

Ticket resale is broken. StubHub charges 25% fees. Facebook Marketplace is rife with scams. Buyers have no way to verify a listing is legitimate before paying, and sellers have no way to prove they're trustworthy.

## How Ducket Fixes It

Ducket replaces trust with an autonomous AI agent. No middleman, no fees, no scams.

1. **Seller Lists Ticket** — Seller posts event details (event, section, quantity, price). The listing enters "Pending Verification."

2. **Agent Scrapes & Verifies** — The OpenClaw agent uses real Chrome (via CDP browser control) to browse StubHub, Viagogo, and Facebook Marketplace — bypassing anti-bot tools that block headless scrapers. It then classifies the listing across 5 weighted risk signals and produces an explainable verdict.

3. **Buyer Locks USDT** — Buyer selects a verified listing and deposits USDT into escrow via WDK non-custodial wallet on Sepolia. Funds are held by the smart contract — not by the seller or the platform.

4. **Escrow Settles** — The smart contract releases USDT to the seller (legitimate) or refunds the buyer (fraud) based entirely on the agent's verdict.

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
│  │      Orchestration · Browser Control · Skill Dispatch             │   │
│  │                                                                   │   │
│  │  ┌─────────────┐   ┌──────────────────┐   ┌─────────────────┐   │   │
│  │  │ Scan Skill   │   │ Classify Skill    │   │ Escrow Skill    │   │   │
│  │  │              │   │                   │   │                 │   │   │
│  │  │ Real Chrome  │   │ Tier 1: Rules     │   │ deposit (WDK)   │   │   │
│  │  │ via CDP →    │   │  85%+ → instant   │   │ release         │   │   │
│  │  │ StubHub      │   │ Tier 2: Claude AI │   │ refund          │   │   │
│  │  │ Viagogo      │   │  <85% → reasoning │   │ slash           │   │   │
│  │  │ Facebook     │   │                   │   │                 │   │   │
│  │  └──────┬───────┘   └────────┬──────────┘   └────────┬────────┘   │   │
│  │         └────────────────────┼────────────────────────┘            │   │
│  │                              │                                     │   │
│  │         Agent decides autonomously: scan → classify → enforce      │   │
│  └──────────────────────────────┼────────────────────────────────────┘   │
│                                 │                                        │
│                    ┌────────────┴────────────┐                           │
│                    ▼                         ▼                           │
│         ┌──────────────────┐     ┌──────────────────┐                   │
│         │  LEGITIMATE       │     │  VIOLATION        │                   │
│         │  Release USDT    │     │  Slash/Refund     │                   │
│         │  to seller       │     │  to buyer/pool    │                   │
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

## How the AI Agent Works

The agent separates **orchestration** (OpenClaw), **scraping** (OpenClaw Browser), **reasoning** (Claude AI), and **execution** (WDK):

### OpenClaw Browser Scraping

Traditional headless scrapers (Playwright, Puppeteer) get blocked by anti-bot tools — Cloudflare Enterprise, Akamai Bot Manager, DataDome. Our agent uses **OpenClaw's browser control** to navigate through real Chrome via CDP:

- No automation flags, real browser fingerprint, real cookies
- Anti-bot tools see a normal Chrome session, not a headless bot
- Two-step scraping: search page → find event URLs → navigate into events → extract ticket data
- Graceful fallback: OpenClaw browser → Patchright stealth scraper → labeled mock data

### OpenClaw Skill Dispatch

Three skills are registered with the OpenClaw agent:

| Skill | Purpose | Method |
|-------|---------|--------|
| **ducket-scan** | Scrape live listings from 3 marketplaces | OpenClaw browser (real Chrome via CDP) |
| **ducket-classify** | Score and classify each listing | 5-signal risk engine + Claude AI escalation |
| **ducket-escrow** | Execute on-chain settlement | WDK wallet operations on FraudEscrow.sol |

### Two-Tier Classification

| Tier | When | Speed | Cost |
|------|------|-------|------|
| **Rules** | Confidence ≥ 85% (obvious scalping, scam bait) | Instant | Free |
| **Claude** | Confidence < 85% (borderline pricing, mixed signals) | ~2s | API call |

**5 weighted risk signals**: pricing risk (30%), seller trust (25%), listing quality (20%), temporal patterns (15%), platform trust (10%).

### Classification → Escrow Outcomes

| Category | Trigger | Escrow Action |
|----------|---------|---------------|
| SCALPING_VIOLATION | Price > 100% above face value | Slash to bounty pool |
| LIKELY_SCAM | Price < 10% below face value (bait pricing) | Refund to buyer |
| COUNTERFEIT_RISK | Red flags (new seller, no proof of ticket) | Refund to buyer |
| LEGITIMATE | Fair price, no red flags | Release to seller |

Face values are **agent-sourced** from an independent FIFA 2026 database — the seller never sets their own baseline.

## Quick Start

### Prerequisites

- **Node.js** >= 22.0.0
- **npm** >= 9.0.0
- **OpenClaw** CLI installed (`npm i -g openclaw` or `npx openclaw`)
- **Google Chrome** installed (for OpenClaw browser control)

### Setup

```bash
git clone https://github.com/niccoloducket/ducket-ai-galactica.git
cd ducket-ai-galactica
npm install
```

Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env
```

**Required** environment variables:

| Variable | Description |
|----------|-------------|
| `CLAUDE_API_KEY` | Anthropic API key for AI classification |

**Optional** (needed for on-chain escrow — demo works without these, classification still runs):

| Variable | Description |
|----------|-------------|
| `ESCROW_WALLET_SEED` | BIP-39 seed phrase for WDK wallet (testnet only) |
| `WDK_API_KEY` | Tether WDK API key |
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint (e.g. Infura or Alchemy) |

See `.env.example` for the full list with descriptions.

### Run the Demo

**Full demo** (OpenClaw browser scraping + AI classification + escrow + dashboard):

```bash
npm run demo:openclaw
```

This starts 4 processes concurrently:
1. **OpenClaw Gateway** — agent orchestration on `ws://127.0.0.1:18789`
2. **OpenClaw Browser** — real Chrome instance for anti-bot scraping
3. **Pipeline** — one-shot scan → classify → escrow cycle via OpenClaw browser
4. **Dashboard** — React UI at `http://localhost:5173`

**Standard demo** (Patchright headless scraping + cron loop):

```bash
npm run demo
```

**Fallback** (no OpenClaw, Patchright only):

```bash
npm run demo:fallback
```

### What You'll See

- **Terminal**: The agent browses StubHub, Viagogo, and Facebook Marketplace in real Chrome, extracts live ticket listings, classifies each one, and logs verdicts with confidence scores and reasoning
- **Dashboard** (`http://localhost:5173`): Resale flow UI showing listings, agent verdicts, signal breakdowns, and escrow status

## Project Structure

```
ducket-ai-galactica/
  agent/                  AI verification agent
    src/                  Core pipeline (scan loop, classifier, escrow, evidence)
      openclaw-loop.js    OpenClaw browser pipeline (scan → classify → escrow)
      scan-loop.js        Cron-based pipeline (fallback, Patchright scrapers)
      classify.js         Two-tier classification engine (rules + Claude AI)
      escrow.js           On-chain escrow lifecycle (deposit/release/refund/slash)
      evidence.js         Case file writer (one markdown file per listing verdict)
      wallet/             WDK wallet singleton (non-custodial, BIP-44)
    tools/                Market data scrapers
      browse.js           OpenClaw browser scraper (real Chrome via CDP)
      scrape-stubhub.js   Patchright StubHub scraper (XHR interception)
      scrape-viagogo.js   Patchright Viagogo scraper (XHR interception)
      scrape-facebook.js  Patchright Facebook scraper (DOM extraction)
      mock-data.js        Dynamic mock generator with realistic fraud patterns
    openclaw/             OpenClaw workspace
      SOUL.md             Agent identity and mission
      skills/             Skill definitions (scan, classify, escrow)
    data/                 Seed listing data (real prices captured from live sites)
    cases/                Generated verdict case files (gitignored)
    memory/               Listing records (gitignored)
  dashboard/              React dashboard (Vite + Tailwind v4)
    src/                  UI components (resale flow, agent panel, escrow status)
    server/               Express API serving listing and escrow data
  contracts/              FraudEscrow.sol (Hardhat 3, Sepolia testnet)
```

## Tech Stack

| Technology | Usage |
|-----------|-------|
| **OpenClaw** | Agent orchestration — gateway, browser control (CDP), skill dispatch |
| **@anthropic-ai/sdk** (Claude) | Classification reasoning — structured verdicts with 5-signal analysis |
| **@tetherto/wdk + wdk-wallet-evm** | Non-custodial USDT wallet — escrow deposits, approvals, settlements |
| **ethers v6** | ABI encoding, contract reads, Sepolia provider |
| **Patchright** | Fallback anti-bot scraping (StubHub, Viagogo, Facebook Marketplace) |
| **React 19 + Vite 8** | Dashboard UI with resale flow wizard |
| **Tailwind CSS v4** | Dashboard styling (dark theme) |
| **Hardhat 3** | FraudEscrow.sol compilation and testing |
| **Ethereum Sepolia** | Testnet — all transactions are real on-chain |

## Third-Party Disclosures

All third-party services used in accordance with their respective terms of service:
- **Anthropic Claude API** — AI classification reasoning
- **OpenClaw** — Agent orchestration and browser control
- **Tether WDK** — Non-custodial wallet operations
- **Infura/Alchemy** — Sepolia RPC provider
- **StubHub, Viagogo, Facebook Marketplace** — Public listing data scraped for fraud detection

No mainnet funds are used — Sepolia testnet only.

## License

Apache 2.0 — see [LICENSE](./LICENSE)
