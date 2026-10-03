# Cloudflare Workers — code-craft reference

~50 rules across three buckets. Workers is a V8-isolate runtime on `workerd` with bindings to Cloudflare storage/compute primitives. Hono-specific routing/middleware lives in `hono.md`; intersections (e.g. `c.executionCtx.waitUntil`) live here.

Sources: [developers.cloudflare.com/workers](https://developers.cloudflare.com/workers/) (2025 docs), [Cloudflare blog](https://blog.cloudflare.com/) (DO SQLite GA April 2025, Smart Placement), [compatibility flags](https://developers.cloudflare.com/workers/configuration/compatibility-flags/), Kenton Varda's DO talks, Glen Maddern and Sunil Pai Workers talks, Greg McKeon on D1/DO storage.

Loaded by `code-craft` for Workers, Wrangler, DO, KV, D1, R2, Queues code or questions.

---

## A — Tactical day-to-day patterns

### A1. Module Workers, not service-worker syntax
**Rule.** Export a default object with handlers; never `addEventListener('fetch', ...)`.
**Reason.** Service-worker syntax is legacy and disables `env` bindings, RPC, DO SQLite, and Workers AI.
```ts
// wrong (service-worker)
addEventListener('fetch', e => e.respondWith(new Response('hi')));
// right (module Worker)
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return new Response('hi');
  },
} satisfies ExportedHandler<Env>;
```

### A2. Co-locate handlers in one default export
**Rule.** Put `fetch`, `scheduled`, `queue`, `tail`, `email` on the same default export.
**Reason.** Wrangler binds all triggers to one Worker; the entry file must export them together.
```ts
export default {
  async fetch(req, env, ctx) { /* HTTP */ },
  async scheduled(controller, env, ctx) { /* cron */ },
  async queue(batch, env, ctx) { /* Queues consumer */ },
  async tail(events, env, ctx) { /* Tail Worker */ },
};
```

### A3. RPC with `WorkerEntrypoint`
**Rule.** For service bindings, extend `WorkerEntrypoint` and expose typed methods instead of stuffing logic into `fetch`.
**Reason.** Strong typing across Workers, structured arg passing, no `Request`/`Response` ceremony.
```ts
import { WorkerEntrypoint } from 'cloudflare:workers';
export default class extends WorkerEntrypoint<Env> {
  async getUser(id: string) { return this.env.DB.prepare('SELECT ...').bind(id).first(); }
}
// caller: const user = await env.USERS.getUser('abc');
```

### A4. Pin `compatibility_date`
**Rule.** Set `compatibility_date` to a recent fixed date; bump deliberately, never leave blank.
**Reason.** Missing it defaults to the oldest behavior — you miss bug fixes, modern stream APIs, and security patches.
```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]
```

### A5. Declare bindings, access via `env`
**Rule.** Declare KV/R2/D1/DO/Queues/AI/Vectorize/Hyperdrive/Service bindings in `wrangler.toml`; access via `env.NAME`.
**Reason.** Bindings bypass the public network, get per-env scoping, and are typed via `worker-configuration.d.ts`.
```toml
kv_namespaces = [{ binding = "CACHE", id = "abc..." }]
[[d1_databases]]
binding = "DB"
database_name = "prod"
database_id = "xyz..."
```

### A6. Secrets via `wrangler secret put`, never `[vars]`
**Rule.** Use `wrangler secret put NAME` for API keys and tokens; reserve `[vars]` for non-sensitive config.
**Reason.** `[vars]` is committed and visible in `--dry-run` and the dashboard; secrets are encrypted and redacted from logs.
```toml
# wrangler.toml — non-secret only
[vars]
LOG_LEVEL = "info"
PUBLIC_API_URL = "https://api.example.com"
# secrets: wrangler secret put STRIPE_KEY
```

### A7. Per-environment config with `[env.X]`
**Rule.** Scope vars/routes/bindings under `[env.staging]`/`[env.production]`; deploy with `wrangler deploy --env staging`.
**Reason.** One source of truth prevents staging bindings drifting into prod or vice versa.
```toml
[env.production]
routes = [{ pattern = "api.example.com/*", zone_name = "example.com" }]
[env.production.vars]
LOG_LEVEL = "warn"
```

### A8. Local dev with `wrangler dev`
**Rule.** Run `wrangler dev` on `workerd`/Miniflare 3; use `--remote` for real bindings (cross-region DO, Workers AI, Queues consumers).
**Reason.** Local is faithful and instantaneous; `--remote` is for real network egress and IP geolocation tests.
```bash
wrangler dev                 # local
wrangler dev --remote        # real bindings
wrangler dev --persist-to=.wrangler/state   # KV/D1/R2 survive restarts
```

### A9. Live logs with `wrangler tail`
**Rule.** Stream prod logs with `wrangler tail`; enable `[observability]` for retained dashboard logs.
**Reason.** Without observability, logs are ephemeral; with it, head-sampled logs are queryable in the dashboard.
```toml
[observability]
enabled = true
head_sampling_rate = 1
```

### A10. Web standards APIs first
**Rule.** Use `fetch`, `Request`, `Response`, `Headers`, `URL`, `crypto.subtle`, `TextEncoder/Decoder`, `ReadableStream`, `TransformStream`, `Blob` — not Node equivalents.
**Reason.** Web Standards run native in `workerd`; Node APIs are a polyfill layer with sharp edges.
```ts
// wrong
import { createHash } from 'node:crypto';
const h = createHash('sha256').update(s).digest('hex');
// right
const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
const h = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
```

### A11. Web Crypto for HMAC/JWT
**Rule.** Sign and verify with `crypto.subtle.importKey/sign/verify`; don't reach for `node:crypto` for JWTs.
**Reason.** Runtime-native — no `nodejs_compat` needed, faster, fewer Buffer-encoding foot-guns.
```ts
const key = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(env.JWT_SECRET),
  { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
);
const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
```

### A12. `nodejs_compat` for legitimate `node:` needs
**Rule.** When a library needs `node:buffer`, `async_hooks`, `util`, etc., set `nodejs_compat` flag with `compatibility_date >= 2024-09-23`.
**Reason.** That date unlocks the V2 compat layer with a meaningful Node subset; older dates give thinner shims.
```toml
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]
```

### A13. Static assets with the `[assets]` binding
**Rule.** Serve `public/` via `[assets]` in `wrangler.toml`; fall through to `env.ASSETS.fetch(req)` for static paths.
**Reason.** Workers Assets serves from the edge for free (no Worker invocation on direct hits) and supports SPA fallback.
```toml
[assets]
directory = "./public"
binding = "ASSETS"
not_found_handling = "single-page-application"
```
```ts
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) return handleApi(req, env);
    return env.ASSETS.fetch(req);
  },
};
```

### A14. Routes vs custom domains
**Rule.** Use `routes = [...]` for path/zone mounts; use Custom Domain (dashboard) for apex/subdomain ownership.
**Reason.** Routes attach to existing zones with path patterns; Custom Domains issue certs and configure DNS — different lifecycles.
```toml
routes = [
  { pattern = "api.example.com/*", zone_name = "example.com" },
]
```

### A15. Disable `workers.dev` in prod
**Rule.** Set `workers_dev = false` in `[env.production]` to turn off the public `*.workers.dev` subdomain.
**Reason.** Otherwise your Worker has two public hostnames; the `workers.dev` one bypasses the custom domain's WAF/rate-limit rules.
```toml
[env.production]
workers_dev = false
routes = [{ pattern = "api.example.com/*", zone_name = "example.com" }]
```

### A16. Cron triggers via `[triggers]`
**Rule.** Schedule recurring work with `[triggers] crons = [...]` and a `scheduled` handler — not `setInterval`.
**Reason.** Workers don't keep timers across invocations; the platform is the scheduler.
```toml
[triggers]
crons = ["0 * * * *", "*/5 * * * *"]
```
```ts
async scheduled(controller, env, ctx) {
  ctx.waitUntil(rotateKeys(env));
}
```

### A17. Queues bindings: producer + consumer
**Rule.** Declare producer and consumer separately; consumer Worker exports a `queue(batch, env, ctx)` handler.
**Reason.** They're usually different Workers — coupling in one config is a common "messages disappear" cause.
```toml
[[queues.producers]]
queue = "jobs"
binding = "JOBS"
[[queues.consumers]]
queue = "jobs"
max_batch_size = 25
```

### A18. Versions + gradual deployments
**Rule.** Roll out risky changes via `wrangler versions upload` then `wrangler versions deploy --percentage 10`.
**Reason.** Decouples build from rollout; lets you split traffic between two versions without DNS changes.
```bash
wrangler versions upload
wrangler versions deploy --x-versions   # interactive split
```

### A19. CI auth via `CLOUDFLARE_API_TOKEN`
**Rule.** In CI, set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` env vars; never run `wrangler login`.
**Reason.** `wrangler login` opens a browser; there's no browser in CI. Tokens are scoped and revocable.
```yaml
# .github/workflows/deploy.yml
- run: npx wrangler deploy --env production
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
```

### A20. Re-deploy after `secret put`
**Rule.** Run `wrangler deploy` after `wrangler secret put` so the new value reaches live.
**Reason.** Secrets attach per version; `put` updates the latest *uploaded* version, not necessarily the *active* one.
```bash
wrangler secret put STRIPE_KEY
wrangler deploy   # required for the new value to go live
```

---

## B — Modern Workers idioms

### B1. `ctx.waitUntil` for after-response work
**Rule.** Pass background promises to `ctx.waitUntil(p)` (Hono: `c.executionCtx.waitUntil`); don't `await` them before returning.
**Reason.** Extends isolate lifetime past the response so logging/cache-warming finishes; awaiting blocks TTFB.
```ts
async fetch(req, env, ctx) {
  const res = await origin(req);
  ctx.waitUntil(logToAnalytics(env, req, res));   // fire-and-forget
  return res;
}
```

### B2. `passThroughOnException` for proxy Workers
**Rule.** Call `ctx.passThroughOnException()` early in proxy/CDN-style Workers so uncaught errors fall back to origin.
**Reason.** A Worker bug shouldn't take down a site with a healthy origin. Useless for non-proxy Workers.
```ts
async fetch(req, env, ctx) {
  ctx.passThroughOnException();
  return await transformResponse(req);
}
```

### B3. Cache the `Response`, not the body
**Rule.** Store full `Response` objects in `caches.default` or `caches.open(name)` — never just the body.
**Reason.** Cache API serializes headers + status + body atomically; reconstructing a `Response` loses cache directives and negotiation.
```ts
const cache = caches.default;
let res = await cache.match(req);
if (!res) {
  res = await fetch(origin);
  ctx.waitUntil(cache.put(req, res.clone()));
}
return res;
```

### B4. KV for read-heavy, eventually-consistent data
**Rule.** Use `env.KV.get/put/delete/list` for config, feature flags, session cache — data tolerant of ~60s global propagation.
**Reason.** KV is read-optimized at the edge; writes propagate eventually. Wrong tool for counters or strong consistency.
```ts
const flags = await env.KV.get('flags', 'json');
await env.KV.put(`session:${id}`, JSON.stringify(s), { expirationTtl: 3600 });
```

### B5. D1 prepared statements + binding
**Rule.** Always `db.prepare(sql).bind(...args)` — never concatenate user input into SQL.
**Reason.** Prevents SQL injection and lets D1 cache plans.
```ts
const row = await env.DB.prepare(
  'SELECT id, name FROM users WHERE email = ? LIMIT 1',
).bind(email).first();
```

### B6. `db.batch()` for atomic multi-statement
**Rule.** Group dependent writes into `db.batch([s1, s2, ...])` — not sequential `.run()` calls.
**Reason.** D1 has no exposed `BEGIN/COMMIT`; `batch()` is the atomic primitive, one round trip.
```ts
await env.DB.batch([
  env.DB.prepare('INSERT INTO orders ...').bind(...),
  env.DB.prepare('UPDATE inventory SET qty = qty - ? WHERE sku = ?').bind(qty, sku),
]);
```

### B7. D1 read replication for read-heavy apps
**Rule.** Enable D1 read replication when you have global read traffic and can tolerate replica lag.
**Reason.** Replicas serve reads from the nearest region; primary absorbs writes in one region. ([D1 read replication, GA 2025](https://developers.cloudflare.com/d1/best-practices/read-replication/))
```toml
[[d1_databases]]
binding = "DB"
database_name = "prod"
database_id = "..."
experimental_remote = true
read_replication = { mode = "auto" }
```

### B8. R2 for object storage with custom metadata
**Rule.** Use `env.R2.put(key, body, { httpMetadata, customMetadata })`; multipart for >100MB.
**Reason.** Free egress and S3-compatible; `customMetadata` is the durable place for app-level tags without a sidecar DB.
```ts
await env.R2.put(`uploads/${id}`, file.stream(), {
  httpMetadata: { contentType: file.type },
  customMetadata: { uploadedBy: userId },
});
```

### B9. SQLite-backed Durable Objects (default in 2025+)
**Rule.** New DOs should use the SQLite storage backend, not the legacy KV-style transactional storage.
**Reason.** SQLite-in-DO went GA April 2025 and is now recommended — full SQL, point-in-time recovery, faster, same strong consistency. ([Cloudflare blog, Apr 2025](https://blog.cloudflare.com/sqlite-in-durable-objects/))
```toml
[[durable_objects.bindings]]
name = "ROOM"
class_name = "Room"
[[migrations]]
tag = "v1"
new_sqlite_classes = ["Room"]
```

### B10. DO use cases: coordination, not bulk storage
**Rule.** Use DOs for single-writer ordering or strong consistency: chat rooms, lobbies, counters, locks, per-user rate limiters.
**Reason.** Each DO is a global singleton. Wrong tool for "store all my users" — that's D1 or KV.
```ts
const id = env.RATE_LIMITER.idFromName(ip);
const stub = env.RATE_LIMITER.get(id);
const allowed = await stub.fetch('https://do/check').then(r => r.json());
```

### B11. DO `alarm()` for per-object scheduling
**Rule.** Use `state.storage.setAlarm(date)` and an `alarm()` method for delayed work tied to a specific object.
**Reason.** Alarms fire without incoming requests — ideal for session expiry, debounced flushes, retry timers — and beat cron-fan-out.
```ts
async webSocketMessage() { await this.state.storage.setAlarm(Date.now() + 60_000); }
async alarm() { await this.flushBuffer(); }
```

### B12. `blockConcurrencyWhile` for async init
**Rule.** Wrap async constructor work in `state.blockConcurrencyWhile(async () => { ... })`.
**Reason.** DOs can serve concurrent requests during async init; this defers other handlers until init finishes.
```ts
constructor(state: DurableObjectState, env: Env) {
  this.state = state;
  state.blockConcurrencyWhile(async () => {
    this.config = await state.storage.get('config');
  });
}
```

### B13. Workers AI for inference
**Rule.** For LLM/embedding/vision/ASR models, use `env.AI.run(model, input)` instead of an external provider when possible.
**Reason.** Zero-egress, same auth as other bindings, Cloudflare-managed GPU pool. Front external models with AI Gateway when Workers AI lacks them.
```ts
const out = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
  messages: [{ role: 'user', content: q }],
});
```

### B14. Vectorize for vector search
**Rule.** Pair Workers AI embeddings with `env.VECTORIZE.insert/query/getByIds` for RAG.
**Reason.** Embeddings and search on one control plane; no external vector DB or auth juggling.
```ts
const { data: [{ values }] } = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text });
await env.VECTORIZE.insert([{ id, values, metadata: { docId } }]);
```

### B15. Hyperdrive for Postgres/MySQL
**Rule.** Put Hyperdrive in front of external Postgres/MySQL; connect via standard driver against `env.HYPERDRIVE.connectionString`.
**Reason.** Pools connections globally and caches query results — eliminates per-request TLS handshakes. ([Hyperdrive docs, 2025](https://developers.cloudflare.com/hyperdrive/))
```ts
import postgres from 'postgres';
const sql = postgres(env.HYPERDRIVE.connectionString, { max: 5 });
const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
```

### B16. Service bindings for Worker-to-Worker
**Rule.** Call internal Workers via `env.OTHER.fetch(req)` or RPC — not the public URL.
**Reason.** Zero egress, no public attack surface, skips the global routing layer.
```toml
[[services]]
binding = "AUTH"
service = "auth-worker"
entrypoint = "AuthEntry"   # for RPC
```

### B17. Smart Placement for backend-bound Workers
**Rule.** Set `placement = { mode = "smart" }` when the Worker makes multiple round trips to a centralized origin or DB.
**Reason.** Runs near upstream instead of near the user — wins when most latency is backend chatter. ([Smart Placement docs](https://developers.cloudflare.com/workers/configuration/smart-placement/))
```toml
[placement]
mode = "smart"
```

### B18. Tail Workers for log forwarding
**Rule.** Forward logs via `tail_consumers`; the consumer Worker exports a `tail(events, env, ctx)` handler.
**Reason.** Cleanest way to ship logs to Datadog/Loki/S3 without putting shipping code in every Worker.
```toml
[[tail_consumers]]
service = "log-shipper"
```

### B19. Compatibility flags worth knowing
**Rule.** Know the high-impact flags: `nodejs_compat`, `streams_enable_constructors`, `transformstream_enable_standard_constructor`, `global_fetch_strictly_public`, `dispatch_namespace_clear_caches`.
**Reason.** Most "weird Workers behavior" tickets resolve to a flag toggle. ([Compatibility flags page](https://developers.cloudflare.com/workers/configuration/compatibility-flags/))
```toml
compatibility_flags = ["nodejs_compat", "global_fetch_strictly_public"]
```

### B20. Workers Builds for git-driven CI
**Rule.** Connect a repo via Workers Builds (dashboard) for push-to-deploy driven by `wrangler.toml` — skip rolling your own GH Actions.
**Reason.** Platform-native, free build minutes, preview-per-PR. GH Actions still fine; this is just a step you can skip.
```toml
# Workers Builds reads this; no extra config needed
name = "my-worker"
main = "src/index.ts"
```

### B21. No `setTimeout`/`setInterval` for periodic work
**Rule.** Don't expect `setInterval` to keep firing across requests; use cron triggers or DO alarms.
**Reason.** Isolates are recycled aggressively; a timer set in one request dies once the response is sent (plus the `waitUntil` tail).

---

## D — Anti-patterns / smells

### D1. Service-worker `addEventListener('fetch', ...)`
**Smell.** Legacy syntax in new code.
**Why bad.** Locks you out of `env` bindings, RPC, DO SQLite. Convert to module Worker (A1).

### D2. Node APIs without `nodejs_compat`
**Smell.** `import fs from 'node:fs'` or `Buffer.from(...)` with no flag.
**Why bad.** Build succeeds, runtime explodes on first request. Set the flag (date >= 2024-09-23) or use Web Standards.

### D3. `node:crypto` when `crypto.subtle` works
**Smell.** `createHash`, `createHmac`, `randomBytes` for things Web Crypto already does.
**Why bad.** Drags in the Node compat layer for no gain; slower cold start.

### D4. Mutable module-level state
**Smell.** `let cache = new Map()` at module top, used as a request cache.
**Why bad.** Isolates are reused but recycled unpredictably — sometimes warm, sometimes cold, sometimes the wrong tenant's data. Use KV/DO/R2 or `caches.default`.
```ts
// wrong
const cache = new Map();
export default { fetch(req) { return cache.get(req.url) ?? ... } };
```

### D5. Closing over `env` at module scope
**Smell.** Helpers outside the handler capturing `env` from the first request.
**Why bad.** `env` is per-request — closures can leak prod bindings into preview traffic or freeze a stale handle. Pass `env` as an argument.
```ts
// wrong
let _env: Env;
function getUser(id: string) { return _env.DB.prepare(...).bind(id).first(); }
// right: getUser(env, id)
```

### D6. `setTimeout` to delay work in `fetch`
**Smell.** `setTimeout(() => audit(...), 5000)` after returning.
**Why bad.** The Worker dies once the response is sent. Use `ctx.waitUntil` for fire-and-forget, or a DO alarm for real delay.

### D7. Buffering large bodies in memory
**Smell.** `await req.arrayBuffer()` then transform.
**Why bad.** 128 MB request limit and wasted memory. Stream `req.body` through a `TransformStream`.
```ts
return new Response(req.body!.pipeThrough(transform()));
```

### D8. `r.text()` on huge upstream responses
**Smell.** `const t = await fetch(url).then(r => r.text())` for multi-MB payloads.
**Why bad.** Same memory pressure as D7. Stream the response to the client.

### D9. >50 subrequests in one handler
**Smell.** A loop firing 100 `fetch()` calls.
**Why bad.** Free caps at 50 subrequests; paid at 1000. Batch, fan out via Queues, or aggregate upstream.

### D10. CPU-bound work synchronously
**Smell.** Image resize, large JSON sort, crypto-in-JS in the request path.
**Why bad.** Free CPU ~10ms; paid up to 30s wall but CPU is metered separately. Offload to Workers AI, Image Resizing, or a Queue consumer.

### D11. `await ctx.waitUntil(p)`
**Smell.** Awaiting the return of `waitUntil`.
**Why bad.** Defeats the purpose — `waitUntil` is fire-and-forget. Awaiting holds the response. Just call it.

### D12. Double-consuming a Response body
**Smell.** Returning a streamed `Response` after `await response.text()`.
**Why bad.** Bodies are single-use; the second consumer sees empty/throws. Use `response.clone()` before reading.

### D13. KV for write-heavy data
**Smell.** Counters, leaderboards, per-request session writes in KV.
**Why bad.** KV writes are eventually consistent (~60s) and rate-limited per key. Use Durable Objects for write-heavy state.

### D14. KV value > 25MB or key > 512 bytes
**Smell.** Storing PDFs, model files, or hash-of-everything keys.
**Why bad.** Hard limits — 413 at write time. Use R2 for blobs.

### D15. `KV.list()` over the whole namespace
**Smell.** Pagination loop iterating every key for a search.
**Why bad.** Paginated, billed per op, slow at scale. Maintain an index in D1 or use prefixes + metadata.

### D16. D1 without prepared statements
**Smell.** `db.exec("SELECT * FROM users WHERE email = '" + email + "'")`.
**Why bad.** SQL injection and no plan caching. Always `prepare(...).bind(...)`.

### D17. D1 multi-statement without `batch()`
**Smell.** `await s1.run(); await s2.run();` for dependent writes.
**Why bad.** No atomicity — partial failure leaves bad state. Use `db.batch([...])`.

### D18. DO fan-out done sequentially
**Smell.** `for (const id of ids) await stub(id).fetch(...)`.
**Why bad.** Each call is a network hop; serial = N × latency. Use `Promise.all` or restructure so one DO owns the set.

### D19. DO without `blockConcurrencyWhile` on init
**Smell.** Constructor does `await state.storage.get(...)` without blocking.
**Why bad.** First concurrent requests read undefined config. Wrap async init.

### D20. Plaintext PII in KV
**Smell.** Emails, addresses, tokens unencrypted in KV.
**Why bad.** KV is unencrypted at the app layer. Encrypt sensitive fields with `crypto.subtle` (key in a secret) before `put`.

### D21. Secrets in `wrangler.toml [vars]`
**Smell.** `STRIPE_KEY = "sk_live_..."` under `[vars]`.
**Why bad.** Plaintext, visible in dashboard, in `--dry-run`, in git. Use `wrangler secret put`.

### D22. Hardcoded URLs instead of `env`
**Smell.** `fetch('https://api-prod.example.com/...')` in code.
**Why bad.** Staging accidentally hits prod. Inject via `[env.X.vars]` and read from `env`.

### D23. Bindings drift across environments
**Smell.** One `wrangler.toml` lists prod KV ids at the top, no `[env.staging]` overrides.
**Why bad.** `wrangler deploy --env staging` ships with prod's bindings. Re-declare bindings under each `[env.X]`.
```toml
[env.staging]
kv_namespaces = [{ binding = "CACHE", id = "<staging-id>" }]
```

### D24. Missing `compatibility_date`
**Smell.** No date in `wrangler.toml`.
**Why bad.** Oldest behavior — bug-compatibility with 2021 Workers. Pin a recent date.

### D25. Stale flags after default
**Smell.** `streams_enable_constructors` still in flags long after it became default.
**Why bad.** Leaving obsolete flags may pin old semantics or invert if the flag is later reused. Audit when bumping `compatibility_date`.

### D26. `console.log` in tight loops
**Smell.** Per-iteration logging across thousands of items.
**Why bad.** Each line is metered under observability and ships to Tail Workers — balloons cost and drowns signal.

### D27. Overlapping route patterns
**Smell.** `api.example.com/*` on Worker A, `api.example.com/users/*` on Worker B.
**Why bad.** Cloudflare picks the most specific match, but near-ties surprise. One Worker per hostname, or one dispatcher.

### D28. `workers.dev` left enabled in prod
**Smell.** No `workers_dev = false` in `[env.production]`.
**Why bad.** Second public URL bypasses your custom domain's WAF/zero-trust/rate-limit rules.

### D29. Caching authenticated responses in `caches.default`
**Smell.** `cache.put(req, res)` where `res` is per-user.
**Why bad.** Shared edge cache — next user gets the previous user's data. Use `caches.open('user:'+userId)` or skip cache for auth routes.

### D30. `cache.put` with consumed body
**Smell.** `await res.json()` then `cache.put(req, res)`.
**Why bad.** Body is consumed; cached entry is empty or errors. `cache.put(req, res.clone())` before reading.

### D31. Mixing module + service-worker Workers in one project
**Smell.** Some files `addEventListener`, others `export default`.
**Why bad.** Wrangler picks one mode per Worker; mixing runs in legacy mode and silently drops modern handlers.

### D32. Service-binding loop
**Smell.** Worker A's `[[services]]` points to Worker A.
**Why bad.** Each `env.SELF.fetch()` re-enters; blows subrequest limits and costs per call. Refactor to a function call.

### D33. Interactive `wrangler login` in CI
**Smell.** Pipeline hangs waiting for browser auth.
**Why bad.** No browser. Use `CLOUDFLARE_API_TOKEN`.

### D34. Forgetting to deploy after `secret put`
**Smell.** `wrangler secret put X` then "why isn't the new key working?".
**Why bad.** Secrets attach per version; `put` updates the latest *uploaded* version, not the *active* one. Run `wrangler deploy` (or `versions deploy`) to roll it.
