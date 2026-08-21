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

## Code/build validation — 2026-08-21

The bounded 10 MB correction and the complete US Research Coverage v1 slice were revalidated after the live MSFT filing-size check.

Validated code head before this documentation-only certification: `6109c21e8d7a52a1be09340f840a07ce33a1ad09`.

Full-quality Preview CI used temporary branch `agent/us-research-coverage-v1-ci` and commit `74d11546356f780be0bac868925e1d72d2d05ad8`; that commit differs from the validated code head only by the validation `buildCommand` in `vercel.json`.

Results:

- lint: **0 errors**, 3 pre-existing unrelated warnings;
- TypeScript: **green**;
- core tests: **531/531**;
- SEO/news/i18n: **49/49**;
- DivBrain: **518/518**;
- Cursor bridge: **30/30**;
- Next.js optimized build: **green**;
- static pages: **101/101** generated;
- route table includes `/analyses/internal-preview/sources` and `/api/internal/analysis/us-research-coverage`;
- ordinary PR Preview build: **READY**;
- separate full-quality validation Preview: **READY**;
- no production deployment, production write, persistence, publication or merge occurred.

The stacked diff from PR #271 contained 10 files at the validated code head. CI configuration remained outside the PR diff.

This validation certifies code/build/regression behavior only. It does **not** upgrade the real MSFT runtime acceptance below.

## Real Preview acceptance — not yet claimed

A founder-authenticated Preview run against real `MSFT` must prove the following before this phase can be called runtime-verified:

- exact `MSFT` resolves as `US`;
- real SEC annual + 10-Q discovery remains green;
- both canonical SEC documents extract successfully;
- Global Evidence quality = 100/100;
- existing Yahoo financial statement loader returns current + multi-year normalized fundamentals;
- currency context is explicit and usable;
- technical history reaches the existing threshold;
- company classification is `operating_company` with source provenance;
- deterministic valuation provenance is traceable;
- US Research Coverage = 100/100, or exact real blockers are recorded;
- `analysisExecutionEnabled` remains false regardless of readiness;
- no persistence/publication occurs.

Do not claim these runtime points until the signed-in Preview endpoint has actually been exercised.

## Next phase after verified 100/100

If and only if the real MSFT Preview reaches US Research Coverage 100/100, the next slice may evaluate **US Preview Deep Research Execution v1**.

That later slice must remain Preview-only initially and must explicitly decide how one allowlisted US target may enter the existing Analyst/final quality sequence. It must not be folded silently into this readiness PR.
