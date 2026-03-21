---
name: ducket-escrow
description: "Dispatch conditional escrow action (release, refund, or slash) based on classification category via WDK wallet"
metadata:
  openclaw:
    emoji: "\U0001F512"
    requires:
      env:
        - WDK_MNEMONIC
---

# Ducket Escrow

## When to use
Run after classification to enforce the escrow outcome. Takes a classification category and dispatches the appropriate wallet action.

## Inputs
Classification result with category (LEGITIMATE, SCALPING_VIOLATION, COUNTERFEIT_SUSPECT, PRICE_GOUGING), listing object, and optional caseFilePath.

## Workflow
1. Parse classification and listing input.
2. Call dispatchEscrowAction() with category, listing, caseFilePath, and timestamp.
3. Log the escrow outcome (release/refund/slash/skip).
4. Print result or skip reason to stdout.

## Output
JSON result with etherscanLink if action taken, or null if skipped (insufficient balance). Skipped is not an error.

## Failure handling
Insufficient balance returns null and exits 0 (expected in demo). Network errors exit 1.

## CLI
`node agent/scripts/cli-escrow.js`
