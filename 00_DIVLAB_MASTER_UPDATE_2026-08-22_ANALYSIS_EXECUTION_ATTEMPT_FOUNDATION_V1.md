# DIVLAB MASTER UPDATE — ANALYSIS EXECUTION ATTEMPT FOUNDATION V1

Date: 2026-08-22
Status: SCHEMA_ONLY / INERT / FAIL-CLOSED
Parent stack: PR #285 (`agent/analysis-cost-projection-contract-v1`)

## Why this slice exists

The pre-worker review found a correctness gap that must be closed before DivLab may implement a real on-demand Analysis executor.

Cost Guard already makes `queued -> running` atomic with a whole-job AI cost reservation. However, `running` did not yet identify a durable execution attempt or record whether the first model/provider call had already begun.

That matters in serverless/queue environments. A process can crash or lose its response after the provider has accepted a cost-bearing request. If a retry merely sees `running` and invokes the model again, DivLab could double-spend and produce duplicate analysis work even though the Cost Guard reservation itself is idempotent.

Execution Attempt Foundation v1 therefore makes **model start a one-way durable boundary** before the future worker is allowed to exist.

## Product decision

For v1, every Deep Analysis request gets at most **one automatic execution attempt**.

There is no automatic replay after `model_started`.

If the worker cannot prove whether a started provider execution completed, the request must fail closed and enter `reconciliation_required`. DivLab reserves correctness and cost integrity over automatic retry convenience.

A later version may introduce durable step-level replay or provider idempotency if the underlying provider contract supports it. That must be an explicit methodology/runtime version, not an assumption.

Light Analysis remains execution-disabled because `analysis-cost-projection-v1` returns `light_engine_not_implemented`.

## New execution-attempt table

`public.divlab_analysis_execution_attempts`

One row is bound to exactly one:

- request;
- owner (nullable only after account deletion anonymization);
- Cost Guard reservation;
- Deep analysis depth;
- resolved analysis engine;
- exact `analysis-cost-projection-v1.<engine>` profile.

Both `request_id` and `cost_reservation_id` are unique. V1 therefore cannot create a second automatic attempt for the same paid request.

Execution-attempt stages are:

1. `claimed`
2. `model_started`
3. `model_finished`
4. terminal `finalized` or `reconciliation_required`

The lifecycle is one-way. Terminal rows cannot be reopened.

## Atomic cost reservation + attempt claim

The raw `divlab_reserve_analysis_cost(...)` Cost Guard RPC becomes an internal database primitive rather than an app-service entry point.

`service_role` execution permission on that raw RPC is revoked.

The new service-only wrapper is:

`divlab_reserve_analysis_cost_and_claim_execution(...)`

It:

1. rejects anything except `deep`;
2. requires one of the three currently supported analysis engines;
3. requires the exact engine-specific `analysis-cost-projection-v1` profile;
4. calls the existing atomic Cost Guard reserve logic;
5. obtains the exact cost reservation id;
6. creates one matching `claimed` execution attempt in the same database transaction;
7. returns both reservation and attempt identity.

If any later statement in that wrapper fails, PostgreSQL rolls the transaction back, including the Cost Guard transition.

## Deferred request/attempt integrity

A deferred database constraint trigger checks every cost-bearing request at transaction commit.

A request that is:

- `running`;
- `completed`; or
- `failed` after execution started

must have an execution-attempt row whose request id, cost reservation, depth and owner match exactly.

The trigger is `DEFERRABLE INITIALLY DEFERRED` so Cost Guard may set `running` first and the wrapper may insert the attempt later within the **same transaction**, while a direct cost-bearing transition cannot successfully commit without the attempt.

## One-shot model boundary

The future worker must call:

`divlab_mark_analysis_model_started(attempt_id)`

immediately before it invokes the Analysis model path.

Only `claimed -> model_started` succeeds.

A second call after `model_started`, `model_finished`, `finalized` or `reconciliation_required` returns:

`model_execution_already_started`

It does not grant permission to replay the model.

This also serializes concurrent workers: the attempt row is locked before transition, so only one caller can cross the model-start boundary.

After the full bounded model path returns to the worker, it may mark:

`model_started -> model_finished`

This marker does not weaken any Research/Analyst quality gate and does not persist/publicize a result by itself.

## Controlled finalization

`divlab_finalize_analysis_execution_attempt(...)` atomically wraps the existing Cost Guard finalization and the attempt lifecycle.

The raw Cost Guard finalizer is removed from app `service_role` access so future server code cannot reconcile cost while bypassing attempt state.

Normal controlled finalization is allowed from:

- `claimed` — only for a failure before provider execution and only with `fail_closed_ceiling` accounting;
- `model_finished` — after the bounded provider/model path has returned.

A `model_started` attempt cannot use normal finalization because its provider outcome is ambiguous until the worker has durably marked `model_finished`.

## Crash / ambiguous provider outcome

The safe recovery path is:

`divlab_mark_analysis_reconciliation_required(...)`

It is allowed only after model execution started.

The RPC:

1. locks the exact attempt;
2. reads its already-reserved Cost Guard ceiling;
3. finalizes the cost event using that reserved amount and `fail_closed_ceiling`;
4. marks the attempt `reconciliation_required`;
5. marks the request terminal `failed` with `execution_reconciliation_required`.

It never replays the model automatically.

This deliberately over-accounts an ambiguous execution rather than claiming an unknown provider charge was cheaper. A later operational review can inspect provider telemetry without exposing the user or platform to duplicate automatic spend.

## Private-result persistence review

The pre-worker review also confirmed that DivLab does **not** need a parallel analysis database for on-demand results.

The existing canonical analysis persistence already separates persistence from publication:

- `divlab_analyses` defaults to `status='draft'`;
- immutable `divlab_analysis_versions` can be stored while `published_at` remains null;
- authenticated browser policies currently expose only explicitly published staff-facing analysis rows;
- publication is already a separate founder/editorial action.

Therefore a future worker may persist a passing canonical analysis version without publishing it. The owner mapping remains the exact `divlab_analysis_requests.analysis_version_id` link. A later Private Result Access slice must authorize through that request row and must not turn `publishable=true` into public visibility.

`publishable` means the quality gates passed. It does **not** mean the analysis is published.

## Security boundary

Execution-attempt rows are internal operational data:

- RLS enabled;
- no authenticated/anon browser policy;
- browser roles receive no table access;
- `service_role` receives SELECT only;
- lifecycle mutation occurs only through tightly scoped SECURITY DEFINER RPCs;
- no DELETE grant exists;
- account deletion may anonymize `user_id` through the existing FK pattern without deleting audit history.

## What this does NOT enable

This slice does not:

- apply any migration remotely;
- create a queue consumer or cron worker;
- create an HTTP worker route;
- configure the entitlement provider;
- enable Production Request API access;
- call Cost Guard at runtime;
- make a model/provider call;
- implement Light Analysis;
- add automatic retry after model start;
- add billing, Stripe, subscriptions, credits or prices;
- change Research/Analyst gates;
- broaden `canRunAnalysis`;
- expose private analysis results;
- publish anything automatically.

## Next slice

With durable one-shot execution identity in place, the next allowed implementation slice is:

**Analysis Worker / Executor v1**

The first executor should remain unreachable from normal users while entitlement is unconfigured and migrations are repository-only.

Its allowed sequence is:

`queued request -> methodology preflight -> Deep cost projection -> atomic Cost Guard + attempt claim -> model_started -> existing analysis engine -> model_finished -> conservative cost/attempt finalization -> persist passing private canonical version -> request completed`

Failures before `model_started` may finalize conservatively and fail the request. Failures/ambiguity after `model_started` must never automatically replay the model; if the worker cannot durably prove `model_finished`, it must use the reconciliation-required path.

A passing result must be persisted before the request becomes `completed`. Publication remains a separate editorial flow.

## Validation discipline

- Repository migration only; do not apply remotely.
- One atomic child commit on top of the exact #285 head.
- Add a static schema contract to the repository test suite.
- No live request, Cost Guard or model execution is needed.
- One normal Vercel Preview build is sufficient.
- Keep the PR Draft and do not merge independently.
