# DivBrain Internal Alpha shell (Ticket 1A-9a)

Honest read-only `/brain` shell for Internal Alpha.

Depends on:

- Ticket 1A-7a conversation repository
- Ticket 1A-7b application service
- Ticket 1A-8 Alpha access gate

## Responsibility

Ticket **1A-9a** owns the visual and read-only product foundation:

- authenticated + allowlisted page access
- DivBrain header and Intern Alpha badge
- provider-unavailable honesty
- desktop conversation rail
- accessible mobile/tablet history drawer
- read-only conversation list and transcript
- empty, not-found, and data-unavailable states
- disabled composer layout
- persistent non-advice / privacy note
- legacy mock cleanup
- `/dashboard/brain` → `/brain` redirect

It does **not** submit messages, create conversations, or generate AI answers.

## Canonical route

- Canonical: `/brain`
- Selection: `/brain?conversation=<uuid>`
- Legacy: `/dashboard/brain` redirects server-side to `/brain`

## Authentication and Alpha-access order

`app/brain/page.tsx` preserves:

1. `requireAuthenticatedUserWithProfile()`
2. `resolveDivBrainAlphaPageAccess({ actorId })`
3. Denied → calm unavailable placeholder inside AppShell (**zero** repository calls)
4. Allowed → `createDivBrainRuntimeRepository()` then `loadDivBrainShellData(...)`
5. Render `DivBrainShell` with a browser-safe view model

Denied users must trigger:

- zero DivBrain repository calls
- zero message reads
- zero application-service calls
- zero provider calls

Page-level access remains an additional presentation boundary. The reusable 1A-7b service-level gate is unchanged.

## Denied zero-repository guarantee

Denied copy:

- Title: `DivBrain är inte tillgängligt`
- Description: `DivBrain är inte tillgängligt för det här kontot. DivBrain testas just nu i en begränsad intern Alpha.`

No actor UUID, allowlist configuration, environment names, or admin instructions are revealed.

## Server-only repository wiring

`createDivBrainRuntimeRepository()` composes:

- `createDivBrainServiceRolePersistencePort()`
- `createDivBrainConversationRepository()`

Returns only `DivBrainResult<DivBrainConversationRepository>`.

Never returns a Supabase client, credentials, or persistence internals.

## Read-only shell data flow

```text
actorId (session) + selectedConversationId (query)
  → loadDivBrainShellData({ actorId, selectedConversationId, repository })
  → DivBrainShellViewModel (browser-safe)
  → DivBrainShell
```

View model never includes actor/user/owner ids, email, profile, raw repository errors, system messages, policy/context, or environment state.

### Safe view-model states

| State | Meaning |
|-------|---------|
| `empty` | No active conversations |
| `ready` | Selected owned conversation + transcript |
| `conversation_not_found` | Malformed, missing, or cross-owner id |
| `data_unavailable` | Repository / list / transcript failure |

## Conversation selection

| Case | Behavior |
|------|----------|
| No id, no conversations | Empty state |
| No id, conversations exist | Select most recently returned active conversation (no redirect) |
| Valid owned id | Render that conversation |
| Malformed / missing / cross-owner | Same calm `conversation_not_found` |

Archived conversations may be opened explicitly (read-only, Arkiverad indicator). No restore action in 1A-9a.

## Conversation pagination

- `archiveFilter: "active"`
- `DIVBRAIN_SHELL_CONVERSATION_PAGE_SIZE = 30`
- First page only
- `hasMoreConversations` from `nextCursor !== null`
- Cursor is **not** exposed to the browser model
- Calm note when more conversations exist

## Transcript pagination and bounds

| Bound | Value |
|-------|-------|
| Page size | repository max (`50`) |
| Max page rounds | `10` |
| Max scanned rows | `500` |
| Max rendered messages | latest `100` |

Requirements:

- reach transcript tail before presenting as current
- detect repeated / no-progress cursors
- fail safely on scan overflow (`data_unavailable`)
- preserve chronological order
- `historyTruncated: true` when older messages are omitted

Unlike the context-history loader, the UI transcript retains safe terminal statuses (`completed`, `provider_unavailable`, `failed`, `cancelled`, …).

## System-message exclusion

Browser-visible roles: `user`, `assistant` only.

Never expose system messages, policy text, assembled context, hidden reasoning, provider request payloads, or source JSON.

## Message-status presentation

| Status | Presentation |
|--------|--------------|
| completed user | plain user bubble |
| completed assistant | plain DivBrain bubble |
| provider_unavailable | calm status card (catalog message) |
| failed | calm failure card (safe catalog) |
| cancelled | muted cancelled card |
| pending / generating | calm incomplete notice (no polling) |
| blocked | generic notice; stored content hidden |
| unknown | fail closed |

## Empty state

Heading: `DivBrain är redo för nästa steg`

States clearly that the secure foundation is present, the AI engine is not connected, and no personal financial advice is provided.

## Provider-unavailable honesty

Header capability notice:

> AI-motorn är inte ansluten ännu. Frågor kan inte skickas i den här versionen.

Persisted `provider_unavailable` rows use the catalog meaning:

> AI-motorn är inte tillgänglig just nu.

## Disabled composer boundary

Visual composer shell only:

- textarea disabled
- send button disabled
- no form action / onSubmit / server action / API call
- placeholder: `Frågefunktionen öppnas i nästa steg.`

Ticket **1A-9b** replaces this with real interaction.

## Desktop / tablet / mobile layout

- Desktop (~1024+): left rail (~280–320px) + main transcript
- Tablet/mobile: full-width transcript; `Historik` opens accessible drawer
- Persistent trust note at the bottom

## Accessibility

- one `h1` (DivBrain)
- conversation history `nav` landmark
- `aria-current` on selected conversation
- drawer: `aria-expanded`, `aria-controls`, Escape, close control
- disabled semantics on non-interactive controls
- plain selectable message text (no `dangerouslySetInnerHTML`)

## Legacy mock cleanup

Removed unreachable fabricated product code:

- `components/brain/DividendBrainPanel.tsx`
- `components/dashboard/DividendBrainPanel.tsx`
- `data/brain.ts`

Product UI uses **DivBrain**, not “Dividend Brain”.

## Safe error behavior

Repository construction / list / transcript failures keep Alpha access intact and render `data_unavailable` without raw Supabase, environment, table, or stack details.

## Browser verification

Focused checks at 1440×900, 768×1024, and 390×844 where session permits. States that cannot be observed without a suitable authenticated fixture are reported as `NOT_BROWSER_VERIFIED` — never fabricated.

## Runtime limitations

- No real AI provider
- No generated answers
- No message submission
- No conversation mutation actions
- Bounded history window in Alpha view

## Deferred

| Item | Owner |
|------|--------|
| Create / rename / archive / restore / delete | Ticket 1A-9b |
| Functional composer + submit | Ticket 1A-9b |
| Real AI provider / SDK / network calls | Phase 1B |
| Learning retrieval / citations | Phase 1C |

## Testing

`lib/divbrain/server/ui/*.test.ts` — injected fakes only; no live Supabase; no real user UUIDs; no network.
