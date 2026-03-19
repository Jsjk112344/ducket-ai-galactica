# Ducket AI Galactica

Autonomous fraud detection agent with USDT escrow enforcement for the Tether Hackathon Galactica: WDK Edition 1.

## What It Does

An autonomous agent that scans secondary ticketing marketplaces (StubHub, Viagogo, Facebook Marketplace) for fraudulent or overpriced ticket listings, classifies each listing (scalping, scam, counterfeit, legitimate), and enforces outcomes on-chain via USDT escrow — all without human intervention.

**Core loop:** Scan -> Classify -> Act (no human triggers)

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/niccoloducket/ducket-ai-galactica.git
   cd ducket-ai-galactica
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values (see .env.example for required variables)
   ```

4. Run the agent:
   ```bash
   npm run dev:agent
   ```

5. Run the dashboard:
   ```bash
   npm run dev:dashboard
   ```

## Project Structure

```
ducket-ai-galactica/
├── agent/          # Autonomous fraud detection agent
├── dashboard/      # React dashboard for live monitoring
├── contracts/      # FraudEscrow.sol smart contract
├── .env.example    # Required environment variables (copy to .env)
├── LICENSE         # Apache 2.0
└── README.md       # This file
```

## Third-Party Services Disclosure

This project uses the following external services. See individual service terms for usage restrictions.

| Service | Provider | Purpose | Required? |
|---------|----------|---------|-----------|
| Claude API | Anthropic | AI-powered fraud classification engine | Yes |
| WDK (Wallet Development Kit) | TinyFish / Tetherto | Non-custodial USDT wallet on Sepolia | Yes |
| Patchright | microsoft/playwright fork | Anti-bot browser automation for scraping | Yes |
| OpenClaw | OpenClaw | Autonomous agent heartbeat loop orchestration | Yes |
| Sepolia Testnet | Ethereum Foundation | Testnet blockchain for USDT escrow (no real funds) | Yes |

All third-party services are used in accordance with their respective terms of service.
No mainnet funds are used — Sepolia testnet only.

## Environment Variables

See `.env.example` for the full list of required environment variables. Key variables:

| Variable | Purpose |
|----------|---------|
| `CLAUDE_API_KEY` | Anthropic Claude API key for fraud classification |
| `ESCROW_WALLET_SEED` | WDK wallet seed phrase (never commit real values) |
| `WDK_API_KEY` | WDK API key |
| `SEPOLIA_RPC_URL` | Sepolia Ethereum RPC endpoint |
| `SEPOLIA_USDT_CONTRACT` | USDT contract address on Sepolia testnet |
| `SCAN_INTERVAL_MINUTES` | How often the agent polls marketplaces (default: 5) |
| `FRAUD_CONFIDENCE_THRESHOLD` | Minimum confidence to trigger escrow action (default: 85) |

## License

Apache 2.0 — see [LICENSE](./LICENSE) for full text.
