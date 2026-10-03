# Unhandled Errors in Angular

Source: https://v20.angular.dev/best-practices/error-handling

**Core principle**: Errors should be surfaced to developers at the callsite whenever possible. Handle errors where the operation is initiated — that code has the context to understand, recover from, and communicate the error.

---

## ErrorHandler

Angular reports unhandled errors to the application's root `ErrorHandler`.

**When Angular catches errors for you:**
- When the framework calls your code (component constructors, lifecycle methods) — you can't reasonably add a `try` block here.

**When Angular does NOT catch errors:**
- When you call a service method directly — you are responsible (`try...catch`).

**Async errors forwarded to ErrorHandler:**
- `AsyncPipe` and `PendingTasks.run` — errors are forwarded to `ErrorHandler`
- `resource` — errors are presented in `.status` and `.error` properties (not forwarded)

### Custom ErrorHandler

```ts
export class GlobalErrorHandler implements ErrorHandler {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly router = inject(Router);

  handleError(error: any) {
    const url = this.router.url;
    const errorMessage = error?.message ?? 'unknown';
    this.analyticsService.trackEvent({
      eventName: 'exception',
      description: `Screen: ${url} | ${errorMessage}`,
    });
    console.error(GlobalErrorHandler.name, { error });
  }
}
```

Provide in `ApplicationConfig`:
```ts
bootstrapApplication(AppComponent, {
  providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }]
});
```

`ErrorHandler` is best used as a **last-resort** mechanism to report potentially fatal errors to logging/monitoring infrastructure — not as a substitute for proper in-context error handling.

### TestBed Rethrows Errors by Default

`TestBed` rethrows unexpected errors so they can't be silently missed in tests. To disable:

```ts
TestBed.configureTestingModule({ rethrowApplicationErrors: false })
```

---

## Global Error Listeners

Errors not caught by app code or the Angular framework may reach the global scope (causing process crashes in Node, or silent browser console errors).

### Client-Side Rendering

Add `provideBrowserGlobalErrorListeners()` to forward browser `'error'` and `'unhandledrejection'` events to `ErrorHandler`:

```ts
// Angular CLI generates this by default
bootstrapApplication(AppComponent, {
  providers: [provideBrowserGlobalErrorListeners()]
});
```

### Server-Side / Hybrid Rendering (SSR)

Angular automatically adds `'unhandledRejection'` and `'uncaughtException'` listeners to the server process to prevent crashes and log to console.

**Important with Zone.js**: Only `'unhandledRejection'` is added. When Zone.js is present, errors inside the Angular Zone are already forwarded to `ErrorHandler` and don't reach the server process.
