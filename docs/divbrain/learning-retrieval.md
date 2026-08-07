# DivBrain Learning retrieval and context grounding (Tickets 1C-1 / 1C-2)

DivBrain uses deterministic **lexical** retrieval over the published DivLab Learning corpus (`data/learning/**`) and now wires the resulting sources into the Internal Alpha context assembly path.

The retrieval layer itself remains local and deterministic: **no embeddings, provider calls, external search, or paid model work** are required to find Learning sources.

## Purpose

Ground educational DivBrain turns in DivLab’s own Learning articles with:

- structured `DivBrainSource` objects (`category: "divlab_learning"`)
- stable source ids / record refs
- citation-ready identifiers for the existing citation model
- bounded excerpts treated as **untrusted context**
- automatic handoff of retained sources into the provider request contract

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
| `lib/divbrain/server/learning/context-assembler.ts` | 1C-2 wrapper: retrieve → canonical context assembler |
| `lib/divbrain/server/learning/retrieve.test.ts` | Deterministic topic / safety tests |
| `lib/divbrain/server/learning/context-assembler.test.ts` | Grounding + Alpha wiring tests |

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

Each hit emits a validated `DivBrainSource`:

- `id`: `learning:<slug>`
- `recordRef`: `learning/<slug>`
- `internalRoute`: `/learning/<slug>` only
- `category`: `divlab_learning`
- `verificationState`: `internally_curated`
- `freshnessState`: `current`
- `publisher`: `DivLab`
- article publication/update dates when present
- bounded section-aware excerpt

Citation inputs reuse the same `sourceId`, so the existing citation builders do not need identifier rewriting.

## 1C-2 runtime integration

Internal Alpha now defaults to `createDivBrainLearningContextAssembler()` through `createDivBrainAlphaApplicationServiceDeps()`.

Lifecycle implications:

1. Authentication and the Internal Alpha gate still run before the application lifecycle proceeds.
2. Guardrail-blocked prompts return before context assembly, so they do **not** run Learning retrieval and remain non-persistent as before.
3. Allowed, owned conversation turns reach the Learning-aware wrapper when the application service performs context assembly.
4. The wrapper retrieves local Learning sources from the current user message and passes them to the canonical `assembleDivBrainContext()` function.
5. The canonical assembler validates, deduplicates, budgets and wraps source prose as `untrusted_context` using the existing source delimiters.
6. `mapAssembledContextToProviderRequest()` carries only the retained `includedSources` into the provider request.
7. A completed provider result can therefore preserve those source objects with the assistant message through the existing provider/service contracts.

The generic application-service core is unchanged. Special server/tests can still inject an explicit context assembler into Alpha wiring.

## Trust boundary

Learning retrieval does **not** bypass or replace identity, policy, guardrails, ownership checks, provider validation, or source validation.

Instruction-like article text remains source material. It cannot become `trusted_system` policy and cannot overwrite the DivBrain identity. Existing tests explicitly exercise instruction-like source content to preserve this boundary.

## How new Learning articles become searchable

1. Add the article under `data/learning/articles/`.
2. Register it in `data/learning/index.ts` (`learningArticles`).
3. No separate vector/search index is needed; the corpus adapter maps `learningArticles` on demand and module-caches the result.

Do **not** edit article copy solely to manipulate retrieval ranking.

## Current limitations / next step

- Lexical overlap is not semantic understanding; typo/synonym handling remains intentionally conservative.
- No vector retrieval or model re-ranking.
- No personalization.
- Visible inline citation rendering in the `/brain` transcript is still a later UI/grounded-answer step.
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
