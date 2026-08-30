# DivLab Master Update — Specialist Research P0 Acceptance

Date: 2026-08-30
Status: ACCEPTED_P0 / FAIL_CLOSED_RUNTIME_EVIDENCE / PREVIEW_ONLY
Branch: `agent/specialist-research-readiness-v2`
PR: `#289` — `fix(analysis): specialist research readiness v2`

## Decision

Specialist Research Readiness v2 P0 is accepted under the explicit canary rule defined in `00_DIVLAB_ANALYS_MASTER.md`:

- a target may be `research_ready`; or
- it may remain blocked when the runtime canary exposes an exact, defensible fail-closed blocker;
- gates, provenance requirements, methodology boundaries, auth controls, persistence controls and publication controls must not be weakened merely to obtain a green result.

The acceptance goal is correct deterministic Research readiness, not the highest nominal pass count.

This P0 acceptance is **not** a production release, **not** a merge authorization, and **not** full specialist Analyst acceptance.

## Exact runtime candidate

- Runtime source commit: `db6a3fea198b78a4bfdc6094d526809469375839`
- Runtime Preview deployment: `dpl_DXwPfuTwHFtJ4nVzC12zGT8TLXmv`
- Runtime Preview URL: `https://dividend-1qia3km7a-dividend-lab.vercel.app`
- Vercel state: `READY`
- PR remained Draft and unmerged.

Documentation commits after this point must not be mistaken for the accepted runtime candidate above.

## Exact validation evidence

A separate validation branch was built directly from the runtime candidate so test-runner configuration did not alter runtime code.

- Validation branch: `validation/specialist-research-p0-db6a3fe`
- Validation commit: `9a5ae1f7b109b337c37449c9d0417c8eea07b48d`
- Validation deployment: `dpl_CqDAxb7BAdFwgikQCQCaFmhngjYz`
- Vercel state: `READY`

Executed validation chain:

1. Focused Specialist P0 deterministic suite — **69/69 passed**.
2. `npm run lint` — **0 errors**, 3 pre-existing warnings.
3. `npm run typecheck` — passed.
4. `npm test` — **611/611 passed**.
5. `npm run test:seo` — **49/49 passed**.
6. `npm run test:divbrain` — **518/518 passed**.
7. `npm run test:cursor-bridge` — **30/30 passed**.
8. `npm run build` — compiled successfully, TypeScript completed and **101/101 static pages** generated.

Database/migration/browser-auth release validation remains a later integration/production-release gate. No claim of broad production readiness is made by this record.

## Founder-authenticated runtime canary evidence

The founder-authenticated specialist canary was executed in the required order on the exact runtime deployment above.

Vercel runtime logs confirm three HTTP 200 POST executions on `dpl_DXwPfuTwHFtJ4nVzC12zGT8TLXmv`:

1. 2026-08-30 18:00:20Z — SEB
2. 2026-08-30 18:00:50Z — Investor
3. 2026-08-30 18:01:09Z — EQT

Every canary retained:

- persistence = null/off;
- publication = null/off;
- no Analyst model call;
- founder/CEO/admin auth boundary;
- exact target allowlist;
- deterministic Research-only execution.

## SEB — accepted fail-closed runtime result

Target: `SEB-A.ST`

Classification:

- detected: `bank`
- expected: `bank`
- classification: correct

Runtime state:

- Specialist canary: `BLOCKED`
- Research: `partial`
- Provenance: `EJ BEVISAD`
- Sources: **14 total / 4 primary**
- Evidence: **11 posts**
- Persistence: **AV**
- Publication: **AV**

Confirmed/traceable facts retained:

- CET1: **17.2%**, confirmed, source-bound to the current official release.
- ROE: **15.7%**, confirmed, source-bound to the current official release.
- Capital buffer: **2.5 pp**, confirmed, source-bound to the current official release.
- P/B: **1.931x**, traceable through the established market/fundamental provenance chain.

Fail-closed facts:

- Net ECL level: ambiguous.
- Cost/income: not found.
- LCR: not found.
- NSFR: not found.

Exact blockers:

- `bank_credit_loss_not_confirmed`
- `bank_margin_efficiency_context_missing`
- `bank_funding_context_insufficient`
- `specialist_canary_provenance_incomplete`

Observed warnings include:

- `bank_nim_not_confirmed`
- `bank_cost_income_not_confirmed`
- `bank_regulatory_cet1_requirement_not_confirmed`
- `bank_lcr_not_confirmed`
- `bank_nsfr_not_confirmed`

Acceptance decision: **ACCEPTED FAIL-CLOSED**.

Reason: the bounded runtime evidence did not establish every required bank core metric with source-bound current-period provenance. The engine refused to guess, refused stale fallback and kept the target blocked exactly as required by the P0 contract.

This blocker must be resolved before SEB can pass full specialist Analyst acceptance.

## Investor — accepted fail-closed runtime result

Target: `INVE-B.ST`

Classification:

- detected: `investment_company`
- expected: `investment_company`
- classification: correct

Runtime state:

- Specialist canary: `BLOCKED`
- Research: `insufficient`
- Provenance: `EJ BEVISAD`
- Sources: **3 total / 1 primary**
- Evidence: **0 posts**
- Persistence: **AV**
- Publication: **AV**

Fail-closed facts:

- NAV/share: missing.
- Discount/premium to NAV: missing.

Exact blockers:

- `investment_company_nav_per_share_missing`
- `investment_company_discount_missing`
- `specialist_canary_provenance_incomplete`

Observed warning:

- `investment_company_net_debt_ratio_missing`

Acceptance decision: **ACCEPTED FAIL-CLOSED**.

Reason: on the exact live Preview candidate the bounded current official-source discovery did not return a usable Investor evidence item. Without explicit primary NAV/share evidence, the deterministic discount was correctly not produced even though the code-level derivation now requires both NAV and frozen market-price lineage.

This blocker must be resolved before Investor can pass full specialist Analyst acceptance.

## EQT — accepted research-ready runtime result

Target: `EQT.ST`

Classification:

- detected: `asset_manager`
- expected: `asset_manager`
- classification: correct

Runtime state:

- Specialist canary: `READY`
- Research: `research_ready`
- Provenance: `BEVARAD`
- Sources: **18 total / 4 primary**
- Evidence: **14 posts**
- Persistence: **AV**
- Publication: **AV**

Confirmed facts:

- Total AUM: **291 EUR bn**, confirmed and source-bound.
- Fee-generating AUM: **155 EUR bn**, confirmed and source-bound.
- Trailing P/E: **34.567x**, confirmed with market/fundamental provenance.

NAV/share and NAV discount remain irrelevant/missing for the asset-manager methodology and do not block EQT.

Acceptance decision: **ACCEPTED / RESEARCH_READY**.

## P0.1 — Investor derived-discount provenance

Accepted in code and regression:

- derived `discountToNavPct` explicitly binds both the NAV input source and frozen market-price input source;
- canary requires this exact lineage;
- unknown or missing market provenance cannot pass;
- Investor remains fail-closed at runtime because the official NAV/share input itself was not discovered, not because the provenance gate was weakened.

## P0 closure

P0.1 through P0.5 now have the acceptance evidence required by the living Analysis Master.

P0.6 is satisfied by:

- this dated acceptance record;
- the corresponding living-master update;
- the PR #289 acceptance update.

Specialist Research P0 is therefore **CLOSED / ACCEPTED**.

## What this does not authorize

This record does not authorize:

- merging PR #289 directly to `main`;
- production deployment;
- persistence or publication;
- treating SEB or Investor as Research-ready;
- running Analyst on blocked Research as if it passed;
- lowering any Research/Analyst quality threshold;
- claiming broad OMXS30 specialist support.

## Next work

Proceed to the living master P1 queue.

Immediate dependencies:

1. Reconcile stale bank Analyst-readiness semantics.
2. Before SEB Analyst acceptance, resolve the observed runtime source/evidence blocker so bank Research can reach its required quality gate.
3. Before Investor Analyst acceptance, resolve bounded current primary-source discovery so explicit NAV/share and its NAV/market derivation provenance are available at runtime.
4. EQT may proceed to full no-write specialist Analyst acceptance because its deterministic Research canary is already `research_ready`.
5. Controlled persistence/public-read and stack consolidation remain later gates.
