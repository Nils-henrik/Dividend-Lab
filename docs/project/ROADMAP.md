# Roadmap

This document answers: **Where is Dividend Lab going?**

It describes product direction at a high level. It is not a sprint plan or delivery schedule.

---

## Phase 1 — Product Foundation (Current)

Establish a coherent premium product experience with mock data.

Goals:

- consistent application shell and navigation
- core product areas scaffolded (dashboard, portfolio, forum, learning, brain, account)
- design system and brand identity documented
- engineering and architecture standards defined
- AI-assisted development workflow established

---

## Phase 2 — Data and Identity

Replace mock foundations with production-ready services.

Goals:

- real authentication and session management
- user profiles and investor identity backed by persistent storage
- portfolio and dividend data from reliable sources
- API layer in `lib/api/` with stable component contracts

See `project/API.md` and `project/DATABASE.md` for intended direction.

---

## Phase 3 — Dividend Brain and Analytics

Deepen the product's analytical and educational value.

Goals:

- production Dividend Brain with guardrails (see `ai/DIVIDEND_BRAIN.md`)
- advanced portfolio analytics
- dividend simulations and forecasting
- portfolio health scoring

---

## Phase 4 — Community and Premium

Scale community quality and monetization without compromising trust.

Goals:

- moderated high-signal forum
- premium tier with advanced analytics and unlimited AI
- billing and subscription management
- exclusive educational content

Monetization philosophy is defined in `design/BRAND.md`. Premium must never compromise product trust.

---

## Guiding Constraint

Every roadmap item must pass the brand rule in `design/BRAND.md`:

- Does this help the user understand their portfolio?
- Does this help the user build long-term dividend income?
- Does this educate without giving advice?
- Does this reduce noise?
- Does this increase trust?

If the answer is no, the item does not belong on the roadmap.
