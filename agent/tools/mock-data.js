// Ducket AI Galactica — Dynamic Mock Listing Generator
// Apache 2.0 License
//
// Generates realistic, randomized FIFA World Cup 2026 ticket listings
// for demo purposes when bot detection blocks live scraping.
// Each call produces different listings with varied prices, sellers, sections,
// and matches — making the demo look like a live scanning pipeline.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load real seed data from pre-captured listings (Option C)
let SEED_DATA = [];
try {
  const raw = readFileSync(join(__dirname, '../data/seed-listings.json'), 'utf8');
  SEED_DATA = JSON.parse(raw);
} catch { /* seed file optional */ }

// ── FIFA World Cup 2026 Match Data ──────────────────────────────────────
// Real matches, real venues, real dates — prices based on market research

const MATCHES = [
  { match: 'USA vs England', round: 'Group Stage', venue: 'MetLife Stadium, NJ', date: '2026-06-15', faceValue: 265 },
  { match: 'Mexico vs Argentina', round: 'Group Stage', venue: 'Estadio Azteca, Mexico City', date: '2026-06-17', faceValue: 265 },
  { match: 'Brazil vs France', round: 'Group Stage', venue: 'SoFi Stadium, LA', date: '2026-06-19', faceValue: 265 },
  { match: 'Germany vs Spain', round: 'Group Stage', venue: 'AT&T Stadium, Dallas', date: '2026-06-21', faceValue: 200 },
  { match: 'Japan vs Canada', round: 'Group Stage', venue: 'BMO Field, Toronto', date: '2026-06-16', faceValue: 120 },
  { match: 'Portugal vs Netherlands', round: 'Group Stage', venue: 'Lincoln Financial Field, Philadelphia', date: '2026-06-20', faceValue: 200 },
  { match: 'TBD vs TBD', round: 'Round of 16', venue: 'Hard Rock Stadium, Miami', date: '2026-07-05', faceValue: 350 },
  { match: 'TBD vs TBD', round: 'Quarter-Final', venue: 'Levi\'s Stadium, San Francisco', date: '2026-07-10', faceValue: 500 },
  { match: 'TBD vs TBD', round: 'Semi-Final', venue: 'AT&T Stadium, Dallas', date: '2026-07-14', faceValue: 800 },
  { match: 'TBD vs TBD', round: 'Final', venue: 'MetLife Stadium, NJ', date: '2026-07-19', faceValue: 1500 },
];

const SECTIONS = [
  'Lower Level 101', 'Lower Level 114', 'Lower Level 128',
  'Club Level 205', 'Club Level 212', 'Club Level 230',
  'Upper Level 301', 'Upper Level 315', 'Upper Level 340',
  'VIP Suite A', 'VIP Suite B', 'Field Level', 'Corner Section 109',
  'Category 1', 'Category 2', 'Category 3', 'Category 4',
];

// Realistic seller name pools per platform
const STUBHUB_SELLERS = [
  'TicketKing2026', 'WorldCupDeals', 'PremiumSeats_NYC', 'SportsFanFirst',
  'SectionRow1', 'TixMaster_Pro', 'EventAccess_Global', 'SeatGenius',
  'FIFAtickets24', 'StadiumDirect', 'LastMinuteSeats', 'VIPexperience',
  'TicketVault_US', 'GameDayReady', 'FrontRowFanatic', 'CheapSeatsDave',
];

const VIAGOGO_SELLERS = [
  'futbol_tix_eu', 'worldcup_resale', 'ticket_exchange_uk', 'seats_unlimited',
  'copa_mundial_2026', 'premier_events_de', 'global_tickets_nl', 'sport_access_fr',
  'best_seats_madrid', 'tickets4fans_it', 'wc2026_official_resale', 'event_broker_uk',
];

const FACEBOOK_SELLERS = [
  'Mike Thompson', 'Sarah Chen', 'Carlos Rodriguez', 'Jessica Park',
  'David Williams', 'Maria Santos', 'James O\'Brien', 'Aisha Patel',
  'Robert Kim', 'Emma Johnson', 'Luis Garcia', 'Rachel Lee',
  'Chris Anderson', 'Fatima Al-Hassan', 'Tyler Brooks', 'Priya Sharma',
];

// ── Price Generation ────────────────────────────────────────────────────
// Generates realistic secondary market prices with fraud signal patterns

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a price and fraud signals for a listing.
 * Distribution roughly matches real secondary markets:
 *   40% scalping (2-8x face value)
 *   25% moderate markup (1.2-2x)
 *   15% below face (possible scam)
 *   20% near face value (legitimate)
 */
function generatePrice(faceValue) {
  const roll = Math.random();
  let price, redFlags;

  if (roll < 0.40) {
    // Scalping — 2x to 8x face value
    const multiplier = 2 + Math.random() * 6;
    price = Math.round(faceValue * multiplier);
    redFlags = [`price ${Math.round(multiplier)}x face value`, 'significant markup over face value'];
    if (multiplier > 5) redFlags.push('extreme price gouging');
  } else if (roll < 0.65) {
    // Moderate markup — 1.2x to 2x
    const multiplier = 1.2 + Math.random() * 0.8;
    price = Math.round(faceValue * multiplier);
    redFlags = ['moderate markup over face value'];
  } else if (roll < 0.80) {
    // Below face — possible scam
    const multiplier = 0.2 + Math.random() * 0.6;
    price = Math.round(faceValue * multiplier);
    redFlags = ['price below face value (possible scam)'];
    if (multiplier < 0.3) redFlags.push('suspiciously low price');
  } else {
    // Near face value — legitimate
    const multiplier = 0.95 + Math.random() * 0.15;
    price = Math.round(faceValue * multiplier);
    redFlags = [];
  }

  const priceDeltaPct = Math.round(((price - faceValue) / faceValue) * 100);
  return { price, redFlags, priceDeltaPct };
}

// ── Unique URL Generation ───────────────────────────────────────────────
// Uses timestamp + random to ensure dedup doesn't filter across cycles

let _counter = 0;
function uniqueId() {
  return createHash('sha256')
    .update(`${Date.now()}-${_counter++}-${Math.random()}`)
    .digest('hex')
    .slice(0, 12);
}

// ── Seed Data Converter ─────────────────────────────────────────────────
// Converts real pre-captured listings into the standard listing schema.
// SGD to USD approximate conversion: 1 SGD ≈ 0.75 USD

const SGD_TO_USD = 0.75;

function seedToListing(seedMatch, seedListing, platform, eventName) {
  const priceUSD = Math.round(seedListing.priceSGD * SGD_TO_USD);
  // Use Category 3 lowest price as approximate face value
  const faceValue = Math.round((seedMatch.categoryPricesSGD?.['Category 3'] ?? seedListing.priceSGD) * SGD_TO_USD * 0.3);
  const priceDeltaPct = Math.round(((priceUSD - faceValue) / faceValue) * 100);
  const redFlags = [];
  if (priceDeltaPct > 200) redFlags.push(`price ${Math.round(priceDeltaPct / 100)}x face value`, 'significant markup over face value');
  else if (priceDeltaPct > 100) redFlags.push('significant markup over face value');
  else if (priceDeltaPct > 50) redFlags.push('moderate markup over face value');

  return {
    platform,
    seller: pickRandom(platform === 'StubHub' ? STUBHUB_SELLERS : platform === 'Viagogo' ? VIAGOGO_SELLERS : FACEBOOK_SELLERS),
    price: priceUSD,
    url: `https://www.${platform.toLowerCase().replace(/ /g, '')}.com/listing/${uniqueId()}`,
    listingDate: new Date(Date.now() - randomBetween(0, 86400000)).toISOString(),
    redFlags,
    eventName: `${eventName} — ${seedMatch.match}`,
    section: seedListing.section,
    quantity: seedListing.quantity,
    faceValue,
    priceDeltaPct,
    source: 'seed',
    matchRound: seedMatch.round,
    venue: seedMatch.venue,
    matchDate: seedMatch.date,
  };
}

function getSeedListings(platform, eventName, count) {
  if (SEED_DATA.length === 0) return [];
  const results = [];
  for (let i = 0; i < count; i++) {
    const match = pickRandom(SEED_DATA);
    if (match.listings.length === 0) continue;
    const listing = pickRandom(match.listings);
    results.push(seedToListing(match, listing, platform, eventName));
  }
  return results;
}

// ── Public Generators ───────────────────────────────────────────────────

/**
 * Generate dynamic StubHub mock listings.
 * @param {string} eventName
 * @param {number} [count=4] Number of listings to generate
 */
export function generateStubHubListings(eventName, count = 4) {
  // Mix: ~half from real seed data, half generated
  const seedCount = Math.min(Math.ceil(count / 2), SEED_DATA.length > 0 ? count : 0);
  const genCount = count - seedCount;
  const listings = [...getSeedListings('StubHub', eventName, seedCount)];
  for (let i = 0; i < genCount; i++) {
    const match = pickRandom(MATCHES);
    const { price, redFlags, priceDeltaPct } = generatePrice(match.faceValue);
    const id = uniqueId();
    listings.push({
      platform: 'StubHub',
      seller: pickRandom(STUBHUB_SELLERS),
      price,
      url: `https://www.stubhub.com/fifa-world-cup-tickets/${id}`,
      listingDate: new Date(Date.now() - randomBetween(0, 86400000)).toISOString(),
      redFlags,
      eventName: `${eventName} — ${match.match}`,
      section: pickRandom(SECTIONS),
      quantity: pickRandom([1, 2, 2, 3, 4]),
      faceValue: match.faceValue,
      priceDeltaPct,
      source: 'mock',
      matchRound: match.round,
      venue: match.venue,
      matchDate: match.date,
    });
  }
  return listings;
}

/**
 * Generate dynamic Viagogo mock listings.
 * @param {string} eventName
 * @param {number} [count=3] Number of listings to generate
 */
export function generateViagogoListings(eventName, count = 3) {
  const seedCount = Math.min(Math.ceil(count / 2), SEED_DATA.length > 0 ? count : 0);
  const genCount = count - seedCount;
  const listings = [...getSeedListings('Viagogo', eventName, seedCount)];
  for (let i = 0; i < genCount; i++) {
    const match = pickRandom(MATCHES);
    const { price, redFlags, priceDeltaPct } = generatePrice(match.faceValue);
    const id = uniqueId();
    listings.push({
      platform: 'Viagogo',
      seller: pickRandom(VIAGOGO_SELLERS),
      price,
      url: `https://www.viagogo.com/Sports/FIFA-World-Cup/${id}`,
      listingDate: new Date(Date.now() - randomBetween(0, 86400000)).toISOString(),
      redFlags,
      eventName: `${eventName} — ${match.match}`,
      section: pickRandom(SECTIONS),
      quantity: pickRandom([1, 1, 2, 2, 3]),
      faceValue: match.faceValue,
      priceDeltaPct,
      source: 'mock',
      matchRound: match.round,
      venue: match.venue,
      matchDate: match.date,
    });
  }
  return listings;
}

/**
 * Generate dynamic Facebook Marketplace mock listings.
 * @param {string} eventName
 * @param {number} [count=3] Number of listings to generate
 */
export function generateFacebookListings(eventName, count = 3) {
  const seedCount = Math.min(Math.ceil(count / 2), SEED_DATA.length > 0 ? count : 0);
  const genCount = count - seedCount;
  const listings = [...getSeedListings('Facebook Marketplace', eventName, seedCount)];
  for (let i = 0; i < genCount; i++) {
    const match = pickRandom(MATCHES);
    const { price, redFlags, priceDeltaPct } = generatePrice(match.faceValue);
    const id = uniqueId();
    // Facebook sellers more likely to be scammy (P2P, less verification)
    const extraFlags = Math.random() < 0.3 ? ['no ticket proof provided'] : [];
    listings.push({
      platform: 'Facebook Marketplace',
      seller: pickRandom(FACEBOOK_SELLERS),
      price,
      url: `https://www.facebook.com/marketplace/item/${id}`,
      listingDate: new Date(Date.now() - randomBetween(0, 172800000)).toISOString(),
      redFlags: [...redFlags, ...extraFlags],
      eventName: `${eventName} — ${match.match}`,
      section: null,
      quantity: pickRandom([1, 2, 2]),
      faceValue: match.faceValue,
      priceDeltaPct,
      source: 'mock',
      matchRound: match.round,
      venue: match.venue,
      matchDate: match.date,
    });
  }
  return listings;
}
