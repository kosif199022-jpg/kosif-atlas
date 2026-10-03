# Dependency Injection in Angular

Source: https://v20.angular.dev/guide/di

## What is DI?

Dependency Injection (DI) is a design pattern for organizing and sharing code across an application. It solves:

- **Improved maintainability**: cleaner separation of concerns, easier refactoring, less duplication
- **Scalability**: modular functionality reusable across multiple contexts
- **Better testing**: easy substitution of test doubles

## Core Concept

Two roles in any DI system:
- Code can **provide** (make available) values
- Code can **inject** (ask for) those values as dependencies

"Values" can be any JavaScript value: objects, functions, primitives.

Common types of injected dependencies:
- **Configuration values**: environment constants, API URLs, feature flags
- **Factories**: functions that create objects/values based on runtime conditions
- **Services**: classes providing common functionality, business logic, or state

Angular components and directives automatically participate in DI — they can both inject dependencies and be available for injection.

## What are Services?

An Angular *service* is a TypeScript class decorated with `@Injectable`, making an instance available for injection.

```ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AnalyticsLogger {
  trackEvent(category: string, value: string) {
    console.log('Analytics event logged:', {
      category,
      value,
      timestamp: new Date().toISOString()
    });
  }
}
```

`providedIn: 'root'` makes this service available throughout the entire application as a singleton. This is the recommended approach for most services.

Common service types:
- **Data clients**: abstract HTTP requests for data retrieval/mutation
- **State management**: define state shared across multiple components/pages
- **Authentication and authorization**: manage user auth, tokens, access control
- **Logging and error handling**: common API for logging/error communication
- **Event handling**: handles events not associated with a specific component
- **Utility functions**: reusable formatting, validation, calculations

## Injecting Dependencies with `inject()`

```ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AnalyticsLogger } from './analytics-logger';

@Component({
  selector: 'app-navbar',
  template: `<a href="#" (click)="navigateToDetail($event)">Detail Page</a>`,
})
export class NavbarComponent {
  private router = inject(Router);
  private analytics = inject(AnalyticsLogger);

  navigateToDetail(event: Event) {
    event.preventDefault();
    this.analytics.trackEvent('navigation', '/details');
    this.router.navigate(['/details']);
  }
}
```

## Where Can `inject()` Be Used?

Valid injection contexts:

```ts
@Component({...})
export class MyComponent {
  // ✅ In class field initializer
  private service = inject(MyService);

  // ✅ In constructor body
  constructor() {
    const another = inject(MyService);
  }
}

@Directive({...})
export class MyDirective {
  // ✅ In class field initializer
  private element = inject(ElementRef);
}

@Injectable({ providedIn: 'root' })
export class MyService {
  // ✅ In a service
  private http = inject(HttpClient);
}

// ✅ In a route guard
export const authGuard = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated();
};
```

Angular uses "injection context" to describe places where `inject()` can be called. See [injection contexts](/guide/di/dependency-injection-context) for details.

Calling `inject()` outside of an injection context throws **error NG0203**.
