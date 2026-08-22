# DivLab Master Update — Analysis Monster Coverage Pass v1

Date: 2026-08-22
Status: ACTIVE_OBSERVATION_PASS
Parent: `agent/us-preview-deep-research-execution-v1` / PR #276
Branch: `agent/analysis-monster-coverage-pass-v1`

## User directive

Run a broad monster pass across as many real equity/company types as practical, collect weak points first, and only then patch the loose parts as one deliberate follow-up phase.

## Rule for this pass

**Observe first. Patch second.**

No methodology threshold, quality gate, source rule, classification rule, persistence rule or publication rule may be weakened while the matrix is running. Test-harness code is allowed so the pass can be reproduced in Vercel Preview/build logs. Product behavior fixes wait until the pass has produced a complete gap register.

## Coverage families

The pass must exercise every currently modeled DivLab company type where a real market example can be found:

1. `operating_company`
2. `bank`
3. `insurance`
4. `real_estate`
5. `financial_other`
6. `investment_company`
7. `asset_manager`
8. `fund_or_etf`
9. `unknown` / unresolved or insufficient classification boundary

It must also cover meaningful operating-company diversity rather than treating all ordinary equities as one homogeneous fixture: technology, industrials, healthcare, energy, consumer, communication/utilities where practical, multiple Nordic currencies, US equities, and at least one foreign private issuer/ADR boundary.

## Expected engine behavior before fixes

Current verified execution dispatch is intentionally limited:

- `operating_company` -> operating-company engine
- `bank` -> bank engine
- `investment_company` -> financial-specialist engine
- `asset_manager` -> financial-specialist engine

The following are expected to fail closed until dedicated methodology is implemented:

- `insurance`
- `real_estate`
- `financial_other`
- `fund_or_etf`
- `unknown`

A safe, correctly explained rejection is a PASS for these unsupported families. Accidental routing into the generic operating-company engine is a blocker.

## Monster-pass phases

### Phase A — broad live deterministic matrix

For each real target, record at minimum:

- target resolution / market identity;
- quote + market-history availability;
- financial-statement availability;
- detected company type + classification confidence/basis;
- methodology status;
- selected analysis engine or fail-closed status;
- source/evidence counts;
- currency context;
- research facts quality score and failed checks.

For US targets, additionally attempt:

- SEC Global Source Discovery;
- Global Evidence Extraction;
- US Research Coverage evaluation;
- explicit distinction between supported US operating companies and intentionally blocked specialist/foreign-issuer cases.

### Phase B — representative full Analyst execution

Attempt no-persist/no-publish full execution for representative currently supported families:

- Nordic operating company;
- Nordic bank;
- Nordic investment company;
- Nordic asset manager;
- US operating company with verified SEC evidence.

Record the exact stage, final Research quality, Analyst quality, model usage and whether persistence remained null. Gateway/runtime authentication failure is recorded as a pass finding, not hidden or bypassed.

### Phase C — gap register

After the full matrix is complete, classify findings into:

- P0: unsafe routing, wrong persistence/publication behavior, invented/weak provenance, quality-gate bypass;
- P1: supported family cannot complete because source/methodology integration is incomplete;
- P2: classification or coverage weakness that fails closed safely;
- P3: diagnostics/copy/observability friction.

Only after the register exists may patching begin.

## Safety boundaries

- Preview/build verification only;
- no production write;
- no persistence or publication from the monster probe;
- no quality threshold reductions;
- no synthetic passing data for live targets;
- no after-the-fact reinterpretation of a failure as success;
- all expected unsupported types remain fail-closed.

## Completion condition

The observation pass is complete when the full matrix has run on one exact commit and its results are captured in a master/gap report. Then a separate patch phase may repair the observed weak points, followed by the same matrix again as a regression pass.
