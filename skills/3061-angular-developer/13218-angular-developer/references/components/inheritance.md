# Inheritance

Source: https://v20.angular.dev/guide/components/inheritance

Angular components are TypeScript classes and participate in standard JavaScript inheritance semantics.

```typescript
export class ListboxBase {
  value: string;
}

@Component({ ... })
export class CustomListbox extends ListboxBase {
  // CustomListbox inherits the `value` property.
}
```

## Extending Other Components and Directives

When a component extends another component or directive, it inherits metadata and decorated members:
- Host bindings
- Inputs
- Outputs
- Lifecycle methods

```typescript
@Component({
  selector: 'base-listbox',
  template: `...`,
  host: {
    '(keydown)': 'handleKey($event)',
  },
})
export class ListboxBase {
  value = input.required<string>();
  handleKey(event: KeyboardEvent) { /* ... */ }
}

@Component({
  selector: 'custom-listbox',
  template: `...`,
  host: {
    '(click)': 'focusActiveOption()',
  },
})
export class CustomListbox extends ListboxBase {
  disabled = input(false);
  focusActiveOption() { /* ... */ }
}
```

Result: `CustomListbox` has:
- **2 inputs**: `value` (inherited) + `disabled` (own)
- **2 event listeners**: `keydown` (inherited) + `click` (own)
- Its own `selector` and `template` override the base's

Child classes end up with the **union** of all ancestor inputs, outputs, and host bindings plus their own.

## Forwarding Injected Dependencies

If a base class injects dependencies as constructor parameters, the child class must explicitly pass them to `super`:

```typescript
@Component({ ... })
export class ListboxBase {
  constructor(private element: ElementRef) { }
}

@Component({ ... })
export class CustomListbox extends ListboxBase {
  constructor(element: ElementRef) {
    super(element);
  }
}
```

## Overriding Lifecycle Methods

A child class that implements the same lifecycle method as a base class **overrides** it. To preserve the base class behavior, call `super`:

```typescript
@Component({ ... })
export class ListboxBase {
  protected isInitialized = false;
  ngOnInit() {
    this.isInitialized = true;
  }
}

@Component({ ... })
export class CustomListbox extends ListboxBase {
  override ngOnInit() {
    super.ngOnInit();  // Call base class implementation
    /* ... */
  }
}
```
