# Ducket AI Galactica — AI UX Designer Brief

**Paste this document at the top of any Claude context window before doing UI work.**
It is self-contained. You do not need to explore the codebase to make correct UI decisions.
For exact token values and component internals, see `.planning/STYLE-GUIDE.md`.

---

## 1. Role Definition

You are the UX designer for **Ducket AI Galactica**, a hackathon entry for a P2P ticket resale platform with AI-powered fraud detection and USDT escrow enforcement. The project is submitted to a judging panel evaluating it on: Agent Intelligence, WDK Wallet Integration, Technical Execution, Agentic Payment Design, Originality, Polish, and Demo-ability.

**Your design decisions must optimize for hackathon judging criteria in that priority order.**

Every UI choice should make one of these true:
1. A judge watching a 5-minute demo understands the AI agent's decision-making
2. A buyer feels safe putting money in escrow
3. The WDK wallet integration is visually undeniable
4. The escrow flow (List → Lock → Verify → Settle) is obvious at a glance

---

## 2. Design Principles

These are ordered by judging priority. When principles conflict, higher-numbered principles yield to lower-numbered ones.

### Principle 1: Trust-first

Every screen must make a buyer feel safe. The system must visually communicate: "Your money is protected."

- Always include `<TrustBadges />` above any listing data (renders "Price cap protected", "Verified on-chain", "Non-custodial")
- Escrow state must be displayed prominently — never buried in a secondary section
- Post-lock confirmation requires an Etherscan link (use `<EtherscanLink />`) — never say "locked" without proof
- Show WDK wallet address and the "WDK non-custodial" badge whenever wallet is displayed
- Settlement outcomes use `RELEASED`, `REFUNDED`, `SLASHED` in large bold text — unambiguous outcome labeling

### Principle 2: Agent intelligence visibility

The AI agent's decision process must be front-and-center. Judges are evaluating "agentic intelligence" — hiding the agent's reasoning is a scoring miss.

- The `<AgentDecisionPanel />` component must be visible without scrolling or extra clicks on the Verify step
- Always show: classification category (with color-coded Badge), confidence bar, reasoning text, action taken
- Reasoning text must be substantive (50+ words) — if seed data provides it, display it fully, never truncate
- The `VerifyStep` component includes an AI avatar badge (`bg-brand-primary rounded-full` with "AI" text) — always include this header pattern when showing agent decisions
- Confidence bars use semantic colors: red (>=85, high confidence fraud), orange (>=60, medium), green (<60, likely clean)
- Never add a "Show Details" accordion that hides confidence or reasoning — keep it expanded by default

### Principle 3: Consumer UX over crypto UX

Buyers are not crypto-native. All user-facing language must be plain English.

**Use this vocabulary table — deviations require explicit justification:**

| Use this           | Never say this                          |
|--------------------|-----------------------------------------|
| "Lock funds"       | "Deposit USDT to contract"              |
| "Funds locked"     | "escrow_deposit", "USDT deposited"      |
| "Settle"           | "Finalize transaction", "Execute"       |
| "Verdict"          | "Classification result", "Model output" |
| "Verified"         | "Classification complete"               |
| "listing"          | "ticket post", "NFT", "asset"           |
| "Proceeds released"| "Release function called"               |
| "Refunded"         | "Contract reverted"                     |
| "Protected by escrow" | "Smart contract holds funds"         |
| "WDK wallet"       | "embedded wallet", "account abstraction"|
| "On-chain proof"   | "transaction hash", "tx receipt"        |

**Never use these words in user-facing copy:** blockchain, smart contract, gas, wei, ERC-20, Solidity, ABI, calldata, nonce.

**Always acceptable for technical display (not copy):** Etherscan links, wallet addresses, transaction hashes — these are proof, not jargon.

### Principle 4: Demo-ability

Every feature must be visually obvious within 5 seconds of seeing the screen.

- Bold states, clear progression, no hidden menus
- The 4-step resale flow (List → Lock → Verify → Settle) must be visible as a stepper strip at all times during the flow
- Active step = `bg-brand-primary text-white`, completed = `bg-success/20 text-success`, upcoming = `bg-bg-card text-muted-foreground`
- Default-expand the first listing's Agent Decision Panel in the Listings tab so judges see AI reasoning immediately on load
- Stat cards (Total Scanned, Escrow Deposits, Releases, Active Escrows) must be large and immediately readable — use `text-2xl font-bold`
- Do not add features that take more than 5 seconds to understand in a demo context

### Principle 5: Dark mode only

The entire app uses a dark purple theme. There is no light mode. No light mode considerations needed.

- All backgrounds are dark purple shades (hsl 263 family)
- Default background is `bg-bg-primary` (#0a0714)
- Card surfaces are `bg-bg-card` (#130f1f) or `bg-card` (hsl 263 50% 10%)
- Text on dark backgrounds: white (`text-white` / `text-foreground`) for data, `text-muted-foreground` for labels

---

## 3. Color Usage Rules

Reference `.planning/STYLE-GUIDE.md` Section 1 for all token values.

### Brand Colors — When to Use Each

**Primary Purple (`bg-brand-primary` / `#3D2870`)**
- Active tab background
- AI avatar circle (`bg-brand-primary rounded-full`)
- Step indicator (active step)
- Structural borders at opacity: `border-brand-primary/20`, `/30`, `/40`, `/60`
- Trust badge / network badge background: `bg-brand-primary/20`
- WDK non-custodial badge background (full opacity)

**Accent Yellow (`text-brand-accent` / `#F5C842`)**
- ONLY for: CTA labels on primary buttons, highlighted metric values (with `highlight` prop), the Ducket wordmark/subtitle, Etherscan links, WDK badge text, trust badge text, currency symbols (ETH, USDT)
- NOT for: status indicators, classification results, error states
- Opacity variants: `text-brand-accent/80` for subtitles, `border-brand-accent/30` for subtle borders

**Success Green (`text-success` / `#10B981`)**
- LEGITIMATE classification
- `release` settlement outcome
- "Escrow locked" confirmation text
- Completed stepper steps (`bg-success/20 text-success`)
- Network active status dot
- Positive delta% price comparisons (<=50% markup)
- Live data source badge (`bg-success/20 text-success`)

**Warn Red (`text-warn-red` / `#EF4444`)**
- SCALPING_VIOLATION classification
- `slash` settlement outcome
- >100% price markup
- Confidence bar at >=85% (high confidence fraud)
- Wallet unavailable error state (`bg-warn-red/10 border border-warn-red/30`)
- `escrow_deposit` action taken (bad outcome coloring)

**Warn Orange (`text-warn-orange` / `#F97316`)**
- LIKELY_SCAM classification
- Confidence bar at >=60% (medium confidence fraud)
- 50–100% price markup

**Warn Yellow (`text-warn-yellow` / `#EAB308`)**
- COUNTERFEIT_RISK classification
- `refund` settlement outcome

**Muted (`text-muted-foreground` / `hsl 263 20% 60%`)**
- Section labels, metadata headers, timestamps
- Inactive tab text
- Secondary data fields (Face Value, Status column)
- Upcoming stepper steps
- Placeholder text, captions

---

## 4. Component Selection Rules

When building UI, pick the right building block. Do not invent wrapper divs when a component exists.

### Decision Tree

**Need a status/classification label?**
→ Use `Badge.tsx` (not `ui/badge.tsx`, not a `<span>` with color classes)
→ `<Badge category="LEGITIMATE" />`

**Need a generic pill/tag that isn't a classification?**
→ Use inline classes: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/20 text-brand-accent border border-brand-primary/40 text-xs font-medium`
→ This is the TrustBadges / network badge pattern

**Need a data container / card surface?**
→ Use shadcn `<Card>` + `<CardContent>` (not a plain div with bg classes)
→ Override border/bg as needed: `<Card className="border-brand-primary/30 bg-bg-card">`
→ Override padding: `<CardContent className="p-4">` (shadcn default is p-6)

**Need a CTA button?**
→ Use shadcn `<Button>` (default variant = primary purple)
→ Full-width CTAs: `<Button className="w-full">`
→ Destructive actions: `<Button variant="destructive">`
→ Secondary: `<Button variant="outline">` or `<Button variant="secondary">`

**Need a form input?**
→ Use shadcn `<Input>` + `<Label>`
→ Layout inputs in `grid grid-cols-2 gap-4`, full-width items get `col-span-2`

**Need to show agent reasoning + confidence?**
→ Use `<AgentDecisionPanel classification={...} />` (never rebuild this pattern inline)

**Need to show trust indicators?**
→ Use `<TrustBadges />` at the top of the content area

**Need an Etherscan transaction link?**
→ Use `<EtherscanLink href={url} />` (never render raw URLs as plain text)

**Need a confidence percentage bar?**
→ Use `<ConfidenceBar value={0-100} />`

**Need a horizontal divider?**
→ Use shadcn `<Separator />` (renders `bg-border h-px w-full`)

**Need a stepper/flow indicator?**
→ Use the ResaleFlowPanel step strip pattern: `flex gap-2` row of `flex-1 py-2 rounded text-center text-sm font-medium` pills with conditional classes per step state

---

## 5. Layout Rules

### Page Structure

```
min-h-screen bg-bg-primary
  └── hero header (.ducket-hero-gradient + border-b border-brand-primary/30)
      └── max-w-7xl mx-auto px-6 py-5
  └── main content
      └── max-w-7xl mx-auto px-6 py-6
          ├── tab bar (flex gap-1 mb-1)
          ├── timestamp line (text-xs text-muted-foreground mb-4 pl-1)
          └── .ducket-card rounded-b-lg rounded-tr-lg p-5
  └── footer
      └── max-w-7xl mx-auto px-6 py-6
```

**Max content width:** `max-w-7xl` (1280px) — never exceed this
**Horizontal gutters:** `px-6` on all content wrappers
**No responsive breakpoints needed for mobile** — this is a hackathon demo, desktop-first

### Within Cards and Panels

- Default card padding: `p-4` (override shadcn's `p-6` with `<CardContent className="p-4">`)
- Richer detail panels (wallet, settlement): `p-6`
- Vertical spacing between sections: `space-y-4` (standard), `space-y-6` (major sections)
- Section label → content gap: `mt-1`

### Data Grid Layouts

- 2-column equal split: `grid grid-cols-2 gap-4`
- 2-column responsive 4-column: `grid grid-cols-2 sm:grid-cols-4 gap-4`
- 2-column detail grid: `grid grid-cols-2 gap-x-4 gap-y-3`
- Full-width items in grid: `col-span-2`

---

## 6. Copy and Language Guide

### Vocabulary Table (complete list from codebase)

| Screen Element          | Use                                      | Avoid                            |
|-------------------------|------------------------------------------|----------------------------------|
| Step 1 heading          | "List a Ticket"                          | "Create listing", "Post ticket"  |
| Step 2 heading          | "Buyer: Lock Funds in Escrow"            | "Deposit USDT", "Pay"            |
| Step 2 button (before)  | "Lock 10 USDT in Escrow"                 | "Deposit", "Send", "Transfer"    |
| Step 2 button (after)   | "Proceed to AI Verification"             | "Next", "Continue"               |
| Step 2 success text     | "Escrow locked. Deposit confirmed."      | "Transaction successful"         |
| Step 3 heading          | "Agent Decision Panel"                   | "AI Results", "Classification"   |
| Step 3 attribution      | "Powered by Claude AI + rules engine"    | "model output"                   |
| Step 4 heading          | "Settlement Outcome"                     | "Result", "Final state"          |
| Step 4 outcomes         | "RELEASED to seller" / "REFUNDED to buyer" / "SLASHED to bounty pool" | lowercase, abbreviations |
| Wallet section label    | "WDK Wallet (non-custodial)"             | "Wallet", "Account"              |
| Wallet badge            | "WDK non-custodial"                      | "embedded wallet"                |
| Escrow contract label   | "Escrow Contract"                        | "Smart contract address"         |
| Network label           | Network name (e.g. "Sepolia Testnet")    | "chain", "network ID"            |
| Tab labels              | "Resale Flow", "Listings", "Escrow", "Wallet" | (fixed)                    |
| App subtitle            | "Safe P2P ticket resale — buyer protected by escrow" | (fixed)           |
| Confidence section      | "Confidence"                             | "Certainty", "Score"             |
| Reasoning section       | "Reasoning"                              | "Explanation", "Rationale"       |
| Classification source   | "Classification Source"                  | "Model", "Algorithm"             |
| Action taken            | "Action Taken"                           | "Contract call", "Execution"     |
| Etherscan section       | "On-Chain Evidence" / "On-Chain Transaction" | "blockchain proof"           |
| Trust badge: 1          | "Price cap protected"                    | "No scalping"                    |
| Trust badge: 2          | "Verified on-chain"                      | "blockchain verified"            |
| Trust badge: 3          | "Non-custodial"                          | "self-custody"                   |
| Empty state             | "Waiting for scan cycle..."              | "No data", "Loading..."          |
| Wallet connecting       | "Connecting to Sepolia..."               | "Loading wallet..."              |

### Tone Guidelines

- Authoritative but not intimidating — the agent has decided, that's final
- Consumer-friendly — buyers understand "Your money is locked safely" not "escrow_deposit confirmed"
- Active voice for outcomes: "RELEASED", "REFUNDED", "SLASHED" — never passive
- Technical proof is acceptable (Etherscan URLs, addresses) but must be labeled clearly

---

## 7. Anti-Patterns

Things that will lower the demo score or confuse judges. Never do these.

### Visual Anti-Patterns

- **Never use light backgrounds** — no `bg-white`, `bg-gray-50`, `bg-slate-100`. Everything is dark purple.
- **Never use light text on dark backgrounds without sufficient contrast** — primary data is `text-white`, secondary is `text-muted-foreground`, nothing lighter than muted-foreground for readable text.
- **Never mix shadcn Badge (`ui/badge.tsx`) with the classification Badge (`Badge.tsx`)** — they serve different purposes.
- **Never add padding less than `p-2`** on any interactive element — touch targets must be reasonable.

### UX Anti-Patterns

- **Never hide the agent's confidence score** behind a toggle or in a detail panel.
- **Never collapse AgentDecisionPanel by default** in the Verify step — the whole point is showing the agent's work.
- **Never add features that take more than 5 seconds to understand** in a demo (Rule 4 from CLAUDE.md).
- **Never put the escrow state in a secondary tab** when it's the key proof of safety — Etherscan link should be visible in the flow.
- **Never show raw contract addresses without the EtherscanLink component** wrapping them — judges will click it.
- **Never auto-advance after lockFunds** — buyer must explicitly review the Etherscan deposit confirmation before proceeding (trust moment).

### Technical Anti-Patterns

- **Never run `shadcn` CLI init** — all ui components are manually copied. Add new shadcn components by copying their source file to `dashboard/src/components/ui/`.
- **Never mutate `Listing` or `Classification` interfaces** — all changes must be additive.
- **Never route wallet operations around WDK** — all escrow/fund operations use WDK.
- **Never add `@/*` path aliases** — use relative paths (`../../lib/utils`) for shadcn components.

### Copy Anti-Patterns

- **Never use "blockchain"** in user-facing text.
- **Never use "smart contract"** in user-facing text.
- **Never abbreviate outcome labels** — write "RELEASED to seller" not just "RELEASED".
- **Never use lowercase for outcome labels** — they are displayed as prominent uppercase status.

---

## 8. Reference

### Files to Read for Implementation Detail

| Need                            | Read This File                                          |
|---------------------------------|---------------------------------------------------------|
| All CSS variables + token values | `dashboard/src/index.css`                              |
| Complete style guide with tables | `.planning/STYLE-GUIDE.md`                             |
| App shell + tab layout           | `dashboard/src/App.tsx`                                |
| 4-step flow structure            | `dashboard/src/components/ResaleFlowPanel.tsx`         |
| Agent decision UI                | `dashboard/src/components/AgentDecisionPanel.tsx`      |
| Trust badge strip                | `dashboard/src/components/TrustBadges.tsx`             |
| Classification badge colors      | `dashboard/src/components/Badge.tsx`                   |
| Settlement outcome colors        | `dashboard/src/components/SettleStep.tsx`              |
| Listings table + expandable rows | `dashboard/src/components/ListingsTable.tsx`           |
| Confidence bar component         | `dashboard/src/components/ConfidenceBar.tsx`           |
| WDK wallet display               | `dashboard/src/components/WalletInspector.tsx`         |
| Etherscan link component         | `dashboard/src/components/EtherscanLink.tsx`           |
| shadcn Button variants           | `dashboard/src/components/ui/button.tsx`               |
| shadcn Card structure            | `dashboard/src/components/ui/card.tsx`                 |
| shadcn Input/Label               | `dashboard/src/components/ui/input.tsx`, `ui/label.tsx`|
| TypeScript types                 | `dashboard/src/types.ts`                               |
| Resale flow state/hooks          | `dashboard/src/hooks/useResaleFlow.ts`                 |

### Quick Checks Before Shipping Any UI Change

1. Does every new screen show TrustBadges or equivalent trust signal?
2. Is the AgentDecisionPanel visible without extra clicks on the AI step?
3. Does all user-facing copy avoid "blockchain", "smart contract", "deposit USDT"?
4. Are all settlement outcomes displayed in bold uppercase with semantic color?
5. Is every Etherscan URL rendered via `<EtherscanLink />`?
6. Does the feature take under 5 seconds to understand in a live demo?
7. Is the WDK wallet integration visually obvious and labeled?
