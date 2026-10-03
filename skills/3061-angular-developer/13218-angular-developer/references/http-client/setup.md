# HTTP Client – Setting up HttpClient

Source: https://v20.angular.dev/guide/http/setup

Before you can use `HttpClient` in your app, you must configure it using dependency injection.

## Providing HttpClient through Dependency Injection

`HttpClient` is provided using the `provideHttpClient` helper function, which most apps include in the application `providers` in `app.config.ts`.

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
  ]
};
```

For NgModule-based bootstrap:

```ts
@NgModule({
  providers: [
    provideHttpClient(),
  ],
})
export class AppModule {}
```

Inject `HttpClient` as a dependency:

```ts
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);
}
```

## Configuring Features of HttpClient

`provideHttpClient` accepts optional feature configurations:

### `withFetch()`

Switches the client to use the `fetch` API instead of `XMLHttpRequest`. More modern, available in more environments, but does **not** produce upload progress events.

```ts
provideHttpClient(withFetch())
```

### `withInterceptors(...)`

Configures the set of functional interceptor functions. See the interceptor guide for details.

### `withInterceptorsFromDi()`

Includes older class-based interceptors configured via DI. Functional interceptors (via `withInterceptors`) are preferred for more predictable ordering.

### `withRequestsMadeViaParent()`

Configures `HttpClient` to pass requests up to the parent injector's `HttpClient` instance after they pass through local interceptors. Useful for adding interceptors in a child injector while still going through parent interceptors.

**CRITICAL:** Requires an `HttpClient` configured in a parent injector or a runtime error will occur.

### `withJsonpSupport()`

Enables the `.jsonp()` method for cross-domain loading via the JSONP convention. Prefer CORS when possible.

### `withXsrfConfiguration(...)`

Customizes `HttpClient`'s built-in XSRF security functionality.

### `withNoXsrfProtection()`

Disables `HttpClient`'s built-in XSRF security functionality.

## HttpClientModule-based Configuration (Legacy NgModule API)

| NgModule | `provideHttpClient()` equivalent |
|---|---|
| `HttpClientModule` | `provideHttpClient(withInterceptorsFromDi())` |
| `HttpClientJsonpModule` | `withJsonpSupport()` |
| `HttpClientXsrfModule.withOptions(...)` | `withXsrfConfiguration(...)` |
| `HttpClientXsrfModule.disable()` | `withNoXsrfProtection()` |

**Caution:** When `HttpClientModule` is present in multiple injectors, interceptor behavior is poorly defined. Prefer `provideHttpClient` for multi-injector configurations.
