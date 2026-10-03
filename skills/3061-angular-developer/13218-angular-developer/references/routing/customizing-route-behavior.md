# Customizing Route Behavior

Source: https://v20.angular.dev/guide/routing/customizing-route-behavior

> **Note:** Always verify the default router behavior doesn't meet your needs before customizing. Custom strategies add complexity and can impact memory usage if not carefully managed.

---

## Router Configuration Options (`withRouterConfig`)

```ts
provideRouter(routes, withRouterConfig({ /* options */ }))
```

### `canceledNavigationResolution`

Controls how the router restores browser history when navigation is cancelled.

- `'replace'` (default) — overwrites the history entry with the rollback URL via `location.replaceState`
- `'computed'` — keeps the in-flight history index in sync with Angular navigation (back button cancel → forward navigation to return)

Use `'computed'` when your app uses `urlUpdateStrategy: 'eager'` or guards frequently cancel popstate navigations.

```ts
withRouterConfig({ canceledNavigationResolution: 'computed' })
```

### `onSameUrlNavigation`

What happens when navigating to the current URL.

- `'ignore'` (default) — skips the work
- `'reload'` — re-runs guards and resolvers, refreshes components

Useful for "reload" buttons or repeated filter clicks:

```ts
withRouterConfig({ onSameUrlNavigation: 'reload' })
// or per-navigation:
router.navigate(['/some-path'], { onSameUrlNavigation: 'reload' })
```

### `paramsInheritanceStrategy`

Controls how route parameters flow from parent to child routes.

- `'emptyOnly'` (default) — child inherits params only when its path is empty or parent has no component
- `'always'` — matrix params, route data, and resolved values available throughout the route tree

```ts
withRouterConfig({ paramsInheritanceStrategy: 'always' })
```

With `'always'`, deep nested components can access all ancestor params directly from `this.route.snapshot.params` instead of traversing `parent` refs.

### `urlUpdateStrategy`

When Angular writes to the browser address bar.

- `'deferred'` (default) — waits for successful navigation before changing URL
- `'eager'` — updates immediately when navigation starts (useful for analytics that need to see attempted URL)

```ts
withRouterConfig({ urlUpdateStrategy: 'eager' })
```

### `defaultQueryParamsHandling`

Fallback behavior when `Router.createUrlTree` doesn't specify `queryParamsHandling`.

- `'replace'` (default) — replaces existing query string
- `'merge'` — combines new params with existing
- `'preserve'` — keeps existing unless new ones are explicitly supplied

```ts
withRouterConfig({ defaultQueryParamsHandling: 'merge' })
```

---

## Route Reuse Strategy

By default Angular destroys components when navigating away and creates new instances when returning. A custom `RouteReuseStrategy` can preserve component state instead.

**When useful:**
- Form state preservation
- Avoiding re-fetch of expensive data
- Scroll position maintenance
- Tab-like interfaces

### The 5 Methods

| Method | Description |
|--------|-------------|
| `shouldDetach(route)` | Should this route be stored when navigating away? |
| `store(route, handle)` | Store the detached route handle |
| `shouldAttach(route)` | Should a stored route be reattached when navigating to it? |
| `retrieve(route)` | Return the stored handle for reattachment |
| `shouldReuseRoute(future, curr)` | Should the current route instance be reused? |

### Example

```ts
@Injectable()
export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private handlers = new Map<Route | null, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return route.data['reuse'] === true;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (handle && route.data['reuse'] === true) {
      this.handlers.set(route.routeConfig, handle);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return route.data['reuse'] === true && this.handlers.has(route.routeConfig);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return route.data['reuse'] === true ? this.handlers.get(route.routeConfig) ?? null : null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}
```

Register via DI:

```ts
{ provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy }
```

Opt routes in via `data`:

```ts
{ path: 'products', component: ProductListComponent, data: { reuse: true } }
```

**Note:** Avoid using the route path as the map key when `canMatch` guards are involved.

---

## Preloading Strategy

Determines when lazy-loaded modules load in the background.

### Built-in Strategies

| Strategy | Description |
|----------|-------------|
| `NoPreloading` (default) | Modules only load when navigated to |
| `PreloadAllModules` | Loads all lazy modules after initial navigation |

```ts
provideRouter(routes, withPreloading(PreloadAllModules))
```

### Custom Preloading Strategy

```ts
@Injectable()
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    return route.data?.['preload'] ? load() : of(null);
  }
}
```

Route opts in via `data`:

```ts
{ path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.routes'), data: { preload: true } }
```

---

## URL Handling Strategy

Controls which URLs Angular handles vs. ignores. Useful for incremental migration or sharing URL space with legacy apps.

```ts
@Injectable()
export class CustomUrlHandlingStrategy implements UrlHandlingStrategy {
  shouldProcessUrl(url: UrlTree): boolean {
    return url.toString().startsWith('/app') || url.toString().startsWith('/admin');
  }
  extract(url: UrlTree): UrlTree { return url; }
  merge(newUrlPart: UrlTree, rawUrl: UrlTree): UrlTree { return newUrlPart; }
}

// Register:
{ provide: UrlHandlingStrategy, useClass: CustomUrlHandlingStrategy }
```

---

## Custom Route Matchers

When standard path matching isn't enough, provide a `matcher` function in the route config instead of `path`.

A matcher receives `(segments: UrlSegment[], group: UrlSegmentGroup, route: Route)` and returns `UrlMatchResult | null`.

### Example: Version-Based Routing

```ts
export function versionMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length >= 2 && segments[0].path.match(/^v\d+(\.\d+)*$/)) {
    return {
      consumed: segments.slice(0, 2),
      posParams: { version: segments[0], section: segments[1] }
    };
  }
  return null;
}

export const routes: Routes = [
  { matcher: versionMatcher, component: DocumentationComponent },
  { path: 'latest/docs', redirectTo: 'v3/docs' }
];
```

### Performance Tips for Custom Matchers

- Return early when a match is clearly impossible
- Avoid expensive operations (API calls, complex regex)
- Consider caching results for repeated URL patterns

Matchers run on every navigation until a match is found — keep them fast.
