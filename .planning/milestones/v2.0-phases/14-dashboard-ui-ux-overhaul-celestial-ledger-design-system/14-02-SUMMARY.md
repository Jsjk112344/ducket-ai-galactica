---
phase: 14-dashboard-ui-ux-overhaul-celestial-ledger-design-system
plan: 02
subsystem: dashboard-ui
tags: [react, tailwind-v4, M3-design, celestial-ledger, UI]
dependency_graph:
  requires: [14-01]
  provides: [fixed-nav, hero-section, FAB, stat-cards-border-l4, active-order-book-table]
  affects: [dashboard/src/App.tsx, dashboard/src/components/EscrowStatus.tsx, dashboard/src/components/ListingsTable.tsx]
tech_stack:
  added: []
  patterns: [M3-border-l4-stat-cards, chevron-expandable-table, fixed-nav-with-pt14-offset, FAB-button, explicit-bgClass-for-tailwind-purge]
key_files:
  created: []
  modified:
    - dashboard/src/App.tsx
    - dashboard/src/components/EscrowStatus.tsx
    - dashboard/src/components/ListingsTable.tsx
decisions:
  - bgClass must be passed as literal string per StatCard — never constructed via .replace() because Tailwind v4 purges dynamically-constructed class names
  - FAB button navigates to Resale Flow tab — additive, not a navigation bypass per CLAUDE.md demo rule
  - lastUpdated timestamp div removed from App.tsx — reduces noise in the fixed-nav layout, data freshness shown by auto-refresh behavior
  - Filter button in Active Order Book header is decorative (no handler) — demo-appropriate placeholder, keeps visual polish without adding non-demo logic
metrics:
  duration: "3 minutes"
  completed: "2026-03-20"
  tasks_completed: 2
  files_modified: 3
---

# Phase 14 Plan 02: App Layout + EscrowStatus + ListingsTable Celestial Ledger Upgrade Summary

**One-liner:** Fixed top nav + Celestial Ledger hero section + FAB, M3 border-l-4 stat cards with progress bars (explicit bgClass), and Active Order Book table with animated chevron expand column.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Upgrade App.tsx — fixed nav, hero section, FAB button | fbb092b | dashboard/src/App.tsx |
| 2 | Upgrade EscrowStatus stat cards and ListingsTable | 9d1c6b7 | dashboard/src/components/EscrowStatus.tsx, dashboard/src/components/ListingsTable.tsx |

## What Was Built

### Task 1: App.tsx layout upgrade

**Fixed top nav** — `fixed top-0 left-0 right-0 z-50` with `bg-m3-surface/90 backdrop-blur-md`. Contains: Ducket logomark, "DUCKET AI" heading, v2.0 badge, and nav tab buttons (replacing the standalone tab bar div that was below the header).

**Hero section** — Below the nav inside `pt-14` wrapper. Uses `ducket-hero-gradient` with `Logo_2.png`, "Celestial Ledger" h1, Protocol v2.0 badge, and "Node Active" pulse indicator using `bg-m3-tertiary animate-pulse`.

**FAB button** — `fixed bottom-6 right-6 z-50` with `bg-m3-secondary text-black`, `Plus` icon from lucide-react. Navigates to Resale Flow tab on click. Visible on all tabs.

**Content wrapper** — Updated to `bg-m3-surface-container rounded-xl p-5 border border-m3-outline/10`. Main background changed from `bg-bg-primary` to `bg-m3-surface`.

**Footer** — Updated to M3 tokens: `text-m3-outline`.

All existing logic preserved: Tab type, TABS array, useListings/useWallet/useResaleFlow hooks, resaleFlow prop spreading, all 4 tab content conditionals.

### Task 2: EscrowStatus + ListingsTable upgrade

**EscrowStatus StatCard** — Rebuilt as plain M3 div (removes shadcn Card/CardContent dependency). `border-l-4 ${colorClass}` gives color-coded left accent. Progress bar added using explicit `bgClass` literal prop — critical for Tailwind v4 purge compatibility. Four cards: Total Scanned (m3-primary), Escrow Deposits (m3-secondary), Releases (m3-tertiary), Active Escrows (m3-error). Header row updated to M3 tokens, Sepolia badge to `bg-m3-primary-container text-m3-primary`.

**ListingsTable** — "Active Order Book" header with Filter button added between TrustBadges and table. Chevron column added as first column in thead/tbody (colSpan updated from 8 to 9). Chevron rotates 180° when row is expanded. All row/header colors migrated to M3 tokens (bg-m3-surface-container, text-m3-outline, border-m3-outline/10, hover:bg-m3-surface-container/50). Expanded detail row uses glass panel: `bg-m3-surface-container/60 backdrop-blur-sm`. SEED_URLS and expandedUrl default preserved unchanged.

## Decisions Made

1. **Explicit bgClass for progress bars** — The plan specified NOT using `.replace('border-', 'bg-')` for the progress bar fill color. All 4 bg classes (`bg-m3-primary`, `bg-m3-secondary`, `bg-m3-tertiary`, `bg-m3-error`) are passed as literal strings at the StatCard call site — Tailwind v4 sees all 4 and includes them in the bundle.

2. **FAB navigation** — FAB goes to `resale` tab (same as the nav tab button). Additive, not a demo bypass per the CLAUDE.md "demo in under 5 minutes" rule.

3. **lastUpdated timestamp removed** — The last-updated timestamp div was removed in the App.tsx rewrite. It existed below the old standalone tab bar, which was eliminated when tabs moved into the fixed nav. The dashboard auto-refreshes every 10s — the timestamp was low-value noise in the new layout.

4. **Filter button is decorative** — Active Order Book Filter button has no onClick handler. This is appropriate for a hackathon demo where the visual indicates data-management capability without adding non-demo logic.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

All acceptance criteria met:
- `dashboard/src/App.tsx` contains `fixed top-0 left-0 right-0 z-50` ✓
- `dashboard/src/App.tsx` contains `Celestial Ledger` ✓
- `dashboard/src/App.tsx` contains `Logo_2.png` ✓
- `dashboard/src/App.tsx` contains `pt-14` ✓
- `dashboard/src/App.tsx` contains `animate-pulse` ✓
- `dashboard/src/App.tsx` contains `import { Plus } from 'lucide-react'` ✓
- `dashboard/src/App.tsx` contains `fixed bottom-6 right-6` (FAB) ✓
- `dashboard/src/App.tsx` contains `bg-m3-secondary` (FAB color) ✓
- `dashboard/src/App.tsx` still contains `useResaleFlow` import and call ✓
- `dashboard/src/App.tsx` still contains `resaleFlow.step` in ResaleFlowPanel props ✓
- `dashboard/src/App.tsx` still contains all 4 tab content conditionals ✓
- `dashboard/src/components/EscrowStatus.tsx` contains `border-l-4` ✓
- `dashboard/src/components/EscrowStatus.tsx` contains `bg-m3-surface-container rounded-lg` ✓
- `dashboard/src/components/EscrowStatus.tsx` contains `border-m3-primary/secondary/tertiary/error` ✓
- `dashboard/src/components/EscrowStatus.tsx` contains `bgClass` in StatCardProps ✓
- `dashboard/src/components/EscrowStatus.tsx` does NOT use `.replace()` for dynamic class construction ✓
- `dashboard/src/components/EscrowStatus.tsx` does NOT import Card ✓
- `dashboard/src/components/ListingsTable.tsx` contains `Active Order Book` ✓
- `dashboard/src/components/ListingsTable.tsx` contains `import { ChevronDown` ✓
- `dashboard/src/components/ListingsTable.tsx` contains `rotate-180` ✓
- `dashboard/src/components/ListingsTable.tsx` contains `colSpan={9}` ✓
- `dashboard/src/components/ListingsTable.tsx` contains `bg-m3-surface-container` ✓
- `dashboard/src/components/ListingsTable.tsx` still contains `SEED_URLS` unchanged ✓
- `dashboard/src/components/ListingsTable.tsx` still contains `expandedUrl` initialized to `SEED_URLS[0]` ✓
- `cd dashboard && npx vite build` exits 0 ✓

## Self-Check: PASSED
