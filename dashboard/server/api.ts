// Ducket AI Galactica — Express API Server
// Serves agent data files (LISTINGS.md, case files, deployed.json) as JSON endpoints.
// Runs on port 3001; Vite dev server proxies /api/* here to avoid CORS.
//
// Endpoints:
//   GET  /api/listings           — all scanned listings, enriched with classification from case files
//   POST /api/listings           — submit a new listing (resale flow step 1); returns listing + classification
//   GET  /api/wallet             — wallet address, ETH/USDT balances from Sepolia via ethers.js
//   GET  /api/cases/:urlHash     — raw case file markdown for Agent Decision Panel
//   POST /api/escrow/deposit     — lock USDT in escrow for a listing (resale flow step 2)
//
// Apache 2.0 License

import express from 'express';
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { ethers } from 'ethers';

// ESM-compatible path resolution — avoids __dirname ReferenceError in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve paths relative to the monorepo root (dashboard/server/ -> ../../)
const REPO_ROOT = join(__dirname, '../../');
const LISTINGS_PATH = join(REPO_ROOT, 'agent/memory/LISTINGS.md');
const CASES_DIR = join(REPO_ROOT, 'agent/cases');
const DEPLOYED_PATH = join(REPO_ROOT, 'contracts/deployed.json');

// Cached wallet info for RPC timeout fallback
let cachedWallet: object | null = null;

// In-memory store for listings submitted via POST /api/listings during this server session.
// Prepended to GET /api/listings so form-submitted listings appear immediately.
const runtimeListings: Record<string, unknown>[] = [];

const app = express();
app.use(express.json());

// ---------------------------------------------------------------------------
// GET /api/listings
// Reads LISTINGS.md, extracts all fenced ```json blocks via regex (multi-block),
// flattens arrays, enriches each listing with classification from matching case file.
// ---------------------------------------------------------------------------
app.get('/api/listings', async (req, res) => {
  try {
    const md = await readFile(LISTINGS_PATH, 'utf8');

    // Extract all fenced JSON blocks — LISTINGS.md has one block per scan cycle
    // Pattern: ```json\n<array>\n``` — matchAll captures the inner content
    const blocks = [...md.matchAll(/```json\n([\s\S]*?)\n```/g)];
    const all = blocks.flatMap((m) => {
      try {
        return JSON.parse(m[1]);
      } catch {
        return [];
      }
    });

    // Enrich each listing with classification data from its case file
    const enriched = await Promise.all(
      all.map(async (listing: Record<string, unknown>) => {
        const hash = urlHash(listing.url as string);
        const classification = await lookupClassification(hash);
        return classification ? { ...listing, classification } : listing;
      })
    );

    // Prepend runtime listings (submitted via POST /api/listings this session)
    // so form-submitted listings appear immediately without waiting for agent scan cycle
    res.json([...runtimeListings, ...enriched]);
  } catch {
    // LISTINGS.md missing or unparseable — return runtime listings only (agent not started yet)
    res.json([...runtimeListings]);
  }
});

// ---------------------------------------------------------------------------
// POST /api/listings
// Accepts a new listing from the resale flow form, attaches a demo classification,
// stores it in runtimeListings (prepended to GET /api/listings), and returns the full listing.
// ---------------------------------------------------------------------------
app.post('/api/listings', (req, res) => {
  const { eventName, section, quantity, price, faceValue } = req.body as {
    eventName: string;
    section: string;
    quantity: number;
    price: number;
    faceValue: number;
  };

  // Compute how far above (or below) face value the price is
  const priceDeltaPct = Math.round(((price - faceValue) / faceValue) * 100);
  // Unique demo URL for this listing — used for escrow ID generation downstream
  const url = `https://ducket.demo/listing/${Date.now()}`;

  // Assign a deterministic classification based on price delta (demo seed logic)
  const classification = pickDemoClassification(priceDeltaPct);

  const listing = {
    platform: 'Ducket',
    seller: 'alice_seller',
    price,
    faceValue,
    priceDeltaPct,
    url,
    listingDate: new Date().toISOString(),
    // Flag obvious scalping so buyers see red flags in the listing table
    redFlags: priceDeltaPct > 100 ? ['price above face value'] : [],
    eventName,
    section,
    quantity,
    source: 'mock' as const,
    classification,
  };

  // Store for immediate visibility in GET /api/listings
  runtimeListings.unshift(listing);
  res.json(listing);
});

// ---------------------------------------------------------------------------
// POST /api/escrow/deposit
// Locks USDT in escrow for a given listing URL.
// If Sepolia env vars are missing, returns a mock response (demo resilience).
// Uses dynamic import of escrow.js — avoids startup crash when env vars absent.
// ---------------------------------------------------------------------------
app.post('/api/escrow/deposit', async (req, res) => {
  const { listingUrl } = req.body as { listingUrl: string };

  // Generate a short escrow ID tied to this listing URL + timestamp
  const escrowId = createHash('sha256')
    .update(listingUrl + Date.now())
    .digest('hex')
    .slice(0, 16);

  // Mock fallback when Sepolia credentials are not configured (works out of the box in demo)
  if (!process.env.SEPOLIA_RPC_URL || !process.env.ESCROW_WALLET_SEED) {
    return res.json({
      txHash: '0xmockdepositdemo000000000000000000000000000000000000000000000001',
      escrowId,
      etherscanLink:
        'https://sepolia.etherscan.io/tx/0xmockdepositdemo000000000000000000000000000000000000000000000001',
      mock: true,
    });
  }

  // Live path — dynamically imported to avoid top-level import errors when env vars absent
  try {
    const { depositEscrow } = await import('../../agent/src/escrow.js');
    const result = await depositEscrow({ escrowId });
    if (!result) {
      return res.status(500).json({ error: 'Deposit failed' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------------
// GET /api/wallet
// Reads deployed.json for wallet/contract addresses.
// Queries Sepolia RPC for ETH and USDT balances via ethers.JsonRpcProvider.
// 5-second timeout — returns cached last-known values on timeout (demo resilience).
// ---------------------------------------------------------------------------
app.get('/api/wallet', async (req, res) => {
  try {
    const raw = await readFile(DEPLOYED_PATH, 'utf8');
    const deployed = JSON.parse(raw);
    const { FraudEscrow, usdt, deployer } = deployed.sepolia;

    // Fetch live balances from Sepolia — wrapped in 5-second Promise.race for demo resilience
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    if (!rpcUrl) {
      const result = {
        address: deployer,
        ethBalance: '0.0',
        usdtBalance: '0.0',
        escrowContract: FraudEscrow,
        custodyType: 'client-side only (WDK non-custodial)',
        network: 'Sepolia',
        error: 'SEPOLIA_RPC_URL not set',
      };
      cachedWallet = result;
      return res.json(result);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const usdtAbi = ['function balanceOf(address) view returns (uint256)'];
    const usdtContract = new ethers.Contract(usdt, usdtAbi, provider);

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('RPC timeout')), 5000)
    );

    const balances = Promise.all([
      provider.getBalance(deployer),
      usdtContract.balanceOf(deployer),
    ]);

    const [ethBal, usdtBal] = (await Promise.race([balances, timeout])) as [bigint, bigint];

    const result = {
      address: deployer,
      ethBalance: ethers.formatEther(ethBal),
      usdtBalance: ethers.formatUnits(usdtBal, 6),
      escrowContract: FraudEscrow,
      custodyType: 'client-side only (WDK non-custodial)',
      network: 'Sepolia',
    };
    cachedWallet = result;
    res.json(result);
  } catch (err) {
    // Return cached values on RPC timeout — prevents dashboard stall during demo
    if (cachedWallet) {
      return res.json({ ...cachedWallet, cached: true });
    }
    res.status(500).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------------
// GET /api/cases/:urlHash
// Finds and returns the case file whose filename contains the given URL hash.
// Returns 404 JSON if no case file exists (listing was logged_only).
// ---------------------------------------------------------------------------
app.get('/api/cases/:urlHash', async (req, res) => {
  try {
    const { urlHash: hash } = req.params;
    const files = await readdir(CASES_DIR).catch(() => []);
    // Case file names: {timestamp}-{platform}-{urlHash}.md
    const file = files.find((f) => f.includes(hash));
    if (!file) {
      return res.status(404).json({ error: 'not found' });
    }
    const content = await readFile(join(CASES_DIR, file), 'utf8');
    res.json({ filename: file, content });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * pickDemoClassification(priceDeltaPct) — deterministic demo classifier.
 * Assigns a Classification based on price delta thresholds without calling
 * the LLM agent, so the resale flow UI works fully offline.
 *
 * Branches:
 *   > 100%  → SCALPING_VIOLATION (slash escrow)
 *   < -10%  → LIKELY_SCAM (refund buyer)
 *   else    → LEGITIMATE (release to seller)
 *
 * Each reasoning string is 50+ words so the Agent Decision Panel has substance.
 */
function pickDemoClassification(priceDeltaPct: number) {
  if (priceDeltaPct > 100) {
    return {
      category: 'SCALPING_VIOLATION' as const,
      confidence: 91,
      // ~80 words — references listing field so reasoning feels data-driven
      reasoning: `This listing is priced at ${priceDeltaPct}% above face value, far exceeding the 100% threshold that triggers a SCALPING_VIOLATION classification. The section and event name are consistent with FIFA World Cup 2026 Group Stage pricing data. At this markup level the listing exploits high-demand inventory and harms buyers who rely on fair resale access. Ducket AI has automatically locked 10 USDT in escrow and initiated a slash to the anti-fraud bounty pool. Autonomous enforcement completed without human intervention.`,
      classificationSource: 'demo-seed',
      actionTaken: 'slash',
      etherscanLink:
        'https://sepolia.etherscan.io/tx/0xdemo000000000000000000000000000000000000000000000000000000000001',
    };
  }

  if (priceDeltaPct < -10) {
    return {
      category: 'LIKELY_SCAM' as const,
      confidence: 74,
      // ~70 words — references below-face-value fraud pattern
      reasoning: `This listing is priced at ${priceDeltaPct}% below face value, a pattern strongly associated with fraudulent ticket sales. Legitimate sellers rarely offer tickets below the original face value on the secondary market. The anomalously low price suggests the seller may not possess valid tickets or intends to disappear after collecting payment. Ducket AI has issued a full USDT refund to the buyer. Escrow funds returned. No seller payout authorised until re-verification passes.`,
      classificationSource: 'demo-seed',
      actionTaken: 'refund',
      etherscanLink:
        'https://sepolia.etherscan.io/tx/0xdemo000000000000000000000000000000000000000000000000000000000002',
    };
  }

  return {
    category: 'LEGITIMATE' as const,
    confidence: 82,
    // ~65 words — references acceptable markup and event context
    reasoning: `This listing is priced at ${priceDeltaPct}% above face value, within the acceptable resale markup threshold. The event name and price point are consistent with verified secondary-market data for comparable fixtures. No fraud signals detected in the listing metadata. Ducket AI has cleared this listing and authorised USDT release to the seller upon buyer confirmation. Escrow settlement completed automatically without human intervention.`,
    classificationSource: 'demo-seed',
    actionTaken: 'release',
    etherscanLink:
      'https://sepolia.etherscan.io/tx/0xdemo000000000000000000000000000000000000000000000000000000000003',
  };
}

/**
 * urlHash(url) — 16-char SHA-256 slice of listing URL.
 * Matches the pattern used by agent/src/evidence.js for case file naming.
 */
function urlHash(url: string): string {
  return createHash('sha256').update(url ?? '').digest('hex').slice(0, 16);
}

/**
 * lookupClassification(hash) — parse classification fields from a case file.
 * Returns null if no case file exists for this hash (listing was logged_only).
 *
 * Parses Markdown table rows from the case file written by evidence.js:
 *   | Category | **VALUE** |
 *   | Confidence | NUMBER% |
 *   | Action Taken | VALUE |
 * Plus the first Sepolia Etherscan link found.
 */
async function lookupClassification(hash: string): Promise<object | null> {
  try {
    const files = await readdir(CASES_DIR).catch(() => []);
    const file = files.find((f) => f.includes(hash));
    if (!file) return null;

    const content = await readFile(join(CASES_DIR, file), 'utf8');

    // Parse classification fields from markdown table rows
    const categoryMatch = content.match(/\|\s*Category\s*\|\s*\*\*([^*]+)\*\*\s*\|/);
    const confidenceMatch = content.match(/\|\s*Confidence\s*\|\s*(\d+)%\s*\|/);
    const reasoningMatch = content.match(/\*\*Reasoning:\*\*\s*(.+)/);
    const sourceMatch = content.match(/\|\s*Classification Source\s*\|\s*([^|]+)\|/);
    const actionMatch = content.match(/\|\s*Action Taken\s*\|\s*([^|]+)\|/);
    // First Sepolia Etherscan link in the file
    const etherscanMatch = content.match(/https:\/\/sepolia\.etherscan\.io\/tx\/[0-9a-fx]+/);

    if (!categoryMatch) return null;

    return {
      category: categoryMatch[1].trim(),
      confidence: confidenceMatch ? parseInt(confidenceMatch[1], 10) : 0,
      reasoning: reasoningMatch ? reasoningMatch[1].trim() : '',
      classificationSource: sourceMatch ? sourceMatch[1].trim() : '',
      actionTaken: actionMatch ? actionMatch[1].trim() : undefined,
      etherscanLink: etherscanMatch ? etherscanMatch[0] : undefined,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[API] Ducket API server running on http://localhost:${PORT}`);
  console.log(`[API] Reading from: ${LISTINGS_PATH}`);
});
