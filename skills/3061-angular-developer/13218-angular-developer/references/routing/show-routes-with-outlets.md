# Show Routes with Outlets

Source: https://v20.angular.dev/guide/routing/show-routes-with-outlets

`RouterOutlet` is a placeholder directive that marks where the router renders the active route's component.

```html
<app-header />
<router-outlet />  <!-- Angular inserts route content here -->
<app-footer />
```

```ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {}
```

The `<router-outlet>` element stays in the DOM as an anchor; routed content is inserted **after** it as a sibling.

---

## Nested Routes with Child Outlets

For child routes, the parent component adds its own `<router-outlet>`:

```html
<!-- SettingsComponent -->
<h1>Settings</h1>
<nav>
  <ul>
    <li><a routerLink="profile">Profile</a></li>
    <li><a routerLink="security">Security</a></li>
  </ul>
</nav>
<router-outlet />
```

Route config:

```ts
const routes: Routes = [
  {
    path: 'settings-component',
    component: SettingsComponent,
    children: [
      { path: 'profile', component: ProfileComponent },
      { path: 'security', component: SecurityComponent },
    ],
  },
];
```

---

## Named (Secondary) Outlets

Multiple outlets can coexist on a page; assign unique names:

```html
<router-outlet />
<router-outlet name='read-more' />
<router-outlet name='additional-actions' />
```

Route config uses the `outlet` property:

```ts
{ path: 'user/:id', component: UserDetails, outlet: 'additional-actions' }
```

- Default outlet name is `'primary'`.
- Names cannot be set or changed dynamically.

---

## Outlet Lifecycle Events

| Event | Description |
|-------|-------------|
| `activate` | New component instantiated |
| `deactivate` | Component destroyed |
| `attach` | `RouteReuseStrategy` attaches a stored subtree |
| `detach` | `RouteReuseStrategy` detaches a subtree |

```html
<router-outlet
  (activate)='onActivate($event)'
  (deactivate)='onDeactivate($event)'
  (attach)='onAttach($event)'
  (detach)='onDetach($event)'
/>
```

---

## Passing Data to Routed Components via `routerOutletData`

Each `RouterOutlet` supports a `routerOutletData` input. Routed components and their children read this data using the `ROUTER_OUTLET_DATA` injection token (returns a signal).

```ts
// Dashboard component (parent with outlet)
@Component({
  template: `<router-outlet [routerOutletData]="{ layout: 'sidebar' }" />`,
  imports: [RouterOutlet],
})
export class DashboardComponent {}

// Routed child component
@Component({
  template: `<p>Layout: {{ outletData().layout }}</p>`,
})
export class StatsComponent {
  outletData = inject(ROUTER_OUTLET_DATA) as Signal<{ layout: string }>;
}
```

When `routerOutletData` is unset, the injected value is `null` by default.
