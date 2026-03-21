---
name: ducket-scan
description: "Scrape StubHub, Viagogo, and Facebook Marketplace for FIFA World Cup 2026 ticket listings and return combined results"
metadata:
  openclaw:
    emoji: "\U0001F50D"
---

# Ducket Scan

## When to use
Run at the start of every pipeline cycle to gather fresh listings from all three marketplaces.

## Inputs
Environment variable `EVENT_NAME` (defaults to 'FIFA World Cup 2026'). No other inputs required.

## Workflow
1. Call all three scrapers in parallel (StubHub, Viagogo, Facebook).
2. Collect results via Promise.allSettled.
3. Flatten into a single listings array.
4. Log count per source to stdout.
5. Return combined listings as JSON.

## Output
JSON array of listing objects printed to stdout. Each listing has: url, title, price, faceValue, source, section, quantity, sellerRating, daysUntilEvent, eventName.

## Failure handling
Individual scraper failures are caught and logged — remaining sources still return results. Exit 0 if at least one source returns data. Exit 1 only if all three fail.

## CLI
`node agent/scripts/cli-scan.js`
