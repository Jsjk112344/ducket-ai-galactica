// SPDX-License-Identifier: Apache-2.0
// Deploy script for MockUSDT + FraudEscrow on Sepolia
// Usage: npx hardhat run scripts/deploy.ts --network sepolia
//
// Deploys MockUSDT first, mints 10,000 USDT to deployer, then deploys
// FraudEscrow pointing to MockUSDT. Writes all addresses to deployed.json.
//
// Required env vars (in root .env):
//   SEPOLIA_DEPLOYER_PRIVATE_KEY — deployer wallet private key

import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Step 1: Deploy MockUSDT
  console.log("\n1. Deploying MockUSDT...");
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUsdt = await MockUSDT.deploy();
  await mockUsdt.waitForDeployment();
  const usdtAddress = await mockUsdt.getAddress();
  console.log("   MockUSDT deployed to:", usdtAddress);

  // Step 2: Mint 10,000 USDT to deployer (6 decimals = 10_000_000_000)
  console.log("\n2. Minting 10,000 USDT to deployer...");
  const mintAmount = 10_000n * (10n ** 6n); // 10,000 USDT in 6-decimal units
  const mintTx = await mockUsdt.mint(deployer.address, mintAmount);
  await mintTx.wait();
  const balance = await mockUsdt.balanceOf(deployer.address);
  console.log("   Deployer USDT balance:", (Number(balance) / 1e6).toFixed(2));

  // Step 3: Deploy FraudEscrow pointing to MockUSDT
  console.log("\n3. Deploying FraudEscrow...");
  const FraudEscrow = await ethers.getContractFactory("FraudEscrow");
  const escrow = await FraudEscrow.deploy(usdtAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("   FraudEscrow deployed to:", escrowAddress);
  console.log("   Owner:", deployer.address);

  // Write deployed addresses to deployed.json for agent consumption
  const deployed = {
    sepolia: {
      FraudEscrow: escrowAddress,
      MockUSDT: usdtAddress,
      usdt: usdtAddress,
      deployer: deployer.address,
      mintedAmount: "10000",
      deployedAt: new Date().toISOString()
    }
  };

  const deployedPath = path.join(import.meta.dirname, "../deployed.json");
  fs.writeFileSync(deployedPath, JSON.stringify(deployed, null, 2));
  console.log("\nWritten to:", deployedPath);

  console.log("\n✓ Deploy complete");
  console.log("  MockUSDT:", usdtAddress);
  console.log("  FraudEscrow:", escrowAddress);
  console.log("  Deployer USDT:", (Number(balance) / 1e6).toFixed(2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
