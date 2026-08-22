# DIVLAB MASTER UPDATE — ANALYSIS EXECUTION AUTH BOUNDARY V1

Date: 2026-08-22
Status: ACTIVE / FAIL-CLOSED
Parent stack: PR #278 (`agent/analysis-monster-patches-v1`)

## Why this update exists

The current internal Nordic analysis execution route is Preview-only, but before this patch it authenticated the caller only when `publish:true`. A direct Preview request with `publish:false` could therefore reach target resolution, provider preflight and potentially the expensive AI analysis path without first proving that the caller was authorized DivLab staff.

That is not an acceptable cost/security boundary for a Deep Research feature that is intended to become a paid user product later.

## Decision

Until a separate paid-user entitlement system exists, **every heavy analysis execution is staff-only and fail-closed**.

The internal `POST /api/internal/analysis/run` route must verify all of the following before any target resolution, provider preflight, model execution, persistence or publication:

1. Vercel environment is Preview.
2. A real authenticated Supabase user exists.
3. The user has one of the existing DivLab execution roles: `founder`, `ceo_divlab`, `admin`.

If any requirement fails, execution stops before cost-bearing analysis work.

## Scope

This patch only hardens the current internal Preview execution boundary.

It does **not**:
- enable ordinary or paying users to run analyses;
- add Stripe, billing, credits, subscriptions or pricing;
- add a queue/job runner;
- change methodology support;
- lower Research 100/100 or Analyst 100/100 gates;
- change source/evidence rules;
- change persistence/publication semantics;
- expose the route in Production.

## Future paid-user boundary

Paid analysis access must be implemented separately. The intended order is:

`authenticated user -> entitlement/credit check -> accepted analysis job -> bounded execution -> quality gates -> private result -> optional editorial/publication flow`

Do not reuse staff roles as a paid-user entitlement model. Do not let a client-side button be the security boundary. The server must decide eligibility before any expensive model/provider work begins.

A production paid-user implementation should also include, before opening access:
- idempotent analysis-request/job identity;
- per-user concurrency limits;
- rate/cost limits;
- explicit entitlement/credit accounting;
- safe retry semantics;
- job states (`queued`, `running`, `completed`, `failed`);
- no automatic public publication from a user-paid run;
- audit/provenance for model usage and result ownership.

## Regression contract

`tests/analysis-run-auth-boundary.test.ts` locks the current Preview contract:
- auth client and authenticated user check occur before target resolution;
- staff-role lookup occurs before provider preflight;
- all three analysis engines are downstream of the role gate;
- auth is not conditional on `publish` or `persist`;
- Preview-only and existing staff roles remain unchanged;
- the existing `publish -> persist` invariant remains intact.

## Validation / release discipline

This work is a small stacked security patch above PR #278.

- Build/test first; do not use Vercel as an edit loop.
- One branch push for the completed patch.
- One normal Preview build only.
- No live Deep Research execution is needed to prove the auth-order change.
- The separate founder-authenticated MSFT acceptance gate in PR #276 remains outstanding and unchanged.
- No merge is authorized by this document.
