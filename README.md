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
                     Ducket AI Galactica
                ============================
                 Safe P2P Ticket Resale

  +-----------+                          +-----------+
  |  Seller   |--- lists ticket -------->|           |
  +-----------+                          |  Resale   |
                                         |  Platform |
  +-----------+                          |           |
  |  Buyer    |--- locks USDT ---------->|  (React   |
  |           |   (WDK + Sepolia)        |  Dashboard|
  +-----------+                          |  + API)   |
                                         +-----------+
                                               |
                                               v
                                    +----------+----------+
                                    |   AI Verification   |
                                    |   Agent (Claude)    |
                                    +----------+----------+
                                               |
                          +--------------------+--------------------+
                          |                                         |
                          v                                         v
               +----------+----------+                  +----------+----------+
               |  Legitimate: Release|                  | Failed: Refund/Slash|
               |  USDT to seller     |                  | USDT to buyer       |
               +---------------------+                  +---------------------+
                          |                                         |
                          +--------------------+--------------------+
                                               |
                                               v
                                    +----------+----------+
                                    |  FraudEscrow.sol    |
                                    |  (USDT on-chain)    |
                                    +---------------------+
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

## Third-Party Disclosures

| Service | Provider | Purpose |
|---------|----------|---------|
| Claude API | Anthropic | AI ticket verification |
| WDK | Tether | Non-custodial USDT wallet |
| Patchright | playwright fork | Anti-bot scraping |
| ethers.js | ethers | Blockchain interaction |
| node-cron | node-cron | Verification scheduling |
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
