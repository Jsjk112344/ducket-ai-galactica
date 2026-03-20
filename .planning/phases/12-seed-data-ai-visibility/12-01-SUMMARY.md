---
phase: 12-seed-data-ai-visibility
plan: "01"
subsystem: seed-data
tags: [seed-data, ai-visibility, agent-decision-panel, listings, demo]
dependency_graph:
  requires: []
  provides: [seed-listings, agent-cases, validation-script]
  affects: [dashboard/src/components/ListingsTable.tsx, agent/memory/LISTINGS.md]
tech_stack:
  added: []
  patterns: [static-seed-injection, case-file-enrichment, default-expand-first-row]
key_files:
  created:
    - scripts/validate-seed.js
    - agent/cases/2026-03-20T00-00-00-000Z-ducket-seed-d0d62390a4c13d24.md
    - agent/cases/2026-03-20T00-00-00-000Z-ducket-seed-b4dbd644a7d0f881.md
    - agent/cases/2026-03-20T00-00-00-000Z-ducket-seed-9304348853ef8964.md
    - agent/cases/2026-03-20T00-00-00-000Z-ducket-seed-e1f7fa9ae56bb7c6.md
  modified:
    - agent/memory/LISTINGS.md
    - dashboard/src/components/ListingsTable.tsx
decisions:
  - "Used CommonJS require() in validate-seed.js since root package.json lacks type:module"
  - "SEED_URLS constant placed above ListingsTable function; expandedUrl initialized to SEED_URLS[0]"
  - "Seed listings inserted as ## Seed Data section before first ## Scan: block in LISTINGS.md to guarantee they appear first in the API array"
  - "npx tsc --noEmit reports pre-existing TS 5.9.3 / bundler moduleResolution conflict — Vite build succeeds, this is out-of-scope"
metrics:
  duration: "~10 minutes"
  completed_date: "2026-03-20"
  tasks_completed: 2
  tasks_total: 3
  files_created: 6
  files_modified: 2
---

# Phase 12 Plan 01: Seed Data + AI Visibility Summary

**One-liner:** 4 pre-classified FIFA World Cup 2026 seed listings injected into LISTINGS.md with matching agent/cases/ files covering all classification categories, first row auto-expanded in ListingsTable.

## What Was Built

- **4 seed case files** in `agent/cases/` with hashes matching pre-computed SHA-256 of seed URLs
- **Validation script** `scripts/validate-seed.js` that verifies 4 categories, hash-filename linkage, and 50+ word reasoning (all 4 files pass at 97-110 words)
- **LISTINGS.md seed section** inserted at top (before scan blocks) so seed listings are first in the API array
- **ListingsTable.tsx** updated with `SEED_URLS` constant and `expandedUrl` defaulting to `SEED_URLS[0]` — first seed row (SCALPING_VIOLATION) is visible without clicking

## Tasks

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Create validation script and 4 seed case files | Complete | 38dc87a |
| 2 | Add seed listing JSON blocks to LISTINGS.md and default-expand first row | Complete | eb6f95b |
| 3 | Verify seed data renders in dashboard | Awaiting human-verify | — |

## Verification Results

- `node scripts/validate-seed.js` — EXIT 0 — all 4 categories, 97-110 word reasoning strings
- `cd dashboard && npm run build` — EXIT 0 — Vite production build succeeds

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files Created/Modified
- [x] scripts/validate-seed.js — EXISTS
- [x] agent/cases/2026-03-20T00-00-00-000Z-ducket-seed-d0d62390a4c13d24.md — EXISTS
- [x] agent/cases/2026-03-20T00-00-00-000Z-ducket-seed-b4dbd644a7d0f881.md — EXISTS
- [x] agent/cases/2026-03-20T00-00-00-000Z-ducket-seed-9304348853ef8964.md — EXISTS
- [x] agent/cases/2026-03-20T00-00-00-000Z-ducket-seed-e1f7fa9ae56bb7c6.md — EXISTS
- [x] agent/memory/LISTINGS.md — MODIFIED with ## Seed Data section
- [x] dashboard/src/components/ListingsTable.tsx — MODIFIED with SEED_URLS + default expand

### Commits
- [x] 38dc87a — feat(12-01): create 4 seed case files and validation script
- [x] eb6f95b — feat(12-01): add seed listings to LISTINGS.md and default-expand first row

## Self-Check: PASSED
