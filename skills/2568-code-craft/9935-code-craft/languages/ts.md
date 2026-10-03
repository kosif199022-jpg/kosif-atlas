# TypeScript — code-craft reference

~50 rules across three buckets. Sources: TypeScript Handbook, typescript-eslint v8 strict-type-checked, *Effective TypeScript* (Vanderkam, 2nd ed.), Total TypeScript (Pocock), TS 5.0–5.7 release notes, type-fest, Sindre Sorhus tsconfig, Node.js 20+ docs, OWASP.

Loaded by `code-craft` when the user asks about TypeScript or pastes TS code for review.

---

## A — Tactical (day-to-day patterns)

### A1. PascalCase types, no `I` prefix
**Rule.** Use PascalCase for types/interfaces/classes/enums; never prefix interfaces with `I`.
**Reason.** Hungarian-style prefixes leak implementation details into the API; the TS handbook and typescript-eslint both reject `IFoo`.
```ts
// wrong
interface IUser { id: string }
// right
interface User { id: string }
```

### A2. camelCase locals, UPPER_SNAKE for true constants
**Rule.** camelCase for variables, params, functions; reserve `UPPER_SNAKE_CASE` for module-level immutable primitives.
**Reason.** Differentiates "shared constant" from "mutable binding"; matches typescript-eslint `naming-convention` defaults.
```ts
const MAX_RETRIES = 3;
const retryCount = 0;
```

### A3. kebab-case file names
**Rule.** Pick one file-name convention and enforce it; kebab-case is the most portable across case-insensitive filesystems.
**Reason.** Mixed casing breaks on macOS/Windows when collaborating with case-sensitive Linux CI.
```
// wrong: UserService.ts and userService.ts in same repo
// right: user-service.ts everywhere
```

### A4. Named exports over default
**Rule.** Use named exports; avoid `export default`.
**Reason.** Named exports give rename-find-all-references, refactor safety, and consistent import names.
```ts
// wrong
export default function parse() {}
// right
export function parse() {}
```

### A5. Avoid barrel files in app code
**Rule.** Don't ship aggregator `index.ts` files unless you're publishing a library API.
**Reason.** Barrels defeat tree-shaking, slow tsserver, and cause cyclic-import landmines.
```ts
// wrong
export * from './a'; export * from './b';
// right
import { foo } from '../utils/foo';
```

### A6. Throw `Error` subclasses, never raw values
**Rule.** `throw new Error(...)` or a subclass; never `throw 'oops'`.
**Reason.** Engines only fill `.stack` on Error instances; `unknown` catch narrowing relies on `instanceof Error`.
```ts
// wrong
throw 'not found';
// right
class NotFoundError extends Error {}
throw new NotFoundError('user');
```

### A7. Type catch as `unknown` and narrow
**Rule.** Use `useUnknownInCatchVariables` (default in strict since 4.4) and narrow with `instanceof Error`.
**Reason.** Anything can be thrown; treating as `Error` blindly is a silent runtime bug.
```ts
try { /* … */ } catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
}
```

### A8. Result types for expected failures, throw for bugs
**Rule.** Return a discriminated `{ ok: true; value } | { ok: false; error }` for *expected* failure paths; throw only for invariants.
**Reason.** Forces callers to handle the failure at compile time; matches Effect, neverthrow patterns.
```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
function parseInt2(s: string): Result<number, 'NaN'> { /* … */ }
```

### A9. `never` for functions that never return
**Rule.** Use `never` (not `void`) for functions that always throw or loop forever.
**Reason.** Enables exhaustiveness checks and dead-code analysis downstream.
```ts
function fail(msg: string): never { throw new Error(msg); }
```

### A10. `Promise.all` vs `Promise.allSettled`
**Rule.** `all` when one failure should abort everything; `allSettled` when you need every outcome.
**Reason.** `all` rejects on first failure and leaves the rest racing — a leak unless you also cancel via `AbortSignal`.
```ts
// wrong: silent leak of pending fetches
await Promise.all([fetchA(), fetchB()]);
// right: cancel siblings
const ac = new AbortController();
await Promise.all([fetchA(ac.signal), fetchB(ac.signal)])
  .catch(e => { ac.abort(); throw e; });
```

### A11. Thread `AbortSignal` through async APIs
**Rule.** Every long-running async function takes an optional `signal: AbortSignal`.
**Reason.** Node 20+, fetch, timers, and streams all accept it; without it you can't cancel.
```ts
async function load(url: string, signal?: AbortSignal) {
  return fetch(url, { signal });
}
```

### A12. Don't `await` inside loops when iterations are independent
**Rule.** Use `Promise.all(items.map(fn))` for independent work; sequential `await` only when each iteration depends on the prior.
**Reason.** Sequential awaits multiply latency.
```ts
// wrong
for (const id of ids) await load(id);
// right
await Promise.all(ids.map(load));
```

### A13. Narrow with `in`, `instanceof`, type predicates — not `as`
**Rule.** Prefer runtime narrowing over assertions.
**Reason.** Assertions disable the type system; narrowing keeps it engaged.
```ts
// wrong
const u = x as User;
// right
function isUser(x: unknown): x is User {
  return typeof x === 'object' && x !== null && 'id' in x;
}
```

### A14. Assertion functions for invariants
**Rule.** `function assert(cond): asserts cond` for runtime invariants that should narrow types.
**Reason.** Combines runtime check + type narrowing in one call.
```ts
function assertDefined<T>(v: T | undefined): asserts v is T {
  if (v === undefined) throw new Error('undefined');
}
```

### A15. `readonly` fields and `ReadonlyArray<T>` parameters
**Rule.** Function parameters that are arrays should be `readonly T[]`; class fields not reassigned should be `readonly`.
**Reason.** Documents intent, prevents accidental mutation, lets callers pass tuples.
```ts
function sum(xs: readonly number[]) { /* … */ }
```

### A16. `as const` for literal-preserving config
**Rule.** Suffix literal-only config objects with `as const`.
**Reason.** Widens to literal types instead of `string`/`number`, enabling exhaustive maps.
```ts
const ROLES = ['admin', 'user'] as const;
type Role = typeof ROLES[number]; // 'admin' | 'user'
```

### A17. Structured logging with object payloads
**Rule.** Log `logger.info({ userId, action }, 'message')`; never `console.log('user ' + id)`.
**Reason.** Structured JSON logs are queryable; pino, winston, bunyan all use this shape.
```ts
// wrong
console.log(`User ${user.id} logged in`);
// right
logger.info({ userId: user.id }, 'login');
```

### A18. Redact secrets at the logger boundary
**Rule.** Configure logger redaction paths; never log raw `req.headers`, `req.body`, or `password`.
**Reason.** OWASP A09 (Logging Failures) — leaked tokens in logs are a top breach vector.
```ts
const logger = pino({ redact: ['req.headers.authorization', '*.password'] });
```

---

## B — Ecosystem idioms

### B1. Branded types for nominal IDs
**Rule.** Brand primitive IDs with an intersection tag to prevent cross-assignment.
**Reason.** TS is structural; `UserId` and `OrderId` are both `string` without a brand.
```ts
type UserId = string & { readonly __brand: 'UserId' };
const asUserId = (s: string) => s as UserId;
```

### B2. Discriminated unions with a literal tag
**Rule.** Model alternatives with `{ kind: 'a'; … } | { kind: 'b'; … }`, never optional fields.
**Reason.** TS narrows perfectly on the discriminant; optional-field unions can't be exhaustive-checked.
```ts
type Shape = { kind: 'circle'; r: number } | { kind: 'square'; side: number };
```

### B3. `assertNever` for exhaustive switches
**Rule.** Default branch of a discriminated switch calls `assertNever(x)`.
**Reason.** Compile-time error when a new variant is added but not handled.
```ts
function assertNever(x: never): never { throw new Error(String(x)); }
switch (s.kind) {
  case 'circle': return Math.PI * s.r ** 2;
  case 'square': return s.side ** 2;
  default: return assertNever(s);
}
```

### B4. `satisfies` for "validate without widening"
**Rule.** Use `satisfies T` when you want a literal value checked against a type without losing literal narrowness.
**Reason.** `as T` lies; `: T` widens; `satisfies` does neither. (TS 4.9+, Pocock.)
```ts
// wrong: widens values to string
const config: Record<string, string> = { host: 'a' };
// right: keeps literal 'a'
const config = { host: 'a' } satisfies Record<string, string>;
```

### B5. `const` type parameters for literal inference
**Rule.** Use `<const T>` on generic functions to preserve literal types in inference.
**Reason.** TS 5.0 feature; avoids forcing callers to write `as const`.
```ts
function tuple<const T extends readonly unknown[]>(...xs: T): T { return xs; }
const t = tuple('a', 1); // readonly ['a', 1]
```

### B6. `infer` for extracting structural pieces
**Rule.** Reach for `infer` inside conditional types when you need to pull a piece out of a known shape.
**Reason.** Powers `ReturnType`, `Awaited`, and most type-fest helpers.
```ts
type ElementOf<T> = T extends readonly (infer U)[] ? U : never;
```

### B7. Know the core utility types
**Rule.** Reach for `Partial`, `Required`, `Pick`, `Omit`, `Record`, `Readonly`, `ReturnType`, `Parameters`, `Awaited`, `NoInfer` before writing custom helpers.
**Reason.** Stdlib utilities are documented, optimized, and immediately readable to other TS devs.
```ts
type PublicUser = Omit<User, 'passwordHash'>;
```

### B8. Template literal types for constrained strings
**Rule.** Use template literal types to encode string shape (routes, event names, CSS units).
**Reason.** Catches typos at compile time without runtime regex.
```ts
type Route = `/${string}`;
type Pixels = `${number}px`;
```

### B9. `unknown` over `any` for "don't know yet"
**Rule.** Default to `unknown` when a value's type is genuinely unknown; reach for `any` only at FFI boundaries you've audited.
**Reason.** `unknown` forces narrowing; `any` silently propagates and erases all checking.
```ts
// wrong
function parse(json: string): any { return JSON.parse(json); }
// right
function parse(json: string): unknown { return JSON.parse(json); }
```

### B10. When `any` is correct
**Rule.** `any` is acceptable in `declare module` shims for untyped JS, in generic bounds (`<T extends any[]>`), and in deliberate cast helpers — comment why.
**Reason.** Pretending `any` is never right leads to worse `as unknown as Foo` chains.
```ts
declare module 'legacy-lib' { export const x: any; } // OK, justified
```

### B11. Type-only imports/exports
**Rule.** Use `import type { Foo }` for types; enable `verbatimModuleSyntax`.
**Reason.** Guarantees the import is erased; some build tools (esbuild, swc) require it.
```ts
import type { User } from './user';
```

### B12. Unions of literals over enums
**Rule.** Use `type Status = 'idle' | 'loading' | 'done'` instead of `enum`.
**Reason.** Enums emit runtime objects, don't tree-shake well, have surprising semantics (numeric enums are bidirectional, string enums aren't structural). Pocock "Enums Considered Harmful"; Vanderkam Item 53; typescript-eslint `prefer-literal-enum-member`.
```ts
// wrong
enum Status { Idle, Loading, Done }
// right
type Status = 'idle' | 'loading' | 'done';
```

### B13. Turn on `noUncheckedIndexedAccess`
**Rule.** Enable it; `arr[i]` and `record[k]` then return `T | undefined`.
**Reason.** Catches the most common source of `undefined is not a function` bugs.
```ts
const x = arr[0]; // T | undefined — must guard
```

### B14. Turn on `exactOptionalPropertyTypes`
**Rule.** Enable it; `{ name?: string }` then rejects `{ name: undefined }`.
**Reason.** Distinguishes "not present" from "present and undefined" — meaningful for JSON, DB writes, `Object.assign`.
```ts
type T = { name?: string };
const t: T = { name: undefined }; // error with this flag
```

### B15. Turn on `noImplicitOverride`
**Rule.** Require the `override` keyword on subclass methods.
**Reason.** Prevents silent rename drift in base classes from breaking subclasses.
```ts
class Child extends Base { override greet() {} }
```

### B16. `using` for resource cleanup (TS 5.2+)
**Rule.** Use `using x = openThing()` (or `await using`) to scope disposal.
**Reason.** Replaces try/finally pyramids; works with any object implementing `Symbol.dispose` / `Symbol.asyncDispose`.
```ts
{
  using file = openFile(path);
  // file.dispose() runs at block exit
}
```

### B17. Stage 3 decorators only
**Rule.** Use the standardized decorator syntax shipped in TS 5.0; avoid `experimentalDecorators` unless on a legacy framework that requires it.
**Reason.** Stage 3 is the ECMAScript spec; experimental will eventually be deprecated.

---

## D — Anti-patterns / smells

### D1. `any` proliferation
**Rule.** Banned outside justified, commented escape hatches; use `unknown` plus narrowing.
**Reason.** One `any` poisons every downstream type via inference. (typescript-eslint `no-explicit-any`.)
```ts
// wrong
function handle(x: any) { x.foo.bar(); } // crashes silently
// right
function handle(x: unknown) { if (isThing(x)) x.foo.bar(); }
```

### D2. Type assertions over narrowing
**Rule.** `as Foo` is a smell — refactor to a type guard.
**Reason.** `as` lies to the compiler; the only safe asserts are widening (`as const`) and disjoint-→-specific narrowing through `unknown`.
```ts
// wrong
const u = JSON.parse(s) as User;
// right
const data: unknown = JSON.parse(s);
if (isUser(data)) { /* use data */ }
```

### D3. Non-null assertions (`!`) instead of guards
**Rule.** Don't use `!`; check explicitly.
**Reason.** `!` is a runtime bug waiting to happen; if the value really can't be null, prove it with `assertDefined`.
```ts
// wrong
return map.get(k)!.toUpperCase();
// right
const v = map.get(k); if (!v) throw new Error(); return v.toUpperCase();
```

### D4. Function overloads where a discriminated union fits
**Rule.** Don't write three overloads when one tagged-union parameter does the job.
**Reason.** Overloads don't compose, hide behavior, and break inference for callers passing dynamic args.
```ts
// wrong
function fetch(url: string): Promise<string>;
function fetch(url: string, json: true): Promise<unknown>;
// right
function fetch(opts: { url: string; json?: boolean }): Promise<string | unknown>;
```

### D5. Returning mutable arrays from pure functions
**Rule.** Return `readonly T[]` from pure / query functions.
**Reason.** Signals callers shouldn't mutate; prevents shared-state bugs.
```ts
// wrong
function tags(): string[] { return this._tags; }
// right
function tags(): readonly string[] { return this._tags; }
```

### D6. `Object.keys` typed as `string[]`
**Rule.** Don't rely on `Object.keys(obj)` to give you `(keyof T)[]` — it returns `string[]` by design.
**Reason.** Objects can have extra runtime keys; pretending otherwise is unsound. Use a typed helper only after validating the shape.
```ts
// wrong
(Object.keys(obj) as (keyof T)[]).forEach(/* … */);
// right (validated)
function keysOf<T extends object>(o: T) { return Object.keys(o) as (keyof T)[]; }
```

### D7. `JSON.parse` results untyped
**Rule.** `JSON.parse` returns `any`; immediately type as `unknown` and validate (zod / valibot / arktype) before use.
**Reason.** Trusting wire data is the canonical source of runtime type bugs.
```ts
// wrong
const u: User = JSON.parse(body);
// right
const data: unknown = JSON.parse(body);
const u = UserSchema.parse(data);
```

### D8. `catch (e: any)`
**Rule.** Either omit the annotation (default `unknown` since 4.4) or write `catch (e: unknown)`; never `any`.
**Reason.** `any` re-opens the hole `useUnknownInCatchVariables` plugged.
```ts
// wrong
try {} catch (e: any) { console.log(e.message); }
// right
try {} catch (e) { if (e instanceof Error) console.log(e.message); }
```

### D9. Class hierarchies where composition fits
**Rule.** Prefer `type` aliases + composition (intersection / object embedding) over deep `extends` chains.
**Reason.** Hierarchies couple unrelated concerns; TS's structural typing makes composition almost free.
```ts
// wrong
class AdminUser extends LoggableUser extends BaseUser {}
// right
type AdminUser = User & Loggable & { role: 'admin' };
```

### D10. Index signatures hiding missing properties
**Rule.** Avoid `{ [k: string]: T }` for known-shape data; use `Record<Key, T>` with a finite `Key` union, or model it explicitly.
**Reason.** Open index signatures defeat autocomplete and let typos compile.
```ts
// wrong
type Config = { [k: string]: string };
// right
type Config = Record<'host' | 'port', string>;
```

### D11. Optional chaining that masks bugs
**Rule.** Don't sprinkle `?.` to "make TS shut up" — each `?.` should reflect a real "may be missing" case.
**Reason.** `obj?.method?.()` silently no-ops if `method` is misspelled; you lose the error you wanted to catch.
```ts
// wrong
user?.proifle?.update?.(); // typo silently swallowed
// right
if (user) user.profile.update();
```

### D12. ReDoS-prone regex
**Rule.** Avoid catastrophic backtracking patterns: nested quantifiers `(a+)+`, alternation with overlap `(a|aa)+`. Use anchored, linear-time patterns or a safe-regex linter.
**Reason.** OWASP-listed DoS vector; one user-supplied string can pin a Node event loop. (`eslint-plugin-security` `detect-unsafe-regex`.)
```ts
// wrong
/^(a+)+$/.test(input);
// right
/^a+$/.test(input);
```

### D13. Prototype pollution via `Object.assign` on user input
**Rule.** Never merge untrusted input into objects without filtering `__proto__` / `constructor` / `prototype` keys; use `Object.create(null)` or `structuredClone` of validated data.
**Reason.** Real-world CVEs (lodash, minimist). OWASP "Prototype Pollution" cheat sheet.
```ts
// wrong
Object.assign(target, JSON.parse(req.body));
// right
const safe = Object.create(null);
Object.assign(safe, validateSchema(req.body));
```

### D14. Floating promises
**Rule.** Every `Promise` is awaited, returned, or explicitly `.catch()`-handled — never dropped.
**Reason.** Unhandled rejections crash Node 15+ by default; orphan promises break ordering. (typescript-eslint `no-floating-promises`.)
```ts
// wrong
asyncWork(); // floats
// right
void asyncWork().catch(logger.error);
```

### D15. `Function`, `Object`, `{}` types
**Rule.** Never type as `Function`, `Object`, or `{}`; use specific signatures.
**Reason.** These are near-`any` in disguise — `{}` means "anything except null/undefined". (typescript-eslint `no-unsafe-function-type`, `no-empty-object-type`, on by default in v8.)
```ts
// wrong
function run(cb: Function) {}
// right
function run(cb: (x: number) => void) {}
```

### D16. Mixing `null` and `undefined`
**Rule.** Pick one absent-value sentinel per codebase (idiomatic TS = `undefined`); use `null` only when interoperating with APIs that produce it.
**Reason.** Two-bottom-values doubles the case analysis at every boundary. (Vanderkam Item 4.)
```ts
type User = { nickname?: string }; // not nickname: string | null
```

### D17. Boolean parameters where an options object reads better
**Rule.** Replace `fn(x, true, false)` with `fn(x, { sorted: true, dedupe: false })`.
**Reason.** Call sites become self-documenting; new options don't break signatures.
```ts
// wrong
sort(items, true, false);
// right
sort(items, { stable: true, descending: false });
```

---

## Sources

- **TypeScript Handbook** — narrowing, utility types, do's and don'ts.
- **typescript-eslint v8 strict-type-checked** — `no-explicit-any`, `no-floating-promises`, `no-unsafe-function-type`, `consistent-type-imports`.
- **Effective TypeScript, 2nd ed.** — Vanderkam (Items 4, 17, 50, 53 referenced).
- **Total TypeScript** — Pocock (`satisfies`, branded types, "Enums Considered Harmful", `as const` workshop).
- **TypeScript 5.0–5.7 release notes** — `const` type parameters, `using`, decorators stage 3, `--isolatedDeclarations`, `NoInfer`.
- **type-fest README & Sindre Sorhus tsconfig** — `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, naming.
- **Node.js 20+ docs** — `AbortSignal`, `node:test`, ESM-first.
- **OWASP** — Logging Cheat Sheet, ReDoS, Prototype Pollution Prevention.
