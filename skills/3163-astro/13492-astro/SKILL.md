---
name: astro
description: Skill for building with the Astro web framework (v6 and v7). Covers component authoring, islands architecture (client and server islands), content collections with loaders, actions, sessions, view transitions, middleware, on-demand rendering (SSR), adapters, and project configuration. Use when the user works with Astro, mentions .astro files, asks about static site generation (SSG), islands architecture, content collections, server islands, actions, view transitions, deploying an Astro project, or upgrading Astro.
license: MIT
---

# Astro

Astro is the web framework for content-driven websites: server-first, static HTML by default, with opt-in interactive islands.

**Always consult the official docs for the latest API details.** Astro no longer publishes `llms.txt` files. Use the Astro Docs MCP server when it is configured (`claude mcp add --transport http "Astro docs" https://mcp.docs.astro.build/mcp`); otherwise fetch the relevant page under `https://docs.astro.build/en/`.

You already know Astro fundamentals — `.astro` component syntax, `client:*` directives, file-based routing, middleware, scoped styles. This skill covers what changed in v5 through v7 and the newer APIs you may know imperfectly. When unsure, fetch the docs above instead of guessing.

## Astro v7 Key Changes

- **Vite 8**
- **Rust compiler** is the only compiler: unclosed non-void tags are build errors, and invalid HTML is no longer auto-corrected
- **Sätteri** is the default Markdown pipeline; `@astrojs/markdown-remark` is no longer installed by default, so remark/rehype plugins must be ported or opted back in
- `compressHTML: 'jsx'` is the default whitespace handling
- `src/fetch.ts` is a reserved file name
- **`@astrojs/db` removed**; use `node:sqlite` or another database
- `TRANSITION_*` constants and `createAnimationScope()` removed from `astro:transitions`; the string event names still work
- Migration guide: `https://docs.astro.build/en/guides/upgrade-to/v7/`

## Astro v6 Key Changes

- **Node.js 22.12.0+** required (Node 18 and 20 dropped; odd-numbered versions not supported)
- **Vite 7** and **Zod 4** — Zod string validators moved to top-level: `z.email()` instead of `z.string().email()`; error messages use `error:` instead of `message:`
- **`import.meta.env`** values always inlined, never coerced — use `process.env` for server-only secrets
- **Images**: cropping by default when both `width` and `height` set; never upscales
- **Endpoints with file extensions** no longer accessible with trailing slash
- **Shiki 4** for syntax highlighting
- Upgrade with `npx @astrojs/upgrade`

## Rendering Model

All pages are pre-rendered (static) by default. On-demand rendering requires an adapter (`npx astro add node|vercel|netlify|cloudflare`) plus per-page opt-out:

```astro
---
export const prerender = false;
---
```

Or set `output: 'server'` in config to flip the default, then opt static pages back in with `export const prerender = true`.

## Server Islands

Defer server rendering of slow or personalized components without blocking the static page:

```astro
<Avatar server:defer>
  <GenericAvatar slot="fallback" />  <!-- shown while island loads -->
</Avatar>
```

Requires an adapter. Server islands can access cookies and sessions; props must be serializable. Use the `Referer` header to access the parent page URL from within a server island.

## Content Collections (Content Layer)

Collections are defined in `src/content.config.ts` with **loaders** (v5+ API — replaces the legacy `type: 'content'` folders):

```ts
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

- Built-in loaders: `glob()` (directory of md/mdx/markdoc/json/yaml/toml), `file()` (single data file). Custom loaders can pull from any source.
- Query with `getCollection()` / `getEntry()` from `astro:content`.
- **Live collections** fetch at request time instead of build time — define with a live loader, query with `getLiveCollection()` / `getLiveEntry()`.

## Actions

Type-safe server functions defined in `src/actions/index.ts` via `defineAction({ input, handler })`, called from the client as `actions.myAction(data)`.

- **Forms**: set `accept: 'form'` and use `method="POST"` with `action={actions.myAction}` for zero-JS submissions; handle server-side results with `Astro.getActionResult()`.
- **Security**: actions are public endpoints (`/_actions/<name>`) — always validate authorization in the handler.

## Sessions (v5.7+)

Server-side data storage across requests. Requires an adapter; Node, Cloudflare, and Netlify adapters configure a default storage driver automatically.

```astro
---
export const prerender = false;
const cart = await Astro.session?.get('cart');
await Astro.session?.set('cart', [...(cart || []), newItem]);
---
```

Available as `Astro.session` in components and `context.session` in endpoints/middleware/actions.

## View Transitions

The router component is `<ClientRouter />` from `astro:transitions` (renamed from `<ViewTransitions />` in v5):

- `transition:name` / `transition:animate` / `transition:persist` directives as before
- Programmatic navigation: `import { navigate } from 'astro:transitions/client'`
- `data-astro-reload` on a link forces full-page navigation
- Lifecycle events: `astro:before-preparation`, `astro:after-preparation`, `astro:before-swap`, `astro:after-swap`, `astro:page-load`

## Resources

- [Docs](https://docs.astro.build) · [Config Reference](https://docs.astro.build/en/reference/configuration-reference/) · [Upgrade guides](https://docs.astro.build/en/upgrade-astro/) · [Docs MCP server](https://github.com/withastro/docs-mcp)
