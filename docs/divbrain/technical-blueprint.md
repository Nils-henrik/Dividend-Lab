# DivBrain Technical Blueprint v1

**Status:** Canonical technical architecture for implementation
**Audience:** Staff engineers implementing DivBrain
**Companion docs:** [`product-blueprint.md`](./product-blueprint.md), [`implementation-roadmap.md`](./implementation-roadmap.md)
**Standards:** Dividend Lab Engineering & Design Standard (see `docs/standards/*`, `docs/design/*`)

This document defines the smallest viable architecture that fits the current DivLab stack (Next.js App Router, TypeScript, Supabase Auth + Postgres RLS). It prefers replaceable modules over speculative infrastructure.

---

## 0. Repository audit (relevant only)

### What exists today

| Area | Current state |
|------|----------------|
| Route `/brain` | `PlaceholderPage` — legacy “Dividend Brain” copy; no real product shell |
| Route `/dashboard/brain` | Duplicate placeholder |
| `components/brain/DividendBrainPanel.tsx` | Client mock panel; “Dagens insikter” from `data/brain.ts` |
| `data/brain.ts` | Fabricated portfolio observations — **honesty risk** |
| Navigation | `DivBrain` → `/brain`, status “Under utveckling” (`lib/constants/navigation.ts`) |
| Marketing | Features page already describes source-bounded DivBrain |
| Domain folder | `lib/brain/` planned in docs; **not implemented** |
| Behavior doc | `docs/ai/DIVIDEND_BRAIN.md` — portfolio-narrow, mock-oriented |
| Auth | `getAuthenticatedUser` / `requireAuthenticatedUser` in `lib/auth/session.ts` |
| Supabase | Browser + server SSR clients; `server-only` admin client exists |
| Ownership precedent | Private messages: `conversations` / `messages` + RLS participant checks |
| Learning | Structured TS articles in `data/learning/` (slug, title, sections, sources, dates) |
| Server actions pattern | `{ status, message }` style (Learning, Forum, Messages) |
| Tests | **No test runner** in `package.json` today (`lint` / `build` only) |
| AI provider | None; no AI SDK; no keys |

### Reuse

- Auth session helpers
- Supabase server client (user-scoped, never service role for normal DivBrain ops)
- Learning article modules as first retrieval corpus
- AppShell, design tokens (`divlab-*`), navigation entry
- RLS + migration naming conventions (`YYYYMMDDHHMMSS_description.sql`)
- Calm error messages to users (never raw DB/provider errors)

### Replace / retire for honesty

- Fake insights in `data/brain.ts` and `DividendBrainPanel` as if they were live AI
- Placeholder-only `/brain` once Alpha shell ships
- Portfolio-first framing in Brain docs/UI copy

### Keep unchanged unless a ticket explicitly requires it

- Unrelated routes, Forum, Messages schema, Auth/Profile Integrity PR work
- Design system tokens and AppShell patterns
- Existing private-message table names (`conversations` / `messages`)

### Current architectural risks

1. **Name collision:** private messaging already owns `public.conversations` and `public.messages` → DivBrain tables **must** be prefixed (`divbrain_*`).
2. **Mock honesty:** fabricated “portfolio insights” train users to trust invented numbers.
3. **Doc drift:** Legacy “Dividend Brain” naming vs canonical **DivBrain** and broader market scope.
4. **No test harness yet:** guardrails/evals need a minimal deterministic test runner addition (Phase 1A).
5. **Service-role temptation:** `lib/supabase/admin.ts` exists — DivBrain must not use it for user chat paths.

---

## 1. System architecture (smallest viable)

```text
Browser (/brain UI)
  │  server actions / route handlers (authenticated)
  ▼
Application service (lib/divbrain/service.*)
  │
  │  authenticate
  │  → verify Internal Alpha allowlist
  │  → validate and normalize input
  │  → run deterministic guardrails
  │
  │     ┌─ BLOCKED ──────────────────────────────────────────┐
  │     │  return safe classification / reason               │
  │     │  do NOT persist full blocked prompt content        │
  │     │  do NOT call provider                              │
  │     └────────────────────────────────────────────────────┘
  │
  │     ┌─ ALLOWED ──────────────────────────────────────────┐
  │     │  create / select owned conversation                │
  │     │  → persist user message                            │
  │     │  → assemble trusted context                        │
  │     │  → call provider (Unconfigured in 1A; real in 1B+) │
  │     │  → validate output                                 │
  │     │  → persist safe assistant result                   │
  │     │  → return safe UI response                         │
  │     └────────────────────────────────────────────────────┘
  ▼
┌───────────────┬──────────────────┬────────────────────┐
│ Repository    │ Context assembly │ Provider adapter   │
│ (Supabase     │ (server-only)    │ (interface +       │
│  user client) │                  │  Unconfigured)     │
└───────────────┴──────────────────┴────────────────────┘
  │                     │                    │
  ▼                     ▼                    ▼
divbrain_* tables   Learning modules    External model
RLS by user_id      (later tools)       (Phase 1B+)
```

### Module layout (recommended)

Prefer `lib/divbrain/` (product name) over empty planned `lib/brain/`:

```text
lib/divbrain/
  types.ts          # domain types
  constants.ts      # limits, versions, budgets
  errors.ts         # typed error taxonomy + safe mapping
  results.ts        # Result-style return types
  identity.ts       # server-only persona (import "server-only")
  policy.ts         # server-only financial/safety policy
  safety.ts         # deterministic guardrails (pure, testable)
  sources.ts        # source model + validation/serialization
  context.ts        # server-only prompt/context assembly
  provider.ts       # provider interface + UnconfiguredProvider
  repository.ts     # server-only Supabase persistence
  service.ts        # server-only request lifecycle
  learning-retrieve.ts  # Phase 1C — structured Learning retrieval
  cost.ts           # token/cost accounting helpers

components/brain/   # UI only (existing ownership)
app/brain/          # route assembly
app/brain/actions.ts
supabase/migrations/*_create_divbrain_*.sql
docs/divbrain/      # this blueprint set
docs/divbrain/evals/  # later fixture location
```

UI stays in `components/brain/` (already documented). Domain logic does **not** live in components.

---

## 2. Request lifecycle

Canonical turn lifecycle:

1. **Authenticate** — `requireAuthenticatedUser()`; no anonymous DivBrain writes
2. **Allowlist** — Internal Alpha: authenticated user id must be in server-only `DIVBRAIN_ALPHA_USER_IDS` (Henrik only initially)
3. **Validate input** — length, charset sanity, conversation id format
4. **Normalize content** — trim, unicode normalize, reject empty
5. **Run deterministic guardrails** — allow / allow_with_disclaimer / require_clarification / block
6. **On block** — **do not persist** full blocked request content; return safe classification + public reason only; do not log raw private prompts for analytics
7. **Create or select conversation** — owner from session only (allowed turns)
8. **Persist user message** — only for non-blocked turns that proceed
9. **Assemble trusted context** — identity → policy → format → sources/knowledge → user → optional user context → tools → freshness
10. **Call provider** — timeout + abort signal (Phase 1B+; UnconfiguredProvider in 1A)
11. **Validate provider output** — strip unsafe URLs; ensure sources are structured; no secret leakage
12. **Persist assistant result** — completion status + safe metadata only
13. **Return safe UI response** — public error strings only
14. **Record operational metadata** — tokens, latency, classification codes (never raw blocked prompts)

When provider is unconfigured: return typed `provider_unavailable`; **never** fabricate an answer.

---

## 3. Server / client boundaries

| Runs on server only | May run on client |
|---------------------|-------------------|
| Identity + policy text | Rendering of messages |
| Context assembly | Composer state |
| Provider calls + API keys | Conversation list display |
| Repository / Supabase user session writes | Citation expand/collapse |
| Guardrail internal reason codes (full) | Public reason strings |
| Cost aggregation writes | Token counts **if** product chooses to show soft budgets |

**Rules:**

- Any file importing policy/identity/provider secrets: `import "server-only"`
- Browser never receives system prompts, hidden reasoning, or raw provider payloads
- Browser never supplies `user_id` for ownership

---

## 4. Authentication and Alpha allowlist boundary

- DivBrain mutations and reads require authenticated Supabase session
- Owner id = `auth.uid()` / mapped session user id
- Anonymous: no SELECT/INSERT/UPDATE/DELETE on DivBrain tables (RLS)
- **Internal Alpha allowlist (Founder decision):** after auth, require `user.id` ∈ server-only env allowlist (initial operator: **Henrik only**). No admin panel; no entitlement DB in Alpha.
- **Future upgrade:** account entitlements / plans when leaving single-operator Alpha.
- UI may show a login CTA if unauthenticated; non-allowlisted authenticated users see a calm “not available” state — not other users’ data.

---

## 5. Conversation ownership and retention

- Each conversation has exactly one `user_id` owner
- Messages belong to a conversation; access only via ownership join/policy
- Client may pass `conversationId` but **never** owner id
- Application layer re-checks ownership even though RLS also enforces it

**Deletion (required for Internal Alpha):**

Internal Alpha must support **permanent owner deletion** of a conversation, which cascades to its messages. Soft archive is an optional organizational feature and does not replace deletion. Direct message deletion is not required; messages are removed through conversation or account deletion.

- The authenticated owner must be able to **permanently delete** a DivBrain conversation
- Deleting a conversation **cascades** to all messages in that conversation (`ON DELETE CASCADE`)
- Account deletion **cascades** to all of the user’s DivBrain conversations and messages
- Soft **archive** (`archived_at`) is optional UX only and **must never** replace permanent owner deletion
- Direct individual-message deletion is **not required** for Internal Alpha
- Another user must never be able to archive, restore or delete someone else’s conversation
- Internal Alpha: conversations remain until the **owner permanently deletes** them
- **No automatic retention jobs** in Phase 1A
- Before external Beta: define transcript retention, export and deletion in product + privacy docs
- If archive is implemented: readable by owner; allow restore; block new messages while archived

---

## 6. Proposed database schema

> **Do not apply in this blueprint task.** Names chosen to avoid collision with private messaging.

### Migration environments (Founder decision)

1. Migrations are **created in code first**.
2. Apply and validate in **development**.
3. Then validate in **Preview / staging**.
4. **Production** migration requires a separate release step, duplicate/data audit, rollback awareness and **explicit approval**.
5. No migration is applied as part of blueprint documentation work.

### `divbrain_conversations`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `user_id` | `uuid` NOT NULL | FK `auth.users(id)` ON DELETE CASCADE |
| `title` | `text` NOT NULL | non-blank check; plain text only |
| `summary` | `text` NULL | optional short summary |
| `schema_version` | `int` NOT NULL DEFAULT 1 | domain evolution |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |
| `updated_at` | `timestamptz` NOT NULL DEFAULT `now()` | trigger via existing `set_updated_at()` if present |
| `archived_at` | `timestamptz` NULL | |

Checks: `char_length(btrim(title)) > 0` (and max length, e.g. 120).

Indexes:

- `(user_id, updated_at desc)`
- `(user_id, updated_at desc) WHERE archived_at IS NULL` (active list)

### `divbrain_messages`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `conversation_id` | `uuid` NOT NULL | FK conversations ON DELETE CASCADE |
| `role` | `text` NOT NULL | check ∈ `user`,`assistant`,`system` |
| `content` | `text` NOT NULL | non-blank where status expects content |
| `completion_status` | `text` NOT NULL | see §6.1 |
| `safety_classification` | `text` NULL | allow / allow_with_disclaimer / require_clarification / block |
| `sources` | `jsonb` NOT NULL DEFAULT `'[]'` | validated in app |
| `provider_meta` | `jsonb` NOT NULL DEFAULT `'{}'` | **safe** subset only |
| `error_code` | `text` NULL | stable public/internal code mapping |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Index: `(conversation_id, created_at)`.

### 6.1 Completion statuses

`pending` | `generating` | `completed` | `blocked` | `failed` | `cancelled` | `provider_unavailable`

### 6.2 Optional later: `divbrain_usage_events`

Defer until Phase 1D unless logging can live in `provider_meta` safely. Prefer a narrow usage table when cost controls become operational:

- `user_id`, `conversation_id`, `message_id`, `input_tokens`, `output_tokens`, `estimated_cost_sek`, `provider`, `created_at`
- RLS: owner-only; no anon

---

## 7. RLS model

Enable RLS on **every** DivBrain table.

**Anon:** deny all.

**Authenticated:**

- Conversations: `user_id = auth.uid()` for SELECT/INSERT/UPDATE (archive/rename when implemented). INSERT `with check` forces `user_id = auth.uid()`.
- Conversations: **DELETE** only when `user_id = auth.uid()` — permanent owner deletion is required; another user must never delete, archive or restore someone else’s conversation.
- Messages: SELECT/INSERT only when parent conversation owned by `auth.uid()`.
- UPDATE of `conversation_id` or `user_id` must be impossible via policy `with check`.
- Messages: **no direct DELETE** policy required for Internal Alpha — messages are removed via conversation DELETE cascade or account deletion cascade. Soft archive must not substitute for conversation DELETE.

**Never** use service role in normal repository paths.

Unauthorized and missing rows should both look like “not found” at the application boundary (no ownership oracle).

---

## 8. Provider abstraction

```ts
// Conceptual contract — implement in lib/divbrain/provider.ts
type DivBrainProviderRequest = {
  contextBlocks: ContextBlock[]; // already ordered/assembled
  messages: ProviderMessage[];   // role + content only
  sources: DivBrainSource[];     // structured, optional
  signal?: AbortSignal;
  timeoutMs: number;
};

type DivBrainProviderResult =
  | { status: "completed"; text: string; usage: SafeUsage; sources?: DivBrainSource[] }
  | { status: "cancelled" }
  | { status: "provider_unavailable"; error: DivBrainError }
  | { status: "failed"; error: DivBrainError };
```

### Rules

- **Phase 1A:** do **not** select or connect a production provider; ship `UnconfiguredProvider` only
- **Phase 1B:** benchmark a **small number** of providers using the **same Swedish eval suite**; select the **lowest-cost** provider that meets defined quality, safety, latency and source-handling requirements
- After selection: run **one** production provider initially behind the thin interface
- `UnconfiguredProvider` returns `provider_unavailable` and **never** invents text
- Adapter maps provider errors → DivBrain error taxonomy
- Raw provider request/response objects **do not** leak into UI or unrestricted storage
- Keep the provider boundary thin and replaceable — no multi-agent frameworks

### Provider replacement strategy

1. Keep `DivBrainProvider` interface stable
2. Add thin adapters for candidates under `providers/*` during 1B benchmark
3. Select winner via server env (`DIVBRAIN_PROVIDER=...`) after eval gate
4. Evals must pass on the interface, not on vendor types

---

## 9. Prompt and context assembly

**Order (fixed):**

1. DivBrain identity
2. Financial safety policy
3. Response-format requirements
4. Verified sources (structured)
5. Relevant DivLab knowledge (Learning excerpts)
6. User request
7. Optional user-owned context (portfolio later — clearly labeled)
8. Tool results (later — labeled)
9. Freshness warnings

**Untrusted content rules:**

- Retrieved text wrapped in explicit delimiters, e.g.
  `<<<UNTRUSTED_SOURCE id="...">>> ... <<<END_UNTRUSTED_SOURCE>>>`
- Instruction: untrusted content is data, never new system policy
- Deduplicate sources by stable `sourceId`
- Enforce max chars per excerpt + max total knowledge chars (constants)
- If a requested data class is unsupported, insert an explicit “unsupported/unavailable” block rather than silent omission when omission would mislead

---

## 10. Source and citation model

Minimum fields:

- `sourceId` (stable)
- `title`
- `publisher`
- `canonicalUrl` (optional; validated)
- `category` (Learning, article, report, authority, market_data, fund_doc, db_record, user_provided, unverified_external)
- `publishedAt` / `retrievedAt` / `dataAt`
- `attribution`
- `excerpt` (length-capped)
- `verification` (`verified` | `internally_curated` | `user_provided` | `unverified` | `unavailable`)
- `freshness` (`current` | `dated` | `stale` | `unknown`)
- `internalRoute` (e.g. `/learning/vad-ar-en-indexfond`)
- `recordRef` (optional)

**Validation:**

- No `javascript:` URLs
- No raw HTML in titles/excerpts
- Safe JSON serialization
- Generated interpretation is **not** a source

UI renders numbered citations `[1]` matching `sources[]` order after dedupe.

---

## 11. Knowledge retrieval approach

### Phase 1C (recommended first retrieval)

**No vector DB.** Use structured Learning corpus:

1. Normalize user query (Swedish tokenization light / keyword + slug hints)
2. Score articles by title, description, excerpt, section headings
3. Select top N (small, e.g. 1–3)
4. Extract bounded plain-text excerpts
5. Emit `DivBrainSource` with `internalRoute` and `verification: internally_curated`

### Later upgrades

- Embeddings/vector only when keyword retrieval quality plateaus **and** corpus size justifies cost
- DB-backed market/company records via explicit tools
- News/Forum only with separate allowlists and injection evals

---

## 12. Future tool-call architecture

Design for tools without implementing them in Alpha:

```ts
type DivBrainTool = {
  name: string;
  description: string;
  inputSchema: unknown; // zod/json-schema later
  requiresFreshData: boolean;
  sensitivity: "public" | "user_private";
  execute(input, ctx: { userId: string; signal: AbortSignal }): Promise<ToolResult>;
};
```

**Rules:**

- Tools return structured `ToolResult` + sources, not free prose as authority
- User-private tools must re-verify `userId` from session
- Provider may request tools only after guardrails allow `toolCallPermitted`
- Alpha: tool registry empty; context says capabilities not connected

---

## 13. Guardrail architecture

Pure functions in `safety.ts` (deterministic, unit-tested):

**Decisions:** `allow` | `allow_with_disclaimer` | `require_clarification` | `block`

Decision payload:

- `classification`
- `publicReason` (Swedish, safe)
- `internalReasonCode`
- `disclaimerType?`
- `sourcesRequired`
- `realTimeDataRequired`
- `userSpecificFinancialContext`
- `toolCallPermitted`

Cover at least: guaranteed returns; personalized buy/sell; allocation-as-advice; fabricate sources/prices; unavailable real-time claims; system-prompt extraction; hidden-reasoning extraction; untrusted instruction injection; other-user privacy; account-data exfil; bypass attempts; abusive/malformed input.

**Document clearly:** deterministic rules are necessary but not sufficient. Provider-side policy + evals remain required after Phase 1B.

---

## 14. Privacy model

- Transcripts are **private per user**
- No cross-user retrieval
- Do not store emails in DivBrain tables (identity via `user_id` only)
- Portfolio context (later) is session-scoped fetch, never another user’s
- **Blocked requests (Internal Alpha):** do not persist full prompt content; return safe reason codes only; do not log raw private prompts for analytics
- Allowed-turn logs: prefer message ids + reason codes; treat any body logging as sensitive
- Future controlled safety-event logging only if evidence shows need

### Never store

- Passwords
- API keys / access / refresh tokens
- Raw cookies
- Hidden chain-of-thought / private model reasoning
- Complete raw provider request or response objects
- Unrestricted debug payloads
- Another user’s private data
- Full blocked-request prompt bodies (Internal Alpha policy)

Safe `provider_meta` examples: `provider`, `model`, `inputTokens`, `outputTokens`, `latencyMs`, `requestId` (opaque).

---

## 15. Error taxonomy

| Code | UI meaning (Swedish, calm) |
|------|----------------------------|
| `authentication_required` | Logga in för att använda DivBrain |
| `not_found` | Konversationen hittades inte |
| `invalid_request` | Begäran kunde inte tolkas |
| `safety_blocked` | Kan inte hjälpa med den typen av begäran |
| `provider_unavailable` | AI-motorn är inte tillgänglig just nu |
| `persistence_failure` | Kunde inte spara. Försök igen |
| `stale_or_unavailable_data` | Aktuell data saknas eller är inaktuell |
| `rate_limit` | Tillfällig gräns nådd. Försök senare |
| `unknown_internal` | Något gick fel. Försök igen |

Map DB/provider errors → these codes. Never forward raw messages.

---

## 16. Rate limiting

**Alpha (internal):** soft limits in application constants (e.g. N turns / user / day) enforced in service layer; optional DB count query.

**Beta:** durable limits (per user per day/month) + clear UI; consider edge rate limiting later — not first.

Do not build a large admin quota UI in Alpha.

---

## 17. Token budgeting

Constants (illustrative starting points — tune in 1D):

| Budget | Guidance |
|--------|----------|
| Max user message chars | e.g. 4_000 |
| Max history messages in context | e.g. last 10–20 turns, hard cap chars |
| Max Learning excerpt chars | e.g. 1_500 each, 3 sources |
| Max total context chars | explicit constant; drop oldest history first |
| Provider timeout | e.g. 30–60s |

History strategy: **recent-first truncation**, keep system/policy always, keep active sources for the turn.

---

## 18. Cost tracking

Phase **1A** introduces usage/cost **interfaces and hooks** only. Actual provider token usage and estimated-cost logging begin when a real provider is connected in Phase **1B**. Do not claim live provider costs before a provider exists.

Per completed/failed provider call (1B+), persist safe usage:

- input/output tokens
- estimated cost (server-side price table constant)
- provider + model name
- latency

Aggregate weekly for internal review. No client exposure of margin math required in Alpha.

---

## 19. Logging and observability

Minimum:

- structured server logs: `conversationId`, `messageId`, `userId` hash/id, `internalReasonCode`, `completion_status`, latency, tokens
- no system prompt dump
- alert later on: spike in `failed`, cost anomalies, repeated injection blocks

Defer full APM until Beta volume.

---

## 20. Testing strategy

Add a **minimal** deterministic test runner in Phase 1A (recommend `vitest` **or** Node built-in test if dependency avoidance is paramount). Prefer one small dependency over untested guardrails.

Test priorities:

1. Guardrail classifications vs eval fixture
2. Source URL validation + serialization
3. Context ordering + untrusted delimiters
4. Provider unconfigured behavior
5. Safe error mapping
6. Eval fixture integrity (unique IDs, required categories)

Do not call paid models in CI for Alpha foundation.

---

## 21. Eval architecture

Version-controlled fixture (TypeScript), e.g. `docs/divbrain/evals/alpha-fixture.ts` or `lib/divbrain/evals/fixture.ts`.

Each case:

- `id`, `category`, Swedish `prompt`
- `expectedDecision`
- flags: clarification / disclaimer / sources / currentData
- `expectedTraits[]`, `prohibitedTraits[]`
- `notes?`

Growth path:

| Stage | Size |
|-------|------|
| Foundation (Phase 1A) | ≈ **60–80** |
| Internal Alpha hardening | **100–300** |
| Beta regression | 300+ with CI gate on guardrail subset |

Categories must include education (stocks/funds/ETFs/dividends/risk/diversification), stale/missing data, advice/buy/sell/guaranteed returns, fabrication, injection, privacy, Swedish quality, hallucination resistance.

---

## 22. Deployment strategy

- Migrations: code → **dev** → **Preview/staging** → **production** only with separate release, audit, rollback plan and explicit approval
- No production migration during blueprint or casual agent work
- Internal Alpha: Henrik-only server allowlist before any broader access
- Vercel preview for UI; provider keys only in server env (Phase 1B+)
- Rollback: disable provider factory → `UnconfiguredProvider`; UI already handles `provider_unavailable`

---

## 23. Failure and recovery

| Failure | Behavior |
|---------|----------|
| Guardrail block | **Do not persist** full blocked content; return safe classification + public reason; show blocked UI |
| Not on allowlist | Calm unavailable state; no conversation side effects |
| Provider timeout | `failed` or `cancelled`; user may retry |
| Provider outage | `provider_unavailable`; preserve user message if already saved on an allowed turn |
| Persistence failure after provider success | Log critically; show error; avoid duplicate provider spend via idempotency later |
| Duplicate submit | Disable composer while `generating`; idempotency token optional in 1B |

---

## 24. Fifteen architectural decisions

### 1) Store conversations from first Alpha?

| | |
|--|--|
| **Recommendation** | **Yes** — persist allowed turns from Phase 1A onward; owner permanent delete until then; cascade on conversation/account delete; archive optional and never a substitute for delete |
| **Reasoning** | Ownership/RLS patterns must be proven early; history is core product value; matches Messages-domain maturity in stack |
| **Cheaper alternative** | Ephemeral session-only chat — cheaper short-term, throws away retention proof and security practice |
| **Upgrade** | Pre-Beta: retention/export/deletion product+privacy docs; later summaries; no auto-retention jobs in 1A |

### 2) Streaming initially?

| | |
|--|--|
| **Recommendation** | **No for foundation / optional in 1B** |
| **Reasoning** | Non-stream reduces UI + partial-failure complexity while provider lands |
| **Cheaper alternative** | Full response only (Alpha default) |
| **Upgrade** | SSE/stream adapter behind same provider interface |

### 3) Vector database initially?

| | |
|--|--|
| **Recommendation** | **No** |
| **Reasoning** | Learning corpus is small and structured; vectors add cost/ops without proven need |
| **Cheaper alternative** | Keyword/metadata retrieval over `data/learning` |
| **Upgrade** | Embeddings when corpus + quality metrics justify |

### 4) Learning retrieval via metadata/structured text?

| | |
|--|--|
| **Recommendation** | **Yes — Phase 1C** |
| **Reasoning** | Articles already typed with slug/title/sections/sources/dates |
| **Cheaper alternative** | Manual “suggested article” links without retrieval (weaker) |
| **Upgrade** | Ranker/embeddings later |

### 5) Tool calling initially?

| | |
|--|--|
| **Recommendation** | **No** (interface only) |
| **Reasoning** | No verified market/portfolio tools ready; tools without data create fake competence |
| **Cheaper alternative** | Explicit unavailable capability strings |
| **Upgrade** | Registry + guarded execute in Phase 3 |

### 6) One provider initially?

| | |
|--|--|
| **Recommendation** | **Yes after 1B benchmark** — no provider in 1A; 1B benchmarks a small set on the Swedish eval suite; pick lowest-cost that meets quality/safety/latency/source requirements |
| **Reasoning** | Avoid locking cost/quality before evidence; still operate one provider in production afterward |
| **Cheaper alternative** | Guess a vendor in 1A (rejected — premature) |
| **Upgrade** | Second adapter only if quality/cost demands |

### 7) Avoid provider lock-in without overengineering?

| | |
|--|--|
| **Recommendation** | Thin `DivBrainProvider` interface + factory + safe usage types |
| **Reasoning** | Enough to swap vendors; avoid multi-agent frameworks |
| **Cheaper alternative** | Direct SDK calls in service (locks in faster) |
| **Upgrade** | Additional adapters; still one interface |

### 8) How much history in context?

| | |
|--|--|
| **Recommendation** | Last **N messages** with **hard char budget** (start ~10–20 msgs / ~8–12k chars total history) |
| **Reasoning** | Cost control; long chats degrade safety |
| **Cheaper alternative** | Last 3 turns only |
| **Upgrade** | Server-side summary field on conversation |

### 9) How sources stored and rendered?

| | |
|--|--|
| **Recommendation** | JSONB `sources` on assistant messages + numbered UI citations |
| **Reasoning** | Stable, queryable, matches trust model |
| **Cheaper alternative** | Plain URLs in markdown only (ambiguous) |
| **Upgrade** | Shared source graph / prefetch cards |

### 10) How stale data marked?

| | |
|--|--|
| **Recommendation** | `freshness` enum on sources + context freshness warnings |
| **Reasoning** | Prevents silent currency claims |
| **Cheaper alternative** | Footnote “verify elsewhere” only |
| **Upgrade** | Auto-stale by `dataAt` thresholds per category |

### 11) How token cost measured?

| | |
|--|--|
| **Recommendation** | Persist provider usage + server-side estimate per turn |
| **Reasoning** | Required for unit economics before paid launch |
| **Cheaper alternative** | Log-only without DB (harder to aggregate) |
| **Upgrade** | `divbrain_usage_events` + dashboards |

### 12) User-level limits later?

| | |
|--|--|
| **Recommendation** | App-level daily/monthly counters keyed by `user_id`; premium entitlements later |
| **Reasoning** | Protects cost; fits SaaS |
| **Cheaper alternative** | Global emergency kill switch only |
| **Upgrade** | Plan-aware quotas |

### 13) Prompt injection from retrieved content?

| | |
|--|--|
| **Recommendation** | Delimiters + policy precedence + “data not instructions” + eval cases |
| **Reasoning** | Standard mitigation without heavy frameworks |
| **Cheaper alternative** | Strip all retrieved text (kills product value) |
| **Upgrade** | Provider-side citations mode / classifiers |

### 14) Portfolio data isolation later?

| | |
|--|--|
| **Recommendation** | Fetch via portfolio domain with session `userId`; inject as labeled user-owned block; never in global retrieval index |
| **Reasoning** | Matches RLS philosophy |
| **Cheaper alternative** | Client-supplied portfolio JSON (spoofable — reject) |
| **Upgrade** | Field-level redaction + explicit user consent flags |

### 15) Before any paid launch?

| | |
|--|--|
| **Recommendation** | RLS proven, provider stable, ≥100–300 evals with CI guardrail gate, rate limits, source freshness, privacy/legal review, cost metrics acceptable, no fake-data UX |
| **Reasoning** | Hard trust + margin requirements |
| **Cheaper alternative** | Soft-launch without evals (unacceptable for finance) |
| **Upgrade** | Continuous eval expansion |

---

## 25. UX technical direction (for implementers)

Information architecture for `/brain`:

```text
[ AppShell ]
  Header: DivBrain · Internal Alpha badge
  Main split (desktop):
    Left/rail: conversation list · New conversation
    Center: identity blurb (collapsed after first msg) · message list · composer
  Mobile: history in sheet/drawer · composer fixed bottom
  Persistent footer note: non-advice + privacy short line
```

States to implement as first-class UI:

- empty, loading/generating, blocked, failed, provider_unavailable, sources shell

Visual: Professional Market Dark — surfaces/borders/typography already in design system. Not ChatGPT clone. No fake transcripts.

Responsive targets: 1440×900, 768×1024, 390×844.

---

## 26. Final architecture review (simplification pass)

| Temptation | Verdict |
|------------|---------|
| Multi-agent orchestration | **Delete** until post-Beta demand |
| Vector DB in Alpha | **Delete** |
| Streaming in foundation | **Defer** |
| Admin quota console | **Defer** |
| Using service role for chat | **Forbidden** |
| Reusing `messages` tables | **Forbidden** (collision) |
| Fake demo answers | **Forbidden** |
| Broad Forum retrieval early | **Defer** (injection + privacy) |
| Storing chain-of-thought | **Forbidden** |

Remaining complexity that **earns its keep:** RLS ownership, source model, guardrails, provider interface, Learning retrieval, evals, cost fields.

---

## Document control

| Field | Value |
|-------|-------|
| Version | 1.2 |
| Date | 2026-07-18 |
| Changes | Clarify permanent delete vs archive, request-lifecycle diagram, Alpha vs Phase 1A boundaries |
