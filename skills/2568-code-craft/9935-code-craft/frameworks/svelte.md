# Svelte 5 — code-craft reference

~65 rules across three buckets. Svelte 5 with runes only — Svelte 4 patterns (`$:` reactive statements, `createEventDispatcher`, slots, stores) appear only as legacy contrast for migrators. Component-level only; SvelteKit routing/loaders/server live in a separate file.

Sources: [svelte.dev/docs/svelte](https://svelte.dev/docs/svelte), [Svelte 5 release notes — "Svelte 5 is alive"](https://svelte.dev/blog/svelte-5-is-alive), [v5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide), [runes RFC](https://github.com/sveltejs/rfcs/blob/master/text/0006-runes.md), Rich Harris talks (Svelte Summit 2024, Svelte 5 launch), Geoff Rich blog, Joy of Code tutorials (2024–2025).

Loaded by `code-craft` when the user asks about Svelte 5 or pastes Svelte code for review.

---

## A — Tactical (day-to-day patterns)

### A1. Component file structure
**Rule.** One component per `.svelte` file with `<script lang="ts">`, then template, then `<style>`; PascalCase the filename.
**Reason.** Svelte's compiler keys off file boundaries — no multiple exports — and PascalCase imports are how the compiler recognizes a component vs an HTML element in templates.
```svelte
<!-- Button.svelte -->
<script lang="ts">
  let { label }: { label: string } = $props();
</script>
<button>{label}</button>
<style>button { padding: .5rem 1rem; }</style>
```

### A2. Reactive state with `$state`
**Rule.** Declare reactive values with `let count = $state(0)`, never plain `let count = 0` when reactivity is needed.
**Reason.** In runes mode (Svelte 5), only `$state`-wrapped values trigger updates; plain `let` is a static binding.
```svelte
<script>
  // wrong — UI never re-renders
  let count = 0;
  // right
  let count = $state(0);
</script>
<button onclick={() => count++}>{count}</button>
```

### A3. Derived values with `$derived`
**Rule.** Compute reactive expressions with `let double = $derived(count * 2)`; use `$derived.by(() => { ... })` when the body is multi-line.
**Reason.** `$derived` is lazy, memoized, and only recomputes when its read deps change — semantics `$effect` + `$state` cannot match.
```svelte
<script>
  let count = $state(0);
  let double = $derived(count * 2);
  let summary = $derived.by(() => {
    const tier = count > 10 ? 'high' : 'low';
    return { tier, double: count * 2 };
  });
</script>
```

### A4. Effects for side effects only
**Rule.** Use `$effect(() => { ... })` for subscriptions, manual DOM, network calls, integrations with imperative APIs — never to derive state.
**Reason.** `$effect` runs after render; deriving state in it causes extra renders and races. `$derived` is the right tool for computed values.
```svelte
<script>
  let id = $state(1);
  // wrong: deriving via effect
  let user = $state(null);
  $effect(() => { user = fetchUser(id); });
  // right: $derived for sync, $effect for the side-effecting call
  $effect(() => {
    const ctrl = new AbortController();
    fetchUser(id, ctrl.signal).then((u) => (user = u));
    return () => ctrl.abort();
  });
</script>
```

### A5. `$effect.pre` runs before DOM update
**Rule.** Use `$effect.pre(() => ...)` when you need to read the DOM before Svelte applies the next mutation (e.g. capture scroll position).
**Reason.** Default `$effect` fires after the DOM is patched; `$effect.pre` is the only hook that sees pre-update layout.
```svelte
<script>
  let scrollY = 0;
  $effect.pre(() => { scrollY = container.scrollTop; });
</script>
```

### A6. `$effect.root` for manual lifetimes
**Rule.** Use `$effect.root(() => { ... return () => cleanup })` to spin up effects outside a component (workers, modules, tests) and dispose them yourself.
**Reason.** Plain `$effect` requires a component owner; `$effect.root` returns a `dispose()` you must call to avoid leaks.
```ts
// counter.svelte.ts
export function startTimer() {
  return $effect.root(() => {
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  });
}
```

### A7. Props with `$props`
**Rule.** Destructure props with `let { name, count = 0 } = $props()`; type via `interface Props` or inline annotation.
**Reason.** `$props()` is the only way to receive props in runes mode; without typing, every prop is `any`.
```svelte
<script lang="ts">
  interface Props { name: string; count?: number }
  let { name, count = 0 }: Props = $props();
</script>
```

### A8. Two-way bindable props
**Rule.** Mark a prop bindable with `let { value = $bindable() } = $props()` when parents need `bind:value`; pass a default to `$bindable('x')`.
**Reason.** Without `$bindable()`, `bind:` from a parent throws; the default applies when the parent doesn't bind.
```svelte
<!-- Field.svelte -->
<script>let { value = $bindable('') } = $props();</script>
<input bind:value />
<!-- Parent.svelte -->
<Field bind:value={name} />
```

### A9. Events as callback props
**Rule.** Pass event handlers as regular props (`onclick`, `onaccept`) — no `createEventDispatcher`.
**Reason.** Svelte 5 unified DOM events and component events under callback props; dispatchers are deprecated and ship extra bytes.
```svelte
<!-- Modal.svelte -->
<script>let { onaccept }: { onaccept: () => void } = $props();</script>
<button onclick={onaccept}>OK</button>
<!-- caller -->
<Modal onaccept={() => save()} />
```

### A10. DOM bindings need `$state`
**Rule.** `bind:value`, `bind:checked`, `bind:group` require the underlying variable to be `$state`.
**Reason.** Two-way binding writes back; only reactive containers propagate the write.
```svelte
<script>let name = $state('');</script>
<input bind:value={name} />
```

### A11. `bind:this` for DOM refs
**Rule.** Capture an element with `let el: HTMLDivElement; <div bind:this={el}>`; access inside `$effect` or `onMount`.
**Reason.** The reference is null during the component body — DOM doesn't exist until after mount.
```svelte
<script>
  let el: HTMLInputElement;
  $effect(() => { el?.focus(); });
</script>
<input bind:this={el} />
```

### A12. Conditionals and loops
**Rule.** Use `{#if}/{:else if}/{:else}`, `{#each items as item (item.id)}`, `{#await promise}`, `{#key dep}` for subtree reset.
**Reason.** These are Svelte's only control-flow primitives; mixing JS conditionals in the template is a compile error.
```svelte
{#if user}
  <p>Hi {user.name}</p>
{:else}
  <p>Sign in</p>
{/if}
{#each todos as todo (todo.id)}
  <Todo {todo} />
{/each}
```

### A13. Always key dynamic each blocks
**Rule.** Provide a stable key in `{#each items as item (item.id)}`; never use the index for lists that reorder, insert, or delete.
**Reason.** Svelte reuses DOM nodes by key. Index keys cause inputs/animations/state to bleed across the wrong items.
```svelte
<!-- wrong -->
{#each rows as r, i (i)}<input bind:value={r.x} />{/each}
<!-- right -->
{#each rows as r (r.id)}<input bind:value={r.x} />{/each}
```

### A14. Snippets replace slots
**Rule.** Define `{#snippet name(arg)}...{/snippet}` in the caller, render with `{@render name(x)}` in the child; the implicit `children` prop is the body.
**Reason.** Snippets are typed, parameterizable, and composable — slots are not. Slots remain only for legacy migration.
```svelte
<!-- List.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { items, row }: { items: Item[]; row: Snippet<[Item]> } = $props();
</script>
{#each items as it (it.id)}{@render row(it)}{/each}
<!-- caller -->
<List {items}>
  {#snippet row(it)}<span>{it.label}</span>{/snippet}
</List>
```

### A15. Default `children` snippet
**Rule.** Receive the body content as `children` and render with `{@render children?.()}`.
**Reason.** Anything between component tags is auto-bound to `children` — the Svelte 5 replacement for default slots.
```svelte
<!-- Card.svelte -->
<script>let { children } = $props();</script>
<section class="card">{@render children?.()}</section>
```

### A16. Style scoping is the default
**Rule.** `<style>` is scoped to the component; use `:global(.foo)` for one selector, or `<style global>` for the whole block.
**Reason.** Scoped CSS prevents leakage; reaching for global should be a deliberate, narrow choice.
```svelte
<style>
  p { color: black; }            /* scoped */
  :global(body) { margin: 0; }   /* one global rule */
</style>
```

### A17. `class:` and `style:` directives
**Rule.** Use `class:active={isActive}` and `style:color={fg}` instead of interpolating into `class=""`/`style=""`.
**Reason.** Directives are typed, atomic, and cheaper to update than rebuilding a whole attribute string.
```svelte
<!-- wrong -->
<div class={isActive ? 'btn active' : 'btn'} style="color: {fg}"></div>
<!-- right -->
<div class="btn" class:active={isActive} style:color={fg}></div>
```

### A18. Transitions and animations
**Rule.** Use `transition:fade`, `in:fly={{ y: 10 }}`, `out:slide` for enter/exit; `animate:flip` only inside keyed `{#each}` for FLIP morphs.
**Reason.** Transitions track mount/unmount; `animate:` tracks position changes between frames in a keyed list — using one for the other does nothing.
```svelte
{#each items as it (it.id)}
  <li animate:flip transition:fade>{it.label}</li>
{/each}
```

### A19. Pair transitions with reduced motion
**Rule.** Guard transitions on `prefers-reduced-motion` (via the `reducedMotion` store or media query), or use `duration: 0` when set.
**Reason.** Default transitions ignore the OS accessibility setting; users with vestibular disorders need an opt-out.
```svelte
{#if open}
  <div transition:fade={{ duration: reduced ? 0 : 200 }}>...</div>
{/if}
```

### A20. `$inspect` for dev logging
**Rule.** Use `$inspect(state)` (and `$inspect(state).with(fn)`) to trace reactive deps in dev; it's tree-shaken from prod builds.
**Reason.** Beats `console.log` in `$effect` because it logs on every dep change with location info, with zero prod cost.
```svelte
<script>
  let cart = $state({ items: [] });
  $inspect(cart).with((type, v) => console.log(type, v));
</script>
```

### A21. Special elements
**Rule.** Use `<svelte:head>` for `<head>` content, `<svelte:window>`/`<svelte:body>`/`<svelte:document>` for global event handlers, `<svelte:options>` for compiler flags, `<svelte:element this={tag}>` for dynamic tags.
**Reason.** These are the only safe ways to attach to global scopes from inside a component.
```svelte
<svelte:head><title>Page</title></svelte:head>
<svelte:window onkeydown={onKey} />
<svelte:element this={asTag}>{label}</svelte:element>
```

### A22. `<svelte:boundary>` for error boundaries
**Rule.** Wrap fallible subtrees in `<svelte:boundary>` with a `failed` snippet for graceful recovery.
**Reason.** Without a boundary, a thrown render error tears down the whole tree.
```svelte
<svelte:boundary>
  <Risky />
  {#snippet failed(err, reset)}
    <p>Broke: {err.message}</p><button onclick={reset}>Retry</button>
  {/snippet}
</svelte:boundary>
```

### A23. `onMount`/`onDestroy` still exist — but
**Rule.** Reach for `$effect(() => { ...; return cleanup })` first; keep `onMount` only for true mount-once setup that doesn't track deps.
**Reason.** `$effect` covers most lifecycle cases with deps and cleanup; `onMount` is now a narrow tool, not the default.
```svelte
<script>
  // newer code
  $effect(() => {
    const sub = bus.subscribe(handle);
    return () => sub.unsubscribe();
  });
</script>
```

### A24. `tick()` only when truly needed
**Rule.** Use `await tick()` only when you must read the DOM after a `$state` write in the same microtask.
**Reason.** Most code reads settled state in the next `$effect`; cargo-culted `tick()` is a smell.
```svelte
<script>
  async function focusAfter() { open = true; await tick(); input.focus(); }
</script>
```

---

## B — Modern Svelte 5 idioms

### B1. Runes everywhere — never mix with `$:`
**Rule.** A component is either runes-mode or legacy-mode. Don't mix `$:` reactive statements with `$state`/`$derived`/`$effect` in the same file.
**Reason.** The two systems have different scheduling; the compiler errors or warns, and behavior is undefined where it doesn't.
```svelte
<!-- wrong -->
<script>
  let count = $state(0);
  $: double = count * 2; // mixed
</script>
<!-- right -->
<script>
  let count = $state(0);
  let double = $derived(count * 2);
</script>
```
[Source: v5 migration guide — "Don't mix runes with legacy reactivity"](https://svelte.dev/docs/svelte/v5-migration-guide).

### B2. `$state` is a deep proxy
**Rule.** Trust `$state(obj)` to track nested reads/writes — `obj.a.b = 1` updates the UI.
**Reason.** Svelte wraps objects/arrays in a `Proxy`; mutating in place is idiomatic and reactive.
```svelte
<script>
  let cart = $state({ items: [{ qty: 1 }] });
  function inc() { cart.items[0].qty++; } // reactive
</script>
```

### B3. `$state.raw` for shallow / heavy data
**Rule.** Use `let rows = $state.raw(bigArray)` for huge arrays/objects you'll reassign whole; never expect nested mutations to update the UI.
**Reason.** Proxy overhead matters on tens of thousands of rows. `raw` skips it but only reacts to whole-value reassignment.
```svelte
<script>
  let rows = $state.raw<Row[]>([]);
  // wrong: rows[0].x = 1   (no update)
  // right:
  rows = rows.map((r, i) => i === 0 ? { ...r, x: 1 } : r);
</script>
```
[Source: svelte.dev `$state.raw` docs — "useful for large arrays/objects that won't be mutated"](https://svelte.dev/docs/svelte/$state#$state.raw).

### B4. `$state.snapshot` for serialization
**Rule.** Pass `$state.snapshot(value)` when sending state to non-reactive APIs (`structuredClone`, `postMessage`, JSON wire).
**Reason.** Strips the proxy cleanly so consumers see plain objects; `JSON.stringify` works but loses fidelity for non-JSON types.
```ts
const payload = $state.snapshot(cart);
worker.postMessage(payload);
```

### B5. `untrack` reads without subscribing
**Rule.** Wrap a read in `untrack(() => x)` to opt a specific access out of the surrounding `$derived`/`$effect`.
**Reason.** Sometimes you want the value but not the dep — e.g. log the latest `id` in an effect that should only react to a different signal.
```svelte
<script>
  import { untrack } from 'svelte';
  $effect(() => {
    save(query, untrack(() => userId)); // re-runs on query, not userId
  });
</script>
```

### B6. Reactive state in `.svelte.ts` modules
**Rule.** Runes work in `.svelte.ts` / `.svelte.js` modules — export class instances or factory functions for cross-component shared state.
**Reason.** No more global stores ceremony; runes give the same reactivity primitives outside components.
```ts
// counter.svelte.ts
class Counter { count = $state(0); inc() { this.count++; } }
export const counter = new Counter();
```
[Source: v5 migration guide — runes outside components](https://svelte.dev/docs/svelte/v5-migration-guide).

### B7. Class-based reactive stores
**Rule.** Define shared state as a class with `$state` fields and methods; export a singleton or a factory.
**Reason.** Methods read like normal OO code; `this.count` is reactive; consumers get type inference for free.
```ts
class Cart {
  items = $state<Item[]>([]);
  total = $derived(this.items.reduce((s, i) => s + i.price, 0));
  add(i: Item) { this.items.push(i); }
}
export const cart = new Cart();
```

### B8. Context API for tree-scoped DI
**Rule.** Pair `setContext(key, instance)` in a parent with `getContext(key)` in descendants to scope shared state to a subtree.
**Reason.** Globals leak across pages/tests; context binds shared state to a render scope and survives reactivity.
```svelte
<!-- Provider.svelte -->
<script>
  import { setContext } from 'svelte';
  const cart = new Cart();
  setContext('cart', cart);
</script>
```

### B9. Replace stores with runes for new code
**Rule.** New code uses `$state` (in components or `.svelte.ts`); reach for `writable`/`readable`/`derived` only when interfacing with libraries that require them.
**Reason.** Runes are the idiomatic API in Svelte 5; stores still work but are extra surface area for new code.
```ts
// new
class Theme { value = $state<'light'|'dark'>('light'); }
// only when a lib expects a store
import { writable } from 'svelte/store';
const compat = writable('x');
```

### B10. `$store` auto-subscribe still works
**Rule.** When you must consume an external store in a template, prefix with `$` — `$store` — and let Svelte handle subscribe/unsubscribe.
**Reason.** Manual `subscribe`/`unsubscribe` in component bodies leaks; auto-subscription cleans up on unmount.
```svelte
<script>import { online } from './stores';</script>
<p>{$online ? 'online' : 'offline'}</p>
```

### B11. TypeScript with runes
**Rule.** Type props inline (`let { x }: { x: string } = $props()`), state generically (`$state<number>(0)`), and components with `<script lang="ts" generics="T">`.
**Reason.** Runes are first-class TS; the `generics` script attribute is the only way to make a component generic.
```svelte
<script lang="ts" generics="T">
  let { items, render }: { items: T[]; render: (x: T) => string } = $props();
</script>
```

### B12. Snippet types
**Rule.** Import `type { Snippet }` from `svelte` and type with parameter tuples: `Snippet<[Item, number]>`.
**Reason.** Without it, `{@render row(item)}` accepts any args and silently passes wrong shapes.
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { row }: { row?: Snippet<[Item]> } = $props();
</script>
{#if row}{@render row(item)}{/if}
```

### B13. Two-way binding only when necessary
**Rule.** Default to one-way (prop down, callback up); reach for `bind:` only when the child genuinely owns the input value.
**Reason.** `bind:` couples parent+child state; one-way is easier to reason about and test.
```svelte
<!-- prefer -->
<Field value={name} oninput={(v) => name = v} />
<!-- bind: only when ergonomics demand -->
<Field bind:value={name} />
```

### B14. Event modifiers as plain code
**Rule.** Replace `on:click|preventDefault` with `onclick={(e) => { e.preventDefault(); ... }}`.
**Reason.** Svelte 5 dropped DOM-event modifiers; the runes form is plain JS, easier to compose.
```svelte
<!-- legacy -->
<form on:submit|preventDefault={save}>...</form>
<!-- runes -->
<form onsubmit={(e) => { e.preventDefault(); save(); }}>...</form>
```

### B15. Custom elements via `<svelte:options>`
**Rule.** Compile a component to a Custom Element with `<svelte:options customElement="my-elem" />` plus the `customElement` build option.
**Reason.** Lets Svelte components ship into non-Svelte hosts (Shopify, WordPress, plain HTML) without a wrapper.
```svelte
<svelte:options customElement="my-counter" />
<script>let count = $state(0);</script>
<button onclick={() => count++}>{count}</button>
```

### B16. Prefer `{@const}` + dynamic component
**Rule.** Render a runtime-chosen component with `{@const Cmp = lookup[type]}` then `<Cmp ... />` instead of `<svelte:component this={Cmp}>`.
**Reason.** `<svelte:component>` is legacy in Svelte 5; the runtime supports rendering any capitalized identifier directly.
```svelte
{@const Cmp = registry[kind]}
<Cmp {...props} />
```
[Source: v5 migration guide — `<svelte:component>` deprecated](https://svelte.dev/docs/svelte/v5-migration-guide).

### B17. `$bindable()` accepts a default
**Rule.** Pass a default to `$bindable('x')` so the prop has a value when the parent doesn't bind.
**Reason.** Otherwise an unbound child sees `undefined` until the parent binds — easy bug.
```svelte
<script>let { value = $bindable('') } = $props();</script>
```

### B18. `$inspect.with` for custom traces
**Rule.** Use `$inspect(state).with((type, v) => log(type, v))` to route reactive logs into your own logger.
**Reason.** Replaces `console.log`s scattered across `$effect` and survives prod tree-shaking.

### B19. `$host` for custom-element internals
**Rule.** Inside a component compiled as a custom element, `const host = $host()` returns the host `HTMLElement` — use it to dispatch real DOM `CustomEvent`s.
**Reason.** Outside the Svelte tree, callbacks props don't help; you need to fire DOM events for the host page to listen on.
```svelte
<script>
  const host = $host();
  function done() { host.dispatchEvent(new CustomEvent('done')); }
</script>
```

### B20. Snippets are values
**Rule.** Pass snippets around like functions — store in a variable, pick conditionally, render with `{@render chosen()}`.
**Reason.** Unlike slots, snippets are first-class values; this enables composable patterns like polymorphic lists.
```svelte
{@const view = mode === 'card' ? card : row}
{#each items as it (it.id)}{@render view(it)}{/each}
```

### B21. Avoid `<svelte:options accessors />` for reactivity fixes
**Rule.** Don't enable `accessors` to "expose" component props; fix the parent–child contract with proper `$bindable` or callbacks.
**Reason.** `accessors` is a legacy escape hatch; in runes mode it papers over a design problem.

### B22. Effect cleanup is a function, not anything else
**Rule.** Return `() => cleanup()` (or nothing) from `$effect`; never return an async function or a Promise.
**Reason.** Svelte calls the returned function on re-run/unmount; a Promise won't be awaited and cleanup may run twice or not at all.
```svelte
<script>
  $effect(() => {
    const t = setInterval(tick, 1000);
    return () => clearInterval(t); // sync cleanup
  });
</script>
```

---

## D — Anti-patterns / smells

### D1. Mixing `$:` with runes
**Rule.** Don't combine Svelte 4 `$:` reactive statements with `$state`/`$derived` in the same file.
**Reason.** Schedulers conflict; the compiler is moving toward erroring. Pick one mode per file.
```svelte
<!-- wrong: mixes -->
<script>
  let count = $state(0);
  $: double = count * 2;
</script>
```

### D2. Plain `let` for reactive values
**Rule.** Don't use `let x = 0` for state the UI depends on.
**Reason.** In runes mode it's a static binding — writes never re-render.
```svelte
<!-- wrong -->
let count = 0;
<!-- right -->
let count = $state(0);
```

### D3. Effect-derived state
**Rule.** Don't write `$effect(() => { foo = bar * 2 })`.
**Reason.** Causes extra renders, races, and stale reads. `$derived` is the correct primitive.
```svelte
// wrong
let foo = $state(0);
$effect(() => { foo = bar * 2; });
// right
let foo = $derived(bar * 2);
```

### D4. Effect to sync two pieces of state
**Rule.** Don't sync state A to state B in `$effect`.
**Reason.** You have two sources of truth. Lift to one source plus `$derived`.
```svelte
// wrong: a drifts from b on the next tick
$effect(() => { a = b; });
// right
let b = $state(0);
let a = $derived(b);
```

### D5. Mutating non-`$state` objects
**Rule.** Don't mutate a plain object expecting reactivity.
**Reason.** Without `$state`, there's no proxy and no subscriptions.
```svelte
// wrong
let cart = { items: [] };
cart.items.push(x); // no update
// right
let cart = $state({ items: [] });
cart.items.push(x);
```

### D6. Nested writes through `$state.raw`
**Rule.** Don't expect `rows[0].x = 1` to update the UI when `rows = $state.raw(...)`.
**Reason.** `raw` opts out of deep tracking — only whole-value reassignment reacts.
```svelte
let rows = $state.raw([...]);
rows[0].x = 1;          // no-op
rows = [...rows];       // ok
```

### D7. Async / non-function effect return
**Rule.** Don't `return` anything but `void` or a sync cleanup function from `$effect`.
**Reason.** Async returns aren't awaited; cleanup either misses or double-fires.
```svelte
// wrong
$effect(async () => { ... }); // returns Promise
// right
$effect(() => { (async () => { await ... })(); return () => ... });
```

### D8. Creating reactive state inside `$effect`
**Rule.** Don't call `$state(...)` inside an effect body.
**Reason.** Each cycle creates a fresh signal; old values orphan, memory grows.
```svelte
// wrong
$effect(() => { const tmp = $state(0); ... });
```

### D9. Untyped `$props()`
**Rule.** Always type `$props()` — inline or via an `interface Props`.
**Reason.** Without types every prop is `any`; refactors silently break consumers.
```svelte
// wrong
let { name } = $props();
// right
let { name }: { name: string } = $props();
```

### D10. Slots in new code
**Rule.** Don't author new components with `<slot>` and `<slot name="...">`.
**Reason.** Slots are kept for migration only; snippets are typed, parameterizable, and the future API.
[Source: v5 migration guide — "snippets supersede slots"](https://svelte.dev/docs/svelte/v5-migration-guide).

### D11. `createEventDispatcher`
**Rule.** Don't import `createEventDispatcher` in Svelte 5 components.
**Reason.** Replaced by callback props (`onaccept`, `onclose`); dispatchers are deprecated.
```svelte
// wrong
const dispatch = createEventDispatcher(); dispatch('accept');
// right
let { onaccept } = $props(); onaccept?.();
```

### D12. `<svelte:component>` for static dispatch
**Rule.** Don't reach for `<svelte:component this={Cmp}>` when the value is a known component.
**Reason.** Legacy in Svelte 5. Use `{@const Cmp = X}` + `<Cmp />`, or just `<X />` directly.

### D13. Each block index as key
**Rule.** Don't `{#each items as it, i (i)}` for lists that reorder/insert/delete.
**Reason.** Causes wrong-row state retention (wrong inputs focused, wrong items animated).

### D14. Each without a key
**Rule.** Don't `{#each items as it}` on dynamic data.
**Reason.** Svelte falls back to positional matching; identity bleeds across items.

### D15. Heavy work in template expressions
**Rule.** Don't put `expensiveCompute(items)` directly in the template.
**Reason.** Re-runs on every render. Hoist into `$derived` (or `$derived.by`) for memoization.
```svelte
<!-- wrong -->
<p>{heavy(items)}</p>
<!-- right -->
<script>let result = $derived.by(() => heavy(items));</script>
<p>{result}</p>
```

### D16. `bind:` to non-`$state`
**Rule.** Don't `bind:value={name}` when `name` is a plain `let`.
**Reason.** Svelte 5 emits a TS/runtime error — bind targets must be reactive.

### D17. `bind:` everywhere
**Rule.** Don't reach for `bind:` by default when one-way + callback would do.
**Reason.** Two-way coupling makes change tracking, validation, and undo harder.

### D18. Missing `$bindable()` on receiving prop
**Rule.** Don't accept a prop for `bind:` from the parent without declaring `$bindable()`.
**Reason.** Runtime warning + the value never writes back; subtle bug.
```svelte
// wrong (parent does <Child bind:value={x}>)
let { value } = $props();
// right
let { value = $bindable() } = $props();
```

### D19. Stores for component-local state
**Rule.** Don't reach for `writable()` for state that lives inside one component.
**Reason.** `$state` is simpler, faster, and doesn't need auto-subscribe ceremony.

### D20. Manual subscribe/unsubscribe
**Rule.** Don't call `store.subscribe(...)` in a component body.
**Reason.** Leaks unless you also unsubscribe; `$store` auto-subscription is the right tool.
```svelte
// wrong
const unsub = store.subscribe(setValue);
// right
<p>{$store}</p>
```

### D21. Side effects in `$derived`
**Rule.** Don't mutate, fetch, or log inside a `$derived` body.
**Reason.** `$derived` may run multiple times or be cached; side effects produce duplicates and races. Use `$effect`.

### D22. Mutation in template expressions
**Rule.** Don't write `{counter.value++}` or other mutating expressions in the template.
**Reason.** Templates should be pure reads; mutation there fires during render and triggers infinite loops.

### D23. Inline class/style strings
**Rule.** Don't compose `class="a b {cond ? 'c' : ''}"` when `class:` directives exist.
**Reason.** Directives are typed, atomic, and avoid stale-class bugs from string concatenation.
```svelte
<!-- wrong -->
<div class="btn {active ? 'on' : ''} {extra}">
<!-- right -->
<div class="btn" class:on={active} class={extra}>
```

### D24. `:global` cascading
**Rule.** Don't put broad `:global(...)` rules in a component's `<style>`.
**Reason.** Defeats scoping and surprises sibling components. Scope to one selector or move to a global stylesheet.

### D25. Transitions without reduced-motion
**Rule.** Don't ship transitions that ignore `prefers-reduced-motion`.
**Reason.** Accessibility regression for vestibular-disorder users; trivial to gate on `duration`.

### D26. `onMount` as default
**Rule.** Don't reach for `onMount` for everything that runs on mount.
**Reason.** `$effect` covers most cases with deps + cleanup; `onMount` is a niche tool now.

### D27. DOM access during component body
**Rule.** Don't read `el.offsetWidth` at the top level of `<script>`.
**Reason.** No DOM exists yet. Move into `$effect` (post-mount) or `$effect.pre` (pre-update).

### D28. Cargo-culted `tick()`
**Rule.** Don't sprinkle `await tick()` to "wait for reactivity."
**Reason.** Most reactivity settles automatically before the next `$effect`. `tick` is for forcing a flush before reading the DOM.

### D29. Prop named `class` or `style`
**Rule.** Don't name a prop `class`/`style` (or `slot`).
**Reason.** Collides with HTML attributes; `class` is also a JS reserved word in some contexts.
```svelte
<!-- wrong -->
let { class: cls } = $props();
<!-- right -->
let { className }: { className?: string } = $props();
```

### D30. Multiple components per file
**Rule.** Don't try to export several components from one `.svelte` file.
**Reason.** The compiler treats one file as one default-exported component. Split per file.

### D31. Untyped snippet props
**Rule.** Don't accept a snippet prop without `Snippet<[...]>` typing.
**Reason.** Render-time arg mismatches go undetected; consumers pass wrong shapes.
```svelte
// wrong
let { row } = $props();
// right
let { row }: { row: Snippet<[Item]> } = $props();
```

### D32. Leaky `$effect.root`
**Rule.** Don't call `$effect.root(...)` and discard the return.
**Reason.** It returns a `dispose()`; never calling it leaks effects forever.
```ts
// wrong
$effect.root(() => { ... });
// right
const stop = $effect.root(() => { ... });
// ...later
stop();
```

### D33. `accessors` as a fix
**Rule.** Don't enable `<svelte:options accessors />` to "expose props from outside."
**Reason.** Symptom of bypassing `$bindable` / callbacks; fix the contract instead.

### D34. Deep `$state` on hot-path mega-collections
**Rule.** Don't wrap 100k-row arrays in default `$state` if you mutate often.
**Reason.** Proxy traps add per-access overhead; use `$state.raw` and reassign references.
[Source: svelte.dev `$state.raw` performance note](https://svelte.dev/docs/svelte/$state#$state.raw).

### D35. Long composed class strings
**Rule.** Don't ship `class="a b c {x?'d':''} {y} {z?'e':''}"` interpolations.
**Reason.** Hard to read, brittle. Prefer `$derived` arrays joined with `' '`, or stack `class:` directives.
```svelte
<script>let cls = $derived(['btn', size, active && 'on'].filter(Boolean).join(' '));</script>
<div class={cls}>...</div>
```

### D36. `await` blocks without error branch
**Rule.** Don't `{#await p}{:then v}...{/await}` without a `{:catch}` for fallible promises.
**Reason.** A rejection bubbles to the nearest error boundary or crashes the tree silently.
```svelte
{#await load()}
  Loading
{:then data}
  {data.x}
{:catch e}
  Failed: {e.message}
{/await}
```

### D37. `bind:this` accessed in body
**Rule.** Don't read `el.value` at the top of `<script>` after `bind:this={el}`.
**Reason.** `el` is `undefined` until after mount. Read inside `$effect` or `onMount`.

### D38. Forgetting `{#key}` for forced resets
**Rule.** Don't try to re-init a child by toggling props when subtree state needs a clean slate.
**Reason.** `{#key dep}<Child />{/key}` is the idiomatic, declarative reset.
```svelte
{#key userId}
  <ProfileEditor />
{/key}
```

---

## Sources

- [Svelte docs — runes, snippets, transitions](https://svelte.dev/docs/svelte)
- [Svelte 5 release post — "Svelte 5 is alive"](https://svelte.dev/blog/svelte-5-is-alive)
- [v5 migration guide — slots → snippets, event dispatcher → callbacks, `<svelte:component>` deprecation](https://svelte.dev/docs/svelte/v5-migration-guide)
- [Runes RFC — design rationale for `$state`/`$derived`/`$effect`](https://github.com/sveltejs/rfcs/blob/master/text/0006-runes.md)
- [`$state.raw` docs — when to skip the proxy](https://svelte.dev/docs/svelte/$state#$state.raw)
- [Snippets reference — typing with `Snippet<[...]>`](https://svelte.dev/docs/svelte/snippet)
- Rich Harris talks — Svelte Summit 2024, Svelte 5 launch keynote
- Geoff Rich blog & Joy of Code Svelte 5 tutorials (2024–2025)
