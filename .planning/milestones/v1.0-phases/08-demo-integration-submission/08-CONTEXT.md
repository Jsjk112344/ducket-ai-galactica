# Phase 8: Demo Integration + Submission - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Final integration: single `npm run demo` command starts the full agent + dashboard, demo loop runs 3 consecutive times without failure, README has complete setup instructions, all submission checklist items pass.

</domain>

<decisions>
## Implementation Decisions

### Demo Loop Configuration
- All 3 scrapers have always-available mock fallback — demo never fails. Live data preferred when available
- Single `npm run demo` script at root that starts agent scan loop + dashboard (Vite + Express)
- 3 consecutive demo runs to validate consistency (per success criteria)
- README setup: clone → npm install → cp .env.example .env → npm run demo

### Submission Checklist & Polish
- README includes: project overview, text architecture diagram, setup steps, demo video link placeholder, third-party disclosures, Apache 2.0 badge
- Third-party disclosures in README: Claude API (Anthropic), Patchright, WDK (Tether), ethers.js, node-cron, Vite, React, Tailwind
- .env.example has all env vars with placeholder values and explaining comments
- Demo video placeholder section in README with `[VIDEO LINK]`

### Claude's Discretion
- concurrently configuration for npm run demo
- Architecture diagram text format
- README markdown formatting
- Demo loop timing and output format

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `agent/src/scan-loop.js` — full Scan → Classify → Evidence → Escrow pipeline
- `dashboard/` — Vite + React + Tailwind dashboard with Express API
- `contracts/deployed.json` — contract addresses
- All 3 scrapers with mock fallback in agent/tools/

### Established Patterns
- npm workspaces monorepo
- concurrently for parallel processes (used in dashboard dev)
- Mock fallback pattern (source: "mock") on all scrapers

### Integration Points
- Root package.json needs `demo` script
- .env.example needs updating with all current env vars
- README.md needs complete rewrite for submission

</code_context>

<specifics>
## Specific Ideas

- Deadline: March 22, 2026 — 3 days remaining
- Video demo must be ≤ 5 minutes covering 4 segments: agent logic, wallet flow, payment lifecycle, live full loop
- `/hackathon-submit` and `/demo-ready` skills available for final checks
- Public GitHub repo required — no secrets committed

</specifics>

<deferred>
## Deferred Ideas

None — final phase

</deferred>
