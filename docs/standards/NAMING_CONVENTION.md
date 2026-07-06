# Naming Convention v1.0

This document answers: **How should things be named across Dividend Lab?**

Predictable naming makes the codebase navigable without historical context. For folder ownership, see `ARCHITECTURE_STANDARD.md`.

---

## General Rules

- use descriptive names that explain product responsibility
- prefer clarity over brevity
- use PascalCase for React components and types
- use camelCase for functions, hooks, variables and instances
- use kebab-case for route segments and non-component file names where Next.js expects it
- avoid vague names: `Box`, `Section`, `Widget`, `Thing`, `DataCard`
- avoid abbreviations unless widely understood (`API`, `UI`)

---

## Folders

| Pattern | Example | Notes |
|---------|---------|-------|
| Product domain | `components/account/` | One folder per product area |
| Shared primitives | `components/ui/` | Product-neutral only |
| App structure | `components/layout/` | Shell and navigation |
| Utilities | `lib/utils/` | Pure functions |
| Constants | `lib/constants/` | App-wide values |
| Mock data | `data/` | Temporary, replaceable |
| Shared types | `types/` | Cross-feature contracts |

Route folders in `app/` follow Next.js conventions (lowercase, dynamic segments in brackets).

---

## Files

| Type | Convention | Example |
|------|------------|---------|
| React component | PascalCase `.tsx` | `InvestorProfileHero.tsx` |
| Hook | camelCase with `use` prefix | `useMockAuth.ts` |
| Utility | camelCase `.ts` | `formatCurrency.ts` |
| Constant module | camelCase or domain name | `navigation.ts` |
| Mock data | camelCase `.ts` | `account.ts` |
| Type module | camelCase `.ts` | `portfolio.ts` |

One primary export per component file. Co-locate small helpers only when they are not reused elsewhere.

---

## Components

Use PascalCase. Name should describe what the component is in product terms.

Good:

- `DashboardShell`
- `AppSidebar`
- `PortfolioGraph`
- `DividendBrainPanel`
- `InvestorProfileHero`
- `PremiumMembershipCard`

Bad:

- `Card2`
- `HeaderSection`
- `DataDisplay`

Feature prefix is optional when folder context is clear (`account/InvestorProfileHero` not `account/AccountInvestorProfileHero`).

---

## Hooks

- prefix with `use`
- camelCase
- name describes what state or behavior is provided

Examples:

- `useMockAuth`
- `useSidebarHover`

---

## Utilities

- camelCase function names
- verb-first when performing an action: `formatCurrency`, `parseDate`
- noun-first when returning a value: `portfolioTotal`

Group related utilities in one module by domain, not one function per file.

---

## Constants

- `UPPER_SNAKE_CASE` for primitive constants
- grouped in domain modules under `lib/constants/`

Example: navigation labels and hrefs in `lib/constants/navigation.ts`.

---

## Interfaces and Types

- PascalCase
- noun-based, describing the entity or contract
- suffix with purpose when ambiguous: `PortfolioRange`, `DividendIncomeRange`

Prefer `type` for unions and mapped types. Use `interface` for object contracts likely to be extended.

Shared types used across features belong in `types/`. Feature-local types may live in the feature folder.

---

## Services

When `lib/api/` is introduced:

- domain modules: `portfolioApi.ts`, `brainApi.ts`
- functions: verb-first, domain-clear: `fetchPortfolio`, `submitBrainMessage`
- response types: `PortfolioResponse`, `BrainInsight`

Services return typed data or throw typed errors. They do not return raw fetch responses to components.

---

## Props

- component props interface: `[ComponentName]Props`
- keep prop names camelCase and descriptive: `showPremiumBadge`, not `flag`

---

## Final Rule

If a new engineer cannot guess what a file or component does from its name alone, rename it.
