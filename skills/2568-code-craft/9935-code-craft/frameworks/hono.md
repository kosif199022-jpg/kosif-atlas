# Hono 4.x — code-craft reference

~55 rules across three buckets. Hono is a multi-runtime web framework (Cloudflare Workers, Bun, Node, Deno, Vercel Edge, Fastly). Cover framework patterns; runtime-specifics only when they intersect Hono usage.

Sources: [hono.dev](https://hono.dev) (4.x docs — Routing, Middleware, Validators, RPC, OpenAPI, Streaming, Helpers), [honojs/hono](https://github.com/honojs/hono) source + examples, Yusuke Wada talks (ViteConf 2023, JSConf JP 2024), [Cloudflare Workers Hono guide](https://developers.cloudflare.com/workers/frameworks/framework-guides/hono/).

Loaded by `code-craft` when the user asks about Hono or pastes Hono code for review.

---

## A — Tactical (day-to-day patterns)

### A1. Route order: specific before wildcard
**Rule.** Declare specific routes before wildcards/parameterized catch-alls.
**Reason.** Hono's TrieRouter matches in registration order for overlapping patterns; `/users/me` after `/users/:id` is unreachable.
```ts
// wrong
app.get('/users/:id', ...); app.get('/users/me', ...);
// right
app.get('/users/me', ...); app.get('/users/:id', ...);
```

### A2. Mount sub-apps with `app.route`
**Rule.** Compose feature apps with `app.route('/api', subApp)` rather than registering everything on one instance.
**Reason.** Keeps domains isolated, preserves type inference, scales to large APIs.
```ts
const auth = new Hono(); auth.post('/login', ...);
app.route('/auth', auth);
```

### A3. `.on()` for multi-method routes
**Rule.** Use `app.on(['GET','POST'], '/path', h)` instead of duplicating `.get`/`.post`.
**Reason.** One handler, one source of truth; reduces drift between methods.
```ts
app.on(['GET','HEAD'], '/feed', feedHandler);
```

### A4. Middleware ordering: logger → cors → secureHeaders → auth → routes
**Rule.** Register cross-cutting middleware before auth, and auth before route handlers.
**Reason.** Logger must wrap the whole stack to time everything; CORS preflight must respond before auth rejects it.
```ts
app.use('*', logger());
app.use('*', cors({ origin: 'https://app.io' }));
app.use('*', secureHeaders());
app.use('/api/*', jwt({ secret }));
```

### A5. Scope auth middleware narrowly
**Rule.** Apply auth on `/api/*` (or the protected prefix), not `*`.
**Reason.** `*` blocks `/health`, static assets, and OAuth callbacks.
```ts
// wrong
app.use('*', jwt({ secret }));
// right
app.use('/api/*', jwt({ secret }));
```

### A6. Always `await` body parsers
**Rule.** `c.req.json()`, `c.req.formData()`, `c.req.parseBody()`, `c.req.text()`, `c.req.arrayBuffer()` are async — `await` them.
**Reason.** They return Promises; missing `await` yields a Promise object you'll JSON-stringify by accident.
```ts
const body = await c.req.json<UserInput>();
```

### A7. Coerce `c.req.query` values
**Rule.** Treat query/param values as strings; coerce or validate before use.
**Reason.** `c.req.query('page')` is `string | undefined`; arithmetic silently produces `NaN`.
```ts
const page = Number(c.req.query('page') ?? '1');
```

### A8. Return via `c.json` / `c.text` / `c.html`
**Rule.** Don't return plain objects from handlers — use `c.json(obj, status)` or return a `Response`.
**Reason.** Hono handlers must return `Response`; a bare object becomes `[object Object]`.
```ts
// wrong
return { ok: true };
// right
return c.json({ ok: true }, 200);
```

### A9. Status as second arg to `c.json/text/html`
**Rule.** Pass status as the second argument; use `c.status()` only for header-only responses.
**Reason.** Single call is atomic and type-checked.
```ts
return c.json({ id }, 201);
// header-only:
c.status(204); return c.body(null);
```

### A10. Centralize errors with `app.onError`
**Rule.** Define `app.onError((err, c) => ...)` once at the root.
**Reason.** Avoids repeating try/catch in every handler and produces a consistent error shape.
```ts
app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse();
  return c.json({ error: 'Internal' }, 500);
});
```

### A11. Throw `HTTPException` for known failures
**Rule.** Use `throw new HTTPException(403, { message: 'Forbidden' })` instead of returning ad-hoc error JSON.
**Reason.** Carries status, message, and an optional `Response`; cooperates with `onError`.
```ts
import { HTTPException } from 'hono/http-exception';
if (!user) throw new HTTPException(401, { message: 'unauth' });
```

### A12. `app.notFound` once, at the root
**Rule.** Register `app.notFound(handler)` on the root app, after all routes are mounted.
**Reason.** Hono evaluates `notFound` only when no route matched; declaring on a sub-app may not fire if the parent matched.
```ts
app.route('/api', api);
app.notFound((c) => c.json({ error: 'not found' }, 404));
```

### A13. Validate with `@hono/zod-validator`
**Rule.** Use `zValidator('json' | 'query' | 'param' | 'form' | 'header' | 'cookie', schema)`.
**Reason.** Parses, types, and rejects bad input before the handler runs.
```ts
app.post('/u', zValidator('json', UserSchema), (c) => {
  const u = c.req.valid('json'); // typed
});
```

### A14. Read validated input via `c.req.valid('json')`
**Rule.** Inside a validated route, use `c.req.valid(target)` rather than re-parsing with `c.req.json()`.
**Reason.** `valid` returns the already-parsed, typed payload; re-parsing wastes work and may consume the body stream.

### A15. Cookies: use the helper
**Rule.** Use `getCookie(c, name)` / `setCookie(c, name, value, opts)` from `hono/cookie`.
**Reason.** Handles encoding, signed cookies, and serialization; raw `Set-Cookie` is error-prone.
```ts
setCookie(c, 'sid', token, { httpOnly: true, secure: true, sameSite: 'Lax' });
```

### A16. Type `Bindings` and `Variables`
**Rule.** Declare `new Hono<{ Bindings: Env; Variables: { user: User } }>()`.
**Reason.** Without it `c.env` and `c.var` are `any`, defeating typed RPC and runtime safety.
```ts
type AppEnv = { Bindings: { DB: D1Database }; Variables: { user: User } };
const app = new Hono<AppEnv>();
```

### A17. `c.set` / `c.get` (or `c.var`) for per-request state
**Rule.** Stash request-scoped values via `c.set('user', u)` and read with `c.var.user`.
**Reason.** Module-level vars collide across concurrent requests on Workers/Bun.
```ts
app.use('*', async (c, next) => { c.set('user', await loadUser(c)); await next(); });
```

### A18. Prefer built-in middleware
**Rule.** Use `cors`, `logger`, `etag`, `cache`, `secureHeaders`, `requestId`, `timing`, `bodyLimit`, `compress`, `csrf`, `prettyJSON` from `hono/*` before reaching for npm.
**Reason.** Maintained alongside core, multi-runtime, no extra deps.

### A19. `bodyLimit` on POST/upload routes
**Rule.** Wrap upload/JSON-POST routes with `bodyLimit({ maxSize })`.
**Reason.** Prevents memory-blowup DoS from oversized payloads.
```ts
app.post('/upload', bodyLimit({ maxSize: 10 * 1024 * 1024 }), handler);
```

### A20. Streaming with `streamSSE` / `streamText`
**Rule.** Use `streamSSE(c, async (stream) => stream.writeSSE({...}))` from `hono/streaming` for SSE/text streams.
**Reason.** Handles backpressure, abort, and content-type; manual `ReadableStream` misses these.
```ts
return streamSSE(c, async (s) => {
  await s.writeSSE({ data: JSON.stringify(chunk), event: 'tick', id: '1' });
});
```

### A21. CORS: be explicit
**Rule.** Set `origin`, `credentials`, `allowMethods`, `allowHeaders` deliberately.
**Reason.** Defaults are permissive; `'*'` + `credentials: true` is rejected by browsers and a security smell.
```ts
app.use('/api/*', cors({ origin: ['https://app.io'], credentials: true }));
```

### A22. `c.executionCtx.waitUntil` only on Workers
**Rule.** Guard `waitUntil` for Workers; on other runtimes it's undefined.
**Reason.** Cross-runtime apps crash with `TypeError` otherwise.
```ts
c.executionCtx?.waitUntil?.(logAsync(c));
```

### A23. Test handlers via `app.request`
**Rule.** In tests, call `await app.request('/path', { method, body })`.
**Reason.** Returns a real `Response`, runs the full middleware chain, no server needed.
```ts
const res = await app.request('/users/1');
expect(res.status).toBe(200);
```

### A24. `c.req.parseBody` for multipart uploads
**Rule.** Use `c.req.parseBody({ all: true })` to capture multiple files under the same field.
**Reason.** Default returns single file; `all: true` returns arrays for repeated keys.

### A25. Don't hold `c` past the request
**Rule.** Never close over `c` in long-lived promises or globals.
**Reason.** `c` is request-scoped; using it later leaks memory and may target a stale request.

---

## B — Modern Hono idioms

### B1. RPC: `hc<typeof app>(baseUrl)`
**Rule.** Export `type AppType = typeof app` from the server, import on the client, and instantiate `hc<AppType>(url)`.
**Reason.** End-to-end typed routes — request shape, params, response — without codegen.
```ts
// server: export type AppType = typeof app
// client:
const client = hc<AppType>('https://api.io');
const res = await client.users[':id'].$get({ param: { id: '1' } });
```

### B2. Chain routes for RPC inference
**Rule.** Build the app as a single chained expression: `const app = new Hono().get(...).post(...)`.
**Reason.** Type inference for `hc<typeof app>` requires a chained builder; assigning piecewise loses types.
```ts
const app = new Hono().get('/u/:id', h).post('/u', zValidator('json', S), h);
```

### B3. Typed JSON via `c.json<T>(...)`
**Rule.** Annotate response body type when needed: `return c.json<User>(u)`.
**Reason.** RPC clients infer return type from this; without it they get `unknown`/`{}`.

### B4. `app.basePath('/api/v1')` for versioning
**Rule.** Prefix versioned APIs with `basePath`, mount the versioned app on root.
**Reason.** Cleaner than repeating `/api/v1` in every route; sub-apps stay reusable.
```ts
const v1 = new Hono().basePath('/api/v1').get('/health', ...);
```

### B5. OpenAPI via `@hono/zod-openapi`
**Rule.** Use `OpenAPIHono` + `createRoute` to declare schemas once for validation and docs.
**Reason.** One source of truth; pairs with `@hono/swagger-ui` for `/docs`.
```ts
const route = createRoute({ method: 'get', path: '/u/:id', responses: {...} });
app.openapi(route, handler);
```

### B6. Generate OpenAPI doc once at startup
**Rule.** Call `app.getOpenAPIDocument(...)` once and serve cached JSON; don't rebuild per request.
**Reason.** Schema serialization is expensive; per-request kills cold-start budgets.

### B7. JWT via `hono/jwt`
**Rule.** Use `import { jwt } from 'hono/jwt'` middleware; verify with `verify(token, secret, alg)`.
**Reason.** Built-in, multi-runtime, supports HS/RS/ES algorithms.
```ts
app.use('/api/*', jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' }));
```

### B8. `bearerAuth({ token })` for static tokens
**Rule.** Use `bearerAuth` for service-to-service / webhook auth where keys are static.
**Reason.** Handles header parsing and timing-safe compare.

### B9. Rate limit with an adapter
**Rule.** Use `hono-rate-limiter` (or roll your own backed by Redis/KV/D1) — Hono ships none.
**Reason.** No built-in; in-memory counters break across Workers isolates.

### B10. `requestId` + structured logger
**Rule.** Add `requestId()` middleware and include `c.var.requestId` in every log line.
**Reason.** Correlates logs across services and middleware boundaries.
```ts
app.use('*', requestId());
app.use('*', async (c, next) => { log.info({ rid: c.var.requestId, path: c.req.path }); await next(); });
```

### B11. `secureHeaders` everywhere, tune CSP
**Rule.** Apply `secureHeaders()` globally; override `contentSecurityPolicy` per app.
**Reason.** Sensible HSTS/X-Frame defaults; default CSP may block your assets.

### B12. `etag` + `cache` for read-heavy endpoints
**Rule.** Wrap GETs with `etag()` and `cache({ cacheName, cacheControl })`.
**Reason.** Cuts egress and latency; `etag` enables 304s; `cache` uses Cache API on Workers.

### B13. WebSockets via runtime adapter
**Rule.** Use `upgradeWebSocket` from `hono/cloudflare-workers` (or Bun/Deno equivalents) — no universal API.
**Reason.** WebSocket upgrade is runtime-specific; abstract it behind one route helper.

### B14. Multi-runtime imports stay generic
**Rule.** Default to `import { Hono } from 'hono'`; use `'hono/cloudflare-workers'` only for runtime-specific helpers.
**Reason.** Generic core works everywhere; runtime imports lock you to one platform.

### B15. `hono/adapter` for env access
**Rule.** Read env via `env(c)` from `hono/adapter` when targeting multiple runtimes.
**Reason.** Unifies `process.env` (Node/Bun), `Deno.env`, and Workers `Bindings`.
```ts
import { env } from 'hono/adapter';
const { API_KEY } = env<{ API_KEY: string }>(c);
```

### B16. Typed middleware with `createMiddleware`
**Rule.** Build middleware with `createMiddleware<AppEnv>(async (c, next) => {...})`.
**Reason.** Carries `Bindings`/`Variables` types into middleware so `c.env`/`c.var` stay typed.

### B17. RPC client for monorepos
**Rule.** Share `type AppType` from server package; consume in Next.js/Expo/etc. via `hc<AppType>`.
**Reason.** One typed contract for web + mobile; refactors propagate at compile time.

### B18. SSE for AI/streaming endpoints
**Rule.** Stream LLM/long-running responses with `streamSSE`; emit `id` and `event` for client reconnect.
**Reason.** EventSource clients use `Last-Event-ID` to resume; without `id` you can't.

### B19. File upload pipeline
**Rule.** `bodyLimit` → validator (multipart schema) → handler that streams to storage.
**Reason.** Limit first, validate second, never buffer untrusted multipart in memory.

### B20. Error class hierarchy
**Rule.** Define domain errors that extend `HTTPException`; map to HTTP in `onError`.
**Reason.** Keeps domain code framework-agnostic while handing Hono a typed shape.

### B21. `c.var` over `c.get`
**Rule.** Prefer `c.var.user` over `c.get('user')`.
**Reason.** Property access reads cleaner; both are typed when `Variables` is set.

### B22. Test sub-apps in isolation
**Rule.** Export sub-apps and test them with `subApp.request(...)` directly.
**Reason.** Faster tests, no global middleware bleeding in.

---

## D — Anti-patterns / smells

### D1. Auth on `*`
**Rule.** Don't apply auth to every path; use a prefix.
**Reason.** Blocks `/health`, `/favicon.ico`, OAuth callbacks.
```ts
// wrong
app.use('*', jwt({...}));
// right
app.use('/api/*', jwt({...}));
```

### D2. Wrong middleware order
**Rule.** Don't put auth before logger or CORS after the route.
**Reason.** Errors bypass logging; preflights hit auth and 401.

### D3. Forgetting `await` on body parsers
**Rule.** `await c.req.json()`, always.
**Reason.** Otherwise `body` is a Promise; downstream code silently corrupts.

### D4. Number coercion absent
**Rule.** Don't pass `c.req.query('n')` to math/DB without `Number()`/Zod.
**Reason.** `'10' + 1 === '101'`; `NaN` propagates.

### D5. Returning a bare object
**Rule.** Don't `return { ok: true }`.
**Reason.** Handlers must return `Response`; objects become `[object Object]`.

### D6. Throwing raw `Error`
**Rule.** Don't throw plain `Error` and rely on default handling.
**Reason.** Without `onError`, leaks 500 with stack; use `HTTPException`.

### D7. Leaking stack traces
**Rule.** Don't `c.json({ error: err.message })` in prod.
**Reason.** Reveals internals; return a generic message and log the rest.
```ts
// wrong
app.onError((e, c) => c.json({ error: e.stack }, 500));
```

### D8. Try/catch around every handler
**Rule.** Don't wrap each handler in try/catch when `app.onError` would centralize it.
**Reason.** Duplication and inconsistent error shapes.

### D9. Re-parsing inside validated handlers
**Rule.** Don't call `c.req.json()` after `zValidator('json', S)`.
**Reason.** Body stream may be consumed; use `c.req.valid('json')`.

### D10. Business logic in middleware
**Rule.** Middleware does cross-cutting concerns; handlers do domain work.
**Reason.** Hidden coupling; hard to test; `next()` ordering becomes load-bearing.

### D11. Module-level per-request state
**Rule.** Don't store request data in module-scope variables.
**Reason.** Workers/Bun handle requests concurrently; state collides across users.
```ts
// wrong
let currentUser; app.use('*', (c, next) => { currentUser = c.get('user'); return next(); });
```

### D12. `console.log` in production
**Rule.** Use a structured logger (pino, custom JSON) with request ID.
**Reason.** Plain logs are unsearchable, lose context, and cost more to ingest.

### D13. Holding `c` across async boundaries
**Rule.** Don't pass `c` into long-lived workers/queues.
**Reason.** It's request-scoped; serialize what you need (user id, request id) instead.

### D14. `waitUntil` on non-Workers
**Rule.** Don't call `c.executionCtx.waitUntil(p)` unconditionally.
**Reason.** Undefined on Bun/Node; throws TypeError.

### D15. `origin: '*'` + `credentials: true`
**Rule.** Never combine wildcard origin with credentials.
**Reason.** Browsers reject; even if they didn't, it's a CSRF vector.

### D16. Mixed JSON/form without content-type check
**Rule.** Validate `Content-Type` (or use the right validator target).
**Reason.** `parseBody` accepts both; handlers may misinterpret.

### D17. New `Hono()` per request
**Rule.** Instantiate the app once at module load.
**Reason.** Per-request construction skips router caching and leaks memory.
```ts
// wrong
export default { fetch: (req, env, ctx) => new Hono().get(...).fetch(req, env, ctx) };
```

### D18. Dynamic `import()` of routes inside handlers
**Rule.** Import routes statically at the top of the file.
**Reason.** Each request pays cold-start cost; defeats Workers bundle optimization.

### D19. `app.fetch` when you mean `app.request`
**Rule.** In tests, use `app.request(path, init)`; `app.fetch(req, env, ctx)` is the runtime entry.
**Reason.** `request` builds the `Request`; `fetch` requires you to construct one.

### D20. `Response` without `content-type`
**Rule.** Always set `Content-Type` when returning a raw `Response`.
**Reason.** Browsers/clients sniff; SSE/streaming breaks; `c.json/text/html` does it for you.

### D21. Hard-coded API base URL in client
**Rule.** Pass base URL via env: `hc<AppType>(import.meta.env.VITE_API_BASE)`.
**Reason.** Breaks preview deploys, staging, and multi-region.

### D22. Untyped `Hono()`
**Rule.** Always parameterize `Hono<{ Bindings, Variables }>`.
**Reason.** `c.env` and `c.var` collapse to `any`; bugs at runtime instead of compile time.

### D23. Outdated `parseBody` options (4.x)
**Rule.** Don't rely on pre-4.x `parseBody` defaults — `all: true` semantics changed.
**Reason.** Files under same field name are now arrays only with `all: true`; old code may regress silently.

### D24. No `bodyLimit` on uploads
**Rule.** Always set `bodyLimit` on routes accepting binary or JSON-POST.
**Reason.** Without it, a malicious large body OOMs the worker.

### D25. CPU-bound work in a Workers handler
**Rule.** Move heavy compute off Cloudflare Workers (Queues, Durable Objects, external service).
**Reason.** Workers free tier has ~10ms CPU; paid ~50ms by default — long handlers get killed.

### D26. Awaiting `waitUntil`
**Rule.** Don't `await c.executionCtx.waitUntil(p)`; let the response return.
**Reason.** `waitUntil` extends background lifetime — awaiting blocks the response, defeating the point.
```ts
// wrong
await c.executionCtx.waitUntil(logAsync());
// right
c.executionCtx.waitUntil(logAsync());
return c.json(result);
```

### D27. Verbose `logger()` at high QPS
**Rule.** Replace built-in `logger()` with sampled or level-gated structured logger in prod.
**Reason.** Per-request stdout dominates cost on high-traffic Workers/Lambdas.

### D28. Untyped errors from sub-apps
**Rule.** Sub-apps should throw `HTTPException` (or a typed subclass), not raw `Error`.
**Reason.** Parent `onError` handles `HTTPException` cleanly; `Error` requires sniffing.

### D29. OpenAPI built per request
**Rule.** Don't expose `/openapi.json` as `(c) => c.json(app.getOpenAPIDocument())`.
**Reason.** Recomputes the schema every hit; cache once at startup, serve from memory.

### D30. Omitting `secureHeaders`
**Rule.** Don't ship without `secureHeaders()` on HTML responses.
**Reason.** Missing HSTS/X-Frame/CSP is a default-vulnerable posture.

### D31. Middleware after the route it should wrap
**Rule.** Register `app.use(...)` before `app.get/post(...)` for the same path.
**Reason.** Hono only applies middleware registered before the route definition.
```ts
// wrong: cors won't apply
app.get('/x', h); app.use('/x', cors());
// right
app.use('/x', cors()); app.get('/x', h);
```

### D32. Reading `c.req.raw` when helpers exist
**Rule.** Use `c.req.json/header/query/param`, not `c.req.raw.headers.get(...)`.
**Reason.** Helpers handle decoding, casing, and types; `raw` is an escape hatch.
