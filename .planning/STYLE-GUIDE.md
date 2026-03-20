# Ducket AI Galactica — Style Guide

Extracted from the live codebase. Do NOT invent new tokens — only what is documented here exists.
Last updated: 2026-03-20

---

## 1. Color System

### CSS Variables (`:root` — shadcn semantic layer)

| Variable               | Value                    | Description                                 |
|------------------------|--------------------------|---------------------------------------------|
| `--background`         | `hsl(263 50% 8%)`        | App background (deepest purple-black)        |
| `--foreground`         | `hsl(0 0% 98%)`          | Default body text (near-white)               |
| `--card`               | `hsl(263 50% 10%)`       | Card surface (slightly lighter than bg)      |
| `--card-foreground`    | `hsl(0 0% 98%)`          | Text on card surfaces                        |
| `--primary`            | `hsl(263 50% 30%)`       | Primary brand purple (#3D2870 approx)        |
| `--primary-foreground` | `hsl(0 0% 98%)`          | Text on primary-colored elements             |
| `--secondary`          | `hsl(263 37% 20%)`       | Secondary surface (darker muted purple)      |
| `--secondary-foreground`| `hsl(0 0% 98%)`         | Text on secondary surfaces                   |
| `--muted`              | `hsl(263 50% 12%)`       | Muted surface (subtle background fills)      |
| `--muted-foreground`   | `hsl(263 20% 60%)`       | Subdued text (labels, captions, placeholders)|
| `--accent`             | `hsl(45 90% 61%)`        | Accent yellow (#F5C842 approx)               |
| `--accent-foreground`  | `hsl(263 50% 10%)`       | Dark text on accent-yellow backgrounds       |
| `--destructive`        | `hsl(0 75% 55%)`         | Error red (form errors, destructive actions) |
| `--border`             | `hsl(263 50% 18%)`       | Default border color                         |
| `--input`              | `hsl(263 50% 18%)`       | Input border color (matches --border)        |
| `--ring`               | `hsl(263 50% 40%)`       | Focus ring color                             |
| `--radius`             | `0.5rem`                 | Base border radius                           |

### `@theme` Brand Tokens (Tailwind v4 utility classes)

| Token                      | Value      | Tailwind Class Prefix       | Usage                                      |
|----------------------------|------------|-----------------------------|--------------------------------------------|
| `--color-bg-primary`       | `#0a0714`  | `bg-bg-primary`             | Page background (deepest layer)            |
| `--color-bg-card`          | `#130f1f`  | `bg-bg-card`                | Card/panel backgrounds                     |
| `--color-brand-primary`    | `#3D2870`  | `bg-brand-primary`, `text-brand-primary`, `border-brand-primary` | Main purple — structural elements |
| `--color-brand-accent`     | `#F5C842`  | `bg-brand-accent`, `text-brand-accent`   | Yellow — CTAs, highlights, brand mark |
| `--color-success`          | `#10B981`  | `bg-success`, `text-success`| Positive outcomes (LEGITIMATE, release)    |
| `--color-warn-red`         | `#EF4444`  | `bg-warn-red`, `text-warn-red` | High severity (SCALPING_VIOLATION, slash) |
| `--color-warn-orange`      | `#F97316`  | `bg-warn-orange`, `text-warn-orange` | Medium severity (LIKELY_SCAM, 50–100% markup) |
| `--color-warn-yellow`      | `#EAB308`  | `bg-warn-yellow`, `text-warn-yellow` | Low severity / refund (COUNTERFEIT_RISK) |

### `@theme inline` Bridge Tokens (Tailwind v4 utility classes)

| Tailwind Class      | Resolves To          |
|---------------------|----------------------|
| `bg-background`     | `--background`       |
| `bg-foreground`     | `--foreground`       |
| `bg-card`           | `--card`             |
| `text-card-foreground` | `--card-foreground`|
| `bg-primary`        | `--primary`          |
| `text-primary-foreground` | `--primary-foreground` |
| `bg-secondary`      | `--secondary`        |
| `bg-muted`          | `--muted`            |
| `text-muted-foreground` | `--muted-foreground` |
| `bg-accent`         | `--accent`           |
| `text-accent-foreground` | `--accent-foreground` |
| `bg-destructive`    | `--destructive`      |
| `border-border`     | `--border`           |
| `border-input`      | `--input`            |
| `ring-ring`         | `--ring`             |

### Semantic Color Groupings

**Backgrounds (darkest → lightest):**
- `bg-bg-primary` (#0a0714) — outermost page shell
- `bg-background` (hsl 263 50% 8%) — same layer, used by shadcn components
- `bg-bg-card` (#130f1f) — panel/card interiors
- `bg-card` (hsl 263 50% 10%) — shadcn Card component surface
- `bg-muted` (hsl 263 50% 12%) — subtle fills inside cards
- `bg-secondary` (hsl 263 37% 20%) — secondary surface overlays
- `bg-primary` (hsl 263 50% 30%) — active/selected elements (active tab)

**Foregrounds:**
- `text-white` / `text-foreground` — primary data text
- `text-muted-foreground` — labels, metadata, captions
- `text-brand-accent` — highlighted values, links, CTA labels

**Status / Semantic:**
- `text-success` / `bg-success` (#10B981) — LEGITIMATE, release, positive
- `text-warn-red` / `bg-warn-red` (#EF4444) — SCALPING_VIOLATION, slash, high risk
- `text-warn-orange` / `bg-warn-orange` (#F97316) — LIKELY_SCAM, 50–100% markup
- `text-warn-yellow` / `bg-warn-yellow` (#EAB308) — COUNTERFEIT_RISK, refund

**Borders:**
- `border-border` (hsl 263 50% 18%) — default/neutral borders
- `border-brand-primary/20` to `/60` — purple glow borders at varying opacity
- `border-brand-accent/30` — subtle yellow border accent

---

## 2. Typography

### Font Families

| Family              | CSS Variable                    | Tailwind Class         | Applied To                    |
|---------------------|---------------------------------|------------------------|-------------------------------|
| Outfit Variable     | `--font-family-heading`         | (set via `@layer base`) | All `h1`–`h6` elements       |
| Inter Variable      | `--font-family-sans`            | default sans           | Body text, UI elements        |
| Monospace           | `--font-family-mono`            | `font-mono`            | Addresses, hashes, code       |

**Note:** Headings use `font-family: var(--font-family-heading)` applied globally via `@layer base`. No Tailwind class needed for headings — it's automatic. For inline heading style outside heading tags, use `font-heading` if added, or apply via `style` prop.

### Font Sizes in Use (from component scan)

| Class        | Typical Usage                                                    |
|--------------|------------------------------------------------------------------|
| `text-xs`    | Labels, metadata, badge text, table headers, timestamps, captions|
| `text-sm`    | Body text, reasoning paragraphs, secondary data, form labels     |
| `text-base`  | Input text (default via shadcn Input)                            |
| `text-lg`    | Card/section headings (`h2` in step panels)                      |
| `text-xl`    | Balance values (font-mono), large metric display                 |
| `text-2xl`   | Stat card values, hero title                                     |

### Font Weights in Use

| Class          | Usage                                              |
|----------------|----------------------------------------------------|
| `font-medium`  | Tab labels, badge text, trust badge labels         |
| `font-semibold`| Section headings, classification category labels   |
| `font-bold`    | Hero title, stat values, outcome labels            |

### Letter Spacing

- `tracking-tight` — hero h1
- `tracking-wide` — field labels (uppercase meta labels: "Category", "Confidence", etc.)
- `tracking-wider` — table column headers (uppercase `text-xs`)

---

## 3. Spacing and Layout

### Border Radius Tokens

| Token          | Value             | Resolves To      |
|----------------|-------------------|------------------|
| `--radius`     | `0.5rem`          | base (8px)       |
| `--radius-sm`  | `calc(0.5rem - 2px)` = `0.375rem` | 6px     |
| `--radius-md`  | `0.5rem`          | 8px              |
| `--radius-lg`  | `calc(0.5rem + 2px)` = `0.625rem` | 10px    |

Tailwind rounded classes used in components:
- `rounded` — badge pills (Badge.tsx)
- `rounded-md` — shadcn Button, Input
- `rounded-lg` — panels, card overrides, table container
- `rounded-xl` — shadcn Card base class
- `rounded-full` — trust badge pills, avatar circles, network status dot
- `rounded-t-lg` — tab buttons (top corners only)

### Page Layout

- **Max width:** `max-w-7xl` (1280px) with `mx-auto`
- **Horizontal padding:** `px-6` on main content wrapper
- **Hero vertical padding:** `py-5`
- **Content area vertical padding:** `py-6`
- **Card content padding:** `p-4` (overrides shadcn default `p-6`) or `p-6` for Wallet/Settle

### Common Gap / Spacing Patterns

| Pattern        | Usage                                              |
|----------------|----------------------------------------------------|
| `gap-1`        | Tab bar buttons                                    |
| `gap-2`        | Trust badges, stepper steps, icon+text rows        |
| `gap-3`        | Header icon+text combos, flex rows with badges     |
| `gap-4`        | Form fields (grid gap), stat cards grid            |
| `gap-1.5`      | Badge icon+label, wallet badge icon+text           |
| `space-y-3`    | AgentDecisionPanel internal sections               |
| `space-y-4`    | VerifyStep, BuyerLockStep internal sections        |
| `space-y-5`    | WalletInspector internal sections                  |
| `space-y-6`    | ResaleFlowPanel, EscrowStatus top-level            |

### Grid Patterns

| Component         | Grid                          | Notes                              |
|-------------------|-------------------------------|-------------------------------------|
| AgentDecisionPanel| `grid grid-cols-2 gap-x-4 gap-y-3` | Category+Confidence side-by-side |
| ListingForm       | `grid grid-cols-2 gap-4`      | Event Name + Price span `col-span-2`|
| EscrowStatus stats| `grid grid-cols-2 sm:grid-cols-4 gap-4` | Responsive stat cards      |
| WalletInspector   | `grid grid-cols-2 gap-4`      | ETH + USDT balance side-by-side     |

---

## 4. Component Patterns

### Badge.tsx (`src/components/Badge.tsx`)

Classification category pill badge. NOT the same as `ui/badge.tsx`.

**Props:** `{ category: string }`

**Color map:**
| Category              | Classes                              |
|-----------------------|--------------------------------------|
| `SCALPING_VIOLATION`  | `bg-warn-red text-white`             |
| `LIKELY_SCAM`         | `bg-warn-orange text-white`          |
| `COUNTERFEIT_RISK`    | `bg-warn-yellow text-black`          |
| `LEGITIMATE`          | `bg-success text-white`              |
| fallback              | `bg-gray-500 text-white`             |

**Base classes:** `px-2 py-1 rounded text-xs font-semibold`

---

### ConfidenceBar.tsx (`src/components/ConfidenceBar.tsx`)

Horizontal progress bar showing AI confidence percentage.

**Props:** `{ value: number }` (0–100)

**Color thresholds:**
| Threshold  | Bar Color       |
|------------|-----------------|
| >= 85      | `bg-warn-red`   |
| >= 60      | `bg-warn-orange`|
| < 60       | `bg-success`    |

**Structure:** flex row with `w-full bg-bg-card rounded h-2` track and colored fill div, followed by `text-sm text-gray-400 ml-2` percentage label.

---

### TrustBadges.tsx (`src/components/TrustBadges.tsx`)

Horizontal strip of three trust indicator pills rendered above all listing content.

**Always visible** regardless of data state (rendered before empty state too).

**Badges:** "Price cap protected" (Shield icon), "Verified on-chain" (CheckCircle icon), "Non-custodial" (Lock icon)

**Each badge classes:** `inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/20 text-brand-accent border border-brand-primary/40 text-xs font-medium`

**Icons:** lucide-react, size `w-3.5 h-3.5`

---

### AgentDecisionPanel.tsx (`src/components/AgentDecisionPanel.tsx`)

Expandable classification detail panel. The primary judge-impression component.

**Props:** `{ classification: Classification }`

**Container:** `bg-bg-card/50 border border-brand-primary/40 rounded-lg p-4 space-y-3`

**Layout:** `grid grid-cols-2 gap-x-4 gap-y-3`

**Section label pattern:** `text-xs text-muted-foreground uppercase tracking-wide`

**Fields shown:** Category (Badge), Confidence (ConfidenceBar), Reasoning (text-foreground text-sm), Classification Source (text-muted-foreground text-sm), Action Taken (conditional, color-coded), Etherscan link (conditional, `text-brand-accent underline font-mono text-xs`)

**Action Taken colors:**
- `release` → `text-success`
- `escrow_deposit` → `text-warn-red`
- other → `text-foreground`

**Etherscan section:** `pt-1 border-t border-brand-primary/20`

---

### ListingsTable.tsx (`src/components/ListingsTable.tsx`)

Full data table with expandable Agent Decision rows.

**Columns:** Platform, Seller, Price, Face Value, Delta%, Classification, Confidence, Status

**Table header:** `bg-bg-card text-muted-foreground uppercase text-xs tracking-wider`

**Row:** `hover:bg-bg-card/70 cursor-pointer border-t border-border`

**Alternating row:** odd rows get `bg-bg-card/30`

**Expanded detail row:** `border-t border-brand-primary/20` with `px-4 py-3 bg-bg-primary/50` cell wrapping AgentDecisionPanel

**Delta% color logic:**
- > 100% → `text-warn-red font-semibold`
- > 50% → `text-warn-orange font-semibold`
- <= 50% → `text-success`

**Source badge:** `bg-success/20 text-success` (live) or `bg-bg-card text-muted-foreground` (seed)

**Seller cell:** `font-mono text-xs`

**First seed row is auto-expanded** on load (default `expandedUrl = SEED_URLS[0]`)

---

### EscrowStatus.tsx (`src/components/EscrowStatus.tsx`)

Summary stat cards for the Escrow tab.

**StatCard:** shadcn `Card` + `CardContent` with `border-brand-primary/30 bg-bg-card` override. Value is `text-2xl font-bold` — white normally, `text-brand-accent` when `highlight=true`.

**Network badge:** `bg-brand-primary/20 text-brand-accent text-xs px-3 py-1 rounded-full border border-brand-primary/40` (same pattern as TrustBadges)

**Grid:** `grid grid-cols-2 sm:grid-cols-4 gap-4`

---

### WalletInspector.tsx (`src/components/WalletInspector.tsx`)

WDK wallet details panel.

**Container:** `bg-bg-card rounded-lg p-6 space-y-5 border border-brand-primary/20`

**Loading state:** `animate-pulse text-muted-foreground border border-brand-primary/20`

**Error state:** `bg-warn-red/10 border border-warn-red/30 rounded-lg p-6 text-warn-red text-sm`

**WDK badge:** `bg-brand-primary text-brand-accent text-xs px-2.5 py-0.5 rounded-full border border-brand-accent/30`

**Balance cards:** `bg-bg-primary/50 rounded-lg p-4 border border-brand-primary/20` with `text-xl font-mono font-bold` value and `text-brand-accent text-sm` currency symbol

**Network status dot:** `w-2 h-2 bg-success rounded-full inline-block animate-pulse`

---

### EtherscanLink.tsx (`src/components/EtherscanLink.tsx`)

Reusable Etherscan URL renderer. Always use this — never render raw contract addresses as plain text.

**Props:** `{ href: string; label?: string }`

**Classes:** `text-brand-accent underline font-mono text-xs break-all hover:text-brand-accent/80 transition-colors`

---

### ResaleFlowPanel.tsx (`src/components/ResaleFlowPanel.tsx`)

4-step stepper container. Stepper strip + active step content.

**Step indicator strip:** `flex gap-2` row of `flex-1 py-2 rounded text-center text-sm font-medium` pills
- Active (current step): `bg-brand-primary text-white`
- Completed (past step): `bg-success/20 text-success`
- Upcoming (future step): `bg-bg-card text-muted-foreground`

---

### ListingForm.tsx (`src/components/ListingForm.tsx`)

Step 1: seller listing form. Uses shadcn Card, Input, Label, Button.

**Layout:** `grid grid-cols-2 gap-4` with full-row items using `col-span-2`

**Submit button:** `w-full` width, default variant (primary purple)

---

### BuyerLockStep.tsx (`src/components/BuyerLockStep.tsx`)

Step 2: USDT escrow lock. Shows wallet address, Lock button, then post-lock Etherscan confirmation.

**Post-lock success text:** `text-success text-sm font-medium`

**Advance CTA:** `w-full` Button, shown only after `lockResult` is available

---

### VerifyStep.tsx (`src/components/VerifyStep.tsx`)

Step 3: AI agent decision display.

**AI avatar badge:** `w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-sm` containing text "AI"

**Attribution tag:** `text-xs text-muted-foreground ml-auto` "Powered by Claude AI + rules engine"

---

### SettleStep.tsx (`src/components/SettleStep.tsx`)

Step 4: Settlement outcome display.

**Outcome color config:**
| Key             | Label                     | Color              | Background                    |
|-----------------|---------------------------|--------------------|-------------------------------|
| `release`       | RELEASED to seller        | `text-success`     | `bg-success/10 border-success/30` |
| `refund`        | REFUNDED to buyer         | `text-warn-yellow` | `bg-warn-yellow/10 border-warn-yellow/30` |
| `slash`         | SLASHED to bounty pool    | `text-warn-red`    | `bg-warn-red/10 border-warn-red/30` |
| `escrow_deposit`| PENDING settlement        | `text-muted-foreground` | `bg-bg-card border-border` |

**Outcome label size:** `text-xl font-bold`

---

## 5. Utility CSS Classes

### `.ducket-hero-gradient`

```css
background: linear-gradient(135deg, hsl(263 50% 18%) 0%, hsl(263 50% 8%) 60%, hsl(45 30% 12%) 100%);
```

Purple-to-dark with a subtle warm yellow glow at the far edge. Used on the app header bar.

### `.ducket-card`

```css
background: hsl(263 50% 10%);
border: 1px solid hsl(263 50% 22%);
box-shadow: 0 0 20px hsl(263 50% 15% / 0.3);
```

Card with brand purple border and diffuse purple glow shadow. Used on the main tab content area.

### `.ducket-accent-underline`

```css
position: relative;
display: inline-block;

::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #F5C842, #F5C842 60%, transparent);
  border-radius: 2px;
}
```

Yellow underline decoration for headings. Used on brand/hero text to create the accent underline visual.

---

## 6. shadcn Components Available

All files are in `dashboard/src/components/ui/`. Import using relative paths (e.g., `../../lib/utils`).

| Component   | Import Path                                    | Exports                                                  |
|-------------|------------------------------------------------|----------------------------------------------------------|
| `button`    | `./ui/button` or `../ui/button`                | `Button`, `buttonVariants`                               |
| `card`      | `./ui/card`                                    | `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent` |
| `badge`     | `./ui/badge`                                   | `Badge` (shadcn version), `badgeVariants`                |
| `input`     | `./ui/input`                                   | `Input`                                                  |
| `label`     | `./ui/label`                                   | `Label`                                                  |
| `separator` | `./ui/separator`                               | `Separator`                                              |

**IMPORTANT:** `src/components/Badge.tsx` (classification badge) is DIFFERENT from `src/components/ui/badge.tsx` (shadcn primitive). The classification Badge is used for SCALPING_VIOLATION/LEGITIMATE/etc. The shadcn badge is a generic pill primitive.

### shadcn Button Variants

| Variant       | Visual                                                   |
|---------------|----------------------------------------------------------|
| `default`     | `bg-primary` (purple) — main CTAs                        |
| `destructive` | `bg-destructive` (red) — danger actions                  |
| `outline`     | `border border-input bg-background` — secondary actions  |
| `secondary`   | `bg-secondary` — lower emphasis                          |
| `ghost`       | No background until hover — menu/icon buttons            |
| `link`        | Underlined text link style                               |

### shadcn Button Sizes

| Size      | Classes                  |
|-----------|--------------------------|
| `default` | `h-9 px-4 py-2`          |
| `sm`      | `h-8 px-3 text-xs`       |
| `lg`      | `h-10 px-8`              |
| `icon`    | `h-9 w-9`                |

---

## 7. Visual Patterns

### Card with Purple Glow

Used for the main tab content container in App.tsx. Apply `.ducket-card` class:
```
<div className="ducket-card rounded-b-lg rounded-tr-lg p-5">
```
Gives: purple-tinted card background + subtle border glow + diffuse shadow.

### Hero Gradient Header

Apply `.ducket-hero-gradient` to header wrapper + `border-b border-brand-primary/30`:
```
<div className="ducket-hero-gradient border-b border-brand-primary/30">
```

### Accent Underline Heading

Wrap the heading text span in `.ducket-accent-underline`:
```
<span className="ducket-accent-underline">Heading Text</span>
```

### Trust Badge Strip

Use `<TrustBadges />` component. Renders three pill badges in `flex flex-wrap gap-2 mb-4`. Always place above data content.

### Status Pill (inline)

For non-classification status indicators (live/seed, network badge):
```
className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/20 text-brand-accent border border-brand-primary/40 text-xs font-medium"
```

### Section Label (metadata heading)

Used above every field in AgentDecisionPanel and data sections:
```
<span className="text-xs text-muted-foreground uppercase tracking-wide">Label Text</span>
```

### Monospace Data Display

For addresses, hashes, and numeric values with currency:
- Addresses: `font-mono text-sm text-foreground break-all`
- Large values: `font-mono text-xl text-white font-bold` with `text-brand-accent text-sm` currency suffix
- Small hashes: `font-mono text-xs`

### Empty / Loading State

```
<div className="flex items-center justify-center h-48 text-muted-foreground animate-pulse">
  Waiting for scan cycle...
</div>
```

### AI Avatar Badge

Used in VerifyStep header:
```
<span className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-sm">
  AI
</span>
```

### Network Active Dot

```
<span className="w-2 h-2 bg-success rounded-full inline-block animate-pulse" />
```

---

## 8. App Layout Structure

```
<div className="min-h-screen bg-bg-primary">            ← outermost shell
  <div className="ducket-hero-gradient border-b ...">   ← hero header
    <div className="max-w-7xl mx-auto px-6 py-5">       ← centered content
      logomark + h1 + subtitle
    </div>
  </div>

  <div className="max-w-7xl mx-auto px-6 py-6">         ← main content area
    <div className="flex gap-1 mb-1">                   ← tab bar
      {TABS.map(tab => <button ... rounded-t-lg />)}
    </div>
    <div className="text-xs text-muted-foreground mb-4 pl-1"> ← timestamp
    <div className="ducket-card rounded-b-lg rounded-tr-lg p-5"> ← tab content
      {activeTabContent}
    </div>
  </div>

  <footer className="max-w-7xl mx-auto px-6 py-6">      ← footer
    logomark + "Powered by WDK + Claude AI"
  </footer>
</div>
```

### Tab Bar Pattern

Active tab: `bg-brand-primary border-brand-primary/60 text-brand-accent shadow-[0_-2px_10px_hsl(263_50%_30%/0.3)]`

Inactive tab: `bg-bg-card/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-bg-card`

All tabs: `px-6 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-t border-x`
