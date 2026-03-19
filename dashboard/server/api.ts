// Ducket AI Galactica — Express API Server
// Serves agent data files (LISTINGS.md, case files, deployed.json) as JSON endpoints.
// Runs on port 3001; Vite dev server proxies /api/* here to avoid CORS.
//
// Endpoints:
//   GET /api/listings         — all scanned listings, enriched with classification from case files
//   GET /api/wallet           — wallet address, ETH/USDT balances from Sepolia via ethers.js
//   GET /api/cases/:urlHash   — raw case file markdown for Agent Decision Panel
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

    res.json(enriched);
  } catch {
    // LISTINGS.md missing or unparseable — return empty (agent not started yet)
    res.json([]);
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
