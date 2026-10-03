# Read Route State

Source: https://v20.angular.dev/guide/routing/read-route-state

## ActivatedRoute

`ActivatedRoute` (from `@angular/router`) provides all information associated with the current route.

```ts
export class ProductComponent {
  private activatedRoute = inject(ActivatedRoute);
}
```

Key observable properties:

| Property | Details |
|----------|---------|
| `url` | Observable of route path segments (string array) |
| `data` | Observable of the route `data` object plus resolved values |
| `params` | Observable of required/optional route parameters |
| `queryParams` | Observable of query parameters (global, all routes) |

---

## Route Snapshots

A snapshot is a static view of the route state at a given moment:

```ts
export class UserProfileComponent {
  private route = inject(ActivatedRoute);

  constructor() {
    // URL: https://www.angular.dev/users/123?role=admin&status=active#contact
    const snapshot = this.route.snapshot;
    const userId = snapshot.paramMap.get('id');          // '123'
    const params = snapshot.params;                      // { id: '123' }
    const queryParams = snapshot.queryParams;            // { role: 'admin', status: 'active' }
  }
}
```

Snapshots are static — they don't update when the URL changes.

---

## Reading Parameters

### Route Parameters

Defined in the path with `:`:

```ts
{ path: 'product/:id', component: ProductComponent }
```

Subscribe to `route.params` to react to changes:

```ts
export class ProductDetailComponent {
  productId = signal('');
  private activatedRoute = inject(ActivatedRoute);

  constructor() {
    this.activatedRoute.params.subscribe((params) => {
      this.productId.set(params['id']);
    });
  }
}
```

### Query Parameters

Appear after `?`. Optional, don't affect route matching. Good for filters, sorting, pagination:

```ts
// Navigate with query params
this.router.navigate(['/products'], {
  queryParams: { category: 'electronics', sort: 'price', page: 1 }
});

// Read query params
this.route.queryParams.subscribe(params => {
  const sort = params['sort'] || 'price';
  const page = Number(params['page']) || 1;
});

// Update one param without losing others
this.router.navigate([], {
  queryParams: { sort },
  queryParamsHandling: 'merge'
});
```

### Matrix Parameters

Scoped to a specific URL segment, use `;` separator. Don't need to be declared in route config:

```ts
// URL: /awesome-products;view=grid;filter=new
this.router.navigate(['/awesome-products', { view: 'grid', filter: 'new' }]);

// Read via route.params (same as route params)
this.route.params.subscribe((params) => {
  const view = params['view'];
  const filter = params['filter'];
});
```

Also available as component inputs when `withComponentInputBinding` is enabled.

---

## RouterLinkActive — Styling the Active Route

Automatically adds CSS classes to links matching the current URL:

```html
<a routerLink="/about" routerLinkActive="active-button" ariaCurrentWhenActive="page">
  About
</a>
```

Multiple classes:

```html
<a routerLink="/user/bob" routerLinkActive="class1 class2">Bob</a>
<a routerLink="/user/bob" [routerLinkActive]="['class1', 'class2']">Bob</a>
```

### Exact Match Only

```html
<a [routerLink]="['/user/jane']"
   routerLinkActive="active-link"
   [routerLinkActiveOptions]="{exact: true}">
  User
</a>
```

`exact: true` expands to:
```ts
{ paths: 'exact', fragment: 'ignored', matrixParams: 'ignored', queryParams: 'exact' }
```

Default (`exact: false`) is equivalent to:
```ts
{ paths: 'subset', fragment: 'ignored', matrixParams: 'ignored', queryParams: 'subset' }
```

### Apply to an Ancestor Element

```html
<div routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}">
  <a routerLink="/user/jim">Jim</a>
  <a routerLink="/user/bob">Bob</a>
</div>
```
