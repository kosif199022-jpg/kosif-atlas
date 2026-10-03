# Incremental Hydration

Source: https://v20.angular.dev/guide/incremental-hydration

**Incremental hydration** is an advanced type of [hydration](guide/hydration) that leaves sections of your application dehydrated and incrementally triggers hydration as they are needed.

## Why Use Incremental Hydration?

- Produces **smaller initial bundles** while maintaining comparable UX to full hydration
- Reduces [First Input Delay (FID)](https://web.dev/fid) and [Cumulative Layout Shift (CLS)](https://web.dev/cls)
- Allows `@defer` blocks to be used **above the fold** without layout shift (prior to incremental hydration, above-fold `@defer` blocks caused placeholder content to flash before the main template rendered)

## Enabling Incremental Hydration

Prerequisites: SSR + hydration must be enabled first. See [SSR Guide](guide/ssr) and [Hydration Guide](guide/hydration).

```ts
import {
  bootstrapApplication,
  provideClientHydration,
  withIncrementalHydration,
} from '@angular/platform-browser';

bootstrapApplication(AppComponent, {
  providers: [provideClientHydration(withIncrementalHydration())]
});
```

Incremental hydration **automatically enables event replay**. If you already have `withEventReplay()` in your list, you can safely remove it.

## How Incremental Hydration Works

Builds on top of: full-application hydration + deferrable views + event replay.

Add `hydrate` triggers to `@defer` blocks to define incremental hydration boundaries:

- **During SSR**: Angular loads dependencies and renders the main template (not the `@placeholder`)
- **During CSR**: Dependencies are still deferred; content stays dehydrated until its `hydrate` trigger fires
- **After hydration trigger fires**: Deferred block fetches dependencies and hydrates
- **Browser events** before hydration: Queued and replayed once hydration completes

## Hydrate Triggers

Each `@defer` block can have multiple hydrate triggers (separated by `;`). Angular triggers hydration when **any** trigger fires.

### `hydrate on` Triggers

| Trigger | Description |
|---|---|
| `hydrate on idle` | Triggers when the browser is idle (`requestIdleCallback`) |
| `hydrate on viewport` | Triggers when content enters the viewport (Intersection Observer API) |
| `hydrate on interaction` | Triggers on `click` or `keydown` on the specified element |
| `hydrate on hover` | Triggers on `mouseover` or `focusin` over the triggered area |
| `hydrate on immediate` | Triggers immediately after all other non-deferred content finishes rendering |
| `hydrate on timer(Xms)` | Triggers after a specified duration (`ms` or `s`) |

#### Examples

```html
@defer (hydrate on idle) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

```html
@defer (hydrate on viewport) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

```html
@defer (hydrate on interaction) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

```html
@defer (hydrate on hover) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

```html
@defer (hydrate on immediate) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

```html
@defer (hydrate on timer(500ms)) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

### `hydrate when`

Accepts a custom conditional expression; triggers when the condition becomes truthy:

```html
@defer (hydrate when condition) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

**NOTE:** `hydrate when` conditions only trigger when the block is the **top-most dehydrated** `@defer` block. The condition is specified in the parent component — if the parent is dehydrated, Angular cannot resolve the expression yet.

### `hydrate never`

Keeps the content permanently dehydrated (effectively static content for the initial render):

```html
@defer (on viewport; hydrate never) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

**NOTE:** `hydrate never` applies to the **initial render only**. On subsequent client-side renders (e.g., navigation to the route), the block behaves like a regular `@defer` block using its regular triggers (e.g., `on viewport` above).

`hydrate never` also prevents hydration of the **entire nested subtree** — no nested `hydrate` triggers will fire for content inside.

## Hydrate Triggers Alongside Regular Triggers

Hydrate triggers only apply to the initial SSR load. Regular triggers apply to subsequent CSR:

```html
@defer (on idle; hydrate on interaction) {
  <example-cmp />
} @placeholder {
  <div>Example Placeholder</div>
}
```

- **Initial load (SSR)**: `hydrate on interaction` applies — content hydrates on user interaction
- **Subsequent CSR** (e.g., user clicks routerLink): `on idle` applies — content loads when browser is idle

## Nested `@defer` Blocks

Angular's component system is hierarchical — hydrating a child requires all parents to be hydrated first. When a child block's trigger fires, hydration cascades from the **top-most dehydrated ancestor** down to the triggered child:

```html
@defer (hydrate on interaction) {
  <parent-block-cmp />
  @defer (hydrate on hover) {
    <child-block-cmp />
  } @placeholder {
    <div>Child placeholder</div>
  }
} @placeholder {
  <div>Parent Placeholder</div>
}
```

Hovering over the nested block triggers:
1. Parent block hydrates first (`<parent-block-cmp />`)
2. Then child block hydrates (`<child-block-cmp />`)

## Constraints

Same constraints as full-application hydration:
- No direct DOM manipulation
- Valid HTML structure required

See the [Hydration guide constraints](guide/hydration#constraints).

## Do I Still Need `@placeholder` Blocks?

**Yes.** `@placeholder` blocks are not used during incremental hydration, but they **are** required for subsequent CSR cases. If the route wasn't part of the initial load and the user navigates to it client-side, the `@defer` block renders as a regular deferred block — which requires the `@placeholder`.
