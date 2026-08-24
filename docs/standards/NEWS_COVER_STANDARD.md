# DivLab News Cover Standard

Status: Active

This standard applies to all DivLab news/article cover images shown on `/news` and on individual article pages.

## 1. Non-negotiable identity rule

Every new DivLab news cover must show both of the following clearly:

- the article/series headline
- the official DivLab logo

The headline and DivLab logo must remain visible in the rendered `/news` view on both desktop and mobile. They may not be clipped, hidden behind UI, pushed outside the visible crop or become unreadable at thumbnail size.

An article is not considered visually ready for publication if either the headline or DivLab logo is missing or not clearly visible.

### 1.1 Canonical DivLab logo reference for Börsnyheter

The permanent visual reference for the DivLab logo used on **all Börsnyheter cover images** is the logo in the upper-left corner of this approved BörsSverige cover:

`public/news-demo/file_000000009cf48246883ae568fc196154.png`

This repository asset is the canonical reference until this standard is explicitly changed.

The referenced logo identity is:

- the blue stylized DivLab `D` symbol
- followed by the `DIVLAB` wordmark in dark lettering
- with the same relative proportions, spacing, orientation and visual identity as in the reference image

Rules:

- Use this exact logo identity on every new cover published under `/news`, including BörsSverige, BörsSverige Lunch, Norden i centrum, Wall Street/USA stories, company articles, report articles, market articles, weekly articles and other Börsnyheter formats.
- The user/editor must **not need to upload or identify the logo again for each new image**. When a new Börsnyheter cover is created or edited, retrieve/use the canonical reference above automatically.
- Do not substitute the logo with a generated interpretation, another DivLab variant, a text-only `DIVLAB`, or only a monogram unless this standard is explicitly changed.
- Do not alter the symbol, wordmark, colors, proportions or spacing.
- Standard placement is **upper-left**, inside the safe zone and with enough contrast to remain clearly visible in `/news`, mobile thumbnails and social previews.
- The reference image is authoritative for the **logo only**. Its Stockholm motif, headline layout, date treatment and other visual elements do not need to be copied unless relevant to the current article.
- If the canonical reference asset is ever moved, replaced or removed, this standard must be updated at the same time so the logo reference never becomes ambiguous.

## 2. Cover format

- Default cover ratio is **16:9**.
- The `/news` list and featured story must preserve the 16:9 frame instead of forcing a short fixed-height crop.
- Important baked-in text must not depend on aggressive `object-cover` cropping to remain readable.

## 3. Safe zone

Keep the following inside a safe zone with roughly 10–12% breathing room from the outer edges:

- DivLab logo
- article/series headline
- date
- company names or other key labels

The most important headline text should remain readable when the cover is displayed as a small news thumbnail.

## 4. Thumbnail positioning

Use the existing article metadata only when a legacy or non-standard image needs a custom focal point:

- `thumbnailObjectPosition` for desktop
- `mobileThumbnailObjectPosition` for mobile

Do not add series-specific crop hacks in the shared news-card components. Per-article metadata is the source of truth when an override is necessary.

## 5. Publication gate

A new article is not considered visually complete until its cover has been checked in all of these contexts:

1. `/news` latest/featured story on mobile
2. `/news` article row on mobile
3. `/news` article row on desktop
4. the individual article page

Verify that the headline, date, DivLab logo and relevant company names are visible and not clipped.

The headline and DivLab logo are mandatory checks and must pass before publication.

## 6. Implementation rule

Shared news thumbnail components should preserve the source cover's 16:9 composition. Custom object-position values are a fallback for older assets, not the default solution for new covers.
