# Defining Dependency Providers

Source: https://v20.angular.dev/guide/di/defining-dependency-providers

## Two Ways to Provide

1. **Automatic provision** — `providedIn` in `@Injectable`, or factory in `InjectionToken` config
2. **Manual provision** — `providers` array in components, directives, routes, or application config

## InjectionToken — For Non-Class Dependencies

`InjectionToken` provides a unique identifier for any type of value (not just classes):

```ts
import { InjectionToken } from '@angular/core';

export const API_URL = new InjectionToken<string>('api.url');
export const LOGGER = new InjectionToken<(msg: string) => void>('logger.function');

export interface Config { apiUrl: string; timeout: number; }
export const CONFIG_TOKEN = new InjectionToken<Config>('app.config');
```

The string parameter is for debugging only — Angular identifies tokens by object reference.

### InjectionToken with `providedIn: 'root'`

A token with a `factory` defaults to `providedIn: 'root'`:

```ts
export const APP_CONFIG = new InjectionToken<AppConfig>('app.config', {
  providedIn: 'root',
  factory: () => ({
    apiUrl: 'https://api.example.com',
    version: '1.0.0',
    features: { darkMode: true, analytics: false }
  })
});

// Inject anywhere — no providers array needed
export class HeaderComponent {
  config = inject(APP_CONFIG);
}
```

Factory functions can use `inject()` to access other services:

```ts
export const LOGGER_FN = new InjectionToken<LoggerFn>('logger.function', {
  providedIn: 'root',
  factory: () => {
    const config = inject(APP_CONFIG);
    return (level: string, message: string) => {
      if (config.features.logging !== false) {
        console[level](`[${new Date().toISOString()}] ${message}`);
      }
    };
  }
});
```

**Advantages:** No manual configuration, tree-shakeable, type-safe, can inject other dependencies.

## Manual Provider Configuration

### When to use manual `providers`

1. Service doesn't have `providedIn`
2. Want a new instance at component/directive level
3. Need runtime configuration
4. Providing non-class values

### Service without `providedIn`

```ts
@Injectable()
export class LocalDataStore { /* ... */ }

@Component({
  providers: [LocalDataStore],  // Required since no providedIn
  template: `...`
})
export class ExampleComponent {
  dataStore = inject(LocalDataStore);
}
```

### Component-specific instances

Tie an instance's lifecycle to the component:

```ts
@Injectable({ providedIn: 'root' })
export class DataStore { private data: ListItem[] = []; }

@Component({
  providers: [DataStore],  // Gets its own instance instead of root singleton
  template: `...`
})
export class IsolatedComponent {
  dataStore = inject(DataStore);  // Component-specific instance
}
```

## Injector Hierarchy

Angular DI is hierarchical. When a component requests a dependency, Angular walks up the injector tree until it finds a provider:

```
platform
  └── root (EnvironmentInjector from bootstrapApplication)
        └── SocialApp
              ├── UserProfile
              └── FriendList
                    └── FriendEntry
```

- `SocialApp` can provide values to `UserProfile` and `FriendList`
- `FriendList` can provide to `FriendEntry` but not to `UserProfile`

## Declaring a Provider

### Shorthand vs. Full Syntax

```ts
// Shorthand
providers: [LocalService]

// Equivalent full syntax
providers: [{ provide: LocalService, useClass: LocalService }]
```

### Provider Configuration Object Structure

- `provide`: the unique key (class or `InjectionToken`)
- `useClass` / `useValue` / `useFactory` / `useExisting`: the value

### Provider Identifiers

**Class names:**
```ts
providers: [{ provide: LocalService, useClass: LocalService }]
```

**InjectionToken:**
```ts
export const DATA_SERVICE_TOKEN = new InjectionToken<DataService>('DataService');

providers: [{ provide: DATA_SERVICE_TOKEN, useClass: LocalDataService }]
```

**TypeScript interfaces cannot be used** — they don't exist at runtime:
```ts
// ❌ Won't work
providers: [{ provide: DataService, useClass: LocalDataService }]

// ✅ Use InjectionToken instead
export const DATA_SERVICE_TOKEN = new InjectionToken<DataService>('DataService');
```

## Provider Value Types

### `useClass`

```ts
providers: [DataService]                           // shorthand
providers: [{ provide: DataService, useClass: DataService }]
providers: [{ provide: DataService, useClass: MockDataService }]
providers: [{
  provide: StorageService,
  useClass: environment.production ? CloudStorageService : LocalStorageService
}]
```

### `useValue`

```ts
providers: [
  { provide: API_URL_TOKEN, useValue: 'https://api.example.com' },
  { provide: MAX_RETRIES_TOKEN, useValue: 3 },
  { provide: FEATURE_FLAGS_TOKEN, useValue: { darkMode: true, beta: false } }
]
```

### `useFactory`

```ts
providers: [{
  provide: LoggerService,
  useFactory: loggerFactory,
  deps: [APP_CONFIG]  // Dependencies passed to the factory function
}]
```

With optional deps:
```ts
providers: [{
  provide: MyService,
  useFactory: (required: RequiredService, optional?: OptionalService) =>
    new MyService(required, optional || new DefaultService()),
  deps: [RequiredService, [new Optional(), OptionalService]]
}]
```

Modern pattern using `inject()` in factory (no `deps` needed):
```ts
const apiClientFactory = () => {
  const http = inject(HttpClient);
  const userService = inject(UserService);
  return new ApiClient(http, userService.getApiBaseUrl(), userService.getRateLimit());
};
providers: [{ provide: ApiClient, useFactory: apiClientFactory }]
```

### `useExisting` (aliasing)

Both tokens return the **same singleton instance**:
```ts
providers: [
  NewLogger,
  { provide: OldLogger, useExisting: NewLogger }  // alias
]
```

> Don't confuse with `useClass` — `useClass` creates a new instance, `useExisting` reuses the same one.

### `multi: true`

Multiple providers contribute values to the same token as an array:
```ts
providers: [
  { provide: INTERCEPTOR_TOKEN, useClass: AuthInterceptor, multi: true },
  { provide: INTERCEPTOR_TOKEN, useClass: LoggingInterceptor, multi: true },
]
// inject(INTERCEPTOR_TOKEN) → [AuthInterceptor instance, LoggingInterceptor instance]
```

## Where to Specify Providers

### Application bootstrap (global singletons)

```ts
bootstrapApplication(AppComponent, {
  providers: [
    { provide: API_BASE_URL, useValue: 'https://api.example.com' },
    LoggingService,
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
});
```

Use when: service is used across multiple feature areas, you want a true singleton, or you're using `provideRouter`, `provideHttpClient`, etc.

### Component or directive providers (isolated instances)

```ts
@Component({
  selector: 'app-advanced-form',
  providers: [
    FormValidationService,
    { provide: FORM_CONFIG, useValue: { strictMode: true } }
  ]
})
export class AdvancedFormComponent { }
```

Use when: component needs its own service instance, service has component-specific state.

### Route providers (feature-scoped)

```ts
export const routes: Routes = [{
  path: 'admin',
  providers: [
    AdminService,
    { provide: FEATURE_FLAGS, useValue: { adminMode: true } }
  ],
  loadChildren: () => import('./admin/admin.routes')
}];
```

## Library Author Pattern: `provide*` Functions

Export a function that returns provider configurations instead of requiring manual setup:

```ts
export function provideAnalytics(config: AnalyticsConfig): Provider[] {
  return [
    { provide: ANALYTICS_CONFIG, useValue: config },
    AnalyticsService
  ];
}

// Consumer usage
bootstrapApplication(AppComponent, {
  providers: [
    provideAnalytics({ trackingId: 'GA-12345', enableDebugMode: !environment.production })
  ]
});
```

### Advanced: `with*` feature pattern

```ts
export function provideHttpClient(config?: HttpConfig, ...features: HttpFeature[]): Provider[] {
  const providers: Provider[] = [{ provide: HTTP_CONFIG, useValue: config || {} }, HttpClientService];
  features.forEach(feature => providers.push(...feature.providers));
  return providers;
}

export function withCaching(): HttpFeature {
  return { kind: HttpFeatures.Caching, providers: [CacheInterceptor] };
}

export function withRetry(config: RetryConfig): HttpFeature {
  return { kind: HttpFeatures.Retry, providers: [{ provide: RETRY_CONFIG, useValue: config }, RetryInterceptor] };
}

// Consumer usage
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      { baseUrl: 'https://api.example.com' },
      withCaching(),
      withRetry({ maxAttempts: 3, delayMs: 1000 })
    )
  ]
});
```

**Why `provide*` functions?** Encapsulation, type safety, composability, future-proofing, and consistency with Angular's own patterns (`provideRouter`, `provideHttpClient`).
