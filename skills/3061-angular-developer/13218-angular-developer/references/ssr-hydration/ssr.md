# Server and Hybrid Rendering

Source: https://v20.angular.dev/guide/ssr

Angular ships all applications as client-side rendered (CSR) by default. Many applications achieve significant performance improvements by integrating server-side rendering (SSR) into a hybrid rendering strategy.

## What is Hybrid Rendering?

Hybrid rendering lets developers leverage SSR, pre-rendering (SSG), and CSR together, with fine-grained control over how different parts of the app are rendered.

## Setting up Hybrid Rendering

New project with SSR:
```bash
ng new --ssr
```

Add SSR to an existing project:
```bash
ng add @angular/ssr
```

**NOTE:** By default, Angular prerenders your entire application and generates a server file. To disable this for a fully static app, set `outputMode` to `static`. To enable SSR, update server routes to use `RenderMode.Server`.

## Server Routing

### Configuring Server Routes

Create `app.routes.server.ts`:

```ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',            // "/" renders on the client (CSR)
    renderMode: RenderMode.Client,
  },
  {
    path: 'about',       // Static page, prerender it (SSG)
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'profile',     // Requires user-specific data, use SSR
    renderMode: RenderMode.Server,
  },
  {
    path: '**',          // All other routes render on the server (SSR)
    renderMode: RenderMode.Server,
  },
];
```

Register with `provideServerRendering` using `withRoutes`:

```ts
import { provideServerRendering, withRoutes } from '@angular/ssr';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
  ]
};
```

For App Shell pattern, use `withAppShell`:

```ts
provideServerRendering(
  withRoutes(serverRoutes),
  withAppShell(AppShellComponent),
)
```

### Rendering Modes

| Rendering Mode | Description |
|---|---|
| **Server (SSR)** | Renders on the server for each request; sends fully populated HTML. |
| **Client (CSR)** | Renders in the browser. Default Angular behavior. |
| **Prerender (SSG)** | Prerenders at build time, generating static HTML files. |

#### Client-side Rendering (CSR)
- Simplest development model; can use browser APIs freely
- Worse initial load performance — must download, parse, and execute JS first
- May negatively affect SEO (crawlers have JS execution limits)
- No server work beyond serving static JS assets
- Good for offline-capable apps with service workers

#### Server-side Rendering (SSR)
- Faster page loads — server sends fully rendered HTML
- Excellent SEO — crawlers receive fully rendered HTML
- Cannot depend strictly on browser APIs
- Increases server hosting costs (Angular runs per request)

#### Build-time Prerendering (SSG)
- Fastest page loads — server returns static HTML with no processing
- Requires all data to be available at build time
- Cannot include user-specific data
- Excellent SEO
- Minimal per-request overhead; easily cached by CDNs
- Can be deployed via CDN/static file server with no custom server runtime

### Setting Headers and Status Codes

```ts
export const serverRoutes: ServerRoute[] = [
  {
    path: 'profile',
    renderMode: RenderMode.Server,
    headers: { 'X-My-Custom-Header': 'some-value' },
    status: 201,
  },
];
```

### Redirects

- **SSR:** Uses standard HTTP redirects (301, 302)
- **SSG:** Uses `<meta http-equiv="refresh">` soft redirects

### Customizing Build-time Prerendering (SSG)

#### Parameterized Routes

```ts
export const serverRoutes: ServerRoute[] = [
  {
    path: 'post/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const dataService = inject(PostService);
      const ids = await dataService.getIds(); // e.g. ['1', '2', '3']
      return ids.map(id => ({ id })); // Generates: /post/1, /post/2, /post/3
    },
  },
  {
    path: 'post/:id/**',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return [
        { id: '1', '**': 'foo/3' },
        { id: '2', '**': 'bar/4' },
      ]; // Generates: /post/1/foo/3, /post/2/bar/4
    },
  },
];
```

**IMPORTANT:** `inject()` inside `getPrerenderParams` must be used synchronously — cannot be called in async callbacks or after `await`.

#### Fallback Strategies

When a prerendered path is not found:

- **Server** (default): Falls back to SSR
- **Client**: Falls back to CSR
- **None**: No fallback — Angular does not handle requests for non-prerendered paths

```ts
{
  path: 'post/:id',
  renderMode: RenderMode.Prerender,
  fallback: PrerenderFallback.Client,
  async getPrerenderParams() {
    return [{ id: 1 }, { id: 2 }, { id: 3 }];
    // /post/4 will use the fallback strategy
  },
}
```

## Authoring Server-compatible Components

Avoid browser APIs (`window`, `document`, `navigator`, `location`, `HTMLElement` properties) on the server. Use `afterEveryRender` or `afterNextRender` hooks — they only execute in the browser:

```ts
@Component({ selector: 'my-cmp', template: `<span #content>{{ ... }}</span>` })
export class MyComponent {
  contentRef = viewChild.required<ElementRef>('content');

  constructor() {
    afterNextRender(() => {
      // Safe — only runs in the browser
      console.log('height: ' + this.contentRef().nativeElement.scrollHeight);
    });
  }
}
```

## Setting Providers on the Server

Top-level provider values are set once when app code is first evaluated — they persist across requests. For per-request values, use factory providers:

```ts
// useValue persists across requests
{ provide: MY_TOKEN, useValue: 'static' }

// useFactory runs per request
{ provide: MY_TOKEN, useFactory: () => computeValue() }
```

## Accessing Document via DI

Use the `DOCUMENT` token instead of referencing `document` directly:

```ts
import { Injectable, inject, DOCUMENT } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CanonicalLinkService {
  private readonly document = inject(DOCUMENT);

  setCanonical(href: string): void {
    const link = this.document.createElement('link');
    link.rel = 'canonical';
    link.href = href;
    this.document.head.appendChild(link);
  }
}
```

## Accessing Request and Response via DI

Available tokens from `@angular/core` during SSR:

- **`REQUEST`**: Access to the current request (`Request` from Web API — headers, cookies, etc.)
- **`RESPONSE_INIT`**: Access to response initialization options (`ResponseInit` — set headers and status code dynamically)
- **`REQUEST_CONTEXT`**: Additional context related to the current request, passed as the second parameter of `handle`

```ts
import { inject, REQUEST } from '@angular/core';

export class MyComponent {
  constructor() {
    const request = inject(REQUEST);
    console.log(request?.url);
  }
}
```

**IMPORTANT:** These tokens are `null` during: build processes, CSR, SSG, and route extraction in dev.

## Generate a Fully Static Application

Set `outputMode` to `static` in `angular.json` to skip generating a server file (no Node.js server needed):

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "outputMode": "static"
          }
        }
      }
    }
  }
}
```

## Caching Data when using HttpClient

`HttpClient` caches outgoing network requests when running on the server. The cache is serialized and transferred to the browser in the initial HTML. On the client, `HttpClient` reuses cached data instead of re-fetching during initial rendering. Caching stops once the app becomes stable.

### Configuring Cache Options

```ts
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';

bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration(
      withHttpTransferCacheOptions({
        includeHeaders: ['ETag', 'Cache-Control'],
        filter: (req) => !req.url.includes('/api/profile'),
        includePostRequests: true,
        includeRequestsWithAuthHeaders: false,
      }),
    ),
  ],
});
```

| Option | Description |
|---|---|
| `includeHeaders` | Which headers from server response to include in cached entries (none by default). Avoid sensitive headers. |
| `includePostRequests` | Cache `POST` requests (only when idempotent, e.g., GraphQL queries). Default: false. |
| `includeRequestsWithAuthHeaders` | Cache requests with auth headers (excluded by default to prevent user-specific data leaks). |
| `filter` | Function to selectively exclude specific requests from caching. |

#### Per-request Overrides

```ts
http.get('/api/profile', { transferCache: { includeHeaders: ['CustomHeader'] } });
```

### Disabling Caching

Globally:
```ts
provideClientHydration(withNoHttpTransferCache())
```

Per request:
```ts
httpClient.get('/api/sensitive-data', { transferCache: false });
```

**NOTE:** If the app uses different HTTP origins on server vs. client, use `HTTP_TRANSFER_CACHE_ORIGIN_MAP` token to establish origin mapping.

## Configuring a Server

### Node.js

```ts
// server.ts
import { AngularNodeAppEngine, createNodeRequestHandler, writeResponseToNodeResponse } from '@angular/ssr/node';
import express from 'express';

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use('*', (req, res, next) => {
  angularApp
    .handle(req)
    .then(response => {
      if (response) {
        writeResponseToNodeResponse(response, res);
      } else {
        next();
      }
    })
    .catch(next);
});

export const reqHandler = createNodeRequestHandler(app);
```

### Non-Node.js (Web API standard)

```ts
// server.ts
import { AngularAppEngine, createRequestHandler } from '@angular/ssr';

const angularApp = new AngularAppEngine();

export const reqHandler = createRequestHandler(async (req: Request) => {
  const res: Response | null = await angularApp.render(req);
  // ...
});
```
