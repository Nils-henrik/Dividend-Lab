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
Normalized FundamentalSnapshot
  - TTM
  - annual history
  - separate normalized quarterly periods
        +
Bounded, source-linked report evidence
  - wrapped analyst evidence
  - separate clean bounded documentExcerpt
        ↓
Confirmation-only primary-report reconciliation
        ↓
Deterministic fundamental analysis + per-share trends
        ↓
Audited valuation inputs in market currency
  - EPS / FCF per share
  - market cap / cash / debt / EBIT / EBITDA
        ↓
Deterministic trailing valuation
  - P/E
  - P/FCF + FCF yield
  - Enterprise Value
  - EV/EBIT
  - EV/EBITDA
        ↓
Deterministic valuation provenance
        +
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
Research publication quality gate
        +
Separate Analyst Content Quality Gate
        ↓
Atomic persistence
  - immutable research version
  - source provenance
  - separate immutable analyst content
  - immutable analyst-quality certification
```

The public `/analyses` product is intentionally not part of this PR.

## Fundamental data collection

- `lib/analysis/yahoo-financials.ts` owns the current server-side Yahoo request.
- `lib/analysis/financial-statement-normalizer.ts` is a pure deterministic parser.
- income statement, balance sheet and cash-flow history are normalized into `FundamentalSnapshot`.
- TTM values use verified provider fields or four complete quarters; incomplete four-quarter calculations fail closed.
- up to five normalized annual periods are retained for multi-year trend work.
- up to eight normalized quarterly periods are retained separately for same-period report reconciliation; they do not replace annual history or silently change existing TTM calculations.
- annual and quarterly per-share analysis prefers period-average diluted/basic shares rather than silently using a current share count.
- capex sign conventions are handled explicitly when FCF is derived.
- unknown accounting fields remain unknown.

### Currency invariant and deterministic FX

Market currency, reporting currency and trailing-EPS currency are tracked separately in `currencyContext`. Raw accounting facts are never rewritten merely because the listed share trades in another currency.

When a per-share valuation input needs conversion, Deep Research creates a separate auditable `valuationInputs` layer containing original/source currency, normalized market-currency value, conversion state, FX rate/as-of timestamp and exact FX source IDs.

Absolute valuation components use the same principle through `enterpriseValuationInputs`. Market cap is kept in the listed share currency. Statement-derived cash, debt, EBIT and EBITDA are normalized from the reporting currency into the market currency before enterprise value or an enterprise multiple may be calculated.

`lib/analysis/fx.ts` derives direct or cross rates deterministically from the existing ECB/Frankfurter base-to-SEK reference-rate adapter. Missing, unsupported or invalid FX fails closed: the incompatible valuation measure stays unavailable rather than using an invented rate. Injected test fetches bypass the shared runtime FX cache so fixtures cannot poison real server cache entries.

Valuation rules:

- trailing P/E is calculated only from a verified market-currency EPS basis;
- trailing P/FCF and FCF yield use a verified market-currency FCF/share basis, including deterministic FX when required;
- enterprise value requires usable market cap, cash and debt in the same market currency;
- EV/EBIT and EV/EBITDA require a positive enterprise value plus positive EBIT/EBITDA in the same normalized currency;
- zero debt is valid; negative/non-positive operating earnings do not create a misleading positive enterprise multiple;
- every Bear/Base/Bull scenario explicitly names the market currency;
- the analyst may not perform its own FX or enterprise-value arithmetic;
- if a scenario uses a converted valuation input, its `sourceIds` must include every required FX source ID;
- if verified FX is unavailable, cross-currency valuation remains unknown.

## Deterministic valuation provenance

`lib/analysis/valuation-provenance.ts` builds an explicit source map for each available trailing valuation measure:

- P/E;
- P/FCF;
- FCF yield;
- Enterprise Value;
- EV/EBIT;
- EV/EBITDA.

Each measure records whether it is available, whether it is fully traceable, the exact source IDs required by its deterministic math and any relevant metric that was independently confirmed by primary-report reconciliation.

A cross-currency EV/EBITDA can therefore map directly to, for example, the market-data source, the fundamental-data source and the exact EUR→SEK FX source instead of leaving that relationship implicit.

The research publication quality gate now blocks a packet when any available trailing valuation measure is not fully traceable. A number existing in memory is therefore not enough for DivLab publication; its provider, market and required FX provenance must also be present.

The analyst receives this provenance object and is instructed to use source IDs from the matching valuation measure when making concrete claims about P/E, P/FCF, FCF yield, EV, EV/EBIT or EV/EBITDA.

## Fundamental analysis

`lib/analysis/fundamental-analysis.ts` deterministically derives, where data exists: current revenue growth; operating/profit margin; OCF and FCF quality; FCF margin and cash conversion; FCF/share; net debt / EBITDA and net debt / FCF; ROE / ROA / ROIC; payout ratio and dilution; multi-year revenue/EPS/FCF-per-share/share-count CAGR; operating-margin change; and a coverage-aware scorecard.

Company growth and shareholder per-share value creation are intentionally measured separately. Invalid CAGR bases such as negative starting EPS remain unknown.

## Technical analysis and price zones

The existing model-portfolio technical toolkit remains the deterministic source for MA50/MA200, RSI, ADX, ATR, MACD, momentum, volatility, volume and breakout state.

`lib/analysis/support-resistance.ts` adds local pivot detection, adaptive zones, ATR/range-aware width, repeated-touch and recency weighting, relative-volume confirmation, role reversal, strength classification and nearest meaningful support/resistance.

A stock at/above a prior high may correctly return `no_validated_resistance_above`. The engine does not invent a resistance level merely to fill the report. `unresolved` remains a blocker.

## Official report provenance and evidence

Dedicated Nordic Deep Research reuses the existing Nasdaq Nordic/CNS source path but uses a wider, still bounded discovery window than a normal portfolio pass.

Portfolio defaults remain unchanged: max 2 primary hits, 5 CNS rows per alias and a 5 MB official-document byte ceiling.

Dedicated Deep Research may use max 12 relevant hits, max 20 CNS rows per alias, one report PDF attempt and a hard report-PDF ceiling of 24 MB, while retaining the same HTTPS, hostname allowlist, redirect, timeout, content-type and PDF-signature protections plus bounded text extraction.

The 24 MB Deep Research limit was chosen after measuring a real official Embracer Q1 2026 PDF at 20,171,492 bytes. The ordinary model-portfolio 5 MB limit was not changed.

`lib/analysis/evidence.ts` stores bounded material actually read from a source. An official report URL alone is not enough for publication. A public-quality packet must contain a source-ID-linked `official_report_excerpt` whose underlying primary document was successfully retrieved. Evidence is always treated as untrusted external content, never instructions.

A retrieved report now keeps two deliberately different representations:

- `content` — bounded DivLab-wrapped evidence used by the analyst layer;
- `documentExcerpt` — the clean bounded PDF text before DivLab metadata wrapping, used only for deterministic primary-report reconciliation.

The clean excerpt is not duplicated into the analyst prompt, avoiding duplicate tokens and accidental overweighting of the same source.

## Primary-report reconciliation v1

`lib/analysis/primary-report-reconciliation.ts` performs a conservative, confirmation-only cross-check between provider-normalized statement periods and clean bounded text from an official report.

It never overwrites provider data and is not a publication blocker in v1.

Current eligible metrics are:

- revenue / net sales;
- operating income / operating profit;
- net income / profit for the period;
- EPS when the row explicitly states the reporting currency.

Period rules are explicit:

- Q1 → one matching provider quarter;
- Q2 or H1 → two same-year provider quarters;
- Q3 → three same-year provider quarters;
- Q4 or FY → matching annual period;
- ambiguous or unsupported period → `not_applicable`.

Currency/unit rules are equally strict. A report amount must have a uniquely detectable scale tied to the verified reporting currency before monetary totals can be confirmed. Ordinary ASCII spaces in flattened PDF tables are deliberately **not** interpreted as thousands separators because they may simply separate table columns. Locale-ambiguous comma/dot formats produce candidate interpretations, but a metric is certified only when exactly one interpretation matches the same-basis provider value within a narrow deterministic tolerance.

Possible metric states are `confirmed`, `not_confirmed` and `provider_missing`. `not_confirmed` never means that the issuer report contradicts the provider; it means the bounded deterministic parser could not safely certify the number.

The aggregate reconciliation status is `not_applicable`, `not_confirmed`, `partial` or `confirmed`. The analyst is explicitly instructed to use only `confirmed` metrics as extra support and never turn a failed reconciliation into a claimed accounting discrepancy.

Contract tests cover H1 aggregation, annual locale formats, missing units, missing report text, nonmatching figures and the safety case where `123 456` must not be guessed as `123456`.

## Real-company validation completed

The research/source pipeline has been exercised against three deliberately different Stockholm-listed profiles:

1. **Atlas Copco A (`ATCO-A.ST`)** — established large-cap quality case.
2. **Evolution (`EVO.ST`)** — high-margin growth case and cross-currency valuation case.
3. **Embracer B (`EMBRAC-B.ST`)** — volatile turnaround/event case.

Verified findings:

- real market/fundamental loading worked in Vercel;
- dedicated CNS discovery found the relevant official report path for all three companies;
- Atlas Copco and Evolution official report PDFs passed the safe document path;
- Embracer's fresh Q1 report was discovered correctly and, after the dedicated 24 MB ceiling was introduced, its 20,171,492-byte PDF passed HTTPS/host/content-type/PDF-signature checks and became `primary=true`;
- live testing exposed and verified the valid `no_validated_resistance_above` technical state.

### Evolution live FX verification — 14 August 2026

The FX-enabled research path was run end-to-end in a Vercel preview on `EVO.ST`.

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
- facts-only quality gate scored 88/100, with the only blocker being intentionally absent Bear/Base/Bull analyst scenarios.

This verifies that the engine no longer mixes EUR accounting cash flow with a SEK share price and no longer has to discard FCF valuation when a verified cross-currency rate is available.

The newer primary-report reconciliation, enterprise valuation and valuation-provenance code is contract-tested but has not yet been re-run live against these three issuer datasets because the current Vercel build-rate limit prevents creation of a new preview containing that code. No live EV/EBIT, EV/EBITDA or reconciliation claim is made for Evolution yet.

## Source-grounded analyst layer

`lib/analysis/analyst-schema.ts`, `analyst-contract.ts`, `analyst.ts` and `ai-analysis-service.ts` define the internal AI analyst.

The analyst may interpret thesis, latest report, fundamental trends, quality factors, catalysts, risks, contradictions, thesis breakers, the deterministic technical picture and explicit Bear/Base/Bull assumptions.

The analyst may not change deterministic facts, invent missing numbers or source IDs, create technical levels, calculate FX or enterprise value itself, use an unavailable valuation basis, omit required FX provenance, fabricate an explicit DCF/fair value or turn a missing source into neutral evidence.

Every structured claim references existing source IDs. `latestReport` must reference a primary source. Analyst output is schema-validated and checked against the packet before it can proceed. Concrete trailing-valuation claims are grounded through `valuationProvenance` rather than an arbitrary source choice by the model.

### Vercel runtime OIDC handling

The generic model-portfolio AI resolver remains strict and unchanged in policy.

The analyst has a separate runtime-auth policy in `lib/analysis/analyst-auth.ts`. Explicit API-key or materialized OIDC auth keeps priority. When no explicit credential is visible but the analyst is running inside a real Vercel runtime, the analyst lets the Vercel AI Gateway attempt request-context OIDC instead of failing prematurely from a `process.env`-only check. Ordinary local/CI execution remains fail-closed.

A genuine AI Gateway HTTP 401 is mapped back to `gateway_auth_missing`, so the fallback does not convert real authentication failures into success.

This policy is unit tested for API-key priority, explicit OIDC, Preview runtime-context OIDC and ordinary CI failure.

### AI Gateway live-validation boundary

An earlier real analyst call in Vercel Preview stopped at `gateway_auth_missing` before the request-context OIDC fallback existed.

After the fallback was implemented and the full repository gate passed, a new Preview-only, branch-bound, read-only analyst smoke route was prepared to test Evolution without persistence. Vercel did **not** create a deployment for that commit: the GitHub Vercel status failed at deployment creation with `upgradeToPro=build-rate-limit`.

The same Vercel `build-rate-limit` status is still present on the final green branch head. Therefore the updated request-context OIDC path has not yet executed in a fresh Preview runtime. The smoke route was removed again immediately rather than left on the branch. No secret was copied, exposed or weakened.

Genuine real-company analyst-output review remains pending until a new authenticated Preview/runtime can actually be created.

## Two-stage valuation

The AI does not own final valuation math:

1. facts-only packet;
2. deterministic trailing P/E, P/FCF, FCF yield, EV, EV/EBIT and EV/EBITDA are built only from normalized inputs;
3. deterministic valuation provenance maps each available trailing measure to its exact source IDs;
4. analyst proposes explicit Bear/Base/Bull assumptions using verified `valuationInputs`;
5. assumptions convert to `ValuationScenarioInput`;
6. `lib/analysis/valuation.ts` calculates scenario values deterministically;
7. the research publication quality gate runs again;
8. a separate analyst-content quality gate reviews the AI interpretation itself.

Historical valuation ranges are deliberately not synthesized from the existing 18-month price history plus older financial periods. That would introduce misleading point-in-time/look-ahead semantics because old fiscal-year results were not known on their fiscal period-end dates. A future historical valuation range must use genuinely point-in-time-compatible data.

## Research publication quality gate

The research gate currently requires sufficient fundamental and multi-year coverage, fully traceable sources, a fresh primary source, verified primary report evidence, **fully traceable available trailing valuation measures**, complete Bear/Base/Bull scenarios in compatible currency, logical scenario ordering **Bear ≤ Base ≤ Bull**, sufficient technical history, and meaningful support plus either verified resistance or `no_validated_resistance_above`.

Failures are blockers, not silently neutral scores.

## Analyst Content Quality Gate

Schema-valid JSON is not automatically DivLab-quality. `analyst-quality-v1` independently evaluates the generated analyst interpretation before persistence.

A passing analysis currently requires:

- at least 6 of 11 qualitative company factors to be assessable;
- confidence calibrated to the number of remaining unknown factors;
- at least two distinct cited sources;
- strictly differentiated final scenario values: **Bear < Base < Bull**;
- distinct assumptions across all three scenarios;
- DivLab's positive/neutral/negative stock view to be consistent with the deterministic base-case valuation.

A thin, overconfident or internally contradictory result returns `stage: "analyst_quality"` for internal QA but cannot be persisted as an approved DivLab analysis.

## Persistence and immutability

The Supabase model separates facts from interpretation:

- `divlab_analyses` — stable instrument identity / slug;
- `divlab_analysis_versions` — immutable research snapshots;
- `divlab_analysis_sources` — source provenance per research version;
- `divlab_analysis_contents` — one immutable analyst-content row per research version, including analyst-quality certification.

`persist_divlab_analysis_bundle(...)` atomically persists the final research version, source rows, analyst content and its quality-gate result. If analyst-content validation fails, the newly created research version is rolled back too.

Only a fully passing `analyst-quality-v1` result may be written through the current analyst-content RPC. Historical internal rows that predate this gate are explicitly marked `pre-quality-gate`, `publishable=false`; they are not retroactively certified.

Database checks cover packet identity/engine/currency/quality consistency, exact packet-source matching, evidence source IDs, genuine primary evidence, unique Bear/Base/Bull scenarios in parent currency, nested analyst source IDs, primary-source latest-report provenance, non-negative AI usage and the immutable analyst-quality certification.

The normal service-role path has SELECT + INSERT but no UPDATE/DELETE on analyst content. Anon/authenticated users have no table access and cannot execute the bundle RPC.

## Database verification completed on `dividend-lab-dev`

- correct evidence packet creates analysis + version + source atomically and can be rolled back cleanly;
- false primary evidence is rejected before insert and leaves zero rows;
- correct research+analyst bundle creates analysis + version + source + content atomically;
- an EUR analyst scenario against a SEK version is rejected;
- rejection leaves zero analysis/version/source/content rows for the test identity;
- a passing `analyst-quality-v1` certification is accepted and stored;
- a failing analyst-quality certification is rejected by PostgreSQL before a content row is created;
- test fixtures were explicitly removed after smoke verification;
- anon/authenticated cannot read analyst content or execute the bundle RPC;
- service role can SELECT/INSERT content but cannot UPDATE/DELETE through normal grants;
- Supabase security/performance advisors were run after DDL.

The analysis tables intentionally have RLS enabled with no client policies while the feature remains internal.

## Migration-history integrity

Repository migration filenames are aligned with the versions actually registered in `dividend-lab-dev`:

- `20260814163904_create_divlab_analysis_foundation.sql`
- `20260814163935_create_divlab_analysis_persistence_rpc.sql`
- `20260814165534_harden_divlab_analysis_integrity.sql`
- `20260814184227_harden_divlab_analysis_evidence_integrity.sql`
- `20260814185045_create_divlab_analysis_contents.sql`
- `20260814185151_fix_divlab_analysis_content_source_scan.sql`
- `20260814194526_persist_divlab_analyst_quality_gate.sql`

The timestamp alignment was filename-only; the already-reviewed SQL blobs were not altered merely to make migration history look aligned.

## Verification status

- deterministic FX direct/cross-rate derivation: unit tested;
- cross-currency FCF valuation while retaining raw reporting facts: unit tested and Evolution live verified;
- explicit market/reporting/EPS currency semantics: unit tested;
- absolute valuation FX normalization including zero/negative accounting amounts: unit tested;
- deterministic Enterprise Value, EV/EBIT and EV/EBITDA: unit tested including cross-currency statement inputs, zero debt, negative EBITDA and missing FX;
- deterministic valuation provenance: unit tested for complete market/fundamental/FX traceability and missing-source failure;
- research publication blocker for untraceable available valuation measures: unit tested through publishable/non-publishable research packets;
- missing FX remains fail-closed: unit tested;
- converted scenario without required FX source ID: rejected by analyst contract test;
- inverted Bear/Base/Bull valuation: rejected by quality-gate test;
- Analyst Content Quality Gate: unit tested for pass, excessive unknowns/confidence, duplicate assumptions and view/base-case inconsistency;
- passing/failing analyst-quality persistence: verified against `dividend-lab-dev`;
- normalized quarterly provider periods: unit tested;
- primary-report reconciliation v1: unit tested for same-basis H1/FY confirmation and conservative ambiguity handling;
- Vercel request-context OIDC policy: unit tested, live Preview execution pending because Vercel rejected the new deployment at build-rate-limit;
- full repository lint, typecheck, core tests, SEO/news tests, DivBrain tests, Cursor bridge tests and production build passed on branch head `d2831e7b8a35e2660620d7eec00f390776d4e492` before this documentation-only head annotation;
- real analyst narrative generation on the current analyst implementation: not yet live verified.

## Still deliberately not included

1. authenticated end-to-end live execution and qualitative review of the **new AI analyst** on Atlas Copco, Evolution and Embracer;
2. live real-company validation of `primary-report-reconciliation-v1`, EV/EBIT, EV/EBITDA and valuation provenance against the current Atlas Copco, Evolution and Embracer datasets;
3. genuine point-in-time historical valuation ranges and verified peer sets;
4. automatic model-portfolio shortlist → Deep Research trigger;
5. public `/analyses` and `/analyses/[slug]` UI;
6. DivBrain retrieval of published analysis versions;
7. broader first-party source coverage for Oslo and US issuers.

## Product invariant

A good company is not automatically a good stock at today's price, and a good stock is not automatically suitable for every portfolio. DivLab Analys owns the company/stock research. Each portfolio manager owns its own portfolio decision.
