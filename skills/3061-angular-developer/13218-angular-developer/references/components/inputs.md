# Accepting Data with Input Properties

Source: https://v20.angular.dev/guide/components/inputs

Inputs are how components accept data from their parents. Similar to *props* in other frameworks.

## Signal-Based Inputs (Recommended)

```typescript
import { Component, input } from '@angular/core';

@Component({/*...*/})
export class CustomSlider {
  // Declare an input named 'value' with a default value of zero.
  value = input(0);
}
```

```html
<custom-slider [value]="50" />
```

- `input()` returns an `InputSignal` — read the value by calling the signal: `this.value()`
- TypeScript infers type from default value → `InputSignal<number>`
- Without a default: `value = input<number>()` → `InputSignal<number | undefined>`
- Signals created by `input()` are **read-only**
- Inputs are recorded **statically at compile-time** — cannot be added/removed at runtime
- `input` can **only** be called in component and directive property initializers
- **Input names are case-sensitive**
- **Inputs are inherited** by child classes

### Required Inputs

```typescript
@Component({/*...*/})
export class CustomSlider {
  value = input.required<number>(); // InputSignal<number> — no undefined
}
```

Angular enforces at **build-time** that required inputs must be set when the component is used.

## Configuring Inputs

### Input Transforms

Transform the value when Angular sets it:

```typescript
@Component({ selector: 'custom-slider' })
export class CustomSlider {
  label = input('', { transform: trimString });
}
function trimString(value: string | undefined): string {
  return value?.trim() ?? '';
}
```

- The transform function's **parameter type** determines what types are accepted in templates
- Transform functions must be **statically analyzable at build-time**
- Transform functions should be **pure functions**

#### Built-in Transforms

```typescript
import { Component, input, booleanAttribute, numberAttribute } from '@angular/core';

@Component({/*...*/})
export class CustomSlider {
  disabled = input(false, { transform: booleanAttribute });
  value = input(0, { transform: numberAttribute });
}
```

- `booleanAttribute`: presence = `true`; literal string `"false"` = `false`
- `numberAttribute`: parses to number, produces `NaN` if parsing fails

### Input Aliases

```typescript
@Component({/*...*/})
export class CustomSlider {
  value = input(0, { alias: 'sliderValue' });
}
```
```html
<custom-slider [sliderValue]="50" />
```
Alias doesn't affect TypeScript usage. Generally avoid aliasing, but useful for renaming or avoiding DOM property name collisions.

## Model Inputs (Two-Way Binding)

A special input type that lets a component **write values back** to the parent:

```typescript
@Component({ /* ... */})
export class CustomSlider {
  value = model(0);

  increment() {
    this.value.update(oldValue => oldValue + 10);
  }
}

@Component({
  template: `<custom-slider [(value)]="volume" />`,
})
export class MediaControls {
  volume = signal(0);
}
```

- Use `model()` instead of `input()`
- Write values via `.set()` or `.update()` — propagates back to the binding
- Two-way binding syntax: `[(value)]="volume"` (banana-in-a-box)
- Also works with plain JS properties (non-signal)
- Angular auto-creates a corresponding output named `<inputName>Change`
- Supports `required` and `alias` options
- Does **not** support input transforms

**When to use:** When a component needs to support two-way binding, typically for form controls (date picker, combobox, etc.).

## Decorator-Based Inputs (Legacy, Still Supported)

```typescript
@Component({...})
export class CustomSlider {
  @Input() value = 0;
  @Input({ required: true }) label = '';
  @Input({ transform: trimString }) name = '';
  @Input({ alias: 'sliderValue' }) value2 = 0;
}
```

### Getters and Setters

```typescript
export class CustomSlider {
  @Input()
  get value(): number { return this.internalValue; }
  set value(newValue: number) { this.internalValue = newValue; }
  private internalValue = 0;
}
```

> Prefer input transforms over getters/setters. Avoid costly setter logic — Angular may invoke setters multiple times.

### Declaring in `@Component` decorator (for inheritance)

```typescript
@Component({
  ...,
  inputs: ['disabled'],                       // simple
  // inputs: ['disabled: sliderDisabled'],    // with alias
})
export class CustomSlider extends BaseSlider { }
```

## Naming Guidelines

- Avoid names that collide with DOM element properties (e.g., `HTMLElement` properties)
- Don't add prefixes to input names (unlike selectors) — inputs belong to the component by definition
