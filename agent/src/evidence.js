// Ducket AI Galactica — Evidence Case File Writer
// Apache 2.0 License
//
// Produces timestamped markdown case files in agent/cases/ for every classified listing.
// Case files are the audit trail judges inspect to understand agent decisions —
// they also provide the evidence package for Phase 6 escrow enforcement.
//
// Exports:
//   writeCaseFile(listing, classificationResult, actionTaken) -> filepath string
//   isCaseFileExists(url) -> boolean (idempotency check by URL hash)

import { writeFile, mkdir, readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
// agent/cases/ lives one level above agent/src/
const CASES_DIR = join(__dirname, '../cases');

// SHA-256 URL hash sliced to 16 chars — matches scan-loop.js urlHash() pattern.
// Used for idempotency checks (filename contains hash) and deduplication.
function urlHash(url) {
  return createHash('sha256').update(url ?? '').digest('hex').slice(0, 16);
}

/**
 * isCaseFileExists(url) — check if a case file already exists for this listing URL.
 *
 * Reads the cases/ directory and checks if any filename contains the URL's SHA-256 hash.
 * Returns false if the directory doesn't exist yet (first run — ENOENT catch).
 *
 * @param {string} url — listing URL to check
 * @returns {Promise<boolean>}
 */
export async function isCaseFileExists(url) {
  const hash = urlHash(url);
  try {
    const files = await readdir(CASES_DIR);
    // Filenames follow {timestamp}-{platform}-{urlHash}.md — check if hash appears in any name
    return files.some((f) => f.includes(hash));
  } catch {
    // ENOENT: directory doesn't exist yet — first run, no case files written
    return false;
  }
}

/**
 * writeCaseFile(listing, classificationResult, actionTaken) — write a timestamped markdown case file.
 *
 * Creates agent/cases/ if it doesn't exist, then writes a fully structured evidence package
 * containing listing details, classification result, enforcement action, and drafted enforcement text.
 *
 * Filename pattern: {timestamp}-{platform}-{urlHash}.md
 *   timestamp: ISO string with colons/dots replaced by hyphens (filesystem-safe)
 *   platform:  listing.platform.toLowerCase()
 *   urlHash:   16-char SHA-256 of listing.url
 *
 * @param {object} listing — scraper listing object (platform, seller, price, faceValue, etc.)
 * @param {object} classificationResult — { category, confidence, reasoning, classificationSource }
 * @param {string} actionTaken — 'escrow_deposit' | 'logged_only'
 * @returns {Promise<string>} absolute filepath of the written case file
 */
export async function writeCaseFile(listing, classificationResult, actionTaken) {
  // Ensure cases/ directory exists — safe to call on every write (recursive: true is idempotent)
  await mkdir(CASES_DIR, { recursive: true });

  // Filename: filesystem-safe timestamp, lowercase platform, 16-char URL hash
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const hash = urlHash(listing.url);
  const platform = (listing.platform ?? 'unknown').toLowerCase();
  const filename = `${ts}-${platform}-${hash}.md`;
  const filepath = join(CASES_DIR, filename);

  // Threshold check for enforcement gate — read from env or default 85%
  const threshold = parseInt(process.env.FRAUD_CONFIDENCE_THRESHOLD ?? '85', 10);
  const thresholdMet = classificationResult.confidence >= threshold ? 'YES' : 'NO';

  // Build the red flags section
  const redFlagsSection =
    (listing.redFlags ?? []).length > 0
      ? listing.redFlags.map((f) => `- ${f}`).join('\n')
      : '- None detected';

  // Draft enforcement text based on classification category
  const enforcementText = draftEnforcementText(listing, classificationResult);

  // Markdown case file — human-readable for judges, machine-parseable for Phase 6
  const content = `# Fraud Case: ${listing.platform ?? 'Unknown'} — ${classificationResult.category}

**Generated:** ${new Date().toISOString()}
**Classification Source:** ${classificationResult.classificationSource}

## Listing Details

| Field | Value |
|-------|-------|
| Platform | ${listing.platform ?? 'unknown'} |
| Seller | ${listing.seller ?? 'unknown'} |
| Price | $${listing.price} USD |
| Face Value | $${listing.faceValue ?? 'N/A'} USD |
| Price Delta | ${listing.priceDeltaPct != null ? listing.priceDeltaPct + '%' : 'N/A'} |
| URL | ${listing.url ?? 'N/A'} |
| Listing Date | ${listing.listingDate ?? 'unknown'} |
| Data Source | ${listing.source ?? 'unknown'} |
| Seller Age | ${listing.sellerAge != null ? listing.sellerAge + ' days' : 'unknown'} |
| Seller Transactions | ${listing.sellerTransactions ?? 'unknown'} |
| Seller Verified | ${listing.sellerVerified != null ? (listing.sellerVerified ? 'Yes' : 'No') : 'unknown'} |
| Transfer Method | ${listing.transferMethod ?? 'unspecified'} |
| Event Demand | ${listing.eventDemand ?? 'unknown'} |
| Description | ${(listing.listingDescription ?? 'none').slice(0, 100)} |

## Red Flags

${redFlagsSection}

## Classification Result

| Field | Value |
|-------|-------|
| Category | **${classificationResult.category}** |
| Confidence | ${classificationResult.confidence}% |
| Classification Source | ${classificationResult.classificationSource} |

**Reasoning:** ${classificationResult.reasoning}
${classificationResult.signals ? `
## Risk Signal Breakdown

| Signal | Score | Detail |
|--------|-------|--------|
| Pricing Risk (30%) | ${classificationResult.signals.pricingRisk.score}/100 | ${classificationResult.signals.pricingRisk.detail} |
| Seller Trust (25%) | ${classificationResult.signals.sellerRisk.score}/100 | ${classificationResult.signals.sellerRisk.detail} |
| Listing Quality (20%) | ${classificationResult.signals.listingRisk.score}/100 | ${classificationResult.signals.listingRisk.detail} |
| Temporal Pattern (15%) | ${classificationResult.signals.temporalRisk.score}/100 | ${classificationResult.signals.temporalRisk.detail} |
| Platform Trust (10%) | ${classificationResult.signals.platformRisk.score}/100 | ${classificationResult.signals.platformRisk.detail} |
| **Composite Risk** | **${classificationResult.signals.compositeRisk}/100** | |
` : ''}
## Enforcement Action

| Field | Value |
|-------|-------|
| Action Taken | ${actionTaken} |
| Threshold Met | ${thresholdMet} |
| Etherscan Link | _(pending escrow transaction)_ |

## Drafted Enforcement Text

${enforcementText}

---
*Case file generated by Ducket AI Galactica — Autonomous Fraud Detection Agent*
*Apache 2.0 License*
`;

  await writeFile(filepath, content, 'utf8');
  // Log to stderr — keeps stdout clean for JSON piping (same pattern as scrapers)
  process.stderr.write(`[Evidence] Case file written: ${filename}\n`);
  return filepath;
}

/**
 * updateCaseFileEscrow(filepath, txHash, action) — update case file with confirmed Etherscan link.
 *
 * After a successful escrow transaction, replaces the "_(pending escrow transaction)_" placeholder
 * with the actual Etherscan link and marks the action as confirmed.
 *
 * The case file format written by writeCaseFile() contains:
 *   | Etherscan Link | _(pending escrow transaction)_ |
 *   | Action Taken   | ${action} |
 *
 * @param {string} filepath  Absolute path to the case file
 * @param {string} txHash    Transaction hash (0x-prefixed)
 * @param {string} action    Classification category or action label for the "(confirmed)" marker
 * @returns {Promise<void>}
 */
export async function updateCaseFileEscrow(filepath, txHash, action) {
  const link = `https://sepolia.etherscan.io/tx/${txHash}`;
  // Short display hash: first 10 chars is enough for human readability in the table
  const shortHash = txHash.slice(0, 10);

  let content = await readFile(filepath, 'utf8');

  // Replace Etherscan placeholder with real link
  content = content.replace(
    '| Etherscan Link | _(pending escrow transaction)_ |',
    `| Etherscan Link | [${shortHash}...](${link}) |`
  );

  // Mark action as confirmed — appends "(confirmed)" to the action row value
  content = content.replace(
    `| Action Taken | ${action} |`,
    `| Action Taken | ${action} (confirmed) |`
  );

  await writeFile(filepath, content, 'utf8');
  // Log to stderr — keeps stdout clean for JSON piping (same pattern as scrapers)
  process.stderr.write(`[Evidence] Case file updated with Etherscan link: ${shortHash}...\n`);
}

/**
 * draftEnforcementText(listing, result) — autonomously draft enforcement text per category.
 *
 * Produces category-specific enforcement language:
 *   SCALPING_VIOLATION → Takedown request citing price delta and face value
 *   LIKELY_SCAM        → Platform report citing below-face-value pricing
 *   COUNTERFEIT_RISK   → Public warning citing red flag signals
 *   LEGITIMATE         → No action statement
 *
 * @param {object} listing
 * @param {object} result — { category, confidence, reasoning, classificationSource }
 * @returns {string} markdown-formatted enforcement text
 */
function draftEnforcementText(listing, result) {
  const seller = listing.seller ?? 'unknown seller';
  const platform = listing.platform ?? 'unknown platform';
  const price = listing.price;
  const faceValue = listing.faceValue ?? 'N/A';
  const priceDeltaPct = listing.priceDeltaPct;
  const redFlags = (listing.redFlags ?? []).join(', ') || 'none identified';

  switch (result.category) {
    case 'SCALPING_VIOLATION':
      return `**Takedown Request:** This listing on ${platform} by seller "${seller}" is priced at $${price} — ${priceDeltaPct}% above the official face value of $${faceValue}. This constitutes a scalping violation under FIFA World Cup 2026 ticket resale policy. Immediate removal is requested. Automated enforcement action initiated by Ducket AI Galactica fraud detection agent.`;

    case 'LIKELY_SCAM':
      return `**Platform Report:** Listing by "${seller}" on ${platform} is priced at $${price} vs official face value of $${faceValue} — pricing below face value is a strong indicator of ticket fraud or phishing. Recommend immediate platform review and buyer warning. Automated report submitted by Ducket AI Galactica.`;

    case 'COUNTERFEIT_RISK':
      return `**Public Warning:** Listing from "${seller}" on ${platform} exhibits counterfeit risk signals: ${redFlags}. Buyers should avoid this listing. A platform report has been submitted. Automated warning issued by Ducket AI Galactica fraud detection agent.`;

    case 'LEGITIMATE':
    default:
      return `**No Action:** Listing classified as legitimate. No enforcement action required. Monitoring continues.`;
  }
}
