# Phase 6: Escrow Enforcement Wiring - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the classification engine outcomes to on-chain USDT escrow actions via FraudEscrow.sol on Sepolia — deposit, release, refund, and slash all produce confirmed transactions with Etherscan links stored in case files.

</domain>

<decisions>
## Implementation Decisions

### Escrow Integration Architecture
- ethers.js with WDK wallet signer for contract interaction — WDK provides the signer, ethers.js handles ABI encoding and tx submission
- Escrow module at `agent/src/escrow.js` — exports `depositEscrow`, `releaseEscrow`, `refundEscrow`, `slashEscrow`
- Direct classification-to-action mapping: SCALPING_VIOLATION→slash, LIKELY_SCAM→refund, COUNTERFEIT_RISK→refund, LEGITIMATE→release
- Check USDT balance before each action, log warning if insufficient — demo never crashes

### Transaction Handling & Demo Flow
- Fixed 10 USDT per escrow action — simple for demo, trackable on Etherscan
- Update case file after tx confirms — append Etherscan link to placeholder field
- On tx revert/timeout: log error, mark case file `escrowStatus: "failed"`, continue pipeline
- Organizer legitimacy bond: deposit on agent startup, slash on first confirmed fraud above threshold

### Observability & Judge Visibility
- `[Escrow]` prefix logs with txHash, Etherscan link, amount, action type
- Per-cycle summary: "N classified, N enforced, N deposited, total USDT locked"
- Contract ABI from Hardhat artifacts (`contracts/artifacts/`) — already compiled from Phase 2
- Etherscan link format: `https://sepolia.etherscan.io/tx/{txHash}`

### Claude's Discretion
- ethers.js contract wrapper implementation details
- Gas estimation and nonce management
- WDK signer initialization sequence
- Error retry patterns for failed transactions

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `contracts/deployed.json` — FraudEscrow at `0x6427d51c4167373bF59712715B1930e80EcA8102`, USDT at `0x7169d38820dfd117c3fa1f22a697dba58d90ba06`
- `contracts/src/FraudEscrow.sol` — deposit, release, refund, slash functions
- `agent/src/wallet/` — WDK wallet module from Phase 2
- `agent/tools/wallet-smoke-test.js` — WDK transaction pattern reference
- `agent/src/classify.js` — classifyListing returns `{ category, confidence, reasoning }`
- `agent/src/evidence.js` — writeCaseFile, isCaseFileExists
- `agent/src/scan-loop.js` — full pipeline with enforcement gating at 85%

### Established Patterns
- ESM modules, `[Prefix]` stderr logging, dotenv from project root
- `.env` has `SEPOLIA_RPC_URL`, `SEPOLIA_DEPLOYER_PRIVATE_KEY`, `ESCROW_WALLET_SEED`, `WDK_API_KEY`
- Promise.allSettled for resilience, SHA-256 URL hash for dedup

### Integration Points
- `agent/src/scan-loop.js` — will call escrow module after classification + evidence
- `agent/src/evidence.js` — case files need Etherscan link update after tx confirms
- `contracts/artifacts/` — Hardhat compiled ABI for FraudEscrow.sol
- `.env` — RPC URL, deployer key, wallet seed, contract addresses from deployed.json

</code_context>

<specifics>
## Specific Ideas

- FraudEscrow.sol already deployed and verified — no contract changes needed
- WDK wallet from Phase 2 smoke test confirmed working on Sepolia
- The agent must use WDK for the signer (hackathon mandatory requirement)
- 10 USDT fixed amount keeps demo simple and Etherscan-trackable
- Every escrow action must produce a clickable Sepolia Etherscan link

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
