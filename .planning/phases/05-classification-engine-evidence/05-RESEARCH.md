# Phase 5: Classification Engine + Evidence - Research

**Researched:** 2026-03-19
**Domain:** LLM classification, rule-based fraud heuristics, case file generation, Node.js ESM
**Confidence:** HIGH

## Summary

Phase 5 builds two tightly coupled subsystems on top of the existing scan loop: a hybrid fraud classifier and an evidence case file writer. The classifier runs inline after scraping, using rule-based heuristics as a fast first pass and the Anthropic Claude API for reasoning on ambiguous or moderate-confidence cases. Case files are written as markdown to `agent/cases/` before any enforcement action fires, ensuring every decision has a paper trail regardless of gating outcome.

The project already has `@tetherto/wdk-wallet-evm`, `patchright`, `dotenv`, and `node-cron` installed in `agent/package.json`. Phase 5 adds one new dependency: `@anthropic-ai/sdk` (0.80.0, published 2026-03-18). No other new runtime dependencies are needed. The existing listing schema already carries `priceDeltaPct`, `redFlags`, `faceValue`, and `source` fields — the classifier can consume them directly.

The most important design constraint for hackathon judging is explainability: the `reasoning` field on every classification result is the primary evidence that the agent is making an *intelligent* decision, not just threshold arithmetic. The case file markdown is the artifact judges will read. Both must be human-readable and compelling.

**Primary recommendation:** Use `@anthropic-ai/sdk` `messages.create` with a tightly-scoped JSON system prompt and `output_config.format` structured output to guarantee a valid `{category, confidence, reasoning}` JSON object from Claude on every call, with rule-based classification as the fallback when the API is unavailable.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Classification Architecture:** Hybrid approach — rule-based first pass (price delta, red flags) + Claude LLM reasoning for ambiguous cases. Single Claude API prompt per listing. Returns JSON with `category`, `confidence`, `reasoning`. Classification runs inline in scan loop. On Claude API failure, fallback to rule-based-only marked `classificationSource: "rules-only"` — never blocks pipeline.
- **Evidence & Case Files:** Markdown case files in `agent/cases/` — one per classified listing. Full evidence package: listing data, classification result, confidence, reasoning, price delta, red flags, action taken, Etherscan link placeholder. Naming: `{timestamp}-{platform}-{urlHash}.md`. Written after classification, before escrow action.
- **Confidence Thresholds:** SCALPING_VIOLATION (>2x face value), LIKELY_SCAM (below face value or no-proof signals), COUNTERFEIT_RISK (known scam pattern indicators), LEGITIMATE (none triggered). Enforcement gate: confidence >= 85% AND category != LEGITIMATE. Below threshold = `actionTaken: "logged_only"`. Above threshold = `actionTaken: "escrow_deposit"`. Idempotent: skip listings already classified (check URL hash in agent/cases/).

### Claude's Discretion

- Claude API prompt engineering (system prompt, rubric wording)
- Rule-based heuristic thresholds beyond the core 2x face value trigger
- Case file markdown template formatting
- Error handling patterns for malformed API responses

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLAS-01 | Agent classifies each listing as one of: SCALPING_VIOLATION, LIKELY_SCAM, COUNTERFEIT_RISK, or LEGITIMATE | Claude API structured output with enum constraint + rule-based fallback |
| CLAS-02 | Each classification includes a confidence score (0-100) and reasoning text | `output_config` with JSON schema enforcing `confidence` (number) and `reasoning` (string) fields |
| CLAS-03 | Agent calculates price delta percentage vs official face value per listing | Already computed by scrapers in `priceDeltaPct` field — classifier reads it directly |
| CLAS-04 | Classification is confidence-gated — escrow slash only fires above configurable threshold | `.env` `FRAUD_CONFIDENCE_THRESHOLD=85`; enforcement gate check before calling Phase 6 |
| EVID-01 | Agent generates timestamped evidence case file per classified listing (JSON + human-readable) | `agent/cases/{timestamp}-{platform}-{urlHash}.md` via `fs/promises.writeFile` |
| EVID-02 | Case file includes: screenshot, URL, prices, classification result, confidence, action taken | Markdown template; screenshot path from listing or placeholder |
| EVID-03 | Agent autonomously drafts enforcement actions (takedown request, platform report, public warning) per case | Claude API or template-based text generation; written into case file |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | 0.80.0 | Claude API client — messages.create, structured output | Official Anthropic SDK; ESM-compatible; `output_config.format` ensures valid JSON |
| `node:fs/promises` | built-in | Write markdown case files to `agent/cases/` | Already used in scan-loop.js; no extra dep |
| `node:crypto` | built-in | SHA-256 URL hash for idempotent case file lookup | Already in use — urlHash() pattern established in scan-loop.js |
| `dotenv` | ^17.3.1 | Load `CLAUDE_API_KEY`, `FRAUD_CONFIDENCE_THRESHOLD` from `.env` | Already installed; existing load pattern |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | 4.3.6 | Schema definition for `zodOutputFormat` helper | Optional: use if you want TypeScript-typed parsed output; not required if using raw JSON schema |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@anthropic-ai/sdk` `output_config` | Manual JSON parsing with retry | `output_config` eliminates parse errors; no retry loop needed |
| Markdown case files | JSON-only case files | Markdown is human-readable for judges; JSON can be nested inside markdown as a code block |
| Rule-based fallback | Skip classification on API failure | Rule-based fallback ensures the pipeline never stalls; required per locked decisions |

**Installation (one new dependency):**
```bash
cd agent && npm install @anthropic-ai/sdk
```

**Version verification (confirmed 2026-03-19):**
- `@anthropic-ai/sdk`: 0.80.0 (published 2026-03-18)
- `zod`: 4.3.6 (if opted in)

---

## Architecture Patterns

### Recommended Project Structure

```
agent/
├── src/
│   ├── scan-loop.js          # existing — calls classify() per listing
│   ├── classify.js           # NEW — classifyListing(listing) -> ClassificationResult
│   └── evidence.js           # NEW — writeCaseFile(listing, result) -> filepath
├── cases/                    # NEW — one .md file per classified listing
│   └── {ts}-{platform}-{urlHash}.md
├── tools/
│   ├── scrape-stubhub.js     # existing
│   ├── scrape-viagogo.js     # existing
│   └── scrape-facebook.js    # existing
└── memory/
    └── LISTINGS.md           # existing
```

### Pattern 1: Hybrid Classifier (Rule-Based + Claude API)

**What:** Run deterministic rules first. If they produce a high-confidence result, skip the Claude API call to save tokens and latency. Call Claude for ambiguous cases or when rules produce moderate confidence.

**When to use:** Every listing. Rules run synchronously (sub-ms). Claude call only when rules return confidence < 85 or category == LEGITIMATE (ambiguous).

**Recommended logic:**

```javascript
// agent/src/classify.js
// Source: Architecture from 05-CONTEXT.md + Anthropic SDK docs

import Anthropic from '@anthropic-ai/sdk';

const CATEGORIES = ['SCALPING_VIOLATION', 'LIKELY_SCAM', 'COUNTERFEIT_RISK', 'LEGITIMATE'];

// Rule-based first pass — deterministic, no API call
function classifyByRules(listing) {
  const { priceDeltaPct, redFlags, price, faceValue } = listing;
  const flags = redFlags ?? [];

  if (priceDeltaPct !== null && priceDeltaPct > 100) {
    // >2x face value = scalping violation
    const confidence = Math.min(95, 70 + Math.round(priceDeltaPct / 20));
    return { category: 'SCALPING_VIOLATION', confidence, reasoning: `Price ${priceDeltaPct}% above face value (threshold: 100%).`, classificationSource: 'rules' };
  }
  if (priceDeltaPct !== null && priceDeltaPct < -10) {
    // Below face value = likely scam signal
    return { category: 'LIKELY_SCAM', confidence: 72, reasoning: `Price ${Math.abs(priceDeltaPct)}% below face value — common scam pattern.`, classificationSource: 'rules' };
  }
  if (flags.some(f => f.includes('new seller') || f.includes('no proof'))) {
    return { category: 'COUNTERFEIT_RISK', confidence: 68, reasoning: `Seller red flags detected: ${flags.join(', ')}.`, classificationSource: 'rules' };
  }
  // Ambiguous — needs LLM reasoning
  return { category: 'LEGITIMATE', confidence: 55, reasoning: 'No strong rule signals detected.', classificationSource: 'rules' };
}

// Claude API classification — called for ambiguous cases
async function classifyWithClaude(listing, client) {
  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 512,
    system: `You are a fraud detection agent for ticket marketplaces. Classify listings into exactly one of: SCALPING_VIOLATION, LIKELY_SCAM, COUNTERFEIT_RISK, LEGITIMATE.

SCALPING_VIOLATION: Price significantly above official face value (>2x).
LIKELY_SCAM: Price below face value, missing proof of legitimacy, or suspicious seller signals.
COUNTERFEIT_RISK: Known scam patterns, new accounts, no verifiable ticket source.
LEGITIMATE: Normal pricing (within 100% of face value), no red flags.

Return ONLY valid JSON: {"category": "...", "confidence": 0-100, "reasoning": "..."}`,
    messages: [
      {
        role: 'user',
        content: `Classify this ticket listing:\n${JSON.stringify(listing, null, 2)}`
      }
    ],
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: CATEGORIES },
            confidence: { type: 'number', minimum: 0, maximum: 100 },
            reasoning: { type: 'string' }
          },
          required: ['category', 'confidence', 'reasoning'],
          additionalProperties: false
        }
      }
    }
  });

  const text = response.content.find(b => b.type === 'text')?.text ?? '{}';
  return { ...JSON.parse(text), classificationSource: 'claude' };
}

export async function classifyListing(listing) {
  const rulesResult = classifyByRules(listing);

  // Skip Claude API for mock data or high-confidence rule results
  if (listing.source === 'mock' || rulesResult.confidence >= 85) {
    return { ...rulesResult, classificationSource: rulesResult.confidence >= 85 ? 'rules' : 'rules-mock' };
  }

  try {
    const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    return await classifyWithClaude(listing, client);
  } catch (err) {
    console.error(`[Classify] Claude API error (${err.message}) — falling back to rules-only`);
    return { ...rulesResult, classificationSource: 'rules-only' };
  }
}
```

### Pattern 2: Idempotent Case File Writer

**What:** Before writing a case file, check `agent/cases/` for a file whose name contains the URL hash. If found, skip — the listing was already processed in a prior cycle.

**When to use:** Every listing entering the classification pipeline.

```javascript
// agent/src/evidence.js
// Source: Architecture from 05-CONTEXT.md + Node.js fs/promises

import { writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CASES_DIR = join(__dirname, '../cases');

function urlHash(url) {
  return createHash('sha256').update(url ?? '').digest('hex').slice(0, 16);
}

// Check idempotency — returns true if listing was already classified this session
export async function isCaseFileExists(url) {
  const hash = urlHash(url);
  try {
    const files = await readdir(CASES_DIR);
    return files.some(f => f.includes(hash));
  } catch {
    return false; // Directory doesn't exist yet — first run
  }
}

export async function writeCaseFile(listing, classificationResult, actionTaken) {
  await mkdir(CASES_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const hash = urlHash(listing.url);
  const filename = `${ts}-${listing.platform.toLowerCase()}-${hash}.md`;
  const filepath = join(CASES_DIR, filename);

  const enforcementText = draftEnforcementText(listing, classificationResult);

  const content = `# Fraud Case: ${listing.platform} — ${classificationResult.category}

**Generated:** ${new Date().toISOString()}
**Classification Source:** ${classificationResult.classificationSource}

## Listing Details

| Field | Value |
|-------|-------|
| Platform | ${listing.platform} |
| Seller | ${listing.seller ?? 'unknown'} |
| Price | $${listing.price} USD |
| Face Value | $${listing.faceValue ?? 'N/A'} USD |
| Price Delta | ${listing.priceDeltaPct !== null ? listing.priceDeltaPct + '%' : 'N/A'} |
| URL | ${listing.url} |
| Listing Date | ${listing.listingDate ?? 'unknown'} |
| Data Source | ${listing.source} |

## Red Flags

${(listing.redFlags ?? []).length > 0 ? listing.redFlags.map(f => `- ${f}`).join('\n') : '- None detected'}

## Classification Result

| Field | Value |
|-------|-------|
| Category | **${classificationResult.category}** |
| Confidence | ${classificationResult.confidence}% |
| Classification Source | ${classificationResult.classificationSource} |

**Reasoning:** ${classificationResult.reasoning}

## Enforcement Action

| Field | Value |
|-------|-------|
| Action Taken | ${actionTaken} |
| Threshold Met | ${classificationResult.confidence >= parseInt(process.env.FRAUD_CONFIDENCE_THRESHOLD ?? '85') ? 'YES' : 'NO'} |
| Etherscan Link | _(pending escrow transaction)_ |

## Drafted Enforcement Text

${enforcementText}

---
*Case file generated by Ducket AI Galactica — Autonomous Fraud Detection Agent*
*Apache 2.0 License*
`;

  await writeFile(filepath, content, 'utf8');
  console.log(`[Evidence] Case file written: ${filename}`);
  return filepath;
}

function draftEnforcementText(listing, result) {
  const actions = {
    SCALPING_VIOLATION: `**Takedown Request:** This listing on ${listing.platform} by seller "${listing.seller}" is priced at $${listing.price} — ${listing.priceDeltaPct}% above the official face value of $${listing.faceValue}. This constitutes a scalping violation under FIFA World Cup 2026 ticket resale policy. Immediate removal is requested.`,
    LIKELY_SCAM: `**Platform Report:** Listing by "${listing.seller}" on ${listing.platform} is priced below face value ($${listing.price} vs $${listing.faceValue} official), a strong indicator of ticket fraud. Recommend platform review and buyer warning.`,
    COUNTERFEIT_RISK: `**Public Warning:** Listing from "${listing.seller}" on ${listing.platform} exhibits counterfeit risk signals: ${(listing.redFlags ?? []).join(', ')}. Buyers should avoid. Platform report submitted.`,
    LEGITIMATE: `**No Action:** Listing classified as legitimate. Monitoring continues.`
  };
  return actions[result.category] ?? actions.LEGITIMATE;
}
```

### Pattern 3: Scan Loop Integration

**What:** After deduplication in `scan-loop.js`, call `classifyListing()` on each new listing, then `writeCaseFile()`, then check the enforcement gate.

**Integration point in scan-loop.js:**

```javascript
// Add to scan-loop.js after deduplication
import { classifyListing } from './classify.js';
import { writeCaseFile, isCaseFileExists } from './evidence.js';

const THRESHOLD = parseInt(process.env.FRAUD_CONFIDENCE_THRESHOLD ?? '85');

for (const listing of fresh) {
  if (await isCaseFileExists(listing.url)) {
    console.log(`[ScanLoop] Skipping already-classified listing: ${listing.url}`);
    continue;
  }

  const result = await classifyListing(listing);
  console.log(`[ScanLoop] ${listing.platform} | ${result.category} | ${result.confidence}% | ${result.reasoning.slice(0, 60)}...`);

  const meetsThreshold = result.confidence >= THRESHOLD && result.category !== 'LEGITIMATE';
  const actionTaken = meetsThreshold ? 'escrow_deposit' : 'logged_only';

  await writeCaseFile(listing, result, actionTaken);

  if (meetsThreshold) {
    console.log(`[ScanLoop] ENFORCEMENT GATE PASSED — ${result.category} at ${result.confidence}% — triggering escrow`);
    // Phase 6 hook: await triggerEscrow(listing, result);
  } else {
    console.log(`[ScanLoop] Below threshold (${result.confidence}% < ${THRESHOLD}%) — logged only`);
  }
}
```

### Anti-Patterns to Avoid

- **Calling Claude API for every listing unconditionally:** Costs extra tokens for listings that rule-based logic can classify with high confidence. Filter high-confidence rule results before making API calls.
- **Parsing Claude response with JSON.parse() without `output_config`:** Without structured output, malformed JSON from Claude will throw on parse. Use `output_config.format` with a JSON schema to guarantee valid JSON.
- **Writing case files after escrow action:** If escrow throws, case file is never written. Always write case file first, then enforce.
- **Not checking for existing case files:** Without idempotency check, each scan cycle will re-classify and re-write case files for listings already handled.
- **Using `prefilled` assistant turn for JSON formatting:** Deprecated in Claude 4.6 models. Use `output_config` instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Guaranteed JSON from LLM | Custom retry loop + JSON.parse | `output_config.format` with `json_schema` | Structured output uses constrained decoding — eliminates parse errors entirely |
| Confidence score calibration | Custom scoring formula | Let Claude return a 0-100 score in the JSON schema | Claude's training provides better signal than ad-hoc arithmetic |
| Template for enforcement text | Complex branching logic | Simple `switch` on `category` | Four fixed categories → four fixed templates; no abstraction needed |
| Case file directory setup | Custom mkdir logic | `mkdir(CASES_DIR, { recursive: true })` | Built-in; already the pattern in scan-loop.js |

**Key insight:** The Anthropic SDK's `output_config.format` with `json_schema` is the entire solution to "how do I get structured JSON reliably from Claude." There is no need to add Zod, parse manually, or implement retry logic around JSON parsing.

---

## Common Pitfalls

### Pitfall 1: Claude API Latency in the Scan Loop

**What goes wrong:** The scan loop calls Claude API for every listing. With 30+ listings per cycle, the loop stalls for 30+ seconds waiting on API responses.

**Why it happens:** `await classifyListing(listing)` is called sequentially inside a `for` loop.

**How to avoid:** Use `Promise.all` or `Promise.allSettled` to classify all listings in a cycle concurrently. Or, batch the listings and only call Claude for those where rule confidence is below threshold.

**Warning signs:** Console logs show multi-second gaps between `[ScanLoop] Cycle start` and `[ScanLoop] Cycle complete`.

### Pitfall 2: output_config Not Supported on Older Model Strings

**What goes wrong:** Calling `messages.create` with `output_config.format` throws a 400 error if the `model` string is not in the supported set.

**Why it happens:** `output_config` is only supported on Opus 4.6, Sonnet 4.6, Sonnet 4.5, Opus 4.5, Haiku 4.5. The `.env` currently sets `CLAUDE_MODEL=claude-opus-4-5` (note: `.env.example` shows `claude-opus-4-5`, not `claude-sonnet-4-6`).

**How to avoid:** Verify `CLAUDE_MODEL` is a supported model string before using `output_config`. `claude-sonnet-4-6` is the right choice for classification (faster + cheaper than opus). Update `.env.example` to `claude-sonnet-4-6`.

**Warning signs:** API returns 400 with "invalid model" or "output_config not supported" error.

### Pitfall 3: Mock Listings Polluting Enforcement Logic

**What goes wrong:** The scraper mock fallback returns `source: 'mock'` listings. If these hit the confidence gate at >= 85%, a fake escrow deposit fires for synthetic data.

**Why it happens:** Rule-based classifier assigns SCALPING_VIOLATION confidence of 90+ for the mock listing with `priceDeltaPct: 320`.

**How to avoid:** In `classifyListing()`, always return `classificationSource: 'rules-mock'` and skip the enforcement gate for `source === 'mock'` listings. Log a clear `[Classify] Mock listing — skipping enforcement` message.

**Warning signs:** Escrow deposits fire during test runs that use only mock data.

### Pitfall 4: Case File Directory Does Not Exist on First Run

**What goes wrong:** `writeFile()` throws `ENOENT` because `agent/cases/` doesn't exist.

**Why it happens:** `agent/cases/` is in `.gitignore` and not committed. First run has no directory.

**How to avoid:** Call `mkdir(CASES_DIR, { recursive: true })` at the top of `writeCaseFile()` — same pattern as scan-loop.js line 106.

**Warning signs:** Crash on first `writeCaseFile()` call with `ENOENT: no such file or directory`.

### Pitfall 5: Malformed Claude Response When output_config Is Used

**What goes wrong:** `response.content.find(b => b.type === 'text')` returns `undefined` when structured output returns a different block type.

**Why it happens:** When `output_config` is used with JSON schema, the response block type is still `text`, but it's guaranteed to be valid JSON. However, if API returns an error block, `find` returns undefined.

**How to avoid:** Always check that `text` is truthy before `JSON.parse()`. Wrap in try/catch and fall back to rule-based result on any parse or access error.

---

## Code Examples

### Claude API Structured Output (JSON Schema)

```javascript
// Source: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 512,
  system: 'You are a fraud classifier. Return ONLY valid JSON.',
  messages: [{ role: 'user', content: 'Classify this listing: ...' }],
  output_config: {
    format: {
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['SCALPING_VIOLATION', 'LIKELY_SCAM', 'COUNTERFEIT_RISK', 'LEGITIMATE'] },
          confidence: { type: 'number', minimum: 0, maximum: 100 },
          reasoning: { type: 'string' }
        },
        required: ['category', 'confidence', 'reasoning'],
        additionalProperties: false
      }
    }
  }
});

const text = response.content.find(b => b.type === 'text')?.text;
const result = JSON.parse(text); // Guaranteed valid JSON — no try/catch needed for parse
```

### ESM Module Import Pattern (matches project conventions)

```javascript
// Source: existing agent/src/scan-loop.js pattern
import { classifyListing } from './classify.js';  // .js extension required for ESM
import { writeCaseFile, isCaseFileExists } from './evidence.js';
```

### Idempotency Check via Directory Scan

```javascript
// Source: Node.js fs/promises + existing urlHash() pattern
import { readdir } from 'node:fs/promises';

async function isCaseFileExists(url) {
  const hash = urlHash(url);  // reuse existing urlHash() pattern
  try {
    const files = await readdir(CASES_DIR);
    return files.some(f => f.includes(hash));
  } catch {
    return false;
  }
}
```

### Enforcement Gate Check

```javascript
// Source: Architecture from 05-CONTEXT.md
const THRESHOLD = parseInt(process.env.FRAUD_CONFIDENCE_THRESHOLD ?? '85');
const meetsThreshold = result.confidence >= THRESHOLD && result.category !== 'LEGITIMATE';
const actionTaken = meetsThreshold ? 'escrow_deposit' : 'logged_only';
// Log the gating decision explicitly for judge visibility
console.log(`[ScanLoop] Enforcement gate: ${result.confidence}% ${meetsThreshold ? '>=' : '<'} ${THRESHOLD}% — ${actionTaken}`);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSON.parse() + retry on LLM output | `output_config` with `json_schema` structured output | Anthropic, late 2024 | Eliminates parse errors entirely; no retry loop needed |
| Prefilled assistant turns for JSON formatting | `output_config` or explicit instruction | Claude 4.6 (2025) | Prefill deprecated in Claude 4.6 models — use structured output instead |
| `budget_tokens` extended thinking | Adaptive thinking (`thinking: {type: "adaptive"}`) | Claude 4.6 | Not needed for classification; keep thinking disabled for latency |

**Deprecated/outdated:**
- Prefilled assistant turns for JSON output: replaced by `output_config` in Claude 4.6
- `budget_tokens` thinking for classification tasks: overkill; adds latency for no quality gain on structured classification

---

## Open Questions

1. **Should rule-based confidence > 85% skip Claude entirely?**
   - What we know: Rule confidence of 95% for priceDeltaPct > 200% is very reliable
   - What's unclear: Does the prompt-engineering cost of a Claude call add meaningful reasoning quality for high-confidence rule cases?
   - Recommendation: Yes — skip Claude when rule confidence >= 85. This saves tokens and latency for clear-cut cases while using Claude for ambiguous ones.

2. **Should mock listings be classified or skipped?**
   - What we know: Scraper mock fallback returns `source: 'mock'` on bot-blocked runs; mock data represents all 4 fraud archetypes
   - What's unclear: For demo purposes, do we want mock listings to show the full classification flow (including enforcement gate)?
   - Recommendation: Classify mock listings with rules only (skip Claude API) but allow them through the enforcement gate for demo visibility. Add a `[DEMO-MOCK]` prefix to `actionTaken` when `source === 'mock'`.

3. **Concurrent Claude API calls — rate limits?**
   - What we know: Claude API rate limits vary by tier; 3-10 listings per cycle is likely within limits
   - What's unclear: Exact RPM limit for claude-sonnet-4-6 on the hackathon team's API key tier
   - Recommendation: Use `Promise.allSettled` with the Claude calls — same pattern as scan-loop uses for scrapers. If rate limited, the fallback catches the error and returns rules-only.

---

## Validation Architecture

> `nyquist_validation` is true in `.planning/config.json` — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | No test framework currently installed in agent/ |
| Config file | None — Wave 0 must add |
| Quick run command | `node agent/src/classify.js` (smoke test via CLI entry) |
| Full suite command | TBD — Wave 0 sets up framework |

**Note:** The agent workspace has no `devDependencies` for testing. The project pattern (Phases 1-4) uses inline smoke test scripts rather than a test framework. For Phase 5, the classification and evidence modules can be validated via CLI smoke scripts matching that pattern, plus lightweight assertion scripts.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLAS-01 | Every listing classified as one of 4 categories | unit | `node agent/tests/test-classify.js` | ❌ Wave 0 |
| CLAS-02 | Classification includes `confidence` (number) and `reasoning` (string) | unit | `node agent/tests/test-classify.js` | ❌ Wave 0 |
| CLAS-03 | `priceDeltaPct` present on classified listing output | unit | `node agent/tests/test-classify.js` | ❌ Wave 0 (field already in scraper schema) |
| CLAS-04 | Confidence < threshold produces `actionTaken: "logged_only"` | unit | `node agent/tests/test-gate.js` | ❌ Wave 0 |
| EVID-01 | Case file written to `agent/cases/` with correct naming | integration | `node agent/tests/test-evidence.js` | ❌ Wave 0 |
| EVID-02 | Case file contains URL, prices, classification result, confidence, action taken | integration | `node agent/tests/test-evidence.js` | ❌ Wave 0 |
| EVID-03 | Case file contains drafted enforcement text | integration | `node agent/tests/test-evidence.js` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `node agent/tests/test-classify.js && node agent/tests/test-evidence.js`
- **Per wave merge:** Same as above (no test runner yet — scripts exit 0 on pass, 1 on fail)
- **Phase gate:** All test scripts exit 0 before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `agent/tests/test-classify.js` — covers CLAS-01, CLAS-02, CLAS-03, CLAS-04 (uses mock listings to avoid Claude API in tests)
- [ ] `agent/tests/test-evidence.js` — covers EVID-01, EVID-02, EVID-03 (writes temp case file, asserts fields, cleans up)
- [ ] `agent/tests/test-gate.js` — covers CLAS-04 enforcement gate logic in isolation

---

## Sources

### Primary (HIGH confidence)

- Anthropic official docs — https://platform.claude.com/docs/en/build-with-claude/structured-outputs — `output_config.format` API, JSON schema usage
- Anthropic official docs — https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices — system prompt patterns, classification prompting, prefill deprecation
- npm registry — `@anthropic-ai/sdk` 0.80.0, published 2026-03-18 (verified via `npm view`)
- npm registry — `zod` 4.3.6 (verified via `npm view`)
- Project codebase — `agent/tools/scrape-stubhub.js` — listing schema shape confirmed (priceDeltaPct, redFlags, source, faceValue fields)
- Project codebase — `agent/src/scan-loop.js` — integration point, ESM pattern, dotenv pattern, urlHash pattern

### Secondary (MEDIUM confidence)

- WebSearch verified with official docs — `output_config` available on claude-sonnet-4-6, claude-opus-4-6, claude-sonnet-4-5, claude-opus-4-5, claude-haiku-4-5
- Anthropic prompting docs — prefilled assistant turns deprecated in Claude 4.6 models

### Tertiary (LOW confidence)

- None — all critical claims verified with official sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@anthropic-ai/sdk` 0.80.0 verified via npm; existing dependencies confirmed in agent/package.json
- Architecture: HIGH — patterns derived directly from existing codebase conventions (scan-loop.js) and official Anthropic SDK docs
- Pitfalls: HIGH — mock data pitfall and output_config model support verified against official docs; directory ENOENT pattern matches existing code
- Validation: MEDIUM — no test framework currently exists in agent/; test script pattern inferred from project history (Phases 1-4 used smoke scripts)

**Research date:** 2026-03-19
**Valid until:** 2026-04-18 (stable SDK — 30 days)
