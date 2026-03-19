// SPDX-License-Identifier: Apache-2.0
// Hardhat 3 configuration for FraudEscrow contract compilation, testing, and Sepolia deployment
//
// Env vars (in root .env — loaded via dotenv in the config below):
//   SEPOLIA_RPC_URL              — Infura/Alchemy Sepolia JSON-RPC endpoint
//   SEPOLIA_DEPLOYER_PRIVATE_KEY — Deployer EOA private key (0x-prefixed)
//   SEPOLIA_USDT_CONTRACT        — Sepolia test USDT address (used by deploy script)

import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";
import dotenv from "dotenv";

// Load root .env so SEPOLIA_* vars are available at config parse time
dotenv.config({ path: "../.env" });

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],

  // Contracts are in contracts/src/ not the default contracts/ directory
  paths: {
    sources: "./src",
  },

  solidity: {
    profiles: {
      default: {
        version: "0.8.20",
      },
    },
  },

  networks: {
    // Sepolia testnet — only active when SEPOLIA_DEPLOYER_PRIVATE_KEY is set in .env
    // Deploy: npx hardhat run scripts/deploy.ts --network sepolia
    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.SEPOLIA_DEPLOYER_PRIVATE_KEY
        ? [process.env.SEPOLIA_DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
});
