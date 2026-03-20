---
phase: quick
plan: 260320-hz3
subsystem: documentation
tags: [style-guide, ux, brand, ai-brief, reference]
dependency_graph:
  requires: []
  provides: [STYLE-GUIDE.md, AI-UX-BRIEF.md]
  affects: [all future UI tasks]
tech_stack:
  added: []
  patterns: [style-guide extraction, AI-consumable design brief]
key_files:
  created:
    - .planning/STYLE-GUIDE.md
    - .planning/AI-UX-BRIEF.md
  modified: []
decisions:
  - "Documented every CSS variable from :root and @theme blocks including the @theme inline bridge layer"
  - "Kept Badge.tsx and ui/badge.tsx documented as separate components with explicit distinction to prevent confusion"
  - "AI-UX-BRIEF.md structured as a prompt-ready document with self-contained context — no codebase exploration required"
  - "Vocabulary table in AI-UX-BRIEF uses two-column format (Use / Avoid) for fast scanning during implementation"
metrics:
  duration_minutes: 4
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Quick Task 260320-hz3: Style Guide and AI UX Designer Brief Summary

**One-liner:** Extracted complete Ducket visual language into a codebase-accurate style guide and authored a prompt-ready AI UX designer brief encoding hackathon judging priorities into every design rule.

## What Was Built

### `.planning/STYLE-GUIDE.md`

A comprehensive reference extracted exclusively from live codebase files. Covers:

1. **Color System** — All 16 `:root` shadcn CSS variables, all 8 `@theme` Ducket brand tokens, all `@theme inline` bridge tokens, and semantic groupings (backgrounds lightest-to-darkest, foregrounds, status colors, borders)
2. **Typography** — Font families (Outfit/Inter/mono), all font sizes found in components (text-xs through text-2xl), all weights, letter spacing patterns
3. **Spacing and Layout** — All three radius tokens with computed values, page layout constraints (max-w-7xl, px-6), all gap/space patterns from components, all grid layouts documented by component
4. **Component Patterns** — All 13 components documented: Badge, ConfidenceBar, TrustBadges, AgentDecisionPanel, ListingsTable, EscrowStatus, WalletInspector, EtherscanLink, ResaleFlowPanel, ListingForm, BuyerLockStep, VerifyStep, SettleStep — each with actual Tailwind classes, color tokens, and behavioral notes
5. **Utility CSS Classes** — `.ducket-hero-gradient`, `.ducket-card`, `.ducket-accent-underline` with exact CSS values
6. **shadcn Components** — All 6 ui primitives listed with import paths, variants, and the critical Badge namespace distinction
7. **Visual Patterns** — 8 recurring patterns documented as copy-paste snippets: card glow, hero gradient, accent underline, trust strip, status pill, section label, monospace data, empty state, AI avatar badge, network dot
8. **App Layout Structure** — ASCII layout diagram showing the full nesting hierarchy with CSS classes

### `.planning/AI-UX-BRIEF.md`

A self-contained, prompt-ready document structured for pasting into any Claude context window. Covers:

1. **Role Definition** — Frames the designer role with explicit hackathon judging priority alignment
2. **Design Principles** — 5 principles ordered by judging weight: Trust-first, Agent intelligence visibility, Consumer UX over crypto UX, Demo-ability, Dark mode only — each with concrete implementation rules
3. **Color Usage Rules** — Per-token "when to use" guidance with exact use cases for each of the 7 color roles
4. **Component Selection Decision Tree** — 12 decision rules covering every common UI need
5. **Layout Rules** — Page structure template, card padding conventions, all grid patterns
6. **Copy/Language Guide** — Complete vocabulary table (25 rows of Use/Avoid pairs), tone guidelines
7. **Anti-Patterns** — 4 categories: visual (5 rules), UX (6 rules), technical (4 rules), copy (4 rules)
8. **Reference** — 16 file references with the specific implementation need each file addresses, plus a 7-point pre-ship checklist

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- `.planning/STYLE-GUIDE.md` exists: FOUND
- `.planning/AI-UX-BRIEF.md` exists: FOUND
- STYLE-GUIDE.md has 49 `##` headings (requirement: 5+): PASSED
- AI-UX-BRIEF.md has 26 `##` headings (requirement: 5+): PASSED
- All 16 `:root` CSS variables documented: VERIFIED
- All 8 `@theme` brand tokens documented: VERIFIED
- All 3 utility CSS classes documented with exact values: VERIFIED
- All components in `dashboard/src/components/` documented: VERIFIED (13 components)
- AI-UX-BRIEF.md references STYLE-GUIDE.md: VERIFIED
- Commit a996100: FOUND

## Self-Check: PASSED
