---
phase: 08-demo-integration-submission
plan: "01"
subsystem: demo-submission
tags: [readme, demo-script, env-config, hackathon-submission]
dependency_graph:
  requires: [07-03]
  provides: [DEMO-01, DEMO-02, DEMO-03, DEMO-04]
  affects: [package.json, README.md, .env.example]
tech_stack:
  added: [concurrently@^9.2.1 (root devDependency)]
  patterns: [npm workspaces concurrently launch, judge-friendly README structure]
key_files:
  modified:
    - package.json
    - README.md
    - .env.example
decisions:
  - "concurrently ^9.2.1 added to root devDependencies — same version dashboard already uses, prevents version mismatch"
  - "npm run demo launches node agent/src/scan-loop.js directly (not tsx) — production path, no transpile overhead"
  - "README demo video section uses placeholder text — to be replaced with real link before submission"
  - "Third-party disclosures table covers 9 services including all mandatory hackathon disclosure requirements"
metrics:
  duration: "5 minutes"
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_modified: 3
---

# Phase 08 Plan 01: Demo Script, README, and Env Config Summary

Single `npm run demo` command launches agent scan-loop + React dashboard concurrently; README fully rewritten for hackathon submission with architecture diagram, disclosures, and video placeholder; .env.example complete with all 12 vars and inline comments.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add demo script to root package.json and update .env.example | 9b98be3 | package.json, .env.example |
| 2 | Rewrite README.md for hackathon submission | d8afe7e | README.md |

## What Was Built

### Task 1: Demo Script + .env.example

**package.json** — Added `"demo"` script using `concurrently`:
```
concurrently --names agent,dashboard --prefix-colors blue,green "node agent/src/scan-loop.js" "npm run dev --workspace=dashboard"
```
Also added `concurrently@^9.2.1` to root `devDependencies` so the script works from root without relying on workspace hoisting.

**.env.example** — Updated with all 12 required env vars and inline explaining comments:
- `CLAUDE_API_KEY`, `CLAUDE_MODEL` (Anthropic)
- `ESCROW_WALLET_SEED`, `WDK_API_KEY` (WDK Wallet)
- `SEPOLIA_RPC_URL`, `SEPOLIA_USDT_CONTRACT`, `SEPOLIA_DEPLOYER_PRIVATE_KEY` (Sepolia Network)
- `BOUNTY_POOL_ADDRESS` (Escrow Contract — new)
- `SCAN_INTERVAL_MINUTES`, `FRAUD_CONFIDENCE_THRESHOLD`, `EVENT_NAME` (Agent Config — EVENT_NAME new)
- `STUBHUB_TIMEOUT` (Scraper Config — new)

### Task 2: README Rewrite

Full rewrite for hackathon submission with:
- Apache 2.0 badge
- One-liner project description
- Text architecture diagram (StubHub/Viagogo/Facebook scrapers -> Scan Loop -> Classification -> Escrow Engine -> FraudEscrow.sol + React Dashboard)
- Quick Start: clone, npm install, cp .env.example .env, npm run demo
- How It Works: 4 demo segments (Agent Intelligence, Wallet Flow, Payment Lifecycle, Live Full Loop)
- Project Structure table
- Demo Video placeholder
- Third-Party Disclosures table (9 services: Claude API, WDK, Patchright, ethers.js, node-cron, Vite, React, Tailwind CSS, Sepolia Testnet)
- Environment Variables pointer to .env.example
- Apache 2.0 license link

## Verification Results

- `npm run demo` script exists and references concurrently: PASSED
- `.env.example` has all 12 env vars with comments: PASSED
- `grep -c "npm run demo" README.md` = 2: PASSED
- All README acceptance criteria (architecture, quick start, how it works, demo video, disclosures, project structure): PASSED

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All files verified present and commits confirmed.
