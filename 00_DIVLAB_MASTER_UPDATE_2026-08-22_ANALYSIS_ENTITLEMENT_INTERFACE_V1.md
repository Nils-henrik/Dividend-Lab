# DIVLAB MASTER UPDATE — ANALYSIS ENTITLEMENT INTERFACE V1

Date: 2026-08-22
Status: CONTRACT_ONLY / INERT / FAIL-CLOSED
Parent stack: PR #282 (`agent/analysis-cost-guard-v1`)

## Purpose

This slice implements the provider-neutral entitlement boundary required before DivLab may expose an on-demand Analysis Request API.

It does **not** decide how users pay. It defines the narrow contract the future Request API may depend on when asking whether a specific authenticated user may reserve one specific Light or Deep Analysis request.

The Analysis engine must never import Stripe, a wallet table, subscription schema or another commercial provider directly. Commercial adapters must sit behind this contract.

## Server-only contract

`lib/analysis/analysis-entitlement.ts` defines:

- `DivLabAnalysisDepth` = `light | deep`;
- reserve input bound to exact request id, user id and analysis depth;
- successful reservation metadata;
- bounded deny reasons;
- a release operation for failures/cancellation before execution;
- validation of adapter output before request metadata may be persisted;
- a fail-closed unconfigured provider.

The contract is `server-only`.

No browser component or public route is introduced.

## Reservation identity

A successful entitlement reservation must provide:

- internal reservation UUID;
- provider-neutral machine `providerId`;
- exact request UUID;
- exact user UUID;
- exact `light` or `deep` product depth;
- reservation timestamp;
- expiry timestamp.

The adapter result is not trusted merely because the provider returned `ok`.

Before persistence, the server contract verifies that request/user/depth exactly match the expected request, ids are structurally valid, provider id is bounded/machine-safe and the reservation has a live finite expiry.

A small clock-skew allowance is permitted for `reservedAt`; expiry must still be strictly in the future and after reservation time.

## Why entitlement must expire

The parent request foundation stored only `entitlement_reservation_id`.

A UUID by itself is not sufficient authorization to start expensive work later. A queued request might wait long enough that its reserved entitlement is no longer valid.

The request schema therefore gains:

- `entitlement_provider_id`
- `entitlement_expires_at`

These values are paired with `entitlement_reservation_id` and become immutable once set.

No default provider and no default expiry are introduced.

## Lifecycle hardening

The database rejects stale entitlement at two boundaries:

### `pending_entitlement -> queued`

The request may enter `queued` only when reservation id, provider id and expiry are all present and the expiry is later than `queued_at`.

### `queued -> running`

The request may enter `running` only if the same immutable entitlement remains live at `started_at`.

This second check is deliberately located on the request lifecycle itself. The Analysis Cost Guard from PR #282 updates `queued -> running` in the same transaction as cost reservation; if entitlement has expired in the queue, the trigger rejects the transition and the entire cost-reservation transaction rolls back.

Thus an expired entitlement cannot consume Analysis project budget or reach a model call through the intended future worker path.

## Provider-neutral semantics

The interface intentionally does not define commercial product storage.

A future adapter could represent, for example, a prepaid balance, subscription entitlement, promotional grant or staff/test grant, but those schemas and price rules are outside this slice.

The core Analysis domain receives only the normalized entitlement result.

No provider is configured by this PR.

`createFailClosedAnalysisEntitlementProvider()` denies reservation with `provider_not_configured`. Merely importing the entitlement layer therefore cannot enable paid Analysis accidentally.

## Release semantics

The v1 interface includes `release(...)` only for a reservation that must be abandoned before execution, such as:

- request failure before queue;
- cancellation before execution;
- internal recovery.

The interface deliberately does **not** define payment capture, credit consumption, refunds or subscription accounting. Those are commercial policy decisions and must not be smuggled into the generic Analysis contract.

The future Request API may reserve entitlement and later release it if request creation/queueing fails safely.

## Security boundary

- Entitlement interface is server-only.
- Request owners still have no browser write permission on `divlab_analysis_requests`.
- Provider id/expiry are persisted only by trusted server state transitions.
- Entitlement metadata cannot be replaced after reservation.
- The entitlement trigger function is not executable by `public`, `anon` or `authenticated`; service role remains the trusted mutation actor.
- No new RLS policy is opened.

The existing owner-only request SELECT remains unchanged.

## Relationship to Cost Guard

Execution order is now structurally:

`pending request -> entitlement reserved/live -> queued -> Analysis Cost Guard reserves project budget -> running`

Cost Guard remains separate from commercial entitlement:

- entitlement answers **may this user reserve this Light/Deep request?**
- Cost Guard answers **may DivLab spend the projected AI budget for this queued request now?**

Both must pass before future model execution.

## What this does NOT enable

This slice does not create:

- Stripe integration;
- payment checkout;
- credit/wallet tables;
- subscription tables;
- a configured entitlement provider;
- public Request API;
- queue/worker;
- model/provider execution;
- Production Analysis execution;
- private result access;
- automatic publication;
- any quality-gate relaxation.

## Remote database status

PR #281 and #282 remain repository-only and are not applied to the connected `dividend-lab-dev` project. This child schema hardening therefore also remains repository-only; it must not be applied out of stack order.

## Next slice

The next master-guided boundary is:

**Analysis Request API v1**

That endpoint must:

1. require an authenticated user server-side;
2. canonicalize and verify the target before entitlement;
3. require explicit `light | deep` request depth;
4. create/recover the idempotent private `pending_entitlement` request;
5. call only the provider-neutral entitlement interface;
6. validate reservation identity/expiry;
7. persist reservation metadata and move the request to `queued`;
8. return the private request/job identity;
9. never call the model synchronously;
10. remain disabled unless a real entitlement adapter is explicitly configured.

Because no provider is configured yet, Request API v1 must remain fail-closed in normal operation even after the route exists.

Worker/executor remains a later separate slice.

## Validation / release discipline

- Repository-only migration and server contract.
- One atomic branch commit.
- Static contract tests.
- One normal stacked Vercel Preview.
- No remote migration.
- No AI/model call.
- No full company matrix.
- PR remains Draft and must not be merged independently.
