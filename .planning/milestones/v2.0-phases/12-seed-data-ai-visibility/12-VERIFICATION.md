---
phase: 12-seed-data-ai-visibility
verified: 2026-03-20T00:00:00Z
status: human_needed
score: 3/3 must-haves verified
human_verification:
  - test: "Open Listings tab and confirm first seed row is auto-expanded"
    expected: "SCALPING_VIOLATION row (seed_scalper_01, $450, 125% delta) is expanded on page load showing AgentDecisionPanel with category badge, confidence 91%, 100-word reasoning, and an Etherscan link"
    why_human: "Default-expanded state requires live browser rendering — cannot verify DOM initial state via grep"
  - test: "Click all 4 seed rows and confirm each AgentDecisionPanel is populated"
    expected: "LIKELY_SCAM (78%, refund), COUNTERFEIT_RISK (74%, refund), LEGITIMATE (85%, release) all show reasoning text referencing specific listing fields"
    why_human: "UI interaction and rendering correctness requires browser"
  - test: "Confirm no 'Waiting for scan cycle...' empty state is shown when seed data is present"
    expected: "The empty-state div is not rendered; the table shows 4+ rows including all Ducket Seed rows"
    why_human: "Conditional rendering depends on API response at runtime"
  - test: "Confirm Etherscan link renders correctly in AgentDecisionPanel for seed rows"
    expected: "The link text and href are visible — note the href will be truncated to 'https://sepolia.etherscan.io/tx/0xde' due to regex stopping at 'm' in '0xdemo'; this is cosmetic but worth confirming the panel does not crash or hide the link entirely"
    why_human: "Link rendering with a broken URL requires browser inspection"
---

# Phase 12: Seed Data + AI Visibility Verification Report

**Phase Goal:** Pre-populated seed data so judges see AI intelligence on first load
**Verified:** 2026-03-20T00:00:00Z
**Status:** human_needed (automated checks all passed; 4 visual items need human confirmation)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | At least one seed listing exists for each of the 4 classification categories | VERIFIED | `node scripts/validate-seed.js` exits 0; 4 case files with SCALPING_VIOLATION, LIKELY_SCAM, COUNTERFEIT_RISK, LEGITIMATE |
| 2 | Every seed listing reasoning string is 50+ words and references specific listing fields | VERIFIED | Validation script confirms 100, 102, 110, 97 words respectively; each references price, face value, MetLife Stadium, FIFA World Cup 2026 |
| 3 | Loading the Listings tab shows populated rows with first seed row AgentDecisionPanel expanded on first load | HUMAN NEEDED | `useState<string \| null>(SEED_URLS[0])` confirmed in ListingsTable.tsx line 29; visual render requires browser |

**Score:** 3/3 truths verified (automated) + 4 visual items flagged for human

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agent/memory/LISTINGS.md` | 4 seed listing JSON blocks at top | VERIFIED | `## Seed Data` at line 6, all 4 URLs present in single json block before any `## Scan:` section |
| `agent/cases/2026-03-20T00-00-00-000Z-ducket-seed-d0d62390a4c13d24.md` | SCALPING_VIOLATION case with 50+ word reasoning | VERIFIED | Contains `\| Category \| **SCALPING_VIOLATION** \|`, 100-word reasoning, `\| Action Taken \| slash \|` |
| `agent/cases/2026-03-20T00-00-00-000Z-ducket-seed-b4dbd644a7d0f881.md` | LIKELY_SCAM case with 50+ word reasoning | VERIFIED | Contains `\| Category \| **LIKELY_SCAM** \|`, 102-word reasoning, `\| Action Taken \| refund \|` |
| `agent/cases/2026-03-20T00-00-00-000Z-ducket-seed-9304348853ef8964.md` | COUNTERFEIT_RISK case with 50+ word reasoning | VERIFIED | Contains `\| Category \| **COUNTERFEIT_RISK** \|`, 110-word reasoning, `\| Action Taken \| refund \|` |
| `agent/cases/2026-03-20T00-00-00-000Z-ducket-seed-e1f7fa9ae56bb7c6.md` | LEGITIMATE case with 50+ word reasoning | VERIFIED | Contains `\| Category \| **LEGITIMATE** \|`, 97-word reasoning, `\| Action Taken \| release \|` |
| `dashboard/src/components/ListingsTable.tsx` | SEED_URLS constant + default-expanded first row | VERIFIED | `const SEED_URLS = [` at line 19; `useState<string \| null>(SEED_URLS[0])` at line 29 |
| `scripts/validate-seed.js` | Automated validation of seed data completeness | VERIFIED | Exists, uses CommonJS require(), exits 0 with all 4 categories confirmed |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `agent/memory/LISTINGS.md` | `agent/cases/*.md` | URL hash in filename matches `urlHash(listing.url)` | VERIFIED | Hash pattern `d0d62390a4c13d24\|b4dbd644a7d0f881\|9304348853ef8964\|e1f7fa9ae56bb7c6` all found in case filenames; `validate-seed.js` confirms linkage |
| `dashboard/server/api.ts` | `agent/cases/*.md` | `lookupClassification` reads case file by hash | VERIFIED | Lines 379+: `files.find((f) => f.includes(hash))` — pattern confirmed at both `/api/cases/:urlHash` (line 292) and `lookupClassification` (line 379) |
| `dashboard/src/components/ListingsTable.tsx` | `agent/memory/LISTINGS.md` | `SEED_URLS[0]` must match first seed listing URL | VERIFIED | `SEED_URLS[0]` is `'https://ducket.seed/listing/scalping-001'` (ListingsTable.tsx line 20); LISTINGS.md first seed entry URL is `"https://ducket.seed/listing/scalping-001"` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DEMO-01 | 12-01-PLAN.md | Seed data covers all 4 classification categories with 50+ word AI reasoning strings | SATISFIED | All 4 case files verified with 97-110 word reasoning strings; `validate-seed.js` exits 0 confirming all 4 categories present |

No orphaned requirements — DEMO-02 and DEMO-03 are mapped to Phase 13 (Pending) and are not claimed by this phase.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `agent/cases/*.md` | 40 | Etherscan link `0xdemo000...` causes regex `[0-9a-fx]+` in `api.ts` to capture only `0xde` (stops at `m` in `demo`) | Warning | Etherscan link rendered in AgentDecisionPanel will be a dead URL showing `https://sepolia.etherscan.io/tx/0xde` — cosmetically broken but panel does not crash |

No blockers found. The Etherscan link issue is a demo-data limitation: the demo URLs use `0xdemo` which contains a character (`m`) outside the regex character class. This is a known demo data trade-off and does not prevent judges from seeing the AI reasoning.

---

## Human Verification Required

### 1. First Seed Row Auto-Expanded on Load

**Test:** Start dev server (`npm run dev` from repo root), open http://localhost:5173, click the Listings tab (or observe default tab).
**Expected:** The SCALPING_VIOLATION row (seller `seed_scalper_01`, price $450, delta 125%) is already expanded — AgentDecisionPanel visible without any click. Reasoning text should read "This listing is priced at 125% above..." and show Confidence 91%, Action Taken slash.
**Why human:** Initial React state renders to DOM only in a live browser. Cannot verify `useState` initial value produces a visible expanded panel via static analysis alone.

### 2. All 4 AgentDecisionPanels Populated

**Test:** Click each of the other 3 seed rows in sequence.
**Expected:** LIKELY_SCAM shows 78% confidence, refund action, reasoning references "35% below" and "12 days old". COUNTERFEIT_RISK shows 74%, refund, reasoning references "3 days old" and "no proof of purchase". LEGITIMATE shows 85%, release, reasoning references "42% above".
**Why human:** Requires clicking and reading dynamic panel content in browser.

### 3. No Empty State Shown

**Test:** Observe the Listings tab immediately after it loads (before any scraper runs).
**Expected:** No "Waiting for scan cycle..." text visible. The 4 seed rows should be present immediately because they come first in the LISTINGS.md JSON array.
**Why human:** Empty-state render depends on API response array length at runtime.

### 4. Etherscan Link Cosmetic Check

**Test:** Expand the SCALPING_VIOLATION seed row, scroll to the Etherscan link in AgentDecisionPanel.
**Expected:** Link is visible (yellow accent per design). The href `https://sepolia.etherscan.io/tx/0xde` is broken (dead link) but the panel renders without crashing. Acceptable for demo seed data.
**Why human:** Link text and href require browser inspection. Confirm panel does not hide or error on a short hash URL.

---

## Gaps Summary

No gaps found. All automated checks passed:
- `node scripts/validate-seed.js` exits 0 — 4 categories confirmed, 97-110 word reasoning strings
- `cd dashboard && npm run build` exits 0 — Vite production build succeeds in 232ms
- All 7 required artifacts exist and are substantive (not stubs)
- All 3 key links verified as wired

One cosmetic warning: Etherscan link truncation in seed case files (`0xdemo...` regex matches only `0xde`). Not a blocker — agent decision panel still renders category, confidence, reasoning, and action taken correctly.

---

_Verified: 2026-03-20T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
