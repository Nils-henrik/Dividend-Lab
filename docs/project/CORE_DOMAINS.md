# Core Domains

This document answers: **What are Dividend Lab's major business domains?**

It is a high-level architectural map. It does not describe implementation details.

Each domain should live under `lib/{domain}/` with its own types, providers, repository, services and presenters. Domains communicate through typed service contracts, not through shared raw data or provider-specific formats.

---

## Domain Layout Convention

```text
lib/
  events/          Event Core (active)
  portfolio/       Portfolio Core (planned)
  market/          Market Core (planned)
  brain/           Dividend Brain Core (planned)
  community/       Community Core (planned)
  user/            User Core (planned)
```

UI components consume domain services. They never import providers, mappers or raw mock data.

---

## Event Core

**Status:** Active

**Path:** `lib/events/`

**Responsible for:**

- Company events (dividends, earnings, governance, communications)
- Event taxonomy and normalization into `CompanyEvent`
- Provider ingestion and mapping
- Portfolio-scoped event queries
- Timeline and search over events
- Presentation adapters for feature-specific UI

**Consumers:** Calendar, Dividend Brain (future), Dashboard (future)

See `project/DECISIONS.md` ADR-005 for architectural rationale.

---

## Portfolio Core

**Status:** Planned

**Responsible for:**

- Holdings and positions
- Transactions and cost basis
- Portfolio allocations
- Income goals and progress
- Portfolio-scoped company references

**Does not own:** Raw market prices, external event feeds, forum data

**Consumers:** Portfolio page, Dashboard, Goals, Calendar (portfolio filter context)

---

## Market Core

**Status:** Planned

**Responsible for:**

- Prices and quotes
- Fundamentals and financial metrics
- Historical price and dividend data
- Exchange and instrument metadata

**Does not own:** User portfolios, event interpretation, community content

**Consumers:** Portfolio Core, Event Core (enrichment), Charts, Watchlist

---

## Dividend Brain Core

**Status:** Planned

**Responsible for:**

- AI-assisted portfolio observations
- Daily and weekly portfolio summaries
- Event interpretation and educational explanations
- Non-advisory language guardrails

**Does not own:** Raw events or market data. Consumes `CompanyEvent` from Event Core and portfolio context from Portfolio Core.

**Consumers:** Brain page, Calendar summary, Dashboard insights

---

## Community Core

**Status:** Planned

**Responsible for:**

- Forum threads and posts
- Categories and moderation signals
- User reputation and recognition
- High-signal discussion metadata

**Does not own:** User authentication, investor identity profiles

**Consumers:** Forum, Investor Identity (reputation section)

---

## User Core

**Status:** Planned

**Responsible for:**

- Authentication and sessions
- User preferences and settings
- Investor identity and privacy controls
- Achievements and progression (Investor Level)

**Does not own:** PRO subscription billing (may integrate with a future billing domain)

**Consumers:** Account, Settings, App shell, all authenticated routes

---

## Cross-Domain Rules

1. Each domain owns one business capability. Avoid domain dumping grounds.
2. Domains expose services, not internal repositories or providers.
3. Normalization happens inside the domain that owns the data, before services.
4. Presenters translate domain models into UI view models. UI never adapts provider formats.
5. New domains follow the Event Core pattern: `types/`, `providers/`, `mappers/`, `repository/`, `services/`, `presenters/`, `runtime.ts`.

---

## Related Documentation

| Question | Document |
|----------|----------|
| Why was Event Core designed this way? | `project/DECISIONS.md` (ADR-005) |
| How should code be structured? | `standards/ARCHITECTURE_STANDARD.md` |
| How should domains be named? | `standards/NAMING_CONVENTION.md` |
