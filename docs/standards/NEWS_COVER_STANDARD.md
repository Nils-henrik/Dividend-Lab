# DivLab News Cover Standard

Status: Active

This standard applies to all DivLab news/article cover images shown on `/news` and on individual article pages.

## 1. Cover format

- Default cover ratio is **16:9**.
- The `/news` list and featured story must preserve the 16:9 frame instead of forcing a short fixed-height crop.
- Important baked-in text must not depend on aggressive `object-cover` cropping to remain readable.

## 2. Safe zone

Keep the following inside a safe zone with roughly 10–12% breathing room from the outer edges:

- DivLab logo
- article/series headline
- date
- company names or other key labels

The most important headline text should remain readable when the cover is displayed as a small news thumbnail.

## 3. Thumbnail positioning

Use the existing article metadata only when a legacy or non-standard image needs a custom focal point:

- `thumbnailObjectPosition` for desktop
- `mobileThumbnailObjectPosition` for mobile

Do not add series-specific crop hacks in the shared news-card components. Per-article metadata is the source of truth when an override is necessary.

## 4. Publication gate

A new article is not considered visually complete until its cover has been checked in all of these contexts:

1. `/news` latest/featured story on mobile
2. `/news` article row on mobile
3. `/news` article row on desktop
4. the individual article page

Verify that the headline, date, DivLab logo and relevant company names are visible and not clipped.

## 5. Implementation rule

Shared news thumbnail components should preserve the source cover's 16:9 composition. Custom object-position values are a fallback for older assets, not the default solution for new covers.
