# Other Common Routing Tasks

Source: https://v20.angular.dev/guide/routing/common-router-tasks

## Getting Route Information via `withComponentInputBinding`

The preferred way to pass route data (params, query params, resolved data, static data) directly into a component via inputs:

### 1. Enable `withComponentInputBinding`

```ts
providers: [provideRouter(appRoutes, withComponentInputBinding())]
```

### 2. Add `input()` matching the param/data key

```ts
export class EditGroceryItem {
  id = input.required<string>();
  hero = computed(() => this.service.getHero(this.id()));
}
```

### 3. Optional: Handle undefined/default values

```ts
// Transform approach
id = input.required({
  transform: (maybeUndefined: string | undefined) => maybeUndefined ?? '0',
});

// linkedSignal approach
id = input<string | undefined>();
internalId = linkedSignal(() => this.id() ?? getDefaultId());
```

**Note:** For parent component route info, set `withRouterConfig({ paramsInheritanceStrategy: 'always' })`.

---

## 404 Page (Wildcard Route)

```ts
const routes: Routes = [
  { path: 'first-component', component: FirstComponent },
  { path: 'second-component', component: SecondComponent },
  { path: '**', component: PageNotFoundComponent }  // always last
];
```

---

## Link Parameters Array

Bind to `RouterLink` or pass to `Router.navigate()`:

```html
<!-- Simple route -->
<a [routerLink]="['/heroes']">Heroes</a>

<!-- With route parameter -->
<a [routerLink]="['/hero', hero.id]">{{ hero.name }}</a>

<!-- With matrix parameters (optional params, use object) -->
<a [routerLink]="['/crisis-center', { foo: 'foo' }]">Crisis Center</a>

<!-- Child routes -->
<a [routerLink]="['/crisis-center', 1]">Dragon Crisis</a>
<!-- Results in /crisis-center/1 -->
```

---

## `LocationStrategy` and Browser URL Styles

Angular supports two URL styles:

| Provider | Style | Example |
|----------|-------|---------|
| `PathLocationStrategy` (default) | HTML5 pushState | `localhost:3002/crisis-center` |
| `HashLocationStrategy` | Hash URLs | `localhost:3002/src/#/crisis-center` |

Configure hash routing:

```ts
providers: [provideRouter(appRoutes, withHashLocation())]
```

HTML5 pushState (default) requires a `<base href>` in `index.html`:

```html
<head>
  <base href="/">
</head>
```

Without `<base href>`, the browser may fail to load CSS, scripts, and images on deep-linked URLs.

If you can't add a `<base>` element, provide `APP_BASE_HREF` via DI and use root URLs for all web resources.
