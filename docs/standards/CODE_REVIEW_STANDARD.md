# Code Review Standard v1.0

This document answers: **How do we know a feature is truly finished?**

Every completed feature should be reviewed against this checklist before being considered done.

---

## Architecture

- [ ] changes respect `standards/ARCHITECTURE_STANDARD.md`
- [ ] route files remain thin
- [ ] feature logic lives in the correct component folder
- [ ] mock data is in `data/`, not embedded in large components
- [ ] no unrelated refactors included
- [ ] new abstractions are justified by clarity or reuse
- [ ] significant decisions recorded in `project/DECISIONS.md` if applicable

---

## Readability

- [ ] names follow `standards/NAMING_CONVENTION.md`
- [ ] components have a single clear responsibility
- [ ] control flow is easy to follow
- [ ] no commented-out code or dead branches
- [ ] imports are organized and minimal

---

## Maintainability

- [ ] existing components reused before new ones created
- [ ] no duplicated logic that should be shared
- [ ] types describe real contracts
- [ ] changes are scoped to the task
- [ ] codebase is left cleaner or clearer than before

---

## Product Alignment

- [ ] aligns with `project/PROJECT.md` principles
- [ ] aligns with `design/BRAND.md` boundaries
- [ ] no broker, trading or advice mechanics introduced
- [ ] Dividend Brain changes follow `ai/DIVIDEND_BRAIN.md`

---

## UI and UX

- [ ] follows `design/DESIGN_SYSTEM.md` tokens
- [ ] follows `standards/UI_UX_STANDARD.md` interaction rules
- [ ] no layout shifts during interaction or loading
- [ ] motion uses `transform` and `opacity` where animated
- [ ] hover states are subtle and intentional
- [ ] loading and empty states are calm and professional
- [ ] no emojis in product UI
- [ ] existing design not redesigned unless requested

---

## Responsiveness

- [ ] desktop experience preserved
- [ ] responsive breakpoints behave correctly
- [ ] no broken layouts at `md`, `lg`, `xl` widths
- [ ] sidebar and shell interactions work on target viewports

---

## Accessibility

- [ ] interactive elements are keyboard reachable
- [ ] contrast is sufficient on dark backgrounds
- [ ] focus states are visible
- [ ] motion does not rely solely on color or animation for meaning

---

## Performance

- [ ] no unnecessary re-renders introduced
- [ ] no expensive client work without justification
- [ ] animations use compositor-safe properties
- [ ] no new dependencies added without clear need

---

## TypeScript and ESLint

- [ ] TypeScript passes (`tsc` / project check)
- [ ] ESLint passes
- [ ] no `any` introduced without justification
- [ ] props and data contracts are typed

---

## Build and Validation

- [ ] production build succeeds for route-level or framework changes
- [ ] manual review of affected pages completed
- [ ] no errors hidden by broad fallbacks

---

## Documentation

- [ ] documentation updated if product direction, architecture or standards changed
- [ ] no duplicate information added across docs
- [ ] cross-references use current paths under `docs/`

---

## Duplicate and Dead Code

- [ ] no duplicated components
- [ ] no unused imports
- [ ] no unreachable code
- [ ] removed code was intentionally removed, not accidentally broken

---

## Review Outcome

A feature is **complete** when all applicable checklist items pass.

Items marked not applicable should be noted in the delivery summary (e.g. "no documentation changes required — UI-only polish pass").

A feature is **not complete** when:

- validation fails
- unrelated files were modified
- design language was altered without approval
- product boundaries were crossed

---

## Final Rule

Passing lint and build is necessary but not sufficient. Product judgment and standards compliance complete the review.
