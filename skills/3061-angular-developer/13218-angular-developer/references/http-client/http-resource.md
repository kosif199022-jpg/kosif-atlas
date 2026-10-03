# HTTP Client – Reactive Data Fetching with `httpResource`

Source: https://v20.angular.dev/guide/http/http-resource

**IMPORTANT:** `httpResource` is **experimental**. It's ready to try, but may change before stable.

`httpResource` is a reactive wrapper around `HttpClient` that exposes request status and response as **signals**. It supports all `HttpClient` features including interceptors.

**Prerequisite:** Include `provideHttpClient()` in your application providers.

## Using httpResource

```ts
userId = input.required<string>();
user = httpResource(() => `/api/user/${userId()}`);
```

`httpResource` is **reactive** — when a signal dependency changes (like `userId`), it automatically cancels any pending request and issues a new one.

**Key difference from HttpClient:** `httpResource` initiates requests **eagerly** (immediately). `HttpClient` only initiates on Observable subscription.

### Advanced Request Object

```ts
user = httpResource(() => ({
  url: `/api/user/${userId()}`,
  method: 'GET',
  headers: { 'X-Special': 'true' },
  params: { 'fast': 'yes' },
  reportProgress: true,
  transferCache: true,
  keepalive: true,
  mode: 'cors',
  redirect: 'error',
  priority: 'high',
  cache: 'force-cache',
  credentials: 'include',
  referrer: 'no-referrer',
  integrity: 'sha384-...',
}));
```

**TIP:** Avoid using `httpResource` for mutations like `POST` or `PUT`. Use `HttpClient` APIs directly for those.

## Template Usage

```html
@if (user.hasValue()) {
  <user-details [user]="user.value()" />
} @else if (user.error()) {
  <div>Could not load user information</div>
} @else if (user.isLoading()) {
  <div>Loading user info...</div>
}
```

**HELPFUL:** Always guard `.value()` reads with `.hasValue()` — reading `value` in an error state throws at runtime.

## Response Types

By default, `httpResource` parses the response as JSON. Use alternate factory functions for other types:

```ts
httpResource.text(() => ({ ... }));        // returns string in value()
httpResource.blob(() => ({ ... }));        // returns Blob in value()
httpResource.arrayBuffer(() => ({ ... })); // returns ArrayBuffer in value()
```

## Response Parsing and Validation

Use the `parse` option to integrate schema validation (e.g., Zod, Valibot). The return type of `parse` determines the resource's value type:

```ts
const starWarsPersonSchema = z.object({
  name: z.string(),
  height: z.number({ coerce: true }),
  edited: z.string().datetime(),
  films: z.array(z.string()),
});

export class CharacterViewer {
  id = signal(1);
  swPersonResource = httpResource(
    () => `https://swapi.info/api/people/${this.id()}`,
    { parse: starWarsPersonSchema.parse }
  );
}
```

## Testing an httpResource

Since `httpResource` is built on `HttpClient`, use the same testing APIs:

```ts
TestBed.configureTestingModule({
  providers: [
    provideHttpClient(),
    provideHttpClientTesting(),
  ],
});

const id = signal(0);
const mockBackend = TestBed.inject(HttpTestingController);
const response = httpResource(() => `/data/${id()}`, {
  injector: TestBed.inject(Injector)
});

TestBed.tick(); // Triggers the effect
const firstRequest = mockBackend.expectOne('/data/0');
firstRequest.flush(0);

await TestBed.inject(ApplicationRef).whenStable();
expect(response.value()).toEqual(0);
```

See [HttpClient Testing](guide/http/testing) for full details.
