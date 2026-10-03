# Reactive Forms

Source: https://v20.angular.dev/guide/forms/reactive-forms

Reactive forms use an explicit, immutable approach to managing form state. Each change returns a new state. Built around observable streams with synchronous access to data.

## Adding a Basic Form Control

Three steps:
1. Import `ReactiveFormsModule` in your component
2. Instantiate a new `FormControl`
3. Register the `FormControl` in the template

```typescript
// name-editor.component.ts
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-name-editor',
  templateUrl: './name-editor.component.html',
  imports: [ReactiveFormsModule],
})
export class NameEditorComponent {
  name = new FormControl('');

  updateName() {
    this.name.setValue('Nancy');
  }
}
```

```html
<!-- name-editor.component.html -->
<label for="name">Name: </label>
<input id="name" type="text" [formControl]="name">
<p>Value: {{ name.value }}</p>
<button type="button" (click)="updateName()">Update Name</button>
```

### Displaying Form Control Value

- Via `valueChanges` observable (with `AsyncPipe` or `subscribe()`)
- Via `value` property (snapshot of current value)

### Replacing a Form Control Value

Use `setValue()` to update the value programmatically:

```typescript
this.name.setValue('Nancy');
```

## Grouping Form Controls

Two ways to group multiple related controls:

| Type | Details |
| --- | --- |
| `FormGroup` | Fixed set of controls managed together. Supports nesting. |
| `FormArray` | Dynamic form with controls added/removed at runtime. |

### Creating a FormGroup

```typescript
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

profileForm = new FormGroup({
  firstName: new FormControl(''),
  lastName: new FormControl(''),
  address: new FormGroup({
    street: new FormControl(''),
    city: new FormControl(''),
    state: new FormControl(''),
    zip: new FormControl(''),
  }),
});
```

```html
<form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
  <input formControlName="firstName" />
  <input formControlName="lastName" />
  <div formGroupName="address">
    <input formControlName="street" />
    <input formControlName="city" />
  </div>
  <button type="submit" [disabled]="!profileForm.valid">Submit</button>
</form>
```

### Updating Parts of the Data Model

| Method | Details |
| --- | --- |
| `setValue()` | Sets new value for individual control. Strictly adheres to form group structure — replaces entire value. |
| `patchValue()` | Replace only properties that have changed. Fails silently for unrecognized keys. |

```typescript
this.profileForm.patchValue({
  firstName: 'Nancy',
  address: { street: '123 Drew Street' },
});
```

## Using FormBuilder Service

`FormBuilder` reduces repetitive boilerplate for creating controls.

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export class ProfileEditorComponent {
  private formBuilder = inject(FormBuilder);

  profileForm = this.formBuilder.group({
    firstName: ['', Validators.required],
    lastName: [''],
    address: this.formBuilder.group({
      street: [''],
      city: [''],
      state: [''],
      zip: [''],
    }),
    aliases: this.formBuilder.array([this.formBuilder.control('')]),
  });
}
```

`FormBuilder` has three methods: `control()`, `group()`, `array()`.

Array shorthand: `['initialValue', syncValidator, asyncValidator]`

## Validating Form Input

```typescript
import { Validators } from '@angular/forms';

// In FormBuilder group:
firstName: ['', Validators.required],
```

Display status:
```html
<p>Form Status: {{ profileForm.status }}</p>
```

## Creating Dynamic Forms with FormArray

`FormArray` manages any number of unnamed controls. Add/remove at runtime.

```typescript
import { FormArray } from '@angular/forms';

// Define
aliases: this.formBuilder.array([this.formBuilder.control('')]),

// Getter
get aliases() {
  return this.profileForm.get('aliases') as FormArray;
}

// Add dynamically
addAlias() {
  this.aliases.push(this.formBuilder.control(''));
}
```

```html
<div formArrayName="aliases">
  @for (alias of aliases.controls; track $index; let i = $index) {
    <input [formControlName]="i" />
  }
</div>
```

Pass an array to `push()` to add multiple controls at once:
```typescript
this.aliases.push([new FormControl('ngDev'), new FormControl('ngAwesome')]);
```

## Unified Control State Change Events

All form controls expose a unified stream via `events` observable on `AbstractControl`.

```typescript
this.form.events.subscribe((e) => {
  if (e instanceof ValueChangeEvent) { /* ... */ }
  if (e instanceof StatusChangeEvent) { /* ... */ }
  if (e instanceof PristineChangeEvent) { /* ... */ }
  if (e instanceof TouchedChangeEvent) { /* ... */ }
  if (e instanceof FormResetEvent) { /* ... */ }
  if (e instanceof FormSubmittedEvent) { /* ... */ }
});
```

Event types: `ValueChangeEvent`, `StatusChangeEvent`, `PristineChangeEvent`, `TouchedChangeEvent`, `FormResetEvent`, `FormSubmittedEvent`. All extend `ControlEvent` and include a `source` reference.

Filter specific events:
```typescript
import { filter } from 'rxjs/operators';
control.events
  .pipe(filter((e) => e instanceof StatusChangeEvent))
  .subscribe((e) => console.log('Status:', e.status));
```

> **NOTE:** On value change, event fires right after this control's value updates, but *before* parent control value updates. Subscribe to parent's `events` if you need the parent's updated value.

## Utility Functions for Narrowing Form Control Types

Type guards that narrow `AbstractControl` to concrete types:

| Function | Returns true when |
| --- | --- |
| `isFormControl` | control is a `FormControl` |
| `isFormGroup` | control is a `FormGroup` |
| `isFormRecord` | control is a `FormRecord` |
| `isFormArray` | control is a `FormArray` |

```typescript
import { AbstractControl, isFormArray } from '@angular/forms';

export function positiveValues(control: AbstractControl) {
  if (!isFormArray(control)) return null; // not applicable
  const hasNegative = control.controls.some(c => c.value < 0);
  return hasNegative ? { positiveValues: true } : null;
}
```

## API Summary

### Classes

| Class | Details |
| --- | --- |
| `AbstractControl` | Abstract base for `FormControl`, `FormGroup`, `FormArray`. Provides common behaviors. |
| `FormControl` | Manages value and validity of an individual control. |
| `FormGroup` | Manages value and validity state of a group of `AbstractControl` instances. |
| `FormArray` | Manages numerically indexed array of `AbstractControl` instances. |
| `FormBuilder` | Injectable service with factory methods for creating control instances. |
| `FormRecord` | Tracks collection of `FormControl` instances all with the same value type. |

### Directives

| Directive | Details |
| --- | --- |
| `FormControlDirective` | Syncs standalone `FormControl` to a form control element. |
| `FormControlName` | Syncs `FormControl` in existing `FormGroup` to element by name. |
| `FormGroupDirective` | Syncs existing `FormGroup` to a DOM element. |
| `FormGroupName` | Syncs nested `FormGroup` to a DOM element. |
| `FormArrayName` | Syncs nested `FormArray` to a DOM element. |
