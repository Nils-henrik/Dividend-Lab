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
