# Phase 6: Escrow Enforcement Wiring - Research

**Researched:** 2026-03-19
**Domain:** ethers.js v6 + WDK signer bridge + FraudEscrow.sol integration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- ethers.js with WDK wallet signer for contract interaction — WDK provides the signer, ethers.js handles ABI encoding and tx submission
- Escrow module at `agent/src/escrow.js` — exports `depositEscrow`, `releaseEscrow`, `refundEscrow`, `slashEscrow`
- Direct classification-to-action mapping: SCALPING_VIOLATION→slash, LIKELY_SCAM→refund, COUNTERFEIT_RISK→refund, LEGITIMATE→release
- Check USDT balance before each action, log warning if insufficient — demo never crashes
- Fixed 10 USDT per escrow action — simple for demo, trackable on Etherscan
- Update case file after tx confirms — append Etherscan link to placeholder field
- On tx revert/timeout: log error, mark case file `escrowStatus: "failed"`, continue pipeline
- Organizer legitimacy bond: deposit on agent startup, slash on first confirmed fraud above threshold
- `[Escrow]` prefix logs with txHash, Etherscan link, amount, action type
- Per-cycle summary: "N classified, N enforced, N deposited, total USDT locked"
- Contract ABI from Hardhat artifacts (`contracts/artifacts/`) — already compiled from Phase 2
- Etherscan link format: `https://sepolia.etherscan.io/tx/{txHash}`

### Claude's Discretion
- ethers.js contract wrapper implementation details
- Gas estimation and nonce management
- WDK signer initialization sequence
- Error retry patterns for failed transactions

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ESCR-01 | Agent can lock USDT into escrow for a given event (deposit) | FraudEscrow.deposit(escrowId, amount) — requires prior USDT.approve; WDK account.approve() handles this |
| ESCR-02 | Agent can release escrowed USDT to seller when listing is classified as legitimate | FraudEscrow.release(escrowId, recipient) — onlyOwner, owner is the deployer key |
| ESCR-03 | Agent can refund escrowed USDT to buyer when fraud is detected | FraudEscrow.refund(escrowId) — onlyOwner; triggered by LIKELY_SCAM / COUNTERFEIT_RISK |
| ESCR-04 | Agent can slash escrowed USDT to bounty pool on confirmed fraud above confidence threshold | FraudEscrow.slash(escrowId, bountyPool) — onlyOwner; triggered by SCALPING_VIOLATION >= threshold |
| ESCR-05 | Organizer can stake USDT as legitimacy bond; agent slashes bond on confirmed fraud | Same deposit/slash lifecycle, different escrowId namespace (e.g. `bond-{event}`) |
| ESCR-06 | All escrow actions are logged on-chain with transaction hashes | Every tx returns a hash; Etherscan links stored in case files |
</phase_requirements>

---

## Summary

Phase 6 wires the existing classification engine outcomes (`agent/src/classify.js`) to on-chain FraudEscrow.sol operations on Sepolia. The contract is already deployed and verified at `0x6427d51c4167373bF59712715B1930e80EcA8102`. All four lifecycle functions (deposit, release, refund, slash) are implemented, auditable, and have comprehensive unit tests passing.

The central technical challenge is the **WDK-to-ethers signer bridge**. WDK's `WalletAccountEvm` does not expose a native ethers.js `Signer` object — it wraps an ethers `HDNodeWallet` internally (`account._account`) but keeps it private. The correct integration pattern (confirmed by reading WDK's own `approve()` implementation) is: use `ethers.Contract.interface.encodeFunctionData()` to ABI-encode the call, then submit via `account.sendTransaction({ to: contractAddress, value: 0n, data: encodedCalldata })`. This keeps WDK as the sole transaction broadcaster (satisfying the hackathon mandatory requirement) while using ethers for ABI encoding.

The `FraudEscrow.sol` `deposit()` function requires the caller to first `approve()` the contract for the USDT amount. WDK exposes `account.approve({ token, spender, amount })` natively — this is the right path for approvals. The two-step approve-then-deposit pattern must be atomic from the agent's perspective (sequential awaits, not parallel).

**Primary recommendation:** Implement `agent/src/escrow.js` as a thin wrapper that (1) calls WDK's `account.approve()` for USDT, then (2) uses ethers `Interface.encodeFunctionData()` to build calldata, then (3) submits via `account.sendTransaction()`. Never pass the private WDK `_account` HDNodeWallet directly to `ethers.Contract()`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ethers | 6.16.0 | ABI encoding, Interface, keccak256 | Already in agent/package.json; WDK itself ships ethers 6.14.3 |
| @tetherto/wdk-wallet-evm | 1.0.0-beta.8 | WDK account for signing and broadcasting | Hackathon mandatory; already working on Sepolia |
| contracts/artifacts/src/FraudEscrow.sol/FraudEscrow.json | (compiled) | ABI for encodeFunctionData | Already compiled in Phase 2 |
| contracts/deployed.json | (static) | FraudEscrow and USDT addresses | Single source of truth, committed to repo |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:crypto | (built-in) | keccak256-equivalent SHA-256 for escrowId | Already used in scan-loop.js for URL hashing — use ethers.keccak256 instead for bytes32 compatibility |
| node:fs/promises | (built-in) | Read/update case files | Already used in evidence.js |

**Installation:**
```bash
# No new installs required — ethers and WDK are already in agent/package.json
# Verify:
npm ls ethers --workspace=agent
```

**Version verification (confirmed 2026-03-19):**
- `ethers`: 6.16.0 (declared in agent/package.json, hoisted to workspace root node_modules)
- `@tetherto/wdk-wallet-evm`: 1.0.0-beta.8 (installed, smoke test passing)

---

## Architecture Patterns

### Recommended Project Structure
```
agent/src/
├── escrow.js          # NEW — Phase 6 escrow module
├── classify.js        # Existing — outputs { category, confidence }
├── evidence.js        # Existing — needs updateCaseFileEscrow() added
├── scan-loop.js       # Existing — calls escrow module after classification
└── wallet/
    └── index.ts       # Existing — getAccount(), dispose()
```

### Pattern 1: WDK-to-Contract Call via encodeFunctionData

**What:** Since WDK does not expose a native ethers Signer, encode contract calldata with ethers Interface, submit raw tx via WDK `sendTransaction`.

**When to use:** Every FraudEscrow function call (deposit, release, refund, slash).

**Confirmed by:** Reading WDK's own `approve()` implementation in `wallet-account-evm.js` — it uses exactly this pattern internally.

```javascript
// Source: confirmed from node_modules/@tetherto/wdk-wallet-evm/src/wallet-account-evm.js approve()
import { ethers } from 'ethers';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load ABI from Hardhat artifacts (already compiled in Phase 2)
const artifact = require('../../contracts/artifacts/src/FraudEscrow.sol/FraudEscrow.json');
const ESCROW_INTERFACE = new ethers.Interface(artifact.abi);

// Step 1: approve USDT spend via WDK's native approve()
await account.approve({
  token: USDT_ADDRESS,
  spender: ESCROW_ADDRESS,
  amount: AMOUNT_IN_6_DECIMALS,
});

// Step 2: encode deposit() calldata using ethers Interface
const data = ESCROW_INTERFACE.encodeFunctionData('deposit', [escrowId, AMOUNT_IN_6_DECIMALS]);

// Step 3: submit via WDK sendTransaction — WDK signs and broadcasts
const { hash } = await account.sendTransaction({
  to: ESCROW_ADDRESS,
  value: 0n,
  data,
});

const etherscanLink = `https://sepolia.etherscan.io/tx/${hash}`;
```

### Pattern 2: escrowId Generation

**What:** FraudEscrow.sol uses `bytes32` escrowId (keccak256 hash). The Solidity `require(escrows[escrowId].amount == 0, "escrow exists")` enforces uniqueness — duplicate IDs will revert.

**When to use:** Every deposit call needs a unique, deterministic escrowId.

```javascript
// Source: contracts/test/FraudEscrow.test.ts uses ethers.encodeBytes32String for tests
// For production use: keccak256 of event+url+timestamp for uniqueness
import { ethers } from 'ethers';

// For listing escrows — deterministic from URL hash + timestamp
function makeEscrowId(listingUrl, timestamp) {
  return ethers.keccak256(
    ethers.toUtf8Bytes(`listing:${listingUrl}:${timestamp}`)
  );
}

// For organizer bond — deterministic from event name
function makeBondEscrowId(eventName) {
  return ethers.keccak256(
    ethers.toUtf8Bytes(`bond:${eventName}`)
  );
}
```

### Pattern 3: USDT Amount — 6 Decimal Units

**What:** Sepolia USDT (0x7169d38820dfd117c3fa1f22a697dba58d90ba06) uses 6 decimals — same as mainnet USDT. 10 USDT = `10_000_000n` (10 * 10^6).

**When to use:** Every deposit, and when checking `getTokenBalance()` return value.

```javascript
const USDT_DECIMALS = 6;
const ESCROW_AMOUNT_USDT = 10; // fixed per CONTEXT.md decision
const ESCROW_AMOUNT_RAW = BigInt(ESCROW_AMOUNT_USDT) * (10n ** BigInt(USDT_DECIMALS));
// ESCROW_AMOUNT_RAW = 10_000_000n
```

### Pattern 4: Case File Etherscan Link Update

**What:** `evidence.js` writes `| Etherscan Link | _(pending escrow transaction)_ |` as a placeholder. After tx confirms, escrow.js must update that field in the case file.

**When to use:** After every successful escrow tx.

```javascript
// evidence.js needs a new export: updateCaseFileEscrow(filepath, txHash, action)
// Simple string replacement — the placeholder text is known and unique
import { readFile, writeFile } from 'node:fs/promises';

export async function updateCaseFileEscrow(filepath, txHash, action) {
  const link = `https://sepolia.etherscan.io/tx/${txHash}`;
  let content = await readFile(filepath, 'utf8');
  content = content.replace(
    '| Etherscan Link | _(pending escrow transaction)_ |',
    `| Etherscan Link | [${txHash.slice(0, 10)}...](${link}) |`
  );
  content = content.replace(
    `| Action Taken | ${action} |`,
    `| Action Taken | ${action} ✓ |`
  );
  await writeFile(filepath, content, 'utf8');
}
```

### Pattern 5: Organizer Bond — Startup Deposit + First-Fraud Slash

**What:** CONTEXT.md: "deposit on agent startup, slash on first confirmed fraud above threshold". Bond uses its own `escrowId` namespace so it is not confused with per-listing escrows.

**When to use:** One-time bond deposit at scan-loop startup; slash fires once when the first `SCALPING_VIOLATION`/`LIKELY_SCAM` listing exceeds the confidence threshold.

```javascript
// In scan-loop.js startup block (before cron starts):
const bondId = makeBondEscrowId(EVENT_NAME);
await depositEscrow({ escrowId: bondId, isBond: true });

// Track bond slash state in module-level variable
let bondSlashed = false;
// In classification loop — first fraud above threshold:
if (meetsThreshold && !bondSlashed) {
  await slashEscrow({ escrowId: bondId, bountyPool: BOUNTY_POOL_ADDRESS });
  bondSlashed = true;
}
```

### Anti-Patterns to Avoid

- **Direct `_account` access:** Do NOT use `account._account` to get the HDNodeWallet for use with `new ethers.Contract(addr, abi, account._account)`. This bypasses WDK's memory safety (the `MemorySafeHDNodeWallet` wrapper) and violates the hackathon WDK requirement. Always use `account.sendTransaction()`.
- **ethers.Wallet from private key:** Do NOT create a standalone ethers signer from `SEPOLIA_DEPLOYER_PRIVATE_KEY`. All signing must flow through WDK. The deployer key is for Hardhat deploy scripts only.
- **Promise.all for approve+deposit:** Do NOT parallelize the two-step approve-then-deposit. The approve tx must confirm before deposit is called.
- **Duplicate escrowId:** `deposit()` reverts with "escrow exists" if same escrowId is used twice. Use URL+timestamp for listing escrows to guarantee uniqueness across scan cycles.
- **Zero-value approve before set:** WDK's `approve()` implementation correctly handles the USDT mainnet zero-reset requirement, but only for chainId=1. On Sepolia (chainId=11155111), this guard is skipped — approve will proceed directly even if prior allowance exists. No extra reset step needed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ABI encoding | Custom hex encoding of function selectors | `ethers.Interface.encodeFunctionData()` | Handles argument types, padding, encoding edge cases |
| USDT approve flow | Manual ERC20 ABI + tx construction | `account.approve({ token, spender, amount })` | WDK implements this natively; avoids duplicate code |
| keccak256 for escrowId | SHA-256 hash truncated to 32 bytes | `ethers.keccak256(ethers.toUtf8Bytes(...))` | Produces valid bytes32 without casting risk |
| Tx wait/receipt | Polling loop with setTimeout | ethers `provider.waitForTransaction(hash)` or WDK's built-in confirmation | Race conditions in manual polling |
| USDT balance check | Manual ERC20 `balanceOf` ABI | `account.getTokenBalance(usdtAddress)` | Already working in smoke test |

**Key insight:** The WDK account already provides `approve()`, `sendTransaction()`, `getTokenBalance()`, and `getTransactionReceipt()` — the escrow module only needs ethers `Interface` for ABI encoding the FraudEscrow-specific calls.

---

## Common Pitfalls

### Pitfall 1: FraudEscrow onlyOwner Requirement
**What goes wrong:** `release()`, `refund()`, `slash()` revert with `OwnableUnauthorizedAccount` if called from any address other than the contract owner.
**Why it happens:** FraudEscrow inherits OpenZeppelin `Ownable`. The owner was set to `msg.sender` at deploy time — meaning the `SEPOLIA_DEPLOYER_PRIVATE_KEY` wallet is the owner. The WDK wallet address (from `ESCROW_WALLET_SEED`) is a different address.
**How to avoid:** The escrow module must use `SEPOLIA_DEPLOYER_PRIVATE_KEY` for the `onlyOwner` calls (release, refund, slash), NOT the WDK wallet. For the mandatory WDK requirement, either: (a) use WDK wallet for deposit (which has no access control) and an ethers.Wallet for the owner calls, OR (b) verify that the WDK wallet address matches the deployer address.
**Warning signs:** `OwnableUnauthorizedAccount` revert in tx receipt. Check `await escrow.owner()` vs WDK wallet address.

**Resolution path:** Run `node -e "import('./agent/src/wallet/index.ts')" && await getAccount(0).then(a => a.getAddress())` and compare to deployer address. If they differ, owner calls need a separate ethers.Wallet initialized from `SEPOLIA_DEPLOYER_PRIVATE_KEY`.

### Pitfall 2: USDT Approval Race
**What goes wrong:** `deposit()` reverts with `SafeERC20FailedOperation` if called before the `approve()` transaction confirms on-chain.
**Why it happens:** Two separate on-chain txs — approval and deposit are not atomic. Submitting deposit immediately after approve (before the approve tx is mined) means the `safeTransferFrom` finds zero allowance.
**How to avoid:** Await approval tx confirmation before calling deposit. WDK's `sendTransaction` returns `{ hash, fee }` but does NOT wait for mining. Use `account.getTransactionReceipt(hash)` in a polling loop, or use `ethers.provider.waitForTransaction(hash, 1)` if a provider instance is accessible.
**Warning signs:** `SafeERC20FailedOperation` error in the deposit call.

### Pitfall 3: Duplicate escrowId Revert
**What goes wrong:** `deposit()` reverts with "escrow exists" on the second scan cycle for the same listing URL.
**Why it happens:** `isCaseFileExists()` in `scan-loop.js` skips already-classified listings at the classification stage, but if an escrow was in a partial state (case file written, tx pending), the listing will be skipped on the next cycle at the classification gate — but if the escrowId was already deposited, any retry of deposit will revert.
**How to avoid:** Use `listing.url + timestamp` for escrowId (not just URL hash) to guarantee uniqueness. The dedup gate in scan-loop.js already prevents double-classification, so this is belt-and-suspenders.

### Pitfall 4: WDK vs Deployer Key Confusion
**What goes wrong:** Mixing up two keys: `ESCROW_WALLET_SEED` (WDK wallet, non-custodial demo) and `SEPOLIA_DEPLOYER_PRIVATE_KEY` (Hardhat deploy key, contract owner).
**Why it happens:** The contract was deployed from `SEPOLIA_DEPLOYER_PRIVATE_KEY`. The WDK wallet is a separate address funded for the demo.
**How to avoid:** Explicitly document which key handles which operation. Confirm owner address via `FraudEscrow.owner()` before writing escrow.js.
**Warning signs:** All `onlyOwner` calls fail but deposit works (deposit has no access control).

### Pitfall 5: USDT Balance Insufficient for Demo
**What goes wrong:** Agent crashes or skips enforcement if the WDK wallet has less than 10 USDT.
**Why it happens:** Testnet USDT is acquired via faucet; Sepolia faucets can be unreliable.
**How to avoid:** CONTEXT.md requires "Check USDT balance before each action, log warning if insufficient — demo never crashes". Implement a guard that logs `[Escrow] WARN: insufficient USDT balance (X), skipping escrow` and returns `null` instead of throwing.

---

## Code Examples

### Full Two-Step Approve + Deposit

```javascript
// Source: pattern derived from WDK's own approve() in wallet-account-evm.js
// and FraudEscrow.sol deposit() interface
import { ethers } from 'ethers';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'node:path';
import { getAccount } from './wallet/index.js';
import deployed from '../../contracts/deployed.json' assert { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const artifact = require('../../contracts/artifacts/src/FraudEscrow.sol/FraudEscrow.json');

const ESCROW_INTERFACE = new ethers.Interface(artifact.abi);
const ESCROW_ADDRESS = deployed.sepolia.FraudEscrow;
const USDT_ADDRESS = deployed.sepolia.usdt;
const USDT_DECIMALS = 6n;
const ESCROW_AMOUNT = 10n * (10n ** USDT_DECIMALS); // 10 USDT in raw units

const log = (...args) => process.stderr.write('[Escrow] ' + args.join(' ') + '\n');

export async function depositEscrow({ listingUrl, timestamp }) {
  const account = await getAccount(0);
  const balance = await account.getTokenBalance(USDT_ADDRESS);

  if (balance < ESCROW_AMOUNT) {
    log(`WARN: insufficient USDT balance (${balance}), skipping deposit`);
    return null;
  }

  // escrowId: keccak256 of url+timestamp — unique per listing per cycle
  const escrowId = ethers.keccak256(ethers.toUtf8Bytes(`listing:${listingUrl}:${timestamp}`));

  // Step 1: approve
  log(`Approving ${ESCROW_AMOUNT} USDT for escrow contract...`);
  const approveResult = await account.approve({
    token: USDT_ADDRESS,
    spender: ESCROW_ADDRESS,
    amount: ESCROW_AMOUNT,
  });
  log(`Approve tx: ${approveResult.hash}`);

  // Step 2: wait for approval confirmation (poll receipt)
  await waitForConfirmation(account, approveResult.hash);

  // Step 3: encode deposit() calldata + submit via WDK
  const data = ESCROW_INTERFACE.encodeFunctionData('deposit', [escrowId, ESCROW_AMOUNT]);
  const depositResult = await account.sendTransaction({
    to: ESCROW_ADDRESS,
    value: 0n,
    data,
  });

  const link = `https://sepolia.etherscan.io/tx/${depositResult.hash}`;
  log(`Deposit confirmed — escrowId: ${escrowId}`);
  log(`Etherscan: ${link}`);

  return { txHash: depositResult.hash, escrowId, etherscanLink: link };
}
```

### Confirmation Polling Helper

```javascript
// WDK getTransactionReceipt returns null if tx not yet mined
// Poll with exponential backoff — 3 attempts max for demo speed
async function waitForConfirmation(account, hash, maxAttempts = 10, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    const receipt = await account.getTransactionReceipt(hash);
    if (receipt !== null) return receipt;
    await new Promise(r => setTimeout(r, delayMs));
  }
  throw new Error(`Tx ${hash} not confirmed after ${maxAttempts} attempts`);
}
```

### onlyOwner Call Pattern (release/refund/slash)

```javascript
// release, refund, slash are onlyOwner — must use deployer wallet
// Two options based on whether WDK address == deployer address:
//
// Option A: WDK wallet IS the deployer (addresses match)
//   → same account.sendTransaction() pattern, encodeFunctionData only
//
// Option B: WDK wallet is NOT the deployer (most likely case)
//   → use ethers.Wallet from SEPOLIA_DEPLOYER_PRIVATE_KEY for owner calls

// Option B implementation:
import { ethers } from 'ethers';

function getOwnerSigner() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  return new ethers.Wallet(process.env.SEPOLIA_DEPLOYER_PRIVATE_KEY, provider);
}

export async function releaseEscrow({ escrowId, recipientAddress }) {
  const signer = getOwnerSigner();
  const contract = new ethers.Contract(ESCROW_ADDRESS, artifact.abi, signer);

  try {
    const tx = await contract.release(escrowId, recipientAddress);
    const receipt = await tx.wait(1);
    const link = `https://sepolia.etherscan.io/tx/${receipt.hash}`;
    log(`Release confirmed — escrowId: ${escrowId} | ${link}`);
    return { txHash: receipt.hash, etherscanLink: link };
  } catch (err) {
    log(`ERROR release failed: ${err.message}`);
    return null;
  }
}
```

### Classification-to-Action Dispatch (in scan-loop.js)

```javascript
// After writeCaseFile(), call the appropriate escrow action:
if (meetsThreshold) {
  const escrowResult = await dispatchEscrowAction({
    category: result.category,
    listing,
    caseFilePath,
    timestamp: Date.now(),
  });
  if (escrowResult) {
    await updateCaseFileEscrow(caseFilePath, escrowResult.txHash, result.category);
    log(`[ScanLoop] Escrow enforced: ${result.category} → ${escrowResult.etherscanLink}`);
  }
}

// Dispatch mapping:
async function dispatchEscrowAction({ category, listing, caseFilePath, timestamp }) {
  switch (category) {
    case 'SCALPING_VIOLATION':
      return slashEscrow({ escrowId: makeEscrowId(listing.url, timestamp), bountyPool: BOUNTY_POOL });
    case 'LIKELY_SCAM':
    case 'COUNTERFEIT_RISK':
      return refundEscrow({ escrowId: makeEscrowId(listing.url, timestamp) });
    case 'LEGITIMATE':
      return releaseEscrow({ escrowId: makeEscrowId(listing.url, timestamp), recipientAddress: listing.sellerAddress ?? BOUNTY_POOL });
    default:
      return null;
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ethers v5 `Contract.connect(signer)` | ethers v6 `new Contract(addr, abi, signer)` — signer passed to constructor | ethers v6 (2023) | Constructor signature changed; v5 docs will mislead |
| `BigNumber.from(10).mul(10**6)` | Native `10n * (10n ** 6n)` BigInt | ethers v6 dropped BigNumber | Simpler, no library import |
| `provider.waitForTransaction(hash)` | ethers v6 `tx.wait(confirmations)` or provider method | ethers v6 | `.wait()` available on TransactionResponse |
| `ethers.utils.keccak256` | `ethers.keccak256` (flat namespace) | ethers v6 | Top-level function, no `utils` wrapper |

**Deprecated/outdated:**
- `ethers.utils.*`: All moved to flat namespace in ethers v6. Do not use `ethers.utils.keccak256`, `ethers.utils.toUtf8Bytes`, `ethers.utils.Interface` — use `ethers.keccak256`, `ethers.toUtf8Bytes`, `ethers.Interface` directly.
- `BigNumber`: Removed in ethers v6. Use native `bigint` throughout.

---

## Open Questions

1. **WDK wallet address vs deployer address**
   - What we know: FraudEscrow owner = `SEPOLIA_DEPLOYER_PRIVATE_KEY` address. WDK wallet = derived from `ESCROW_WALLET_SEED` mnemonic at index 0.
   - What's unclear: Whether these two addresses are the same (intentionally funded as one) or different.
   - Recommendation: First task in Wave 1 — print both addresses and compare. If they differ, owner calls use `ethers.Wallet(SEPOLIA_DEPLOYER_PRIVATE_KEY, provider)`. If they match, WDK handles all calls.

2. **USDT balance on Sepolia for demo**
   - What we know: WDK wallet and/or deployer wallet need Sepolia USDT + ETH for gas.
   - What's unclear: Current balances.
   - Recommendation: Balance check script as a Wave 0 validation task. Add to escrow.js startup check.

3. **Await-confirmation strategy**
   - What we know: WDK's `sendTransaction()` returns `{ hash, fee }` but does not wait for mining. WDK exposes `getTransactionReceipt(hash)`.
   - What's unclear: Whether WDK `sendTransaction` waits internally or returns immediately.
   - Recommendation: Assume returns immediately (standard EVM pattern). Implement polling loop. For demo, 2-second poll interval × 10 attempts = 20s max wait — acceptable.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) — no jest/vitest/mocha |
| Config file | none (scripts in package.json) |
| Quick run command | `node --test agent/test/escrow.test.js` |
| Full suite command | `node --test agent/test/*.test.js` |

> Note: FraudEscrow.sol contract tests use Hardhat+Mocha (`npm test --workspace=contracts`). The escrow.js agent-side tests use Node built-in test runner consistent with Phase 5 pattern.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ESCR-01 | depositEscrow() calls approve then deposit, returns txHash | unit (mock) | `node --test agent/test/escrow.test.js` | Wave 0 |
| ESCR-02 | releaseEscrow() called when LEGITIMATE classification | unit (mock) | `node --test agent/test/escrow.test.js` | Wave 0 |
| ESCR-03 | refundEscrow() called for LIKELY_SCAM / COUNTERFEIT_RISK | unit (mock) | `node --test agent/test/escrow.test.js` | Wave 0 |
| ESCR-04 | slashEscrow() called for SCALPING_VIOLATION above threshold | unit (mock) | `node --test agent/test/escrow.test.js` | Wave 0 |
| ESCR-05 | Bond deposit on startup, slash on first confirmed fraud | unit (mock) | `node --test agent/test/escrow.test.js` | Wave 0 |
| ESCR-06 | Etherscan link written to case file after tx confirms | unit (file I/O) | `node --test agent/test/escrow.test.js` | Wave 0 |

> All unit tests mock WDK account and ethers calls — no Sepolia RPC needed for unit tests. Smoke integration test (live Sepolia) is manual/optional for demo prep.

### Sampling Rate
- **Per task commit:** `node --test agent/test/escrow.test.js`
- **Per wave merge:** `node --test agent/test/*.test.js`
- **Phase gate:** All escrow unit tests green + manual smoke test on Sepolia before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `agent/test/escrow.test.js` — covers ESCR-01 through ESCR-06 with mocked WDK + ethers
- [ ] `agent/test/fixtures/mock-account.js` — mock WDK account (approve/sendTransaction/getTokenBalance/getTransactionReceipt)

---

## Sources

### Primary (HIGH confidence)
- `/Users/justinsoon/Desktop/others/ducket-ai-galactica/node_modules/@tetherto/wdk-wallet-evm/src/wallet-account-evm.js` — WDK approve() implementation (confirmed sendTransaction+encodeFunctionData pattern)
- `/Users/justinsoon/Desktop/others/ducket-ai-galactica/node_modules/@tetherto/wdk-wallet-evm/types/src/wallet-account-evm.d.ts` — WDK account API surface (sendTransaction, approve, getTokenBalance, getTransactionReceipt)
- `/Users/justinsoon/Desktop/others/ducket-ai-galactica/contracts/src/FraudEscrow.sol` — contract function signatures and access control
- `/Users/justinsoon/Desktop/others/ducket-ai-galactica/contracts/artifacts/src/FraudEscrow.sol/FraudEscrow.json` — compiled ABI
- `/Users/justinsoon/Desktop/others/ducket-ai-galactica/contracts/deployed.json` — deployed addresses
- `/Users/justinsoon/Desktop/others/ducket-ai-galactica/agent/src/wallet/index.ts` — WDK singleton pattern
- `/Users/justinsoon/Desktop/others/ducket-ai-galactica/agent/src/scan-loop.js` — enforcement gate at line 121-128 (where escrow calls will be inserted)
- `/Users/justinsoon/Desktop/others/ducket-ai-galactica/agent/src/evidence.js` — case file format, Etherscan placeholder at line 128

### Secondary (MEDIUM confidence)
- ethers v6 docs (via npm registry metadata confirming 6.16.0) — flat namespace, bigint, Interface API

### Tertiary (LOW confidence)
- None — all critical claims verified from source files

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed from package.json and node_modules
- Architecture: HIGH — WDK approve() pattern confirmed from source code inspection
- Pitfalls: HIGH — onlyOwner/deployer key issue confirmed by reading FraudEscrow.sol constructor + WDK address derivation
- Integration points: HIGH — scan-loop.js enforcement gate location confirmed by reading source

**Research date:** 2026-03-19
**Valid until:** 2026-03-26 (stable stack; primary risk is Sepolia network availability, not library API changes)
