# Deferred Loading with `@defer`

Source: https://v20.angular.dev/guide/templates/defer

## Overview

`@defer` blocks split lazily-loaded content into a separate JS file, reducing initial bundle size and improving Core Web Vitals (LCP, TTFB).

```html
@defer {
  <large-component />
}
```

## Deferred Dependency Requirements

For dependencies to be deferred they must be:
1. **Standalone** — non-standalone deps are eagerly loaded even inside `@defer`
2. **Not referenced outside the `@defer` block** in the same file (including `ViewChild` queries)

Transitive dependencies don't need to be standalone.

## Sub-blocks

### `@placeholder` — Content before trigger fires

```html
@defer {
  <large-component />
} @placeholder (minimum 500ms) {
  <p>Placeholder content</p>
}
```

- Optional; required by some triggers
- Dependencies are **eagerly loaded**
- `minimum` prevents flickering for fast loads

### `@loading` — Content while loading

```html
@defer {
  <large-component />
} @loading (after 100ms; minimum 1s) {
  <img alt="loading..." src="loading.gif" />
}
```

- Replaces `@placeholder` once loading is triggered
- `after` — delay before showing loading state
- `minimum` — minimum display time for loading state
- Dependencies are **eagerly loaded**

### `@error` — Content when loading fails

```html
@defer {
  <large-component />
} @error {
  <p>Failed to load large component.</p>
}
```

- Dependencies are **eagerly loaded**

## Triggers

Multiple triggers separated by `;` are evaluated as **OR** conditions.

### `on` Triggers

| Trigger | Description |
|---|---|
| `idle` | When browser reaches idle state (default) |
| `viewport` | When element enters the viewport |
| `interaction` | On `click` or `keydown` on the element |
| `hover` | On `mouseover` / `focusin` |
| `immediate` | Immediately after non-deferred content renders |
| `timer(500ms)` | After a specified duration |

```html
<!-- Default (idle) -->
@defer { <large-cmp /> }

<!-- Viewport -->
@defer (on viewport) {
  <large-cmp />
} @placeholder {
  <div>Placeholder</div>
}

<!-- Viewport with template reference variable -->
<div #greeting>Hello!</div>
@defer (on viewport(greeting)) {
  <greetings-cmp />
}

<!-- Timer -->
@defer (on timer(500ms)) { <large-cmp /> }

<!-- Interaction with reference -->
<div #trigger>Click me</div>
@defer (on interaction(trigger)) { <large-cmp /> }
```

### `when` Trigger (custom condition)

```html
@defer (when condition) {
  <large-cmp />
}
```

One-time operation — does **not** revert if condition becomes falsy.

## Prefetching

Start loading JS before the user triggers the block:

```html
@defer (on interaction; prefetch on idle) {
  <large-cmp />
} @placeholder {
  <div>Placeholder</div>
}
```

## Testing

```ts
TestBed.configureTestingModule({ deferBlockBehavior: DeferBlockBehavior.Manual });

const deferBlockFixture = (await componentFixture.getDeferBlocks())[0];

await deferBlockFixture.render(DeferBlockState.Loading);
await deferBlockFixture.render(DeferBlockState.Complete);
```

## SSR / SSG Behavior

- By default, `@defer` blocks render `@placeholder` on the server
- To render main content server-side, enable [Incremental Hydration](https://v20.angular.dev/guide/incremental-hydration) and configure `hydrate` triggers

## HMR Note

When HMR is active, all `@defer` chunks are fetched eagerly (overrides triggers). Disable with `--no-hmr` to restore normal behavior.

## NgModule Compatibility

`@defer` works with NgModule-based components as **hosts**, but only **standalone** components, directives, and pipes inside the block are deferred. NgModule-based deps are eagerly loaded.

## Best Practices

- **Avoid cascading loads** — nested `@defer` blocks should use different triggers
- **Avoid layout shifts** — don't defer components visible in the initial viewport
- **Accessibility** — wrap `@defer` in a `[aria-live]` region so screen readers announce transitions:

```html
<div aria-live="polite" aria-atomic="true">
  @defer (on timer(2000)) {
    <user-profile [user]="currentUser" />
  } @placeholder {
    Loading user profile...
  }
</div>
```
