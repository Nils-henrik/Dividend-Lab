# Dividend Lab Documentation

Dividend Lab is a premium SaaS platform for serious long-term dividend investors. It helps users understand portfolio progress, dividend income, education, community discussion and AI-assisted observations without becoming a brokerage, trading app or speculation product.

This documentation is the source of truth for what Dividend Lab is, how it is built and how it should continue to evolve.

---

## Start Here

New contributors should read these documents first:

1. `project/PROJECT.md` - product vision, mission and principles.
2. `design/BRAND.md` - brand identity and product personality.
3. `design/DESIGN_SYSTEM.md` - visual language and UI rules.
4. `standards/ENGINEERING_STANDARD.md` - engineering expectations.
5. `standards/ARCHITECTURE_STANDARD.md` - architecture direction.
6. `ai/AI_RULES.md` - rules for AI-assisted development.

After reading these, contributors should understand the product, the design language and the engineering standards well enough to make safe changes.

---

## Documentation Structure

```text
docs/
  README.md

  standards/
    ENGINEERING_STANDARD.md
    ARCHITECTURE_STANDARD.md
    UI_UX_STANDARD.md
    PROMPT_STANDARD.md
    NAMING_CONVENTION.md
    CODE_REVIEW_STANDARD.md

  project/
    PROJECT.md
    ROADMAP.md
    FEATURES.md
    DECISIONS.md
    API.md
    DATABASE.md

  design/
    DESIGN_SYSTEM.md
    BRAND.md

  ai/
    AI_RULES.md
    DIVIDEND_BRAIN.md

  divbrain/
    product-blueprint.md
    technical-blueprint.md
    implementation-roadmap.md
```

---

## Documentation Hierarchy

Documentation is organized by responsibility:

- `project/` explains what Dividend Lab is and where the product is going.
- `design/` defines how Dividend Lab should feel and look.
- `standards/` defines how the product should be built and reviewed.
- `ai/` defines how AI-assisted development and Dividend Brain should behave.
- `divbrain/` defines the DivBrain product, technical architecture and implementation roadmap (canonical for DivBrain scope).

Avoid placing the same rule in multiple documents. If a concept belongs in several places, keep the core rule in the most specific document and reference that document from elsewhere.

---

## Standards Versioning

Each standard document is independently versioned (v1.0 at initial release). When a standard evolves materially, increment its version and record the rationale in `project/DECISIONS.md`.

Current standards:

- Engineering Standard v1.0
- Architecture Standard v1.0
- UI/UX Standard v1.0
- Prompt Standard v1.0
- Naming Convention v1.0
- Code Review Standard v1.0

---

## How Standards Are Applied

Standards are mandatory for all production work. They should be treated as durable project contracts, not suggestions.

Every implementation should be checked against:

- product principles in `project/PROJECT.md`
- UI and interaction rules in `design/DESIGN_SYSTEM.md`
- engineering rules in `standards/ENGINEERING_STANDARD.md`
- architecture rules in `standards/ARCHITECTURE_STANDARD.md`
- review checklist in `standards/CODE_REVIEW_STANDARD.md`

When standards conflict, prefer the document with the most specific ownership. For example, UI motion questions belong to `standards/UI_UX_STANDARD.md` and `design/DESIGN_SYSTEM.md`; folder ownership questions belong to `standards/ARCHITECTURE_STANDARD.md`.

---

## Updating Documentation

Documentation should evolve with the product. Update docs when:

- a feature changes product direction
- a new architectural rule is introduced
- a design pattern becomes canonical
- a workflow becomes repeatable
- a decision affects future implementation

Keep documents concise, specific and easy to scan. A new senior developer should be able to understand the project in a focused 30-minute onboarding pass.
