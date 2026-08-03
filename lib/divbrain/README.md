# DivBrain domain package

Shared DivBrain domain language for server and client.

## Boundaries

- **Shared (this folder today):** `constants`, `types`, `errors`, `results`, `validation`, `sources`, `citations`, `guardrails` — safe to import from server or client.
- **Server-only by convention:** `server/guardrails`, `server/guardrail-evals`, `server/providers`, `server/identity`, `server/policy`, `server/context`, `server/context-evals`, `server/repository`, `server/service`, `server/access` — detection logic, eval fixtures, identity/policy text, context assembly, provider boundary, conversation persistence, application-service orchestration, and Internal Alpha access. These modules live under `lib/divbrain/server/` and **must never be imported by client components** or other browser-safe UI. Package-level `import "server-only"` is deferred until an approved dependency/foundation ticket; folder placement and this README are the current boundary.
- Later tickets add real provider adapters, Learning retrieval, and full `/brain` UI wiring under the same server-only rule.
- Browser-safe modules must never import server-only DivBrain code.
- Never expose secrets, tokens, emails, raw provider/DB errors, stack traces, or hidden reasoning across the browser boundary.

## Guardrails (Tickets 1A-3a / 1A-3b)

- `guardrails.ts` — canonical decisions, reason codes, enforceable constraints, public-message catalog, assessment builders.
- `server/guardrails.ts` — deterministic normalization + multi-finding evaluation + `evaluateDivBrainGuardrails`.
- `server/guardrail-evals.ts` — pure deterministic runner and safe reports (no raw prompts).
- `server/guardrail-eval-fixtures/` — static fixtures. Ticket **1A-3b** expanded the suite from the approved **28** baseline cases by adding **44** new cases (**72** total). The original 28 remain first, in original order, as the regression baseline.

### Canonical decisions

Exactly:

- `allow` — general educational/informational answer may proceed
- `allow_with_constraints` — answer only while applying all returned constraints
- `block` — do not comply with the requested action; a safe educational alternative may still be offered in copy

Severity: `block` > `allow_with_constraints` > `allow`.

### Reason codes and constraints

- Several reason codes may coexist; duplicates are removed; order follows `DIVBRAIN_GUARDRAIL_REASON_CODES`.
- Constraints are machine-readable response behaviors (not disclaimer labels); order follows `DIVBRAIN_GUARDRAIL_CONSTRAINTS`.
- Ordinary allowed education normally returns empty `reasonCodes` and `constraints`.
- Invalid/malformed input is a technical `invalid_request`, not a policy reason.

### Assessment shape

```ts
{
  decision,
  reasonCodes,
  constraints,
  policyVersion,
  publicMessageKey,
  publicMessage // catalog-backed Swedish only
}
```

Assessments never include raw prompts, matched text, regexes, rule ids, secrets, or user identifiers. Public messages come only from `DIVBRAIN_GUARDRAIL_PUBLIC_MESSAGES_SV`, selected by fixed reason priority (never concatenated).

### Policy block vs technical error

- **Technical invalid input** → `DivBrainResult` failure with `invalid_request`.
- **Policy outcome** → successful assessment (`decision: "block"` is not a thrown error).
- Later service layers map blocks to `safety_blocked` for the UI.

### Determinism and limitations

- Findings are aggregated from named predicates; first-match-wins single-reason models are not used.
- This is an initial deterministic filter — **not** complete semantic safety. Provider-side policy and later eval expansion remain required.

### Expanded evals (1A-3b)

Fixtures live under `server/guardrail-eval-fixtures/` and are aggregated as `DIVBRAIN_GUARDRAIL_EVAL_CASES`. The pure runner (`runDivBrainGuardrailEvals` in `server/guardrail-evals.ts`) asserts decision, reasonCodes, constraints, policyVersion, and `publicMessageKey`.

Coverage focus in the expanded suite:

- broader Swedish variants plus a small set of straightforward English cases
- educational / protective near-misses and clear negation
- multi-finding combinations and decision / public-message precedence
- spacing, punctuation, and casing normalization already supported by the matcher

The runner remains pure and non-automatic: it does not run on import or build, access the network, filesystem, environment, current time, or randomness. **No approved runtime test foundation exists yet**, so this ticket does **not** claim that the **28** baseline, **44** new, or **72** total fixtures have been executed at runtime or in CI.

Deterministic pattern matching still has known false positives and false negatives. Semantic and provider-side safety remain later work. Assessment/report contracts are unchanged from 1A-3a.

## Context assembly (Ticket 1A-4)

Server-owned identity, policy, and context assembly under `server/`:

- `identity.ts` — Swedish DivBrain persona (trusted system text)
- `policy.ts` — financial-safety + response-format text; reuses guardrail constraints
- `context/` — normalize, budget, assemble, delimiters, provider mapping
- `context-eval-fixtures/` + `context-evals.ts` — focused behavioural evals

Canonical documentation: [`docs/divbrain/context-assembly.md`](../../docs/divbrain/context-assembly.md).

### Contract

```ts
assembleDivBrainContext(input) → DivBrainResult<DivBrainAssembledContext>
mapAssembledContextToProviderRequest(assembled, { timeoutMs }) → DivBrainResult<DivBrainProviderRequest>
```

### Rules

- Provider-neutral assembly; Ticket 1A-5 mapping is a separate adapter.
- Blueprint priority: identity → policy → response_format → sources/knowledge → history → user → optional → tools → freshness.
- Budgets use **estimated tokens** (`ceil(chars / 4)`), not an exact tokenizer.
- Untrusted sources/history are delimited; they cannot replace trusted policy.
- No database access inside the assemble core; no live provider calls in unit tests.
- Minimal test runner: `npm run test:divbrain` (tsx + node:test). Full CI wiring remains Ticket 1A-10 scope.

## Provider interface (Ticket 1A-5)

Server-owned, provider-neutral generation boundary under `server/providers/`:

- `types.ts` — request/response shapes, context-block kinds, optional token-usage hooks (no cost math)
- `provider.ts` — `DivBrainProvider` contract + safe unknown-error mapping
- `validation.ts` — deterministic request validation / usage normalization
- `unconfigured-provider.ts` — `UnconfiguredProvider` (explicit unconfigured state)

### Contract

```ts
generate(request) →
  | { status: "completed"; text; usage; sources? }
  | { status: "cancelled" }
  | { status: "provider_unavailable"; error }
  | { status: "failed"; error }
```

### Rules

- No real AI SDK, API keys, environment reads, network calls, streaming, or tool calls in 1A-5.
- `UnconfiguredProvider` returns catalog `provider_unavailable` for valid requests and **never** fabricates assistant text.
- Invalid requests map to `failed` + `invalid_request`; already-aborted signals map to `cancelled`.
- Later adapters catch SDK exceptions and map via `mapUnknownToDivBrainProviderResult` — raw vendor payloads must not cross this boundary.
- Token-usage fields are optional normalized integer hooks only; pricing/billing remain later work.
- No provider registry, factory framework, or selection logic in this ticket.

## Persistence schema (Ticket 1A-6)

Supabase migration (applied and verified on the approved remote project; this package documents the contract):

`supabase/migrations/20260719110800_create_divbrain_conversations_and_messages.sql`

- `divbrain_conversations` — owner via `auth.users`, title/summary, optional `archived_at`, `schema_version`, timestamps
- `divbrain_messages` — conversation cascade, roles `user`/`assistant`/`system`, completion statuses, optional safety classification, JSONB `sources` (array shape only), optional catalog `error_code`
- No `provider_meta` or other provider/SDK metadata columns (deferred to a later explicit ticket if needed)
- RLS: authenticated owner-only on conversations; anon denied; conversation DELETE cascades messages; account delete cascades conversations
- Conversation INSERT is column-restricted (`user_id`, `title`, `summary`, `archived_at`); system-owned `id` / `schema_version` / timestamps use database defaults
- Messages (**Model A**): authenticated **SELECT only** via parent ownership. No authenticated INSERT/UPDATE/DELETE. Message creation is server-owned and deferred to Tickets 1A-7a / 1A-7b
- Transcript ordering for later repositories: `ORDER BY created_at ASC, id ASC` (index `(conversation_id, created_at, id)`)
- Soft archive never replaces permanent owner DELETE
- No `divbrain_usage_events` in 1A-6 (deferred)
- RLS and privileges were reviewed statically in this ticket; they were **not** runtime-tested against a live database

## Conversation repository (Ticket 1A-7a)

Server-only persistence under `server/repository/`:

- `repository.ts` — actor-scoped CRUD: create/get/list/update/archive/restore/delete conversations; list/create messages
- `persistence.ts` + `supabase-persistence.ts` — injectable port + Supabase adapter
- `service-role-client.ts` — privileged **port** factory for Model A message writes (raw admin client never exported)
- `mapping.ts` / `pagination.ts` / `rows.ts` — row↔domain mapping and deterministic cursors

Canonical documentation: [`docs/divbrain/conversation-repository.md`](../../docs/divbrain/conversation-repository.md).

### Contract

```ts
createDivBrainConversationRepository({ persistence }) → DivBrainConversationRepository
```

Trusted `actorId` is required on every call. Ownership fields from callers are rejected. Missing and unowned resources both return `not_found`.

### Rules

- No live remote Supabase required for unit tests (`npm run test:divbrain`).
- No schema/RLS/migration changes in this ticket.
- No AI-provider calls, context orchestration, API routes, or chat UI (Ticket 1A-7b+).

## Application service (Ticket 1A-7b)

Server-only request lifecycle under `server/service/`:

- `service.ts` — `createDivBrainApplicationService` / `submitMessage`
- `input.ts` — exact-key browser-input boundary
- `history.ts` — bounded completed-history loading for context
- `types.ts` — actor resolver, access gate, outcome union

Canonical documentation: [`docs/divbrain/application-service.md`](../../docs/divbrain/application-service.md).

### Contract

```ts
createDivBrainApplicationService(deps).submitMessage(input, options?)
  → DivBrainResult<DivBrainSubmitMessageOutcome>
```

### Rules

- Auth → Alpha access gate → validate → guardrails → blocked (no persist) vs allowed (ownership → history → persist user → context → provider → persist terminal)
- Phase 1A provider remains `UnconfiguredProvider` (honest `provider_unavailable`; never fabricates answers)
- Blocked prompts cause zero repository/provider calls and are not persisted
- No API routes, server actions, or full `/brain` UI in this ticket (1A-8 adds Alpha access; 1A-9 owns the shell)

## Internal Alpha access (Ticket 1A-8)

Server-only allowlist under `server/access/`:

- `parse.ts` — strict `DIVBRAIN_ALPHA_USER_IDS` parser (fail-closed)
- `gate.ts` — concrete `DivBrainAccessGate`
- `actor-resolver.ts` — session-backed `DivBrainActorResolver` (no `redirect()`)
- `wiring.ts` — deps helper for the 1A-7b application service
- `page-access.ts` — `/brain` presentation decision helper

Canonical documentation: [`docs/divbrain/alpha-access.md`](../../docs/divbrain/alpha-access.md).

### Rules

- Server-only env var `DIVBRAIN_ALPHA_USER_IDS` (never `NEXT_PUBLIC_*`)
- Exact normalized UUID match; missing/malformed config → catalog `access_denied`
- No hardcoded user ids; no allowlist logging; no entitlement database
- Page-level `/brain` gate is additional to service-level `checkAccess` in `submitMessage`

## Sources and citations

- `sources.ts` — categories, verification/freshness, source validation, URL/route policy, serialization, deduplication.
- `citations.ts` — numbered citation references, citation validation/serialization, grounded-answer shape.
- Generated interpretation is never a source category.
- External `canonicalUrl` and `internalRoute` are separate fields.
- `recordRef` is an opaque document/record identifier only — not a URL, credential, or provider blob.
- Syntactically valid URLs are not inherently trusted; no domain allowlist in this layer.
- Deduplication uses id → canonical URL → internal route; titles alone never merge sources.
- Exact same-ID duplicates with compatible material are dropped.
- Compatible different-ID duplicates (same URL or internal route) keep the first source/ID and alias later IDs → retained ID (`sourceIdAliases`).
- Contradictory material on any identity match fails validation.
- Citation builders: one entry per source, or multiple appearances sharing one number per `sourceId`.
- Citation validation requires contiguous numbers `1..N` and a stable one-number-per-sourceId mapping.
- `retrievedAt` requires a full UTC instant (`...Z`); `publishedAt` / `dataAsOf` allow calendar date or UTC instant.
- `retrievedAt` is attachment/retrieval metadata only — not source identity, provenance, verification, freshness, publication time, or data-as-of. Compatible duplicates keep the first-seen `retrievedAt`.
- Grounded answers remap citation IDs through aliases, preserve citation numbers, and fail on numbering conflicts after alias resolution.
- Orphan citations and unused final sources are rejected.
- Final grounded-answer payloads contain only retained cited sources (aliases are not retained in the payload).
- Unknown extra fields on parse/validate input are ignored and not retained in output.

## Plain text and rendering

- Source/citation text validation rejects tag-shaped HTML/XML markup, not bare comparison operators such as `P/E < 15`.
- Validated plain text is **not** safe for `dangerouslySetInnerHTML`.
- Render with normal React text escaping at UI time.

## System messages

`system` is a valid internal role for server-controlled messages only. Browser input must never supply system-policy text, and policy text must not be exposed to clients merely because the shared role union includes `system`.

## Ownership privacy

`access_denied` and `not_found` both exist in the taxonomy. Future owner-scoped conversation/message reads should normally map missing and cross-owner resources to the same safe `not_found` response so ownership is not leaked.
