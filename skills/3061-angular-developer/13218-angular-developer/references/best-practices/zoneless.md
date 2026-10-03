# Angular Without ZoneJS (Zoneless)

Source: https://v20.angular.dev/guide/zoneless

---

## Why Use Zoneless?

| Benefit | Detail |
|---|---|
| **Improved performance** | ZoneJS triggers CD more than necessary — it doesn't know if state actually changed |
| **Improved Core Web Vitals** | ZoneJS adds payload size and startup time overhead |
| **Better debugging** | ZoneJS makes stack traces harder to read and root-cause analysis harder |
| **Better ecosystem compatibility** | ZoneJS patches browser APIs but can't patch everything (e.g. `async`/`await` must be downleveled). Removes a source of monkey-patching and ongoing maintenance. |

---

## Enabling Zoneless

```ts
// Standalone bootstrap
bootstrapApplication(MyApp, {
  providers: [provideZonelessChangeDetection()]
});

// NgModule bootstrap
@NgModule({
  providers: [provideZonelessChangeDetection()]
})
export class AppModule {}
```

---

## Removing ZoneJS from the Build

1. Remove `zone.js` and `zone.js/testing` from the `polyfills` option in `angular.json` (both `build` and `test` targets)
2. If using explicit `polyfills.ts`, remove:
   ```ts
   import 'zone.js';
   import 'zone.js/testing';
   ```
3. Uninstall the package:
   ```bash
   npm uninstall zone.js
   ```

---

## Requirements for Zoneless Compatibility

Angular needs notifications to know when and where to run change detection. Valid notification mechanisms:

- `ChangeDetectorRef.markForCheck()` (called automatically by `AsyncPipe`)
- `ComponentRef.setInput()`
- Updating a signal read in a template
- Bound host or template listener callbacks
- Attaching a view that was marked dirty by one of the above

### OnPush-Compatible Components

`ChangeDetectionStrategy.OnPush` is recommended (not required) for zoneless compatibility. Library components hosting user components (via `ViewContainerRef.createComponent`) may need to use `Default` strategy — they can still be compatible as long as they notify Angular when CD needs to run (signals, `markForCheck`, `AsyncPipe`, etc.).

### Remove These NgZone Observables

These **never emit** in a zoneless application:
- `NgZone.onMicrotaskEmpty`
- `NgZone.onUnstable`
- `NgZone.onStable`

`NgZone.isStable` will always be `true` — don't use as a condition.

**Replacements:**
- `NgZone.onMicrotaskEmpty` / `NgZone.onStable` → use `afterNextRender` (single CD) or `afterEveryRender` (multiple)
- For waiting for DOM state → use `MutationObserver` directly

### NgZone.run / NgZone.runOutsideAngular are Compatible

Do NOT remove these — they work fine in zoneless and removing them can cause performance regressions in libraries used by Zone.js apps.

---

## PendingTasks for SSR

Without ZoneJS, Angular can't automatically detect when the app is "stable" for SSR serialization. Use `PendingTasks` service:

```ts
// Simple: use run() method
const taskService = inject(PendingTasks);
taskService.run(async () => {
  const someResult = await doSomeWorkThatNeedsToBeRendered();
  this.someState.set(someResult);
});

// Complex: manual add/remove
const taskService = inject(PendingTasks);
const taskCleanup = taskService.add();
try {
  await doSomeWorkThatNeedsToBeRendered();
} catch {
  // handle error
} finally {
  taskCleanup();
}

// RxJS interop
readonly myObservableState = someObservable.pipe(pendingUntilEvent());
```

Angular internally uses `PendingTasks` to prevent serialization until Router navigation and `HttpClient` requests complete.

---

## Testing

```ts
TestBed.configureTestingModule({
  providers: [provideZonelessChangeDetection()]
});
const fixture = TestBed.createComponent(MyComponent);
await fixture.whenStable(); // Prefer over fixture.detectChanges()
```

**Prefer `await fixture.whenStable()`** over `fixture.detectChanges()` — the latter forces CD when Angular might not have scheduled it, which differs from production behavior.

`TestBed` enforces `OnPush` compatibility and throws `ExpressionChangedAfterItHasBeenCheckedError` if template values are updated without a change notification.

---

## Debug Mode: Verify Zoneless Compatibility

```ts
// Periodically checks for bindings updated without a notification
provideCheckNoChangesConfig({ exhaustive: true, interval: 1000 })
```

Throws `ExpressionChangedAfterItHasBeenCheckedError` if an updated binding would not be refreshed by zoneless CD.
