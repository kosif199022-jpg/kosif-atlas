# Astro 4 / 5 / 6 — code-craft reference

~55 rules across three buckets. Astro-framework-specific only — UI-framework rules (Svelte/React/Vue) live in their own files; touched here only at the islands/hydration boundary. Assumes Astro 4.x → 5.x with Server Islands, Actions (4.15+), the Content Layer, `astro:env`, and View Transitions.

Sources: [docs.astro.build](https://docs.astro.build) (latest 2025), [Astro 5.0 release notes](https://astro.build/blog/astro-5/), [Astro 4.15 — Astro Actions](https://astro.build/blog/astro-4150/), [Server Islands launch](https://astro.build/blog/future-of-astro-server-islands/), [Content Layer announcement](https://astro.build/blog/content-layer-deep-dive/), Matthew Phillips and Fred Schott talks (2024–2025).

Loaded by `code-craft` when the user asks about Astro or pastes Astro code for review.

---

## A — Tactical (day-to-day patterns)

### A1. Project layout is convention
**Rule.** Keep routes in `src/pages/`, shared UI in `src/components/`, shells in `src/layouts/`, content in `src/content/`, request hooks in `src/middleware.ts`, config in `astro.config.mjs`.
**Reason.** Astro's compiler and integrations key off these paths; moving `pages/` or `content/` breaks routing and Content Collections silently.
```
src/
  pages/         ← .astro / .md / .mdx → routes
  layouts/       ← shells (not routes)
  components/    ← reusable UI
  content/       ← collections (or src/content.config.ts in 5.x)
  middleware.ts
astro.config.mjs
```

### A2. File-based routing with `.astro` and `.mdx`
**Rule.** Any `.astro`, `.md`, or `.mdx` file in `src/pages/` becomes a route at its path.
**Reason.** Astro's router is filesystem-driven; no `routes.ts` to maintain.
```
src/pages/index.astro       → /
src/pages/about.astro       → /about
src/pages/blog/[slug].astro → /blog/:slug
```

### A3. Dynamic and rest segments
**Rule.** Use `[param].astro` for one segment, `[...rest].astro` for catch-all.
**Reason.** Both forms must pair with `getStaticPaths()` in static mode, or run on demand in SSR mode.
```
src/pages/blog/[slug].astro    → /blog/hello
src/pages/docs/[...path].astro → /docs/a/b/c
```

### A4. `getStaticPaths` returns the full path set
**Rule.** Export `getStaticPaths()` from any dynamic page to declare every URL to prebuild, and pass `props` for per-page data.
**Reason.** In `output: 'static'` (default), missing paths 404 at build; `props` avoids re-fetching in the page body.
```astro
---
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(p => ({ params: { slug: p.id }, props: { post: p } }));
}
const { post } = Astro.props;
---
```

### A5. Frontmatter runs server-side
**Rule.** Treat the `---` block as server-only — at build for SSG, per-request for SSR — and use `Astro.props`, `Astro.params`, `Astro.url`, `Astro.cookies`, `Astro.request` only there.
**Reason.** The frontmatter never ships to the browser; client-only APIs (`window`, `document`) crash there.
```astro
---
const { id } = Astro.params;
const user = await db.user.findUnique({ where: { id } });
---
<h1>{user.name}</h1>
```

### A6. JSX-like template, but with `class`
**Rule.** Use `{expr}` for interpolation, `&&` / ternary for conditionals, `.map(...)` for lists, and `class` (not `className`).
**Reason.** Astro's template is HTML-first, not React — `className` silently emits an attribute named `className` and breaks styling.
```astro
{items.length > 0 && (
  <ul>{items.map(i => <li class="row">{i.name}</li>)}</ul>
)}
```

### A7. `class:list` for conditional classes
**Rule.** Build conditional class strings with `class:list={['base', cond && 'active', { error: hasError }]}`.
**Reason.** Built-in directive handles arrays, falsy values, and object maps without `clsx`/`classnames`.
```astro
<div class:list={['btn', isPrimary && 'btn-primary', { disabled: loading }]} />
```

### A8. Default and named slots
**Rule.** Expose extension points with `<slot />` (default) and `<slot name="header" />`; consumers pass via `slot="header"`.
**Reason.** Slots are how Astro composes — there's no `children` prop in `.astro` components.
```astro
<!-- Card.astro -->
<article><slot name="header"/><slot/></article>
<!-- usage -->
<Card><h2 slot="header">Title</h2><p>Body</p></Card>
```

### A9. Layouts pass props through frontmatter
**Rule.** Define a layout with `<slot/>`, accept props in its frontmatter, wrap pages with `<Layout title="…">…</Layout>`.
**Reason.** Layouts are just components — the only special thing is they typically render `<html>`/`<head>`.
```astro
---
// Layout.astro
const { title } = Astro.props;
---
<html><head><title>{title}</title></head><body><slot/></body></html>
```

### A10. `<style>` is scoped by default
**Rule.** Use plain `<style>` for component-local styles; `<style is:global>` only for site-wide rules; `<style is:inline>` only when you need the CSS inlined verbatim.
**Reason.** Astro hashes class names per component to prevent cross-component leakage; `is:global` opts out and pollutes the page.
```astro
<style>h1 { color: rebeccapurple; }</style>          <!-- scoped -->
<style is:global>:root { --bg: #fff; }</style>        <!-- global -->
```

### A11. Hydration directives on framework islands
**Rule.** Pick the lightest-weight `client:` directive that ships JS only when needed: `client:load`, `client:idle`, `client:visible`, `client:media="…"`, `client:only="react|svelte|vue"`.
**Reason.** Each directive is a different cost/UX tradeoff; default to `client:visible` for below-fold and `client:idle` for non-critical interactivity.
```astro
<Counter client:visible />
<ChatWidget client:idle />
<Modal client:only="react" />
```

### A12. Asset imports return metadata
**Rule.** `import logo from '../assets/logo.svg'` returns `{ src, width, height, format }` — pass it to `<Image>` or use `logo.src`.
**Reason.** Astro fingerprints and processes the asset; using the bare path skips optimization.
```astro
---
import logo from '../assets/logo.svg';
import { Image } from 'astro:assets';
---
<Image src={logo} alt="Logo" />
```

### A13. `<Image>` for raster, with width/height/alt
**Rule.** Import `Image` from `astro:assets` and always provide `width`, `height`, `alt`, plus `loading` and `decoding` when relevant.
**Reason.** Triggers AVIF/WebP transcoding, prevents CLS, and sets accessibility defaults.
```astro
---
import { Image } from 'astro:assets';
import hero from '../assets/hero.jpg';
---
<Image src={hero} width={1200} height={600} alt="Hero" loading="eager" decoding="async" />
```

### A14. Configure remote image hosts
**Rule.** Allow remote images via `image.domains` or `image.remotePatterns` in `astro.config.mjs` — `<Image>` blocks unknown hosts.
**Reason.** Prevents accidentally proxying arbitrary URLs through the build.
```js
// astro.config.mjs
export default defineConfig({
  image: { domains: ['cdn.example.com'], remotePatterns: [{ protocol: 'https' }] },
});
```

### A15. Content Collections live in `src/content/`
**Rule.** Put each collection in `src/content/<name>/` and define schemas in `src/content.config.ts` (Astro 5) or `src/content/config.ts` (4.x).
**Reason.** `getCollection()` and `getEntry()` return typed data only when a Zod schema is registered.
```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro:loaders';
export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
    schema: z.object({ title: z.string(), date: z.date(), draft: z.boolean().default(false) }),
  }),
};
```

### A16. `getCollection` and `getEntry` over raw imports
**Rule.** Read content via `getCollection('blog', filterFn)` and `getEntry('blog', slug)`; don't `import.meta.glob` it.
**Reason.** These return validated, typed entries and integrate with the Content Layer.
```ts
const posts = await getCollection('blog', ({ data }) => !data.draft);
const post  = await getEntry('blog', 'hello-world');
```

### A17. Render Markdown/MDX with `render(entry)`
**Rule.** Use `const { Content, headings } = await render(entry)` and place `<Content />` in your template.
**Reason.** Returns the compiled component plus extracted headings (TOC) and remark plugin output.
```astro
---
import { getEntry, render } from 'astro:content';
const post = await getEntry('blog', Astro.params.slug);
const { Content, headings } = await render(post);
---
<Content />
```

### A18. API routes export HTTP verb functions
**Rule.** Files in `src/pages/api/*.ts` export `GET`, `POST`, `PUT`, `DELETE` async functions returning a `Response`.
**Reason.** Astro's endpoint contract is the Web Fetch API — no Express-style `res.json()`.
```ts
// src/pages/api/users.ts
export const GET: APIRoute = async ({ request }) => {
  return Response.json({ users: [] });
};
```

### A19. Output mode picks the runtime
**Rule.** Default `output: 'static'` for SSG sites; `output: 'server'` when most pages are SSR; mix per-page with `export const prerender`.
**Reason.** The mode controls what the build produces — adapter, dynamic APIs, and caching all flow from it.
```js
// astro.config.mjs
export default defineConfig({ output: 'server', adapter: vercel() });
```

### A20. Per-page `prerender` overrides site mode
**Rule.** Set `export const prerender = true` (in an SSR site) or `false` (in a static site) to opt that single page in/out.
**Reason.** Lets a static site keep one dynamic API route, or an SSR site bake static marketing pages.
```astro
---
export const prerender = false; // SSR this page even though site is static
---
```

### A21. One adapter for SSR
**Rule.** Pick exactly one of `@astrojs/vercel`, `@astrojs/netlify`, `@astrojs/cloudflare`, `@astrojs/node` and add it via `adapter: …` in config.
**Reason.** The adapter wires the build output to the host's request/response shape; missing adapter + `output: 'server'` fails to build.
```js
import vercel from '@astrojs/vercel';
export default defineConfig({ output: 'server', adapter: vercel() });
```

### A22. Integrations register in `integrations: [...]`
**Rule.** Add UI frameworks (Svelte/React/Vue/Solid/Preact/Lit), MDX, sitemap, Tailwind, and Partytown via the `integrations` array.
**Reason.** Integrations hook the compiler — `import` alone won't enable JSX or `<Component client:*/>`.
```js
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';
export default defineConfig({ integrations: [svelte(), mdx()] });
```

### A23. Middleware exports `onRequest`
**Rule.** Put cross-cutting request work in `src/middleware.ts` exporting `onRequest({ request, locals, cookies }, next)`; populate `locals` for typed downstream access.
**Reason.** One place for auth, locale detection, and request-scoped data — runs before every page and endpoint.
```ts
export const onRequest = defineMiddleware(async (ctx, next) => {
  ctx.locals.user = await getUser(ctx.cookies.get('sid')?.value);
  return next();
});
```

### A24. Cookies via `Astro.cookies`
**Rule.** Read/write with `Astro.cookies.get('k')`, `.set('k', v, opts)`, `.delete('k')`; only effective in SSR or non-prerendered routes.
**Reason.** Static-prerendered pages have no response to attach `Set-Cookie` to — calls are silently dropped.
```astro
---
const sid = Astro.cookies.get('sid')?.value;
Astro.cookies.set('seen', '1', { path: '/', httpOnly: true });
---
```

### A25. Redirects: dynamic vs static
**Rule.** Use `return Astro.redirect('/login', 302)` from frontmatter for runtime redirects; declare permanent ones in `redirects: { '/old': '/new' }`.
**Reason.** Static redirects are baked at build (free, fast); `Astro.redirect` requires SSR or a non-prerendered page.
```js
// astro.config.mjs
export default defineConfig({ redirects: { '/old-blog/[slug]': '/blog/[slug]' } });
```

### A26. View Transitions via `<ClientRouter />`
**Rule.** Add `<ClientRouter />` (renamed from `<ViewTransitions />` in 5.x) from `astro:transitions` in your layout `<head>`; annotate elements with `transition:name`, `transition:animate`, `transition:persist`.
**Reason.** Enables SPA-style cross-page morph animations without a client framework.
```astro
---
import { ClientRouter } from 'astro:transitions';
---
<head><ClientRouter /></head>
<img transition:name="hero" src="/hero.jpg" />
```

### A27. Type-safe env with `astro:env`
**Rule.** Declare every env var in `astro.config.mjs` `env.schema`, then import from `astro:env/server` or `astro:env/client`.
**Reason.** Compile-time type safety, runtime validation, and clear server/client/secret boundary.
```js
// astro.config.mjs
env: { schema: { DB_URL: envField.string({ context: 'server', access: 'secret' }) } }
```
```ts
import { DB_URL } from 'astro:env/server';
```

---

## B — Modern Astro idioms (4.15 / 5.x)

### B1. Server Islands for personalized fragments
**Rule.** Use `<Component server:defer fallback={<Skeleton/>} />` to render a server-side island after the static shell streams.
**Reason.** Cache the page on a CDN while still personalizing per-user holes (cart count, greeting) — the gap that PPR-style architectures fill.
```astro
<Avatar server:defer>
  <GenericAvatar slot="fallback" />
</Avatar>
```
Source: [Astro 5.0 release notes — Server Islands](https://astro.build/blog/astro-5/).

### B2. Astro Actions for typed mutations
**Rule.** Define server functions in `src/actions/index.ts` via `defineAction({ accept, input, handler })`; call from the client through `actions.foo({...})`.
**Reason.** Type-safe form/RPC pipeline with built-in Zod validation and progressive enhancement — no manual fetch boilerplate.
```ts
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
export const server = {
  createPost: defineAction({
    accept: 'form',
    input: z.object({ title: z.string().min(1) }),
    handler: async ({ title }, ctx) => db.post.create({ data: { title } }),
  }),
};
```
Source: [Astro 4.15 release notes](https://astro.build/blog/astro-4150/).

### B3. Forms call actions natively
**Rule.** Bind `<form action={actions.createPost}>` (or `method="POST"` + `action={actions.createPost.toString()}`); read result with `Astro.getActionResult(actions.createPost)`.
**Reason.** Progressive enhancement — works without JS, returns typed result for in-page render.
```astro
---
const result = Astro.getActionResult(actions.createPost);
---
<form method="POST" action={actions.createPost}>
  <input name="title" />
</form>
```

### B4. Type `Astro.locals` via `App.Locals`
**Rule.** Augment `App.Locals` in `src/env.d.ts` so middleware-injected values are typed everywhere.
**Reason.** Without it `Astro.locals.user` is `any` and breaks cascade type safety.
```ts
// src/env.d.ts
declare namespace App {
  interface Locals { user: { id: string; email: string } | null }
}
```

### B5. `astro:env` access modifiers
**Rule.** Use `envField.string({ context, access })` with `context: 'server' | 'client'` and `access: 'public' | 'secret'`; never put secrets behind `client`.
**Reason.** The compiler enforces the boundary — `secret` vars are rejected if imported from `astro:env/client`.
```js
env: { schema: {
  PUBLIC_SITE_NAME: envField.string({ context: 'client', access: 'public' }),
  STRIPE_SECRET:    envField.string({ context: 'server', access: 'secret' }),
}}
```

### B6. Content Layer loads from anywhere
**Rule.** Beyond the filesystem, load content via custom loaders (CMS, RSS, DB) returning `{ id, data }` records into a collection.
**Reason.** Content Collections are no longer file-bound (Astro 5) — same `getCollection` API, any source.
```ts
defineCollection({
  loader: async () => (await fetch('https://api.cms.dev/posts').then(r => r.json()))
    .map(p => ({ id: p.slug, ...p })),
  schema: z.object({ title: z.string() }),
});
```
Source: [Content Layer deep dive](https://astro.build/blog/content-layer-deep-dive/).

### B7. Built-in `glob()` and `file()` loaders
**Rule.** Prefer the built-in `glob({ pattern, base })` and `file('path.json')` loaders for filesystem content.
**Reason.** Faster than `import.meta.glob`, integrate with the Content Layer cache, and survive incremental builds.
```ts
import { glob, file } from 'astro:loaders';
loader: glob({ pattern: '**/*.mdx', base: './src/content/docs' }),
```

### B8. Filter collections with typed predicates
**Rule.** Pass a filter to `getCollection('blog', ({ data }) => !data.draft && data.lang === 'en')`.
**Reason.** Runs at build, narrows the typed list; cheaper than fetching all and filtering client-side.
```ts
const en = await getCollection('blog', ({ data }) => data.lang === 'en');
```

### B9. Responsive images with `densities` / `widths`
**Rule.** Use `<Image src={img} widths={[400, 800, 1200]} sizes="(max-width: 600px) 400px, 1200px" />` or `densities={[1, 2]}` for srcset variants.
**Reason.** Generates a proper responsive `srcset` so mobile devices don't download the desktop image.
```astro
<Image src={hero} widths={[480, 960, 1440]} sizes="(max-width: 768px) 100vw, 50vw" alt="" />
```

### B10. `getImage()` for advanced cases
**Rule.** When you need the optimized URL outside `<Image>` (OG tags, custom `<picture>`), call `await getImage({ src, width, format })`.
**Reason.** Same pipeline as the component but returns metadata for hand-rolled markup.
```ts
import { getImage } from 'astro:assets';
const og = await getImage({ src, width: 1200, format: 'png' });
```

### B11. Tailwind v4 via Vite plugin
**Rule.** On Tailwind v4, use `@tailwindcss/vite` in `vite.plugins` instead of the legacy `@astrojs/tailwind` integration.
**Reason.** v4 is config-less and uses the Vite plugin directly; the old integration is v3-only.
```js
import tailwind from '@tailwindcss/vite';
export default defineConfig({ vite: { plugins: [tailwind()] } });
```
Source: [Tailwind v4 announcement](https://tailwindcss.com/blog/tailwindcss-v4).

### B12. Push hydration to the leaf
**Rule.** Mount `client:*` on the smallest interactive component, not its wrapper.
**Reason.** Anything inside a hydrated island ships in the JS bundle — keep statics outside.
```astro
<!-- right -->
<Sidebar><LiveSearch client:idle /></Sidebar>
<!-- wrong -->
<Sidebar client:idle><LiveSearch /></Sidebar>
```

### B13. `client:only` for browser-only libs
**Rule.** Use `client:only="react"` for components that touch `window`/`document` at module scope (analytics widgets, charts, maps).
**Reason.** Skips SSR entirely so they don't crash the build; the framework name tells Astro which renderer to load.
```astro
<HeatMap client:only="react" />
```

### B14. `client:visible` for below-fold
**Rule.** Default below-the-fold widgets to `client:visible` so JS loads only when the user scrolls.
**Reason.** Saves bytes on initial load and avoids CPU contention on hot paths.
```astro
<CommentSection client:visible />
```

### B15. Mix static and on-demand in static mode
**Rule.** Keep `output: 'static'` and add `export const prerender = false` only on the few endpoints that need runtime — webhooks, search APIs, contact forms.
**Reason.** You get SSG-fast pages plus targeted dynamic routes without flipping the whole site to SSR.
```ts
// src/pages/api/contact.ts
export const prerender = false;
export const POST: APIRoute = async ({ request }) => { /* … */ };
```

### B16. Persist UI across transitions
**Rule.** Annotate elements that must survive nav with `transition:persist` (and a name when matching across pages).
**Reason.** Audio players, video elements, and theme toggles otherwise reset between routes.
```astro
<audio transition:persist="player" controls src="/song.mp3" />
```

### B17. `astro check` in CI
**Rule.** Run `astro check` (TypeScript + Astro + content schemas) as a pre-merge gate.
**Reason.** Catches missing collection fields, bad component props, and stale `App.Locals` at PR time, not at deploy.
```json
{ "scripts": { "typecheck": "astro check" } }
```

### B18. Sitemap from `site` URL
**Rule.** Set `site: 'https://example.com'` in `astro.config.mjs` and add `@astrojs/sitemap` to `integrations`.
**Reason.** Sitemap and absolute URLs (canonical, OG) need a single source of truth — relative URLs break crawlers.
```js
import sitemap from '@astrojs/sitemap';
export default defineConfig({ site: 'https://example.com', integrations: [sitemap()] });
```

### B19. First-party i18n with `i18n` config
**Rule.** Configure `i18n: { defaultLocale, locales, routing, fallback }` and read `Astro.preferredLocale` / `Astro.currentLocale` rather than parsing URLs by hand.
**Reason.** Built-in helpers handle locale routing, fallbacks, and `Accept-Language` so links don't drift.
```js
i18n: { defaultLocale: 'en', locales: ['en', 'fr'], routing: { prefixDefaultLocale: false } }
```

### B20. MDX with custom components
**Rule.** Render MDX entries with `<Content components={{ h2: H2, a: SmartLink }} />` to override default tags.
**Reason.** Custom components let you wire design-system primitives without rewriting markdown.
```astro
---
const { Content } = await render(post);
import H2 from '../components/H2.astro';
---
<Content components={{ h2: H2 }} />
```

### B21. Dev Toolbar and check watch
**Rule.** Use the Astro Dev Toolbar (`astro dev`) for islands inspector and a11y audit; run `astro check --watch` alongside for live type errors.
**Reason.** Faster iteration than refreshing CI; the toolbar surfaces hydration boundaries you might've missed.
```bash
astro check --watch
```

### B22. Vitest for units, Playwright for e2e
**Rule.** Use Vitest for component logic and `import.meta.env.MODE`-aware code; Playwright for navigation, View Transitions, and SSR flows.
**Reason.** Astro components render synchronously enough for unit tests; transitions and streaming need a real browser.

### B23. Container API for component testing
**Rule.** Render `.astro` components in tests via `experimental_AstroContainer.create()` then `.renderToString(Component, { props })`.
**Reason.** Lets unit tests assert on rendered HTML without spinning up a dev server.
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
const c = await AstroContainer.create();
const html = await c.renderToString(Card, { props: { title: 'Hi' } });
```

---

## D — Anti-patterns / smells

### D1. `client:load` everywhere
**Rule.** Don't slap `client:load` on every interactive component "to be safe."
**Reason.** Defeats the islands model and ships a full JS bundle for things that could be `client:visible` or `client:idle`.
```astro
<!-- wrong --> <Counter client:load />
<!-- right --> <Counter client:visible />
```

### D2. Whole layout/page hydrated
**Rule.** Don't mark a layout, route shell, or large wrapper component `client:*`.
**Reason.** Everything inside hydrates too — your "static" site is now a full SPA bundle.
```astro
<!-- wrong --> <Layout client:load>…</Layout>
```

### D3. Megawidget islands
**Rule.** Don't import a giant React/Svelte tree into one island when only a piece is interactive.
**Reason.** The whole component tree ends up on the client. Split into a static Astro shell + small interactive leaf.

### D4. Server modules in client islands
**Rule.** Never import DB clients, file system, or secret-touching modules into a `client:*` component.
**Reason.** They'll be bundled to the browser, leaking server code and secrets.
```ts
// wrong: imported from <ClientWidget client:load />
import { db } from '../lib/db';
```

### D5. No `import 'server-only'` poison-pill
**Rule.** Add `import 'server-only'` at the top of any module that must never reach the client.
**Reason.** Build fails loudly the moment a client island imports it — much better than a silent secret leak.
```ts
// src/lib/db.ts
import 'server-only';
export const db = createClient(STRIPE_SECRET);
```

### D6. Heavy work in frontmatter
**Rule.** Don't run expensive scrapes, large file reads, or N+1 loops in the page frontmatter for SSR pages.
**Reason.** It runs on every request — move to a content loader or cached module.

### D7. Mixed modes without `prerender`
**Rule.** Don't leave `output: 'static'` while using `Astro.cookies.set`, `Astro.request.formData()`, or session reads on a page.
**Reason.** Static pages can't read request data — silently no-ops or builds error. Set `export const prerender = false` or switch site mode.

### D8. Hardcoded site URL
**Rule.** Don't hardcode `https://example.com` in canonical/OG tags; use `Astro.site`, `Astro.url.origin`, or `import.meta.env.SITE`.
**Reason.** Breaks preview deploys, environment splits, and locale subdomains.
```astro
<!-- wrong --> <link rel="canonical" href={`https://example.com${Astro.url.pathname}`} />
<!-- right --> <link rel="canonical" href={new URL(Astro.url.pathname, Astro.site)} />
```

### D9. `<img>` instead of `<Image>`
**Rule.** Don't use raw `<img src="…">` for raster assets you control.
**Reason.** No AVIF/WebP, no width/height, no lazy loading defaults — kills LCP and CLS.

### D10. Missing `image.domains` config
**Rule.** Don't try to render remote `<Image src="https://cdn…/x.jpg">` without listing the host in `image.domains` or `image.remotePatterns`.
**Reason.** Astro blocks unknown remote hosts at build/runtime. Add the domain explicitly.

### D11. Schema-less collections
**Rule.** Don't define a Content Collection without a Zod `schema`.
**Reason.** `getCollection()` returns `any`-shaped data; `data.draft` typos go undetected and ship broken pages.

### D12. Filter on undeclared field
**Rule.** Don't filter `getCollection('blog', ({ data }) => !data.draft)` if `draft` isn't in the schema.
**Reason.** TypeScript silently widens to `any` because the schema doesn't include the field — your filter is a no-op on undefined.

### D13. API route returning raw object
**Rule.** Don't `return { ok: true }` from an endpoint — return a `Response` (or `Response.json(x)`).
**Reason.** Astro endpoints follow the Web Fetch contract; bare objects produce `[object Object]` or build errors.
```ts
// wrong --> return { ok: true };
// right --> return Response.json({ ok: true });
```

### D14. Cookies set on prerendered page
**Rule.** Don't call `Astro.cookies.set(...)` on a page that's prerendered to static HTML.
**Reason.** No response object to attach `Set-Cookie` to — the call vanishes silently.

### D15. Per-request DB calls in middleware
**Rule.** Don't run a fresh DB lookup for every page in `onRequest` without caching.
**Reason.** Middleware fires on every navigation and asset request matching your config — quickly becomes the bottleneck.
```ts
// wrap with a per-request cache or a TTL cache keyed by session id
```

### D16. Untyped `Astro.locals`
**Rule.** Don't leave `App.Locals` as the default empty interface.
**Reason.** Every middleware-set value is `any`, and `Astro.locals.user.id` won't error when the property doesn't exist.

### D17. Server secrets imported in client island
**Rule.** Don't read `process.env.STRIPE_SECRET` (or `astro:env/server`) inside a `client:*` component.
**Reason.** Either the build fails or — worse with `process.env` — the secret gets inlined into the client bundle.

### D18. `client:only` state without a store
**Rule.** Don't expect `client:only` islands to read sibling island props or Astro page state directly.
**Reason.** They mount in isolation post-hydration; share state through nano-stores, signals, or URL/cookie, not props from another island.

### D19. View Transitions + DOM mutations
**Rule.** Don't directly mutate persisted DOM nodes during a transition.
**Reason.** The morph animation snapshots the DOM; raw mutations during the swap cause flicker and ARIA breakage. Use `astro:before-swap` / `astro:after-swap` hooks.

### D20. Forgot `output: 'server'` for actions
**Rule.** Don't ship Astro Actions with default `output: 'static'` and no `prerender = false` route handling them.
**Reason.** Actions need a runtime endpoint — static builds have no server to invoke.

### D21. Pointless `prerender = false`
**Rule.** Don't set `prerender = false` on pages that have no dynamic API, cookies, or per-request data.
**Reason.** You're paying SSR cost for a page that could've been baked at build.

### D22. DB calls in `getStaticPaths`
**Rule.** Don't rely on per-request DB lookups inside `getStaticPaths` for a catch-all route.
**Reason.** `getStaticPaths` runs only at build — the page won't update when content changes. Use SSR + `prerender = false`, ISR via adapter, or a content loader instead.

### D23. Unbounded `getStaticPaths`
**Rule.** Don't return every row of a table from `getStaticPaths` without limits or pagination.
**Reason.** Build time explodes; one million pages takes hours and balloons the deploy. Cap or shard.
```ts
const recent = await db.post.findMany({ take: 1000, orderBy: { date: 'desc' } });
```

### D24. Partytown for everything
**Rule.** Don't enable Partytown globally for all scripts.
**Reason.** Partytown is for known third-party scripts (GA, Segment) — proxying everything breaks site-owned scripts that need DOM access.

### D25. Inline `<script>` for trivial logic
**Rule.** Don't write multi-line inline `<script>` blocks for things that are really an Astro component or a UI-framework island.
**Reason.** Inline scripts become real JS modules per page; an Astro component is server-rendered and ships zero bytes.

### D26. Repeating global styles
**Rule.** Don't copy the same global block into multiple `<style is:global>` tags.
**Reason.** Duplicated CSS bloats every page; lift to a single global stylesheet imported in the layout.

### D27. `is:global` for component styles
**Rule.** Don't reach for `<style is:global>` to "make it work" when scoped styles aren't applying.
**Reason.** Global leaks across the site. The fix is targeting (`:global(...)`) or restructuring, not opt-out.

### D28. MDX islands without explicit hydration
**Rule.** Don't drop a UI-framework component into MDX expecting it to be interactive without `client:*`.
**Reason.** MDX components default to SSR-only — no `client:` directive means no JS, dead onClicks.
```mdx
<Counter client:visible />
```

### D29. View Transitions for single-section morphs
**Rule.** Don't enable site-wide `<ClientRouter />` just to animate one widget.
**Reason.** It rewrites all navigation as transitions and adds gotchas (persisted state, race conditions). Use the View Transitions API directly on the element if scope is small.

### D30. Manual locale link rewriting
**Rule.** Don't hand-prefix `/fr/` / `/en/` on every internal link in a multilingual site.
**Reason.** Drifts immediately. Use `getRelativeLocaleUrl(locale, path)` from `astro:i18n` so config is the single source of truth.
```astro
import { getRelativeLocaleUrl } from 'astro:i18n';
<a href={getRelativeLocaleUrl('fr', '/about')}>À propos</a>
```

### D31. `import.meta.glob` over `getCollection`
**Rule.** Don't reach for `import.meta.glob('./content/**/*.md')` when you have a Content Collection.
**Reason.** No schema validation, no incremental cache, breaks on Content Layer migration.

### D32. Adapter mismatch with features
**Rule.** Don't ship `node` adapter when deploying to Cloudflare, or `cloudflare` when you need Node APIs.
**Reason.** Cloudflare runs Workers (no `fs`, no native modules); Node adapter won't deploy on edge platforms. Match adapter to host.

---

## Sources

- [Astro Docs — latest](https://docs.astro.build/)
- [Astro 5.0 release notes — Server Islands, Content Layer, `astro:env`](https://astro.build/blog/astro-5/)
- [Astro 4.15 — Astro Actions launch](https://astro.build/blog/astro-4150/)
- [Server Islands deep dive](https://astro.build/blog/future-of-astro-server-islands/)
- [Content Layer deep dive](https://astro.build/blog/content-layer-deep-dive/)
- [View Transitions guide](https://docs.astro.build/en/guides/view-transitions/)
- [Astro i18n docs](https://docs.astro.build/en/guides/internationalization/)
- [Tailwind v4 + Astro setup](https://docs.astro.build/en/guides/styling/#tailwind)
