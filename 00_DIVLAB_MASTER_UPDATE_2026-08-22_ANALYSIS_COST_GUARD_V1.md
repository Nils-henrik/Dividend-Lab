# DIVLAB MASTER UPDATE — ANALYSIS COST GUARD V1

Date: 2026-08-22
Status: SCHEMA_ONLY / INERT / FAIL-CLOSED
Parent stack: PR #281 (`agent/paid-analysis-request-foundation-v1`)

## Purpose

This slice implements the next step explicitly locked by the Paid Analysis Request Foundation: an Analysis-specific projected-cost reservation and finalization boundary.

The objective is not billing. The objective is to make it structurally impossible for a future paid/on-demand worker to move a queued request into cost-bearing execution without first reserving a conservative project budget atomically.

The design reuses the proven **safety pattern** from DivBrain — reserve before provider work, serialize admission, reconcile without lowering the reserved hard-limit amount — but uses a completely separate Analysis-domain ledger. `divbrain_usage_events` remains DivBrain-owned and is not reused for paid analysis accounting.

## Product-depth identity

The prior request foundation did not yet persist whether the user requested the future **Light Analysis** or **Deep Analysis** product.

That is required before cost, entitlement and worker boundaries can be correct: a request must not be able to change from a cheaper/lighter execution depth into a deeper execution after entitlement or budget has been reserved.

`divlab_analysis_requests.analysis_depth` is therefore now required and limited to:

- `light`
- `deep`

It is immutable for the entire request lifecycle.

No default depth is introduced. The request layer must choose the product explicitly. If the migration ever encounters an existing request row without depth, it fails closed rather than guessing a backfill.

This does not yet implement the Light execution engine. It only reserves the canonical request identity needed by later product slices.

## New cost ledger

`public.divlab_analysis_cost_events`

One row represents the conservative cost reservation for one complete Analysis job, not one individual model call.

This is intentional because Deep Analysis may eventually contain more than one bounded Analyst attempt, repair or escalation. The worker must reserve enough budget for the complete allowed execution profile before the first paid model/provider call.

Core fields include:

- exact request id — unique, so one whole-job reservation per request;
- nullable user id for durable audit history after account deletion;
- immutable `analysis_depth` snapshot;
- bounded `projection_profile` identifying the server-side projection policy/version;
- reserved cost in integer micro-USD;
- reconciled/accounted cost in integer micro-USD;
- input/output/total token telemetry when available;
- cost source;
- terminal provider/execution status;
- admission level;
- reserved/finalized state and timestamps.

The ledger is operational internal data. A request owner does not receive direct browser access to cost rows in v1.

## Hard-limit accounting principle

`reserved_cost_micro_usd` is the source of truth for hard-limit admission for both reserved and finalized rows.

Finalization may set the hard-limit amount only to:

`max(existing reserved cost, reconciled accounted cost)`

It may never reduce it.

This deliberately prefers conservative over-reservation to a race where multiple workers collectively exceed a budget because earlier jobs finalized cheaper than originally reserved.

The later product/pricing layer may use reconciled cost for unit-economics analysis, but budget safety must not be relaxed by optimistic reconciliation.

## Atomic reserve + claim

`public.divlab_reserve_analysis_cost(...)` is the only v1 mutation path that creates a cost reservation.

The RPC:

1. validates request/cost configuration and product depth;
2. rejects a projected job above the per-request ceiling;
3. takes a transaction-scoped advisory lock dedicated to Analysis cost admission;
4. locks the exact request row;
5. verifies request owner and immutable Light/Deep depth;
6. requires request state `queued`;
7. requires an existing entitlement reservation;
8. requires no existing cost reservation;
9. checks global Analysis daily/monthly hard limits using already reserved cost;
10. creates one Analysis cost event;
11. updates the same request `queued -> running`, setting the exact cost reservation id and `started_at`, in the same database transaction.

Therefore a future worker cannot legitimately enter `running` merely because it has read a queued row. The database transition into cost-bearing state is coupled to successful cost admission.

## Retry semantics

Reservation is idempotently recoverable.

If a worker loses the response after a committed reservation and retries with the same request/user/depth/projection profile/projected amount, the RPC returns the existing reservation id instead of creating another charge reservation.

If retry parameters differ, the RPC fails closed with `reservation_parameters_mismatch`.

The unique request id in the cost ledger independently prevents duplicate whole-job reservations.

## Finalization

`public.divlab_finalize_analysis_cost(...)` is idempotent and uses the same advisory budget lock as admission.

It records reconciled cost/token usage after the provider/Analyst attempt(s) and moves the cost event from `reserved` to `finalized`.

Allowed cost sources intentionally mirror the established conservative vocabulary:

- `gateway_actual`
- `conservative_estimate`
- `fail_closed_ceiling`

If a future worker cannot establish a reliable lower actual cost, it must use a conservative representation rather than silently releasing reserved budget.

Finalizing cost does not itself mark the analysis request `completed` or `failed`. That lifecycle transition belongs to the future worker/executor slice, because result persistence and quality-gate outcome must be known first.

## Security / Supabase boundary

The cost ledger has RLS enabled and no browser policy.

- `anon`: no access.
- `authenticated`: no access.
- `service_role`: SELECT only on the table.
- INSERT/UPDATE are performed only inside the two dedicated `SECURITY DEFINER` RPCs.
- DELETE is not granted.
- RPC execution is revoked from `public`, `anon` and `authenticated` and granted only to `service_role`.
- SECURITY DEFINER functions use a locked search path and explicit public-table qualification.

This matches current Supabase guidance that exposed-schema tables use RLS, grants remain least-privilege, and SECURITY DEFINER execution is tightly restricted.

## Budget semantics

The Analysis Cost Guard v1 protects **project/platform AI spend**, not user commercial entitlement.

It implements:

- per-request projected cost ceiling;
- global Analysis daily hard limit;
- monthly target;
- monthly warning threshold;
- monthly hard limit.

The actual numeric limits are not hardcoded in the schema. They must come from trusted server configuration in the future worker and are revalidated inside the atomic RPC.

User credits/subscriptions/prices remain a separate entitlement concern.

## What this does NOT enable

This slice does not create or enable:

- Stripe or any payment provider;
- credits, wallet or subscription balances;
- a public/production analysis request API;
- an entitlement implementation;
- a queue consumer or worker;
- automatic Light or Deep execution;
- any model/provider call;
- Production analysis execution;
- public or private result access;
- automatic publication;
- any weaker Research or Analyst quality gate.

No AI call is required to validate this schema slice.

## Remote database status

At implementation time, the connected `dividend-lab-dev` Supabase project already contains the proven DivBrain usage ledger/RPC pattern and `divlab_analysis_versions`, but the parent `divlab_analysis_requests` migration from PR #281 is intentionally not applied remotely.

This Cost Guard migration must therefore also remain repository-only in this slice. It must not be applied remotely out of stack order.

## Relationship to Preview telemetry PR #280

PR #280 is a sibling observability slice above PR #279. It exposes existing Analyst usage in the internal Preview operator so real canary runs can inform unit economics.

The Cost Guard does not depend on that UI change and does not merge its branch. Later stack consolidation may carry both features forward: Preview telemetry observes actual run usage; the production Cost Guard protects future on-demand spend before execution.

## Next slice

Per the existing roadmap, the next independent product boundary is:

**Entitlement Interface v1**

It must remain provider-neutral. It may define how an authenticated user proves/reserves permission to request Light or Deep Analysis, but it must not implicitly choose Stripe tables or commercial pricing before those product decisions are locked.

Only after entitlement exists should Request API v1 accept and queue on-demand jobs. The Request API must not run AI synchronously.

## Validation / release discipline

- Repository migration only; do not apply remotely.
- Add a static schema contract to the core test suite.
- One atomic branch commit.
- One normal stacked Vercel Preview is sufficient.
- No live AI/model call.
- No full company matrix rerun.
- PR remains Draft and must not be merged independently.
