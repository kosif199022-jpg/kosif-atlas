# Design System Specification: <THEME NAME OR PRODUCT NAME>

- **Theme:** <e.g., The Architectural Flow>
- **Product:** <product name>
- **Framework:** <e.g., React + Next.js>
- **Styling:** <e.g., Tailwind CSS>
- **UI library:** <e.g., shadcn/ui (Base UI primitives)>
- **Primary color:** `<#hex>` (<short description>)
- **Supported color schemes:** light, dark
- **Platform:** Web (desktop-first, responsive, mobile-friendly)

<!--
  Authoring notes (delete before shipping):
  - Omit any metadata line you don't have a confident value for. Do not write "TBD".
  - Sections numbered below are required, in this order. Trim within sections; do not remove sections silently.
  - Optional sections (Dark Mode, Motion, Brand Voice & Illustration, i18n) are marked further down. Include them ONLY when the product warrants them — see SKILL.md for criteria.
  - Every rule should explain its "why" in one short clause.
-->

## 1. Overview & Creative North Star

**Creative North Star: <one-line tagline>**

<2–4 short paragraphs. State the metaphor. State what the product is _not_ (e.g., "not a generic SaaS dashboard"). Tell
the reader what mental model the UI should evoke.>

---

## 2. Colors & Surface Philosophy

<Describe the palette in 1–2 sentences. Anchor it on the primary color.>

### <A signature rule, e.g., "The No-Line Rule">

<State the rule. State its "why" in one sentence. List the alternatives the team should reach for instead.>

### Surface Hierarchy & Nesting

<Describe the layers (e.g., stage, foundation, module, utility). Use named tokens if the project has them; otherwise
describe in plain English.>

- **<Layer name> (`<token>`):** <when to use it>
- **<Layer name> (`<token>`):** <when to use it>
- **<Layer name> (`<token>`):** <when to use it>

### <Optional signature rule, e.g., "Glass & Gradient">

<Reserved for the one or two distinctive moves that make this design feel like itself, not a generic system.>

<!--
  OPTIONAL: Dark Mode subsection
  Include only when the project actually ships dark mode, the user asks for it, or the codebase shows
  dark-mode infrastructure (`prefers-color-scheme`, dual CSS variable sets, theme toggle, `class="dark"`).
  If the product ships dark only, write the whole Colors section in dark first and skip this subsection.

  ### Dark Mode
  Describe the parallel palette: how `surface`, `surface-container-*`, `on-surface`, and `primary` shift.
  State the inversion rules — what flips, what stays, what subtly changes (e.g., gradients flatten in dark).
-->

---

## 3. Typography

<One sentence on the philosophy — e.g., "dual-typeface system to balance precision with approachability".>

- **Display & Headlines (`<typeface>`):** <where it shows up; what feeling it carries>
- **Interface & Body (`<typeface>`):** <where it shows up; what feeling it carries>

**Hierarchy as Brand:** <Call out one or two non-obvious type moves — small caps, tracking, baseline grid — that quietly
signal the brand.>

---

## 4. Iconography

<2–4 lines on the icon system. Lock in the choices so new components don't drift.>

- **Style:** <outlined / filled / duotone / hand-drawn — pick one and stay consistent>
- **Source:** <e.g., Lucide, Heroicons, Phosphor, custom SVG set>
- **Default size:** <e.g., 16px in dense UI, 20px in body context, 24px for primary actions>
- **Stroke / weight:** <e.g., 1.5px stroke for outlined, constant across the set>
- **Color:** <e.g., inherits `currentColor`; takes on `on-surface`, `on-primary`, etc. from its container>
- **When to use illustration instead:** <only if applicable — e.g., empty states, marketing pages>

---

## 5. Elevation & Depth

<State the philosophy: tonal layering vs traditional drop shadows.>

- **The Layering Principle:** <how layers are composed>
- **Ambient Shadows:** <exact box-shadow value, when allowed>
- **Fallback / Accessibility:** <what to do when a stroke is genuinely required>

<!--
  OPTIONAL: Motion section
  Add only when motion is part of the brand: consumer apps with delightful interactions, themes that call
  for kinetic energy ("Carnival", "Saturday"), or codebases that already use framer-motion / GSAP / Lottie.
  For utility apps, B2B tools, dashboards, and most serious products, skip this section — the
  "respect prefers-reduced-motion" line in section 7 (Accessibility) is enough.

  ## Motion
  - Easing: <easing curves for entry, exit, hover>
  - Duration: <scale: micro 80ms / standard 160ms / page 240ms — adapt to product>
  - Triggers: <what motion is allowed for — feedback, continuity, expression>
  - Respect: <prefers-reduced-motion always>
-->

---

## 6. Components

<!--
  Lead with the components that actually matter for this product. Use the matching domain pack from SKILL.md
  authoring guidance as a starting prompt, not a checklist:
  - App / dashboard / SaaS → cards, forms, tables, navigation, dialogs, toasts
  - Marketing site → hero, CTA, pricing, testimonials, FAQ, footer
  - E-commerce → product card, cart, checkout, search/filter, reviews
  - Content / publication → article header, body type, TOC, captions
  - Data viz → KPI tile, chart container, color scales, table density
  - Mobile / native → tab bar, sheet, list row, touch states
-->

### <Component name>

- **Visuals:** <surface, radius, padding>
- **States:** <default / hover / focus / active / disabled>
- **Notes:** <any product-specific behavior>

### <Component name>

- **Visuals:** ...
- **States:** ...
- **Notes:** ...

### <Component name>

- **Visuals:** ...
- **States:** ...
- **Notes:** ...

---

## 7. Accessibility & UX Quality Bar

<The non-negotiables. Keep this concrete — these are the rules an LLM will guess wrong without a reference.>

- **Keyboard:** every interactive element is reachable and operable from the keyboard; tab order matches visual order.
- **Focus:** focus rings are visible against every surface; never `outline: none` without a replacement.
- **Contrast:** body text meets WCAG AA (4.5:1) against its surface; large text and UI affordances meet 3:1.
- **Touch targets:** minimum 44×44pt on touch surfaces.
- **Motion:** respect `prefers-reduced-motion`; non-essential animations are skipped or shortened.
- **Dialogs / overlays:** trap focus while open, restore focus to the trigger on close, dismiss on Escape.
- **Semantic HTML:** prefer native elements (`<button>`, `<a>`, `<label>`) over divs with click handlers.
- **Don't rely on color alone** to convey meaning — pair with icon, label, or pattern.

---

## 8. Implementation Notes for LLMs

<Short, addressed directly to the model that will read this doc when generating new UI.>

When generating new components or pages for this project:

- Reuse existing components in <`src/components/...` or wherever they live> before inventing new ones.
- Match the exact tokens, type scale, spacing, and radii defined above. Do not introduce parallel design choices.
- Use the framework and primitives declared in the metadata. Do not reach for libraries that aren't installed.
- For interactive patterns (menus, dialogs, tooltips), prefer the project's primitive layer (<Base UI / Radix / native>
  as declared) rather than bespoke implementations.
- Honor every rule in section 7 (Accessibility) by default.
- If a design decision is genuinely unspecified, choose the least surprising option consistent with the theme, and leave
  a brief code comment noting the assumption so a human can confirm.

---

## 9. Do's and Don'ts

### Do

- **Do** <opinionated, specific behavior>.
- **Do** <opinionated, specific behavior>.
- **Do** <opinionated, specific behavior>.

### Don't

- **Don't** <anti-pattern with a one-clause reason>.
- **Don't** <anti-pattern with a one-clause reason>.
- **Don't** <anti-pattern with a one-clause reason>.

---

## Director's Closing Note

<One paragraph. Restate the philosophy in plain language. Name what the design is fundamentally about. End with a sentence the team will quote back to each other in PR reviews.>
