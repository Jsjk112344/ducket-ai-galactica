# Phase 3: StubHub Scraper - Research

**Researched:** 2026-03-19
**Domain:** Browser automation / anti-bot bypass / web scraping
**Confidence:** MEDIUM-HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Scraping Strategy:** Headless browser via Patchright — faster, works in CI, sufficient with stealth patches
- **Data extraction:** XHR interception to capture StubHub's internal API responses — structured JSON, no brittle DOM selectors
- **Retry strategy:** Exponential backoff with 3 retries on rate limiting
- **Deduplication:** In-memory Map keyed by URL hash within a run
- **Output schema:** `redFlags` is an array of human-readable string signals (e.g. `["price 3x face value", "new seller account"]`)
- **Face value:** Hardcoded lookup table per event — FIFA WC 2026 face values are known
- **Extra output fields:** `eventName`, `section`, `quantity`, `faceValue`, `priceDelta%`
- **CLI output:** Pretty-print JSON to stdout + return array programmatically for scan loop import
- **Error handling:** If StubHub blocks despite Patchright, return mock data with `source: "mock"` flag — demo never fails, clearly labeled
- **Timeout:** 30 second timeout per page load
- **Logging:** Structured console.log with `[StubHub]` prefix for demo visibility
- **Config:** Optional env vars (`STUBHUB_TIMEOUT`, `STUBHUB_PROXY`) — keeps CLI clean

### Claude's Discretion
- Internal code organization within `agent/tools/`
- Patchright page interaction details (selectors, wait strategies)
- Mock data content and structure
- URL hash algorithm choice

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCAN-02 | Agent scrapes StubHub for ticket listings matching a given event name | Patchright launch + XHR interception of StubHub's internal listing endpoint; mock fallback ensures this always returns data |
| SCAN-05 | Each scraped listing returns structured data: platform, seller, price, URL, listing date, red flags | Output schema section defines all required fields; price parsing and redFlags computation patterns documented |
</phase_requirements>

---

## Summary

Phase 3 builds a single CLI tool (`agent/tools/scrape-stubhub.js`) that uses Patchright (an undetected Playwright fork) to load StubHub in a headless Chromium browser, intercepts the XHR/fetch API calls StubHub makes to its internal listing endpoint, parses the JSON response into a structured schema, and returns deduplicated listings with fraud-relevant fields computed. The tool must handle bot detection gracefully by falling back to mock data if StubHub blocks the request.

StubHub uses **Akamai Bot Manager** as its primary anti-bot layer (the most sophisticated vendor, relying heavily on TLS fingerprinting and behavioral analysis). Patchright's key differentiator is avoiding `Runtime.enable` CDP leaks — the largest single detection vector for Playwright-based automation. For a hackathon context the primary risk is StubHub returning a challenge page instead of listings; the mock fallback (`source: "mock"`) fully addresses this for demo resilience.

The XHR interception approach (using `page.on('response')`) avoids all DOM parsing brittleness — StubHub's internal API returns clean JSON with all required fields. The main implementation unknowns are: (1) the exact StubHub internal API URL pattern (must be found by inspecting Network tab on live site), and (2) whether Akamai allows even Patchright through on CI headless. The mock fallback makes both unknowns non-blocking.

**Primary recommendation:** Use `patchright` npm package (drop-in Playwright replacement), launch with `headless: 'new'` or `headless: false` with `channel: 'chrome'`, intercept responses matching `**/api*listings*` or `**/search/inventory*`, and fall back to hardcoded mock data if no API response arrives within 30 seconds.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| patchright | 1.58.2 | Undetected Playwright — stealth Chromium automation | Locked decision; drop-in Playwright replacement with anti-detection patches; patches Runtime.enable leak, disables AutomationControlled flag |
| node:crypto | built-in | SHA-256 URL hash for deduplication Map key | Zero-dependency; `createHash('sha256').update(url).digest('hex')` is idiomatic |
| node:url | built-in | URL normalization before hashing | Ensures `?utm_` variants hash to same key |
| dotenv | ^17.3.1 | Load `STUBHUB_TIMEOUT`, `STUBHUB_PROXY` env vars | Already in agent/package.json |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:process | built-in | CLI argv parsing (`process.argv[2]`) | Entry-point event name argument |
| node:timers/promises | built-in | `setTimeout` for exponential backoff | Avoids third-party dep for retry delays |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| patchright | playwright + stealth plugin | playwright-extra-stealth was deprecated Feb 2026; patchright is the community successor |
| patchright | camoufox | Firefox-based; Python primary; no Node.js package at comparable maturity |
| XHR interception | DOM scraping | DOM selectors break whenever StubHub redesigns; XHR captures structured JSON at source |
| in-memory Map | SQLite / file cache | Overkill for hackathon; Map is per-run dedup only, sufficient for SCAN-05 |

**Installation:**
```bash
# From agent/ workspace
npm install patchright
npx patchright install chromium
# OR for better stealth (requires Chrome installed):
npx patchright install chrome
```

**Version verification (confirmed 2026-03-19):**
```bash
npm view patchright version
# => 1.58.2
```

---

## Architecture Patterns

### Recommended Project Structure
```
agent/
├── tools/
│   └── scrape-stubhub.js     # CLI entry point (SCAN-02, SCAN-05)
└── src/
    └── scrapers/
        └── stubhub.js        # (optional) extracted scraper module if scan loop needs it
```

The context locks the CLI entry point as `agent/tools/scrape-stubhub.js`. The scraper logic can live entirely in that file for this phase, since Phase 4 will import it via module export.

### Pattern 1: Patchright Browser Launch

**What:** Launch Chromium in headless mode with stealth patches.
**When to use:** Always — this is the locked approach.

```javascript
// Source: https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-nodejs
import { chromium } from 'patchright';

const browser = await chromium.launch({
  headless: true,   // Patchright patches the headless detection vectors
  // channel: 'chrome',  // Uncomment if npx patchright install chrome was run
  args: ['--no-sandbox', '--disable-setuid-sandbox'], // CI environments
});
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  viewport: { width: 1280, height: 800 },
});
const page = await context.newPage();
```

**Stealth note:** Patchright patches `navigator.webdriver = false`, removes `--enable-automation` flag, and avoids `Runtime.enable` CDP calls by using isolated ExecutionContexts. These are the three primary detection signals for Playwright.

### Pattern 2: XHR Response Interception

**What:** Listen for StubHub's internal API responses using `page.on('response')`.
**When to use:** This is the locked extraction strategy.

```javascript
// Source: https://playwright.dev/docs/network
const listings = [];

page.on('response', async (response) => {
  const url = response.url();
  // StubHub internal API — exact pattern must be verified by inspecting Network tab
  // Common patterns observed: /api/catalog/listings, /search/inventory/v2
  if (url.includes('/listings') || url.includes('/inventory')) {
    try {
      const json = await response.json();
      // json.listing or json.listings array — structure varies by endpoint
      const raw = json?.listing ?? json?.listings ?? [];
      listings.push(...raw);
    } catch {
      // Response was not JSON (HTML challenge page) — skip
    }
  }
});

await page.goto(`https://www.stubhub.com/search?q=${encodeURIComponent(eventName)}`, {
  timeout: parseInt(process.env.STUBHUB_TIMEOUT ?? '30000'),
  waitUntil: 'networkidle',
});
```

**Critical:** The exact StubHub API URL must be found by opening stubhub.com in Chrome DevTools → Network tab → filter XHR → search for "FIFA World Cup". This is a one-time discovery step in Wave 0 / Task 1. The URL pattern changes periodically — do not hardcode without verifying live.

### Pattern 3: Exponential Backoff with Retry

**What:** Retry on bot detection / rate limit responses.
**When to use:** Wrap the `page.goto()` call.

```javascript
import { setTimeout } from 'node:timers/promises';

async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      console.log(`[StubHub] Retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${err.message}`);
      await setTimeout(delay);
    }
  }
}
```

### Pattern 4: URL Hash Deduplication

**What:** In-memory Map keyed by URL hash for dedup within a run.
**When to use:** Applied before pushing listings to output array.

```javascript
import { createHash } from 'node:crypto';

function urlHash(url) {
  return createHash('sha256').update(url).digest('hex').slice(0, 16);
}

const seen = new Map(); // key: urlHash -> true

function deduplicate(listings) {
  const result = [];
  for (const listing of listings) {
    const key = urlHash(listing.url);
    if (!seen.has(key)) {
      seen.set(key, true);
      result.push(listing);
    }
  }
  return result;
}
```

### Pattern 5: Output Schema Transform

**What:** Map raw StubHub API fields to the required SCAN-05 schema.
**When to use:** After extracting raw listings from intercepted JSON.

```javascript
// Required SCAN-05 fields: platform, seller, price, url, listingDate, redFlags
// Extra fields locked in CONTEXT.md: eventName, section, quantity, faceValue, priceDelta%

const FIFA_2026_FACE_VALUES = {
  'group_stage': 120,       // USD — lowest group stage ticket (non-host match)
  'group_stage_host': 265,  // USD — group stage with USA/Canada/Mexico
  'round_of_16': 250,
  'quarter_final': 500,
  'semi_final': 800,
  'final': 1000,
  'default': 200,           // Fallback when match round unknown
};

function toListingSchema(raw, eventName) {
  const price = parseFloat(String(raw.currentPrice?.amount ?? raw.listingPrice ?? '0').replace(/[^0-9.]/g, ''));
  const faceValue = FIFA_2026_FACE_VALUES['default']; // Improve with match round detection
  const priceDeltaPct = faceValue > 0 ? Math.round(((price - faceValue) / faceValue) * 100) : null;

  const redFlags = [];
  if (priceDeltaPct !== null && priceDeltaPct > 200) redFlags.push(`price ${Math.round(priceDeltaPct / 100)}x face value`);
  if (priceDeltaPct !== null && priceDeltaPct > 100) redFlags.push('significant markup over face value');
  if (raw.quantity === 1) redFlags.push('single ticket (odd quantity)');
  // seller account age unavailable from StubHub API without auth; skip for now

  return {
    platform: 'StubHub',
    seller: raw.sellerInfo?.sellerName ?? raw.sellerId ?? 'unknown',
    price,                              // numeric USD
    url: raw.listingUrl ?? raw.url ?? `https://www.stubhub.com/event/${raw.eventId}`,
    listingDate: raw.listingDate ?? raw.datePosted ?? new Date().toISOString(),
    redFlags,
    // Extra fields
    eventName,
    section: raw.sectionName ?? raw.section ?? null,
    quantity: raw.quantity ?? null,
    faceValue,
    priceDeltaPct,
    source: 'live',                     // vs 'mock' in fallback
  };
}
```

### Pattern 6: Mock Fallback

**What:** Return labeled mock data if scraping fails.
**When to use:** Catch block wrapping the entire scraper — ensures demo never fails.

```javascript
function getMockListings(eventName) {
  console.log('[StubHub] WARNING: returning mock data — live scrape failed or was blocked');
  return [
    {
      platform: 'StubHub',
      seller: 'mock-seller-001',
      price: 840,
      url: 'https://www.stubhub.com/event/mock-001',
      listingDate: new Date().toISOString(),
      redFlags: ['price 4x face value', 'significant markup over face value'],
      eventName,
      section: 'Section 201',
      quantity: 2,
      faceValue: 200,
      priceDeltaPct: 320,
      source: 'mock',
    },
    // Add 2-3 more varied mock entries: legitimate, marginal, flagged
  ];
}
```

### Pattern 7: CLI Entry Point Structure

**What:** Matches the tool pattern from `agent/tools/wallet-smoke-test.js`.
**When to use:** Always — follow established project conventions.

```javascript
// agent/tools/scrape-stubhub.js
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const eventName = process.argv[2] ?? 'FIFA World Cup 2026';

async function scrapeStubHub(eventName) {
  // ... core logic
}

// Dual-mode: run as CLI or import as module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  scrapeStubHub(eventName)
    .then((listings) => {
      console.log(JSON.stringify(listings, null, 2));
    })
    .catch((err) => {
      console.error('[StubHub] Fatal:', err.message);
      process.exit(1);
    });
}

export { scrapeStubHub };  // Phase 4 scan loop imports this
```

### Anti-Patterns to Avoid

- **DOM scraping with CSS selectors:** StubHub is a React SPA; selectors break on any UI update. XHR interception is locked and correct.
- **`page.waitForSelector()` as primary data gate:** Use `waitUntil: 'networkidle'` or `waitForResponse()` on the API URL instead.
- **Throwing on bot detection:** Must fall back to mock data. Never propagate bot-detection errors to stdout unhandled.
- **Synchronous price parsing:** `parseFloat("$280")` returns `NaN`. Always strip currency symbols first.
- **Hardcoding the XHR endpoint without verification:** StubHub changes their internal API paths. Discover the live URL in Task 1 before writing the route matcher.
- **ESM `require()` calls:** The agent workspace uses `"type": "module"`. Use `import` syntax throughout.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bot detection bypass | Custom `--disable-blink-features` flags list | `patchright` | Patchright patches Runtime.enable leak, AutomationControlled, Console API — the 3 primary detection vectors; manual patching misses dozens of edge cases |
| Retry logic | Custom sleep loop | `node:timers/promises` + try/catch loop | No new deps; built-in async sleep is clean and correct |
| Price parsing | Regex from scratch | `parseFloat(str.replace(/[^0-9.]/g, ''))` | One-liner; no library needed for USD amounts |
| URL hashing | MD5 or custom | `node:crypto createHash('sha256')` | Built-in, collision-resistant, zero dep |

**Key insight:** The anti-bot problem is the only hard engineering problem in this phase. Patchright fully addresses it for the common case; everything else is straightforward data transformation.

---

## Common Pitfalls

### Pitfall 1: Akamai Blocks Headless Chromium

**What goes wrong:** StubHub returns a challenge page (HTTP 403, or HTML with "Access Denied") instead of the search results page. The XHR interception fires but receives no listing JSON. The listings array is empty.
**Why it happens:** Akamai uses TLS fingerprinting + behavioral analysis. Patchright patches the JS-level signals but not the TLS fingerprint. On CI machines without residential IPs, Akamai may still challenge.
**How to avoid:** The mock fallback (`getMockListings()`) handles this completely for demo purposes. If the `listings` array is empty after `networkidle`, return mock data immediately. Do not throw.
**Warning signs:** `page.goto()` resolves but no `response` events fire for `/listings` or `/inventory` URLs.

### Pitfall 2: XHR Endpoint URL Pattern Wrong

**What goes wrong:** `page.on('response', ...)` handler never fires the relevant branch because the URL pattern check (`url.includes('/listings')`) doesn't match StubHub's actual endpoint.
**Why it happens:** StubHub's internal API path is not publicly documented. The path must be discovered by live inspection.
**How to avoid:** In Task 1 (discovery), open `https://www.stubhub.com/search?q=FIFA+World+Cup+2026` in Chrome DevTools → Network → XHR/Fetch tab. Find the request that returns an array of listing objects. Note the exact URL path. Code the `includes()` check to match it.
**Warning signs:** `listings.length === 0` after `networkidle` on a live run with no error thrown.

### Pitfall 3: `headless: true` vs `headless: 'new'` vs `headless: false`

**What goes wrong:** Patchright launched with wrong headless option causes either detection or crashes.
**Why it happens:** Playwright 1.40+ introduced `headless: 'new'` as an improved headless mode. Patchright 1.58.2 tracks Playwright 1.58.2. The recommended maximum-stealth config is `headless: false` with `channel: 'chrome'`, but this requires a display (fails on CI without Xvfb).
**How to avoid:** Default to `headless: true` (Patchright patches this sufficiently for most cases). Allow override via `STUBHUB_HEADLESS=false` env var. Document that `headless: false` requires a display.
**Warning signs:** `Error: Target closed` or `Error: spawn chrome ENOENT` when using `channel: 'chrome'` without installing Chrome.

### Pitfall 4: ESM vs CJS Module Mismatch

**What goes wrong:** `require('patchright')` fails because `agent/package.json` has `"type": "module"`.
**Why it happens:** The patchright npm package ships both CJS and ESM; but the agent workspace is ESM-only.
**How to avoid:** Always use `import { chromium } from 'patchright'`. Never use `require()`.
**Warning signs:** `Error [ERR_REQUIRE_ESM]: require() of ES Module` at startup.

### Pitfall 5: `browser.close()` Not Called on Error

**What goes wrong:** Chromium process hangs in background after a failed run, consuming memory.
**Why it happens:** Early throws bypass `browser.close()`.
**How to avoid:** Use try/finally to guarantee cleanup.

```javascript
let browser;
try {
  browser = await chromium.launch(/* ... */);
  // ... scrape
} finally {
  await browser?.close();
}
```

### Pitfall 6: Price Parsed as String

**What goes wrong:** Success criteria requires `price` as a numeric value. StubHub API may return `"$280.00"` or `280` depending on the endpoint version.
**Why it happens:** API response field types are not guaranteed.
**How to avoid:** Always apply `parseFloat(String(raw).replace(/[^0-9.]/g, ''))` and validate `!isNaN(result)`.

---

## Code Examples

Verified patterns from official sources:

### Playwright response interception (verified: playwright.dev/docs/network)
```javascript
page.on('response', async (response) => {
  if (response.url().includes('/api/listings')) {
    const json = await response.json();
    console.log(json);
  }
});
```

### Playwright waitForResponse (verified: playwright.dev/docs/network)
```javascript
// Use when you know the exact URL — more reliable than .on('response') race condition
const responsePromise = page.waitForResponse(
  (resp) => resp.url().includes('/listings') && resp.status() === 200
);
await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
const response = await responsePromise;
const json = await response.json();
```

### Patchright launch (verified: github.com/Kaliiiiiiiiii-Vinyzu/patchright-nodejs)
```javascript
import { chromium } from 'patchright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
// API is identical to Playwright from this point
```

### URL hash deduplication (verified: nodejs.org/api/crypto.html)
```javascript
import { createHash } from 'node:crypto';
const key = createHash('sha256').update(url).digest('hex').slice(0, 16);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| playwright-extra + stealth plugin | patchright (standalone) | Feb 2026 | playwright-extra-stealth deprecated; patchright is community successor |
| `headless: true` standard Playwright | patchright `headless: true` with Runtime.enable patch | 2024 | Removes largest Playwright detection vector |
| DOM CSS selector scraping | XHR/fetch API response interception | Ongoing | Brittle selectors eliminated; structured JSON at source |
| StubHub public API (OAuth2) | XHR interception of internal API | N/A | Public API requires OAuth approval; internal XHR is unauthenticated during page load |

**Deprecated/outdated:**
- `playwright-extra` + `puppeteer-extra-plugin-stealth`: Deprecated Feb 2026; JS-level patching approach became unsustainable as Akamai moved to TLS fingerprinting.
- StubHub public OAuth API (`api.stubhub.com/search/inventory/v2`): Still exists but requires API key registration. XHR interception captures the same data without OAuth.

---

## FIFA World Cup 2026 Face Value Reference

This data drives the `faceValue` lookup table and `redFlags` computation:

| Match Type | Face Value Range (USD) | Notes |
|------------|----------------------|-------|
| Group Stage (non-host) | $60–$265 | Cat 4 supporter entry at $60 |
| Group Stage (USA/Canada/Mexico) | $265–$2,735 | Host nation premium |
| Round of 16 | $250–$980 | Top tier ~$980 |
| Quarter Final | $500–$1,775 | |
| Semi Final | $800–$3,295 | |
| Final (MetLife Stadium) | $1,000–$6,730 | Cat 1 up to $6,730 officially |

**Source:** FIFA.com official pricing + ESPN/SI.com reporting (March 2026). MEDIUM confidence — dynamic pricing means these shift; use as lookup baseline, not exact truth.

**StubHub secondary market premiums observed (March 2026):**
- Group stage resale: from $163 (slightly above face) to $5,324 (Category 3 opening match)
- Final: $2,000–$143,750 (speculative sellers)
- Threshold for `redFlags`: 2x face value is reasonable detection floor; 3x is strong signal.

---

## Open Questions

1. **Exact StubHub internal XHR endpoint URL**
   - What we know: StubHub uses React/Next.js with internal API calls. Likely matches `/api/catalog/listings`, `/search/inventory/v2`, or similar.
   - What's unclear: Current exact path — must be discovered by live Network tab inspection.
   - Recommendation: Wave 0 / Task 1 includes a discovery step: open stubhub.com in Chrome DevTools, search for "FIFA World Cup 2026", record the XHR URL. Hardcode in the `url.includes()` check.

2. **Patchright success rate against Akamai on CI**
   - What we know: Patchright bypasses JS-level detection vectors but Akamai also uses TLS fingerprinting. Datacenter IPs are often blocked.
   - What's unclear: Whether a CI run (GitHub Actions, standard residential) would pass or be challenged.
   - Recommendation: Mock fallback is the correct answer. Do not block Phase 3 on this — if Patchright fails, mock data with `source: "mock"` is labeled clearly and demo-safe.

3. **StubHub JSON response structure for `seller` field**
   - What we know: The official OAuth API returns `sellerInfo.sellerName` and `sellerId`. The internal XHR may use different field names.
   - What's unclear: Exact field names on the internal API.
   - Recommendation: Log the raw JSON response during Task 1 discovery. The schema transform (`toListingSchema`) should defensively access multiple candidate field paths.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None in agent/ workspace — contracts use Hardhat/Mocha |
| Config file | None — Wave 0 creates it |
| Quick run command | `node agent/tools/scrape-stubhub.js "FIFA World Cup 2026"` |
| Full suite command | `node agent/tools/scrape-stubhub.js "FIFA World Cup 2026"` (same — CLI is the test) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCAN-02 | Scrapes StubHub for event name, returns listing array | smoke | `node agent/tools/scrape-stubhub.js "FIFA World Cup 2026"` | ❌ Wave 0 |
| SCAN-02 | Returns at least one listing object | smoke | Check exit code 0 + JSON array length > 0 | ❌ Wave 0 |
| SCAN-05 | Each listing has: platform, seller, price, url, listingDate, redFlags | unit | Schema validation function in scraper + logged output | ❌ Wave 0 |
| SCAN-05 | Price is numeric USD (not string) | unit | `typeof listing.price === 'number' && !isNaN(listing.price)` guard in schema transform | ❌ Wave 0 |
| success-4 | Re-run within 5 min returns deduplicated results | smoke | Run twice, compare url hashes — no duplicates | ❌ Wave 0 |

**Note:** The success criteria in the phase brief (`node agent/tools/scrape-stubhub.js "FIFA World Cup 2026"` returns valid JSON) is itself the integration test. A formal test framework (Vitest/Mocha) is not required for this phase — the CLI is the verifiable artifact. The Phase 3 VERIFICATION.md confirms success criteria via direct observation.

### Sampling Rate
- **Per task commit:** `node agent/tools/scrape-stubhub.js "FIFA World Cup 2026"`
- **Per wave merge:** Same CLI command
- **Phase gate:** CLI returns at minimum the mock listings without throwing; ideally returns live listings

### Wave 0 Gaps
- [ ] `agent/tools/scrape-stubhub.js` — main deliverable, does not exist yet
- [ ] Discovery step: live StubHub XHR endpoint URL must be found and hardcoded before writing the route matcher
- [ ] `npx patchright install chromium` — must be run after `npm install patchright`
- [ ] Add `patchright` to `agent/package.json` dependencies

---

## Sources

### Primary (HIGH confidence)
- `github.com/Kaliiiiiiiiii-Vinyzu/patchright-nodejs` — installation, API, ESM import, headless options, isolatedContext parameter
- `playwright.dev/docs/network` — `page.on('response')`, `page.waitForResponse()`, `page.route()` patterns
- `nodejs.org/api/crypto.html` — `createHash` API for URL hashing

### Secondary (MEDIUM confidence)
- `deepwiki.com/Kaliiiiiiiiii-Vinyzu/patchright-nodejs/2-installation-and-usage` — verified install commands and headless config
- `scrapfly.io/blog/answers/how-to-capture-xhr-requests-playwright` — XHR interception Node.js pattern
- `si.com/soccer/2026-world-cup-tickets-prices-group-stage-final-revealed` — FIFA WC 2026 face value prices
- `automatio.ai/how-to-scrape/stubhub` — confirmed Akamai Bot Manager as StubHub's primary anti-bot vendor

### Tertiary (LOW confidence — needs live validation)
- StubHub internal XHR endpoint URL pattern — must be discovered via Network tab; not in any documentation
- Patchright success rate against Akamai specifically — community reports vary; no authoritative benchmark

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — patchright npm package confirmed at 1.58.2; all other libs are Node.js built-ins
- Architecture: HIGH — XHR interception pattern is standard Playwright API; mock fallback is straightforward; schema transform is deterministic
- Pitfalls: MEDIUM — Akamai behavior is empirical; XHR endpoint URL requires live discovery
- Face value lookup table: MEDIUM — prices sourced from multiple reporting outlets on 2026-03-19; FIFA dynamic pricing means values may shift

**Research date:** 2026-03-19
**Valid until:** 2026-03-26 (7 days — StubHub bot detection configuration changes frequently)
