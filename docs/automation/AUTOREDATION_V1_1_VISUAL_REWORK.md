# Autoredaktion v1.1 — Visual Template Rework v2

Status: **VISUAL TEMPLATE REWORK REQUIRED**  
PR: **#295 remains draft**  
Activation: **08:00 Norden and 08:20 BörsSverige remain unchanged**

This document supersedes the first v1.1 visual-template proposal. The technical
article/image pipeline remains intact; only the deterministic visual rendering
is being reworked.

## Source-of-truth rule

The published approved images are the templates. The renderer must behave like
an editor opening the existing image and changing only the values that are meant
to change.

It must not introduce a new panel, card system, typography system or composition.
No generative image model or generative inpainting is used.

Canonical references:

- BörsSverige: `public/news-demo/borssverige-2026-09-04-sectra.png`
- Norden i centrum: `public/news-demo/file_000000008a308210b3b73b7b8e0ad122.png`

Additional comparison references in visual-review-v2 include BörsSverige
1 September and Norden 1, 2 and 3 September. These establish how the existing
editable areas behaved across published editions; they are not alternate runtime
templates.

All references are resized deterministically to the canonical social size,
1280×720, using Sharp `fit: cover`, `position: centre`.

## Explicit dynamic masks

The only mutable pixels are declared in `lib/news/images/templates.ts`.
Coordinates are in the fixed 1280×720 output space.

### BörsSverige

- `date`: `{ x: 24, y: 281, width: 585, height: 70 }`

Everything outside the date mask is static. The existing background, DivLab
identity, `BÖRSSVERIGE`, article teaser, Stockholm scene and all other pixels
come directly from the canonical reference.

### Norden i centrum

- `date`: `{ x: 970, y: 46, width: 296, height: 58 }`
- `companyRow`: `{ x: 40, y: 555, width: 720, height: 84 }`

Everything outside those two masks is static, including the established
`NORDEN / I CENTRUM` composition, DivLab identity, subtitle, map, chart,
ship/flags and photographic background.

## Deterministic local reconstruction

The canonical PNGs are flat images. To remove baked date/company content, v2
reconstructs only the masked area by linear interpolation between the clean
pixel immediately above and below each mask column. This is deterministic local
pixel processing, not AI inpainting. No pixel outside the mask is rewritten.

Fresh date text and Norden company marks are then composited only inside their
mask. SVG overlays are clipped to the mask dimensions, preventing accidental
spill into static pixels.

## Typography calibration

The flat PNGs contain no font metadata. Values below were measured against the
actual raster glyph bounds and then checked against generated review output.
The measurements match Lato closely enough to use it as the deterministic
render family with normal fallbacks.

### BörsSverige date

Source-of-truth visible glyph bounds at 1280×720 are approximately
`x36..573 / y297..339` for `4 SEPTEMBER 2026`.

- family: `Lato, Arial, Helvetica, sans-serif`
- weight: 800
- size: 58 px
- tracking: 0.6 px
- baseline: 339 px absolute
- left aligned at approximately x36
- measured dominant blue: approximately `#004497`
- format: `D MÅNAD YYYY`

### Norden date

Source-of-truth visible glyph bounds are approximately
`x992..1260 / y59..89` for `4 SEPTEMBER`.

- family: `Lato, Arial, Helvetica, sans-serif`
- weight: 800
- size: 40 px
- tracking: 0.35 px
- baseline: 89 px absolute
- right aligned to approximately x1260
- white
- format: `D MÅNAD`

These values still require the one-time editorial PASS/FAIL; measurement does
not replace human template approval.

## Norden company row

The first-iteration white logo cards and the second-iteration coloured SVG marks
are both rejected as non-source-of-truth treatments.

Published 1, 2 and 4 September covers establish the normal row grammar:

- white, bold company wordmarks/names;
- Lato-like 31 px / weight 800;
- left-flow layout starting around x50;
- thin vertical separators;
- roughly 30 px before a separator and 27 px after it;
- no cards, shadows or white boxes.

The 3 September cover adds editorial imagery above the lower row, but the lower
company labels follow the same white-wordmark treatment.

Accordingly v2 renders the approved company display names in the established
row grammar rather than placing coloured logo artwork that is visibly wrong on
the dark background. The local logo registry remains the approval/availability
allowlist: a company without an approved, existing local registry asset is still
skipped and traced as missing. Optional reviewed `light`/`dark` variants remain
supported for future templates that actually use logo artwork. No live fetching
or synthetic recolouring is allowed.

Four companies is the reference-driven maximum. Marks are measured before
composition. If four approved names do not fit the established row at canonical
size, the lowest-ranked trailing company is omitted instead of shrinking or
crowding the row. Therefore `requestedCompanies` and `companiesUsed` can differ
for both missing-asset and visual-fit reasons.

## Masked static regression

The old DivLab-logo-only regression is replaced by whole-image static
regression outside the masks.

Policy for both templates:

- per-channel tolerance: **2 / 255**
- maximum changed-pixel ratio outside masks: **0.0001** (0.01%)
- maximum mean absolute RGB error outside masks: **0.05 / 255**

A renderer that changes composition, logo, background or any other meaningful
static region fails `static-region-regression` even if the output is otherwise a
valid PNG.

Because v2 begins from the resized canonical reference and clips every overlay
to its dynamic mask, normal output is expected to be effectively pixel-identical
outside the masks. The small threshold exists only for renderer/compositing
noise and is not permission for visual redesign.

## Visual review v2

`npm run autoredaktion:image:dry-run` writes only below the ignored
`.tmp/autoredaktion-images/review-v2/` tree.

Quality Gate uploads:

`autoredaktion-v1-1-visual-review-v2`

with canonical references, neighboring comparison references, the required date
and company-count renders, and:

```text
diffs/
  borssverige-static-region-diff.png
  norden-static-region-diff.png
```

The diff heatmaps render expected dynamic masks in grey, unchanged static pixels
black and static RGB differences in red.

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

Do not enable v1.1 after an internal visual inspection alone.

Required order after the final v2 artifact exists:

1. Redaktion explicitly marks **BörsSverige PASS/FAIL**.
2. Redaktion explicitly marks **Norden PASS/FAIL**.
3. Only after both PASS: run/confirm the complete Quality Gate including
   DivBrain, cursor-bridge and production build.
4. Mark PR #295 Ready for Review.
5. Merge implementation.
6. Wait for Vercel production `READY`.
7. Verify existing `/news` behavior.
8. Verify preview/test article-image integration.
9. Verify `og:image`.
10. Verify `twitter:image` / `summary_large_image`.
11. Verify public image HTTP 200 and image content type.
12. Verify desktop, mobile and thumbnail crop.
13. Only then update the existing 08:00 and 08:20 ChatGPT automations.

Until those steps are complete, status remains:

**VISUAL TEMPLATE REWORK REQUIRED**
