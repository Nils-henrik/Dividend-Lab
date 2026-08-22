# DIVLAB MASTER UPDATE — ANALYSIS REQUEST API V1

Date: 2026-08-22
Status: PREVIEW_CONTRACT / INERT / FAIL-CLOSED
Parent stack: PR #283 (`agent/analysis-entitlement-interface-v1`)

## Purpose

This slice establishes the future on-demand Analysis request endpoint without enabling paid execution.

The endpoint proves the correct orchestration boundary:

`authenticated user -> explicit Light/Deep -> canonical supported target -> entitlement -> private queued request`

It deliberately stops at `queued`. The model/provider execution remains a separate Worker/Executor slice and must never run synchronously in the user request handler.

## Route

`POST /api/analysis/requests`

Current release boundary:

- Preview-only;
- requires explicit server env `DIVLAB_ANALYSIS_REQUEST_API_ENABLED=true`;
- requires real Supabase authentication;
- accepts only explicit `light | deep` depth;
- requires a client-generated UUID idempotency key;
- requires exact Yahoo symbol input which is canonicalized server-side;
- accepts only equity targets whose current Analysis discovery contract has `canRunAnalysis=true`.

Global discovery alone is not enough to sell or queue an analysis.

## Inert provider boundary

The route currently uses the fail-closed entitlement provider from PR #283.

Before opening the service-role request store, it verifies that a real provider is configured. Because the only provider in this slice has id `unconfigured`, the endpoint returns `entitlement_provider_not_configured` and stops before request-table writes.

This is intentional for two reasons:

1. no commercial entitlement product has been selected yet;
2. the stacked request/cost/entitlement migrations remain repository-only and are not present in the connected Preview database.

Thus even if the feature flag is accidentally enabled, this PR still cannot create a request or start paid work in the current deployment.

A future entitlement-adapter slice must explicitly replace this fail-closed provider resolution before queueing becomes reachable.

## Request service

`lib/analysis/analysis-request-service.ts` defines the trusted server orchestration used once a configured entitlement provider exists.

### Idempotent pending request

The service inserts with the existing unique `(user_id, idempotency_key)` contract using conflict-ignore semantics, then re-reads the exact row.

A retry with the same user/idempotency key and same canonical symbol/exchange/Yahoo symbol/depth recovers the existing request.

If the same idempotency key is reused for another target or another Light/Deep depth, the service fails with `idempotency_conflict` instead of mutating immutable request identity.

The stored display name is not used as an idempotency-conflict discriminator because a provider may change a company's display name between retries while the canonical listed instrument remains the same.

## Entitlement ordering

Only a request in `pending_entitlement` may call `entitlementProvider.reserve(...)`.

The adapter must treat `requestId` as its idempotency identity. A network retry for the same request must recover the same entitlement reservation rather than create a second commercial reservation.

The returned entitlement is validated again against:

- provider id;
- request UUID;
- user UUID;
- immutable Light/Deep depth;
- reservation UUID;
- finite live expiry.

If validation fails, the service performs best-effort entitlement release and marks the pending request failed.

## Queue transition

After valid entitlement, the service persists in one request-state update:

- `status = queued`;
- entitlement reservation id;
- entitlement provider id;
- entitlement expiry;
- `queued_at`.

The database entitlement trigger from PR #283 independently verifies that the reservation is still live at `queued_at`.

If queue persistence fails after entitlement reservation, the service performs best-effort `release(...)` and marks the still-pending request failed. No Cost Guard or model call has occurred at that point.

## Existing requests

If an idempotent retry finds the request already in a later state, the Request API does not repeat entitlement reservation. It returns the existing private request id/status.

This includes `queued`, `running`, `completed` and `failed`.

Detailed private result data remains out of scope until the later Private Result Access slice.

## Database access

Browser-authenticated users still have no write grant on `divlab_analysis_requests`.

The Preview Request API uses the existing explicit `dividend-lab-dev` service-role client only after:

1. Preview environment check;
2. feature flag check;
3. authentication;
4. request validation;
5. target canonicalization/readiness;
6. real entitlement-provider availability.

No generic/production Supabase service-role fallback is introduced.

## No synchronous AI

Neither the Request API route nor the request service imports or calls:

- `createDivLabAiAnalysis`;
- bank Analyst execution;
- financial-specialist Analyst execution;
- `generateDivLabAnalystDraft`;
- any provider/model generation function.

A successful future request returns `executionStarted: false` and status `queued`.

The HTTP request handler therefore cannot become the expensive AI worker by accident.

## Failure semantics

Before entitlement succeeds, failures remain non-cost-bearing.

A denied/invalid entitlement attempt can move the pending request to terminal `failed` with a bounded machine-safe failure code. This releases the one-active-request concurrency slot while preserving an audit row.

A successful entitlement that cannot be persisted to `queued` is best-effort released before the request is failed.

Commercial refund/capture semantics remain outside this service and belong to the future provider adapter/product policy.

## What this does NOT enable

This slice does not add:

- a configured entitlement provider;
- Stripe or checkout;
- credits/wallet/subscription storage;
- Production request access;
- database migration application;
- worker/queue consumer;
- Cost Guard invocation from a worker;
- AI/model/provider execution;
- private analysis result reading;
- public publication;
- pricing;
- any Research/Analyst gate relaxation.

## Remote database status

The parent request/cost/entitlement migrations remain intentionally repository-only. Because the route checks the unconfigured entitlement provider before opening its service-role request store, normal Preview operation remains inert against the current remote schema.

No remote schema write is authorized by this slice.

## Next slice

The next engineering boundary is **Analysis Worker / Executor v1**.

It must remain unreachable from ordinary users until a real entitlement provider and the stacked migrations are explicitly accepted/applied.

The worker contract must:

1. claim only an already `queued` request;
2. verify the immutable request identity and live entitlement through database lifecycle constraints;
3. compute a conservative whole-job projected cost for the exact Light/Deep execution profile;
4. call `divlab_reserve_analysis_cost(...)` before any model/provider generation;
5. enter `running` only through that successful atomic Cost Guard transaction;
6. dispatch the correct existing Analysis methodology engine;
7. finalize cost conservatively even on provider/quality failure;
8. persist a private result only after existing quality gates pass;
9. move request to `completed` only with exact `divlab_analysis_versions.id`, otherwise terminal `failed` with bounded failure code;
10. never auto-publish a user-requested analysis.

A separate configured entitlement-adapter decision is still required before the Request API can actually queue work.

## Validation / release discipline

- One atomic branch commit.
- Static route/service contract tests.
- One normal stacked Vercel Preview.
- No remote migration.
- No live request write.
- No entitlement reservation.
- No AI/model call.
- No full company matrix.
- PR remains Draft and must not be merged independently.
