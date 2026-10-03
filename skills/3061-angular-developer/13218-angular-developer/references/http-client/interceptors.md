# HTTP Client – Interceptors

Source: https://v20.angular.dev/guide/http/interceptors

`HttpClient` supports a form of middleware known as **interceptors** — middleware that abstracts common patterns like retrying, caching, logging, and authentication away from individual requests.

`HttpClient` supports two kinds of interceptors: **functional** (recommended) and **DI-based**.

## Defining a Functional Interceptor

An interceptor is a function that receives the outgoing `HttpRequest` and a `next` function representing the next step in the interceptor chain:

```ts
export function loggingInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  console.log(req.url);
  return next(req);
}
```

## Configuring Interceptors

Register interceptors using `withInterceptors` when calling `provideHttpClient`. Interceptors are chained in the order listed:

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withInterceptors([loggingInterceptor, cachingInterceptor]),
    )
  ]
});
```

## Intercepting Response Events

Transform the `Observable` stream returned by `next` to access or manipulate the response:

```ts
export function loggingInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  return next(req).pipe(
    tap(event => {
      if (event.type === HttpEventType.Response) {
        console.log(req.url, 'returned a response with status', event.status);
      }
    })
  );
}
```

## Modifying Requests

`HttpRequest` and `HttpResponse` instances are **immutable**. Use `.clone()` to apply mutations:

```ts
const reqWithHeader = req.clone({
  headers: req.headers.set('X-New-Header', 'new header value'),
});
```

**CRITICAL:** The body of a request or response is **not** protected from deep mutations. Handle accordingly when an interceptor may run multiple times.

## Dependency Injection in Interceptors

Interceptors run in the injection context of the injector that registered them. Use `inject()`:

```ts
export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authToken = inject(AuthService).getAuthToken();
  const newReq = req.clone({
    headers: req.headers.append('X-Authentication-Token', authToken),
  });
  return next(newReq);
}
```

## Request and Response Metadata (HttpContext)

`HttpRequest` has a `.context` property (an `HttpContext` instance) for passing metadata to interceptors that isn't sent to the backend.

### Defining Context Tokens

```ts
export const CACHING_ENABLED = new HttpContextToken<boolean>(() => true);
```

The factory function creates the default value. Using a function ensures objects/arrays get unique instances per request.

### Reading a Token in an Interceptor

```ts
export function cachingInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  if (req.context.get(CACHING_ENABLED)) {
    // apply caching logic
    return ...;
  } else {
    return next(req);
  }
}
```

### Setting Context Tokens on a Request

```ts
const data$ = http.get('/sensitive/data', {
  context: new HttpContext().set(CACHING_ENABLED, false),
});
```

### The Request Context is Mutable

Unlike other `HttpRequest` properties, `HttpContext` **is mutable**. Interceptors can change context and those changes persist across retries.

## Synthetic Responses

Interceptors can construct responses without calling `next`, e.g., from a cache:

```ts
const resp = new HttpResponse({
  body: 'response body',
});
```

## Working with Redirect Information (Fetch backend only)

When using `withFetch()`, responses include a `redirected` property:

```ts
export function redirectTrackingInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  return next(req).pipe(
    tap(event => {
      if (event.type === HttpEventType.Response && event.redirected) {
        console.log('Request to', req.url, 'was redirected to', event.url);
      }
    })
  );
}
```

## DI-based Interceptors (Legacy)

Implement `HttpInterceptor` interface:

```ts
@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, handler: HttpHandler): Observable<HttpEvent<any>> {
    console.log('Request URL: ' + req.url);
    return handler.handle(req);
  }
}
```

Configure via DI multi-provider:

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withInterceptorsFromDi(), // Must explicitly enable DI-based interceptors
    ),
    { provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true },
  ]
});
```

**Note:** DI-based interceptors run in provider registration order, which can be unpredictable in complex DI configurations. Prefer functional interceptors.

## Common Use Cases for Interceptors

- Adding authentication headers to outgoing requests
- Retrying failed requests with exponential backoff
- Caching responses
- Customizing response parsing
- Measuring and logging server response times
- Driving loading spinners
- Collecting and batching requests
- Automatically failing requests after a timeout
- Polling the server and refreshing results
