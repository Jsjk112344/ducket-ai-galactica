// Ducket AI Galactica — WDK Wallet Smoke Test
// Apache 2.0 License
//
// Standalone smoke test: verifies the WDK wallet can be created from a seed phrase,
// read a USDT balance, and sign + broadcast a zero-value ETH transaction.
// Run with: node agent/tools/wallet-smoke-test.js (from project root)
//
// Requires .env with: ESCROW_WALLET_SEED, SEPOLIA_RPC_URL, SEPOLIA_USDT_CONTRACT

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';

// Load .env from project root (two levels up from agent/tools/)
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

async function smokeTest() {
  // Startup guards — fail fast with clear error messages
  if (!process.env.ESCROW_WALLET_SEED) {
    throw new Error('ESCROW_WALLET_SEED env var is required');
  }
  if (!process.env.SEPOLIA_RPC_URL) {
    throw new Error('SEPOLIA_RPC_URL env var is required');
  }
  if (!process.env.SEPOLIA_USDT_CONTRACT) {
    throw new Error('SEPOLIA_USDT_CONTRACT env var is required');
  }

  console.log('--- WDK Wallet Smoke Test ---');

  // Create WalletManagerEvm with seed phrase and Sepolia provider.
  // Provider is required for any on-chain call.
  const wallet = new WalletManagerEvm(process.env.ESCROW_WALLET_SEED, {
    provider: process.env.SEPOLIA_RPC_URL,
  });

  // Derive account at BIP-44 index 0 — deterministic from seed phrase
  const account = await wallet.getAccount(0);

  // getAddress() is safe to log — public info, not key material
  const address = await account.getAddress();
  console.log('Wallet address:', address);

  // Read USDT balance (6 decimals on Sepolia Test Tether)
  const balance = await account.getTokenBalance(process.env.SEPOLIA_USDT_CONTRACT);
  console.log('USDT balance:', balance.toString());

  // Send 0 ETH to self — proves signing and broadcast work without spending USDT.
  // Using sendTransaction (native ETH) instead of transfer() with 0-amount USDT
  // because some ERC20 implementations revert on zero-value transfers.
  const result = await account.sendTransaction({ to: address, value: 0n });
  console.log('txHash:', result.hash);

  console.log('SMOKE TEST PASSED');

  // Always dispose after use — clears derived keys from memory
  wallet.dispose();
}

smokeTest().catch((e) => {
  console.error('SMOKE TEST FAILED:', e.message);
  process.exit(1);
});
