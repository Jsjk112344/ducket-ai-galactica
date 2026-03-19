# Ducket AI Galactica

## Project Overview
Autonomous fraud detection agent with USDT escrow enforcement for a hackathon.
- **Core loop:** Scan → Classify → Act (no human triggers)
- **Wallet:** WDK (mandatory) — escrow per event, USDT release/slash
- **License:** Apache 2.0
- **Stack:** TypeScript/JavaScript

## Decision Rules (Apply to EVERY technical choice)
1. Would a judge understand why the agent made this decision? → Add logging/explainability if not
2. Is WDK doing the wallet work? → Never route around it
3. Is the payment flow programmable and conditional? → Must be agent-driven
4. Can this be demoed in under 5 minutes? → Cut it if not
5. Is the repo clean enough for judges to read? → Comment non-obvious logic
6. Architecture > polish when time is tight

## Priorities (Judging Criteria Order)
1. Agent Intelligence (autonomous, explainable)
2. WDK Wallet Integration (mandatory, non-custodial)
3. Technical Execution (clean architecture)
4. Agentic Payment Design (conditional escrow flows)
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
