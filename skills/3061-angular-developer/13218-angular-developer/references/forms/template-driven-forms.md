# Template-Driven Forms

Source: https://v20.angular.dev/guide/forms/template-driven-forms

Template-driven forms use two-way data binding to update the data model as changes are made in the template and vice versa. Best for small or simple forms.

## Key Directives (from FormsModule)

| Directive | Details |
| --- | --- |
| `NgModel` | Reconciles value changes in form element with data model. Enables input validation and error handling. |
| `NgForm` | Creates a top-level `FormGroup` and binds to `<form>` element. Active by default on all `<form>` tags when `FormsModule` is imported. |
| `NgModelGroup` | Creates and binds a `FormGroup` to a DOM element. |

## Basic Setup

Import `FormsModule` in your component:

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-actor-form',
  templateUrl: './actor-form.component.html',
  imports: [FormsModule],
})
export class ActorFormComponent {
  model = { name: 'Tom Cruise', skill: 'Dancing', studio: 'CW Productions' };
  submitted = false;

  onSubmit() { this.submitted = true; }
  newActor() { this.model = { name: '', skill: '', studio: '' }; }
}
```

## Two-Way Binding with ngModel

Use `[(ngModel)]` syntax for two-way data binding:

```html
<input type="text" [(ngModel)]="model.name" name="name">
```

**Every element using `[(ngModel)]` must have a `name` attribute** — Angular uses it to register with the parent `NgForm`.

## Accessing Overall Form Status

Use a template reference variable to access the `NgForm` directive:

```html
<form #actorForm="ngForm">
  <!-- form content -->
  <button type="submit" [disabled]="!actorForm.form.valid">Submit</button>
</form>
```

`actorForm` is now a reference to the `NgForm` directive instance governing the whole form.

## Tracking Control States

Adding `NgModel` to a control adds CSS classes describing its state:

| States | Class if true | Class if false |
| --- | --- | --- |
| Control has been visited | `ng-touched` | `ng-untouched` |
| Control value has changed | `ng-dirty` | `ng-pristine` |
| Control value is valid | `ng-valid` | `ng-invalid` |

Angular also applies `ng-submitted` to the `form` element after submission (not to controls inside).

### Visual Feedback with CSS

```css
.ng-valid[required] { border-left: 5px solid #42A948; /* green */ }
.ng-invalid:not(form) { border-left: 5px solid #a94442; /* red */ }
```

## Showing Validation Error Messages

Export `NgModel` to a template reference variable with `#name="ngModel"`, then check control state:

```html
<input type="text" [(ngModel)]="model.name" name="name" required #name="ngModel">
<div [hidden]="name.valid || name.pristine" class="alert alert-danger">
  Name is required
</div>
```

Hide the message while `pristine` to avoid showing errors on untouched fields.

## Handling Form Submission with ngSubmit

```html
<form (ngSubmit)="onSubmit()" #actorForm="ngForm">
  <!-- form controls -->
  <button type="submit" [disabled]="!actorForm.form.valid">Submit</button>
</form>
```

## Resetting Form State

Call `reset()` on the form to restore pristine state:

```html
<button type="button" (click)="newActor(); actorForm.reset()">New Actor</button>
```

Without `reset()`, the form remembers previous dirty/touched state even after clearing values.

## Tracking Form Submission State

Angular applies `ng-submitted` class to `form` elements after submission. Use `submitted` flag to show/hide content:

```html
<div [hidden]="submitted">
  <!-- form -->
</div>
<div [hidden]="!submitted">
  <!-- submitted confirmation -->
  <button (click)="submitted=false">Edit</button>
</div>
```

## Complete Example

```html
<form (ngSubmit)="onSubmit()" #actorForm="ngForm">
  <div class="form-group">
    <label for="name">Name</label>
    <input type="text" class="form-control" id="name"
           required [(ngModel)]="model.name" name="name"
           #name="ngModel">
    <div [hidden]="name.valid || name.pristine" class="alert alert-danger">
      Name is required
    </div>
  </div>

  <div class="form-group">
    <label for="skill">Skill</label>
    <select class="form-control" id="skill"
            required [(ngModel)]="model.skill" name="skill"
            #skill="ngModel">
      @for (skill of skills; track $index) {
        <option [value]="skill">{{ skill }}</option>
      }
    </select>
    <div [hidden]="skill.valid || skill.pristine" class="alert alert-danger">
      Skill is required
    </div>
  </div>

  <button type="submit" class="btn btn-success"
          [disabled]="!actorForm.form.valid">Submit</button>
  <button type="button" (click)="newActor(); actorForm.reset()">New Actor</button>
</form>
```

## Summary of Key Patterns

- Import `FormsModule` (not `ReactiveFormsModule`)
- Use `[(ngModel)]` for two-way binding
- Always include `name` attribute on bound inputs
- Use `#formRef="ngForm"` for form-level access
- Use `#controlRef="ngModel"` for control-level access
- Check `.valid`, `.dirty`, `.touched`, `.pristine` for state
- Call `form.reset()` to restore pristine state after programmatic changes
