# Requirements: Ducket AI Galactica

**Defined:** 2026-03-19
**Core Value:** An organizer defines the rules once. The agent monitors, detects, and enforces — autonomously. Value settles on-chain. No human in the loop.

## v1 Requirements

Requirements for hackathon submission (March 22, 2026). Each maps to roadmap phases.

### Scanning

- [ ] **SCAN-01**: Agent autonomously polls secondary marketplaces on a configurable schedule without human trigger
- [x] **SCAN-02**: Agent scrapes StubHub for ticket listings matching a given event name
- [x] **SCAN-03**: Agent scrapes Viagogo for ticket listings matching a given event name
- [x] **SCAN-04**: Agent scrapes Facebook Marketplace for ticket listings matching a given event name
- [x] **SCAN-05**: Each scraped listing returns structured data: platform, seller, price, URL, listing date, red flags

### Classification

- [ ] **CLAS-01**: Agent classifies each listing as one of: SCALPING_VIOLATION, LIKELY_SCAM, COUNTERFEIT_RISK, or LEGITIMATE
- [ ] **CLAS-02**: Each classification includes a confidence score (0-100) and reasoning text
- [ ] **CLAS-03**: Agent calculates price delta percentage vs official face value per listing
- [ ] **CLAS-04**: Classification is confidence-gated — escrow slash only fires above configurable threshold (e.g. >85%)

### Wallet

- [x] **WLLT-01**: Agent creates and manages a self-custodial USDT wallet on Sepolia using WDK
- [x] **WLLT-02**: All wallet operations use WDK — no centralized custody, JS/TS only
- [x] **WLLT-03**: Private keys never leave the client; key persistence handled securely
- [x] **WLLT-04**: Wallet operations demonstrably non-custodial (verifiable in demo)

### Escrow

- [ ] **ESCR-01**: Agent can lock USDT into escrow for a given event (deposit)
- [ ] **ESCR-02**: Agent can release escrowed USDT to seller when listing is classified as legitimate
- [ ] **ESCR-03**: Agent can refund escrowed USDT to buyer when fraud is detected
- [ ] **ESCR-04**: Agent can slash escrowed USDT to bounty pool on confirmed fraud above confidence threshold
- [ ] **ESCR-05**: Organizer can stake USDT as legitimacy bond; agent slashes bond on confirmed fraud activity
- [ ] **ESCR-06**: All escrow actions are logged on-chain with transaction hashes

### Evidence

- [ ] **EVID-01**: Agent generates timestamped evidence case file per classified listing (JSON + human-readable)
- [ ] **EVID-02**: Case file includes: screenshot, URL, prices, classification result, confidence, action taken
- [ ] **EVID-03**: Agent autonomously drafts enforcement actions (takedown request, platform report, public warning) per case

### Dashboard

- [ ] **DASH-01**: React dashboard displays live table of scanned listings with classification badges
- [ ] **DASH-02**: Dashboard shows USDT escrow status and wallet balance per event
- [ ] **DASH-03**: Dashboard includes wallet inspector showing key storage location (non-custodial proof)
- [ ] **DASH-04**: Dashboard is styled consistently with Ducket brand (borrowing from ducket-web)

### Demo

- [ ] **DEMO-01**: Full demo loop completable in ≤5 minutes: event input → scan → classify → escrow action
- [ ] **DEMO-02**: Demo uses real event (FIFA World Cup 2026) with live secondary market data
- [ ] **DEMO-03**: Demo shows all 4 required segments: agent logic, wallet flow, payment lifecycle, live full loop
- [ ] **DEMO-04**: Project runs out of the box for judges (clear setup instructions, no special environment)

### Compliance

- [x] **COMP-01**: Apache 2.0 LICENSE file at repo root
- [x] **COMP-02**: All third-party services disclosed in README
- [x] **COMP-03**: No secrets or credentials committed to repo
- [x] **COMP-04**: Public GitHub repo ready for judges

## v2 Requirements

Deferred to post-hackathon. Tracked but not in current roadmap.

### Advanced Agent

- **AGNT-01**: Multi-agent sub-task architecture (separate agents for scan, classify, escrow via ACP)
- **AGNT-02**: Agent learns from historical classification outcomes to improve accuracy

### Analytics

- **ANLT-01**: Historical analytics dashboard with trend charts
- **ANLT-02**: Aggregate fraud statistics per event/platform

### Integration

- **INTG-01**: Integration with Ducket's Polygon ticket NFT contracts
- **INTG-02**: Cross-chain bridge between ticket NFTs and USDT escrow

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app | Web-first for hackathon; 3-day timeline |
| Mainnet USDT | Testnet only per project constraints; no real funds |
| OAuth / social login | Agent-first product; organizer is sole user |
| Real-time WebSocket updates | Polling every 30s indistinguishable in 5-min demo; adds infrastructure complexity |
| ML model fine-tuning | Claude API with strong prompts outperforms small fine-tuned models; weeks of work |
| Actual takedown submission | Legal risk in demo; draft text sufficient to show capability |
| Email/webhook notifications | Agents that act > agents that alert humans; no judging upside |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| COMP-01 | Phase 1 | Complete |
| COMP-02 | Phase 1 | Complete |
| COMP-03 | Phase 1 | Complete |
| COMP-04 | Phase 1 | Complete |
| WLLT-01 | Phase 2 | Complete |
| WLLT-02 | Phase 2 | Complete |
| WLLT-03 | Phase 2 | Complete |
| WLLT-04 | Phase 2 | Complete |
| SCAN-02 | Phase 3 | Complete |
| SCAN-05 | Phase 3 | Complete |
| SCAN-01 | Phase 4 | Pending |
| SCAN-03 | Phase 4 | Complete |
| SCAN-04 | Phase 4 | Complete |
| CLAS-01 | Phase 5 | Pending |
| CLAS-02 | Phase 5 | Pending |
| CLAS-03 | Phase 5 | Pending |
| CLAS-04 | Phase 5 | Pending |
| EVID-01 | Phase 5 | Pending |
| EVID-02 | Phase 5 | Pending |
| EVID-03 | Phase 5 | Pending |
| ESCR-01 | Phase 6 | Pending |
| ESCR-02 | Phase 6 | Pending |
| ESCR-03 | Phase 6 | Pending |
| ESCR-04 | Phase 6 | Pending |
| ESCR-05 | Phase 6 | Pending |
| ESCR-06 | Phase 6 | Pending |
| DASH-01 | Phase 7 | Pending |
| DASH-02 | Phase 7 | Pending |
| DASH-03 | Phase 7 | Pending |
| DASH-04 | Phase 7 | Pending |
| DEMO-01 | Phase 8 | Pending |
| DEMO-02 | Phase 8 | Pending |
| DEMO-03 | Phase 8 | Pending |
| DEMO-04 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after roadmap creation — traceability complete*
