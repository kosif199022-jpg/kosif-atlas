# Design System Specification: The Architectural Flow

- **Theme:** The Architectural Flow
- **Product:** Formbricks
- **Framework:** React + Next.js
- **Styling:** Tailwind CSS
- **UI library:** shadcn/ui (Base UI primitives)
- **Primary color:** `#006a61` (deep teal)
- **Supported color schemes:** light, dark
- **Platform:** Web (desktop-first, responsive, mobile-friendly)

## 1. Overview & Creative North Star

**Creative North Star: The Precision Architect**

This design system is built to move beyond the "generic SaaS" aesthetic. While Formbricks is a tool for surveys and
experience management, the interface should feel like a high-end IDE or an architectural drafting suite. We are shifting
the user's mental model from "filling out forms" to "engineering experiences."

To achieve this, we employ **"Soft Industrialism."** We break the rigid, boxed-in nature of traditional B2B platforms
through intentional white space, tonal layering, and a total rejection of harsh containment. We rely on the eye's
ability to perceive structure through light and proximity rather than lines and boxes. The result is a high-trust
environment that feels both breathable and technically superior.

---

## 2. Colors & Surface Philosophy

The palette is rooted in a deep, authoritative teal (`primary`) balanced by a sophisticated grayscale that leans toward
cool, clinical slate tones.

### The "No-Line" Rule

**Borders are a design failure.** In this system, we prohibit 1px solid borders for sectioning or layout containment.
Boundaries must be defined solely through:

1.  **Background Color Shifts:** Use a `surface-container-low` section sitting against a `surface` background.
2.  **Tonal Transitions:** Use `surface-container-highest` for high-interaction areas (like a sidebar) against a
    `surface` main stage.

### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers — like stacked sheets of fine architectural vellum.

- **The Stage (`surface`):** The base level of the application.
- **The Foundation (`surface-container-low`):** Used for large secondary areas, like the main workspace background.
- **The Module (`surface-container-lowest`):** Use this for "Card" equivalents. By placing a `lowest` (pure white) card
  on a `low` background, the card "lifts" naturally without a single line of CSS border.
- **The Utility (`surface-container-high`):** For persistent navigation or configuration panels.

### The "Glass & Gradient" Rule

To inject "soul" into a functional tool, use semi-transparent `surface` colors with a `backdrop-blur` (12–20px) for
floating menus or sticky headers. For primary CTAs, apply a subtle linear gradient from `primary` (#006a61) to
`primary_container` (#00c4b4) at a 135° angle to provide a machined, metallic depth.

---

## 3. Typography: The Editorial Edge

We utilize a dual-typeface system to balance technical precision with approachable authority.

- **Display & Headlines (Manrope):** A geometric sans-serif that feels modern and high-end. Used for `display-lg`
  through `headline-sm`. These should be set with tight letter-spacing (-0.02em) to feel "locked in."
- **Interface & Body (Inter):** The workhorse. Inter provides maximum readability for complex data and form
  configuration. Use `body-md` for standard UI text.

**Hierarchy as Brand:** Use `label-md` in all-caps with 0.05em tracking for secondary metadata. This creates an
"archival" feel that conveys high-trust and technical accuracy, essential for a data-driven platform.

---

## 4. Iconography

The icon system follows the same restraint as everything else: minimal, structural, never decorative.

- **Style:** Outlined.
- **Source:** Lucide.
- **Default size:** 16px in dense UI (sidebars, list rows), 20px in body context, 24px for primary actions.
- **Stroke:** 1.5px, constant across the entire set. Never mix stroke weights.
- **Color:** Inherits `currentColor`, so icons adopt `on-surface`, `on-primary`, or `on-surface-variant` from whichever
  surface they sit on.
- **Don't:** mix in filled or duotone icons; reach for a second icon library; tint icons with arbitrary colors. The set
  should feel single-author.

---

## 5. Elevation & Depth

We eschew traditional drop shadows in favor of **Tonal Layering.**

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. The delta in
  luminance creates the "lift."
- **Ambient Shadows:** If an element must float (e.g., a modal or a dropdown), use an ultra-diffused shadow:
  `box-shadow: 0 12px 40px rgba(25, 28, 30, 0.06);`. The shadow color must be a derivative of `on_surface`, never pure
  black.
- **The "Ghost Border" Fallback:** If accessibility requirements demand a stroke, use the `outline_variant` token at 15%
  opacity. It should be felt, not seen.

---

## 6. Components

### Workflow Cards

- **Visuals:** No borders. Background: `surface-container-lowest`. Corner radius: `xl` (0.75rem).
- **Interaction:** On hover, shift the background to `surface-bright`.
- **Connectors:** Linear flows are joined by 2px paths using `outline_variant`. Use a subtle pulse animation on the path
  to indicate active data flow.

### Buttons

- **Primary:** Gradient of `primary` to `primary_container`. White text (`on_primary`). Radius: `md`.
- **Secondary:** Ghost style. No background, `primary` text. On hover, a `surface-container-high` background appears.
- **Tertiary:** `secondary_fixed` background with `on_secondary_fixed` text. Low contrast, high utility.

### Form Elements

- **Inputs:** `surface-container-highest` background, no border, 2px bottom-stroke that animates to `primary` on focus.
- **Logic Chips:** `secondary_container` background with `on_secondary_container` text. These should feel like "pills"
  of logic floating in the workspace.

### Sidebars (Configuration)

- **Structure:** Use `surface_container_low`.
- **Nesting:** Nested configuration groups should use a slightly darker `surface_dim` background to signify "drilling
  down" into settings.

---

## 7. Accessibility & UX Quality Bar

Restraint is a feature, accessibility is a contract. The aesthetic must never come at the cost of usability — a design
this confident has nowhere to hide.

- **Keyboard:** every interactive element is reachable and operable. Tab order follows visual order; the workflow canvas
  supports arrow-key traversal between connected nodes.
- **Focus:** the focus ring is a 2px `primary` outline at 60% opacity, offset by 2px. It is visible on every surface —
  including the gradient buttons. Never strip the outline without a replacement.
- **Contrast:** body text against `surface` and `surface-container-low` meets WCAG AA (4.5:1). The `outline_variant`
  ghost border at 15% opacity is decorative — never use it to convey state.
- **Touch targets:** 44×44pt minimum on touch surfaces. Logic Chips that look small still hit-area to 44pt.
- **Motion:** the connector pulse animation, hover lifts, and gradient transitions all respect
  `prefers-reduced-motion: reduce` and collapse to instant state changes.
- **Dialogs & popovers:** trap focus while open, restore focus to the trigger on close, dismiss on Escape. The Base UI
  primitives handle this — don't roll your own.
- **Semantic HTML:** native `<button>`, `<a href>`, `<label>` always. The "no borders" rule does not extend to stripping
  semantics.
- **Color is never alone:** "Draft" status uses the `tertiary` warm token _and_ the word "Draft" _and_ a small icon.
  Never carry meaning on hue alone.

---

## 8. Implementation Notes for LLMs

When generating new components or pages for Formbricks:

- Reuse existing components in `src/components/` and `src/modules/ui/` before inventing new ones. The Workflow Card,
  Button, Input, and Sidebar patterns described above are already implemented — extend them, don't fork them.
- Match the exact tokens, type scale, spacing, and radii defined above. Do not introduce parallel color or size systems.
- Use the framework as declared: React + Next.js + Tailwind + shadcn/ui on Base UI primitives. Do not reach for Radix,
  MUI, or any UI library that isn't installed.
- For interactive primitives (menu, dialog, popover, tooltip, select), use the Base UI components shadcn wraps. Do not
  reimplement focus management or keyboard handling.
- Honor every rule in section 7 (Accessibility) by default. The "no borders" aesthetic does not relax the
  focus-visibility, contrast, or focus-trap requirements.
- If a design decision is genuinely unspecified, choose the option most consistent with "Soft Industrialism" —
  restraint, tonal layering, generous whitespace — and leave a brief code comment noting the assumption.

---

## 9. Do's and Don'ts

### Do

- **Do** use extreme vertical rhythm. Give components "room to breathe" (minimum 32px padding between major modules).
- **Do** use `tertiary` (#9b451a) for warning states or "Draft" indicators — it provides a sophisticated alternative to
  generic orange.
- **Do** align all text to a strict baseline grid to maintain the "Architectural" feel.

### Don't

- **Don't** use pure black (#000) for text. Use `on_surface` (#191c1e) to keep the contrast high but the vibe
  "expensive."
- **Don't** use 1px solid borders to separate list items. Use 8px of `surface-container-low` vertical space instead.
- **Don't** use standard "drop shadows" on buttons. If a button needs prominence, use `surface_tint` to create a subtle
  glow effect.

---

## Director's Closing Note

This system is about **restraint.** By removing the crutches of borders and heavy shadows, we force the design to rely
on perfect alignment, thoughtful typography, and a sophisticated color palette. This is how we build a platform that
doesn't just work — it inspires confidence.
