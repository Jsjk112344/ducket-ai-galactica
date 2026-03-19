# Phase 3: StubHub Scraper - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

StubHub ticket listing scraper for FIFA World Cup 2026 — delivers a CLI tool that fetches real listings via Patchright browser automation with XHR interception, returns structured JSON with fraud-relevant fields, and handles bot detection gracefully with mock fallback.

</domain>

<decisions>
## Implementation Decisions

### Scraping Strategy
- Headless browser via Patchright — faster, works in CI, sufficient with stealth patches
- XHR interception to capture StubHub's internal API responses — structured JSON, no brittle DOM selectors
- Exponential backoff with 3 retries on rate limiting
- In-memory Map keyed by URL hash for deduplication within a run

### Output Schema & Red Flags
- `redFlags` is an array of human-readable string signals (e.g. `["price 3x face value", "new seller account"]`)
- Face value determined via hardcoded lookup table per event — FIFA WC 2026 face values are known
- Extra fields beyond required set: `eventName`, `section`, `quantity`, `faceValue`, `priceDelta%`
- Pretty-print JSON to stdout for CLI demo + return array programmatically for scan loop import

### Error Handling & Demo Resilience
- If StubHub blocks despite Patchright, return mock data with `source: "mock"` flag — demo never fails, clearly labeled
- 30 second timeout per page load
- Structured console.log with `[StubHub]` prefix for demo visibility
- Optional config via environment variables (`STUBHUB_TIMEOUT`, `STUBHUB_PROXY`) — keeps CLI clean

### Claude's Discretion
- Internal code organization within agent/tools/
- Patchright page interaction details (selectors, wait strategies)
- Mock data content and structure
- URL hash algorithm choice

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `agent/tools/wallet-smoke-test.js` — existing tool pattern in agent/tools/
- `agent/package.json` — workspace with tsx/tsc scripts
- `agent/src/wallet/` — established module organization pattern

### Established Patterns
- npm workspaces monorepo — `@ducket/agent` scoped package
- TypeScript with ESM (type=module in agent/package.json)
- Tools as standalone runnable scripts in agent/tools/

### Integration Points
- `agent/tools/scrape-stubhub.js` — CLI entry point (per success criteria)
- Phase 4 scan loop will import this scraper via `Promise.all()`
- Phase 5 classification engine consumes the output JSON schema

</code_context>

<specifics>
## Specific Ideas

- Patchright already decided for scraping in Phase 2 context (STATE.md decision)
- FIFA World Cup 2026 as demo event — universally recognized, massive secondary market
- Success criteria requires `node agent/tools/scrape-stubhub.js "FIFA World Cup 2026"` as the CLI interface
- Mock fallback ensures demo resilience even if StubHub changes their anti-bot

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
