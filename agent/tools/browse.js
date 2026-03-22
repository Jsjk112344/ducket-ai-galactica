// Ducket AI Galactica — OpenClaw Browser Scraper
// Apache 2.0 License
//
// Uses OpenClaw's browser control (real Chrome via CDP) to navigate ticket
// marketplaces and extract listings. Unlike Patchright headless scrapers,
// this runs through the user's actual browser profile — no automation flags,
// real cookies, real fingerprint. Anti-bot tools (Cloudflare, Akamai, DataDome)
// see a normal Chrome session.
//
// Two-step scraping: search page → find event URLs → navigate into event → extract tickets.
// Falls back to Patchright scrapers if OpenClaw browser is not available.
//
// NOTE: All evaluate() calls use String.raw`` to prevent template literals from eating
// backslashes in regex patterns (e.g. \d, \s, \w, \$).

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { generateStubHubListings, generateViagogoListings, generateFacebookListings } from './mock-data.js';

const log = (...args) => console.error(...args);

// Face values by round — used to calculate priceDeltaPct for classification
const FACE_VALUES = {
  'Group Stage': 200, 'Round of 16': 250, 'Quarter-Final': 500,
  'Semi-Final': 800, 'Final': 1500, default: 200,
};
const SGD_TO_USD = 0.75;

function urlHash(url) {
  return createHash('sha256').update(url).digest('hex').slice(0, 16);
}

// ── OpenClaw Browser CLI Wrappers ────────────────────────────────────────
// Uses execFileSync with args array — no shell, so JS code passes verbatim.

function browserCmd(args, timeoutMs = 30000) {
  try {
    return execFileSync('npx', ['openclaw', 'browser', ...args], {
      encoding: 'utf8', timeout: timeoutMs, stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    throw new Error(`browser ${args[0]} failed: ${err.stderr?.slice(0, 200) || err.message.slice(0, 200)}`);
  }
}

function ensureBrowser() {
  try {
    const status = browserCmd(['status'], 5000);
    if (status.includes('running: true')) return true;
    log('[Browse] Starting OpenClaw browser...');
    browserCmd(['start'], 15000);
    const check = browserCmd(['status'], 5000);
    return check.includes('running: true');
  } catch {
    return false;
  }
}

function navigate(url) {
  browserCmd(['navigate', url], 30000);
}

// Evaluate JS in the browser page — returns parsed JSON or raw string.
function evaluate(fn) {
  const result = browserCmd(['evaluate', '--fn', fn], 15000);
  try { return JSON.parse(result); } catch { return result; }
}

// ── Schema Builder ──────────────────────────────────────────────────────

function toSchema(raw, platform, eventName) {
  const price = typeof raw.priceUSD === 'number' ? raw.priceUSD : parseFloat(String(raw.price || '0').replace(/[^0-9.]/g, '')) || 0;
  const faceValue = FACE_VALUES[raw.round] || FACE_VALUES.default;
  const priceDeltaPct = faceValue > 0 ? Math.round(((price - faceValue) / faceValue) * 100) : null;

  const redFlags = [];
  if (priceDeltaPct > 200) redFlags.push(`price ${Math.round(priceDeltaPct / 100) + 1}x face value`);
  if (priceDeltaPct > 100) redFlags.push('significant markup over face value');
  if (priceDeltaPct < 0) redFlags.push('price below face value (possible scam)');

  return {
    platform, price, faceValue, priceDeltaPct, redFlags,
    seller: raw.seller || `${platform} Seller`,
    url: raw.url || `https://www.${platform.toLowerCase().replace(/ /g, '')}.com`,
    listingDate: new Date().toISOString(),
    eventName: raw.eventLabel || eventName,
    section: raw.section || null,
    quantity: raw.quantity || 2,
    source: 'live-browse',
    sellerAge: null,
    sellerTransactions: null,
    sellerVerified: null,
    listingDescription: raw.description || null,
    transferMethod: 'unspecified',
  };
}

// ── StubHub ─────────────────────────────────────────────────────────────

async function browseStubHub(eventName) {
  log('[Browse] StubHub: searching with OpenClaw browser...');
  navigate(`https://www.stubhub.com/secure/search?q=${encodeURIComponent(eventName)}`);
  await sleep(4000);

  // Step 1: Find event URLs from search results — filter for FIFA World Cup matches only
  const allEventUrls = evaluate(String.raw`() => {
    const links = document.querySelectorAll('a[href*="/event/"]');
    return Array.from(links).map(l => ({ href: l.href, text: l.textContent.trim().slice(0, 200) })).slice(0, 15);
  }`);

  // Filter: only keep World Cup soccer events (skip FEI, FIH, Cricket, etc.)
  const eventUrls = (Array.isArray(allEventUrls) ? allEventUrls : []).filter(e => {
    const t = e.text.toLowerCase();
    return (t.includes('world cup') && !t.includes('fei') && !t.includes('fih') &&
            !t.includes('cricket') && !t.includes('hockey') && !t.includes('beach soccer') &&
            !t.includes('basketball') && !t.includes('t20'));
  });

  if (eventUrls.length === 0) {
    log(`[Browse] StubHub: no FIFA World Cup event links found (${allEventUrls?.length || 0} total events on page)`);
    return null;
  }

  log(`[Browse] StubHub: found ${eventUrls.length} FIFA World Cup event links`);

  // Step 2: Navigate to each event and extract ticket listings
  const allListings = [];
  const maxEvents = Math.min(eventUrls.length, 3); // Cap at 3 events per cycle

  for (let i = 0; i < maxEvents; i++) {
    const event = eventUrls[i];
    log(`[Browse] StubHub: browsing event ${i + 1}/${maxEvents}: ${event.text.slice(0, 60)}...`);

    navigate(event.href);
    await sleep(3000);

    // Dismiss any dialogs (cookie consent, "Continue" location prompt).
    try {
      const dialogResult = evaluate(String.raw`() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          const t = btn.textContent.trim().toLowerCase();
          if (t === 'continue' || t === 'accept' || t === 'accept all' || t === 'close dialog') {
            btn.click();
            return 'dismissed: ' + t;
          }
        }
        return 'no dialog';
      }`);
      if (String(dialogResult).includes('dismissed')) {
        log(`[Browse] StubHub: ${dialogResult} — waiting for page render...`);
        await sleep(6000);
      }
    } catch { /* no dialog */ }

    // Wait for listings-container with retry — SPA rendering can take several seconds
    let listings = [];
    for (let attempt = 0; attempt < 3; attempt++) {
      listings = evaluate(String.raw`() => {
        const container = document.querySelector('[data-testid="listings-container"]');
        if (!container) return [];
        const items = container.children;
        const results = [];
        for (let i = 0; i < Math.min(items.length, 15); i++) {
          const text = items[i].textContent || "";
          const priceMatch = text.match(/S\$([\d,]+)/);
          if (!priceMatch) continue;
          const sectionMatch = text.match(/(Category \d|Section \d+)/);
          const qty = text.includes("2 tickets") ? 2 : text.includes("3 tickets") ? 3 : text.includes("4 tickets") ? 4 : 1;
          const ratingMatch = text.match(/(\d+\.\d+)\s*(Amazing|Great|Good)/);
          results.push({
            section: sectionMatch ? sectionMatch[1] : null,
            priceSGD: parseInt(priceMatch[1].replace(/,/g, "")),
            quantity: qty,
            rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
            bestPrice: text.includes("Best price"),
          });
        }
        return results;
      }`);
      if (Array.isArray(listings) && listings.length > 0) break;
      log(`[Browse] StubHub: listings not rendered yet (attempt ${attempt + 1}/3) — waiting...`);
      await sleep(4000);
    }

    if (Array.isArray(listings) && listings.length > 0) {
      log(`[Browse] StubHub: extracted ${listings.length} ticket listings from event page`);
      // Detect round from event text
      let round = 'default';
      const lower = event.text.toLowerCase();
      if (lower.includes('final') && !lower.includes('quarter') && !lower.includes('semi')) round = 'Final';
      else if (lower.includes('semi')) round = 'Semi-Final';
      else if (lower.includes('quarter')) round = 'Quarter-Final';
      else if (lower.includes('round of 16')) round = 'Round of 16';
      else if (lower.includes('group')) round = 'Group Stage';

      for (const l of listings) {
        allListings.push(toSchema({
          priceUSD: Math.round(l.priceSGD * SGD_TO_USD),
          section: l.section,
          quantity: l.quantity,
          round,
          url: `${event.href}#${urlHash(JSON.stringify(l))}`,
          eventLabel: `${eventName} — ${event.text.slice(0, 80)}`,
          description: `${l.section || 'General'} — ${l.bestPrice ? 'Best price' : ''} ${l.rating ? l.rating + ' rated' : ''}`.trim(),
        }, 'StubHub', eventName));
      }
    } else {
      log('[Browse] StubHub: no listings-container found on event page (may not have ticket view)');
    }
  }

  return allListings.length > 0 ? allListings : null;
}

// ── Viagogo ─────────────────────────────────────────────────────────────

async function browseViagogo(eventName) {
  log('[Browse] Viagogo: searching with OpenClaw browser...');
  navigate(`https://www.viagogo.com/search?searchTerm=${encodeURIComponent(eventName)}`);
  await sleep(5000);

  // Extract event links from search results
  const events = evaluate(String.raw`() => {
    const links = document.querySelectorAll('a[href*="/tickets"]');
    return Array.from(links).slice(0, 10).map(l => ({
      href: l.href, text: l.textContent.trim().slice(0, 200)
    })).filter(e => e.text.length > 5);
  }`);

  if (!Array.isArray(events) || events.length === 0) {
    log('[Browse] Viagogo: no event links found');
    return null;
  }

  log(`[Browse] Viagogo: found ${events.length} event links`);

  const allListings = [];
  const maxEvents = Math.min(events.length, 2);

  for (let i = 0; i < maxEvents; i++) {
    const event = events[i];
    log(`[Browse] Viagogo: browsing event ${i + 1}/${maxEvents}: ${event.text.slice(0, 60)}...`);
    navigate(event.href);
    await sleep(5000);

    const listings = evaluate(String.raw`() => {
      const items = document.querySelectorAll('[class*="listing"], [class*="ticket-card"], [data-testid*="listing"]');
      if (items.length === 0) {
        const text = document.body.innerText;
        const prices = text.match(/(?:USD|\$|S\$)\s*[\d,]+\.?\d*/g) || [];
        return prices.slice(0, 10).map((p, idx) => ({
          price: p.replace(/[^0-9.]/g, ""),
          section: null,
          quantity: 2,
          idx
        }));
      }
      return Array.from(items).slice(0, 15).map((el, idx) => {
        const text = el.textContent || "";
        const priceMatch = text.match(/(?:USD|\$|S\$)\s*([\d,]+)/);
        const sectionMatch = text.match(/(Category \d|Section \d+|Block \w+)/i);
        return {
          price: priceMatch ? priceMatch[1].replace(/,/g, "") : null,
          section: sectionMatch ? sectionMatch[1] : null,
          quantity: text.includes("2 tickets") ? 2 : 1,
          idx
        };
      }).filter(l => l.price && parseInt(l.price) > 0);
    }`);

    if (Array.isArray(listings) && listings.length > 0) {
      log(`[Browse] Viagogo: extracted ${listings.length} listings`);
      for (const l of listings) {
        allListings.push(toSchema({
          price: l.price,
          section: l.section,
          quantity: l.quantity,
          url: `${event.href}#listing-${l.idx}`,
          eventLabel: `${eventName} — ${event.text.slice(0, 80)}`,
        }, 'Viagogo', eventName));
      }
    }
  }

  return allListings.length > 0 ? allListings : null;
}

// ── Facebook Marketplace ────────────────────────────────────────────────

async function browseFacebook(eventName) {
  log('[Browse] Facebook: searching with OpenClaw browser...');
  navigate(`https://www.facebook.com/marketplace/search?query=${encodeURIComponent(eventName + ' tickets')}`);
  await sleep(5000);

  const listings = evaluate(String.raw`() => {
    const cards = document.querySelectorAll('a[href*="/marketplace/item/"]');
    if (cards.length === 0) return [];
    return Array.from(cards).slice(0, 15).map(card => {
      const container = card.closest('div[class]') || card.parentElement;
      const text = container?.textContent || card.textContent || "";
      const priceMatch = text.match(/\$([\d,]+)/);
      const titleEl = container?.querySelector('span');
      return {
        price: priceMatch ? priceMatch[1].replace(/,/g, "") : null,
        url: card.href,
        title: titleEl?.textContent?.trim()?.slice(0, 200) || text.slice(0, 100),
        seller: null,
      };
    }).filter(l => l.price && parseInt(l.price) > 0);
  }`);

  if (!Array.isArray(listings) || listings.length === 0) {
    log('[Browse] Facebook: no listings found');
    return null;
  }

  log(`[Browse] Facebook: extracted ${listings.length} listings via browser`);
  const seen = new Map();
  return listings.map(raw => toSchema({
    price: raw.price,
    url: raw.url,
    seller: raw.seller || 'Facebook Seller',
    description: raw.title,
  }, 'Facebook Marketplace', eventName)).filter(l => {
    const h = urlHash(l.url);
    if (seen.has(h)) return false;
    seen.set(h, true);
    return l.price > 0;
  });
}

// ── Exported Functions (same interface as Patchright scrapers) ────────────

export async function browseStubHubWithFallback(eventName) {
  if (!ensureBrowser()) {
    log('[Browse] OpenClaw browser not available — falling back to Patchright scraper');
    const { scrapeStubHub } = await import('./scrape-stubhub.js');
    return scrapeStubHub(eventName);
  }
  try {
    const result = await browseStubHub(eventName);
    if (result && result.length > 0) return result;
    log('[Browse] StubHub: browser returned no results — falling back to mock data');
    return generateStubHubListings(eventName, 4);
  } catch (err) {
    log(`[Browse] StubHub error: ${err.message} — falling back to mock`);
    return generateStubHubListings(eventName, 4);
  }
}

export async function browseViagogoWithFallback(eventName) {
  if (!ensureBrowser()) {
    log('[Browse] OpenClaw browser not available — falling back to Patchright scraper');
    const { scrapeViagogo } = await import('./scrape-viagogo.js');
    return scrapeViagogo(eventName);
  }
  try {
    const result = await browseViagogo(eventName);
    if (result && result.length > 0) return result;
    log('[Browse] Viagogo: browser returned no results — falling back to mock data');
    return generateViagogoListings(eventName, 3);
  } catch (err) {
    log(`[Browse] Viagogo error: ${err.message} — falling back to mock`);
    return generateViagogoListings(eventName, 3);
  }
}

export async function browseFacebookWithFallback(eventName) {
  if (!ensureBrowser()) {
    log('[Browse] OpenClaw browser not available — falling back to Patchright scraper');
    const { scrapeFacebook } = await import('./scrape-facebook.js');
    return scrapeFacebook(eventName);
  }
  try {
    const result = await browseFacebook(eventName);
    if (result && result.length > 0) return result;
    log('[Browse] Facebook: browser returned no results — falling back to mock data');
    return generateFacebookListings(eventName, 3);
  } catch (err) {
    log(`[Browse] Facebook error: ${err.message} — falling back to mock`);
    return generateFacebookListings(eventName, 3);
  }
}
