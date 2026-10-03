# Redirecting Routes

Source: https://v20.angular.dev/guide/routing/redirecting-routes

Route redirects automatically navigate users from one route to another — useful for legacy URLs, default routes, and access control.

## Basic Configuration

Use the `redirectTo` property in route config:

```ts
const routes: Routes = [
  { path: 'marketing', redirectTo: 'newsletter' },
  { path: 'legacy-user/:id', redirectTo: 'users/:id' },
  { path: '**', redirectTo: '/login' }  // wildcard redirect
];
```

---

## `pathMatch`

Controls how Angular matches a URL to trigger the redirect.

| Value | Description |
|-------|-------------|
| `'prefix'` (default) | Beginning of URL must match |
| `'full'` | Entire URL must match exactly |

### `pathMatch: 'prefix'` (default)

All routes prefixed with `news` redirect to their `/blog` equivalent:

```ts
{ path: 'news', redirectTo: 'blog' }
// /news          → /blog
// /news/article  → /blog/article
// /news/article/:id → /blog/article/:id
```

### `pathMatch: 'full'`

Only the exact path `/news` redirects; `/news/article` does not:

```ts
{ path: 'news', redirectTo: '/blog', pathMatch: 'full' }
```

**⚠️ Important:** Always use `pathMatch: 'full'` when redirecting from the root path `''`. Without it, every URL gets redirected:

```ts
{ path: '', redirectTo: '/dashboard', pathMatch: 'full' }
```

---

## Conditional Redirects

`redirectTo` accepts a function (`RedirectFunction`) for logic-based redirects. The function receives a partial `ActivatedRouteSnapshot` and returns a string, `URLTree`, Observable, or Promise:

```ts
{
  path: 'restaurant/:location/menu',
  redirectTo: (activatedRouteSnapshot) => {
    const location = activatedRouteSnapshot.params['location'];
    const currentHour = new Date().getHours();

    if (activatedRouteSnapshot.queryParams['meal']) {
      return `/restaurant/${location}/menu/${activatedRouteSnapshot.queryParams['meal']}`;
    }
    if (currentHour >= 5 && currentHour < 11) return `/restaurant/${location}/menu/breakfast`;
    if (currentHour >= 11 && currentHour < 17) return `/restaurant/${location}/menu/lunch`;
    return `/restaurant/${location}/menu/dinner`;
  }
}
```

Note: The function only has access to part of `ActivatedRouteSnapshot` — resolved titles and lazy-loaded components are not yet available at route-matching time.
