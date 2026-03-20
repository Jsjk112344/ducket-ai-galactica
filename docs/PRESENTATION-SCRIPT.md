# Ducket — Presentation Script (~5 minutes)

Structure: Slides first (~2 min), then live demo (~3 min). Slides set the context, demo proves it works.

---

## SLIDE 1: Title (~30s)

> "This is Ducket — safe P2P ticket resale powered by an autonomous AI agent.
>
> The problem: buying tickets from strangers requires trust. You don't know if you're getting scammed, paying a scalper, or getting a counterfeit. Platforms like StubHub charge 20-25% and still can't guarantee legitimacy.
>
> Ducket replaces that trust with an AI agent. The flow is: seller lists a ticket, buyer locks USDT in escrow via WDK, the agent verifies the listing against live market data, and the smart contract settles automatically — release, refund, or slash. No humans in the loop."

---

## SLIDE 2: Agent Intelligence (~40s)

> "Let me show you how the agent thinks.
>
> We built a two-tier classification engine. Tier one is deterministic rules — if a ticket is priced more than 100% above face value, that's scalping. Below negative 10% of face value, that's a scam bait pattern. These fire instantly at zero cost.
>
> For ambiguous cases — where confidence is below 85% — we escalate to Claude. The AI gets our FIFA 2026 face value database, which the agent sourced independently — not from the seller. Claude returns a structured JSON verdict with category, confidence, and a reasoning explanation.
>
> Every classification maps to one of four escrow outcomes: scalping gets slashed to a bounty pool, scams and counterfeits get refunded to the buyer, and legitimate listings release funds to the seller. Every verdict is explainable — you can read exactly why the agent made its decision in the dashboard."

---

## SLIDE 3: Wallet + Escrow (~40s)

> "For the wallet, we use WDK — Tether's Wallet Development Kit. Our integration is fully non-custodial. Keys are derived in-memory using BIP-44 and disposed on process exit — never persisted to disk.
>
> The deposit is a sequential two-step: approve USDT, wait for on-chain confirmation, then deposit into FraudEscrow. No race conditions. All WDK operations happen in the agent backend — the dashboard is read-only.
>
> FraudEscrow.sol on Sepolia handles four functions: deposit locks 10 USDT, release pays the seller, refund returns to the buyer, slash sends to a bounty pool. SafeERC20 for USDT compatibility, ReentrancyGuard, onlyOwner on all settlement functions.
>
> Compare this to traditional escrow: no human mediator, no weeks of disputes. The agent classifies, the contract enforces — seconds, zero fee."

---

## SLIDE 4: Architecture (~30s)

> "Quick architecture. Three-workspace monorepo: TypeScript agent, React dashboard, Solidity contracts.
>
> The agent runs every five minutes: scrape StubHub, Viagogo, and Facebook Marketplace with Patchright — an undetected Playwright fork. Deduplicate by URL hash. Classify with rules plus Claude. If confidence hits 85% or higher on a non-legitimate listing, the agent deposits escrow and dispatches enforcement automatically.
>
> Resilience is built in — Promise.allSettled means one blocked scraper doesn't kill the pipeline. Claude down? Falls back to rules-only. And you run everything with one command: npm run demo.
>
> Let me show you it live."

---

## LIVE DEMO (~3 min)

**Switch to browser — localhost:5173**

### Show the Dashboard (~30s)
> "This is the Ducket dashboard. You can see the stat cards showing escrow totals, and the Active Order Book with classified listings. Each row has a classification badge — scalping in red, legitimate in teal."

### Expand a Listing Row (~30s)
> "Expanding this row shows the Agent Decision Panel — the explainable reasoning. Category, confidence score, and a full paragraph of why the agent flagged this. This one's a scalping violation at 86% because the price is 320% above face value."

### Walk the Resale Flow (~60s)
> "Now the full resale flow. Resale tab.
>
> Step one — submit a listing. Event, section, price. No face value field — the agent looks that up independently.
>
> Step two — lock USDT in escrow. WDK approves and deposits into FraudEscrow. Etherscan link confirms the on-chain transaction.
>
> Step three — AI verification. Agent classifies and shows the reasoning.
>
> Step four — settlement. The contract releases, refunds, or slashes based on the classification. Done."

### Show Wallet Tab (~20s)
> "Wallet tab: WDK wallet address, ETH and USDT balances from Sepolia, 'client-side only, WDK non-custodial.'"

### Case Files (if time allows) (~20s)
> "Every classification generates a timestamped case file — listing details, red flags, reasoning, Etherscan link. 78 case files so far. Full audit trail."

---

## SLIDE 5: Close (~20s)

> "Ducket: autonomous AI agent for safe P2P ticket resale. Three platforms scraped, four escrow outcomes, 85% confidence gate, zero humans in the loop, zero platform fees. npm install, npm run demo. Apache 2.0. Thank you."

---

## Tips

- **Don't rush the agent slide.** That's criteria #1. The two-tier system and four enforcement categories are your strongest points.
- **Show the Agent Decision Panel** during demo — the reasoning text is what separates this from a simple if/else.
- **Say "non-custodial" and "WDK" explicitly** — judges are listening for it.
- **If something fails during demo** — scrapers fall back to mock data, RPC timeouts return cached balances. Say "the system is designed to be resilient" and keep going.
- **Punchline is "zero humans in the loop."** Land it on the close.
