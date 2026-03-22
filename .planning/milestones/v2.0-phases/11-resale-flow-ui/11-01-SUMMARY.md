---
phase: 11-resale-flow-ui
plan: "01"
subsystem: resale-flow-api-layer
tags: [api, hooks, react, escrow, classification, typescript]
dependency_graph:
  requires: []
  provides: [POST /api/listings, POST /api/escrow/deposit, useResaleFlow, EtherscanLink]
  affects: [dashboard/src/hooks, dashboard/src/components, dashboard/server/api.ts]
tech_stack:
  added: []
  patterns: [express-post-endpoint, react-hook-state-machine, dynamic-import-guard]
key_files:
  created:
    - dashboard/src/hooks/useResaleFlow.ts
    - dashboard/src/components/EtherscanLink.tsx
  modified:
    - dashboard/server/api.ts
decisions:
  - "Dynamic import used for escrow.js to prevent startup crash when SEPOLIA_RPC_URL absent"
  - "lockFunds does NOT auto-advance step — user must review Etherscan link before clicking Proceed"
  - "pickDemoClassification uses three branches (>100%, <-10%, else) to cover all demo scenarios"
  - "runtimeListings prepended (not appended) so form-submitted listings appear at top of list"
metrics:
  duration: "~2 minutes"
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_changed: 3
---

# Phase 11 Plan 01: Resale Flow API Layer Summary

**One-liner:** POST /api/listings + POST /api/escrow/deposit with demo classifier, useResaleFlow 4-step state machine hook, and branded EtherscanLink component.

## What Was Built

Two new Express endpoints and two new client-side files that together form the data contract layer for the 4-step resale flow UI (implemented in Plan 02).

### Task 1: API Endpoints (dashboard/server/api.ts)

- `const runtimeListings: Record<string, unknown>[] = []` — module-level store for listings submitted this session
- `GET /api/listings` — updated to prepend runtimeListings: `res.json([...runtimeListings, ...enriched])`
- `POST /api/listings` — accepts `{ eventName, section, quantity, price, faceValue }`, computes `priceDeltaPct`, calls `pickDemoClassification`, stores in runtimeListings, returns full listing with classification
- `POST /api/escrow/deposit` — generates `escrowId` via SHA-256 slice, returns mock response when SEPOLIA_RPC_URL absent, uses `await import('../../agent/src/escrow.js')` dynamic import for live path
- `pickDemoClassification(priceDeltaPct)` — three branches with 50+ word reasoning each:
  - `> 100%` → SCALPING_VIOLATION (confidence 91, action: slash)
  - `< -10%` → LIKELY_SCAM (confidence 74, action: refund)
  - `else` → LEGITIMATE (confidence 82, action: release)

### Task 2: Hook and Component

- `dashboard/src/hooks/useResaleFlow.ts` — exports `useResaleFlow()` with step/listing/lockResult state and submitListing/lockFunds/advance/reset actions
- `dashboard/src/components/EtherscanLink.tsx` — micro-component with `target="_blank"`, `rel="noopener noreferrer"`, `text-brand-accent`, `font-mono`, `text-xs`, `break-all`

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- `npm run build` exits 0 (both tasks)
- `grep -c "app.post" dashboard/server/api.ts` returns `2`
- `grep "export function useResaleFlow"` matches
- `grep "export function EtherscanLink"` matches

## Self-Check: PASSED

- [x] dashboard/server/api.ts exists and modified
- [x] dashboard/src/hooks/useResaleFlow.ts exists
- [x] dashboard/src/components/EtherscanLink.tsx exists
- [x] Commits 8cb1032 and b2a5a8d exist in git log
- [x] TypeScript build passes with no errors
