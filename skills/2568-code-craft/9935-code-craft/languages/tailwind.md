# Tailwind CSS v4 — code-craft reference

~60 rules across three buckets, covering Tailwind v4 (released January 2025) — CSS-first config via `@theme`, single-import setup, native cascade layers, automatic content detection, OKLCH color defaults, container queries built-in. Treats v4 as the present; v3 (`tailwind.config.js`, `@tailwind base/components/utilities`) appears only as migration contrast. General CSS rules live in `languages/css-sass.md` — this file stays Tailwind-utility-first specific.

Sources: [tailwindcss.com/docs](https://tailwindcss.com/docs), [Tailwind CSS v4.0 release post](https://tailwindcss.com/blog/tailwindcss-v4), [v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide), Adam Wathan blog/talks, Robin Malfait (Tailwind core) on `@theme`, Sam Selikoff v4 walkthrough, Theo (t3.gg) v4 coverage.

Loaded by `code-craft` when the user asks about Tailwind, utility-first CSS, or pastes Tailwind class strings / `@theme` blocks for review.

---

## A — Tactical (day-to-day patterns)

### A1. Single import in entry CSS
**Rule.** v4 entries start with one line: `@import "tailwindcss";` — no `@tailwind base/components/utilities`.
**Reason.** v4 ships base, components, and utilities behind a single import that wires up cascade layers automatically.
```css
/* wrong (v3) */
@tailwind base; @tailwind components; @tailwind utilities;
/* right (v4) */
@import "tailwindcss";
```

### A2. Pick the right build plugin
**Rule.** Use `@tailwindcss/vite` for any Vite-based stack (Vite, Astro, SvelteKit, Next-with-Vite, Nuxt 3). Use `@tailwindcss/postcss` for PostCSS pipelines (legacy Next, plain Webpack). Use the standalone CLI only when no bundler is present.
**Reason.** The Vite plugin runs Tailwind directly inside Vite's pipeline (faster, no PostCSS overhead); the PostCSS plugin is the v3-shaped path; CLI exists for build-tool-less projects.
```ts
// vite.config.ts — preferred
import tailwindcss from "@tailwindcss/vite";
export default { plugins: [tailwindcss()] };
```

### A3. Trust automatic content detection
**Rule.** Don't add a `content: []` array — v4 auto-scans your project. Only declare extra sources with `@source` when they live outside the inferred roots.
**Reason.** v4 walks your filesystem from the entry CSS upward, respecting `.gitignore`. Manual content arrays are v3 baggage.
```css
/* wrong */
@import "tailwindcss";
@config "./tailwind.config.js"; /* defeats the auto-scanner */
/* right */
@import "tailwindcss";
@source "../emails/**/*.html"; /* only the path Tailwind can't infer */
```

### A4. `@source` only for what's missed
**Rule.** Declare `@source "./glob"` only for content directories outside the auto-scan (CMS-rendered MDX, monorepo siblings, `node_modules` packages with classes).
**Reason.** Redundant `@source` for already-scanned paths wastes builder cycles; missing `@source` for dynamic content tree-shakes those classes away.
```css
/* wrong: src/ is auto-scanned */
@source "./src/**/*.{ts,tsx}";
/* right: declare external content */
@source "../../packages/ui/dist/**/*.js";
@source "../content/**/*.mdx";
```

### A5. Class ordering via Prettier plugin
**Rule.** Install `prettier-plugin-tailwindcss` and let it sort: layout → spacing → sizing → typography → color → state variants → responsive variants.
**Reason.** Stable order kills PR-diff noise and makes "where's my hover state" predictable across reviewers.
```html
<!-- wrong -->
<div class="md:flex p-4 hover:bg-blue-700 bg-blue-500 text-white rounded">
<!-- right (plugin output) -->
<div class="rounded bg-blue-500 p-4 text-white hover:bg-blue-700 md:flex">
```

### A6. Mobile-first responsive variants
**Rule.** Author the unprefixed utility for mobile; layer larger-screen variants (`sm:`, `md:`, `lg:`) on top.
**Reason.** Tailwind's `sm:`/`md:` are `min-width` queries — adding them is additive. `max-md:` exists for max-width but should be the exception.
```html
<!-- wrong -->
<div class="grid grid-cols-3 max-md:grid-cols-1">
<!-- right -->
<div class="grid grid-cols-1 md:grid-cols-3">
```

### A7. State variant vocabulary
**Rule.** Reach for `hover:`, `focus-visible:`, `active:`, `disabled:`, `peer-*`, `group-*`, `has-*`, `aria-*`, `data-*`, `not-*`. Avoid plain `focus:` for visual rings.
**Reason.** `focus-visible:` shows focus only for keyboard users (a11y); `peer-*`/`group-*` give relational state without JS.
```html
<!-- wrong -->
<button class="bg-blue-500 focus:ring-2">
<!-- right -->
<button class="bg-blue-500 focus-visible:ring-2 disabled:opacity-50">
```

### A8. Dark mode strategy must be declared
**Rule.** Choose one strategy per project: `prefers-color-scheme` (default — no setup), class-based (`@variant dark (&:where(.dark, .dark *))`), or attribute-based (`@variant dark (&:where(:root[data-theme="dark"], :root[data-theme="dark"] *))`). Declare it in your entry CSS.
**Reason.** `dark:` utilities don't fire without a strategy. v4 dropped the v3 `darkMode: 'class'` config option — you redeclare via `@variant dark`.
```css
/* right — class-based, app-controlled toggle */
@import "tailwindcss";
@variant dark (&:where(.dark, .dark *));
```

### A9. Arbitrary values are escape hatches
**Rule.** Reach for `bg-[#ff0]`, `top-[7px]`, `[mask:url('/m.png')]` only when the design token genuinely doesn't exist. Recurring arbitrary values become `@theme` tokens.
**Reason.** Arbitrary values bypass the design system. Three uses of `gap-[13px]` is a missing token.
```html
<!-- wrong: should be a token -->
<div class="gap-[24px] p-[12px]">
<!-- right: standard scale -->
<div class="gap-6 p-3">
<!-- ok: genuinely one-off -->
<div class="[mask:url('/decoration.svg')]">
```

### A10. Important modifier sparingly with `!`
**Rule.** v4 marks important with a trailing `!` (`bg-red-500!`), not a leading one. Use it only at framework override boundaries (legacy CSS, third-party widget).
**Reason.** Sprinkling `!` everywhere is the cascade equivalent of yelling. Real fixes adjust selector layering.
```html
<!-- wrong -->
<div class="bg-red-500! p-4!">
<!-- right: scoped override of stubborn third-party -->
<div class="legacy-widget bg-white!">
```

### A11. Conditional classes through `cn()`
**Rule.** Use a `cn()` helper (clsx + tailwind-merge) for any conditional class composition. Never string-concatenate.
**Reason.** `tailwind-merge` resolves conflicting utilities (`p-4` vs `p-2`) by last-wins, while `clsx` handles falsy values cleanly.
```tsx
// wrong
<div className={"btn " + (active ? "bg-red-500" : "")} />
// right
import { cn } from "@/lib/utils";
<div className={cn("btn", active && "bg-red-500")} />
```

### A12. Never interpolate dynamic class names
**Rule.** Don't write `bg-${color}-500` or `text-${size}` — Tailwind's static analyzer can't see template-literal classes.
**Reason.** The compiler scans source files for full class strings. Partial literals get tree-shaken away, then ship as missing styles in production.
```tsx
// wrong
<div className={`bg-${color}-500`} />
// right
const COLOR = { red: "bg-red-500", blue: "bg-blue-500" } as const;
<div className={COLOR[color]} />
```

### A13. Conflicting utilities via `tailwind-merge`
**Rule.** When component variants stack (`<Card className="p-4" />` + caller passes `p-8`), pipe through `tailwind-merge` so the outer caller wins.
**Reason.** Without `tailwind-merge` both classes ship; CSS source order picks a winner that's unrelated to author intent.
```tsx
// right — overrideable component
function Card({ className, ...rest }) {
  return <div className={cn("rounded p-4", className)} {...rest} />;
}
<Card className="p-8" /> // p-8 wins, p-4 stripped
```

### A14. `gap-*` for flex/grid spacing, not `space-x/y-*`
**Rule.** Use `gap-4` on flex/grid containers. Reserve `space-x-*`/`space-y-*` for cases where `gap` isn't supported (rare in 2025).
**Reason.** `space-x-*` injects negative margins into siblings — fights wrapping, breaks with conditional children, and wastes specificity.
```html
<!-- wrong -->
<div class="flex space-x-4">...</div>
<!-- right -->
<div class="flex gap-4">...</div>
```

### A15. Logical-property utilities for i18n
**Rule.** Use `ps-*` / `pe-*`, `ms-*` / `me-*`, `border-s` / `border-e`, `text-start` / `text-end` instead of `pl-*`/`pr-*`/`text-left`.
**Reason.** RTL languages (Arabic, Hebrew) and vertical writing modes flip automatically when you author logically.
```html
<!-- wrong -->
<div class="pl-4 text-left">
<!-- right -->
<div class="ps-4 text-start">
```

### A16. Form-control accent utilities
**Rule.** Use `accent-*` for native checkboxes/radios/range and `caret-*` for inputs instead of restyling the widgets from scratch.
**Reason.** Tints native controls while preserving platform a11y, focus rings, and behavior.
```html
<input type="checkbox" class="accent-blue-600" />
<input type="text" class="caret-blue-600" />
```

### A17. Compose component variants with `cva` / `tailwind-variants`
**Rule.** When a component has more than ~3 boolean/enum variants, switch from inline conditionals to `class-variance-authority` or `tailwind-variants`.
**Reason.** Variant authoring keeps the source readable, gives type-safe props, and centralizes the default vs. modifier matrix.
```ts
import { cva } from "class-variance-authority";
const button = cva("rounded font-medium", {
  variants: {
    intent: { primary: "bg-blue-600 text-white", ghost: "bg-transparent" },
    size: { sm: "h-8 px-3", md: "h-10 px-4" },
  },
  defaultVariants: { intent: "primary", size: "md" },
});
```

### A18. Read defaults before adding tokens
**Rule.** Before declaring a custom color/spacing/font-size in `@theme`, check whether the default scale already covers it.
**Reason.** v4 ships an opinionated default theme — duplicating it adds maintenance without benefit.
```css
/* wrong — re-declaring defaults */
@theme { --color-blue-500: oklch(62% 0.18 251); }
/* right — extend, don't restate */
@theme { --color-brand: oklch(55% 0.2 270); }
```

---

## B — Modern Tailwind v4 idioms

### B1. `@theme` as the design-token home
**Rule.** Declare design tokens in CSS via `@theme { --color-brand: ...; --spacing: 0.25rem; }` — no JS config object.
**Reason.** Tokens become both CSS custom properties (`var(--color-brand)`) and matching utilities (`bg-brand`). Single source of truth, no JS bridge.
```css
@import "tailwindcss";
@theme {
  --color-brand: oklch(55% 0.2 270);
  --font-sans: "Inter", sans-serif;
  --radius-card: 0.75rem;
}
```

### B2. Token namespaces drive utility names
**Rule.** Know the namespace-to-utility mapping: `--color-*` → `bg/text/border-*`, `--font-*` → `font-*`, `--text-*` → `text-*` (sizes), `--breakpoint-*` → responsive prefixes, `--radius-*` → `rounded-*`, `--shadow-*` → `shadow-*`, `--animate-*` → `animate-*`, `--ease-*` → `ease-*`, `--blur-*` → `blur-*`, `--spacing` (single value) → all `p/m/gap-N` step.
**Reason.** Adding a token in the right namespace gives you a utility for free; wrong namespace produces a CSS variable but no utility.
```css
@theme {
  --color-accent: oklch(70% 0.15 30);  /* bg-accent, text-accent */
  --breakpoint-3xl: 120rem;            /* 3xl: prefix */
  --radius-pill: 9999px;               /* rounded-pill */
}
```

### B3. `--spacing` is a single root step
**Rule.** Set `--spacing` once (default `0.25rem`) and let utilities like `p-4`, `gap-6`, `mt-2` multiply against it. Don't declare `--spacing-1`, `--spacing-2`...
**Reason.** v4 derives the entire spacing scale from one root step. Per-step tokens are a v3 mental model.
```css
/* wrong */
@theme { --spacing-1: 0.25rem; --spacing-2: 0.5rem; }
/* right */
@theme { --spacing: 0.25rem; }  /* p-4 → 1rem, gap-6 → 1.5rem */
```

### B4. `@theme inline` for non-exposed tokens
**Rule.** Use `@theme inline { ... }` when you want tokens compiled into utilities but *not* emitted as CSS custom properties on `:root`.
**Reason.** Trims CSS bytes for tokens you'll never reference at runtime (e.g. internal-only spacing), and prevents leakage into devtools.
```css
@theme inline {
  --shadow-internal-glow: 0 0 0 1px oklch(80% 0.1 250 / 0.4);
}
```

### B5. Custom utilities via `@utility`
**Rule.** Define one-off utilities with `@utility name { property: value; }` instead of `@layer utilities { .name { ... } }`.
**Reason.** `@utility` integrates with v4's variant system (`hover:tab-4` works), supports parametric `--value()` arguments, and lives in the right cascade layer automatically.
```css
/* wrong (v3) */
@layer utilities { .tab-4 { tab-size: 4; } }
/* right (v4) */
@utility tab-4 { tab-size: 4; }
```

### B6. Parametric `@utility` with `--value()`
**Rule.** For utilities with a numeric arg (`flex-3`, `grid-cols-13`), use `@utility flex-* { flex: --value(integer); }`.
**Reason.** One declaration generates the full family — no JS plugin, no enumeration.
```css
@utility flex-* {
  flex: --value(integer);
}
/* now flex-1, flex-2, flex-99 all work */
```

### B7. `@variant` and `@custom-variant` for new states
**Rule.** Declare custom variants with `@custom-variant name (selector-or-media)`. Newer docs spell this `@variant` for inline use.
**Reason.** Lets you reuse complex selectors (`[data-state="open"]`, media queries) as a one-word prefix.
```css
@custom-variant pointer-coarse (@media (pointer: coarse));
@custom-variant open (&[data-state="open"]);
/* usage */
/* <div class="open:rotate-90 pointer-coarse:p-6"> */
```

### B8. Reuse `data-state` via custom variants
**Rule.** When a component uses `data-state="open"` / `"closed"` (Radix, Headless UI), declare `@custom-variant open` and `@custom-variant closed` once instead of repeating `data-[state=open]:` everywhere.
**Reason.** Pattern duplication invites typos and bloats class strings; one variant declaration centralizes it.
```css
@custom-variant open (&[data-state="open"]);
@custom-variant closed (&[data-state="closed"]);
```
```html
<!-- wrong --> <Trigger class="data-[state=open]:rotate-90 data-[state=closed]:rotate-0">
<!-- right --> <Trigger class="open:rotate-90 closed:rotate-0">
```

### B9. Container queries are first-class
**Rule.** Use `@container/<name>` to mark a container, then `@sm:`, `@md:`, `@xl:` for container-relative breakpoints (no plugin needed in v4).
**Reason.** Component-driven layout — a card responds to its container width regardless of viewport. Viewport breakpoints (`md:`) are wrong when the same component appears in a sidebar and a hero.
```html
<aside class="@container/sidebar">
  <article class="grid @md:grid-cols-2">...</article>
</aside>
```

### B10. Name your containers when nesting
**Rule.** Always name containers (`@container/sidebar`, `@container/card`) and reference them (`@md/sidebar:`) when more than one container can wrap a component.
**Reason.** Unnamed `@container` queries match the *nearest* container — nested unnamed containers silently collide.
```html
<!-- wrong -->
<aside class="@container"><div class="@container">
  <p class="@md:flex">??? which container ???</p>
</div></aside>
<!-- right -->
<aside class="@container/aside"><div class="@container/card">
  <p class="@md/card:flex">  </p>
</div></aside>
```

### B11. Native cascade layers ordering
**Rule.** Trust v4's cascade layers (`theme`, `base`, `components`, `utilities`). Author component CSS in `@layer components`, base resets in `@layer base`. `@utility` lands in `utilities` automatically.
**Reason.** v4 uses real CSS `@layer` instead of v3's PostCSS shuffling. Layer-aware cascade replaces specificity hacks.
```css
@layer components {
  .prose-card { @apply rounded-lg border p-6; }
}
```

### B12. Modern color spaces and OKLCH
**Rule.** Author colors in `oklch()` (default in v4's palette) so `bg-blue-500/50` resolves to `color-mix(in oklab, ...)` opacity blends — perceptually uniform.
**Reason.** OKLCH has equal perceptual lightness across hues; sRGB-mixed opacity produces muddier blends.
```css
@theme {
  --color-brand: oklch(55% 0.2 270);
  --color-brand-soft: oklch(85% 0.06 270);
}
```

### B13. Add breakpoints in `@theme`
**Rule.** New responsive prefixes come from `--breakpoint-*` tokens, not a config object.
**Reason.** Same source-of-truth principle as colors — declarative, in CSS, hot-reloads.
```css
@theme {
  --breakpoint-3xl: 1920px;
  --breakpoint-print: print; /* media-type variant */
}
/* enables 3xl:grid-cols-12, print:hidden */
```

### B14. 3D transform utilities
**Rule.** Use `rotate-x-*`, `rotate-y-*`, `translate-z-*`, `perspective-near` / `perspective-normal` / `perspective-far` for 3D effects.
**Reason.** v4 ships first-class 3D — no `@apply transform:rotateX(...)` workarounds.
```html
<div class="perspective-normal">
  <div class="rotate-y-12 transition hover:rotate-y-0">flip me</div>
</div>
```

### B15. Text wrapping utilities
**Rule.** Use `text-balance` on headings (≤6 lines) and `text-pretty` on body copy.
**Reason.** Native typographic polish; browsers ignore on long blocks (no perf hit).
```html
<h1 class="text-balance">Long heading that wraps cleanly</h1>
<p class="text-pretty">Body paragraph avoiding orphans...</p>
```

### B16. `field-sizing-content` for auto-resizing inputs
**Rule.** Apply `field-sizing-content` to `<textarea>` (or contenteditable) so it grows with content — no JS resize listener.
**Reason.** Native CSS auto-sizing replaces a perpetual JS hack.
```html
<textarea class="field-sizing-content min-h-20 w-full"></textarea>
```

### B17. Animate from `display: none` with `@starting-style`
**Rule.** Pair v4's `transition` and `starting:` variant with `@starting-style` to animate elements appearing from `display: none`, popovers, dialogs.
**Reason.** Replaces `requestAnimationFrame` enter-animation hacks for popovers/menus.
```html
<div popover class="transition opacity-100 starting:opacity-0">
  fades in on open
</div>
```

### B18. `not-*` variant beats chained negations
**Rule.** Prefer `not-disabled:hover:bg-red-500` over `[&:not(:disabled):hover]:bg-red-500` or chained arbitrary selectors.
**Reason.** Reads as English, and the compiler emits a single negation selector.
```html
<!-- wrong -->
<button class="[&:not(:disabled):hover]:bg-red-500">
<!-- right -->
<button class="not-disabled:hover:bg-red-500">
```

### B19. `has-*` for parent-from-child styling
**Rule.** Use `has-[selector]:` to style a parent based on its descendants — no JS.
**Reason.** Native `:has()` is baseline; replaces toggling classes via JS for "form has invalid input" patterns.
```html
<form class="has-[input:invalid]:border-red-500">
  <input required />
</form>
```

### B20. `@apply` minimization
**Rule.** Keep `@apply` for legacy CSS, third-party HTML you can't class-decorate, or unstyled-defaults base reset. For your own components, prefer composition or a named `@utility`.
**Reason.** `@apply`-heavy CSS reinvents component classes — losing the design system's atomic guarantees and the JIT's tree-shaking.
```css
/* ok — third-party widget you can't reach */
@layer base {
  .legacy-cms-content h1 { @apply text-2xl font-semibold; }
}
/* wrong — inventing component CSS for your own UI */
.btn { @apply rounded bg-blue-600 px-4 py-2 text-white; }
```

### B21. `@layer base` only for unopinionated resets
**Rule.** `@layer base` is for the unstyled defaults of HTML elements (`h1` font-weight, link color). Component rhythm (`p { margin-block: 1rem }`) goes in components or a typography plugin.
**Reason.** Base styles leak into every page. Opinionated rhythm in base creates spacing surprises in articles, emails, MDX.
```css
/* wrong */
@layer base { p { @apply mb-4; } }   /* now every <p> is spaced */
/* right */
@layer components { .prose p { @apply mb-4; } }
```

### B22. Use the v4 upgrade codemod
**Rule.** Migrate v3 projects with `npx @tailwindcss/upgrade@latest`. Then port `theme.extend` from `tailwind.config.js` into `@theme`.
**Reason.** The codemod handles imports, deprecated utilities, and config rewrites; manual migration drifts.
```bash
# right
npx @tailwindcss/upgrade@latest
```

### B23. Prefer tokens over arbitrary values
**Rule.** When `gap-[13px]` appears, ask whether the design intends a new token (`--spacing` step shift) or an alignment with an existing one.
**Reason.** Arbitrary values silently fork the design system; tokens force a deliberate decision.
```css
/* token-first */
@theme { --spacing: 0.25rem; }  /* gap-3 = 0.75rem */
/* component */
.thumb-grid { @apply gap-3; }
```

### B24. Variants compose left-to-right
**Rule.** Stack variants in the order: pseudo-class → pseudo-element → media → state → responsive. e.g. `dark:hover:md:bg-blue-700`.
**Reason.** Stable composition order matches Tailwind's documented application order — readable and Prettier-stable.
```html
<button class="dark:hover:md:bg-blue-700">...</button>
```

### B25. Plugin migration from v3
**Rule.** v3 plugins authored with `tailwindcss/plugin` need rewriting in v4 — most reduce to `@utility` and `@custom-variant` declarations.
**Reason.** v4's plugin authoring is CSS-first; the JS plugin API is shrunk and many community plugins have native CSS replacements.
```css
/* wrong (v3 plugin) */
const plugin = require("tailwindcss/plugin");
plugin(({ addUtilities }) => addUtilities({ ".tab-4": { tabSize: 4 } }));
/* right (v4 CSS) */
@utility tab-4 { tab-size: 4; }
```

---

## D — Anti-patterns / smells

### D1. v3 `tailwind.config.js` left in a v4 project
**Rule.** Delete `tailwind.config.js`/`.ts` after migration. Move `theme.extend` into `@theme` and plugins into `@utility` / `@custom-variant`.
**Reason.** v4 reads it via `@config` only as a compatibility shim — `theme.extend.colors` doesn't apply to v4 utilities; tokens silently go missing.
```css
/* wrong */
@import "tailwindcss";
@config "./tailwind.config.js";
/* right */
@import "tailwindcss";
@theme { --color-brand: oklch(55% 0.2 270); }
```

### D2. Three `@tailwind` directives in v4
**Rule.** Replace `@tailwind base; @tailwind components; @tailwind utilities;` with `@import "tailwindcss";`.
**Reason.** v4 does not emit anything for the old directives — they're silently ignored. The single `@import` is the only supported entry.
```css
/* wrong */
@tailwind base;
@tailwind components;
@tailwind utilities;
/* right */
@import "tailwindcss";
```

### D3. `@apply` everywhere replicating component CSS
**Rule.** A `.btn { @apply ... }` for every component is a smell — utility-first is the point.
**Reason.** Defeats Tailwind's atomic guarantees, doubles CSS size, and you've reinvented BEM with extra steps.
```css
/* wrong */
.btn { @apply rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700; }
/* right — keep utilities in HTML or use a component variant lib */
<button class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
```

### D4. `@apply` chained with state inside CSS
**Rule.** Don't `@apply hover:bg-red-500` inside CSS — the precedence is harder to reason about than putting `hover:bg-red-500` on the element.
**Reason.** Chained-state `@apply` produces fragile cascade order; debugging "why isn't my hover firing" goes uphill fast.
```css
/* wrong */
.cta { @apply hover:bg-red-500; }
/* right */
<button class="cta hover:bg-red-500">
```

### D5. Template-literal class names
**Rule.** Never `bg-${color}-500`, `text-${size}`, etc. Compute a complete-string lookup map.
**Reason.** Tailwind's source scanner can only see literal strings — interpolated classes get tree-shaken away.
```tsx
// wrong
<div className={`bg-${color}-500`} />
// right
const BG = { red: "bg-red-500", blue: "bg-blue-500" } as const;
<div className={BG[color]} />
```

### D6. Arbitrary values that should be tokens
**Rule.** Recurring `gap-[24px]`, `p-[12px]`, `text-[#4f46e5]` are missing tokens — promote to `@theme`.
**Reason.** Each arbitrary value forks the design system; future re-theming requires a regex sweep.
```html
<!-- wrong -->
<div class="gap-[24px] text-[#4f46e5]">
<!-- right after adding @theme tokens -->
<div class="gap-6 text-brand">
```

### D7. Hardcoded hex/rgb in components
**Rule.** A new hex literal in a JSX/HTML class is a code smell — pull it into `@theme`.
**Reason.** Theme drift, dark-mode failure, and color-token bypass all start with one inline hex.
```html
<!-- wrong -->
<div class="bg-[#ffe5e5] text-[#b91c1c]">
<!-- right -->
<div class="bg-danger-soft text-danger">
```

### D8. String concatenation of classes
**Rule.** No `className={"btn " + (active ? "bg-red-500" : "")}`. Use `cn()`.
**Reason.** Stringly-typed; merges fail; conflicting utilities both ship; Prettier can't sort.
```tsx
// wrong
className={"btn " + (active ? "bg-red-500" : "")}
// right
className={cn("btn", active && "bg-red-500")}
```

### D9. Long class strings without `tailwind-merge`
**Rule.** When two classes conflict (`p-4 p-8`), let `tailwind-merge` resolve — don't hope for last-wins by source order.
**Reason.** Tailwind's source order is alphabetical-ish, not author intent; without merge the wrong class can win unpredictably.
```tsx
// wrong: caller's p-8 may or may not stick
<div className={`rounded p-4 ${className}`} />
// right
<div className={cn("rounded p-4", className)} />
```

### D10. Forgetting `prettier-plugin-tailwindcss`
**Rule.** Install and configure the official plugin in every Tailwind project.
**Reason.** Without canonical sort, class order drifts in PRs and review diffs are noise.
```json
// .prettierrc
{ "plugins": ["prettier-plugin-tailwindcss"] }
```

### D11. Hardcoded breakpoints for component-relative sizing
**Rule.** When a component cares about its own width (sidebar card, modal body), use `@container/<name>` and `@xl:`, not viewport `lg:`.
**Reason.** Viewport breakpoints describe the window — irrelevant when the same card lives in a sidebar at 320px and a hero at 960px.
```html
<!-- wrong -->
<aside class="w-80"><div class="grid lg:grid-cols-2">...</div></aside>
<!-- right -->
<aside class="w-80 @container/aside">
  <div class="grid @md/aside:grid-cols-2">...</div>
</aside>
```

### D12. `dark:` without a dark-mode strategy
**Rule.** Don't sprinkle `dark:` utilities without declaring `@variant dark (...)` or relying on `prefers-color-scheme`.
**Reason.** v4 doesn't auto-fire `dark:` — variants need a strategy declaration. Silent no-op otherwise.
```css
/* wrong: no strategy, no toggle works */
/* right */
@variant dark (&:where(.dark, .dark *));
```

### D13. Inline arbitrary properties for things with utilities
**Rule.** Don't write `[border-radius:8px]` when `rounded-lg` exists.
**Reason.** Bypasses the design system, defeats `tailwind-merge`, and breaks Prettier ordering.
```html
<!-- wrong -->
<div class="[border-radius:8px] [padding:1rem]">
<!-- right -->
<div class="rounded-lg p-4">
```

### D14. Custom CSS for utilities that already exist
**Rule.** No `.gap-6 { gap: 1.5rem }` or `.btn { padding: 12px }` re-implementations.
**Reason.** Wastes maintenance budget, diverges from Tailwind's spacing scale, and ships duplicated CSS.
```css
/* wrong */
.gap-6 { gap: 1.5rem; }   /* already a utility */
```

### D15. `!` on every utility to win cascade
**Rule.** Stop suffixing `!` everywhere. If you need it constantly, your `@layer` order or selector strategy is wrong.
**Reason.** `!important` proliferation means the next override needs `!important` too — endless escalation.
```html
<!-- wrong -->
<div class="bg-red-500! p-4! mt-2!">
<!-- right: fix the conflict, not paper over it -->
@layer overrides { /* ... */ }
```

### D16. `:where()` workarounds when `@layer` would do
**Rule.** Don't reach for `:where(.btn)` to neutralize specificity — let cascade layers do that work.
**Reason.** `@layer` ordering is the v4-native specificity tool. `:where()` is a fallback for non-layered codebases.
```css
/* wrong */
:where(.btn) { padding: 1rem; }
/* right */
@layer components { .btn { padding: 1rem; } }
```

### D17. Source declarations Tailwind already auto-scans
**Rule.** No `@source "./src/**/*.tsx"` when `src/` is the auto-scanned root.
**Reason.** Re-declaring the default scope wastes builder cycles every rebuild.
```css
/* wrong */
@source "./src/**/*.{ts,tsx}";
/* right — only declare what's outside the auto-scan */
@source "../emails/**/*.html";
```

### D18. Missing `@source` for dynamic / CMS classes
**Rule.** When classes live in MDX, CMS rich text, or `node_modules` packages, declare `@source` for those paths.
**Reason.** Without a source declaration, the JIT scanner can't see those classes — they're tree-shaken from the build, then break in production.
```css
@source "../content/**/*.mdx";
@source "../../node_modules/@my-org/ui/dist/**/*.js";
```

### D19. Mixing color spaces in tokens
**Rule.** Don't mix HSL and OKLCH in `--color-*` tokens — pick one and convert.
**Reason.** v4's `color-mix(in oklab, ...)` opacity blending interacts surprisingly with HSL inputs; perceptual mismatches appear at low opacity.
```css
/* wrong */
@theme {
  --color-brand: hsl(245 83% 60%);
  --color-accent: oklch(70% 0.15 30);
}
/* right */
@theme {
  --color-brand: oklch(55% 0.2 270);
  --color-accent: oklch(70% 0.15 30);
}
```

### D20. Authoring CSS to fight Tailwind specificity
**Rule.** When your handwritten CSS keeps losing to a utility, the answer is `@layer` placement — not adding `!important` or a deeper selector.
**Reason.** v4's cascade layers are deterministic. Selector escalation just delays the problem.
```css
/* wrong */
.my-btn.my-btn { background: red; }
/* right */
@layer components { .my-btn { background: red; } }
```

### D21. Opinionated rhythm in `@layer base`
**Rule.** Don't `@layer base { p { @apply mb-4 } }` — base is for unstyled defaults. Body rhythm belongs in a typography plugin or a component class.
**Reason.** Every paragraph in the app — including emails, popovers, MDX prose — inherits the spacing, then bugs arrive.
```css
/* wrong */
@layer base { p { @apply mb-4; } }
/* right */
@layer components { .prose p { @apply mb-4; } }
```

### D22. Repeated `data-[state=...]` chains
**Rule.** When `data-[state=open]:` and `data-[state=closed]:` repeat across components, define `@custom-variant open` / `closed` once.
**Reason.** Variant duplication invites typos, bloats class strings, and makes refactors harder.
```css
@custom-variant open (&[data-state="open"]);
@custom-variant closed (&[data-state="closed"]);
/* now class="open:rotate-90 closed:rotate-0" */
```

### D23. v3 plugin imports in v4
**Rule.** `require("tailwindcss/plugin")` in a v4 project is a smell — most plugins rewrite to `@utility` / `@custom-variant`.
**Reason.** v4's plugin API is reduced; legacy plugins often run partially or not at all, then ship as missing utilities.
```css
/* wrong (v3 holdover) */
plugins: [require("tailwindcss-tab-size")]
/* right */
@utility tab-4 { tab-size: 4; }
```

### D24. `tailwind.config.ts` with `theme.extend.colors` in v4
**Rule.** Move all `theme.extend.*` declarations into `@theme`. JS-config tokens don't compile into v4 utilities.
**Reason.** v4 reads JS config only via `@config` shim and only for limited keys — colors / spacing / radii must come from `@theme`.
```ts
// wrong (silently ignored for utilities)
export default { theme: { extend: { colors: { brand: "#4f46e5" } } } };
```
```css
/* right */
@theme { --color-brand: oklch(55% 0.2 270); }
```

### D25. Tailwind UI v3 components copy-pasted into v4
**Rule.** Tailwind UI markup mostly works as-is, but the project's CSS entry must be migrated (`@import "tailwindcss"`, `@theme` tokens, `@variant dark` declared).
**Reason.** Class names rarely change; the surrounding *config* breaks. Symptom: components look unstyled or dark mode no-ops.
```css
/* right migration checklist */
@import "tailwindcss";
@variant dark (&:where(.dark, .dark *));
@theme { /* port theme.extend here */ }
```

### D26. `space-x-*` for grid layouts
**Rule.** Don't apply `space-x-*` / `space-y-*` to grid containers — `gap-*` is correct.
**Reason.** `space-*` injects sibling negative margins; on grid, this fights `gap` and corrupts track sizing.
```html
<!-- wrong -->
<div class="grid grid-cols-3 space-x-4">
<!-- right -->
<div class="grid grid-cols-3 gap-4">
```

### D27. Unnamed nested containers
**Rule.** When two `@container` ancestors can wrap the same element, name them and reference the right one in your variant.
**Reason.** Unnamed `@container` defaults to "nearest container" — silent bugs when nesting changes.
```html
<!-- wrong -->
<div class="@container"><div class="@container">
  <p class="@md:flex">  </p>
</div></div>
<!-- right -->
<div class="@container/outer"><div class="@container/inner">
  <p class="@md/inner:flex">  </p>
</div></div>
```

### D28. Missing `prefers-reduced-motion` on transitions
**Rule.** Wrap non-essential `transition-*` / `animate-*` utilities with `motion-safe:` (or guard via reset).
**Reason.** Users with vestibular disorders set `prefers-reduced-motion`; ignoring it is a WCAG 2.3.3 a11y violation.
```html
<!-- wrong -->
<div class="transition-transform hover:translate-y-1">
<!-- right -->
<div class="motion-safe:transition-transform motion-safe:hover:translate-y-1">
```

---

## Sources

- [Tailwind CSS v4.0 release post](https://tailwindcss.com/blog/tailwindcss-v4) — the canonical v4 announcement, CSS-first config rationale
- [Tailwind v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide) — `@import` directive, `@theme` migration, codemod usage
- [Tailwind docs: Theme variables](https://tailwindcss.com/docs/theme) — `@theme` namespaces, `--spacing` single root, `@theme inline`
- [Tailwind docs: Adding custom utilities](https://tailwindcss.com/docs/adding-custom-styles) — `@utility`, `--value()` parametric utilities
- [Tailwind docs: Hover, focus, and other states](https://tailwindcss.com/docs/hover-focus-and-other-states) — `@custom-variant`, `data-*`, `not-*`, `has-*`
- [Tailwind docs: Dark mode](https://tailwindcss.com/docs/dark-mode) — class- and attribute-based strategy via `@variant dark`
- [Tailwind docs: Container queries](https://tailwindcss.com/docs/container-queries) — built-in `@container/<name>` and named-container variants
- [tailwind-merge](https://github.com/dcastil/tailwind-merge) — last-wins resolution for conflicting utilities
- [class-variance-authority](https://cva.style/) and [tailwind-variants](https://www.tailwind-variants.org/) — variant authoring
- [@tailwindcss/vite](https://www.npmjs.com/package/@tailwindcss/vite) — preferred Vite plugin
- Adam Wathan — v4 launch talks and "Why we built v4 in Rust" posts
- Robin Malfait — `@theme` rationale (Tailwind core team)
- Sam Selikoff — v4 feature walkthrough video (Buildui, Jan 2025)
- Theo Browne (t3.gg) — v4 coverage and migration commentary
