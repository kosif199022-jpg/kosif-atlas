# Supabase — code-craft reference

~60 rules across three buckets. Covers Supabase platform usage in 2024–2026: Auth, Postgres + RLS, Realtime, Storage, Edge Functions, supabase-js v2, and the Supabase CLI. Postgres SQL fundamentals and ORM-specific rules (Drizzle/Prisma) live in sibling files; framework-specific routing/SSR rules live in their own files — only the auth-cookie boundary is touched here.

Sources: [supabase.com/docs](https://supabase.com/docs), [Supabase blog](https://supabase.com/blog), [supabase-js v2 reference](https://supabase.com/docs/reference/javascript), [@supabase/ssr docs](https://supabase.com/docs/guides/auth/server-side), Paul Copplestone (CEO) talks, Jon Meyers tutorials, Greg Richardson on RLS performance.

Loaded by `code-craft` when the user asks about Supabase or pastes Supabase code, SQL policies, or `supabase/` config for review.

---

## A — Tactical (day-to-day patterns)

### A1. Initialize and link via the CLI
**Rule.** Bootstrap with `supabase init`, then `supabase link --project-ref <ref>` to bind the local repo to a cloud project, and `supabase start` for the Docker stack.
**Reason.** Linking lets `db push`, `gen types --linked`, `functions deploy`, and `secrets set` target the right project without per-command flags.
```bash
supabase init
supabase link --project-ref abcdefghijklmno
supabase start  # local Postgres + Auth + Storage + Realtime + Studio
```

### A2. Migrations live in `supabase/migrations/`
**Rule.** Create migrations with `supabase migration new <name>`, edit the generated SQL file, commit it, then `supabase db diff` and `supabase db push` to apply remotely.
**Reason.** Versioned, ordered SQL files are the source of truth for schema; the CLI uses filename timestamps to track applied state.
```bash
supabase migration new add_posts_table
# edits supabase/migrations/20260101120000_add_posts_table.sql
supabase db diff && supabase db push
```

### A3. Never edit an applied migration
**Rule.** Once a migration is in `main`/applied to any environment, treat it as immutable; fix forward with a new migration. Same rule for renames — always `supabase migration new`, never rename by hand.
**Reason.** Editing changes content without re-running, and renames break the timestamp-ordered version key — both produce silent drift between local and remote.
```bash
# wrong: vim supabase/migrations/2026...add_posts.sql
# right
supabase migration new patch_posts
```

### A4. Regenerate types after every migration
**Rule.** Run `supabase gen types typescript --linked > src/lib/database.types.ts` and commit the result whenever schema changes; treat it as part of the migration commit, not a follow-up.
**Reason.** The generated `Database` type is what makes supabase-js queries safe; stale types let bad columns compile and crash at request time.
```bash
supabase migration new add_x && supabase db push && \
  supabase gen types typescript --linked > src/lib/database.types.ts
```

### A5. Type the client with `Database`
**Rule.** Always pass the generated type: `createClient<Database>(url, key)`. Never call `createClient(...)` untyped.
**Reason.** Without the generic, every `.from(...)` and `.rpc(...)` returns `any` and silently swallows column-name typos.
```ts
import type { Database } from '@/lib/database.types';
const supabase = createClient<Database>(url, anonKey); // wrong: createClient(url, key)
```

### A6. One factory per environment, not a singleton
**Rule.** Export separate `createBrowserClient`, `createServerClient` (cookie-bound), and `createServiceClient` factories; pick by call site.
**Reason.** Browser and server need different cookie/storage adapters, and the service role must never reach client bundles.
```ts
// lib/supabase/browser.ts -> createBrowserClient<Database>
// lib/supabase/server.ts  -> @supabase/ssr createServerClient with cookies()
// lib/supabase/admin.ts   -> service role, server-only
```

### A7. Three keys, three trust levels
**Rule.** `anon` is public and RLS-enforced; per-user `authenticated` JWT is what RLS reads via `auth.uid()`; `service_role` bypasses RLS and stays server-only.
**Reason.** Treating the keys as interchangeable is the #1 way to leak data — service role ≈ DB superuser.
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # safe in client
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # server only — no NEXT_PUBLIC_ / EXPO_PUBLIC_ / VITE_
```

### A8. Prefer `.maybeSingle()` over `.single()` for "0 or 1"
**Rule.** Use `.single()` only when the row must exist; `.maybeSingle()` returns `null` instead of throwing on zero rows.
**Reason.** `.single()` errors on zero AND on >1; `.maybeSingle()` keeps the "not found" path data-driven instead of try/catch.
```ts
// wrong
await supabase.from('users').select().eq('id', id).single();
// right (allow null)
await supabase.from('users').select().eq('id', id).maybeSingle();
```

### A9. Don't `select('*')` blindly
**Rule.** List the columns you need: `.select('id, email, created_at')`; reach for `*` only on small, fully-known tables.
**Reason.** `*` ships big columns (HTML, jsonb, bytea) over the wire and weakens generated types' usefulness.
```ts
// wrong
supabase.from('posts').select('*');
// right
supabase.from('posts').select('id, title, author_id, published_at');
```

### A10. Foreign-table embedding via FK
**Rule.** Pull related rows in one round trip with `select('*, author:profiles(*)')` — works only if a real FK exists between the tables.
**Reason.** It's a server-side join that respects RLS on each table; cheaper than N+1 client lookups.
```ts
const { data } = await supabase
  .from('posts')
  .select('id, title, author:profiles(id, username, avatar_url)');
```

### A11. Use `.in()` for batch reads, not a loop of `.single()`
**Rule.** Replace `for (id of ids) { .eq('id', id).single() }` with `.in('id', ids)` and group client-side.
**Reason.** N+1 over PostgREST is brutal — one round trip per id; `.in()` is one query.
```ts
const { data } = await supabase.from('users').select('id, name').in('id', ids);
```

### A12. Pagination with `.range(from, to)` plus `.order()`
**Rule.** Use `.range(from, to)` (inclusive) for offset paging and always pair with `.order()`.
**Reason.** Without an explicit `order`, page results are non-deterministic across requests.
```ts
const PAGE = 20;
const { data } = await supabase.from('posts')
  .select('id, title')
  .order('created_at', { ascending: false })
  .range(page * PAGE, page * PAGE + PAGE - 1);
```

### A13. Prefer `getUser()` over `getSession()` for trust decisions
**Rule.** Use `supabase.auth.getUser()` whenever the result drives authorization; `getSession()` returns whatever's cached and is not server-validated.
**Reason.** `getSession()` reads from the client's storage and can be tampered with; `getUser()` round-trips to GoTrue and verifies the JWT.
```ts
// wrong (server gating)
const { data: { session } } = await supabase.auth.getSession();
if (session?.user) doSensitive();
// right
const { data: { user } } = await supabase.auth.getUser();
if (user) doSensitive();
```
Source: [supabase.com/docs/reference/javascript/auth-getuser](https://supabase.com/docs/reference/javascript/auth-getuser).

### A14. `onAuthStateChange` for live UI state
**Rule.** Subscribe in a top-level effect; tear down with the returned `subscription.unsubscribe()` on unmount.
**Reason.** Forgetting cleanup leaks listeners across hot reload/navigation and fires callbacks against unmounted components.
```ts
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
  return () => subscription.unsubscribe();
}, []);
```

### A15. `signInWithOAuth` redirect URLs must be whitelisted
**Rule.** Configure `Site URL` and `Additional Redirect URLs` in Auth settings (or `[auth] additional_redirect_urls` in `supabase/config.toml`); pass an explicit `redirectTo` derived from env, not a literal `localhost`.
**Reason.** Unlisted URLs are blocked by GoTrue; hardcoding ships dev URLs to prod and breaks login.
```ts
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
});
```

### A16. Email OTP / magic link via `verifyOtp`
**Rule.** Pair `signInWithOtp({ email })` with `verifyOtp({ email, token, type: 'email' })` for code-based flows; magic links call back to `/auth/confirm` and you exchange via `exchangeCodeForSession`.
**Reason.** The token-vs-link split lets you support both numeric OTP UI and link-only UX with the same SDK.
```ts
await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${SITE}/auth/confirm` } });
await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
```

### A17. Storage uploads with deterministic paths
**Rule.** Use `supabase.storage.from(bucket).upload(path, file, { contentType, upsert })` and pick deterministic paths like `${userId}/${uuid}.jpg`.
**Reason.** RLS on `storage.objects` reads the path via `name`/`storage.foldername(name)`; random paths block per-user policies.
```ts
await supabase.storage
  .from('avatars')
  .upload(`${user.id}/${crypto.randomUUID()}.jpg`, file, { contentType: file.type, upsert: true });
```

### A18. Public vs signed URLs
**Rule.** Use `getPublicUrl(path)` only for public buckets; for private content, mint short-lived `createSignedUrl(path, ttlSeconds)`.
**Reason.** Public URLs bypass RLS — anyone with the URL has it forever; signed URLs expire.
```ts
const { data } = await supabase.storage.from('reports').createSignedUrl(path, 60);
```

### A19. Realtime channels: subscribe → unsubscribe
**Rule.** Hold the channel returned by `supabase.channel(...).subscribe()` and call `supabase.removeChannel(channel)` (or `channel.unsubscribe()`) on cleanup.
**Reason.** WebSocket leaks accumulate on every render/route change; eventually you hit the connection cap.
```ts
useEffect(() => {
  const ch = supabase.channel('posts')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handle)
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}, []);
```

### A20. Local stack mirrors prod
**Rule.** `supabase start` brings up Postgres, GoTrue, Storage, Realtime, and Studio at `localhost:54321`/`54323`. Use `supabase db reset` to rebuild from migrations + `seed.sql`.
**Reason.** Same Postgres extensions and RLS engine as cloud; reset is the only way to verify your migration list reproduces the schema you ship.
```bash
supabase start
supabase db reset
supabase status   # prints local URLs and keys
```

### A21. CLI deploy commands
**Rule.** Schema → `supabase db push`. Edge Function → `supabase functions deploy <name>`. Secret → `supabase secrets set NAME=value`.
**Reason.** Each artifact has its own deploy path; `db push` doesn't deploy functions, and `.env` files don't reach deployed functions.
```bash
supabase db push
supabase functions deploy stripe-webhook --no-verify-jwt
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

---

## B — Modern Supabase idioms

### B1. RLS on every user-data table
**Rule.** `ALTER TABLE x ENABLE ROW LEVEL SECURITY;` is mandatory for any public-schema table touched by `anon`/`authenticated`.
**Reason.** Without RLS, the anon key reads/writes everything — Supabase exposes the schema over PostgREST by default.
```sql
alter table public.posts enable row level security;
alter table public.posts force  row level security; -- also enforces against table owners
```

### B2. Enable RLS, then write policies
**Rule.** Always pair `ENABLE ROW LEVEL SECURITY` with at least one policy per intended action; a bare-enabled table denies all reads/writes silently.
**Reason.** PostgREST returns empty arrays / opaque errors when policies match nothing — looks like "no data" instead of "denied".
```sql
alter table public.posts enable row level security;
create policy "posts: read own" on public.posts
  for select to authenticated using (auth.uid() = user_id);
```

### B3. Per-action policies, not `FOR ALL`
**Rule.** Write separate `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies; reach for `FOR ALL` only when the predicate is genuinely identical for every action.
**Reason.** `FOR ALL` is a footgun — `WITH CHECK` semantics differ per action, and you almost always want owner-binding only on writes.
```sql
create policy "posts read"   on posts for select to authenticated using (auth.uid() = user_id);
create policy "posts insert" on posts for insert to authenticated with check (auth.uid() = user_id);
create policy "posts update" on posts for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "posts delete" on posts for delete to authenticated using (auth.uid() = user_id);
```

### B4. `USING` filters reads, `WITH CHECK` validates writes
**Rule.** On `UPDATE` policies, supply both — `USING` decides which rows are visible to update, `WITH CHECK` decides what they may become.
**Reason.** `WITH CHECK (true)` on update silently allows users to reassign `user_id` or escalate `role`.
```sql
-- wrong
create policy on posts for update using (auth.uid() = user_id) with check (true);
-- right
create policy on posts for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### B5. Owner-row pattern with typed `auth.uid()`
**Rule.** Standard ownership: `using (auth.uid() = user_id) with check (auth.uid() = user_id)`. Use a `uuid` column (not text) so the type matches `auth.uid()`.
**Reason.** Matching types lets Postgres use the index on `user_id`; type mismatches force casts and disable index usage.
```sql
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade
);
create index posts_user_id_created_at_idx on posts (user_id, created_at desc);
```

### B6. Index every column inside an RLS predicate
**Rule.** If a policy references `user_id`, `team_id`, or any other column (including FK joins inside `EXISTS`), index it on both sides.
**Reason.** RLS predicates run on every row read; without an index Postgres falls back to seq scans on multi-tenant tables.
```sql
create index team_members_team_user_idx on team_members (team_id, user_id);
```
Source: Greg Richardson — "RLS Performance and Best Practices" on the Supabase blog.

### B7. Wrap `auth.uid()` in `(select auth.uid())` for hot policies
**Rule.** Inside busy policies, write `(select auth.uid()) = user_id` instead of `auth.uid() = user_id`.
**Reason.** The subselect lets Postgres treat the result as an init-plan constant and cache it once per query, instead of calling `auth.uid()` per row.
```sql
create policy "fast read" on posts for select to authenticated
  using ((select auth.uid()) = user_id);
```
Source: [supabase.com/docs/guides/database/postgres/row-level-security#performance](https://supabase.com/docs/guides/database/postgres/row-level-security).

### B8. Cross-table policies via `EXISTS`
**Rule.** For team/membership models, gate with `exists (select 1 from team_members tm where tm.team_id = posts.team_id and tm.user_id = (select auth.uid()))`.
**Reason.** `EXISTS` collapses to a semi-join Postgres optimizes well; policy joins via subqueries don't.
```sql
create policy "posts in my teams" on posts for select to authenticated
  using (exists (
    select 1 from team_members tm
    where tm.team_id = posts.team_id and tm.user_id = (select auth.uid())
  ));
```

### B9. Custom claims via `auth.jwt()`
**Rule.** Read custom claims from the JWT with `auth.jwt() ->> 'role'` (or `-> 'app_metadata' ->> 'plan'`); inject them via an Auth Hook (`access_token` hook) or service-role write to `app_metadata`.
**Reason.** Lets policies branch on user attributes (`plan`, `org_role`) without an extra DB lookup per row.
```sql
create policy "pro features" on premium_data for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'plan') = 'pro');
```

### B10. `security definer` functions for privileged ops
**Rule.** Wrap policy-bypassing logic in a `language plpgsql security definer` function with a locked `search_path`; do auth checks inside the function body.
**Reason.** Keeps powerful logic auditable in one place; callable via `supabase.rpc(...)` with the user's JWT but the function's privileges. Same pattern works for `pg_cron` callees that would otherwise hit RLS.
```sql
create or replace function public.transfer_credits(to_user uuid, amount int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  -- ... privileged write
end $$;
revoke all on function public.transfer_credits from public;
grant  execute on function public.transfer_credits to authenticated;
```

### B11. Triggers for derived data and signup hooks
**Rule.** Use `BEFORE INSERT` for default fields; `AFTER INSERT` on `auth.users` to mirror a `profiles` row.
**Reason.** Centralizes invariants in the DB; signup-side-effects survive whether the user signed up via OAuth, OTP, or password.
```sql
create function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin insert into public.profiles (id, email) values (new.id, new.email); return new; end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
```

### B12. RPC for cross-row business logic
**Rule.** Replace multi-step client transactions with a single `language plpgsql` function called via `supabase.rpc('name', { ... })`.
**Reason.** One round trip, atomic in the DB, and the function body is testable from `psql` independently of the SDK.
```ts
const { data, error } = await supabase.rpc('transfer_credits', { to_user: id, amount: 10 });
```

### B13. `@supabase/ssr` for server-side auth
**Rule.** Use `createServerClient` from `@supabase/ssr` with a cookies adapter (Next.js Route Handlers/Server Components, Astro endpoints, Remix loaders, SvelteKit hooks). Don't use the deprecated `@supabase/auth-helpers-*` packages.
**Reason.** It refreshes tokens via cookies on every request — the auth-helpers packages don't support the modern PKCE/cookies flow and are no longer maintained.
```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export const supabaseServer = () => {
  const store = cookies();
  return createServerClient<Database>(URL, ANON, {
    cookies: {
      get: (n) => store.get(n)?.value,
      set: (n, v, o) => store.set({ name: n, value: v, ...o }),
      remove: (n, o) => store.set({ name: n, value: '', ...o }),
    },
  });
};
```
Source: [supabase.com/docs/guides/auth/server-side](https://supabase.com/docs/guides/auth/server-side).

### B14. Mobile/Expo: `expo-secure-store` adapter
**Rule.** On React Native/Expo, configure `auth.storage` with `expo-secure-store` and set `detectSessionInUrl: false`; configure deep links for password reset.
**Reason.** AsyncStorage is unencrypted — SecureStore uses Keychain/Keystore. URL detection breaks where there is no `window.location`.
```ts
const supabase = createClient<Database>(URL, ANON, {
  auth: {
    storage: { getItem: SecureStore.getItemAsync, setItem: SecureStore.setItemAsync, removeItem: SecureStore.deleteItemAsync },
    autoRefreshToken: true, persistSession: true, detectSessionInUrl: false,
  },
});
```

### B15. Realtime + RLS: pass the JWT
**Rule.** Call `supabase.realtime.setAuth(accessToken)` after sign-in (and on token refresh) so RLS applies to channel subscriptions.
**Reason.** Without `setAuth`, channels run as `anon` and quietly drop rows the user could read via REST.
```ts
const { data: { session } } = await supabase.auth.getSession();
if (session) supabase.realtime.setAuth(session.access_token);
```

### B16. Edge Functions are Deno
**Rule.** Import via `jsr:` or `npm:` specifiers, read env with `Deno.env.get`, deploy from `supabase/functions/<name>/index.ts`, and don't put SQL functions in this folder (those live in `migrations/`).
**Reason.** The runtime resolves URL/JSR specifiers — no `node_modules`. Mixing SQL into `functions/` confuses deploys (`functions deploy` ignores SQL, `db push` ignores TS).
```ts
import { createClient } from 'jsr:@supabase/supabase-js@2';
Deno.serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  return new Response('ok');
});
```

### B17. Edge Function: propagate the caller's JWT
**Rule.** Build the per-request client with `global.headers.Authorization = req.headers.get('Authorization')!` so RLS sees the caller's identity.
**Reason.** Without this, the function runs as `anon` and either fails or returns mis-scoped data.
```ts
const supabase = createClient(URL, ANON, {
  global: { headers: { Authorization: req.headers.get('Authorization')! } },
});
const { data: { user } } = await supabase.auth.getUser();
```

### B18. Edge Function CORS preflight
**Rule.** Reply to `OPTIONS` with explicit `Access-Control-Allow-*` headers and echo the same on the real response; don't rely on a default.
**Reason.** Browsers block credentialed POSTs without the preflight; the Supabase platform doesn't add CORS for you.
```ts
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
Deno.serve((req) => req.method === 'OPTIONS'
  ? new Response('ok', { headers: cors })
  : new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'content-type': 'application/json' } }));
```

### B19. `pg_cron` for scheduled jobs
**Rule.** Schedule from a migration: `select cron.schedule('nightly', '0 2 * * *', $$ call public.purge_expired(); $$);`. Wrap callees in `security definer` if they need to bypass RLS.
**Reason.** Migration-defined jobs travel with the schema; ad-hoc Studio jobs don't replicate to other environments, and bare cron writes can be silently blocked by RLS.
```sql
create extension if not exists pg_cron with schema extensions;
select cron.schedule('purge', '0 2 * * *', $$ call public.purge_expired(); $$);
```

### B20. `pgvector` for embeddings
**Rule.** Enable the extension, store with `vector(1536)`, and create an `hnsw` (or `ivfflat`) index for the operator you query with (`<=>` cosine, `<->` L2, `<#>` inner-product).
**Reason.** Without an ANN index, every similarity query is a sequential scan — fine at 1k rows, useless at 1M.
```sql
create extension if not exists vector;
create table docs (id uuid primary key, embedding vector(1536));
create index docs_embedding_idx on docs using hnsw (embedding vector_cosine_ops);
-- select id from docs order by embedding <=> $1 limit 10;
```

### B21. Storage RLS lives on `storage.objects`
**Rule.** Write policies that check `bucket_id`, `name` (use `storage.foldername(name)`), `auth.uid()`, and `auth.role()`.
**Reason.** Bucket privacy is enforced via RLS, not a bucket-level toggle alone — public buckets without policies are wide open for list/upload/delete.
```sql
create policy "users read own folder" on storage.objects for select to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

### B22. Use generated types end-to-end
**Rule.** Type the client with `Database`, type rows with `Database['public']['Tables']['posts']['Row']`, and never cast to `any`.
**Reason.** Embedded selects and RPC calls produce precise types — losing them defeats the purpose of `gen types`.
```ts
type Post       = Database['public']['Tables']['posts']['Row'];
type PostInsert = Database['public']['Tables']['posts']['Insert'];
```

### B23. Define FKs so embeds and types work
**Rule.** Always declare `references()` between related tables (or `foreign key` in raw SQL). Embeds respect RLS on both sides — both tables must allow the caller to read.
**Reason.** PostgREST infers embed relationships from FKs; without them you get "could not find a relationship" errors and missing types. Disabling RLS on the child to "fix" missing rows exposes everything.
```sql
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade
);
```

### B24. Mirror `auth.users` into `public.profiles`
**Rule.** Don't `select * from auth.users` in app SQL or via `from('auth.users')`; mirror the columns you need into a `public.profiles` table joined on `id`.
**Reason.** `auth.users` is managed by GoTrue with its own access rules; querying it from public-schema policies leaks email/phone and breaks on platform updates.
```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique, avatar_url text
);
-- populated via the on_auth_user_created trigger above
```

---

## D — Anti-patterns / smells

### D1. Service role key in client code
**Rule.** Never import the service role key in code that ships to the browser/RN bundle, and never prefix it with `NEXT_PUBLIC_` / `EXPO_PUBLIC_` / `VITE_` / `PUBLIC_`.
**Reason.** Those prefixes inline the value into the JS bundle at build time — instantly public, and service role is superuser.
```ts
// wrong
'use client'; const supabase = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);
// also wrong: NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
// right: keep service-role calls in server actions / Edge Functions / API routes
```

### D2. RLS off on user data
**Rule.** Don't ship a `public` table holding user-owned rows with RLS disabled, and don't rely on client-side `.eq('user_id', auth.uid())` as the security boundary.
**Reason.** Every anon-key call sees and mutates everything; client filters are UX, not auth — anyone calling the API directly drops them.
```sql
-- wrong: forgot to enable
create table notes (id uuid primary key, user_id uuid, body text);
-- right
alter table notes enable row level security;
```

### D3. RLS on, no policies
**Rule.** Don't enable RLS without writing policies — reads return empty, writes raise vague errors.
**Reason.** Looks like "no data" or "permission denied for table" with no obvious fix.
```sql
-- wrong: enables but never adds a SELECT policy → reads always empty
alter table notes enable row level security;
```

### D4. `FOR ALL` swallowing per-action checks
**Rule.** Avoid `for all` policies whose `with check` is missing or weaker than the read predicate, and never `with check (true)` on `update`.
**Reason.** Lets users insert rows they don't own, or update owned rows into rows they shouldn't (reassign `team_id`, escalate `role`).
```sql
-- wrong
create policy on notes for all to authenticated using (auth.uid() = user_id);
-- right: split per action with explicit with check
```

### D5. `getSession()` for auth gates
**Rule.** Don't gate sensitive server actions on `getSession()` — it's whatever's in storage and not validated.
**Reason.** Calls succeed even with a tampered/expired session; `getUser()` round-trips to GoTrue and verifies.
```ts
// wrong
const { data: { session } } = await supabase.auth.getSession();
if (session) doSensitive();
// right
const { data: { user } } = await supabase.auth.getUser();
if (user) doSensitive();
```

### D6. `update()` / `delete()` without `.eq()`
**Rule.** Always pair writes with a filter (`.eq('id', id)` etc.); a bare `update`/`delete` mutates every row the policy lets you touch.
**Reason.** The supabase-js builder doesn't require a where clause — combined with permissive RLS, you wipe a table.
```ts
// wrong
await supabase.from('posts').update({ pinned: false });
// right
await supabase.from('posts').update({ pinned: false }).eq('id', id);
```

### D7. Public buckets without policies
**Rule.** Don't flip a Storage bucket to public expecting that to be the security model.
**Reason.** Public means "anyone with a URL can GET"; without `storage.objects` policies, anyone can also list/upload/delete via the API.
```sql
create policy "users upload to own folder" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

### D8. JWT in `localStorage` for SSR apps
**Rule.** On the web, prefer `@supabase/ssr` httpOnly cookies; reserve `localStorage` for pure SPAs that have no server.
**Reason.** XSS can read `localStorage`; httpOnly cookies aren't reachable from JS.
```ts
// SPA-only fallback
createClient(URL, ANON, { auth: { storage: window.localStorage } });
// SSR: use createBrowserClient + createServerClient from @supabase/ssr
```

### D9. Hardcoded `redirectTo`
**Rule.** Don't ship `redirectTo: 'http://localhost:3000/...'` or hand-write template URLs; derive from `process.env.SITE_URL` and reference `{{ .ConfirmationURL }}` in email templates.
**Reason.** Magic links and confirmation emails land on dev URLs in production — users can't sign in.
```ts
const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
```

### D10. Edge Function with no preflight
**Rule.** Don't deploy a function that only handles `POST` — browsers send `OPTIONS` first for credentialed/JSON requests.
**Reason.** Preflight failure → opaque "CORS error" client-side; the function never even runs.
```ts
if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
```

### D11. Service role in user-scoped Edge Functions
**Rule.** Don't reach for the service role just to "make the query work" in a user-facing endpoint — propagate the caller's JWT and let RLS handle authz.
**Reason.** Service role bypasses RLS, so a logic bug exposes every user's data; reserve it for clearly admin tasks (cron, webhooks, server-to-server).
```ts
// wrong (user-scoped endpoint)
const supabase = createClient(URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
// right
const supabase = createClient(URL, ANON, { global: { headers: { Authorization: req.headers.get('Authorization')! } } });
```

### D12. `db push` without diff
**Rule.** Run `supabase db diff` (or `supabase db diff -f <name>` to materialize) before `supabase db push` against prod.
**Reason.** Push happily applies destructive changes (column drops, table renames) — diff first, eyeball second.
```bash
supabase db diff
supabase db push
```

### D13. Untyped `createClient(...)`
**Rule.** Always pass `<Database>`; flag any `createClient(...)` without it in review.
**Reason.** Without the generic, every query result is `any`/`unknown`, generated types are dead weight.
```ts
// wrong
const supabase = createClient(URL, ANON);
// right
const supabase = createClient<Database>(URL, ANON);
```

### D14. Re-implementing auth on top of Supabase
**Rule.** Don't roll your own session table, password reset, or OAuth flow when GoTrue ships them.
**Reason.** GoTrue handles password hashing (Argon2/scrypt), token rotation, OAuth, MFA, and rate-limits — re-implementing is a security regression.
```ts
// wrong: custom users table + bcrypt + your own JWT
// right: supabase.auth.signInWithPassword / signInWithOAuth / verifyOtp
```

### D15. Long-running work in Edge Functions
**Rule.** Don't run multi-minute jobs (large imports, image batches) in Edge Functions; queue to a worker, use `pg_cron`, or split via Database webhooks.
**Reason.** Edge runtimes have CPU and wall-clock limits; long jobs are killed mid-flight.
```ts
// wrong: a 5-minute CSV import in a single edge invocation
// right: enqueue rows / chunk via cron / background worker
```

---

## Sources

- [Supabase docs — Auth, Database, Storage, Realtime, Edge Functions](https://supabase.com/docs)
- [Supabase blog — release notes and deep-dives](https://supabase.com/blog)
- [supabase-js v2 reference](https://supabase.com/docs/reference/javascript)
- [@supabase/ssr — server-side auth and cookies](https://supabase.com/docs/guides/auth/server-side)
- [Row Level Security — performance and best practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase CLI reference — init, link, db, gen, functions, secrets](https://supabase.com/docs/reference/cli)
- [Storage RLS and `storage.objects`](https://supabase.com/docs/guides/storage/security/access-control)
- [pgvector on Supabase — embeddings, hnsw, ivfflat](https://supabase.com/docs/guides/ai/vector-columns)
- [pg_cron on Supabase](https://supabase.com/docs/guides/database/extensions/pg_cron)
- Greg Richardson — RLS performance posts on the Supabase blog and X
- Jon Meyers — Supabase + Next.js / SvelteKit tutorial series
- Paul Copplestone — Supabase keynote and architecture talks
