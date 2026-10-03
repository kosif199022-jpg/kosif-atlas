# Hydration

Source: https://v20.angular.dev/guide/hydration

## What is Hydration?

Hydration is the process that restores a server-side rendered application on the client. This includes:
- Reusing server-rendered DOM structures
- Persisting application state
- Transferring application data already retrieved on the server

## Why is Hydration Important?

Hydration improves performance by avoiding re-creation of DOM nodes. Angular matches existing DOM elements to the app structure at runtime and reuses them when possible. Benefits:

- Improves [Core Web Vitals (CWV)](https://web.dev/learn-core-web-vitals/): FID, LCP, CLS
- Improves SEO performance
- Prevents visible UI flicker caused by SSR apps that destroy and re-render the DOM

## Enabling Hydration

Hydration requires SSR to be enabled first. See the [Angular SSR Guide](guide/ssr).

### Using Angular CLI

If you used Angular CLI to enable SSR (`ng new --ssr` or `ng add @angular/ssr`), hydration code is already included.

### Manual Setup

```ts
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';

bootstrapApplication(AppComponent, {
  providers: [provideClientHydration()]
});
```

For NgModule-based apps:

```ts
@NgModule({
  providers: [provideClientHydration()],
})
export class AppModule {}
```

**IMPORTANT:** Ensure `provideClientHydration()` is also included in providers used to bootstrap on the **server**.

### Verifying Hydration is Enabled

In dev mode, open the browser console. You should see a message with hydration-related stats (number of components and nodes hydrated).

Use [Angular DevTools](tools/devtools) to see hydration status and overlay, and to highlight hydration mismatch errors.

## Capturing and Replaying Events

Before hydration completes, users may try to interact. Starting from v18, **Event Replay** captures and replays those events once hydration finishes:

```ts
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

bootstrapApplication(App, {
  providers: [
    provideClientHydration(withEventReplay())
  ]
});
```

### How Event Replay Works

Three phases:
1. **Capturing**: Captures and stores all user interactions prior to hydration
2. **Storing**: Event Contract keeps interactions in memory
3. **Relaunch**: Once hydration completes, Angular re-invokes captured events

Supports native browser events: `click`, `mouseover`, `focusin`, etc. Powered by [JSAction](https://github.com/angular/angular/tree/main/packages/core/primitives/event-dispatch#readme).

**NOTE:** If incremental hydration is enabled, event replay is automatically enabled.

## Constraints

- The app must generate the **same DOM structure** on both server and client — including whitespaces and Angular comment nodes
- The HTML produced by SSR **must not be altered** between server and client

**IMPORTANT:** If server and client DOM structures differ, hydration will fail with a mismatch error. Direct DOM manipulation is the most common culprit.

### Direct DOM Manipulation

Components that manipulate the DOM with native APIs (`document`, `innerHTML`, `outerHTML`, `appendChild`, detaching/moving nodes) will cause hydration errors. Angular expects a certain structure but finds a different one.

**Solutions:**
- Refactor to use Angular APIs
- Use `ngSkipHydration` attribute as a last resort

### Valid HTML Structure

Invalid HTML causes DOM mismatch errors. Common cases:
- `<table>` without `<tbody>` (browsers auto-add one, Angular doesn't — always declare it explicitly)
- `<div>` inside a `<p>`
- `<a>` inside another `<a>`

Use a [syntax validator](https://validator.w3.org/) to check your HTML.

### Preserve Whitespaces Configuration

Use the default `preserveWhitespaces: false`. If you enable `preserveWhitespaces: true`, ensure the value is **consistent** between `tsconfig.server.json` and `tsconfig.app.json`. Mismatched values break hydration.

### Custom or Noop Zone.js

Hydration relies on Zone.js's "stable" signal to trigger serialization/cleanup. Custom or noop Zone.js implementations may cause incorrect timing. Not fully supported.

## Errors

Most hydration errors are due to:
1. Direct DOM manipulation with native APIs
2. Invalid HTML structure

See the [Errors Reference Guide](/errors) for the full list.

## How to Skip Hydration for Particular Components

Use the `ngSkipHydration` attribute on a component's tag:

```html
<app-example ngSkipHydration />
```

Or as a host binding:

```ts
@Component({
  host: { ngSkipHydration: 'true' },
})
class ExampleComponent {}
```

`ngSkipHydration` forces Angular to skip hydrating the entire component and its children — it behaves as if hydration is not enabled (destroy and re-render).

**HELPFUL:** This fixes rendering issues but loses hydration benefits for the component. Treat it as a last resort — components that break hydration are bugs to be fixed.

**Do not** add `ngSkipHydration` to your root application component — it disables hydration for the entire application.

`ngSkipHydration` can only be used on **component host nodes**. Angular throws an error if added to other nodes.

## Hydration Timing and Application Stability

Hydration and post-hydration cleanup only occur once the app reports stability. Stability can be delayed by:
- Timeouts and intervals
- Unresolved promises
- Pending microtasks

If your app isn't hydrating, investigate what's blocking stability. Apps that don't stabilize within 10 seconds trigger the [Application remains unstable](errors/NG0506) error.

## i18n Support

By default, Angular skips hydration for components with i18n blocks. To enable:

```ts
import { provideClientHydration, withI18nSupport } from '@angular/platform-browser';

bootstrapApplication(AppComponent, {
  providers: [provideClientHydration(withI18nSupport())]
});
```

## Consistent Rendering Across Server and Client

Avoid `@if` blocks that render different content on server vs. client (e.g., using `isPlatformBrowser`). These differences cause layout shifts and hurt Core Web Vitals.

## Third-party Libraries and Scripts

- **Libraries with DOM manipulation** (e.g., D3): May cause DOM mismatch errors. Add `ngSkipHydration` to the component that uses them.
- **Third-party scripts** (ad trackers, analytics): May modify the DOM before hydration. Defer them until after hydration — use `AfterNextRender`.

## Incremental Hydration

An advanced form that gives more granular control over when hydration happens. See the [incremental hydration guide](guide/incremental-hydration).
