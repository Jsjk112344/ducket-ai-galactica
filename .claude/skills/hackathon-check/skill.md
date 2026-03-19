---
name: hackathon-check
description: Audit current codebase against all 7 hackathon judging criteria and 6 hard rules. Use when you want to check hackathon readiness, compliance, or before major decisions.
user_invocable: true
---

# Hackathon Compliance & Readiness Check

Audit the current project against ALL hackathon requirements. For each item, report PASS/FAIL/PARTIAL with specific evidence.

## Steps

1. **Read CLAUDE.md** to load decision rules and priorities

2. **Check Hard Rules:**
   - [ ] WDK integration present (search for WDK imports/usage in codebase)
   - [ ] Apache 2.0 LICENSE file exists
   - [ ] Can run out of the box (check package.json scripts, README setup instructions)
   - [ ] Third-party services disclosed (check for external API calls, document them)
   - [ ] Repo is public-ready (no secrets, no .env with real values committed)

3. **Score Judging Criteria (1-10 each):**
   - **Agent Intelligence:** Is there an autonomous decision loop? Are decisions logged/traceable?
   - **WDK Wallet Integration:** Is WDK handling all wallet ops? Transaction handling robust?
   - **Technical Execution:** Code quality, architecture, error handling?
   - **Agentic Payment Design:** Are payments conditional and agent-driven (not button-click)?
   - **Originality:** Is the approach novel?
   - **Polish & Shipability:** UX clear? Permissions/transactions understandable?
   - **Presentation & Demo:** Can the 4 demo requirements be shown? (agent logic, wallet flow, payment lifecycle, live demo)

4. **Output a summary table** with scores and specific action items for improvement

5. **Flag any BLOCKERS** — things that would cause disqualification (missing WDK, no license, etc.)
