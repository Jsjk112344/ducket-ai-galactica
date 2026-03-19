// Ducket AI Galactica — Facebook Marketplace Ticket Scraper
// Apache 2.0 License
//
// Scrapes Facebook Marketplace for ticket listings using Patchright.
// Uses DOM extraction from the pre-auth render window — Facebook's login wall
// blocks most content, so mock fallback is the expected primary path.
// Meta Custom WAF rated 5/5 difficulty; ~5-15% success rate on datacenter IPs.
//
// Run with: node agent/tools/scrape-facebook.js "FIFA World Cup 2026"
// Import with: import { scrapeFacebook } from './scrape-facebook.js'

import { chromium } from 'patchright';
import { createHash } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateFacebookListings } from './mock-data.js';

// Load .env from project root (two levels up from agent/tools/)
const __dirname = dirname(fileURLToPath(import.meta.url));
// quiet: true suppresses the dotenv tip message on stdout — keeps JSON output clean when piped
dotenv.config({ path: join(__dirname, '../../.env'), quiet: true });

// All operational logs go to stderr so stdout stays clean for JSON output when piped.
// This makes `node scrape-facebook.js | jq` and Phase 4 module import both work correctly.
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

// Transform raw Facebook DOM listing tile into the canonical SCAN-05 schema.
// Facebook doesn't expose structured price data — must parse from visible text.
function toFacebookSchema(raw, eventName) {
  // Parse price from raw text — Facebook renders price as "$500" or "500" in the tile text.
  // Also accept pre-extracted price field from evaluate() if available.
  const rawPrice = raw.price ?? raw.text?.match(/\$[\d,.]+/)?.[0] ?? '0';
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
    platform: 'Facebook Marketplace',
    seller: raw.seller ?? 'unknown',
    price,                    // numeric USD — NEVER a string
    url: raw.href ?? raw.url ?? 'https://www.facebook.com/marketplace',
    listingDate: new Date().toISOString(),
    redFlags,
    // Extra fields — consumed by Phase 5 classification engine
    eventName,
    section: null,            // Facebook listings don't have venue sections
    quantity: 1,              // Default for marketplace individual listings
    faceValue,
    priceDeltaPct,
    source: 'live',           // 'live' vs 'mock' — classifiers must not trust 'mock' data
  };
}

// Mock fallback — returned when live scraping fails or is blocked by Meta WAF.
// source: 'mock' label ensures downstream classifiers know this is synthetic data.
// Covers two fraud archetypes for demo: scalping (500 = 2.5x face) and scam (below face).
function getMockFacebook(eventName) {
  log('[Facebook] WARNING: returning mock data — login wall blocked DOM extraction');
  return generateFacebookListings(eventName, 3);
}

// Main scraper function — exported for Phase 4 scan loop import.
// Never throws: any unhandled error falls through to the outer catch which returns mock data.
async function scrapeFacebook(eventName) {
  let browser;
  try {
    log(`[Facebook] Scraping listings for: ${eventName}`);

    // Launch Patchright-patched Chromium.
    // Patchright patches: navigator.webdriver=false, removes --enable-automation flag,
    // avoids Runtime.enable CDP calls (largest Playwright detection vector vs Meta WAF).
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for CI / sandbox environments
    });

    const context = await browser.newContext({
      // Realistic macOS Chrome user agent to pass basic UA checks
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',  // Reduces risk of FB redirecting to local language version
    });

    const page = await context.newPage();

    // Navigate to Facebook Marketplace public search URL.
    // CRITICAL: Use 'domcontentloaded' NOT 'networkidle' — FB's login modal fires on networkidle,
    // replacing page content before listing tiles can be extracted.
    const timeout = parseInt(process.env.FACEBOOK_TIMEOUT ?? '20000');
    const searchUrl = `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(eventName)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout });

    // Dismiss login modal — FB shows modal overlay in first few seconds of page load.
    // Wrap each method in try/catch; modal may not appear on all sessions.

    // Method 1: Escape key — most universal modal dismiss
    try { await page.keyboard.press('Escape'); await setTimeout(1000); } catch { /* silent */ }
    // Method 2: Click outside modal (top-left corner away from modal overlay)
    try { await page.mouse.click(10, 10); await setTimeout(1000); } catch { /* silent */ }
    // Method 3: Click close button if present — explicit dismiss
    try { await page.click('[aria-label="Close"]', { timeout: 3000 }); } catch { /* not found */ }

    // Wait for listing tiles to render in the pre-auth window
    await setTimeout(2000);

    // DOM extraction — pull listing tiles visible before auth wall fully triggers.
    // Multiple selector strategies because Facebook obfuscates class names per-deploy.
    // Structural selectors ([href*="/marketplace/item/"]) are most stable across deploys.
    const rawListings = await page.evaluate(() => {
      // Multiple selector strategies — FB changes classnames frequently
      const selectors = [
        '[href*="/marketplace/item/"]',
        '[data-testid="marketplace_item"]',
        '[aria-label*="$"]',
      ];
      const tiles = new Set();
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach(el => tiles.add(el.closest('a') ?? el));
      }
      return Array.from(tiles).map(tile => ({
        text: tile.innerText ?? '',
        href: tile.href ?? tile.querySelector('a')?.href ?? '',
        price: tile.innerText?.match(/\$[\d,.]+/)?.[0] ?? '',
        seller: 'unknown',  // Seller info not available before auth wall
      }));
    });

    if (rawListings.length === 0) {
      // Pre-auth render window produced no tiles — login wall triggered before extraction.
      // This is the expected primary failure mode at ~95% block rate. Return mock data.
      log('[Facebook] No DOM listings found before auth wall — returning mock data');
      return getMockFacebook(eventName);
    }

    // Filter out tiles without a valid marketplace item URL
    const withHref = rawListings.filter(r => r.href && r.href.includes('/marketplace/'));

    if (withHref.length === 0) {
      log('[Facebook] All extracted tiles had empty hrefs — returning mock data');
      return getMockFacebook(eventName);
    }

    // Transform raw DOM tiles to canonical SCAN-05 schema
    const transformed = withHref.map((raw) => toFacebookSchema(raw, eventName));

    // Deduplicate by URL hash — prevents returning the same tile twice across selectors
    const seen = new Map();
    const result = [];
    for (const listing of transformed) {
      const hash = urlHash(listing.url);
      if (!seen.has(hash)) {
        seen.set(hash, true);
        result.push(listing);
      }
    }

    log(`[Facebook] Found ${result.length} listings from DOM`);
    return result;

  } catch (err) {
    // Any unhandled error (browser crash, navigation timeout, Meta WAF block, etc.)
    // Returns mock data so the caller always receives a valid array — demo never fails.
    log(`[Facebook] Error: ${err.message} — returning mock data`);
    return getMockFacebook(eventName);
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
  scrapeFacebook(eventName)
    .then((listings) => {
      console.log(JSON.stringify(listings, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Facebook] Fatal:', err.message);
      process.exit(1);
    });
}

export { scrapeFacebook };
