---
phase: 14-dashboard-ui-ux-overhaul-celestial-ledger-design-system
plan: 01
subsystem: ui
tags: [tailwind-v4, css-tokens, material-design-3, jetbrains-mono, fontsource, react, vite]

# Dependency graph
requires:
  - phase: 10-dashboard-rebrand
    provides: Tailwind v4 @theme token pattern, existing color tokens in index.css
provides:
  - "M3 dark theme CSS variable layer in :root (20 tokens: surface, primary, secondary, tertiary, error, outline)"
  - "M3 Tailwind utility classes via @theme (--color-m3-* mappings for bg-m3-*, text-m3-*, border-m3-* usage)"
  - "JetBrains Mono Variable as --font-family-mono (font-mono class now resolves to JetBrains Mono)"
  - "Logo_2.png at /images/Logo_2.png servable from Vite public/"
affects: [14-02, all-components-in-phase-14]

# Tech tracking
tech-stack:
  added: ["@fontsource-variable/jetbrains-mono ^5.2.8"]
  patterns:
    - "M3 tokens declared in both :root (for direct CSS var() use) and @theme (for Tailwind utility generation)"
    - "All new tokens prefixed m3- to avoid collision with shadcn @theme inline bridge tokens"
    - "Font import pattern: @fontsource-variable/* in main.tsx, token in @theme --font-family-*"

key-files:
  created: ["dashboard/public/images/Logo_2.png"]
  modified:
    - "dashboard/src/index.css — 20 M3 :root vars + 20 @theme color utilities + JetBrains Mono font token"
    - "dashboard/src/main.tsx — @fontsource-variable/jetbrains-mono import added"
    - "dashboard/package.json — @fontsource-variable/jetbrains-mono dependency added"

key-decisions:
  - "M3 tokens added to BOTH :root and @theme — :root for CSS var() direct access, @theme for Tailwind utility generation"
  - "All M3 tokens prefixed m3- to prevent collision with existing shadcn bridge tokens (--color-primary, etc.)"
  - "Logo_2.png copied from ../ducket-web/public/images/ — Vite only serves from public/ directory"

patterns-established:
  - "Pattern 1: New color tokens always go in BOTH :root and @theme, never inline hex in TSX"
  - "Pattern 2: Tailwind v4 @theme utilities follow --color-{name} convention for bg-{name} / text-{name} / border-{name} access"

requirements-completed: [UI-01]

# Metrics
duration: 8min
completed: 2026-03-20
---

# Phase 14 Plan 01: Celestial Ledger Foundation — M3 tokens, JetBrains Mono, Logo_2.png

**M3 dark theme token system extended into Tailwind v4 via 20-variable :root + @theme layer, JetBrains Mono Variable wired as font-mono, Logo_2.png asset available at /images/Logo_2.png — Vite build passes**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-20T13:45:00Z
- **Completed:** 2026-03-20T13:53:00Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments

- 20 M3 dark theme CSS variables added to `:root` (surface layers, primary purple, secondary gold, tertiary teal, error, outline)
- 20 `@theme` color utility mappings added, enabling `bg-m3-primary`, `text-m3-tertiary`, `border-m3-outline` etc. in all components
- `--font-family-mono` updated to `'JetBrains Mono Variable'` as first fallback — all `font-mono` elements upgrade automatically
- `@fontsource-variable/jetbrains-mono` installed, imported in `main.tsx`, and verified in Vite build output (woff2 bundle included)
- `Logo_2.png` copied from `ducket-web/public/images/` to `dashboard/public/images/` — servable at `/images/Logo_2.png`
- Vite build exits 0 with 38 `m3-` occurrences confirmed in `index.css`

## Task Commits

Each task was committed atomically:

1. **Task 1: Install JetBrains Mono, copy Logo_2.png, extend index.css with M3 tokens** - `562400e` (feat)

## Files Created/Modified

- `dashboard/src/index.css` — 20 M3 CSS vars added to `:root` block, 20 `--color-m3-*` mappings added to `@theme {}`, `--font-family-mono` updated to JetBrains Mono Variable; all existing tokens preserved
- `dashboard/src/main.tsx` — `import '@fontsource-variable/jetbrains-mono'` added after existing font imports
- `dashboard/package.json` — `@fontsource-variable/jetbrains-mono` in dependencies
- `dashboard/public/images/Logo_2.png` — Ducket wordmark logo asset (22KB) copied from ducket-web

## Decisions Made

- M3 tokens added to BOTH `:root` and `@theme {}` blocks — `:root` for any future CSS `var(--m3-*)` direct access, `@theme` for Tailwind utility class generation. This follows the Pitfall 6 guidance from RESEARCH.md.
- All M3 token names prefixed `m3-` (e.g. `--color-m3-primary` not `--color-primary`) — prevents silent collision with existing shadcn bridge tokens in the `@theme inline` block.
- `Logo_2.png` copied from `../ducket-web/public/images/` rather than referenced by relative path — Vite only serves static assets from `public/` at project root.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- M3 token layer complete. All `bg-m3-*`, `text-m3-*`, `border-m3-*` Tailwind utility classes are available for component upgrades in Plan 14-02.
- `font-mono` now renders JetBrains Mono Variable — wallet addresses and code values will show the correct font automatically.
- `Logo_2.png` available at `/images/Logo_2.png` for hero header use in App.tsx upgrade.
- No blockers for Phase 14 Plan 02 (component overhaul).

---
*Phase: 14-dashboard-ui-ux-overhaul-celestial-ledger-design-system*
*Completed: 2026-03-20*
