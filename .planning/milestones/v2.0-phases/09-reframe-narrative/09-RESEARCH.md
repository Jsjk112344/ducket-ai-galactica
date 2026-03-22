# Phase 9: Reframe Narrative - Research

**Researched:** 2026-03-20
**Domain:** Text content rewriting — README.md, CLAUDE.md, demo script
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**README.md**
- Full rewrite from scratch — zero "monitoring tool" or "fraud detection" framing survives
- Lead with P2P resale story: "Safe P2P ticket resale powered by AI and USDT escrow"
- Architecture diagram rebuilt as resale flow: Seller lists → Buyer locks USDT → AI verifies → Escrow settles (not technical pipeline)
- "How It Works" section maps to 4 resale steps (not judging criteria segments): (1) Seller lists ticket, (2) Buyer locks USDT, (3) AI agent verifies, (4) Escrow settles
- Generic seller/buyer language in README — no named personas (Alice/Bob reserved for demo script only)
- Quick start, third-party disclosures, license sections carry forward with updated language

**CLAUDE.md**
- Project Overview fully rewritten: "Safe P2P ticket resale platform" lead, core flow becomes List → Lock USDT → AI Verify → Settle
- All 6 decision rules rewritten through P2P resale lens (e.g., "Would a buyer trust this agent's verdict?" instead of "Would a judge understand why the agent made this decision?")
- Priorities keep same 7-item judging criteria order but add resale context labels (e.g., "Agent Intelligence (autonomous verification)")
- Hard Constraints section stays exactly as-is — hackathon rules don't change with narrative

**Demo Script**
- Success criteria requires Alice/Bob named scenario mapped to dashboard screens
- Demo script walks: Alice lists FIFA ticket → Bob locks USDT → AI verifies → escrow settles
- No step says "fraud monitoring" — every step is resale-framed

### Claude's Discretion
- Exact wording of rewritten decision rules
- README section ordering beyond the core sections discussed
- How much technical depth to include in README "How It Works" sub-descriptions
- Demo script formatting and level of detail per step

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NARR-01 | README rewritten with P2P resale framing (buyer/seller personas, no "monitoring tool" language) | Current README audited — all offending phrases catalogued below |
| NARR-02 | CLAUDE.md updated with P2P resale context and decision rules | Current CLAUDE.md audited — all 6 rules need P2P lens rewrite |
| NARR-03 | Demo script rewritten with resale narrative (seller lists → buyer locks → AI verifies → settles) | No demo script file exists yet — must be created as new file |
</phase_requirements>

---

## Summary

Phase 9 is a pure text-rewrite phase. No new code is written, no UI changes are made, no libraries are installed. The entire deliverable is three files: README.md (full rewrite), CLAUDE.md (partial rewrite of Overview + Rules + Priorities, Hard Constraints untouched), and a new demo script document that walks a named Alice/Bob scenario through the resale flow.

The challenge is total language discipline — the shift from "fraud detection tool" to "safe P2P resale platform" must be complete with zero residual monitoring/scanning/detection framing. The underlying technical reality (scan loop, classification engine, escrow) is the same; only the story around it changes. The agent's scan loop becomes "AI verification." The fraud classification becomes "ticket legitimacy check." The escrow slash becomes "buyer refund on failed verification."

A secondary challenge is the demo script: it must map to actual dashboard screens that do not yet exist (they are built in Phases 10-11). The demo script must be realistic to the future state, not describe the current v1.0 dashboard UI.

**Primary recommendation:** Treat this as a copywriting task, not a development task. Audit every phrase in the target files against a banned-phrase list, rewrite with the canonical resale flow language, then verify with a second pass.

---

## Standard Stack

This phase has no software dependencies. All work is plain text file editing.

| Tool | Purpose |
|------|---------|
| Text editor / Write tool | Rewrite README.md, CLAUDE.md, create demo script |
| Grep | Verify no banned phrases survive in output files |

---

## Architecture Patterns

### The Four-Step Canonical Flow

Every description of the system must map to this single narrative spine:

```
Seller lists ticket
       ↓
Buyer locks USDT in escrow
       ↓
AI agent verifies ticket legitimacy
       ↓
Escrow settles (releases to seller / refunds buyer)
```

This is the resale flow. It replaces the v1.0 technical pipeline (scrape → classify → escrow action) as the primary mental model for all three files.

### Terminology Substitution Map

| v1.0 (banned) | v2.0 (required) |
|---------------|-----------------|
| fraud detection | ticket verification / AI verification |
| monitoring tool | safe P2P resale platform |
| scan and report | list and verify |
| fraud classification | legitimacy check / AI verdict |
| scan loop | verification agent / AI agent |
| suspicious listing | listing under review |
| scam / scalping | failed verification / price cap violation |
| fraud score | confidence score |
| "no human in the loop" | autonomous verification |
| scraper / polling | market monitoring (used only in technical context, not user-facing) |

### README Structure (Locked)

```
# Ducket AI Galactica
[badge]
[one-line lead: "Safe P2P ticket resale powered by AI and USDT escrow"]

## How It Works
4-step resale flow (not judging segments)

## Architecture
ASCII diagram: Seller → Buyer → AI Agent → Escrow → FraudEscrow.sol
(with dashboard alongside)

## Quick Start
[unchanged commands, updated commentary]

## Project Structure
[updated folder descriptions]

## Demo Video
[placeholder]

## Third-Party Disclosures
[updated Claude API purpose: "AI ticket verification" not "AI fraud classification"]

## Environment Variables
[unchanged]

## License
[unchanged]
```

### CLAUDE.md Structure (Partial Rewrite)

```
# Ducket AI Galactica

## Project Overview          ← FULL REWRITE
## Decision Rules            ← FULL REWRITE (all 6 rules)
## Priorities                ← UPDATE labels only, order unchanged
## Hard Constraints          ← NO CHANGES
```

### Demo Script Structure

The demo script is a new file (no existing file to preserve). Based on success criteria, it must:
- Be a written document (not a runnable script)
- Walk Alice (seller) and Bob (buyer) through the full flow
- Map each step to a named dashboard screen/action
- Never use the phrase "fraud monitoring" or any banned phrase
- Cover all four logical segments judges care about

Suggested format:
```
# Ducket Demo Script — Alice & Bob Resale Flow

## Setup (before recording)
## Step 1: Alice lists a FIFA ticket [screen: Seller Form]
## Step 2: Bob locks USDT [screen: Buyer Lock panel]
## Step 3: AI agent verifies [screen: Agent Decision Panel]
## Step 4: Escrow settles [screen: Settlement Outcome]
## Close
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Banned-phrase check | Manual re-read | `grep` on final files | Grep is deterministic; human re-read misses things |
| Demo script template | Custom format from scratch | Follow the 4-step canonical flow as section headings | Judges expect the resale narrative they've been told about |

---

## Common Pitfalls

### Pitfall 1: Residual Banned Phrases
**What goes wrong:** "fraud" or "monitoring" or "detection" survives in a sentence that wasn't the obvious target — e.g., "AI fraud classification" in the Third-Party Disclosures table, or "scan loop" in the Project Structure folder description.
**Why it happens:** Rewrites focus on headline sentences and miss supporting text, table cells, code comment references, and ASCII diagram labels.
**How to avoid:** After rewriting, run grep across the three target files for each banned term. Fix every hit.
**Warning signs:** Any occurrence of: "fraud", "monitor", "detect", "scan and report", "suspicious"

### Pitfall 2: Demo Script Describes Current (v1.0) UI
**What goes wrong:** Demo script references dashboard screens that show v1.0 fraud-framed UI — "the Listings table shows fraud scores" — rather than future resale flow screens.
**Why it happens:** The current dashboard exists; it's tempting to describe what's actually there.
**How to avoid:** Demo script must describe the Phase 10-11 target state (resale flow UI with Agent Decision Panel, Seller Form, Buyer Lock). Flag any screen that doesn't exist yet as a Phase 10-11 deliverable, not describe the current UI as-is.
**Warning signs:** Demo step mentions "fraud score", "scan results", or existing dashboard component names

### Pitfall 3: CLAUDE.md Decision Rules Lose Actionability
**What goes wrong:** Rewriting rules through the P2P lens makes them vague — "Would a buyer trust this?" is soft; it needs to drive actual decisions during development.
**Why it happens:** Narrative reframe trades specificity for persona language.
**How to avoid:** Each rule must still end with a concrete directive ("→ Do X"). The persona context goes in the question; the action stays sharp.
**Warning signs:** Rule ends in a soft outcome like "→ Think about the buyer" instead of "→ Add reasoning text if not"

### Pitfall 4: Third-Party Disclosures Table Not Updated
**What goes wrong:** README body is reframed correctly but the Third-Party Disclosures table still says "AI fraud classification" for the Claude API row.
**Why it happens:** Tables are easy to overlook in a prose rewrite.
**How to avoid:** Explicitly audit every table cell in README.md as a separate step.
**Warning signs:** "fraud" appears in any table row

---

## Code Examples

### Banned Phrase Verification (run after each file is written)

```bash
# Check README.md
grep -in "fraud\|monitoring tool\|scan and report\|detection\|suspicious" /path/to/README.md

# Check CLAUDE.md
grep -in "fraud detection\|monitoring\|scan and report" /path/to/CLAUDE.md

# Check demo script
grep -in "fraud\|monitoring\|scan and report\|detection" /path/to/docs/DEMO-SCRIPT.md
```

Zero matches required before NARR-01, NARR-02, NARR-03 are considered complete.

### Canonical ASCII Architecture Diagram (resale flow)

Replace v1.0 scraper-pipeline diagram with resale flow:

```
                     Ducket AI Galactica
                ============================
                 Safe P2P Ticket Resale

  +-----------+                          +-----------+
  |  Seller   |--- lists ticket -------->|           |
  |  (Alice)  |                          |  Resale   |
  +-----------+                          |  Platform |
                                         |           |
  +-----------+                          |  (React   |
  |  Buyer    |--- locks USDT ---------->|  Dashboard|
  |  (Bob)    |   (WDK + Sepolia)        |  + API)   |
  +-----------+                          +-----------+
                                               |
                                               v
                                    +----------+----------+
                                    |   AI Verification   |
                                    |   Agent (Claude)    |
                                    +----------+----------+
                                               |
                          +--------------------+--------------------+
                          |                                         |
                          v                                         v
               +----------+----------+                  +----------+----------+
               |  Legitimate: Release|                  | Failed: Refund/Slash|
               |  USDT to seller     |                  | USDT to buyer       |
               +---------------------+                  +---------------------+
                          |                                         |
                          +--------------------+--------------------+
                                               |
                                               v
                                    +----------+----------+
                                    |  FraudEscrow.sol    |
                                    |  (USDT on-chain)    |
                                    +---------------------+
```

Note: The diagram label "FraudEscrow.sol" is the actual contract filename — acceptable to keep the technical name in a code-context diagram since it is not user-facing narrative.

### Demo Script Location

No demo script file exists in the repo. Based on the existing `docs/` directory (currently contains only "ticket info"), the natural location is:

```
docs/DEMO-SCRIPT.md
```

This is consistent with the `docs/` folder already existing at the project root.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None for this phase (text-only changes) |
| Config file | N/A |
| Quick run command | `grep -c "fraud\|monitoring tool\|scan and report" README.md CLAUDE.md docs/DEMO-SCRIPT.md` (must return 0 for each file) |
| Full suite command | Same — phase has no automated test suite |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NARR-01 | README contains no "monitoring tool" or "scan and report" framing | smoke | `grep -c "monitoring tool\|scan and report\|fraud detection" README.md` (expect: 0) | ✅ (file exists, needs rewrite) |
| NARR-01 | README contains "seller lists / buyer locks USDT / AI verifies / escrow settles" language | smoke | `grep -c "buyer locks\|seller lists\|AI verif" README.md` (expect: >= 1 each) | ✅ |
| NARR-02 | CLAUDE.md decision rules reference P2P resale context | smoke | `grep -c "buyer\|seller\|resale" CLAUDE.md` (expect: >= 6) | ✅ (file exists, needs rewrite) |
| NARR-03 | Demo script has Alice/Bob scenario, no "fraud monitoring" step | smoke | `grep -c "Alice\|Bob" docs/DEMO-SCRIPT.md` + `grep -c "fraud monitoring" docs/DEMO-SCRIPT.md` (expect: >=2, 0) | ❌ Wave 0: create docs/DEMO-SCRIPT.md |

### Sampling Rate
- **Per task commit:** Run banned-phrase grep on the modified file
- **Per wave merge:** Run banned-phrase grep across all three target files
- **Phase gate:** Zero grep hits for banned phrases before marking phase complete

### Wave 0 Gaps
- [ ] `docs/DEMO-SCRIPT.md` — covers NARR-03 (file does not exist)

---

## State of the Art

| Old Framing | New Framing | Impact |
|-------------|-------------|--------|
| "Autonomous fraud detection agent" | "Safe P2P ticket resale platform" | Lead sentence of README and CLAUDE.md |
| "Scan → Classify → Act" | "List → Lock USDT → AI Verify → Settle" | Core loop description in CLAUDE.md Overview |
| "Classifies fraud with AI" | "AI agent verifies ticket legitimacy" | Key verb throughout README |
| "StubHub/Viagogo/Facebook Scraper" | Internal technical components not featured in user-facing narrative | Architecture diagram hides scraper infrastructure, shows resale flow |
| "How It Works: 4 judging segments" | "How It Works: 4 resale steps" | README section restructured |
| Decision Rule 1: "Would a judge understand why the agent made this decision?" | "Would a buyer trust the agent's verdict?" | CLAUDE.md rule rewrite |

---

## Open Questions

1. **Demo script screen names**
   - What we know: Phase 10-11 will build the resale flow UI with Seller Form, Buyer Lock panel, Agent Decision Panel, Settlement Outcome screen
   - What's unclear: Exact component/screen names won't be final until Phase 10-11 planning
   - Recommendation: Use descriptive labels ("Seller Listing Form", "Buyer Lock Screen", "Agent Decision Panel", "Settlement Screen") — these are stable enough for the demo script and will align with Phase 10-11 plans

2. **Demo script file format**
   - What we know: Success criteria says "mapped to actual dashboard screens" and "walks a named buyer/seller scenario"
   - What's unclear: Should this be a speaker-notes style script or a step-by-step checklist?
   - Recommendation: Step-by-step checklist with screen callouts — more useful for rehearsals in Phase 13

---

## Sources

### Primary (HIGH confidence)
- Direct file reads: `README.md` (132 lines), `CLAUDE.md` (34 lines) — current content fully audited
- `.planning/REQUIREMENTS.md` — NARR-01, NARR-02, NARR-03 definitions
- `.planning/ROADMAP.md` §Phase 9 — 3 success criteria
- `.planning/phases/09-reframe-narrative/09-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — v2.0 constraints (rebrand hard time-boxed at 4 hours)
- `package.json` — `npm run demo` command confirmed, used in README Quick Start section

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- What to change: HIGH — files audited directly, all banned phrases catalogued
- How to structure output: HIGH — locked decisions in CONTEXT.md are precise
- Demo script location: MEDIUM — `docs/` exists but no prior demo script; location inferred from project structure

**Research date:** 2026-03-20
**Valid until:** 2026-03-22 (phase deadline — narrative is stable until submission)
