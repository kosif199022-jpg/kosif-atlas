# Angular Routing — Overview

Source: https://v20.angular.dev/guide/routing

Angular Router (`@angular/router`) is the official library for managing navigation in Angular applications and is included by default in all Angular CLI projects.

## Why Routing in a SPA?

In a traditional multi-page app, every URL triggers a network request and a full page reload. A single-page application (SPA) loads only `index.html` once; a client-side router then controls which content is displayed based on the URL, updating the page in-place without a full reload.

## How Angular Manages Routing

Routing in Angular has three primary parts:

1. **Routes** — define which component renders for a given URL.
2. **Outlets** — placeholders in templates that dynamically render the active route's component.
3. **Links** — allow users to navigate without triggering a full page reload.

Additional features include:
- Nested routes
- Programmatic navigation
- Route params, queries, and wildcards
- Activated route info via `ActivatedRoute`
- View transition effects
- Navigation guards
