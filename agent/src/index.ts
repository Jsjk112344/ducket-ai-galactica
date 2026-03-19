// Ducket AI Galactica — Agent Entry Point
// Apache 2.0 License
//
// Autonomous fraud detection agent with USDT escrow enforcement.
// Core loop: Scan → Classify → Act (no human triggers).

import 'dotenv/config';
import { getWallet, getAccount } from './wallet/index.js';

async function main() {
  console.log('Ducket Agent starting...');

  // Startup guard — fails fast if wallet env vars missing.
  // getWallet() throws if ESCROW_WALLET_SEED or SEPOLIA_RPC_URL are absent.
  const wallet = getWallet();
  const account = await getAccount();
  const address = await account.getAddress();
  console.log('Agent wallet address:', address);
  console.log('Ducket Agent ready.');
}

main().catch((err) => {
  console.error('Agent startup failed:', err.message);
  process.exit(1);
});
