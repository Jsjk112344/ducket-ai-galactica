---
name: demo-ready
description: Check if all 4 required demo segments are working and can be shown in under 5 minutes. Use before recording the demo video or when checking demo readiness.
user_invocable: true
---

# Demo Readiness Check

The 5-minute video demo MUST cover these 4 segments. Verify each is functional and demo-able.

## Steps

1. **Read CLAUDE.md** for project context

2. **Check each required demo segment:**

   ### Segment 1: Agent Logic Explanation
   - Is there a clear autonomous decision loop? (scan → classify → act)
   - Are agent decisions logged with reasoning?
   - Can you show the agent making a decision without human intervention?
   - Estimated demo time for this segment: ___

   ### Segment 2: Wallet Flow Walkthrough
   - Is WDK properly integrated?
   - Can you show wallet creation, funding, and transaction signing?
   - Is the non-custodial nature demonstrable?
   - Estimated demo time: ___

   ### Segment 3: Payment Lifecycle End-to-End
   - Can you show: deposit → condition evaluated → settlement (release or refund)?
   - Is the escrow flow fully automated by the agent?
   - Estimated demo time: ___

   ### Segment 4: Live Demo of Full Loop
   - Can you run the entire flow live? (event input → fraud detection → escrow action)
   - Are there any flaky dependencies that could fail during demo?
   - Estimated demo time: ___

3. **Total time estimate** — must be ≤ 5 minutes. If over, suggest what to cut.

4. **Risk assessment** — what could go wrong during live demo? Suggest fallbacks.

5. **Generate a demo script** — bullet-point narration for each segment with timing.
