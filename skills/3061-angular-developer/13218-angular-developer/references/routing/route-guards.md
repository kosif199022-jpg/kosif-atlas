# Route Guards

Source: https://v20.angular.dev/guide/routing/route-guards

> **CRITICAL:** Never rely solely on client-side guards for access control. Always enforce authorization server-side — any JS running in the browser can be modified by the user.

Route guards are functions that control whether a user can navigate to or away from a route. Common uses: authentication, role-based access, unsaved-changes warnings.

## Creating a Guard

```bash
ng generate guard CUSTOM_NAME
```

This creates `CUSTOM_NAME-guard.ts` and prompts for the guard type.

---

## Return Types (All Guards)

| Return Type | Behavior |
|-------------|---------|
| `boolean` | `true` allows navigation; `false` blocks it (except `CanMatch`) |
| `UrlTree` or `RedirectCommand` | Redirects to another route |
| `Promise<T>` or `Observable<T>` | Router uses first emitted value then unsubscribes |

Note: `CanMatch` returning `false` causes Angular to try other matching routes instead of blocking navigation entirely.

---

## Guard Types

### CanActivate

Controls access to a route. Most common for auth:

```ts
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  return authService.isAuthenticated();
};
```

**Tip:** Return a `URLTree` or `RedirectCommand` to redirect — don't return `false` and call `navigate()`.

### CanActivateChild

Runs for ALL children of a parent route (including grandchildren):

```ts
export const adminChildGuard: CanActivateChildFn = (
  childRoute: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  return inject(AuthService).hasRole('admin');
};
```

### CanDeactivate

Prevents navigation away from a route — useful for unsaved forms:

```ts
export const unsavedChangesGuard: CanDeactivateFn<FormComponent> = (
  component: FormComponent,
  currentRoute: ActivatedRouteSnapshot,
  currentState: RouterStateSnapshot,
  nextState: RouterStateSnapshot
) => {
  return component.hasUnsavedChanges()
    ? confirm('You have unsaved changes. Are you sure you want to leave?')
    : true;
};
```

### CanMatch

Controls whether a route can be matched at all. When `false`, Angular tries the next matching route instead of blocking. Useful for feature flags, A/B testing, and serving different components for the same path:

```ts
export const featureToggleGuard: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  return inject(FeatureService).isFeatureEnabled('newDashboard');
};

// Same path, different components based on guard:
const routes: Routes = [
  { path: 'dashboard', component: AdminDashboard, canMatch: [adminGuard] },
  { path: 'dashboard', component: UserDashboard, canMatch: [userGuard] }
];
```

---

## Applying Guards to Routes

Guards are arrays; they run **in order**:

```ts
const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
    canDeactivate: [canDeactivateGuard]
  },
  {
    path: 'users',
    canActivateChild: [authGuard],
    children: [
      { path: 'list', component: UserListComponent },
      { path: 'detail/:id', component: UserDetailComponent }
    ]
  },
  {
    path: 'beta-feature',
    component: BetaFeatureComponent,
    canMatch: [featureToggleGuard]
  },
  {
    path: 'beta-feature',
    component: ComingSoonComponent
    // fallback if featureToggleGuard returns false
  }
];
```
