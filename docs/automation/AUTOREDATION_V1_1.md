# Autoredaktion v1.1 — source of truth

Status: **Autoredaktion v1.1 READY**  
Approved templates: **Norden i centrum PASS ✅ / BörsSverige PASS ✅**  
Activation: implementation is production-verified and ready to be wired into the existing weekday jobs at 08:00 and 08:20. Those jobs are not changed by this runbook update.

This document is the authoritative runbook for Autoredaktion v1.1 image production. It supersedes the original v1.1 section appended to `AUTOREDATION_V1.md` and the implementation/rework notes in `AUTOREDATION_V1_1_VISUAL_REWORK.md` wherever those documents differ from this file.

## Final publishing flow

`research → fact-check → article → SEO → automatic series image → image validation → article validation → PR → Quality Gate → merge → Vercel production → live verification → X copy`

The image is generated only after the fact-checked article, publication date and relevant company set are stable. The image and article belong to the same publication PR in normal operation.

## Output contract

- renderer: deterministic SVG composition + Sharp; no generative image model and no live image/logo service;
- format: PNG;
- dimensions: exactly 1280×720;
- canonical URLs:
  - `/news/generated/norden-i-centrum-YYYY-MM-DD.png`
  - `/news/generated/borssverige-YYYY-MM-DD.png`;
- one series/date maps to one path; reruns are idempotent;
- `NewsArticle.imageUrl` and `thumbnailImageUrl` use the same generated URL;
- existing Next.js metadata reuses that `imageUrl` for `og:image` and `twitter:image` with `twitter:card=summary_large_image`;
- the date in the filename comes from `publishedAt` in `Europe/Stockholm`;
- each date has a new URL, so X/social caches do not reuse the previous day's image.

## BörsSverige — approved and frozen

Canonical master: `public/news-demo/borssverige-2026-09-01.png`.

Static pixels preserve:

- Stockholm/morning background;
- canonical DivLab branding;
- `BÖRSSVERIGE`;
- generic subtitle: `De viktigaste nyheterna om svenska börsbolag inför dagen.`

Only the existing date field is dynamic. No article headline, company logos, new panels/cards or generative image work may be added.

Template version: `borssverige-v2-generic-master`.

## Norden i centrum — approved and frozen

Canonical master: `public/news-demo/file_000000008a308210b3b73b7b8e0ad122.png`.

Static pixels preserve the approved `NORDEN / I CENTRUM` composition, DivLab branding and established background. Only the date field and the discrete lower company row are dynamic.

Company selection is deterministic from the final article's `internalLinking.companies`, weighted by editorial hierarchy: title, summary, first intro paragraph, section headings, then section body. The company row uses the approved white typographic wordmark/name grammar with thin separators.

Hard maximum: **4 companies**. 1–4 companies are valid. A missing local approved company asset is skipped and traced; zero companies is valid. Daily automation never fetches logos from the network and never invents a substitute.

Template version: `norden-v2-source-of-truth`.

## Validation and fail-safe

Generated images must pass:

- file exists and is non-empty;
- readable PNG;
- exact 1280×720 dimensions;
- canonical series/date filename and public path;
- article/image Stockholm date match;
- approved template version and canonical DivLab source;
- no duplicate companies and no more than four for Norden;
- no company marks for BörsSverige;
- approved local asset availability for every used Norden company;
- masked whole-image static regression against the canonical master.

Pixels outside declared dynamic masks must remain effectively identical to source of truth. Material static changes fail `static-region-regression`.

If rendering throws before article assembly, `renderSeriesImageSafe` returns no public path and article assembly uses `imageUrl: null` / `thumbnailImageUrl: null`; the article may continue through the ordinary content gates. This is deliberately different from a declared non-null broken image path, which fails closed.

`AutoredaktionRunTrace.imageGeneration` records template version, requested/used companies, missing assets, output path, dimensions, format, validation and fallback state.

## Quality Gate

Image-relevant PRs run the normal repository gate plus:

- lint;
- typecheck;
- changed autonomous article validation;
- core tests;
- SEO/news tests;
- Autoredaktion image tests;
- Autoredaktion dry-run;
- visual dry-run;
- DivBrain tests;
- cursor-bridge tests;
- production build.

A failing gate is not merged.

## Production verification — PASS ✅

Completed 12 September 2026 after both editorial template approvals.

Evidence:

1. implementation PR #295 passed the complete Quality Gate and was merged as `bf7debb422314d4184fc17e29c8e936cca8d99d4`;
2. production-verification PR #296 passed the complete Quality Gate and was merged as `d92b33e15128073ca74acee716a69cc0bdf0f43b`;
3. Vercel production deployment for `d92b33e15128073ca74acee716a69cc0bdf0f43b` reached `READY` and serves `divlab.se`;
4. `/news/generated/_canary/autoredaktion-v1-1-2026-09-01.png` returned HTTP 200 with `content-type: image/png`; its PNG IHDR is 1280×720;
5. the live BörsSverige 1 September article returned HTTP 200 and its image component uses responsive sizes for mobile and desktop with the configured object position;
6. the same article emitted `og:image`, `twitter:image` and `twitter:card=summary_large_image` from its configured article image;
7. `/news` returned HTTP 200 and rendered article thumbnails through the same responsive image path (`100vw` on mobile, `176px` on desktop);
8. generated production filenames are date-versioned (`{series}-YYYY-MM-DD.png`), so a new publication date receives a new social-image URL;
9. image tests prove renderer exception → no public path / `imageUrl:null`, while a declared broken generated image fails closed;
10. Vercel reported no relevant runtime errors during the final verification window.

The transport canary under `public/news/generated/_canary/` is verification-only. It is deliberately outside the canonical article filename namespace and must never be assigned to an article. It proves static serving; actual series output correctness is proven by the image renderer/validator tests and approved visual-review artifacts.

## Activation

**Autoredaktion v1.1 READY.** The implementation is ready to be wired into the two existing weekday jobs:

- 08:00 — Norden i centrum;
- 08:20 — BörsSverige.

Do not create a second scheduler. When the existing jobs are updated, they must follow this runbook and the final publishing flow above.
