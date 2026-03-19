# Requirements: Ducket AI Galactica

**Defined:** 2026-03-20
**Core Value:** Safe P2P ticket resale — buyer locks USDT in escrow, AI agent verifies ticket legitimacy, smart contract releases or refunds automatically.

## v2.0 Requirements

Requirements for the P2P resale pivot. Each maps to roadmap phases.

### Narrative

- [ ] **NARR-01**: README rewritten with P2P resale framing (buyer/seller personas, no "monitoring tool" language)
- [ ] **NARR-02**: CLAUDE.md updated with P2P resale context and decision rules
- [ ] **NARR-03**: Demo script rewritten with resale narrative (seller lists → buyer locks → AI verifies → settles)

### Branding

- [x] **BRAND-01**: Dashboard themed with Ducket colors (primary #3D2870, accent #F5C842, dark mode purple bg)
- [x] **BRAND-02**: Outfit headings + Inter body text via self-hosted @fontsource-variable
- [x] **BRAND-03**: shadcn/ui components integrated (Button, Card, Badge, Input, Label, Separator) via manual copy
- [ ] **BRAND-04**: Trust badges displayed in UI ("Price cap protected", "Verified on-chain", "Non-custodial")

### Resale Flow

- [ ] **RESALE-01**: Seller can list a ticket (event, section, quantity, price, face value) via form
- [ ] **RESALE-02**: Buyer can lock USDT in escrow via WDK deposit for a specific listing
- [ ] **RESALE-03**: AI verification step shows full Classification.reasoning in prominent Agent Decision Panel
- [ ] **RESALE-04**: Escrow settlement displays release/refund/slash outcome with on-chain tx link

### Demo

- [ ] **DEMO-01**: Seed data covers all 4 classification categories with 50+ word AI reasoning strings
- [ ] **DEMO-02**: Demo video recorded (≤5 min) covering agent logic, wallet flow, payment lifecycle, full loop
- [ ] **DEMO-03**: 3x end-to-end rehearsal completed before recording

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

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NARR-01 | Phase 9 | Pending |
| NARR-02 | Phase 9 | Pending |
| NARR-03 | Phase 9 | Pending |
| BRAND-01 | Phase 10 | Complete |
| BRAND-02 | Phase 10 | Complete |
| BRAND-03 | Phase 10 | Complete |
| BRAND-04 | Phase 10 | Pending |
| RESALE-01 | Phase 11 | Pending |
| RESALE-02 | Phase 11 | Pending |
| RESALE-03 | Phase 11 | Pending |
| RESALE-04 | Phase 11 | Pending |
| DEMO-01 | Phase 12 | Pending |
| DEMO-02 | Phase 13 | Pending |
| DEMO-03 | Phase 13 | Pending |

**Coverage:**
- v2.0 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after roadmap creation*
