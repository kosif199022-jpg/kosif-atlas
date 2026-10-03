# HTTP Client – Testing

Source: https://v20.angular.dev/guide/http/testing

The `@angular/common/http/testing` library provides tools to capture HTTP requests made by the application, assert on them, and mock responses to emulate backend behavior.

**Pattern:** App executes code and makes requests first → test asserts expected requests were made → test provides mock responses by "flushing" requests → test verifies no unexpected requests remain.

## Setup for Testing

Configure `TestBed` with both `provideHttpClient()` and `provideHttpClientTesting()`:

```ts
TestBed.configureTestingModule({
  providers: [
    provideHttpClient(),         // MUST come before provideHttpClientTesting()
    provideHttpClientTesting(),
  ],
});

const httpTesting = TestBed.inject(HttpTestingController);
```

**IMPORTANT:** `provideHttpClient()` must be listed **before** `provideHttpClientTesting()`. The testing provider overwrites parts of the http provider — wrong order can break tests.

## Expecting and Answering Requests

```ts
TestBed.configureTestingModule({
  providers: [
    ConfigService,
    provideHttpClient(),
    provideHttpClientTesting(),
  ],
});

const httpTesting = TestBed.inject(HttpTestingController);
const service = TestBed.inject(ConfigService);
const config$ = service.getConfig<Config>();
const configPromise = firstValueFrom(config$);

// Assert request was made
const req = httpTesting.expectOne('/api/config', 'Request to load the configuration');
expect(req.request.method).toBe('GET');

// Flush (provide mock response)
req.flush(DEFAULT_CONFIG);

// Assert response was delivered
expect(await configPromise).toEqual(DEFAULT_CONFIG);

// Assert no extra requests
httpTesting.verify();
```

**NOTE:** `expectOne` fails if more than one request matches the criteria.

### Matching by Method and URL

```ts
const req = httpTesting.expectOne({
  method: 'GET',
  url: '/api/config',
}, 'Request to load the configuration');
```

**HELPFUL:** Expectation APIs match against the **full URL** including query parameters.

### Running `verify()` in afterEach

```ts
afterEach(() => {
  TestBed.inject(HttpTestingController).verify();
});
```

## Handling Multiple Requests at Once

Use `match()` instead of `expectOne()` to handle duplicate requests. Returns an array; you're responsible for flushing and verifying:

```ts
const allGetRequests = httpTesting.match({ method: 'GET' });
for (const req of allGetRequests) {
  // Handle responding to each request
}
```

## Advanced Matching

All matching functions accept a predicate function:

```ts
// Match requests with a body
const requestsWithBody = httpTesting.expectOne(req => req.body !== null);

// Assert no mutation requests were made
httpTesting.expectNone(req => req.method !== 'GET');
```

## Testing Error Handling

### Backend Errors

Flush with an error response:

```ts
const req = httpTesting.expectOne('/api/config');
req.flush('Failed!', { status: 500, statusText: 'Internal Server Error' });
// Then assert your app handled the error correctly
```

### Network Errors

Deliver via the `error()` method:

```ts
const req = httpTesting.expectOne('/api/config');
req.error(new ProgressEvent('network error!'));
// Then assert your app handled the error correctly
```

## Testing an Interceptor

### Functional Interceptors

Use `withInterceptors` in the `TestBed` configuration:

```ts
TestBed.configureTestingModule({
  providers: [
    AuthService,
    provideHttpClient(withInterceptors([authInterceptor])),
    provideHttpClientTesting(),
  ],
});

const service = TestBed.inject(AuthService);
const req = httpTesting.expectOne('/api/config');
expect(req.request.headers.get('X-Authentication-Token')).toEqual(service.getAuthToken());
```

### Class-based Interceptors

Use `withInterceptorsFromDi()` and `HTTP_INTERCEPTORS`:

```ts
TestBed.configureTestingModule({
  providers: [
    AuthService,
    provideHttpClient(withInterceptorsFromDi()),
    provideHttpClientTesting(),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
});
```
