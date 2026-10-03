# Form Validation

Source: https://v20.angular.dev/guide/forms/form-validation

## Validating Input in Template-Driven Forms

Add HTML validation attributes — Angular uses directives to match them with validator functions:

```html
<input type="text" id="name" name="name"
       required minlength="4" appForbiddenName="bob"
       [(ngModel)]="actor.name" #name="ngModel">

@if (name.invalid && (name.dirty || name.touched)) {
  <div class="alert">
    @if (name.hasError('required')) { <div>Name is required.</div> }
    @if (name.hasError('minlength')) { <div>Name must be at least 4 characters long.</div> }
    @if (name.hasError('forbiddenName')) { <div>Name cannot be Bob.</div> }
  </div>
}
```

- `#name="ngModel"` exports `NgModel` to a local variable — mirrors `FormControl` properties (`valid`, `dirty`, `touched`, etc.)
- Check `dirty || touched` before showing errors so users aren't confronted with errors on untouched fields

## Validating Input in Reactive Forms

Add validator functions directly to the form control model in the component class:

```typescript
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { forbiddenNameValidator } from './forbidden-name.directive';

actorForm = new FormGroup({
  name: new FormControl(this.actor.name, [
    Validators.required,
    Validators.minLength(4),
    forbiddenNameValidator(/bob/i),
  ]),
  skill: new FormControl(this.actor.skill, Validators.required),
});

get name() { return this.actorForm.get('name'); }
get skill() { return this.actorForm.get('skill'); }
```

```html
@if (name.invalid && (name.dirty || name.touched)) {
  <div class="alert alert-danger">
    @if (name.hasError('required')) { <div>Name is required.</div> }
    @if (name.hasError('minlength')) { <div>Name must be at least 4 characters long.</div> }
    @if (name.hasError('forbiddenName')) { <div>Name cannot be Bob.</div> }
  </div>
}
```

### Validator Functions

| Validator type | Details |
| --- | --- |
| Sync validators | Take control instance, immediately return `ValidationErrors \| null`. Pass as 2nd argument to `FormControl`. |
| Async validators | Take control instance, return Promise or Observable that emits `ValidationErrors \| null`. Pass as 3rd argument. |

> Angular only runs async validators if all sync validators pass (performance optimization).

### Built-in Validators (Validators class)

Same built-in validators available as HTML attributes are available as functions from the `Validators` class: `required`, `minLength`, `maxLength`, `email`, `pattern`, `min`, `max`, etc.

## Defining Custom Validators

```typescript
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function forbiddenNameValidator(nameRe: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const forbidden = nameRe.test(control.value);
    return forbidden ? { forbiddenName: { value: control.value } } : null;
  };
}
```

- Factory function takes config (regex) and returns a `ValidatorFn`
- Validator fn receives `AbstractControl`, returns `null` (valid) or error object (invalid)
- Error object key is the validation key (e.g. `'forbiddenName'`); value is arbitrary dict for error messages

### Adding Custom Validators to Reactive Forms

Pass the function directly to `FormControl`:

```typescript
name: new FormControl(this.actor.name, [
  Validators.required,
  forbiddenNameValidator(/bob/i),
]),
```

### Adding Custom Validators to Template-Driven Forms

Create a directive that wraps the validator and registers with `NG_VALIDATORS`:

```typescript
import { Directive, forwardRef, input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appForbiddenName]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => ForbiddenValidatorDirective),
    multi: true,
  }],
})
export class ForbiddenValidatorDirective implements Validator {
  readonly forbiddenName = input<string>('', { alias: 'appForbiddenName' });

  validate(control: AbstractControl): ValidationErrors | null {
    return this.forbiddenName
      ? forbiddenNameValidator(new RegExp(this.forbiddenName(), 'i'))(control)
      : null;
  }
}
```

> Use `useExisting` (not `useClass`) so the registered validator is the same instance with bound inputs.

Apply to input:
```html
<input appForbiddenName="bob" [(ngModel)]="actor.name" name="name">
```

## Control Status CSS Classes

Angular mirrors control state as CSS classes:
- `.ng-valid` / `.ng-invalid`
- `.ng-pending`
- `.ng-pristine` / `.ng-dirty`
- `.ng-untouched` / `.ng-touched`
- `.ng-submitted` (enclosing form element only)

```css
.ng-valid[required] { border-left: 5px solid #42A948; }
.ng-invalid:not(form) { border-left: 5px solid #a94442; }
```

## Cross-Field Validation

Validate based on values of multiple sibling controls. Validator must be on a common ancestor (`FormGroup`):

### Reactive Forms

```typescript
const actorForm = new FormGroup({
  'name': new FormControl(),
  'role': new FormControl(),
  'skill': new FormControl()
}, { validators: unambiguousRoleValidator });
```

```typescript
export const unambiguousRoleValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const name = control.get('name');
  const role = control.get('role');
  return name && role && name.value === role.value ? { unambiguousRole: true } : null;
};
```

Display cross-field error:
```html
@if (actorForm.hasError('unambiguousRole') && (actorForm.touched || actorForm.dirty)) {
  <div class="alert">Name cannot match role.</div>
}
```

### Template-Driven Forms

Create a directive and add it to the `form` tag (highest level):

```typescript
@Directive({
  selector: '[appUnambiguousRole]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => UnambiguousRoleValidatorDirective),
    multi: true,
  }],
})
export class UnambiguousRoleValidatorDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    return unambiguousRoleValidator(control);
  }
}
```

```html
<form #actorForm="ngForm" appUnambiguousRole>
```

## Creating Asynchronous Validators

Implement `AsyncValidatorFn` / `AsyncValidator`. Must return a Promise or **finite** observable:

```typescript
@Injectable({ providedIn: 'root' })
export class UniqueRoleValidator implements AsyncValidator {
  private readonly actorsService = inject(ActorsService);

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    return this.actorsService.isRoleTaken(control.value).pipe(
      map((isTaken) => (isTaken ? { uniqueRole: true } : null)),
      catchError(() => of(null)), // treat errors as valid (fail open)
    );
  }
}
```

While async validation is in progress, control enters `pending` state:
```html
<input [(ngModel)]="name" #model="ngModel" appSomeAsyncValidator>
@if (model.pending) { <app-spinner /> }
```

### Adding Async Validators to Reactive Forms

```typescript
const roleControl = new FormControl('', {
  asyncValidators: [this.roleValidator.validate.bind(this.roleValidator)],
  updateOn: 'blur', // delay validation until blur
});
```

### Adding Async Validators to Template-Driven Forms

Create a directive registering with `NG_ASYNC_VALIDATORS`:

```typescript
@Directive({
  selector: '[appUniqueRole]',
  providers: [{
    provide: NG_ASYNC_VALIDATORS,
    useExisting: forwardRef(() => UniqueRoleValidatorDirective),
    multi: true,
  }],
})
export class UniqueRoleValidatorDirective implements AsyncValidator {
  private readonly validator = inject(UniqueRoleValidator);
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    return this.validator.validate(control);
  }
}
```

### Optimizing Async Validator Performance

Delay validation with `updateOn`:

```html
<!-- template-driven -->
<input [(ngModel)]="name" [ngModelOptions]="{updateOn: 'blur'}">
```

```typescript
// reactive
new FormControl('', { updateOn: 'blur' });
```

Valid values: `'change'` (default), `'blur'`, `'submit'`.

## Native HTML Form Validation

Angular disables native HTML form validation by adding `novalidate` to the `<form>` element. To use native validation alongside Angular validation:

```html
<form ngNativeValidate>
```
