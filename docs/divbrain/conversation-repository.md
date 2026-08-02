# DivBrain conversation repository (Ticket 1A-7a)

Server-only persistence layer for `divbrain_conversations` and `divbrain_messages`.

Canonical schema: [`supabase/migrations/20260719110800_create_divbrain_conversations_and_messages.sql`](../../supabase/migrations/20260719110800_create_divbrain_conversations_and_messages.sql).

## Purpose

Provide typed, ownership-safe CRUD for DivBrain conversations and server-controlled message writes. This ticket does **not** implement the full chat lifecycle, AI providers, context assembly orchestration, streaming, or UI.

## Server-only boundary

Modules live under `lib/divbrain/server/repository/`.

- Must never be imported by client components or browser-safe UI.
- Must never be re-exported from shared `lib/divbrain/*` barrels.
- Package-level `import "server-only"` remains deferred (same convention as identity/policy/context/providers).
- Service-role keys must never appear in `NEXT_PUBLIC_*` variables, returned data, or public errors.

## Actor identity contract

Every operation requires a trusted `actorId`:

- Derived only from a trusted server authentication / session layer.
- Never accepted from browser-supplied `userId`, `user_id`, `ownerId`, or `owner_id`.
- Caller-supplied ownership fields on create/update/message payloads are rejected as `invalid_request`.
- Ownership on insert is always set from `actorId`, never from input data.

## Conversation operations

| Operation | Behaviour |
|-----------|-----------|
| `createConversation` | Inserts allowlisted fields (`user_id`, `title`, optional `summary`). Default title: `Ny konversation`. |
| `getConversation` | Actor-scoped read by id. Missing/unowned → `not_found`. |
| `listConversations` | Actor-scoped list. Filter: `active` (default) / `archived` / `all`. |
| `updateConversation` | Allowlisted patch: `title` and/or `summary` only. Empty patch → `invalid_request`. |
| `archiveConversation` | Sets `archived_at`. Idempotent if already archived. Does not delete messages. |
| `restoreConversation` | Clears `archived_at`. Idempotent if already active. |
| `deleteConversation` | Permanent owner delete. DB FK cascades messages (Model A / blueprint). |

## Message operations

| Operation | Behaviour |
|-----------|-----------|
| `listMessages` | Verifies parent ownership first. Chronological transcript only for that conversation. |
| `createMessage` | Server-only path. Verifies ownership, rejects archived conversations, validates role/content/status, inserts allowlisted columns. |

Message UPDATE/DELETE is intentionally not implemented. Messages are removed via conversation delete cascade or account deletion.

Domain mapping returns shared `DivBrainMessage` and intentionally omits DB-only columns (`safety_classification`, `sources`, `error_code`) from the public domain shape. Those columns may still be written on insert for later service use.

## Ownership enforcement

Privileged (service-role) clients bypass RLS. Therefore:

- Every conversation read/update/delete filters by **both** `id` and `user_id = actorId`.
- Conversation lists filter by `user_id = actorId`.
- Message reads/writes verify conversation ownership before proceeding.
- Missing and unowned resources return the same public `not_found` result (no ownership oracle).

RLS remains the database safety net for authenticated session clients. Repository code does not rely on UI checks or caller discipline alone.

## Service-role usage

Message INSERT is denied to authenticated clients (Ticket 1A-6 Model A). Production wiring may use:

- `createDivBrainServiceRolePersistencePort()` — reads `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` and returns **only** a `DivBrainPersistencePort`
- `createSupabaseDivBrainPersistencePort(client)` — adapter for an already-constructed server client (tests / advanced wiring)

The raw service-role Supabase client is **not** exported from the repository public surface and must never be returned to application callers.

The repository itself depends on `DivBrainPersistencePort` (dependency injection). Unit tests use an in-memory fake / recording mock and never require live credentials.

**Service-role decision (authoritative reading):**

- Blueprint/roadmap forbid service role in **user/browser chat paths** and forbid using it as an ownership shortcut (“Using service role for chat | Forbidden”; “No service role in user paths”).
- Ticket 1A-6 Model A simultaneously denies authenticated message INSERT, so server-controlled writes require a privileged server mechanism.
- This module resolves the tension as: tightly scoped **server-only** privileged persistence that never trusts browser ownership fields and always applies explicit `user_id` / ownership filters. It is not a browser-accessible or user-session chat path.

**Known consistency note:** ownership verification then message insert is not one DB transaction. Cross-user insertion remains prevented because `user_id` is not allowlisted for update and inserts only target a conversation id already proven owned by the actor. Concurrent archive/delete can yield safe `invalid_request` / `persistence_failed` rather than data leaks.

## Ordering and pagination

**Conversations**

- Order: `updated_at DESC`, tie-breaker `id DESC`
- Cursor: base64url JSON `{ v:1, k:"conversation", u, i }`
- Default page size 20; max 50

**Messages**

- Order: `created_at ASC`, tie-breaker `id ASC` (matches migration index)
- Cursor: base64url JSON `{ v:1, k:"message", c, i }`
- Default page size 20; max 50

Malformed cursors → `invalid_request`. Cursors contain no secrets.

## Error contract

Public failures use existing `DivBrainError` codes only:

- `invalid_request` — bad actor/resource ids, titles, content, roles, pagination, ownership-field injection, writes to archived conversations
- `not_found` — missing or unowned conversation (and therefore its transcript)
- `persistence_failed` — DB/query/malformed response failures (safe Swedish catalog message)
- `internal_error` — missing privileged configuration and unexpected internal mapping gaps

Never exposed: SQL, service-role values, stack traces, other users’ ids, raw Supabase payloads.

## Test strategy

- `lib/divbrain/server/repository/repository.test.ts`
- In-memory `DivBrainPersistencePort` fake
- No remote Supabase project, no production keys
- Asserts ownership scoping, allowlists, pagination determinism, mapping safety, and safe errors

Run: `npm run test:divbrain`

## Known consistency limitations

- Ownership check then message insert is **not** a single atomic DB transaction. A concurrent delete/archive between check and insert can race; document rather than invent locking.
- Archive/restore idempotency is application-level (read then conditional update).
- Equal timestamps rely on id tie-breakers; cursors remain stable for unchanged rows.
- Pagination while new rows arrive may skip/duplicate across pages under concurrent writes — acceptable for Internal Alpha list UX; no offset pagination.
- Remote migration apply is **out of scope**; repository code does not require a live remote schema.

## Deferred to Ticket 1A-7b

- Auth → allowlist → validate → guardrails → persist lifecycle
- Context assembly orchestration + provider calls
- Blocked-content non-persistence policy at the service layer
- API routes / chat UI / streaming
- Auto-titling, summarisation jobs, analytics
