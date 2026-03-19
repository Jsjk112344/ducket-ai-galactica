# Ducket AI Galactica

## Project Overview
Safe P2P ticket resale platform with USDT escrow enforcement for a hackathon.
- **Core flow:** List → Lock USDT → AI Verify → Settle (no human triggers)
- **Wallet:** WDK (mandatory) — escrow per listing, USDT release/refund
- **License:** Apache 2.0
- **Stack:** TypeScript/JavaScript

## Decision Rules (Apply to EVERY technical choice)
1. Would a buyer trust the agent's verdict on this listing? → Add reasoning text visible in the Agent Decision Panel if not
2. Is WDK doing the wallet work? → Never route around it
3. Is the escrow flow programmable and conditional? → Must be agent-driven, seller never touches buyer funds
4. Can this resale flow be demoed in under 5 minutes? → Cut it if not
5. Is the repo clean enough for judges to follow the resale story? → Comment non-obvious logic
6. Architecture > polish when time is tight

## Priorities (Judging Criteria Order)
1. Agent Intelligence (autonomous verification, explainable verdicts)
2. WDK Wallet Integration (mandatory, non-custodial escrow)
3. Technical Execution (clean resale architecture)
4. Agentic Payment Design (conditional escrow: release/refund/slash)
5. Originality
6. Polish & Shipability
7. Presentation & Demo

## Hard Constraints
- WDK mandatory (JS/TS only for wallet ops)
- Apache 2.0 license on all code
- Must be runnable out of the box (browser or simple CLI)
- Video demo ≤ 5 minutes
- Disclose all third-party services
- Public GitHub repo
