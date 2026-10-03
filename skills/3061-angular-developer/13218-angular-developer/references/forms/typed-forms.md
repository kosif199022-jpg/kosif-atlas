# Strictly Typed Reactive Forms

Source: https://v20.angular.dev/guide/forms/typed-forms

As of Angular 14, reactive forms are strictly typed by default.

## Overview

Previously, most form APIs included `any` in their types. Now interacting with form structure and values is type-safe.

```typescript
// This no longer compiles — no 'domain' property on email
const emailDomain = login.value.email.domain; // ERROR
```

Benefits: better autocomplete in IDEs, explicit form structure, added safety.

> Strict types apply only to **reactive forms** — not template-driven forms.

## Untyped Forms (Legacy)

Still supported. Import `Untyped` symbols from `@angular/forms`:

```typescript
const login = new UntypedFormGroup({
  email: new UntypedFormControl(''),
  password: new UntypedFormControl(''),
});
```

Remove `Untyped` prefixes incrementally to enable strict types.

## FormControl: Getting Started

```typescript
const email = new FormControl('angularrox@gmail.com');
// Inferred type: FormControl<string | null>
```

TypeScript enforces the type throughout the `FormControl` API (`email.value`, `email.valueChanges`, `email.setValue(...)`, etc.).

### Nullability

Controls include `null` because calling `reset()` sets value to `null`:

```typescript
const email = new FormControl('angularrox@gmail.com');
email.reset();
console.log(email.value); // null
```

Use `nonNullable` option to reset to initial value instead:

```typescript
const email = new FormControl('angularrox@gmail.com', { nonNullable: true });
email.reset();
console.log(email.value); // 'angularrox@gmail.com'
```

### Specifying an Explicit Type

When initialized to `null`, TypeScript infers `FormControl<null>` (too narrow). Specify explicitly:

```typescript
// ERROR — can't call setValue with string
const email = new FormControl(null);
email.setValue('angularrox@gmail.com');

// CORRECT — explicitly type as string|null
const email = new FormControl<string | null>(null);
email.setValue('angularrox@gmail.com');
```

## FormArray: Dynamic, Homogenous Collections

Type parameter corresponds to the type of each inner control:

```typescript
const names = new FormArray([new FormControl('Alex')]);
names.push(new FormControl('Jess'));
// Inner controls type: FormControl<string | null>
```

Add multiple at once:
```typescript
aliases.push([new FormControl('ngDev'), new FormControl('ngAwesome')]);
```

> If you need multiple **different** element types in an array, use `UntypedFormArray`.

## FormGroup and FormRecord

### Partial Values

Disabled controls don't appear in the group's value, so `login.value` is typed as `Partial<{email: string, password: string}>`.

- `login.value.email` is `string | undefined`
- Use `login.getRawValue()` to include disabled controls (bypasses `undefined` fields)

### Optional Controls and Dynamic Groups

Use optional fields in an interface to allow adding/removing controls at runtime:

```typescript
interface LoginForm {
  email: FormControl<string>;
  password?: FormControl<string>; // optional — can be removed
}

const login = new FormGroup<LoginForm>({
  email: new FormControl('', { nonNullable: true }),
  password: new FormControl('', { nonNullable: true }),
});

login.removeControl('password'); // TypeScript allows this for optional controls
```

### FormRecord

For open-ended groups where keys aren't known ahead of time:

```typescript
const addresses = new FormRecord<FormControl<string | null>>({});
addresses.addControl('Andrew', new FormControl('2340 Folsom St'));
```

> If you need a `FormGroup` that is both dynamic (open-ended) **and** heterogeneous (different control types), use `UntypedFormGroup`.

Build with `FormBuilder`:
```typescript
const addresses = fb.record({ 'Andrew': '2340 Folsom St' });
```

## FormBuilder and NonNullableFormBuilder

`FormBuilder` supports the new types the same way as manual instantiation.

`NonNullableFormBuilder` — shorthand for `{ nonNullable: true }` on every control:

```typescript
const fb = new FormBuilder();
const login = fb.nonNullable.group({
  email: '',
  password: '',
});
// Both controls are non-nullable
```

Can also be injected by name `NonNullableFormBuilder`.
