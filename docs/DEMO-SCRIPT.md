# Ducket Demo Script — Alice & Bob Resale Flow

> Step-by-step walkthrough for the 5-minute demo video. Each step maps to a dashboard screen.

## Before Recording

- Run `npm run demo` — starts AI verification agent + React dashboard
- Open browser to `http://localhost:5173`
- Ensure `.env` has valid `ANTHROPIC_API_KEY` and `WDK_CLIENT_ID`
- Have a Sepolia-funded wallet ready (testnet USDT)

## Step 1: Alice Lists a FIFA Ticket

**Screen:** Seller Listing Form

**Narrate:** "Alice has a FIFA World Cup 2026 ticket she wants to sell. She fills in the event details and sets her asking price."

**Actions:**
1. Navigate to the Seller Listing Form
2. Fill in:
   - Event: FIFA World Cup 2026 — Quarter Final
   - Section: Category 1 — Lower Bowl
   - Quantity: 2
   - Price: $450 per ticket
   - Face Value: $350 per ticket
3. Submit the listing

**What judges see:** A new listing appears on the platform with Alice's ticket details and a "Pending Verification" status.

## Step 2: Bob Locks USDT in Escrow

**Screen:** Buyer Lock Screen

**Narrate:** "Bob finds Alice's listing and wants to buy. He locks USDT into escrow — funds are held by the smart contract, not by Alice or the platform."

**Actions:**
1. Navigate to Alice's listing in the resale flow
2. Click "Lock USDT" to initiate escrow deposit
3. WDK wallet prompts Bob to approve the USDT transfer
4. Transaction confirms on Sepolia — escrow address and Etherscan link displayed

**What judges see:** USDT moves from Bob's wallet to the FraudEscrow.sol contract. The UI shows the escrow transaction hash and a live Etherscan link. Funds are locked — neither party can withdraw.

## Step 3: AI Agent Verifies the Listing

**Screen:** Agent Decision Panel

**Narrate:** "The AI agent autonomously analyzes Alice's listing. It checks the price against face value, looks for cross-platform signals, and produces a detailed verdict."

**Actions:**
1. The verification agent runs automatically (no manual trigger)
2. Agent Decision Panel expands to show:
   - Confidence score (e.g., 92%)
   - Classification category (e.g., "Legitimate" or "Price Cap Violation")
   - Full reasoning text (50+ words referencing specific listing fields)

**What judges see:** The Agent Decision Panel shows Claude's reasoning — a multi-sentence explanation referencing Alice's price markup (28.6% above face value), event demand patterns, and cross-platform price consistency. The agent made this decision autonomously.

## Step 4: Escrow Settles

**Screen:** Settlement Outcome

**Narrate:** "Based on the AI verdict, the smart contract settles the escrow automatically. If the listing is legitimate, USDT releases to Alice. If verification fails, Bob gets a refund."

**Actions (Legitimate path):**
1. Settlement outcome displays: "Legitimate — USDT Released to Seller"
2. On-chain transaction link shows the release transaction
3. Alice's wallet receives the USDT

**Actions (Failed verification path):**
1. Settlement outcome displays: "Failed Verification — USDT Refunded to Buyer"
2. On-chain transaction link shows the refund transaction
3. Bob's wallet receives the USDT back

**What judges see:** The full lifecycle completes on-chain. The outcome label matches the agent's classification. Every step was autonomous — no human approval was needed.

## Closing

**Narrate:** "Ducket AI Galactica makes P2P ticket resale safe. The buyer's funds are protected by escrow. The AI agent verifies every listing autonomously. And the smart contract enforces the outcome — no trust required."

**Key points to emphasize:**
- Autonomous: AI agent runs without human triggers
- Non-custodial: WDK wallet — buyer's USDT never held by the platform
- Explainable: Full AI reasoning visible in the Agent Decision Panel
- On-chain: Every escrow action has a verifiable transaction
