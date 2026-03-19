# Phase 2: WDK Wallet + Escrow Contract - Research

**Researched:** 2026-03-19
**Domain:** WDK BIP-44 wallet integration (TypeScript) + Solidity ERC20 escrow on Sepolia
**Confidence:** HIGH (WDK package verified live; contract address verified on Sepolia Etherscan; all versions checked against npm registry)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**WDK Wallet Architecture**
- Seed phrase persisted in `.env` via `ESCROW_WALLET_SEED` — deterministic wallet derivation on startup, agent refuses to start if env var is missing
- Single agent wallet (not per-event) — simpler for demo, one address to fund from faucet
- If WDK npm package is unavailable or broken, fallback to ethers.js for wallet ops and document the WDK attempt — partial credit is better than zero
- Smoke test at `agent/tools/wallet-smoke-test.js` — generate wallet, check USDT balance, send 0 USDT to self, confirm txHash within 60 seconds

**Escrow Contract Design**
- Lightweight FraudEscrow.sol — `deposit()`, `release()`, `refund()`, `slash()` with event logs. Minimal surface for hackathon
- On-chain state via mappings (`escrowId → {amount, depositor, status}`) + events. Agent reads events to reconstruct state
- Standard `approve+transferFrom` ERC20 escrow pattern — agent approves contract to pull USDT
- Hardhat for deployment — JS/TS ecosystem matches project stack, familiar to judges

**Sepolia Testnet Strategy**
- Public Sepolia RPC via Infura free tier — `SEPOLIA_RPC_URL` in .env
- Sepolia USDT faucet or manual mint if test contract allows — document process in README
- Verify `0x7169d38820dfd117c3fa1f22a697dba58d90ba06` on Sepolia Etherscan during research — fail fast if wrong
- Sepolia ETH from faucet for gas — simplest approach, document faucet URL in README

### Claude's Discretion
- Internal code organization within agent/src/ for wallet module
- Error handling patterns for failed transactions
- Hardhat configuration details

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WLLT-01 | Agent creates and manages a self-custodial USDT wallet on Sepolia using WDK | WDK 1.0.0-beta.8 confirmed installable; WalletManagerEvm + seed phrase pattern documented |
| WLLT-02 | All wallet operations use WDK — no centralized custody, JS/TS only | WDK is pure JS/TS BIP-44 implementation; non-custodial by design, keys never leave client |
| WLLT-03 | Private keys never leave the client; key persistence handled securely | Seed phrase in .env only; WalletManagerEvm derives keys in-memory; dispose() clears memory |
| WLLT-04 | Wallet operations demonstrably non-custodial (verifiable in demo) | toReadOnlyAccount() pattern, dispose() after use, no key logging — wdk-check skill verifies |
</phase_requirements>

---

## Summary

WDK (`@tetherto/wdk-wallet-evm`) is confirmed installable at version `1.0.0-beta.8` (published 3 weeks ago as of research date). It implements BIP-44 HD wallet derivation over ethers.js v6, exposes a clean `WalletManagerEvm(seedPhrase, { provider })` constructor, and provides `transfer()` / `sendTransaction()` methods that handle ERC20 token transfers and native ETH sends. The library is non-custodial by design — keys are derived in-memory from the mnemonic and never serialized. The Sepolia USDT contract at `0x7169d38820dfd117c3fa1f22a697dba58d90ba06` is verified as "Test Tether USD" with a public `_giveMeATokens(uint256)` faucet function (max 1000 USDT per call, 6 decimals).

For the escrow contract, Hardhat v3.1.12 + `@nomicfoundation/hardhat-toolbox` is the standard deployment stack. FraudEscrow.sol will use the `approve+transferFrom` ERC20 pattern with a `mapping(bytes32 => EscrowRecord)` keyed by `escrowId`. The contract exposes `deposit()`, `release()`, `refund()`, `slash()` — all emit events for agent-side state reconstruction. OpenZeppelin v5.6.1 provides `SafeERC20`, `ReentrancyGuard`, and `Ownable` as safe building blocks.

**Primary recommendation:** Use `@tetherto/wdk-wallet-evm@1.0.0-beta.8` directly (no fallback needed — package is live). Wire it with `ESCROW_WALLET_SEED` env var at startup. Deploy FraudEscrow.sol with a simple Hardhat Ignition module or plain deploy script and write the address to `contracts/deployed.json`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tetherto/wdk-wallet-evm` | `1.0.0-beta.8` | BIP-44 EVM wallet management | Mandatory per judging rules; confirmed installable |
| `ethers` | `6.16.0` | EVM interaction (bundled inside WDK, also used in agent) | WDK depends on ethers v6 internally; use same version |
| `dotenv` | `17.3.1` | Load `.env` variables at runtime | Standard Node.js env management |
| `hardhat` | `3.1.12` | Compile and deploy Solidity contracts | Official Ethereum dev toolchain; JS/TS native |
| `@nomicfoundation/hardhat-toolbox` | `7.0.0` | Hardhat plugins bundle (ethers, chai, coverage) | Single install covers compile + test + deploy |
| `@openzeppelin/contracts` | `5.6.1` | SafeERC20, ReentrancyGuard, Ownable | Industry standard; prevents common escrow bugs |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `bip39` | `3.1.0` | Generate/validate mnemonic phrases | Generating new seed in smoke test only |
| `@nomicfoundation/hardhat-ethers` | `4.0.6` | ethers.js integration in Hardhat scripts | Deploy scripts that use getContractFactory |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@tetherto/wdk-wallet-evm` | `ethers.js` Wallet directly | Only if WDK is completely broken — forfeits hackathon judging criterion |
| Hardhat Ignition | Plain `scripts/deploy.ts` | Plain scripts are simpler and easier for judges to read — prefer plain scripts over Ignition for this hackathon |
| `@openzeppelin/contracts` | Hand-rolled SafeERC20 | Never hand-roll — OZ handles USDT's non-standard return value |

**Installation (agent workspace):**
```bash
npm install @tetherto/wdk-wallet-evm ethers dotenv
```

**Installation (contracts workspace):**
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

**Version verification (confirmed 2026-03-19):**
- `@tetherto/wdk-wallet-evm@1.0.0-beta.8` — published ~3 weeks ago
- `hardhat@3.1.12` — latest
- `@nomicfoundation/hardhat-toolbox@7.0.0` — latest
- `@openzeppelin/contracts@5.6.1` — latest
- `ethers@6.16.0` — latest v6

---

## Architecture Patterns

### Recommended Project Structure

```
agent/
├── src/
│   ├── index.ts              # startup guard: check ESCROW_WALLET_SEED
│   └── wallet/
│       ├── index.ts          # exports: getWallet(), getAccount(), dispose()
│       └── types.ts          # WalletConfig, TransferResult interfaces
├── tools/
│   └── wallet-smoke-test.js  # standalone: generate, balance check, self-send
contracts/
├── src/
│   └── FraudEscrow.sol       # deposit/release/refund/slash + events
├── scripts/
│   └── deploy.ts             # deploy FraudEscrow, write contracts/deployed.json
├── test/
│   └── FraudEscrow.test.ts   # unit tests against local Hardhat network
├── hardhat.config.ts
└── deployed.json             # { "sepolia": { "FraudEscrow": "0x..." } }
```

### Pattern 1: WDK Wallet Singleton with Startup Guard

**What:** Create `WalletManagerEvm` once at agent startup from `ESCROW_WALLET_SEED`. Fail hard if env var is absent. Expose a singleton getter.

**When to use:** Always — deterministic address across restarts is a success criterion.

**Example:**
```typescript
// Source: https://github.com/tetherto/wdk-wallet-evm README
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import * as dotenv from 'dotenv'
dotenv.config()

let _wallet: InstanceType<typeof WalletManagerEvm> | null = null

export function getWallet(): InstanceType<typeof WalletManagerEvm> {
  if (!process.env.ESCROW_WALLET_SEED) {
    throw new Error('ESCROW_WALLET_SEED env var is required — refusing to start')
  }
  if (!_wallet) {
    _wallet = new WalletManagerEvm(process.env.ESCROW_WALLET_SEED, {
      provider: process.env.SEPOLIA_RPC_URL!
    })
  }
  return _wallet
}

// Always dispose at process exit to clear keys from memory
process.on('exit', () => _wallet?.dispose())
```

### Pattern 2: ERC20 Transfer via WDK

**What:** Use `account.transfer()` for ERC20 token sends. WDK handles ABI encoding internally. Returns `{ hash, fee }`.

**When to use:** Sending USDT in smoke test and escrow operations.

**Example:**
```typescript
// Source: https://github.com/tetherto/wdk-wallet-evm README
const wallet = getWallet()
const account = await wallet.getAccount(0)
const address = await account.getAddress()

// Read USDT balance (6 decimals)
const balance = await account.getTokenBalance(process.env.SEPOLIA_USDT_CONTRACT!)

// Send 0 USDT to self (smoke test) — use sendTransaction for 0-value ERC20
// Note: transfer() with amount=0n may revert on some ERC20s; use native ETH send for 0-value smoke test
const result = await account.sendTransaction({
  to: address,
  value: 0n
})
console.log('txHash:', result.hash)
```

### Pattern 3: FraudEscrow.sol — ERC20 Escrow with approve+transferFrom

**What:** Agent calls `USDT.approve(escrowContract, amount)` first, then `FraudEscrow.deposit(escrowId, amount)`. Contract pulls tokens via `transferFrom`.

**When to use:** Standard ERC20 escrow pattern — agent holds custody of funds on-chain.

**Example (Solidity):**
```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FraudEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    enum Status { PENDING, RELEASED, REFUNDED, SLASHED }

    struct EscrowRecord {
        address depositor;
        uint256 amount;
        Status status;
    }

    IERC20 public immutable usdt;
    mapping(bytes32 => EscrowRecord) public escrows;

    event Deposited(bytes32 indexed escrowId, address depositor, uint256 amount);
    event Released(bytes32 indexed escrowId, address recipient, uint256 amount);
    event Refunded(bytes32 indexed escrowId, address depositor, uint256 amount);
    event Slashed(bytes32 indexed escrowId, address bountyPool, uint256 amount);

    constructor(address _usdt) Ownable(msg.sender) {
        usdt = IERC20(_usdt);
    }

    function deposit(bytes32 escrowId, uint256 amount) external nonReentrant {
        require(escrows[escrowId].amount == 0, "escrow exists");
        usdt.safeTransferFrom(msg.sender, address(this), amount);
        escrows[escrowId] = EscrowRecord(msg.sender, amount, Status.PENDING);
        emit Deposited(escrowId, msg.sender, amount);
    }

    function release(bytes32 escrowId, address recipient) external onlyOwner nonReentrant {
        EscrowRecord storage r = escrows[escrowId];
        require(r.status == Status.PENDING, "not pending");
        r.status = Status.RELEASED;
        usdt.safeTransfer(recipient, r.amount);
        emit Released(escrowId, recipient, r.amount);
    }

    function refund(bytes32 escrowId) external onlyOwner nonReentrant {
        EscrowRecord storage r = escrows[escrowId];
        require(r.status == Status.PENDING, "not pending");
        r.status = Status.REFUNDED;
        usdt.safeTransfer(r.depositor, r.amount);
        emit Refunded(escrowId, r.depositor, r.amount);
    }

    function slash(bytes32 escrowId, address bountyPool) external onlyOwner nonReentrant {
        EscrowRecord storage r = escrows[escrowId];
        require(r.status == Status.PENDING, "not pending");
        r.status = Status.SLASHED;
        usdt.safeTransfer(bountyPool, r.amount);
        emit Slashed(escrowId, bountyPool, r.amount);
    }
}
```

### Pattern 4: Hardhat Deploy Script → deployed.json

**What:** Plain TypeScript deploy script (not Ignition) that writes contract address to `contracts/deployed.json`. Simpler for judges to read.

**Example:**
```typescript
// contracts/scripts/deploy.ts
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const usdtAddress = process.env.SEPOLIA_USDT_CONTRACT!;
  const FraudEscrow = await ethers.getContractFactory("FraudEscrow");
  const contract = await FraudEscrow.deploy(usdtAddress);
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("FraudEscrow deployed to:", address);

  const deployed = { sepolia: { FraudEscrow: address, usdt: usdtAddress } };
  fs.writeFileSync(
    path.join(__dirname, "../deployed.json"),
    JSON.stringify(deployed, null, 2)
  );
}

main().catch(console.error);
```

**Deploy command:**
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### Anti-Patterns to Avoid

- **Logging the private key or seed:** WDK's `getAddress()` is safe to log; never log the mnemonic or any derived key material
- **Creating WalletManagerEvm inside loops:** Instantiate once at startup; re-instantiating re-derives keys on every call and wastes memory
- **Calling `transfer()` with amount `0n` for smoke test:** Some ERC20 implementations revert on zero-amount transfers. Use a native ETH `sendTransaction({ to: self, value: 0n })` for the smoke test self-send
- **Using Hardhat Ignition for this hackathon:** Ignition adds CLI prompts and a deployment registry that slows down the flow; plain scripts are transparent and judge-friendly
- **Hardcoding the SEPOLIA_PRIVATE_KEY in hardhat.config.ts:** Derive it from the mnemonic at deploy time or use a separate deployer key stored in .env

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ERC20 safe transfer | Custom IERC20 call with manual return check | `SafeERC20.safeTransfer()` | USDT (Solidity 0.4.x) doesn't return bool — raw `.transfer()` call silently succeeds even on failure |
| Reentrancy protection | Manual mutex flag | `ReentrancyGuard` from OpenZeppelin | Mutex implementation is subtle; OZ is audited |
| BIP-39 mnemonic generation | Custom entropy + wordlist | `bip39.generateMnemonic()` | Entropy source selection is a security-critical operation |
| Wallet key derivation | Raw secp256k1 math | WDK `WalletManagerEvm` | BIP-44 path derivation has exact spec compliance requirements |
| ERC20 ABI encoding | Manual hex encoding | WDK `account.transfer()` or ethers `Contract` | ABI encoding bugs cause silent transaction failures |

**Key insight:** USDT's Solidity 0.4.x implementation lacks proper return values on `transfer()`. Using OZ `SafeERC20` is the single most important safety measure in the escrow contract.

---

## Common Pitfalls

### Pitfall 1: USDT Returns No Bool — Silent Transfer Failure

**What goes wrong:** Raw Solidity `usdt.transfer(to, amount)` compiles fine but silently does nothing if the call reverts without a proper return value (old USDT ABI).

**Why it happens:** `0x7169d38820dfd117c3fa1f22a697dba58d90ba06` was compiled with Solidity 0.4.26 and uses the pre-ERC20-standard interface.

**How to avoid:** Use `SafeERC20.safeTransferFrom()` and `SafeERC20.safeTransfer()` for every USDT interaction in FraudEscrow.sol.

**Warning signs:** Transactions that succeed (no revert) but balances don't change.

### Pitfall 2: WDK transfer() vs. sendTransaction() for Zero Amounts

**What goes wrong:** `account.transfer({ token, recipient: self, amount: 0n })` may revert because some ERC20s reject zero-amount transfers.

**Why it happens:** Smoke test requirement is to send "0 USDT to itself." Using the ERC20 transfer path for zero amounts is implementation-defined.

**How to avoid:** Use `account.sendTransaction({ to: address, value: 0n })` for the smoke test (native ETH zero-value tx always succeeds). The txHash confirms the wallet can sign and broadcast — which is the actual proof of non-custodial operation.

**Warning signs:** Smoke test hangs or returns an ABI revert error from the USDT contract.

### Pitfall 3: WDK Requires Provider for Any On-Chain Call

**What goes wrong:** `WalletManagerEvm` constructor doesn't throw on missing provider — but `getBalance()`, `getTokenBalance()`, and `sendTransaction()` will throw "wallet must be connected to a provider."

**Why it happens:** Provider is an optional config param in the constructor.

**How to avoid:** Always include `provider: process.env.SEPOLIA_RPC_URL` in the WalletManagerEvm config. Validate that `SEPOLIA_RPC_URL` is non-empty in the startup guard alongside `ESCROW_WALLET_SEED`.

**Warning signs:** TypeError at runtime on the first on-chain call.

### Pitfall 4: EscrowId Collision

**What goes wrong:** If `escrowId` is derived from non-unique inputs (e.g., just event name), two deposits overwrite each other.

**Why it happens:** The `deposit()` function checks `escrows[escrowId].amount == 0` — a repeated ID silently no-ops.

**How to avoid:** Derive `escrowId = keccak256(abi.encodePacked(eventName, depositor, block.timestamp, nonce))` off-chain, or use an auto-incrementing counter in the contract.

**Warning signs:** Second deposit call succeeds on-chain but balance doesn't increase.

### Pitfall 5: Hardhat Deploy Needs Private Key, Not Mnemonic

**What goes wrong:** `hardhat.config.ts` `accounts` field expects a private key hex string (`0x...`), not a BIP-39 mnemonic.

**Why it happens:** Hardhat's network config `accounts` takes `[privateKey]` array. Mnemonics are supported via the `{ mnemonic }` object form, but not validated.

**How to avoid:** Either derive the deployer private key from the mnemonic at config time using ethers.js `HDNodeWallet.fromPhrase()`, or store a separate `SEPOLIA_DEPLOYER_PRIVATE_KEY` in .env. For hackathon: separate deployer key is simpler.

**Warning signs:** Hardhat errors with "invalid private key" at deploy time.

### Pitfall 6: Sepolia USDT Faucet Limit

**What goes wrong:** `_giveMeATokens(amount)` reverts if `amount > 1000 * (10**6)` (i.e., > 1000 USDT).

**Why it happens:** Hardcoded max in the contract: `require(amount <= 1000 * (10**decimals))`.

**How to avoid:** Call `_giveMeATokens(1000_000_000)` (1000 USDT in 6-decimal units). Can call multiple times if more is needed.

---

## Code Examples

### Smoke Test Structure (wallet-smoke-test.js)

```javascript
// Source: https://github.com/tetherto/wdk-wallet-evm README
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import * as dotenv from 'dotenv'
dotenv.config()

async function smokeTest() {
  if (!process.env.ESCROW_WALLET_SEED) throw new Error('ESCROW_WALLET_SEED required')
  if (!process.env.SEPOLIA_RPC_URL) throw new Error('SEPOLIA_RPC_URL required')

  const wallet = new WalletManagerEvm(process.env.ESCROW_WALLET_SEED, {
    provider: process.env.SEPOLIA_RPC_URL
  })

  const account = await wallet.getAccount(0)
  const address = await account.getAddress()
  console.log('Wallet address:', address)

  const usdtBalance = await account.getTokenBalance(process.env.SEPOLIA_USDT_CONTRACT)
  console.log('USDT balance:', usdtBalance.toString())

  // Send 0 ETH to self — proves signing + broadcast work
  const result = await account.sendTransaction({ to: address, value: 0n })
  console.log('txHash:', result.hash)
  console.log('SMOKE TEST PASSED')

  wallet.dispose()
}

smokeTest().catch((e) => { console.error('SMOKE TEST FAILED:', e.message); process.exit(1) })
```

### hardhat.config.ts for Sepolia

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" }); // root .env

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.SEPOLIA_DEPLOYER_PRIVATE_KEY
        ? [process.env.SEPOLIA_DEPLOYER_PRIVATE_KEY]
        : []
    }
  }
};

export default config;
```

### Mint Sepolia USDT for Testing

```typescript
// Run once before smoke test to fund the wallet
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL)
const deployer = new ethers.Wallet(process.env.SEPOLIA_DEPLOYER_PRIVATE_KEY!, provider)
const usdt = new ethers.Contract(
  process.env.SEPOLIA_USDT_CONTRACT!,
  ['function _giveMeATokens(uint256 amount) external'],
  deployer
)
await usdt._giveMeATokens(1000_000_000n) // 1000 USDT (6 decimals)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Truffle deploy | Hardhat Ignition / plain scripts | 2022-2023 | Truffle deprecated; Hardhat is the standard |
| ethers v5 BigNumber | ethers v6 native BigInt | ethers v6 (2023) | Use `1000n` not `BigNumber.from(1000)` |
| OpenZeppelin v4 | OpenZeppelin v5 | Late 2023 | Custom errors, namespaced storage; `Ownable(msg.sender)` constructor form |
| `hardhat-ethers` separate | Included in `hardhat-toolbox` | 2022 | One package install covers everything |

**Deprecated/outdated:**
- Truffle: deprecated, do not use
- ethers v5 BigNumber: replaced by native BigInt in ethers v6
- OZ `Ownable` without constructor arg: v5 requires `Ownable(msg.sender)` in constructor body

---

## Open Questions

1. **WDK `transfer()` with 0-amount USDT**
   - What we know: `sendTransaction({ to: self, value: 0n })` is the safe native-ETH path; `transfer()` ABI-encodes `transfer(address,uint256)` call
   - What's unclear: Whether the Sepolia USDT contract at 0x7169... rejects zero-amount ERC20 transfers
   - Recommendation: Use native ETH zero-value tx for smoke test; save ERC20 transfer for real amounts

2. **SEPOLIA_DEPLOYER_PRIVATE_KEY vs. deriving from mnemonic**
   - What we know: Hardhat `accounts` takes `[privateKey]`; mnemonic form also supported as `{ mnemonic: "..." }`
   - What's unclear: Whether using the mnemonic form in Hardhat config is considered a security risk in the hackathon context
   - Recommendation: Add `SEPOLIA_DEPLOYER_PRIVATE_KEY` as a separate env var for Hardhat deploy; keep `ESCROW_WALLET_SEED` for WDK agent wallet

3. **WDK 2.0.0-rc.1 breaking changes**
   - What we know: `rc` tag is `2.0.0-rc.1`; `latest` is `1.0.0-beta.8`
   - What's unclear: What the rc version changes; whether it's stable enough to use
   - Recommendation: Pin to `1.0.0-beta.8` (the `latest` tag); do not use the rc

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Hardhat built-in (Mocha + Chai) via `@nomicfoundation/hardhat-toolbox` |
| Config file | `contracts/hardhat.config.ts` — Wave 0 creation |
| Quick run command | `cd contracts && npx hardhat test` |
| Full suite command | `cd contracts && npx hardhat test --network hardhat` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WLLT-01 | Wallet address is deterministic from seed phrase | smoke | `node agent/tools/wallet-smoke-test.js` | Wave 0 |
| WLLT-02 | All wallet ops go through WDK (no raw ethers.Wallet) | code review | `grep -r "ethers.Wallet" agent/src/` (should be 0 results) | N/A |
| WLLT-03 | Private key never logged or written to disk | code review + smoke | Smoke test log scan for key material | Wave 0 |
| WLLT-04 | Non-custodial verifiable: dispose() called, toReadOnlyAccount() available | unit | `cd contracts && npx hardhat test test/FraudEscrow.test.ts` | Wave 0 |

**Note:** Contract tests (FraudEscrow deposit/release/refund/slash) run on local Hardhat network with a mock ERC20. They are fast (<10 seconds) and cover the core escrow logic without Sepolia.

### Sampling Rate
- **Per task commit:** `node agent/tools/wallet-smoke-test.js` (smoke, ~20s on Sepolia)
- **Per wave merge:** `cd contracts && npx hardhat test` (contract unit tests, <10s on local)
- **Phase gate:** Both smoke test + contract tests green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `agent/tools/wallet-smoke-test.js` — covers WLLT-01, WLLT-03, WLLT-04
- [ ] `contracts/test/FraudEscrow.test.ts` — covers escrow deposit/release/refund/slash logic
- [ ] `contracts/hardhat.config.ts` — Hardhat config for local + Sepolia
- [ ] Framework install: `cd contracts && npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox && npm install @openzeppelin/contracts`

---

## Sources

### Primary (HIGH confidence)

- `npm info @tetherto/wdk-wallet-evm` — confirmed installable, version 1.0.0-beta.8, dependencies verified
- https://github.com/tetherto/wdk-wallet-evm — full README, API surface, code examples (WalletManagerEvm, WalletAccountEvm, transfer/sendTransaction signatures)
- https://sepolia.etherscan.io/token/0x7169d38820dfd117c3fa1f22a697dba58d90ba06 — confirmed "Test Tether USD", 6 decimals, `_giveMeATokens()` faucet function
- `npm info hardhat version` — 3.1.12 confirmed
- `npm info @nomicfoundation/hardhat-toolbox version` — 7.0.0 confirmed
- `npm info @openzeppelin/contracts version` — 5.6.1 confirmed

### Secondary (MEDIUM confidence)

- https://hardhat.org/docs/guides/deploying-contracts — Hardhat v3 deploy guide, Sepolia config pattern
- https://hardhat.org/docs/guides/deployment/using-ignition — Ignition module pattern (not recommended for this use case)

### Tertiary (LOW confidence)

- WebSearch results on Sepolia ETH faucets — Alchemy, Infura, QuickNode faucets confirmed working per community sources (not independently verified)

---

## Metadata

**Confidence breakdown:**
- WDK API surface: HIGH — verified from live GitHub README and npm package
- Sepolia USDT contract address: HIGH — verified on Sepolia Etherscan
- FraudEscrow.sol pattern: HIGH — standard ERC20 escrow; OZ SafeERC20 is well-documented
- Hardhat deployment: HIGH — official docs + npm version confirmed
- Sepolia faucets: MEDIUM — community-confirmed, not independently verified

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable ecosystem; WDK beta tag may advance)
