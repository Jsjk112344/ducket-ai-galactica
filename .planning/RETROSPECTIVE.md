# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-19
**Phases:** 8 | **Plans:** 15/16 | **Sessions:** ~10

### What Was Built
- Autonomous fraud detection agent scanning StubHub, Viagogo, Facebook Marketplace
- Hybrid classifier (rule-based + Claude API) with confidence-gated escrow enforcement
- Full USDT escrow lifecycle on Sepolia via WDK + FraudEscrow.sol
- React dashboard with live listings, classification reasoning, escrow status, wallet inspector
- Demo script (`npm run demo`) and submission-ready README

### What Worked
- Risk-first phase ordering: WDK wallet validated before any business logic was built
- Mock fallback pattern for all scrapers: demo runs reliably regardless of anti-bot detection
- Stderr logging convention across all tools: stdout stays clean for JSON piping
- Parallel track execution (wallet + scrapers) converging at Phase 6
- Rule-based classification first pass avoids unnecessary Claude API calls
- Single-day execution: all 8 phases from scaffold to demo in ~7 hours

### What Was Inefficient
- Phase 2 ROADMAP status markers got out of sync (showed "0/2 Planning complete" when both plans had SUMMARY.md)
- STATE.md progress tracking drifted significantly from actual completion
- 08-02 (E2E demo validation) was planned but not executed — should have been a lighter checkpoint

### Patterns Established
- `log()` helper routing to stderr in all CLI tools
- Mock fallback labeled with `source: "mock"` for transparency
- Two-key pattern: WDK for deposit (mandatory), ethers for owner contract calls
- `Promise.allSettled` for multi-platform scraping (one failure doesn't kill cycle)
- Immediate first cycle on startup before cron schedule (instant demo output)
- Lazy dynamic imports for modules needing env vars (unit tests work without .env)

### Key Lessons
1. Validate the mandatory integration (WDK) on hour 1 — it was the highest disqualification risk and turned out to have real compatibility issues (Hardhat 3 toolbox, ESM, beta API)
2. Anti-bot detection is the norm for secondary ticket marketplaces — mock fallback is not optional, it's required for any reliable demo
3. Confidence-gated enforcement prevents embarrassing false positives in demo — never escrow without high confidence
4. Keep scrapers as standalone CLI tools that pipe JSON — easier to test, debug, and demo individually

### Cost Observations
- Model mix: ~40% opus, ~50% sonnet, ~10% haiku (estimated)
- Sessions: ~10 across milestone
- Notable: Rule-based classification shortcircuit saved significant Claude API cost during development

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 MVP | ~10 | 8 | Initial process — risk-first ordering, parallel tracks |

### Cumulative Quality

| Milestone | Tests | Coverage | Files |
|-----------|-------|----------|-------|
| v1.0 MVP | ~50+ assertions | Core paths | 79 files, 6,057 LOC |

### Top Lessons (Verified Across Milestones)

1. Risk-first phase ordering prevents wasted work on features that depend on unvalidated foundations
2. Mock fallbacks are essential for any demo involving external services with anti-bot protection
