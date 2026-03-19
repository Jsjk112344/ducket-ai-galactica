# Feature Research

**Domain:** Autonomous ticket fraud detection agent with on-chain USDT escrow enforcement
**Researched:** 2026-03-19
**Confidence:** HIGH (hackathon requirements explicit; domain patterns well-documented)

---

## Feature Landscape

### Table Stakes (Judges Won't Take It Seriously Without These)

These are the baseline features that directly map to the 7 judging criteria. Missing any of these means the submission fails to even land in contention.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Autonomous scan loop** — agent polls platforms on a schedule without human trigger | Judging criterion #1 is agent autonomy; a button-triggered scan is a script, not an agent | MEDIUM | OpenClaw scheduler or a polling loop; must demonstrate it fires on its own |
| **Multi-platform scraper** — Carousell, Viagogo, and at least one social channel (Telegram/FB) | Three sources shows real-world applicability; one source is a toy demo | HIGH | Playwright/TinyFish for anti-bot pages; this is the hardest build component |
| **Listing classification** — scalping violation, likely scam, counterfeit risk, legitimate | Without classification the agent is just a crawler; the LLM call is the intelligence layer | MEDIUM | Claude API with structured output; 4-class labels plus confidence score and rationale |
| **WDK wallet instantiation** — agent creates and holds its own self-custodial USDT wallet | Judging criterion #2; submission is disqualified without WDK | HIGH | Team has no prior WDK experience; this is the #1 risk item |
| **Escrow deposit** — agent can lock USDT into escrow against an event | Judging criterion #4 (agentic payment design); deposit is the first step of the payment lifecycle | HIGH | Requires WDK + smart contract; must demo this working on Sepolia testnet |
| **Escrow release/refund** — agent conditionally releases or refunds USDT based on classification outcome | Judges need to see the full payment lifecycle (deposit → verdict → release/refund) | HIGH | Triggered by classification result; release to organizer on legitimate, refund on fraud |
| **Escrow slash** — agent burns or withholds USDT when fraud is confirmed | Differentiates enforcement from mere flagging; closes the "what happens next" loop | HIGH | The enforcement action with real economic consequence; what makes this non-trivial |
| **Evidence case file** — timestamped, structured record per listing (screenshot, URL, price delta, classification, confidence, action taken) | Agents that act without audit trail are untrustworthy; judges will want to see provenance | MEDIUM | JSON/structured file per case; screenshot capture via Playwright |
| **React dashboard** — live listings table with classification badges and USDT escrow status | Judging criterion #7 (polish); judges watch the demo — a terminal log is not enough | MEDIUM | Single-page app; table + status badges + wallet balance widget |
| **Full demo loop** — event input → scan → classify → escrow action, completable in ≤5 min | Hard requirement from PROJECT.md; video must cover all 4 demo segments | MEDIUM | Needs deterministic demo path; mock data fallback for flaky scrapers |

### Differentiators (What Wins vs. What Just Qualifies)

These features separate a winning submission from a qualifying one. All align with judging criteria #1 (autonomy) and #4 (agentic payment design), which carry the most weight.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Legitimacy bond staking** — organizer stakes USDT upfront; agent slashes bond on confirmed fraud activity | Creates a direct economic incentive loop: the agent's decisions have real financial consequences for the organizer, not just the buyer | HIGH | Adds a second actor (organizer wallet) to the payment lifecycle; judging criterion #4 explicitly rewards this kind of designed payment flow |
| **Autonomous enforcement drafting** — agent generates platform takedown requests and public warning text per case, without human prompt | Demonstrates the agent acts beyond detection into remediation; judges see full agentic loop | MEDIUM | Claude API call with case file as context; output is draft text, not submitted (avoids real-world side effects in demo) |
| **Real-time price delta scoring** — agent calculates percentage markup vs. face value per listing | Makes scalping classification quantitative and defensible, not just vibes-based | LOW | Face value sourced from official event page at scan time; simple arithmetic but highly credible signal |
| **Multi-agent sub-task architecture** — separate agents for scanning, classifying, and escrow actions communicating over ACP | Judges evaluating #1 (agent intelligence) understand agentic patterns; a single monolithic agent is less impressive than a coordinated swarm | HIGH | OpenClaw supports ACP; adds demo complexity but is a strong technical differentiator |
| **Confidence-gated enforcement** — escrow slash only fires when classification confidence exceeds threshold (e.g., >85%); lower confidence routes to "flag for review" | Demonstrates agent knows its own limits; prevents false-positive financial penalties | LOW | Single conditional check; high signal-to-noise value for judges assessing autonomy quality |
| **Non-custodial proof in demo** — explicitly show WDK private key stays client-side, never touches a server | WDK requirement #2 from PROJECT.md; demonstrating it is more compelling than just claiming it | LOW | Add a "wallet inspector" UI element showing key storage location; 30 minutes of work with outsized credibility |
| **Sepolia testnet faucet + setup doc** — one-command setup that funds the demo wallet from faucet | Judging criterion: must be runnable without special setup; removing friction for judges is a form of polish | LOW | Script in README; faucet API call + WDK wallet funding |

### Anti-Features (Deliberately Not Building)

Features that look valuable but would consume time without improving the submission's score, given the 3-day constraint and judging priority order.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Historical analytics / trend charts** | Looks professional; "shows patterns over time" | Polish (#6) not autonomy (#1); Chart.js time-series takes a day to build right | Single "scan history" table in the dashboard is enough — chronological list of case files |
| **Email/webhook notifications when fraud detected** | Real-world system would alert a human | Adds external dependency (SMTP/webhook service); demo complexity with no judging upside; autonomy criterion rewards agents that act, not agents that ask humans to act | Agent logs action to case file + dashboard update is sufficient evidence of detection |
| **Mainnet USDT transactions** | "Shows it's real" | Disallowed by PROJECT.md (testnet only); introduces real financial risk in a demo; confuses judges about whether demo actions are real | Explicit "TESTNET — Sepolia" label in the UI; shows identical mechanics |
| **OAuth / user login** | Dashboard needs authentication | Wrong threat model for this product — organizer is the only user; auth adds 0 to any judging criterion | Single hardcoded organizer config; no auth needed for hackathon demo |
| **Polygon NFT ticket contract integration** | "Full Ducket stack demo" | Different chain than WDK escrow; integration creates cross-chain complexity with no judging benefit; scope risk is extreme in 3 days | Reference Ducket's existing contracts in README as context; agent is a standalone product |
| **Real-time websocket dashboard updates** | "Live" feel | Polling every 30s looks the same to a judge watching a 5-min video; WebSocket requires a persistent server and adds infrastructure complexity | 30-second polling interval with visible "Last scanned" timestamp is indistinguishable in demo |
| **ML model fine-tuning for classification** | "Custom model shows technical depth" | Claude API with a strong system prompt outperforms a fine-tuned model trained on a small dataset; fine-tuning is weeks of work | Invest that time in prompt engineering and structured output schemas for the classification call |
| **Full DMCA / legal takedown submission pipeline** | "Autonomous enforcement means actually submitting" | Legal risk in a demo; platform APIs for takedown are gated behind business agreements; judges can see the draft and understand the intent | Show generated draft text in UI with a "Submit (disabled in demo)" button |

---

## Feature Dependencies

```
[WDK Wallet Instantiation]
    └──required by──> [Escrow Deposit]
                          └──required by──> [Escrow Release / Refund]
                          └──required by──> [Escrow Slash]
                          └──required by──> [Legitimacy Bond Staking]

[Multi-Platform Scraper]
    └──required by──> [Listing Classification]
                          └──required by──> [Price Delta Scoring]
                          └──required by──> [Evidence Case File]
                          └──required by──> [Confidence-Gated Enforcement]
                          └──feeds──> [Escrow Slash / Release]

[Evidence Case File]
    └──required by──> [Enforcement Drafting]
    └──required by──> [React Dashboard — listings table]

[Autonomous Scan Loop]
    └──orchestrates──> [Multi-Platform Scraper]
    └──orchestrates──> [Listing Classification]
    └──orchestrates──> [Escrow Actions]

[Confidence-Gated Enforcement]
    └──controls──> [Escrow Slash]  (slash only above threshold)
    └──controls──> [Legitimacy Bond Staking]  (slash bond only above threshold)
```

### Dependency Notes

- **WDK wallet must work before any escrow feature**: This is the critical path. WDK is new to the team and has no fallback. If WDK blocks, nothing downstream (deposit, release, slash) is demonstrable. Build WDK first on Day 1 as a spike.
- **Scraper must deliver structured listing data before classification**: The Claude API classification prompt depends on structured fields (title, price, platform, event name, seller history). Scraper output schema must be stable before classification prompt is written.
- **Evidence case file is a side-effect of classification**: Generate the case file as part of the classification step — same LLM call that produces the label should also produce the structured evidence record. No separate build step needed.
- **Multi-agent architecture enhances but does not block**: The single-agent version (scan → classify → escrow in one agent) is the MVP. Splitting into sub-agents is a differentiator layered on top once the monolith works.
- **Dashboard is an observer, not a driver**: The dashboard reads from case files / a local store. It does not control the agent. This means dashboard can be built in parallel with agent development.

---

## MVP Definition

### Launch With (Hackathon Submission — March 22, 2026)

The minimum set that demonstrates all 7 judging criteria and completes the 4-segment demo in ≤5 minutes.

- [ ] **WDK wallet instantiation** — agent has its own self-custodial USDT wallet on Sepolia. Without this the submission is disqualified.
- [ ] **Autonomous scan loop** — agent polls at least 2 platforms (Carousell + Viagogo) on a 60-second timer without human trigger. Demonstrates autonomy.
- [ ] **Listing classification** — 4-class output (scalping / scam / counterfeit / legitimate) with confidence score and rationale via Claude API.
- [ ] **Escrow deposit + release/refund** — full payment lifecycle on testnet. This is what "agentic payment design" means concretely.
- [ ] **Escrow slash** — fires on confirmed fraud above confidence threshold. The economic enforcement action.
- [ ] **Evidence case file** — one JSON record per classified listing; timestamped, includes source URL and screenshot path.
- [ ] **React dashboard** — listings table with classification badges and live USDT wallet balance widget.
- [ ] **Demo-ready full loop** — Guns N' Roses Singapore as demo event; deterministic path through all 4 demo segments.

### Add After Validation (Post-Hackathon v1.x)

- [ ] **Legitimacy bond staking** — if WDK integration is solid and time permits on Day 3, this elevates the payment design score; otherwise defer to post-hackathon.
- [ ] **Autonomous enforcement drafting** — lower priority than escrow mechanics; add if Day 2 is ahead of schedule.
- [ ] **Price delta scoring** — adds credibility to scalping classification; 2-hour build, add after escrow is working.
- [ ] **Telegram/FB Marketplace scraper** — third platform; add only after Carousell + Viagogo are stable.

### Future Consideration (v2+)

- [ ] **Multi-agent architecture** — meaningful engineering investment; prove the monolith first, then decompose.
- [ ] **Historical analytics dashboard** — post-hackathon feature for real organizer use.
- [ ] **Live takedown submission pipeline** — requires business agreements with platforms; post-product-market fit.
- [ ] **Polygon NFT integration** — connecting escrow enforcement to Ducket's existing ticket contracts; different chain, significant complexity.

---

## Feature Prioritization Matrix

| Feature | Judge Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| WDK wallet instantiation | HIGH (criterion #2, disqualification risk) | HIGH | P1 |
| Autonomous scan loop | HIGH (criterion #1) | MEDIUM | P1 |
| Listing classification | HIGH (criterion #1, #3) | MEDIUM | P1 |
| Escrow deposit + release/refund | HIGH (criterion #4) | HIGH | P1 |
| Escrow slash | HIGH (criterion #4, #3) | MEDIUM | P1 |
| Evidence case file | MEDIUM (criterion #3, #6) | MEDIUM | P1 |
| React dashboard | MEDIUM (criterion #7) | MEDIUM | P1 |
| Legitimacy bond staking | HIGH (criterion #4, #5) | HIGH | P2 |
| Confidence-gated enforcement | MEDIUM (criterion #1 quality) | LOW | P2 |
| Price delta scoring | MEDIUM (criterion #1 quality) | LOW | P2 |
| Autonomous enforcement drafting | MEDIUM (criterion #1, #5) | MEDIUM | P2 |
| Non-custodial proof in UI | MEDIUM (criterion #2 clarity) | LOW | P2 |
| Telegram/FB scraper | LOW (breadth, not depth) | HIGH | P3 |
| Multi-agent architecture | MEDIUM (criterion #1 depth) | HIGH | P3 |
| Historical analytics | LOW (criterion #6 polish) | HIGH | P3 |

**Priority key:**
- P1: Must have for hackathon submission (8 features)
- P2: Should have, add when P1 is working and time allows (5 features)
- P3: Nice to have, add only if surprisingly ahead of schedule (3 features)

---

## Competitor Feature Analysis

Secondary marketplaces and existing fraud detection tools do not combine agent autonomy with on-chain enforcement. The combination is what makes this novel.

| Feature | Viagogo / Ticketmaster | Traditional Fraud Tools (Sardine, TrustDecision) | Ducket AI Galactica |
|---------|----------------------|--------------------------------------------------|---------------------|
| Fraud detection | Manual review + bot detection | ML classification, real-time signals | Autonomous agent, LLM classification |
| Enforcement | Platform ban, refund | Alert, block transaction | On-chain USDT slash — economic consequence |
| Payment settlement | Fiat | Fiat | USDT on-chain, self-custodial via WDK |
| Operator custody | Centralized (platform holds money) | N/A | Non-custodial (WDK; agent holds own wallet) |
| Audit trail | Internal logs (opaque) | Internal logs | Public case files, on-chain transaction hash |
| Autonomy | Human-in-the-loop for enforcement | Alert → human decides | Agent decides and acts within confidence threshold |

The key differentiating combination: **LLM classification + confidence-gated escrow slash + self-custodial WDK wallet + no human in the loop**. No existing product combines all four.

---

## Sources

- [Tether Hackathon Galactica: WDK Edition 1 — DoraHacks](https://dorahacks.io/hackathon/hackathon-galactica-wdk-2026-01) — judging criteria, prize structure
- [Hackathon Galactica: WDK Edition 1 — Blockchain.news flash summary](https://blockchain.news/flashnews/hackathon-galactica-launches-wallet-development-kit-innovation-with-30k-prizes) — prize pool, autonomy focus
- [Wallet Development Kit by Tether](https://wdk.tether.io/) — WDK capabilities, non-custodial design, AI agent support
- [Agentic AI for Fraud Detection — Evoketechnologies](https://www.evoketechnologies.com/blog/business-blogs/agentic-ai-fraud-detection-prevent-losses-compliance) — agentic fraud detection feature patterns
- [Rise of AI Agents for Fraud Detection — Rishabh Software](https://www.rishabhsoft.com/blog/ai-agents-for-fraud-detection) — classification, evidence aggregation, autonomous investigation
- [AI-Powered Escrow Agent — Circle / ZenML](https://www.zenml.io/llmops-database/ai-powered-escrow-agent-for-programmable-money-settlement) — escrow lifecycle, deposit/release/condition patterns
- [Why Agentic Finance Needs Smart Contracts — RebelFi](https://rebelfi.io/blog/why-agentic-finance-needs-smart-contracts-not-just-messaging-protocols) — enforcement layer architecture
- [Stablecoins in Agentic Commerce — insights4vc](https://insights4vc.substack.com/p/stablecoins-in-agentic-commerce) — USDT/USDC escrow in agentic payment design
- [Preventing Ticketing Fraud in 2026 — Softjourn](https://softjourn.com/insights/prevent-ticketing-fraud) — ticket-specific fraud classification patterns
- [Ticket Scalping and Fraud Risk — Anura](https://www.anura.io/fraud-tidbits/what-is-ticket-scalping) — scalping detection signals and feature patterns
- [Agentic AI in FinCrime Investigations — Lucinity](https://lucinity.com/blog/from-assistant-to-investigator-how-agentic-ai-transforms-fincrime-operations) — evidence case file structure, audit trail requirements
- [Sardine: Agentic AI Failure Modes](https://www.sardine.ai/blog/agentic-ai-financial-crime-failure-modes) — confidence thresholds, human escalation design
- [OpenClaw Framework — DigitalOcean guide](https://www.digitalocean.com/resources/articles/what-is-openclaw) — agent skills system, ACP, scheduler capabilities
- [OpenClaw Architecture 2026 — Valletta Software](https://vallettasoftware.com/blog/post/openclaw-2026-guide) — multi-agent ACP communication patterns
- [Viagogo Scam Patterns — Action Fraud](https://www.actionfraud.org.uk/viagogo-scams/) — real-world secondary market fraud signals

---
*Feature research for: Autonomous ticket fraud detection agent with USDT escrow enforcement*
*Researched: 2026-03-19*
