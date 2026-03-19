---
name: wdk-check
description: Verify WDK wallet integration is correct, secure, and non-custodial. Check transaction handling, error cases, and compliance with hackathon WDK requirements.
user_invocable: true
---

# WDK Integration Verification

WDK is MANDATORY — no WDK = disqualified. This skill verifies the integration is correct and robust.

## Steps

1. **Find all WDK usage** — search for WDK imports, wallet creation, transaction calls across the codebase

2. **Verify Core Requirements:**
   - [ ] Non-custodial wallet implementation (keys never leave client)
   - [ ] All wallet operations use WDK (not a simpler library routed around it)
   - [ ] JavaScript/TypeScript only for wallet ops
   - [ ] Transaction signing is secure
   - [ ] Error handling for failed transactions
   - [ ] Escrow wallet creation per event/transaction

3. **Check Transaction Flows:**
   - [ ] USDT deposit flow works
   - [ ] Conditional release (clean event → release funds)
   - [ ] Conditional refund (fraud detected → refund)
   - [ ] Transaction state tracking
   - [ ] Timeout/fallback handling

4. **Security Review:**
   - [ ] No private keys in code/logs
   - [ ] No hardcoded wallet addresses for production
   - [ ] Proper error messages (no key material leaked)

5. **Output:** Summary of WDK integration health with specific fixes needed
