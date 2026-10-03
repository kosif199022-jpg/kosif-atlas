# Structural Directives

Source: https://v20.angular.dev/guide/directives/structural-directives

Structural directives are applied to an `<ng-template>` element that conditionally or repeatedly renders the content of that `<ng-template>`.

## Long-form Syntax (on `<ng-template>`)

```html
<ng-template select let-data [selectFrom]="source">
  <p>The data is: {{ data }}</p>
</ng-template>
```

`<ng-template>` doesn't render anything by default — a structural directive is needed.

## Structural Directive Shorthand (`*` prefix)

Apply a structural directive directly on an element using `*`:

```html
<p *select="let data from source">The data is: {{data}}</p>
```

Angular transforms this into:

```html
<!-- Shorthand: -->
<p class="data-view" *select="let data from source">The data is: {{data}}</p>

<!-- Expands to: -->
<ng-template select let-data [selectFrom]="source">
  <p class="data-view">The data is: {{data}}</p>
</ng-template>
```

### Shorthand Microsyntax Rules

- `let data` → declares template variable bound to `$implicit` context property
- `from source` → `from` is a binding key mapped to `selectFrom` (PascalCase + directive selector prefix), `source` is the expression
- Why prefix matters: `from` → `select` + `From` → `selectFrom`

## One Structural Directive Per Element

Only one structural directive per element in shorthand syntax — only one `<ng-template>` to unwrap to. Use `<ng-container>` to nest multiple structural directives around the same element:

```html
<ng-container *ngFor="let item of items">
  <ng-container *ngIf="item.active">
    <p>{{ item.name }}</p>
  </ng-container>
</ng-container>
```

## Creating a Structural Directive

```bash
ng generate directive select
```

### Step 1: Inject `TemplateRef` and `ViewContainerRef`

```ts
import { Directive, TemplateRef, ViewContainerRef, inject } from '@angular/core';

@Directive({ selector: '[select]' })
export class SelectDirective {
  private templateRef = inject(TemplateRef);
  private viewContainerRef = inject(ViewContainerRef);
}
```

### Step 2: Add input

```ts
selectFrom = input.required<DataSource>();
```

### Step 3: Add business logic

```ts
async ngOnInit() {
  const data = await this.selectFrom().load();
  this.viewContainerRef.createEmbeddedView(this.templateRef, {
    $implicit: data,  // bound to `let data`
  });
}
```

## Structural Directive Syntax Reference

```
*:prefix="( :let | :expression ) (';' | ',')? ( :let | :as | :keyExp )*"
```

| Part | Description |
|---|---|
| `prefix` | HTML attribute key (the directive selector) |
| `key` | HTML attribute key for key-expression pairs |
| `local` | Local template variable name |
| `export` | Value exported by the directive under a given name |
| `expression` | Standard Angular expression |

### Translation Table

| Shorthand | Translation |
|---|---|
| naked `expression` | `[prefix]="expression"` |
| `keyExp` | `[prefixKey]="expression"` |
| `let local` | `let-local="export"` |

### Examples

| Shorthand | Angular Expansion |
|---|---|
| `*myDir="let item of [1,2,3]"` | `<ng-template myDir let-item [myDirOf]="[1, 2, 3]">` |
| `*myDir="let item of [1,2,3] as items; trackBy: myTrack; index as i"` | `<ng-template myDir let-item [myDirOf]="[1,2,3]" let-items="myDirOf" [myDirTrackBy]="myTrack" let-i="index">` |
| `*myDir="exp as value"` | `<ng-template [myDir]="exp" let-value="myDir">` |

## Template Type Checking for Structural Directives

### Type Narrowing with `ngTemplateGuard_`

Narrow the input expression type inside the template:

```ts
@Directive(...)
class ActorIsUser {
  actor = input<User | Robot>();

  // Narrows type within template to `User`
  static ngTemplateGuard_actor(dir: ActorIsUser, expr: User | Robot): expr is User {
    return true;
  }
}
```

For truthiness-based narrowing:

```ts
@Directive(...)
class CustomIf {
  condition = input.required<boolean>();
  static ngTemplateGuard_condition: 'binding';  // Uses the binding expression as the guard
}
```

### Typing the Context with `ngTemplateContextGuard`

Properly type the template context object:

```ts
export interface SelectTemplateContext<T> {
  $implicit: T;
}

@Directive(...)
export class SelectDirective<T> {
  selectFrom = input.required<DataSource<T>>();

  static ngTemplateContextGuard<T>(
    dir: SelectDirective<T>,
    ctx: any
  ): ctx is SelectTemplateContext<T> {
    return true;
  }
}
```

This enables the template type-checker to know the type of `data` in `let data`.
