// Ducket AI Galactica — Seed Data Validation Script
// Validates that all 4 classification categories have seed listings in LISTINGS.md
// with matching case files in agent/cases/ containing 50+ word reasoning strings.
// Apache 2.0 License

const { readFileSync, readdirSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { join } = require('node:path');

const ROOT = join(__dirname, '..');
const LISTINGS_PATH = join(ROOT, 'agent', 'memory', 'LISTINGS.md');
const CASES_DIR = join(ROOT, 'agent', 'cases');

const REQUIRED_CATEGORIES = [
  'SCALPING_VIOLATION',
  'LIKELY_SCAM',
  'COUNTERFEIT_RISK',
  'LEGITIMATE',
];

function urlHash(url) {
  return createHash('sha256').update(url ?? '').digest('hex').slice(0, 16);
}

function fail(msg) {
  console.error('[validate-seed] FAIL:', msg);
  process.exit(1);
}

function pass(msg) {
  console.log('[validate-seed] OK:', msg);
}

// --- Step 1: Read LISTINGS.md and extract all JSON blocks ---
let listingsMd;
try {
  listingsMd = readFileSync(LISTINGS_PATH, 'utf8');
} catch (e) {
  fail(`Cannot read LISTINGS.md: ${e.message}`);
}

const jsonBlocks = [];
const blockRegex = /```json\s*([\s\S]*?)```/g;
let m;
while ((m = blockRegex.exec(listingsMd)) !== null) {
  try {
    const parsed = JSON.parse(m[1]);
    if (Array.isArray(parsed)) {
      jsonBlocks.push(...parsed);
    } else if (parsed && typeof parsed === 'object') {
      jsonBlocks.push(parsed);
    }
  } catch (e) {
    // Silently skip malformed blocks (matches API behavior)
  }
}

// --- Step 2: Filter to seed listings ---
const seedListings = jsonBlocks.filter(
  (l) => l.url && l.url.startsWith('https://ducket.seed/')
);

// --- Step 3: Assert exactly 4 seed listings ---
if (seedListings.length !== 4) {
  fail(`Expected 4 seed listings, found ${seedListings.length}. Check agent/memory/LISTINGS.md has a Seed Data section with 4 listings starting with https://ducket.seed/`);
}
pass(`Found ${seedListings.length} seed listings`);

// --- Step 4: Assert all 4 categories present ---
const categories = new Set(seedListings.map((l) => l.category).filter(Boolean));
// Categories come from case files, not from listing JSON — check via case file lookup below
// We'll assert categories after parsing case files.

// --- Step 5 & 6: For each seed listing, find case file and validate reasoning ---
let caseFiles;
try {
  caseFiles = readdirSync(CASES_DIR);
} catch (e) {
  fail(`Cannot read agent/cases/ directory: ${e.message}`);
}

const foundCategories = new Set();

for (const listing of seedListings) {
  const hash = urlHash(listing.url);
  const caseFile = caseFiles.find((f) => f.includes(hash));

  if (!caseFile) {
    fail(`No case file found for URL "${listing.url}" (hash: ${hash}). Expected a file in agent/cases/ containing "${hash}" in the filename.`);
  }

  const content = readFileSync(join(CASES_DIR, caseFile), 'utf8');

  // Parse category
  const categoryMatch = content.match(/\|\s*Category\s*\|\s*\*\*([^*]+)\*\*\s*\|/);
  if (!categoryMatch) {
    fail(`Case file "${caseFile}" is missing | Category | **VALUE** | table row.`);
  }
  const category = categoryMatch[1].trim();
  foundCategories.add(category);

  // Validate category is one of the required values
  if (!REQUIRED_CATEGORIES.includes(category)) {
    fail(`Case file "${caseFile}" has unrecognized category "${category}". Must be one of: ${REQUIRED_CATEGORIES.join(', ')}`);
  }

  // Parse reasoning
  const reasoningMatch = content.match(/\*\*Reasoning:\*\*\s*(.+)/);
  if (!reasoningMatch) {
    fail(`Case file "${caseFile}" is missing **Reasoning:** line.`);
  }
  const reasoning = reasoningMatch[1].trim();
  const wordCount = reasoning.split(/\s+/).filter(Boolean).length;
  if (wordCount < 50) {
    fail(`Case file "${caseFile}" reasoning has only ${wordCount} words (minimum: 50). Reasoning: "${reasoning.slice(0, 100)}..."`);
  }

  pass(`${category}: case file "${caseFile}" — ${wordCount} words in reasoning`);
}

// --- Step 4 (deferred): Assert all 4 categories present ---
for (const required of REQUIRED_CATEGORIES) {
  if (!foundCategories.has(required)) {
    fail(`Missing required category: ${required}. Found categories: ${[...foundCategories].join(', ')}`);
  }
}
pass(`All 4 categories present: ${REQUIRED_CATEGORIES.join(', ')}`);

console.log('\n[validate-seed] All seed validations passed.');
