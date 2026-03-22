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

## Milestone: v2.1 — OpenClaw Integration

**Shipped:** 2026-03-22
**Phases:** 2 | **Plans:** 3

### What Was Built
- OpenClaw workspace (SOUL.md agent identity + 3 SKILL.md skill definitions)
- CLI wrapper scripts bridging OpenClaw exec to existing scan/classify/escrow modules
- OpenClaw pipeline orchestrator (`openclaw-loop.js`) — end-to-end autonomous pipeline
- 3-process demo startup (OpenClaw gateway + agent + dashboard) with `demo:fallback` preserved
- Fixed 5 pre-existing test failures to establish green baseline (107/107 checks)

### What Worked
- Green baseline first (Plan 16-01) before pipeline wiring (Plan 16-02) — caught pre-existing test drift
- Direct ESM import over child_process for openclaw-loop.js — avoids scan-loop.js top-level await trap
- `demo:fallback` script as one-line revert — demo reliability preserved without complexity
- Infrastructure phase detection in autonomous mode — skipped unnecessary discuss for pure wiring phase
- All changes additive — zero modifications to existing production code

### What Was Inefficient
- SUMMARY.md frontmatter `requirements-completed` field was empty on all 3 plans — extraction relied on VERIFICATION.md instead
- VALIDATION.md `nyquist_compliant` never formally signed off (left as draft)
- Integration checker flagged SKILL.md `exec:` directive gap — a real gap but not actionable for hackathon scope

### Patterns Established
- `runPipeline().then(exit)` pattern avoids top-level await import side effects
- `isCaseFileExists()` for cross-run idempotency (no session-level dedup Set needed when OpenClaw controls invocation)
- `--allow-unconfigured` flag for OpenClaw gateway in demo contexts without config files

### Key Lessons
1. Pre-existing test failures should be caught before any new phase starts — Phase 16 needed a full green baseline plan before pipeline wiring
2. OpenClaw skill definitions are documentation-first (SKILL.md is prose, not machine-executable) — the gateway exec path requires separate wiring
3. Keeping node-cron as fallback was the right call — demo reliability > framework purity

### Cost Observations
- Model mix: ~60% opus (planner), ~40% sonnet (researcher, checker, executor, verifier)
- Sessions: 1 (autonomous mode)
- Notable: Autonomous mode executed full milestone in single session — discuss skip for infrastructure saved significant time

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 MVP | ~10 | 8 | Initial process — risk-first ordering, parallel tracks |
| v2.1 OpenClaw | 1 | 2 | Autonomous mode — full milestone in single session |

### Cumulative Quality

| Milestone | Tests | Coverage | Files |
|-----------|-------|----------|-------|
| v1.0 MVP | ~50+ assertions | Core paths | 79 files, 6,057 LOC |
| v2.1 OpenClaw | 107 assertions (5 suites) | Full agent pipeline | +30 files, +3,088 LOC |

### Top Lessons (Verified Across Milestones)

1. Risk-first phase ordering prevents wasted work on features that depend on unvalidated foundations
2. Mock fallbacks are essential for any demo involving external services with anti-bot protection
3. Green baseline before integration prevents false regression signals — always fix existing test drift first
