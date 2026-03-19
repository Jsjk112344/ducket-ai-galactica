# Ducket AI Galactica

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)

Autonomous fraud detection agent that scans secondary ticket markets, classifies fraud with AI, and enforces outcomes via USDT escrow on Sepolia — no human in the loop.

## Architecture

```
                     Ducket AI Galactica
                ============================

  +-----------+     +-----------+     +------------+
  | StubHub   |     | Viagogo   |     | Facebook   |
  | Scraper   |     | Scraper   |     | Marketplace|
  +-----+-----+     +-----+-----+     +------+-----+
        |                 |                   |
        +--------+--------+--------+----------+
                 |                 |
                 v                 v
        +--------+--------+  +----+-----+
        | Scan Loop       |  | Evidence  |
        | (node-cron 5m)  |  | Case Files|
        +--------+--------+  +----------+
                 |
                 v
        +--------+--------+
        | Classification  |
        | (Rules + Claude)|
        +--------+--------+
                 |
                 v
        +--------+--------+
        | Escrow Engine   |
        | (WDK + Sepolia) |
        +--------+--------+
                 |
                 v
        +--------+--------+
        | FraudEscrow.sol |
        | (USDT on-chain) |
        +-----------------+

  +---------------------------+
  | React Dashboard (Vite)    |
  | Listings + Classifications|
  | Escrow Status + Wallet    |
  +---------------------------+
```

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
# Starts agent scan loop + React dashboard simultaneously
# Agent: polls StubHub/Viagogo/Facebook every 5 minutes
# Dashboard: http://localhost:5173
```

## How It Works

The demo covers four segments:

1. **Agent Intelligence** — Autonomous scan loop polls 3 platforms on a 5-minute cron schedule, no human trigger required. Each listing is hash-deduplicated and appended to `agent/memory/LISTINGS.md`.

2. **Wallet Flow** — WDK non-custodial USDT wallet runs on Sepolia. Keys never leave the client. The agent derives the escrow wallet address and checks balance before every action.

3. **Payment Lifecycle** — Escrow deposit/release/refund/slash are driven entirely by classification outcome. Confidence >= 85 and non-LEGITIMATE category triggers `escrow_deposit`; release or slash follow from the resolution path.

4. **Live Full Loop** — Event input → scan → classify → escrow action runs end-to-end in under 5 minutes via `npm run demo`. The React dashboard shows live listing data, classification results, and escrow state.

## Project Structure

```
ducket-ai-galactica/
  agent/             Autonomous fraud detection agent
    src/             Core pipeline (scan-loop, classify, escrow, evidence)
    tools/           Platform scrapers (StubHub, Viagogo, Facebook)
    memory/          Scan results (LISTINGS.md)
    cases/           Evidence case files per listing
  dashboard/         React dashboard (Vite + Tailwind v4)
    src/             UI components
    server/          Express API serving agent data
  contracts/         FraudEscrow.sol (Hardhat 3)
```

## Demo Video

[VIDEO LINK — to be added before submission]

## Third-Party Disclosures

| Service | Provider | Purpose |
|---------|----------|---------|
| Claude API | Anthropic | AI fraud classification |
| WDK | Tether | Non-custodial USDT wallet |
| Patchright | playwright fork | Anti-bot scraping |
| ethers.js | ethers | Blockchain interaction |
| node-cron | node-cron | Scan loop scheduling |
| Vite | Vite | Dashboard build tool |
| React | Meta | Dashboard UI |
| Tailwind CSS | Tailwind Labs | Dashboard styling |
| Sepolia Testnet | Ethereum Foundation | Test blockchain |

All third-party services are used in accordance with their respective terms of service.
No mainnet funds are used — Sepolia testnet only.

## Environment Variables

See `.env.example` for all required variables with explaining comments.

## License

Apache 2.0 — see [LICENSE](./LICENSE)
