# Navigate to Routes

Source: https://v20.angular.dev/guide/routing/navigate-to-routes

## RouterLink (Declarative Navigation)

Use `RouterLink` directive instead of plain `href` to keep navigation within Angular's router:

```ts
import { RouterLink } from '@angular/router';

@Component({
  template: `
    <nav>
      <a routerLink="/user-profile">User profile</a>
      <a routerLink="/settings">Settings</a>
    </nav>
  `,
  imports: [RouterLink],
})
export class App {}
```

### Absolute vs. Relative Links

- **Absolute** includes protocol + domain: `https://www.angular.dev/essentials`
- **Relative** omits origin: `/essentials` (relative to root) or `essentials` (relative to current route)

### String vs. Array Syntax

```html
<!-- String (most common) -->
<a routerLink="dashboard">Dashboard</a>

<!-- Array (needed for dynamic params) -->
<a [routerLink]="['user', currentUserId]">Current User</a>
<a [routerLink]="['/team', teamId, 'user', userId]">Current User</a>
```

---

## Programmatic Navigation

Inject `Router` to navigate in code.

### `router.navigate()`

Takes an array of path segments, just like `RouterLink`:

```ts
export class AppDashboard {
  private router = inject(Router);

  navigateToProfile() {
    this.router.navigate(['/profile']);
    this.router.navigate(['/users', userId]);
    this.router.navigate(['/search'], { queryParams: { category: 'books', sort: 'price' } });
    this.router.navigate(['/products', { featured: true, onSale: true }]); // matrix params
  }
}
```

**Relative navigation** using `relativeTo`:

```ts
// From: /users/123 → To: /users/123/edit
this.router.navigate(['edit'], { relativeTo: this.route });

// From: /users/123 → To: /users
this.router.navigate(['..'], { relativeTo: this.route });
```

### `router.navigateByUrl()`

Takes a full URL string — ideal for absolute navigation or deep linking:

```ts
router.navigateByUrl('/products');
router.navigateByUrl('/products/featured');
router.navigateByUrl('/products/123?view=details#reviews');
router.navigateByUrl('/search?category=books&sortBy=price');
router.navigateByUrl('/sales-awesome;isOffer=true;showModal=false'); // matrix params

// Replace current history entry instead of pushing
router.navigateByUrl('/checkout', { replaceUrl: true });
```
