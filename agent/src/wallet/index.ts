// Ducket AI Galactica — WDK Wallet Singleton
// Apache 2.0 License
//
// Single WalletManagerEvm instance for the agent lifetime.
// Keys are derived in-memory from the seed phrase; never serialized or logged.
// Startup guard: throws immediately if required env vars are absent.

import 'dotenv/config';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';

export type { WalletConfig, TransferResult } from './types.js';

// Private singleton — never exported; access via getWallet()
let _wallet: InstanceType<typeof WalletManagerEvm> | null = null;

/**
 * Returns the WDK WalletManagerEvm singleton.
 * Throws on first call if ESCROW_WALLET_SEED or SEPOLIA_RPC_URL are missing.
 * Subsequent calls return the cached instance (same address, same keys in memory).
 */
export function getWallet(): InstanceType<typeof WalletManagerEvm> {
  if (!process.env.ESCROW_WALLET_SEED) {
    throw new Error('ESCROW_WALLET_SEED env var is required — refusing to start');
  }
  if (!process.env.SEPOLIA_RPC_URL) {
    throw new Error('SEPOLIA_RPC_URL env var is required');
  }
  if (!_wallet) {
    // WalletManagerEvm derives BIP-44 keys from the mnemonic in-memory.
    // Provider URL is required for any on-chain call (balance, sendTransaction).
    _wallet = new WalletManagerEvm(process.env.ESCROW_WALLET_SEED, {
      provider: process.env.SEPOLIA_RPC_URL,
    });
  }
  return _wallet;
}

/**
 * Returns account at BIP-44 index (default 0).
 * Calling twice with the same index returns the same deterministic address.
 */
export async function getAccount(index = 0) {
  return getWallet().getAccount(index);
}

/**
 * Disposes the wallet singleton, clearing keys from memory.
 * Called automatically on process exit; also safe to call manually for cleanup.
 */
export function dispose(): void {
  _wallet?.dispose();
  _wallet = null;
}

// Ensure keys are cleared when the process exits (covers SIGINT, SIGTERM, and normal exit).
process.on('exit', dispose);
