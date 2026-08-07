# DivBrain Learning retrieval, grounding and source UI

**Implemented foundations:** 1C-1 retrieval, 1C-2 context grounding, grounded transcript source UI  
**Roadmap Ticket 1C-3:** deterministic Learning retrieval eval cases

> Numbering note: the grounded transcript source UI was initially described as “1C-3” in one implementation PR. The canonical roadmap already reserves **1C-3 for retrieval eval cases**. This document follows the roadmap numbering from here onward; the source UI is treated as an additional 1C grounding/UI increment rather than a second 1C-3.

DivBrain uses deterministic **lexical** retrieval over the published DivLab Learning corpus (`data/learning/**`), injects relevant sources into Internal Alpha context assembly, persists retained grounded sources with completed assistant messages, and displays a browser-safe numbered source list in the transcript.

The retrieval/eval layer is local and deterministic: **no embeddings, provider calls, external search, LLM judge, or paid model work** is required.

## Retrieval contract

- Corpus: canonical `data/learning` articles only.
- Max **3** Learning sources per query.
- Excerpt max **800** chars.
- One best section per article slug.
- Stable deterministic tie-break.
- Weak/body-only overlap does not qualify.
- Unrelated queries return zero sources rather than fabricated relevance.
- Swedish normalization preserves å/ä/ö, removes common function words and applies conservative morphology.

Key modules:

| Path | Responsibility |
|------|----------------|
| `lib/divbrain/server/learning/corpus.ts` | Published Learning corpus adapter |
| `lib/divbrain/server/learning/normalize.ts` | Swedish-safe normalization/tokenization |
| `lib/divbrain/server/learning/score.ts` | Weighted lexical ranking |
| `lib/divbrain/server/learning/retrieve.ts` | Retrieval API |
| `lib/divbrain/server/learning/context-assembler.ts` | Retrieval → canonical context assembly |
| `lib/divbrain/server/learning/learning-eval-fixtures.ts` | Roadmap 1C-3 curated eval fixture |
| `lib/divbrain/server/learning/learning-evals.ts` | Prompt-free deterministic eval runner |

## Trust boundary

Retrieved Learning prose is **untrusted context**. It cannot replace DivBrain identity, policy or guardrails. Guardrail-blocked prompts return before Learning retrieval. The canonical context assembler still validates, deduplicates, budgets and delimits source material.

A completed grounded assistant result may persist validated source objects. Repository reads validate source payloads on the semantically active grounded-answer path. The browser shell receives only display-safe metadata:

- source id
- title
- optional publisher / attribution
- validated internal route or HTTPS canonical URL

The shell never receives source excerpts, record refs, data-as-of fields, retrieval diagnostics, prompt/system context or provider-private metadata.

## Transcript source rendering

Completed grounded assistant messages show a compact **Källor** list numbered `[1]`, `[2]`, etc. Internal Learning routes use Next.js navigation; future external sources use validated HTTPS links with `noopener noreferrer`.

Generated inline `[n]` markers remain escaped plain text for now. The numbered source list beneath the answer is authoritative; interactive inline markers are optional later polish.

## Roadmap 1C-3 — retrieval evals

The deterministic eval suite contains **36 manually curated cases**:

- 3 clear retrieval cases for each of the 9 currently published Learning articles = 27 matched cases
- 9 deliberately unrelated no-match cases
- unique case IDs
- all 10 eval categories represented (9 article/topic categories + `no_match`)

Each case specifies only the expected top Learning slug (or no-match). The runner verifies:

- expected top slug / honest zero-match
- max-result bound
- source/hit ordering consistency
- canonical `/learning/<slug>` route consistency
- `divlab_learning` source category
- duplicate fixture IDs

Eval reports contain case IDs, categories and outcomes only — **never the raw prompt text**.

The suite is included automatically by `npm run test:divbrain`; no live model call is needed.

## Adding new Learning articles

1. Add the article under `data/learning/articles/`.
2. Register it in `data/learning/index.ts` (`learningArticles`).
3. Add/update retrieval eval cases that represent the new article’s intended queries.
4. Do not edit article copy solely to game retrieval ranking.

## Current limitations

- Lexical overlap is not semantic understanding; typo/synonym handling is intentionally conservative.
- No vector retrieval or model re-ranking.
- No personalization.
- No live market/news retrieval.
- Learning freshness is internally curated rather than computed from wall-clock age.
- Inline `[n]` markers are not interactive yet.

## Validation

```bash
npm run lint
npm run typecheck
npm run test:divbrain
npm run build
```

No provider/network call is required for these tests.
