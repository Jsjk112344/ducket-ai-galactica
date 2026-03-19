// SPDX-License-Identifier: Apache-2.0
// Ducket AI Galactica — Fraud Escrow Contract
// Agent-driven conditional escrow: deposit/release/refund/slash on USDT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FraudEscrow
 * @notice On-chain enforcement mechanism for the Ducket fraud detection agent.
 *         The agent (owner) deposits USDT on behalf of event organizers, then
 *         conditionally releases, refunds, or slashes based on fraud signals.
 *
 * @dev Uses SafeERC20 for all USDT transfers — required because the real Sepolia
 *      USDT (0x7169d38820dfd117c3fa1f22a697dba58d90ba06) was compiled with
 *      Solidity 0.4.x and does not return a bool from transfer().
 *
 * Flow:
 *   1. Agent calls USDT.approve(escrowContract, amount)
 *   2. Agent calls deposit(escrowId, amount) — pulls USDT into escrow
 *   3. After fraud classification:
 *      - No fraud → release(escrowId, recipient) sends USDT to the seller
 *      - Organizer cancels → refund(escrowId) returns USDT to depositor
 *      - Fraud confirmed → slash(escrowId, bountyPool) sends USDT to bounty pool
 *
 * All operations emit events with indexed escrowId for agent-side state reconstruction.
 */
contract FraudEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Escrow lifecycle states
    enum Status { PENDING, RELEASED, REFUNDED, SLASHED }

    struct EscrowRecord {
        address depositor; // who deposited (agent wallet or organizer)
        uint256 amount;    // USDT amount in 6-decimal units
        Status status;     // current lifecycle state
    }

    /// @notice The USDT token contract (immutable — set at deploy time)
    IERC20 public immutable usdt;

    /// @notice All escrow records keyed by escrowId (bytes32 hash of event + metadata)
    mapping(bytes32 => EscrowRecord) public escrows;

    // ── Events ────────────────────────────────────────────────────────────────
    // Indexed escrowId enables efficient agent-side event filtering

    /// @notice Emitted when USDT is locked into escrow
    event Deposited(bytes32 indexed escrowId, address depositor, uint256 amount);

    /// @notice Emitted when USDT is released to the intended recipient (no fraud)
    event Released(bytes32 indexed escrowId, address recipient, uint256 amount);

    /// @notice Emitted when USDT is returned to the depositor (cancelled event)
    event Refunded(bytes32 indexed escrowId, address depositor, uint256 amount);

    /// @notice Emitted when USDT is slashed to the bounty pool (fraud confirmed)
    event Slashed(bytes32 indexed escrowId, address bountyPool, uint256 amount);

    // ── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _usdt Address of the USDT ERC20 contract on the target network
     */
    constructor(address _usdt) Ownable(msg.sender) {
        usdt = IERC20(_usdt);
    }

    // ── Escrow Operations ─────────────────────────────────────────────────────

    /**
     * @notice Lock USDT into escrow for a specific event.
     *         Caller must have pre-approved this contract for `amount` USDT.
     * @param escrowId Unique identifier (keccak256 of event metadata)
     * @param amount   USDT amount to lock (6-decimal units)
     */
    function deposit(bytes32 escrowId, uint256 amount) external nonReentrant {
        // Prevent overwriting an existing escrow — escrowId must be unique
        require(escrows[escrowId].amount == 0, "escrow exists");

        // Pull USDT from caller — SafeERC20 handles USDT's non-standard return
        usdt.safeTransferFrom(msg.sender, address(this), amount);

        escrows[escrowId] = EscrowRecord(msg.sender, amount, Status.PENDING);
        emit Deposited(escrowId, msg.sender, amount);
    }

    /**
     * @notice Release escrowed USDT to a recipient (fraud detection: clean).
     *         Only callable by the agent (owner).
     * @param escrowId  The escrow to settle
     * @param recipient Address to receive the USDT (e.g., ticket seller)
     */
    function release(bytes32 escrowId, address recipient) external onlyOwner nonReentrant {
        EscrowRecord storage r = escrows[escrowId];
        require(r.status == Status.PENDING, "not pending");
        r.status = Status.RELEASED;
        usdt.safeTransfer(recipient, r.amount);
        emit Released(escrowId, recipient, r.amount);
    }

    /**
     * @notice Refund escrowed USDT to the original depositor (event cancelled).
     *         Only callable by the agent (owner).
     * @param escrowId The escrow to refund
     */
    function refund(bytes32 escrowId) external onlyOwner nonReentrant {
        EscrowRecord storage r = escrows[escrowId];
        require(r.status == Status.PENDING, "not pending");
        r.status = Status.REFUNDED;
        usdt.safeTransfer(r.depositor, r.amount);
        emit Refunded(escrowId, r.depositor, r.amount);
    }

    /**
     * @notice Slash escrowed USDT to a bounty pool (fraud confirmed by agent).
     *         Only callable by the agent (owner).
     * @param escrowId   The fraudulent escrow to slash
     * @param bountyPool Address of the fraud bounty pool to receive slashed USDT
     */
    function slash(bytes32 escrowId, address bountyPool) external onlyOwner nonReentrant {
        EscrowRecord storage r = escrows[escrowId];
        require(r.status == Status.PENDING, "not pending");
        r.status = Status.SLASHED;
        usdt.safeTransfer(bountyPool, r.amount);
        emit Slashed(escrowId, bountyPool, r.amount);
    }
}
