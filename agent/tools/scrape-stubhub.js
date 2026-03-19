// Ducket AI Galactica — StubHub Ticket Scraper
// Apache 2.0 License
//
// Scrapes StubHub for ticket listings using Patchright (undetected Playwright fork).
// Uses XHR response interception to capture StubHub's internal API JSON —
// no brittle DOM selectors. Falls back to labeled mock data if bot detection blocks.
//
// Run with: node agent/tools/scrape-stubhub.js "FIFA World Cup 2026"
// Import with: import { scrapeStubHub } from './scrape-stubhub.js'

import { chromium } from 'patchright';
import { createHash } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from project root (two levels up from agent/tools/)
const __dirname = dirname(fileURLToPath(import.meta.url));
// quiet: true suppresses the dotenv tip message on stdout — keeps JSON output clean when piped
dotenv.config({ path: join(__dirname, '../../.env'), quiet: true });

// All operational logs go to stderr so stdout stays clean for JSON output when piped.
// This makes `node scrape-stubhub.js | jq` and Phase 4 module import both work correctly.
const log = (...args) => console.error(...args);

// FIFA World Cup 2026 face value lookup table.
// Source: FIFA.com official pricing + ESPN/SI.com reporting (2026-03-19).
// Using 'default' (200 USD) when match round is unknown from listing context.
const FIFA_2026_FACE_VALUES = {
  group_stage: 120,        // USD — non-host nation group stage
  group_stage_host: 265,   // USD — USA/Canada/Mexico group stage
  round_of_16: 250,
  quarter_final: 500,
  semi_final: 800,
  final: 1000,
  default: 200,            // Fallback when match round cannot be determined
};

// SHA-256 URL hash sliced to 16 chars — used as deduplication Map key.
// Short slice is sufficient for collision-resistance at hackathon scale (~hundreds of listings).
function urlHash(url) {
  return createHash('sha256').update(url).digest('hex').slice(0, 16);
}

// Transform raw StubHub API listing into the canonical SCAN-05 schema.
// Defensive field access covers both the public OAuth API shape (sellerInfo.sellerName)
// and the internal XHR API shape (sellerId, seller.name) which may differ.
function toListingSchema(raw, eventName) {
  // Always parse price as float — StubHub API may return "$280.00" (string) or 280 (number).
  // Strip all non-numeric/decimal characters before parsing to handle any currency formatting.
  const rawPrice = raw.currentPrice?.amount ?? raw.listingPrice ?? raw.rawPrice ?? '0';
  const price = parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''));

  const faceValue = FIFA_2026_FACE_VALUES.default;
  // priceDeltaPct: how much above (positive) or below (negative) face value this listing is.
  // E.g. price=840 face=200 → priceDeltaPct=320 (320% above face = 4x face value)
  const priceDeltaPct = faceValue > 0 ? Math.round(((price - faceValue) / faceValue) * 100) : null;

  // Build human-readable red flag signals for the classification engine.
  const redFlags = [];
  if (priceDeltaPct !== null && priceDeltaPct > 200) {
    // e.g. "price 4x face value" — 300% above = 4x total
    redFlags.push(`price ${Math.round(priceDeltaPct / 100) + 1}x face value`);
  }
  if (priceDeltaPct !== null && priceDeltaPct > 100) {
    redFlags.push('significant markup over face value');
  }
  if (priceDeltaPct !== null && priceDeltaPct < 0) {
    redFlags.push('price below face value (possible scam)');
  }
  if (raw.quantity === 1) {
    redFlags.push('single ticket (odd quantity)');
  }

  return {
    platform: 'StubHub',
    // Try multiple field paths — internal XHR and OAuth API use different seller field names
    seller: raw.sellerInfo?.sellerName ?? raw.sellerId ?? raw.seller?.name ?? 'unknown',
    price,                    // numeric USD — NEVER a string
    url: raw.listingUrl ?? raw.url ?? raw.href ?? 'https://www.stubhub.com',
    listingDate: raw.listingDate ?? raw.datePosted ?? raw.createdAt ?? new Date().toISOString(),
    redFlags,
    // Extra fields — consumed by Phase 5 classification engine
    eventName,
    section: raw.sectionName ?? raw.section ?? null,
    quantity: raw.quantity ?? null,
    faceValue,
    priceDeltaPct,
    source: 'live',          // 'live' vs 'mock' — classifiers must not trust 'mock' data
  };
}

// Exponential backoff retry wrapper.
// Used to wrap page.goto() — retries on transient navigation failures (timeouts, network errors).
// Does NOT retry on bot detection (403 HTML page) — that is handled by the mock fallback.
async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      log(`[StubHub] Retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${err.message}`);
      await setTimeout(delay);
    }
  }
}

// Mock fallback — returned when live scraping fails or is blocked by Akamai Bot Manager.
// source: 'mock' label ensures downstream classifiers know this is synthetic data.
// Covers 4 fraud archetypes for demo visibility: scalping, scam (below face), legitimate, counterfeit.
function getMockListings(eventName) {
  log('[StubHub] WARNING: returning mock data — live scrape failed or was blocked');
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
    {
      platform: 'StubHub',
      seller: 'mock-seller-002',
      price: 50,
      url: 'https://www.stubhub.com/event/mock-002',
      listingDate: new Date().toISOString(),
      redFlags: ['price below face value (possible scam)'],
      eventName,
      section: 'Section 105',
      quantity: 4,
      faceValue: 200,
      priceDeltaPct: -75,
      source: 'mock',
    },
    {
      platform: 'StubHub',
      seller: 'mock-seller-003',
      price: 220,
      url: 'https://www.stubhub.com/event/mock-003',
      listingDate: new Date().toISOString(),
      redFlags: [],
      eventName,
      section: 'Section 310',
      quantity: 2,
      faceValue: 200,
      priceDeltaPct: 10,
      source: 'mock',
    },
    {
      platform: 'StubHub',
      seller: 'mock-seller-004',
      price: 150,
      url: 'https://www.stubhub.com/event/mock-004',
      listingDate: new Date().toISOString(),
      redFlags: ['price below face value (possible scam)', 'new seller account'],
      eventName,
      section: 'Lower Level',
      quantity: 1,
      faceValue: 200,
      priceDeltaPct: -25,
      source: 'mock',
    },
  ];
}

// Main scraper function — exported for Phase 4 scan loop import.
// Never throws: any unhandled error falls through to the outer catch which returns mock data.
async function scrapeStubHub(eventName) {
  // Outer try/catch: catches any error the inner try/finally doesn't handle.
  // This guarantees the function never throws to the caller — demo resilience.
  try {
    const seen = new Map(); // key: urlHash -> true; used for within-run URL deduplication
    let browser;

    try {
      log(`[StubHub] Scraping listings for: ${eventName}`);

      // Launch Patchright-patched Chromium.
      // Patchright patches: navigator.webdriver=false, removes --enable-automation flag,
      // avoids Runtime.enable CDP calls (largest Playwright detection vector vs Akamai).
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for CI / sandbox environments
      });

      const context = await browser.newContext({
        // Realistic macOS Chrome user agent to pass basic UA checks
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
      });

      const page = await context.newPage();
      const listings = [];

      // XHR response interception — captures StubHub's internal listing API JSON.
      // StubHub is a React SPA that makes internal API calls on page load; we intercept
      // those responses to get structured JSON without brittle DOM selectors.
      // URL patterns discovered by inspecting Network tab on stubhub.com:
      //   /search/inventory — search results inventory endpoint
      //   /catalog/search   — catalog search endpoint
      //   /listings         — direct listing endpoint
      //   /explore/events   — events exploration endpoint
      page.on('response', async (response) => {
        const url = response.url();
        const isListingEndpoint = (
          url.includes('/search/inventory') ||
          url.includes('/catalog/search') ||
          url.includes('/listings') ||
          url.includes('/explore/events')
        );

        if (!isListingEndpoint || response.status() !== 200) return;

        try {
          const json = await response.json();
          // StubHub uses different field names across API versions — check all known shapes
          const array = json.items ?? json.listing ?? json.listings ?? json.events ?? json.results ?? json.data;
          if (Array.isArray(array) && array.length > 0) {
            listings.push(...array);
            log(`[StubHub] Intercepted ${array.length} listings from ${url}`);
          }
        } catch {
          // Response was not JSON (e.g. HTML challenge page from Akamai) — skip silently
        }
      });

      // Navigate with retry — handles transient network failures.
      // Uses STUBHUB_TIMEOUT env var for configurability without code changes.
      const timeout = parseInt(process.env.STUBHUB_TIMEOUT ?? '30000');
      await withRetry(async () => {
        await page.goto(
          `https://www.stubhub.com/secure/search?q=${encodeURIComponent(eventName)}`,
          { waitUntil: 'networkidle', timeout }
        );
      });

      // Wait 2 seconds after networkidle — StubHub may fire late XHR calls after the
      // initial page load completes (lazy-loaded listing sections, pagination pre-fetch).
      await setTimeout(2000);

      if (listings.length === 0) {
        // No XHR listing data intercepted — Akamai likely blocked or the URL patterns
        // didn't match. Fall back to mock data rather than returning an empty array.
        log('[StubHub] No listings intercepted from XHR — falling back to mock data');
        return getMockListings(eventName);
      }

      // Transform raw API fields to canonical SCAN-05 schema
      const transformed = listings.map((raw) => toListingSchema(raw, eventName));

      // Deduplicate by URL hash — prevents returning the same listing twice if multiple
      // XHR endpoints return overlapping data (e.g. search + recommendations).
      const result = [];
      for (const listing of transformed) {
        const hash = urlHash(listing.url);
        if (!seen.has(hash)) {
          seen.set(hash, true);
          result.push(listing);
        }
      }

      log(`[StubHub] Found ${result.length} unique listings`);
      return result;

    } finally {
      // Always close browser — prevents Chromium processes from hanging in background
      // even if an error occurred mid-scrape. Optional chaining handles case where
      // browser launch itself failed (browser would be undefined).
      await browser?.close();
    }

  } catch (err) {
    // Outer catch: any unhandled error (browser crash, network timeout, etc.)
    // Returns mock data so the caller always receives a valid array — demo never fails.
    log(`[StubHub] Scrape error (${err.message}) — falling back to mock data`);
    return getMockListings(eventName);
  }
}

// CLI entry point — dual-mode: runs as CLI or is imported as ES module.
// process.argv[1] check ensures CLI code only runs when this file is the entry point,
// not when it is imported by the Phase 4 scan loop.
const eventName = process.argv[2] ?? 'FIFA World Cup 2026';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  scrapeStubHub(eventName)
    .then((listings) => {
      console.log(JSON.stringify(listings, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('[StubHub] Fatal:', err.message);
      process.exit(1);
    });
}

export { scrapeStubHub };
