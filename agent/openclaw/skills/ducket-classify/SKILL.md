---
name: ducket-classify
description: "Classify a ticket listing into LEGITIMATE, SCALPING_VIOLATION, COUNTERFEIT_SUSPECT, or PRICE_GOUGING with confidence and reasoning"
metadata:
  openclaw:
    emoji: "\U0001F9E0"
    requires:
      env:
        - ANTHROPIC_API_KEY
---

# Ducket Classify

## When to use
Run after scanning to classify each listing. Requires ANTHROPIC_API_KEY for AI-powered classification (falls back to rule-based if unavailable).

## Inputs
A single listing object as JSON (from stdin or hardcoded demo). Must have: url, title, price, faceValue, source, section, quantity, sellerRating, daysUntilEvent.

## Workflow
1. Parse listing input.
2. Call classifyListing() which attempts AI classification first, then falls back to rule-based.
3. Print classification result as JSON to stdout.

## Output
JSON object with: category (string), confidence (0-1), reasoning (string), classificationSource ('ai'|'rules'), signals (object with risk factors).

## Failure handling
If AI classification fails, rule-based fallback runs automatically. Exit 0 on success. Exit 1 only on unrecoverable error.

## CLI
`node agent/scripts/cli-classify.js`
