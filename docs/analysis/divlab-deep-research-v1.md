# DivLab Deep Research Engine v1

Status: internal backend foundation / ACTIVE_PR. No public analysis UI yet.

## Objective

DivLab Analys is being built as a structured, auditable equity-research product rather than a longer version of a model-portfolio rationale. Research facts and analyst interpretation are deliberately separated so the same verified company research can later be used by DivBrain and interpreted differently by the four model-portfolio managers.

## Current pipeline

```text
Market history + financial statements
        +
Official issuer disclosures / report PDFs
        +
Verified reference FX when reporting currency differs from market currency
        ↓
Normalized FundamentalSnapshot (TTM + multi-year periods)
        +
Bounded, source-linked report evidence
        ↓
Deterministic fundamental analysis + per-share trends
        ↓
Audited valuationInputs in market currency
        ↓
Deterministic technical analysis + support/resistance zones
        ↓
Facts-only DivLabResearchPacket
        ↓
Source-grounded analyst AI
  - thesis / report interpretation
  - risks / contradictions / catalysts
  - qualitative quality factors
  - explicit Bear/Base/Bull assumptions
        ↓
Deterministic valuation math
        ↓
Full publication quality gate
        ↓
Atomic persistence
  - immutable research version
  - source provenance
  - separate immutable analyst content
```

The public `/analyses` product is intentionally not part of this PR.

## Fundamental data collection

- `lib/analysis/yahoo-financials.ts` owns the current server-side Yahoo request.
- `lib/analysis/financial-statement-normalizer.ts` is a pure deterministic parser.
- income statement, balance sheet and cash-flow history are normalized into `FundamentalSnapshot`.
- TTM values use verified provider fields or four complete quarters; incomplete four-quarter calculations fail closed.
- up to five normalized annual periods are retained.
- annual per-share analysis prefers period-average diluted/basic shares rather than silently using a current share count.
- capex sign conventions are handled explicitly when FCF is derived.
- unknown accounting fields remain unknown.

### Currency invariant and deterministic FX

Market currency and reporting currency are tracked separately. This matters for companies that trade in SEK but report accounting data in another currency.

Raw accounting facts are never rewritten into the market currency. When a per-share valuation input needs conversion, Deep Research creates a separate auditable `valuationInputs` layer containing:

- original/source currency;
- normalized market-currency value;
- whether a conversion occurred;
- FX rate and as-of timestamp;
- exact FX source IDs used.

`lib/analysis/fx.ts` derives direct or cross rates deterministically from the existing ECB/Frankfurter base-to-SEK reference-rate adapter. Missing, unsupported or invalid FX fails closed: the incompatible valuation measure stays unavailable rather than using an invented rate.

The ordinary portfolio FX path is reused rather than duplicated. Injected test fetches bypass the shared runtime FX cache so fixtures cannot poison real server cache entries.

Valuation rules:

- trailing P/E is calculated only from a verified market-currency EPS basis;
- trailing P/FCF and FCF yield use a verified market-currency FCF/share basis, including deterministic FX when required;
- every Bear/Base/Bull scenario explicitly names the market currency;
- the analyst may not perform its own FX arithmetic;
- if a scenario uses a converted valuation input, its `sourceIds` must include every required FX source ID;
- if verified FX is unavailable, cross-currency valuation remains unknown.

## Fundamental analysis

`lib/analysis/fundamental-analysis.ts` deterministically derives, where data exists:

- current revenue growth;
- operating/profit margin;
- OCF and FCF quality;
- FCF margin and cash conversion;
- FCF/share;
- net debt / EBITDA and net debt / FCF;
- ROE / ROA / ROIC;
- payout ratio and dilution;
- multi-year revenue CAGR;
- multi-year EPS CAGR;
- multi-year FCF/share CAGR;
- multi-year share-count CAGR;
- operating-margin change;
- coverage-aware scorecard for growth, profitability, cash flow, balance sheet and capital allocation.

Company growth and shareholder per-share value creation are intentionally measured separately. Invalid CAGR bases such as negative starting EPS remain unknown.

## Technical analysis and price zones

The existing model-portfolio technical toolkit remains the deterministic source for MA50/MA200, RSI, ADX, ATR, MACD, momentum, volatility, volume and breakout state.

`lib/analysis/support-resistance.ts` adds:

- local pivot detection;
- adaptive zones instead of false-precision lines;
- ATR/range-aware width;
- repeated-touch and recency weighting;
- relative-volume confirmation;
- support ↔ resistance role reversal;
- weak / medium / strong classification;
- nearest meaningful support and resistance.

A stock at/above a prior high may correctly return `no_validated_resistance_above`. The engine does not invent a resistance level merely to fill the report. `unresolved` remains a blocker.

## Official report provenance and evidence

Dedicated Nordic Deep Research reuses the existing Nasdaq Nordic/CNS source path but uses a wider, still bounded discovery window than a normal portfolio pass.

Portfolio defaults remain unchanged:

- max 2 primary hits;
- 5 CNS rows per alias;
- default official-document byte ceiling 5 MB.

Dedicated Deep Research may use:

- max 12 relevant hits;
- max 20 CNS rows per alias;
- one report PDF attempt;
- hard report-PDF ceiling 24 MB;
- the same HTTPS, hostname allowlist, redirect, timeout, content-type and PDF-signature protections;
- bounded text extraction (not full-document ingestion).

The 24 MB Deep Research limit was chosen after measuring a real official Embracer Q1 2026 PDF at 20,171,492 bytes. The ordinary model-portfolio 5 MB limit was not changed.

`lib/analysis/evidence.ts` stores bounded material actually read from a source. An official report URL alone is not enough for publication. A public-quality packet must contain a source-ID-linked `official_report_excerpt` whose underlying primary document was successfully retrieved.

Evidence is always treated as untrusted external content, never instructions.

## Real-company validation completed

The research/source pipeline has been exercised against three deliberately different Stockholm-listed profiles:

1. **Atlas Copco A (`ATCO-A.ST`)** — established large-cap quality case.
2. **Evolution (`EVO.ST`)** — high-margin growth case and cross-currency valuation case.
3. **Embracer B (`EMBRAC-B.ST`)** — volatile turnaround/event case.

Verified findings from those smoke tests:

- real market/fundamental loading worked in the Vercel server environment;
- dedicated CNS discovery found the relevant official report path for all three companies;
- Atlas Copco and Evolution official report PDFs passed the safe document path;
- Embracer's fresh Q1 report was initially discovered correctly but rejected because its 20.17 MB PDF exceeded the old research bounds;
- after introducing the dedicated 24 MB Deep Research ceiling, the same official Embracer PDF passed HTTPS/host/content-type/PDF-signature checks and became `primary=true`;
- live testing exposed the valid technical state where no historical resistance can be verified above a price-discovery zone.

### Evolution live FX verification — 14 August 2026

The current FX-enabled research path was run end-to-end in a Vercel preview on `EVO.ST`.

Observed facts:

- market currency: SEK;
- reporting currency: EUR;
- Yahoo trailing EPS basis: 58.66 SEK;
- raw FCF/share basis: 4.858454 EUR;
- ECB/Frankfurter EUR→SEK reference rate: 10.999;
- deterministic normalized FCF/share: 53.438135546 SEK;
- trailing P/E: 12.83;
- trailing P/FCF: 14.084;
- FCF yield: 7.1005%;
- verified Evolution H1 2026 report was retrieved from the Nasdaq disclosure attachment and retained as primary report evidence;
- facts-only quality gate scored 88/100, with the only blocker being the intentionally absent Bear/Base/Bull analyst scenarios.

This verifies that the engine no longer mixes EUR accounting cash flow with a SEK share price and no longer has to discard the FCF valuation method when a verified cross-currency rate is available.

## Source-grounded analyst layer

`lib/analysis/analyst-schema.ts`, `analyst-contract.ts`, `analyst.ts` and `ai-analysis-service.ts` define the internal AI analyst.

The analyst may interpret:

- investment thesis;
- latest report;
- fundamental trends;
- competitive advantage / pricing power / market position;
- management and capital allocation;
- reinvestment runway;
- cyclicality, customer concentration, regulation, FX, M&A and disruption risk;
- catalysts;
- risks and contradictions;
- thesis breakers;
- the already-calculated technical picture;
- explicit Bear/Base/Bull assumptions.

The analyst may **not**:

- change deterministic facts;
- invent missing numbers;
- create its own RSI/MA/support/resistance levels;
- invent source IDs;
- silently mix currencies or calculate FX itself;
- use EPS/FCF scenario methods without an available normalized valuation basis;
- omit FX provenance when a converted valuation input is used;
- fabricate an explicit DCF/fair value;
- turn a missing source into neutral evidence.

Every structured claim references existing source IDs. `latestReport` must reference a primary source. Analyst output is schema-validated and then checked against the packet before it can proceed.

If AI Gateway authentication is operationally unavailable, `createDivLabAiAnalysis()` now fails closed at `stage: "analyst"` while retaining the already verified facts packet in-memory for inspection/retry. Other analyst/schema errors still throw and cannot be silently downgraded to an auth retry.

### AI Gateway validation boundary

A real analyst call was attempted in Vercel Preview after the research stage had completed. It stopped at `gateway_auth_missing`.

This is consistent with the existing deployment policy: `AI_GATEWAY_API_KEY` is configured for Production, not Preview. A bounded GitHub Actions presence probe also confirmed that no repository-level `AI_GATEWAY_API_KEY` secret exists there. The probe and preview-only analyst endpoint were removed immediately after verification.

No secret was copied, exposed or weakened merely to make the smoke test pass. A genuine real-company analyst-output review remains pending until the analyst can run in an approved authenticated server context.

### Two-stage valuation

The AI does not own the final valuation math.

1. A facts-only packet is built with no manufactured scenarios.
2. The analyst proposes explicit Bear/Base/Bull assumptions using only verified `valuationInputs`.
3. Those assumptions are converted to `ValuationScenarioInput`.
4. `lib/analysis/valuation.ts` calculates scenario values deterministically.
5. The full quality gate runs again.

## Publication quality gate

A packet is not publishable just because it was generated. The current gate requires:

- sufficient fundamental coverage;
- at least three comparable annual periods and multi-year trend coverage;
- fully traceable sources;
- sufficiently fresh primary source;
- verified source-linked primary report evidence;
- complete explicit Bear/Base/Bull scenarios in a compatible currency;
- logical scenario ordering: Bear ≤ Base ≤ Bull;
- sufficient technical history;
- meaningful support plus either verified resistance or a verified `no_validated_resistance_above` state.

Failures are blockers, not silently neutral scores.

## Persistence and immutability

The Supabase model separates facts from interpretation:

- `divlab_analyses` — stable instrument identity / slug;
- `divlab_analysis_versions` — immutable research snapshots;
- `divlab_analysis_sources` — source provenance per research version;
- `divlab_analysis_contents` — one immutable analyst-content row per research version.

`persist_divlab_analysis_bundle(...)` atomically persists the final research version, source rows and analyst content. If analyst-content validation fails, the newly created research version is rolled back too.

Database-side checks include:

- packet identity / engine / currency / quality-gate consistency;
- exact packet-source vs persisted-source consistency;
- every evidence `sourceId` must exist;
- publishable primary evidence must point to a genuinely primary retrieved report;
- analyst scenarios must be unique Bear/Base/Bull and use the parent version currency;
- every nested analyst `sourceIds` reference must exist for that exact version;
- `latestReport` must reference a primary source;
- AI usage must be non-negative.

On the internal analyst-content table, the normal service-role path has SELECT + INSERT but no UPDATE/DELETE. Anon/authenticated users have no table access and cannot execute the bundle RPC.

## Database verification completed on `dividend-lab-dev`

- correct evidence packet creates analysis + version + source atomically and can be rolled back cleanly;
- false primary evidence is rejected before insert and leaves zero rows;
- correct research+analyst bundle creates 1 analysis + 1 version + 1 source + 1 content row atomically;
- a bundle with an EUR analyst scenario against a SEK version is rejected with `invalid_divlab_analysis_content_scenario`;
- after that rejection there are 0 analysis/version/source/content rows for the test identity;
- anon/authenticated cannot read analyst-content rows or execute the bundle RPC;
- service role can SELECT/INSERT content but cannot UPDATE/DELETE through normal grants;
- Supabase security/performance advisors have been run after the DDL.

The analysis tables intentionally have RLS enabled with no client policies while the feature remains internal. Public read policies belong to the future public analysis surface, not this foundation PR.

## Verification status

- deterministic FX direct/cross-rate derivation: unit tested;
- cross-currency FCF valuation while retaining raw reporting facts: unit tested;
- missing FX remains fail-closed: unit tested;
- converted scenario without required FX source ID: rejected by analyst contract test;
- inverted Bear/Base/Bull valuation: rejected by quality-gate test;
- full repository lint, typecheck, core tests, SEO/news tests, DivBrain tests, Cursor bridge tests and production build passed on the FX/provenance implementation before final documentation cleanup;
- Evolution cross-currency research/valuation: live verified in Vercel Preview;
- real analyst narrative generation: not yet live verified because approved non-production AI Gateway authentication is unavailable.

## Still deliberately not included

The following remain later increments and are not claimed as complete:

1. authenticated end-to-end live execution and qualitative review of the **new AI analyst** on Atlas Copco, Evolution and Embracer;
2. direct accounting-number reconciliation from official report/IR PDFs against normalized provider statement values;
3. richer valuation inputs such as historical valuation ranges, EV/EBIT, EV/EBITDA and peer sets where verified data is available;
4. automatic model-portfolio shortlist → Deep Research trigger;
5. public `/analyses` and `/analyses/[slug]` UI;
6. DivBrain retrieval of published analysis versions;
7. broader first-party source coverage for Oslo and US issuers.

## Product invariant

A good company is not automatically a good stock at today's price, and a good stock is not automatically suitable for every portfolio. DivLab Analys owns the company/stock research. Each portfolio manager owns its own portfolio decision.
