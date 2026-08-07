# DivBrain Learning retrieval and source grounding (Tickets 1C-1 / 1C-2 / 1C-3)

DivBrain uses deterministic **lexical** retrieval over the published DivLab Learning corpus (`data/learning/**`), wires relevant sources into Internal Alpha context assembly, and can surface validated source metadata alongside completed assistant messages in the transcript.

The retrieval layer itself remains local and deterministic: **no embeddings, provider calls, external search, or paid model work** are required to find Learning sources.

## Purpose

Ground educational DivBrain turns in DivLab’s own Learning articles with:

- structured `DivBrainSource` objects (`category: "divlab_learning"`)
- stable source ids / record refs
- citation-ready identifiers for the existing citation model
- bounded excerpts treated as **untrusted context**
- automatic handoff of retained sources into the provider request contract
- a browser-safe numbered source list for completed grounded assistant messages

## Why lexical retrieval before vectors

The Learning corpus is small, curated, and already structured (slug, title, sections, dates). Explicit keyword/heading scoring is deterministic, inexpensive, easy to audit, and requires no embedding operations or external model calls.

Vectors remain a later upgrade only if corpus size and measured retrieval quality justify them.

## Modules

| Path | Responsibility |
|------|----------------|
| `lib/divbrain/server/learning/corpus.ts` | Adapter: `data/learning` → searchable records |
| `lib/divbrain/server/learning/normalize.ts` | Swedish-safe normalize / tokenize / light stems |
| `lib/divbrain/server/learning/score.ts` | Weighted lexical scoring + threshold + dedupe |
| `lib/divbrain/server/learning/to-source.ts` | Map hits → validated `DivBrainSource` |
| `lib/divbrain/server/learning/retrieve.ts` | `retrieveDivBrainLearningSources` |
| `lib/divbrain/server/learning/context-assembler.ts` | Retrieve → canonical context assembler |
| `lib/divbrain/server/repository/mapping.ts` | Validate persisted message sources on read |
| `lib/divbrain/server/ui/transcript.ts` | Reduce validated sources to browser-safe display metadata |
| `components/brain/DivBrainTranscript.tsx` | Render the numbered transcript source list |

## Scoring and threshold

Field weights (`DIVBRAIN_LEARNING_SCORE_WEIGHTS`):

| Field | Weight |
|-------|--------|
| title | 12 |
| slug | 9 |
| heading | 8 |
| description | 5 |
| excerpt | 4 |
| category | 2 |
| body / intro | 1 |
| full-query phrase in title | +15 |
| full-query phrase in heading | +10 |
| title+slug+heading coverage | up to +8 |

A candidate is returned only when **both**:

- `score >= DIVBRAIN_LEARNING_RETRIEVAL_MIN_SCORE` (**16**)
- `strongScore >= DIVBRAIN_LEARNING_RETRIEVAL_MIN_STRONG_SCORE` (**10**)

Body-only overlap never qualifies. Weak/unrelated queries return no result rather than inventing relevance.

Hard bounds:

- max **3** sources
- excerpt ≤ **800** chars
- one hit per article slug (best section wins)
- stable tie-break: score ↓, strongScore ↓, slug ↑, sectionIndex ↑

Normalization preserves Swedish å/ä/ö, drops common function words, uses conservative morphology, and neutralizes excerpt angle brackets so Learning prose remains plain untrusted text.

## Source / citation contract

Each Learning hit emits a validated `DivBrainSource` with stable `learning:<slug>` identity, `/learning/<slug>` internal route, internally curated provenance and bounded article metadata.

The same source objects flow through context assembly and the provider request. On a completed grounded assistant response, the service persists the retained provider-result sources with the assistant message.

### Persistence → browser boundary

The database row may contain the full validated `DivBrainSource` metadata needed for provenance. Repository mapping validates that payload again on read and fails closed if it is malformed. Non-empty source payloads are accepted only for **completed assistant messages**.

The transcript browser view deliberately exposes only:

- source id
- title
- optional publisher / attribution
- validated internal DivLab route or validated HTTPS canonical URL

It does **not** expose source excerpts, record refs, data-as-of fields, retrieval diagnostics, prompt context, policy text or provider-private metadata.

### Transcript rendering

Completed assistant messages with retained sources show a compact **Källor** section numbered `[1]`, `[2]`, and so on in source order. Internal DivLab Learning sources link through Next.js routes; external sources, when later used, open validated HTTPS URLs in a new tab with `noopener noreferrer`.

The model is already instructed to use numbered citations when sources exist. In 1C-3, citation markers such as `[1]` inside the generated answer remain ordinary escaped text while the matching numbered source list is rendered below. Turning those inline markers into interactive links is a possible later polish step; source transparency itself no longer depends on that work.

## Runtime integration

Internal Alpha defaults to `createDivBrainLearningContextAssembler()` through `createDivBrainAlphaApplicationServiceDeps()`.

Lifecycle implications:

1. Authentication and the Internal Alpha gate run first.
2. Guardrail-blocked prompts return before context assembly, so they do **not** run Learning retrieval and remain non-persistent.
3. Allowed, owned conversation turns reach the Learning-aware wrapper during context assembly.
4. Local retrieval selects relevant Learning sources from the current user message.
5. The canonical assembler validates, deduplicates, budgets and wraps source prose as `untrusted_context`.
6. `mapAssembledContextToProviderRequest()` carries only retained `includedSources` into the provider request.
7. A completed provider result may return those sources; the service persists them with the assistant message.
8. Repository mapping validates persisted sources again before the shell creates its minimal browser-safe source list.

The generic application-service lifecycle and security ordering remain unchanged.

## Trust boundary

Learning retrieval and source rendering do **not** bypass or replace identity, policy, guardrails, ownership checks, provider validation or source validation.

Instruction-like article text remains source material. It cannot become `trusted_system` policy or overwrite DivBrain identity. React renders answer/source text normally; `dangerouslySetInnerHTML` is not used.

## How new Learning articles become searchable

1. Add the article under `data/learning/articles/`.
2. Register it in `data/learning/index.ts` (`learningArticles`).
3. No separate vector/search index is needed; the corpus adapter maps `learningArticles` on demand and module-caches the result.

Do **not** edit article copy solely to manipulate retrieval ranking.

## Current limitations / next step

- Lexical overlap is not semantic understanding; typo/synonym handling remains intentionally conservative.
- No vector retrieval or model re-ranking.
- No personalization.
- Inline `[n]` markers are not yet interactive links; the authoritative numbered source list is displayed beneath the answer.
- Retrieval does not provide live market/news data.
- Freshness is stable `current` for the internally curated Learning corpus rather than computed from wall-clock age.
- ISK vs KF currently resolves to broader articles where that content exists; a dedicated guide would improve retrieval specificity.

## Validation

Normal repository validation should cover this path:

```bash
npm run lint
npm run typecheck
npm run test:divbrain
npm run build
```

No live provider or network call is required for these tests.
