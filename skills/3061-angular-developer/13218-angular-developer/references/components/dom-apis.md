# Using DOM APIs

Source: https://v20.angular.dev/guide/components/dom-apis

Angular handles most DOM creation, updates, and removals for you. When you do need direct DOM access, inject `ElementRef`:

```typescript
@Component({...})
export class ProfilePhoto {
  constructor() {
    const elementRef = inject(ElementRef);
    console.log(elementRef.nativeElement);
  }
}
```

`nativeElement` references the host [Element](https://developer.mozilla.org/docs/Web/API/Element) instance.

## Using Render Callbacks

Use `afterEveryRender` or `afterNextRender` to safely interact with the DOM after Angular finishes rendering:

```typescript
@Component({...})
export class ProfilePhoto {
  constructor() {
    const elementRef = inject(ElementRef);
    afterEveryRender(() => {
      elementRef.nativeElement.querySelector('input')?.focus();
    });
  }
}
```

- Must be called in an **injection context** (typically constructor)
- **Never runs** during SSR or build-time pre-rendering
- **Never directly manipulate the DOM inside other lifecycle hooks** — Angular doesn't guarantee the DOM is fully rendered there; also causes [layout thrashing](https://web.dev/avoid-large-complex-layouts-and-layout-thrashing)

## Rules

> **Avoid direct DOM manipulation whenever possible.** Always prefer expressing DOM structure in templates and updating via bindings.

> **Never directly manipulate the DOM inside other Angular lifecycle hooks.** Only manipulate DOM inside render callbacks (`afterNextRender`, `afterEveryRender`).

## Using `Renderer2`

Inject `Renderer2` for DOM manipulations that integrate with Angular features:

```typescript
@Component({...})
export class MyComponent {
  constructor(private renderer: Renderer2, private el: ElementRef) {}
}
```

Scenarios where `Renderer2` is specifically needed:
1. **Style encapsulation**: DOM elements created via `Renderer2` participate in the component's style encapsulation
2. **Animations**: Use `setProperty` for synthetic animation properties; `listen` for synthetic animation event listeners

For everything else, `Renderer2` and native DOM APIs are equivalent. `Renderer2` does **not** support DOM manipulation in SSR or pre-rendering contexts.

## When to Use DOM APIs

Legitimate use cases:
- Managing element **focus**
- Measuring element geometry (`getBoundingClientRect`)
- Reading element text content
- Setting up native observers:
  - `MutationObserver`
  - `ResizeObserver`
  - `IntersectionObserver`

## What to Avoid

- **Do not** insert, remove, or modify DOM elements directly
- **Never** directly set `innerHTML` — XSS vulnerability. Angular's template bindings for `innerHTML` include safeguards; direct DOM access bypasses them. See the [Security guide](https://v20.angular.dev/best-practices/security).
