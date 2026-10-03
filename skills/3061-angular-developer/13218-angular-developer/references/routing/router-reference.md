# Router Reference

Source: https://v20.angular.dev/guide/routing/router-reference

## Router Events (Complete List)

| Event | Description |
|-------|-------------|
| `NavigationStart` | Navigation starts |
| `RouteConfigLoadStart` | Before lazy-loading a route configuration |
| `RouteConfigLoadEnd` | After a route has been lazy loaded |
| `RoutesRecognized` | URL parsed and routes recognized |
| `GuardsCheckStart` | Start of the guard phase |
| `ChildActivationStart` | Start of child route activation |
| `ActivationStart` | Start of route activation |
| `GuardsCheckEnd` | Guard phase complete |
| `ResolveStart` | Start of the resolve phase |
| `ResolveEnd` | Resolve phase complete |
| `ChildActivationEnd` | End of child route activation |
| `ActivationEnd` | End of route activation |
| `NavigationEnd` | Navigation ended successfully |
| `NavigationCancel` | Navigation cancelled (guard returned false, or redirected via `UrlTree`/`RedirectCommand`) |
| `NavigationError` | Navigation failed due to unexpected error |
| `Scroll` | Scrolling event |

Enable all event logging: `provideRouter(routes, withDebugTracing())`

---

## Router Terminology

| Term | Description |
|------|-------------|
| `Router` | Displays the active URL's component; manages navigation |
| `provideRouter` | Provides router service providers |
| `RouterModule` | Legacy NgModule approach to providing router |
| `Routes` | Array of `Route` objects mapping URL paths to components |
| `Route` | Single mapping of a URL pattern to a component |
| `RouterOutlet` | Directive (`<router-outlet>`) marking where router renders content |
| `RouterLink` | Directive binding an HTML element to a route for navigation |
| `RouterLinkActive` | Directive adding/removing CSS classes based on active route |
| `ActivatedRoute` | Service providing route-specific info (params, data, query params) to each route component |
| `RouterState` | Current router state — tree of activated routes |
| Link parameters array | Array interpreted as routing instruction; bindable to `RouterLink` or passed to `Router.navigate()` |
| Routing component | Component with a `RouterOutlet` |

---

## `<base href>`

Required in `index.html` for HTML5 pushState routing:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <base href="/">
    <title>Angular Router</title>
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
```

Without `<base href>`, browsers may fail to load CSS/JS/images on deep-linked URLs.

If you can't modify `<head>`, provide `APP_BASE_HREF` via DI and use root-relative URLs for all resources.

---

## URL Strategies

| Strategy | URL Style | Notes |
|----------|-----------|-------|
| `PathLocationStrategy` (default) | `localhost:4200/crisis-center` | HTML5 pushState; requires `<base href>` |
| `HashLocationStrategy` | `localhost:4200/#/crisis-center` | Works in older browsers without `<base href>` |

Enable hash routing:

```ts
providers: [provideRouter(appRoutes, withHashLocation())]
```
