# Data Resolvers

Source: https://v20.angular.dev/guide/routing/data-resolvers

Data resolvers fetch data **before** a route activates, so components receive data immediately on render without needing loading states.

## Why Use Resolvers?

- **Prevent empty states** — components have data on first render
- **Eliminate loading spinners** for critical data
- **Error handling** before navigation completes
- **SSR consistency** — data available during server-side rendering

---

## Creating a Resolver

A resolver is a function matching the `ResolveFn<T>` type, receiving `ActivatedRouteSnapshot` and `RouterStateSnapshot`:

```ts
import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserStore, SettingsStore } from './user-store';
import type { User, Settings } from './types';

export const userResolver: ResolveFn<User> = (route, state) => {
  const userStore = inject(UserStore);
  const userId = route.paramMap.get('id')!;
  return userStore.getUser(userId);
};

export const settingsResolver: ResolveFn<Settings> = (route, state) => {
  const settingsStore = inject(SettingsStore);
  const userId = route.paramMap.get('id')!;
  return settingsStore.getUserSettings(userId);
};
```

---

## Configuring Routes with Resolvers

Add resolvers under the `resolve` key as a named map:

```ts
export const routes: Routes = [
  {
    path: 'user/:id',
    component: UserDetail,
    resolve: {
      user: userResolver,
      settings: settingsResolver
    }
  }
];
```

---

## Accessing Resolved Data in Components

### Via ActivatedRoute

```ts
@Component({
  template: `
    <h1>{{ user().name }}</h1>
    <p>{{ user().email }}</p>
    <div>Theme: {{ settings().theme }}</div>
  `
})
export class UserDetail {
  private route = inject(ActivatedRoute);
  private data = toSignal(this.route.data);
  user = computed(() => this.data().user as User);
  settings = computed(() => this.data().settings as Settings);
}
```

### Via `withComponentInputBinding` (Preferred)

Enable in `provideRouter`:

```ts
bootstrapApplication(App, {
  providers: [provideRouter(routes, withComponentInputBinding())]
});
```

Then declare inputs matching resolver keys:

```ts
@Component({
  template: `
    <h1>{{ user().name }}</h1>
    <div>Theme: {{ settings().theme }}</div>
  `
})
export class UserDetail {
  user = input.required<User>();
  settings = input.required<Settings>();
}
```

Better type safety, no need to inject `ActivatedRoute`.

---

## Error Handling in Resolvers

A resolver error causes a `NavigationError` and fails the navigation. Three strategies:

### 1. Centralized: `withNavigationErrorHandler`

```ts
bootstrapApplication(App, {
  providers: [
    provideRouter(routes, withNavigationErrorHandler((error) => {
      const router = inject(Router);
      console.error('Navigation error:', error.message);
      router.navigate(['/error']);
    }))
  ]
});
```

### 2. Subscribe to Router Events

```ts
this.router.events.pipe(
  filter((event): event is NavigationError => event instanceof NavigationError),
  map(event => { /* handle */ })
).subscribe();
```

### 3. Handle Directly in Resolver

```ts
export const userResolver: ResolveFn<User | RedirectCommand> = (route) => {
  const userStore = inject(UserStore);
  const router = inject(Router);
  const userId = route.paramMap.get('id')!;

  return userStore.getUser(userId).pipe(
    catchError(error => {
      console.error('Failed to load user:', error);
      return of(new RedirectCommand(router.parseUrl('/users')));
    })
  );
};
```

---

## Navigation Feedback During Resolution

Navigation is blocked while resolvers run. Show a loading indicator:

```ts
export class App {
  private router = inject(Router);
  isNavigating = computed(() => !!this.router.currentNavigation());
}
```

---

## Reading Parent Resolved Data in Child Resolvers

Resolvers run parent-first. Child resolvers can access parent's resolved data via `route.data`:

```ts
{
  path: 'users/:id',
  resolve: { user: userResolver },
  children: [
    {
      path: 'posts',
      component: UserPosts,
      resolve: {
        posts: (route: ActivatedRouteSnapshot) => {
          const postService = inject(PostService);
          const user = route.data['user'] as User; // from parent resolver
          return postService.getPostByUser(user.id);
        }
      }
    }
  ]
}
```

---

## Best Practices

- Keep resolvers lightweight — fetch only essential data
- Always handle errors gracefully
- Consider caching resolved data
- Show loading indicators since navigation blocks during resolution
- Set reasonable timeouts to avoid indefinite blocking
- Use TypeScript interfaces for resolved data types
