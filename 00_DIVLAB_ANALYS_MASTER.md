# DIVLAB ANALYS MASTER

Last updated: 2026-08-30
Status: LIVING SOURCE OF TRUTH
Scope: DivLab Analys — Research, Analyst, methodology coverage, source provenance, Preview acceptance, persistence/public read and rollout.

## Purpose

This is the permanent working master for DivLab Analys.

Before material analysis work begins, answer from this file:

1. What is already built and accepted?
2. What is still missing or only partially verified?
3. What is the next safest task to execute?

Dated `00_DIVLAB_MASTER_UPDATE_*` files are historical/acceptance evidence. This file is the canonical current backlog and status board.

## Mandatory working rule

- Read this file before material DivLab Analys work.
- Update it when verified system state changes.
- Never mark work complete merely because code exists.
- Never delete unfinished work to make the backlog look cleaner.
- Never weaken a quality gate, provenance requirement, methodology boundary or auth/write safeguard to obtain a green result.

## Non-negotiable product rules

- Research must be evidence-grounded and source-traceable.
- Analyst may interpret verified Research only; Analyst must not manufacture Research readiness.
- Research quality must be 100/100 where the active methodology requires a quality score.
- Analyst quality must be 100/100 before a publishable result.
- Source IDs used by derived facts or Analyst claims must resolve to known packet sources.
- Primary-source evidence is mandatory where the methodology requires it.
- Company types must use the correct methodology; unsupported types remain fail-closed.
- Preview validation comes before production rollout.
- Persistence and publication are separate explicit actions and remain off during no-write acceptance runs.
- No production write is used as a testing shortcut.
- No merge to `main` or production rollout is authorized merely because a Preview build is green.

## Current architecture inventory

### Supported methodology engines present in source

- `operating_company` -> existing operating-company Deep Research + Analyst.
- `bank` -> bank-v3 specialist Research, P/B scenarios and bank Analyst.
- `investment_company` -> financial-specialist Research and Analyst using NAV/substansvärde methodology.
- `asset_manager` -> financial-specialist Research and Analyst using AUM/FAUM plus traceable valuation methodology.

### Explicitly unsupported / fail-closed today

- insurance
- real_estate
- financial_other
- fund_or_etf
- unknown

These may not fall through to an existing methodology until a separately designed and accepted methodology exists.

### Narrow OMXS30 specialist registry

- `NDA-SE.ST` -> bank
- `SHB-A.ST` -> bank
- `SEB-A.ST` -> bank
- `SWED-A.ST` -> bank
- `INVE-B.ST` -> investment_company
- `INDU-C.ST` -> investment_company
- `EQT.ST` -> asset_manager

Broad provider labels must never automatically promote arbitrary companies into a specialist engine.

## Accepted baseline

### Operating-company / global baseline

Founder-authenticated MSFT Preview execution has previously reached US Research 100/100, final Research 100/100 and Analyst 100/100 with SEC provenance preserved and persistence/publication off.

This is an accepted architecture baseline, not permission for unrestricted global production analysis.

## COMPLETED / ACCEPTED — SPECIALIST RESEARCH P0

### 2026-08-30 — Specialist Research Readiness v2 P0

Status: **ACCEPTED / CLOSED P0**.

Historical acceptance record:

- `00_DIVLAB_MASTER_UPDATE_2026-08-30_SPECIALIST_RESEARCH_P0_ACCEPTANCE.md`

Active PR/branch:

- PR `#289` — `fix(analysis): specialist research readiness v2`
- branch: `agent/specialist-research-readiness-v2`
- PR state after P0 acceptance: Draft / unmerged

### Exact runtime candidate

- runtime source commit: `db6a3fea198b78a4bfdc6094d526809469375839`
- Preview deployment: `dpl_DXwPfuTwHFtJ4nVzC12zGT8TLXmv`
- Preview URL: `https://dividend-1qia3km7a-dividend-lab.vercel.app`
- state: `READY`

Documentation commits after this runtime candidate are not runtime acceptance candidates unless separately revalidated.

### Exact validation candidate

Validation ran from the runtime source tree on a separate validation branch so the test runner did not change runtime behavior.

- validation branch: `validation/specialist-research-p0-db6a3fe`
- validation commit: `9a5ae1f7b109b337c37449c9d0417c8eea07b48d`
- validation deployment: `dpl_CqDAxb7BAdFwgikQCQCaFmhngjYz`
- state: `READY`

Recorded validation:

- focused Specialist P0 tests: **69/69** passed;
- lint: **0 errors**, 3 existing warnings;
- typecheck: passed;
- `npm test`: **611/611** passed;
- SEO tests: **49/49** passed;
- DivBrain tests: **518/518** passed;
- Cursor Bridge tests: **30/30** passed;
- final `next build`: compiled, TypeScript completed, **101/101 static pages** generated.

Database/migration/browser-auth validation remains required at the later integration/production-release gate. P0 acceptance does not claim broad production readiness.

### P0.1 — Investor derived-discount provenance — ACCEPTED

The deterministic Investor discount now explicitly carries both required input lineages:

- official NAV/share source; and
- frozen market-price source.

The specialist canary requires that exact derivation provenance and unknown market provenance cannot pass.

Runtime Investor remained blocked because the primary NAV/share input was not discovered on the accepted candidate, not because the derived-provenance gate failed open.

### P0.2 — final deterministic regression run — ACCEPTED

Focused final source-candidate suite passed 69/69 and includes:

- SEB Fact Book projection and real text-layer shapes;
- SEB release/multi-source Research handling;
- bank funding/capital/Research regressions;
- Investor official-release integration and provenance;
- financial-specialist format/shorthand handling;
- EQT regression behavior;
- specialist canary contract;
- no-write safety;
- fail-closed methodology dispatch.

### P0.3 — repository validation evidence — ACCEPTED FOR P0

Exact commands/results are recorded above. Broader database/migration/browser-auth checks remain integration/release gates and must not be inferred from the P0 build.

### P0.4 — exact final Preview build — ACCEPTED

The exact runtime source commit `db6a3fea198b78a4bfdc6094d526809469375839` reached Vercel `READY` on `dpl_DXwPfuTwHFtJ4nVzC12zGT8TLXmv`.

### P0.5 — founder-authenticated specialist Research canary — ACCEPTED

The required sequence ran on the exact runtime deployment:

1. SEB — 2026-08-30 18:00:20Z
2. Investor — 2026-08-30 18:00:50Z
3. EQT — 2026-08-30 18:01:09Z

Vercel runtime logs confirm all three requests as HTTP 200 on the accepted deployment.

The P0 acceptance contract explicitly permits either `research_ready` or an exact defensible fail-closed blocker. A blocked target must not be forced green by reducing gates.

#### SEB `SEB-A.ST` — ACCEPTED FAIL-CLOSED

- classification: `bank` = expected `bank`;
- Research: `partial`;
- provenance: not fully proven;
- sources: **14 total / 4 primary**;
- evidence: **11**;
- CET1: **17.2%**, confirmed/source-bound;
- ROE: **15.7%**, confirmed/source-bound;
- capital buffer: **2.5 pp**, confirmed/source-bound;
- P/B: **1.931x**, traceable;
- Net ECL: ambiguous;
- Cost/income: not found;
- LCR: not found;
- NSFR: not found;
- persistence: off/null;
- publication: off/null.

Exact blockers:

- `bank_credit_loss_not_confirmed`
- `bank_margin_efficiency_context_missing`
- `bank_funding_context_insufficient`
- `specialist_canary_provenance_incomplete`

The bank engine correctly refused to invent values or use stale fallback.

#### Investor `INVE-B.ST` — ACCEPTED FAIL-CLOSED

- classification: `investment_company` = expected `investment_company`;
- Research: `insufficient`;
- provenance: not proven;
- sources: **3 total / 1 primary**;
- evidence: **0**;
- NAV/share: missing;
- NAV discount/premium: missing;
- persistence: off/null;
- publication: off/null.

Exact blockers:

- `investment_company_nav_per_share_missing`
- `investment_company_discount_missing`
- `specialist_canary_provenance_incomplete`

Observed warning:

- `investment_company_net_debt_ratio_missing`

The runtime bounded discovery did not produce usable current primary Investor evidence. The engine therefore correctly refused to create NAV/share or a discount.

#### EQT `EQT.ST` — ACCEPTED / RESEARCH_READY

- classification: `asset_manager` = expected `asset_manager`;
- Research: `research_ready`;
- provenance: preserved;
- sources: **18 total / 4 primary**;
- evidence: **14**;
- Total AUM: **291 EUR bn**, confirmed/source-bound;
- Fee-generating AUM: **155 EUR bn**, confirmed/source-bound;
- trailing P/E: **34.567x**, confirmed with market/fundamental provenance;
- persistence: off/null;
- publication: off/null.

NAV/share/NAV discount are not required by the asset-manager methodology.

### P0.6 — closure — ACCEPTED

P0 is closed because:

- P0.1 provenance repair is implemented and regression-covered;
- final deterministic/repository validation is recorded;
- one exact runtime candidate reached Preview READY;
- founder-authenticated SEB -> Investor -> EQT canaries ran on that exact candidate;
- each runtime result is either research-ready or exposes an exact defensible blocker;
- persistence/publication stayed off;
- no quality/provenance/methodology gate was reduced;
- the living master, dated acceptance record and PR acceptance text are the required P0 closure artifacts.

P0 acceptance does **not** mean SEB or Investor are Research-ready. Their observed blockers become explicit prerequisites for their later Analyst acceptance.

## OPEN WORK — P1 NEXT

### P1.1 Reconcile bank Analyst-readiness semantics

Current contradiction:

`buildBankResearch` still exposes `analystReady: false` / `bank_analyst_schema_v3_required`, while the inherited stack already contains and uses the bank-v3 Analyst engine.

Required:

- define separate truthful states for Research readiness, Analyst eligibility and publishability;
- remove/version stale contradictory semantics;
- retain all Research and Analyst quality gates.

Acceptance: no consumer can incorrectly conclude that bank Analyst support is absent when the service/dispatch layer supports it.

### P1.2 Resolve SEB runtime Research blocker, then full specialist Analyst acceptance

Current P0 prerequisite blocker:

- current bounded runtime evidence did not source-bind Net ECL, Cost/income, LCR and NSFR sufficiently for bank Research readiness.

Do not call Analyst acceptance complete until Research is actually ready.

Then require on the same no-write execution:

- bank Research quality = 100/100;
- bank Analyst quality = 100/100;
- P/B scenario basis valid;
- Bear < Base < Bull;
- core bank factors source-supported;
- Analyst source IDs known;
- persistence off/null;
- publication off/null.

No quality threshold may be lowered to pass.

### P1.3 Resolve Investor runtime primary-source blocker, then full specialist Analyst acceptance

Current P0 prerequisite blocker:

- accepted runtime canary returned no usable current primary evidence, so explicit NAV/share and discount were missing.

Do not call Analyst acceptance complete until deterministic Research is actually ready.

Then require:

- specialist Research quality = 100/100;
- specialist Analyst quality = 100/100;
- NAV_discount scenario methodology;
- explicit NAV + frozen market-price provenance;
- sufficient source diversity;
- Analyst source IDs known;
- persistence off/null;
- publication off/null.

### P1.4 Full EQT specialist Analyst acceptance

EQT deterministic Research is already `research_ready` on the P0 runtime candidate.

Run the financial-specialist service with no persistence/publication and require:

- Research quality = 100/100;
- Analyst quality = 100/100;
- AUM/FAUM/trailing-P-E methodology preserved;
- P/E scenario basis, not NAV or generic enterprise methodology;
- source provenance preserved;
- persistence off/null;
- publication off/null.

### P1.5 Controlled persistence/public-read verification

Only after no-write 100/100 acceptance for the relevant specialist path.

Validate in controlled DEV/Preview:

- bank specialist schema persistence;
- financial-specialist schema persistence;
- publication requires accepted Research + Analyst gates;
- stored schema dispatches to the correct public reader;
- specialist content is never parsed as operating-company `analyst-v2`;
- existing published operating-company analyses remain readable/unchanged;
- no production write is used for validation.

### P1.6 Consolidate the analysis PR stack

Before `main` integration:

- map older draft PRs as ancestors, historical artifacts or unique changes;
- do not merge overlapping draft PRs independently;
- define one explicit integration order;
- verify merge-base and regression state after consolidation.

## OPEN WORK — P2 BREADTH / HARDENING

### P2.1 Wider OMXS30 specialist canary matrix

Before claiming broad OMXS30 specialist support, verify:

Banks:
- Nordea `NDA-SE.ST`
- Handelsbanken `SHB-A.ST`
- Swedbank `SWED-A.ST`
- SEB `SEB-A.ST`

Investment companies:
- Investor `INVE-B.ST`
- Industrivärden `INDU-C.ST`

Asset manager:
- EQT `EQT.ST`

Each target must use its correct methodology and fail closed on missing official evidence.

### P2.2 Investment-company ambiguity hardening

Before broad reuse of the Investor extractor, add deterministic handling/tests for:

- multiple NAV/share values in one document;
- current versus previous period;
- conflicting primary documents;
- unique current-period binding;
- ambiguous current values -> fail closed;
- stale fallback prevention.

### P2.3 Self-identifying runtime acceptance records

Add fields such as:

- `executedAt`;
- immutable commit/build identifier;
- deployment identifier where safe;
- methodology version;
- relevant Research/Analyst gate versions.

Goal: future screenshots/logs identify exactly which code generated a result.

### P2.4 Additional specialist methodology families

Remain fail-closed until separately designed:

- insurance;
- real estate;
- financial-other;
- ETF/fund.

Each future family requires its own deterministic Research basis, primary-source contract, valuation/scenario methodology, Analyst schema, quality gates, persistence/public-read schema and Preview acceptance matrix.

### P2.5 OMXS30 index analysis

The index requires a separate methodology rather than company annual-report gates.

Future index Research should cover index composition/weights, breadth, regime/technical structure, macro/rates/currency context, defensible earnings/valuation breadth and index-appropriate scenarios/risk.

## OPEN WORK — P3 PRODUCT ROLLOUT

Only after specialist/global stacks are accepted:

- define publicly analyzable instruments;
- define user-facing methodology/failure messages;
- establish AI cost/rate-limit controls;
- add production monitoring/audit logs;
- verify privacy/security for stored requests;
- verify public analysis SEO/canonical/schema behavior;
- define regeneration/versioning policy;
- define stale-analysis/data timestamp policy;
- define publication/editorial-review rules where needed;
- run full repository/database/migration/browser validation on the integration candidate;
- perform production security/compliance review;
- prepare controlled production rollout and monitoring.

## Completed / accepted evidence

### 2026-08 — operating-company/global baseline

Founder-authenticated MSFT Preview run reached Research/Analyst 100/100 with preserved SEC provenance and no persistence/publication.

### 2026-08-22 — Specialist compiled baseline

`8f50cf47b7f0a8804f0b170d005e6da93273621f` reached Vercel READY on `dpl_FYo74xRUbmwTRKWYAcGWLFBfKAE1`. This remains a historical compiled baseline only.

### 2026-08-30 — Specialist Research P0 accepted

Runtime candidate `db6a3fea198b78a4bfdc6094d526809469375839` reached Preview READY and completed founder-authenticated SEB -> Investor -> EQT canaries with no writes. EQT was research-ready; SEB and Investor exposed exact fail-closed blockers. This satisfies the explicit P0 acceptance contract without weakening any gate.

See `00_DIVLAB_MASTER_UPDATE_2026-08-30_SPECIALIST_RESEARCH_P0_ACCEPTANCE.md` for the full acceptance record.

## Acceptance record template

```text
Date:
Scope:
Commit:
Deployment:
Target(s):
Research gate:
Analyst gate:
Primary provenance:
Derived-value provenance:
Persistence:
Publication:
Tests/build:
Known warnings:
Decision: ACCEPTED / BLOCKED
Remaining blocker:
```

## Task update protocol

When starting work:

1. Read this file.
2. Identify the highest relevant unfinished P0/P1/P2 item.
3. Confirm active branch/PR and exact baseline.
4. Inspect current code before patching.

When completing work:

1. Add deterministic regression coverage where applicable.
2. Record exact commit/build/runtime evidence.
3. Update the relevant task here.
4. Move work to completed only when its acceptance condition is met.
5. Preserve dated master updates as historical evidence.

## Historical master references

- `00_DIVLAB_MASTER_UPDATE_2026-08-16_OMXS30_METHODOLOGY_COVERAGE_V1.md`
- `00_DIVLAB_MASTER_UPDATE_2026-08-22_SPECIALIST_RESEARCH_READINESS_V2.md`
- `00_DIVLAB_MASTER_UPDATE_2026-08-30_SPECIALIST_RESEARCH_P0_ACCEPTANCE.md`
- US Research / Preview execution / monster-coverage master updates from the accepted global-analysis stack.

If a historical dated record conflicts with later verified work, this living master controls the current state while the old record remains historical evidence.

## Definition of done for DivLab Analys as a public product

DivLab Analys is not broadly production-ready until all of the following are true:

- every publicly supported company family has an accepted methodology;
- representative real targets pass Research 100/100 + Analyst 100/100;
- provenance survives source discovery -> Research -> derived values -> Analyst -> public read;
- persistence/publication are verified under correct schemas;
- unsupported targets fail closed with useful messages;
- full repository/build/database/migration/browser validation is green on the integration candidate;
- production security/compliance review is complete;
- controlled production rollout and monitoring are prepared.

Until then, this master remains the authoritative list of what is built, what is proven and what remains.