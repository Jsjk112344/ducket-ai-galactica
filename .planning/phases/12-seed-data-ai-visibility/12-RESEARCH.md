# Phase 12: Seed Data + AI Visibility - Research

**Researched:** 2026-03-20
**Domain:** Static seed data injection — TypeScript/JSON listings with pre-attached Classification objects
**Confidence:** HIGH

## Summary

Phase 12 has a single, well-bounded job: ensure the Listings tab never shows an empty state and every visible row has a populated AgentDecisionPanel. The full data pipeline is already working — `GET /api/listings` reads `agent/memory/LISTINGS.md`, enriches each listing by looking up its case file in `agent/cases/`, and returns the combined object. The only missing piece is seed listings that (a) already carry a `classification` field by the time the API returns them, and (b) cover all four category labels.

Two injection paths exist. Option A: add seed JSON blocks to LISTINGS.md and create matching case files in `agent/cases/` (one per seed listing). The API will discover and parse them automatically. Option B: embed the classification inline in the LISTINGS.md JSON directly — but the current API deliberately separates listing data from classification data, so Option A stays consistent with the existing architecture.

The `pickDemoClassification()` function in `api.ts` already has production-quality reasoning strings (50–100 words, field-referencing) for three of four categories. That logic should be the template for the four seed Classification objects. The COUNTERFEIT_RISK category is not currently reachable via `pickDemoClassification` — its reasoning text must be written fresh for the seed, referencing `new seller` / `no proof` red flags and the account-age/cross-platform signal that the classify engine checks.

**Primary recommendation:** Add one JSON listing block per category in LISTINGS.md and create a matching seed case file in `agent/cases/` for each. The API will auto-discover and return them with a Classification attached on every page load.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEMO-01 | Seed data covers all 4 classification categories with 50+ word AI reasoning strings | Research confirms: API reads LISTINGS.md + case files; creating 4 seed listings with case files covers all categories and enables AgentDecisionPanel on first load |
</phase_requirements>

---

## Standard Stack

### Core (already in repo — no new installs)

| Library / File | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| `agent/memory/LISTINGS.md` | n/a | Source of truth for all listings read by GET /api/listings | Already the data layer — agent and API both write/read here |
| `agent/cases/*.md` | n/a | Per-listing case files parsed by `lookupClassification()` | Already the enrichment mechanism used for every live-scanned listing |
| `dashboard/src/types.ts` | n/a | `Listing` and `Classification` interfaces — must not be mutated | Phase decision: all changes are additive |
| `agent/src/classify.js` | n/a | Defines the four valid category strings | Categories are an enum — seed data must use exact strings |

**No new npm packages required.** This phase is pure data authoring.

---

## Architecture Patterns

### How GET /api/listings Works (confirmed from `api.ts`)

```
LISTINGS.md
  └── extract all ```json blocks (matchAll regex)
  └── flatten into listing array
  └── for each listing: urlHash(listing.url) → lookup agent/cases/<hash>.md
  └── if case file found: parse Classification fields → attach to listing
  └── prepend runtimeListings (POST-submitted this session)
  └── return combined array
```

The case file is keyed by a 16-char SHA-256 of the listing URL. The file naming convention is:
```
{ISO-timestamp}-{platform}-{urlHash}.md
```
The `files.find(f => f.includes(hash))` call in `lookupClassification()` matches any file whose name contains the hash — the timestamp and platform prefix are cosmetic.

### Seed Listing JSON Schema (from LISTINGS.md)

```json
{
  "platform": "Ducket Seed",
  "seller": "seed_seller_name",
  "price": 450,
  "faceValue": 200,
  "priceDeltaPct": 125,
  "url": "https://ducket.seed/listing/scalping-001",
  "listingDate": "2026-03-20T00:00:00.000Z",
  "redFlags": ["price 2x face value", "significant markup over face value"],
  "eventName": "FIFA World Cup 2026 — USA vs England",
  "section": "Category 1",
  "quantity": 2,
  "source": "seed",
  "matchRound": "Group Stage",
  "venue": "MetLife Stadium, NJ",
  "matchDate": "2026-06-15T18:00:00"
}
```

Key fields that drive classification reasoning:
- `priceDeltaPct`: percentage above/below face value — the primary pricing signal
- `faceValue`: agent-sourced (from FACE_VALUE_DB or known price), never seller-reported
- `redFlags`: array of string signals — COUNTERFEIT_RISK specifically needs `"new seller"` or `"no proof"` substring
- `source`: must be `"seed"` — the classify engine uses `'mock'` to skip Claude, `'seed'` is treated as live and will call Claude if confidence < 85. For pre-built seed case files, Claude is never called.

### Case File Format (confirmed from `lookupClassification()` regex patterns)

```markdown
# Fraud Case: {Platform} — {CATEGORY}

**Generated:** {ISO timestamp}
**Classification Source:** {source}

## Listing Details

| Field | Value |
|-------|-------|
| Platform | {platform} |
| Seller | {seller} |
| Price | ${price} USD |
| Face Value | ${faceValue} USD |
| Price Delta | {priceDeltaPct}% |
| URL | {url} |
| Listing Date | {listingDate} |
| Data Source | seed |

## Red Flags

- {flag1}
- {flag2}

## Classification Result

| Field | Value |
|-------|-------|
| Category | **{CATEGORY}** |
| Confidence | {confidence}% |
| Classification Source | demo-seed |

**Reasoning:** {50+ word reasoning string}

## Enforcement Action

| Field | Value |
|-------|-------|
| Action Taken | {actionTaken} |
| Threshold Met | YES |
| Etherscan Link | [{txHash}](https://sepolia.etherscan.io/tx/{txHash}) |

---
*Case file generated by Ducket AI Galactica — Autonomous Fraud Detection Agent*
*Apache 2.0 License*
```

The API parses these exact markdown table row patterns:
- `| Category | **VALUE** |` → `category`
- `| Confidence | NUMBER% |` → `confidence`
- `**Reasoning:** text` → `reasoning`
- `| Classification Source | value |` → `classificationSource`
- `| Action Taken | value |` → `actionTaken`
- First `https://sepolia.etherscan.io/tx/...` found → `etherscanLink`

**All four regex patterns must match or the classification returns null.**

### URL Hash Computation (pre-computed for seed URLs)

```
https://ducket.seed/listing/scalping-001     → d0d62390a4c13d24
https://ducket.seed/listing/scam-001         → b4dbd644a7d0f881
https://ducket.seed/listing/counterfeit-001  → 9304348853ef8964
https://ducket.seed/listing/legitimate-001   → e1f7fa9ae56bb7c6
```

Case file names MUST contain these hashes. Example:
```
2026-03-20T00-00-00-000Z-ducket-seed-d0d62390a4c13d24.md
```

### Four Seed Listings: Category Coverage Plan

| Category | URL slug | priceDeltaPct | redFlags | actionTaken | Confidence |
|----------|----------|---------------|----------|-------------|------------|
| SCALPING_VIOLATION | scalping-001 | +125% | "price 2x face value", "significant markup over face value" | slash | 91 |
| LIKELY_SCAM | scam-001 | -35% | "price below face value (possible scam)", "new account — 12 days old" | refund | 78 |
| COUNTERFEIT_RISK | counterfeit-001 | +18% | "new seller", "no proof of purchase", "account age: 3 days" | refund | 74 |
| LEGITIMATE | legitimate-001 | +42% | [] | release | 85 |

**COUNTERFEIT_RISK note:** The `classifyByRules()` function triggers on `redFlags` containing `"new seller"` or `"no proof"` substring. The seed listing's redFlags must include at least one of these strings exactly. Since the case file is pre-authored, the classify engine is never called — but the redFlags should still be internally consistent.

### Empty State Elimination

The Listings tab renders `ListingsTable` from `useListings`, which calls GET /api/listings on mount. Success criterion 3 says "loading the resale flow tab immediately shows populated listings with expanded Agent Decision Panels." This means:

1. GET /api/listings must return listings with `classification` attached before the first render completes — seed listings in LISTINGS.md with pre-built case files satisfy this because the API reads static files synchronously within the same request.
2. The `ListingsTable` only expands the Agent Decision Panel when the user clicks a row (`toggleRow`). The success criterion says "expanded" — this means the plan must make rows default-expanded for seed listings OR interpret "expanded" as "expandable/visible." Read carefully: the criterion says "expanded Agent Decision Panels" — the planner must address this.

**Two options for default-expanded rows:**
- Option A: Modify `ListingsTable` to initialize `expandedUrl` to the first seed listing's URL (or all seed URLs) — logic change in the component.
- Option B: Seed listings appear with classification data visible at table level (no expansion needed) — but the current UI does not show full reasoning in the table row itself.
- Option C: The "expanded" in the criterion means all classification data is visible, not that the accordion is auto-opened. In the current UI, the classification `category` and `confidence` are already visible in the table row. The full `reasoning` requires clicking.

**Recommendation for planner:** Implement Option A — initialize `expandedUrl` to the URL of the first seed listing (or all seed listing URLs) so AgentDecisionPanel is visible on first load without requiring a click. This satisfies the success criterion literally.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL hash for case file lookup | Custom hash fn | `createHash('sha256').update(url).digest('hex').slice(0,16)` already in api.ts | Must match exactly — mismatched hash = classification not found |
| Classification parser | Custom markdown parser | The existing regex in `lookupClassification()` | Regex patterns are brittle — must match exactly, not generalize |
| New API endpoint | `/api/seed` or `/api/demo` endpoint | Put seed data in LISTINGS.md + case files | The existing GET /api/listings already serves them |
| Inline classification in LISTINGS.md JSON | `"classification": {...}` in JSON block | Separate case files | The API architecture deliberately separates listing data from classification enrichment |

---

## Common Pitfalls

### Pitfall 1: Wrong Category String Casing
**What goes wrong:** Seed case file uses `"Scalping Violation"` or `"scalping_violation"` instead of `"SCALPING_VIOLATION"`. The `Badge` component receives an unrecognized category and falls back to gray/unknown styling.
**Why it happens:** The category values in `Classification` are an enum: `'SCALPING_VIOLATION' | 'LIKELY_SCAM' | 'COUNTERFEIT_RISK' | 'LEGITIMATE'`. Case files store them as `**CATEGORY**` inside the table — the regex extracts whatever is between `**...**`. If the case file has wrong casing, the extracted value is wrong.
**How to avoid:** Use exact uppercase strings in the `| Category | **SCALPING_VIOLATION** |` table row.

### Pitfall 2: Reasoning String Length Below 50 Words
**What goes wrong:** `VerifyStep` comment says "Classification.reasoning must be 50+ words — enforced by API seed data." If reasoning is shorter, the success criterion fails.
**Why it happens:** Temptation to write short summaries.
**How to avoid:** Target 65–90 words. Reference at least two listing-specific fields (e.g., priceDeltaPct, account age, section name, faceValue delta in dollars). Use the `pickDemoClassification()` strings in `api.ts` as the quality bar — they are 65–80 words each.

### Pitfall 3: Case File Not Discovered
**What goes wrong:** Case file exists but `lookupClassification()` returns null. Classification never attaches. Row shows `PENDING` badge, empty confidence bar, no reasoning.
**Why it happens:** The `files.find(f => f.includes(hash))` call requires the 16-char hash to appear in the filename. If the filename uses a different hash (e.g., hashed with different input, or truncated differently), the file is never found.
**How to avoid:** Pre-compute hashes using the exact `urlHash()` function logic: `createHash('sha256').update(url).digest('hex').slice(0,16)`. Hashes are pre-computed in this research doc for the four canonical seed URLs.

### Pitfall 4: `actionTaken` Value Incompatible with SettleStep
**What goes wrong:** SettleStep renders the wrong outcome icon/color because `actionTaken` string doesn't match the expected pattern.
**Why it happens:** `SettleStep` uses `string.includes()` matching per the Phase 11 decision: `includes('release')`, `includes('refund')`, `includes('slash')`. A case file that writes `"escrow_deposit"` (the old enforcement action string) instead of `"slash"` breaks the SCALPING_VIOLATION outcome display.
**How to avoid:** Use `"slash"` for SCALPING_VIOLATION, `"refund"` for LIKELY_SCAM and COUNTERFEIT_RISK, `"release"` for LEGITIMATE in seed case files.

### Pitfall 5: LISTINGS.md JSON Block Parse Failure
**What goes wrong:** The seed listing JSON block is malformed. The API regex extracts the block but `JSON.parse` throws — seed listings silently drop from the array.
**Why it happens:** Trailing commas, wrong quote types, missing commas between objects.
**How to avoid:** Validate each JSON block independently. The API catches parse errors per block (`try { return JSON.parse(m[1]); } catch { return []; }`) — a broken block drops silently.

### Pitfall 6: COUNTERFEIT_RISK redFlags Don't Match Classify Rules
**What goes wrong:** COUNTERFEIT_RISK seed listing is visually correct but if someone triggers a re-classify (e.g., form submission with same data), the rules engine would classify it as LEGITIMATE instead of COUNTERFEIT_RISK.
**Why it happens:** `classifyByRules()` requires `redFlags` to contain `"new seller"` or `"no proof"` substring (case-insensitive `toLowerCase().includes()`).
**How to avoid:** Use `"new seller"` verbatim in the redFlags array for the COUNTERFEIT_RISK seed listing.

---

## Code Examples

### Correct Case File Header Block
```markdown
# Fraud Case: Ducket Seed — SCALPING_VIOLATION

**Generated:** 2026-03-20T00:00:00.000Z
**Classification Source:** demo-seed
```

### Correct Classification Result Table
```markdown
## Classification Result

| Field | Value |
|-------|-------|
| Category | **SCALPING_VIOLATION** |
| Confidence | 91% |
| Classification Source | demo-seed |

**Reasoning:** This listing is priced at 125% above the official face value of $200 USD for FIFA World Cup 2026 Category 1 seating at MetLife Stadium. The agent independently verified the face value — this is not seller-reported. A markup of $250 over face value on a 2-ticket order means the buyer overpays by $500 total. This pattern constitutes a scalping violation under the platform's 100% markup enforcement threshold. Ducket AI has automatically locked 10 USDT in escrow and initiated a slash to the anti-fraud bounty pool. Autonomous enforcement completed.
```

### Enforcement Action Table (slash variant)
```markdown
## Enforcement Action

| Field | Value |
|-------|-------|
| Action Taken | slash |
| Threshold Met | YES |
| Etherscan Link | [0xdemo...0001](https://sepolia.etherscan.io/tx/0xdemo000000000000000000000000000000000000000000000000000000000001) |
```

### Making Rows Default-Expanded in ListingsTable
```typescript
// Source: dashboard/src/components/ListingsTable.tsx — proposed modification
// Initialize expandedUrl to the first seed listing so AgentDecisionPanel is visible on load.
const SEED_URLS = [
  'https://ducket.seed/listing/scalping-001',
  'https://ducket.seed/listing/scam-001',
  'https://ducket.seed/listing/counterfeit-001',
  'https://ducket.seed/listing/legitimate-001',
];

const [expandedUrl, setExpandedUrl] = useState<string | null>(
  SEED_URLS[0] // open first seed row on mount
);
```

### Reasoning String Template (50+ words, field-referencing)
Each reasoning string must:
1. Reference `priceDeltaPct` by its exact value
2. Reference the `faceValue` in USD
3. Reference the event or section name
4. State the outcome/action taken
5. Mention autonomous enforcement

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Seed listings without case files (LISTINGS.md source: 'mock') | Seed listings with pre-built case files → classification attached on every load | Eliminates empty AgentDecisionPanel |
| `source: 'mock'` skips Claude API | `source: 'seed'` is used for these listings — but case files are pre-built so classify is never called during GET /api/listings | No API cost, no latency |

**Note on `source` value:** The current LISTINGS.md mixes `source: "seed"` and `source: "mock"`. The API only skips Claude in `classifyListing()` — but `classifyListing()` is only called during POST /api/listings (new form submission), NOT during GET /api/listings. GET enriches from case files only. So the `source` value in existing seed listings has no effect on GET behavior. Use `"seed"` for clarity.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, vitest.config, or test directory |
| Config file | none |
| Quick run command | `node -e "require('./validate-seed.js')"` (Wave 0 gap) |
| Full suite command | `node -e "require('./validate-seed.js')"` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEMO-01 (a) | All 4 categories present in seed listings | smoke | `node scripts/validate-seed.js` | ❌ Wave 0 |
| DEMO-01 (b) | Every seed reasoning string is 50+ words | smoke | `node scripts/validate-seed.js` | ❌ Wave 0 |
| DEMO-01 (c) | GET /api/listings returns listings with classification on first load | manual | Start server, open Listings tab — no empty state | manual |

### Wave 0 Gaps
- [ ] `scripts/validate-seed.js` — reads LISTINGS.md + case files, checks category coverage and word counts for DEMO-01
- [ ] No test framework — validation script runs as plain Node.js, no framework needed

---

## Open Questions

1. **Auto-expand behavior scope**
   - What we know: Success criterion says "expanded Agent Decision Panels" on first load. ListingsTable currently requires a click to expand.
   - What's unclear: Should all 4 seed rows be expanded simultaneously, or just the first one?
   - Recommendation: Open only the first seed listing row by default. Opening all 4 would make the initial view overwhelming. One row demonstrates the capability; users click to see others.

2. **Seed listings placement in LISTINGS.md**
   - What we know: API prepends runtimeListings then appends LISTINGS.md listings. The last scan block appears at the bottom.
   - What's unclear: Should seed listings be in a dedicated block or mixed with existing scan data?
   - Recommendation: Create a dedicated `## Seed Data` block at the top of LISTINGS.md (before any scan blocks). This guarantees seed listings are first in the array — and the first row gets auto-expanded.

---

## Sources

### Primary (HIGH confidence)
- `dashboard/server/api.ts` — full source read, all data flow confirmed
- `dashboard/src/components/ListingsTable.tsx` — expansion logic confirmed
- `dashboard/src/components/AgentDecisionPanel.tsx` — rendering requirements confirmed
- `dashboard/src/types.ts` — Classification interface, actionTaken values
- `agent/src/classify.js` — category enum, COUNTERFEIT_RISK redFlags trigger, pickDemoClassification templates
- `agent/memory/LISTINGS.md` — existing listing JSON format
- `agent/cases/2026-03-19T13-36-40-129Z-stubhub-3a6cd7b971d9e010.md` — case file format confirmed

### Secondary (MEDIUM confidence)
- Node.js `crypto.createHash` — URL hash pre-computed and verified by running node command

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all existing files read directly
- Architecture: HIGH — API data flow confirmed from source code, regex patterns documented
- Pitfalls: HIGH — derived from reading actual API parsing code and component logic
- Seed data content: HIGH — reasoning string templates derived from existing `pickDemoClassification()` in api.ts

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable — no external dependencies)
