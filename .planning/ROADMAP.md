# Roadmap: Ducket AI Galactica

## Milestones

- ✅ **v1.0 MVP** — Phases 1-8 (shipped 2026-03-19)
- ✅ **v2.0 Safe P2P Ticket Resale** — Phases 9-14 (shipped 2026-03-22)
- 🚧 **v2.1 OpenClaw Integration** — Phases 15-16 (in progress)

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

<details>
<summary>✅ v2.0 Safe P2P Ticket Resale (Phases 9-14) — SHIPPED 2026-03-22</summary>

- [x] Phase 9: Reframe Narrative (1/1 plans) — completed 2026-03-19
- [x] Phase 10: Dashboard Rebrand (2/2 plans) — completed 2026-03-19
- [x] Phase 11: Resale Flow UI (2/2 plans) — completed 2026-03-20
- [x] Phase 12: Seed Data + AI Visibility (1/1 plans) — completed 2026-03-20
- [ ] Phase 13: Demo Polish + Video (0/TBD plans) — not started
- [x] Phase 14: Dashboard UI/UX Overhaul (4/4 plans) — completed 2026-03-22

</details>

### 🚧 v2.1 OpenClaw Integration (In Progress)

**Milestone Goal:** Integrate OpenClaw as the agent reasoning/orchestration framework behind the classification pipeline -- satisfying the hackathon track "Must Have" for an agent framework. All changes additive (new files only). Existing code untouched. node-cron kept as fallback.

- [x] **Phase 15: OpenClaw Workspace + Skills** — SOUL.md, 3 SKILL.md files, 3 CLI wrapper scripts (completed 2026-03-21)
- [x] **Phase 16: Pipeline Wiring + Verification** — End-to-end pipeline, demo startup, regression check (completed 2026-03-22)

## Phase Details

### Phase 15: OpenClaw Workspace + Skills
**Goal**: OpenClaw has a complete workspace defining the Ducket agent identity and three executable skills that wrap existing scan, classify, and escrow modules -- all as new additive files
**Depends on**: Phase 14
**Requirements**: CLAW-01, CLAW-02, CLAW-03
**Success Criteria** (what must be TRUE):
  1. A SOUL.md file exists in the OpenClaw workspace directory defining the Ducket agent's identity, mission (safe P2P ticket resale), and the three-step pipeline (scan, classify, escrow)
  2. Three SKILL.md files exist (ducket-scan, ducket-classify, ducket-escrow) with valid YAML frontmatter and natural-language instructions that describe when and how to invoke each skill
  3. Three CLI wrapper scripts (cli-scan.js, cli-classify.js, cli-escrow.js) exist and can be executed standalone via `node cli-scan.js` -- each calls the corresponding existing module and exits with a status code
  4. No existing files (scan-loop.js, classify.js, escrow.js, or any dashboard code) are modified -- all changes are new files only
**Plans**: 1 plan

Plans:
- [ ] 15-01-PLAN.md — Create OpenClaw workspace (SOUL.md), 3 SKILL.md files, and 3 CLI wrapper scripts

### Phase 16: Pipeline Wiring + Verification
**Goal**: OpenClaw can orchestrate the full scan-classify-escrow pipeline end-to-end, the demo startup includes the OpenClaw daemon, and all existing agent tests still pass
**Depends on**: Phase 15
**Requirements**: CLAW-04, CLAW-05, CLAW-06
**Success Criteria** (what must be TRUE):
  1. Running the OpenClaw agent loop triggers the full scan -> classify -> enforce pipeline end-to-end without manual intervention -- listings are scanned, classified, and escrow actions taken automatically
  2. `npm run demo` starts the OpenClaw daemon alongside the dashboard server -- a single command brings up the complete system
  3. All existing agent tests pass after integration -- classification quality is preserved with no regressions in scan, classify, or escrow modules
  4. node-cron scan loop remains functional as a fallback -- reverting to pre-OpenClaw demo startup takes a one-line script change
**Plans**: 2 plans

Plans:
- [ ] 16-01-PLAN.md — Fix pre-existing test failures to establish green baseline
- [ ] 16-02-PLAN.md — Create OpenClaw pipeline orchestrator, update demo startup, verify regressions

## Progress

**Execution Order:**
Phases execute in numeric order: 15 -> 16

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
| 9. Reframe Narrative | v2.0 | 1/1 | Complete | 2026-03-19 |
| 10. Dashboard Rebrand | v2.0 | 2/2 | Complete | 2026-03-19 |
| 11. Resale Flow UI | v2.0 | 2/2 | Complete | 2026-03-20 |
| 12. Seed Data + AI Visibility | v2.0 | 1/1 | Complete | 2026-03-20 |
| 13. Demo Polish + Video | v2.0 | 0/TBD | Not started | - |
| 14. Dashboard UI/UX Overhaul | v2.0 | 4/4 | Complete | 2026-03-22 |
| 15. OpenClaw Workspace + Skills | 1/1 | Complete    | 2026-03-21 | - |
| 16. Pipeline Wiring + Verification | 2/2 | Complete   | 2026-03-22 | - |

_*08-02 (E2E demo validation) deferred -- see MILESTONES.md for known gaps_

---
_Full v1.0 details archived to: `.planning/milestones/v1.0-ROADMAP.md`_
