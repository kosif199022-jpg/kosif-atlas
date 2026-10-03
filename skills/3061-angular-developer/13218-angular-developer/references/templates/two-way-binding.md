# Two-Way Binding

Source: https://v20.angular.dev/guide/templates/two-way-binding

## Syntax

`[()]` — "banana-in-a-box". Combines property binding `[]` and event binding `()`.

```html
<input [(ngModel)]="firstName" />
```

## With Native Form Controls

Requires `FormsModule` from `@angular/forms`:

```ts
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  template: `
    <h2>Hello {{ firstName }}!</h2>
    <input type="text" [(ngModel)]="firstName" />
  `
})
export class AppComponent {
  firstName = 'Ada';
}
```

Steps:
1. Import `FormsModule`
2. Use `[(ngModel)]` on the input
3. Assign the state property to sync

## Between Components (Signal-based)

Use `model()` in the child component:

```ts
// counter.component.ts
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <button (click)="updateCount(-1)">-</button>
    <span>{{ count() }}</span>
    <button (click)="updateCount(+1)">+</button>
  `,
})
export class CounterComponent {
  count = model<number>(0);

  updateCount(amount: number): void {
    this.count.update(current => current + amount);
  }
}
```

```ts
// app.component.ts
@Component({
  imports: [CounterComponent],
  template: `
    <h1>Counter: {{ initialCount }}</h1>
    <app-counter [(count)]="initialCount"></app-counter>
  `,
})
export class AppComponent {
  initialCount = 18;
}
```

### Requirements for Component Two-Way Binding

**Child:** Must declare a `model()` property (from `@angular/core`).

**Parent:**
1. Wrap the `model` property name in `[()]` syntax
2. Assign a property or signal to it

The `model()` signal automatically emits changes upward — no separate `EventEmitter` needed.
