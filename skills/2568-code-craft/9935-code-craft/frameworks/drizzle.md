# Drizzle ORM — code-craft reference

~60 rules across three buckets. Covers Drizzle ORM 0.30+ across Postgres, MySQL, and SQLite/D1 dialects; dialect-specific differences flagged inline. SQL fundamentals (joins, indexing theory) assumed — focus is on Drizzle's API and idioms.

Sources: [orm.drizzle.team/docs](https://orm.drizzle.team/docs/overview), [Drizzle blog](https://orm.drizzle.team/blog), [drizzle-kit docs](https://orm.drizzle.team/docs/kit-overview), Andrew Sherman / Drizzle team posts on X, Theo (t3.gg) coverage of Drizzle vs Prisma, Lucia / Auth.js docs that integrate Drizzle.

Loaded by `code-craft` when the user asks about Drizzle ORM or pastes Drizzle code for review.

---

## A — Tactical (day-to-day patterns)

### A1. Pick the right table builder per dialect
**Rule.** Use `pgTable`, `mysqlTable`, or `sqliteTable` from the matching `drizzle-orm/<dialect>` import — never mix.
**Reason.** Each dialect exposes different column types and modifier semantics; mixing produces wrong SQL or runtime errors.
```ts
// wrong
import { pgTable, integer } from 'drizzle-orm/pg-core';
// schema targets MySQL
// right
import { mysqlTable, int, varchar } from 'drizzle-orm/mysql-core';
export const users = mysqlTable('users', { id: int('id').primaryKey() });
```

### A2. Column builders match dialect types
**Rule.** Use `serial()`/`bigserial()` (PG), `int().autoincrement()` (MySQL), `integer().primaryKey({ autoIncrement: true })` (SQLite) — not a generic `id` pattern across dialects.
**Reason.** SQLite has no `serial`; MySQL needs `autoincrement()`; PG `serial` is shorthand for `integer + sequence`.
```ts
// pg
id: serial('id').primaryKey(),
// mysql
id: int('id').autoincrement().primaryKey(),
// sqlite
id: integer('id').primaryKey({ autoIncrement: true }),
```

### A3. `.notNull()` belongs on every column you mean to require
**Rule.** Add `.notNull()` to all columns that are not optional; chain after the type, before `.default()`.
**Reason.** Drizzle defaults to nullable; the `$inferInsert` type silently makes the field optional and lets `null` slip through.
```ts
// wrong
email: text('email'),                // type: string | null
// right
email: text('email').notNull(),      // type: string
```

### A4. `.default()` for SQL-side, `.$defaultFn()` for client-side
**Rule.** Use `.default(sql\`now()\`)` / `.defaultNow()` for DB-evaluated defaults; use `.$defaultFn(() => createId())` for values generated in TS at insert time.
**Reason.** SQL defaults run on the server (consistent clock, transactional). `$defaultFn` runs once per insert in your runtime — required for client-generated IDs (cuid, ulid).
```ts
createdAt: timestamp('created_at').defaultNow().notNull(),
id: text('id').$defaultFn(() => createId()).primaryKey(),
```

### A5. `.$onUpdate()` for `updatedAt`
**Rule.** Set `updatedAt: timestamp().$onUpdate(() => new Date())` so every `db.update()` refreshes the column.
**Reason.** Drizzle injects the value into every update statement; you don't need to remember it at every call site.
```ts
updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
```

### A6. Foreign keys via `.references()` with explicit `onDelete`
**Rule.** Always specify `onDelete` (`'cascade' | 'set null' | 'restrict' | 'no action'`) on `.references()`.
**Reason.** Default is `'no action'` — application deletes silently fail or orphan rows depending on dialect.
```ts
authorId: integer('author_id')
  .notNull()
  .references(() => users.id, { onDelete: 'cascade' }),
```

### A7. Composite keys via `primaryKey()` table builder
**Rule.** Declare composite primary keys in the second argument: `(t) => ({ pk: primaryKey({ columns: [t.a, t.b] }) })`.
**Reason.** Column-level `.primaryKey()` only supports single columns; the table builder handles composite and named PKs.
```ts
export const userRoles = pgTable('user_roles', {
  userId: integer('user_id').notNull(),
  roleId: integer('role_id').notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.roleId] }) }));
```

### A8. Indexes declared in the table builder, not inline
**Rule.** Define `index('name').on(t.col)` and `uniqueIndex(...)` in the second-arg callback.
**Reason.** Drizzle generates migrations from the table builder; inline column hints don't produce `CREATE INDEX`.
```ts
export const posts = pgTable('posts', {
  authorId: integer('author_id').notNull(),
  createdAt: timestamp('created_at').notNull(),
}, (t) => ({
  byAuthor: index('posts_author_idx').on(t.authorId, t.createdAt.desc()),
}));
```

### A9. Relations API for typed eager loads
**Rule.** Declare `relations(users, ({ one, many }) => ({ posts: many(posts) }))` per table to enable `db.query.users.findMany({ with: { posts: true } })`.
**Reason.** RQB (`db.query.*`) requires relations; without them, `with` is unavailable and you fall back to manual joins.
```ts
export const usersRelations = relations(users, ({ many }) => ({ posts: many(posts) }));
export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
}));
```

### A10. Two query layers — pick per use case
**Rule.** Use `db.query.*` (RQB) for read-heavy fetches with relations; use `db.select()` (Core) for writes, dynamic conditions, complex aggregates.
**Reason.** RQB returns nicely nested objects but can't express arbitrary SQL; Core is type-safe SQL builder with full power.
```ts
// RQB — nested read
const posts = await db.query.posts.findMany({ with: { author: true } });
// Core — aggregate
const counts = await db.select({ n: sql<number>`count(*)::int` }).from(posts);
```
[Source: orm.drizzle.team/docs/rqb vs core trade-off discussion in Drizzle blog "Why two query APIs?"]

### A11. Conditions compose via `and` / `or` arrays
**Rule.** Build `where` from `and(...filters)` / `or(...filters)` accepting variadic conditions; `undefined` entries are filtered out.
**Reason.** Drizzle's `and`/`or` skip undefined, so optional filters can be added conditionally without branching SQL strings.
```ts
const filters = [eq(users.org, orgId)];
if (active) filters.push(eq(users.active, true));
await db.select().from(users).where(and(...filters));
```

### A12. `inArray` for IN clauses, never string-built
**Rule.** Use `inArray(col, values)`; for empty arrays, short-circuit to avoid `WHERE col IN ()`.
**Reason.** Empty `IN ()` is SQL-invalid; building strings with `.join(',')` is a SQL injection vector.
```ts
if (ids.length === 0) return [];
await db.select().from(users).where(inArray(users.id, ids));
```

### A13. `sql` template for typed escape hatches
**Rule.** Use `sql<T>\`...\`` with a generic to type the result; embed columns/params via `${}` interpolation, never string concat.
**Reason.** Interpolated values bind as parameters (safe); a typed `sql<T>` flows through the rest of the query inference.
```ts
const total = sql<number>`count(*)::int`.as('total');
await db.select({ total }).from(posts);
```

### A14. `returning()` for inserts/updates/deletes (PG, SQLite)
**Rule.** Chain `.returning()` to get the affected rows back; specify columns to limit payload.
**Reason.** Saves a follow-up `SELECT`; MySQL doesn't support it — use `insertId` or re-select.
```ts
const [user] = await db.insert(users).values({ email }).returning({ id: users.id });
```

### A15. Upsert via `onConflictDoUpdate` (PG/SQLite) / `onDuplicateKeyUpdate` (MySQL)
**Rule.** Use the dialect-specific upsert helper with an explicit `target` (PG/SQLite) or rely on unique key (MySQL).
**Reason.** Conflict targeting requires a unique/PK constraint; without `target`, PG throws.
```ts
// pg / sqlite
await db.insert(users).values(row).onConflictDoUpdate({
  target: users.email,
  set: { name: row.name },
});
// mysql
await db.insert(users).values(row).onDuplicateKeyUpdate({ set: { name: row.name } });
```

### A16. Transactions wrap multi-write business ops
**Rule.** Use `await db.transaction(async (tx) => { ... })`; pass `tx` (not `db`) to every call inside.
**Reason.** Using `db` inside the callback escapes the transaction — those statements commit independently.
```ts
await db.transaction(async (tx) => {
  const [u] = await tx.insert(users).values(...).returning();
  await tx.insert(profiles).values({ userId: u.id, ... });
});
```

### A17. `tx.rollback()` to abort
**Rule.** Throw or call `tx.rollback()` inside the transaction callback to abort.
**Reason.** A normal `return` commits; `rollback()` is the explicit signal — and it throws under the hood, so don't wrap it in try/catch.
```ts
await db.transaction(async (tx) => {
  if (!ok) tx.rollback();
});
```

### A18. Prepared statements on hot paths
**Rule.** Define hot-path queries once with `.prepare('name')` and call `.execute({ params })` per request.
**Reason.** PG and MySQL cache the query plan; SQLite caches the compiled statement. Skips re-parse cost on every call.
```ts
const getUser = db.select().from(users)
  .where(eq(users.id, sql.placeholder('id')))
  .prepare('get_user');
const [u] = await getUser.execute({ id });
```

### A19. Type inference: `$inferSelect` / `$inferInsert`
**Rule.** Derive row and insert types from the table: `type User = typeof users.$inferSelect`.
**Reason.** Always in sync with the schema; no hand-written DTOs to drift. Avoid the legacy `InferSelectModel<typeof users>`.
```ts
type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;
```

### A20. Schema modules per domain
**Rule.** Split schema into `db/schema/<domain>.ts`, re-export from `db/schema/index.ts`, point `drizzle.config.ts` at the glob.
**Reason.** Co-locates each domain's tables + relations; keeps any single file under a few hundred lines.
```ts
// drizzle.config.ts
export default { dialect: 'postgresql', schema: './db/schema/*', out: './drizzle', /* ... */ };
```

### A21. Naming: TS camelCase, DB snake_case
**Rule.** Use camelCase TS keys mapped to snake_case via second arg, or set `casing: 'snake_case'` in `drizzle.config.ts` to do it once.
**Reason.** Idiomatic in both worlds; explicit mapping prevents quoting issues across PG/MySQL.
```ts
createdAt: timestamp('created_at').notNull(),
// or globally
// drizzle.config.ts: casing: 'snake_case'
```

### A22. `drizzle.config.ts` is the migration source of truth
**Rule.** Configure `dialect`, `schema`, `out`, `dbCredentials`, `casing`, and `migrations.table` once.
**Reason.** All `drizzle-kit` commands read this file; CLI flags should be the exception, not the rule.
```ts
export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema/*',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

### A23. Driver setup: pick per runtime
**Rule.** Use `postgres-js` / `pg` for Node, `neon-http` for serverless edge, `@planetscale/database` / `mysql2` for MySQL, `better-sqlite3` / `bun:sqlite` / `libsql` / `drizzle-orm/d1` for SQLite.
**Reason.** Wrong driver = either won't run on the runtime (e.g. `mysql2` in Workers) or wastes cold-start budget.
```ts
// edge (Cloudflare Workers, Vercel Edge)
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
const db = drizzle(neon(env.DATABASE_URL));
```
[Source: orm.drizzle.team/docs/connect-overview; Neon "Why neon-http for edge" blog]

### A24. Postgres serverless: `prepare: false`, `max: 1`
**Rule.** Configure `postgres-js` with `{ prepare: false, max: 1 }` in serverless functions; pool only in long-running processes.
**Reason.** Lambdas/Workers spawn many short-lived instances; pooling explodes upstream connections. `prepare: false` avoids prepared-statement caching that breaks across PgBouncer transaction mode.
```ts
const sql = postgres(url, { prepare: false, max: 1 });
const db = drizzle(sql);
```

### A25. Migrations: generate, review, apply
**Rule.** `drizzle-kit generate` from schema → review SQL → commit `drizzle/` → apply with `drizzle-kit migrate` (CI) or `migrate(db, { migrationsFolder })` (runtime).
**Reason.** Generated SQL is the audit trail; manual review catches destructive intent before it hits prod.
```bash
pnpm drizzle-kit generate    # writes drizzle/0001_*.sql + meta
pnpm drizzle-kit migrate     # applies pending migrations
```

### A26. Commit the `drizzle/` folder to git
**Rule.** Track every generated SQL file and the `_meta` snapshots.
**Reason.** Drift detection between schema and applied state requires the `_journal.json` history; without it, `drizzle-kit` regenerates from scratch.

---

## B — Modern Drizzle idioms

### B1. RQB for relation reads, Core for everything else
**Rule.** Reach for `db.query.x.findMany({ with, columns, where })` when the response shape mirrors the relation graph; drop to `db.select()` the moment you need aggregates, dynamic columns, or window functions.
**Reason.** RQB optimizes JSON aggregation and gives nested types for free; Core is the only API that expresses the full SQL surface.
```ts
const post = await db.query.posts.findFirst({
  where: eq(posts.id, id),
  with: { author: true, comments: { limit: 5, orderBy: desc(comments.createdAt) } },
  columns: { secret: false },
});
```
[Source: Drizzle blog "Relational Queries"; Andrew Sherman X thread on RQB JSON_AGG strategy]

### B2. Soft delete via `deletedAt` + helper
**Rule.** Add `deletedAt: timestamp()` (nullable) and a `notDeleted` filter helper; never `db.delete()` from app code.
**Reason.** Recoverable, auditable, and FK-safe. Wrap reads in a default scope so callers can't forget.
```ts
const notDeleted = (t: typeof users) => isNull(t.deletedAt);
await db.select().from(users).where(and(eq(users.org, org), notDeleted(users)));
```

### B3. Partial unique index for soft-delete uniqueness
**Rule.** Use `uniqueIndex('users_email_active').on(t.email).where(sql\`deleted_at is null\`)` so soft-deleted rows don't collide with new signups.
**Reason.** A plain unique index blocks re-registering an email after soft-delete.
```ts
(t) => ({
  emailActive: uniqueIndex('users_email_active').on(t.email).where(sql`deleted_at is null`),
})
```

### B4. Composite index column order = selectivity first
**Rule.** Lead with the highest-cardinality / equality-filtered column; trailing columns serve range scans and ordering.
**Reason.** A `(orgId, createdAt)` index serves `WHERE org=? ORDER BY createdAt`; reversing it makes the index unusable for the equality predicate.
```ts
(t) => ({
  feed: index('posts_feed').on(t.orgId, t.createdAt.desc()),
})
```

### B5. Multi-tenant: `orgId` on every table + index
**Rule.** Carry `orgId` (or tenant key) as a column on every tenant-scoped table; lead the composite index with it.
**Reason.** Lets you push tenant filtering into every query and share one DB safely. Per-tenant `pgSchema('tenant_x')` is the alternative for hard isolation.
```ts
orgId: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
// index: (t) => ({ org: index().on(t.orgId, t.createdAt.desc()) })
```

### B6. Typed JSON columns
**Rule.** Use `jsonb<MyShape>('payload')` (PG) / `json<T>()` (MySQL/SQLite) and validate at write-time with Zod.
**Reason.** TS type alone is a lie — DB stores whatever you send. Pair the type with runtime validation.
```ts
payload: jsonb('payload').$type<EventPayload>().notNull(),
// at write:
await db.insert(events).values({ payload: EventSchema.parse(input) });
```

### B7. Custom column types for shaped data
**Rule.** Use `customType<{ data: T; driverData: string }>({ dataType: () => 'text', toDriver, fromDriver })` for typed wrappers (`Decimal`, `Money`, encrypted blobs).
**Reason.** Centralizes serialization; query results are pre-decoded into the right shape.
```ts
const money = customType<{ data: Decimal; driverData: string }>({
  dataType: () => 'numeric',
  toDriver: (v) => v.toString(),
  fromDriver: (v) => new Decimal(v as string),
});
```

### B8. `pgEnum` / `mysqlEnum` for closed sets
**Rule.** Use `pgEnum('role', ['admin','user'])` (PG creates a real enum type) or `mysqlEnum(...)` for finite values; CHECK constraints for evolving sets.
**Reason.** Enums give a real DB-level constraint and an inferred TS union; CHECK is more flexible to alter.
```ts
export const role = pgEnum('role', ['admin', 'user']);
role: role('role').notNull().default('user'),
```

### B9. Counts use casted `sql<number>`
**Rule.** Write `sql<number>\`count(*)::int\`` (or `cast(count(*) as signed)` in MySQL); never select raw `count(*)` and trust the type.
**Reason.** PG returns `bigint` as a string by default; without the cast you get a string back at runtime despite the TS number type.
```ts
const [{ n }] = await db
  .select({ n: sql<number>`count(*)::int` })
  .from(posts)
  .where(eq(posts.authorId, id));
```

### B10. Keyset pagination over offset
**Rule.** Paginate large tables with `WHERE (createdAt, id) < (?, ?) ORDER BY createdAt DESC, id DESC LIMIT N`.
**Reason.** `OFFSET 100000` scans 100k rows; keyset is constant-cost and stable under inserts.
```ts
await db.select().from(posts)
  .where(and(eq(posts.org, org), lt(posts.createdAt, cursor)))
  .orderBy(desc(posts.createdAt), desc(posts.id))
  .limit(20);
```

### B11. Batch inserts in chunks
**Rule.** Insert with `.values(rows)` in chunks of 500–1000; combine with `onConflictDoNothing()` for idempotent imports.
**Reason.** PG's parameter limit is 65k; one giant insert blows past it. Chunking also bounds transaction size.
```ts
for (const batch of chunk(rows, 500)) {
  await db.insert(items).values(batch).onConflictDoNothing();
}
```

### B12. Self-joins with `alias`
**Rule.** Use `alias(table, 'name')` to refer to the same table twice in one query.
**Reason.** Without aliasing, the join generates ambiguous SQL and the type narrowing breaks.
```ts
const m = alias(users, 'manager');
await db.select().from(users).leftJoin(m, eq(users.managerId, m.id));
```

### B13. CTEs with `db.with`
**Rule.** Build CTEs via `const cte = db.$with('cte_name').as(query)` then `db.with(cte).select(...).from(cte)`.
**Reason.** Idiomatic, type-safe wrapper for `WITH` — beats hand-rolled `sql\`with ... as ...\``.
```ts
const recent = db.$with('recent').as(
  db.select().from(posts).where(gt(posts.createdAt, since))
);
await db.with(recent).select().from(recent).where(eq(recent.org, org));
```

### B14. Read replicas via two `db` instances
**Rule.** Wire a `dbRead` (replica DSN) and `dbWrite` (primary); explicitly route read-only queries.
**Reason.** Drizzle has no auto-routing; making the choice explicit prevents stale-read-on-write bugs.
```ts
export const dbWrite = drizzle(primary);
export const dbRead = drizzle(replica);
```

### B15. `drizzle-zod` for shared validation
**Rule.** Generate insert/select schemas with `createInsertSchema(users).pick({ email: true, name: true })` and reuse on the API edge.
**Reason.** One source of truth — schema changes propagate to validation and types together.
```ts
import { createInsertSchema } from 'drizzle-zod';
const NewUser = createInsertSchema(users).pick({ email: true, name: true });
```

### B16. `drizzle-kit push` is for prototyping only
**Rule.** Use `push` against local/dev DBs; production must go through generated migrations.
**Reason.** `push` diffs the schema against the live DB and applies destructive changes without a reviewable SQL file or audit trail.
```bash
# dev only
pnpm drizzle-kit push
# prod
pnpm drizzle-kit generate && pnpm drizzle-kit migrate
```
[Source: orm.drizzle.team/docs/migrations — "push vs migrate"; multiple Drizzle team posts cautioning against push in prod]

### B17. `drizzle-kit studio` stays local
**Rule.** Run Studio against local/dev DSNs; tunnel to staging only over SSH or VPN; never expose to prod.
**Reason.** Studio is a full read/write UI without auth — exposing it is a data-loss risk.
```bash
pnpm drizzle-kit studio   # http://local.drizzle.studio
```

### B18. Edge-runtime drivers
**Rule.** In Workers / Vercel Edge, use `neon-http`, `@planetscale/database`, or `drizzle-orm/d1`; avoid `pg`, `mysql2`, `postgres-js`.
**Reason.** The first group is HTTP-based and fetch-compatible; the second relies on `node:net` and won't run.
```ts
// Cloudflare Workers + D1
import { drizzle } from 'drizzle-orm/d1';
const db = drizzle(env.DB);
```
[Source: Cloudflare Workers + Drizzle guide; Neon "Edge driver" announcement]

### B19. RLS in Postgres via raw migration
**Rule.** Manage `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and policies in raw SQL migrations; let Drizzle queries assume the policy is enforced.
**Reason.** Drizzle doesn't model RLS; the migration SQL is your control plane.
```sql
-- drizzle/0005_enable_rls.sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON posts USING (org_id = current_setting('app.org_id')::uuid);
```

### B20. Split schema change from data backfill
**Rule.** Generate two migrations: one for DDL (add column nullable), one for backfill, then a third to enforce `NOT NULL`.
**Reason.** Big backfills lock tables; an `ADD COLUMN NOT NULL DEFAULT ...` rewrites every row in PG < 11 and many cases still in MySQL.
```sql
-- 0010_add_country_nullable.sql
ALTER TABLE users ADD COLUMN country text;
-- 0011_backfill_country.sql (run async, batched)
-- 0012_country_not_null.sql
ALTER TABLE users ALTER COLUMN country SET NOT NULL;
```

### B21. `sql.identifier` / placeholders, never `sql.raw(userInput)`
**Rule.** Use `sql.identifier(tableName)` for trusted dynamic identifiers and `sql.placeholder('x')` for params; reserve `sql.raw` for static config strings.
**Reason.** `sql.raw` is verbatim — any user-controlled string is SQL injection.
```ts
// wrong
sql.raw(`select * from ${userInput}`);
// right
sql`select * from ${sql.identifier(allowList[name])}`;
```

---

## D — Anti-patterns / smells

### D1. `drizzle-kit push` against production
**Rule.** Never run `push` on prod; only generated, reviewed migrations apply there.
**Reason.** No SQL file is committed, no review step, destructive renames executed silently.
```bash
# wrong
DATABASE_URL=$PROD pnpm drizzle-kit push
# right
pnpm drizzle-kit generate && pnpm drizzle-kit migrate
```

### D2. Hand-editing generated migration SQL
**Rule.** Don't patch `drizzle/0007_*.sql` by hand — change the schema, regenerate, drop the stale file.
**Reason.** Hand edits diverge from the schema snapshot in `_meta`, breaking subsequent diffs and rollback.

### D3. Not committing `drizzle/`
**Rule.** Track the entire `drizzle/` folder including `_meta` and `_journal.json`.
**Reason.** Without history, `drizzle-kit generate` writes a fresh "initial" migration on each developer's machine.

### D4. N+1 from per-row `db.query` calls
**Rule.** Don't loop and re-query relations; use `with: { posts: true }` or one Core join.
**Reason.** N+1 is the classic ORM perf bug — RQB exists precisely to avoid it.
```ts
// wrong
for (const u of users) { u.posts = await db.query.posts.findMany({ where: eq(posts.authorId, u.id) }); }
// right
const users = await db.query.users.findMany({ with: { posts: true } });
```

### D5. Building dynamic queries by string concat
**Rule.** Compose conditions via `and(...filters)` over an array; don't concat SQL strings.
**Reason.** Loses type safety and parameter binding; one user-controlled value is injection.
```ts
// wrong
let where = `1=1`;
if (org) where += ` and org='${org}'`;
// right
const filters = [];
if (org) filters.push(eq(users.org, org));
await db.select().from(users).where(and(...filters));
```

### D6. `eq(col, possiblyUndefined)`
**Rule.** Guard against `undefined` before passing to `eq`; Drizzle drops `undefined` filters silently in some paths and matches all rows.
**Reason.** A "find by id" with `undefined` becomes "return everything" — catastrophic in delete/update.
```ts
// wrong
await db.delete(users).where(eq(users.id, maybeId));
// right
if (!maybeId) throw new Error('id required');
await db.delete(users).where(eq(users.id, maybeId));
```

### D7. Connection pool created per request in serverless
**Rule.** Don't `drizzle(postgres(url))` inside the handler; instantiate once at module scope (or once per cold start).
**Reason.** Each invocation opens new sockets, exhausts upstream connections, and blows past PgBouncer limits.
```ts
// wrong (inside handler)
export async function POST() { const db = drizzle(postgres(url)); /* ... */ }
// right (module scope)
const db = drizzle(postgres(url, { prepare: false, max: 1 }));
```

### D8. Multi-write op without transaction
**Rule.** Wrap any sequence that must succeed or fail together in `db.transaction`.
**Reason.** Partial writes leave the DB in an inconsistent state; "I'll add a try/catch" doesn't reverse statements.
```ts
// wrong
await db.insert(orders).values(o);
await db.insert(orderItems).values(items); // crashes → orphan order
// right
await db.transaction(async (tx) => {
  await tx.insert(orders).values(o);
  await tx.insert(orderItems).values(items);
});
```

### D9. Transaction around a single read
**Rule.** Don't wrap a single `SELECT` in `db.transaction` "for safety".
**Reason.** Each transaction takes a connection and adds round-trips; reads are already atomic.

### D10. `as User` instead of `$inferSelect`
**Rule.** Don't cast query results — derive the type from the table.
**Reason.** Casts hide schema drift. `$inferSelect` updates with the schema automatically.
```ts
// wrong
const u = (await db.select().from(users))[0] as User;
// right
type User = typeof users.$inferSelect;
```

### D11. `text` for UUID FKs
**Rule.** Use `uuid()` (PG) for UUID columns; `text` is a lie about the data shape.
**Reason.** `uuid` enforces format, sorts correctly, and uses 16 bytes vs 36; FK comparisons are faster.
```ts
// wrong
authorId: text('author_id').references(...),
// right
authorId: uuid('author_id').references(...),
```

### D12. `varchar` without length in MySQL
**Rule.** MySQL `varchar()` requires a length; pass `{ length: 255 }`.
**Reason.** Drizzle errors at generate-time, but if you reach for `text` to dodge it you lose indexability — set a sensible length.
```ts
email: varchar('email', { length: 320 }).notNull(),
```

### D13. `timestamp` without `mode` or timezone
**Rule.** PG: choose `timestamp({ mode: 'date', withTimezone: true })` deliberately; MySQL/SQLite: pick `mode: 'date'` for `Date` objects vs `mode: 'string'`.
**Reason.** Without `withTimezone`, PG silently strips zone info. Mode mismatches return strings where you expected `Date`.
```ts
createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull(),
```

### D14. Treating `numeric`/`decimal` as a number
**Rule.** PG returns `numeric` as a string; cast (`::float`/`::int`) only for safe ranges, otherwise wrap in Decimal.
**Reason.** Silent precision loss when JS coerces a string like `"19.999999999999998"` to `Number`.
```ts
// wrong
const total = row.amount + 1; // amount is "10.50"
// right
const total = new Decimal(row.amount).plus(1);
```

### D15. JSON column without a TS type or runtime validator
**Rule.** Always pair `jsonb('x').$type<T>()` with Zod (or similar) at write boundaries.
**Reason.** `$type` is a TS-only narrowing — the DB will store anything you send it.

### D16. `.references()` without `onDelete`
**Rule.** Always pass `{ onDelete: ... }` (or accept the default explicitly with a comment).
**Reason.** Default `'no action'` causes deletes to fail or orphan rows depending on direction; behavior is dialect-sensitive.

### D17. Composite index ordered alphabetically
**Rule.** Don't sort index columns by name — order by selectivity / equality predicate first.
**Reason.** Index usability hinges on prefix matching; an alphabetical order rarely matches query predicates.

### D18. Adding indexes preemptively
**Rule.** Add indexes after measuring slow queries (EXPLAIN); don't speculatively index every FK.
**Reason.** Indexes slow writes and consume disk; many FK columns never get filtered alone.

### D19. Deeply nested `with`
**Rule.** Cap RQB `with` at 2 levels; flatten or split for 3+.
**Reason.** Drizzle generates one-shot JSON aggregation that bloats payload and locks the planner into nested-loop strategies.
```ts
// smell
db.query.orgs.findMany({ with: { teams: { with: { users: { with: { posts: true } } } } } });
// better: two queries or a flat join
```

### D20. `db.select().from(t)` to fetch full row
**Rule.** Project only needed columns: `db.select({ id: t.id, name: t.name }).from(t)`.
**Reason.** Pulling unused columns wastes bandwidth and can leak fields (password hashes, tokens).

### D21. Selecting secret columns by default
**Rule.** Use `columns: { passwordHash: false }` in RQB or explicit projection in Core; never let `findMany()` return the whole row.
**Reason.** RQB's default returns every column, including secrets — easy to leak via JSON serialization.
```ts
await db.query.users.findMany({ columns: { passwordHash: false, mfaSecret: false } });
```

### D22. `DROP TABLE` without `IF EXISTS`
**Rule.** Generate idempotent destructive statements; `drizzle-kit` does this by default — don't strip it.
**Reason.** Re-running migrations on a partially-applied state fails loudly without `IF EXISTS`.
```sql
DROP TABLE IF EXISTS legacy_sessions;
```

### D23. Missing `.notNull()` on FK columns
**Rule.** If the DB column is `NOT NULL`, mirror it with `.notNull()` in Drizzle.
**Reason.** Insert types accept `null`/`undefined`, runtime fails. Drift between schema and DB also confuses generators.

### D24. Mixed casing across tables
**Rule.** Pick camelCase TS / snake_case DB and stick with it; don't oscillate.
**Reason.** Inconsistent casing breaks raw SQL fallbacks and confuses code review. Set `casing` in `drizzle.config.ts` to enforce.

### D25. `Date.now()` as a default
**Rule.** Use `defaultNow()` / `default(sql\`now()\`)` — not `$defaultFn(() => Date.now())` for `createdAt`/`updatedAt`.
**Reason.** Client clock skew produces out-of-order rows; DB `now()` is monotonic per transaction and authoritative.
```ts
// wrong
createdAt: timestamp().$defaultFn(() => new Date()),
// right
createdAt: timestamp().defaultNow().notNull(),
```

### D26. `verbose: true` in production
**Rule.** Disable Drizzle query logging in prod, or wire it through your structured logger with PII filters.
**Reason.** Default logger writes raw SQL with parameters to stdout — PII leak and noticeable overhead.
```ts
const db = drizzle(client, { logger: process.env.NODE_ENV !== 'production' });
```

### D27. `findFirst` with non-null assertion
**Rule.** Don't `(await db.query.x.findFirst(...))!` — handle the `undefined` explicitly or throw a typed `NotFound`.
**Reason.** `!` defers the error to a misleading "cannot read property of undefined" deeper in the stack.
```ts
const row = await db.query.users.findFirst({ where: eq(users.id, id) });
if (!row) throw new NotFoundError('user', id);
```

### D28. `.execute()` on an unprepared query
**Rule.** Drop `.execute()` from one-off queries — `await` the builder directly.
**Reason.** `.execute()` only matters paired with `.prepare()`; otherwise it's a no-op that obscures the API.
```ts
// wrong
await db.select().from(users).where(eq(users.id, id)).execute();
// right
await db.select().from(users).where(eq(users.id, id));
```

### D29. Long-running transactions
**Rule.** Keep transactions short; do external I/O (HTTP, queue publish) outside the `tx` scope.
**Reason.** Open transactions hold row/page locks; slow external calls inside `tx` cascade lock waits across the app.
```ts
// wrong
await db.transaction(async (tx) => {
  await tx.insert(orders).values(o);
  await stripe.charges.create(...); // network call inside tx
});
// right
await db.transaction(async (tx) => { await tx.insert(orders).values(o); });
await stripe.charges.create(...);
```

### D30. Connection string in code
**Rule.** Read DSN from env (`process.env.DATABASE_URL`, `env.DATABASE_URL` in Workers) — never hardcode.
**Reason.** Secret leaks via git, and you lose per-environment routing.

### D31. Drizzle Studio on a public port
**Rule.** Bind Studio to localhost; never `--host 0.0.0.0` on a server with a public IP.
**Reason.** Studio has no auth — anyone reaching the port has full DB read/write.

### D32. Skipping migrations entirely
**Rule.** Don't ship schema-only changes (push/manual `ALTER`) without generating a migration.
**Reason.** Schema drift between environments goes undetected; rollbacks become forensic archaeology.

---

## Sources

- [Drizzle ORM docs — Overview, Schema, Queries, Migrations](https://orm.drizzle.team/docs/overview)
- [Drizzle blog — RQB, edge drivers, release notes](https://orm.drizzle.team/blog)
- [drizzle-kit reference — generate / migrate / push / studio](https://orm.drizzle.team/docs/kit-overview)
- [Connect overview — drivers per dialect and runtime](https://orm.drizzle.team/docs/connect-overview)
- [drizzle-zod integration](https://orm.drizzle.team/docs/zod)
- [Cloudflare Workers + Drizzle guide](https://developers.cloudflare.com/workers/databases/connect-to-a-database/)
- [Neon serverless driver — edge HTTP Postgres](https://neon.tech/docs/serverless/serverless-driver)
- Andrew Sherman / Drizzle team posts on X (RQB, push vs migrate, edge runtimes)
