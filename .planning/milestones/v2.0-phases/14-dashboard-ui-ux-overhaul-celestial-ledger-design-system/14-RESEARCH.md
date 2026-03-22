# Phase 14: Dashboard UI/UX Overhaul — Celestial Ledger Design System - Research

**Researched:** 2026-03-20
**Domain:** React + Tailwind v4 UI redesign, Material Design 3 dark tokens, interactive component patterns
**Confidence:** HIGH

---

## Summary

The dashboard is a Vite + React 19 + Tailwind v4 app with a working dark-purple theme established in Phase 10. The CSS architecture uses Tailwind v4's `@import "tailwindcss"` + `@theme {}` pattern — no `tailwind.config.js` exists, and none should be created. The current token set (#3D2870 primary, #F5C842 accent) needs to be extended — not replaced — with the Celestial Ledger M3 token additions (#d0bcff surface purple, #eec13c gold, #4edea3 teal, new surface layers). All 13 existing components must be styled up, not rewritten structurally, to preserve the resale flow logic that was built and validated in Phases 11-12.

The target "Celestial Ledger" design adds: a fixed top nav bar, a hero with protocol version badge, 4 stat cards with `border-l-4` color coding and progress bars, an expandable "Active Order Book" table replacing the current plain table, glass panel effects via `backdrop-filter`, classification badges with M3 semantic color mapping, a FAB button, hover scale effects on trust badges, and animated pulse indicators. All of this can be achieved by extending the existing CSS token layer and upgrading component markup — no new build tooling or framework changes needed.

JetBrains Mono must be added as a third font via `@fontsource-variable/jetbrains-mono` for wallet addresses and code values, complementing the already-installed Outfit Variable and Inter Variable. The `--font-family-mono` token in `@theme {}` is already declared but currently falls back to system mono — it needs to be pointed at JetBrains Mono. Brand logos from `ducket-web/public/images/` (logo.png, logomark.png, Logo_2.png) are available at `../ducket-web/public/images/` relative to this project and can be copied to `dashboard/public/images/` during the plan.

**Primary recommendation:** Extend `index.css` with new M3 CSS variables and `@theme` tokens, upgrade each component's markup to the new design spec, add JetBrains Mono font, copy Logo_2.png asset — all in a single plan wave to minimize integration risk before the demo deadline.

---

## Standard Stack

### Core (already installed — verify no additions needed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| tailwindcss | ^4.2.2 | Utility CSS, Tailwind v4 | Installed |
| @tailwindcss/vite | ^4.2.2 | Vite integration for v4 | Installed |
| tw-animate-css | ^1.4.0 | CSS animation utilities | Installed |
| @fontsource-variable/outfit | ^5.2.8 | Outfit Variable font | Installed |
| @fontsource-variable/inter | ^5.2.8 | Inter Variable font | Installed |
| lucide-react | ^0.577.0 | Icon set (Shield, Lock, etc.) | Installed |
| class-variance-authority | ^0.7.1 | shadcn variant helper | Installed |
| clsx + tailwind-merge | latest | cn() utility | Installed |

### New Dependencies Required

| Library | Version | Purpose | Install Command |
|---------|---------|---------|----------------|
| @fontsource-variable/jetbrains-mono | ^5.2.8 | JetBrains Mono for code/addresses | `npm install @fontsource-variable/jetbrains-mono` |

**Version verification:**
```bash
npm view @fontsource-variable/jetbrains-mono version
# Verified: 5.2.8 (2026-03-20)
```

No other new dependencies. All interactive effects (hover scale, transitions, pulse, backdrop blur) are achievable with Tailwind v4 utilities already in the bundle.

### No shadcn CLI — Manual Copy Only

Per project decision (Phase 10): `shadcn init` CLI is FORBIDDEN — it breaks Tailwind v4 setup by writing a `tailwind.config.js`. Any new shadcn components must be copied manually into `dashboard/src/components/ui/`.

---

## Architecture Patterns

### Current Project Structure (preserve this)

```
dashboard/
├── public/
│   └── images/          # logo.png, logomark.png — add Logo_2.png here
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn primitives: badge, button, card, input, label, separator
│   │   ├── AgentDecisionPanel.tsx
│   │   ├── Badge.tsx    # classification semantic badge — DO NOT replace with ui/badge
│   │   ├── BuyerLockStep.tsx
│   │   ├── ConfidenceBar.tsx
│   │   ├── EscrowStatus.tsx
│   │   ├── EtherscanLink.tsx
│   │   ├── ListingForm.tsx
│   │   ├── ListingsTable.tsx
│   │   ├── ResaleFlowPanel.tsx
│   │   ├── SettleStep.tsx
│   │   ├── TrustBadges.tsx
│   │   ├── VerifyStep.tsx
│   │   └── WalletInspector.tsx
│   ├── hooks/
│   ├── lib/utils.ts     # cn() helper
│   ├── App.tsx
│   ├── index.css        # ALL tokens live here
│   └── types.ts         # NEVER mutate interfaces
```

### Pattern 1: Tailwind v4 Token Extension

**What:** Add new CSS variables to `:root` and map them into `@theme {}` for Tailwind utility class access.
**When to use:** Any new color or design token — always add to `index.css`, never inline hex values in components.
**Example:**
```css
/* index.css — add to :root */
:root {
  /* M3 additions */
  --m3-primary: #d0bcff;
  --m3-secondary: #eec13c;
  --m3-tertiary: #4edea3;
  --m3-surface: #15111f;
  --m3-surface-container: #211d2c;
  --m3-surface-container-highest: #373242;
  --m3-error: #ffb4ab;
  --m3-error-container: #93000a;
  --m3-on-surface: #e7dff3;
  --m3-outline: #948e9b;
}

/* @theme {} — add Tailwind utilities */
@theme {
  --color-m3-primary: var(--m3-primary);
  --color-m3-secondary: var(--m3-secondary);
  --color-m3-tertiary: var(--m3-tertiary);
  --color-m3-surface: var(--m3-surface);
  --color-m3-surface-container: var(--m3-surface-container);
  --color-m3-surface-container-highest: var(--m3-surface-container-highest);
  --color-m3-error: var(--m3-error);
  --color-m3-error-container: var(--m3-error-container);
  --color-m3-on-surface: var(--m3-on-surface);
  --color-m3-outline: var(--m3-outline);
  /* JetBrains Mono as third font */
  --font-family-mono: 'JetBrains Mono Variable', ui-monospace, 'Courier New', monospace;
}
```

### Pattern 2: Stat Card with border-l-4 and Progress Bar

**What:** Replace the current plain shadcn Card stat cards in EscrowStatus with Celestial Ledger stat cards.
**When to use:** All 4 stat cards (Total Scanned, Escrow Deposits, Releases, Active Escrows).
**Example:**
```tsx
// StatCard — Celestial Ledger variant
function StatCard({ label, value, highlight, colorClass, progress }: StatCardProps) {
  return (
    <div className={`bg-m3-surface-container rounded-lg p-4 border-l-4 ${colorClass}`}>
      <p className="text-xs text-m3-outline uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-m3-on-surface">{value}</p>
      {progress !== undefined && (
        <div className="mt-2 h-1 bg-m3-surface-container-highest rounded-full">
          <div
            className={`h-1 rounded-full transition-all duration-500 ${colorClass.replace('border-', 'bg-')}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
}
// border-l-4 color map: border-m3-error (violations), border-m3-secondary (deposits), border-m3-tertiary (releases), border-m3-primary (active)
```

### Pattern 3: Glass Panel Effect

**What:** `backdrop-filter: blur()` panels over the dark bg for premium look.
**When to use:** AgentDecisionPanel expanded row, hero stat overlay, trust badges strip.
**Example:**
```tsx
// Tailwind v4 utility (built-in)
<div className="backdrop-blur-md bg-m3-surface-container/60 border border-m3-outline/20 rounded-xl p-4">
  {/* glass panel content */}
</div>
```

### Pattern 4: Fixed Top Nav Bar

**What:** Replace the current `ducket-hero-gradient` div + tab bar combination with a fixed top nav.
**When to use:** Replace current App.tsx header section.
**Example:**
```tsx
<nav className="fixed top-0 left-0 right-0 z-50 bg-m3-surface/90 backdrop-blur-md border-b border-m3-outline/20 h-14 flex items-center px-6">
  <img src="/images/logomark.png" className="h-7 w-auto mr-3" />
  <span className="font-heading font-bold text-m3-primary text-lg">Ducket</span>
  <span className="ml-2 text-xs bg-m3-surface-container text-m3-outline px-2 py-0.5 rounded-full border border-m3-outline/30">
    v2.0
  </span>
  {/* tab links right-aligned */}
</nav>
// Add pt-14 to main content wrapper to compensate for fixed nav
```

### Pattern 5: Expandable Table Row with Animated Detail Panel

**What:** Chevron-toggle rows in ListingsTable with smooth height animation.
**When to use:** Each row in the Active Order Book table.
**Example:**
```tsx
import { ChevronDown } from 'lucide-react';

// Row header
<tr className="cursor-pointer hover:bg-m3-surface-container transition-colors group" onClick={() => toggleRow(url)}>
  <td>
    <ChevronDown className={`w-4 h-4 text-m3-outline transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
  </td>
  {/* ... other cells */}
</tr>

// Expanded detail row
{isExpanded && (
  <tr>
    <td colSpan={8}>
      <div className="px-4 py-3 bg-m3-surface-container/60 backdrop-blur-sm border-t border-m3-outline/10 animate-in fade-in duration-200">
        <AgentDecisionPanel classification={classification} />
      </div>
    </td>
  </tr>
)}
```

### Pattern 6: Classification Badge — M3 Semantic Mapping

**What:** Update Badge.tsx COLOR_MAP to use M3 tokens.
**When to use:** Replace existing Tailwind semantic color classes with M3 equivalents.
**Mapping:**
```typescript
const COLOR_MAP: Record<string, string> = {
  SCALPING_VIOLATION: 'bg-m3-error-container text-m3-error border border-m3-error/30',
  LIKELY_SCAM: 'bg-warn-orange/15 text-warn-orange border border-warn-orange/30',
  COUNTERFEIT_RISK: 'bg-warn-yellow/15 text-warn-yellow border border-warn-yellow/30',
  LEGITIMATE: 'bg-m3-tertiary/15 text-m3-tertiary border border-m3-tertiary/30',
  FAIR_VALUE: 'bg-m3-tertiary/15 text-m3-tertiary border border-m3-tertiary/30',
  AT_COST: 'bg-m3-surface-container text-m3-on-surface border border-m3-outline/30',
};
```

### Pattern 7: Confidence Circle (M3 variant)

**What:** Replace the current horizontal bar with a circular confidence indicator for the AgentDecisionPanel.
**When to use:** Inside AgentDecisionPanel — the ConfidenceBar can gain a `variant="circle"` prop for this context.
**Example:**
```tsx
// Circle variant using SVG — no new lib needed
function ConfidenceCircle({ value }: { value: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const color = value >= 85 ? '#ffb4ab' : value >= 60 ? '#F97316' : '#4edea3';
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="rotate-[-90deg]" width="48" height="48">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-m3-surface-container-highest" />
        <circle cx="24" cy="24" r={radius} fill="none" strokeWidth="4" stroke={color}
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <span className="absolute text-xs font-bold text-m3-on-surface">{value}%</span>
    </div>
  );
}
```

### Pattern 8: FAB Button (Floating Action Button)

**What:** Fixed-position new listing button visible from all tabs.
**When to use:** Add to App.tsx, outside the main content container.
**Example:**
```tsx
<button
  onClick={() => setActiveTab('resale')}
  className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-m3-secondary text-black shadow-lg shadow-m3-secondary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
>
  <Plus className="w-6 h-6" />
</button>
```

### Pattern 9: Hero Header with Protocol Badge

**What:** Full-width hero section below the fixed nav with gradient, stat summary, and version badge.
**When to use:** Between nav and tab content.
**Example:**
```tsx
<div className="pt-14"> {/* nav offset */}
  <div className="ducket-hero-gradient px-6 py-8 border-b border-m3-outline/10">
    <div className="max-w-7xl mx-auto flex items-end justify-between">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <img src="/images/Logo_2.png" className="h-9 w-auto" />
          <span className="text-xs bg-m3-surface-container border border-m3-outline/30 text-m3-outline px-2.5 py-1 rounded-full font-mono">
            Protocol v2.0
          </span>
        </div>
        <h1 className="text-3xl font-black text-m3-on-surface tracking-tight">Celestial Ledger</h1>
        <p className="text-m3-secondary text-sm mt-1">Safe P2P ticket resale — buyer protected by escrow</p>
      </div>
      {/* stat summary strip */}
    </div>
  </div>
</div>
```

### Anti-Patterns to Avoid

- **Replacing `tailwind.config.js`:** Tailwind v4 has no config file in this project — never create one. All tokens go in `index.css`.
- **Running `shadcn init`:** Will break Tailwind v4 setup. Manual file copy only.
- **Mutating `Listing` or `Classification` interfaces:** `types.ts` must not change — all data contracts are set.
- **Inline hex values in components:** Every color must be a token in `index.css` — never `style={{ color: '#d0bcff' }}` in TSX.
- **Removing `tw-animate-css` import:** The `animate-pulse` class on loading states depends on it.
- **New third-party animation libraries:** `tw-animate-css` already covers all needed animation; `framer-motion` would add 60KB for no demo benefit.
- **Truncating reasoning text:** AgentDecisionPanel reasoning MUST display in full — AI-UX-BRIEF.md principle 2.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading | Manual WOFF2 files | @fontsource-variable/jetbrains-mono | Same as Outfit/Inter — already the project pattern |
| Hover transitions | Custom JS | Tailwind `transition-*` + `hover:scale-105` | v4 has these built-in |
| Confidence circles | Canvas API | SVG with stroke-dasharray | 15 lines of TSX, no dependency |
| Backdrop blur | CSS custom | `backdrop-blur-md` Tailwind utility | v4 built-in |
| Animated row expand | JS height calculation | `animate-in fade-in` from tw-animate-css | Already in the bundle |
| Icon for chevron/plus/FAB | Custom SVG | `lucide-react` (already installed) | Matches existing icon set |
| CSS-only dark mode | `.dark` class system | Not needed — app is dark-only | Design principle 5 |

**Key insight:** Every Celestial Ledger visual effect is achievable with Tailwind v4 utilities and SVG patterns already established in this codebase. The only new install is JetBrains Mono.

---

## Common Pitfalls

### Pitfall 1: Conflicting Token Layers

**What goes wrong:** New M3 tokens declared in `@theme {}` with the same name as existing `@theme inline` bridge tokens (e.g. `--color-primary`) will silently override shadcn component styles.
**Why it happens:** Tailwind v4 merges `@theme` declarations — last write wins.
**How to avoid:** Prefix ALL new M3 tokens with `m3-` (e.g. `--color-m3-primary`, `--color-m3-secondary`). Never repurpose existing token names.
**Warning signs:** shadcn Button changes color unexpectedly after CSS edit.

### Pitfall 2: Fixed Nav + Scrollable Content Offset

**What goes wrong:** Adding `position: fixed` to the nav bar causes page content to slide under it — first 56px of content hidden.
**Why it happens:** Fixed elements are removed from flow.
**How to avoid:** Add `pt-14` (56px) to the outermost content wrapper in App.tsx immediately when the fixed nav is added.
**Warning signs:** ListingForm top fields unreachable on the Resale Flow tab.

### Pitfall 3: Badge Namespace Collision

**What goes wrong:** Importing `{ Badge }` from `./ui/badge` in components that need the classification Badge.
**Why it happens:** Two Badge components exist — `Badge.tsx` (classification semantic) and `ui/badge.tsx` (shadcn primitive).
**How to avoid:** Classification badge is always `import { Badge } from './Badge'` (relative, no ui/ path). The shadcn badge from `./ui/badge` is never used for classification display.
**Warning signs:** Classification badges lose their color coding and show generic gray.

### Pitfall 4: Logo_2.png Not Copied to public/

**What goes wrong:** `<img src="/images/Logo_2.png" />` returns 404 because the asset lives in `ducket-web`, not `ducket-ai-galactica/dashboard/public/`.
**Why it happens:** Vite only serves from `public/` at the project root.
**How to avoid:** Copy `Logo_2.png` and any new images from `../ducket-web/public/images/` to `dashboard/public/images/` as an explicit step in the plan — never reference them by relative path from JSX.
**Warning signs:** `<img>` renders broken image icon in browser.

### Pitfall 5: `tw-animate-css` Class Name Format

**What goes wrong:** Using `animate-in fade-in` for row expansion fails because `tw-animate-css` uses `animate-*` utilities that may have been renamed.
**Why it happens:** `tw-animate-css` is a utility layer — class names depend on version.
**How to avoid:** Verify with the installed version's docs that `animate-in` and `fade-in` are valid. Fallback: use `transition-opacity duration-200 opacity-100` which is pure Tailwind v4.
**Warning signs:** Row expansion has no animation despite class being present.

### Pitfall 6: Tailwind v4 `@theme` vs `:root`

**What goes wrong:** Defining tokens only in `@theme {}` without a matching `:root` CSS variable declaration causes the shadcn components (which read CSS vars via `var()`) to fail.
**Why it happens:** shadcn components use `var(--background)` etc directly — they don't go through Tailwind's class system.
**How to avoid:** M3 tokens needed by shadcn components must be in BOTH `:root` and `@theme {}`. Tokens only used in Tailwind classes only need `@theme {}`.
**Warning signs:** shadcn Card or Button appears with missing background color.

---

## Code Examples

Verified patterns from the codebase audit:

### Font Import Pattern (matches existing Outfit/Inter pattern)
```typescript
// dashboard/src/main.tsx — add alongside existing imports
import '@fontsource-variable/jetbrains-mono';
```

### Tailwind v4 Token Extension (extends index.css pattern)
```css
/* Add to :root block in index.css */
--m3-primary: #d0bcff;
--m3-secondary: #eec13c;
--m3-tertiary: #4edea3;
--m3-surface: #15111f;
--m3-surface-container: #211d2c;
--m3-surface-container-highest: #373242;
--m3-error: #ffb4ab;
--m3-error-container: #93000a;
--m3-on-surface: #e7dff3;
--m3-outline: #948e9b;

/* Add to @theme {} block in index.css */
--color-m3-primary: #d0bcff;
--color-m3-secondary: #eec13c;
--color-m3-tertiary: #4edea3;
--color-m3-surface: #15111f;
--color-m3-surface-container: #211d2c;
--color-m3-surface-container-highest: #373242;
--color-m3-error: #ffb4ab;
--color-m3-error-container: #93000a;
--color-m3-on-surface: #e7dff3;
--color-m3-outline: #948e9b;
--font-family-mono: 'JetBrains Mono Variable', ui-monospace, 'Courier New', monospace;
```

### TrustBadges Hover Scale (upgrade pattern)
```tsx
// Upgrade TrustBadges.tsx
<span
  key={label}
  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
             bg-m3-surface-container text-m3-tertiary border border-m3-tertiary/30
             text-xs font-medium cursor-default
             hover:scale-105 hover:bg-m3-tertiary/10 transition-transform duration-150"
>
  <Icon className="w-3.5 h-3.5" />
  {label}
</span>
```

### Table Row with Animated Expand (ListingsTable upgrade)
```tsx
import { ChevronDown } from 'lucide-react';

<tr
  key={listing.url}
  onClick={() => toggleRow(listing.url)}
  className="cursor-pointer hover:bg-m3-surface-container/50 border-t border-m3-outline/10 transition-colors group"
>
  <td className="px-4 py-3">
    <ChevronDown className={`w-4 h-4 text-m3-outline transition-transform duration-200 ${expandedUrl === listing.url ? 'rotate-180' : ''}`} />
  </td>
  {/* ...cells */}
</tr>
```

### ConfidenceBar with M3 color tokens
```tsx
// Update ConfidenceBar.tsx
const barColor = value >= 85
  ? 'bg-m3-error'              // was: bg-warn-red
  : value >= 60
  ? 'bg-warn-orange'           // keep orange — no M3 token for orange
  : 'bg-m3-tertiary';          // was: bg-success (green → teal)

// Track background upgrade
<div className="w-full bg-m3-surface-container-highest rounded h-2">
```

### Wallet Address with JetBrains Mono
```tsx
// Update font-mono references to be explicit
<p className="font-mono text-sm text-m3-on-surface break-all">{wallet.address}</p>
// font-mono now resolves to 'JetBrains Mono Variable' after @theme update
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Tailwind v3 + tailwind.config.js | Tailwind v4 + @theme in CSS | Already on v4 — maintain this |
| Google Fonts CDN | @fontsource-variable self-hosted | Already self-hosted — add JetBrains Mono same way |
| Single color palette | Layered: brand tokens + shadcn vars + M3 tokens | Phase 14 adds M3 layer |
| Plain table rows | Expandable rows with chevron + panel | Phase 14 upgrade |
| Static trust badges | Hover scale micro-interactions | Phase 14 upgrade |
| System monospace | JetBrains Mono Variable | Phase 14 adds this |

---

## Component Upgrade Map

Every component touched in Phase 14 and what changes:

| Component | Structural Change | Style Change | Preserve |
|-----------|-----------------|-------------|---------|
| `App.tsx` | Fixed nav, hero section, FAB, pt-14 content offset | M3 surface colors | Tab logic, resaleFlow lifted state |
| `index.css` | Add M3 CSS vars to :root + @theme | New token layer | All existing tokens (never remove) |
| `main.tsx` | Add JetBrains Mono import | — | All other imports |
| `ListingsTable.tsx` | Chevron column, "Active Order Book" heading | M3 row hover colors, outline borders | expandedUrl logic, SEED_URLS default |
| `AgentDecisionPanel.tsx` | ConfidenceCircle (optional), metadata grid | Glass panel backdrop-blur | Classification data display, etherscanLink |
| `Badge.tsx` | — | M3 semantic color map | category display logic |
| `ConfidenceBar.tsx` | — | M3 color tokens | value-based color logic |
| `TrustBadges.tsx` | — | Hover scale, M3 teal color | 3 badge items |
| `EscrowStatus.tsx` | StatCard gets border-l-4 + progress bar | M3 surface containers | StatCard label/value data |
| `WalletInspector.tsx` | — | M3 surface containers, m3-outline labels | wallet data display |
| `VerifyStep.tsx` | — | M3 panel styling | AI avatar badge, AgentDecisionPanel |
| `ResaleFlowPanel.tsx` | — | M3 step colors | stepper logic |
| `ListingForm.tsx` | — | M3 surface container card bg | form logic, pre-filled values |
| `BuyerLockStep.tsx` | — | M3 surface container | lock flow logic |
| `SettleStep.tsx` | — | M3 outcome colors | OUTCOME_CONFIG action matching |
| `EtherscanLink.tsx` | — | m3-secondary for link color | href/label props |

---

## Open Questions

1. **Logo_2.png vs logomark.png in the nav bar**
   - What we know: `logomark.png` is currently used in the hero header and footer. `Logo_2.png` is the wider wordmark from ducket-web.
   - What's unclear: Whether `Logo_2.png` is visually appropriate for the 56px fixed nav (it may be too wide). The file is at `ducket-web/public/images/Logo_2.png` but hasn't been visually inspected.
   - Recommendation: Copy both `Logo_2.png` and keep `logomark.png` — use the logomark in the nav, Logo_2 in the hero. Planner should confirm copy step.

2. **animate-in / fade-in availability in tw-animate-css 1.4.0**
   - What we know: `tw-animate-css` is installed at ^1.4.0 and provides `animate-pulse` (used in loading states).
   - What's unclear: Whether `animate-in` + `fade-in` class names exist in this version specifically.
   - Recommendation: Planner should verify with `grep -r "animate-in" dashboard/node_modules/tw-animate-css/` before using. Fallback: `transition-opacity opacity-100 duration-200`.

3. **FAB button accessibility and demo script impact**
   - What we know: Phase 13 (Demo Polish) defined a 4-step demo narrative. A FAB that jumps to "Resale Flow" tab conflicts with navigating from Listings tab in the demo.
   - Recommendation: FAB should navigate to the Resale Flow tab, same as the existing "Resale Flow" tab button — it is additive, not a navigation bypass.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | No test framework in dashboard/ — testing is manual + visual inspection |
| Config file | none — dashboard/package.json has no test script |
| Quick run command | `npm run dev` (visual verification in browser) |
| Full suite command | n/a |

### Phase Requirements → Test Map

| Req | Behavior | Test Type | Notes |
|-----|----------|-----------|-------|
| UI-01 | M3 tokens visible in browser (no token reference errors) | manual | Open DevTools, verify no CSS var `undefined` |
| UI-02 | Fixed nav does not overlap content | manual | Scroll Resale Flow — form fields fully visible |
| UI-03 | Expandable table rows work with chevron | manual | Click rows, verify AgentDecisionPanel expands |
| UI-04 | Stat cards show border-l-4 color coding | visual | Load Escrow tab |
| UI-05 | TrustBadges hover scale visible | manual | Hover over badges |
| UI-06 | JetBrains Mono renders for wallet addresses | visual | Load Wallet tab, inspect address font |
| UI-07 | Logo_2.png loads without 404 | manual | Check Network tab in DevTools |
| UI-08 | Classification badges use M3 colors | visual | Load Listings tab with seed data |
| UI-09 | FAB visible on all tabs | visual | Switch tabs, FAB stays fixed |
| UI-10 | Resale flow 4-step stepper still works end-to-end | functional | Walk through all 4 steps |

### Sampling Rate

- **Per task commit:** Visual browser check — dev server running, no CSS errors in console
- **Per wave merge:** Full visual walkthrough of all 4 tabs + resale flow
- **Phase gate:** All 10 manual checks pass before Phase 13 demo video recording

### Wave 0 Gaps

None — no automated test infrastructure exists for the dashboard, and none is needed for a hackathon visual overhaul. All validation is visual + functional manual testing.

---

## Sources

### Primary (HIGH confidence)

- `/Users/justinsoon/Desktop/others/ducket-ai-galactica/dashboard/src/index.css` — complete existing token system
- `/Users/justinsoon/Desktop/others/ducket-ai-galactica/dashboard/src/App.tsx` — app structure and component composition
- All 13 component files in `dashboard/src/components/` — exact class names and behaviors
- `/Users/justinsoon/Desktop/others/ducket-ai-galactica/dashboard/package.json` — installed dependencies and versions
- `/Users/justinsoon/Desktop/others/ducket-ai-galactica/.planning/STYLE-GUIDE.md` — codebase-extracted token reference
- `/Users/justinsoon/Desktop/others/ducket-ai-galactica/.planning/AI-UX-BRIEF.md` — design principles and vocabulary rules
- `/Users/justinsoon/Desktop/others/ducket-ai-galactica/.planning/STATE.md` — locked decisions from phases 10-12
- `npm view @fontsource-variable/jetbrains-mono version` → 5.2.8 (verified 2026-03-20)

### Secondary (MEDIUM confidence)

- Material Design 3 dark theme color system (design tokens from objective specification)
- Tailwind v4 `backdrop-blur-*` utility class availability (consistent with v4.2.2 docs)
- SVG stroke-dasharray circle pattern for confidence display (standard SVG pattern)

### Tertiary (LOW confidence — flag for validation)

- `tw-animate-css` v1.4.0 exact class names (`animate-in`, `fade-in`) — not verified against installed package files

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies verified from package.json and npm registry
- Architecture: HIGH — all component files read directly, all tokens extracted from live CSS
- Pitfalls: HIGH — derived from actual codebase constraints documented in STATE.md and STYLE-GUIDE.md
- Validation: HIGH — reflects actual test infrastructure (none automated for dashboard)

**Research date:** 2026-03-20
**Valid until:** 2026-03-22 (project deadline — fast-moving hackathon context)
