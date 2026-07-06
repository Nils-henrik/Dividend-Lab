# UI / UX Standard v1.0

This document answers: **Why does Dividend Lab feel premium, and how should interactions behave?**

For visual tokens (colors, typography, spacing, components), see `design/DESIGN_SYSTEM.md`. For brand personality, see `design/BRAND.md`.

---

## Premium Design Language

Dividend Lab should feel like a calm financial command center, not a social media app or trading terminal.

Premium quality comes from:

- restraint over decoration
- data over visual noise
- consistency over novelty
- whitespace over density
- precision over playfulness

Every interaction should communicate trust, focus and long-term seriousness.

---

## Calm Interface Principle

Dividend Lab is designed to feel calm, deliberate and trustworthy.

Every interaction should feel intentional.

Nothing should jump, flash, bounce or compete for the user's attention.

Motion exists only to improve clarity, orientation and usability.

Animations should be subtle, smooth and purposeful.

The interface should always prioritize focus over excitement.

Users should feel like they are working inside a premium professional investment platform.

Guidelines:

- motion should be minimal
- avoid unnecessary animations
- avoid visual noise
- avoid sudden layout shifts
- use smooth transitions
- UI should feel predictable
- data should always remain the primary focus
- every interaction should reduce cognitive load

The emotional goal is: calm, confidence, trust, focus and premium quality.

---

## Spacing Philosophy

Prefer generous whitespace over decoration.

Spacing should create hierarchy through breathing room, not through borders and fills.

Use the established Tailwind rhythm documented in `design/DESIGN_SYSTEM.md`. Do not invent a new spacing scale.

---

## Typography Hierarchy

Typography creates hierarchy through:

- size contrast (restrained, not dramatic inside app views)
- weight contrast (medium for values, light for body)
- uppercase labels with wide letter spacing for section headers
- `tabular-nums` for financial values

Financial numbers should never use oversized marketing treatment inside dashboards.

---

## Color Usage

- dark backgrounds dominate
- gold is an accent, not a fill
- green is reserved for positive values and calm status indicators
- avoid introducing new colors without approval
- avoid aggressive red/green trading semantics

---

## Icon Usage

- no emojis
- prefer no icon over an unnecessary icon
- icons should be subtle, thin and quiet
- use the existing inline SVG style in `AppIcon.tsx`

Icons support navigation and orientation. They should not decorate for decoration's sake.

---

## Motion Guidelines

Animations should be:

- short
- smooth
- elegant
- functional

Prefer compositor-safe properties:

- `transform`
- `opacity`

Avoid animating layout-affecting properties (`width`, `height`, `margin`, `padding`) when it causes reflow.

Use existing transition patterns: `transition`, `transition-all`, `duration-300`.

Avoid:

- bouncing
- exaggerated motion
- flashing
- aggressive pulsing

---

## Layout Stability

Never cause layout shifts during interaction.

When collapsing or expanding UI:

- keep elements mounted with fixed dimensions where needed
- animate visibility with `transform` and `opacity`
- avoid toggling `hidden` or display properties that re-enter flex layout during width transitions

This rule applies to sidebars, cards, panels and any expandable content.

---

## Hover Behaviour

Hover states should be:

- subtle
- immediate but not jarring
- informative, not decorative

Acceptable hover patterns:

- slight border brightening
- soft background opacity change
- gentle gold accent on interactive elements
- very subtle shadow on cards when hover implies clickability

Unacceptable hover patterns:

- large scale transforms
- color inversions
- flashing or pulsing
- layout changes on hover

---

## Loading States

Loading should feel calm and professional.

- use subtle skeleton or spinner patterns consistent with dark UI
- never flash or bounce loading indicators
- preserve layout dimensions during loading to prevent shift
- loading states should not block the entire shell unless necessary

---

## Empty States

Empty states should:

- explain what is missing in calm language
- suggest a next step when appropriate
- maintain the premium dark aesthetic
- never use playful illustrations or emojis

Empty states are educational moments, not engagement tricks.

---

## Responsive Principles

Preserve the desktop premium SaaS experience as the primary design target.

Use responsive Tailwind patterns (`md:`, `lg:`, `xl:`) already present in the project.

Do not compromise the core desktop app shell without a deliberate responsive plan.

Grid columns should collapse naturally. Desktop-only previews may be hidden on smaller screens where appropriate.

---

## Accessibility

While Dividend Lab is dark-first and premium, interactions must remain:

- keyboard reachable where interactive
- readable with sufficient contrast
- predictable in focus order
- free of motion that cannot be perceived as calm

Do not sacrifice accessibility for visual effect.

---

## Final Rule

When in doubt, choose the option that feels calmer, more precise and more trustworthy.
