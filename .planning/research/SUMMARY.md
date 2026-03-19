# Project Research Summary

**Project:** Ducket AI Galactica
**Domain:** Autonomous ticket fraud detection agent with on-chain USDT escrow enforcement
**Researched:** 2026-03-19
**Confidence:** MEDIUM

## Executive Summary

This is a hackathon submission for the Tether WDK Edition 1 Galactica event (March 22, 2026 deadline). The product is an autonomous AI agent that scans secondary ticket marketplaces (Carousell, Viagogo, Telegram), classifies listings for fraud using Claude, and enforces consequences via USDT escrow on Sepolia testnet — all without human intervention. The critical novelty is the combination of LLM classification, confidence-gated enforcement, and self-custodial WDK wallet operations in a single agentic loop. No existing product combines these four capabilities.

The recommended approach is an OpenClaw-based agent (skills + heartbeat loop) with Patchright for anti-bot scraping, Claude Sonnet for fraud classification, and the WDK EVM wallet module for on-chain USDT escrow. The React dashboard is a read-only observer of agent state delivered via SSE. The build order is strict: WDK wallet integration must be smoke-tested first (Day 1), scraping must be validated against real URLs before classification is built on top of it (Day 1-2), and the demo must run end-to-end three consecutive times before recording (Day 3 afternoon only).

The top two risks are WDK integration (the team has zero prior experience with this mandatory SDK and its ERC-4337 infrastructure layer is invisible until transaction submission fails) and scraper fragility (all three target platforms use anti-bot measures that break naive Playwright). Both risks must be addressed on Day 1, before any agent orchestration is written. If either is not resolved by end of Day 1, the team should activate mock data fallbacks for the demo.

## Key Findings

### Recommended Stack

The agent runtime is OpenClaw (2026.3.13-1, Node >=22.16.0, ESM-only), chosen because the team already has experience with it and its skills-based architecture maps directly to the scrape/classify/escrow tool pattern. The WDK EVM wallet module (`@tetherto/wdk-wallet-evm`) is a hard hackathon requirement — non-negotiable. Patchright replaces plain Playwright for scraping because Carousell and Viagogo use DataDome-class bot protection that Playwright cannot bypass without source-level patches. Claude Sonnet (`claude-sonnet-4-6`) handles per-listing classification at ~$1.50 per 1,000 listings. Socket.IO + Express serve the dashboard. React 19 + Vite 6 + Tailwind 4 provide the dashboard frontend.

**Core technologies:**
- **OpenClaw 2026.3.13-1**: Agent runtime and skill dispatch — team-familiar, local-first, heartbeat-driven autonomy
- **@tetherto/wdk-wallet-evm**: Self-custodial USDT wallet — hackathon mandatory, highest-risk integration
- **Patchright (latest)**: Anti-bot headless scraping — source-level Chromium patches, required for Carousell/Viagogo
- **@anthropic-ai/sdk 0.79.0 + claude-sonnet-4-6**: LLM fraud classification with structured output
- **grammy 2.x**: Telegram group scraping via Bot API (fallback: gramjs MTProto for public channels)
- **Socket.IO 4.x + Express 5.x**: Real-time push from agent to dashboard
- **React 19 + Vite 6 + Tailwind 4**: Dashboard frontend
- **zod 3.x**: Schema validation of Claude structured outputs before any escrow action fires

### Expected Features

**Must have (table stakes — P1, hackathon disqualification risk if missing):**
- WDK wallet instantiation — agent holds self-custodial USDT wallet; missing = disqualified
- Autonomous scan loop — agent polls platforms on schedule without human trigger
- Listing classification — 4-class output (scalping / scam / counterfeit / legitimate) + confidence + reasoning
- Escrow deposit + release/refund — full payment lifecycle on Sepolia testnet
- Escrow slash — fires on confirmed fraud above confidence threshold (the enforcement action)
- Evidence case file — one timestamped JSON record per classified listing with screenshot path
- React dashboard — live listings table with classification badges and USDT wallet balance widget
- Demo-ready full loop — Guns N' Roses Singapore event, completes all 4 demo segments in under 5 minutes

**Should have (differentiators — P2, add when P1 is working):**
- Confidence-gated enforcement — escrow slash only fires above threshold (e.g., >80%); low-confidence routes to "flag for review"
- Price delta scoring — percentage markup vs. face value; makes scalping classification quantitative
- Autonomous enforcement drafting — agent generates takedown request draft text per case
- Legitimacy bond staking — organizer stakes USDT bond; agent slashes on confirmed fraud
- Non-custodial proof in UI — wallet inspector element showing key is client-side only

**Defer (v2+):**
- Multi-agent sub-task architecture (ACP between scan/classify/escrow agents)
- Historical analytics dashboard
- Live DMCA/takedown submission pipeline
- Polygon NFT ticket contract integration

### Architecture Approach

The system has four layers: a React dashboard (read-only, SSE-driven), an Express/Socket.IO API bridge, an OpenClaw agent process (Gateway + Brain + Skills + Heartbeat + Memory + Hands), and external services (Claude API, WDK + Sepolia, scraping targets). The agent operates on a heartbeat cycle every 5-30 minutes — reading HEARTBEAT.md standing instructions, invoking scraper/classifier/escrow tools as subprocesses, writing case files to disk, and updating Markdown memory files. The API bridge watches the `cases/` directory and pushes SSE events to the dashboard when new case files appear. WDK wallet accounts are BIP-44 derived per event (index 0 = event 0). The escrow contract is a minimal Solidity ERC-20 escrow deployed once to Sepolia.

**Major components:**
1. **OpenClaw Gateway + Heartbeat** — autonomous loop orchestrator; runs every 5 min in demo mode; reads HEARTBEAT.md, dispatches skills
2. **Hands (Scraper / Classifier / Escrow / Case Writer tools)** — shell-invocable Node.js scripts; each independently testable; agent calls as subprocesses
3. **WDK Wallet Tool** — all escrow operations via `WalletManagerEvm`; never raw ethers.js signing; per-event account derivation via BIP-44 index
4. **FraudEscrow.sol** — minimal Solidity ERC-20 escrow on Sepolia; deployed once before demo
5. **API Bridge (Express + SSE)** — reads agent memory files and case output; pushes real-time events to dashboard; never writes to agent memory
6. **React Dashboard** — displays live listings feed, classification badges, escrow status, agent heartbeat log; strictly read-only

### Critical Pitfalls

1. **WDK ERC-4337 missing infrastructure layer causes silent SDK failure** — Write a standalone wallet smoke test (generate wallet, getBalance, send 0 USDT to self) before any agent code. Confirm Sepolia-specific bundler and paymaster endpoints from Candide. Set `transferMaxFee` in config. Do this on Day 1 hour 1.

2. **WDK key persistence is your problem, not the SDK's** — WDK is stateless. Store seed phrase in `.env` immediately on first generation. Add startup check: refuse to start if `ESCROW_WALLET_SEED` is not set. Wallet address must survive server restarts.

3. **Scraper fragility — all three platforms block naive automation** — Validate all three scrapers against real Guns N' Roses listing URLs on Day 1 within first 2 hours. For Viagogo: intercept XHR JSON responses instead of parsing HTML. For Telegram: use gramjs MTProto for public channels, not Bot API. Have mock data fallback ready before building classification on top.

4. **Escrow state gets out of sync with blockchain state** — Never update local state before receiving a confirmed txHash. Poll for confirmation with 30s timeout. Display "pending" state in dashboard during this window. Every escrow action card must include a clickable Sepolia Etherscan link.

5. **Agent autonomy is theatre without observable decision trail** — Every classification must emit a structured reasoning log (what signals, what verdict, why). Show this as an expandable "Agent Decision" panel per listing. Judges watching a 5-min demo cannot see inside the LLM — make reasoning visible or the autonomy claim is unverifiable.

## Implications for Roadmap

Based on research, suggested 5-phase structure aligned with ARCHITECTURE.md build order:

### Phase 1: WDK Wallet Foundation
**Rationale:** WDK is the highest-risk integration (no team experience, ERC-4337 infrastructure layer is opaque), and every escrow feature depends on it. Building it first de-risks the critical path. Pitfalls 1, 2, and 7 all target this phase — addressing them here prevents cascading failures downstream.
**Delivers:** Agent holds a self-custodial USDT wallet on Sepolia, survives restarts, passes smoke test, WDK non-custodial compliance verified. FraudEscrow.sol deployed to Sepolia with confirmed contract address.
**Addresses:** WDK wallet instantiation (P1 feature), escrow deposit/release/slash foundation
**Avoids:** Silent WDK SDK failure (Pitfall 1), key persistence loss between restarts (Pitfall 2), non-custodial violation (Pitfall 7), secrets committed to public repo (security)

### Phase 2: Scraper Pipeline
**Rationale:** Classification logic depends on structured listing data. Scraper output schema must be stable and producing real results before the classification prompt is written. All three platforms have anti-bot measures that must be validated against real URLs, not discovered mid-demo.
**Delivers:** Carousell, Viagogo, and Telegram scrapers returning structured listing JSON for the Guns N' Roses Singapore test event. Deduplication logic (hash-based) in LISTINGS.md. Parallel scraping via Promise.all().
**Addresses:** Multi-platform scraper (P1 feature), autonomous scan loop foundation
**Avoids:** Scraper fragility (Pitfall 3), sequential scraping performance trap, Telegram Bot API vs MTProto confusion

### Phase 3: Agent Classification + Autonomy
**Rationale:** With scrapers delivering real data and WDK wallet operational, classification can be built against real inputs. This phase also closes the "autonomy is theatre" gap — reasoning logs and confidence-gating must be designed into classification, not bolted on afterward.
**Delivers:** OpenClaw agent with Heartbeat loop (5-min demo cycle), classify-listing skill calling Claude API with structured Zod-validated output (label + confidence + reasoning), confidence-gated enforcement decision, evidence case file written per listing, prompt injection defenses.
**Addresses:** Listing classification (P1), evidence case file (P1), confidence-gated enforcement (P2), autonomous scan loop (P1)
**Avoids:** Agent autonomy as theatre (Pitfall 4), prompt injection (Pitfall 8), LLM output without schema validation

### Phase 4: Escrow Enforcement
**Rationale:** With classification running and the WDK wallet operational, escrow enforcement can be wired end-to-end. This phase must implement the state machine with confirmation polling — the most common source of demo failure with blockchain integrations.
**Delivers:** Full escrow lifecycle (deposit → LOCKED → RELEASED / SLASHED / REFUNDED) with on-chain confirmation polling, Sepolia Etherscan transaction links, real-time escrow status push to dashboard via SSE. Legitimacy bond staking if time permits.
**Addresses:** Escrow deposit + release/refund (P1), escrow slash (P1), legitimacy bond staking (P2)
**Avoids:** Escrow state out of sync with blockchain (Pitfall 5)

### Phase 5: Dashboard + Demo Integration
**Rationale:** Dashboard is a read-only observer and can be developed in parallel with earlier phases, but demo integration — running the full 5-minute loop end-to-end — must be a dedicated phase, not a late-night scramble. This phase also adds P2 polish features (price delta scoring, enforcement drafting, non-custodial proof UI element).
**Delivers:** React dashboard with live listings feed, classification badges with expandable reasoning panels, escrow status with Etherscan links, agent heartbeat log. Full demo loop rehearsed 3 consecutive successful runs under 5 minutes. Mock data fallback configured for flaky scrapers during demo recording.
**Addresses:** React dashboard (P1), price delta scoring (P2), enforcement drafting (P2), non-custodial proof UI (P2), demo-ready full loop (P1)
**Avoids:** Demo flow not rehearsed end-to-end (Pitfall 6)

### Phase Ordering Rationale

- **WDK before everything else** because the entire escrow payment lifecycle has zero fallback — if WDK doesn't work, the submission is disqualified. Discovering this on Day 2 or 3 is fatal.
- **Scrapers before classification** because the Claude classification prompt is written against structured listing fields; if those fields are wrong or empty, the prompt must be rewritten.
- **Classification before escrow wiring** because confidence-gating logic must be in place before any escrow action can be triggered; building escrow first tempts teams to hardcode "always slash" which breaks the autonomy story.
- **Dashboard in parallel, integrated last** because it is a read-only consumer; it can be built against mock SSE events while the agent is being developed, then switched to live data in Phase 5.
- **Dedicated demo integration phase** because 3-day hackathons consistently fail at this step — components work in isolation but the narrative never runs clean.

### Research Flags

Phases likely needing deeper investigation during execution (not during planning):
- **Phase 1 (WDK):** The WDK ERC-4337 Sepolia configuration is the highest-uncertainty area. Team must run the smoke test against real Candide Sepolia endpoints immediately on Day 1 — do not assume the mainnet quickstart config transfers to Sepolia without changes.
- **Phase 2 (Scrapers):** Carousell's specific anti-bot vendor is unconfirmed. Patchright handles most, but if Carousell uses Kasada or PerimeterX, additional fingerprint work may be needed. Validate on Day 1 before committing to the scraping approach.
- **Phase 2 (Telegram):** grammy Bot API cannot read public channels where the bot is not a member. The MTProto approach via gramjs requires a phone-number-verified Telegram account — confirm this is available to the team before Day 1.

Phases with well-documented patterns (research-phase during planning not needed):
- **Phase 3 (Classification):** Claude structured output and Zod validation are well-documented patterns. The classification prompt itself requires careful engineering but not research.
- **Phase 4 (Escrow state machine):** ERC-20 escrow smart contract patterns are well-established. The confirmation polling pattern is standard.
- **Phase 5 (Dashboard):** React + Vite + Socket.IO SSE is standard. No research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | OpenClaw and Claude API are HIGH confidence (official docs, team-familiar). WDK is MEDIUM — official docs verified but Sepolia-specific configuration unvalidated. Patchright is MEDIUM — community source, no confirmed Carousell test. |
| Features | HIGH | Hackathon judging criteria are explicit and public. Feature dependencies and P1/P2/P3 prioritization are internally consistent and derived from the criteria directly. |
| Architecture | MEDIUM | OpenClaw + WDK patterns verified via official docs. Data flow is inferred from component interactions, not from a deployed reference implementation. File-based memory pattern is OpenClaw-native. |
| Pitfalls | MEDIUM | WDK pitfalls derived from official docs + ERC-4337 ecosystem knowledge — no community post-mortems exist (SDK open-sourced Oct 2025). Scraping pitfalls are well-documented for Cloudflare-protected sites. Agent autonomy observability pitfall is well-evidenced from hackathon judging patterns. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **WDK Sepolia endpoint configuration:** Official docs show mainnet examples. The exact Candide/Pimlico Sepolia bundler and paymaster URLs must be verified before escrow code is written. Handle by running smoke test on Day 1 before any escrow feature development.
- **Sepolia USDT contract address:** 0x7169d38820dfd117c3fa1f22a697dba58d90ba06 found via search. Team must verify on Sepolia Etherscan before hardcoding in any config or contract.
- **Carousell anti-bot vendor:** Unknown. Test Patchright against Carousell on Day 1. If blocked, escalate to manual fingerprint spoofing or fall back to mock data.
- **Telegram channel access method:** grammy Bot API vs gramjs MTProto depends on whether the target Guns N' Roses Singapore Telegram group allows bot membership. Confirm on Day 1.
- **WDK npm package installable version:** `npm info @tetherto/wdk-wallet-evm` must be run to confirm the package is installable and identify the correct version number before writing dependency files.

## Sources

### Primary (HIGH confidence)
- https://docs.wdk.tether.io/sdk/wallet-modules/wallet-evm — WDK EVM wallet API, account.transfer(), ERC-20 support
- https://docs.wdk.tether.io/overview/about — WDK overview, stateless design, supported chains
- https://github.com/openclaw/openclaw/releases/ — OpenClaw latest release, Node version requirement
- https://platform.claude.com/docs/en/about-claude/models/overview — Claude model IDs verified 2026-03-19
- https://docs.openclaw.ai/gateway/heartbeat — OpenClaw Heartbeat mechanism
- https://socket.io/docs/v4/typescript/ — Socket.IO v4 TypeScript typed events
- https://docs.wallet.tether.io/sdk/wallet-modules/wallet-evm-erc-4337/configuration — WDK ERC-4337 required parameters
- https://dorahacks.io/hackathon/hackathon-galactica-wdk-2026-01 — Judging criteria, prize structure

### Secondary (MEDIUM confidence)
- https://www.npmjs.com/package/openclaw — OpenClaw npm registry, ESM-only, versioning
- https://github.com/Kaliiiiiiiiii-Vinyzu/patchright — Patchright source-level Playwright stealth patches
- https://grammy.dev/ — grammY Telegram bot framework
- https://sepolia.etherscan.io — Sepolia USDT contract address
- https://docs.openclaw.ai/concepts/agent — OpenClaw agent runtime, skills loading
- https://www.candide.dev/blog/tether — WDK Safe smart account foundation, paymaster architecture
- https://roundproxies.com/blog/scrape-viagogo/ — Viagogo Cloudflare protection, JSON API interception
- https://www.bitbrowser.net/blog/scraping-telegram-channels-groups-chats-guide-2026 — MTProto vs Bot API for channel reading
- https://arxiv.org/html/2603.11619 — Prompt injection in autonomous agents

### Tertiary (LOW confidence / needs validation)
- Sepolia USDT contract address 0x7169d38820dfd117c3fa1f22a697dba58d90ba06 — found via WebSearch, must be verified on Sepolia Etherscan before use
- WDK npm installable version number — not published on docs site; must run `npm info @tetherto/wdk-wallet-evm`

---
*Research completed: 2026-03-19*
*Ready for roadmap: yes*
