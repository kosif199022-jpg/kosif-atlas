# Route Transition Animations

Source: https://v20.angular.dev/guide/routing/route-transition-animations

> **Note:** The Router's native View Transitions integration is currently in **developer preview**. Native View Transitions have limited browser support.

Angular Router integrates with the browser's [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition) to create smooth animations between route changes.

---

## How View Transitions Work

The browser API:

```js
document.startViewTransition(async () => {
  await updateTheDOMSomehow();
});
```

Steps:
1. Browser captures a screenshot of the current state
2. The callback updates the DOM
3. Browser captures the new state
4. Browser animates between old and new states

---

## How Angular Router Uses View Transitions

During navigation, the router:

1. Completes preparation — route matching, lazy loading, guards, resolvers
2. Calls `startViewTransition` when routes are ready to activate
3. Activates new routes and deactivates old ones inside the callback
4. Resolves when Angular finishes rendering

This is a **progressive enhancement** — when the browser doesn't support View Transitions, navigation proceeds normally without animation.

---

## Enabling View Transitions

### Standalone Bootstrap

```ts
import { provideRouter, withViewTransitions } from '@angular/router';

bootstrapApplication(MyApp, {
  providers: [provideRouter(routes, withViewTransitions())]
});
```

### NgModule Bootstrap

```ts
@NgModule({
  imports: [RouterModule.forRoot(routes, { enableViewTransitions: true })]
})
export class AppRouting {}
```

---

## Customizing Transitions with CSS

1. Add `view-transition-name` to elements you want to animate
2. Define animations in your **global styles** (not component styles — view encapsulation prevents targeting pseudo-elements from component scope)
3. Target `::view-transition-old()` and `::view-transition-new()` pseudo-elements

```css
/* global styles */
@keyframes rotate-out {
  to { transform: rotate(90deg); }
}
@keyframes rotate-in {
  from { transform: rotate(-90deg); }
}

::view-transition-old(count),
::view-transition-new(count) {
  animation-duration: 200ms;
  animation-name: -ua-view-transition-fade-in, rotate-in;
}
::view-transition-old(count) {
  animation-name: -ua-view-transition-fade-out, rotate-out;
}
```

---

## `onViewTransitionCreated` Callback

`withViewTransitions` accepts an options object with `onViewTransitionCreated` for advanced control:

- Runs in an injection context
- Receives a `ViewTransitionInfo` object with:
  - The `ViewTransition` instance
  - `ActivatedRouteSnapshot` for the route navigated **from**
  - `ActivatedRouteSnapshot` for the route navigated **to**

Example — skip transition when only fragment or query params change:

```ts
withViewTransitions({
  onViewTransitionCreated: ({ transition }) => {
    const router = inject(Router);
    const targetUrl = router.getCurrentNavigation()!.finalUrl!;
    const config = {
      paths: 'exact',
      matrixParams: 'exact',
      fragment: 'ignored',
      queryParams: 'ignored',
    };
    if (router.isActive(targetUrl, config)) {
      transition.skipTransition();
    }
  },
})
```

---

## Key Rules

- **Global styles only** for view transition CSS — component-scoped styles can't target `::view-transition-*` pseudo-elements
- Angular Router does **not** provide a way to delay view transitions (prevents pages from becoming non-interactive)
- The integration is a progressive enhancement — unsupported browsers get normal navigation
