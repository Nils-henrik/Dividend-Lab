# DivLab News Publishing Standard

Status: Active
Version: 1.1

This standard applies to editorial publication on `https://divlab.se/news`.

## 1. Publication workflow

Every new article published on `https://divlab.se/news` must also be published on DivLab's official X account as part of the normal news workflow.

The X publication should:

- link directly to the published DivLab article
- use the article's approved news cover image when possible
- use a concise, accurate post text based on the article headline and main news angle
- avoid claims or wording that are stronger than what the article supports

Publishing the article on DivLab without completing the X distribution step means the editorial publication workflow is not fully complete.

## 2. Order of operations

1. Publish and verify the article on `https://divlab.se/news`.
2. Verify that the article URL, metadata and cover image are correct.
3. Verify the cover according to `NEWS_COVER_STANDARD.md`.
4. Verify that relevant internal DivLab links resolve to published pages and that no forced or misleading relationship was introduced.
5. Publish the article on DivLab's official X account with the DivLab article link.

## 3. Visual requirement for social distribution

The same core visual identity used on DivLab should carry over to X. The approved article cover should clearly preserve the article headline and official DivLab logo.

Do not use a cropped or altered social version where the headline or DivLab logo becomes hidden or unreadable.

## 4. Editorial integrity

X is a distribution channel for DivLab journalism, not a separate source of claims. The social post must remain faithful to the published article and should drive readers back to the full article on DivLab.

## 5. Internal linking

Internal links are part of the normal DivLab editorial workflow when they genuinely help the reader understand or continue exploring the subject.

For each new article:

- use contextual internal links in the prose when a published DivLab page is directly relevant; the existing `[beskrivande länktext](/intern/sökväg)` syntax should be used rather than generic labels such as "Läs mer"
- use optional `internalLinking` metadata when the article has important company, ticker, topic or explicit News/Learning relationships that should be understood by the related-content engine
- prefer links to the most specific useful DivLab page rather than adding many loosely related links
- never invent a slug or link to unpublished content
- never add a link only to satisfy a link-count target

The automated related-content block is deliberately fail-closed. It may use existing SEO metadata and explicit editorial signals, but weak generic relationships must produce no link rather than an irrelevant fallback. Existing published article bodies must not be rewritten automatically to insert links.
