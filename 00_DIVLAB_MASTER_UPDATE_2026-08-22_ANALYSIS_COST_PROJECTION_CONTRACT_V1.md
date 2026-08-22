# DIVLAB MASTER UPDATE — ANALYSIS COST PROJECTION CONTRACT V1

Date: 2026-08-22
Status: PRE-WORKER / FAIL-CLOSED / NO EXECUTION ENABLEMENT
Parent stack: PR #284 (`agent/analysis-request-api-v1`)

## Purpose

Before an on-demand Analysis worker may call Cost Guard and start paid model execution, DivLab needs a versioned whole-job cost projection that reflects the model calls the current engines can actually make.

This slice creates that contract. It does **not** create the worker.

The projection is a conservative platform-AI admission envelope. It is not expected COGS, not a user price, not a credit price and not a promise that a normal run consumes the full reserved amount.

## Verified current execution paths

The existing Deep Analysis engines have different bounded model paths:

### Operating company

Worst permitted path is three model calls:

1. primary Analyst attempt — Luna — max 8,000 output tokens;
2. structured Analyst repair after an invalid first draft — Terra — max 12,000 output tokens;
3. one post-valuation quality repair if the deterministic Analyst quality gate remains non-publishable — Terra — max 12,000 output tokens.

The service already merges usage between the first structured attempt and structured repair, and `ai-analysis-service.ts` additionally merges the separate quality-repair usage when that repair runs.

### Bank

Current bank-v3 path has one Analyst call:

1. primary bank Analyst — Luna — max 4,400 output tokens.

There is no second bank Analyst repair path in the current service. A failed bank Analyst quality gate remains fail-closed.

### Financial specialist

Current investment-company / asset-manager specialist path can make two calls:

1. primary specialist Analyst — Luna — max 9,000 output tokens;
2. structured fallback — Terra — max 12,000 output tokens.

The review found that this specialist path had bounded evidence and bounded output, but no total prompt-character ceiling. That made a whole-job cost projection structurally incomplete.

This slice closes that gap by adding `maxPromptChars: 64_000` and rejecting the call with `financial_specialist_analyst_prompt_too_large` before provider execution when the prompt exceeds it.

## Light Analysis decision

Light Analysis still has no separately implemented execution engine.

Therefore Cost Projection v1 returns:

`light_engine_not_implemented`

for every Light request.

DivLab must not pretend that the current Deep engine is a Light engine merely by charging less or hiding sections in the response. Light remains product-defined but execution-disabled until its own methodology, output contract and model budget are implemented and verified.

## Input-side reservation envelope

Provider output caps alone are not sufficient for cost admission because input tokens also cost money.

For v1, every projected model attempt receives a deliberately conservative input-token envelope based on:

- at most 100,000 UTF-16 code units of local system + prompt text;
- 4 UTF-8 bytes per UTF-16 code unit as a conservative expansion ceiling;
- an additional 32,000 input-token allowance for structured-output schema / gateway protocol framing not represented directly by the local prompt string.

This gives an input reservation ceiling of:

`432,000 input tokens per possible model call`

This is intentionally much larger than normal expected prompt usage. It exists to protect the platform budget before the real telemetry distribution is known.

The repository contract test verifies that the current dynamic prompt limits plus the complete relevant source-file text stay below the 100,000-character local-text envelope. If an engine grows beyond the envelope, the source contract must fail and the projection profile must be reviewed/versioned before a worker may use it.

## Model pricing source

The projection imports and calls the existing `estimateAiCostUsdMicros(...)` helper from the current AI engine.

It does not create another model price table.

Current model IDs are inherited from the existing engine:

- primary: `openai/gpt-5.6-luna`
- escalation: `openai/gpt-5.6-terra`

If model IDs or their central cost estimates change, the projection changes with that existing pricing source instead of silently drifting to a duplicate price list.

## Projection profiles

The exported version is:

`analysis-cost-projection-v1`

Profiles are engine-specific, for example:

- `analysis-cost-projection-v1.operating_company`
- `analysis-cost-projection-v1.bank`
- `analysis-cost-projection-v1.financial_specialist`

All v1 Deep profiles require **primary-first** execution. The future worker must not silently switch the first call to the escalation model while still reserving a primary-first profile.

Using the current central model estimates and the conservative input envelope, the present fail-closed reservation ceilings are approximately:

- operating-company Deep: 2,112,000 USD micros;
- bank Deep: 91,680 USD micros;
- financial-specialist Deep: 1,105,200 USD micros.

These are **budget admission ceilings**, not expected actual cost. They must not be converted into SEK pricing or shown as a user charge.

## Cost Guard relationship

The future worker flow is now constrained to:

`queued request -> deterministic research/classification -> resolve exact engine -> projection contract -> Cost Guard reserve -> running -> model execution -> quality gates -> conservative cost finalization -> completed/failed`

Cost Guard may use the exact projection profile string and projected micro-USD amount from this contract.

If reliable actual usage is unavailable after a call/fallback, finalization must prefer `fail_closed_ceiling` or another conservative accounting source. It must never claim incomplete telemetry is exact gateway cost.

The Cost Guard hard-limit reserve remains conservative and is not reduced merely because a successful run appears cheaper.

## Research-before-reservation boundary

The current Analysis Cost Guard protects platform **AI/model spend**. Deterministic research/source loading is needed to determine the company methodology/engine and therefore may occur while the request is still `queued`.

No paid model call may occur before Cost Guard has atomically moved that exact request from `queued` to `running`.

This slice does not claim that model spend is full product COGS. Hosting, databases, licensed data, source-provider fees, payment fees, support/editorial work, storage, queue infrastructure, taxes and FX remain outside this v1 AI reservation contract.

## What this does NOT enable

This slice does not:

- configure an entitlement provider;
- enable the Request API in Production;
- apply any repository migration remotely;
- create a queue worker;
- call Cost Guard at runtime;
- execute an Analysis model;
- implement Light Analysis;
- broaden global `canRunAnalysis`;
- weaken Research or Analyst quality gates;
- add Stripe, credits, subscriptions or prices;
- expose private results;
- auto-publish anything.

## Next slice

The next allowed implementation slice is:

**Analysis Worker / Executor v1**

It must:

1. claim only an existing queued request;
2. verify entitlement is still live;
3. load deterministic Research and resolve the exact supported engine;
4. obtain a successful Deep projection from this contract;
5. use the primary-first execution policy locked by the profile;
6. atomically reserve projected cost through Cost Guard, which alone moves the request to `running`;
7. execute the existing methodology without lowering any quality gate;
8. finalize cost conservatively on success and on cost-bearing failure;
9. persist a private result before marking `completed`;
10. otherwise move the request to terminal `failed` with an auditable failure code;
11. never publish the result automatically.

Light requests must remain rejected by the worker until a separate Light engine is accepted.

## Validation discipline

- Keep the PR Draft and stacked on #284.
- No migrations are applied remotely in this slice.
- No live AI call is required.
- Run one normal Vercel Preview build after the source contract is complete.
- The static contract test must pin current call counts, output caps, the specialist prompt bound and the 100k local-text envelope.
- Final release evidence must reference the exact final Git head; deployments from superseded or temporary commits do not count.
- Do not merge independently.
