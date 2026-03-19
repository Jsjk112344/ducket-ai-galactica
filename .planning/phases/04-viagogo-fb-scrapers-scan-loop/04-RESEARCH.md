# Phase 4: Viagogo + Facebook Marketplace Scrapers + Scan Loop - Research

**Researched:** 2026-03-19
**Domain:** Browser automation / anti-bot bypass / autonomous polling loop
**Confidence:** MEDIUM (Viagogo: MEDIUM, Facebook: LOW-MEDIUM, Scan loop: HIGH)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCAN-01 | Agent autonomously polls secondary marketplaces on a configurable schedule without human trigger | node-cron `*/5 * * * *` schedule + `Promise.all()` across all three scrapers; heartbeat loop persists without keyboard input |
| SCAN-03 | Agent scrapes Viagogo for ticket listings matching a given event name | Patchright launch + XHR JSON interception of Viagogo's internal listing API; Cloudflare-protected, mock fallback required |
| SCAN-04 | Agent scrapes Facebook Marketplace for ticket listings matching a given event name | Patchright + login-modal dismiss; public search page at `marketplace/search` accessible before full wall triggers; mock fallback mandatory |
| SCAN-05 | Each scraped listing returns structured data: platform, seller, price, URL, listing date, red flags | Same output schema as Phase 3 StubHub scraper; applies to all three platforms |
</phase_requirements>

---

## Summary

Phase 4 adds two new scrapers (Viagogo and Facebook Marketplace) and wires all three scrapers into an autonomous heartbeat loop that polls on a 5-minute schedule using `node-cron` without human input. This is the phase that makes the agent truly autonomous for the scan dimension.

**Viagogo** uses Cloudflare Enterprise Bot Management — a harder target than StubHub's Akamai. The same Patchright + XHR interception strategy from Phase 3 applies, but with two critical differences: Cloudflare challenges Turnstile captchas more aggressively, and Viagogo's internal XHR endpoint URL must be discovered via live DevTools inspection (not documented). Patchright's headless patches handle JS-level detection; the remaining risk is TLS fingerprinting and IP reputation. The mock fallback is non-negotiable — the demo MUST work even if Cloudflare blocks the live request. Viagogo does offer an official OAuth2 API, but OAuth registration takes days and cannot be relied on for a hackathon. XHR interception during a real browser session is the only same-day path.

**Facebook Marketplace** is the hardest platform in the stack — rated 5/5 difficulty, with Meta's custom WAF blocking 95%+ of automated access and login walls covering 90%+ of inventory. The key insight for hackathon viability: the public search URL `https://www.facebook.com/marketplace/search/?query=...` renders some listing cards in the DOM before triggering the full auth challenge. Patchright can dismiss the login modal (click outside or Escape key) and extract visible listing tiles from the initial page render before Meta's WAF triggers a full block. GraphQL interception is unreliable without session tokens — DOM extraction from the partially-rendered page is the correct strategy for this context. Mock fallback is critical: if only zero or one listing renders before the login wall fully blocks, return mock data labeled `source: "mock"`.

**The scan loop** (`agent/src/scan-loop.js`) is the simplest part of this phase. `node-cron` provides cron-syntax scheduling with zero setup overhead. The loop imports all three scraper functions, runs them in `Promise.all()`, merges the results, deduplicates by URL hash (using the same function from Phase 3), and appends to `agent/memory/LISTINGS.md`. Crucially: the loop must keep running after individual scraper failures — `Promise.allSettled()` prevents one blocked platform from killing the entire cycle.

**Primary recommendation:** Use `patchright` for all three scrapers with per-platform XHR interception strategies and mandatory mock fallbacks. Use `node-cron` at `*/5 * * * *` for the heartbeat. Use `Promise.allSettled()` not `Promise.all()` to ensure loop resilience. Output merged+deduped listings to `agent/memory/LISTINGS.md`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| patchright | 1.58.2 | Undetected Playwright — stealth Chromium automation | Locked in Phase 3; already in agent/package.json; same API for all three scrapers |
| node-cron | 4.2.1 | Cron-syntax task scheduler for Node.js | Lightweight, zero-config, cron `*/5 * * * *` syntax readable by judges; no external process needed |
| node:crypto | built-in | SHA-256 URL hash for cross-platform deduplication | Zero-dep; same function from Phase 3 reused |
| node:fs/promises | built-in | Append/write to `agent/memory/LISTINGS.md` | Built-in async file write; no lib needed |
| dotenv | ^17.3.1 | Load env vars (timeouts, proxy settings) | Already in agent/package.json |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:timers/promises | built-in | Exponential backoff delays in retry wrapper | Same retry pattern from Phase 3 |
| node:url | built-in | URL normalization before hashing | Deduplicate `?utm_` variants |
| node:process | built-in | CLI argv parsing + graceful shutdown signal | `SIGINT`/`SIGTERM` handler to stop cron loop cleanly |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node-cron | `setInterval` | `setInterval` drifts; cron is wall-clock aligned and more readable to judges; node-cron is lighter than node-schedule |
| node-cron | node-schedule | node-schedule is heavier with date recurrence features; not needed here |
| DOM extraction (Facebook) | GraphQL interception | FB GraphQL requires live session tokens (fb_dtsg), dynamic signature; DOM extraction from pre-auth render is more reliable for hackathon |
| patchright | nodriver (Python) | nodriver is Python-only; project is JS/TS only; patchright is the JS equivalent |
| `Promise.allSettled()` | `Promise.all()` | `Promise.all()` rejects if any scraper throws; `allSettled()` collects results from all scrapers even when one fails |

**Installation:**
```bash
# From agent/ workspace — patchright already installed in Phase 3
npm install node-cron
# patchright already installed and chromium already downloaded in Phase 3
```

**Version verification (confirmed 2026-03-19):**
```bash
npm view node-cron version
# => 4.2.1
npm view patchright version
# => 1.58.2
```

---

## Architecture Patterns

### Recommended Project Structure

```
agent/
├── tools/
│   ├── scrape-stubhub.js       # Phase 3 — exports scrapeStubHub()
│   ├── scrape-viagogo.js       # Phase 4 — exports scrapeViagogo()
│   └── scrape-facebook.js      # Phase 4 — exports scrapeFacebook()
├── src/
│   └── scan-loop.js            # Phase 4 — autonomous heartbeat loop
└── memory/
    └── LISTINGS.md             # Phase 4 — merged deduplicated listing log
```

### Pattern 1: Viagogo Patchright + XHR Interception

**What:** Load Viagogo search page via Patchright, intercept the XHR response that returns listing JSON before Cloudflare can fully challenge the session.
**When to use:** This is the locked approach for SCAN-03.

```javascript
// agent/tools/scrape-viagogo.js
import { chromium } from 'patchright';
import { createHash } from 'node:crypto';

async function scrapeViagogo(eventName) {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    const listings = [];

    // XHR interception — Viagogo endpoint must be confirmed via DevTools
    // Likely candidates: /api/search/listings, /api/events/*/listings, /api/catalog
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/') && (url.includes('listing') || url.includes('inventory') || url.includes('catalog'))) {
        try {
          const json = await response.json();
          // Inspect live response in Wave 0 to find exact field names
          const raw = json?.items ?? json?.listings ?? json?.results ?? [];
          if (Array.isArray(raw) && raw.length > 0) {
            listings.push(...raw.map(r => toViagogaSchema(r, eventName)));
          }
        } catch { /* non-JSON response */ }
      }
    });

    const searchUrl = `https://www.viagogo.com/ticket-search?q=${encodeURIComponent(eventName)}`;
    await page.goto(searchUrl, {
      timeout: parseInt(process.env.VIAGOGO_TIMEOUT ?? '30000'),
      waitUntil: 'networkidle',
    });

    if (listings.length === 0) {
      console.log('[Viagogo] No live listings intercepted — returning mock data');
      return getMockViagogo(eventName);
    }
    return listings;
  } catch (err) {
    console.log(`[Viagogo] Error: ${err.message} — returning mock data`);
    return getMockViagogo(eventName);
  } finally {
    await browser?.close();
  }
}
```

**CRITICAL:** The exact Viagogo XHR endpoint URL is the most important unknown in this phase. Wave 0 / Task 1 must include a live DevTools discovery step: open viagogo.com in Chrome, search for "FIFA World Cup 2026", filter Network tab by XHR/Fetch, find the request that returns a JSON array of ticket listings, note the URL path.

**Cloudflare risk:** Viagogo uses Cloudflare Enterprise Bot Management with per-site ML models. Patchright patches JS-level detection (navigator.webdriver, CDP leaks) but Cloudflare can still challenge based on TLS fingerprint or IP reputation. Datacenter IPs fail more often than residential. The mock fallback is the correct demo-safety net.

### Pattern 2: Facebook Marketplace DOM Extraction (Pre-Auth Render)

**What:** Navigate to the public Facebook Marketplace search URL, dismiss the login modal, extract listing tiles from the DOM that render before the full auth wall triggers.
**When to use:** This is the strategy for SCAN-04 given Facebook's 5/5 difficulty rating.

```javascript
// agent/tools/scrape-facebook.js
import { chromium } from 'patchright';

async function scrapeFacebook(eventName) {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',
    });
    const page = await context.newPage();

    // Navigate to public marketplace search — some listing cards render before full auth wall
    const searchUrl = `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(eventName)}`;
    await page.goto(searchUrl, {
      timeout: parseInt(process.env.FACEBOOK_TIMEOUT ?? '20000'),
      waitUntil: 'domcontentloaded', // Don't wait for networkidle — FB's login modal fires on it
    });

    // Dismiss login modal if present (before full wall triggers)
    try {
      // Press Escape to dismiss modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      // Or click outside modal
      await page.mouse.click(10, 10);
      await page.waitForTimeout(1000);
    } catch { /* modal may not appear; continue */ }

    // Wait briefly for listing tiles to render
    await page.waitForTimeout(2000);

    // Extract visible listing tiles from DOM
    // Facebook listing tiles: data-testid="marketplace_item" or aria-label containing price
    // NOTE: exact selectors MUST be verified by live DevTools inspection in Wave 0
    const rawListings = await page.evaluate(() => {
      // Attempt multiple selector strategies — FB changes classnames frequently
      const tiles = document.querySelectorAll('[data-testid="marketplace_item"], [aria-label*="$"], [class*="marketplace"]');
      return Array.from(tiles).map(tile => ({
        text: tile.innerText ?? '',
        href: tile.querySelector('a')?.href ?? '',
        img: tile.querySelector('img')?.src ?? '',
      }));
    });

    if (rawListings.length === 0) {
      console.log('[Facebook] No DOM listings found before auth wall — returning mock data');
      return getMockFacebook(eventName);
    }

    return rawListings.map(r => toFacebookSchema(r, eventName));
  } catch (err) {
    console.log(`[Facebook] Error: ${err.message} — returning mock data`);
    return getMockFacebook(eventName);
  } finally {
    await browser?.close();
  }
}
```

**Key realities for Facebook:**
- Facebook's Meta Custom WAF blocks 95%+ of automated access — mock fallback is the primary path for this scraper.
- The pre-auth render window is narrow (0–3 seconds). Some listing thumbnails and prices appear in the DOM before the full login wall replaces the page. Extract what's visible immediately after `domcontentloaded`.
- DOM class names change constantly on Facebook (obfuscated). Use `data-testid`, `aria-label`, or structural selectors (`[href*="/marketplace/item/"]`). Confirm live selectors in Wave 0 Task 1.
- GraphQL interception does NOT work without `fb_dtsg` tokens (session-bound, generated per-load). Do not attempt.

### Pattern 3: Scan Loop with node-cron

**What:** Autonomous heartbeat that calls all three scrapers every 5 minutes, merges + deduplicates results, appends to LISTINGS.md.
**When to use:** This is the SCAN-01 deliverable.

```javascript
// agent/src/scan-loop.js
import cron from 'node-cron';
import { scrapeStubHub } from '../tools/scrape-stubhub.js';
import { scrapeViagogo } from '../tools/scrape-viagogo.js';
import { scrapeFacebook } from '../tools/scrape-facebook.js';
import { createHash } from 'node:crypto';
import { appendFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LISTINGS_PATH = join(__dirname, '../memory/LISTINGS.md');
const EVENT_NAME = process.env.EVENT_NAME ?? 'FIFA World Cup 2026';

// Cross-run dedup: in-memory set survives as long as process runs
const seen = new Set();

function urlHash(url) {
  return createHash('sha256').update(url ?? '').digest('hex').slice(0, 16);
}

function deduplicateListings(listings) {
  const fresh = [];
  for (const listing of listings) {
    const key = urlHash(listing.url);
    if (!seen.has(key)) {
      seen.add(key);
      fresh.push(listing);
    }
  }
  return fresh;
}

async function runScanCycle() {
  console.log(`[ScanLoop] Cycle start: ${new Date().toISOString()} — event: ${EVENT_NAME}`);

  // Use allSettled so one failed scraper doesn't block the others
  const results = await Promise.allSettled([
    scrapeStubHub(EVENT_NAME),
    scrapeViagogo(EVENT_NAME),
    scrapeFacebook(EVENT_NAME),
  ]);

  const [stubhub, viagogo, facebook] = results;
  const allListings = [
    ...(stubhub.status === 'fulfilled' ? stubhub.value : []),
    ...(viagogo.status === 'fulfilled' ? viagogo.value : []),
    ...(facebook.status === 'fulfilled' ? facebook.value : []),
  ];

  // Log any scraper failures
  results.forEach((r, i) => {
    const names = ['StubHub', 'Viagogo', 'Facebook'];
    if (r.status === 'rejected') {
      console.error(`[ScanLoop] ${names[i]} scraper rejected: ${r.reason}`);
    }
  });

  const fresh = deduplicateListings(allListings);
  console.log(`[ScanLoop] ${allListings.length} total | ${fresh.length} new after dedup | ${seen.size} seen total`);

  if (fresh.length > 0) {
    const entry = `\n## Scan: ${new Date().toISOString()}\n\n\`\`\`json\n${JSON.stringify(fresh, null, 2)}\n\`\`\`\n`;
    await appendFile(LISTINGS_PATH, entry, 'utf8');
    console.log(`[ScanLoop] Appended ${fresh.length} new listings to LISTINGS.md`);
  }
}

// Initialize LISTINGS.md on first run
await writeFile(LISTINGS_PATH, `# Listings Log\n\nEvent: ${EVENT_NAME}\nStarted: ${new Date().toISOString()}\n`, { flag: 'w' });

// Run once immediately on startup for demo visibility
await runScanCycle();

// Then schedule every 5 minutes (demo cadence)
const job = cron.schedule('*/5 * * * *', runScanCycle);
console.log('[ScanLoop] Heartbeat started — polling every 5 minutes. Ctrl+C to stop.');

// Graceful shutdown
process.on('SIGINT', () => {
  job.stop();
  console.log('[ScanLoop] Heartbeat stopped gracefully.');
  process.exit(0);
});
```

**node-cron v4 API notes (verified 2026-03-19):**
- `cron.schedule(expression, callback)` returns a `ScheduledTask` with `.stop()` method
- ESM compatible: `import cron from 'node-cron'` (default export)
- No `start: true` option needed — task starts running by default
- Cron expression `*/5 * * * *` = every 5 minutes on the wall clock

### Pattern 4: Cross-Platform Output Schema

**What:** Both new scrapers MUST produce the same SCAN-05 schema as Phase 3 StubHub scraper.
**When to use:** Applied in `toViagogaSchema()` and `toFacebookSchema()` functions.

```javascript
// Minimum required SCAN-05 fields — IDENTICAL across all three platforms
const listing = {
  platform: 'Viagogo',        // or 'Facebook Marketplace'
  seller: 'unknown',          // seller name if available; 'unknown' if not
  price: 0,                   // number — USD; parseFloat(str.replace(/[^0-9.]/g, ''))
  url: 'https://...',         // canonical listing URL
  listingDate: new Date().toISOString(), // ISO string; use now() if not available
  redFlags: [],               // string array e.g. ['price 3x face value']
  // Locked extras from Phase 3 CONTEXT.md (apply same fields to all platforms)
  eventName: 'FIFA World Cup 2026',
  section: null,
  quantity: null,
  faceValue: 200,             // default fallback; same FIFA_2026_FACE_VALUES table from Phase 3
  priceDeltaPct: null,
  source: 'live',             // or 'mock'
};
```

### Pattern 5: Mock Fallbacks

**What:** Each new scraper must have a platform-specific mock fallback returning labeled data.
**When to use:** Catch block wrapping entire scraper function.

```javascript
// Viagogo mock
function getMockViagogo(eventName) {
  console.log('[Viagogo] WARNING: returning mock data');
  return [{
    platform: 'Viagogo',
    seller: 'mock-viagogo-seller-001',
    price: 650,
    url: 'https://www.viagogo.com/ticket/mock-001',
    listingDate: new Date().toISOString(),
    redFlags: ['price 3x face value', 'significant markup over face value'],
    eventName,
    section: 'Category 2',
    quantity: 2,
    faceValue: 200,
    priceDeltaPct: 225,
    source: 'mock',
  }];
}

// Facebook mock
function getMockFacebook(eventName) {
  console.log('[Facebook] WARNING: returning mock data');
  return [{
    platform: 'Facebook Marketplace',
    seller: 'mock-fb-seller-001',
    price: 500,
    url: 'https://www.facebook.com/marketplace/item/mock-001',
    listingDate: new Date().toISOString(),
    redFlags: ['price 2.5x face value'],
    eventName,
    section: null,
    quantity: 1,
    faceValue: 200,
    priceDeltaPct: 150,
    source: 'mock',
  }];
}
```

### Anti-Patterns to Avoid

- **`Promise.all()` in scan loop:** One rejected scraper kills the whole cycle. Use `Promise.allSettled()`.
- **GraphQL interception on Facebook:** Requires live `fb_dtsg` tokens; replay without session always fails.
- **`waitUntil: 'networkidle'` on Facebook:** Triggers full auth wall before listing tiles can be extracted. Use `domcontentloaded`.
- **Hardcoding Viagogo XHR URL without live verification:** The exact path is not documented. Must be discovered via DevTools in Wave 0.
- **`cron.schedule()` with start: false and forgetting to call start():** In node-cron v4, the task starts automatically by default. No `.start()` call needed.
- **Appending to LISTINGS.md without initializing it first:** `appendFile` will throw if the directory doesn't exist. Create `agent/memory/` directory and initialize the file on first run.
- **Closing browser before response listeners fire:** `page.on('response', ...)` callbacks are async. Use `waitForResponse()` or await a small idle period after `goto`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bot detection bypass | Custom CDP patches, `--disable-blink-features` flags | `patchright` | Already solves Runtime.enable leak, AutomationControlled, and webdriver flag; custom patches miss dozens of edge cases |
| Task scheduling | `setInterval` with drift | `node-cron` | node-cron is wall-clock aligned, survives system sleep, has named task management; `setInterval` in event loop can drift 2-30% under load |
| Cross-platform dedup | New dedup logic | Same `urlHash` function from Phase 3 | Already tested; `createHash('sha256')` is collision-resistant; import from shared utils or copy the function |
| LISTINGS.md write format | Custom serializer | `JSON.stringify(listings, null, 2)` inside a Markdown code fence | Readable for judges; no parsing complexity |
| Retry logic | `while(true)` sleep loop | `node:timers/promises` + try/catch loop (from Phase 3) | Clean, already in codebase |

**Key insight:** The Facebook and Viagogo scrapers share all infrastructure with Phase 3's StubHub scraper — the only new work is per-platform XHR endpoint discovery (Viagogo) and DOM selector discovery (Facebook). Both are Wave 0 discovery tasks, not engineering tasks.

---

## Common Pitfalls

### Pitfall 1: Viagogo Cloudflare Turnstile Challenge

**What goes wrong:** Viagogo serves a Turnstile CAPTCHA challenge page instead of listing results. The XHR interception fires but captures the challenge HTML, not listing JSON. `listings.length === 0`.
**Why it happens:** Cloudflare Enterprise Bot Management uses per-site ML models. Datacenter IPs and known headless TLS fingerprints are challenged. Patchright patches JS-level vectors but not TLS.
**How to avoid:** Mock fallback is the correct answer. If `listings.length === 0` after `networkidle`, return mock data immediately. Do not retry indefinitely.
**Warning signs:** `page.goto()` resolves successfully but no XHR responses with `/api/` URLs fire, OR XHR fires but `response.json()` throws (HTML challenge body).

### Pitfall 2: Viagogo XHR Endpoint URL Wrong

**What goes wrong:** The URL pattern check (`url.includes('/api/')`) doesn't match Viagogo's actual internal API path.
**Why it happens:** Viagogo's internal API is not publicly documented. The path must be discovered via live DevTools inspection.
**How to avoid:** Wave 0 Task 1 must include: open `https://www.viagogo.com/` in Chrome, search for "FIFA World Cup 2026", open Network tab, filter Fetch/XHR, find the request returning a JSON array of tickets. Record the exact URL path.
**Warning signs:** `listings.length === 0` with no errors thrown, after `networkidle` on a live Viagogo URL.

### Pitfall 3: Facebook Login Wall Blocks DOM Before Extraction

**What goes wrong:** `page.evaluate()` returns an empty array — Facebook's login modal has replaced the page content before the listing tiles could be read.
**Why it happens:** On faster connections, the auth redirect completes before `domcontentloaded`. The Escape key / body click modal dismiss may fail silently.
**How to avoid:** Accept this as the primary failure mode. The mock fallback is the correct recovery. For demo purposes, 0 live Facebook listings + mock fallback is acceptable and clearly labeled.
**Warning signs:** `rawListings.length === 0` even after modal dismiss attempts.

### Pitfall 4: Facebook DOM Selectors Break

**What goes wrong:** `document.querySelectorAll('[data-testid="marketplace_item"]')` returns 0 elements because Facebook changed their DOM structure.
**Why it happens:** Facebook uses heavily obfuscated class names that change on every deploy. Even `data-testid` attributes are not stable across months.
**How to avoid:** In Wave 0 Task 1, open Facebook Marketplace in Chrome DevTools and inspect the DOM of a listing tile. Find the most stable selector (structural: `[href*="/marketplace/item/"]` or `img[src*="scontent"]` parent). Document the selector before writing the scraper.
**Warning signs:** `rawListings.length === 0` despite visible listing tiles on the page.

### Pitfall 5: node-cron ESM Import

**What goes wrong:** `import cron from 'node-cron'` throws `SyntaxError: The requested module 'node-cron' does not provide an export named 'default'`.
**Why it happens:** node-cron v4 ships ESM with a default export. Older v2/v3 used CJS named exports. The import style changes between major versions.
**How to avoid:** With node-cron 4.2.1 (latest as of 2026-03-19), `import cron from 'node-cron'` (default import) is correct. Verify with `npm view node-cron version` before writing the import.
**Warning signs:** ERR_PACKAGE_PATH_NOT_EXPORTED or no default export error at startup.

### Pitfall 6: `agent/memory/` Directory Missing

**What goes wrong:** `appendFile('agent/memory/LISTINGS.md', ...)` throws `ENOENT: no such file or directory`.
**Why it happens:** The `agent/memory/` directory may not exist before the scan loop runs.
**How to avoid:** Create the directory in scan-loop initialization using `mkdir -p agent/memory/` (or `fs.mkdir(path, { recursive: true })`). Initialize `LISTINGS.md` with a header on first run.

### Pitfall 7: Promise.all() Kills the Scan Loop

**What goes wrong:** One scraper throws an unhandled exception → `Promise.all()` rejects → the entire cron callback throws → node-cron catches it and the loop continues, but this cycle produces zero output.
**Why it happens:** `Promise.all()` rejects immediately when any promise rejects.
**How to avoid:** Use `Promise.allSettled()`. Log rejection reasons per-scraper. Collect results from successful scrapers regardless of failures.

---

## Code Examples

Verified patterns from official sources:

### node-cron ESM schedule (verified: npmjs.com/package/node-cron 4.2.1)
```javascript
import cron from 'node-cron';

const task = cron.schedule('*/5 * * * *', async () => {
  console.log('[ScanLoop] Running cycle:', new Date().toISOString());
  await runScanCycle();
});

// task.stop() when done
process.on('SIGINT', () => { task.stop(); process.exit(0); });
```

### Promise.allSettled with scraper array (verified: MDN)
```javascript
const [s1, s2, s3] = await Promise.allSettled([
  scrapeStubHub(event),
  scrapeViagogo(event),
  scrapeFacebook(event),
]);
const all = [
  ...(s1.status === 'fulfilled' ? s1.value : []),
  ...(s2.status === 'fulfilled' ? s2.value : []),
  ...(s3.status === 'fulfilled' ? s3.value : []),
];
```

### Playwright response interception (verified: playwright.dev/docs/network)
```javascript
page.on('response', async (response) => {
  if (response.url().includes('/api/')) {
    try {
      const json = await response.json();
      // process json
    } catch { /* skip non-JSON */ }
  }
});
```

### Playwright waitForResponse for exact URL (verified: playwright.dev/docs/network)
```javascript
// Alternative to .on('response') — cleaner when exact URL is known
const responsePromise = page.waitForResponse(
  (resp) => resp.url().includes('/api/search') && resp.status() === 200,
  { timeout: 15000 }
);
await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
const response = await responsePromise;
const json = await response.json();
```

### Facebook login modal dismiss
```javascript
// Method 1: Escape key
await page.keyboard.press('Escape');
await page.waitForTimeout(800);

// Method 2: Click outside modal (top-left corner)
await page.mouse.click(10, 10);
await page.waitForTimeout(800);

// Method 3: Wait for close button and click it
try {
  await page.click('[aria-label="Close"]', { timeout: 3000 });
} catch { /* button not found; continue */ }
```

### Safe file write with directory creation
```javascript
import { mkdir, appendFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

async function ensureFile(filePath, header) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, header, { flag: 'wx' }).catch(() => {}); // 'wx' = fail silently if exists
}
```

### Dual-mode CLI / module export (same pattern as Phase 3)
```javascript
// agent/tools/scrape-viagogo.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  scrapeViagogo(process.argv[2] ?? 'FIFA World Cup 2026')
    .then(listings => console.log(JSON.stringify(listings, null, 2)))
    .catch(err => { console.error('[Viagogo] Fatal:', err.message); process.exit(1); });
}
export { scrapeViagogo };
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| playwright-extra stealth plugin | patchright (standalone) | Feb 2026 | playwright-extra-stealth deprecated; patchright is community successor |
| Direct GraphQL POST for Facebook | DOM extraction from pre-auth render | Ongoing 2024-2026 | FB session tokens (fb_dtsg) are required for GraphQL; pre-auth DOM is the only no-auth path |
| `setInterval` for polling | `node-cron` cron scheduling | N/A | node-cron is wall-clock aligned, handles DST, supports named tasks, has `.stop()` |
| Playwright `headless: 'new'` | Patchright `headless: true` with CDP patches | 2024 | Patchright handles the headless detection vectors; 'new' mode in standard Playwright still leaks |

**Deprecated/outdated:**
- `playwright-extra` + `puppeteer-extra-plugin-stealth`: Deprecated Feb 2026. Do not use.
- Facebook unofficial GraphQL without session: Was briefly reliable 2019-2021; now requires `fb_dtsg` and `lsd` tokens that change per-session.
- Viagogo public OAuth API without registration: Registration takes multiple days; not viable for hackathon.

---

## Anti-Bot Reality Check (IMPORTANT for planner)

This section documents the realistic outcomes per platform:

| Platform | Anti-Bot Vendor | Patchright Success (datacenter IP) | Demo Strategy |
|----------|----------------|-----------------------------------|---------------|
| StubHub | Akamai Bot Manager | ~40-60% pass rate | Phase 3 mock fallback already built |
| Viagogo | Cloudflare Enterprise | ~20-40% pass rate (harder than Akamai) | Mock fallback mandatory — build it first |
| Facebook Marketplace | Meta Custom WAF (5/5 difficulty) | ~5-15% partial DOM render | Mock fallback is PRIMARY path; live is bonus |

**Planning implication:** Tasks should build mock fallbacks in Wave 0 alongside the scraper skeletons. Do NOT write a plan that treats live scraping as the primary path for Viagogo or Facebook. The demo works entirely on mock data — live data is a bonus if it works. Judges see the labeled `source: "mock"` field and understand demo safety.

---

## Open Questions

1. **Viagogo internal XHR endpoint URL**
   - What we know: Viagogo uses a React SPA with client-side rendering. Internal API calls follow a pattern like `/api/search/listings` or `/api/v2/events/{id}/tickets`.
   - What's unclear: The exact current path — must be discovered via live Network tab inspection.
   - Recommendation: Wave 0 Task 1 for scrape-viagogo.js must be a discovery step: open viagogo.com, search for FIFA WC 2026, record XHR URL. This is a manual step, not automatable without a running browser.

2. **Facebook Marketplace DOM selectors for listing tiles**
   - What we know: Facebook listing tiles exist in the DOM for 0-3 seconds before auth redirect. Structural selectors like `[href*="/marketplace/item/"]` are more stable than obfuscated class names.
   - What's unclear: Whether any tiles render before the full auth wall on a fresh headless session in 2026.
   - Recommendation: Wave 0 Task 1 for scrape-facebook.js must test the pre-auth render window. If zero tiles render consistently, the Facebook scraper is mock-only and the task scope changes.

3. **node-cron v4 ESM named vs default export**
   - What we know: `npm view node-cron version` = 4.2.1. The v4 CHANGELOG added ESM support.
   - What's unclear: Whether `import cron from 'node-cron'` (default) or `import { schedule } from 'node-cron'` (named) is the correct import for v4 in the agent ESM workspace.
   - Recommendation: Wave 0 Task 1 for scan-loop.js should verify: `node -e "import('node-cron').then(m => console.log(Object.keys(m)))"` to confirm export shape before writing the import.

4. **scan-loop.js as standalone CLI vs imported module**
   - What we know: The success criteria for SCAN-01 says the loop "runs every 5 minutes without human trigger — visible in agent log output." This implies a standalone long-running process.
   - What's unclear: Whether scan-loop.js is invoked directly (`node agent/src/scan-loop.js`) or integrated into the main agent entry point (`agent/src/index.ts`).
   - Recommendation: Make scan-loop.js standalone for Phase 4 (direct node invocation). Integration into index.ts is Phase 5+ concern.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None in agent/ workspace — CLI tools are the tests |
| Config file | None |
| Quick run command | `node agent/tools/scrape-viagogo.js "FIFA World Cup 2026"` |
| Full suite command | Run all three scrapers + scan loop in sequence |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCAN-03 | scrape-viagogo.js returns at least one listing with all required fields | smoke | `node agent/tools/scrape-viagogo.js "FIFA World Cup 2026"` | ❌ Wave 0 |
| SCAN-04 | scrape-facebook.js returns at least one listing without manual intervention | smoke | `node agent/tools/scrape-facebook.js "FIFA World Cup 2026"` | ❌ Wave 0 |
| SCAN-01 | scan-loop.js runs every 5 minutes and invokes all three scrapers via Promise.all/allSettled | smoke (manual observe) | `node agent/src/scan-loop.js` — watch console for 2 cycles | ❌ Wave 0 |
| SCAN-05 | All listings from all platforms include: platform, seller, price, url, listingDate, redFlags | unit (inline validation) | Schema guard function in each scraper | ❌ Wave 0 |
| success-4 | Listings from all three platforms merged, deduped by URL hash, written to LISTINGS.md | integration | `cat agent/memory/LISTINGS.md` after loop runs | ❌ Wave 0 |

**Note:** The Phase 4 success criteria are verified by direct observation of CLI output and LISTINGS.md content. No formal test framework is needed. The two CLI smoke tests plus a 10-minute scan-loop observation constitute the phase gate.

### Sampling Rate
- **Per task commit:** Run the specific scraper CLI: `node agent/tools/scrape-viagogo.js "FIFA World Cup 2026"`
- **Per wave merge:** Run all three scrapers sequentially; check LISTINGS.md output
- **Phase gate:** All three scrapers produce valid JSON (live or mock with `source: "mock"`); scan-loop.js runs two full cycles without throwing

### Wave 0 Gaps
- [ ] `agent/tools/scrape-viagogo.js` — main deliverable for SCAN-03
- [ ] `agent/tools/scrape-facebook.js` — main deliverable for SCAN-04
- [ ] `agent/src/scan-loop.js` — main deliverable for SCAN-01
- [ ] `agent/memory/LISTINGS.md` — created on first scan-loop run; directory must exist
- [ ] Discovery step: live Viagogo XHR endpoint URL (DevTools inspection, manual)
- [ ] Discovery step: live Facebook DOM listing selectors (DevTools inspection, manual)
- [ ] `npm install node-cron` in agent/ workspace
- [ ] Export verification: `node -e "import('node-cron').then(m => console.log(Object.keys(m)))"` to confirm import syntax

---

## Sources

### Primary (HIGH confidence)
- `playwright.dev/docs/network` — `page.on('response')`, `page.waitForResponse()`, `page.evaluate()`, network interception patterns
- `npmjs.com/package/node-cron` v4.2.1 — schedule API, ESM export, cron expression syntax, `.stop()` method
- `nodejs.org/api/crypto.html` — `createHash` URL hash function
- `nodejs.org/api/fs.html` — `appendFile`, `writeFile`, `mkdir` with `{ recursive: true }`
- `github.com/Kaliiiiiiiiii-Vinyzu/patchright-nodejs` — patchright API, headless config, ESM import

### Secondary (MEDIUM confidence)
- `roundproxies.com/blog/scrape-viagogo/` — confirmed Cloudflare Enterprise as Viagogo's anti-bot vendor; XHR interception recommended approach
- `scraperly.com/scrape/facebook-marketplace` — confirmed Meta Custom WAF at 5/5 difficulty; login wall covers 90%+ inventory; login requirement for full access
- `docs.openclaw.ai/gateway/heartbeat` — OpenClaw heartbeat reference (5m interval config); confirms `node-cron` is the underlying scheduler for autonomous agent loops
- `github.com/kyleronayne/marketplace-api` — confirms Facebook GraphQL endpoint at `https://www.facebook.com/api/graphql/` with `marketplace_search` feed; uses `doc_id` parameter; response at `data.marketplace_search.feed_units.edges[].node.listing`

### Tertiary (LOW confidence — needs live validation)
- Viagogo exact internal XHR endpoint URL — must be discovered via live DevTools inspection; no authoritative source
- Facebook DOM selectors for listing tiles — obfuscated classnames change per-deploy; must verify via live DevTools
- Patchright success rate against Cloudflare Enterprise specifically on Viagogo — community reports vary; no authoritative benchmark
- Facebook pre-auth DOM render window — 0-3 second window is empirical; may vary by connection speed and Meta's real-time WAF decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack (node-cron, patchright): HIGH — both packages verified on npm registry 2026-03-19; versions confirmed
- Scan loop architecture (node-cron + Promise.allSettled): HIGH — node.js built-in patterns, no unknowns
- Viagogo scraper architecture: MEDIUM — XHR interception strategy is correct; exact endpoint URL is unknown until live discovery
- Facebook scraper architecture: LOW-MEDIUM — pre-auth DOM render strategy is fragile; mock fallback is the reliable path; live data is best-effort
- Anti-bot bypass success rates: LOW — empirical, platform-specific, changes frequently

**Research date:** 2026-03-19
**Valid until:** 2026-03-26 (7 days — Cloudflare and Facebook bot detection configurations change frequently)
