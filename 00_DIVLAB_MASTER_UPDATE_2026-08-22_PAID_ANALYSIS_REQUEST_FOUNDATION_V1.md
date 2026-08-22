# DIVLAB MASTER UPDATE — PAID ANALYSIS REQUEST FOUNDATION V1

Date: 2026-08-22
Status: SCHEMA_ONLY / INERT / FAIL-CLOSED
Parent stack: PR #279 (`agent/analysis-execution-auth-boundary-v1`)

## Product decision

DivLab will not pre-analyze every listed company. The broad 27-target pass remains historical stress-test evidence. The production direction is **on-demand analysis**: a future entitled user chooses a supported company and requests an analysis when needed.

This update establishes the private request/job boundary needed for that product without opening paid execution yet.

## Existing patterns reused

This design intentionally reuses proven DivLab patterns instead of creating a parallel security model:

- `divbrain_usage_events` reserves projected cost atomically before provider generation and treats reserved cost conservatively.
- `divbrain_attachments` uses server-owned writes with owner-only authenticated SELECT via RLS.
- DivLab analysis versions/sources are service-role-owned and publication remains a separate, quality-gated action.

The analysis request layer follows those principles but remains a separate domain from DivBrain conversations and usage rows.

## New table

`public.divlab_analysis_requests`

Purpose: durable private metadata for one on-demand analysis request/job.

Core identity:
- request id;
- nullable user id (`ON DELETE SET NULL` preserves the audit row after account deletion);
- UUID idempotency key;
- canonical instrument symbol, exchange, name and Yahoo symbol.

State machine:
1. `pending_entitlement`
2. `queued`
3. `running`
4. terminal `completed` or `failed`

### Fail-closed state requirements

- Every inserted row must start as `pending_entitlement`; even trusted server code cannot insert directly into a later state.
- A request cannot become `queued` without an internal `entitlement_reservation_id`.
- A request cannot become `running` without both entitlement reservation and a separate `cost_reservation_id`.
- Once a reservation id or lifecycle timestamp exists, later states must carry it forward unchanged; it cannot be replaced or erased.
- A failure may contain only the reservations/timestamps already reached by its previous state. In particular, `queued -> failed` cannot manufacture a cost reservation without entering `running`.
- A request cannot become `completed` without a persisted `divlab_analysis_versions.id`.
- The completed result FK uses `ON DELETE RESTRICT`; a finished request cannot silently lose its result provenance.
- A failed request must carry a bounded machine-safe `failure_code` and can never carry a result version.
- Completed/failed are terminal.
- Instrument identity, creation time and idempotency key are immutable.
- A non-null owner cannot be reassigned to another user.
- The lifecycle trigger explicitly permits only the FK-driven non-null → null `user_id` anonymization required by account deletion, with the rest of the row unchanged.
- At most one `pending_entitlement`/`queued`/`running` request exists per non-null user.

This deliberately conservative one-active-request limit is the v1 concurrency ceiling. It must not be widened until a real paid plan explicitly defines higher concurrency and cost limits.

## Access / RLS

Authenticated browser users:
- may `SELECT` only rows where `user_id = auth.uid()`;
- receive no INSERT/UPDATE/DELETE permission.

Trusted server/service role:
- may SELECT/INSERT/UPDATE;
- receives no DELETE grant.

The database therefore does not trust a client-side button to assert entitlement, cost reservation, status or result ownership.

## What this does NOT enable

This migration does **not** create:
- a public request endpoint;
- Stripe or another payment provider;
- subscriptions, plans or credits;
- an entitlement reservation implementation;
- an analysis cost ledger;
- a worker/queue consumer;
- a Production analysis execution route;
- owner access to private `divlab_analysis_versions` contents/sources;
- automatic publication.

Because every request starts `pending_entitlement` and no entitlement/cost implementation is wired, the new foundation is inert by construction.

## Required execution order for future paid analysis

The production path remains locked to:

`authenticated user -> canonical target -> entitlement/credit reservation -> queued request -> projected-cost reservation -> running -> Research/Analyst gates -> completed private result -> optional separate editorial/publication path`

The expensive model/provider call must occur only **after** both entitlement and projected-cost reservations have succeeded.

## Next slices

The next implementation slices should remain separate:

1. **Analysis Cost Guard v1** — analysis-specific reservation/finalization ledger using the conservative DivBrain budget pattern, but no cross-domain reuse of `divbrain_usage_events`.
2. **Entitlement interface v1** — provider-neutral server contract. Do not choose Stripe schema implicitly before pricing/product rules are decided.
3. **Request API v1** — authenticated server endpoint that canonicalizes the target, reserves entitlement, creates/queues idempotently and never runs the model synchronously in the request handler.
4. **Worker/executor v1** — claims only queued requests with valid entitlement, reserves projected model cost atomically, then runs the existing analysis engines.
5. **Private result access v1** — request owner can read only the exact completed result linked to their request; public publication remains separate.

## Validation / release discipline

- Repository migration only; do not apply remotely from this slice.
- Add a static schema contract to the core test suite.
- No live AI/model call is needed.
- No full company matrix is needed.
- One stacked Preview is sufficient because the migration is inert and no route is wired.
- PR stays Draft and must not be merged independently.
