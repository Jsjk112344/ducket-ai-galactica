# Phase 2: WDK Wallet + Escrow Contract - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

WDK wallet integration and FraudEscrow.sol smart contract deployment on Sepolia. Delivers: self-custodial USDT wallet that survives restarts, smoke test proving on-chain transactions, and a deployed escrow contract with deposit/release/refund/slash operations.

</domain>

<decisions>
## Implementation Decisions

### WDK Wallet Architecture
- Seed phrase persisted in `.env` via `ESCROW_WALLET_SEED` — deterministic wallet derivation on startup, agent refuses to start if env var is missing
- Single agent wallet (not per-event) — simpler for demo, one address to fund from faucet
- If WDK npm package is unavailable or broken, fallback to ethers.js for wallet ops and document the WDK attempt — partial credit is better than zero
- Smoke test at `agent/tools/wallet-smoke-test.js` — generate wallet, check USDT balance, send 0 USDT to self, confirm txHash within 60 seconds

### Escrow Contract Design
- Lightweight FraudEscrow.sol — `deposit()`, `release()`, `refund()`, `slash()` with event logs. Minimal surface for hackathon
- On-chain state via mappings (`escrowId → {amount, depositor, status}`) + events. Agent reads events to reconstruct state
- Standard `approve+transferFrom` ERC20 escrow pattern — agent approves contract to pull USDT
- Hardhat for deployment — JS/TS ecosystem matches project stack, familiar to judges

### Sepolia Testnet Strategy
- Public Sepolia RPC via Infura free tier — `SEPOLIA_RPC_URL` in .env
- Sepolia USDT faucet or manual mint if test contract allows — document process in README
- Verify `0x7169d38820dfd117c3fa1f22a697dba58d90ba06` on Sepolia Etherscan during research — fail fast if wrong
- Sepolia ETH from faucet for gas — simplest approach, document faucet URL in README

### Claude's Discretion
- Internal code organization within agent/src/ for wallet module
- Error handling patterns for failed transactions
- Hardhat configuration details

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `agent/package.json` — workspace exists with tsx/tsc scripts
- `agent/src/index.ts` — placeholder entry point ready for implementation
- `contracts/package.json` — workspace exists for Hardhat setup
- `.env.example` — already has `ESCROW_WALLET_SEED` and `SEPOLIA_RPC_URL` placeholders

### Established Patterns
- npm workspaces monorepo — `@ducket/agent`, `@ducket/contracts` scoped packages
- TypeScript with `tsconfig.base.json` extending pattern
- tsx for dev, tsc for build

### Integration Points
- `agent/src/index.ts` — wallet module will be imported here
- `contracts/src/FraudEscrow.sol` — placeholder exists, will be replaced with real contract
- `.env` variables: `ESCROW_WALLET_SEED`, `WDK_API_KEY`, `SEPOLIA_RPC_URL`, `SEPOLIA_USDT_CONTRACT`

</code_context>

<specifics>
## Specific Ideas

- WDK is completely new to the team — integration is a known risk area (from PROJECT.md)
- WDK Sepolia endpoints unvalidated — official docs show mainnet examples only (blocker from STATE.md)
- Candide/Pimlico Sepolia bundler + paymaster URLs must be confirmed before escrow code
- Success criteria #5 requires passing `/wdk-check` skill with zero non-custodial violations

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
