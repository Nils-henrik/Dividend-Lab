# Database

This document answers: **How will Dividend Lab persist data?**

Dividend Lab does not yet have a production database. This document defines the intended direction for when persistent storage is introduced.

---

## Current State

- No production database
- User session simulated via local storage (`lib/auth/mockAuth`)
- Product data is static mock files in `data/`

---

## Core Entities (Planned)

| Entity | Purpose |
|--------|---------|
| User | Authentication identity, profile basics |
| InvestorProfile | Public identity, philosophy, privacy settings |
| Portfolio | Holdings and positions |
| DividendEvent | Historical and upcoming dividend payments |
| Goal | Long-term income and portfolio targets |
| ForumThread | Community discussions |
| ForumPost | Thread replies and engagement |
| BrainConversation | AI interaction history |
| Subscription | Premium membership and billing state |

---

## Design Principles

- Normalize where it improves clarity; denormalize where it improves read performance for dashboards
- Investor Level and PRO subscription remain separate entities (see `project/DECISIONS.md` ADR-003)
- Portfolio privacy uses range-based disclosure, not exact wealth in public views
- Schema changes require an ADR entry when they affect product contracts

---

## Migration Strategy

When moving from mock to persistent data:

1. Define schema and API contracts
2. Implement `lib/api/` modules
3. Replace `data/` imports feature by feature
4. Preserve component prop interfaces where possible
5. Validate with TypeScript, ESLint and production build

Do not migrate all features simultaneously unless required.

---

## When to Update This Document

Update when:

- a database technology is chosen
- schema is finalized for a domain
- migration of a feature from mock to persistent storage completes

See also `project/API.md` for service communication design.
