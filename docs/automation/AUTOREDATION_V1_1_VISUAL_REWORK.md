# Autoredaktion v1.1 — Visual Template Rework v2

Status: **NORDEN PASS / BÖRSSVERIGE FINAL REVIEW PENDING**  
PR: **#295 remains draft**  
Activation: **08:00 Norden and 08:20 BörsSverige remain unchanged**

This document supersedes the first v1.1 visual-template proposal. The technical
article/image pipeline remains intact; only the deterministic visual rendering
was reworked.

## Editorial decisions

- **Norden i centrum: PASS.** Freeze the current v2 layout. Do not change the
  date field, `NORDEN / I CENTRUM` composition or typographic company row.
  Maximum company count is a hard **4**. 1–4 companies, missing-logo and
  no-logo fallback are approved.
- **BörsSverige: final review pending.** The only rejected item was the old
  4 September static master because it baked the article-specific Sectra line
  into a recurring template. The canonical master is now the approved
  **1 September 2026** cover with the generic subtitle:
  `De viktigaste nyheterna om svenska börsbolag inför dagen.`

## Source-of-truth rule

The published approved images are the templates. The renderer behaves like an
editor opening the existing image and changing only explicitly dynamic values.
It must not introduce a new panel, card system, typography system or composition.
No generative image model or generative inpainting is used.

Canonical references:

- BörsSverige: `public/news-demo/borssverige-2026-09-01.png`
- Norden i centrum: `public/news-demo/file_000000008a308210b3b73b7b8e0ad122.png`

All runtime references are resized deterministically to the canonical social
size, 1280×720, using Sharp `fit: cover`, `position: centre`.

## Explicit dynamic masks

The only mutable pixels are declared in `lib/news/images/templates.ts`.
Coordinates are in the fixed 1280×720 output space.

### BörsSverige

- `date`: `{ x: 24, y: 281, width: 585, height: 70 }`

Everything outside the date mask is static: Stockholm/morning background,
canonical DivLab branding, `BÖRSSVERIGE` and the generic subtitle. No company
logos and no article headline may be added.

### Norden i centrum — frozen after PASS

- `date`: `{ x: 970, y: 46, width: 296, height: 58 }`
- `companyRow`: `{ x: 40, y: 555, width: 720, height: 84 }`
- hard maximum: **4 companies**

Everything outside those two masks is static, including the established
`NORDEN / I CENTRUM` composition, DivLab identity, subtitle, map, chart,
ship/flags and photographic background.

## Deterministic local reconstruction

The canonical PNGs are flat images. To remove baked date/company content, v2
reconstructs only the masked area by linear interpolation between the clean
pixel immediately above and below each mask column. This is deterministic local
pixel processing, not AI inpainting. No pixel outside the mask is rewritten.

Fresh date text and Norden company marks are composited only inside their mask.
SVG overlays are clipped to the mask dimensions, preventing accidental spill
into static pixels.

## Typography calibration

The flat PNGs contain no font metadata. Values were measured against the raster
glyph bounds and checked against generated review output.

### BörsSverige date

- family: `Lato, Arial, Helvetica, sans-serif`
- weight: 800
- size: 58 px
- tracking: 0.6 px
- baseline: 339 px absolute
- left aligned at approximately x36
- measured dominant blue: approximately `#004497`
- format: `D MÅNAD YYYY`

The 14 and 30 September review renders are required to verify different date
widths remain inside the date-only mask without affecting series name or generic
subtitle.

### Norden date

- family: `Lato, Arial, Helvetica, sans-serif`
- weight: 800
- size: 40 px
- tracking: 0.35 px
- baseline: 89 px absolute
- right aligned to approximately x1260
- white
- format: `D MÅNAD`

## Norden company row — approved and frozen

Published 1, 2 and 4 September covers establish the approved row grammar:
white, bold typographic company wordmarks/names with thin vertical separators,
no cards, no shadows and no coloured logo blocks.

The local logo registry remains the approval/availability allowlist. A company
without an approved existing local asset is skipped and traced as missing.
Four companies is the hard maximum. If approved names do not fit, trailing
lower-ranked names are omitted rather than shrinking or crowding the row.

## Masked static regression

Whole-image static regression runs outside the explicit masks.

Policy for both templates:

- per-channel tolerance: **2 / 255**
- maximum changed-pixel ratio outside masks: **0.0001** (0.01%)
- maximum mean absolute RGB error outside masks: **0.05 / 255**

A renderer that changes composition, logo, background, series name, generic
subtitle or any other meaningful static region fails `static-region-regression`.

## Final BörsSverige visual review

`npm run autoredaktion:image:dry-run` writes below the ignored
`.tmp/autoredaktion-images/review-v2/` tree. Quality Gate uploads
`autoredaktion-v1-1-visual-review-v2`.

The final BörsSverige review must include:

- 1280×720 canonical 1 September reference with generic subtitle;
- `14 SEPTEMBER 2026` render;
- `30 SEPTEMBER 2026` render;
- static-region diff.

Outside the date mask the two renders must be effectively pixel-identical to
the resized 1 September canonical reference.

## Existing safety contract remains unchanged

The rework does not change:

- render timing after fact-check/final article;
- canonical `/news/generated/{series}-{date}.png` paths;
- 1280×720 PNG social asset;
- article/image date validation;
- same-PR publication unit;
- `imageUrl:null` renderer fail-safe;
- fail-closed behavior for a declared broken image;
- run trace fields;
- existing OG/Twitter metadata reuse;
- idempotent same-series/date rendering.

## Activation gate

Do not merge or enable v1.1 before the final BörsSverige editorial PASS.

Current order:

1. Norden i centrum editorial template review: **PASS**.
2. Generate corrected BörsSverige final review from the 1 September master.
3. Complete the full Quality Gate including lint, typecheck, changed-article
   validation, core tests, SEO/news tests, image tests, Autoredaktion dry-run,
   visual dry-run, DivBrain, cursor-bridge and production build.
4. Redaktion explicitly marks **BörsSverige PASS/FAIL**.
5. Only after BörsSverige PASS: mark PR #295 Ready for Review, inspect intended
   diff, merge, wait for Vercel production READY and perform the production,
   image, desktop/mobile/thumbnail and OG/X verification defined in the main
   Autoredaktion runbook.
6. Only after that complete production verification may the existing 08:00 and
   08:20 weekday jobs be updated.

Until the BörsSverige PASS is given, PR #295 remains draft and the jobs remain
unchanged.
