# DivBrain Internal Alpha interaction (Ticket 1A-9b)

Conversation management and honest message submission for Internal Alpha.

Depends on:

- Ticket 1A-7a conversation repository
- Ticket 1A-7b application service
- Ticket 1A-8 Alpha access gate
- Ticket 1A-9a read-only shell
- Applied service-role grant migration `20260804183000`

## Responsibility

Ticket **1A-9b** owns the interaction layer behind the existing Alpha gate:

- create / rename / archive / restore / permanent delete
- active vs archived conversation discovery
- functional composer
- submission through Ticket 1A-7b
- honest `provider_unavailable` persistence UI
- safe blocked / failed / cancelled / pending presentation
- accessible dialogs and pending states

It does **not** connect a real AI provider, stream tokens, retrieve Learning content, use market data, or invent answers.

## Server-action boundary

Thin Next.js actions live in `app/brain/actions.ts` (`"use server"`).

Deterministic orchestration lives in:

- `lib/divbrain/server/ui/interaction.ts`
- `lib/divbrain/server/ui/action-state.ts`

Every mutation action independently:

1. Resolves the authenticated actor (`createDivBrainAlphaAccessModule`)
2. Enforces the Internal Alpha gate
3. Parses only named FormData fields into plain objects
4. Constructs the runtime repository
5. Calls the actor-scoped repository operation or Alpha application service
6. Returns a browser-safe action state or redirects to a safe `/brain` URL

Message submission uses:

```ts
createDivBrainAlphaApplicationService({ repository }).submitMessage({
  conversationId,
  content,
})
```

The UI never calls `repository.createMessage` directly and never duplicates guardrails/provider logic.

## Action input allowlists

| Action | Allowed fields |
|--------|----------------|
| Create | none (default title `Ny konversation`) |
| Rename | `conversationId`, `title` |
| Archive | `conversationId` |
| Restore | `conversationId` |
| Delete | `conversationId`, `confirmDelete=permanent`, optional `archiveScope` |
| Submit | `conversationId`, `content` |

Never accepted from the browser: actor/user/owner ids, role, completion status, safety classification, sources, error codes, provider config, AbortSignal, or environment data.

## Active / archived scope

Safe query parameter:

- `archive=active` (default; omitted in URLs)
- `archive=archived`

Malformed values resolve to `active`. The loader calls `listConversations` with exactly `archiveFilter: "active" | "archived"` — never `"all"` for the normal UI list.

## Permanent delete

Requires an explicit confirmation dialog before the destructive form is submitted. Opening the menu or confirmation does not delete. FK cascade removes messages. Soft-delete is not added.

## Message submission honesty

Default provider remains `UnconfiguredProvider`.

| Outcome | Persistence | Composer |
|---------|-------------|----------|
| `blocked` | none | retain text; show safety catalog copy |
| `provider_unavailable` | user + assistant terminal rows | clear; refresh transcript |
| `failed` / `cancelled` | may already be persisted | clear/refresh; catalog copy |
| pre-lifecycle error | none | retain text |

Copy must never describe provider-unavailable as a successful AI answer.

## Safe action-state contract

Browser-visible fields only:

- `status`
- `safeMessage`
- `persisted`
- `clearComposer`

Never returned: actor/owner ids, prompt text, raw DB/provider errors, stacks, environment values, assembled context, system policy, or service-role data.

## Navigation / revalidation

Successful create / archive / restore / delete redirect through `buildDivBrainHref` only. Message submit and rename revalidate `/brain`. No open redirects.

## Accessibility and responsive behavior

Preserves Ticket 1A-9a drawer/focus contracts and adds:

- accessible Aktiva / Arkiverade scope control
- rename dialog labelled + focus move/restore
- delete dialog labelled/described; Cancel receives initial focus
- composer `aria-live` feedback
- pending/disabled semantics

## Current limitations

- No real provider / SDK / network AI calls
- No streaming or cancel-generation network behavior
- No Learning retrieval or citations
- No market/portfolio tools
- No auto-title, summaries, analytics, billing, or usage persistence
- No schema/RLS/grant changes in this ticket
