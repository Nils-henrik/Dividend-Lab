# DIVLAB MASTER UPDATE — Global Evidence Extraction v1

Date: 2026-08-21
Status: ACTIVE_PR / PREVIEW_ONLY
Parent: `00_DIVLAB_MASTER_UPDATE_2026-08-21_GLOBAL_SOURCE_DISCOVERY_V1.md`
Scope: Safely read already-verified SEC filing documents and map bounded, source-linked text into DivLab's existing AnalysisSource / AnalysisEvidence contracts without enabling global Deep Research.

## Parent rules

The active DivLab Master, Global Equity Analysis v1 and Global Source Discovery v1 remain controlling.

This phase may prove only that DivLab safely retrieved and retained traceable primary-document evidence. It may not claim that global fundamental/provider coverage is complete, that Research quality is 100/100, or that publication is allowed.

No quality gate may be weakened to make a US target pass.

## Objective

Global Evidence Extraction answers the next narrow question after source discovery:

> Can DivLab safely retrieve the exact verified primary documents, turn them into bounded untrusted text, and preserve end-to-end source provenance in the same evidence model used by Deep Research?

The global state model remains:

1. instrument verified;
2. methodology verified;
3. source discovery verified;
4. source document/evidence extraction verified;
5. full Deep Research coverage verified;
6. Research 100/100;
7. Analyst 100/100;
8. publication allowed.

Evidence extraction is stage 4 only.

## Existing DivLab contracts are authoritative

Global evidence must reuse:

- `AnalysisSource` from the existing analysis quality layer;
- `AnalysisEvidence` from the existing Deep Research evidence layer;
- `official_report_excerpt` as the evidence kind for safely retrieved filing text;
- `sourceId` as the immutable bridge from evidence back to the exact primary source;
- `documentExcerpt` as bounded untrusted external text.

No parallel US-only research packet or alternate evidence schema is allowed.

## SEC retrieval allowlist

Only sources already classified by Global Source Discovery as:

- `regulatory_annual_filing`; or
- `regulatory_interim_filing`

and marked `primary = true` may be fetched by the v1 evidence extractor.

Every fetch URL and every redirect target must satisfy all of:

- HTTPS;
- no username/password;
- exact host `www.sec.gov`;
- path starts with `/Archives/edgar/data/`;
- no query string;
- no fragment.

No issuer website, IR candidate, search result or arbitrary URL may enter this fetcher.

## Hard runtime bounds

The v1 pass is intentionally small and sequential:

- maximum documents: 2;
- maximum bytes per document: 8,000,000;
- maximum extracted text per document: 12,000 characters;
- minimum meaningful text for evidence credit: 800 characters;
- timeout: 12 seconds;
- redirects: maximum 1;
- redirects: manual and revalidated against the same SEC allowlist;
- fetch order: sequential, never fan-out crawling.

A declared Content-Length over the limit fails before body processing. Streaming bodies are also counted and aborted once the hard byte bound is exceeded.

## Accepted document content types

The SEC text extractor accepts only:

- `text/html`;
- `application/xhtml+xml`;
- `text/plain`;
- `application/xml`;
- `text/xml`.

PDF, binary/octet-stream and unknown content types are not silently accepted on this path.

## HTML / XBRL safety semantics

The extractor is not a browser.

It must:

- never execute JavaScript;
- remove script/style/noscript/template/svg/canvas blocks;
- remove hidden inline-XBRL (`ix:hidden`) blocks;
- remove HTML/XML markup;
- decode only text entities into plain text;
- normalize control characters and whitespace;
- hard-truncate to the configured text limit;
- keep the result explicitly untrusted after extraction.

Visible instruction-like wording inside a filing remains ordinary external text and can never override DivLab system, safety, research, methodology or portfolio instructions.

## Evidence mapping

A successfully extracted annual filing maps to:

- `AnalysisSource.kind = annual_report`;
- `AnalysisEvidence.kind = official_report_excerpt`.

A successfully extracted `10-Q` maps to:

- `AnalysisSource.kind = quarterly_report`;
- `AnalysisEvidence.kind = official_report_excerpt`.

Each evidence object must preserve:

- exact `sourceId`;
- SEC publisher;
- canonical source URL;
- filing publication date;
- source verification timestamp;
- filing form in `documentType`;
- `primary = true`;
- `documentRetrieved = true`;
- bounded `documentExcerpt`.

No fiscal quarter, fiscal year or accounting period may be guessed from the filing date. `reportPeriod` and `reportYear` therefore remain null until document-level period classification is separately proven.

## Evidence quality gate

Global Evidence Extraction v1 has its own deterministic gate.

Required checks:

1. every evidence item maps to a retained AnalysisSource through `sourceId`;
2. one safely retrieved annual document exists;
3. one safely retrieved interim `10-Q` document exists;
4. every credited document excerpt is between the minimum meaningful length and the hard maximum;
5. annual and interim evidence come from two distinct source IDs.

All checks must pass for `evidenceQualityReady = true` / 100 score.

This status means only that the evidence extraction phase is ready for the next Research-coverage evaluation.

It never implies `researchCoverageReady = true` for a new global market.

## Preview endpoint

A separate Preview-only founder/CEO/admin endpoint may run the evidence extraction pass.

It must:

- resolve the exact instrument first;
- retain the existing Nordic path without routing it through SEC;
- re-run Global Source Discovery;
- refuse extraction unless source discovery is ready;
- fetch at most the two verified SEC primary filings;
- return extraction failures as bounded machine-safe reason codes;
- expose evidence quality separately from Research readiness;
- always keep new non-Nordic `researchCoverageReady = false` in this phase;
- never invoke `createDivLabAiAnalysis`;
- never persist or publish an analysis;
- remain 404 outside Preview runtime.

## Preview UI

Global Source Discovery Preview may expose one explicit action when source discovery is ready:

`Extrahera verifierad evidens`

The UI must show:

- evidence quality score;
- blockers when the gate fails;
- document form;
- bounded downloaded byte size;
- whether document text was truncated;
- a short UI-only excerpt preview;
- explicit `Full Research: fortsatt låst` for new global markets.

The UI action may not call the analysis `/run` route and may not send persist/publish flags.

## Acceptance gate — Global Evidence Extraction v1

This phase may leave ACTIVE_PR only after:

1. lint passes with no new errors;
2. TypeScript passes;
3. repository tests pass;
4. SEO/news/i18n tests pass;
5. DivBrain tests pass;
6. Cursor bridge tests pass;
7. production build passes;
8. canonical SEC archive URL allowlisting is deterministic;
9. redirect targets are revalidated and bounded;
10. document bytes and document count are hard bounded;
11. unsupported content types fail closed;
12. scripts/styles/hidden XBRL cannot enter extracted text;
13. extracted text is hard bounded;
14. a deterministic annual + interim fixture creates two sourceId-linked AnalysisEvidence objects;
15. missing annual/interim evidence fails the evidence quality gate;
16. thin extracted text fails the evidence quality gate;
17. Preview route requires source-discovery readiness first;
18. Preview route remains founder/CEO/admin + Preview-only;
19. global evidence readiness never flips global Research readiness to true;
20. no production write/deployment occurs during validation.

## Real Preview acceptance

Before runtime acceptance:

- `MSFT` (or equivalent US operating company) must discover SEC annual + `10-Q` filings;
- both filing documents must be safely fetched from canonical SEC archive URLs;
- extracted text must produce two source-linked evidence items;
- Global Evidence gate must reach 100/100 or expose the exact blocker;
- `researchCoverageReady` must still remain false;
- a non-US target without a regulator adapter must fail before evidence extraction;
- an existing Nordic target must remain on the established Nordic path.

These checks must use the founder-authenticated Preview runtime. Auth must never be weakened merely to automate acceptance.

## Next phase

After Global Evidence Extraction v1 is accepted, build **US Research Coverage v1**.

That phase must determine whether the existing operating-company Deep Research inputs can be populated with US-safe, source-traceable equivalents for:

- current and historical financial statements;
- reporting currency and quote currency;
- multi-year fundamentals;
- market price/history;
- classification provenance;
- valuation inputs and provenance;
- fresh primary evidence;
- technical history.

Only when the complete existing Deep Research quality model can be satisfied without a Nordic-only assumption may `canRunAnalysis` be enabled for one US Preview target.

The first live target should be a straightforward US operating company such as Microsoft, not a bank, insurer, REIT or complex foreign issuer.
