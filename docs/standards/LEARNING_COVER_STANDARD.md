# DivLab Learning Cover Standard

Status: Active

This standard applies to all cover images shown in the DivLab Learning library on `/learning` and on individual Learning article pages.

## 1. Thumbnail format

- The shared Learning thumbnail uses a **3:2** frame.
- Learning covers are rendered with `object-cover`.
- Baked-in text, DivLab branding and other important visual information must remain readable inside the real 3:2 library thumbnail.
- A cover is not visually approved only because the full-size source image or article hero looks correct.

## 2. Safe zone

For new Learning covers with baked-in text:

- keep the headline comfortably inside the outer edges
- keep DivLab branding inside the safe area
- avoid placing important text directly against the left or right edge
- verify readability at the small thumbnail size used by `/learning`

## 3. Crop and focal-point rule

The shared component already supports per-article crop control through:

- `thumbnailObjectPosition`

When a cover is correct but the Learning thumbnail crops the wrong area:

1. fix the focal point with per-article metadata first
2. do **not** regenerate the image for a crop-only issue
3. do **not** add article-specific hacks to `LearningArticleThumbnail`
4. do **not** change other covers that already render correctly

Typical examples:

```ts
thumbnailObjectPosition: "left center"
```

or another article-specific `object-position` value when required.

## 4. Publication gate

A new Learning cover is not visually complete until it has been checked in all of these contexts:

1. `/learning` on mobile
2. `/learning` on desktop
3. narrow desktop/tablet-like layout using the Learning row thumbnail
4. the individual `/learning/[slug]` article hero
5. OG/social metadata when the same cover is used for sharing

Verify that:

- the complete baked-in headline is visible
- the first and last characters are not clipped
- DivLab branding remains visible where intended
- the main subject is still understandable
- no unrelated Learning covers were changed

## 5. Current examples

The following Learning articles require a left-aligned thumbnail focal point because important baked-in text sits toward the left side of the source image:

- `teknisk-analys-for-nyborjare`
- `isk-eller-kapitalforsakring`

They use:

```ts
thumbnailObjectPosition: "left center"
```

## 6. Final rule

If a Learning cover is clipped in the library, treat it as a rendering/crop issue first. Preserve the approved source artwork whenever possible and solve the thumbnail with the existing per-article focal-point metadata.
