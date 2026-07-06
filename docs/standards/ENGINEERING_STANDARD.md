# Engineering Standard v1.1

This document defines how Dividend Lab code should be engineered. It answers: how should we build the product responsibly over many years?

---

## Core Engineering Principles

Dividend Lab engineering should prioritize:

- maintainability over cleverness
- scalability without premature abstraction
- simple architecture over complicated patterns
- reusable components over duplication
- readable code over dense code
- production readiness over prototype shortcuts
- long-term quality over short-term speed

Every change should leave the codebase cleaner, clearer or more capable than before.

---

## Production-Ready Mindset

Production-ready work should:

- preserve existing functionality
- avoid broad rewrites unless necessary
- use TypeScript strictly
- keep imports clean
- avoid dead code and commented-out code
- avoid hidden fallback behavior that masks defects
- include validation appropriate to the risk of the change

Prototype shortcuts should not become permanent product foundations.

---

## Maintainability

Code should be easy for another senior engineer to understand without historical context.

Prefer:

- descriptive names
- small focused components
- clear ownership boundaries
- local state until shared state is justified
- explicit contracts between components and data
- simple control flow

Avoid:

- duplicated logic
- overly generic abstractions
- clever one-off helpers
- feature logic hidden inside unrelated modules
- large route files

---

## Reusability

Reuse existing components and helpers before creating new ones.

Create a new abstraction only when it:

- clarifies ownership
- reduces meaningful duplication
- improves readability
- supports future growth
- matches an established local pattern

Do not create abstractions only for style or theoretical reuse.

---

## Clean Architecture

Dividend Lab should use clear separation of responsibilities:

- routes assemble product surfaces
- feature components own UI composition
- mock data belongs in `data/`
- shared contracts belong in `types/`
- reusable formatting and pure utilities belong in `lib/utils`
- authentication helpers belong in `lib/auth`
- app-wide constants belong in `lib/constants`

Keep product domains separated. Avoid allowing one feature area to become a dumping ground for another.

---

## SOLID Principles

Use SOLID principles where they improve clarity:

- components should have one responsibility
- modules should be open to extension through composition, not copy-paste
- interfaces and types should describe real contracts
- dependencies should point toward stable shared utilities, not arbitrary feature internals

Do not force object-oriented patterns where React composition or simple functions are clearer.

---

## Performance

Dividend Lab should feel fast, calm and precise.

Prefer:

- rendering only what is needed
- stable component boundaries
- avoiding unnecessary re-renders
- compositor-safe animation properties such as `transform` and `opacity`
- lightweight local state

Avoid:

- expensive client-side work without need
- layout shifts
- animation of layout-affecting properties when avoidable
- adding dependencies for small problems

---

## Technical Debt

Technical debt should be avoided when it compromises:

- product stability
- future feature work
- design consistency
- developer understanding
- validation confidence

Small cleanup is welcome when it is directly related to the task. Broad refactors require clear justification. See Intentional Refactoring below.

---

## Intentional Refactoring

Refactoring is encouraged when it improves maintainability, scalability, readability or removes technical debt.

However, refactoring should never happen simply because another architecture might also work. Architecture should evolve only when there is a clear benefit for the next stage of development.

Avoid rewriting stable code in pursuit of theoretical perfection. A working, well-structured architecture is often more valuable than a constantly changing one.

Every refactor should have a measurable purpose. Valid reasons include:

- enabling a new feature
- improving maintainability
- reducing technical debt
- improving scalability
- improving performance
- simplifying the architecture

Avoid refactoring because:

- a different design pattern exists
- a newer architecture is popular
- folders could be organized differently without providing value
- code simply "looks cleaner"

Prefer stability over unnecessary change. A mature codebase should become increasingly predictable over time.

> **Do not refactor code simply because a different architecture is possible. Refactor only when the current architecture no longer supports the next stage of development.**

This is a core architectural value at Dividend Lab. Stability and intentional evolution take priority over continuous restructuring.

---

## Validation

Meaningful code changes should be validated with the appropriate checks:

- TypeScript
- ESLint
- production build when route-level or framework behavior changes
- targeted manual review for responsive and interaction behavior

Do not treat passing checks as a substitute for product judgment.
