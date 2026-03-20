# Phase 7: React Dashboard - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

React dashboard displaying live agent state — listings table with classification badges, expandable Agent Decision panels, escrow status, wallet inspector with WDK non-custodial indicator — all auto-refreshing via Express API polling agent-written files.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout & Components
- Single page with tabbed sections — listings, escrow status, wallet inspector all visible without navigation
- Express API server reads agent files (LISTINGS.md, agent/cases/*.md, deployed.json) and serves JSON endpoints
- Vite + React + Tailwind setup in `dashboard/` workspace — own package.json, separate from agent
- Auto-refresh every 10 seconds via polling

### Data Display & Classification Badges
- Listings table columns: Platform, Seller, Price, Face Value, Delta%, Classification, Confidence, Status
- Badge colors: SCALPING_VIOLATION=red, LIKELY_SCAM=orange, COUNTERFEIT_RISK=yellow, LEGITIMATE=green
- Expandable row shows Agent Decision panel: reasoning text, confidence bar, red flags, enforcement action, Etherscan link
- 10-second auto-refresh interval

### Wallet Inspector & Styling
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

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `agent/memory/LISTINGS.md` — merged listing data with JSON blocks
- `agent/cases/*.md` — case files with classification, reasoning, enforcement, Etherscan links
- `contracts/deployed.json` — contract addresses for wallet inspector
- `agent/src/scan-loop.js` — agent process that writes files consumed by dashboard
- `.env` — SEPOLIA_RPC_URL, contract addresses

### Established Patterns
- npm workspaces monorepo — dashboard/ will be a new workspace
- ESM modules throughout
- Agent writes files → consumers read files (established pattern)

### Integration Points
- Express API reads agent/memory/LISTINGS.md and agent/cases/ directory
- Dashboard polls Express API endpoints every 10 seconds
- Wallet inspector reads deployed.json + queries Sepolia for live balances
- `npm run dev` in dashboard/ starts both Vite + Express

</code_context>

<specifics>
## Specific Ideas

- Judging criteria #7 is Presentation & Demo — dashboard is the visual proof of all agent work
- "client-side only (WDK non-custodial)" badge is specifically required by success criteria
- Ducket brand styling should match ducket-web sibling repo feel
- Classification badge colors are specified in success criteria
- 30-second update requirement from success criteria (we chose 10s, exceeds requirement)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
