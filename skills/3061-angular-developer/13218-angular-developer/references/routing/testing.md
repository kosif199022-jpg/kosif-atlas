# Testing Routing and Navigation

Source: https://v20.angular.dev/guide/routing/testing

## Prerequisites

- **Jasmine** — testing framework (`describe`, `it`, `expect`)
- **Karma** — test runner
- **Angular Testing Utilities** — `TestBed`, `ComponentFixture`
- **`RouterTestingHarness`** — primary tool for testing routed components

---

## Testing Scenarios

### Route Parameters

```ts
// user-profile.component.spec.ts
describe('UserProfile', () => {
  it('should display user ID from route parameters', async () => {
    TestBed.configureTestingModule({
      imports: [UserProfile],
      providers: [provideRouter([{ path: 'user/:id', component: UserProfile }])]
    });

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/user/123', UserProfile);
    expect(harness.routeNativeElement?.textContent).toContain('User Profile: 123');
  });
});

// user-profile.component.ts
export class UserProfile {
  private route = inject(ActivatedRoute);
  userId: string | null = this.route.snapshot.paramMap.get('id');
}
```

---

### Route Guards

Mock the guard's dependencies; test both allowed and redirected cases:

```ts
describe('authGuard', () => {
  async function setup(isAuthenticated: boolean) {
    authStore = jasmine.createSpyObj('AuthStore', ['isAuthenticated']);
    authStore.isAuthenticated.and.returnValue(isAuthenticated);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: authStore },
        provideRouter([
          { path: 'protected', component: ProtectedComponent, canActivate: [authGuard] },
          { path: 'login', component: LoginComponent },
        ]),
      ],
    });
    harness = await RouterTestingHarness.create();
  }

  it('allows navigation when authenticated', async () => {
    await setup(true);
    await harness.navigateByUrl('/protected', ProtectedComponent);
    expect(harness.routeNativeElement?.textContent).toContain('Protected Page');
  });

  it('redirects to login when not authenticated', async () => {
    await setup(false);
    await harness.navigateByUrl('/protected', LoginComponent);
    expect(harness.routeNativeElement?.textContent).toContain('Login Page');
  });
});
```

---

### Router Outlets (Integration Tests)

```ts
describe('App Router Outlet', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', component: MockHome },
          { path: 'about', component: MockAbout }
        ])
      ]
    });
    harness = await RouterTestingHarness.create();
  });

  it('should display home for default route', async () => {
    await harness.navigateByUrl('');
    expect(harness.routeNativeElement?.textContent).toContain('Home Page');
  });

  it('should display about for /about', async () => {
    await harness.navigateByUrl('/about');
    expect(harness.routeNativeElement?.textContent).toContain('About Page');
  });
});
```

---

### Nested Routes

```ts
describe('Nested Routes', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [Parent, Child],
      providers: [
        provideRouter([
          {
            path: 'parent',
            component: Parent,
            children: [{ path: 'child', component: Child }]
          }
        ])
      ]
    });
    harness = await RouterTestingHarness.create();
  });

  it('should render parent and child for nested route', async () => {
    await harness.navigateByUrl('/parent/child');
    expect(harness.routeNativeElement?.textContent).toContain('Parent Component');
    expect(harness.routeNativeElement?.textContent).toContain('Child Component');
  });
});
```

---

### Query Parameters

```ts
describe('Search', () => {
  it('should read search term from query params', async () => {
    // setup...
    component = await harness.navigateByUrl('/search?q=angular', Search);
    expect(component.searchTerm()).toBe('angular');
  });
});
```

---

## Best Practices

1. **Use `RouterTestingHarness`** — cleaner API, direct component access, built-in navigation, better type safety. Not ideal for named outlets (use custom host components for those).
2. **Prefer real implementations** over mocks when feasible. Use fakes that approximate real behavior; mocks only as last resort.
3. **Test navigation state** — verify both the action and the result (URL changes + component rendering).
4. **Handle async** — router navigation is async; always use `async/await` or `fakeAsync`.
5. **Test error scenarios** — invalid routes, failed navigation, guard rejections.
6. **Do NOT mock Angular Router** — provide real route configs and use the harness. Mocks hide real breaking changes.
