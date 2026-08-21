# Architectural Decisions

This document answers: **Why were significant choices made?**

Use this log to record decisions that affect future development. Each entry should be concise and durable.

---

## Format

```text
### ADR-NNN: Title
Date: YYYY-MM-DD
Status: Accepted | Superseded | Deprecated

Context
What problem or situation required a decision?

Decision
What was decided?

Consequences
What does this mean for future work?
```

---

## ADR-001: Documentation Structure v1.0

Date: 2026-07-06
Status: Accepted

### Context

Documentation grew organically at the `docs/` root. Multiple documents overlapped in scope, making onboarding and long-term maintenance harder.

### Decision

Reorganize documentation into four responsibilities:

- `project/` — what Dividend Lab is and where the product is going
- `design/` — how it should feel and look
- `standards/` — how it should be built and reviewed
- `ai/` — how AI-assisted development and Dividend Brain should behave

Create `docs/README.md` as the single entry point. Each document owns one question. Standards are versioned independently (v1.0).

### Consequences

- Contributors start at `docs/README.md`
- Cross-references use new paths (`docs/design/DESIGN_SYSTEM.md`, not `docs/DESIGN_SYSTEM.md`)
- Legacy root paths retain redirect stubs for backward compatibility
- New decisions should be recorded here as ADR entries

---

## ADR-002: Mock-First Product Development

Date: 2026-07-06
Status: Accepted

### Context

Dividend Lab needs a complete premium product experience before backend services are finalized.

### Decision

Use mock data in `data/` and mock authentication in `lib/auth/`. Keep route files thin and preserve component contracts so data sources can migrate to `lib/api/` later.

### Consequences

- No backend dependency for current product work
- Mock data must not be embedded in large UI components
- API and database design are documented separately in `project/API.md` and `project/DATABASE.md`

---

## ADR-003: Investor Level and PRO Membership Are Separate

Date: 2026-07-06
Status: Accepted

### Context

Investor Identity introduces reputation and progression systems alongside potential premium membership.

### Decision

Investor Level (community reputation and engagement) and PRO membership (paid subscription) are independent systems. They must not be conflated in UI or data models.

### Consequences

- Level badges and membership cards use separate components and data
- Premium features do not automatically imply investor level
- Future billing logic must respect this separation

---

## ADR-004: Calm Interface and Transform-Only Motion

Date: 2026-07-06
Status: Accepted

### Context

Sidebar hover interactions and collapsible UI elements caused layout shifts that broke the premium calm experience.

### Decision

Follow the Calm Interface Principle: no layout shifts during interaction. Animate only `transform` and `opacity`. Keep collapsible elements mounted with fixed dimensions when motion is required.

### Consequences

- Motion guidelines live in `standards/UI_UX_STANDARD.md`
- Avoid `hidden`/display toggles that re-enter flex layout during width transitions
- Performance and perceived quality take priority over decorative animation

---

## ADR-005: Event Core Architecture

Date: 2026-07-06
Status: Accepted

### Context

Dividend Lab needs a durable internal model for company events. Multiple external sources (investor relations, exchanges, data vendors, internal database) will supply event data over time. The Calendar and future features must not depend on any single provider format.

### Decision

Introduce Event Core at `lib/events/` as the first business domain. All company event data follows this pipeline:

```text
Provider (raw vendor format)
  → Mapper (normalization)
  → CompanyEvent (internal model)
  → Repository (storage + query)
  → Services (domain logic)
  → Presenters (UI view models, when needed)
  → UI (consumes services only)
```

Key principles:

- **CompanyEvent** is the single internal event model. It represents Dividend Lab's understanding of an event, not any vendor schema.
- **Providers never reach the UI.** UI imports services from `@/lib/events`, never providers, mappers or `data/` mock files.
- **Mapping occurs before services.** Raw data is normalized into `CompanyEvent` at ingestion time. Services operate on a consistent model.
- **Provider independence** is non-negotiable. Switching from mock to Finnhub, Nasdaq, EDGAR or PostgreSQL requires only a new provider + mapper. Services, repository contract and UI remain unchanged.

Composition is centralized in `createEventCore()` with `runtime.ts` exporting the application singleton.

### Consequences

- New event features must extend Event Core, not bypass it
- Future domains (Portfolio, Market, Brain, Community, User) follow `lib/{domain}/` under `docs/project/CORE_DOMAINS.md`
- Database-backed repositories implement `EventRepositoryContract` without service changes
- Dividend Brain consumes `CompanyEvent` directly — no additional transformation layer
- `data/calendar.ts` is deprecated; calendar data flows through Event Core services

---

## ADR-006: Editorial Internal Linking v1

Date: 2026-08-21
Status: Accepted

### Context

DivLab News and Learning now contain enough published material that articles can strengthen discovery, reader navigation and topical structure by linking to other genuinely relevant DivLab pages. The feature must not require URL migrations, database changes or automated rewriting of published article bodies.

### Decision

Introduce a deterministic, fail-closed internal-linking layer for Börsnyheter.

- Related links are computed in `lib/news/internal-links.ts` from existing published News and Learning metadata.
- Existing SEO metadata can provide relevance signals immediately; news articles may additionally provide optional editorial `internalLinking` metadata for topics, companies, tickers and explicit related slugs.
- Explicit editorial relationships outrank automatic matches.
- Weak or generic matches are rejected. There is no fallback to arbitrary recent content.
- The article page renders at most a small bounded set of crawlable Next.js links through the shared related-content component.
- Existing article URLs, canonical metadata, sitemap behavior and article bodies remain unchanged.
- Contextual links inside article prose continue to use the existing internal rich-text link syntax when editors deliberately add them.

### Implementation status

Completed and deployed to production on 2026-08-21 through PR #264.

The production release verified that the related-content block is server-rendered, crawlable and can connect News articles to both relevant News and Learning pages without changing existing URLs or canonical behavior. Internal Linking v1 is therefore considered delivered and is now part of the normal DivLab editorial baseline.

### Consequences

- New articles can participate without requiring new mandatory fields.
- Editors can strengthen important relationships without changing the relevance engine.
- Internal-link consideration is now a standing requirement in future News publishing work, not a one-time implementation task.
- New relevant content should strengthen the existing internal graph over time through contextual links and deliberate `internalLinking` metadata where useful.
- Invalid, duplicate and self-referential related slugs must never surface to readers.
- Relevance changes require deterministic tests, including guardrails against generic period/category matches such as unrelated Q2 articles.
- Existing published article bodies must not be rewritten automatically to manufacture links; retroactive body links remain an editorial action.
- The same approach may later expand to other published DivLab surfaces, but only through explicit product work rather than broad automatic rewriting.
