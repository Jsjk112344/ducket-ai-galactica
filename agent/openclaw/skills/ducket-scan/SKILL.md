---
name: ducket-scan
description: "Browse StubHub, Viagogo, and Facebook Marketplace using OpenClaw's browser control (real Chrome) to extract ticket listings — bypasses anti-bot tools that block headless scrapers"
metadata:
  openclaw:
    emoji: "\U0001F50D"
---

# Ducket Scan

## When to use
Run at the start of every pipeline cycle to gather fresh listings from all three marketplaces. Uses OpenClaw's browser control to navigate sites through real Chrome — anti-bot tools (Cloudflare, Akamai, DataDome) see a normal user session, not a headless bot.

## How it works
1. OpenClaw browser opens real Chrome (CDP on port 18800).
2. Navigates to each marketplace search page (StubHub, Viagogo, Facebook).
3. Waits for page load and extracts listing data from the DOM.
4. Returns listings in canonical JSON format for classification.

**Anti-bot advantage:** Real Chrome profile with cookies, no automation flags, real browser fingerprint. Sites that block Patchright/Playwright (Cloudflare Enterprise, Akamai Bot Manager) allow normal Chrome sessions through.

**Fallback chain:** OpenClaw browser → Patchright headless scraper → mock data. Demo always runs.

## Inputs
Environment variable `EVENT_NAME` (defaults to 'FIFA World Cup 2026'). No other inputs required.

## Workflow
1. Ensure OpenClaw browser is running (`openclaw browser start`).
2. Navigate to each platform's search page via `openclaw browser navigate`.
3. Wait for content load via `openclaw browser wait`.
4. Extract listing data via `openclaw browser evaluate` (DOM extraction).
5. Transform to canonical listing schema (price, seller, section, quantity, faceValue, priceDeltaPct).
6. Fall back to Patchright scraper if browser unavailable, mock data if scraper fails.

## Output
JSON array of listing objects. Each listing has: url, title, price, faceValue, source (`live-browse` | `live` | `mock` | `seed`), section, quantity, sellerRating, daysUntilEvent, eventName, priceDeltaPct, redFlags.

## Failure handling
- OpenClaw browser not running → falls back to Patchright headless scraper
- Patchright blocked → falls back to labeled mock data
- Individual platform failure → remaining sources still return results (Promise.allSettled)
- Exit 0 if at least one source returns data. Exit 1 only if all three fail.

## CLI
`node agent/src/openclaw-loop.js` (runs full pipeline: browse → classify → escrow)
