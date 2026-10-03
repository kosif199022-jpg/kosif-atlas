# Component Host Elements

Source: https://v20.angular.dev/guide/components/host-elements

Angular creates a component instance for every HTML element matching the component's selector. That DOM element is the component's **host element**. The component's template is rendered inside its host element.

```html
<!-- Using the component -->
<profile-photo />

<!-- Rendered DOM -->
<profile-photo>
  <img src="profile-photo.jpg" alt="Your profile photo" />
</profile-photo>
```

## Binding to the Host Element

Use the `host` property in `@Component` to bind properties, attributes, styles, and events to the host element:

```typescript
@Component({
  ...,
  host: {
    'role': 'slider',                              // static attribute
    '[attr.aria-valuenow]': 'value',               // attribute binding
    '[class.active]': 'isActive()',                // class binding
    '[style.background]': `hasError() ? 'red' : 'green'`, // style binding
    '[tabIndex]': 'disabled ? -1 : 0',             // property binding
    '(keydown)': 'updateValue($event)',            // event listener
  },
})
export class CustomSlider {
  value: number = 0;
  disabled: boolean = false;
  isActive = signal(false);
  hasError = signal(false);
  updateValue(event: KeyboardEvent) { /* ... */ }
}
```

### CSS Custom Properties on Host

```typescript
@Component({
  host: {
    '[style.--my-background]': 'color()',
  }
})
export class MyComponent {
  color = signal('lightgreen');
}
```

Sets a CSS custom property on the host element. Value updates automatically when the signal changes. Affects the component and all children that use the custom property.

### Setting Custom Properties on Child Component Hosts

```typescript
@Component({
  selector: 'my-component',
  template: `<my-child [style.--my-background]="color()">`,
})
export class MyComponent {
  color = signal('lightgreen');
}
```

## `@HostBinding` and `@HostListener` Decorators

> **Always prefer using the `host` property.** These decorators exist for backwards compatibility only.

```typescript
@Component({ /* ... */ })
export class CustomSlider {
  @HostBinding('attr.aria-valuenow')
  value: number = 0;

  @HostBinding('tabIndex')
  get tabIndex() {
    return this.disabled ? -1 : 0;
  }

  @HostListener('keydown', ['$event'])
  updateValue(event: KeyboardEvent) { /* ... */ }
}
```

## Binding Collisions

When a template binding on a component instance conflicts with the component's own host binding:

| Scenario | Winner |
|----------|--------|
| Both static | Instance binding wins |
| One static, one dynamic | Dynamic value wins |
| Both dynamic | Component's host binding wins |

```typescript
@Component({
  host: {
    'role': 'presentation',  // static
    '[id]': 'id',            // dynamic
  }
})
export class ProfilePhoto { }
```

```html
<profile-photo role="group" [id]="otherId" />
<!-- role="group" wins (instance static beats host static) -->
<!-- otherId wins for [id] (both dynamic → host binding wins... wait: both dynamic → component host wins) -->
```

## Injecting Host Element Attributes

Read static attributes from the host element using `HostAttributeToken` with `inject()`:

```typescript
import { Component, HostAttributeToken, inject } from '@angular/core';

@Component({
  selector: 'app-button',
  ...,
})
export class Button {
  variation = inject(new HostAttributeToken('variation'));
}
```

```html
<app-button variation="primary">Click me</app-button>
```

> `HostAttributeToken` throws an error if the attribute is missing, unless the injection is marked as optional.
