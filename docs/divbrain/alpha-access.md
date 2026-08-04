# DivBrain Internal Alpha access (Ticket 1A-8)

Server-only Henrik-first Internal Alpha allowlist for DivBrain.

Depends on:

- Ticket 1A-7b application service (`docs/divbrain/application-service.md`)
- Existing auth/session helpers (`lib/auth/session.ts`)

## Purpose

Enforce who may use DivBrain during Internal Alpha **before** input validation, guardrails, repository access, context assembly, or provider calls.

Initial policy: **Henrik only**, configured via environment — never hardcoded in source.

## Environment variable

```text
DIVBRAIN_ALPHA_USER_IDS
```

- **Server-only** — never `NEXT_PUBLIC_*`
- Comma-separated Supabase Auth user UUIDs
- Entries trimmed; comparison uses canonical lowercase UUIDs
- Duplicates allowed and deduplicated
- No emails, usernames, wildcards, or substring matching

Example shape only (fake ids):

```text
DIVBRAIN_ALPHA_USER_IDS=11111111-1111-4111-8111-111111111111
```

Never commit, log, or document a real configured UUID.

Configuration is read when the gate factory runs (or via injected raw value), not permanently captured at module-import time.

## Strict parser

`parseDivBrainAlphaUserIds(unknown)`:

- Requires a non-empty string
- Splits on commas; rejects empty tokens (trailing/double commas)
- Validates every entry as a complete UUID
- Normalizes to lowercase; deduplicates
- Requires at least one id; max `DIVBRAIN_ALPHA_USER_IDS_MAX_ENTRIES` (16)
- **Fail-closed:** one malformed entry rejects the entire configuration
- Never returns the raw environment string in errors

## Access gate

```ts
createDivBrainAlphaAccessGate({ rawUserIds?, readEnvironment? })
createDivBrainAlphaAccessGateFromEnvironment()
```

Implements `DivBrainAccessGate.checkAccess(actorId)`:

| Case | Public result |
|------|----------------|
| Exact normalized match | success |
| Not allowlisted | `access_denied` |
| Missing / empty / malformed config | `access_denied` |
| Malformed actor id | `access_denied` |
| Unexpected exception | `access_denied` |

All denied paths use the same catalog `access_denied` message. No configuration oracle.

The gate exposes only `checkAccess` — never a method that lists configured ids.

## Actor resolver

```ts
createDivBrainSessionActorResolver({ getAuthenticatedUser? })
```

- Uses `getAuthenticatedUser()` by default (no `redirect()`)
- Authenticated valid UUID → `{ actorId }` (lowercase)
- Unauthenticated (`null`) → `authentication_required`
- Malformed authenticated id → `internal_error`
- Any thrown auth/session value → fresh catalog `internal_error` (never `divBrainFailureFromUnknown`; thrown catalog codes cannot select the public code)
- Result never includes email, profile, tokens, or the Supabase User object

## Lifecycle placement

Inside `submitMessage` (Ticket 1A-7b), order remains:

1. Authenticate (`actorResolver`)
2. **Alpha access gate** ← this ticket
3. Validate input
4. Guardrails / repository / context / provider …

Page-level `/brain` checks are an **additional presentation boundary**, not a replacement for service-level enforcement.

## Application-service wiring

```ts
createDivBrainAlphaApplicationServiceDeps({ repository, ... })
createDivBrainAlphaApplicationService({ repository, ... })
```

Binds concrete actor resolver + Alpha gate to the 1A-7b defaults (`UnconfiguredProvider`, guardrails, context, mapper).

Does **not** create API routes, server actions, or service-role clients.

## `/brain` page behavior

| State | Behavior |
|-------|----------|
| Unauthenticated | `requireAuthenticatedUser()` → redirect `/login` |
| Authenticated, denied | Calm unavailable placeholder; no repository/service calls |
| Authenticated, allowlisted | Honest DivBrain shell (Ticket 1A-9a) — see `alpha-shell.md` |
| Unexpected `checkAccess` throw | Fail closed → unavailable (exception never escapes to the page) |

Denied copy uses the catalog meaning of `access_denied` without revealing configuration details.

## Security rules

- No `NEXT_PUBLIC_DIVBRAIN_ALPHA_USER_IDS`
- No allowlist in client bundles, HTML, props, logs, or errors
- No admin panel, entitlement DB, or hardcoded bypass
- Missing/malformed config fails closed
- Exact UUID equality only
- Actor id only from authenticated session

## Rollback

Remove or empty `DIVBRAIN_ALPHA_USER_IDS` in the deployment environment. All users then receive `access_denied` / unavailable (fail closed).

## Runtime configuration

Local / Preview / production must set `DIVBRAIN_ALPHA_USER_IDS` through the host’s secret store (e.g. Vercel env). This ticket does **not** mutate those values.

## Testing

`lib/divbrain/server/access/access.test.ts` — injected fake UUIDs only; no live Supabase; no real allowlist values.

## Deferred

| Item | Owner |
|------|--------|
| Honest `/brain` shell + read-only history | Ticket 1A-9a (`alpha-shell.md`) |
| Functional composer + conversation mutations | Ticket 1A-9b |
| Real AI provider | Phase 1B |
| Broader entitlements / plans | post-Alpha |

## Explicit honesty

- `UnconfiguredProvider` remains the only runtime provider
- No real AI answers exist
- No migration / RLS / remote Supabase work in this ticket
