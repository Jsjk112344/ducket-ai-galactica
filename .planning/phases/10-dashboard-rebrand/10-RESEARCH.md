# Phase 10: Dashboard Rebrand - Research

**Researched:** 2026-03-20
**Domain:** React/Tailwind v4 theming, @fontsource variable fonts, shadcn/ui manual install
**Confidence:** HIGH

## Summary

The dashboard is a React 19 + Tailwind v4 app served at localhost:5173. It currently uses Google Fonts CDN for Inter, a dark blue-grey palette (#0A0E17 backgrounds, indigo accent #6366F1), and hand-rolled Badge/StatCard components. The rebrand replaces these with Ducket brand tokens (primary purple #3D2870, accent yellow #F5C842, very-dark-purple backgrounds), self-hosted variable fonts via @fontsource-variable packages, and shadcn/ui primitives copied manually (never via CLI init, which would produce a tailwind.config.js that conflicts with the existing Tailwind v4 setup).

Tailwind v4 uses `@import "tailwindcss"` + `@theme {}` in CSS — no tailwind.config.js. The current index.css follows this pattern correctly. The rebrand extends `@theme {}` with new color tokens and adds `@theme inline {}` for shadcn CSS variable bridging. Fonts are imported from npm packages in main.tsx, removing the `@import url(...)` Google Fonts line from index.css.

shadcn components at their core are just React + class-variance-authority files. Without CLI init, the workflow is: install peer deps → create `src/lib/utils.ts` (cn helper) → copy component source into `src/components/ui/`. No tailwind.config.js is ever created.

**Primary recommendation:** Update index.css @theme tokens, swap font imports to @fontsource-variable, install shadcn peer deps, manually copy 6 component files, add a trust badges strip to ListingsTable header area.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @fontsource-variable/outfit | 5.2.8 | Self-hosted Outfit variable font | Eliminates Google CDN call; weights baked into npm package |
| @fontsource-variable/inter | 5.2.8 | Self-hosted Inter variable font | Same — replaces current Google Fonts CDN import |
| class-variance-authority | 0.7.1 | shadcn component variant API (cva()) | Used by every shadcn component for prop-driven class variants |
| clsx | 2.1.1 | Conditional className composition | Peer dep of cn() utility |
| tailwind-merge | 3.5.0 | Merge conflicting Tailwind classes | Peer dep of cn() utility; prevents duplicate class rules |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.577.0 | Icon set used by shadcn components | Badge/Label/Separator don't need it, but Button may use ChevronDown etc. |
| tw-animate-css | 1.4.0 | CSS animation utilities referenced by shadcn | Required if any shadcn component uses `animate-*` classes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @fontsource-variable/outfit | @fontsource/outfit (static) | Variable font covers all weights in one file; static requires separate file per weight |
| Manual shadcn copy | shadcn CLI add | CLI add still generates tailwind.config.js on first run in some setups — manual copy is deterministic and avoids the risk |
| @theme inline bridging | Raw CSS variables only | @theme inline is the official Tailwind v4 + shadcn integration path per ui.shadcn.com/docs/tailwind-v4 |

**Installation:**
```bash
cd dashboard
npm install @fontsource-variable/outfit @fontsource-variable/inter class-variance-authority clsx tailwind-merge lucide-react tw-animate-css
```

**Version verification (confirmed against npm registry 2026-03-20):**
- @fontsource-variable/outfit: 5.2.8
- @fontsource-variable/inter: 5.2.8
- class-variance-authority: 0.7.1
- clsx: 2.1.1
- tailwind-merge: 3.5.0
- lucide-react: 0.577.0
- tw-animate-css: 1.4.0

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/
├── components/
│   ├── ui/             # shadcn primitives (Button, Card, Badge, Input, Label, Separator)
│   ├── Badge.tsx       # Existing classification badge — kept, NOT replaced by shadcn Badge
│   ├── TrustBadges.tsx # NEW: "Price cap protected" / "Verified on-chain" / "Non-custodial" strip
│   └── ...             # Existing components updated to use new color tokens
├── lib/
│   └── utils.ts        # cn() helper (clsx + tailwind-merge)
└── index.css           # @theme tokens updated to Ducket palette; Google Fonts CDN removed
```

### Pattern 1: Tailwind v4 @theme Token Update
**What:** Replace existing color tokens in `@theme {}` with Ducket brand tokens. Add `@theme inline {}` block to map CSS variables for shadcn compatibility.
**When to use:** Only approach that works without tailwind.config.js in Tailwind v4.
**Example:**
```css
/* dashboard/src/index.css */
/* Remove: @import url('https://fonts.googleapis.com/...) */
@import "tailwindcss";

/* shadcn CSS variable definitions — required before @theme inline */
:root {
  --background: hsl(263 50% 8%);
  --foreground: hsl(0 0% 98%);
  --card: hsl(263 50% 10%);
  --card-foreground: hsl(0 0% 98%);
  --primary: hsl(263 50% 30%);
  --primary-foreground: hsl(0 0% 98%);
  --secondary: hsl(263 37% 20%);
  --secondary-foreground: hsl(0 0% 98%);
  --muted: hsl(263 50% 12%);
  --muted-foreground: hsl(263 20% 60%);
  --accent: hsl(45 90% 61%);
  --accent-foreground: hsl(263 50% 10%);
  --destructive: hsl(0 75% 55%);
  --border: hsl(263 50% 18%);
  --input: hsl(263 50% 18%);
  --ring: hsl(263 50% 40%);
  --radius: 0.5rem;
}

@theme {
  /* Ducket brand tokens */
  --color-bg-primary: #0a0714;       /* 263 50% 8% dark purple */
  --color-bg-card: #130f1f;          /* 263 50% 10% card purple */
  --color-brand-primary: #3D2870;    /* PRIMARY purple */
  --color-brand-accent: #F5C842;     /* ACCENT yellow */
  --color-success: #10B981;
  --color-warn-red: #EF4444;
  --color-warn-orange: #F97316;
  --color-warn-yellow: #EAB308;
  --font-family-heading: 'Outfit Variable', ui-sans-serif, system-ui, sans-serif;
  --font-family-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
}

/* Bridge shadcn CSS vars into Tailwind v4 utility classes */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-accent: var(--accent);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 2px);
}
```

### Pattern 2: Font Import via @fontsource-variable
**What:** Import font packages in main.tsx (or index.tsx) — NOT via CSS @import url() CDN call.
**When to use:** Whenever Google Fonts CDN must be eliminated. Fontsource handles the woff2 bundling.
**Example:**
```typescript
// dashboard/src/main.tsx  — add before other imports
import '@fontsource-variable/inter';
import '@fontsource-variable/outfit';
// Source: https://fontsource.org/docs/getting-started/install
```

### Pattern 3: shadcn cn() Utility
**What:** Create `src/lib/utils.ts` as the cn() helper. Every shadcn component imports from this path.
**When to use:** Required before copying any shadcn component files.
**Example:**
```typescript
// dashboard/src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// Source: https://ui.shadcn.com/docs/installation/manual
```

### Pattern 4: Trust Badges Strip
**What:** A horizontal strip of 3 trust badges rendered above or below the ListingsTable header, always visible without scrolling.
**When to use:** BRAND-04 requires "Price cap protected", "Verified on-chain", "Non-custodial" visible without scrolling on the main resale view.
**Example:**
```tsx
// dashboard/src/components/TrustBadges.tsx
const TRUST_BADGES = [
  { label: 'Price cap protected', icon: '🛡' },
  { label: 'Verified on-chain', icon: '✓' },
  { label: 'Non-custodial', icon: '🔑' },
];

export function TrustBadges() {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {TRUST_BADGES.map((b) => (
        <span
          key={b.label}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                     bg-brand-primary/20 text-brand-accent border border-brand-primary/40
                     text-xs font-medium"
        >
          {b.icon} {b.label}
        </span>
      ))}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Running `shadcn init` or `shadcn add`:** These commands generate tailwind.config.js which conflicts with Tailwind v4's CSS-only config. The REQUIREMENTS.md explicitly forbids this. Copy component source files manually.
- **Keeping `@import url('https://fonts.googleapis.com/...')` in index.css:** This is a CDN call that violates BRAND-02. Remove it — @fontsource handles font loading via npm.
- **Using `--color-accent` for both brand yellow AND shadcn `--accent`:** The existing codebase uses `text-accent` / `bg-accent` for what was indigo #6366F1. After rebrand, `bg-accent` will map to yellow #F5C842. Audit all existing `accent` class usages to ensure they render correctly.
- **Replacing the existing `Badge.tsx` component with shadcn `Badge`:** The existing Badge.tsx renders classification categories (SCALPING_VIOLATION, LEGITIMATE, etc.) with custom color maps. This is project-specific logic. The shadcn Badge goes into `src/components/ui/Badge.tsx` as a separate primitive for trust badges and general labeling.
- **Forgetting path alias for `@/lib/utils`:** shadcn component source files import from `@/lib/utils`. The current tsconfig.json does NOT define a `@/*` alias. Either add the alias or adjust component imports to relative paths (`../../lib/utils`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Button with loading/disabled variants | Custom button with className conditionals | shadcn Button (cva-based) | cva handles disabled/loading/size/variant matrix cleanly; hand-rolled misses focus-visible ring, aria-disabled |
| Card container styling | `div className="bg-bg-card rounded-lg p-4"` duplicated everywhere | shadcn Card + CardHeader + CardContent | Consistent spacing and semantic structure; current code already has StatCard hand-rolling this |
| Form input styling | `<input className="bg-... border-... rounded-...">` | shadcn Input | Focus ring, error state, disabled state handled; manual styling breaks across browsers |
| Generic label | `<label className="text-xs text-gray-500 uppercase">` | shadcn Label | Consistent htmlFor association, accessible styling built in |
| Horizontal rule / divider | `<hr className="border-gray-700">` | shadcn Separator | Semantic role="separator", supports orientation prop |

**Key insight:** The existing codebase already hand-rolls StatCard (EscrowStatus.tsx), inline label spans (WalletInspector.tsx), and row dividers. Replacing these with shadcn primitives is the rebrand task — not introducing new UI layers.

## Common Pitfalls

### Pitfall 1: `bg-accent` Color Collision
**What goes wrong:** After updating `--color-accent` in `@theme` from indigo (#6366F1) to yellow (#F5C842), every existing `bg-accent`, `text-accent`, `border-accent` usage flips to yellow. This breaks the tab bar active state (App.tsx line 42: `bg-accent text-white`) and AgentDecisionPanel border (line 33: `border-accent/20`). Yellow text on yellow background or yellow on white will be invisible.
**Why it happens:** The existing codebase uses `accent` as "brand indigo" but the Ducket brand accent is yellow.
**How to avoid:** Rename the primary purple to `bg-brand-primary` and yellow to `bg-brand-accent`. Reserve the shadcn `--accent` variable for shadcn component hover states (which will be yellow, as intended for buttons/badges). Audit all `accent` class usages in App.tsx, ListingsTable.tsx, EscrowStatus.tsx, AgentDecisionPanel.tsx, WalletInspector.tsx before and after the change.
**Warning signs:** Tab bar becomes yellow on yellow; run `grep -r "text-accent\|bg-accent\|border-accent" dashboard/src/` to count occurrences before changing tokens.

### Pitfall 2: tsconfig Path Alias Missing for shadcn Components
**What goes wrong:** shadcn component source files contain `import { cn } from "@/lib/utils"`. Without a `@/*` path alias in tsconfig.json + vite.config.ts, TypeScript will error and Vite will fail to resolve the import.
**Why it happens:** The current tsconfig.json has no `paths` config. shadcn components assume `@/*` maps to `src/*`.
**How to avoid:** Either (a) add `"paths": { "@/*": ["./src/*"] }` to tsconfig.json and `resolve.alias: { '@': path.resolve(__dirname, './src') }` to vite.config.ts, or (b) when copying shadcn components, replace `@/lib/utils` with the relative path `../../lib/utils`. Option (b) avoids touching build config.
**Warning signs:** TypeScript error "Cannot find module '@/lib/utils'" immediately on pasting a shadcn component file.

### Pitfall 3: Outfit Font Name Mismatch
**What goes wrong:** @fontsource-variable/outfit exposes the font family as `'Outfit Variable'` (not `'Outfit'`). If `font-family: 'Outfit'` is specified in `@theme`, the browser falls back to system fonts silently.
**Why it happens:** Variable font packages use the "Variable" suffix in the font-family name to distinguish from static versions.
**How to avoid:** Use `'Outfit Variable'` as the font-family value in `@theme`. Verify by checking the package's CSS after install: `cat node_modules/@fontsource-variable/outfit/index.css | head -5`.
**Warning signs:** Headings visually match body text weight; devtools computed font-family shows "system-ui" instead of "Outfit Variable".

### Pitfall 4: Google Fonts CDN Import Ordering
**What goes wrong:** index.css currently has `@import url('https://fonts.googleapis.com/...')` before `@import "tailwindcss"`. Removing the CDN line correctly is step one; if the line order is disrupted (e.g., moving tailwindcss import before a remaining CDN @import), CSS will throw a browser parse warning.
**Why it happens:** CSS @import rules must precede all other rules. Tailwind v4's `@import "tailwindcss"` must come at the top.
**How to avoid:** Simply delete the Google Fonts @import line entirely. Font loading moves to main.tsx JS imports. No reordering needed.
**Warning signs:** Browser console: "A @import rule must precede all other valid at-rules..."

### Pitfall 5: Headings Not Using Outfit in Tailwind v4
**What goes wrong:** Defining `--font-family-heading` in `@theme` does NOT automatically apply to `<h1>–<h6>`. Tailwind v4 exposes it as a utility class `font-heading` but doesn't apply it to heading elements.
**Why it happens:** Tailwind v4 does not have a typography base layer that maps font-family to elements.
**How to avoid:** Either (a) add a `@layer base { h1, h2, h3, h4 { font-family: var(--font-family-heading); } }` in index.css, or (b) apply `font-heading` class explicitly to each heading element. Option (a) is simpler for a rebrand sweep.
**Warning signs:** H1 "Ducket AI Galactica" in App.tsx renders in Inter, not Outfit.

## Code Examples

Verified patterns from official sources:

### Tailwind v4 + shadcn CSS variable bridge (official)
```css
/* Source: https://ui.shadcn.com/docs/tailwind-v4 */
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 3.9%);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

### @fontsource-variable import in entry file
```typescript
// Source: https://fontsource.org/docs/getting-started/install
import '@fontsource-variable/inter';
import '@fontsource-variable/outfit';
```

### cn() utility (standard shadcn pattern)
```typescript
// Source: https://ui.shadcn.com/docs/installation/manual
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### shadcn Button component (Tailwind v4 compatible, no tailwind.config.js)
```tsx
// Source: https://ui.shadcn.com/docs/components/button
// Copy to: dashboard/src/components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils'; // or relative path ../../lib/utils

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);
```

### Applying Outfit to headings via @layer base
```css
/* dashboard/src/index.css */
@layer base {
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-family-heading);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` for theme | `@theme {}` in CSS | Tailwind v4.0 (2025) | No JS config file; shadcn CLI init produces the wrong artifact |
| `@tailwind base/components/utilities` directives | `@import "tailwindcss"` | Tailwind v4.0 | Single import replaces 3 directives |
| shadcn HSL wrappers in @theme | `@theme inline` + `:root {}` variables | shadcn/ui Tailwind v4 update (2025) | Variables in :root, bridged via `@theme inline` |
| Google Fonts CDN @import | @fontsource npm packages | Best practice, no specific date | Privacy, offline, no CDN dependency |
| Static @fontsource (one file/weight) | @fontsource-variable (one file, all weights) | @fontsource-variable package line | Smaller total bundle when using 2+ weights |

**Deprecated/outdated:**
- `@tailwind base` / `@tailwind components` / `@tailwind utilities` directives: replaced by `@import "tailwindcss"` in v4
- `tailwind.config.js` + `tailwind.config.ts`: not used in v4 CSS-first config — creating one will conflict
- `@apply` for component styles in most cases: shadcn v4 components use inline Tailwind classes, not @apply blocks

## Open Questions

1. **@radix-ui/react-slot for shadcn Button asChild prop**
   - What we know: shadcn Button uses `Slot` from `@radix-ui/react-slot` for the `asChild` prop pattern
   - What's unclear: Whether the project needs `asChild` (probably not for basic button usage in this phase)
   - Recommendation: Install `@radix-ui/react-slot` if copying shadcn Button source verbatim; omit if writing a simplified version without asChild

2. **Outfit Variable font weight range**
   - What we know: @fontsource-variable/outfit 5.2.8 covers the variable axis
   - What's unclear: Whether weight 100–900 full range is supported or a subset
   - Recommendation: Check `node_modules/@fontsource-variable/outfit/wght.css` after install; assume 300–700 works for headings

3. **Tab bar accent color after rebrand**
   - What we know: App.tsx uses `bg-accent` for the active tab. After rebrand, accent = yellow #F5C842
   - What's unclear: Whether yellow tab on dark purple background passes contrast ratio
   - Recommendation: Use `bg-brand-primary` (#3D2870 at higher opacity, e.g. bg-brand-primary) for active tab, and yellow only for text/icon highlights — verify in browser

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files in dashboard/ |
| Config file | None |
| Quick run command | `cd dashboard && npm run build` (TypeScript + Vite build as smoke test) |
| Full suite command | `cd dashboard && npm run build` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-01 | Ducket colors (#3D2870, #F5C842) visible in primary UI, no Tailwind default slate/gray in primary areas | manual visual | Open localhost:5173, inspect header + cards | N/A |
| BRAND-02 | Outfit headings + Inter body, no Google Fonts CDN calls | smoke | `cd dashboard && npm run build` — build succeeds without CDN references | ❌ Wave 0 |
| BRAND-03 | Button, Card, Badge, Input, Label, Separator render as shadcn components; no tailwind.config.js in repo | smoke + manual | `ls dashboard/tailwind.config* 2>/dev/null \|\| echo "PASS"` + visual check | ❌ Wave 0 |
| BRAND-04 | Trust badges visible without scrolling on main resale view | manual visual | Open localhost:5173 on Listings tab, verify badges above fold | N/A |

### Sampling Rate
- **Per task commit:** `cd dashboard && npm run build` (TypeScript compile + Vite bundle — catches import errors and missing files)
- **Per wave merge:** `cd dashboard && npm run build` + manual visual check in browser
- **Phase gate:** Build green + manual visual confirmation of all 4 BRAND requirements before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No automated test infrastructure exists in dashboard/ — manual visual checks are the validation method for color/font requirements
- [ ] BRAND-02 can be partially automated: `grep -r "fonts.googleapis.com" dashboard/src/ && echo "FAIL" || echo "PASS"` after font migration
- [ ] BRAND-03 can be partially automated: `ls dashboard/tailwind.config.js 2>/dev/null && echo "FAIL: tailwind.config.js found" || echo "PASS"`

## Sources

### Primary (HIGH confidence)
- https://ui.shadcn.com/docs/tailwind-v4 — shadcn/ui Tailwind v4 migration, @theme inline pattern, CSS variable setup
- https://ui.shadcn.com/docs/installation/manual — Manual install flow, cn() utility, required dependencies
- https://fontsource.org/docs/getting-started/install — @fontsource-variable import syntax
- npm registry (live query 2026-03-20) — All package versions verified via `npm view`

### Secondary (MEDIUM confidence)
- https://www.luisball.com/blog/shadcn-ui-with-tailwind-v4 — Using shadcn without tailwind.config.js, confirms manual copy approach
- Existing codebase (dashboard/src/index.css, vite.config.ts, all component files) — confirmed Tailwind v4 setup pattern already in use

### Tertiary (LOW confidence)
- WebSearch results confirming shadcn CLI now supports Tailwind v4 — not used here because project requires manual copy per REQUIREMENTS.md

## Phase Requirements

<phase_requirements>

| ID | Description | Research Support |
|----|-------------|-----------------|
| BRAND-01 | Dashboard themed with Ducket colors (primary #3D2870, accent #F5C842, dark mode purple bg) | Tailwind v4 `@theme {}` token replacement documented; exact hex values from brand memory file; collision risk with existing `accent` token documented in Pitfall 1 |
| BRAND-02 | Outfit headings + Inter body via self-hosted @fontsource-variable, no Google Fonts CDN | @fontsource-variable/outfit and /inter verified at 5.2.8; import pattern from main.tsx documented; Pitfall 3 (font name mismatch) and Pitfall 5 (headings not auto-applying) pre-identified |
| BRAND-03 | shadcn/ui components (Button, Card, Badge, Input, Label, Separator) via manual copy; no tailwind.config.js | Manual install dependencies verified (cva 0.7.1, clsx 2.1.1, tailwind-merge 3.5.0); cn() utility pattern documented; path alias pitfall documented; out-of-scope: shadcn CLI (per REQUIREMENTS.md) |
| BRAND-04 | Trust badges ("Price cap protected", "Verified on-chain", "Non-custodial") visible without scrolling | TrustBadges component pattern provided; placement above ListingsTable content ensures above-fold visibility; brand colors applied |

</phase_requirements>

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified against npm registry live; @fontsource and shadcn docs fetched directly
- Architecture: HIGH — existing codebase fully read; Tailwind v4 CSS pattern already in place; shadcn Tailwind v4 docs consulted
- Pitfalls: HIGH — all pitfalls derived from reading actual existing code and cross-referencing official docs; accent collision is concrete (grep-verified in component files)

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable ecosystem; shadcn/ui and Tailwind v4 integration is settled as of 2025)
