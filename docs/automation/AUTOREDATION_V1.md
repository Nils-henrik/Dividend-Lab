# Autoredaktion v1 — fail-closed weekday publishing

Status: Active  
Series: **BörsSverige**, **Norden i centrum**  
Product Owner: Henrik Karlsson

This is the operational contract for the existing ChatGPT weekday jobs
(Europe/Stockholm: Norden i centrum 08:00, BörsSverige 08:20). It does **not**
add a scheduler, a public publication endpoint, or a second news architecture.

Editorial source of truth remains `DIVLAB_REDAKTION_MASTER.md` on latest
`main`. These gates do not weaken those rules.

---

## Architecture

Generated articles stay ordinary modules:

- file: `data/news-articles/{series}-{day}-{swedish-month}-{year}.ts`
- export: `BORSSVERIGE_*_ARTICLE` or `NORDEN_I_CENTRUM_*_ARTICLE`
- register in `lib/news/get-articles.ts` with `applyNewsSearchSeo(...)`

Publication path: temporary `cursor/...` branch → draft PR → existing
`.github/workflows/quality-gate.yml` → merge to `main` only when green →
Vercel Git integration deploys production. Do not write unsafely to `main`.

There is no HTTP publish API and no secrets in this flow.

---

## Required run order

1. Read latest `main` and `DIVLAB_REDAKTION_MASTER.md`.
2. Inspect the latest relevant DivLab articles for duplicate/new-angle control.
3. Do current-morning research, then a **separate** fact-check against primary sources.
4. Generate the article module with an `Editorial research cutoff` comment.
5. Use `imageUrl: null` if no safe image exists. Never invent a path.
6. Update the registry from **latest main**. If `main` moved after the run
   started (typical 08:00 → 08:20 window), refresh/rebase and rebuild only the
   additive registry change. Do not overwrite newer content.
7. Validate locally and through the PR Quality Gate.
8. Never merge failing content.
9. Merge the green change to `main` without human approval in normal
   operation of these two series. Stop for humans on high-risk or unrelated diffs.
10. Verify the **Vercel production** deployment is `READY`. Preview is not enough.
11. Verify live `https://divlab.se/news/[slug]`:
    - HTTP 200
    - H1 / title / date
    - SEO title and description
    - canonical `https://divlab.se/news/[slug]`
    - OG and X metadata
    - image only if `imageUrl` is set
    - article appears on `/news`
12. Generate X copy **only after** successful live verification.
13. Leave a compact run trace (`AutoredaktionRunTrace` in
    `lib/news/autoredaktion/types.ts`): series, date, start, research cutoff,
    title, slug, gate results, commit SHA, deployment, live verification,
    final status.

Do not claim publication success from a commit SHA alone.

---

## Local commands

```bash
npm run autoredaktion:dry-run
npm run test:autoredaktion
npx tsx scripts/autoredaktion-validate.ts --series borssverige --module data/news-articles/<file>.ts
npm run lint
npm run typecheck
npm run test:seo
npm run build
```

Quality Gate already runs lint, typecheck, core tests, news/SEO tests
(including these validators), DivBrain tests, cursor-bridge tests, and
production build. The workflow also runs the deterministic dry-run.

---

## Validator rules

### Article validator (fail-closed)

- `id`, `slug`, `title`, `summary` non-empty
- unique `id` and `slug` against the published registry (self id+slug is allowed)
- duplicate identities **inside** the published registry fail
- valid `publishedAt`; valid `updatedAt` when present; `updatedAt >= publishedAt`
- current article date versus the run clock (default 36h past / 12h future)
- `url === /news/${slug}`
- authored `seoTitle`, `seoDescription`, non-empty `seoKeywords`
  (`applyNewsSearchSeo` fallbacks do **not** satisfy this)
- non-empty `intro`
- non-empty `sections` with headings and paragraph content
- shape compatible with `NewsArticle`
- no empty/broken values or obvious placeholders (`TODO`, `lorem ipsum`, `{{...}}`, …)
- canonical generated via existing `getCanonicalUrl` as `https://divlab.se/news/${slug}`
- `imageUrl: null` is valid
- local image paths must exist under `public/`; broken local paths fail
- the validator never silently rewrites a broken path to `null`
- `normalizeBrokenLocalImageToNull(...)` exists as an **explicit** pre-validation helper

### Series validator (lexical / metadata)

**BörsSverige:** Sweden-only focus. Reject copy dominated by USA / Wall Street /
Nasdaq / Asia / foreign macro without an explicit Swedish-market connection.

**Norden i centrum:** Primary content must concern Sweden, Norway, Denmark
and/or Finland. Reject generic USA/world-market copy. Equal country
distribution is **not** required.

Limits: these are understandable phrase gates, not NLP. They can miss
paraphrases and can allow a brief foreign datapoint when Swedish/Nordic
language still dominates. `Nasdaq Stockholm|Copenhagen|Helsinki` is treated as
Nordic, not US Nasdaq. They do not replace editorial judgment or fact-check.

---

## Idempotency and stale main

- Same series + Europe/Stockholm calendar date → one file, one export, one
  `applyNewsSearchSeo` row.
- Re-running the same series/date must not create a second file, slug, import
  or registry entry.
- Always start from latest `main` before writing.
- If `startedFromMainSha !== latestMainSha`, rebuild the registry patch from
  the latest `get-articles.ts`. `planPublication` rejects the write unless
  `refreshedFromLatestMain: true`.

---

## Dry-run coverage (deterministic fixtures, not production)

| Case | Expected |
| --- | --- |
| A valid BörsSverige (`imageUrl: null`) | PASS |
| B duplicate slug | FAIL |
| C invalid TypeScript | blocked by isolated typecheck / CI typecheck |
| D missing SEO description | FAIL |
| E BörsSverige dominated by USA | FAIL |
| F broken image path | FAIL (optional explicit null helper is separate) |
| G same day/series twice | no duplicate |
| H Norden then BörsSverige | both registry entries preserved |

Fixtures live in `lib/news/autoredaktion/fixtures.ts`. Do not register them
in `get-articles.ts` and do not commit a fake current-day article to `main`.

---

## Merge and production

Autonomous merge is allowed for these two series only when Quality Gate is
green and the diff is the intended article + registry rows. This infrastructure
PR itself is **draft / review-only** and must not be self-merged.

Production verification is against `https://divlab.se`, not a Vercel preview.
Existing Vercel Git integration remains the deploy mechanism.
