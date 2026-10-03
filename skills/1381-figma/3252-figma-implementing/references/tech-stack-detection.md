# Tech Stack Detection

## Detection Order

Run `scripts/detect-tech-stack.sh` first. It covers the common cases. Then supplement with manual inspection of:

1. `CLAUDE.md` — explicit project conventions
2. 2–3 existing component files — naming, exports, prop patterns
3. Styling config files — Tailwind config, theme file

## Framework Detection

| Signal | Framework |
|--------|-----------|
| `"next"` in deps | Next.js |
| `"react"` in deps (no next) | React |
| `"nuxt"` in deps | Nuxt 3 |
| `"vue"` in deps (no nuxt) | Vue 3 |
| `"@angular/core"` in deps | Angular |
| `"svelte"` in deps | Svelte |
| `"@remix-run/react"` in deps | Remix |
| `"@solidjs/core"` or `"solid-js"` | SolidJS |

**Next.js vs React implications:**
- Next.js: check if the project uses the App Router (`app/`) or Pages Router (`pages/`). App Router components are Server Components by default — add `"use client"` if the Figma component needs interactivity.
- Next.js with App Router: prefer `Image` from `next/image` over `<img>` for image nodes.

**Vue/Nuxt:**
- Check if using Vue 3 Composition API (`<script setup>`) or Options API by reading an existing component
- Prefer `<script setup>` if the project uses it

## TypeScript

| Signal | Meaning |
|--------|---------|
| `"typescript"` in devDependencies | TypeScript project |
| `tsconfig.json` exists | TypeScript project |
| Component files are `.tsx` / `.ts` | TypeScript |
| `"strict": true` in tsconfig | Use strict-compatible types (no `any`) |

When TypeScript is present:
- Define a named `Props` interface (or `type Props`) above the component
- Export the interface if the project does (check existing components)
- Use `React.FC<Props>` or function signature style, matching existing components

## Styling

### Tailwind CSS

Signal: `"tailwindcss"` in deps.

Check `tailwind.config.ts` (or `.js`) for:
- `theme.extend.colors` — custom color tokens
- `theme.extend.spacing` — custom spacing scale
- `theme.extend.fontFamily` — custom font stacks

Map Figma values to the nearest Tailwind class. For values outside the default scale, use arbitrary values: `w-[342px]`, `text-[13px]`.

**Component library hint:** If `@shadcn/ui`, `@headlessui/react`, or `@radix-ui/*` are in deps, the project uses a component library. Check if the design maps to an existing library primitive before creating a new component from scratch.

### styled-components / Emotion

Signal: `"styled-components"` or `"@emotion/react"` / `"@emotion/styled"` in deps.

Check for a theme provider:
- `ThemeProvider` usage in `_app.tsx`, `layout.tsx`, or `main.tsx`
- A `theme.ts` or `tokens.ts` file with a typed theme object

Map Figma values to theme tokens: `color: ${({ theme }) => theme.colors.primary}`. Use literal values only when no matching token exists.

### CSS Modules

Signal: `.module.css` or `.module.scss` files alongside component files.

Generate a `ComponentName.module.css` (or `.scss`) alongside the component. Use camelCase class names matching the project's existing modules.

### Plain CSS / SCSS

Signal: `.css` or `.scss` imports in components, no modules.

Generate a separate stylesheet. Use BEM naming if the project does (`.block__element--modifier`), otherwise match the project's class naming convention.

## Convention Sampling from Existing Components

Read 2–3 component files and note:

| Pattern | What to look for |
|---------|-----------------|
| Export style | `export default function Foo` vs `export const Foo = () =>` vs `export { Foo }` |
| Props interface | `interface FooProps` vs `type FooProps` vs inline |
| File naming | `Button.tsx` vs `button.tsx` vs `ButtonComponent.tsx` |
| Directory structure | Flat `components/` vs nested `components/Button/Button.tsx` vs `components/Button/index.tsx` |
| Storybook | `.stories.tsx` present → create one if the project uses it |

Mirror these patterns exactly in the new component.

## CLAUDE.md

Read `CLAUDE.md` from the project root. Look for sections on:
- Component structure or file naming
- Styling rules or forbidden patterns
- Imports (`@/` alias, barrel files, etc.)
- Testing requirements (if the project requires tests for new components)

If `CLAUDE.md` contains explicit component conventions, they override all inferred patterns.

## Design Token File Mapping

When `detect-tech-stack.sh` finds a token file, read it and build a lookup:

```
Figma value  →  token name
#2E85E8      →  colors.primary (if theme.colors.primary === "#2E85E8")
16px         →  spacing.4 (if spacing.4 === 16)
```

For near-matches (within ±2px for spacing, within ±5% for color), use the token and note the approximation. For distant mismatches, use a literal value.
