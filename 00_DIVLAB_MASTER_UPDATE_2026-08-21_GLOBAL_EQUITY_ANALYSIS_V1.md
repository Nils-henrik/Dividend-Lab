# DIVLAB MASTER UPDATE — Global Equity Analysis v1

Date: 2026-08-21
Status: ACTIVE_PR / PREVIEW_ONLY
Scope: Global instrument discovery and the long-term product boundary for DivLab Analys.

## Parent rules

This update follows the active DivLab Master and the OMXS30 methodology coverage update. Correctness, fail-closed methodology selection, source traceability, immutable analysis history, 100/100 Research, 100/100 Analyst and Preview-first verification remain mandatory. No quality gate may be weakened to increase geographic or company-type coverage.

## Product objective

DivLab Analys shall ultimately allow a user to search for **any listed equity globally** by company name or ticker, resolve the exact listed instrument, gather current market data and verifiable research sources, select the correct fundamental methodology for the company type and produce a source-traceable DivLab analysis.

OMXS30 is a validation set, not the product boundary.

The intended user flow is:

1. search company name, ticker or provider symbol;
2. resolve exact listed instrument and exchange identity;
3. verify instrument type and company methodology;
4. discover primary company/regulatory sources and bounded external web research;
5. load market/fundamental/technical data;
6. run Deep Research;
7. run Analyst interpretation;
8. enforce Research 100/100 + Analyst 100/100;
9. persist/publish only when every gate passes.

## Locked product direction — Light Analysis and Deep Analysis

DivLab Analys shall expose two user-facing analysis depths built on the **same canonical company facts, provenance and methodology contracts**. They are not separate country-specific engines and must not fork into incompatible scoring or data models.

### Light Analysis

The Light Analysis is the fast, lower-cost product for a user who wants a current, structured answer without the full Deep Research sequence.

The target output shall include, when methodology and data support it:

- verified instrument/company identity;
- current price and market context;
- compact fundamental snapshot with the most decision-relevant financial data shown to the user;
- valuation snapshot and historical valuation context where reliable inputs exist;
- price chart and current technical regime;
- MA20, MA50 and MA200 where sufficient history exists;
- deterministic support/resistance areas rather than invented exact levels;
- trend/momentum context, with RSI and volume context where the technical contract supports them;
- key strengths, weaknesses and risks;
- a compact DivLab Outlook using explicit assumptions and scenario language;
- source/provenance links for material factual claims.

The Light Analysis may perform less external research and less interpretive depth than the Deep Analysis, but it may **never** lower correctness requirements, fabricate unavailable data or convert missing evidence into a confident conclusion.

### Deep Analysis

The Deep Analysis is DivLab's full **superanalysis** of both the company and the listed share.

It shall build on the same canonical facts as Light Analysis and continue through the complete DivLab Research + Analyst sequence. The intended output includes:

- full business-model and competitive-position analysis;
- multi-period income statement, balance sheet and cash-flow analysis;
- growth, margins, profitability, capital efficiency and balance-sheet strength;
- capital allocation and management-relevant evidence where available;
- company-type-specific methodology rather than a generic template for banks, investment companies, asset managers or future specialist families;
- historical and current valuation;
- valuation model(s) appropriate to the company type;
- explicit Bear / Base / Bull scenarios;
- estimated fair-value range with assumptions visible;
- full technical analysis with chart, moving averages, support/resistance, trend, momentum and relevant volume/indicator context;
- risk analysis and identified invalidation points;
- scenario probabilities when the Analyst contract can justify them;
- a probability-weighted expected-return / price-outlook calculation over an explicit horizon;
- confidence/quality semantics that distinguish data certainty from forecast uncertainty;
- full source traceability and the existing 100/100 Research + 100/100 Analyst quality gates before publication.

### Forecast semantics

DivLab may present a modelled expected price/return outlook, but it must not pretend that a point forecast is certain.

A valid final presentation should be structurally equivalent to:

- current market price;
- Bear scenario: price/return and stated assumptions;
- Base scenario: price/return and stated assumptions;
- Bull scenario: price/return and stated assumptions;
- scenario probabilities when justified;
- probability-weighted expected return;
- explicit forecast horizon, for example 12 months;
- confidence/quality context;
- primary support and resistance areas;
- a plain-language DivLab assessment such as negative / neutral / positive.

If probabilities or valuation assumptions cannot be justified from the available evidence, the engine must fail closed or omit that output rather than manufacture precision.

### Shared-engine requirement

The engineering target is conceptually:

`market-specific sources -> canonical facts -> company-type methodology -> DivLab analysis`

not separate functions or quality standards for individual companies or countries.

Market adapters are allowed to differ because SEC/US GAAP/USD, Swedish IFRS/SEK and other jurisdictions expose different source structures. Once normalized, the analytical quality standard is shared globally.

Light Analysis should be understood as a bounded execution depth over the shared engine. Deep Analysis should be understood as the complete execution depth over the same engine.

### Commercial hypothesis — not an engineering gate

The current product hypothesis is approximately **10 SEK for a Light Analysis** and **25 SEK for a Deep Analysis**, preferably consumed from prepaid DivLab credits/saldo so that very small card transactions do not dominate payment economics.

These prices are not locked acceptance criteria. Final pricing must be set after DivLab can measure real AI/data/compute cost per completed analysis and after the product/legal presentation has been reviewed. Engineering must therefore expose enough run-level cost/usage telemetry to support later unit-economics decisions without leaking provider secrets to end users.

## Global discovery is separate from analysis readiness

A globally discovered equity is **not automatically analysis-ready**.

DivLab must model these as separate states:

- `canPreflight` — the instrument is a verified listed equity candidate and may be sent into methodology preflight;
- `canRunAnalysis` — the current research stack has publication-grade source coverage for that market and may enter Deep Research;
- methodology support — the company type maps to an implemented DivLab analysis engine;
- publication support — Research and Analyst quality gates both reach 100/100 with required immutable data and source traceability.

A failure at any stage remains fail-closed.

## Global Instrument Discovery v1

The first implementation slice shall:

- use the Analysiscenter search flow rather than curated hard-coded targets only;
- discover listed equities outside the Nordics;
- preserve the exact provider transport symbol for markets where suffixes are part of identity;
- normalize currently known Nordic and US identities without double-appending exchange suffixes;
- expose exchange label and currency where provider metadata supplies them;
- allow global equities to enter methodology preflight;
- keep full analysis execution locked outside the currently verified research-source coverage.

Indexes, ETFs and other instrument types remain separately classified and may not be forced through company methodology.

## Source architecture

Global research must not be hard-coupled to one web-search vendor.

DivLab shall use a provider boundary for external web discovery. A provider may supply search hits, but the analysis engine owns:

- query construction;
- source classification;
- primary-source verification;
- deduplication;
- bounded fetching;
- evidence extraction;
- citation/source provenance;
- quality-gate decisions.

Google/web search may be one provider, but no methodology or quality gate may depend on Google-specific response structure.

## Source hierarchy

Global research should prefer sources in this order when available:

1. company Investor Relations / official company reports;
2. exchange or regulator filings;
3. official press releases / company announcements;
4. audited or otherwise traceable financial-data providers;
5. reputable external reporting and market commentary;
6. broad web discovery only as a route to better sources.

Search snippets are discovery material, not verified financial facts.

## Methodology boundary

Global coverage must continue to route by company type. Existing families remain:

- `operating_company`;
- `bank`;
- `investment_company`;
- `asset_manager`.

Future dedicated families may include insurance, real estate/REIT, mining/resources, utilities, biotech/pre-revenue and other categories where generic operating-company valuation would be misleading.

Unknown or unsupported company types remain fail-closed until a dedicated methodology exists.

## Current implementation boundary

Global Instrument Discovery v1 intentionally does **not** enable production publication for all global equities.

At this stage:

- global equities may be found in Preview;
- global equities may be methodology-preflighted in Preview;
- Nordic equities retain the existing execution path;
- non-Nordic equities remain analysis-locked until Global Source Discovery provides sufficient primary/web research coverage for the existing 100/100 quality gates;
- no production write/deployment is authorized by this update.

## Acceptance gate — Global Instrument Discovery v1

This slice may leave ACTIVE_PR only after:

1. lint passes;
2. TypeScript passes;
3. repository tests pass;
4. production build passes;
5. Preview search resolves at least one Nordic equity, one US equity and one non-US/non-Nordic equity;
6. exact Yahoo/provider identity is retained for a suffix market such as Tokyo/London;
7. global operating-company methodology preflight can classify a real non-Nordic equity without starting Deep Research;
8. index/ETF searches remain excluded from company methodology;
9. existing Nordic analysis execution remains unchanged and fail-closed;
10. no production write/deployment occurs during validation.

## Next phase after this slice

Build **Global Source Discovery v1**:

- provider-independent web-search adapter;
- Investor Relations discovery;
- regulator/exchange source discovery where available;
- source verification and canonicalization;
- bounded page/report fetching;
- evidence extraction into the existing analysis source/evidence model;
- Preview validation on representative US, European and Asian operating companies.

Only after global source coverage proves the existing 100/100 gates should non-Nordic equities be allowed into full Deep Research.

OMXS30 index analysis remains a separate Analysiscenter methodology and is not cancelled; its priority now follows the global-equity foundation unless a later master update explicitly changes the order.
