---
phase: 06-escrow-enforcement-wiring
plan: "01"
subsystem: escrow
tags: [escrow, wdk, ethers, on-chain-enforcement, usdt]
dependency_graph:
  requires:
    - contracts/artifacts/src/FraudEscrow.sol/FraudEscrow.json
    - contracts/deployed.json
    - agent/src/wallet/index.ts
    - agent/src/evidence.js
  provides:
    - agent/src/escrow.js (depositEscrow, releaseEscrow, refundEscrow, slashEscrow, makeEscrowId, makeBondEscrowId, dispatchEscrowAction)
    - agent/src/evidence.js#updateCaseFileEscrow
  affects:
    - agent/src/scan-loop.js (consume dispatchEscrowAction)
tech_stack:
  added: []
  patterns:
    - WDK approve() + encodeFunctionData() + sendTransaction() bridge for deposit
    - ethers.Wallet(SEPOLIA_DEPLOYER_PRIVATE_KEY) for onlyOwner calls (release/refund/slash)
    - Lazy ESM import for wallet/index.ts to enable pure-function unit testing
    - stderr-only logging with [Escrow] prefix
key_files:
  created:
    - agent/src/escrow.js
    - agent/tests/test-escrow.js
  modified:
    - agent/src/evidence.js
decisions:
  - "Lazy wallet import in escrow.js: dynamic import() deferred to first WDK call so unit tests can load the module without ESCROW_WALLET_SEED or SEPOLIA_RPC_URL env vars"
  - "Two-key pattern: WDK wallet (ESCROW_WALLET_SEED) handles deposit (approve+sendTransaction); ethers.Wallet(SEPOLIA_DEPLOYER_PRIVATE_KEY) handles onlyOwner calls — FraudEscrow.owner() is the deployer address, not the WDK address"
  - "Fixed 10 USDT (10n * 10n**6n) per escrow action — simple for demo, trackable on Etherscan"
  - "Balance guard returns null (not throw) when insufficient USDT — demo never crashes"
  - "BOUNTY_POOL_ADDRESS env var with ESCROW_ADDRESS as fallback — safe default for demo"
metrics:
  duration: "~20min"
  completed: "2026-03-19T12:04:32Z"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 06 Plan 01: Escrow Enforcement Module Summary

**One-liner:** WDK-to-ethers signer bridge for 10 USDT deposit/release/refund/slash lifecycle using FraudEscrow.sol on Sepolia, with 27 unit tests passing.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create escrow module and updateCaseFileEscrow | 52a0f9a | agent/src/escrow.js (created), agent/src/evidence.js (modified) |
| 2 | Unit tests for escrow module | 98f0ee8 | agent/tests/test-escrow.js (created) |

## What Was Built

### agent/src/escrow.js

On-chain enforcement layer that converts classification decisions into USDT movements on Sepolia. Exports 7 functions:

- `makeEscrowId(url, timestamp)` — bytes32 keccak256 for listing escrows (timestamp ensures uniqueness)
- `makeBondEscrowId(eventName)` — bytes32 keccak256 for organizer bond escrows (separate namespace)
- `depositEscrow({ escrowId, isBond, caseFilePath })` — WDK approve() then sendTransaction with ABI-encoded deposit()
- `releaseEscrow({ escrowId, recipientAddress })` — ethers.Wallet onlyOwner release to seller
- `refundEscrow({ escrowId })` — ethers.Wallet onlyOwner refund to depositor
- `slashEscrow({ escrowId, bountyPool })` — ethers.Wallet onlyOwner slash to bounty pool
- `dispatchEscrowAction({ category, listing, caseFilePath, timestamp })` — deposit + dispatch by category

### agent/src/evidence.js

Added `updateCaseFileEscrow(filepath, txHash, action)`:
- Reads case file, replaces `_(pending escrow transaction)_` with markdown Etherscan link
- Marks action row as `(confirmed)`
- Logs to stderr with `[Evidence]` prefix

### agent/tests/test-escrow.js

27 unit tests covering all pure functions and file I/O — no WDK/RPC required:
- makeEscrowId: format, 0x prefix, 66-char bytes32, hex validation
- makeBondEscrowId: same format checks, determinism, cross-namespace uniqueness
- Hash uniqueness: listing vs bond differ, timestamps produce distinct IDs
- All 7 exports exist and are callable
- updateCaseFileEscrow: placeholder replacement, (confirmed) marker, markdown link format

## Decisions Made

1. **Lazy wallet import** — `import('./wallet/index.js')` deferred to first WDK call. Without this, `import('./agent/src/escrow.js')` throws `ERR_MODULE_NOT_FOUND` because `wallet/index.ts` cannot be resolved by plain `node`. Lazy import allows unit tests to load the module and test pure functions without env vars.

2. **Two-key pattern** — WDK wallet for deposit (satisfies hackathon mandatory WDK requirement); ethers.Wallet for release/refund/slash (FraudEscrow.sol is `onlyOwner`, owner = deployer). This is the correct architecture per RESEARCH.md Pitfall 1.

3. **ESCROW_AMOUNT as constant** — `10n * (10n ** BigInt(USDT_DECIMALS))` = 10 USDT fixed per action. Simple for demo, unambiguous on Etherscan.

4. **null-return on failure** — Balance guard and all catch blocks return `null` instead of throwing. Scan loop can continue even if escrow fails (e.g., testnet faucet issues mid-demo).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Lazy wallet import to fix ESM module resolution**

- **Found during:** Task 1 verification
- **Issue:** `import { getAccount } from './wallet/index.js'` is a static ESM import. `wallet/index.ts` is a TypeScript file that plain `node` cannot resolve. The module would fail to load with `ERR_MODULE_NOT_FOUND` in any non-tsx context (including unit tests).
- **Fix:** Replaced static import with a module-level lazy `getAccount()` wrapper that calls `import('./wallet/index.js')` dynamically on first use. Unit tests load the module, call pure functions, and never trigger the dynamic import.
- **Files modified:** agent/src/escrow.js
- **Commit:** 52a0f9a (part of Task 1 commit)

## Verification

```
node agent/tests/test-escrow.js                          # 27/27 passed, exits 0
node --input-type=module <<< "import('./agent/src/escrow.js').then(() => console.log('OK'))"
# escrow.js loads without error
node --input-type=module <<< "import { updateCaseFileEscrow } from './agent/src/evidence.js'; console.log(typeof updateCaseFileEscrow)"
# function
grep -c 'export' agent/src/escrow.js                     # 7
```

## Self-Check: PASSED

- [x] agent/src/escrow.js exists (created in commit 52a0f9a)
- [x] agent/tests/test-escrow.js exists (created in commit 98f0ee8)
- [x] agent/src/evidence.js modified (updateCaseFileEscrow added in commit 52a0f9a)
- [x] git log confirms both commits exist
- [x] All 27 tests pass (node agent/tests/test-escrow.js exits 0)
