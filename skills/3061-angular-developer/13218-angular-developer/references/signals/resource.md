# Angular Signals — `resource` (Async Reactivity)

> Source: https://v20.angular.dev/guide/signals/resource

> **Status:** Experimental — API may change before stable.

---

## The Problem

Most signal APIs are synchronous — `signal()`, `computed()`, `input()`, etc. `resource` integrates async data (e.g., HTTP fetches) into your signal-based code. The most common use case is fetching data from a server reactively based on signal state.

---

## Basic Usage

```ts
import { resource, Signal } from '@angular/core';

const userId: Signal<string> = getUserId();

const userResource = resource({
  // Reactive computation — recomputes whenever any read signals change
  params: () => ({ id: userId() }),
  // Async loader — called every time params produces a new value
  loader: ({ params }) => fetchUser(params),
});

// Use the result in a computed signal
const firstName = computed(() => {
  if (userResource.hasValue()) {
    // hasValue() is a type guard — strips `undefined` from the type
    // and protects against reading value() when resource is in error state
    return userResource.value().firstName;
  }
  return undefined;
});
```

### `params`

A reactive computation (like `computed`). Whenever signals read here change, the resource produces a new params value and re-runs the loader. If `params` returns `undefined`, the loader does not run and status becomes `'idle'`.

### `loader`

An async function (`ResourceLoader`) that receives a `ResourceLoaderParams` object and returns a `Promise`.

---

## Resource Loaders

### `ResourceLoaderParams` properties

| Property | Description |
|---|---|
| `params` | Current value of the `params` computation |
| `previous` | Object with a `status` property containing the previous `ResourceStatus` |
| `abortSignal` | An `AbortSignal` to cancel in-flight requests |

---

## Aborting Requests

A resource automatically aborts an outstanding request when `params` changes while loading. Use `abortSignal` to hook into this:

```ts
const userResource = resource({
  params: () => ({ id: userId() }),
  loader: ({ params, abortSignal }): Promise<User> => {
    // fetch cancels the HTTP request when the AbortSignal fires
    return fetch(`users/${params.id}`, { signal: abortSignal });
  },
});
```

See [AbortSignal on MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) for details.

---

## Programmatic Reload

Trigger the loader manually without changing `params`:

```ts
userResource.reload();
```

While reloading, the resource keeps the previous `value()` available (status becomes `'reloading'`).

---

## Resource Status

### Status signal properties

| Property | Type | Description |
|---|---|---|
| `value` | `Signal<T \| undefined>` | Most recent loaded value, or `undefined` |
| `hasValue` | `() => boolean` | Whether the resource has a value (also a type guard) |
| `error` | `Signal<unknown \| undefined>` | Most recent loader error, or `undefined` |
| `isLoading` | `Signal<boolean>` | `true` while the loader is running |
| `status` | `Signal<ResourceStatus>` | Specific status string constant (see below) |

### `ResourceStatus` values

| Status | `value()` | When |
|---|---|---|
| `'idle'` | `undefined` | `params` returned `undefined`; loader never ran |
| `'error'` | `undefined` | Loader threw an error |
| `'loading'` | `undefined` | Loader running due to `params` change |
| `'reloading'` | Previous value | Loader running due to `.reload()` call |
| `'resolved'` | Resolved value | Loader completed successfully |
| `'local'` | Locally set value | Value was set via `.set()` or `.update()` |

Use these for conditional UI — loading spinners, error messages, skeleton states:

```ts
@Component({
  template: `
    @if (userResource.isLoading()) {
      <spinner />
    } @else if (userResource.status() === 'error') {
      <p>Error: {{ userResource.error() }}</p>
    } @else if (userResource.hasValue()) {
      <p>{{ userResource.value().name }}</p>
    }
  `
})
export class UserProfile {
  userId = input.required<string>();
  userResource = resource({
    params: () => ({ id: this.userId() }),
    loader: ({ params }) => fetchUser(params),
  });
}
```

---

## `httpResource` — HTTP-Specific Wrapper

`httpResource` wraps `HttpClient` and exposes request status + response as signals. Requests go through Angular's full HTTP interceptor chain.

```ts
import { httpResource } from '@angular/common/http';

// Returns a Resource<User> using Angular's HTTP stack (including interceptors)
const userResource = httpResource<User>(() => `users/${userId()}`);
```

Use `httpResource` when you need interceptors, auth headers, or other Angular HTTP features. Use plain `resource` for non-HTTP async operations.
