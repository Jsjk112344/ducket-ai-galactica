---
phase: 02-wdk-wallet-escrow-contract
plan: "02"
subsystem: contracts
tags: [solidity, escrow, hardhat, erc20, safeerc20, reentrancy-guard, ownable, testing]
dependency_graph:
  requires: []
  provides:
    - contracts/src/FraudEscrow.sol — ERC20 escrow with deposit/release/refund/slash
    - contracts/src/MockUSDT.sol — test ERC20 with mint function
    - contracts/test/FraudEscrow.test.ts — 9 passing unit tests
    - contracts/scripts/deploy.ts — Sepolia deploy script writing deployed.json
    - contracts/hardhat.config.ts — Hardhat 3 config for local + Sepolia
  affects:
    - agent/src/ (will import deployed.json and call FraudEscrow functions)
    - .env.example (SEPOLIA_DEPLOYER_PRIVATE_KEY var consumed by hardhat.config.ts)
tech_stack:
  added:
    - hardhat 3.1.12
    - "@nomicfoundation/hardhat-toolbox-mocha-ethers@3.0.3"
    - "@openzeppelin/contracts@5.6.1"
    - chai@6.x + mocha@11.x + ethers@6.x
  patterns:
    - SafeERC20.safeTransferFrom/safeTransfer for all USDT operations
    - ReentrancyGuard on all state-mutating functions
    - Ownable(msg.sender) constructor form (OZ v5 requirement)
    - Hardhat 3 defineConfig + ESM ("type":"module" in package.json)
    - network.connect() + networkHelpers.loadFixture for test isolation
key_files:
  created:
    - contracts/src/FraudEscrow.sol
    - contracts/src/MockUSDT.sol
    - contracts/hardhat.config.ts
    - contracts/scripts/deploy.ts
    - contracts/test/FraudEscrow.test.ts
  modified:
    - contracts/package.json (added hardhat 3, toolbox-mocha-ethers, type=module)
    - .gitignore (added contracts/artifacts, cache, types exclusions)
decisions:
  - "Used @nomicfoundation/hardhat-toolbox-mocha-ethers (Hardhat 3) instead of hardhat-toolbox (Hardhat 2 shim) — hardhat-toolbox@7 exits with code 1 on Hardhat 3"
  - "Kept SEPOLIA_DEPLOYER_PRIVATE_KEY as a separate env var (not deriving from mnemonic) — simpler for Hardhat config, avoids mnemonic in config file"
  - "Used process.env.SEPOLIA_DEPLOYER_PRIVATE_KEY in hardhat.config.ts instead of configVariable() — configVariable() throws if var is unset, but deployer key is optional for local testing"
  - "Used OwnableUnauthorizedAccount custom error (OZ v5 pattern) in access control tests — OZ v5 replaced revert strings with custom errors"
metrics:
  duration: 8 minutes
  completed: "2026-03-19"
  tasks: 2
  files: 7
---

# Phase 02 Plan 02: FraudEscrow Contract + Hardhat Toolchain Summary

**One-liner:** FraudEscrow.sol with SafeERC20/ReentrancyGuard/Ownable (OZ 5.6.1), 9 passing unit tests on Hardhat 3 EDR network, Sepolia deploy script writing deployed.json.

## What Was Built

The `contracts/` workspace now has a fully functional on-chain escrow enforcement mechanism for the Ducket fraud detection agent.

**FraudEscrow.sol** implements four conditional escrow operations:
- `deposit(escrowId, amount)` — pulls USDT from caller into escrow via `safeTransferFrom`
- `release(escrowId, recipient)` — agent (owner) sends USDT to recipient when no fraud detected
- `refund(escrowId)` — agent returns USDT to depositor on event cancellation
- `slash(escrowId, bountyPool)` — agent sends USDT to bounty pool on confirmed fraud

All operations use `SafeERC20` (required because Sepolia USDT was compiled with Solidity 0.4.x and lacks proper return values), are `nonReentrant`, and emit indexed events for agent-side state reconstruction.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install Hardhat toolchain + FraudEscrow.sol + config | 71a024c | contracts/package.json, hardhat.config.ts, src/FraudEscrow.sol, scripts/deploy.ts, .gitignore |
| 2 | Write FraudEscrow unit tests | 941548a | contracts/src/MockUSDT.sol, contracts/test/FraudEscrow.test.ts |

## Verification Results

```
FraudEscrow
  deposit
    ✔ should store the escrow record and emit Deposited event (46ms)
    ✔ should revert if escrowId already exists (duplicate deposit)
  release
    ✔ should transfer USDT to recipient and emit Released event
    ✔ should revert if escrow is not PENDING (double release)
  refund
    ✔ should return USDT to depositor and emit Refunded event
    ✔ should revert if escrow is not PENDING (already refunded)
  slash
    ✔ should send USDT to bountyPool and emit Slashed event
    ✔ should revert if escrow is not PENDING (already slashed)
  access control
    ✔ should revert release/refund/slash if caller is not owner

9 passing (90ms)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocked] Hardhat 2 toolbox incompatible with Hardhat 3**

- **Found during:** Task 1
- **Issue:** The plan specified `@nomicfoundation/hardhat-toolbox@7.0.0`, but this package is a compatibility shim that explicitly exits with code 1 when used with Hardhat 3 (it only supports Hardhat 2). The npm `latest` tag was repurposed as a migration guide, not a functional plugin.
- **Fix:** Replaced with `@nomicfoundation/hardhat-toolbox-mocha-ethers@3.0.3` (the correct Hardhat 3 equivalent). Rewrote `hardhat.config.ts` using `defineConfig()` and the new Hardhat 3 network config format (`type: "http"`, `type: "edr-simulated"`, `chainType: "l1"`). Added `"type": "module"` to contracts/package.json (Hardhat 3 requires ESM). Updated test file to use `await network.connect()` + `networkHelpers.loadFixture()` (Hardhat 3 test API).
- **Files modified:** contracts/package.json, contracts/hardhat.config.ts, contracts/test/FraudEscrow.test.ts
- **Commits:** 71a024c (config), 941548a (tests)

**2. [Rule 2 - Missing] OZ v5 uses custom errors instead of revert strings for Ownable**

- **Found during:** Task 2
- **Issue:** The plan's access control test expected a revert string, but OpenZeppelin v5 replaced `require` strings in Ownable with custom errors (`OwnableUnauthorizedAccount`).
- **Fix:** Used `revertedWithCustomError(escrow, "OwnableUnauthorizedAccount")` in the access control test.
- **Files modified:** contracts/test/FraudEscrow.test.ts
- **Commit:** 941548a

## Decisions Made

1. **Separate SEPOLIA_DEPLOYER_PRIVATE_KEY vs. mnemonic for Hardhat deploy** — Using a separate deployer private key in `.env` instead of deriving from `ESCROW_WALLET_SEED`. Simpler Hardhat config, no coupling between agent wallet and deployment wallet.

2. **process.env instead of configVariable() for optional Sepolia vars** — `configVariable()` throws at config load time if the env var is missing. Since `SEPOLIA_DEPLOYER_PRIVATE_KEY` is optional for local testing, `process.env` with an empty accounts array is the safer default.

3. **Hardhat 3 defineConfig API** — Hardhat 3 breaks from the Hardhat 2 `HardhatUserConfig` pattern. All config now goes through `defineConfig()` with the `plugins` array replacing the `require()` side-effect imports.

## Requirements Satisfied

- WLLT-01: FraudEscrow.sol is the on-chain enforcement mechanism for agent-managed USDT escrow
- WLLT-02: Contract uses only SafeERC20 + standard ERC20 approve+transferFrom — no custodial patterns

## Next Steps

- Phase 02 Plan 01: WDK wallet integration (agent/src/wallet/) — reads `contracts/deployed.json`
- Sepolia deployment: fund deployer wallet with Sepolia ETH, run `npm run deploy:sepolia --workspace=contracts`
- Integration: agent calls `FraudEscrow.deposit/release/refund/slash` via ethers.js `Contract` instance

## Self-Check: PASSED

Files verified:
- FOUND: contracts/src/FraudEscrow.sol
- FOUND: contracts/src/MockUSDT.sol
- FOUND: contracts/hardhat.config.ts
- FOUND: contracts/scripts/deploy.ts
- FOUND: contracts/test/FraudEscrow.test.ts

Commits verified:
- FOUND: 71a024c (Task 1)
- FOUND: 941548a (Task 2)
