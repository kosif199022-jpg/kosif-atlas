# HTTP Client – Making Requests

Source: https://v20.angular.dev/guide/http/making-requests

`HttpClient` has methods corresponding to different HTTP verbs. Each returns an RxJS `Observable` which, when subscribed, sends the request and emits results.

**NOTE:** Each subscription to an `HttpClient` Observable makes a new backend request.

## Fetching JSON Data

```ts
http.get<Config>('/api/config').subscribe(config => {
  // process the configuration.
});
```

The generic type is a **type assertion** — `HttpClient` does not verify the actual return data matches the type.

**TIP:** Use `unknown` instead of `Object` for uncertain data structures.

## Fetching Other Types of Data

Use the `responseType` option:

| `responseType` value | Returned response type |
|---|---|
| `'json'` (default) | JSON data of the given generic type |
| `'text'` | string data |
| `'arraybuffer'` | `ArrayBuffer` containing raw response bytes |
| `'blob'` | `Blob` instance |

```ts
http.get('/images/dog.jpg', { responseType: 'arraybuffer' }).subscribe(buffer => {
  console.log('The image is ' + buffer.byteLength + ' bytes large');
});
```

**IMPORTANT:** `responseType` must be a **literal type**, not a `string` type. If extracted to a variable, use `responseType: 'text' as const`.

## Mutating Server State

```ts
http.post<Config>('/api/config', newConfig).subscribe(config => {
  console.log('Updated config:', config);
});
```

Body serialization by type:

| `body` type | Serialized as |
|---|---|
| string | Plain text |
| number, boolean, array, or plain object | JSON |
| `ArrayBuffer` | Raw data from the buffer |
| `Blob` | Raw data with the Blob's content type |
| `FormData` | `multipart/form-data` encoded data |
| `HttpParams` or `URLSearchParams` | `application/x-www-form-urlencoded` |

**IMPORTANT:** Remember to `.subscribe()` to mutation request Observables to actually fire the request.

## Setting URL Parameters

```ts
http.get('/api/config', {
  params: { filter: 'all' },
}).subscribe(config => { ... });
```

For more control, use `HttpParams` (immutable — mutation methods return new instances):

```ts
const baseParams = new HttpParams().set('filter', 'all');
http.get('/api/config', {
  params: baseParams.set('details', 'enabled'),
}).subscribe(config => { ... });
```

### Custom Parameter Encoding

Implement `HttpParameterCodec` to customize encoding/decoding:

```ts
export class CustomHttpParamEncoder implements HttpParameterCodec {
  encodeKey(key: string): string { return encodeURIComponent(key); }
  encodeValue(value: string): string { return encodeURIComponent(value); }
  decodeKey(key: string): string { return decodeURIComponent(key); }
  decodeValue(value: string): string { return decodeURIComponent(value); }
}

const params = new HttpParams({ encoder: new CustomHttpParamEncoder() })
  .set('email', 'dev+alerts@example.com');
```

## Setting Request Headers

```ts
http.get('/api/config', {
  headers: { 'X-Debug-Level': 'verbose' }
}).subscribe(config => { ... });
```

Or with `HttpHeaders` (immutable):

```ts
const baseHeaders = new HttpHeaders().set('X-Debug-Level', 'minimal');
http.get<Config>('/api/config', {
  headers: baseHeaders.set('X-Debug-Level', 'verbose'),
}).subscribe(config => { ... });
```

## Interacting with the Server Response Events

To access the full response (status, headers, body), set `observe: 'response'`:

```ts
http.get<Config>('/api/config', { observe: 'response' }).subscribe(res => {
  console.log('Response status:', res.status);
  console.log('Body:', res.body);
});
```

**IMPORTANT:** `observe` must be a literal type (use `observe: 'response' as const` if extracted).

## Receiving Raw Progress Events

Set `observe: 'events'` and `reportProgress: true`:

```ts
http.post('/api/upload', myData, {
  reportProgress: true,
  observe: 'events',
}).subscribe(event => {
  switch (event.type) {
    case HttpEventType.UploadProgress:
      console.log('Uploaded ' + event.loaded + ' out of ' + event.total + ' bytes');
      break;
    case HttpEventType.Response:
      console.log('Finished uploading!');
      break;
  }
});
```

**NOTE:** The `fetch` implementation does not report upload progress events.

| `type` value | Event meaning |
|---|---|
| `HttpEventType.Sent` | Request dispatched to the server |
| `HttpEventType.UploadProgress` | Upload progress event |
| `HttpEventType.ResponseHeader` | Response head received (status + headers) |
| `HttpEventType.DownloadProgress` | Download progress event |
| `HttpEventType.Response` | Entire response received |
| `HttpEventType.User` | Custom event from an interceptor |

## Handling Request Failure

Three ways a request can fail:
- Network/connection error (status `0`, error is `ProgressEvent`)
- Timeout (status `0`)
- Backend error response (non-2xx status code)

All captured in `HttpErrorResponse` via the Observable's error channel.

Use RxJS `catchError` to transform error responses, and `retry()` to retry transient errors.

### Timeouts

```ts
http.get('/api/config', { timeout: 3000 }).subscribe({
  next: config => { ... },
  error: err => { /* timeout or other error */ }
});
```

**NOTE:** Timeout applies to the backend HTTP request only, not the entire interceptor chain.

## Advanced Fetch Options (requires `withFetch()`)

### Keep-alive Connections

```ts
http.post('/api/analytics', analyticsData, { keepalive: true }).subscribe();
```

### HTTP Caching Control

```ts
http.get('/api/config', { cache: 'force-cache' }).subscribe(config => { ... });
http.get('/api/live-data', { cache: 'no-cache' }).subscribe(data => { ... });
http.get('/api/static-data', { cache: 'only-if-cached' }).subscribe(data => { ... });
```

### Request Priority (Core Web Vitals)

```ts
http.get('/api/user-profile', { priority: 'high' }).subscribe(profile => { ... });
http.get('/api/recommendations', { priority: 'low' }).subscribe(recs => { ... });
```

Priority values: `'high'`, `'low'`, `'auto'` (default).

### Request Mode

```ts
http.get('/api/local-data', { mode: 'same-origin' }).subscribe(...);
http.get('https://api.external.com/data', { mode: 'cors' }).subscribe(...);
```

Mode values: `'same-origin'`, `'cors'` (default), `'no-cors'`.

### Redirect Handling

```ts
http.get('/api/resource', { redirect: 'follow' }).subscribe(...);   // default
http.get('/api/resource', { redirect: 'manual' }).subscribe(...);
http.get('/api/resource', { redirect: 'error' }).subscribe(...);
```

### Credentials Handling

```ts
http.get('https://api.example.com/protected-data', { credentials: 'include' }).subscribe(...);
http.get('/api/user-data', { credentials: 'same-origin' }).subscribe(...);
```

Credentials values: `'omit'`, `'same-origin'` (default for cross-origin), `'include'`.

**IMPORTANT:** `withCredentials: true` takes precedence over the `credentials` option and forces `credentials: 'include'`.

### Referrer

```ts
http.get('/api/data', { referrer: 'https://example.com/page' }).subscribe(...);
http.get('/api/sensitive', { referrer: '' }).subscribe(...);  // no referrer
```

### Integrity (Subresource Integrity)

```ts
http.get('/api/script.js', {
  integrity: 'sha256-ABC123...',
  responseType: 'text'
}).subscribe(script => { ... });
```

## Http Observables

- `HttpClient` produces **cold** Observables — no request happens until subscribed.
- Subscribing multiple times triggers multiple backend requests.
- Unsubscribing aborts the in-progress request.
- Observables usually complete once the response returns.

**TIP:** Use `async` pipe or `toSignal` to ensure subscriptions are disposed properly.

## Best Practices

Encapsulate HTTP logic in injectable services:

```ts
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`/api/user/${id}`);
  }
}
```

In components, use `@if` with `async` pipe or signals:

```ts
@Component({
  imports: [AsyncPipe],
  template: `
    @if (user$ | async; as user) {
      <p>Name: {{ user.name }}</p>
    }
  `,
})
export class UserProfileComponent {
  userId = input.required<string>();
  user$!: Observable<User>;
  private userService = inject(UserService);

  constructor(): void {
    effect(() => {
      this.user$ = this.userService.getUser(this.userId());
    });
  }
}
```
