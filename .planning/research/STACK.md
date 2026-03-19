# Stack Research

**Domain:** Autonomous fraud detection agent with on-chain USDT escrow enforcement
**Researched:** 2026-03-19 (v1.0) / 2026-03-20 (v2.0 delta)
**Confidence:** HIGH (v2.0 additions) / MEDIUM (v1.0 base — see open questions)

---

## v2.0 Stack Additions — P2P Resale UI Rebrand

*This section covers ONLY the new packages and integration steps needed for the v2.0 P2P resale UI milestone. All v1.0 stack below remains valid.*

### New Dependencies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `shadcn` (CLI) | latest | Scaffold component source into `src/components/ui/` | CLI-first, no runtime library — components are copy-pasted source owned by you. Full React 19 + Tailwind v4 support confirmed. |
| `radix-ui` | latest | Unified Radix primitives (replaces scattered `@radix-ui/react-*`) | shadcn Feb 2026 migration consolidated all Radix packages into single `radix-ui`. Auto-installed by shadcn CLI. |
| `class-variance-authority` | ^0.7.1 | Variant-based component styling (internal to shadcn components) | Required by every shadcn component. Pairs with `clsx` + `tailwind-merge` for the `cn()` utility. |
| `clsx` | ^2.1.1 | Conditional className merging | Required by shadcn `cn()` utility. |
| `tailwind-merge` | ^3.5.0 | Merge Tailwind classes without conflicts | v3.x required for Tailwind v4 class knowledge. Do not use v2.x with Tailwind v4. |
| `tw-animate-css` | latest | CSS animation utilities for Tailwind v4 | Replaces `tailwindcss-animate` (Tailwind v3 only). Required for Dialog/Sheet entrance animations. |
| `lucide-react` | ^0.577.0 | Icon library (used by shadcn components) | shadcn default. Tree-shakable SVGs. React 19 compatible (no forwardRef). |
| `@fontsource-variable/outfit` | ^5.x | Self-hosted Outfit variable font (weights 100-900) | One file for all weights via `font-family: 'Outfit Variable'`. Preferred over static `@fontsource/outfit` because headings need multiple weights. Eliminates Google Fonts DNS round-trip — critical for demo reliability. |
| `@fontsource/inter` | ^5.x | Self-hosted Inter font (body text) | Replaces current Google Fonts CDN import in `index.css`. Same result, zero external dependency during demo. |

### Components to Add via CLI

```bash
# Run in dashboard/ workspace
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog      # Buyer "Lock USDT" confirmation modal
npx shadcn@latest add badge       # Listing status: Active / In Escrow / Settled
npx shadcn@latest add input       # Seller listing form fields
npx shadcn@latest add label       # Form labels
npx shadcn@latest add separator   # Section dividers
```

Do not add `form`, `select`, `combobox`, `table`, `data-table`, `calendar`, or any chart components. Each adds transitive deps (`react-hook-form`, `zod`, `cmdk`, `recharts`). With 2 days left, this is scope creep with zero demo value.

### What NOT to Add (v2.0 scope)

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `tailwindcss-animate` | Tailwind v3 plugin format — incompatible with v4's CSS-first config | `tw-animate-css` |
| Multiple `@radix-ui/react-*` packages | Pre-Feb 2026 pattern. shadcn CLI now uses unified `radix-ui`. Mixing creates duplicate peer dep conflicts | `radix-ui` (auto-installed by CLI) |
| `react-hook-form` + `zod` | Overkill for 2-3 field Seller form in a 2-day sprint. useState is sufficient for hackathon forms | React `useState` |
| `framer-motion` | 50KB+ bundle. CSS transitions via `tw-animate-css` are sufficient for modal animations | `tw-animate-css` |
| `zustand` | useState is sufficient for modal open/close + form field state. No cross-component state needed | React `useState` |
| `@fontsource/outfit` (static) | Requires importing each weight separately. Variable font covers all weights in one import | `@fontsource-variable/outfit` |
| Google Fonts `<link>` / CDN | External DNS call on demo load. Fails on conference wifi, fails offline | `@fontsource-variable/outfit`, `@fontsource/inter` |

### Installation (dashboard workspace)

```bash
# 1. Initialize shadcn (run once in dashboard/)
npx shadcn@latest init

# 2. Fonts
npm install @fontsource-variable/outfit @fontsource/inter

# 3. Add components on demand (see list above)
npx shadcn@latest add button card dialog badge input label separator
```

shadcn CLI auto-installs: `radix-ui class-variance-authority clsx tailwind-merge lucide-react tw-animate-css`

### Integration Steps

**Step 1: Path alias — required by shadcn**

shadcn generates components that import from `@/lib/utils` and `@/components/ui/*`. The dashboard `tsconfig.json` currently has no `@/*` alias. Add to `dashboard/tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Add to `dashboard/vite.config.ts`:

```typescript
import path from 'path';
// Inside defineConfig:
resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}
```

The base `tsconfig.base.json` uses `moduleResolution: NodeNext` for the agent workspace — do not change it. The dashboard `tsconfig.json` inherits from it but overrides `moduleResolution: bundler`, so the path alias works independently without touching agent code.

**Step 2: Tailwind v4 theme — extend, do not replace**

shadcn with Tailwind v4 uses `@theme inline` to map CSS custom properties to Tailwind utility classes. The existing `@theme {}` block in `index.css` must be extended with shadcn semantic tokens. Let `npx shadcn@latest init` generate the initial `:root` variable block, then manually replace generated OKLCH values with Ducket brand tokens:

| Token | Generated default | Replace with Ducket |
|-------|-------------------|---------------------|
| `--primary` | blue | `oklch(from #3D2870 l c h)` (Ducket purple) |
| `--accent` | orange | `oklch(from #F5C842 l c h)` (Ducket yellow) |
| `--background` | white | `oklch(from #0A0E17 l c h)` (existing dark bg) |
| `--card` | white | `oklch(from #1A1F2E l c h)` (existing card bg) |

The `@theme inline` block maps these to Tailwind classes (`bg-primary`, `text-accent`, etc.) that shadcn components use internally.

**Step 3: Font migration — replace Google Fonts CDN**

In `dashboard/src/main.tsx` (or `App.tsx`), add at top:

```typescript
import '@fontsource-variable/outfit';
import '@fontsource/inter';
```

In `index.css`, remove the `@import url('https://fonts.googleapis.com/...')` line and add heading font token:

```css
@theme {
  --font-family-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-family-heading: 'Outfit Variable', ui-sans-serif, sans-serif;
}
```

Apply heading font to h1-h4: `className="font-[family-name:var(--font-family-heading)]"` or create a `font-heading` shorthand in `@theme`.

### Version Compatibility (v2.0 additions)

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `shadcn` CLI latest | React 19, Tailwind v4, Vite 8 | Full support confirmed. Generates v4-compatible `@theme inline` CSS blocks. |
| `tw-animate-css` latest | Tailwind v4 | CSS-only plugin. Import in CSS directly, no Tailwind plugin config entry needed. |
| `tailwind-merge` ^3.x | Tailwind v4 | v3.x added Tailwind v4 class knowledge. v2.x does not recognize v4 classes correctly. |
| `@fontsource-variable/outfit` ^5.x | Vite 8 | Vite processes CSS imports from node_modules. Import in JS/TS entry file. |
| `radix-ui` unified | React 19 | Feb 2026 migration. Single package replaces `@radix-ui/react-*`. shadcn CLI manages installation. |
| `lucide-react` ^0.577.0 | React 19 | No `forwardRef` (removed for React 19). Tree-shakable. |

---

## v1.0 Stack (Validated — Do Not Re-research)

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | 22.x (LTS) | Agent runtime | OpenClaw requires Node >=22.16.0 on macOS; WDK is JS/TS-only by hackathon rules |
| TypeScript | 5.x | Type safety across agent + backend | ESM-first codebase; OpenClaw is ESM-only; prevents runtime errors on wallet address types |
| OpenClaw | 2026.3.13-1 (latest) | Autonomous agent framework | Team already experienced; local-first; skills-based tool extension; streaming agent loop; no cloud dependency |
| @tetherto/wdk-wallet-evm | latest | Self-custodial EVM wallet + USDT transfers | Hackathon mandatory requirement; provides BIP-44 wallet creation, ERC-20 (USDT) transfers, balance queries without centralized custody |
| @anthropic-ai/sdk | 0.79.0 | LLM classification of ticket listings | Tool-use / structured output API for fraud classification; fast enough for real-time per-listing decisions |
| Patchright | latest (npm) | Headless browser scraping with anti-bot evasion | Source-level Playwright patch that removes Runtime.enable fingerprinting leak; needed for Carousell and Viagogo which use DataDome-class protection |
| React + Vite | React 19 / Vite 8 | Organizer dashboard | Team familiar; fast HMR for hackathon iteration; single-page app is sufficient for demo |
| Tailwind CSS | 4.x | Dashboard styling | Team familiar from ducket-web; zero config overhead; utility classes ship fast |
| Express | 5.x | HTTP API + polling host | Lightweight; sufficient for agent event relay, escrow state API, and scan trigger endpoints |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 3.x | Schema validation for LLM output | Wrap Claude structured outputs in Zod schemas to ensure classification fields are present before acting on them |
| @tetherto/wdk-protocol-bridge-usdt0-evm | latest | USDT0 cross-chain bridge (if needed) | Only needed if demo requires cross-chain movement; skip for Sepolia-only demo |
| viem | 2.x | Low-level EVM RPC calls | Fallback for reading Sepolia chain state (block confirmations, event logs) without WDK overhead; optional if WDK covers it |
| dotenv | 16.x | Secret management | Keep ANTHROPIC_API_KEY and WDK seed phrases out of committed code; use .env.example for judges |
| tsx | latest | TypeScript execution without build step | Run agent server directly with `tsx watch` during hackathon; no tsc compile loop needed |
| concurrently | 9.x | Run agent + dashboard dev server together | Single `npm run dev` for demos and judge testing |
| @types/express, @types/node | matching | TypeScript declarations | Standard; no runtime cost |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| tsx (ts-node replacement) | Execute TypeScript directly | Faster than ts-node; ESM-compatible; use `tsx watch src/agent/index.ts` for hot reload |
| Vite | Dashboard bundler | Default React template with `npm create vite@latest`; TypeScript + React preset |
| Sepolia RPC | Testnet EVM node | Use Alchemy or Infura free tier; public endpoints are rate-limited and unreliable for hackathon demos |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| shadcn/ui (CLI copy-paste) | MUI, Mantine, Chakra | Fully packaged component libs conflict with Tailwind v4 and add 50-200KB runtime. Use them when you don't own the styling. |
| `@fontsource-variable/outfit` | Google Fonts CDN | When offline-first isn't a concern. Avoid in hackathon — external dep that can fail on conference wifi. |
| `useState` for P2P forms | `react-hook-form` + `zod` | When forms have complex validation (email, file upload, multi-step). Overkill for 2-3 field forms in 2-day sprint. |
| `lucide-react` | `@radix-ui/react-icons`, Heroicons | When you need a specific icon set. lucide-react is shadcn's default — no switching cost. |
| `tw-animate-css` | `tailwindcss-animate` | `tailwindcss-animate` is Tailwind v3 only. For v4, always use `tw-animate-css`. |
| Patchright | playwright-extra + stealth plugin | Stealth plugin is JavaScript monkey-patching; Patchright patches at source level — use Patchright for sites with DataDome/Akamai |
| @tetherto/wdk-wallet-evm | ethers.js v6 direct | ethers.js is fine for reading chain state; WDK is mandatory for wallet operations per hackathon rules |

---

## Stack Patterns by Variant

**Agent process (Node.js server):**
- OpenClaw provides the agent loop and skill dispatch
- Each "skill" maps to one agent capability: `scrape-listings`, `classify-listing`, `escrow-deposit`, `escrow-slash`, `escrow-release`, `draft-report`
- WDK wallet instance is created once at agent startup from seed phrase in .env and passed into escrow skills
- Claude API is called inside `classify-listing` skill with structured output (Zod schema)

**Dashboard (React SPA, v2.0 rebrand):**
- Vite dev server proxies `/api` to Express backend
- shadcn components for P2P resale flow UI (Seller List form, Buyer Lock USDT modal)
- Ducket brand tokens in Tailwind v4 `@theme` block (purple `#3D2870`, yellow `#F5C842`)
- Outfit Variable for headings, Inter for body
- No auth needed — judge demo is single-user

**If only rebranding (no new flows):**
- Update `index.css` color tokens + add font imports
- No shadcn needed — existing custom components restyled with Tailwind tokens
- 30-minute change, zero new dependencies

**If adding full P2P flow UI (Seller + Buyer forms):**
- Install shadcn, add Button/Card/Dialog/Input/Badge/Label
- Use `useState` for all form state
- Estimated 3-4 hours including theme integration

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| shadcn CLI latest | React 19, Tailwind v4 ^4.2.x, Vite 8 | Full support. |
| tailwind-merge ^3.5.0 | Tailwind v4 | v3.x required. v2.x does not know v4 class names. |
| tw-animate-css latest | Tailwind v4 | CSS-only. Import in CSS file, not vite.config.ts. |
| @fontsource-variable/outfit ^5.x | Vite 8 | Import in JS/TS entry point. Vite resolves node_modules CSS. |
| openclaw 2026.3.13-1 | Node >=22.16.0 | ESM-only; use `"type": "module"` in package.json |
| @tetherto/wdk-wallet-evm latest | Node 20+ | Highest-risk integration — test on day 1 |
| patchright latest | Chromium only | Stealth patches are Chromium-specific |
| @anthropic-ai/sdk 0.79.0 | Node 18+ | model ID: `claude-sonnet-4-6` |
| React 19 | Vite 8 | Default from `npm create vite@latest` with react-ts template |
| Tailwind CSS 4.x | Vite 8 | Use `@tailwindcss/vite` plugin (not PostCSS config) |

---

## Key WDK Code Pattern

The core WDK pattern for the escrow skill (HIGH confidence — verified from official docs):

```typescript
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'

// Initialize once at agent startup
const wallet = new WalletManagerEvm(process.env.AGENT_SEED_PHRASE!, {
  provider: process.env.SEPOLIA_RPC_URL!, // e.g. Alchemy Sepolia endpoint
  transferMaxFee: 100000000000000
})

const agentAccount = await wallet.getAccount(0)

// Slash: agent slashes from escrow to treasury
await agentAccount.transfer({
  token: '0x7169d38820dfd117c3fa1f22a697dba58d90ba06', // Sepolia USDT
  recipient: process.env.TREASURY_ADDRESS!,
  amount: BigInt(slashAmountUsdt * 1_000_000) // USDT has 6 decimals
})
```

---

## Sources

**v2.0 additions:**
- [Tailwind v4 - shadcn/ui](https://ui.shadcn.com/docs/tailwind-v4) — CSS variable pattern, `@theme inline`, React 19 + v4 compatibility — HIGH confidence
- [Manual Installation - shadcn/ui](https://ui.shadcn.com/docs/installation/manual) — Package list: `shadcn class-variance-authority clsx tailwind-merge lucide-react tw-animate-css` — HIGH confidence
- [February 2026 Radix UI Migration - shadcn/ui](https://ui.shadcn.com/docs/changelog/2026-02-radix-ui) — Unified `radix-ui` package — HIGH confidence
- [Vite - shadcn/ui](https://ui.shadcn.com/docs/installation/vite) — Path alias config, monorepo `--monorepo` flag — HIGH confidence
- [Outfit Font - Fontsource](https://fontsource.org/fonts/outfit/install) — `@fontsource-variable/outfit` import syntax, variable font weights 100-900 — HIGH confidence
- [tailwind-merge npm](https://www.npmjs.com/package/tailwind-merge) — v3.5.0 current, Tailwind v4 support — MEDIUM confidence
- [lucide-react npm](https://www.npmjs.com/package/lucide-react) — v0.577.0 current — MEDIUM confidence

**v1.0 base:**
- https://docs.wdk.tether.io/sdk/wallet-modules/wallet-evm — WDK EVM wallet API (HIGH confidence)
- https://github.com/openclaw/openclaw/releases/ — OpenClaw latest release 2026.3.13-1 (HIGH confidence)
- https://platform.claude.com/docs/en/about-claude/models/overview — Claude model IDs (HIGH confidence)
- https://github.com/Kaliiiiiiiiii-Vinyzu/patchright — Patchright stealth patches (MEDIUM confidence)

---
*Stack research for: Ducket AI Galactica — v1.0 fraud detection agent + v2.0 P2P resale UI rebrand*
*Researched: 2026-03-19 (v1.0), 2026-03-20 (v2.0 delta)*
