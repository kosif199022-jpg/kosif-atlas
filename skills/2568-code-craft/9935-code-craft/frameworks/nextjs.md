# Next.js 14 / 15 — code-craft reference

~40 rules across three buckets. Next-specific only — React-general rules (Server Components, hooks) live in `frameworks/react.md`. Assumes App Router, Next 14.x → 15.x with Turbopack, async dynamic APIs, opt-in PPR / dynamicIO.

Sources: [nextjs.org/docs](https://nextjs.org/docs), [Next.js 15 release notes](https://nextjs.org/blog/next-15), Vercel blog, Lee Robinson talks, Dan Abramov on RSC.

Loaded by `code-craft` when the user asks about Next.js or pastes Next.js code for review.

---

## A — Tactical (day-to-day patterns)

### A1. File conventions are reserved
**Rule.** Use only the documented filenames inside `app/` for routing primitives.
**Reason.** `page`, `layout`, `loading`, `error`, `not-found`, `template`, `route`, `default` have hard-coded meanings; non-reserved files don't render.
```
// wrong: app/dashboard/index.tsx     (not a route)
// right: app/dashboard/page.tsx      (route at /dashboard)
```

### A2. Layouts persist, pages re-render
**Rule.** Put shared shells (nav, sidebar) in `layout.tsx`, route-specific content in `page.tsx`.
**Reason.** Layouts don't unmount across sibling navigations; pages do.
```
app/(shop)/layout.tsx       — persistent shell
app/(shop)/cart/page.tsx    — remounts on nav
```

### A3. Route groups for organization, not URLs
**Rule.** Use `(group)` folders to share layouts or co-locate without affecting the URL.
**Reason.** Parens segment is stripped from the path — for grouping only.
```
app/(marketing)/about/page.tsx   → /about
app/(app)/dashboard/page.tsx     → /dashboard
```

### A4. Parallel routes for independent slots
**Rule.** Use `@slot` folders when one URL renders multiple independent panels with their own loading/error states.
**Reason.** Slots stream independently and can have own `loading.tsx`. Always pair with `default.tsx` to avoid 404 on unmatched slots.
```
app/dashboard/@team/page.tsx
app/dashboard/@analytics/page.tsx
app/dashboard/layout.tsx  // accepts { children, team, analytics }
```

### A5. Intercepting routes for modals with deep links
**Rule.** Use `(.)`, `(..)`, `(...)` only when you need a route to render in a modal overlay while remaining shareable.
**Reason.** Standard navigation re-renders the page; intercepting renders the route inside an existing layout slot.
```
app/feed/photo/[id]/page.tsx           — full page on reload
app/feed/@modal/(.)photo/[id]/page.tsx — modal on in-app nav
```

### A6. `<Link>` for internal nav, never `<a>`
**Rule.** Use `next/link` for any same-origin navigation.
**Reason.** `<a>` triggers a full document load and skips prefetching, RSC payload diffing, and scroll restoration.
```tsx
// wrong
<a href="/about">About</a>
// right
<Link href="/about">About</Link>
```

### A7. Disable prefetch on giant or rare pages
**Rule.** Set `prefetch={false}` on `<Link>` to viewport-far pages with heavy RSC payloads.
**Reason.** Default viewport prefetching is great for hot paths, wasteful for the admin export page.
```tsx
<Link href="/admin/export" prefetch={false}>Export</Link>
```

### A8. `next/image` always (never `<img>`)
**Rule.** Use `next/image` with explicit `width`/`height` (or `fill` + sized parent) and configured `remotePatterns`.
**Reason.** Auto-optimization, lazy loading, CLS-safe sizing, AVIF/WebP. `<img>` ships unoptimized.
```tsx
// wrong
<img src="/hero.jpg" />
// right
<Image src="/hero.jpg" width={1200} height={600} priority alt="" />
```

### A9. `priority` on the LCP image only
**Rule.** Mark the above-the-fold hero image `priority`; nothing else.
**Reason.** Priority disables lazy loading and preloads — overusing it serializes downloads and hurts LCP.
```tsx
<Image src="/hero.jpg" priority ... />   // one per route
```

### A10. `next/font` with variable fonts
**Rule.** Load fonts via `next/font/google` or `next/font/local`; expose as a CSS variable.
**Reason.** Self-hosts at build, eliminates FOUT, no extra network request.
```tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
// <html className={inter.variable}>
```

### A11. Static `metadata` when possible
**Rule.** Export a static `metadata` object; use `generateMetadata` only when fields depend on params or data.
**Reason.** Static is computed at build; async functions add a server roundtrip.
```tsx
export const metadata = { title: 'About' };
// or, when dynamic:
export async function generateMetadata({ params }) {
  const post = await getPost((await params).slug);
  return { title: post.title };
}
```

### A12. `loading.tsx` is route-level Suspense
**Rule.** Add `loading.tsx` as a coarse fallback; use inline `<Suspense>` for finer streaming.
**Reason.** `loading.tsx` wraps the whole segment — fine-grained boundaries reveal content sooner.
```tsx
// app/products/page.tsx
<Suspense fallback={<Skeleton />}><ProductList /></Suspense>
```

### A13. `error.tsx` is a Client Component
**Rule.** Each `error.tsx` must be a Client Component and accept `{ error, reset }`.
**Reason.** Error boundaries need state and event handlers; the file convention requires `'use client'`.
```tsx
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <button onClick={reset}>Retry</button>;
}
```

### A14. `notFound()` and `redirect()` over manual responses
**Rule.** Throw `notFound()` to render `not-found.tsx`; call `redirect()` for nav.
**Reason.** They short-circuit rendering correctly through Suspense and streaming; `return null` does not.
```tsx
import { notFound, redirect } from 'next/navigation';
const post = await getPost(id);
if (!post) notFound();
if (!session) redirect('/login');
```

### A15. Pick one rendering strategy per route
**Rule.** Set the segment's intent explicitly via `export const dynamic`, `revalidate`, or `fetchCache` when defaults aren't right.
**Reason.** Mixing dynamic APIs (cookies, headers) with `force-static` is an instant build failure.
```tsx
// app/feed/page.tsx
export const dynamic = 'force-dynamic'; // every request
// or
export const revalidate = 60;           // ISR every 60s
```

### A16. `NEXT_PUBLIC_` only for non-secrets
**Rule.** Prefix env vars with `NEXT_PUBLIC_` only when they must reach the browser.
**Reason.** The prefix inlines values at build time into the client bundle — anyone can read them.
```env
DATABASE_URL=...                # server only
NEXT_PUBLIC_POSTHOG_KEY=phk_... # safe to expose
```

### A17. `await cookies()` / `await headers()` (Next 15)
**Rule.** Treat all dynamic request APIs as async: `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams`.
**Reason.** Next 15 made them Promises to enable PPR; sync access is deprecated and removed in 16.
```tsx
// wrong
const c = cookies();
// right
const c = await cookies();
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### A18. Cookies/headers only in server contexts
**Rule.** Call `cookies()`/`headers()` from Server Components, Server Actions, Route Handlers, or middleware — never module top-level.
**Reason.** They depend on a request scope; outside one, Next 15 throws.

---

## B — Next.js / modern idioms

### B1. Server Actions for mutations
**Rule.** Use `'use server'` async functions for writes; pass them to `<form action={...}>`.
**Reason.** Built-in CSRF protection, progressive enhancement, no manual fetch wiring.
```tsx
'use server';
export async function createTodo(formData: FormData) {
  await db.todo.create({ data: { title: formData.get('title') as string } });
  revalidatePath('/todos');
}
```

### B2. Re-check auth inside every Server Action
**Rule.** Verify session and authorization at the top of each action body.
**Reason.** Page-level auth doesn't protect actions — any authenticated user can call any exported action endpoint.
```tsx
'use server';
export async function deletePost(id: string) {
  const user = await requireUser();
  if (!(await canDelete(user, id))) throw new Error('forbidden');
  // …
}
```

### B3. Validate Server Action input with a schema
**Rule.** Parse `FormData` / args through Zod (or similar) before touching the DB.
**Reason.** Client validation is UX only; the action is a public POST endpoint.
```tsx
const Schema = z.object({ title: z.string().min(1).max(100) });
const data = Schema.parse({ title: formData.get('title') });
```

### B4. `revalidatePath` / `revalidateTag` after every mutation
**Rule.** Call one of them in the action that mutated data; otherwise the UI stays stale.
**Reason.** Server cache and Router cache won't refresh by themselves.
```tsx
await db.post.update(...);
revalidateTag(`post:${id}`);   // or revalidatePath('/posts');
```

### B5. `redirect()` outside try/catch
**Rule.** Place `redirect(...)` in the action body after the try/catch, never inside it.
**Reason.** `redirect` works by throwing a special error; a `catch` will swallow it.
```tsx
try { await doWork(); } catch (e) { return { error: '…' }; }
redirect('/done'); // ← here
```

### B6. Tag fetches you'll later invalidate
**Rule.** Add `next: { tags: [...] }` on fetches whose cache you plan to bust by tag.
**Reason.** `revalidateTag` only invalidates entries that opted into that tag.
```tsx
await fetch(url, { next: { tags: [`post:${id}`] } });
// later: revalidateTag(`post:${id}`);
```

### B7. Memoize per-request work with `cache()`
**Rule.** Wrap non-fetch data accessors (Prisma, ORM) in React's `cache()` so multiple components share one call.
**Reason.** `fetch` dedupes automatically; database calls don't.
```tsx
import { cache } from 'react';
export const getUser = cache(async (id: string) => db.user.findUnique({ where: { id } }));
```

### B8. `unstable_cache` for cross-request memoization
**Rule.** Use `unstable_cache` (or the newer `'use cache'`) when you want a result cached across requests with tags/TTL.
**Reason.** `cache()` is per-render; `unstable_cache` persists in the Data Cache.
```tsx
const getStats = unstable_cache(() => db.stats.find(), ['stats'], { revalidate: 60, tags: ['stats'] });
```

### B9. Be explicit about `fetch` cache (Next 15 default flipped)
**Rule.** State `cache: 'force-cache'`, `cache: 'no-store'`, or `next: { revalidate: N }` — don't rely on defaults.
**Reason.** Next 14 cached by default; Next 15 does not. Defaults silently flipped on upgrade.
```tsx
await fetch(url, { cache: 'force-cache' });        // static
await fetch(url, { next: { revalidate: 3600 } }); // ISR
await fetch(url, { cache: 'no-store' });           // dynamic
```

### B10. Opt into PPR per route
**Rule.** Enable `ppr: 'incremental'` in `next.config`, then `export const experimental_ppr = true` only on routes you've audited.
**Reason.** PPR pre-renders the static shell and streams dynamic holes. Wrong Suspense boundaries make everything dynamic.
```tsx
// app/product/[id]/page.tsx
export const experimental_ppr = true;
// dynamic parts must be wrapped in <Suspense>
```

### B11. Middleware does auth gating, nothing heavy
**Rule.** Use middleware for redirects, header rewrites, and JWT cookie checks; offload DB lookups to server components.
**Reason.** Edge runtime has a CPU budget, no Node APIs, no native crypto. Use `jose` for JWT, not `jsonwebtoken`.
```ts
// middleware.ts
export async function middleware(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));
}
export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
```

### B12. Always set a middleware `matcher`
**Rule.** Scope middleware to the routes that need it.
**Reason.** Without `matcher` it runs for every CSS, JS, image, and font request — 10–20× per page load.

### B13. Server Actions vs Route Handlers
**Rule.** Use Server Actions for in-app form mutations; use `route.ts` for public APIs, webhooks, and non-form clients.
**Reason.** Actions are bound to React form/transitions and aren't a stable URL contract; route handlers are.
```ts
// app/api/webhook/stripe/route.ts
export async function POST(req: Request) { /* verify signature, ack */ }
```

### B14. Stream with Suspense, don't block
**Rule.** Wrap slow data fetches in `<Suspense>` so the shell flushes immediately.
**Reason.** The whole page is held back to the slowest fetch otherwise.
```tsx
<Header />
<Suspense fallback={<Skeleton />}><Comments postId={id} /></Suspense>
```

### B15. i18n via sub-paths + middleware
**Rule.** For App Router, use `next-intl` (or similar) with `[locale]` segments; let middleware redirect to the user's locale.
**Reason.** The legacy `i18n` config in `next.config` only works in Pages Router.
```
app/[locale]/layout.tsx
app/[locale]/page.tsx
```

### B16. Sitemap, robots, manifest as code
**Rule.** Generate metadata files via `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts` exporting the right shape.
**Reason.** Build-time URLs, can be dynamic, and avoids drift from a static file in `public/`.
```ts
// app/sitemap.ts
export default async function sitemap() {
  const posts = await getPosts();
  return posts.map(p => ({ url: `${BASE}/blog/${p.slug}`, lastModified: p.updatedAt }));
}
```

### B17. Migrate to `app/`, don't mix unless needed
**Rule.** New code goes in `app/`; only keep `pages/` for legacy routes you haven't migrated.
**Reason.** Both routers can coexist, but `getServerSideProps`, `_app`, `_document`, and API routes don't translate — duplicate state and double rendering bugs are common.

---

## D — Anti-patterns / smells

### D1. `useEffect` + `fetch` for initial data
**Rule.** Don't fetch in a Client Component for data the server already has.
**Reason.** Make the parent a Server Component and `await` the data; pass it down as props.
```tsx
// wrong
'use client';
useEffect(() => { fetch('/api/me').then(...) }, []);
// right
async function Page() { const me = await getMe(); return <Profile me={me} />; }
```

### D2. `'use client'` at the route root
**Rule.** Don't declare the page or top layout as a Client Component.
**Reason.** Defeats RSC benefits — entire subtree ships to the browser. Keep `'use client'` at the smallest leaf.
```tsx
// wrong: app/dashboard/page.tsx with "use client" at top
// right: server page imports a small <Toolbar /> that is "use client"
```

### D3. Calling Server Actions from `useEffect`
**Rule.** Don't `useEffect(() => { myAction() }, [])` to run a mutation.
**Reason.** Trigger actions from `<form action>`, `<button formAction>`, or `useTransition` on a click.
```tsx
// wrong
useEffect(() => { saveDraft(); }, []);
// right
<form action={saveDraft}><button>Save</button></form>
```

### D4. Forgetting `revalidatePath` / `revalidateTag`
**Rule.** Always invalidate the affected path or tag in the same action that mutates.
**Reason.** Without invalidation the UI shows old data until full reload.
```tsx
await db.todo.delete({ where: { id } });
revalidatePath('/todos'); // ← do not skip
```

### D5. Porting `getServerSideProps` patterns
**Rule.** Don't wrap every page in a top-level data-fetching boilerplate.
**Reason.** `await` directly inside the async Server Component.
```tsx
// wrong
export const getServerSideProps = async () => ({ props: { data } });
// right
export default async function Page() { const data = await get(); /* … */ }
```

### D6. Secrets in `NEXT_PUBLIC_*`
**Rule.** Never prefix server-only secrets with `NEXT_PUBLIC_`.
**Reason.** They get inlined into the client bundle.
```env
# wrong
NEXT_PUBLIC_API_KEY=sk_live_...
# right
STRIPE_SECRET_KEY=sk_live_...
```

### D7. Wrong `'use client'` boundary
**Rule.** Don't mark a parent `'use client'` to enable one tiny interactive child.
**Reason.** Entire subtree ships to the browser. Push `'use client'` down to the leaf; pass server-rendered children in via props.
```tsx
// right
<ClientShell>{await renderServerStuff()}</ClientShell>
```

### D8. DB clients imported into client code
**Rule.** Never let `import { db } from '@/lib/db'` end up in a Client Component bundle.
**Reason.** Add `import 'server-only'` at the top of `lib/db.ts` so the build fails loudly.
```ts
// lib/db.ts
import 'server-only';
export const db = new PrismaClient();
```

### D9. `<a href="/...">` for internal links
**Rule.** Don't use anchor tags for in-app routes.
**Reason.** Full reload, no prefetch. Use `<Link>`. Keep `<a>` only for external URLs and downloads.

### D10. `<img>` instead of `next/image`
**Rule.** Don't ship hard-coded raw `<img>` tags.
**Reason.** No optimization, lazy loading, or sizing. `next/image` with explicit dimensions or `fill` + `sizes`.

### D11. Whole-page `loading.tsx` over fine Suspense
**Rule.** Don't use a full-screen skeleton when only one widget is slow.
**Reason.** Render the shell, wrap the slow part in `<Suspense>`.

### D12. Misusing parallel/intercepting routes
**Rule.** Don't reach for `@slot` to render something that could be a sibling component, or for `(.)` when a real modal Client Component would do.
**Reason.** Parallel routes are for independent loading states; intercepting only when you need both modal and full-page versions of the same URL.

### D13. Heavy work in middleware
**Rule.** Don't run database calls, bcrypt, or big JSON parsing in `middleware.ts`.
**Reason.** Edge has a CPU budget. Verify a signed cookie/JWT only; defer real work to the server component or route handler.

### D14. Aggressive caching everywhere
**Rule.** Don't set `cache: 'force-cache'` on user-specific or fast-changing data.
**Reason.** Cache only what's safe to be stale; default to `no-store` when in doubt and add caching with intent.

### D15. Un-deduped DB calls in `generateStaticParams`
**Rule.** Don't hit the DB again in pages for data already loaded at build.
**Reason.** Wrap the data accessor in React `cache()` so `generateStaticParams`, `generateMetadata`, and the page share one call.
```tsx
export const getPost = cache((slug: string) => db.post.findUnique({ where: { slug } }));
```

### D16. Sync `cookies()` / `params` in Next 15
**Rule.** Don't access them synchronously — TypeScript still passes but runtime warns/throws.
**Reason.** Async APIs since Next 15. Run `npx @next/codemod next-async-request-api` or `await` manually.
```tsx
// wrong
const { id } = params;
// right
const { id } = await params;
```

### D17. `next/dynamic` with `{ ssr: false }` overuse
**Rule.** Only use `ssr: false` for libraries that genuinely touch `window` at import time (some chart/map libs).
**Reason.** Otherwise a Client Component with a Suspense boundary works.
```tsx
// wrong
const Counter = dynamic(() => import('./Counter'), { ssr: false });
// right
// Counter is "use client"; render directly
```

### D18. Leaking raw errors from Server Actions
**Rule.** Don't `throw err` or return `err.message` straight to the client.
**Reason.** Exposes stack traces, query fragments, internal IDs. Return a typed result with a sanitized message; log full error server-side.
```tsx
'use server';
export async function pay(form: FormData) {
  try { /* … */ }
  catch (e) {
    console.error(e);
    return { ok: false, error: 'Payment failed' };
  }
}
```

---

## Sources

- [Next.js Docs — Caching, Fetching, Server Actions, Middleware](https://nextjs.org/docs)
- [Next.js 15 release notes — async request APIs, fetch default change](https://nextjs.org/blog/next-15)
- [Partial Prerendering (incremental opt-in)](https://nextjs.org/docs/app/getting-started/partial-prerendering)
- [`generateStaticParams` & `cache()` dedupe](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [Server-only / client-only poison-pill pattern](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Data Security guide for Server Actions](https://nextjs.org/docs/app/guides/data-security)
