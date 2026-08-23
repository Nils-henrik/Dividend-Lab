# DIVLAB ANALYS MASTER

Last updated: 2026-08-23
Status: LIVING SOURCE OF TRUTH
Scope: DivLab Analys — Research, Analyst, methodology coverage, source provenance, Preview acceptance, persistence/public read and rollout.

## Purpose

This is the permanent working master for DivLab Analys.

Use this file to answer three questions before any new analysis work begins:

1. What is already built and accepted?
2. What is still missing or only partially verified?
3. What is the next safest task to execute?

Dated `00_DIVLAB_MASTER_UPDATE_*` files remain historical decision/acceptance records. They are useful evidence, but this file is the canonical current backlog and status board.

## Mandatory working rule

Every material DivLab Analys task must start by reading this file together with the active engineering/build rules.

When work changes the real state of the system, update this file in the same workstream.

Never mark an item complete because code merely exists. Completion requires the evidence named in the acceptance rule for that item.

Never delete an unfinished item to make the backlog look cleaner. Move it to `Completed / accepted` only when its acceptance evidence exists.

Do not weaken a quality gate, provenance requirement, methodology boundary or auth/write safeguard merely to obtain a green result.

## Non-negotiable product rules

- Research must be evidence-grounded and source-traceable.
- Analyst must only interpret verified Research; it must not manufacture Research readiness.
- Research quality must be 100/100 where the active methodology requires a quality score.
- Analyst quality must be 100/100 before any publishable result.
- Source IDs used by derived facts or Analyst claims must resolve to known packet sources.
- Primary-source evidence is mandatory where the methodology requires it.
- Company types must use the correct methodology. Unsupported types remain fail-closed.
- Preview validation comes before any production rollout.
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

These must not fall through to a generic company or financial-specialist engine until a separately designed methodology is implemented and accepted.

### Existing specialist registry inherited from OMXS30 methodology work

- `NDA-SE.ST` -> bank
- `SHB-A.ST` -> bank
- `SEB-A.ST` -> bank
- `SWED-A.ST` -> bank
- `INVE-B.ST` -> investment_company
- `INDU-C.ST` -> investment_company
- `EQT.ST` -> asset_manager

The registry is intentionally narrow. Broad provider labels such as Financial Services must never automatically promote an arbitrary company into a specialist engine.

## Accepted baseline

### Operating company / US path

- Founder-authenticated MSFT Preview execution has previously reached US Research 100/100, final Research 100/100 and Analyst 100/100.
- SEC source and evidence provenance were preserved.
- Persistence and publication remained off.
- This is an accepted architecture baseline for the operating-company/global stack, not permission for unrestricted global production analysis.

### Specialist Research code baseline

Runtime code baseline previously verified by Vercel build:

- commit: `8f50cf47b7f0a8804f0b170d005e6da93273621f`
- deployment: `dpl_FYo74xRUbmwTRKWYAcGWLFBfKAE1`
- result: `READY`

That build proves Next.js compile/TypeScript/build success for that exact runtime code baseline. It is not by itself proof of all repository tests, runtime canaries or release readiness.

Current active specialist work:

- PR `#289` — `fix(analysis): specialist research readiness v2`
- branch: `agent/specialist-research-readiness-v2`
- state: Draft / unmerged

## What is built in Specialist Research Readiness v2

### SEB

Built:

- bounded issuer-specific Nasdaq/CNS source discovery;
- SEB Fact Book attachment selection for dedicated multi-document Research;
- deterministic current-period projection from the Fact Book;
- source-bound Net ECL extraction;
- source-bound Cost/income extraction;
- source-bound LCR extraction;
- source-bound NSFR extraction;
- separate source-bound CET1 extraction from official release evidence;
- separate source-bound ROE extraction from official release evidence;
- separate source-bound capital-buffer extraction from official release evidence;
- multi-document bank metric/funding/capital extraction;
- newer ambiguous evidence blocks stale fallback;
- P/B valuation provenance through market/fundamental inputs;
- deterministic regression proving split-source `research_ready` assembly.

Important boundary:

- Missing or ambiguous metrics remain missing/ambiguous.
- No metric may be invented from unrelated prose or ratios.

### Investor

Built:

- bounded period-only CNS discovery within the existing request ceiling;
- allowlisted Nasdaq issuer release-body retrieval;
- explicit NAV/share extraction from Investor-style official wording;
- protection against treating total NAV/equity/market cap as NAV per share;
- deterministic discount/premium calculation from NAV/share and frozen current market price;
- regression for successful official-release NAV extraction;
- regression proving fail-closed behavior when explicit NAV/share is absent.

### EQT

Built/inherited:

- asset-manager methodology classification;
- Total AUM extraction;
- fee-generating AUM extraction;
- trailing P/E valuation basis;
- AUM/FAUM format normalization and regression coverage;
- existing `research_ready` regression role.

### Preview specialist canary

Built:

- Preview-only endpoint `/api/internal/analysis/specialist-research-canary`;
- target allowlist is exactly `SEB-A.ST`, `INVE-B.ST`, `EQT.ST`;
- founder/CEO/admin authentication before Research starts;
- deterministic Research only;
- no Analyst model call;
- no `persist` option;
- no `publish` option;
- persistence result fixed to null/off;
- publication result fixed to null/off;
- UI surfaces classification, Research status, source/evidence counts, metrics, source IDs, blockers and warnings;
- Preview page is noindex and unavailable outside Preview.

Earlier canary attempts returned HTTP 401 before Research because that Preview hostname had no active DivLab session. Those requests are auth-precondition observations only and do not count as SEB/Investor/EQT Research acceptance.

## OPEN WORK — P0 NOW

These items block completion of Specialist Research Readiness v2.

### P0.1 Investor derived-discount provenance

Problem:

`discountToNavPct` is calculated from two inputs: verified NAV/share and frozen current market price. The current derived metric primarily carries the NAV source ID while the market source is verified separately in the packet/canary.

Required fix:

- make the derived discount explicitly trace both inputs;
- preferred implementation: attach both NAV source ID and market-price source ID to the derived metric, or use an explicit derivation-provenance object;
- update the specialist canary to require this exact lineage;
- add regression tests proving a market source is part of the derivation and that an unknown market source cannot pass provenance.

Acceptance:

Investor discount provenance must identify both the official NAV input and the frozen market-price input without relying on an implicit side check.

### P0.2 Final deterministic regression run

Run the focused tests on the final source candidate for:

- SEB Fact Book projection;
- SEB real text-layer shapes;
- SEB real release shape;
- SEB multi-source Research readiness;
- bank funding/capital/Research regressions;
- Investor release integration;
- financial-specialist shorthand/format handling;
- EQT regression;
- specialist canary contract;
- specialist no-write safety;
- methodology dispatch fail-closed behavior.

Acceptance:

All focused deterministic tests pass on the exact source candidate that will be used for runtime canary.

### P0.3 Repository validation evidence

Do not equate a Vercel `next build` with the whole repository validation set.

Required before stack merge acceptance:

- `npm test`;
- `npm run lint`;
- `npm run typecheck` if not already part of the exact validation path;
- broader `test:all` / database / migration / browser-auth validation required by the parent master before production release.

Acceptance:

Record the exact commit and exact commands/results. No vague `CI looked green` acceptance.

### P0.4 Exact final Preview build

After P0 code changes and tests, obtain one READY Preview build for the exact source candidate.

Acceptance record must contain:

- Git commit SHA;
- Vercel deployment ID/URL;
- READY state;
- build/test evidence relevant to that candidate.

Documentation-only commits after the runtime candidate must not be confused with the tested runtime code head.

### P0.5 Founder-authenticated specialist Research canary

On the same exact Preview candidate, run in order:

1. SEB
2. Investor
3. EQT

For every result record:

- target;
- detected/expected classification;
- Research status;
- provenance status;
- source count;
- primary-source count;
- evidence count;
- metric values;
- metric source IDs;
- blockers/warnings;
- persistence = null/off;
- publication = null/off.

Acceptance:

- SEB: `research_ready` with every required bank core metric source-bound and P/B traceable, OR an exact defensible blocker.
- Investor: `research_ready` with explicit NAV/share + discount derivation lineage, OR an exact defensible blocker.
- EQT: remains `research_ready` with AUM/FAUM/trailing-P/E provenance, OR an exact defensible blocker.

Never lower a gate to make a blocked target pass.

### P0.6 Close Specialist Research Readiness v2 correctly

When P0.1-P0.5 are complete:

- update this master;
- update the dated Specialist Research Readiness v2 record;
- update PR #289 acceptance text;
- only then decide whether the PR is ready for stack integration/review.

Do not merge merely because the three buttons are green if the exact commit/test/provenance record is incomplete.

## OPEN WORK — P1 NEXT

These tasks begin after the deterministic specialist Research slice is accepted.

### P1.1 Reconcile bank Analyst-readiness semantics

Current contradiction:

`buildBankResearch` still exposes `analystReady: false` and `bank_analyst_schema_v3_required`, while the inherited branch already contains and uses the bank-v3 Analyst engine.

Required:

- define one unambiguous readiness contract;
- remove or version the stale blocker semantics;
- ensure no consumer can incorrectly conclude that bank Analyst support is absent;
- keep Research and Analyst quality gates intact.

Acceptance:

Research readiness, Analyst eligibility and publishability have distinct, truthful states with no contradictory flag/blocker combination.

### P1.2 Full SEB specialist Analyst acceptance

Run the existing bank service with no persistence/publication.

Require on the same execution:

- bank Research quality = 100/100;
- bank Analyst quality = 100/100;
- P/B scenario basis is valid;
- Bear < Base < Bull;
- bank core factors are source-supported;
- Analyst source IDs resolve to known sources;
- persistence off/null;
- publication off/null.

If quality fails, diagnose observed evidence/output. Do not reduce `knownQualityFactors`, source-diversity or other gate thresholds just to pass.

### P1.3 Full Investor specialist Analyst acceptance

Use the existing financial-specialist service with no persistence/publication.

Require:

- specialist Research quality = 100/100;
- specialist Analyst quality = 100/100;
- NAV_discount scenario methodology;
- explicit NAV/market-price provenance;
- sufficient source diversity;
- Analyst source IDs resolve to known sources;
- persistence off/null;
- publication off/null.

### P1.4 Full EQT specialist Analyst acceptance

Use the same financial-specialist service.

Require:

- Research quality = 100/100;
- Analyst quality = 100/100;
- AUM/FAUM/trailing-P-E methodology preserved;
- P/E scenario basis rather than NAV or generic enterprise methodology;
- source provenance preserved;
- persistence off/null;
- publication off/null.

### P1.5 Controlled persistence/public-read verification

Only after the no-write 100/100 acceptance runs.

Validate in controlled DEV/Preview:

- bank specialist schema persistence;
- financial-specialist schema persistence;
- publication requires accepted Research + Analyst gates;
- stored schema dispatches to correct public reader;
- specialist content is never parsed as operating-company `analyst-v2`;
- existing published operating-company analysis remains readable/unchanged;
- no production write is used as validation.

### P1.6 Consolidate the analysis PR stack

The specialist code is inherited from earlier OMXS30 methodology work while newer global/source/research work is stacked later.

Before `main` integration:

- map which older draft PRs are ancestors, historical artifacts or still carry unique changes;
- avoid merging overlapping draft PRs independently into `main`;
- create one explicit integration order;
- verify merge-base and regression state after consolidation.

## OPEN WORK — P2 BREADTH / HARDENING

### P2.1 Wider OMXS30 specialist canary matrix

Before claiming broad OMXS30 specialist support, verify at least:

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

Each target must use its correct methodology and remain fail-closed on missing official evidence.

### P2.2 Investment-company ambiguity hardening

Before reusing the Investor extractor broadly, add deterministic handling/tests for:

- multiple NAV/share values in one document;
- current period versus previous period;
- conflicting primary documents;
- unique current-period binding;
- ambiguous current values -> fail closed;
- stale fallback prevention.

### P2.3 Self-identifying runtime acceptance records

Improve canary/runtime JSON with fields such as:

- `executedAt`;
- immutable build/commit identifier;
- deployment identifier when safely available;
- methodology version;
- relevant Research/Analyst gate versions.

Goal: screenshots/logs should identify exactly which code produced the result.

### P2.4 Additional specialist methodology families

Remain fail-closed until separately designed:

- insurance;
- real estate;
- financial-other;
- ETF/fund.

For each future family create a new master slice containing:

- deterministic Research basis;
- primary-source requirements;
- valuation methodology;
- scenario methodology;
- Analyst schema;
- Research quality gate;
- Analyst quality gate;
- persistence/public-read schema;
- Preview acceptance matrix.

Do not route these through an existing methodology simply because it produces a number.

### P2.5 OMXS30 index analysis

The index itself needs a separate methodology and must not use company annual-report valuation gates.

Future index Research should cover concepts such as:

- index composition/weights;
- breadth;
- market regime;
- technical structure;
- macro/rates/currency context;
- earnings/valuation breadth where defensible;
- scenario/risk framework appropriate to an index.

This is a separate project slice after company methodology coverage is accepted.

## OPEN WORK — P3 PRODUCT ROLLOUT

Only after specialist and global analysis stacks are accepted:

- define which instruments are publicly analyzable;
- define user-facing failure/methodology messages;
- establish cost/rate-limit controls for AI execution;
- add production monitoring and audit logs;
- verify privacy/security for stored analysis requests;
- verify public analysis SEO/canonical/schema behavior;
- establish regeneration/versioning policy;
- establish stale-analysis policy and data timestamp visibility;
- establish publication/editorial review rules where required;
- perform production-readiness security/compliance review before enabling public writes.

## Completed / accepted evidence

Use this section for durable accepted milestones, not ordinary coding progress.

### 2026-08 — Operating-company/global baseline

Accepted evidence includes a founder-authenticated MSFT Preview run with Research/Analyst 100/100, preserved SEC provenance and no persistence/publication.

### 2026-08-22 — Specialist runtime code compiled baseline

`8f50cf47b7f0a8804f0b170d005e6da93273621f` reached Vercel READY on `dpl_FYo74xRUbmwTRKWYAcGWLFBfKAE1`.

This is recorded as a compiled baseline only. Specialist runtime canary acceptance remains open above.

## Acceptance record template

When an analysis milestone is accepted, add a compact record using this template:

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
3. Confirm the active branch/PR and exact baseline.
4. Inspect current code before patching.

When completing work:

1. Add deterministic regression coverage where applicable.
2. Record exact commit/build/runtime evidence.
3. Update the relevant task in this file.
4. Move a task to `Completed / accepted` only if its acceptance condition is actually met.
5. Keep dated master updates as historical evidence; do not use them as the only current backlog.

## Historical master references

Important dated records currently feeding this living master include:

- `00_DIVLAB_MASTER_UPDATE_2026-08-16_OMXS30_METHODOLOGY_COVERAGE_V1.md`
- `00_DIVLAB_MASTER_UPDATE_2026-08-22_SPECIALIST_RESEARCH_READINESS_V2.md`
- the US Research / Preview execution / monster-coverage master updates from the accepted global-analysis stack.

If a dated record conflicts with this file because later verified work changed the state, update this file to the latest verified state and preserve the older dated record as history.

## Definition of done for DivLab Analys as a public product

DivLab Analys is not considered broadly production-ready until all of the following are true:

- every publicly supported company family has its own accepted methodology;
- representative real targets pass Research 100/100 + Analyst 100/100;
- provenance survives from source discovery through Research, derived values, Analyst and public read;
- persistence/publication are verified under correct schemas;
- unsupported targets fail closed with useful messages;
- full repository/build/database/browser validation is green on the integration candidate;
- production security/compliance review is complete;
- controlled production rollout and monitoring are prepared.

Until then, this master remains the authoritative list of what is built, what is proven and what still has to be done.
