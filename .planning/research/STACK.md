# Stack Research

**Domain:** Autonomous fraud detection agent with on-chain USDT escrow enforcement
**Researched:** 2026-03-19
**Confidence:** MEDIUM (WDK is new — team confirmed zero prior experience; OpenClaw version data is current; Claude model IDs verified from official docs)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | 22.x (LTS) | Agent runtime | OpenClaw requires Node >=22.16.0 on macOS; WDK is JS/TS-only by hackathon rules |
| TypeScript | 5.x | Type safety across agent + backend | ESM-first codebase; OpenClaw is ESM-only; prevents runtime errors on wallet address types |
| OpenClaw | 2026.3.13-1 (latest) | Autonomous agent framework | Team already experienced; local-first; skills-based tool extension; streaming agent loop; no cloud dependency |
| @tetherto/wdk-wallet-evm | latest | Self-custodial EVM wallet + USDT transfers | Hackathon mandatory requirement; provides BIP-44 wallet creation, ERC-20 (USDT) transfers, balance queries without centralized custody |
| @anthropic-ai/sdk | 0.79.0 | LLM classification of ticket listings | Tool-use / structured output API for fraud classification; fast enough for real-time per-listing decisions |
| Patchright | latest (npm) | Headless browser scraping with anti-bot evasion | Source-level Playwright patch that removes Runtime.enable fingerprinting leak; needed for Carousell and Viagogo which use DataDome-class protection |
| React + Vite | React 19 / Vite 6 | Organizer dashboard | Team familiar; fast HMR for hackathon iteration; single-page app is sufficient for demo |
| Tailwind CSS | 4.x | Dashboard styling | Team familiar from ducket-web; zero config overhead; utility classes ship fast |
| Socket.IO | 4.x | Real-time push from agent to dashboard | Bidirectional, typed events; auto-reconnect; works over plain HTTP without nginx config |
| Express | 5.x | HTTP API + Socket.IO host | Lightweight; sufficient for agent event relay, escrow state API, and scan trigger endpoints |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| grammy | 2.x | Telegram channel/group scraping | Scraping public Telegram groups for ticket listings using Bot API; lighter and more TypeScript-native than Telegraf |
| zod | 3.x | Schema validation for LLM output | Wrap Claude structured outputs in Zod schemas to ensure classification fields are present before acting on them |
| @tetherto/wdk-protocol-bridge-usdt0-evm | latest | USDT0 cross-chain bridge (if needed) | Only needed if demo requires cross-chain movement; skip for Sepolia-only demo |
| viem | 2.x | Low-level EVM RPC calls | Fallback for reading Sepolia chain state (block confirmations, event logs) without WDK overhead; optional if WDK covers it |
| dotenv | 16.x | Secret management | Keep ANTHROPIC_API_KEY and WDK seed phrases out of committed code; use .env.example for judges |
| tsx | latest | TypeScript execution without build step | Run agent server directly with `tsx watch` during hackathon; no tsc compile loop needed |
| concurrently | 9.x | Run agent + dashboard dev server together | Single `npm run dev` for demos and judge testing |
| @types/express, @types/node | matching | TypeScript declarations | Standard; no runtime cost |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| tsx (ts-node replacement) | Execute TypeScript directly | Faster than ts-node; ESM-compatible; use `tsx watch src/agent/index.ts` for hot reload |
| Vite | Dashboard bundler | Default React template with `npm create vite@latest`; TypeScript + React preset |
| ESLint + typescript-eslint | Lint | Catch type errors before they break the demo live; minimal config overhead |
| Sepolia RPC | Testnet EVM node | Use Alchemy or Infura free tier; public endpoints are rate-limited and unreliable for hackathon demos |

---

## Installation

```bash
# Agent (Node.js backend)
npm install openclaw @tetherto/wdk-wallet-evm @anthropic-ai/sdk patchright grammy express socket.io zod dotenv

# Frontend dashboard
npm create vite@latest dashboard -- --template react-ts
cd dashboard && npm install tailwindcss @tailwindcss/vite socket.io-client

# Dev dependencies
npm install -D tsx typescript @types/node @types/express concurrently
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Patchright | playwright-extra + stealth plugin | Stealth plugin is JavaScript monkey-patching; Patchright patches at source level — use Patchright for sites with DataDome/Akamai. Use playwright-extra only if Patchright breaks on a specific browser version |
| grammy | Telegraf v4 | Telegraf is more mature but TypeScript support is weaker; grammY has better type inference. Use Telegraf if you need its middleware ecosystem for a production bot |
| @tetherto/wdk-wallet-evm | ethers.js v6 direct | ethers.js is fine for reading chain state; WDK is mandatory for wallet operations per hackathon rules. Use viem/ethers only as a supplement for state queries WDK doesn't expose |
| Socket.IO | native WebSocket / SSE | Socket.IO adds reconnection, namespacing, and typed events with almost no extra code. SSE is simpler but dashboard needs bidirectional control (trigger scans from UI) |
| claude-sonnet-4-6 | claude-haiku-4-5 | Haiku is 3x cheaper and faster; use it if classification latency becomes a bottleneck with many concurrent listings. Sonnet is recommended because fraud classification requires nuanced reasoning about listing text |
| Express | Fastify / Hono | Fastify/Hono are faster but team familiarity with Express is higher. For a 3-day build, choose known tools |
| OpenClaw 2026.3.x | LangChain.js / custom agent loop | LangChain.js adds abstraction overhead and the team has no experience with it. OpenClaw's skills model maps directly to scrape/classify/escrow tool calls |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| centralized wallet custody (Custodial wallet APIs, Fireblocks, etc.) | Hackathon disqualification — WDK self-custodial is a hard requirement | @tetherto/wdk-wallet-evm |
| ETH or USDC as settlement asset | Judging criteria requires USDT/Tether tokens as primary asset | USDT on Sepolia (contract: 0x7169d38820dfd117c3fa1f22a697dba58d90ba06) |
| Mainnet Ethereum | Not needed for demo; real USDT cost; risk of slashing real funds | Sepolia testnet with faucet USDT |
| Puppeteer | Chromium-only, no stealth patching, inferior fingerprint evasion vs Patchright | Patchright (Chromium channel: "chrome") |
| axios / cheerio for Carousell/Viagogo | These sites are heavily JS-rendered and use anti-bot; static HTTP scraping will return empty pages | Patchright with persistent context and human-like timing |
| claude-opus-4-6 for per-listing classification | 5x more expensive than Sonnet, slower; overkill for fraud label classification | claude-sonnet-4-6 (use Opus only for complex evidence summarization if needed) |
| Hardcoded seed phrases in source | Disqualifying — repo is public, judges will review code | .env file with .gitignore; document in .env.example |
| React Native WDK packages (@tetherto/wdk-react-native-provider) | These are mobile-only; will not run in a Node.js agent process | @tetherto/wdk-wallet-evm for server-side wallet ops |

---

## Stack Patterns by Variant

**Agent process (Node.js server):**
- OpenClaw provides the agent loop and skill dispatch
- Each "skill" maps to one agent capability: `scrape-listings`, `classify-listing`, `escrow-deposit`, `escrow-slash`, `escrow-release`, `draft-report`
- WDK wallet instance is created once at agent startup from seed phrase in .env and passed into escrow skills
- Claude API is called inside `classify-listing` skill with structured output (Zod schema)

**Dashboard (React SPA):**
- Vite dev server proxies `/api` to Express backend
- Socket.IO client subscribes to `listing:new`, `classification:done`, `escrow:action` events
- No auth needed — judge demo is single-user
- Dashboard triggers scans via POST /api/scan (event URL + platform list)

**Scraping architecture:**
- One Patchright browser instance per platform (3 total: Carousell, Viagogo, Telegram web)
- Persistent context (not incognito) per platform to preserve login/session state
- Telegram: use grammy Bot API for public group message history; fall back to Patchright web.telegram.org if bot token rejected by group
- Carousell: Patchright with `channel: "chrome"`, `headless: false` for demo visibility; viewport: 1280x800
- Viagogo: Patchright with realistic mouse movement delays (50-150ms between actions)

**Escrow flow pattern:**
- Organizer stakes USDT → `escrow-deposit` skill: WDK `account.transfer()` to agent-controlled wallet address
- Agent detects fraud → `escrow-slash` skill: WDK `account.transfer()` to burn/treasury address
- Listing cleared → `escrow-release` skill: WDK `account.transfer()` back to organizer address
- All actions emit Socket.IO event to update dashboard escrow status in real-time

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| openclaw 2026.3.13-1 | Node >=22.16.0 | ESM-only; use `"type": "module"` in package.json or .mts extensions |
| @tetherto/wdk-wallet-evm latest | Node 20+ (likely) | Verify in WDK docs; team should test immediately — this is the highest-risk integration |
| patchright latest | Chromium only | Do NOT use Firefox or WebKit; the stealth patches only apply to Chromium |
| @anthropic-ai/sdk 0.79.0 | Node 18+ | Works with ESM and CJS; model ID: `claude-sonnet-4-6` |
| socket.io v4 (server) | socket.io-client v4 | Major versions must match exactly; v4 server with v3 client will fail handshake |
| React 19 | Vite 6 | Default from `npm create vite@latest` with react-ts template; no manual config needed |
| Tailwind CSS 4.x | Vite 6 | Use `@tailwindcss/vite` plugin (not PostCSS config) — v4 changed the config approach entirely |

---

## Key WDK Code Pattern

The core WDK pattern for the escrow skill (HIGH confidence — verified from official docs):

```typescript
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'

// Initialize once at agent startup
const wallet = new WalletManagerEvm(process.env.AGENT_SEED_PHRASE!, {
  provider: process.env.SEPOLIA_RPC_URL!, // e.g. Alchemy Sepolia endpoint
  transferMaxFee: 100000000000000
})

const agentAccount = await wallet.getAccount(0)

// Deposit: organizer sends USDT to agentAccount.address via their own wallet
// Slash: agent slashes from escrow to treasury
await agentAccount.transfer({
  token: '0x7169d38820dfd117c3fa1f22a697dba58d90ba06', // Sepolia USDT
  recipient: process.env.TREASURY_ADDRESS!,
  amount: BigInt(slashAmountUsdt * 1_000_000) // USDT has 6 decimals
})
```

---

## Model Selection Rationale

Use **`claude-sonnet-4-6`** (not the model ID from PROJECT.md which references `claude-sonnet-4-20250514` — that is now a legacy alias).

Current verified model IDs (from official Anthropic docs, 2026-03-19):
- `claude-sonnet-4-6` — fast, $3/MTok in, recommended for per-listing classification
- `claude-haiku-4-5-20251001` — fastest, $1/MTok in, fallback if rate limits hit
- `claude-opus-4-6` — most capable, $5/MTok in, only for final fraud case summarization

For a 3-day hackathon where each listing classification costs ~500 tokens: Sonnet is the right default. At $3/MTok, classifying 1,000 listings costs ~$1.50. Well within free tier limits.

---

## Sources

- https://docs.wdk.tether.io/sdk/wallet-modules/wallet-evm — WDK EVM wallet API, `account.transfer()` method, ERC-20 support (HIGH confidence — official docs)
- https://docs.wdk.tether.io/overview/about — WDK overview, supported chains, module structure (HIGH confidence — official docs)
- https://www.npmjs.com/package/openclaw — OpenClaw npm package, ESM-only, version 2026.2.25 stable (MEDIUM confidence — npm registry)
- https://github.com/openclaw/openclaw/releases/ — OpenClaw latest release 2026.3.13-1, Node >=22.16.0 requirement (HIGH confidence — official GitHub releases)
- https://docs.openclaw.ai/concepts/agent — OpenClaw agent runtime, skills loading, session management (MEDIUM confidence — official docs)
- https://platform.claude.com/docs/en/about-claude/models/overview — All current Claude model IDs, pricing, context windows (HIGH confidence — official Anthropic docs, verified 2026-03-19)
- https://www.npmjs.com/package/@anthropic-ai/sdk — @anthropic-ai/sdk version 0.79.0 (MEDIUM confidence — npm registry search result, not direct page fetch)
- https://github.com/Kaliiiiiiiiii-Vinyzu/patchright — Patchright source-level Playwright stealth patches (MEDIUM confidence — official GitHub)
- https://grammy.dev/ — grammY Telegram bot framework documentation (MEDIUM confidence — official site)
- https://sepolia.etherscan.io — Sepolia USDT contract: 0x7169d38820dfd117c3fa1f22a697dba58d90ba06 (MEDIUM confidence — WebSearch result)
- https://socket.io/docs/v4/typescript/ — Socket.IO v4 TypeScript support, typed events (HIGH confidence — official docs)

---

## Open Questions (LOW confidence areas requiring team validation)

1. **WDK package version** — Official docs do not publish version numbers on the docs site. Team must run `npm info @tetherto/wdk-wallet-evm` to confirm installable version before writing escrow code.
2. **Sepolia USDT contract address** — 0x7169d38820dfd117c3fa1f22a697dba58d90ba06 found via search; team must verify on Sepolia Etherscan before hardcoding.
3. **Carousell anti-bot tier** — No confirmed report of Carousell's specific anti-bot vendor. Patchright handles most; if Carousell uses Kasada or PerimeterX, additional fingerprint spoofing may be needed. Test on day 1.
4. **grammy for Telegram listings** — grammy reads messages from groups where the bot is a member. For public groups, a user account via MTProto (e.g., gramjs) may be needed. Verify access method against the target Telegram marketplace group on day 1.
5. **WDK on Sepolia** — WDK docs show mainnet RPC examples. Team must confirm Sepolia RPC is accepted as the `provider` param. If not, may need to use ethers.js directly for testnet operations while keeping WDK for the demo "escrow" wallet.

---

*Stack research for: Autonomous ticket fraud detection agent with USDT escrow enforcement*
*Researched: 2026-03-19*
