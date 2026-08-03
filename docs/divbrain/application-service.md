# DivBrain application service (Ticket 1A-7b)

Server-only request lifecycle orchestration for DivBrain message submission.

Canonical foundations:

- Guardrails: Ticket 1A-3 (`lib/divbrain/server/guardrails.ts`)
- Context assembly: Ticket 1A-4 (`docs/divbrain/context-assembly.md`)
- Provider boundary: Ticket 1A-5 (`UnconfiguredProvider`)
- Schema / RLS: Ticket 1A-6 (already applied remotely)
- Repository: Ticket 1A-7a (`docs/divbrain/conversation-repository.md`)

## Purpose

Coordinate authentication, Alpha access, validation, guardrails, ownership-safe persistence, context assembly, provider execution, and safe terminal persistence.

This ticket does **not** wire the service into UI, API routes, or Next.js server actions.

## Server-only boundary

Modules live under `lib/divbrain/server/service/`.

- Must never be imported by client components or browser-safe UI
- Must never be re-exported from shared `lib/divbrain/*` barrels
- Package-level `import "server-only"` remains deferred
- Service core must not import Supabase, React, Next.js navigation, or `process.env`

## Public contract

```ts
createDivBrainApplicationService(deps) → {
  submitMessage(input: unknown, options?: { signal?: AbortSignal })
    → Promise<DivBrainResult<DivBrainSubmitMessageOutcome>>
}
```

Browser-facing input (exact keys only):

```ts
{ conversationId: string; content: string }
```

The runtime boundary requires an **actual plain object**:

- accepted prototypes: `Object.prototype`, or `null` (`Object.create(null)`)
- rejected: class instances, `Date`, `Map`, `Set`, `RegExp`, boxed primitives, other custom prototypes
- prototype-inspection failures return catalog `invalid_request` (never throw)

Trusted `AbortSignal` may be supplied separately by a server caller. It is never part of the browser JSON payload.

## Dependency interfaces

| Dependency | Role |
|------------|------|
| `actorResolver.resolveActor()` | Trusted authenticated actor id, or `authentication_required` |
| `accessGate.checkAccess(actorId)` | Alpha gate, or `access_denied` |
| `repository` | Ticket 1A-7a `DivBrainConversationRepository` |
| `guardrailEvaluator.evaluate(content)` | Ticket 1A-3 assessment |
| `contextAssembler.assemble(input)` | Ticket 1A-4 assembly |
| `providerRequestMapper.map(assembled, options)` | Ticket 1A-4 → 1A-5 mapping |
| `provider.generate(request)` | `DivBrainProvider` (Phase 1A: `UnconfiguredProvider`) |
| `providerTimeoutMs` | Server-controlled timeout within provider bounds |

Phase 1A default timeout: `DIVBRAIN_APPLICATION_PROVIDER_TIMEOUT_MS_DEFAULT` (30_000 ms).

Helper: `createDivBrainApplicationServiceDeps(...)` binds approved default evaluator/assembler/mapper/`UnconfiguredProvider` while keeping actor resolver, access gate, and repository required.

## Exact lifecycle order (`submitMessage`)

1. Resolve authenticated actor
2. Enforce Alpha access gate
3. Strictly parse/normalize browser input (exact-key allowlist)
4. Evaluate deterministic guardrails
5. Branch immediately on `decision: "block"`
6. Verify conversation belongs to the actor (`getConversation`)
7. Verify conversation is active (not archived)
8. Load bounded prior conversation history
9. Persist the allowed current user message
10. Assemble context (prior history + current user message)
11. Map assembled context to a provider request
12. Execute the provider
13. Normalize/validate the provider result
14. Persist exactly one safe terminal assistant result
15. Return a safe typed lifecycle outcome

## Authentication contract

- Actor id originates only from `actorResolver`
- Browser input cannot supply `actorId` / `userId` / `ownerId`
- Auth failure → `authentication_required`
- No access-gate, validation, guardrail, repository, context, or provider calls after auth failure
- Results never include email, session tokens, or Auth-user fields

## Alpha access-gate contract

- Runs immediately after authentication and before input validation
- Denial → `access_denied`
- No repository/guardrail/context/provider calls after denial
- Concrete env-backed gate: Ticket **1A-8** (`docs/divbrain/alpha-access.md`) via `DIVBRAIN_ALPHA_USER_IDS`
- Do not hardcode Henrik’s user id; do not invent entitlement tables

## Strict input boundary

`parseDivBrainSubmitMessageInput`:

- Requires a plain object with **exactly** `conversationId` and `content`
- Rejects null/arrays/primitives/extra keys/forbidden injection fields
- Then uses `validateSubmitMessageInput` + UUID normalization
- Failures → catalog `invalid_request` only (no raw input in errors)

## Blocked non-persistence guarantee

When `decision === "block"`:

- Return `{ status: "blocked", persisted: false, error: safety_blocked, guardrailAssessment }`
- **Zero** repository calls
- **Zero** context / provider-mapping / provider calls
- Do **not** persist `completion_status = "blocked"` prompt content in Phase 1A
- Do not log or emit the prompt through errors/diagnostics

Blocked is an expected lifecycle outcome (`ok: true`), not an uncaught exception.

## Allowed user-message persistence

For `allow` / `allow_with_constraints`, after ownership + archive + history succeed:

| Field | Value |
|-------|--------|
| `role` | `"user"` |
| `completionStatus` | `"completed"` |
| `safetyClassification` | assessment.decision |
| `errorCode` | `null` |
| `content` | normalized (trimmed) content |

Sources omitted/empty for user messages.

If user persistence fails: stop; no context/provider/assistant persistence.

## Ownership and archive

- Uses repository ownership filters with trusted actor id
- Missing and cross-owner → same `not_found`
- Archived → `invalid_request` (no auto-restore)
- Never trusts UI state for ownership/existence/archive

## History strategy

Eligible prior turns only:

- same conversation
- role `user` or `assistant`
- `completionStatus === "completed"`
- non-empty content

Excluded: system / pending / generating / blocked / failed / cancelled / provider_unavailable.

Load history **before** inserting the current user message. Pass current message separately as `currentUserMessage` (no duplication).

### Transcript-scan bound

- Page through `listMessages` with repository cursors (max page size 50)
- Maximum rounds: `DIVBRAIN_HISTORY_MAX_PAGE_ROUNDS` (= 10 → ≤ 500 rows scanned)
- Detect repeated cursors / no-progress pagination → `internal_error`
- Keep latest `DIVBRAIN_MAX_CONTEXT_HISTORY_MESSAGES` (20) eligible turns, chronological
- If scan bound exceeded before reaching transcript end → fail **before** user persistence

Phase 1A limitation: very long transcripts beyond the scan bound cannot be fully walked without a later reverse-query optimization.

## Context assembly integration

Calls `assembleDivBrainContext` with:

- normalized current user message
- conversation id
- filtered prior history
- `guardrailConstraints`: assessment constraints for `allow_with_constraints`, else `[]`
- no Learning/tools/portfolio/watchlist/live-data sources

Browser-facing results never expose assembled context, identity/policy sections, or diagnostics.

## Provider mapping and execution

- `mapAssembledContextToProviderRequest` with server `providerTimeoutMs` (+ optional trusted signal)
- Default provider: `UnconfiguredProvider` → honest `provider_unavailable`
- Thrown unknowns map via `mapUnknownToDivBrainProviderResult`
- Provider return values are runtime-validated and sanitized via `normalizeDivBrainProviderResult` into **safe copies** (never provider-owned objects unchanged)
- `failed` / `provider_unavailable` require catalog-valid `DivBrainError` objects; arbitrary `{ code: string }` is rejected
- Unknown / malformed provider error codes become `failed` + catalog `internal_error`
- Valid `provider_unavailable` always rebuilds the exact catalog `provider_unavailable` error
- Malformed provider output cannot escape `submitMessage` as an exception; after user persistence it yields one safe failed assistant terminal row
- Never fabricates financial answers

## Terminal assistant persistence

Exactly one terminal assistant row after allowed user persistence (no pending/generating rows).

| Provider status | completionStatus | content | errorCode | sources |
|-----------------|------------------|---------|-----------|---------|
| completed (valid) | `completed` | normalized non-empty text | `null` | validated sources or `[]` |
| provider_unavailable | `provider_unavailable` | catalog message | `provider_unavailable` | `[]` |
| failed | `failed` | catalog message | safe code | `[]` |
| cancelled | `cancelled` | catalog message | `cancelled` | `[]` |
| completed (invalid text/sources) | `failed` | catalog `internal_error` | `internal_error` | `[]` |

### Post-user-persistence failure recovery

If context assembly, mapping, provider execution, or result validation fails after the user message was stored:

- attempt one safe failed assistant terminal insert
- do not delete/rewrite the user message
- do not invent DB rollback
- return failed terminal outcome if assistant row stored
- return `persistence_failed` if terminal insert also fails

**Non-atomic:** repository operations are not one DB transaction.

## Safe result contract

```ts
type DivBrainSubmitMessageOutcome =
  | {
      status: "blocked"
      persisted: false
      error: DivBrainError // safety_blocked
      guardrailAssessment: DivBrainGuardrailAssessment
    }
  | {
      status: "completed" | "provider_unavailable" | "failed" | "cancelled"
      persisted: true
      guardrailAssessment: DivBrainGuardrailAssessment
      userMessage: DivBrainMessage
      assistantMessage: DivBrainMessage
    }
```

Pre-lifecycle failures remain `DivBrainResult` failures (`authentication_required`, `access_denied`, `invalid_request`, `not_found`, …).

Never returned: system policy, assembled context, provider request, raw DB rows, emails, actor ids, service-role data, tokens, stack traces, env values, AbortSignal.

## Service-role boundary

- Application service uses only `DivBrainConversationRepository`
- Service-role wiring stays behind Ticket 1A-7a persistence port
- No raw service-role client export from this module

## Testing strategy

`lib/divbrain/server/service/service.test.ts` — recording in-memory fakes; no live Supabase; no network AI.

Run: `npm run test:divbrain`

## Production-wiring requirements

Still required before live Alpha use:

1. Secure runtime configuration of `DIVBRAIN_ALPHA_USER_IDS` (1A-8 code is present; env is a release step)
2. Repository wired with privileged persistence port for Model A message writes
3. Later tickets for `/brain` UI / server actions / API routes

## Deferred

| Item | Ticket / phase |
|------|----------------|
| Secure host env configuration of the allowlist | release / ops |
| `/brain` shell / composer / UI | 1A-9a / 1A-9b |
| Real provider selection / SDK | Phase 1B |
| Learning retrieval | Phase 1C |
| Usage/cost persistence, analytics | later |
| Streaming, tool calls | later |

## Explicit honesty

- Ticket 1A-6 is already remotely applied; this ticket adds **no** migration
- Default provider remains `UnconfiguredProvider`
- **No real AI answer is generated**
- Do not deploy this as a live AI feature
