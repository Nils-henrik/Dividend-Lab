# DivLab Master Update — Analysis Monster Gap Register v1

Date: 2026-08-22
Status: OBSERVATION_COMPLETE / PATCH_PHASE_ALLOWED
Observation branch: `agent/analysis-monster-coverage-pass-v1`
Frozen observation commit: `1db2a37b4a7f7018e8d426eab7b245bcc74fcd80`
Frozen Preview deployment: `dpl_FMYNvg1naNmdUCjKSCmGKBF7gRzr`
Deployment state: READY
Parent architecture: PR #276
Observation PR: #277

## Result in one sentence

The broad pass found **no P0 safety failures**. DivLab routed unsupported methodologies fail-closed, produced successful 100/100 no-persist/no-publish Deep Research for both a Nordic operating company and a verified US operating company, while exposing five real P1 integration gaps plus several lower-priority coverage boundaries.

## Matrix coverage

27 real targets were exercised across Sweden, Norway, Denmark, Finland and the US. The matrix included:

- operating companies across industrials, technology/telecom, healthcare, shipping and energy;
- banks;
- insurance;
- real estate;
- financial-other;
- investment companies;
- asset manager;
- ETF boundaries;
- US domestic issuers;
- a foreign-private-issuer / ADR boundary.

Every currently modeled DivLab company family was exercised directly or through a safe unresolved boundary.

## Baseline certification on the frozen commit

Before the live matrix, the exact frozen commit passed:

- lint: 0 errors; the same three pre-existing warnings only;
- TypeScript;
- repository core regression suite;
- SEO regression suite;
- DivBrain: 518/518;
- Cursor Bridge: 30/30;
- optimized Next.js production build;
- the existing MSFT live Research probe: SEC Evidence 100/100 and US Research Coverage 100/100.

## P0 — none

No finding showed:

- an unsupported company type entering the generic operating-company engine;
- a US specialist family bypassing the operating-company coverage gate;
- a quality threshold being lowered;
- a partial/failed output being persisted or published;
- SEC provenance being lost after successful US Analyst execution.

Insurance and real estate remained correctly fail-closed. ETF and foreign-private-issuer boundaries also failed closed rather than being guessed into a supported path.

## P1 — patch candidates

### P1-A — Bank engine is advertised but representative SEB cannot reach bank Research readiness

Target: `SEB-A.ST`

Observed:

- classification: `bank`, high confidence;
- engine dispatch: `bank`;
- specialist execution stops at `bank_research`;
- reason: `bank_research_not_ready`;
- no persistence/publication occurred.

This is the highest-priority specialist-engine integration gap because the engine exists and is presented as verified but the representative registry-backed bank cannot complete its pre-Analyst Research stage.

### P1-B — Investment-company engine cannot complete Investor

Target: `INVE-B.ST`

Observed:

- exact registry classification: `investment_company`, high confidence;
- engine dispatch: `financial_specialist`;
- specialist execution stops at `specialist_research`;
- reason: `financial_specialist_research_not_ready`;
- ordinary loader exposed 0 historical fundamental periods and no report evidence in this run.

### P1-C — Asset-manager engine cannot complete EQT

Target: `EQT.ST`

Observed:

- exact registry classification: `asset_manager`, high confidence;
- engine dispatch: `financial_specialist`;
- specialist execution stops at `specialist_research`;
- reason: `financial_specialist_research_not_ready`.

Unlike Investor, EQT had broad source/evidence coverage, so this likely points to specialist metric extraction/readiness rather than generic document discovery alone.

### P1-D — US ordinary operating-company source discovery is not robust enough for Exxon

Target: `XOM`

Observed:

- classification: `operating_company`;
- ordinary market/fundamental Research inputs available;
- SEC discovery status: `candidate_only`;
- only an interim 10-Q was selected in the bounded discovery result;
- no annual primary source, therefore no Evidence/US Coverage execution.

This is a source-discovery robustness gap because MSFT and JNJ both reached SEC Evidence 100/100 and US Research Coverage 100/100 under the same architecture.

### P1-E — Financial-other fixture failed before methodology because the exact market-history identifier was unavailable

Observed target: `AVANZ.ST`

Result: `market_history_unavailable`.

This requires root-cause verification before product code changes. The likely issue is target identity/transport symbol rather than the methodology gate itself; the patch phase must first establish the correct canonical Yahoo identity and then rerun this family.

## Additional coverage weaknesses to patch or explicitly accept

These were visible in the matrix even though the first probe did not emit them as formal P1 records.

### Nordic operating-company primary-source inconsistency

- `ERIC-B.ST`: 0 historical fundamental periods, 0 primary sources, 0 evidence; facts score 64 before Analyst scenarios.
- `EQNR.OL`: historical fundamentals present, but 0 primary sources / 0 evidence; facts score 64 and technical-level coverage also failed.
- `MAERSK-B.CO`: strong source/evidence and multi-year fundamentals, but technical-level coverage failed; facts score 82.

Volvo, Novo Nordisk and Nokia all reached the expected facts-only 91/100 state where the only deferred check was Analyst valuation scenarios. The disparity shows that Nordic Research coverage is issuer-dependent and needs a deliberate coverage audit rather than a blanket assumption that every Nordic equity has equal primary-source depth.

### Non-OMXS30 bank evidence depth

- `DNB.OL`: correct high-confidence bank classification but 0 primary evidence in the ordinary Research packet.
- `DANSKE.CO`: correct bank classification with substantially better evidence coverage.

Before opening bank analysis broadly beyond the exact Swedish registry, the bank Research extraction/readiness contract should be tested against multiple banks after SEB is repaired.

### Global specialist/fundamental-history limitations

- `JPM`: correct bank classification/engine but 0 historical fundamental periods in the generic loader; US operating coverage correctly blocks it.
- `PLD`: correct real-estate classification, engine null, 0 historical periods; safely blocked.
- `BLK`: provider metadata deterministically yields `financial_other`, engine null, even though it is economically an asset manager. This is safe but highlights that the current asset-manager promotion is Nordic symbol-exact rather than globally generalized.

These are P2 until their specialist methodology is explicitly expanded globally.

## INFO / safe boundaries

### ETF

- `XACT-OMXS30.ST`: market data exists but financial statements are unavailable; loader stops safely.
- `SPY`: global equity resolver does not resolve it as an equity analysis target; safely excluded.

### Foreign private issuer / ADR

- `NVO`: detected as an operating company from market metadata, but SEC discovery only found a 20-F candidate and did not satisfy the domestic 10-K/10-Q contract. The path remained fail-closed.

A future foreign-private-issuer vertical may support 20-F/6-K, but the domestic SEC rules must not be loosened to make this pass.

## Successful full Analyst proofs

### Volvo — Nordic operating company

`VOLV-B.ST` completed full no-persist/no-publish operating-company Deep Research:

- final Research: 100/100, publishable;
- Analyst: 100/100, publishable;
- persistence: null;
- primary model initially produced a domain-schema failure;
- the existing bounded escalation path retried with `openai/gpt-5.6-terra` and completed successfully;
- estimated total model cost: 68,073 USD micros (~$0.0681).

This also proves that the bounded Analyst repair/escalation path works on a real Nordic case without lowering the contract.

### Microsoft — US operating company

`MSFT` completed the prepared-Research US Analyst path:

- SEC Evidence: 100/100;
- US Research Coverage: 100/100;
- final Research: 100/100, publishable;
- Analyst: 100/100, publishable;
- SEC source IDs preserved: true;
- SEC evidence IDs preserved: true;
- persistence: null;
- model: `openai/gpt-5.6-luna`;
- estimated model cost: 5,920 USD micros (~$0.00592).

This is a direct service-level proof of the core PR #276 architecture. It does not replace the separate founder-session authorization proof for the protected HTTP route itself.

## Patch order

Patch work is now authorized in this order:

1. explain and repair SEB bank Research readiness;
2. explain and repair Investor/EQT specialist Research readiness without weakening methodology contracts;
3. repair XOM annual SEC discovery while retaining hard bounds and exact primary-form rules;
4. verify/correct the Avanza canonical target fixture before touching product code;
5. audit Nordic primary-source misses for Ericsson and Equinor;
6. classify Maersk technical-level failure as algorithmic defect vs legitimate no-validated-level state;
7. rerun the complete 27-target matrix after patches;
8. only promote a patch if no P0 appears and previously successful Volvo/MSFT paths remain 100/100.

## Non-goals for this patch cycle

Do not add insurance, real-estate, ETF or foreign-private-issuer methodology merely to increase pass count. Those are separate product slices requiring their own deterministic financial methodology and evidence contracts.
