---
phase: 09-reframe-narrative
plan: 01
subsystem: docs
tags: [narrative, readme, demo-script, p2p-resale, copywriting]

# Dependency graph
requires: []
provides:
  - README.md fully rewritten with Safe P2P ticket resale framing, 4-step resale flow, resale architecture diagram
  - CLAUDE.md updated with buyer/seller P2P lens across Project Overview, Decision Rules, and Priorities
  - docs/DEMO-SCRIPT.md created with Alice (seller) and Bob (buyer) walking 4 resale steps mapped to named dashboard screens
affects:
  - 10-dashboard-rebrand
  - 11-resale-ui-flow
  - 13-demo-rehearsal-submission

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Terminology substitution map: v1.0 fraud-detection language -> v2.0 P2P resale language"
    - "Canonical 4-step resale flow: Seller lists -> Buyer locks USDT -> AI verifies -> Escrow settles"
    - "Demo script format: persona-driven (Alice/Bob) with named screen callouts per step"

key-files:
  created:
    - docs/DEMO-SCRIPT.md
  modified:
    - README.md
    - CLAUDE.md

key-decisions:
  - "README fully rewritten from scratch — zero v1.0 fraud-monitoring framing survives"
  - "CLAUDE.md Hard Constraints section preserved unchanged — hackathon rules are not narrative"
  - "Alice/Bob personas reserved for demo script only — README uses generic seller/buyer language"
  - "FraudEscrow.sol kept as contract filename in technical contexts (architecture diagram, project structure) — not user-facing narrative"
  - "Demo script describes Phase 10-11 future state UI screens, not current v1.0 dashboard"

patterns-established:
  - "Resale framing: Every description maps to the 4-step canonical flow (List -> Lock USDT -> AI Verify -> Settle)"
  - "Banned phrases enforced via grep: fraud detection, monitoring tool, scan and report — zero matches required"

requirements-completed: [NARR-01, NARR-02, NARR-03]

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 9 Plan 01: Reframe Narrative Summary

**README, CLAUDE.md, and demo script rewritten to frame Ducket as a Safe P2P ticket resale platform — zero banned phrases across all three files, Alice/Bob personas in demo script mapping to 4 named dashboard screens**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-19T20:43:40Z
- **Completed:** 2026-03-19T20:45:49Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- README.md fully rewritten: P2P resale lead sentence, 4-step How It Works, resale flow ASCII diagram, updated Third-Party Disclosures ("AI ticket verification" not "AI fraud classification")
- CLAUDE.md partially rewritten: Project Overview, all 6 Decision Rules, and Priorities now use buyer/seller P2P lens; Hard Constraints preserved exactly
- docs/DEMO-SCRIPT.md created: Alice (seller) and Bob (buyer) walk FIFA World Cup 2026 ticket through all 4 resale steps, each mapped to a named dashboard screen

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite README.md and CLAUDE.md with P2P resale framing** - `0591ee4` (feat)
2. **Task 2: Create demo script with Alice/Bob resale scenario** - `27a2149` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `README.md` - Full rewrite: P2P resale framing, 4-step how-it-works, resale architecture diagram, updated disclosures table
- `CLAUDE.md` - Partial rewrite: Project Overview + 6 Decision Rules + Priorities updated; Hard Constraints unchanged
- `docs/DEMO-SCRIPT.md` - New file: Alice/Bob 5-minute demo walkthrough with 4 resale steps mapped to dashboard screens

## Decisions Made
- README uses generic "seller/buyer" language throughout — Alice/Bob personas reserved exclusively for demo script
- FraudEscrow.sol kept as the contract name in architecture diagram and project structure (actual filename, code context, not user-facing narrative)
- Demo script describes future Phase 10-11 UI screens by descriptive name (Seller Listing Form, Buyer Lock Screen, Agent Decision Panel, Settlement Outcome) — not current v1.0 dashboard components
- CLAUDE.md Decision Rules retain concrete action directives after the "→" so rules stay actionable during development, not just narrative-flavored

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- All three narrative files consistent and ready for Phase 10 dashboard rebrand
- Demo script screen names (Seller Listing Form, Buyer Lock Screen, Agent Decision Panel, Settlement Outcome) are ready references for Phase 10-11 UI implementation
- Zero banned phrases verified across all three target files via grep

---
*Phase: 09-reframe-narrative*
*Completed: 2026-03-20*
