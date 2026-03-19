# Project Research Summary

**Project:** Ducket AI Galactica
**Domain:** P2P ticket resale with AI fraud verification + autonomous USDT escrow enforcement
**Researched:** 2026-03-20 (v2.0 synthesis — supersedes v1.0 2026-03-19)
**Confidence:** HIGH

## Executive Summary

Ducket AI Galactica is a P2P ticket resale platform where an autonomous agent scans external marketplaces, classifies listings using a hybrid rules + Claude AI pipeline, and enforces escrow outcomes non-custodially via WDK on Sepolia. The v2.0 pivot reframes a working v1.0 fraud detection agent into a buyer-facing "safe resale" product by adding a 4-step resale flow (list → lock USDT → AI verify → settle) and Ducket brand styling. All core agent capabilities are already built — the v2.0 work is almost entirely new UI wiring existing API endpoints, not new agent logic.

The recommended approach is strictly additive: new React components (ResaleFlow, SellerListForm, BuyerLockForm, AIVerifyStatus, SettleActions) call new Express routes (/api/resale/*) that import existing agent modules (classify.js, escrow.js) without modifying them. A new RESALE_LISTINGS.json file bus sits alongside the existing LISTINGS.md. The FraudEscrow.sol contract requires zero changes — escrowId is opaque bytes32 that handles P2P semantics as-is. shadcn/ui components should be copied manually rather than installed via CLI to avoid corrupting the existing Tailwind v4 setup.

The primary risks are (1) breaking the existing working pipeline by mutating shared types or API routes, (2) running out of time for the demo video because UI rebrand tasks expand to fill available time, and (3) seed data with shallow AI reasoning that fails the highest-weighted judging criterion (Agent Intelligence). All three risks are preventable with specific rules: additive-only changes to types.ts and api.ts; a 4-hour hard time-box on rebrand; and manually written 50+ word reasoning strings in seed data before writing any UI code.

---

## Key Findings

### Recommended Stack

The v1.0 stack is validated and should not change. OpenClaw (2026.3.13-1, ESM-only, Node 22+) runs the autonomous agent loop. WDK (@tetherto/wdk-wallet-evm) handles all wallet operations — a hard hackathon constraint. The Anthropic SDK (0.79.0, model claude-sonnet-4-6) drives classification. Patchright handles headless scraping with anti-bot evasion. React 19 + Vite 8 + Tailwind v4 + Express 5 power the dashboard and API.

The v2.0 additions are modest: shadcn/ui components (Button, Card, Badge, Input, Label, Separator) via manual file copy; self-hosted fonts (@fontsource-variable/outfit, @fontsource/inter replacing the Google Fonts CDN call that would fail on conference wifi); and tailwind-merge v3.x + clsx for the cn() utility. The unified radix-ui package (Feb 2026 shadcn migration) is a dependency of the copied shadcn source files.

**Core technologies:**
- OpenClaw 2026.3.13-1: agent framework — ESM-only, skills-based, streaming loop, Node 22+ required
- @tetherto/wdk-wallet-evm latest: WDK wallet — mandatory per hackathon rules, BIP-44, USDT ERC-20 transfers
- @anthropic-ai/sdk 0.79.0: Claude API — structured output, claude-sonnet-4-6 model ID
- Patchright latest: headless scraping — source-level Chromium patch, bypasses DataDome-class protection
- React 19 + Vite 8: dashboard SPA — team-familiar, fast HMR, single-page sufficient for demo
- Tailwind CSS 4.x: styling — CSS-first @theme config, no tailwind.config.js, @tailwindcss/vite plugin
- Express 5.x: API server — lightweight, file bus integration, port 3001

**Critical version constraints:**
- Node 22+ required (OpenClaw hard requirement on macOS — do not run on Node 20)
- tailwind-merge must be v3.x (v2.x does not recognize Tailwind v4 class names)
- tw-animate-css replaces tailwindcss-animate (Tailwind v3-only plugin, incompatible with v4)
- shadcn CLI init must NOT be run — copy component source files manually to avoid generating tailwind.config.js

### Expected Features

The P2P resale story requires a visible 4-step transaction flow that judges can follow in under 5 minutes. Every capability required for steps 2–4 (escrow deposit, AI classification, release/refund/slash) is already built. Step 1 (seller listing form) and the UI wiring between steps are the only new code. Seed data with pre-classified FIFA World Cup 2026 listings is the highest-leverage item because it makes AI reasoning visible without requiring a live agent run during video recording.

**Must have (table stakes for P2P pivot to be credible to judges):**
- Seller listing form — fields: event, section, quantity, price, face value; on submit, triggers classification pipeline
- Buyer USDT lock step — UI button calling /api/escrow/deposit via WDK; shows wallet address + Etherscan link
- AI verification step (visible) — full Classification.reasoning text in a prominent Agent Decision Panel per listing
- Escrow settlement outcome — shows release/refund/slash result + on-chain tx link, driven by classification category
- Ducket brand styling — purple (#7C3AED), yellow (#F59E0B), Outfit headings, shadcn components on existing dashboard
- Demo narrative reframe — README and demo script use buyer/seller personas, not "fraud monitoring" language

**Should have (differentiators that win vs. just qualify):**
- Non-custodial USDT escrow framing — "no platform custody" explicit in UI copy and README
- Cross-platform scan narrative — "agent detected same FIFA ticket on StubHub and Viagogo simultaneously"
- Conditional escrow slash framing — "fraud has a cost; bad actors lose their stake" in Agent Decision Panel
- Autonomous pipeline timestamp — "Agent last ran: 30s ago" + action log to demonstrate autonomy without prompting
- Seed data covering all 4 classification categories — each with 50+ word reasoning strings referencing specific listing fields

**Defer to v2+ (post-hackathon):**
- Real user accounts and auth
- Barcode invalidation (requires ticketing provider API partnership)
- Multi-step dispute resolution flow
- Mobile-responsive UI
- Historical analytics and charts
- Multi-chain escrow beyond Sepolia

### Architecture Approach

The system is a 3-layer pipeline: React SPA polling Express API (port 3001), which imports agent modules directly as ESM functions and reads/writes JSON file bus stores in agent/memory/. The on-chain layer is FraudEscrow.sol on Sepolia, unchanged from v1.0. The new ResaleFlow tab in App.tsx orchestrates a 4-step wizard where each step calls a new /api/resale/* endpoint; those endpoints import classify.js and escrow.js without modification. State is managed with React useState in ResaleFlow.tsx — no Redux or Zustand needed.

**Major components:**
1. ResaleFlow.tsx (NEW) — 4-step wizard orchestrator managing step (1-4) and resaleListing object built across steps
2. /api/resale/* route group (NEW in api.ts) — submit, lock, verify, settle endpoints importing classify.js and escrow.js
3. agent/memory/RESALE_LISTINGS.json (NEW) — structured file bus for P2P listings; separate from append-only LISTINGS.md
4. SellerListForm, BuyerLockForm, AIVerifyStatus, SettleActions (NEW) — dumb child components with callbacks to ResaleFlow
5. AgentDecisionPanel.tsx (EXISTING, REUSE) — already renders category, confidence, reasoning, classificationSource, actionTaken, etherscanLink
6. FraudEscrow.sol (UNCHANGED) — covers deposit/release/refund/slash with opaque escrowId; no redeployment needed

### Critical Pitfalls

1. **Breaking the existing pipeline with additive-only violations** — Never mutate Listing or Classification interfaces; add ResaleListing as a new standalone type. Never change /api/listings response shape; add /api/resale/* as a new route group. Run `npm run build` and verify all 3 existing tabs after every change to types.ts or api.ts.

2. **shadcn CLI init corrupting the Tailwind v4 setup** — Do NOT run `npx shadcn@latest init`. Copy component source files manually. Delete any tailwind.config.js that appears. The existing @tailwindcss/vite plugin setup must remain intact.

3. **Seed data with no classification objects and shallow reasoning** — Pre-attach classification objects to all seed listings before building any UI. Write reasoning strings manually: 50+ words, referencing specific fields (price markup %, account age, cross-platform pattern). If AgentDecisionPanel never expands, judging criterion #1 (Agent Intelligence) is invisible to judges.

4. **Tailwind v4 @theme variable conflicts during rebrand** — Maintain exactly ONE @theme {} block in exactly ONE CSS file (index.css). Add brand colors as new variable names (--color-brand-purple, --color-brand-yellow) — never rename or delete existing tokens (--color-accent, --color-bg-card, etc.). Place font @import BEFORE @import "tailwindcss" or the font import is silently ignored.

5. **Time allocation failure leaving no time for demo video** — Hard time-box the rebrand at 4 hours total. Record the demo video before final polish is complete. A working but unpolished demo with strong narration scores higher than a polished demo with no video.

---

## Implications for Roadmap

Based on combined research, the v2.0 work decomposes into 4 clear phases ordered by dependency. Each phase is a prerequisite for the next. Estimated total: 12–14 hours across 2 days (deadline March 22, 2026).

### Phase 1: Foundation — Types, API Routes, Seed Data
**Rationale:** Types must be defined first so both API and UI compile against shared contracts. API routes must exist before UI components make real calls. Seed data must exist before UI components have anything to render — building on empty state wastes time debugging missing data rather than real issues. The "seed data first" rule is non-obvious but critical: AgentDecisionPanel only expands when a Classification object is present on the listing.
**Delivers:** ResaleListing and P2PEscrowState interfaces in types.ts; working /api/resale/submit, lock, verify, settle endpoints; 10+ seed listings with pre-classified FIFA World Cup 2026 data including rich reasoning strings; scripts/seed-cases.js committed and runnable
**Addresses:** Seller listing form (backend), buyer USDT lock (backend), AI verification (backend), escrow settlement (backend), seed data with pre-classified listings
**Avoids:** Breaking existing pipeline (additive types only), AgentDecisionPanel never expanding (classifications pre-seeded), Claude API calls at render time (classifications persisted to JSON)
**Research flag:** SKIP — explicit file-level API route patterns and type structures fully specified in ARCHITECTURE.md

### Phase 2: Resale Flow UI
**Rationale:** API endpoints must exist before building components that call them. Seed data must exist so components render realistic content from day 1. This phase wires the complete buyer/seller journey end-to-end, which is the core new deliverable of v2.0.
**Delivers:** ResaleFlow.tsx 4-step wizard as a new tab in App.tsx; SellerListForm, BuyerLockForm, AIVerifyStatus, SettleActions child components; useResale.ts polling hook; shadcn component files (manual copy into src/components/ui/); cn() utility in src/lib/utils.ts; path alias @/* configured in tsconfig + vite config
**Addresses:** All 4 P1 table stakes features as visible UI
**Avoids:** Calling Claude API at render time (verify endpoint classifies once and persists), adding a second Express server (route group in existing api.ts), rebuilding escrow contract (FraudEscrow.sol is reused as-is)
**Research flag:** SKIP — component structure, data flow, and exact build order are fully specified in ARCHITECTURE.md with estimated times per step

### Phase 3: Dashboard Rebrand
**Rationale:** Pure visual change with zero logic dependencies. Doing this last means styling work cannot block or break the core demo flow. The 4-hour time-box is non-negotiable — this phase has historically consumed entire hackathon days on Tailwind configuration issues.
**Delivers:** Ducket brand colors (purple #7C3AED, yellow #F59E0B) added as new @theme tokens; Outfit Variable + Inter self-hosted fonts replacing Google Fonts CDN; shadcn CSS variable mappings (--primary, --background, etc.) added to @theme; dashboard header updated to P2P resale positioning; AgentDecisionPanel showing classificationSource field
**Addresses:** Ducket brand styling (P2 feature), polish criterion (#6)
**Avoids:** Tailwind v4 @theme variable conflicts (single block, additive tokens only), shadcn CLI corruption (manual copy done in Phase 2), React 19 + shadcn overlay incompatibilities (use inline expand panels, not Dialog/Sheet), Google Fonts CDN failure on conference wifi (self-hosted fonts)
**Research flag:** SKIP — explicit step-by-step instructions with specific CSS variable names and file locations in STACK.md and PITFALLS.md

### Phase 4: Demo Narrative and Submission Prep
**Rationale:** Narrative files (README, demo script) must update LAST — they must describe what the running system actually does, not what was planned. The most credibility-damaging pitfall is a README that describes a buyer USDT lock flow while the dashboard shows no lock button. Secrets audit before making the repo public is a non-optional step.
**Delivers:** README rewritten with P2P resale framing, buyer/seller personas (Alice/Bob), WDK non-custodial emphasis; demo script mapped step-by-step to actual dashboard screens; demo video recorded before final polish; secrets audit (no .env committed, no API keys in source); "TESTNET" label on all USDT amounts
**Addresses:** Demo narrative reframe (P2 feature), presentation criterion (#7)
**Avoids:** Narrative contradicting running system (update last), secrets in public repo (pre-push audit), rushed video with wrong narration (record before polish is complete)
**Research flag:** SKIP — content-only work; no technical unknowns

### Phase Ordering Rationale

- Types before API before UI: TypeScript compilation dependency chain — components reference types that reference API shapes; building out of order means fixing compile errors instead of building features
- Seed data in Phase 1, not Phase 3: AgentDecisionPanel renders only when Classification objects are present; building UI without seed data means every demo of the new components shows an empty state, creating false debugging signals
- Rebrand in Phase 3, not Phase 1: styling has zero dependencies on logic; doing it early is the single most common time sink in hackathon projects with Tailwind customization
- Narrative and video in Phase 4: the README must describe what exists — this ordering makes it structurally impossible for narrative and running system to diverge
- No parallel tracks: the 2-day timeline does not leave room for merge conflicts between parallel branches; sequential phasing eliminates coordination overhead

### Research Flags

Phases with standard patterns (skip research-phase for all phases):
- **Phase 1 (Foundation):** Explicit API route patterns and type structures defined in ARCHITECTURE.md with code-level detail
- **Phase 2 (Resale Flow UI):** Component structure, data flow, and build order fully specified in ARCHITECTURE.md; shadcn integration steps in STACK.md
- **Phase 3 (Rebrand):** Step-by-step CSS changes with specific variable names, file locations, and import ordering in STACK.md
- **Phase 4 (Narrative):** Content-only work; no technical unknowns; checklist of "looks done but isn't" items in PITFALLS.md

No phases require /gsd:research-phase. All implementation paths are high-confidence and fully specified.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | v1.0 stack confirmed working in codebase; v2.0 additions (shadcn, fontsource, tailwind-merge v3) verified against official shadcn/ui docs and Feb 2026 radix-ui migration changelog |
| Features | HIGH | v1.0 capabilities confirmed by direct codebase inspection of dashboard/src/types.ts, server/api.ts, agent/src/classify.js, agent/src/escrow.js; P2P resale flow patterns cross-validated against TicketSwap competitor analysis and agentic payment hackathon winning patterns |
| Architecture | HIGH | Based on direct codebase inspection of all major files; explicit component-level build plan with file names, estimated times, and data flow diagrams in ARCHITECTURE.md |
| Pitfalls | HIGH | v2.0 pitfalls derived from direct inspection of dashboard/package.json (React 19.2.4, Tailwind 4.2.2, Vite 8.0.1) and index.css; React 19 forwardRef change documented in official React 19 release notes; shadcn CLI v4 behavior is MEDIUM (based on changelog and community reports, not direct test) |

**Overall confidence:** HIGH

### Gaps to Address

- **WDK deposit flow for P2P context:** The existing escrow.js deposit path uses the agent wallet as depositor. For the P2P demo, the "buyer" is conceptually the depositor but the agent wallet executes the transaction. The UI must make this explicit with copy ("Buyer locks USDT via WDK non-custodial wallet") to prevent judge confusion about custody. No code change needed — framing only.
- **shadcn CLI init with Tailwind v4 projects:** The recommendation is to copy components manually. If the CLI must be used for component discovery, the --tailwind-css-file flag behavior with existing v4 setups needs validation before use. Manual copy remains the safe fallback at all times.
- **Demo resilience during live scraping:** Mock fallback already exists in v1.0. Seed data strategy in Phase 1 eliminates this risk for the demo video — the video does not depend on live scrapers.

---

## Sources

### Primary (HIGH confidence)
- shadcn/ui Tailwind v4 docs: https://ui.shadcn.com/docs/tailwind-v4 — CSS variable pattern, @theme inline, React 19 + v4 compatibility
- shadcn/ui Manual Installation: https://ui.shadcn.com/docs/installation/manual — package list, component install commands
- shadcn/ui Feb 2026 Changelog: https://ui.shadcn.com/docs/changelog/2026-02-radix-ui — unified radix-ui package migration
- WDK EVM wallet API: https://docs.wdk.tether.io/sdk/wallet-modules/wallet-evm — transfer pattern, USDT 6-decimal encoding, account derivation
- OpenClaw releases: https://github.com/openclaw/openclaw/releases/ — version 2026.3.13-1, Node >=22.16.0 requirement
- Claude model overview: https://platform.claude.com/docs/en/about-claude/models/overview — claude-sonnet-4-6 model ID confirmed
- React 19 release notes — forwardRef deprecation, ref-as-prop change (official React docs)
- Direct codebase inspection: dashboard/server/api.ts, agent/src/escrow.js, agent/src/classify.js, contracts/src/FraudEscrow.sol, dashboard/src/types.ts, dashboard/src/index.css, dashboard/package.json (React 19.2.4, Tailwind 4.2.2, Vite 8.0.1)

### Secondary (MEDIUM confidence)
- Patchright GitHub: https://github.com/Kaliiiiiiiiii-Vinyzu/patchright — stealth patch approach vs playwright-extra; Chromium-specific
- TicketSwap SecureSwap: https://help.ticketswap.com/en/articles/5123901-what-is-secureswap — competitor verification mechanism
- x402 Ideathon Berlin: https://algorand.co/blog/x402-ideathon-berlin-recap-web3-builders-exploring-agentic-commerce — winning agentic payment hackathon patterns
- tailwind-merge npm: https://www.npmjs.com/package/tailwind-merge — v3.5.0 current, Tailwind v4 support confirmed
- shadcn CLI init behavior in Tailwind v4 projects — shadcn changelog + community reports confirming tailwind.config.js generation risk

### Tertiary (LOW confidence / needs validation)
- FIFA World Cup 2026 secondary market ticket price ranges — general secondary market knowledge used for seed data realism; not sourced from published data

---
*Research completed: 2026-03-20*
*Ready for roadmap: yes*
