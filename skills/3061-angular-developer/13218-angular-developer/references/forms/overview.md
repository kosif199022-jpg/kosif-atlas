# Forms in Angular

Source: https://v20.angular.dev/guide/forms

## Choosing an Approach

Angular provides two approaches to handling user input through forms:

| Forms | Details |
| --- | --- |
| Reactive forms | Direct, explicit access to the underlying form object model. More robust: scalable, reusable, and testable. Use when forms are a key part of your app or you're using reactive patterns. |
| Template-driven forms | Rely on directives in the template to create and manipulate the underlying object model. Useful for simple forms (e.g. email list signup). Easier to add but don't scale as well. |

### Key Differences

|  | Reactive | Template-driven |
| --- | --- | --- |
| Setup of form model | Explicit, created in component class | Implicit, created by directives |
| Data model | Structured and immutable | Unstructured and mutable |
| Data flow | Synchronous | Asynchronous |
| Form validation | Functions | Directives |

### Scalability

- Reactive forms provide direct access to the underlying form API with synchronous data flow — easier to build large-scale forms and test without deep knowledge of change detection.
- Template-driven forms abstract away the form API and use asynchronous data flow. Tests require more setup and manual change detection execution.

## Common Form Foundation Classes

Both reactive and template-driven forms are built on:

| Base class | Details |
| --- | --- |
| `FormControl` | Tracks the value and validation status of an individual form control. |
| `FormGroup` | Tracks values and status for a collection of form controls. |
| `FormArray` | Tracks values and status for an array of form controls. |
| `ControlValueAccessor` | Creates a bridge between Angular `FormControl` instances and built-in DOM elements. |

## Setup in Reactive Forms

Define the form model directly in the component class. Use `[formControl]` directive to link `FormControl` instance to a form element.

```typescript
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-reactive-favorite-color',
  template: `Favorite Color: <input type="text" [formControl]="favoriteColorControl">`,
  imports: [ReactiveFormsModule],
})
export class FavoriteColorReactiveComponent {
  favoriteColorControl = new FormControl('');
}
```

**Source of truth: the form model** (via `[formControl]` directive on the `<input>` element).

## Setup in Template-Driven Forms

The form model is implicit — `NgModel` directive creates and manages a `FormControl` instance for a given form element.

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-template-favorite-color',
  template: `Favorite Color: <input type="text" [(ngModel)]="favoriteColor">`,
  imports: [FormsModule],
})
export class FavoriteColorTemplateComponent {
  favoriteColor = '';
}
```

**Source of truth: the template** — `NgModel` automatically manages the `FormControl` instance.

## Data Flow in Reactive Forms

Each form element in the view is directly linked to the form model (`FormControl` instance). Updates are **synchronous** in both directions.

**View → Model:** user types → input emits "input" event → `ControlValueAccessor` calls `setValue()` on `FormControl` → `FormControl` emits via `valueChanges` observable.

**Model → View:** call `setValue()` → `FormControl` emits new value via `valueChanges` → `ControlValueAccessor` updates the `<input>`.

## Data Flow in Template-Driven Forms

Each form element is linked to a directive that manages the form model internally. Updates are **asynchronous**.

**View → Model:** user types → input emits "input" event → `ControlValueAccessor` calls `setValue()` on `FormControl` → `FormControl` emits via `valueChanges` → `NgModel.viewToModelUpdate()` emits `ngModelChange` → two-way bound property updated.

**Model → View:** property updated in component → change detection begins → `ngOnChanges` called on `NgModel` → async task queued to set `FormControl` value → on next tick, value set → `FormControl` emits via `valueChanges` → `ControlValueAccessor` updates `<input>`.

> **NOTE:** `NgModel` triggers a second change detection to avoid `ExpressionChangedAfterItHasBeenChecked` errors.

## Mutability of the Data Model

| Forms | Details |
| --- | --- |
| Reactive forms | Keep data model pure with immutable data structures. Each change returns a new state. Enables change tracking through observable streams. |
| Template-driven forms | Rely on mutability with two-way data binding. Less efficient change detection. |

## Form Validation

| Forms | Details |
| --- | --- |
| Reactive forms | Define custom validators as **functions** that receive a control to validate |
| Template-driven forms | Tied to template **directives** — must provide custom validator directives that wrap validation functions |

## Testing

- **Reactive forms**: Provide synchronous access — can be tested without rendering UI. Status and data queried/manipulated through the control without change detection cycle.
- **Template-driven forms**: Require detailed knowledge of change detection process. Tests need manual change detection and more setup.
