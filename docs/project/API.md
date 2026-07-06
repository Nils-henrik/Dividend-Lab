# API

This document answers: **How will Dividend Lab communicate with backend services?**

Dividend Lab does not yet have a production API. This document defines the intended direction for when backend services are introduced.

---

## Current State

- Product data is mock-based in `data/`
- Authentication is mock-based in `lib/auth/`
- No network API layer is active

---

## Intended Location

API clients and backend contracts will live in `lib/api/`.

Responsibilities:

- HTTP client configuration
- request/response typing
- error normalization
- authentication header injection
- endpoint modules grouped by domain

---

## Domain Modules (Planned)

| Module | Responsibility |
|--------|----------------|
| `auth` | Login, session, token refresh |
| `portfolio` | Holdings, positions, performance |
| `dividends` | Payment history, upcoming payouts |
| `goals` | Income targets, progress |
| `forum` | Threads, posts, reputation |
| `brain` | AI conversation, insights |
| `account` | Profile, preferences, subscription |

---

## Design Principles

- Components consume typed data, not raw API responses
- API modules return domain-shaped data or throw typed errors
- Mock data in `data/` should mirror future API contracts where practical
- Authentication state flows through `lib/auth/`, not scattered across components
- No API calls from route files; fetch in components, hooks or server actions as appropriate

---

## Error Handling

- Do not hide API failures with broad fallbacks
- Surface calm, user-appropriate error states in UI
- Log server errors for debugging; never expose internal details to users

---

## When to Update This Document

Update when:

- an API contract is finalized
- a new domain module is introduced
- authentication strategy changes
- mock data is replaced by a real endpoint

See also `project/DATABASE.md` for persistence design.
