# Dividend Lab Design System

Dividend Lab uses a dark, premium and minimal design language for serious long-term dividend investors.

The design should feel like Bloomberg Terminal meets Apple: precise, calm, elegant and trustworthy.

Do not invent a new visual identity. Document and preserve the existing one.

For interaction philosophy, motion rules and premium UX principles, see `standards/UI_UX_STANDARD.md`. For brand personality, see `BRAND.md`.

---

## Design Philosophy

Dividend Lab should feel:

- premium
- minimal
- calm
- professional
- trustworthy
- focused
- data-driven

It should never feel:

- playful
- noisy
- flashy
- clickbait-driven
- like a trading app
- like a generic startup landing page

The interface should reduce friction and help users understand long-term dividend progress.

---

## Color Palette

Use the existing palette.

### Backgrounds

- Primary background: `#090909`
- Deep background: `#050505`
- Surface: `#111111`
- Card surface: `#161616`
- Soft elevated surface: `white/[0.03]`

### Brand Accent

- Primary gold: `#D4AF37`
- Gold highlight: `#F9D976`
- Dark gold: `#A67C00`
- Gold should be an accent, not a dominant fill across the interface.

### Text

- Primary text: `#FFFFFF`
- Soft text: `gray-300`
- Secondary text: `gray-400`
- Muted text: `gray-500`

### Borders

- Default border: `white/10`
- Gold border accent: `#D4AF37` with opacity, usually `/20`, `/30`, `/40` or `/70`

### Status

Use the current green only for positive values, progress and calm live/status indicators.

Do not introduce additional colors unless explicitly requested.

---

## Typography

Do not change the current font family.

Use the existing font setup from `app/layout.tsx` and `app/globals.css`.

Typography should be:

- clean
- high contrast
- spacious
- precise
- easy to scan

### Headings

Hero and major page headings may be large and confident.

Use tight tracking where already established, such as `tracking-[-0.04em]` for product headings.

### Labels

Use uppercase labels with wide letter spacing for premium hierarchy:

- `uppercase`
- `tracking-[0.18em]`
- `tracking-[0.22em]`
- `tracking-[0.25em]`

### Financial Values

Financial numbers should use:

- medium weight
- restrained size
- `tabular-nums`
- no oversized marketing treatment inside app dashboards

### Body Text

Body copy should use light gray text with comfortable line height.

---

## Spacing

Use the existing Tailwind spacing rhythm.

Current patterns:

- Page/app padding: `px-8`, `py-8`
- Landing max width: `max-w-7xl`
- Card padding: `p-5`, `p-6`, `p-8`
- Section spacing: `gap-6`, `space-y-6`
- Compact navigation spacing: `px-3 py-2.5`

Prefer generous whitespace over decoration.

Do not introduce a new spacing scale.

---

## Border Radius

Use the existing radius language:

- `rounded-xl` for inputs, buttons, nav items and compact controls
- `rounded-2xl` for cards and panels
- `rounded-3xl` for major containers and hero/dashboard shells
- `rounded-full` for badges, dots and avatars

Do not introduce sharper or more playful radius styles without approval.

---

## Shadows

Shadows should be subtle.

Current shadow patterns:

- soft gold glow for premium emphasis: `rgba(212,175,55,...)`
- deep black elevation for modals/dropdowns
- very subtle hover shadows on cards

Avoid heavy glow, neon effects or exaggerated elevation.

---

## Cards

Cards are the core visual primitive.

Use:

- dark card background: `#161616`
- border: `border-white/10`
- radius: `rounded-2xl`
- subtle hover state only when useful
- generous internal spacing

Cards should feel like professional financial software, not decorative marketing blocks.

### Statistic Cards

Purpose: display one important metric.

Rules:

- one primary value
- one secondary explanation or label
- one subtle trend indicator
- never use emojis
- prefer whitespace over decoration
- use tabular numbers for financial values
- keep values on one line whenever possible
- gold should not dominate the card

---

## Buttons

Use existing button language.

### Primary Button

Current pattern:

- gold background
- black text
- `rounded-xl`
- medium/semibold weight
- subtle gold shadow

Use for primary conversion or major action.

### Secondary Button

Current pattern:

- transparent or dark background
- gold or white/10 border
- subtle hover
- no loud fill unless active

Do not redesign buttons without approval.

---

## Inputs

Inputs should use:

- dark surface: `#161616` or `#111111`
- border: `white/10`
- focus border: gold with opacity
- white text
- muted placeholder
- `rounded-xl`

Inputs should feel calm and precise.

---

## Badges

Badges should be minimal.

Use:

- `rounded-full`
- subtle border
- low-opacity background
- small typography
- optional small status dot

Live/status dots may use the existing green with subtle glow.

Avoid flashing, pulsing or aggressive status treatment.

---

## Charts

Charts must use Recharts.

Current chart language:

- gold line
- gold gradient
- dark card background
- muted axis labels
- no bright multi-color palettes
- minimal tooltip

Charts support insight. They should not dominate every dashboard page.

---

## Icons

Do not use emojis.

Prefer no icon over an unnecessary icon.

When icons are needed, use the existing inline SVG style in `components/layout/AppIcon.tsx`.

Icons should be subtle, thin and quiet.

---

## Dark Mode

Dividend Lab is dark-first.

Do not add a light theme unless explicitly requested.

Every new component should be designed for the existing dark UI.

---

## Final Rule

When in doubt, preserve consistency over creativity.
