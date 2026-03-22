# Requirements: Ducket AI Galactica

**Defined:** 2026-03-20
**Core Value:** Safe P2P ticket resale — buyer locks USDT in escrow, AI agent verifies ticket legitimacy, smart contract releases or refunds automatically.

## v2.0 Requirements

Requirements for the P2P resale pivot. Each maps to roadmap phases.

### Narrative

- [x] **NARR-01**: README rewritten with P2P resale framing (buyer/seller personas, no "monitoring tool" language)
- [x] **NARR-02**: CLAUDE.md updated with P2P resale context and decision rules
- [x] **NARR-03**: Demo script rewritten with resale narrative (seller lists → buyer locks → AI verifies → settles)

### Branding

- [x] **BRAND-01**: Dashboard themed with Ducket colors (primary #3D2870, accent #F5C842, dark mode purple bg)
- [x] **BRAND-02**: Outfit headings + Inter body text via self-hosted @fontsource-variable
- [x] **BRAND-03**: shadcn/ui components integrated (Button, Card, Badge, Input, Label, Separator) via manual copy
- [x] **BRAND-04**: Trust badges displayed in UI ("Price cap protected", "Verified on-chain", "Non-custodial")

### Resale Flow

- [x] **RESALE-01**: Seller can list a ticket (event, section, quantity, price, face value) via form
- [x] **RESALE-02**: Buyer can lock USDT in escrow via WDK deposit for a specific listing
- [x] **RESALE-03**: AI verification step shows full Classification.reasoning in prominent Agent Decision Panel
- [x] **RESALE-04**: Escrow settlement displays release/refund/slash outcome with on-chain tx link

### Demo

- [x] **DEMO-01**: Seed data covers all 4 classification categories with 50+ word AI reasoning strings
- [ ] **DEMO-02**: Demo video recorded (≤5 min) covering agent logic, wallet flow, payment lifecycle, full loop
- [ ] **DEMO-03**: 3x end-to-end rehearsal completed before recording

### UI/UX Overhaul

- [x] **UI-01**: M3 dark token system (19 CSS vars in :root + 19 @theme mappings) with JetBrains Mono as font-mono
- [x] **UI-02**: Fixed top nav with Ducket logomark, tab links, and v2.0 badge visible at all scroll positions
- [x] **UI-03**: Hero section with Logo_2.png, "Celestial Ledger" title, Protocol v2.0 badge, and animated node status
- [x] **UI-04**: FAB button (gold, bottom-right) visible on all tabs, navigates to Resale Flow
- [x] **UI-05**: Stat cards with border-l-4 color coding (primary/secondary/tertiary/error) and progress bars
- [x] **UI-06**: Active Order Book table header replacing plain listings table
- [x] **UI-07**: M3 surface/outline row styling with hover states in listings table
- [x] **UI-08**: M3 semantic badge colors (error-container for scalping, tertiary for legitimate) and glass panel AgentDecisionPanel
- [x] **UI-09**: Chevron expand column with rotate-180 animation in listings table
- [x] **UI-10**: All detail components migrated to M3 tokens (WalletInspector, ResaleFlowPanel, TrustBadges, resale steps, EtherscanLink)

## v2.1 Requirements

Requirements for OpenClaw integration. Satisfies hackathon track "Must Have" for agent reasoning framework.

### OpenClaw Integration

- [x] **CLAW-01**: OpenClaw workspace configured with SOUL.md defining Ducket agent identity and mission
- [x] **CLAW-02**: Three OpenClaw skills registered as SKILL.md files (scan, classify, escrow) with correct YAML frontmatter
- [x] **CLAW-03**: CLI wrapper scripts (cli-scan.js, cli-classify.js, cli-escrow.js) bridge OpenClaw exec tool to existing agent modules
- [x] **CLAW-04**: OpenClaw agent loop can trigger the full scan→classify→enforce pipeline end-to-end
- [x] **CLAW-05**: Demo startup script (`npm run demo`) includes OpenClaw daemon alongside dashboard
- [x] **CLAW-06**: Existing classification quality preserved — all agent tests still pass after integration

## v1.0 Requirements (Validated)

All v1.0 requirements shipped and validated. See PROJECT.md Validated section.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real auth / OAuth | Not needed for agent-first demo |
| Barcode invalidation | Legal risk, not demonstrable |
| Dispute resolution UI | Post-hackathon complexity |
| WebSocket real-time updates | Polling indistinguishable in 5-min demo |
| Mobile responsive | Web-first for hackathon judges |
| `shadcn init` CLI | Breaks Tailwind v4 setup — manual copy only |
| New smart contract | FraudEscrow.sol handles all P2P outcomes as-is |
| OpenClaw session persistence | Nice-to-have, not required for hackathon demo |
| OpenClaw heartbeat replacing node-cron | Keep node-cron as fallback for demo reliability |
| Multi-agent OpenClaw setup | Single agent sufficient for track requirements |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NARR-01 | Phase 9 | Complete |
| NARR-02 | Phase 9 | Complete |
| NARR-03 | Phase 9 | Complete |
| BRAND-01 | Phase 10 | Complete |
| BRAND-02 | Phase 10 | Complete |
| BRAND-03 | Phase 10 | Complete |
| BRAND-04 | Phase 10 | Complete |
| RESALE-01 | Phase 11 | Complete |
| RESALE-02 | Phase 11 | Complete |
| RESALE-03 | Phase 11 | Complete |
| RESALE-04 | Phase 11 | Complete |
| DEMO-01 | Phase 12 | Complete |
| DEMO-02 | Phase 13 | Pending |
| DEMO-03 | Phase 13 | Pending |
| UI-01 | Phase 14 | Complete |
| UI-02 | Phase 14 | Complete |
| UI-03 | Phase 14 | Complete |
| UI-04 | Phase 14 | Complete |
| UI-05 | Phase 14 | Complete |
| UI-06 | Phase 14 | Complete |
| UI-07 | Phase 14 | Complete |
| UI-08 | Phase 14 | Complete |
| UI-09 | Phase 14 | Complete |
| UI-10 | Phase 14 | Complete |
| CLAW-01 | Phase 15 | Complete |
| CLAW-02 | Phase 15 | Complete |
| CLAW-03 | Phase 15 | Complete |
| CLAW-04 | Phase 16 | Complete |
| CLAW-05 | Phase 16 | Complete |
| CLAW-06 | Phase 16 | Complete |

**Coverage:**
- v2.0 requirements: 24 total (22 complete, 2 pending)
- v2.1 requirements: 6 total (0 complete, 6 pending)
- Mapped to phases: 30/30
- Unmapped: 0

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-22 after v2.1 roadmap created (Phases 15-16)*
