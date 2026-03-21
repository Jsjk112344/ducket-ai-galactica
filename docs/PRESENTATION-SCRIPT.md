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

> "The agent scores five risk signals: pricing adjusted for event demand, seller trust, listing quality, temporal patterns, and platform trust. Each scored zero to a hundred, weighted, combined into a composite.
>
> Clear-cut cases resolve instantly. Ambiguous ones escalate to Claude with the full signal breakdown. Two examples: 200% markup on a sold-out Final from a verified seller — legitimate. 5% markup from a new account on Facebook with no transfer proof — counterfeit risk. Price alone can't tell you that.
>
> Each verdict maps to an escrow outcome: slash, refund, or release. The dashboard shows the full signal breakdown so you can see exactly why."

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

### Scenario 1: Legitimate Resale (~90s)

> "Resale tab. I'll show two scenarios — a legitimate listing and a fraud attempt.
>
> Bob is logged in as the seller — you can see his wallet address in the nav. On the left he fills in the listing form. On the right is a live preview of how buyers will see his listing on the Ducket resale marketplace. It updates as he types. Notice the 'Pending AI Verification' badge — the listing hasn't been screened yet.
>
> I'll use the 'Legit Resale' preset — $245 per ticket, Category 1, two tickets. Submit.
>
> Now the AI agent kicks in — scanning each signal in real time. Pricing, seller trust, listing quality, temporal patterns, platform trust. Composite score comes in... legitimate. The agent pre-verified this listing before any buyer saw it.
>
> Click through to Alice's marketplace view. She's logged in with her own wallet. She can see Bob's listing with the full ticket details, the AI verification badge, and the confidence score. She clicks 'Buy for $490 USDT.'
>
> Settlement — both perspectives side by side. Bob sees 'Payment Received,' Alice sees 'Ticket Secured.' $490 USDT released to Bob. Zero humans, zero fees."

### Scenario 2: Fraud Blocked (~60s)

> "Now the fraud scenario. Click 'Try Another Listing.'
>
> Same form, but I'll hit the 'Scalper' preset — $800 per ticket for Category 2 tickets. That's a 567% markup on a $120 face value ticket. Submit.
>
> Watch the agent — pricing risk spikes, composite risk is high. Scalping violation. The agent flagged it before any buyer could commit money.
>
> On Alice's marketplace view, the listing shows a red 'Flagged' badge. And the buy button is greyed out — 'Purchase Blocked.' Alice literally cannot lock USDT for a listing the agent rejected. That's the gatekeeper in action."

### Show Listings Tab (~20s)
> "Listings tab — the Active Order Book shows all scanned listings. Expand a row to see the full signal breakdown. Five risk bars, composite score, reasoning. Every verdict is explainable."

### Show Wallet Tab (~10s)
> "Wallet tab — WDK wallet, non-custodial, Sepolia balances."

---

## SLIDE 5: Close (~20s)

> "Ticket resale shouldn't require trust. Ducket makes it trustless — an AI agent that verifies before money moves, a smart contract that enforces the outcome, and a non-custodial wallet that keeps funds out of everyone's hands except the rightful owner. No mediators, no fees, no disputes. Just safe P2P resale. Thank you."

---

## Tips

- **Run both scenarios.** The contrast between legit and fraud is the strongest demo moment. The blocked buy button is the punchline.
- **Point out the live preview** on Bob's listing page — it shows judges this is a real marketplace, not a data table.
- **Point out both perspectives** on the settlement page — Bob and Alice side by side. Judges need to see the full lifecycle.
- **Say "non-custodial" and "WDK" explicitly** — judges are listening for it.
- **If something fails during demo** — scrapers fall back to mock data, RPC timeouts return cached balances. Say "the system is designed to be resilient" and keep going.
- **Punchline is "Purchase Blocked."** That proves the agent is a real gatekeeper, not just a label generator.
