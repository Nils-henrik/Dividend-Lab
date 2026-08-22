# DivLab Master Update — US Research Coverage v1

Date: 2026-08-21
Status: ACTIVE_PR / PREVIEW_ONLY
Parent: `agent/global-evidence-extraction-v1` / PR #271
Branch: `agent/us-research-coverage-v1`
First verification target: `MSFT`

## Purpose

US Research Coverage v1 is the fourth global-equity analysis slice after Global Instrument Discovery, Global Source Discovery and Global Evidence Extraction.

The purpose is narrow: prove whether one straightforward US operating company can populate the deterministic inputs that DivLab's existing operating-company Deep Research stack already requires, without Nordic-only source assumptions and without lowering any existing quality gate.

This phase is not an AI-analysis launch. It is a non-AI readiness proof.

## Locked safety boundary

The following constraints are mandatory for this slice:

- Preview-only. The endpoint and UI must return 404 outside `VERCEL_ENV=preview`.
- Founder/CEO/admin authentication remains mandatory.
- `MSFT` is the only allowlisted US Research Coverage target in v1.
- No call to `createDivLabAiAnalysis`, Analyst generation, escalation models or any other LLM path.
- No Supabase persistence path.
- No publication path.
- No production write or deployment.
- No merge to `main` as part of this task.
- No quality threshold may be weakened.
- No Bear/Base/Bull assumptions may be fabricated just to make the ordinary publication gate green.
- The established Nordic analysis path must remain unchanged.

## Existing contracts reused

US Research Coverage must continue to use the existing DivLab contracts rather than create a second US analysis model:

- `loadDivLabResearchInputs`
- `DivLabResearchInputs`
- `buildDivLabResearchPacket`
- `DivLabResearchPacket`
- `AnalysisSource`
- `AnalysisEvidence`
- `evaluateAnalysisQuality`
- `GlobalEvidenceQualityGate`
- existing company classification and methodology dispatch
- existing financial-statement normalizer
- existing Yahoo market/technical history
- existing currency / FX normalization
- existing valuation provenance

The US-specific code is only a readiness adapter around these contracts.

## Required US Research inputs

The slice must independently verify all of the following for the allowlisted target:

1. US listed-equity identity and operating-company classification.
2. Existing operating-company fundamental methodology support.
3. Current normalized financial-statement coverage.
4. Multi-year normalized financial-statement coverage.
5. Explicit market, reporting and EPS currency semantics, including auditable FX when currencies differ.
6. Current market price plus sufficient technical history and support/resistance coverage.
7. Source-linked company classification provenance.
8. Deterministic valuation-input provenance using the existing market/fundamental/FX source map.
9. Fresh primary SEC evidence that has already passed Global Evidence Extraction v1 at 100/100 and also satisfies the ordinary Research primary-source/evidence checks.

## Facts packet versus final publication gate

US Research Coverage builds the ordinary `DivLabResearchPacket` with `valuationScenarios: []` on purpose.

That means `valuationScenarioCoverage` is expected to remain false in the facts-only packet because Bear/Base/Bull assumptions belong to the later Analyst stage. This is not a relaxed quality gate and must not be rewritten as a passing publication check.

The dedicated US Research Coverage readiness score may reach 100/100 only when all deterministic prerequisite checks above are green. The ordinary `packet.qualityGate.publishable` is still allowed — and expected — to remain false until the later Analyst stage supplies explicit scenarios and the exact same publication gate is rerun.

## Runtime chain

For `MSFT`, the Preview endpoint must re-run the entire chain server-side rather than trust browser state:

1. resolve the exact global equity target;
2. enforce US exchange + MSFT v1 allowlist;
3. run Global Source Discovery;
4. require `readyForEvidenceExtraction`;
5. run Global Evidence Extraction;
6. require Evidence 100/100;
7. run the existing `loadDivLabResearchInputs` for `MSFT` / `US`;
8. merge the verified SEC `AnalysisSource` + `AnalysisEvidence` into the existing facts input set;
9. build the ordinary facts-only `DivLabResearchPacket`;
10. evaluate US Research Coverage from existing packet quality checks plus the established evidence gate;
11. return exact blockers if any prerequisite fails.

Every step is fail-closed.

## Preview API

Route:

`GET /api/internal/analysis/us-research-coverage?yahooSymbol=MSFT`

Required response semantics:

- `researchCoverageReady`: readiness of deterministic US Research inputs only.
- `analysisExecutionEnabled`: always `false` in v1.
- exact coverage checks and blockers.
- ordinary facts-packet Research score for observability.
- explicit indication that valuation-scenario coverage is deferred rather than manufactured.
- compact summary of currencies, financial history, technical sessions and source/evidence counts.

## Preview UI

The internal source/evidence Preview page gains a separate **US Research Coverage v1 · MSFT** operator.

The operator may run only the new Preview endpoint. It must clearly display:

- US Research Coverage score;
- each deterministic readiness check;
- current ordinary facts-packet Research score;
- that analysis execution remains disabled;
- exact blockers when readiness is below 100/100.

## Automated regression requirements

Tests must prove at minimum:

- deterministic prerequisite readiness can reach 100/100 while the ordinary valuation-scenario publication check remains deferred;
- evidence below 100/100 blocks US readiness;
- unsupported company type blocks readiness;
- missing currency semantics block readiness;
- existing Research blockers propagate into US readiness;
- non-US targets fail closed;
- route stays Preview-only and founder-role protected;
- route stays MSFT-only in v1;
- route re-verifies source discovery and evidence before ordinary Research loading;
- route cannot call AI, persist or publish;
- facts packet is built with an empty scenario list, not invented assumptions.

## Live MSFT source-compatibility correction — 2026-08-21

Before the founder-authenticated Preview acceptance, the current canonical SEC filings were independently checked against the hard fetch bounds.

Verified SEC filing sizes:

- Microsoft FY2026 `10-K`, filed 2026-07-29: primary HTML document `msft-20260630.htm` = **8,585,501 bytes**.
- Microsoft Q3 FY2026 `10-Q`, filed 2026-04-29: primary HTML document `msft-20260331.htm` = **7,731,948 bytes**.

The Global Evidence Extraction v1 byte cap of `8_000_000` would therefore correctly fail closed on the real current MSFT 10-K as `oversized`, even though the canonical filing is otherwise valid.

US Research Coverage v1 adjusts only the hard document byte cap to `10_000_000` so the verified MSFT filing can be read. This is a bounded transport-capacity correction, not a quality-gate relaxation.

The following safety bounds remain unchanged:

- maximum 2 SEC documents;
- exact SEC archive host/path allowlist;
- sequential fetching;
- 12-second timeout;
- maximum 1 redirect, revalidated against the same allowlist;
- text-like SEC content types only;
- extracted evidence still capped at 12,000 characters;
- minimum meaningful evidence text remains 800 characters;
- Evidence quality must still reach 100/100.

A regression test pins the 10 MB bound and verifies that the known 8,585,501-byte MSFT 2026 10-K fits without changing the remaining limits.

## Live Yahoo/Vercel runtime correction — 2026-08-21

A separate read-only Vercel live-data probe was used to exercise the current product code against real MSFT sources without AI, persistence, publication or production writes.

The first probe proved:

- target resolution was correct for `MSFT` / `US`;
- SEC source discovery was ready with one current `10-K` and one current `10-Q`;
- Global Evidence Extraction reached **100/100** with no blockers;
- Yahoo chart/history worked with **376 sessions** and explicit `USD` currency;
- the financial research loader still failed closed as `financial_statements_unavailable` because the existing Yahoo crumb session could not be established in Vercel.

Staged diagnostics then proved the failure occurred before the crumb request: a server-side request to the legacy `https://finance.yahoo.com/` session-home endpoint threw `TypeError` in the Vercel Preview runtime, so no usable cookie could be established.

A separate bounded test of Yahoo's current cookie bootstrap proved that `https://fc.yahoo.com/` behaves correctly for this server-side flow:

- intentional response status: **404**;
- allowed session cookie returned: **A3**;
- subsequent Yahoo crumb request: **200**;
- crumb format: valid.

The production code correction is deliberately narrow and lives only in `lib/analysis/yahoo-financials.ts`:

- the shared `getYahooCrumbSession` contract is unchanged;
- model-portfolio Yahoo behavior is unchanged;
- only the exact legacy session-home request inside the DivLab Analys financial loader is rewritten to `https://fc.yahoo.com/`;
- the actual `quoteSummary` request still uses the original fetch implementation unchanged;
- no fallback data provider, retry loop or quality-gate relaxation was added.

Regression coverage is locked in `tests/divlab-yahoo-financial-session-contract.test.ts`.

## Live product-code MSFT research proof — 2026-08-21

After the Yahoo correction, the same read-only Vercel live-data probe successfully ran the current product chain through real MSFT data:

- target: `MSFT`, exchange `US`;
- Global Source Discovery: ready;
- SEC primary sources: **2** (`10-K` + `10-Q`);
- Global Evidence quality: **100/100**;
- evidence blockers/failures: none;
- Yahoo research loader: **OK**;
- market/reporting/EPS currency: **USD**;
- market-history sessions loaded: **376**;
- technical sessions used by the canonical packet: **320**;
- normalized historical financial periods: **4**;
- years covered: **3**;
- company type: `operating_company`;
- methodology status: supported;
- merged canonical source count: **4**;
- merged primary source count: **2**;
- merged evidence count: **2**.

The dedicated US Research Coverage gate reached **100/100**, with all nine deterministic checks green:

1. `usOperatingCompanyTarget = true`
2. `methodologyCoverage = true`
3. `currentFinancialCoverage = true`
4. `multiYearFinancialCoverage = true`
5. `currencyCoverage = true`
6. `marketAndTechnicalHistoryCoverage = true`
7. `classificationProvenance = true`
8. `valuationInputProvenance = true`
9. `freshPrimaryEvidenceCoverage = true`

The ordinary facts-only Research packet scored **91/100** and remained non-publishable solely because `valuationScenarioCoverage` is deliberately deferred to the later Analyst stage. This is the intended fail-closed behavior and must not be altered by inventing Bear/Base/Bull scenarios during facts loading.

This result is the first real Vercel live-data proof that the existing generalized product code can take MSFT through source discovery -> SEC evidence -> financial/history loading -> canonical packet -> US Research Coverage **100/100**.

It is **not** the formal founder-authenticated endpoint acceptance, because the proof was executed through a separate read-only Vercel probe rather than the signed-in `/api/internal/analysis/us-research-coverage` route. The founder/CEO/admin and Preview-protection boundaries remain intact and were not bypassed.

## Superseding code/build validation — 2026-08-21

The previous 531-test certification remains useful history, but the current Yahoo-corrected code head was fully revalidated.

Validated product-code head: `a350b59c21dad9a4826aaf88268a01a32095771d`.

Full-quality Preview CI used temporary branch `agent/us-research-coverage-v1-ci` and CI commit `2c5f5de678ce3c1dfbb550bd3e63efb85b70a4f5`. The CI-only commit differs from the validated product code only by the temporary full validation `buildCommand` in `vercel.json`.

Results:

- lint: **0 errors**, exactly 3 pre-existing unrelated warnings;
- TypeScript: **green**;
- core tests: **532/532**, 129 suites;
- SEO/news/i18n step: **passed**;
- DivBrain: **518/518**, 115 suites;
- Cursor bridge: **30/30**, 10 suites;
- optimized Next.js build: **green**;
- static pages: **101/101** generated;
- route table includes `/api/internal/analysis/us-research-coverage`;
- full-quality Preview validation deployment `dpl_42qbJE8SMBwesUZoSoW4b25o3ovr`: **READY**;
- ordinary PR Preview for the product-code head: **READY**;
- final read-only live-data probe deployment `dpl_E39S3w1cETWb9nV4SBApT6rsRE8L`: **READY**;
- no production deployment, production write, persistence, publication or merge occurred.

The regression suite includes the new Yahoo financial-session bootstrap contract test in addition to the existing Global Evidence and US Research Coverage tests.

Any documentation-only commits after `a350b59c21dad9a4826aaf88268a01a32095771d` do not change this code-validation result.

## Real Preview acceptance — not yet claimed

A founder-authenticated Preview run against real `MSFT` must still prove the following before this phase can be called formally runtime-verified:

- exact `MSFT` resolves as `US`;
- real SEC annual + 10-Q discovery remains green;
- both canonical SEC documents extract successfully;
- Global Evidence quality = 100/100;
- existing Yahoo financial statement loader returns current + multi-year normalized fundamentals;
- currency context is explicit and usable;
- technical history reaches the existing threshold;
- company classification is `operating_company` with source provenance;
- deterministic valuation provenance is traceable;
- US Research Coverage = 100/100;
- `analysisExecutionEnabled` remains false regardless of readiness;
- no persistence/publication occurs.

The separate live-data proof above gives strong evidence that the generalized data chain is now capable of reaching these values, but it does not replace the required signed-in founder endpoint run.

Do not enable global `canRunAnalysis`, do not open production execution and do not claim formal founder acceptance until the actual protected Preview endpoint has been exercised.

## Next phase after verified 100/100

If and only if the real founder-authenticated MSFT Preview endpoint reaches US Research Coverage 100/100, the next slice may evaluate **US Preview Deep Research Execution v1**.

That later slice must remain Preview-only initially and must explicitly decide how one allowlisted US target may enter the existing Analyst/final quality sequence. It must also preserve the newly locked global product direction: the same canonical engine will ultimately power both **Light Analysis** and **Deep Analysis**, with Deep Analysis carrying the full Research + Analyst + scenario/outlook depth.

It must not be folded silently into this readiness PR.
