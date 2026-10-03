# Route Transition Animations

Source: https://v20.angular.dev/guide/routing/route-transition-animations

Route transition animations enhance user experience by providing smooth visual transitions when navigating between different views. Angular Router includes built-in support for the browser's **View Transitions API**.

> **HELPFUL:** The Router's native View Transitions integration is currently in [developer preview](/reference/releases#developer-preview). Native View Transitions are a relatively new browser feature with limited support across all browsers.

---

## How View Transitions Work

View transitions use the browser's native [`document.startViewTransition` API](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition). The flow:

1. **Capture current state** — Browser screenshots the current page
2. **Execute DOM update** — Callback function runs to update the DOM
3. **Capture new state** — Browser captures the updated page
4. **Play transition** — Browser animates between old and new states

```ts
document.startViewTransition(async () => {
  await updateTheDOMSomehow();
});
```

See the [Chrome Explainer](https://developer.chrome.com/docs/web-platform/view-transitions) for more details.

---

## How the Router Uses View Transitions

During navigation, the Router:

1. **Completes navigation preparation** — Route matching, lazy loading, guards, resolvers execute
2. **Initiates the view transition** — Calls `startViewTransition` when routes are ready for activation
3. **Updates the DOM** — Activates new routes and deactivates old ones within the transition callback
4. **Finalizes the transition** — Promise resolves when Angular completes rendering

The integration acts as a **progressive enhancement** — browsers without View Transitions API support perform normal DOM updates without animation.

---

## Enabling View Transitions in the Router

### Standalone bootstrap
```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';

bootstrapApplication(MyApp, {
  providers: [
    provideRouter(routes, withViewTransitions()),
  ]
});
```

### NgModule bootstrap
```ts
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableViewTransitions: true })]
})
export class AppRouting {}
```

[StackBlitz example](https://stackblitz.com/edit/stackblitz-starters-2dnvtm?file=src%2Fmain.ts)

---

## Customizing Transitions with CSS

Customize view transitions using CSS. Steps:

1. **Add `view-transition-name`** — Assign unique names to elements you want to animate
2. **Define global animations** — Create CSS animations in your **global styles** (not component styles — view encapsulation blocks them)
3. **Target transition pseudo-elements** — Use `::view-transition-old()` and `::view-transition-new()`

Example — rotation effect on a counter element:

```css
/* In global styles */
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

**IMPORTANT:** Define view transition animations in **global styles**, not component styles. Angular's view encapsulation prevents component styles from targeting transition pseudo-elements.

[StackBlitz example](https://stackblitz.com/edit/stackblitz-starters-fwn4i7?file=src%2Fmain.ts)

---

## Advanced Control with `onViewTransitionCreated`

`withViewTransitions` accepts an options object with an `onViewTransitionCreated` callback:

- Runs in an [injection context](/guide/di/dependency-injection-context#run-within-an-injection-context)
- Receives a [`ViewTransitionInfo`](/api/router/ViewTransitionInfo) object containing:
  - The `ViewTransition` instance from `startViewTransition`
  - The [`ActivatedRouteSnapshot`](/api/router/ActivatedRouteSnapshot) for the route navigating *from*
  - The [`ActivatedRouteSnapshot`](/api/router/ActivatedRouteSnapshot) for the route navigating *to*

Example — skip transitions for fragment/query-param-only changes:

```ts
import { inject } from '@angular/core';
import { Router, withViewTransitions } from '@angular/router';

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

`skipTransition()` prevents animation while still completing the navigation.

---

## Examples from the Chrome Explainer Adapted to Angular

### Transitioning elements don't need to be the same DOM element
Elements can transition smoothly between different DOM elements as long as they share the same `view-transition-name`.
- [Chrome Explainer](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#transitioning_elements_dont_need_to_be_the_same_dom_element)
- [Angular StackBlitz](https://stackblitz.com/edit/stackblitz-starters-dh8npr?file=src%2Fmain.ts)

### Custom entry and exit animations
- [Chrome Explainer](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#custom_entry_and_exit_transitions)
- [Angular StackBlitz](https://stackblitz.com/edit/stackblitz-starters-8kly3o)

### Async DOM updates and waiting for content
Angular Router does **not** provide a way to delay view transitions — by design, to keep pages interactive. Use content you already have rather than waiting.
- [Chrome Explainer](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#async_dom_updates_and_waiting_for_content)

### Handle multiple view transition styles with view transition types
- [Chrome Explainer](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#view-transition-types)
- [Angular StackBlitz](https://stackblitz.com/edit/stackblitz-starters-vxzcam)

### Handle multiple styles with a class name on the transition root (deprecated)
- [Chrome Explainer](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#changing-on-navigation-type)
- [Angular StackBlitz](https://stackblitz.com/edit/stackblitz-starters-nmnzzg?file=src%2Fmain.ts)

### Transitioning without freezing other animations
- [Chrome Explainer](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#transitioning-without-freezing)
- [Angular StackBlitz](https://stackblitz.com/edit/stackblitz-starters-76kgww)

### Animating with JavaScript
- [Chrome Explainer](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#animating-with-javascript)
- [Angular StackBlitz](https://stackblitz.com/edit/stackblitz-starters-cklnkm)
