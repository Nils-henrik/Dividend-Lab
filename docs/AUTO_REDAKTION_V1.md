# DivLab Autoredaktion v1

Status: production safety layer for the existing ChatGPT weekday automations.

This document does **not** replace `DIVLAB_REDAKTION_MASTER.md`. The latest version of that file on `main` is always the editorial source of truth. If this runbook and the master conflict, the master wins.

## Scope

Autoredaktion v1 covers only:

- `Norden i centrum`
- `BörsSverige`

It keeps the existing `NewsArticle` architecture, article modules in `data/news-articles/`, registration in `lib/news/get-articles.ts`, GitHub, the existing Quality Gate and Vercel Git deployment. It does not introduce a CMS or a second scheduler.

The existing ChatGPT automations remain the scheduler:

- Norden i centrum: weekdays 08:00 Europe/Stockholm
- BörsSverige: weekdays 08:20 Europe/Stockholm

## Non-negotiable publication rule

Publishing is autonomous but fail closed.

A normal successful run does not ask for human approval. A failing run does not publish.

Never push a generated article directly to `main`. Every autonomous article must use a short-lived branch and pull request so the existing pre-merge Quality Gate can stop bad content/code before Vercel production is touched.

## Daily publication flow

1. Fetch/read the latest `main` SHA.
2. Read the latest `DIVLAB_REDAKTION_MASTER.md` from that same `main`.
3. Read the latest relevant BörsSverige/Norden articles and very recent `/news` content to avoid duplicate angles.
4. Perform broad current-morning research within the series geography. Prefer primary sources. Do a separate factual verification pass after drafting.
5. Set and record `Editorial research cutoff: HH:MM CEST/CET, D Month YYYY` in the article source comment.
6. Create/update exactly one normal `NewsArticle` module under `data/news-articles/`.
7. Use `source: "DivLab Redaktion"`. Use `imageUrl: null` when no verified local cover asset exists. Never invent an image path.
8. Refetch latest `main` immediately before editing `lib/news/get-articles.ts`. Register the article with a unique import and `applyNewsSearchSeo(...)`. Never reconstruct the registry from an old copy.
9. Create a short-lived branch from latest `main`, commit the article and registry update, then open a PR to `main`.
10. Let the existing Quality Gate run. It now includes the Autoredaktion gate plus lint, TypeScript, tests, SEO/news tests and production build.
11. If the generated code itself caused a small syntax/import/registry failure, repair it on the PR branch and rerun the same gates. Never weaken a gate to make the article pass.
12. Before merge, compare the PR with current `main`. If `main` moved after the run started, refresh/rebase/recreate the content change from latest `main`. The Autoredaktion registry-preservation gate will reject a stale registry write that drops already-published article imports/entries.
13. Merge only a green PR. No human approval is required in the normal autonomous path.
14. Wait for the Vercel **production** deployment for the merge commit. Preview/commit status alone is not publication success.
15. Verify the real production article at `https://divlab.se/news/[slug]` and verify `/news`.
16. Only after production verification is green, generate the finished X text with the article URL and natural inline hashtags.

## Article validator

`lib/news/autoredaktion.ts` validates autonomous articles fail closed. The gate checks at least:

- non-empty `id`, `slug`, `title`, `summary`
- semantic lowercase slug format
- exactly one matching slug and ID in the published registry (missing registration and duplicates both fail)
- valid `publishedAt`; valid and ordered `updatedAt` when present
- publication date equals the current date in `Europe/Stockholm`
- no publication/update timestamp materially in the future
- `url === /news/${slug}`
- canonical resolves to `https://divlab.se/news/${slug}` through the existing canonical helper
- non-empty SEO title/description
- at least three SEO keywords
- non-empty intro and sections/headings/paragraphs
- positive integer reading time
- standard disclaimer enabled
- useful `internalLinking` signals
- obvious placeholder text rejected
- `source: "DivLab Redaktion"`
- `imageUrl: null` is valid
- local cover/thumbnail/inline image paths must resolve to real files under `public/`
- external image URLs are rejected by the autonomous gate because CI cannot prove they will not 404
- TypeScript still enforces the existing `NewsArticle` contract

The source gate also requires an `Editorial research cutoff:` comment.

## Series validator

The validator intentionally uses a simple, auditable lexical gate rather than pretending to solve journalism with opaque NLP.

### BörsSverige

- slug/title must identify BörsSverige
- article needs explicit Swedish-market signals
- USA/Wall Street/Nasdaq/Asia signals cannot dominate Swedish signals
- a pre-09:00 Stockholm publication is rejected if it contains a present-tense Swedish share/index move such as "aktien stiger" before the market has opened

Foreign context is still allowed when the article remains clearly Sweden-led. The editorial master and factual research pass remain responsible for deciding whether a specific foreign fact has a real Swedish connection.

### Norden i centrum

- slug/title must identify Norden i centrum
- content needs explicit Nordic signals (Sweden, Norway, Denmark and/or Finland)
- generic USA/world-market content cannot dominate the article
- equal country weighting is not required

## Stale-write protection

`validateRegistryPreservesBase(...)` compares the PR registry with the PR's current base SHA. Every existing article-module import and published registry entry from the latest base must still exist.

This specifically protects the morning sequence:

1. Norden merges around 08:00.
2. BörsSverige must read current `main` after Norden.
3. If BörsSverige was generated from an older registry and would remove Norden's new entry, CI fails with `stale_registry_write`.

The PR must then be refreshed from latest `main`; the gate must not be bypassed.

## Idempotency

The helper `upsertAutoredaktionRegistrySource(...)` is idempotent and is covered by tests. Running the same entry twice does not duplicate the import or `applyNewsSearchSeo(...)` entry.

Operationally, each ChatGPT run must also check before writing:

- whether today's series slug/file is already present on latest `main`
- whether the production URL is already correct and live

If already correct, the run exits without a destructive rewrite. If a correction is required, update the same article/slug through a new PR.

## Images

Images never block editorial publication when no safe image is available.

Preferred order:

1. verified local daily image already present under `public/`
2. verified local series fallback that is editorially correct
3. `imageUrl: null`

Never create a guessed path. A broken local asset fails CI. `null` is explicitly supported by the existing article metadata path.

## CI and dry-run matrix

The focused tests in `lib/news/autoredaktion.test.ts` cover:

- A — valid BörsSverige: PASS
- B — duplicate slug: FAIL
- D — missing SEO description: FAIL
- E — USA-dominated BörsSverige: FAIL
- F — broken image path: FAIL
- G — same registry entry twice: no duplicate
- H — Norden first, BörsSverige second: both remain registered
- stale registry write: FAIL
- pre-open fabricated present-tense Swedish market reaction: FAIL
- valid Norden i centrum: PASS
- `imageUrl: null`: PASS

Test C (invalid TypeScript) is enforced by `npm run typecheck` and the production build in the existing Quality Gate. Deliberately broken TypeScript must never be committed to `main` merely to demonstrate the failure.

## Production verification contract

A merged commit is not a successful article run until the real production deployment is READY and the real page is checked.

Verify at minimum:

- Vercel production deployment is `READY` and corresponds to the merge commit
- `https://divlab.se/news/[slug]` returns HTTP 200
- correct H1/title and publication date
- article body is rendered
- `<title>` / SEO title
- meta description
- canonical equals the production URL
- robots/indexing directives remain valid
- Open Graph title/description
- X/Twitter metadata (and image when an image exists)
- NewsArticle structured data
- configured image loads when non-null
- article appears in `/news`
- no obvious desktop or mobile rendering regression

If any of these checks fail because of the run, fix through another gated PR. Do not claim success while only a commit or preview exists.

## Run trace

Use the PR body or a final PR comment as the durable run log. Keep it compact:

```text
Series:
Date:
Start:
Research cutoff:
Title:
Slug:
Article validator: PASS/FAIL
Series validator: PASS/FAIL
Typecheck: PASS/FAIL
Tests: PASS/FAIL
Build: PASS/FAIL
Merge commit:
Vercel production: READY/FAIL
Production URL verification: PASS/FAIL
Final status: PUBLISHED / BLOCKED / ALREADY_LIVE
X text: ... (only after PUBLISHED)
```

GitHub history + PR checks + Vercel deployment state form the technical audit trail; the article comment preserves the editorial research cutoff.

## Security

Autoredaktion v1 exposes no public publication endpoint and adds no repository secret. GitHub permissions, the existing connected automation identity and Vercel's existing Git integration remain the publication boundary.

## Known limit

The deterministic validators can catch structural, scope, duplicate, stale-write, image and obvious pre-open reaction errors. They cannot prove that every researched financial fact is true. Primary-source research, a separate fact-check pass and the master rules remain mandatory before the code gate. A shorter verified article is always preferred over an unverified claim.
