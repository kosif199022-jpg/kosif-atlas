# Define Routes

Source: https://v20.angular.dev/guide/routing/define-routes

## What Are Routes?

A **route** is an object that maps a URL path (or pattern) to a component, plus additional configuration.

```ts
import { AdminPage } from './app-admin/app-admin.component';
const adminPage = { path: 'admin', component: AdminPage };
```

### Routes File Convention

Most projects define routes in `app.routes.ts`:

```ts
import { Routes } from '@angular/router';
import { HomePage } from './home-page/home-page.component';
import { AdminPage } from './about-page/admin-page.component';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'admin', component: AdminPage },
];
```

### Adding the Router to Your App

Pass routes via `provideRouter` inside `providers` in `app.config.ts`:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)]
};
```

---

## Route URL Paths

### Static Paths

Fixed paths such as `/admin`, `/blog`, `/settings/account`.

### Parameterized Paths

Prefix segment names with `:` to capture dynamic values:

```ts
{ path: 'user/:id', component: UserProfile }
```

- `/user/leeroy` and `/user/jenkins` both render `UserProfile`
- Multiple params: `{ path: 'user/:id/:social-media', component: SocialMediaFeed }`
- Valid param names: start with a letter, contain only letters, digits, `_`, `-`

### Wildcards

`**` matches any unmatched URL. Always place last:

```ts
{ path: '**', component: NotFound }
```

---

## URL Matching Strategy

Angular uses **first-match wins**. More specific routes must come before less specific ones:

```ts
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'users/new', component: NewUserComponent }, // most specific first
  { path: 'users/:id', component: UserDetailComponent },
  { path: 'users', component: UsersComponent },
  { path: '**', component: NotFoundComponent }        // always last
];
```

---

## Loading Strategies

### Eagerly Loaded

Use the `component` property — the component bundle is included in the initial JS bundle:

```ts
{ path: '', component: HomePage }
```

### Lazily Loaded

Use `loadComponent` to split the component into a separate chunk, loaded on demand:

```ts
{
  path: 'login',
  loadComponent: () => import('./components/auth/login-page').then(m => m.LoginPage)
}
```

The loader runs inside the **injection context** of the current route, so `inject()` works inside it:

```ts
{
  path: 'dashboard',
  loadComponent: () => {
    const flags = inject(FeatureFlags);
    return flags.isPremium
      ? import('./dashboard/premium-dashboard').then(m => m.PremiumDashboard)
      : import('./dashboard/basic-dashboard').then(m => m.BasicDashboard);
  },
}
```

**Rule of thumb:** Eager-load primary landing pages; lazy-load everything else. Avoid deep multi-level lazy nesting — it degrades performance.

---

## Redirects

```ts
{ path: 'articles', redirectTo: '/blog' },
{ path: 'blog', component: BlogComponent }
```

---

## Page Titles

```ts
{ path: 'about', component: AboutComponent, title: 'About Us' }
```

Dynamic title via `ResolveFn`:

```ts
const titleResolver: ResolveFn<string> = (route) => route.queryParams['id'];
{ path: 'products', component: ProductsComponent, title: titleResolver }
```

### Custom TitleStrategy

```ts
@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot) || this.title.getTitle();
    this.title.setTitle(`MyAwesomeApp - ${pageTitle}`);
  }
}

// In providers:
{ provide: TitleStrategy, useClass: AppTitleStrategy }
```

---

## Route-Level Providers

```ts
{
  path: 'admin',
  providers: [
    AdminService,
    { provide: ADMIN_API_KEY, useValue: '12345' }
  ],
  children: [
    { path: 'users', component: AdminUsersComponent },
    { path: 'teams', component: AdminTeamsComponent }
  ]
}
```

---

## Static Route Data

```ts
{ path: 'about', component: AboutComponent, data: { analyticsId: '456' } }
```

Read via `ActivatedRoute.data`.

---

## Nested (Child) Routes

```ts
const routes: Routes = [
  {
    path: 'product/:id',
    component: ProductComponent,
    children: [
      { path: 'info', component: ProductInfoComponent },
      { path: 'reviews', component: ProductReviewsComponent }
    ]
  }
];
```

The parent component must include its own `<router-outlet />` to render child routes.
