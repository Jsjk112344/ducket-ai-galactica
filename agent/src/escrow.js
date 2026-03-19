// Ducket AI Galactica — Escrow Enforcement Module
// Apache 2.0 License
//
// On-chain enforcement layer: converts agent classification decisions into
// irreversible USDT movements on Sepolia via FraudEscrow.sol.
//
// Lifecycle:
//   1. deposit  — WDK wallet approves + deposits USDT into FraudEscrow
//   2. release  — deployer key releases USDT to seller (LEGITIMATE)
//   3. refund   — deployer key returns USDT to depositor (LIKELY_SCAM / COUNTERFEIT_RISK)
//   4. slash    — deployer key sends USDT to bounty pool (SCALPING_VIOLATION)
//
// Two key patterns:
//   - deposit uses WDK (approve() + sendTransaction()) — satisfies mandatory WDK requirement
//   - release/refund/slash use ethers.Wallet(SEPOLIA_DEPLOYER_PRIVATE_KEY) — FraudEscrow is onlyOwner
//
// Anti-patterns avoided:
//   - Never use account._account to bypass WDK memory safety
//   - Never Promise.all approve+deposit — they must be sequential
//   - Never ethers.utils.* — ethers v6 uses flat namespace

import { ethers } from 'ethers';
import { createRequire } from 'node:module';
import { updateCaseFileEscrow } from './evidence.js';

// Lazy wallet import — deferred to first WDK call so unit tests can import this module
// without requiring ESCROW_WALLET_SEED or SEPOLIA_RPC_URL to be set.
// The wallet/index.ts file is a TypeScript module that runs via tsx in production.
let _getAccount;
async function getAccount(index = 0) {
  if (!_getAccount) {
    const wallet = await import('./wallet/index.js');
    _getAccount = wallet.getAccount;
  }
  return _getAccount(index);
}

// Load compiled ABI and deployed addresses via createRequire (ESM → CommonJS JSON)
const require = createRequire(import.meta.url);
const artifact = require('../../contracts/artifacts/src/FraudEscrow.sol/FraudEscrow.json');
const deployed = require('../../contracts/deployed.json');

// ── Constants ────────────────────────────────────────────────────────────────

const ESCROW_INTERFACE = new ethers.Interface(artifact.abi);
const ESCROW_ADDRESS = deployed.sepolia.FraudEscrow;   // 0x6427d51c4167373bF59712715B1930e80EcA8102
const USDT_ADDRESS = deployed.sepolia.usdt;            // 0x7169d38820dfd117c3fa1f22a697dba58d90ba06
const USDT_DECIMALS = 6;
const ESCROW_AMOUNT = 10n * (10n ** BigInt(USDT_DECIMALS)); // fixed 10 USDT per enforcement action

// Bounty pool: env override or fallback to escrow contract itself (safe for demo)
const BOUNTY_POOL = process.env.BOUNTY_POOL_ADDRESS ?? ESCROW_ADDRESS;

// All escrow logs go to stderr — keeps stdout clean for JSON piping
const log = (...args) => process.stderr.write('[Escrow] ' + args.join(' ') + '\n');

// ── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * waitForConfirmation — poll WDK's getTransactionReceipt until mined or timeout.
 *
 * WDK's sendTransaction returns {hash, fee} immediately without waiting for mining.
 * We must poll to confirm the approval tx before submitting the deposit.
 *
 * @param {object} account  WDK WalletAccountEvm
 * @param {string} hash     Transaction hash to poll
 * @param {number} maxAttempts  Maximum poll attempts (default 10)
 * @param {number} delayMs      Milliseconds between polls (default 2000)
 * @returns {Promise<object>} receipt when confirmed
 * @throws {Error} if not confirmed within maxAttempts * delayMs
 */
async function waitForConfirmation(account, hash, maxAttempts = 10, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    const receipt = await account.getTransactionReceipt(hash);
    if (receipt !== null) return receipt;
    log(`Waiting for tx ${hash.slice(0, 10)}... (attempt ${i + 1}/${maxAttempts})`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`Tx ${hash} not confirmed after ${maxAttempts} attempts`);
}

/**
 * getOwnerSigner — create an ethers.Wallet from the deployer private key.
 *
 * FraudEscrow.sol's release/refund/slash are onlyOwner. The contract owner is
 * the address that deployed it (SEPOLIA_DEPLOYER_PRIVATE_KEY). The WDK wallet
 * (ESCROW_WALLET_SEED index 0) is a different address used for the deposit path.
 *
 * @returns {ethers.Wallet} signer connected to Sepolia
 */
function getOwnerSigner() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  return new ethers.Wallet(process.env.SEPOLIA_DEPLOYER_PRIVATE_KEY, provider);
}

// ── escrowId Generators ───────────────────────────────────────────────────────

/**
 * makeEscrowId — deterministic bytes32 for a listing escrow.
 *
 * Includes timestamp to guarantee uniqueness across scan cycles
 * (FraudEscrow.deposit() reverts on duplicate escrowId).
 *
 * @param {string} listingUrl  Listing URL
 * @param {string|number} timestamp  Epoch ms or ISO string
 * @returns {string} 0x-prefixed bytes32 hex string
 */
export function makeEscrowId(listingUrl, timestamp) {
  return ethers.keccak256(ethers.toUtf8Bytes(`listing:${listingUrl}:${timestamp}`));
}

/**
 * makeBondEscrowId — deterministic bytes32 for an organizer legitimacy bond.
 *
 * Uses a separate namespace ('bond:') so bond escrows are never confused with
 * per-listing escrows. Bond is deposited once on agent startup.
 *
 * @param {string} eventName  Event name used as bond identifier
 * @returns {string} 0x-prefixed bytes32 hex string
 */
export function makeBondEscrowId(eventName) {
  return ethers.keccak256(ethers.toUtf8Bytes(`bond:${eventName}`));
}

// ── Escrow Lifecycle ──────────────────────────────────────────────────────────

/**
 * depositEscrow — lock 10 USDT into FraudEscrow via WDK wallet.
 *
 * Two-step process (must be sequential — not parallel):
 *   1. WDK account.approve() — authorises FraudEscrow to pull USDT
 *   2. account.sendTransaction() with ABI-encoded deposit() calldata
 *
 * Balance guard: if WDK wallet has < 10 USDT, logs a warning and returns null.
 * Demo never crashes on insufficient balance.
 *
 * @param {object} opts
 * @param {string} opts.escrowId    bytes32 escrow identifier
 * @param {boolean} [opts.isBond]   true if this is an organizer bond deposit
 * @param {string} [opts.caseFilePath]  path to update on failure (optional)
 * @returns {Promise<{txHash, escrowId, etherscanLink}|null>}
 */
export async function depositEscrow({ escrowId, isBond = false, caseFilePath }) {
  try {
    const account = await getAccount(0);

    // Balance guard — demo never crashes on insufficient funds
    const balance = await account.getTokenBalance(USDT_ADDRESS);
    if (balance < ESCROW_AMOUNT) {
      log(`WARN: insufficient USDT balance (${balance} < ${ESCROW_AMOUNT}), skipping deposit`);
      return null;
    }

    const label = isBond ? 'bond deposit' : 'deposit';
    log(`${label}: approving ${ESCROW_AMOUNT} USDT for FraudEscrow...`);

    // Step 1: approve — WDK handles ERC20 approval natively
    const approveResult = await account.approve({
      token: USDT_ADDRESS,
      spender: ESCROW_ADDRESS,
      amount: ESCROW_AMOUNT,
    });
    log(`Approve tx: ${approveResult.hash}`);

    // Step 2: wait for approve tx to confirm before calling deposit
    // (USDT safeTransferFrom will revert if allowance not yet set on-chain)
    await waitForConfirmation(account, approveResult.hash);
    log(`Approve confirmed. Submitting deposit...`);

    // Step 3: ABI-encode deposit() calldata and submit via WDK sendTransaction
    // (WDK does not expose a native ethers Signer — this is the correct bridge pattern)
    const data = ESCROW_INTERFACE.encodeFunctionData('deposit', [escrowId, ESCROW_AMOUNT]);
    const depositResult = await account.sendTransaction({
      to: ESCROW_ADDRESS,
      value: 0n,
      data,
    });

    const etherscanLink = `https://sepolia.etherscan.io/tx/${depositResult.hash}`;
    log(`${label} submitted | txHash: ${depositResult.hash}`);
    log(`Amount: ${ESCROW_AMOUNT} (10 USDT) | Etherscan: ${etherscanLink}`);

    return { txHash: depositResult.hash, escrowId, etherscanLink };
  } catch (err) {
    log(`ERROR: deposit failed: ${err.message}`);
    // Mark case file as failed if path was provided — pipeline continues regardless
    if (caseFilePath) {
      try {
        await updateCaseFileEscrow(caseFilePath, 'failed', 'escrow_deposit');
      } catch (_) {
        // Swallow — we're already in error path
      }
    }
    return null;
  }
}

/**
 * releaseEscrow — release escrowed USDT to recipient (LEGITIMATE classification).
 *
 * Uses deployer wallet (onlyOwner). Called when agent classifies listing as legitimate —
 * escrowed funds go to the ticket seller.
 *
 * @param {object} opts
 * @param {string} opts.escrowId         bytes32 escrow identifier
 * @param {string} opts.recipientAddress  Address to receive USDT (e.g. listing.sellerAddress)
 * @returns {Promise<{txHash, etherscanLink}|null>}
 */
export async function releaseEscrow({ escrowId, recipientAddress }) {
  try {
    const signer = getOwnerSigner();
    const contract = new ethers.Contract(ESCROW_ADDRESS, artifact.abi, signer);

    log(`release: escrowId ${escrowId.slice(0, 10)}... → recipient ${recipientAddress}`);
    const tx = await contract.release(escrowId, recipientAddress);
    const receipt = await tx.wait(1);

    const txHash = receipt.hash;
    const etherscanLink = `https://sepolia.etherscan.io/tx/${txHash}`;
    log(`release confirmed | txHash: ${txHash} | Etherscan: ${etherscanLink}`);

    return { txHash, etherscanLink };
  } catch (err) {
    log(`ERROR: release failed: ${err.message}`);
    return null;
  }
}

/**
 * refundEscrow — return escrowed USDT to original depositor.
 *
 * Uses deployer wallet (onlyOwner). Called for LIKELY_SCAM and COUNTERFEIT_RISK —
 * the depositor (WDK agent wallet) gets the USDT back.
 *
 * @param {object} opts
 * @param {string} opts.escrowId  bytes32 escrow identifier
 * @returns {Promise<{txHash, etherscanLink}|null>}
 */
export async function refundEscrow({ escrowId }) {
  try {
    const signer = getOwnerSigner();
    const contract = new ethers.Contract(ESCROW_ADDRESS, artifact.abi, signer);

    log(`refund: escrowId ${escrowId.slice(0, 10)}...`);
    const tx = await contract.refund(escrowId);
    const receipt = await tx.wait(1);

    const txHash = receipt.hash;
    const etherscanLink = `https://sepolia.etherscan.io/tx/${txHash}`;
    log(`refund confirmed | txHash: ${txHash} | Etherscan: ${etherscanLink}`);

    return { txHash, etherscanLink };
  } catch (err) {
    log(`ERROR: refund failed: ${err.message}`);
    return null;
  }
}

/**
 * slashEscrow — send escrowed USDT to bounty pool (SCALPING_VIOLATION).
 *
 * Uses deployer wallet (onlyOwner). Called when agent confirms scalping fraud —
 * funds are permanently redirected to the bounty pool as a penalty.
 *
 * @param {object} opts
 * @param {string} opts.escrowId   bytes32 escrow identifier
 * @param {string} [opts.bountyPool]  Override bounty pool address (defaults to BOUNTY_POOL env)
 * @returns {Promise<{txHash, etherscanLink}|null>}
 */
export async function slashEscrow({ escrowId, bountyPool }) {
  try {
    const signer = getOwnerSigner();
    const contract = new ethers.Contract(ESCROW_ADDRESS, artifact.abi, signer);
    const pool = bountyPool ?? BOUNTY_POOL;

    log(`slash: escrowId ${escrowId.slice(0, 10)}... → bountyPool ${pool}`);
    const tx = await contract.slash(escrowId, pool);
    const receipt = await tx.wait(1);

    const txHash = receipt.hash;
    const etherscanLink = `https://sepolia.etherscan.io/tx/${txHash}`;
    log(`slash confirmed | txHash: ${txHash} | Etherscan: ${etherscanLink}`);

    return { txHash, etherscanLink };
  } catch (err) {
    log(`ERROR: slash failed: ${err.message}`);
    return null;
  }
}

/**
 * dispatchEscrowAction — deposit + dispatch based on classification category.
 *
 * This is the main entry point from scan-loop.js. It:
 *   1. Generates escrowId from listing URL + timestamp
 *   2. Deposits 10 USDT into escrow
 *   3. Dispatches the appropriate action based on classification:
 *      - SCALPING_VIOLATION  → slash (penalty to bounty pool)
 *      - LIKELY_SCAM         → refund (return to depositor)
 *      - COUNTERFEIT_RISK    → refund (return to depositor)
 *      - LEGITIMATE          → release (pay to seller)
 *   4. Updates the case file with the Etherscan link
 *
 * @param {object} opts
 * @param {string} opts.category       Classification category from classify.js
 * @param {object} opts.listing        Scraper listing object
 * @param {string} opts.caseFilePath   Path to the case file to update
 * @param {string|number} opts.timestamp  Epoch ms or ISO string for escrowId uniqueness
 * @returns {Promise<{txHash, etherscanLink, escrowId, action}|null>}
 */
export async function dispatchEscrowAction({ category, listing, caseFilePath, timestamp }) {
  const escrowId = makeEscrowId(listing.url, timestamp);

  // Step 1: lock funds — this uses WDK wallet (mandatory requirement)
  const depositResult = await depositEscrow({ escrowId, caseFilePath });
  if (!depositResult) {
    log(`Deposit failed or skipped — no further action for ${category}`);
    return null;
  }

  // Step 2: dispatch the category-specific enforcement action
  let actionResult = null;
  let action = '';

  switch (category) {
    case 'SCALPING_VIOLATION':
      // Scalping confirmed — slash USDT to bounty pool as fraud penalty
      action = 'slash';
      actionResult = await slashEscrow({ escrowId, bountyPool: BOUNTY_POOL });
      break;

    case 'LIKELY_SCAM':
    case 'COUNTERFEIT_RISK':
      // Fraud detected — refund USDT to agent depositor (protects against fake sellers)
      action = 'refund';
      actionResult = await refundEscrow({ escrowId });
      break;

    case 'LEGITIMATE':
      // No fraud — release USDT to the seller (or fallback to bounty pool if no address)
      action = 'release';
      actionResult = await releaseEscrow({
        escrowId,
        recipientAddress: listing.sellerAddress ?? BOUNTY_POOL,
      });
      break;

    default:
      log(`WARN: unknown category "${category}" — no escrow action taken`);
      return null;
  }

  // Step 3: update case file with Etherscan link (best-effort — pipeline continues on failure)
  if (actionResult && caseFilePath) {
    try {
      await updateCaseFileEscrow(caseFilePath, actionResult.txHash, category);
    } catch (err) {
      log(`WARN: failed to update case file: ${err.message}`);
    }
  }

  // Per-cycle summary log for judges/demo visibility
  const result = actionResult ?? depositResult;
  log(`Cycle summary: category=${category} action=${action} txHash=${result.txHash} escrowId=${escrowId.slice(0, 10)}...`);

  return {
    txHash: result.txHash,
    etherscanLink: result.etherscanLink,
    escrowId,
    action,
  };
}
