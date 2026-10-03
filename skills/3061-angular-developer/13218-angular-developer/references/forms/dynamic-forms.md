# Building Dynamic Forms

Source: https://v20.angular.dev/guide/forms/dynamic-forms

Dynamic forms generate form controls at runtime from metadata — useful for questionnaires, surveys, or any form whose content changes frequently without code changes.

## Overview

Key idea: describe form controls as a data model, then generate the form from that metadata. Change the data, change the form — no code changes needed.

## Enable Reactive Forms

Dynamic forms are based on reactive forms. Import `ReactiveFormsModule`:

```typescript
import { ReactiveFormsModule } from '@angular/forms';
// Add to component's imports array
```

## Create a Form Object Model

Define a base class representing a question (form control):

```typescript
// question-base.ts
export class QuestionBase<T> {
  value: T | undefined;
  key: string;
  label: string;
  required: boolean;
  order: number;
  controlType: string;
  type: string;
  options: { key: string; value: string }[];

  constructor(options: { ... } = {}) {
    this.value = options.value;
    this.key = options.key || '';
    this.label = options.label || '';
    this.required = !!options.required;
    this.order = options.order === undefined ? 1 : options.order;
    this.controlType = options.controlType || '';
    this.type = options.type || '';
    this.options = options.options || [];
  }
}
```

### Define Control Subclasses

```typescript
// question-textbox.ts — renders as <input>
export class TextboxQuestion extends QuestionBase<string> {
  override controlType = 'textbox';
}

// question-dropdown.ts — renders as <select>
export class DropdownQuestion extends QuestionBase<string> {
  override controlType = 'dropdown';
}
```

### QuestionControlService — Build FormGroup from Metadata

```typescript
@Injectable()
export class QuestionControlService {
  toFormGroup(questions: QuestionBase<string>[]) {
    const group: any = {};
    questions.forEach((question) => {
      group[question.key] = question.required
        ? new FormControl(question.value || '', Validators.required)
        : new FormControl(question.value || '');
    });
    return new FormGroup(group);
  }
}
```

## Dynamic Form Question Component

Renders individual question based on `controlType` using `@switch`:

```typescript
// dynamic-form-question.component.ts
@Component({
  selector: 'app-question',
  templateUrl: './dynamic-form-question.component.html',
  imports: [ReactiveFormsModule],
})
export class DynamicFormQuestionComponent {
  readonly question = input.required<QuestionBase<string>>();
  readonly form = input.required<FormGroup>();

  get isValid() {
    return this.form().controls[this.question().key].valid;
  }
}
```

```html
<!-- dynamic-form-question.component.html -->
<div [formGroup]="form()">
  <label [attr.for]="question().key">{{ question().label }}</label>
  <div>
    @switch (question().controlType) {
      @case ('textbox') {
        <input [formControlName]="question().key"
               [id]="question().key"
               [type]="question().type" />
      }
      @case ('dropdown') {
        <select [id]="question().key" [formControlName]="question().key">
          @for (opt of question().options; track opt) {
            <option [value]="opt.key">{{ opt.value }}</option>
          }
        </select>
      }
    }
  </div>
  @if (!isValid) {
    <div class="errorMessage">{{ question().label }} is required</div>
  }
</div>
```

## Dynamic Form Container Component

Uses `computed()` signal to build `FormGroup` reactively from `questions` input:

```typescript
// dynamic-form.component.ts
@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  providers: [QuestionControlService],
  imports: [DynamicFormQuestionComponent, ReactiveFormsModule],
})
export class DynamicFormComponent {
  private readonly qcs = inject(QuestionControlService);
  readonly questions = input<QuestionBase<string>[] | null>([]);
  readonly form = computed<FormGroup>(() =>
    this.qcs.toFormGroup(this.questions() as QuestionBase<string>[])
  );
  payLoad = '';

  onSubmit() {
    this.payLoad = JSON.stringify(this.form().getRawValue());
  }
}
```

```html
<!-- dynamic-form.component.html -->
<form (ngSubmit)="onSubmit()" [formGroup]="form()">
  @for (question of questions(); track question) {
    <div class="form-row">
      <app-question [question]="question" [form]="form()" />
    </div>
  }
  <div class="form-row">
    <button type="submit" [disabled]="!form().valid">Save</button>
  </div>
</form>
@if (payLoad) {
  <div class="form-row">
    <strong>Saved the following values</strong><br />{{ payLoad }}
  </div>
}
```

## Supply Question Data via Service

```typescript
@Injectable()
export class QuestionService {
  getQuestions() {
    const questions: QuestionBase<string>[] = [
      new DropdownQuestion({
        key: 'favoriteAnimal',
        label: 'Favorite Animal',
        options: [
          { key: 'cat', value: 'Cat' },
          { key: 'dog', value: 'Dog' },
          { key: 'horse', value: 'Horse' },
        ],
        order: 3,
      }),
      new TextboxQuestion({
        key: 'firstName',
        label: 'First name',
        value: 'Alex',
        required: true,
        order: 1,
      }),
      new TextboxQuestion({
        key: 'emailAddress',
        label: 'Email',
        type: 'email',
        order: 2,
      }),
    ];
    return of(questions.sort((a, b) => a.order - b.order));
  }
}
```

## Wire Up in AppComponent

```typescript
@Component({
  selector: 'app-root',
  template: `
    <div>
      <h2>Job Application for Heroes</h2>
      <app-dynamic-form [questions]="questions$ | async" />
    </div>
  `,
  providers: [QuestionService],
  imports: [AsyncPipe, DynamicFormComponent],
})
export class AppComponent {
  questions$: Observable<QuestionBase<string>[]> = inject(QuestionService).getQuestions();
}
```

## Key Patterns

- **Separation of model and data** — reuse form components for any survey compatible with the question object model
- **Metadata-driven rendering** — no hardcoded assumptions in the template; control type, validation, and labels come from the data model
- **Save button disabled until valid** — enforced via `[disabled]="!form().valid"`
- **Add new question types** — extend `QuestionBase`, add a new `@case` in the question component template
- **Change form content** — add/update/remove objects in the `questions` array from `QuestionService`; no component code changes needed
