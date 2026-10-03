# Creating Custom Route Matches with UrlMatcher

Source: https://v20.angular.dev/guide/routing/routing-with-urlmatcher

`UrlMatcher` lets you implement custom URL matching logic beyond what static/parameterized/wildcard paths support.

## Basic Example: Twitter Handle Matcher

### Route Config (`app.routes.ts`)

```ts
import { Routes, UrlSegment } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
  {
    matcher: (url) => {
      // Match single segment starting with '@'
      if (url.length === 1 && url[0].path.match(/^@[\w]+$/gm)) {
        return {
          consumed: url,
          posParams: { username: new UrlSegment(url[0].path.slice(1), {}) }
        };
      }
      return null;  // No match — router tries next route
    },
    component: ProfileComponent,
  },
];
```

### App Config

```ts
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig = {
  providers: [provideRouter(routes, withComponentInputBinding())]
};
```

### Profile Component

```ts
// profile.component.html
<p>Hello {{ username() }}!</p>

// profile.component.ts
export class ProfileComponent {
  username = input.required<string>();
}
```

### App Template

```html
<h2>Routing with Custom Matching</h2>
Navigate to <a routerLink="/@Angular">my profile</a>
<router-outlet />
```

---

## How Custom Matchers Work

- The matcher function receives the array of `UrlSegment[]` for the current URL
- Return a `UrlMatchResult` object `{ consumed, posParams }` on success — consumed segments are removed from further matching, `posParams` become route parameters
- Return `null` if the URL doesn't match — the router continues to the next route
- Child routes and lazy loading work exactly as with standard routes

**Use case examples:**
- Social handles (`@username`)
- Version-based routing (`/v2.1/docs`)
- Locale prefixes (`/en/...`, `/fr/...`)
- Product URL schemes (`isbn-1234567890`, `/sku/ABC123`)
