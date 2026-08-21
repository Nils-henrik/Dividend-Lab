# DIVLAB MASTER UPDATE — OMXS30 methodology coverage v1

Date: 2026-08-16
Status: ACTIVE_PR / INTERNAL_VALIDATION
Scope: DivLab Analys company-type coverage for current OMXS30 constituents.

## Parent rules

This update follows the active DivLab Master. Correctness, fail-closed methodology selection, source traceability, 100/100 Research, 100/100 Analyst and Preview-first verification remain mandatory. No quality gate may be weakened to make a company type pass.

## Product objective

All **company types currently represented inside OMXS30** shall be analyzable from the same `/analyses` Analysiscenter while using a methodology appropriate to that company type.

The index itself remains out of scope for this update. OMXS30 index analysis is a separate next phase and must not be forced through a company engine.

## Current methodology families

The current OMXS30 company coverage is split into:

1. `operating_company` — existing deep-research-v2 + analyst-v2 flow.
2. `bank` — existing bank-specific research/Analyst v3 connected to Analysiscenter and publication.
3. `investment_company` — Investor B and Industrivärden C, analyzed using NAV/substansvärde, discount/premium, portfolio context and capital structure rather than generic FCF/EV multiples.
4. `asset_manager` — EQT, analyzed using AUM, fee-generating AUM, business-quality evidence and traceable P/E scenario basis rather than treating AUM as corporate capital.

Provider metadata remains the default classifier. Exact specialist overrides are allowed only through a narrow source-backed symbol registry for the current OMXS30 specialist constituents; broad Financial Services names must not be guessed into a specialist type.

## Exact specialist registry

- NDA-SE.ST → bank
- SHB-A.ST → bank
- SEB-A.ST → bank
- SWED-A.ST → bank
- INVE-B.ST → investment_company
- INDU-C.ST → investment_company
- EQT.ST → asset_manager

The registry is intentionally exact. It must not promote arbitrary Financial Services equities to a specialist engine.

## Analysis dispatch

Methodology preflight selects one of:

- `operating_company`
- `bank`
- `financial_specialist`

A supported search result is not enough to start Deep Research. The server must verify the company type and resolve an engine first. Unknown, insurance, real-estate, fund/ETF and unverified financial-other classifications remain fail-closed unless/until a dedicated methodology is separately implemented.

## Investment-company methodology v1

Required deterministic basis:

- verified NAV/substansvärde per share from primary report evidence;
- calculated discount/premium versus the frozen analysis price;
- portfolio/capital-structure interpretation from source-linked evidence;
- Bear/Base/Bull based on explicit NAV growth and discount/premium assumptions.

Generic FCF, EV/EBITDA and generic operating-company scorecards are not valid substitutes.

## Alternative asset-manager methodology v1

Required deterministic basis:

- verified total AUM;
- verified fee-generating AUM;
- source-grounded interpretation of fundraising/inflows, fee earnings and realization sensitivity where available;
- traceable trailing P/E basis in v1;
- Bear/Base/Bull based on explicit EPS-growth and P/E assumptions.

AUM must never be treated as EQT's own balance-sheet capital or equity value.

## Bank integration

The existing `deep-research-v3-bank`, `analyst-v3-bank`, bank research quality gate and bank Analyst quality gate are reused. Analysiscenter must dispatch banks to that engine rather than rebuilding bank logic or allowing a generic corporate FCF path.

## Persistence and public read

The same immutable analysis tables are retained. Publication accepts only an allowlisted schema/gate pair:

- analyst-v2 / analyst-quality-v1
- analyst-v3-bank / bank-analyst-quality-v1
- analyst-v1-financial-specialist / financial-specialist-analyst-quality-v1

Every pair still requires Research 100/100, Analyst 100/100, immutable chart data, traceable sources and at least one primary source.

Public read must dispatch on the stored content schema and recompute the matching Analyst quality gate. A specialist analysis must never be parsed as analyst-v2.

## UI rule

All supported company types use the same Analysiscenter, archive, TradingView chart and editorial straight-line DivLab design. The article content may show specialist metrics, but routes and navigation remain coherent.

## Acceptance gate

This update may leave ACTIVE_PR only after:

1. lint + TypeScript + all repository tests pass;
2. full production build passes;
3. migration contract tests pass;
4. Preview methodology preflight verifies an operating company, a bank, Investor/Industrivärden and EQT;
5. at least one real bank specialist analysis reaches its own 100/100 gates in Preview or its blocker is diagnosed without lowering requirements;
6. at least one real investment-company analysis reaches its own 100/100 gates;
7. EQT specialist run is verified or remains fail-closed on a concrete missing primary metric;
8. Atlas existing published analysis remains readable and unchanged;
9. no production deployment/write is performed as part of this validation.

## Next phase after acceptance

Build the separate index-analysis methodology for OMXS30 inside the same Analysiscenter. Index research must use technical breadth/market regime/macro/index composition methodology and must not reuse company annual-report valuation gates.
