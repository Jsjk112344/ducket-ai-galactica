# Phase 9: Reframe Narrative - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Update all project text (README.md, CLAUDE.md, demo script) so every word describes a safe P2P ticket resale platform — not a fraud monitoring tool. Judges must read buyer/seller personas and resale flow language everywhere they look. No new features, no UI changes, no code changes beyond text files.

</domain>

<decisions>
## Implementation Decisions

### README.md
- Full rewrite from scratch — zero "monitoring tool" or "fraud detection" framing survives
- Lead with P2P resale story: "Safe P2P ticket resale powered by AI and USDT escrow"
- Architecture diagram rebuilt as resale flow: Seller lists → Buyer locks USDT → AI verifies → Escrow settles (not technical pipeline)
- "How It Works" section maps to 4 resale steps (not judging criteria segments): (1) Seller lists ticket, (2) Buyer locks USDT, (3) AI agent verifies, (4) Escrow settles
- Generic seller/buyer language in README — no named personas (Alice/Bob reserved for demo script only)
- Quick start, third-party disclosures, license sections carry forward with updated language

### CLAUDE.md
- Project Overview fully rewritten: "Safe P2P ticket resale platform" lead, core flow becomes List → Lock USDT → AI Verify → Settle
- All 6 decision rules rewritten through P2P resale lens (e.g., "Would a buyer trust this agent's verdict?" instead of "Would a judge understand why the agent made this decision?")
- Priorities keep same 7-item judging criteria order but add resale context labels (e.g., "Agent Intelligence (autonomous verification)")
- Hard Constraints section stays exactly as-is — hackathon rules don't change with narrative

### Demo Script
- Success criteria requires Alice/Bob named scenario mapped to dashboard screens
- Demo script walks: Alice lists FIFA ticket → Bob locks USDT → AI verifies → escrow settles
- No step says "fraud monitoring" — every step is resale-framed

### Claude's Discretion
- Exact wording of rewritten decision rules
- README section ordering beyond the core sections discussed
- How much technical depth to include in README "How It Works" sub-descriptions
- Demo script formatting and level of detail per step

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to modify
- `README.md` — Current README with v1.0 fraud monitoring framing (full rewrite target)
- `CLAUDE.md` — Current project instructions with fraud detection framing (rewrite overview + rules + priorities)

### Requirements
- `.planning/REQUIREMENTS.md` — NARR-01, NARR-02, NARR-03 define the narrative requirements

### Brand context
- Memory file `reference_ducket_brand.md` — Ducket brand tokens (colors, fonts) for any README badge/styling references

### Success criteria source
- `.planning/ROADMAP.md` §Phase 9 — 3 success criteria that define "done" for this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `README.md` — 132-line README with architecture diagram, quick start, project structure, third-party disclosures, env vars section
- `CLAUDE.md` — 34-line project instructions with 6 decision rules, 7 priorities, 6 hard constraints
- `package.json` "demo" script — `concurrently` command that runs agent scan loop + dashboard

### Established Patterns
- README uses ASCII art for architecture diagram — same approach for resale flow diagram
- CLAUDE.md decision rules are numbered imperatives with arrow syntax ("→ Do X if not")
- Demo runs via `npm run demo` with concurrently

### Integration Points
- README demo instructions must match actual `npm run demo` behavior
- CLAUDE.md decision rules are read by Claude Code during development — must remain actionable
- Demo script referenced in success criteria must map to actual dashboard screens (Phase 11+ will build these)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Key constraint is that the language shift must be total: no "monitoring", "detection", or "scan and report" framing anywhere in the three target files.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-reframe-narrative*
*Context gathered: 2026-03-20*
