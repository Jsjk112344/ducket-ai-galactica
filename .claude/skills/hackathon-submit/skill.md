---
name: hackathon-submit
description: Pre-submission checklist. Verify all hard requirements are met before submitting to the hackathon. Generates final compliance report.
user_invocable: true
---

# Pre-Submission Checklist

Final verification before hackathon submission. Every item must PASS.

## Steps

1. **Hard Requirements (ALL must pass):**
   - [ ] WDK wallet integration is functional
   - [ ] Apache 2.0 LICENSE file exists at repo root
   - [ ] Project runs out of the box (test: clone → install → run)
   - [ ] Video demo exists and is ≤ 5 minutes
   - [ ] All third-party services are disclosed (check for: TinyFish, Claude API, OpenClaw, any others)
   - [ ] GitHub repo is public
   - [ ] No secrets/credentials committed (scan for .env files, API keys, private keys)

2. **Demo Video Covers:**
   - [ ] Agent logic explanation
   - [ ] Wallet flow walkthrough
   - [ ] Payment lifecycle end-to-end
   - [ ] Live demo of full loop

3. **Repo Quality:**
   - [ ] README with clear setup instructions
   - [ ] package.json with correct scripts
   - [ ] No broken dependencies
   - [ ] Clean git history (no "fix fix fix" commits)
   - [ ] Non-obvious logic is commented

4. **Generate Submission Report:**
   - Summary of what we built
   - Third-party service disclosure list
   - Link to demo video
   - Setup instructions for judges

5. **BLOCKERS** — if any hard requirement fails, flag it as critical and stop.
