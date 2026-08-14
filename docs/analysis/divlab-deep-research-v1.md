# DivLab Deep Research Engine v1

Status: backend foundation, no public analysis UI yet.

## Objective

DivLab Analys must be a structured, auditable equity-research product rather than a longer version of a model-portfolio rationale. The research packet is intentionally separate from portfolio-manager decisions so the four model portfolios can interpret the same company research through different mandates.

## v1 pipeline

```text
Verified company / market inputs
        ↓
Fundamental analysis
        ↓
Transparent valuation scenarios
        ↓
Existing deterministic technical toolkit
        +
Adaptive support / resistance zones
        ↓
Source + freshness quality gate
        ↓
Versioned DivLabResearchPacket
```

## Fundamental core

`lib/analysis/fundamental-analysis.ts` accepts normalized accounting inputs and derives, without fabricating missing values:

- revenue growth
- operating and profit margins
- operating cash flow and free cash flow
- free-cash-flow margin and cash conversion
- free cash flow per share
- net debt / EBITDA
- net debt / free cash flow
- ROE / ROA / ROIC when available
- share-count growth / dilution
- payout ratio
- a coverage-aware scorecard for growth, profitability, cash flow, balance sheet and capital allocation

Unknown values stay unknown and are surfaced in `unknowns`.

## Valuation

`lib/analysis/valuation.ts` keeps valuation math deterministic. Bear/Base/Bull scenarios can use:

- EPS × P/E
- FCF/share × P/FCF
- an explicitly supplied scenario value when another verified valuation method is used upstream

Each scenario stores its assumptions and methods. The engine calculates value per share and upside/downside versus the observed current price.

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

## Publication quality gate

A packet is not publishable merely because it was generated. `lib/analysis/quality-gate.ts` currently requires:

- sufficient fundamental coverage
- at least two fully traceable sources
- a sufficiently fresh primary source
- complete Bear/Base/Bull scenario coverage with explicit base-case assumptions
- at least 120 technical sessions
- both a robust support zone and a robust resistance zone

Failures are blockers, not silently neutral scores.

## Persistence and history

The Supabase model is append-versioned:

- `divlab_analyses` — stable instrument identity / slug
- `divlab_analysis_versions` — immutable research snapshots
- `divlab_analysis_sources` — source provenance per version

`persist_divlab_analysis_version(...)` stores an analysis version and its sources atomically. Direct client access is currently disabled; the write path is service-role only. Public read policies should be introduced together with the eventual `/analyses` product surface and only for explicitly published versions.

Old versions are never rewritten when new information arrives.

## Deliberately not included in this foundation

The following are the next increments and are not claimed as complete in v1 foundation:

1. full live financial-statement collector (income statement, balance sheet and cash flow history)
2. report / IR document normalization into `FundamentalSnapshot`
3. deterministic historical-growth and margin-trend calculations across 3–5 years
4. richer valuation methods such as EV/EBIT and EV/EBITDA where verified inputs are available
5. AI-authored investor-facing narrative based only on the structured packet
6. integration trigger from the model-portfolio shortlist into Deep Research
7. public `/analyses` and `/analyses/[slug]` UI
8. DivBrain retrieval of published analysis versions

## Product invariant

A good company is not automatically a good stock at the current price, and a good stock is not automatically a suitable position for every portfolio. DivLab Analys owns the company/stock research. Each portfolio manager owns its own portfolio decision.
