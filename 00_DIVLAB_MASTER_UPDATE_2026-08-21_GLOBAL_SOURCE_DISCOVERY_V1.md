# DIVLAB MASTER UPDATE — Global Source Discovery v1

Date: 2026-08-21
Status: ACTIVE_PR / PREVIEW_ONLY
Parent: `00_DIVLAB_MASTER_UPDATE_2026-08-21_GLOBAL_EQUITY_ANALYSIS_V1.md`
Scope: Establish the first fail-closed global primary-source discovery layer without enabling global Deep Research or publication.

## Parent rules

The active DivLab Master, OMXS30 methodology coverage update and Global Equity Analysis v1 remain controlling. Correctness, immutable provenance, bounded external calls, methodology selection, Research 100/100, Analyst 100/100 and Preview-first verification remain mandatory.

No new market is analysis-ready merely because an instrument or URL was found.

## Objective

Global Source Discovery shall answer one narrow question before Deep Research:

> Can DivLab identify current, canonical and traceable primary sources for this exact listed company without guessing?

Discovery and evidence extraction are separate gates.

The source state model is:

1. instrument verified;
2. methodology verified;
3. source discovery verified;
4. source document/evidence extraction verified;
5. full Deep Research coverage verified;
6. Research 100/100;
7. Analyst 100/100;
8. publication allowed.

Failure at any stage remains fail-closed.

## Global Source Discovery v1 — first regulator vertical

The first verified non-Nordic regulator vertical is the United States through SEC EDGAR.

Official runtime endpoints:

- SEC company ticker directory: `https://www.sec.gov/files/company_tickers.json`;
- SEC company submissions: `https://data.sec.gov/submissions/CIK##########.json`;
- filing documents: canonical `https://www.sec.gov/Archives/edgar/data/...` paths derived only from SEC accession/document metadata.

SEC source discovery does not require an API key. Requests must use a declared DivLab User-Agent and remain bounded well below SEC fair-access limits.

## US source contract

For an exact US ticker, DivLab shall:

1. exact-match the ticker in SEC's ticker directory;
2. obtain the corresponding CIK;
3. fetch the company's official submissions JSON;
4. identify at most the latest usable annual filing and latest usable interim filing;
5. accept annual forms only from the allowlist `10-K`, `10-K/A`, `20-F`, `20-F/A`, `40-F`, `40-F/A`;
6. accept interim forms only from the allowlist `10-Q`, `10-Q/A`, `6-K`, `6-K/A`;
7. construct filing URLs only from numeric SEC accession identifiers and safe primary-document filenames;
8. preserve filing form, filing date, publisher and verification timestamp;
9. mark those SEC filing documents as primary sources;
10. never infer financial facts from filing metadata alone.

A valid annual + interim pair makes the source set ready for the **next evidence-extraction gate**, not for Deep Research itself.

## Issuer / Investor Relations anchors

Global Source Discovery may retain an issuer website or Investor Relations URL as a discovery candidate when supplied by a traceable provider or regulator metadata source.

Such URLs are not primary financial evidence merely because they point to a company domain.

Until the page/document itself is safely fetched, classified and parsed:

- `primary = false`;
- no financial metric may be derived from it;
- no quality-gate credit may be granted from the URL alone.

For SEC-covered companies, SEC `website` / `investorWebsite` metadata is preferred when present. A provider profile website may be used as a fallback discovery anchor only.

## Non-US market boundary

Global Source Discovery v1 does not pretend that every regulator has been implemented.

For Europe, Japan and other markets:

- the instrument may still be found globally;
- the company methodology may still be preflighted;
- an issuer-domain candidate may be retained when available;
- regulator/exchange primary sources remain unavailable until a dedicated, empirically verified adapter exists;
- `readyForEvidenceExtraction` remains false unless the market-specific primary-source requirements are met;
- `canRunAnalysis` remains false.

No generic web-search result or search snippet may upgrade a market to publication-grade coverage.

## Preview operator

A separate Preview-only Global Source Discovery testcenter shall exist under the Analysiscenter.

It must:

- use the existing global instrument search;
- require founder/CEO/admin authorization at the source-discovery API boundary;
- display primary-source counts and source type;
- show canonical filing/document URLs;
- distinguish primary filings from IR/company-domain candidates;
- show `evidenceExtractionReady` independently from `researchCoverageReady`;
- never run Deep Research;
- never persist or publish an analysis;
- remain `noindex` and return 404 outside Preview runtime.

The existing Nordic Analysis Preview execution path remains unchanged.

## Security and bounded-fetch rules

Global source discovery must:

- use HTTPS only;
- reject credential-bearing URLs;
- derive SEC archive paths only from allowlisted metadata shapes;
- reject path traversal and unsafe primary-document names;
- use exact ticker matching for SEC CIK resolution;
- keep the SEC discovery pass bounded to the ticker directory plus one submissions request for a US target;
- fail to an empty/unavailable result on network, parsing or identity errors;
- never downgrade source requirements to make a market pass.

## Current readiness semantics

`readyForEvidenceExtraction = true` means:

- at least one verified annual primary filing exists; and
- at least one verified interim primary filing exists.

It does **not** mean:

- financial evidence has been extracted;
- the filing text was successfully read;
- fundamental coverage is sufficient;
- Research quality is 100/100;
- Analyst quality is 100/100;
- global `canRunAnalysis` may be enabled.

`researchCoverageReady` therefore remains false for new non-Nordic markets in this phase.

## Acceptance gate — Global Source Discovery v1

This slice may leave ACTIVE_PR only after:

1. lint passes with no new errors;
2. TypeScript passes;
3. repository tests pass;
4. production build passes;
5. SEC ticker matching is exact and deterministic;
6. SEC filing extraction accepts only allowlisted annual/interim forms;
7. unsafe accession/document paths fail closed;
8. a mocked US company reaches `verified_primary` only with annual + interim filing coverage;
9. a non-US market without a regulator adapter remains locked;
10. Preview endpoint remains founder/CEO/admin + Preview-only;
11. Preview UI clearly separates source readiness from full Research readiness;
12. existing Nordic analysis execution remains unchanged;
13. no production write/deployment occurs during validation.

## Real Preview acceptance targets

Before this phase is considered runtime-validated:

- US: Microsoft (`MSFT`) or another large US operating company must resolve to SEC annual + interim primary filings;
- non-US/non-Nordic: Toyota (`7203.T`) or equivalent must remain fail-closed unless only a company-domain candidate is available;
- Nordic: an existing supported target must still report the established Nordic research path as ready without passing through the new SEC adapter.

## Next phase

Build **Global Evidence Extraction v1** on top of verified source discovery:

- safely fetch the selected SEC filing documents;
- bound document bytes and document count;
- extract clean filing text without trusting scripts or instructions inside documents;
- map filing excerpts into the existing `AnalysisEvidence` model;
- preserve source IDs and filing provenance end-to-end;
- verify financial period/document type;
- run deterministic source/evidence quality checks;
- only then consider enabling the existing Deep Research engine for a US operating-company Preview target.

After the US evidence vertical is proven, add dedicated regulator/exchange adapters market by market. Priority should favor markets with stable official APIs or deterministic public filing archives rather than broad-but-unverifiable scraping.
