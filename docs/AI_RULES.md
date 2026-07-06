# Dividend Lab AI Rules

This document is the constitution for AI-assisted development on Dividend Lab.

Every AI agent working on this project must protect the product vision, design language, architecture and working functionality.

---

## Required Reading Before Implementation

Before making code changes, always read:

- `docs/AI_RULES.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/ARCHITECTURE.md`
- `docs/BRAND.md`

If the task touches roadmap, data, APIs, product decisions or AI behavior, also read the relevant docs in `docs/`.

---

## Product Truth

Dividend Lab is not a broker.

Dividend Lab is a companion platform for serious long-term dividend investors.

Its purpose is to help users:

- understand their portfolio
- track dividend progress
- learn through data and education
- build disciplined long-term wealth
- participate in thoughtful community discussion
- use Dividend Brain to understand patterns and trade-offs

Dividend Lab must never become a trading terminal, brokerage clone or short-term speculation tool.

---

## Forbidden Product Direction

Never introduce:

- buy buttons
- sell buttons
- trading widgets
- order flows
- brokerage language
- market heatmaps
- flashing prices
- day-trading features
- pump-and-dump community mechanics
- aggressive red/green market behavior
- AI-generated financial advice

Dividend Lab may analyze, explain, compare and educate. It must not tell users what to buy or sell.

---

## Product First

Prioritize visible product improvements before technical cleanup.

When choosing between improving the user experience and cleaning code, prefer improving the product unless technical debt blocks future work.

Users never see prettier code. Users immediately see a better product.

Technical cleanup is valuable when it preserves consistency, unlocks future work or prevents defects.

---

## UI Rules

Never redesign existing UI unless explicitly requested.

Always preserve:

- existing color palette
- existing typography
- existing spacing rhythm
- existing border radius
- existing card language
- existing button language
- existing dark premium identity

The UI should feel like Bloomberg Terminal meets Apple: calm, precise, understated and premium.

Avoid startup-style landing pages, playful visuals, unnecessary decoration and visual noise.

Elegance is more important than excitement.

---

## Component Rules

Always reuse existing components before creating new ones.

Never duplicate components.

Before creating a component, inspect:

- `components/ui`
- `components/layout`
- `components/dashboard`
- `components/brain`
- `components/charts`
- `components/account`
- `components/modals`

Create a new component only when it has a clear responsibility and improves reuse or readability.

Keep components small and focused.

---

## Architecture Rules

Pages should contain minimal logic.

Pages should mainly assemble reusable components.

Business logic belongs in:

- reusable feature components
- `lib/`
- `data/` for temporary mock data
- `types/` for shared TypeScript contracts

Mock data must not be embedded in large UI components when it can live in `data/`.

Application-wide constants belong in `lib/constants`.

Authentication/session helpers belong in `lib/auth`.

Reusable charts belong in `components/charts`.

Dividend Brain UI belongs in `components/brain`.

Account UI belongs in `components/account`.

Application shell, sidebar, header and navigation belong in `components/layout`.

---

## Safety Rules

Never overwrite working functionality.

Never remove existing components unless explicitly requested.

Never refactor unrelated code.

Never introduce breaking architectural changes without explaining why.

Never install dependencies unless there is a clear need and no reasonable local solution.

Never change project configuration unless required by the task.

Never change visual design while performing architecture-only work.

Never hide errors with broad fallbacks. Fix the cause.

---

## Development Workflow

For every implementation task:

1. Understand the product goal.
2. Read the required project documents.
3. Inspect the existing implementation.
4. Reuse existing components and patterns.
5. Modify only necessary files.
6. Keep the current design language intact.
7. Validate with lint/build when code changes are meaningful.
8. Explain what changed and why.

If a task is large or architectural, identify the files that will be touched before editing unless the user explicitly instructs otherwise.

---

## Communication Rules

Explain why a change is made, not only what changed.

Point out possible risks.

Suggest improvements when useful, but do not implement unrelated ideas without approval.

If a requested change conflicts with Dividend Lab principles, call it out and propose a product-consistent alternative.

---

## Permanent Instruction

From this point forward, every implementation on Dividend Lab begins by reading:

- `docs/AI_RULES.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/ARCHITECTURE.md`
- `docs/BRAND.md`

These documents are the permanent development guidelines for Dividend Lab unless the user explicitly overrides them.