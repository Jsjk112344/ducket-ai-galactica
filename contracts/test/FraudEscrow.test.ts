// SPDX-License-Identifier: Apache-2.0
// Unit tests for FraudEscrow.sol — runs on local Hardhat network (no Sepolia needed)
//
// Tests cover all 4 escrow operations (deposit/release/refund/slash):
//   - Events emitted with correct args
//   - USDT balances change correctly
//   - Reverts on invalid state transitions
//   - Access control: onlyOwner enforced

import { expect } from "chai";
import { network } from "hardhat";

// Hardhat 3: connect to the local EDR network to get ethers + networkHelpers
const { ethers, networkHelpers } = await network.connect();

describe("FraudEscrow", function () {
  // Deploy MockUSDT + FraudEscrow, mint test USDT, approve contract
  async function deployFixture() {
    const [owner, depositor, recipient, bountyPool, nonOwner] =
      await ethers.getSigners();

    // Deploy mock USDT token (6 decimals — matches real Sepolia USDT)
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const usdt = await MockUSDT.deploy();

    // Deploy FraudEscrow with mock USDT address
    const FraudEscrow = await ethers.getContractFactory("FraudEscrow");
    const escrow = await FraudEscrow.deploy(await usdt.getAddress());

    // Mint 10,000 USDT (6 decimals: 10_000 * 1_000_000 = 10_000_000_000) to depositor
    const mintAmount = 10_000_000_000n; // 10,000 USDT
    await usdt.mint(await depositor.getAddress(), mintAmount);

    // Depositor approves the escrow contract to pull USDT
    const escrowAddress = await escrow.getAddress();
    await usdt.connect(depositor).approve(escrowAddress, mintAmount);

    return { escrow, usdt, owner, depositor, recipient, bountyPool, nonOwner };
  }

  // Standard deposit amount used across tests: 1,000 USDT (6 decimals)
  const DEPOSIT_AMOUNT = 1_000_000_000n; // 1000 USDT

  // Unique escrowId for each test group (derived from descriptive strings)
  const ESCROW_ID_1 = ethers.encodeBytes32String("escrow-1");
  const ESCROW_ID_2 = ethers.encodeBytes32String("escrow-2");

  // ── deposit() ──────────────────────────────────────────────────────────────

  describe("deposit", function () {
    it("should store the escrow record and emit Deposited event", async function () {
      const { escrow, usdt, depositor } = await networkHelpers.loadFixture(deployFixture);

      const depositorAddress = await depositor.getAddress();
      const escrowAddress = await escrow.getAddress();

      await expect(
        escrow.connect(depositor).deposit(ESCROW_ID_1, DEPOSIT_AMOUNT),
      )
        .to.emit(escrow, "Deposited")
        .withArgs(ESCROW_ID_1, depositorAddress, DEPOSIT_AMOUNT);

      // Escrow record stored correctly
      const record = await escrow.escrows(ESCROW_ID_1);
      expect(record.depositor).to.equal(depositorAddress);
      expect(record.amount).to.equal(DEPOSIT_AMOUNT);
      expect(record.status).to.equal(0); // Status.PENDING = 0

      // Contract received the USDT
      expect(await usdt.balanceOf(escrowAddress)).to.equal(DEPOSIT_AMOUNT);
    });

    it("should revert if escrowId already exists (duplicate deposit)", async function () {
      const { escrow, depositor } = await networkHelpers.loadFixture(deployFixture);

      await escrow.connect(depositor).deposit(ESCROW_ID_1, DEPOSIT_AMOUNT);

      // Second deposit with same escrowId must revert
      await expect(
        escrow.connect(depositor).deposit(ESCROW_ID_1, DEPOSIT_AMOUNT),
      ).to.be.revertedWith("escrow exists");
    });
  });

  // ── release() ─────────────────────────────────────────────────────────────

  describe("release", function () {
    it("should transfer USDT to recipient and emit Released event", async function () {
      const { escrow, usdt, depositor, recipient, owner } =
        await networkHelpers.loadFixture(deployFixture);

      await escrow.connect(depositor).deposit(ESCROW_ID_1, DEPOSIT_AMOUNT);

      const recipientAddress = await recipient.getAddress();
      const balanceBefore = await usdt.balanceOf(recipientAddress);

      await expect(
        escrow.connect(owner).release(ESCROW_ID_1, recipientAddress),
      )
        .to.emit(escrow, "Released")
        .withArgs(ESCROW_ID_1, recipientAddress, DEPOSIT_AMOUNT);

      // Recipient received the USDT
      expect(await usdt.balanceOf(recipientAddress)).to.equal(
        balanceBefore + DEPOSIT_AMOUNT,
      );

      // Status updated to RELEASED
      const record = await escrow.escrows(ESCROW_ID_1);
      expect(record.status).to.equal(1); // Status.RELEASED = 1
    });

    it("should revert if escrow is not PENDING (double release)", async function () {
      const { escrow, depositor, recipient, owner } =
        await networkHelpers.loadFixture(deployFixture);

      const recipientAddress = await recipient.getAddress();
      await escrow.connect(depositor).deposit(ESCROW_ID_1, DEPOSIT_AMOUNT);
      await escrow.connect(owner).release(ESCROW_ID_1, recipientAddress);

      // Cannot release twice
      await expect(
        escrow.connect(owner).release(ESCROW_ID_1, recipientAddress),
      ).to.be.revertedWith("not pending");
    });
  });

  // ── refund() ──────────────────────────────────────────────────────────────

  describe("refund", function () {
    it("should return USDT to depositor and emit Refunded event", async function () {
      const { escrow, usdt, depositor, owner } =
        await networkHelpers.loadFixture(deployFixture);

      const depositorAddress = await depositor.getAddress();
      await escrow.connect(depositor).deposit(ESCROW_ID_1, DEPOSIT_AMOUNT);

      // Record depositor balance before refund (after deposit has reduced it)
      const balanceBefore = await usdt.balanceOf(depositorAddress);

      await expect(escrow.connect(owner).refund(ESCROW_ID_1))
        .to.emit(escrow, "Refunded")
        .withArgs(ESCROW_ID_1, depositorAddress, DEPOSIT_AMOUNT);

      // Depositor got their USDT back
      expect(await usdt.balanceOf(depositorAddress)).to.equal(
        balanceBefore + DEPOSIT_AMOUNT,
      );

      // Status updated to REFUNDED
      const record = await escrow.escrows(ESCROW_ID_1);
      expect(record.status).to.equal(2); // Status.REFUNDED = 2
    });

    it("should revert if escrow is not PENDING (already refunded)", async function () {
      const { escrow, depositor, owner } =
        await networkHelpers.loadFixture(deployFixture);

      await escrow.connect(depositor).deposit(ESCROW_ID_1, DEPOSIT_AMOUNT);
      await escrow.connect(owner).refund(ESCROW_ID_1);

      // Cannot refund twice
      await expect(
        escrow.connect(owner).refund(ESCROW_ID_1),
      ).to.be.revertedWith("not pending");
    });
  });

  // ── slash() ───────────────────────────────────────────────────────────────

  describe("slash", function () {
    it("should send USDT to bountyPool and emit Slashed event", async function () {
      const { escrow, usdt, depositor, bountyPool, owner } =
        await networkHelpers.loadFixture(deployFixture);

      const bountyPoolAddress = await bountyPool.getAddress();
      await escrow.connect(depositor).deposit(ESCROW_ID_1, DEPOSIT_AMOUNT);

      const balanceBefore = await usdt.balanceOf(bountyPoolAddress);

      await expect(
        escrow.connect(owner).slash(ESCROW_ID_1, bountyPoolAddress),
      )
        .to.emit(escrow, "Slashed")
        .withArgs(ESCROW_ID_1, bountyPoolAddress, DEPOSIT_AMOUNT);

      // Bounty pool received the slashed USDT
      expect(await usdt.balanceOf(bountyPoolAddress)).to.equal(
        balanceBefore + DEPOSIT_AMOUNT,
      );

      // Status updated to SLASHED
      const record = await escrow.escrows(ESCROW_ID_1);
      expect(record.status).to.equal(3); // Status.SLASHED = 3
    });

    it("should revert if escrow is not PENDING (already slashed)", async function () {
      const { escrow, depositor, bountyPool, owner } =
        await networkHelpers.loadFixture(deployFixture);

      const bountyPoolAddress = await bountyPool.getAddress();
      await escrow.connect(depositor).deposit(ESCROW_ID_1, DEPOSIT_AMOUNT);
      await escrow.connect(owner).slash(ESCROW_ID_1, bountyPoolAddress);

      // Cannot slash twice
      await expect(
        escrow.connect(owner).slash(ESCROW_ID_1, bountyPoolAddress),
      ).to.be.revertedWith("not pending");
    });
  });

  // ── Access Control ─────────────────────────────────────────────────────────

  describe("access control", function () {
    it("should revert release/refund/slash if caller is not owner", async function () {
      const { escrow, depositor, recipient, bountyPool, nonOwner } =
        await networkHelpers.loadFixture(deployFixture);

      const recipientAddress = await recipient.getAddress();
      const bountyPoolAddress = await bountyPool.getAddress();

      await escrow.connect(depositor).deposit(ESCROW_ID_1, DEPOSIT_AMOUNT);
      await escrow.connect(depositor).deposit(ESCROW_ID_2, DEPOSIT_AMOUNT);

      // release by non-owner must revert
      await expect(
        escrow.connect(nonOwner).release(ESCROW_ID_1, recipientAddress),
      ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");

      // refund by non-owner must revert
      await expect(
        escrow.connect(nonOwner).refund(ESCROW_ID_1),
      ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");

      // slash by non-owner must revert
      await expect(
        escrow.connect(nonOwner).slash(ESCROW_ID_1, bountyPoolAddress),
      ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });
  });
});
