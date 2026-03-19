// SPDX-License-Identifier: Apache-2.0
// Deploy script for FraudEscrow.sol — writes contract address to deployed.json
// Usage: npx hardhat run scripts/deploy.ts --network sepolia
//
// Required env vars (in root .env):
//   SEPOLIA_USDT_CONTRACT  — ERC20 USDT address on Sepolia
//   SEPOLIA_DEPLOYER_PRIVATE_KEY — deployer wallet private key

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const usdtAddress = process.env.SEPOLIA_USDT_CONTRACT;
  if (!usdtAddress) {
    throw new Error("SEPOLIA_USDT_CONTRACT env var required — see .env.example");
  }

  console.log("Deploying FraudEscrow...");
  console.log("  USDT address:", usdtAddress);

  const FraudEscrow = await ethers.getContractFactory("FraudEscrow");
  const contract = await FraudEscrow.deploy(usdtAddress);
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("FraudEscrow deployed to:", address);

  // Write deployed address to deployed.json for agent consumption
  const deployed = {
    sepolia: {
      FraudEscrow: address,
      usdt: usdtAddress,
      deployedAt: new Date().toISOString()
    }
  };

  const deployedPath = path.join(__dirname, "../deployed.json");
  fs.writeFileSync(deployedPath, JSON.stringify(deployed, null, 2));
  console.log("Written to:", deployedPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
