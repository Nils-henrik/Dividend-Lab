# Dividend Lab Architecture

Dividend Lab is being built as a scalable SaaS platform for long-term dividend investors.

The architecture should support a growing product without sacrificing the calm premium user experience.

This document describes the current architecture and the intended direction for future development.

---

## Architectural Principles

Dividend Lab architecture should prioritize:

- clear ownership
- reusable components
- thin route files
- separated mock/business data
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

## Route Structure

Application routes live in `app/`.

The app is organized around product areas:

- `app/dashboard`
- `app/portfolio`
- `app/forum`
- `app/learning`
- `app/watchlist`
- `app/goals`
- `app/calendar`
- `app/account`
- `app/settings`
- `app/brain`

Legacy dashboard-prefixed routes may continue to exist while the product evolves, but the intended app-level route structure is top-level product routes.

Route files should be thin. They should mainly import and render feature components.

---

## Application Shell

The authenticated product experience uses a reusable app shell:

- permanent left sidebar
- fixed top header
- scrollable main content

Canonical shell components live in `components/layout`:

- `AppShell`
- `AppSidebar`
- `AppHeader`
- `SearchBar`
- `NotificationBell`
- `ProfileDropdown`
- `AppIcon`

All authenticated application pages should use the same shell.

The shell owns layout and navigation. It should not own dashboard-specific content.

---

## Folder Responsibilities

### `components/ui`

Reusable UI primitives.

Examples:

- buttons
- cards
- inputs
- badges
- dropdown primitives
- avatars
- loaders

These components should be product-neutral and reusable across features.

### `components/layout`

Application structure and navigation.

Examples:

- app shell
- sidebar
- top header
- search
- notifications
- profile menu
- breadcrumbs
- future footer

### `components/dashboard`

Dashboard-specific feature components.

Current examples:

- `DashboardShell`
- `OverviewCards`
- `PortfolioGraph`
- `UpcomingDividends`
- `GoalsCard`
- `ForumPreview`
- `PlaceholderPage`

Dashboard components answer: "Why should I open Dividend Lab today?"

### `components/brain`

Dividend Brain UI.

Current example:

- `DividendBrainPanel`

Future examples:

- `BrainMessage`
- `BrainInput`
- `BrainInsights`
- AI chat history
- educational explanation cards

Dividend Brain components must remain educational and must not provide financial advice.

### `components/charts`

Reusable chart components.

Current example:

- `DividendChart`

Future examples:

- `PortfolioGraph`
- `GrowthChart`
- dividend forecast charts

Charts should use Recharts and preserve the design system.

### `components/account`

Account and user settings UI.

Current example:

- `AccountOverview`

Future examples:

- `ProfileCard`
- `SubscriptionCard`
- `BillingCard`
- `SecurityCard`
- `NotificationSettings`
- `PaymentMethod`

### `components/modals`

Modal experiences.

Current example:

- `LoginModal`

### `components/marketing`

Landing-page marketing components.

Examples:

- `Hero`
- landing dashboard preview
- landing-specific chart wrappers

Marketing components should not become app shell components.

---

## `lib/` Responsibilities

### `lib/auth`

Authentication/session helpers.

Current example:

- `mockAuth`

Future real authentication should replace mock auth behind a stable interface when possible.

### `lib/constants`

Application-wide constants.

Current example:

- navigation labels, hrefs and page titles

### `lib/api`

Future API clients and backend contracts.

### `lib/hooks`

Reusable React hooks.

### `lib/utils`

Formatting and small pure utility functions.

---

## `data/` Strategy

Temporary mock data lives in `data/`.

Current examples:

- dashboard overview metrics
- upcoming dividends
- forum discussions
- Dividend Brain insights
- account section placeholders

Mock data should not be embedded inside large UI components.

When backend APIs are introduced, `data/` can be replaced gradually by API calls while preserving component contracts.

---

## `types/`

Shared TypeScript types live in `types/`.

Use this folder for contracts shared across multiple features.

Avoid over-modeling early. Add shared types when reuse is real.

---

## Component Philosophy

Components should have one responsibility.

Prefer:

- small feature components
- composition
- descriptive names
- clear props
- reusable UI primitives
- data passed from `data/`, `lib/` or parent components

Avoid:

- large route files
- duplicated components
- repeated mock data
- business logic hidden in UI markup
- generic abstractions with no product meaning

---

## Naming Conventions

Use descriptive names that explain product responsibility.

Good examples:

- `DashboardShell`
- `AppSidebar`
- `AppHeader`
- `PortfolioGraph`
- `DividendBrainPanel`
- `GoalsCard`
- `ForumPreview`
- `UpcomingDividends`
- `ProfileDropdown`
- `SearchBar`
- `NotificationBell`

Avoid vague names like:

- `Box`
- `Section`
- `Widget`
- `Thing`
- `DataCard` when the product meaning is known

---

## Page Responsibilities

Pages should:

- assemble components
- define route-level structure
- stay readable
- avoid embedded business logic

Pages should not:

- hold large mock datasets
- implement complex UI internals
- duplicate layout
- own app-wide navigation

---

## State Management Philosophy

Keep state local until there is a clear reason to share it.

Current examples:

- Login modal state is local to `LoginModal`.
- Dividend Brain expansion state is local to `DividendBrainPanel`.
- Mock auth uses `useSyncExternalStore` through `lib/auth/mockAuth`.

Do not introduce global state libraries without a clear product need.

---

## Future Scalability

As Dividend Lab grows:

- keep feature domains separated
- move reusable primitives into `components/ui`
- move repeated formatting into `lib/utils`
- move shared constants into `lib/constants`
- move backend communication into `lib/api`
- keep mock data replaceable
- preserve component contracts where possible

The goal is steady growth, not premature enterprise abstraction.

---

## Final Rule

Architecture should make the product easier to evolve while keeping Dividend Lab coherent, premium and trustworthy.
