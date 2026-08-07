# DivBrain Learning retrieval (Ticket 1C-1)

Deterministic **lexical** retrieval over the published DivLab Learning corpus
(`data/learning/**`). This ticket ships a pure server-side foundation only —
no `/brain` UI wiring, no provider calls, no vectors.

## Purpose

Let later DivBrain turns ground educational answers in DivLab’s own Learning
articles with:

- structured `DivBrainSource` objects (`category: "divlab_learning"`)
- stable source ids / record refs
- citation-ready identifiers for the existing citation model
- bounded excerpts treated as **untrusted context**

## Why lexical retrieval before vectors

The Learning corpus is small, curated, and already structured (slug, title,
sections, dates). Explicit keyword/heading scoring is:

- deterministic and inexpensive
- easy to test and audit
- free of embedding ops, external search, and model calls

Vectors remain a later upgrade if corpus size and measured quality justify them
(see `technical-blueprint.md` §11 / FAQ).

## Modules

| Path | Responsibility |
|------|----------------|
| `lib/divbrain/server/learning/corpus.ts` | Adapter: `data/learning` → searchable records |
| `lib/divbrain/server/learning/normalize.ts` | Swedish-safe normalize / tokenize / light stems |
| `lib/divbrain/server/learning/score.ts` | Weighted lexical scoring + threshold + dedupe |
| `lib/divbrain/server/learning/to-source.ts` | Map hits → validated `DivBrainSource` |
| `lib/divbrain/server/learning/retrieve.ts` | Public `retrieveDivBrainLearningSources` |
| `lib/divbrain/server/learning/retrieve.test.ts` | Deterministic topic / safety tests |

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

`strongScore` covers title, slug, heading, description, and phrase bonuses.
**Body-only** overlap never qualifies — weak generic matches return no result.

Hard bounds:

- max **3** sources (`DIVBRAIN_LEARNING_RETRIEVAL_MAX_RESULTS`)
- excerpt ≤ **800** chars (`DIVBRAIN_LEARNING_RETRIEVAL_MAX_EXCERPT_LENGTH`)
- one hit per article slug (best section wins)
- stable tie-break: score ↓, strongScore ↓, slug ↑, sectionIndex ↑

Normalization:

- Unicode NFC, `sv-SE` lowercasing, whitespace collapse
- punctuation stripped; **å/ä/ö** preserved
- Swedish function-word stopwords dropped (`hur`, `vad`, `en`, `på`, …)
- light deterministic morphology (definite/plural-ish endings only)
- excerpt angle brackets neutralized so Learning prose stays plain untrusted text

## Source / citation contract

Each hit emits a validated `DivBrainSource`:

- `id`: `learning:<slug>`
- `recordRef`: `learning/<slug>`
- `internalRoute`: `/learning/<slug>` only (never external URLs)
- `category`: `divlab_learning`
- `verificationState`: `internally_curated`
- `freshnessState`: `current`
- `publisher`: `DivLab`
- `publishedAt` / `dataAsOf` from article dates when present
- bounded `excerpt` with section heading provenance when available

Citation inputs on each hit reuse the same `sourceId` so later builders
(`buildDivBrainCitationsFromSources`, `validateDivBrainGroundedAnswer`) need
no id rewriting.

## How new Learning articles become searchable

1. Add the article under `data/learning/articles/`.
2. Register it in `data/learning/index.ts` (`learningArticles`).
3. No separate search index file — `getDivBrainLearningCorpus()` maps
   `learningArticles` on demand (module-cached).

Do **not** edit article copy solely to help retrieval.

## Future integration point

Not wired in this ticket. Exact later hook:

1. Call `retrieveDivBrainLearningSources(userQuery)` in the DivBrain
   application service **after** guardrails allow the turn and **before**
   context assembly / provider invoke.
2. Pass `result.sources` into
   `assembleDivBrainContext({ currentUserMessage, sources, ... })`.
3. Build visible citations with
   `buildDivBrainCitationsFromSources(assembled.includedSources)` (or hit
   `citation` inputs for section location metadata).
4. Keep excerpts inside `<<<UNTRUSTED_SOURCE>>>` delimiters (already done by
   the assembler) — retrieval must never promote article prose into
   identity/policy sections.

Documented also in `docs/divbrain/context-assembly.md`.

## Security / honesty

- Retrieved article text is always **untrusted context**
- Source text cannot override DivBrain identity, policy, or guardrails
- No citations to routes outside the canonical Learning corpus
- No fabricated titles, dates, excerpts, or external URLs
- Unrelated queries return **zero** hits rather than inventing relevance

## Known limitations

- Lexical overlap ≠ semantic understanding (synonyms beyond light stems)
- No typo correction beyond morphology / normalization
- No re-ranking model; no personalization
- No live service wiring, streaming, or UI citation components (1C-2+)
- Freshness is not computed from wall-clock age (stable `current` for curated Learning)
- ISK vs KF content currently lives inside broader articles (e.g. aktie /
  börja investera) — retrieval surfaces those articles, not a dedicated guide

## Validation

```bash
npm run test:divbrain
npm run typecheck
npm run lint
```
