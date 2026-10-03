# Variables in Templates

Source: https://v20.angular.dev/guide/templates/variables

Angular provides two types of variable declarations in templates:
1. **`@let`** — local template variables
2. **Template reference variables** (`#name`) — references to elements, components, directives

---

## `@let` — Local Template Variables

```html
@let name = user.name;
@let greeting = 'Hello, ' + name;
@let data = data$ | async;
@let pi = 3.14159;
@let coordinates = {x: 50, y: 100};
```

- Each `@let` block declares exactly **one** variable
- Angular keeps the variable's value current (like a binding)
- Value is based on any template expression, including pipes

### Usage Example

```html
@let user = user$ | async;
@if (user) {
  <h1>Hello, {{ user.name }}</h1>
  <user-avatar [photo]="user.photo"/>
  @for (snack of user.favoriteSnacks; track snack.id) {
    <li>{{ snack.name }}</li>
  }
  <button (click)="update(user)">Update profile</button>
}
```

### Key Differences from JavaScript `let`

- **Cannot be reassigned** after declaration
- Angular auto-updates the value when the expression changes
- `@let` declarations are **not hoisted** — they're scoped to the current view

### Scope

`@let` is scoped to the current view and its descendants. A new view is created at:
- Component boundaries
- Control flow blocks (`@if`, `@for`, etc.)
- `@defer` blocks
- Structural directives

```html
@let topLevel = value;
<div>
  @let insideDiv = value;
</div>
{{ topLevel }}           <!-- Valid -->
{{ insideDiv }}          <!-- Valid -->
@if (condition) {
  {{ topLevel + insideDiv }}  <!-- Valid -->
  @let nested = value;
  @if (condition) {
    {{ topLevel + insideDiv + nested }}  <!-- Valid -->
  }
}
{{ nested }}  <!-- Error: not hoisted out of @if -->
```

---

## Template Reference Variables (`#name`)

Declare by adding `#variableName` to an element. The type of reference depends on what the variable is declared on:

| Declared on | Variable refers to |
|---|---|
| Angular component | Component instance |
| `<ng-template>` | `TemplateRef` instance |
| Any other element | `HTMLElement` instance |

### Examples

```html
<!-- HTMLInputElement -->
<input #taskInput placeholder="Enter task name">

<!-- Component instance -->
<my-datepicker #startDate />

<!-- TemplateRef -->
<ng-template #myFragment>
  <p>This is a template fragment</p>
</ng-template>
```

### Referencing a Directive with `exportAs`

```ts
@Directive({
  selector: '[dropZone]',
  exportAs: 'dropZone',
})
export class DropZone { /* ... */ }
```

```html
<section dropZone #firstZone="dropZone"> ... </section>
```

Only works if the directive specifies `exportAs`.

### Use with Queries

Template reference variables can be used as query targets:

```html
<input #description value="Original description">
```

```ts
@ViewChild('description') input: ElementRef | undefined;
```

See [Referencing children with queries](https://v20.angular.dev/guide/components/queries).
