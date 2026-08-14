# DivLab Deep Research Engine v1

Status: internal backend foundation / ACTIVE_PR. No public analysis UI yet.

## Objective

DivLab Analys must be a structured, auditable equity-research product rather than a longer version of a model-portfolio rationale. The research packet is intentionally separate from portfolio-manager decisions so the four model portfolios can interpret the same company research through different mandates.

## v1 pipeline

```text
Yahoo market history + financial statements
        +
Official Nordic issuer disclosures / report provenance
        ↓
Normalized FundamentalSnapshot (TTM + multi-year periods)
        ↓
Deterministic fundamental analysis + per-share trends
        ↓
Explicit Bear/Base/Bull valuation assumptions
        ↓
Existing deterministic technical toolkit
        +
Adaptive support / resistance zones
        ↓
Source + freshness quality gate
        ↓
Versioned DivLabResearchPacket
        ↓
Atomic service-role persistence
```

`lib/analysis/research-loader.ts` is the current server-side fact loader. `lib/analysis/draft-service.ts` is the one-call orchestration entrypoint that can build a packet and optionally persist it.

## Fundamental data collection

The foundation has a real financial-statement path rather than only a score contract.

- `lib/analysis/yahoo-financials.ts` owns the authenticated/server-only Yahoo request.
- `lib/analysis/financial-statement-normalizer.ts` is a pure deterministic parser that can be unit-tested independently of Next/server runtime.
- income statement, balance sheet and cash-flow history are normalized into `FundamentalSnapshot`.
- TTM revenue, operating income, net income, operating cash flow, capex and free cash flow are derived from provider TTM fields or four complete quarters.
- latest cash, debt, equity, shares and other available balance-sheet fields are retained.
- up to five normalized annual periods are retained for multi-year interpretation.
- provider sign conventions for capex are handled explicitly when deriving FCF.
- unknown or incomplete accounting fields remain unknown; four-quarter TTM calculations fail closed when fewer than four known quarters exist.

The normalized `FundamentalSnapshot` itself is retained inside every `DivLabResearchPacket`, not just the derived scorecard. This provides an auditable numerical base for future AI narrative and version comparisons.

## Fundamental analysis

`lib/analysis/fundamental-analysis.ts` derives, without fabricating missing values:

- current revenue growth
- operating and profit margins
- operating cash flow and free cash flow
- free-cash-flow margin and cash conversion
- free cash flow per share
- net debt / EBITDA
- net debt / free cash flow
- ROE / ROA / ROIC when available
- share-count growth / dilution
- payout ratio
- multi-year revenue CAGR
- multi-year EPS CAGR
- multi-year free-cash-flow-per-share CAGR
- multi-year share-count CAGR
- operating-margin change across the analyzed period
- a coverage-aware scorecard for growth, profitability, cash flow, balance sheet and capital allocation

The trend layer is deliberately shareholder-aware: company revenue growth and per-share value creation are measured separately. CAGR is left unknown when the mathematical base is invalid, for example a negative starting EPS or FCF/share.

Unknown values stay unknown and are surfaced in `unknowns`.

## Valuation

`lib/analysis/valuation.ts` keeps valuation math deterministic. Bear/Base/Bull scenarios can use:

- EPS × P/E
- FCF/share × P/FCF
- an explicitly supplied scenario value when another verified valuation method is used upstream

Each scenario stores its assumptions and methods. The engine calculates value per share and upside/downside versus the observed current price.

Important invariant: v1 does **not** manufacture valuation assumptions merely to complete the report. `draft-service.ts` requires explicit scenario inputs. A future analysis-AI layer may propose those assumptions only after reading the verified research packet.

## Technical analysis and price zones

The existing model-portfolio toolkit remains the source of MA50/MA200, RSI, ADX, ATR, MACD, momentum, volatility, volume, breakout and other deterministic technical measures.

`lib/analysis/support-resistance.ts` adds the publication-grade level model requested for DivLab Analys:

- local historical pivot detection
- adaptive clustering into zones rather than false-precision lines
- ATR / daily-range-aware zone width
- repeated-touch counting
- recency weighting
- relative-volume confirmation
- support ↔ resistance role-reversal detection
- weak / medium / strong zone classification
- nearest meaningful support and resistance zones versus current price

## Primary-source provenance

`lib/analysis/nordic-primary-sources.ts` deliberately reuses the model-portfolio Nasdaq Nordic/CNS research path instead of creating a second crawler.

- official report/disclosure URLs are retained as version sources
- only a successfully retrieved official report document may count as `primary: true`
- real quarterly/annual report candidates are ranked ahead of generic attachment-bearing releases before the shared one-document PDF attempt budget is consumed
- Oslo currently degrades safely when no supported official source is available

The current primary-source layer verifies provenance and report freshness. It does **not yet** normalize all accounting numbers directly from the report PDF; that remains a later hardening layer.

## Publication quality gate

A packet is not publishable merely because it was generated. `lib/analysis/quality-gate.ts` requires:

- sufficient fundamental coverage
- at least two fully traceable sources
- a sufficiently fresh primary source
- complete Bear/Base/Bull scenario coverage with explicit base-case assumptions
- sufficient technical history
- meaningful technical level coverage

Failures are blockers, not silently neutral scores.

## Persistence and history

The Supabase model is append-versioned:

- `divlab_analyses` — stable instrument identity / slug
- `divlab_analysis_versions` — versioned research snapshots
- `divlab_analysis_sources` — source provenance per version

`persist_divlab_analysis_version(...)` stores an analysis version and its sources atomically. Direct client access is disabled; the write path is service-role only. Public read policies should be introduced together with the eventual `/analyses` product surface and only for explicitly published versions.

The persistence layer additionally verifies consistency between:

- packet engine version and stored engine version
- packet instrument identity and RPC identity
- packet `qualityGate` and stored `quality_gate`
- quality-gate `publishable` and stored `publishable`
- packet source array and separately persisted source rows

An inconsistent packet is rejected before an analysis version is inserted.

## Verification completed in this branch

- unit tests cover support/resistance zones
- unit tests cover publishable and fail-closed research packets
- unit tests cover full financial-statement normalization and four-quarter TTM fallback
- unit tests cover multi-year revenue/EPS/FCF-per-share/share-count trends and invalid CAGR bases
- unit test verifies normalized multi-year facts are cloned and retained in the packet
- Supabase transactional persistence smoke tests create analysis/version/source rows and roll them back cleanly
- deliberate quality-gate/publishable mismatch is rejected and leaves zero verification rows
- anon/authenticated table access and write-RPC access are disabled; service role is the write principal
- Supabase security/performance advisors have been checked after DDL
- GitHub Quality Gate is required before this PR can leave draft status

## Deliberately not included yet

The following remain later increments and are not claimed as complete:

1. live real-company evaluation of the new loader across several accounting profiles
2. direct accounting-number normalization from official report/IR PDFs as a verification layer
3. richer valuation methods such as EV/EBIT and EV/EBITDA where verified inputs are available
4. analysis-AI reasoning for thesis, risks, catalysts, contradictions and explicit valuation assumptions
5. automatic trigger from the model-portfolio shortlist into Deep Research
6. public `/analyses` and `/analyses/[slug]` UI
7. DivBrain retrieval of published analysis versions
8. broader primary-source coverage for Oslo and US issuers

## Product invariant

A good company is not automatically a good stock at the current price, and a good stock is not automatically a suitable position for every portfolio. DivLab Analys owns the company/stock research. Each portfolio manager owns its own portfolio decision.
