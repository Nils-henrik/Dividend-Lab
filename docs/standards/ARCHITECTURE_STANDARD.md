# Architecture Standard v1.0

This document answers: **How should Dividend Lab be structured as it grows?**

It describes architectural direction and decisions, not every implementation detail. For naming rules, see `NAMING_CONVENTION.md`. For engineering principles, see `ENGINEERING_STANDARD.md`.

---

## Architectural Principles

Dividend Lab architecture should prioritize:

- clear ownership
- reusable components
- thin route files
- separated mock and business data
- predictable naming
- minimal duplication
- long-term scalability
- preservation of the design system

Do not create abstractions only for style. Create abstractions when they clarify ownership, reduce duplication or support future product growth.

---

## Current Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Recharts
- Mock authentication via local storage
- Mock product data in `data/`

No backend is currently required for the mock product experience.

---

## Folder Organization

### `app/`

Application routes. Route files should be thin — they assemble feature components and define route-level structure.

Product routes:

- `/dashboard`, `/portfolio`, `/forum`, `/learning`, `/watchlist`, `/goals`, `/calendar`, `/account`, `/settings`, `/brain`

Legacy `/dashboard/*` routes may coexist during migration. Prefer top-level product routes for new work.

### `components/`

Feature and shared UI. Each subfolder owns a product domain:

| Folder | Responsibility |
|--------|----------------|
| `ui/` | Product-neutral primitives (buttons, cards, inputs, badges) |
| `layout/` | App shell, sidebar, header, navigation |
| `dashboard/` | Dashboard-specific feature components |
| `brain/` | Dividend Brain UI |
| `charts/` | Reusable chart components |
| `account/` | Account and investor identity UI |
| `modals/` | Modal experiences |
| `marketing/` | Landing-page components only |

Marketing components must not become app shell components.

### `lib/`

Shared application logic:

| Folder | Responsibility |
|--------|----------------|
| `auth/` | Authentication and session helpers |
| `constants/` | App-wide constants (navigation, labels) |
| `api/` | Future API clients and backend contracts |
| `hooks/` | Reusable React hooks |
| `utils/` | Formatting and pure utility functions |

### `data/`

Temporary mock data. Not embedded in large UI components. Replaceable by `lib/api/` without breaking component contracts.

### `types/`

Shared TypeScript contracts used across multiple features. Add types when reuse is real, not speculative.

---

## Feature Boundaries

Keep product domains separated.

- Dashboard components answer daily engagement questions
- Brain components remain educational and non-advisory
- Account components handle identity, not portfolio analytics
- Layout components own structure, not feature content

Avoid allowing one feature area to become a dumping ground for another.

---

## Application Shell

All authenticated pages use the same shell from `components/layout/`:

- `AppShell`, `AppSidebar`, `AppHeader`
- `SearchBar`, `NotificationBell`, `ProfileDropdown`, `AppIcon`

The shell owns layout and navigation. It must not own dashboard-specific content.

---

## State Management Philosophy

Keep state local until there is a clear reason to share it.

Examples:

- modal open state stays in the modal component
- panel expansion state stays in the panel component
- auth uses `useSyncExternalStore` through `lib/auth/mockAuth`

Do not introduce global state libraries without a clear product need.

---

## Service Layer Organization

When backend services arrive:

- all HTTP communication flows through `lib/api/`
- domain modules grouped by product area (portfolio, dividends, forum, brain, account)
- components consume typed domain data, not raw responses
- authentication headers injected centrally

See `project/API.md` for planned API structure.

---

## Page Responsibilities

Pages should:

- assemble components
- define route-level structure
- stay readable

Pages should not:

- hold large mock datasets
- implement complex UI internals
- duplicate layout
- own app-wide navigation

---

## Future Scalability

As Dividend Lab grows:

- move reusable primitives into `components/ui`
- move repeated formatting into `lib/utils`
- move shared constants into `lib/constants`
- move backend communication into `lib/api`
- keep mock data replaceable
- preserve component contracts where possible
- record significant choices in `project/DECISIONS.md`

The goal is steady growth, not premature enterprise abstraction.

---

## Final Rule

Architecture should make the product easier to evolve while keeping Dividend Lab coherent, premium and trustworthy.
