// Ducket AI Galactica — Dynamic Mock Listing Generator
// Apache 2.0 License
//
// Generates realistic, randomized FIFA World Cup 2026 ticket listings
// with multi-signal fraud indicators for the classification engine.
// Each listing includes seller trust signals, listing quality indicators,
// temporal patterns, and event demand context — not just price.

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
// Real matches, real venues, real dates — with demand tiers

const MATCHES = [
  { match: 'USA vs England', round: 'Group Stage', venue: 'MetLife Stadium, NJ', date: '2026-06-15', faceValue: 265, demand: 'high' },
  { match: 'Mexico vs Argentina', round: 'Group Stage', venue: 'Estadio Azteca, Mexico City', date: '2026-06-17', faceValue: 265, demand: 'high' },
  { match: 'Brazil vs France', round: 'Group Stage', venue: 'SoFi Stadium, LA', date: '2026-06-19', faceValue: 265, demand: 'sold_out' },
  { match: 'Germany vs Spain', round: 'Group Stage', venue: 'AT&T Stadium, Dallas', date: '2026-06-21', faceValue: 200, demand: 'moderate' },
  { match: 'Japan vs Canada', round: 'Group Stage', venue: 'BMO Field, Toronto', date: '2026-06-16', faceValue: 120, demand: 'low' },
  { match: 'Portugal vs Netherlands', round: 'Group Stage', venue: 'Lincoln Financial Field, Philadelphia', date: '2026-06-20', faceValue: 200, demand: 'moderate' },
  { match: 'TBD vs TBD', round: 'Round of 16', venue: 'Hard Rock Stadium, Miami', date: '2026-07-05', faceValue: 350, demand: 'high' },
  { match: 'TBD vs TBD', round: 'Quarter-Final', venue: 'Levi\'s Stadium, San Francisco', date: '2026-07-10', faceValue: 500, demand: 'high' },
  { match: 'TBD vs TBD', round: 'Semi-Final', venue: 'AT&T Stadium, Dallas', date: '2026-07-14', faceValue: 800, demand: 'sold_out' },
  { match: 'TBD vs TBD', round: 'Final', venue: 'MetLife Stadium, NJ', date: '2026-07-19', faceValue: 1500, demand: 'sold_out' },
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

// ── Seller Signal Generation ────────────────────────────────────────────

const TRANSFER_METHODS = ['verified_transfer', 'email_transfer', 'screenshot', 'will_email', 'dm_only', 'unspecified'];

const DESCRIPTIONS_LEGIT = [
  'Section 114, Row 12, Seats 3-4. Purchased directly from FIFA. Can transfer via official app.',
  'Category 1 tickets, Lower Bowl. Original buyer, can provide receipt. Verified transfer available.',
  'Two tickets together, great view of the pitch. Bought from official FIFA portal, receipt included.',
  'Club Level seats with lounge access. Digital tickets, transferable via Ticketmaster app.',
  'Field Level, Row 3. Purchased through pre-sale. Will transfer via official FIFA resale platform.',
];

const DESCRIPTIONS_VAGUE = [
  'Great seats!',
  'Good tickets, DM me',
  'FIFA tickets for sale',
  'Best price, message me',
  'Tickets available',
  '',
];

const DESCRIPTIONS_MID = [
  'Upper level, decent view. Can email the tickets.',
  'Two tickets, Category 2. Will send via email after payment.',
  'Corner section, transferable tickets.',
];

/**
 * Generate seller trust signals based on listing risk profile.
 * Creates realistic combinations — scammy listings get bad seller signals.
 */
function generateSellerSignals(riskProfile) {
  switch (riskProfile) {
    case 'trusted':
      return {
        sellerAge: randomBetween(365, 2000),
        sellerTransactions: randomBetween(25, 200),
        sellerVerified: true,
        listingDescription: pickRandom(DESCRIPTIONS_LEGIT),
        transferMethod: pickRandom(['verified_transfer', 'email_transfer']),
      };
    case 'moderate':
      return {
        sellerAge: randomBetween(60, 400),
        sellerTransactions: randomBetween(3, 30),
        sellerVerified: Math.random() > 0.4,
        listingDescription: pickRandom(DESCRIPTIONS_MID),
        transferMethod: pickRandom(['email_transfer', 'will_email', 'unspecified']),
      };
    case 'suspicious':
      return {
        sellerAge: randomBetween(1, 20),
        sellerTransactions: randomBetween(0, 3),
        sellerVerified: false,
        listingDescription: pickRandom(DESCRIPTIONS_VAGUE),
        transferMethod: pickRandom(['dm_only', 'will_email', 'screenshot', 'unspecified']),
      };
    default:
      return {
        sellerAge: randomBetween(30, 700),
        sellerTransactions: randomBetween(0, 50),
        sellerVerified: Math.random() > 0.5,
        listingDescription: pickRandom([...DESCRIPTIONS_MID, ...DESCRIPTIONS_LEGIT]),
        transferMethod: pickRandom(TRANSFER_METHODS),
      };
  }
}

// ── Price Generation ────────────────────────────────────────────────────

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a price, fraud signals, and seller profile for a listing.
 * Distribution creates a mix that demonstrates all classification paths:
 *   25% high-markup scalping with moderate/suspicious sellers
 *   15% moderate markup with trusted sellers (legitimate market pricing)
 *   15% below face with suspicious sellers (scam pattern)
 *   10% below face with trusted sellers (motivated seller — legitimate)
 *   15% fair price with suspicious sellers (counterfeit risk)
 *   20% fair price with trusted sellers (clean legitimate)
 */
function generateListing(faceValue, match) {
  const roll = Math.random();
  let price, redFlags, sellerProfile;

  if (roll < 0.25) {
    // Scalping — high markup, moderate-to-suspicious seller
    const multiplier = 2 + Math.random() * 5;
    price = Math.round(faceValue * multiplier);
    redFlags = [`price ${Math.round(multiplier)}x face value`];
    if (multiplier > 4) redFlags.push('extreme price gouging');
    sellerProfile = Math.random() < 0.6 ? 'moderate' : 'suspicious';
  } else if (roll < 0.40) {
    // Moderate markup + trusted seller (legitimate high-demand pricing)
    const multiplier = 1.3 + Math.random() * 1.2;
    price = Math.round(faceValue * multiplier);
    redFlags = [];
    sellerProfile = 'trusted';
  } else if (roll < 0.55) {
    // Below face + suspicious seller (classic scam)
    const multiplier = 0.2 + Math.random() * 0.5;
    price = Math.round(faceValue * multiplier);
    redFlags = ['price below face value', 'suspiciously low price'];
    sellerProfile = 'suspicious';
  } else if (roll < 0.65) {
    // Below face + trusted seller (motivated seller, not a scam)
    const multiplier = 0.75 + Math.random() * 0.15;
    price = Math.round(faceValue * multiplier);
    redFlags = [];
    sellerProfile = 'trusted';
  } else if (roll < 0.80) {
    // Fair price + suspicious seller (counterfeit risk)
    const multiplier = 0.95 + Math.random() * 0.3;
    price = Math.round(faceValue * multiplier);
    redFlags = [];
    sellerProfile = 'suspicious';
  } else {
    // Fair price + trusted seller (clean legitimate)
    const multiplier = 0.95 + Math.random() * 0.15;
    price = Math.round(faceValue * multiplier);
    redFlags = [];
    sellerProfile = 'trusted';
  }

  const priceDeltaPct = Math.round(((price - faceValue) / faceValue) * 100);
  const sellerSignals = generateSellerSignals(sellerProfile);

  return { price, redFlags, priceDeltaPct, ...sellerSignals, eventDemand: match.demand };
}

// ── Unique URL Generation ───────────────────────────────────────────────

let _counter = 0;
function uniqueId() {
  return createHash('sha256')
    .update(`${Date.now()}-${_counter++}-${Math.random()}`)
    .digest('hex')
    .slice(0, 12);
}

// ── Seed Data Converter ─────────────────────────────────────────────────

const SGD_TO_USD = 0.75;

function seedToListing(seedMatch, seedListing, platform, eventName) {
  const priceUSD = Math.round(seedListing.priceSGD * SGD_TO_USD);
  const faceValue = Math.round((seedMatch.categoryPricesSGD?.['Category 3'] ?? seedListing.priceSGD) * SGD_TO_USD * 0.3);
  const priceDeltaPct = Math.round(((priceUSD - faceValue) / faceValue) * 100);
  const redFlags = [];
  if (priceDeltaPct > 200) redFlags.push(`price ${Math.round(priceDeltaPct / 100)}x face value`);
  else if (priceDeltaPct > 100) redFlags.push('significant markup over face value');

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
    // Default seller signals for seed data
    ...generateSellerSignals('moderate'),
    eventDemand: 'moderate',
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

function buildListing(platform, eventName, sellerPool) {
  const match = pickRandom(MATCHES);
  const generated = generateListing(match.faceValue, match);
  const id = uniqueId();
  const platformSlug = platform.toLowerCase().replace(/ /g, '');
  return {
    platform,
    seller: pickRandom(sellerPool),
    price: generated.price,
    url: `https://www.${platformSlug}.com/listing/${id}`,
    listingDate: new Date(Date.now() - randomBetween(0, 86400000)).toISOString(),
    redFlags: generated.redFlags,
    eventName: `${eventName} — ${match.match}`,
    section: generated.listingDescription ? pickRandom(SECTIONS) : null,
    quantity: pickRandom([1, 2, 2, 3, 4]),
    faceValue: match.faceValue,
    priceDeltaPct: generated.priceDeltaPct,
    source: 'mock',
    matchRound: match.round,
    venue: match.venue,
    matchDate: match.date,
    sellerAge: generated.sellerAge,
    sellerTransactions: generated.sellerTransactions,
    sellerVerified: generated.sellerVerified,
    listingDescription: generated.listingDescription,
    transferMethod: generated.transferMethod,
    eventDemand: generated.eventDemand,
  };
}

export function generateStubHubListings(eventName, count = 4) {
  const seedCount = Math.min(Math.ceil(count / 2), SEED_DATA.length > 0 ? count : 0);
  const genCount = count - seedCount;
  const listings = [...getSeedListings('StubHub', eventName, seedCount)];
  for (let i = 0; i < genCount; i++) {
    listings.push(buildListing('StubHub', eventName, STUBHUB_SELLERS));
  }
  return listings;
}

export function generateViagogoListings(eventName, count = 3) {
  const seedCount = Math.min(Math.ceil(count / 2), SEED_DATA.length > 0 ? count : 0);
  const genCount = count - seedCount;
  const listings = [...getSeedListings('Viagogo', eventName, seedCount)];
  for (let i = 0; i < genCount; i++) {
    listings.push(buildListing('Viagogo', eventName, VIAGOGO_SELLERS));
  }
  return listings;
}

export function generateFacebookListings(eventName, count = 3) {
  const seedCount = Math.min(Math.ceil(count / 2), SEED_DATA.length > 0 ? count : 0);
  const genCount = count - seedCount;
  const listings = [...getSeedListings('Facebook Marketplace', eventName, seedCount)];
  for (let i = 0; i < genCount; i++) {
    const listing = buildListing('Facebook Marketplace', eventName, FACEBOOK_SELLERS);
    // Facebook has higher base platform risk — reflected in listing signals
    if (listing.sellerVerified) listing.sellerVerified = Math.random() > 0.7; // fewer verified
    listings.push(listing);
  }
  return listings;
}
