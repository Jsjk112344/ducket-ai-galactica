---
phase: 02-wdk-wallet-escrow-contract
plan: 01
subsystem: payments
tags: [wdk, wdk-wallet-evm, ethers, dotenv, sepolia, usdt, escrow, bip44]

# Dependency graph
requires:
  - phase: 01-project-scaffold-compliance
    provides: agent/package.json workspace, agent/src/index.ts entry point, .env.example env var declarations
provides:
  - WDK wallet singleton with startup guard (agent/src/wallet/index.ts)
  - WalletConfig and TransferResult type definitions (agent/src/wallet/types.ts)
  - Agent entry point wired to wallet startup guard (agent/src/index.ts)
  - Standalone smoke test script for judges (agent/tools/wallet-smoke-test.js)
affects:
  - 02-02-escrow-contract (uses wallet module for approve+transferFrom)
  - 03-scraping (agent startup requires wallet to be initialized)
  - all subsequent agent phases (wallet is the dependency root)

# Tech tracking
tech-stack:
  added:
    - "@tetherto/wdk-wallet-evm@1.0.0-beta.8 — BIP-44 EVM wallet (mandatory per judging rules)"
    - "ethers@6.16.0 — EVM interaction layer (used internally by WDK, also available to agent)"
    - "dotenv@17.3.1 — .env loading at agent startup"
  patterns:
    - "WDK singleton via module-level private variable + getWallet() getter — one WalletManagerEvm instance per process"
    - "Startup guard: getWallet() throws immediately if ESCROW_WALLET_SEED or SEPOLIA_RPC_URL absent"
    - "process.on('exit', dispose) — keys cleared from memory on process exit"
    - "Native ETH zero-value sendTransaction for smoke test self-send (not ERC20 transfer with 0 amount)"

key-files:
  created:
    - agent/src/wallet/types.ts
    - agent/src/wallet/index.ts
    - agent/tools/wallet-smoke-test.js
  modified:
    - agent/package.json
    - agent/src/index.ts
    - .env.example

key-decisions:
  - "Pin WDK to 1.0.0-beta.8 (latest stable tag) — not 2.0.0-rc.1 (unstable rc)"
  - "Add type=module to agent/package.json — enables ESM imports in .js smoke test; compatible with tsconfig NodeNext"
  - "Use native ETH zero-value sendTransaction for smoke test — ERC20 transfer with 0n may revert on Sepolia USDT"
  - "Singleton pattern with startup guard — same seed always produces same address, fails fast on missing env vars"
  - "SEPOLIA_DEPLOYER_PRIVATE_KEY added to .env.example for Plan 02 Hardhat deploy (separate from ESCROW_WALLET_SEED)"

patterns-established:
  - "Pattern 1: WDK Singleton — create WalletManagerEvm once, expose via getWallet(); never instantiate in a loop"
  - "Pattern 2: Startup guard — validate env vars at process start, throw descriptive error, process.exit(1) in catch"
  - "Pattern 3: Dispose on exit — register process.on('exit', dispose) to clear keys; call wallet.dispose() in scripts"
  - "Pattern 4: Address-only logging — log wallet address (public), never seed/mnemonic/privateKey"

requirements-completed: [WLLT-01, WLLT-02, WLLT-03, WLLT-04]

# Metrics
duration: 12min
completed: 2026-03-19
---

# Phase 2 Plan 01: WDK Wallet Module Summary

**WDK BIP-44 wallet singleton with startup guard, dispose-on-exit cleanup, and standalone smoke test using @tetherto/wdk-wallet-evm@1.0.0-beta.8**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-19T07:37:16Z
- **Completed:** 2026-03-19T07:49:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- WDK wallet module with singleton pattern and startup guard that refuses to start without ESCROW_WALLET_SEED and SEPOLIA_RPC_URL
- Agent entry point (src/index.ts) now initializes wallet on startup and logs the deterministic wallet address
- Standalone smoke test at agent/tools/wallet-smoke-test.js: derives wallet from seed, reads USDT balance, sends 0 ETH to self, confirms txHash — runnable with `node agent/tools/wallet-smoke-test.js`
- Zero instances of raw `ethers.Wallet` in agent source; all wallet ops go through WDK exclusively (WLLT-02)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install WDK dependencies and create wallet module with types** - `0d3420e` (feat)
2. **Task 2: Create wallet smoke test script** - `8d56490` (feat)

## Files Created/Modified

- `agent/src/wallet/types.ts` - WalletConfig and TransferResult interface definitions
- `agent/src/wallet/index.ts` - WDK singleton: getWallet(), getAccount(), dispose(); startup guard; process.on exit cleanup
- `agent/src/index.ts` - Updated from placeholder to wallet startup guard (getWallet + getAccount + log address)
- `agent/tools/wallet-smoke-test.js` - Standalone ESM smoke test: env checks, wallet creation, USDT balance read, 0-ETH self-send, SMOKE TEST PASSED
- `agent/package.json` - Added WDK + ethers + dotenv dependencies; added "type": "module" for ESM compatibility
- `.env.example` - Added SEPOLIA_DEPLOYER_PRIVATE_KEY for Plan 02 Hardhat deployment

## Decisions Made

- **WDK version pinned to 1.0.0-beta.8** — latest stable npm tag; 2.0.0-rc.1 is unstable
- **"type": "module" added to agent/package.json** — required for ESM imports in .js smoke test; tsconfig already uses NodeNext which expects ESM
- **sendTransaction for 0-value smoke test** — some ERC20s revert on zero-amount `transfer()` calls; native ETH zero-value tx always succeeds and proves signing + broadcast capability
- **SEPOLIA_DEPLOYER_PRIVATE_KEY in .env.example** — Hardhat config takes `[privateKey]` array, not mnemonic; separate deployer key simplifies Plan 02 deploy config

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

External services require configuration before running the smoke test:

1. **Infura (Sepolia RPC):** Create project at https://infura.io → copy Sepolia endpoint → set `SEPOLIA_RPC_URL` in `.env`
2. **Wallet seed phrase:** Generate with `node -e "console.log(require('bip39').generateMnemonic())"` → set `ESCROW_WALLET_SEED` in `.env`
3. **Sepolia ETH for gas:** Fund the generated wallet address from a Sepolia faucet (Alchemy, Infura, or QuickNode)
4. **Verify smoke test:** `node agent/tools/wallet-smoke-test.js` — should print wallet address, USDT balance, txHash, and `SMOKE TEST PASSED`

## Next Phase Readiness

- WDK wallet module is the dependency root for all subsequent agent phases
- Plan 02-02 (FraudEscrow.sol) can now use the wallet address for `Ownable` constructor and `approve+transferFrom` escrow pattern
- `SEPOLIA_DEPLOYER_PRIVATE_KEY` in `.env.example` is ready for Hardhat config in Plan 02-02
- Blocker resolved: WDK npm package confirmed installable at 1.0.0-beta.8 (was listed as unverified in STATE.md)

---
*Phase: 02-wdk-wallet-escrow-contract*
*Completed: 2026-03-19*
