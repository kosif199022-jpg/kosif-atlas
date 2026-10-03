# Advanced Component Configuration

Source: https://v20.angular.dev/guide/components/advanced-configuration

## ChangeDetectionStrategy

The `@Component` decorator accepts a `changeDetection` option to control how and when Angular checks the component's DOM for updates.

### `ChangeDetectionStrategy.Default`

Angular checks the component's DOM whenever **any activity may have occurred application-wide**: user interaction, network responses, timers, etc.

### `ChangeDetectionStrategy.OnPush`

Reduces the amount of checking Angular performs. Angular only checks if the component's DOM needs an update when:

1. A component **input has changed** as a result of a binding in a template
2. An **event listener** in this component runs
3. The component is **explicitly marked for check** via `ChangeDetectorRef.markForCheck()` or something that wraps it (like `AsyncPipe`)

Additionally, when an OnPush component is checked, Angular also checks all its **ancestor components** (traverses upward through the application tree).

```typescript
@Component({
  selector: 'my-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class MyComponent { }
```

## PreserveWhitespaces

By default, Angular removes and collapses superfluous whitespace in templates (mostly from newlines and indentation).

```typescript
@Component({
  ...,
  preserveWhitespaces: true,  // keep whitespace as-is
})
export class MyComponent { }
```

## Custom Element Schemas

By default, Angular throws an error when it encounters an unknown HTML element. To disable this for a component (e.g., when using Web Components):

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  ...,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: '<some-unknown-component></some-unknown-component>'
})
export class ComponentWithCustomElements { }
```

> Angular does not support any other schemas at this time.
