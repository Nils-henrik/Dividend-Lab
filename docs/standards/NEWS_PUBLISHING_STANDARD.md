# DivLab News Publishing Standard

Status: Active
Version: 1.2

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

### Internal Linking v1 production status

**Completed and live in production on 2026-08-21 via PR #264.**

Internal Linking v1 is now part of DivLab's production baseline. The related-content engine and article block must be treated as an ongoing editorial capability, not as a one-time implementation task.

The production implementation:

- renders crawlable server-side internal links on News article pages when relevance is strong enough
- can connect News to other News articles and relevant Learning content
- rejects weak, duplicate, invalid and self-referential relationships
- keeps existing article URLs, canonical metadata, sitemap behavior and published article bodies unchanged
- uses a responsive related-content layout that remains part of the standard article experience

### Ongoing internal-linking workflow

Internal linking must continue as DivLab publishes new material.

For future editorial work:

- consider relevant internal links as part of every new article before publication is considered complete
- add descriptive contextual links inside the article when an existing DivLab page directly improves the reader's understanding
- add or strengthen `internalLinking` metadata when company, ticker, topic, report, market or Learning relationships are important but not obvious from generic metadata
- verify the rendered `Relaterat på DivLab` block after publication and confirm that every surfaced destination is published and relevant
- when a new article materially continues, supersedes or deepens an older article, create the relationship deliberately when useful so the internal graph improves over time
- revisit strategically important evergreen or high-traffic articles when new relevant DivLab content is published, but make those body-link changes editorially rather than through automatic rewrites

The goal is a growing, accurate internal content graph where readers and search engines can move naturally between related DivLab material without overlinking or artificial SEO patterns.
