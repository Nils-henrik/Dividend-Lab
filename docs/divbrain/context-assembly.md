# DivBrain context assembly (Ticket 1A-4)

Server-only foundation that turns validated application-domain inputs into a
**deterministic, provider-neutral context package** before any AI provider call.

## Purpose

Assemble, in a fixed order and under configurable estimated-token budgets:

- trusted DivBrain identity and financial-safety policy
- response-format requirements
- selected source material (with citation metadata preserved)
- recent conversation history
- the current user request
- optional lower-priority labeled context

This ticket does **not** implement retrieval, streaming, chat UI, or live
provider calls.

## Accepted inputs

`DivBrainContextAssemblyInput` (`lib/divbrain/server/context/types.ts`):

| Field | Role |
|-------|------|
| `currentUserMessage` | Required current user text |
| `conversationId` | Optional; rejects cross-conversation history mixing |
| `history` | Prior turns (`user` / `assistant` only in output) |
| `sources` | Validated `DivBrainSource` objects (Ticket 1A-2 model) |
| `guardrailConstraints` | Optional turn constraints from Ticket 1A-3 |
| `optional` | User-owned context, tool results, freshness, unsupported notices |
| `config` | Partial budget overrides |

The assembler does **not** query Supabase. Callers supply domain inputs.

## Output contract

`DivBrainAssembledContext`:

- `sections` — ordered sections with trust level, estimated size, truncation flags
- `historyTurns` — chronological normalized user/assistant turns (no DB metadata)
- `currentUserMessage` — normalized user request
- `includedSources` — sources retained for citation (metadata intact; excerpts may shorten)
- `diagnostics` — included / excluded / truncated decisions

Errors use `DivBrainResult` + catalog `invalid_request` (no internal dumps).

## Section priority

Canonical order (technical blueprint §9):

1. identity  
2. financial safety policy  
3. response-format requirements  
4. sources / knowledge (structured + delimited)  
5. conversation history (recent-first selection, chronological emit)  
6. current user request  
7. optional user-owned context  
8. tool results  
9. freshness warnings / unsupported-capability notices  

Mandatory trusted sections and the current user request are never silently dropped.
If they cannot fit the total budget, assembly fails with `invalid_request`.

## Budget and truncation

Budgets are **estimated tokens**, not exact model tokens.

Estimator: `ceil(charLength / 4)` (`DIVBRAIN_CONTEXT_CHARS_PER_ESTIMATED_TOKEN`).

Configurable limits (defaults in `lib/divbrain/constants.ts`):

- total context budget
- mandatory reserve floor
- history budget + max history messages
- source budget + max sources + per-excerpt estimate cap

Truncation behaviour:

- pack history **recent-first**, emit chronological
- shorten source **excerpts** before dropping source identity
- drop later / over-budget sources before touching policy or user request
- record every exclusion/truncation in diagnostics

## Source and citation preservation

Integrates Ticket 1A-2 `normalizeDivBrainSources` / dedupe.

- Source id, type/category, title, publisher, URL/route, timestamps, excerpt,
  verification, freshness, and related metadata stay on `includedSources`
- Prompt text wraps excerpts in `<<<UNTRUSTED_SOURCE id="...">>>` delimiters
- Truncation may shorten `excerpt` only; identifiers remain valid
- Free-text optional context is **not** promoted to a citable source

## Trusted vs untrusted boundaries

| Trust | Examples |
|-------|----------|
| `trusted_system` | identity, policy, response_format, freshness/unsupported notices |
| `user_input` | current user request |
| `untrusted_context` | sources, knowledge, history, user-owned context, tool results |

Primary protection is **structural**: role/trust assignment and delimiters.
String matching alone is not the security boundary. Prompt-like text inside
sources or history remains untrusted data and cannot replace policy sections.

Before wrapping, untrusted payloads neutralize literal `<<<` / `>>>` marker
tokens (`<!<` / `>!>`) so forged open/close sequences cannot prematurely
terminate DivBrain delimiter blocks. Structured citation metadata is unchanged.

## Provider-neutral design

Assembly output is independent of any vendor SDK.

`mapAssembledContextToProviderRequest` maps to Ticket 1A-5
`DivBrainProviderRequest`:

- trusted / source / optional sections → `contextBlocks`
- history turns + current user message → `messages`
- `includedSources` → `sources`

Mapping validates through `validateDivBrainProviderRequest` and does not mutate
the domain assembly object. Unit tests use `UnconfiguredProvider` only.

## Modules

| Path | Responsibility |
|------|----------------|
| `server/identity.ts` | Swedish DivBrain persona |
| `server/policy.ts` | Financial safety + response format; reuses guardrail constraints |
| `server/context/*` | Types, estimate, delimiters, normalize, assemble, provider map |
| `server/context-eval-fixtures/` | Focused behavioural fixtures |
| `server/context-evals.ts` | Pure eval runner |

## Known limitations

- Estimated tokens ≠ provider tokenizer counts
- No semantic retrieval or re-ranking (Phase 1C+)
- No live cost logging (hooks only until Phase 1B)
- `import "server-only"` package still deferred; enforce via `server/` imports
- Conversation/message persistence lives in Ticket 1A-7a (`docs/divbrain/conversation-repository.md`); mapping persisted rows into assembly input remains Ticket 1A-7b

## Extending in later tickets

- 1A-7b: map persisted messages → assembly input (still no DB inside assemble core)
- 1B: feed mapped provider request to a real adapter; persist usage hooks
- 1C: Learning retriever emits `DivBrainSource` into this assembler
- 1D: tune budget constants; enforce rate/token limits at the service layer

### 1C-1 Learning retrieval integration point

Ticket **1C-1** implements pure lexical retrieval in
`lib/divbrain/server/learning/` (see [`learning-retrieval.md`](./learning-retrieval.md)).

Exact later service hook (not wired yet):

1. `retrieveDivBrainLearningSources(userQuery)` after guardrails allow the turn
2. Pass `result.sources` as `assembleDivBrainContext({ sources })`
3. Build numbered citations from `includedSources` / hit citation inputs

Retrieved Learning excerpts remain `untrusted_context` via existing delimiters.
