# Features

This document answers: **What does Dividend Lab offer today?**

It describes current product areas at a high level. Implementation details belong in the codebase and architecture standards.

---

## Product Areas

### Dashboard

The daily entry point. Answers: "Why should I open Dividend Lab today?"

Includes overview metrics, portfolio graph, upcoming dividends, goals preview and forum preview.

Routes: `/dashboard`, legacy `/dashboard/*` variants.

### Portfolio

Portfolio analysis and dividend progress tracking.

Route: `/portfolio`.

### Watchlist

Stocks and positions the user is monitoring.

Route: `/watchlist`.

### Goals

Long-term dividend and income goal tracking.

Route: `/goals`.

### Calendar

Upcoming dividend payment schedule.

Route: `/calendar`.

### Learning

Educational content for long-term dividend investing.

Route: `/learning`.

### Forum

High-signal community discussion.

Routes: `/forum`, `/forum/[threadId]`.

### Dividend Brain

AI-assisted portfolio observations and education.

Route: `/brain`. See `ai/DIVIDEND_BRAIN.md` for behavior rules.

### Investor Identity

User profile, investor level, reputation and portfolio privacy controls.

Routes: `/account`, `/account/edit`.

### Settings

Application preferences and account configuration.

Route: `/settings`.

---

## Shared Experience

All authenticated product pages use the same application shell:

- permanent left sidebar (hover-expand on desktop)
- fixed top header
- scrollable main content

Shell components live in `components/layout/`.

---

## Current Data Model

Product data is currently mock-based. Mock datasets live in `data/` and are consumed by feature components.

When backend services are introduced, component contracts should remain stable while data sources migrate to `lib/api/`. See `project/API.md` and `project/DATABASE.md`.

---

## Feature Status

| Area | Status |
|------|--------|
| Dashboard | Active (mock data) |
| Portfolio | Active (mock data) |
| Watchlist | Active (mock data) |
| Goals | Active (mock data) |
| Calendar | Active (mock data) |
| Learning | Active (mock data) |
| Forum | Active (mock data) |
| Dividend Brain | Active (mock data) |
| Investor Identity | Active (mock data) |
| Settings | Active (mock data) |
| Real authentication | Planned |
| Real backend APIs | Planned |
| Premium subscription | Planned |

Update this document when a product area moves from mock to production or changes scope materially.
