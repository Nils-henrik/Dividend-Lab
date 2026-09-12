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

---

# Autoredaktion v1.1 — deterministic series images

Status: **implementation / template review only**. Do not enable v1.1 in the
08:00 or 08:20 jobs until the one-time visual review has approved both template
families. This review is for the templates, not a new daily manual approval.

## Image architecture

The daily cover is rendered locally in Node with **SVG compositing + Sharp**.
No image-generation model, live logo lookup, Canva, screenshot service, upload
endpoint, API key or external render service is part of the normal run.

Canonical output is a 1280×720 PNG:

- `/news/generated/norden-i-centrum-YYYY-MM-DD.png`
- `/news/generated/borssverige-YYYY-MM-DD.png`

The same URL is used as article image and social image through the existing
`NewsArticle.imageUrl` → Next.js Open Graph/Twitter metadata path. A new date
therefore receives a new social URL and does not overwrite a cached previous-day
asset.

Template versions:

- `borssverige-v1`
- `norden-v1`

Visual source of truth:

- BörsSverige: `public/news-demo/borssverige-2026-09-04-sectra.png`
- Norden: `public/news-demo/file_000000008a308210b3b73b7b8e0ad122.png`
- canonical DivLab logo/lockup reference follows `docs/standards/NEWS_COVER_STANDARD.md`

The approved reference remains the fixed photographic/background base. The
baked dynamic foreground area is replaced as one clean opaque template panel
before the current date/text is drawn. The renderer never paints a new date on
top of an old date. The approved upper-left DivLab region is left untouched and
is regression-checked pixel-for-pixel against the resized reference.

## When rendering happens

Render only after the article is fact-checked and its title, publication date
and relevant companies are stable:

`research → fact check → final article → SEO → image data → render → image validator → article validator → series validator → branch/PR → Quality Gate`

The image file belongs to the same publication unit/PR as the article. Normal
publishing must not create a later image-only PR.

## BörsSverige

Only the Europe/Stockholm date is dynamic in normal operation. A supplied
`companies` array is ignored. The series name, composition, background and
DivLab identity remain fixed.

## Norden i centrum

Company candidates come from the final article's
`internalLinking.companies`. Selection is deterministic and weights, in order:
headline, summary, first intro paragraph, section headings, then section-body
mentions. Text frequency alone cannot outrank the editorial hierarchy.

The renderer accepts at most five unique companies. Layouts for 1, 2, 3, 4 and
5 marks are explicit. Logos are rendered with `contain`, keep their aspect ratio
and use a consistent neutral plate. Fewer than three or zero logos are valid.

## Approved local logo bank

`lib/news/images/company-logo-map.ts` is the only daily lookup. Each entry points
to a checked local file under `public/company-logos/` whose provenance is
already documented in `public/company-logos/SOURCES.md`.

Daily automation must never fetch a missing logo from the network. If an
important company has no approved asset:

1. record it in `missingCompanyLogos`;
2. skip that logo;
3. keep the remaining editorially relevant approved logos;
4. prefer fewer logos over a misleading substitute;
5. continue the article run.

To add a logo later: add the reviewed local asset, document its provenance in
`public/company-logos/SOURCES.md`, then register its canonical company name in
`company-logo-map.ts`.

## Date and idempotency

Image date comes from article `publishedAt` interpreted in
`Europe/Stockholm`. It must match the canonical file date. A mismatch fails the
image gate. The same series/date always maps to the same path; reruns overwrite
or regenerate that canonical path deterministically and never create `copy`,
`final2` or similar assets.

## Image validator

For a generated image, validation checks at least:

- output file exists, is non-empty and can be parsed by Sharp;
- exact PNG format and 1280×720 dimensions;
- canonical series/date filename and `/news/generated/...` public path;
- template version;
- canonical DivLab logo source and unchanged upper-left static logo region;
- article/image Europe/Stockholm date match;
- no duplicate logos and maximum five;
- BörsSverige does not receive company marks;
- every used company points to an approved existing local logo;
- template and canonical brand-reference assets exist.

The changed-article Quality Gate additionally validates any declared
`/news/generated/...` image. `imageUrl: null` explicitly passes the image gate;
a non-null generated path that is missing, malformed, wrong-sized, wrong-dated
or points to the wrong canonical URL fails closed.

## Fail-safe

A renderer exception **before article assembly** returns a failed image result
with no public path. The article assembly may then use:

```ts
imageUrl: null
```

and continue through the ordinary article/series Quality Gate. It must not
invent a path and must not wait for a missing company asset. This does not
weaken fail-closed behavior for a declared image: if `imageUrl` names a local
file and that file is missing/broken, publication fails.

`AutoredaktionRunTrace.imageGeneration` records template version, requested and
used companies, missing logos, output path, dimensions, format, validation
state and whether a fallback was used.

## Commands

Preferred article-driven dry run:

```bash
npm run autoredaktion:image:norden -- --article data/news-articles/<norden-file>.ts
npm run autoredaktion:image:borssverige -- --article data/news-articles/<borssverige-file>.ts
```

Explicit fixture-style render is also available:

```bash
npm run autoredaktion:image:norden -- --date 2026-09-14 --companies "Volvo,Ericsson,Investor"
npm run autoredaktion:image:borssverige -- --date 2026-09-14
```

No `--publish` means dry run and writes only under the ignored
`.tmp/autoredaktion-images/` tree. `--publish` writes the canonical asset under
`public/news/generated/` and is reserved for the actual publication branch.

Tests / one-time template review:

```bash
npm run test:news-images
npm run autoredaktion:image:dry-run
```

The visual dry run copies the approved reference images and renders:

- BörsSverige with a new date;
- Norden 1-logo, 2-logo, 3-logo, 4-logo and 5-logo layouts;
- Norden with a missing-logo request;
- Norden with no logos.

Quality Gate uploads those files as the
`autoredaktion-v1-1-visual-review` workflow artifact when image-relevant files
change. Dry-run images are never production assets.

## v1.1 activation gate

Do not mark v1.1 READY and do not wire it into the weekday jobs until all of the
following are true:

1. implementation Quality Gate is green;
2. visual-review artifact has been generated;
3. BörsSverige and Norden renders have passed the one-time editorial template review;
4. mobile/desktop crop is accepted;
5. a preview HTML check confirms `og:image`, `twitter:card=summary_large_image`
   and `twitter:image` resolve to the intended public PNG;
6. image HTTP response is public 200 with an image content type;
7. renderer-failure → `imageUrl:null` and declared-broken-image fail-closed paths
   are verified.

After that single template approval, the 08:00 and 08:20 jobs may generate and
publish images autonomously without daily manual image handling.
