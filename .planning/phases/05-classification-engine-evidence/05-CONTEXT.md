# Phase 5: Classification Engine + Evidence - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Fraud classification engine and evidence case file system — classifies every scraped listing into one of four categories with confidence scores and reasoning, gates enforcement on threshold, and produces timestamped case files as evidence packages.

</domain>

<decisions>
## Implementation Decisions

### Classification Architecture
- Hybrid approach: rule-based first pass (price delta, red flags) + Claude LLM reasoning for ambiguous cases
- Single Claude API prompt per listing — sends listing JSON + classification rubric, returns JSON with `category`, `confidence`, `reasoning`
- Classification runs inline in scan loop — classify immediately after scraping, results appear with classification data
- On Claude API failure, fallback to rule-based-only classification marked `classificationSource: "rules-only"` — never blocks pipeline

### Evidence & Case Files
- Markdown case files in `agent/cases/` — one file per classified listing, human-readable for judges
- Full evidence package: listing data, classification result, confidence, reasoning, price delta, red flags, action taken, Etherscan link placeholder
- Naming: `{timestamp}-{platform}-{urlHash}.md` — sortable by time, identifiable by source
- Case files written after classification, before escrow action — evidence exists regardless of enforcement

### Confidence Thresholds & Enforcement Gating
- Category rules: SCALPING_VIOLATION (>2x face value), LIKELY_SCAM (below face value or no-proof signals), COUNTERFEIT_RISK (known scam pattern indicators), LEGITIMATE (none triggered)
- Enforcement gate: confidence >= 85% AND category != LEGITIMATE (per .env FRAUD_CONFIDENCE_THRESHOLD)
- Below threshold = log only, `actionTaken: "logged_only"`; above threshold = `actionTaken: "escrow_deposit"`
- Console log + case file field documents the gating decision for judge visibility
- Idempotent: skip listings already classified (check URL hash in agent/cases/)

### Claude's Discretion
- Claude API prompt engineering (system prompt, rubric wording)
- Rule-based heuristic thresholds beyond the core 2x face value trigger
- Case file markdown template formatting
- Error handling patterns for malformed API responses

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `agent/tools/scrape-stubhub.js` — listing schema with `redFlags` array, `priceDeltaPct` field
- `agent/tools/scrape-viagogo.js` — same schema, `scrapeViagogo` export
- `agent/tools/scrape-facebook.js` — same schema, `scrapeFacebook` export
- `agent/src/scan-loop.js` — orchestrates scrapers, writes LISTINGS.md, dedup by URL hash
- `.env` — `CLAUDE_API_KEY`, `CLAUDE_MODEL=claude-sonnet-4-6`, `FRAUD_CONFIDENCE_THRESHOLD=85`

### Established Patterns
- ESM modules with `type: "module"` in agent/package.json
- `[Prefix]` console logging on stderr for operational logs
- `dotenv.config({ path: join(__dirname, '../../.env') })` for env loading
- SHA-256 URL hash for deduplication
- Mock fallback pattern for external service failures

### Integration Points
- Scan loop (`agent/src/scan-loop.js`) will call classifier after scraping each cycle
- Classifier consumes listing objects with `platform`, `seller`, `price`, `url`, `redFlags`, `priceDeltaPct`
- Phase 6 escrow wiring reads case files to determine which escrow action to take
- `.env` provides `CLAUDE_API_KEY` and `FRAUD_CONFIDENCE_THRESHOLD`

</code_context>

<specifics>
## Specific Ideas

- Judging criteria #1 is Agent Intelligence — classification reasoning text is critical for explainability
- The classification rubric should explicitly reference the 4 categories and what signals map to each
- Case files serve as the "audit trail" judges will inspect to understand agent decisions
- Price delta percentage is already computed by scrapers — classifier can reference it directly

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
