# Pitfalls Research

**Domain:** P2P ticket resale pivot — adding resale UI + rebrand to a working agent system under 2-day deadline (v2.0 milestone)
**Researched:** 2026-03-20 (updated from 2026-03-19 v1.0 research)
**Confidence:** HIGH — based on direct codebase inspection of existing dashboard + known Tailwind v4 / shadcn / React 19 integration failure modes

---

## Critical Pitfalls — v2.0 Pivot Specific

These pitfalls are specific to the v2.0 task: adding P2P resale UI and rebranding to an already-working system under a 2-day deadline.

---

### Pitfall P1: Breaking the Existing Working Pipeline While Adding New UI

**What goes wrong:**
New resale flow UI components import shared types or API hooks. A refactor to `types.ts` or `server/api.ts` for new resale fields silently breaks the existing `ListingsTable`, `EscrowStatus`, and `WalletInspector` components that judges will see first. The agent itself keeps running but the dashboard shows blank tables or JavaScript errors.

**Why it happens:**
The existing dashboard has a single `types.ts` with `Listing`, `Classification`, and `WalletInfo`. Adding a `ResaleListing` type by extending or mutating `Listing` causes TypeScript compilation to fail in components that destructure those types. Under deadline pressure, developers add `// @ts-ignore` and ship silently broken views.

**How to avoid:**
- Add resale types as NEW interfaces alongside existing ones — never mutate `Listing` or `Classification`.
- Keep new resale UI components in a new directory (`src/components/resale/`), not mixed into existing components.
- Add new API routes (`/api/resale`) rather than modifying existing `/api/listings` response shape.
- Run `npm run build` in the dashboard workspace after every new component before touching existing ones.
- Test the existing 3 tabs (Listings, Escrow, Wallet) after every change to `types.ts` or `server/api.ts`.

**Warning signs:**
- TypeScript errors on `Classification.category` or `Listing.platform` after adding new fields.
- Blank listings table — usually means the API response shape changed but the hook wasn't updated.
- `useListings` hook returns an empty array on load (polling broke because the endpoint now returns different JSON).

**Phase to address:** Resale flow UI phase — enforced by running an existing dashboard smoke-test before and after every PR.

---

### Pitfall P2: Tailwind v4 @theme{} Variable Conflicts When Rebranding Colors

**What goes wrong:**
The existing dashboard uses Tailwind v4's `@theme {}` block in `index.css` with custom design tokens (`--color-bg-primary`, `--color-accent` mapped to indigo `#6366F1`). When adding Ducket brand colors (purple/yellow), a developer adds NEW `@theme {}` variables but also renames or overrides existing ones. Components like `bg-bg-primary`, `bg-accent`, `text-success` stop compiling or render the wrong color. Tailwind v4 has no `tailwind.config.js` — all customization is CSS-only — so the failure is silent visual breakage, not a build error.

**Why it happens:**
Tailwind v4's `@theme {}` scoping is less familiar than v3 config files. Developers duplicate the block or add a second `@theme {}` in a new CSS file imported separately, causing the second declaration to silently win. Variable names that look like they should coexist (`--color-accent` vs `--color-brand-purple`) conflict when two `@theme {}` blocks exist.

**How to avoid:**
- Have exactly ONE `@theme {}` block in exactly ONE CSS file (`index.css`).
- Add Ducket brand colors as NEW variable names: `--color-brand-purple`, `--color-brand-yellow` — never rename or delete `--color-accent`, `--color-bg-primary`, `--color-bg-card`, `--color-success`, `--color-warn-red`.
- Add `@import url(...)` for Outfit font BEFORE `@import "tailwindcss"` — the CSS `@import` ordering rule means any font import after the Tailwind import is silently ignored.
- Verify existing `Badge.tsx` and `ConfidenceBar.tsx` still render correctly after any theme changes.

**Warning signs:**
- Existing `bg-accent` buttons turn transparent or revert to browser default blue after adding brand colors.
- Outfit headings don't render — fallback to Inter — means the font `@import` was placed after `@import "tailwindcss"`.
- Tailwind class autocomplete stops suggesting custom token names in the IDE.

**Phase to address:** Dashboard rebrand phase — add colors first, verify existing components render, then apply new classes.

---

### Pitfall P3: shadcn/ui CLI Installation Corrupts the Existing Vite + Tailwind v4 Setup

**What goes wrong:**
Running `npx shadcn@latest init` inside the `dashboard/` workspace generates a `tailwind.config.js` and may modify `vite.config.ts` in a way that conflicts with the already-configured `@tailwindcss/vite` plugin. The existing Tailwind v4 CSS-first setup (no config file) is overwritten. Compilation fails or Tailwind v4 tokens stop working entirely.

**Why it happens:**
shadcn's `init` command defaults to Tailwind v3 behavior. As of early 2026, shadcn added experimental Tailwind v4 support, but the `init` wizard still offers to create `tailwind.config.js` and overwrite the vite config. Saying "yes" at any shadcn init prompt that touches Tailwind configuration breaks the v4 setup.

**How to avoid:**
- Do NOT run `npx shadcn@latest init` — instead, copy individual shadcn component source files manually from the shadcn GitHub into `src/components/ui/`. This is the safest approach under deadline.
- If `init` must be run: use `--tailwind-css-file src/index.css` and inspect every generated file before committing. Delete any `tailwind.config.js` that appears.
- Alternatively, skip shadcn entirely and write styled components using the existing Tailwind v4 token classes. The existing `Badge.tsx` and `ConfidenceBar.tsx` are already good patterns to follow.
- If only needing a few components (Button, Card, Badge), manually add them in 10-15 minutes rather than running the CLI.

**Warning signs:**
- A `tailwind.config.js` or `components.json` appears in `dashboard/` after any shadcn operation.
- The `vite.config.ts` now has `tailwindcss: {}` inside `css.postcss` rather than the plugins array.
- Existing `@theme {}` custom tokens no longer generate utility classes.

**Phase to address:** Dashboard rebrand phase — decision gate at the start: manual component copy or skip shadcn entirely.

---

### Pitfall P4: React 19 + shadcn Overlay Component Incompatibilities

**What goes wrong:**
shadcn components built for React 18 use `React.forwardRef()` patterns. React 19 changed how refs work — `forwardRef` is no longer required and the internal behavior changed. Certain shadcn components (Dialog, Popover, Sheet, Tooltip) produce console errors or silently fail to mount overlays when used with React `^19.2.4`.

**Why it happens:**
The project already runs React `^19.2.4`. shadcn's component registry targeted React 18. React 19 deprecated `React.forwardRef` in favor of direct ref props. Components that don't handle this produce `Warning: Function components cannot be given refs` or overlay portals that don't attach to the DOM.

**How to avoid:**
- Avoid modal/overlay shadcn components (Dialog, Sheet, Popover) entirely for the demo — use inline panels like the existing `AgentDecisionPanel` expand pattern instead.
- Simple non-overlay components (Button, Card, Badge) work fine with React 19.
- If overlay components are truly needed, install the latest `@radix-ui` peer packages explicitly and test before wiring into the demo flow.

**Warning signs:**
- `Warning: forwardRef render functions accept exactly two parameters` in the browser console.
- Overlay components render but cannot be dismissed.
- TypeScript errors on `ref` props where none existed before.

**Phase to address:** Dashboard rebrand phase — stay with non-overlay shadcn components or avoid the library entirely.

---

### Pitfall P5: Mock/Seed Data Looks Fake and Undermines Judge Credibility

**What goes wrong:**
The resale demo uses obviously fake seller names ("John Doe"), round prices ($500, $1000), and identical listing dates. Judges who know the ticket resale market immediately see through it. More critically, if mock listings have no `classification` attached, the `AgentDecisionPanel` never expands and judges never see the AI reasoning — the core differentiator (#1 judging criterion) is invisible.

**Why it happens:**
Under deadline pressure, seed data is written in 5 minutes with placeholder values. The Claude API reasoning output is only visible on classified listings — if mock data has no `classification` object, the expandable panel shows nothing.

**How to avoid:**
- Use realistic seller handles (short alphanumeric: `tk_mx2938`, `worldcup_seller_2`, `FIFA_TICKETS_4U`).
- Use realistic FIFA World Cup 2026 price points: face value $150-400, scalped prices $450-1800 with odd cents ($847.50, $1,234.00).
- Vary listing dates across 3-7 days before the demo date.
- Pre-attach `classification` objects to at least 8-10 mock listings so `AgentDecisionPanel` expands immediately — don't require a live agent run to see AI reasoning during the demo.
- Include at least one `LEGITIMATE` classification with a low-confidence score to show nuance.
- Include at least one `LIKELY_SCAM` with a detailed `reasoning` string showing Claude's chain of thought (50+ words, referencing specific listing fields).
- Include one listing where `classificationSource: "claude"` to demonstrate the AI path was taken.

**Warning signs:**
- All prices are multiples of $100 or $500.
- All `redFlags` arrays are identical across listings.
- `classification` is undefined on most listings — `AgentDecisionPanel` is never shown to judges.
- All `reasoning` strings are under 30 words.

**Phase to address:** Mock data / seed data phase — build the seed file before building new UI so components have realistic data from the start.

---

### Pitfall P6: Narrative Reframe Contradicts What the Running System Actually Does

**What goes wrong:**
The README says "buyer locks USDT, AI verifies, escrow settles" but the running dashboard still shows the fraud-detection monitoring view from v1. Judges read the README before running the demo. The disconnect between the narrative ("P2P resale platform") and the visible product ("fraud scanner") causes confusion about what was actually built and whether the pivot is real.

**Why it happens:**
Narrative files (README, demo script) are updated first because they're easy, but the UI is updated last or not at all. The dashboard header still says "Autonomous Fraud Detection Agent." Agent terminal output still logs "ENFORCEMENT ACTION" when the narrative claims "verification."

**How to avoid:**
- Update README and demo script LAST — after the UI actually reflects the P2P resale narrative.
- OR: update both together in the same commit so they stay in sync.
- The demo script should map directly to what judges see on screen: "Here the buyer has locked 847 USDT into escrow — now watch the agent verify..."
- The dashboard header is the first thing judges see — changing `"Autonomous Fraud Detection Agent"` to the P2P resale tagline has high impact for minimal effort.

**Warning signs:**
- The README describes a flow ("buyer locks USDT") that requires clicking a button that doesn't exist in the UI.
- The demo video was scripted before the UI was updated.
- Agent terminal output still says "ENFORCEMENT ACTION" when the narrative claims "buyer protection verification."

**Phase to address:** Narrative reframe phase — must happen in lockstep with UI changes, not independently.

---

### Pitfall P7: Claude AI Reasoning Visible in UI But Shallow and Unconvincing

**What goes wrong:**
The `AgentDecisionPanel` shows the `reasoning` field from `Classification`, but if the seed data reasoning strings are vague ("This listing shows signs of price inflation above market norms"), judges see the same boilerplate across every row. Agent Intelligence is judging criterion #1 — shallow reasoning strings fail this criterion even when the UI looks polished.

**Why it happens:**
The classify module (`agent/src/classify.js`) uses a prompt that returns the right shape but may generate shallow reasoning. Seed data reasoning strings are written in 30 seconds.

**How to avoid:**
- Manually write rich `reasoning` strings for seed data that look like genuine Claude output: "Seller account created 4 days ago (new account red flag). Price $1,247 vs face value $180 = 593% markup, well above FIFA WC scalping threshold of 200%. No section/seat number listed — consistent with counterfeit pattern. Two prior listings from same seller flagged across StubHub."
- The `AgentDecisionPanel` should display `classificationSource` to show whether Claude or the rules engine classified it. This demonstrates hybrid intelligence.
- Include at least one listing where the rules engine classified it (fast path) and one where Claude classified it (reasoning path) — visible difference shows the system's depth.

**Warning signs:**
- All `reasoning` strings are under 30 words.
- Every listing has `classificationSource: "rule-engine"` — Claude is never invoked.
- Clicking expand on rows doesn't reveal anything not already visible in the table columns.

**Phase to address:** Mock data phase AND Claude API integration phase — seed data reasoning must be rich, and live classifications must invoke Claude for medium-confidence cases.

---

### Pitfall P8: Time Allocation Failure — Running Out of Time for Demo Video

**What goes wrong:**
Dashboard rebrand takes 8+ hours because of Tailwind v4 / shadcn integration issues, leaving no time to record a clean 5-minute demo video. The video is rushed, narration doesn't match the screen, audio quality is poor. Demo quality is judging criterion #7 but a bad video also undermines credibility for criteria #1-4.

**Why it happens:**
UI rebrand tasks expand to fill available time. Every "quick" change (font, color, one shadcn component) takes 3x longer than expected due to Tailwind v4 gotchas. Video recording is treated as the last step.

**How to avoid:**
- Time-box the rebrand to 4 hours maximum. Stop at 4 hours regardless of polish state.
- Record the demo video BEFORE final polish — a working but unpolished UI with a good narrative is better than a polished UI with no video.
- Write the demo script (what to say at each moment) before starting any code. The script defines what features MUST exist for the video.
- Strict priority order for the 2 days: (1) narrative reframe — 1 hour, (2) seed data with visible AI reasoning — 2 hours, (3) resale flow UI wired to seed data — 3 hours, (4) rebrand/polish — remaining time.

**Warning signs:**
- It is March 21 and the demo video has not been recorded yet.
- The resale flow UI is not yet wired to any mock data.
- Any single task has consumed more than 3 hours without a working demo-able state.

**Phase to address:** All phases — enforce time-boxing from the start. Demo video recording is a scheduled milestone, not an afterthought.

---

## Critical Pitfalls — v1.0 Foundation (Still Relevant)

The following pitfalls from v1.0 research remain relevant — they guard the working foundation being preserved during the pivot.

---

### Pitfall V1: WDK ERC-4337 Missing Infrastructure Layer Causes Silent SDK Failure

**What goes wrong:**
WDK's ERC-4337 wallet module requires three independent infrastructure layers to co-exist: the Safe4337Module contract, a bundler service, and a paymaster service. If any one layer is missing or misconfigured, the SDK fails with an opaque error. Teams waste hours debugging transaction submission failures before realizing their bundlerUrl points to a mainnet endpoint.

**Why it happens:**
WDK configuration is declarative — you pass URLs and addresses at initialization and nothing validates them until you try to send a transaction. Teams copy example config from docs that targets mainnet, swap only the chainId to Sepolia, and miss that bundler/paymaster providers need separate Sepolia endpoints.

**How to avoid:**
- Before any new escrow wiring in v2.0, confirm the existing smoke test (wallet init → getBalance → send 0 USDT) still passes on Sepolia.
- Do not change WDK configuration while simultaneously adding resale UI — isolate variables.

**Warning signs:**
- Transactions return undefined or timeout without a clear error code.
- Wallet address generates correctly but getBalance always returns 0 even after faucet top-up.

**Phase to address:** Any phase that touches escrow wiring — keep WDK config unchanged from working v1.0 state.

---

### Pitfall V2: Agent Autonomy Is Theatre Without Observable Decision Trail

**What goes wrong:**
The agent classifies listings and triggers escrow, but the decision-making is invisible. The v2.0 resale narrative actually makes this more critical — if the "AI verifies" step has no visible output, the P2P resale pitch collapses.

**How to avoid:**
- The `AgentDecisionPanel` must show rich reasoning (see Pitfall P7).
- `classificationSource` field distinguishes rule-engine vs Claude path — display it.
- For v2.0: the "AI verifies" step in the resale flow should visually show Claude reasoning before the escrow settles. Even if simulated on mock data, this moment is the product's core value.

**Phase to address:** Mock data phase must include this, resale flow UI phase must surface it visibly.

---

### Pitfall V3: Prompt Injection From Scraped Listing Content

**What goes wrong:**
Raw scraped listing titles/descriptions fed directly to the LLM classifier. A malicious listing seller writes "IGNORE PREVIOUS INSTRUCTIONS" in their description.

**How to avoid:**
- The existing classify module must separate system instructions from listing data via distinct prompt roles.
- Classification responses must parse to the strict `Classification` interface in `types.ts` — any response that doesn't parse is rejected.
- This is unchanged from v1.0; the risk increases slightly if new resale listings are also fed to Claude.

**Phase to address:** Any new Claude API integration added in v2.0 must follow the same defensive pattern.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode mock listings in a `.ts` seed file | Demo always works, no network dependency | Mock data stays forever if not replaced post-hackathon | Acceptable for hackathon — label clearly as `source: 'mock'` (already done) |
| Skip TypeScript strictness in new resale UI (`any` types) | Faster initial development | Type errors surface at runtime during judge demo | Never — use `unknown` + type guard at minimum |
| Use `key={idx}` on list elements | Zero effort | React reconciliation bugs when list reorders | Acceptable if list never reorders during demo |
| Single-page resale flow using the existing tab pattern | No routing library needed | Can't deep-link to resale tab | Acceptable — tab pattern already works |
| Skip adding Outfit font to @theme, use class override | Avoids font @import ordering risk | Inconsistent headings | Only acceptable for one-off heading with `// FIXME` comment |
| Hardcode event ID as FIFA World Cup 2026 | No event management UI needed | Demo only works for one event | Acceptable for hackathon demo |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Tailwind v4 + shadcn | Running `shadcn init` which creates `tailwind.config.js` | Copy component source files manually; delete any generated `tailwind.config.js` |
| Tailwind v4 custom tokens | Adding a second `@theme {}` block in a new CSS file | One `@theme {}` block, one CSS file (`index.css`) only |
| Google Fonts + Tailwind v4 | Placing `@import url(...)` after `@import "tailwindcss"` | Font `@import` must come FIRST in `index.css` |
| React 19 + shadcn overlays | Using Dialog/Sheet/Popover with React 19.2.4 | Use inline expand panels (existing `AgentDecisionPanel` pattern) instead |
| Claude API + classify.js | Calling Claude for every listing including rule-engine-confident ones | Keep existing hybrid: rules first, Claude only for borderline (confidence < 85%) |
| Express API + new resale routes | Changing existing `/api/listings` response shape | Add NEW routes (`/api/resale`) rather than mutating existing ones |
| WDK + resale flow UI | Creating a new WDK wallet instance per UI interaction | Reuse existing agent wallet — the UI is read-only display, not a wallet interface |
| WDK ERC-4337 | Use mainnet bundler/paymaster URLs on Sepolia | Use chain-specific Sepolia endpoints; verify with `chainId: 11155111` |
| Sepolia testnet USDT | Attempt to use real USDT faucet | Use Tether's official Sepolia testnet USDT faucet or mint via test contract |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Polling every 10s on resale flow + listings simultaneously | Two competing `setInterval` calls block React render | Unify polling into existing `useListings` hook or shared context | At demo time when both views are open simultaneously |
| Large mock seed file with 50+ listings | Table renders slowly on judge laptop | Cap seed data at 15-20 listings for demo | In-browser on underpowered judge hardware |
| Claude API called synchronously per listing in seed data generation | Seed data generation script times out | Pre-generate and commit the JSON seed file | Any time during demo prep |
| Sequential scraping of 3 platforms | Demo takes 60+ seconds for first listing | Run all 3 scrapers in `Promise.all()` | First full demo run end-to-end |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Committing `.env` with ESCROW_WALLET_SEED to public repo | Wallet drained on testnet (disqualifying per hackathon rules) | Verify `.gitignore` covers `.env` before any push |
| Committing `ANTHROPIC_API_KEY` in seed data generation script | API key exposed in public GitHub | Use `process.env.ANTHROPIC_API_KEY` only, never hardcode |
| Demo wallet private key visible in terminal during screen recording | Key exposed in video | Use `...` truncation in terminal output when recording |
| Classifying listings without confidence threshold | Low-confidence guesses trigger irreversible escrow actions | Gate all escrow actions behind `confidence >= threshold` |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Resale flow shown as separate page with no nav back to agent view | Judges can't see the fraud detection → escrow connection | Use existing tab pattern — add "Resale" as a 4th tab, not a separate route |
| AI reasoning only visible after clicking rows | Judges miss reasoning if they don't know to click | Add a subtle "click to expand" caret or "View AI Decision" link in the Status column |
| Escrow tab shows raw wallet addresses without context | Judges don't understand WDK's role | Add "Self-custodial via WDK" label near the wallet address display |
| New resale UI components use different card styling | Visual inconsistency signals rushed work | Reuse `bg-bg-card` and existing padding/radius classes from existing components |
| Dashboard header still says "Fraud Detection Agent" after pivot | Narrative mismatch on first impression | Change header to reflect P2P resale narrative — high impact, 30 seconds of work |

---

## "Looks Done But Isn't" Checklist

- [ ] **Resale flow UI:** Has mock data attached — verify that clicking through the flow shows actual listings and AI classification, not empty states
- [ ] **AI reasoning panel:** `classification` object is present on seed listings — verify `AgentDecisionPanel` expands on at least 5 rows and shows 50+ word reasoning
- [ ] **Rebrand:** Outfit font actually renders — verify in browser dev tools that computed `font-family` shows Outfit, not Inter fallback
- [ ] **Narrative consistency:** README P2P claim, dashboard header, and demo script are all in sync — walk through all three before recording
- [ ] **Existing tabs still work:** After all changes, verify Listings / Escrow / Wallet tabs load without TypeScript errors or blank states
- [ ] **WDK visible in demo:** `WalletInspector` shows "Self-custodial via WDK" — verify `custodyType` field is populated in API response
- [ ] **No secrets in repo:** Run `git log --all -p | grep -i "seed\|private\|mnemonic"` before making repo public
- [ ] **Demo script matches UI:** Walk through the demo script step-by-step and verify every described screen actually exists and is reachable
- [ ] **No `tailwind.config.js` created:** Verify this file does not exist in `dashboard/` after any shadcn operation
- [ ] **`npm run build` passes:** TypeScript compilation succeeds with zero errors in the dashboard workspace after all new components are added

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Tailwind v4 broken by shadcn init | MEDIUM (1-2 hours) | Delete `tailwind.config.js` and `components.json`, restore `index.css` from git, re-add only manual component copies |
| Existing tabs broken after `types.ts` change | LOW (30 min) | `git diff` to find the offending field change, revert to additive-only approach |
| Mock data has no classifications visible | LOW (45 min) | Add `classification` objects to seed file manually — no agent run needed |
| Demo video has wrong narration | HIGH (3-4 hours) | Re-record — no shortcut; prioritize this over any remaining polish task |
| Font not rendering (Outfit) | LOW (15 min) | Move `@import url(...)` above `@import "tailwindcss"` in `index.css` |
| shadcn overlay component breaks React 19 | MEDIUM (1 hour) | Remove the component, replace with inline Tailwind equivalent using existing expand panel pattern |
| Narrative contradicts running system | LOW (30 min) | Update dashboard header and tab labels to match README — these are single string changes |
| Secrets committed to public GitHub | HIGH (immediate) | Rotate all keys (Claude API, WDK secrets), force-push history rewrite, re-fund wallet with new seed |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Breaking existing pipeline with new types/routes | Resale UI phase — additive-only rule | Run existing 3 tabs after every new component; `npm run build` passes |
| Tailwind v4 @theme conflict | Dashboard rebrand phase — one @theme block rule | Verify existing `bg-accent` / `bg-bg-card` classes still render after color additions |
| shadcn init corrupting Tailwind v4 setup | Dashboard rebrand phase — manual copy decision gate | Verify no `tailwind.config.js` exists after any shadcn operation |
| React 19 / shadcn overlay incompatibilities | Dashboard rebrand phase — component selection | No `forwardRef` warnings in console; no overlay components in critical demo path |
| Mock data looks fake / no classifications | Seed data phase — realism and completeness criteria | 10+ listings with varied prices, seller names, and rich AI reasoning strings that expand |
| Narrative contradicts running system | Narrative reframe phase — sync with UI | Walk through demo script against live running dashboard; header, README, script all consistent |
| Shallow Claude AI reasoning | Mock data + Claude API phase | `reasoning` strings are 50+ words, reference specific listing fields; `classificationSource` varies |
| Time allocation failure / no demo video | All phases — time-boxing enforced | Demo video recorded by March 21 EOD; UI polish only after video is done |
| WDK config broken by coincidental changes | Any phase touching agent code | Existing WDK smoke test still passes after every phase |
| Prompt injection via new resale listing content | Any Claude API integration phase | Test listing with "IGNORE PREVIOUS INSTRUCTIONS" is classified correctly, not acted on |
| Secrets in public repo | Pre-push check | `git log --follow .env` shows `.env` never committed; no API keys in source files |

---

## Sources

- Direct codebase inspection: `dashboard/src/index.css` (Tailwind v4 @theme pattern in use), `dashboard/package.json` (React 19.2.4, Tailwind v4.2.2, Vite 8.0.1), `dashboard/src/types.ts`, `dashboard/src/App.tsx`, `dashboard/src/components/ListingsTable.tsx` — HIGH confidence
- Tailwind v4 CSS-first configuration behavior (no `tailwind.config.js`) — verified against existing project setup — HIGH confidence
- shadcn/ui v4 compatibility: known issue with `init` command generating Tailwind v3 config — manual component copy is safer approach — MEDIUM confidence (based on shadcn changelog and community reports)
- React 19 `forwardRef` deprecation: React 19 release notes (August 2024) documented the ref-as-prop change — HIGH confidence (official React docs)
- Hackathon judging criteria priority order: CLAUDE.md (Agent Intelligence #1, Polish #6) — HIGH confidence
- FIFA World Cup 2026 ticket price ranges: secondary market knowledge for major sporting events — MEDIUM confidence
- v1.0 pitfalls from 2026-03-19: WDK infrastructure layer requirements, key persistence, scraper fragility, escrow state sync — sources listed in original file above

---
*Pitfalls research for: P2P ticket resale pivot — adding resale UI + rebrand to working agent system*
*Updated: 2026-03-20 (v2.0 milestone research)*
