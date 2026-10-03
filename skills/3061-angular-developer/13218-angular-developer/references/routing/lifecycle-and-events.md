# Router Lifecycle and Events

Source: https://v20.angular.dev/guide/routing/lifecycle-and-events

Angular Router emits navigation events through `Router.events` (an Observable), letting you hook into each phase of the navigation lifecycle.

---

## Common Navigation Events (Chronological)

| Event | Description |
|-------|-------------|
| `NavigationStart` | Navigation begins; contains requested URL |
| `RoutesRecognized` | Router matched a route to the URL |
| `GuardsCheckStart` | Guard evaluation phase begins |
| `GuardsCheckEnd` | Guard evaluation complete (allowed/denied) |
| `ResolveStart` | Data resolvers start fetching |
| `ResolveEnd` | All resolver data available |
| `NavigationEnd` | Navigation succeeded; URL updated |
| `NavigationSkipped` | Navigation skipped (e.g. same URL) |

## Error Events

| Event | Description |
|-------|-------------|
| `NavigationCancel` | Guard returned `false`; navigation cancelled |
| `NavigationError` | Navigation failed (invalid route, resolver error, etc.) |

---

## Subscribing to Router Events

```ts
@Component({ ... })
export class RouterEventsComponent {
  private readonly router = inject(Router);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        console.log('Navigation starting:', event.url);
      }
      if (event instanceof NavigationEnd) {
        console.log('Navigation completed:', event.url);
      }
    });
  }
}
```

**Note:** `Event` from `@angular/router` is different from `RouterEvent` — don't confuse them.

---

## Debug Logging with `withDebugTracing`

Logs all router events to the console:

```ts
bootstrapApplication(AppComponent, {
  providers: [provideRouter(appRoutes, withDebugTracing())]
});
```

---

## Common Use Cases

### Loading Indicator

```ts
@Component({
  template: `@if (loading()) { <div class="loading-spinner">Loading...</div> }`
})
export class AppComponent {
  private router = inject(Router);
  readonly loading = toSignal(
    this.router.events.pipe(map(() => !!this.router.getCurrentNavigation())),
    { initialValue: false }
  );
}
```

### Analytics Tracking

```ts
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  startTracking() {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.analytics.trackPageView(event.url);
        }
      });
  }
}
```

### Error Handling

```ts
this.router.events.pipe(takeUntilDestroyed()).subscribe(event => {
  if (event instanceof NavigationStart) {
    this.errorMessage.set('');
  } else if (event instanceof NavigationError) {
    this.errorMessage.set('Failed to load page. Please try again.');
  } else if (event instanceof NavigationCancel) {
    if (event.code === NavigationCancellationCode.GuardRejected) {
      this.errorMessage.set('Access denied. Please check your permissions.');
    }
  }
});
```

---

## All Router Events Reference

### Navigation Events

| Event | Description |
|-------|-------------|
| `NavigationStart` | Navigation starts |
| `RouteConfigLoadStart` | Before lazy-loading a route config |
| `RouteConfigLoadEnd` | After lazy-loaded route config loads |
| `RoutesRecognized` | URL parsed and routes recognized |
| `GuardsCheckStart` | Start of guard phase |
| `GuardsCheckEnd` | End of guard phase |
| `ResolveStart` | Start of resolve phase |
| `ResolveEnd` | End of resolve phase |

### Activation Events

| Event | Description |
|-------|-------------|
| `ActivationStart` | Start of route activation |
| `ChildActivationStart` | Start of child route activation |
| `ActivationEnd` | End of route activation |
| `ChildActivationEnd` | End of child route activation |

### Navigation Completion Events (exactly one fires per navigation)

| Event | Description |
|-------|-------------|
| `NavigationEnd` | Navigation succeeded |
| `NavigationCancel` | Navigation cancelled (e.g. guard returned false) |
| `NavigationError` | Navigation failed due to unexpected error |
| `NavigationSkipped` | Navigation skipped (same URL) |

### Other Events

| Event | Description |
|-------|-------------|
| `Scroll` | Scrolling event |
