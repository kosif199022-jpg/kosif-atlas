# Rendering Strategies in Angular

Source: https://v20.angular.dev/guide/routing/rendering-strategies

Rendering strategies determine when and where Angular generates HTML. Each has trade-offs in initial performance, interactivity, SEO, and server resource usage.

---

## The Three Strategies

### Client-Side Rendering (CSR) — Default

Content renders entirely in the browser after JavaScript loads.

**Good for:** Interactive dashboards, real-time apps, internal tools, complex client-side state, apps where SEO doesn't matter.

**Avoid for:** Public content needing SEO, pages where initial load performance is critical.

| Aspect | Impact |
|--------|--------|
| SEO | Poor — crawlers see empty page until JS executes |
| Initial load | Slower — must download + execute JS first |
| Interactivity | Immediate once loaded |
| Server needs | Minimal |
| Complexity | Simplest — works with minimum config |

---

### Static Site Generation (SSG / Prerendering)

Pages are pre-rendered to static HTML at **build time**. Server sends pre-built HTML; after hydration, the app behaves like a normal SPA.

**Good for:** Marketing pages, blog posts, docs, product catalogs with stable content.

**Avoid for:** User-specific content, frequently changing data, real-time information.

| Aspect | Impact |
|--------|--------|
| SEO | Excellent — full HTML immediately |
| Initial load | Fastest — pre-generated HTML |
| Interactivity | After hydration completes |
| Server needs | None (CDN-friendly) |
| Build time | Longer — generates all pages upfront |
| Content updates | Requires rebuild and redeploy |

📖 See: [Customizing build-time prerendering (SSG)](guide/ssr#customizing-build-time-prerendering-ssg)

---

### Server-Side Rendering (SSR)

HTML is generated on the server **per request**. After hydration, app runs as SPA for subsequent navigation.

**Good for:** E-commerce product pages, news sites, personalized/frequently changing content.

**Avoid for:** Static content (use SSG), when server costs are a concern.

| Aspect | Impact |
|--------|--------|
| SEO | Excellent — full HTML for crawlers |
| Initial load | Fast — immediate content visibility |
| Interactivity | Delayed until hydration |
| Server needs | Requires server |
| Personalization | Full access to user context |
| Server costs | Higher — renders per initial request |

📖 See: [Server routing](guide/ssr#server-routing), [Authoring server-compatible components](guide/ssr#authoring-server-compatible-components)

---

## Decision Matrix

| Need | Strategy | Why |
|------|----------|-----|
| SEO + Static content | SSG | Pre-rendered HTML, fastest load |
| SEO + Dynamic content | SSR | Fresh content on each request |
| No SEO + Interactivity | CSR | Simplest, no server needed |
| Mixed requirements | Hybrid | Different strategies per route |

---

## Hydration (Making SSR/SSG Interactive)

Angular "hydrates" server-rendered HTML to make it interactive.

Available hydration strategies:
- **Full hydration** — entire app at once (default)
- **Incremental hydration** — parts become interactive as needed (better perf, uses `@defer`)
- **Event replay** — captures clicks before hydration completes

📖 See: [Hydration guide](guide/hydration), [Incremental hydration](guide/incremental-hydration)
