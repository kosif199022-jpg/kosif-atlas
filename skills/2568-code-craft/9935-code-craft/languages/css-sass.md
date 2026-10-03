# CSS + SASS — code-craft reference

~70 rules across three buckets, covering modern CSS (2024-2026 baseline) and SASS (Dart Sass 1.80+). Each rule is tagged **(CSS)**, **(SASS)**, or **(both)** when it matters. Frameworks like Tailwind, CSS-in-JS, and PostCSS plugins are out of scope.

Sources: [web.dev](https://web.dev), [MDN modern CSS docs](https://developer.mozilla.org), Andy Bell (Set Studio / Piccalilli), Josh Comeau, Adam Argyle (Chrome DevRel), Stephanie Eckles (ModernCSS.dev), Una Kravets, Sass team migration docs.

Loaded by `code-craft` when the user asks about CSS, SASS, SCSS, or pastes stylesheet code for review.

---

## A — Tactical (day-to-day patterns)

### A1. Prefer classes for selectors (both)
**Rule.** Style with classes; reserve element selectors for reset/typography defaults and IDs for JS hooks/anchors only.
**Reason.** Classes have predictable specificity (0,1,0) and are reusable.
```css
/* wrong */ #header nav a { color: blue; }
/* right */ .site-nav__link { color: blue; }
```

### A2. No ID selectors for styling (both)
**Rule.** Never use `#id` in stylesheets to apply visual styles.
**Reason.** ID specificity (1,0,0) starts a specificity arms race ending in `!important`.
```css
/* wrong */ #submit-btn { background: blue; }
/* right */ .btn--primary { background: blue; }
```

### A3. Specificity hygiene (both)
**Rule.** Keep selectors flat — one class, optionally one state. No `.a .b .c .d`.
**Reason.** Long selectors couple styles to DOM structure and balloon specificity.
```css
/* wrong */ .card .body .list li a { color: red; }
/* right */ .card__link { color: red; }
```

### A4. BEM or hybrid for component naming (both)
**Rule.** Use BEM (`block__element--modifier`) for components; mix utility classes for layout primitives. Pick one, document it.
**Reason.** BEM makes ownership and variants obvious; utilities cover composition. CUBE CSS (Andy Bell) is a viable lighter alternative.
```html
<!-- wrong --> <div class="card red big">
<!-- right --> <div class="card card--featured u-stack-md">
```

### A5. kebab-case everything (both)
**Rule.** All class names, custom properties, file names, and SCSS variables use `kebab-case`.
**Reason.** Mixing conventions is constant friction.
```css
/* wrong */ .cardTitle { --textColor: red; }
/* right */ .card-title { --text-color: red; }
```

### A6. Custom properties for design tokens (CSS)
**Rule.** Define all reusable values (colors, space, radii, type) as `--token` custom properties on `:root`.
**Reason.** Runtime themability, dark mode, dev-tools live tweaking — `$sass-vars` cannot do this.
```css
/* wrong */ .btn { background: #4f46e5; }
/* right */ :root { --color-brand: oklch(55% 0.2 270); }
        .btn { background: var(--color-brand); }
```

### A7. Token naming convention (CSS)
**Rule.** Name custom properties by role, not value: `--color-text-primary`, not `--gray-900`. Two-tier (primitive + semantic) is best.
**Reason.** Semantic tokens survive theme changes; primitive-only tokens leak palette into every component.
```css
/* wrong */ --gray-900: #111;  .heading { color: var(--gray-900); }
/* right */ --gray-900: #111;  --color-text: var(--gray-900);
        .heading { color: var(--color-text); }
```

### A8. `var()` fallbacks for critical tokens (CSS)
**Rule.** When a custom property is essential, supply a fallback: `var(--color-brand, #4f46e5)`.
**Reason.** Survives partial cascades, missing themes, and `@property` parse errors.
```css
/* wrong */ color: var(--color-text);
/* right */ color: var(--color-text, #111);
```

### A9. Flexbox for 1D, Grid for 2D (both)
**Rule.** Pick Flexbox when laying out items in one axis; Grid when both axes matter or you need precise track sizing.
**Reason.** Wrong tool produces brittle hacks (e.g., `flex-wrap` to fake a grid).
```css
/* wrong */ .gallery { display: flex; flex-wrap: wrap; } /* uneven gutters */
/* right */ .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1rem; }
```

### A10. Never `float` for layout (both)
**Rule.** `float` is for wrapping text around figures, not page structure.
**Reason.** Modern engines deprioritize float layout; use Flexbox/Grid.

### A11. `rem` for type & spacing, `em` for component-relative (both)
**Rule.** `rem` (root-relative) for global tokens; `em` for things that should scale with the element's own font-size.
**Reason.** Respects the user's root-font-size preference; `em` lets badges/buttons scale together.
```css
/* wrong */ .btn { padding: 8px 16px; font-size: 14px; }
/* right */ .btn { padding: 0.5em 1em; font-size: 0.875rem; }
```

### A12. `dvh`/`svh`/`lvh`, not `vh` on mobile (CSS)
**Rule.** For full-screen sections, use `100dvh` (dynamic) or `100svh` (small) — never `100vh`.
**Reason.** `vh` doesn't account for mobile URL bars — content jumps when bar shows/hides.
```css
/* wrong */ .hero { min-height: 100vh; }
/* right */ .hero { min-height: 100dvh; }
```

### A13. Avoid `100vw` (CSS)
**Rule.** Use `100%` or `100dvw` for full-width; `100vw` includes scrollbar width.
**Reason.** On Windows/desktop the scrollbar is ~17px — `100vw` overflows the viewport.
```css
/* wrong */ .full { width: 100vw; }
/* right */ .full { width: 100%; }
```

### A14. Logical properties for i18n (both)
**Rule.** Prefer `margin-inline`, `padding-block`, `inset-inline-start` over `margin-left`/`padding-top`/`left`.
**Reason.** RTL languages and vertical writing modes Just Work without overrides.
```css
/* wrong */ .card { margin-left: 1rem; padding-top: 0.5rem; }
/* right */ .card { margin-inline-start: 1rem; padding-block-start: 0.5rem; }
```

### A15. `oklch()` over `hsl()` over hex (CSS)
**Rule.** Author colors in `oklch()` for perceptual uniformity; use `color-mix()` for tints/shades.
**Reason.** OKLCH has equal perceptual lightness across hues; HSL doesn't (yellow looks brighter than blue at same L). Baseline since 2023.
```css
/* wrong */ --brand: #4f46e5; --brand-50: #ece9ff; /* hand-picked */
/* right */ --brand: oklch(55% 0.2 270);
        --brand-50: color-mix(in oklch, var(--brand) 10%, white);
```

### A16. Define a spacing scale (both)
**Rule.** All spacing comes from a token scale (4/8 px or modular 0.25/0.5/1/1.5/2/3/4 rem). Never one-off values.
**Reason.** Visual rhythm and review-time consistency.
```css
/* wrong */ .a { margin: 13px; } .b { margin: 17px; }
/* right */ :root { --space-2: 0.5rem; --space-4: 1rem; }
        .a { margin: var(--space-2); } .b { margin: var(--space-4); }
```

### A17. Fluid typography with `clamp()` (CSS)
**Rule.** Scale type with `clamp(min, preferred, max)` instead of breakpoint-specific font-sizes.
**Reason.** Smooth scaling across all viewports; one declaration replaces a media-query ladder.
```css
/* wrong */ h1 { font-size: 2rem; } @media(min-width: 768px) { h1 { font-size: 3rem; } }
/* right */ h1 { font-size: clamp(2rem, 1.5rem + 2vw, 3rem); }
```

### A18. Unitless `line-height` (both)
**Rule.** `line-height: 1.5;` — never `line-height: 24px` or `line-height: 150%`.
**Reason.** Unitless inherits as a multiplier so children with different font-sizes scale correctly.
```css
/* wrong */ body { line-height: 24px; }
/* right */ body { line-height: 1.5; }
```

### A19. `text-wrap: balance` and `pretty` (CSS)
**Rule.** `text-wrap: balance` for headings (≤6 lines), `text-wrap: pretty` for body copy to avoid orphans.
**Reason.** Free typographic polish; respected by browsers but ignored on long blocks (no perf hit).
```css
/* right */ h1, h2 { text-wrap: balance; }
        p { text-wrap: pretty; }
```

### A20. `font-display: swap` on web fonts (CSS)
**Rule.** Always set `font-display: swap` (or `optional`) on `@font-face`.
**Reason.** Prevents FOIT (invisible text) — text renders immediately with the fallback.
```css
/* wrong */ @font-face { font-family: Inter; src: url(...); }
/* right */ @font-face { font-family: Inter; src: url(...); font-display: swap; }
```

### A21. Mobile-first media queries (both)
**Rule.** Author with `min-width`; layer larger-screen styles on top of mobile baseline.
**Reason.** Mobile is the constrained baseline; `min-width` queries cascade additively without overrides.
```css
/* wrong */ .nav { display: flex; } @media(max-width: 768px) { .nav { display: block; } }
/* right */ .nav { display: block; } @media(min-width: 768px) { .nav { display: flex; } }
```

### A22. Honor `prefers-reduced-motion` (CSS)
**Rule.** Wrap non-essential animations/transitions in `@media (prefers-reduced-motion: no-preference)` or kill them inside `(reduce)`.
**Reason.** Users with vestibular disorders set this — ignoring it is an a11y violation.
```css
/* wrong */ .modal { transition: transform .3s; }
/* right */ @media (prefers-reduced-motion: no-preference) {
          .modal { transition: transform .3s; }
        }
```

### A23. Honor `prefers-color-scheme` (CSS)
**Rule.** Provide a dark theme via `@media (prefers-color-scheme: dark)` or `[data-theme=dark]`, swapping tokens.
**Reason.** OS-level user preference; no extra UI cost when tokens are layered.
```css
:root { --bg: white; --fg: black; }
@media (prefers-color-scheme: dark) {
  :root { --bg: black; --fg: white; }
}
```

### A24. `:focus-visible`, not `:focus` (CSS)
**Rule.** Style focus rings with `:focus-visible` to show only for keyboard users.
**Reason.** Avoids the "ugly outline on click" problem that drives devs to `outline:none` (a11y bug).
```css
/* wrong */ button:focus { outline: 2px solid blue; }
/* right */ button:focus-visible { outline: 2px solid blue; outline-offset: 2px; }
```

### A25. Form control coloring (CSS)
**Rule.** Use `accent-color` for native checkboxes/radios/range; `caret-color` for inputs.
**Reason.** Tints native widgets without rebuilding them — preserves a11y and platform UX.
```css
/* right */ :root { accent-color: var(--color-brand); }
        input[type=text] { caret-color: var(--color-brand); }
```

### A26. Use a modern reset (both)
**Rule.** Adopt Andy Bell's modern reset, Josh Comeau's, or `normalize.css` — not Eric Meyer's 2007 reset.
**Reason.** Modern resets handle `box-sizing`, media defaults, form inheritance, and motion preferences out of the box.
```css
/* right (excerpt, Andy Bell style) */
*, *::before, *::after { box-sizing: border-box; }
body { min-height: 100dvh; line-height: 1.5; }
img, picture, svg, video { display: block; max-inline-size: 100%; }
```

### A27. `aspect-ratio` for media (CSS)
**Rule.** Use `aspect-ratio: 16 / 9` instead of padding-bottom hacks for responsive media boxes.
**Reason.** One line, no pseudo-elements; reserves layout space and prevents CLS.
```css
/* wrong */ .video { padding-top: 56.25%; position: relative; }
/* right */ .video { aspect-ratio: 16 / 9; }
```

---

## B — Modern CSS / SASS idioms

### B1. Cascade layers (`@layer`) (CSS)
**Rule.** Declare layer order at top of entry CSS: `reset, base, theme, components, utilities, overrides`. Place rules into named layers.
**Reason.** Layered CSS beats specificity battles; later layers always win regardless of selector strength.
```css
/* right */ @layer reset, base, theme, components, utilities;
        @layer components { .btn { padding: var(--space-2); } }
```

### B2. `:has()` for parent-aware styling (CSS)
**Rule.** Use `:has()` to style a parent based on its children/state — but sparingly, since it can be expensive.
**Reason.** Replaces JS class-toggling for many "container with X" patterns; baseline since late 2023.
```css
/* wrong: JS toggles a class */ form.classList.toggle('has-error', !!input.invalid)
/* right */ form:has(input:invalid) { border-color: var(--color-danger); }
```

### B3. `:is()` for grouping, `:where()` for zero specificity (CSS)
**Rule.** Group selectors with `:is(h1, h2, h3)`; in resets/base, use `:where()` so user styles always override.
**Reason.** `:is()` takes the highest specificity inside; `:where()` is always 0,0,0 — perfect for resets.
```css
/* wrong */ #app h1 { font-weight: 700; } /* hard to override */
/* right */ :where(h1, h2, h3) { font-weight: 700; }
```

### B4. Container queries for components (CSS)
**Rule.** When a component cares about its own width (not the viewport's), use `@container`.
**Reason.** A card in a sidebar and the same card in a hero need different layouts at different *container* sizes — viewport queries can't express that.
```css
/* right */ .card-host { container-type: inline-size; }
        @container (min-width: 30rem) {
          .card { display: grid; grid-template-columns: 1fr 2fr; }
        }
```

### B5. Native nesting in plain CSS (CSS)
**Rule.** In plain CSS, native nesting works in all baseline browsers. In SCSS, follow the same nesting rules — depth ≤ 3.
**Reason.** Reduces preprocessor lock-in for simple cases; same readability concerns apply.
```css
/* right */ .card {
          padding: var(--space-4);
          & > .card__title { font-size: 1.25rem; }
          &:hover { box-shadow: var(--shadow-md); }
        }
```

### B6. Subgrid for aligned descendants (CSS)
**Rule.** Use `grid-template-columns: subgrid` when a child needs to align to its grandparent's grid tracks.
**Reason.** Avoids manual track-duplication and brittle pixel matching for cards with shared rhythm.
```css
/* right */ .grid { display: grid; grid-template-columns: repeat(3, 1fr); }
        .card { display: grid; grid-template-columns: subgrid; grid-column: span 3; }
```

### B7. `@scope` for component encapsulation (CSS)
**Rule.** Wrap component styles in `@scope (.component) to (.boundary)` to limit reach without name-prefixing.
**Reason.** Cleaner than long BEM chains; baseline-newly-available — safe in modern Chromium/Safari, polyfill or feature-flag for Firefox until 2026.
```css
/* right */ @scope (.card) to (.card__media) {
          :scope { padding: var(--space-4); }
          h2 { font-size: 1.25rem; }
        }
```

### B8. View Transitions API (CSS)
**Rule.** Add `@view-transition { navigation: auto; }` for cross-document fades; use `view-transition-name: <ident>` to morph specific elements. Baseline newly-available (Firefox 144, Oct 2025).
**Reason.** Native crossfades and shared-element morphs without animation libraries.
```css
/* right */ @view-transition { navigation: auto; }
        .hero-image { view-transition-name: hero; }
```

### B9. `interpolate-size: allow-keywords` for `auto` transitions (CSS)
**Rule.** Set `interpolate-size: allow-keywords` (or `calc-size()`) on the root or a scope to animate `height: 0 → auto`. Still Chromium-only as of 2025 — guard with `@supports`.
**Reason.** Removes the long-standing "can't animate to `auto`" hack of measuring with JS.
```css
/* right */ :root { interpolate-size: allow-keywords; }
        details { transition: height .3s; }
```

### B10. Anchor positioning for popovers (CSS)
**Rule.** Use `anchor-name`/`position-anchor`/`anchor()` for tooltips, popovers, dropdowns instead of JS positioning. Baseline available 2025 (Chrome, Safari; Firefox 145 behind flag) — feature-detect.
**Reason.** Native, declarative; handles flips and overflow without Floating UI.
```css
/* right */ .menu-button { anchor-name: --menu; }
        .menu { position-anchor: --menu; position: absolute;
              top: anchor(bottom); left: anchor(start); }
```

### B11. SASS: `@use` and `@forward`, never `@import` (SASS)
**Rule.** Use `@use 'tokens';` then `tokens.$brand`. For barrel files, use `@forward 'tokens';`. Run `sass-migrator module` to convert.
**Reason.** `@import` is deprecated as of Dart Sass 1.80 and being removed in 3.0. It pollutes globals, double-loads files, and breaks tooling.
```scss
/* wrong */ @import 'tokens'; .btn { color: $brand; }
/* right */ @use 'tokens'; .btn { color: tokens.$brand; }
```

### B12. SASS: keep namespace explicit (SASS)
**Rule.** Avoid `@use 'tokens' as *;` except in the rare design-system entry file.
**Reason.** Loses the "where did this come from" affordance; conflicts return.
```scss
/* wrong */ @use 'tokens' as *; .btn { color: $brand; }
/* right */ @use 'tokens' as t; .btn { color: t.$brand; }
```

### B13. SASS: built-in modules over deprecated globals (SASS)
**Rule.** Use `@use 'sass:math'`, `'sass:color'`, `'sass:string'`, `'sass:list'`. Stop using global `lighten()`, `darken()`, `mix()`.
**Reason.** Global color functions are deprecated alongside `@import`; the modules are explicit and namespaced.
```scss
/* wrong */ $hover: darken($brand, 10%);
/* right */ @use 'sass:color'; $hover: color.adjust($brand, $lightness: -10%);
```

### B14. SASS: tokens-to-CSS-vars bridge (SASS + CSS)
**Rule.** Emit SCSS tokens as CSS custom properties on `:root` so components can theme at runtime.
**Reason.** SCSS variables are compile-time-only — useless for dark mode, user prefs, or live theming.
```scss
/* right */ @use 'tokens';
        :root {
          --color-brand: #{tokens.$brand};
          --space-4: #{tokens.$space-4};
        }
```

### B15. SASS: mixins for stateful patterns, custom properties for runtime (SASS + CSS)
**Rule.** Mixins for things that generate rules at compile time (media queries, BEM scaffolds); custom properties for anything that changes at runtime (theme, mode).
**Reason.** Don't ship 10× CSS for what should be a single `var()` swap.
```scss
/* right */ @mixin breakpoint($bp) { @media (min-width: $bp) { @content; } }
        .card { padding: var(--space-4);
              @include breakpoint(48em) { padding: var(--space-6); } }
```

### B16. SASS: BEM with `&__elem` and `&--mod` (SASS)
**Rule.** Inside a block, write elements as `&__title` and modifiers as `&--featured`. Keep depth at 1.
**Reason.** Compiles flat to `.card__title` and `.card--featured` — no specificity creep, easy to grep.
```scss
/* right */ .card {
          &__title { font-size: 1.25rem; }
          &--featured { background: var(--color-accent); }
        }
```

### B17. SASS: avoid `@extend`, use mixins or utility classes (SASS)
**Rule.** Replace `@extend .btn` with `@include button()` or just adding the `.btn` class in HTML.
**Reason.** `@extend` generates surprise selector groups, breaks across `@media`, and tangles cascade reasoning.
```scss
/* wrong */ .cta { @extend .btn; color: white; }
/* right */ .cta { @include button(); color: white; }
        // or just <button class="btn cta">
```

---

## D — Anti-patterns / smells

### D1. `!important` to win specificity (both)
**Rule.** Never use `!important` outside utility classes or genuine third-party overrides.
**Reason.** It's a sign your selector strategy lost — switch to `@layer` or refactor.
```css
/* wrong */ .btn { color: red !important; }
/* right */ @layer overrides { .btn { color: red; } }
```

### D2. Deep SCSS nesting (>3 levels) (SASS)
**Rule.** Cap nesting at 3 levels including pseudo-classes.
**Reason.** Generates long, brittle, high-specificity selectors. (sass-lint defaults to 2–3.)
```scss
/* wrong */ .nav { ul { li { a { &:hover { span { ... } } } } } }
/* right */ .nav__link { ... }
        .nav__link:hover .nav__icon { ... }
```

### D3. Universal selector with broad rules (CSS)
**Rule.** `*` only inside resets and `box-sizing`. Never `* { transition: all .3s; }`.
**Reason.** Performance and surprise — animations everywhere, layout shifts.
```css
/* wrong */ * { transition: all .3s; }
/* right */ .interactive { transition: background-color .15s, transform .15s; }
```

### D4. Magic numbers (both)
**Rule.** No `top: 47px;`, `width: 327px;`. Use tokens or relate to known dimensions.
**Reason.** Magic numbers fail at every breakpoint and font-size change.
```css
/* wrong */ .badge { top: 47px; }
/* right */ .badge { top: calc(var(--header-height) + var(--space-2)); }
```

### D5. `position: absolute` for layout (CSS)
**Rule.** Absolute positioning is for overlays, badges on a relative parent, decorations — not layout columns.
**Reason.** Removes from flow → overlapping content, no responsive behavior.

### D6. Z-index war (both)
**Rule.** Define a z-index scale (`--z-dropdown: 100; --z-modal: 1000; --z-toast: 9000;`). No `z-index: 99999;`.
**Reason.** Stacking conflicts compound forever otherwise.
```css
/* wrong */ .toast { z-index: 99999; }
/* right */ :root { --z-toast: 700; }
        .toast { z-index: var(--z-toast); }
```

### D7. Pixel-only sizing (both)
**Rule.** Don't size type or container widths exclusively in `px`. Use `rem`/`em`/`%`/`ch`.
**Reason.** Breaks user-set browser font-size — accessibility regression.
```css
/* wrong */ body { font-size: 16px; } .container { max-width: 1200px; }
/* right */ body { font-size: 1rem; } .container { max-width: 75rem; }
```

### D8. Hardcoded colors per component (both)
**Rule.** A new hex literal in a component file is a code smell — pull it into the token layer.
**Reason.** Theme drift and dark-mode hell.
```css
/* wrong */ .alert { background: #ffe5e5; color: #b91c1c; }
/* right */ .alert { background: var(--color-danger-bg); color: var(--color-danger-fg); }
```

### D9. Disorganized property order (both)
**Rule.** Group properties: positioning → box model → typography → visual → animation → state. Or use a stylelint order plugin.
**Reason.** Skim-readability — find what you're looking for in 1s.
```css
/* right */ .card {
          /* layout */ position: relative; display: grid;
          /* box   */ padding: var(--space-4); margin-block: var(--space-2);
          /* type  */ font-size: 1rem; line-height: 1.5;
          /* visual*/ background: var(--bg); border-radius: .5rem;
        }
```

### D10. `@import` in new SCSS code (SASS)
**Rule.** Zero new `@import` statements. Migrate old ones with `sass-migrator`.
**Reason.** Deprecated, loud warnings, removed in Dart Sass 3.

### D11. `@extend` overuse (SASS)
**Rule.** If a project uses `@extend` more than ~3 times, it's a smell — refactor to mixins or shared classes.
**Reason.** Selector grouping at compile time becomes opaque at debug time.

### D12. Inline styles (CSS)
**Rule.** Reserve `style="..."` for genuinely dynamic computed values. Never for theme/state.
**Reason.** Bypasses cascade, cache, theming, and review.
```html
<!-- wrong --> <div style="color: red; padding: 10px;">
<!-- right --> <div class="alert alert--danger">
<!-- ok    --> <div class="cursor-glow" style="--mx: 47%; --my: 12%;">
```

### D13. Unscoped global SCSS partials (SASS)
**Rule.** A partial declares only its own selectors and exports named tokens via `@forward`. No reaching into siblings.
**Reason.** Order-dependent SCSS is a maintenance nightmare; `@use` was designed to fix this.

### D14. Body font-size in `px` (CSS)
**Rule.** `html { font-size: 100%; }` or omit entirely. Set body in `rem`.
**Reason.** Pixels override the user's chosen browser default — accessibility violation.
```css
/* wrong */ html { font-size: 14px; }
/* right */ html { font-size: 100%; } body { font-size: 1rem; }
```

### D15. `outline: none` without replacement (CSS)
**Rule.** If you remove the default outline, supply a `:focus-visible` style with ≥3:1 contrast and ≥2px thickness.
**Reason.** Hard a11y regression — keyboard users lose all focus indication.
```css
/* wrong */ button:focus { outline: none; }
/* right */ button:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
```

### D16. Pretty buttons missing semantics (both)
**Rule.** A styled `<div>` that acts like a button needs `role="button"`, `tabindex="0"`, key handlers, and a focus ring — or just use `<button>`.
**Reason.** Screen readers, keyboard users, tabbing.
```html
<!-- wrong --> <div class="btn" onclick="...">Save</div>
<!-- right --> <button class="btn" type="button">Save</button>
```

### D17. Wrong input type for non-numeric data
**Rule.** Don't use `<input type="number">` for postal codes, OTP, phone, credit-card. Use `inputmode="numeric"` + `pattern`.
**Reason.** `type="number"` adds spinners, blocks leading zeros, breaks paste, known a11y/UX pitfall.
```html
<!-- wrong --> <input type="number" name="otp">
<!-- right --> <input type="text" inputmode="numeric" pattern="[0-9]*" name="otp">
```

### D18. Parameterless `@include` (SASS)
**Rule.** If a mixin takes no args and emits a fixed block, just write a class.
**Reason.** Mixin without parameters duplicates output across every use site — a class is one rule shared.
```scss
/* wrong */ @mixin btn-primary { background: var(--brand); color: white; }
        .a { @include btn-primary; } .b { @include btn-primary; }
/* right */ .btn-primary { background: var(--brand); color: white; }
```

### D19. Color without paired background (CSS)
**Rule.** When you set `color`, also consider the `background` it sits on (especially under dark mode). Test contrast.
**Reason.** Light-on-light or dark-on-dark slips through when only one half is themed.

### D20. CSS-only modal/menu state (CSS)
**Rule.** Don't fake `:focus-within` or `:checked`-hack modals/menus/tooltips. Use `<dialog>`, popover API, or a tested JS pattern.
**Reason.** Misses focus trapping, ESC-to-close, scrim, ARIA state — all standard requirements.
```html
<!-- wrong --> <input type="checkbox" id="modal-toggle"> ... :checked + .modal { ... }
<!-- right --> <dialog id="modal"> ... </dialog>
        <script>document.getElementById('modal').showModal()</script>
```

### D21. Tag selectors as base styling (both)
**Rule.** Style tags only in reset/base layers (`:where(p) { ... }`). Components key off classes.
**Reason.** Bare `p { margin: 0; }` in a component file leaks across the app.

### D22. Shorthand resets that nuke sub-properties (both)
**Rule.** Don't write `background: red;` when you only want to change `background-color`.
**Reason.** Shorthand resets `background-image`, `-position`, etc. — surprise wipes of inherited or earlier-set sub-properties.
```css
/* wrong */ .card:hover { background: var(--bg-hover); }   /* clears any image */
/* right */ .card:hover { background-color: var(--bg-hover); }
```

### D23. Animations without `prefers-reduced-motion` guard (CSS)
**Rule.** Any non-essential transition/animation must be wrapped in a `prefers-reduced-motion` check (see A22).
**Reason.** WCAG 2.3.3 / vestibular-disorder users.

---

## Sources

- [Sass: @import is Deprecated](https://sass-lang.com/blog/import-is-deprecated/), [Breaking changes](https://sass-lang.com/documentation/breaking-changes/import/)
- [CSS-Tricks Sass Style Guide](https://css-tricks.com/sass-style-guide/) (nesting depth, `@extend` consensus)
- [Andy Bell — A (more) Modern CSS Reset](https://piccalil.li/blog/a-more-modern-css-reset/), [CUBE CSS](https://cube.fyi/)
- [Josh Comeau — CSS Reset](https://www.joshwcomeau.com/css/custom-css-reset/)
- [Evil Martians — OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)
- [CSS-Tricks — `:where()` as a CSS Reset](https://css-tricks.com/using-the-specificity-of-where-as-a-css-reset/)
- [Chrome for Developers — View Transitions 2025](https://developer.chrome.com/blog/view-transitions-in-2025)
- [OddBird — Anchor Positioning Updates Fall 2025](https://www.oddbird.net/2025/10/13/anchor-position-area-update/)
- [InfoQ — Interop 2025 key features](https://www.infoq.com/news/2025/04/interop-2025-key-features/)
- [Dave Rupert — Modern alternatives to BEM](https://daverupert.com/2022/08/modern-alternatives-to-bem/)
