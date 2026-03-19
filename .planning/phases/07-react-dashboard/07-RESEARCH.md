# Phase 7: React Dashboard - Research

**Researched:** 2026-03-19
**Domain:** React + Vite + Tailwind CSS v4 + Express API (file-based data layer)
**Confidence:** HIGH

## Summary

Phase 7 builds the live monitoring dashboard as a new `dashboard/` npm workspace. The workspace shell already exists (dashboard/package.json, dashboard/src/index.tsx, dashboard/tsconfig.json) but contains only stubs — all implementation is Phase 7 work. The data layer pattern is already established: the agent writes LISTINGS.md and agent/cases/*.md; the dashboard reads those files via a local Express API server and polls every 10 seconds.

The standard stack for this phase is Vite 8 + React 19 + Tailwind CSS v4 + Express 5. Tailwind v4 changed significantly from v3 — it no longer uses a `tailwind.config.js` file or `@tailwind` directives; instead the `@tailwindcss/vite` plugin and a single `@import "tailwindcss"` in CSS handle everything. Custom design tokens (brand colors, fonts) are defined with CSS custom properties inside `@theme {}` blocks. This is a major pitfall: v3 knowledge produces broken configurations in a v4 project.

The wallet inspector is visually straightforward but technically requires live Sepolia RPC calls via ethers.js — the Express server must proxy these to avoid CORS issues and to keep the RPC URL server-side. Everything runs via a single `npm run dev` in dashboard/ that starts both Vite (port 5173) and Express (port 3001) concurrently.

**Primary recommendation:** Use Vite 8 + React 19 + Tailwind v4 (@tailwindcss/vite) + Express 5 + concurrently. Parse LISTINGS.md with regex-extracted JSON blocks. Poll at 10s intervals with plain useEffect + setInterval. No WebSocket, no state management library.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single page with tabbed sections — listings, escrow status, wallet inspector all visible without navigation
- Express API server reads agent files (LISTINGS.md, agent/cases/*.md, deployed.json) and serves JSON endpoints
- Vite + React + Tailwind setup in `dashboard/` workspace — own package.json, separate from agent
- Auto-refresh every 10 seconds via polling
- Listings table columns: Platform, Seller, Price, Face Value, Delta%, Classification, Confidence, Status
- Badge colors: SCALPING_VIOLATION=red, LIKELY_SCAM=orange, COUNTERFEIT_RISK=yellow, LEGITIMATE=green
- Expandable row shows Agent Decision panel: reasoning text, confidence bar, red flags, enforcement action, Etherscan link
- 10-second auto-refresh interval
- Wallet inspector shows: address, USDT balance, escrow balance, "client-side only (WDK non-custodial)" badge with visual indicator
- Dark theme: `#0A0E17` background, `#1A1F2E` cards, `#6366F1` indigo accent, `#10B981` green, white text
- Inter font for UI, monospace for addresses/hashes
- Desktop-first with minimum viable mobile support

### Claude's Discretion
- Component file organization within dashboard/src/
- React state management approach (useState/useEffect vs context)
- Tailwind configuration details
- Express API route structure
- Animation and transition details

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | React dashboard displays live table of scanned listings with classification badges | LISTINGS.md format documented; badge color map specified; polling pattern via useEffect+setInterval |
| DASH-02 | Dashboard shows USDT escrow status and wallet balance per event | Express API proxies ethers.js balance queries to Sepolia; deployed.json provides contract addresses |
| DASH-03 | Dashboard includes wallet inspector showing key storage location (non-custodial proof) | Static badge "client-side only (WDK non-custodial)" + live address/balance from Express API |
| DASH-04 | Dashboard is styled consistently with Ducket brand | Tailwind v4 @theme{} blocks for brand colors; Inter font via CSS import |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite | 8.0.1 | Dev server + bundler | Official React + Tailwind v4 toolchain |
| react | 19.2.4 | UI framework | Locked decision |
| react-dom | 19.2.4 | DOM renderer | Paired with react |
| @vitejs/plugin-react | 6.0.1 | React JSX + Fast Refresh | Official Vite React plugin |
| tailwindcss | 4.2.2 | Utility CSS | Locked decision |
| @tailwindcss/vite | 4.2.2 | Tailwind v4 Vite integration | Replaces PostCSS config in v4 |
| express | 5.2.1 | API server (file reader + RPC proxy) | Locked decision |
| concurrently | 9.2.1 | Run Vite + Express in one command | Single `npm run dev` for demo |
| ethers | 6.16.0 | Sepolia balance queries | Already in monorepo; reuse same version |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/react | 19.2.14 | TypeScript types | Always — project uses TS |
| @types/react-dom | 19.2.3 | TypeScript types | Always |
| @types/express | ^5.0.0 | TypeScript types for Express | Express API server |
| @types/node | 25.5.0 | Node typings for server code | Express API file |
| typescript | ^5.9.3 | Already in root devDeps | Inherit from root workspace |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| concurrently | npm-run-all, custom shell | concurrently works cross-platform and is battle-tested |
| ethers in Express | viem | ethers v6 already in agent — use same version, zero new dependency |
| polling | WebSocket/SSE | REQUIREMENTS.md explicitly rules out WebSocket — polling every 10s indistinguishable in 5-min demo |
| useState/useEffect | React Query, SWR | No server caching needed; minimal data; simpler for demo codebase |

**Installation:**
```bash
npm install react react-dom express concurrently --workspace=dashboard
npm install -D vite @vitejs/plugin-react tailwindcss @tailwindcss/vite @types/react @types/react-dom @types/express typescript --workspace=dashboard
```

**Version verification:** Versions above confirmed against npm registry on 2026-03-19. All are current stable.

---

## Architecture Patterns

### Recommended Project Structure
```
dashboard/
├── package.json          # workspace package (Vite + Express + React deps)
├── tsconfig.json         # already exists — jsx: react-jsx
├── vite.config.ts        # Vite + @tailwindcss/vite + proxy to Express
├── index.html            # Vite entry HTML
├── server/
│   └── api.ts            # Express server: /api/listings, /api/wallet, /api/cases/:id
└── src/
    ├── main.tsx          # React entry point (ReactDOM.createRoot)
    ├── index.css         # @import "tailwindcss" + @theme{} brand tokens + Inter font
    ├── App.tsx           # Root: tab state + polling hooks
    ├── components/
    │   ├── ListingsTable.tsx    # Table with expandable rows + classification badges
    │   ├── Badge.tsx            # Reusable badge (SCALPING_VIOLATION → red, etc.)
    │   ├── AgentDecisionPanel.tsx  # Expandable row detail: reasoning, confidence bar, Etherscan
    │   ├── EscrowStatus.tsx     # Per-event USDT balance + escrow actions list
    │   └── WalletInspector.tsx  # Address, balance, "client-side only (WDK non-custodial)" badge
    └── hooks/
        ├── useListings.ts   # polls /api/listings every 10s
        └── useWallet.ts     # polls /api/wallet every 10s
```

### Pattern 1: Tailwind v4 Configuration (NO tailwind.config.js)
**What:** Tailwind v4 uses `@theme {}` CSS blocks — no JS config file needed.
**When to use:** Always for this project.
**Example:**
```css
/* Source: https://tailwindcss.com/docs/installation/using-vite */
@import "tailwindcss";

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@theme {
  --color-bg-primary: #0A0E17;
  --color-bg-card: #1A1F2E;
  --color-accent: #6366F1;
  --color-success: #10B981;
  --font-family-sans: 'Inter', ui-sans-serif, system-ui;
  --font-family-mono: ui-monospace, 'Courier New', monospace;
}
```

### Pattern 2: Vite Config with Tailwind v4 + Express Proxy
**What:** Single vite.config.ts wires the Tailwind plugin and proxies /api/* to Express on port 3001.
**When to use:** Avoids CORS between Vite (5173) and Express (3001) during dev.
**Example:**
```typescript
// Source: https://tailwindcss.com/docs/installation/using-vite
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

### Pattern 3: Express API — Parse LISTINGS.md
**What:** LISTINGS.md contains multiple fenced JSON blocks (one per scan cycle). The API reads the file, extracts all ```json ... ``` blocks, parses them, and flattens the arrays.
**When to use:** `GET /api/listings` endpoint.
**Example:**
```typescript
// dashboard/server/api.ts
import express from 'express';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ethers } from 'ethers';

const LISTINGS_PATH = join(__dirname, '../../agent/memory/LISTINGS.md');
const CASES_DIR = join(__dirname, '../../agent/cases');
const DEPLOYED_PATH = join(__dirname, '../../contracts/deployed.json');

app.get('/api/listings', async (req, res) => {
  try {
    const md = await readFile(LISTINGS_PATH, 'utf8');
    // Extract all fenced JSON blocks
    const blocks = [...md.matchAll(/```json\n([\s\S]*?)\n```/g)];
    const all = blocks.flatMap(m => JSON.parse(m[1]));
    res.json(all);
  } catch {
    res.json([]);
  }
});
```

### Pattern 4: Case File Lookup (Agent Decision Panel)
**What:** Case files in agent/cases/ are named `{ts}-{platform}-{urlHash}.md`. To look up the case for a listing, hash the URL with SHA-256 (16-char slice) and find the matching file.
**When to use:** When user expands a row to show the Agent Decision panel.
**Example:**
```typescript
import { createHash } from 'node:crypto';

function urlHash(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16);
}

app.get('/api/cases/:urlHash', async (req, res) => {
  const files = await readdir(CASES_DIR).catch(() => []);
  const file = files.find(f => f.includes(req.params.urlHash));
  if (!file) return res.status(404).json({ error: 'not found' });
  const content = await readFile(join(CASES_DIR, file), 'utf8');
  res.json({ filename: file, content });
});
```

### Pattern 5: Polling Hook
**What:** Simple useEffect + setInterval polling. No dependencies beyond React.
**When to use:** `useListings` and `useWallet` hooks.
**Example:**
```typescript
// dashboard/src/hooks/useListings.ts
import { useState, useEffect } from 'react';

export function useListings() {
  const [listings, setListings] = useState([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetch() {
    const res = await window.fetch('/api/listings');
    if (res.ok) {
      setListings(await res.json());
      setLastUpdated(new Date());
    }
  }

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, 10_000);
    return () => clearInterval(id);
  }, []);

  return { listings, lastUpdated };
}
```

### Pattern 6: concurrently dev script
**What:** One `npm run dev` starts both Vite (UI) and Express (API).
**When to use:** dashboard/package.json scripts.
**Example:**
```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"tsx server/api.ts\"",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Pattern 7: Wallet Inspector (Sepolia balance via Express)
**What:** Express server reads deployed.json to get WDK wallet address (from .env ESCROW_WALLET env var or deployed.json deployer), then queries Sepolia RPC for USDT balance and ETH balance.
**When to use:** `GET /api/wallet` endpoint.
**Example:**
```typescript
app.get('/api/wallet', async (req, res) => {
  const deployed = JSON.parse(await readFile(DEPLOYED_PATH, 'utf8'));
  const { FraudEscrow, usdt, deployer } = deployed.sepolia;
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const usdtAbi = ['function balanceOf(address) view returns (uint256)'];
  const usdtContract = new ethers.Contract(usdt, usdtAbi, provider);
  const [ethBal, usdtBal] = await Promise.all([
    provider.getBalance(deployer),
    usdtContract.balanceOf(deployer),
  ]);
  res.json({
    address: deployer,
    ethBalance: ethers.formatEther(ethBal),
    usdtBalance: ethers.formatUnits(usdtBal, 6),
    escrowContract: FraudEscrow,
    custodyType: 'client-side only (WDK non-custodial)',
    network: 'Sepolia',
  });
});
```

### Anti-Patterns to Avoid
- **tailwind.config.js with v4:** Tailwind v4 does not read tailwind.config.js — creates silent no-op. Use @theme{} CSS blocks.
- **@tailwind base/components/utilities directives:** These are v3 syntax. In v4 use `@import "tailwindcss"` only.
- **fetch('/api/...) on Vite port without proxy:** CORS error. Configure vite.config.ts proxy or use Express to serve built assets.
- **Parsing LISTINGS.md with line-by-line split:** The file contains multi-line JSON arrays inside fenced blocks — use regex to extract the JSON blocks, not line-level parsing.
- **Loading case files client-side:** Case file paths contain timestamps and hashes — look them up server-side by URL hash, not by constructing paths in the browser.
- **ESM `__dirname` in Express server:** Express server runs as CommonJS via tsx by default unless `"type": "module"` is set. Either use `import.meta.url` + fileURLToPath, or keep server as CJS and avoid `__dirname` conflicts.
- **Importing ethers in the browser bundle for balance checks:** Keep all ethers/RPC calls in the Express server — never expose the RPC URL or private key to the browser.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tailwind custom colors | CSS vars in plain classes | @theme{} in index.css | v4 native token system; auto-generates utility classes |
| Run two servers | Shell script with & | concurrently | Cross-platform; proper kill on Ctrl+C |
| Sepolia JSON-RPC calls from browser | fetch(SEPOLIA_RPC_URL) in React | Express proxy endpoint | Keeps RPC URL server-side; no CORS |
| Markdown table parsing from case files | Custom regex table parser | Parse key fields from known Markdown structure | Case files have predictable structure; only need classification + confidence + etherscan |
| HTTP polling infrastructure | EventSource / WebSocket | useEffect + setInterval | REQUIREMENTS.md rules out WebSocket; polling is sufficient |

**Key insight:** The data pipeline (agent writes files) is already built and working. The dashboard's only job is to read and display — do not modify the data format to accommodate the dashboard.

---

## Common Pitfalls

### Pitfall 1: Tailwind v4 vs v3 Configuration
**What goes wrong:** `tailwind.config.js` is created with `theme.extend.colors`, Tailwind v4 ignores it entirely, custom colors don't appear. Developer assumes Tailwind is broken.
**Why it happens:** Tailwind v4 broke backwards compatibility with v3 config files.
**How to avoid:** Use `@theme {}` inside index.css. Define `--color-accent: #6366F1` etc. as CSS custom properties. Tailwind v4 auto-generates `text-accent`, `bg-accent`, etc. from `--color-*` theme tokens.
**Warning signs:** Custom color classes render but don't apply the right color; `tailwind.config.js` exists in the repo alongside `@tailwindcss/vite`.

### Pitfall 2: LISTINGS.md Parse Failure on Empty File
**What goes wrong:** On fresh agent start, LISTINGS.md is written with only the header (no scan blocks yet). Regex finds no JSON blocks, API returns empty array — this is correct but UI should display "Waiting for scan cycle..." rather than a broken empty state.
**Why it happens:** scan-loop.js uses `writeFile` on startup (resets file), then `appendFile` per cycle. Dashboard may poll between the reset and first scan cycle.
**How to avoid:** Handle empty array in the React component with a loading/empty state message. Never treat empty as an error.
**Warning signs:** Dashboard shows blank white area or JS error on first load.

### Pitfall 3: ESM vs CommonJS in Express Server
**What goes wrong:** Express server in `dashboard/server/api.ts` uses `__dirname` (CJS) while the dashboard package.json has `"type": "module"` — `__dirname` is undefined in ESM.
**Why it happens:** The agent workspace uses `"type": "module"` — if dashboard inherits this or sets it, Express server needs ESM-compatible path resolution.
**How to avoid:** Use `import.meta.url` + `fileURLToPath` for path resolution in the Express server, or explicitly NOT set `"type": "module"` in dashboard/package.json (tsx can handle TS files without it).
**Warning signs:** `ReferenceError: __dirname is not defined` on server start.

### Pitfall 4: Case File Not Found (Row Expand)
**What goes wrong:** User clicks a listing row, dashboard calls `/api/cases/{urlHash}`, but agent/cases/ is empty (agent not running or no fraudulent listings yet).
**Why it happens:** Case files only exist for listings that passed the enforcement gate (confidence >= 85% AND non-LEGITIMATE). Many listings in demo are logged_only.
**How to avoid:** Express returns 404 cleanly; React component shows "No detailed case file available — listing was logged only" rather than spinning/erroring.
**Warning signs:** Network tab shows 404 on case file requests; React crashes with unhandled error.

### Pitfall 5: Wallet Balance RPC Timeout
**What goes wrong:** `/api/wallet` call to Sepolia RPC hangs or times out during demo, blocking the entire dashboard load.
**Why it happens:** Sepolia RPC (Alchemy/Infura) can be slow or rate-limited.
**How to avoid:** Add a 5-second timeout to the ethers provider call; return cached last-known value on timeout; show a "balance unavailable" fallback in UI rather than blocking.
**Warning signs:** Dashboard stalls on the Wallet Inspector tab; no other data loads while RPC is pending.

### Pitfall 6: Vite Dev Server CORS on /api routes
**What goes wrong:** React app on port 5173 calls `/api/listings` which goes to port 3001 — browser blocks with CORS error in development.
**Why it happens:** Different ports = different origins.
**How to avoid:** Configure `server.proxy` in `vite.config.ts` — `/api` proxied to `http://localhost:3001`. In production build, serve Vite static files from Express at same origin.
**Warning signs:** CORS errors in browser console on /api fetch calls.

---

## Code Examples

Verified patterns from official sources:

### Tailwind v4 @theme{} with brand colors
```css
/* Source: https://tailwindcss.com/docs/installation/using-vite */
@import "tailwindcss";

@theme {
  --color-bg-primary: #0A0E17;
  --color-bg-card: #1A1F2E;
  --color-accent: #6366F1;
  --color-success: #10B981;
  --color-warn-red: #EF4444;
  --color-warn-orange: #F97316;
  --color-warn-yellow: #EAB308;
}
```

### Classification badge color map
```typescript
// dashboard/src/components/Badge.tsx
const BADGE_STYLES: Record<string, string> = {
  SCALPING_VIOLATION: 'bg-warn-red text-white',
  LIKELY_SCAM: 'bg-warn-orange text-white',
  COUNTERFEIT_RISK: 'bg-warn-yellow text-black',
  LEGITIMATE: 'bg-success text-white',
};

export function Badge({ category }: { category: string }) {
  const style = BADGE_STYLES[category] ?? 'bg-gray-500 text-white';
  return <span className={`px-2 py-1 rounded text-xs font-medium ${style}`}>{category}</span>;
}
```

### Listing type derived from LISTINGS.md data
```typescript
// dashboard/src/types.ts
export interface Listing {
  platform: string;
  seller: string;
  price: number;
  faceValue: number;
  priceDeltaPct: number;
  url: string;
  listingDate: string;
  redFlags: string[];
  eventName: string;
  section: string | null;
  quantity: number;
  source: 'mock' | 'live';
  // Populated by API from case file if it exists
  classification?: {
    category: string;
    confidence: number;
    reasoning: string;
    classificationSource: string;
    actionTaken?: string;
    etherscanLink?: string;
  };
}
```

### Confidence bar component
```tsx
// dashboard/src/components/ConfidenceBar.tsx
export function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 85 ? 'bg-warn-red' : value >= 60 ? 'bg-warn-orange' : 'bg-success';
  return (
    <div className="w-full bg-bg-card rounded h-2">
      <div className={`${color} h-2 rounded`} style={{ width: `${value}%` }} />
    </div>
  );
}
```

### Monospace wallet address display
```tsx
// WalletInspector.tsx excerpt
<span className="font-mono text-sm text-gray-300 break-all">{address}</span>
<span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full ml-2">
  client-side only (WDK non-custodial)
</span>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` with `theme.extend` | `@theme {}` CSS blocks | Tailwind v4 (2025) | No JS config file needed; zero config for standard usage |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` | Tailwind v4 (2025) | Single import replaces three directives |
| PostCSS plugin (`tailwindcss: {}` in postcss.config) | `@tailwindcss/vite` Vite plugin | Tailwind v4 (2025) | Faster builds; no PostCSS config needed |
| React 18 `ReactDOM.render` | `ReactDOM.createRoot` | React 18 (2022) | createRoot is the only API in React 19 |
| `@vitejs/plugin-react-swc` | `@vitejs/plugin-react` (Babel) | Current | plugin-react is sufficient; swc variant for perf-sensitive |

**Deprecated/outdated:**
- `tailwind.config.js`: Not read by Tailwind v4 — produces silent no-op
- `@tailwind base`: v3 directive syntax — causes CSS parse error or is ignored in v4
- PostCSS-only Tailwind config: Superseded by `@tailwindcss/vite`

---

## Open Questions

1. **WDK wallet address for balance display**
   - What we know: `deployed.json` contains the deployer address (0x5340D3787d58...) which is the ethers.Wallet key, not the WDK wallet. WDK wallet address depends on ESCROW_WALLET_SEED derivation.
   - What's unclear: The WDK wallet address is not persisted to any file currently — it's derived at runtime by agent/src/wallet/index.ts.
   - Recommendation: Express API should call the WDK wallet module to get the address, or read it from a wallet-address.txt file the agent writes on startup. Simpler approach: add a `GET /api/wallet` that derives the WDK wallet address from ESCROW_WALLET_SEED at server start (Express server can import agent/src/wallet/index.js since it's in the same monorepo).

2. **Escrow balance per event from contract**
   - What we know: FraudEscrow.sol has per-escrowId tracking, not a single event balance. The escrowBalance view requires the escrowId bytes32.
   - What's unclear: There is no mapping of eventName → list of escrowIds in the contract or in any file currently.
   - Recommendation: Show "total USDT locked" by counting escrow_deposit actions in case files (parse "Action Taken | escrow_deposit (confirmed)" lines from agent/cases/*.md). This is a file-based approximation but sufficient for demo.

3. **Demo-time case file availability**
   - What we know: Listings are mostly from mock data. Classification runs in scan-loop.js. Case files exist in agent/cases/ only after the agent has run.
   - What's unclear: If the agent is not running when the dashboard is demoed, agent/cases/ may be empty.
   - Recommendation: Dashboard must gracefully handle empty case files. Document in Phase 8 demo script that agent must run first.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None in dashboard workspace — no test runner configured yet |
| Config file | None — Wave 0 gap |
| Quick run command | N/A — smoke test via browser |
| Full suite command | N/A |

The agent workspace has no test runner either (no jest/vitest config, no test scripts). The only tests in the repo are Hardhat/Mocha tests in contracts/. For the dashboard, automated unit tests are low-value given the 3-day hackathon timeline — the dashboard is a display layer with no business logic. Validation will be visual/smoke-test only.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | Listings table renders with badges | manual-smoke | open browser, verify table populated within 10s | N/A |
| DASH-02 | Escrow/wallet balance shown | manual-smoke | verify wallet inspector shows address + balance | N/A |
| DASH-03 | Non-custodial badge visible | manual-smoke | verify "client-side only (WDK non-custodial)" badge present | N/A |
| DASH-04 | Brand colors applied | manual-smoke | verify dark theme, indigo accent, Inter font | N/A |

DASH-01 through DASH-04 are all UI/visual requirements with no algorithmic logic to unit test. Manual smoke testing is the appropriate validation method.

### Sampling Rate
- **Per task commit:** Run `npm run dev --workspace=dashboard` and verify in browser
- **Per wave merge:** Full visual smoke test — all four success criteria checked manually
- **Phase gate:** All 5 success criteria TRUE before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `dashboard/index.html` — Vite entry HTML (does not exist)
- [ ] `dashboard/vite.config.ts` — Vite + Tailwind v4 + proxy config (does not exist)
- [ ] `dashboard/src/index.css` — Tailwind @import + @theme{} (does not exist)
- [ ] `dashboard/src/main.tsx` — ReactDOM.createRoot entry (placeholder only)
- [ ] `dashboard/server/api.ts` — Express API server (does not exist)
- [ ] Framework install: `npm install react react-dom express concurrently vite @vitejs/plugin-react tailwindcss @tailwindcss/vite ... --workspace=dashboard`

---

## Sources

### Primary (HIGH confidence)
- `https://tailwindcss.com/docs/installation/using-vite` — Tailwind v4 + Vite setup, @theme{} syntax, @import directive (fetched 2026-03-19)
- npm registry — vite@8.0.1, react@19.2.4, tailwindcss@4.2.2, @tailwindcss/vite@4.2.2, express@5.2.1, concurrently@9.2.1 (verified 2026-03-19)
- Agent source files — LISTINGS.md format, case file structure, deployed.json shape, scan-loop.js data flow (read directly 2026-03-19)
- `dashboard/package.json`, `dashboard/tsconfig.json` — existing workspace shell confirming jsx:react-jsx and workspace name @ducket/dashboard

### Secondary (MEDIUM confidence)
- Vite proxy configuration — standard Vite docs pattern (server.proxy); widely documented
- ethers v6 `ethers.formatUnits(balance, 6)` for USDT — already used in agent/src/escrow.js; same pattern

### Tertiary (LOW confidence)
- WDK wallet address derivation from Express server — no official docs found; recommendation is based on ESM import pattern from existing agent/src/wallet/index.ts

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry 2026-03-19
- Tailwind v4 configuration: HIGH — verified against official Tailwind docs (fetched live)
- Architecture: HIGH — based on existing agent file format and locked CONTEXT.md decisions
- Pitfalls: HIGH — derived from actual file structure, known v3→v4 breaking changes, and existing code patterns
- WDK address in Express: LOW — no official pattern found; practical recommendation only

**Research date:** 2026-03-19
**Valid until:** 2026-04-18 (stable stack; Tailwind v4 is newly released, check for patch updates)
