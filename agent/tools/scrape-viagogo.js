// Ducket AI Galactica — Viagogo Ticket Scraper
// Apache 2.0 License
//
// Scrapes Viagogo for ticket listings using Patchright (undetected Playwright fork).
// Uses XHR response interception to capture Viagogo's internal API JSON.
// Viagogo uses Cloudflare Enterprise — mock fallback is the expected primary path.
//
// Run with: node agent/tools/scrape-viagogo.js "FIFA World Cup 2026"
// Import with: import { scrapeViagogo } from './scrape-viagogo.js'

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
// This makes `node scrape-viagogo.js | jq` and Phase 4 module import both work correctly.
const log = (...args) => console.error(...args);

// FIFA World Cup 2026 face value lookup table.
// Source: FIFA.com official pricing + ESPN/SI.com reporting (2026-03-19).
// Using 'default' (200 USD) when match round is unknown from listing context.
const FIFA_2026_FACE_VALUES = {
  group_stage: 120,         // USD — non-host nation group stage
  group_stage_host: 265,    // USD — USA/Canada/Mexico group stage
  round_of_16: 250,
  quarter_final: 500,
  semi_final: 800,
  final: 1000,
  default: 200,             // Fallback when match round cannot be determined
};

// SHA-256 URL hash sliced to 16 chars — used as deduplication Map key.
// Short slice is sufficient for collision-resistance at hackathon scale (~hundreds of listings).
function urlHash(url) {
  return createHash('sha256').update(url).digest('hex').slice(0, 16);
}

// Transform raw Viagogo API listing into the canonical SCAN-05 schema.
// Defensive field access covers both documented and undocumented Viagogo XHR shapes.
function toViagogoSchema(raw, eventName) {
  // Always parse price as float — strip all non-numeric/decimal characters first.
  // Viagogo API may return price as number, string, or nested amount object.
  const rawPrice = raw.Price ?? raw.price ?? raw.amount ?? raw.currentPrice?.amount ?? '0';
  const price = parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''));

  const faceValue = FIFA_2026_FACE_VALUES.default;
  // priceDeltaPct: how much above (positive) or below (negative) face value this listing is.
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

  return {
    platform: 'Viagogo',
    // Try multiple field paths — Viagogo API may use different seller field names
    seller: raw.SellerName ?? raw.sellerName ?? raw.seller?.name ?? 'unknown',
    price,                    // numeric USD — NEVER a string
    url: raw.Url ?? raw.url ?? raw.ListingUrl ?? 'https://www.viagogo.com',
    listingDate: new Date().toISOString(),
    redFlags,
    // Extra fields — consumed by Phase 5 classification engine
    eventName,
    section: raw.SectionName ?? raw.section ?? raw.seatDetails ?? null,
    quantity: raw.AvailableTickets ?? raw.quantity ?? null,
    faceValue,
    priceDeltaPct,
    source: 'live',           // 'live' vs 'mock' — classifiers must not trust 'mock' data
  };
}

// Mock fallback — returned when live scraping fails or is blocked by Cloudflare Enterprise.
// source: 'mock' label ensures downstream classifiers know this is synthetic data.
// Covers two fraud archetypes for demo: scalping (650 = 3x face) and scam (below face).
function getMockViagogo(eventName) {
  log('[Viagogo] WARNING: returning mock data — live scrape blocked by Cloudflare');
  return [
    {
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
    },
    {
      platform: 'Viagogo',
      seller: 'mock-viagogo-seller-002',
      price: 180,
      url: 'https://www.viagogo.com/ticket/mock-002',
      listingDate: new Date().toISOString(),
      redFlags: ['price below face value (possible scam)'],
      eventName,
      section: 'Category 3',
      quantity: 1,
      faceValue: 200,
      priceDeltaPct: -10,
      source: 'mock',
    },
  ];
}

// Main scraper function — exported for Phase 4 scan loop import.
// Never throws: any unhandled error falls through to the outer catch which returns mock data.
async function scrapeViagogo(eventName) {
  let browser;
  try {
    log(`[Viagogo] Scraping listings for: ${eventName}`);

    // Launch Patchright-patched Chromium.
    // Patchright patches: navigator.webdriver=false, removes --enable-automation flag,
    // avoids Runtime.enable CDP calls (largest Playwright detection vector vs Cloudflare).
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

    // XHR response interception — captures Viagogo's internal listing API JSON.
    // Viagogo is a React SPA that makes internal API calls on page load; we intercept
    // those responses to get structured JSON without brittle DOM selectors.
    // URL patterns based on DevTools inspection and community research:
    //   /api/ — Viagogo uses /api/ prefix for all internal REST endpoints
    //   listing, inventory, catalog, search, ticket — common endpoint fragments
    page.on('response', async (response) => {
      const url = response.url();
      const isListingEndpoint = (
        url.includes('/api/') ||
        url.includes('listing') ||
        url.includes('inventory') ||
        url.includes('catalog') ||
        url.includes('search') ||
        url.includes('ticket')
      );

      if (!isListingEndpoint || response.status() !== 200) return;

      try {
        const json = await response.json();
        // Viagogo may use different field names across API versions — check all known shapes
        const array = json.items ?? json.listings ?? json.results ?? json.data ?? json.Listings ?? json.Items;
        if (Array.isArray(array) && array.length > 0) {
          listings.push(...array);
          log(`[Viagogo] Intercepted ${array.length} listings from ${url}`);
        }
      } catch {
        // Response was not JSON (e.g. HTML Cloudflare challenge page) — skip silently
      }
    });

    // Navigate to Viagogo search. Cloudflare may challenge before serving results.
    // VIAGOGO_TIMEOUT env var for configurability without code changes.
    const timeout = parseInt(process.env.VIAGOGO_TIMEOUT ?? '30000');
    const searchUrl = `https://www.viagogo.com/search?q=${encodeURIComponent(eventName)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout });

    // Wait 3 seconds after networkidle — Viagogo may fire late XHR calls after initial load
    await setTimeout(3000);

    if (listings.length === 0) {
      // No XHR listing data intercepted — Cloudflare likely blocked or URL patterns didn't match.
      // Fall back to mock data rather than returning an empty array — demo never fails.
      log('[Viagogo] No listings intercepted from XHR — falling back to mock data');
      return getMockViagogo(eventName);
    }

    // Transform raw API fields to canonical SCAN-05 schema
    const transformed = listings.map((raw) => toViagogoSchema(raw, eventName));

    // Deduplicate by URL hash — prevents returning the same listing twice if multiple
    // XHR endpoints return overlapping data.
    const seen = new Map();
    const result = [];
    for (const listing of transformed) {
      const hash = urlHash(listing.url);
      if (!seen.has(hash)) {
        seen.set(hash, true);
        result.push(listing);
      }
    }

    log(`[Viagogo] Found ${result.length} unique listings`);
    return result;

  } catch (err) {
    // Any unhandled error (browser crash, Cloudflare block, navigation timeout, etc.)
    // Returns mock data so the caller always receives a valid array — demo never fails.
    log(`[Viagogo] Error: ${err.message} — returning mock data`);
    return getMockViagogo(eventName);
  } finally {
    // Always close browser — prevents Chromium processes from hanging in background
    await browser?.close();
  }
}

// CLI entry point — dual-mode: runs as CLI or is imported as ES module.
// process.argv[1] check ensures CLI code only runs when this file is the entry point,
// not when it is imported by the Phase 4 scan loop.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const eventName = process.argv[2] ?? 'FIFA World Cup 2026';
  scrapeViagogo(eventName)
    .then((listings) => {
      console.log(JSON.stringify(listings, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Viagogo] Fatal:', err.message);
      process.exit(1);
    });
}

export { scrapeViagogo };
