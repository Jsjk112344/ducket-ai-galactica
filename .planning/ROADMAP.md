# Roadmap: Ducket AI Galactica

## Milestones

- ✅ **v1.0 MVP** — Phases 1-8 (shipped 2026-03-19)
- 🚧 **v2.0 Safe P2P Ticket Resale** — Phases 9-13 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-8) — SHIPPED 2026-03-19</summary>

- [x] Phase 1: Project Scaffold + Compliance (1/1 plans) — completed 2026-03-19
- [x] Phase 2: WDK Wallet + Escrow Contract (2/2 plans) — completed 2026-03-19
- [x] Phase 3: StubHub Scraper (1/1 plans) — completed 2026-03-19
- [x] Phase 4: Viagogo + FB + Scan Loop (2/2 plans) — completed 2026-03-19
- [x] Phase 5: Classification Engine + Evidence (3/3 plans) — completed 2026-03-19
- [x] Phase 6: Escrow Enforcement Wiring (2/2 plans) — completed 2026-03-19
- [x] Phase 7: React Dashboard (3/3 plans) — completed 2026-03-19
- [x] Phase 8: Demo Integration + Submission (1/2 plans) — completed 2026-03-19 (08-02 deferred)

</details>

### 🚧 v2.0 Safe P2P Ticket Resale (In Progress)

**Milestone Goal:** Pivot the working fraud detection agent into a buyer-facing safe P2P ticket resale platform — seller lists, buyer locks USDT, AI verifies, escrow settles. Reframe narrative, rebrand dashboard, wire resale flow UI, make Claude reasoning visible on seed data, record demo video.

- [x] **Phase 9: Reframe Narrative** — Update README, CLAUDE.md, and demo script for P2P resale framing (completed 2026-03-19)
- [x] **Phase 10: Dashboard Rebrand** — Apply Ducket purple/yellow theme, Outfit headings, shadcn components (completed 2026-03-19)
- [ ] **Phase 11: Resale Flow UI** — 4-step wizard: seller lists, buyer locks USDT, AI verifies, escrow settles
- [ ] **Phase 12: Seed Data + AI Visibility** — Pre-classified FIFA listings with 50+ word Claude reasoning visible in UI
- [ ] **Phase 13: Demo Polish + Video** — End-to-end rehearsals and demo video recording

## Phase Details

### Phase 9: Reframe Narrative
**Goal**: All project text describes a safe P2P resale platform, not a fraud monitoring tool — judges read buyer/seller personas everywhere they look
**Depends on**: Phase 8 (v1.0 complete)
**Requirements**: NARR-01, NARR-02, NARR-03
**Success Criteria** (what must be TRUE):
  1. README uses "seller lists / buyer locks USDT / AI verifies / escrow settles" language throughout and contains no "monitoring tool" or "scan and report" framing
  2. CLAUDE.md decision rules reference P2P resale context and buyer/seller agent role
  3. Demo script walks a named buyer/seller scenario (Alice sells, Bob buys) mapped to actual dashboard screens with no step that says "fraud monitoring"
**Plans:** 1/1 plans complete
Plans:
- [ ] 09-01-PLAN.md — Rewrite README, CLAUDE.md, and create demo script with P2P resale framing

### Phase 10: Dashboard Rebrand
**Goal**: Dashboard visually communicates the Ducket brand — judges see a polished product, not a hackathon scaffold, when they open localhost:5173
**Depends on**: Phase 9
**Requirements**: BRAND-01, BRAND-02, BRAND-03, BRAND-04
**Success Criteria** (what must be TRUE):
  1. Dashboard header and cards use Ducket primary purple (#3D2870) and accent yellow (#F5C842) with dark mode purple background — no default Tailwind slate/gray palette visible in primary UI areas
  2. All headings render in Outfit Variable font and body text renders in Inter — fonts load from self-hosted @fontsource packages with no Google Fonts CDN calls
  3. At least Button, Card, Badge, Input, Label, and Separator render as shadcn components — no shadcn CLI init artifact (tailwind.config.js) present in the repo
  4. Trust badges ("Price cap protected", "Verified on-chain", "Non-custodial") are visible in the UI without scrolling on the main resale view
**Plans:** 2/2 plans complete
Plans:
- [ ] 10-01-PLAN.md — Install deps, update CSS theme tokens, swap fonts to @fontsource-variable, create cn() utility, copy 6 shadcn components
- [ ] 10-02-PLAN.md — Apply Ducket rebrand to all dashboard components, create TrustBadges, wire shadcn Card into EscrowStatus

### Phase 11: Resale Flow UI
**Goal**: A judge can walk all four steps of a P2P ticket transaction — list, lock, verify, settle — without leaving the dashboard
**Depends on**: Phase 10
**Requirements**: RESALE-01, RESALE-02, RESALE-03, RESALE-04
**Success Criteria** (what must be TRUE):
  1. Seller can fill in event, section, quantity, price, and face value in a form and submit it — listing appears in the resale flow after submission
  2. Buyer lock button calls the WDK deposit path for the selected listing — UI shows the wallet address and a live Etherscan link for the escrow transaction
  3. AI verification step displays the full Classification.reasoning text in a prominent Agent Decision Panel — text is readable, 50+ words, references specific listing fields
  4. Settlement outcome (release, refund, or slash) is displayed with the on-chain transaction link and labeled outcome — result matches the listing's classification category
**Plans:** 2 plans
Plans:
- [ ] 11-01-PLAN.md — Add POST /api/listings + POST /api/escrow/deposit endpoints, create useResaleFlow hook and EtherscanLink component
- [ ] 11-02-PLAN.md — Build ListingForm, BuyerLockStep, VerifyStep, SettleStep, ResaleFlowPanel components and wire into App.tsx as first tab

### Phase 12: Seed Data + AI Visibility
**Goal**: Judges can see Claude's reasoning on realistic FIFA World Cup 2026 listings without triggering a live agent run — AgentDecisionPanel never shows empty state
**Depends on**: Phase 11
**Requirements**: DEMO-01
**Success Criteria** (what must be TRUE):
  1. At least one seed listing exists for each of the 4 classification categories (scalping violation, likely scam, counterfeit risk, legitimate) — each has a Classification object pre-attached
  2. Every seed listing's reasoning string is 50+ words and references specific fields from that listing (price markup percentage, account age, cross-platform pattern, or face value delta)
  3. Loading the resale flow tab immediately shows populated listings with expanded Agent Decision Panels — no "no listings" empty state visible on first load
**Plans**: TBD

### Phase 13: Demo Polish + Video
**Goal**: A recorded demo video exists that covers all four judging segments in under 5 minutes — submission is ready to publish
**Depends on**: Phase 12
**Requirements**: DEMO-02, DEMO-03
**Success Criteria** (what must be TRUE):
  1. Demo video is recorded, under 5 minutes, and covers all four required segments: agent logic, wallet flow, payment lifecycle, and full end-to-end loop
  2. Three end-to-end rehearsals are completed before the recording session — each rehearsal covers seller list through escrow settlement without a critical failure
  3. Repo is public, no .env or secrets committed, all third-party services disclosed in README — runnable by a judge with `npm install && npm run demo`
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Scaffold + Compliance | v1.0 | 1/1 | Complete | 2026-03-19 |
| 2. WDK Wallet + Escrow Contract | v1.0 | 2/2 | Complete | 2026-03-19 |
| 3. StubHub Scraper | v1.0 | 1/1 | Complete | 2026-03-19 |
| 4. Viagogo + FB + Scan Loop | v1.0 | 2/2 | Complete | 2026-03-19 |
| 5. Classification Engine + Evidence | v1.0 | 3/3 | Complete | 2026-03-19 |
| 6. Escrow Enforcement Wiring | v1.0 | 2/2 | Complete | 2026-03-19 |
| 7. React Dashboard | v1.0 | 3/3 | Complete | 2026-03-19 |
| 8. Demo Integration + Submission | v1.0 | 1/2 | Complete* | 2026-03-19 |
| 9. Reframe Narrative | 1/1 | Complete   | 2026-03-19 | - |
| 10. Dashboard Rebrand | 2/2 | Complete    | 2026-03-19 | - |
| 11. Resale Flow UI | v2.0 | 0/2 | Not started | - |
| 12. Seed Data + AI Visibility | v2.0 | 0/TBD | Not started | - |
| 13. Demo Polish + Video | v2.0 | 0/TBD | Not started | - |

_*08-02 (E2E demo validation) deferred — see MILESTONES.md for known gaps_

---
_Full v1.0 details archived to: `.planning/milestones/v1.0-ROADMAP.md`_
