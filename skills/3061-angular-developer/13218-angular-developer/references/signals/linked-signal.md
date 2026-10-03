# Angular Signals — `linkedSignal`

> Source: https://v20.angular.dev/guide/signals/linked-signal

---

## The Problem

Sometimes a piece of state depends on another signal, but also needs to be independently writable. A plain `signal()` won't reset when its source changes. A `computed()` resets but is read-only. `linkedSignal` fills the gap.

**Example:** a selected shipping option that should default to the first option whenever the list changes, but can also be changed by the user:

```ts
@Component({/* ... */})
export class ShippingMethodPicker {
  shippingOptions: Signal<ShippingMethod[]> = getShippingOptions();

  // Resets to first option whenever shippingOptions changes, but still writable
  selectedOption = linkedSignal(() => this.shippingOptions()[0]);

  changeShipping(index: number) {
    this.selectedOption.set(this.shippingOptions()[index]);
  }
}
```

---

## Basic Usage (Computation Shorthand)

Pass a computation function — just like `computed()` — instead of a static value:

```ts
const shippingOptions = signal(['Ground', 'Air', 'Sea']);
const selectedOption = linkedSignal(() => shippingOptions()[0]);

console.log(selectedOption()); // 'Ground'

selectedOption.set(shippingOptions()[2]);
console.log(selectedOption()); // 'Sea'

shippingOptions.set(['Email', 'Will Call', 'Postal service']);
console.log(selectedOption()); // 'Email' — reset by source change
```

Key difference from `computed`: `linkedSignal` is **writable**. The user can override the value, but a source change resets it back to the computation result.

---

## Accounting for Previous State (Source + Computation Form)

When the computation needs access to the previous value of the `linkedSignal`, use the object form with separate `source` and `computation` properties:

```ts
interface ShippingMethod {
  id: number;
  name: string;
}

selectedOption = linkedSignal<ShippingMethod[], ShippingMethod>({
  // Runs computation whenever this signal changes
  source: this.shippingOptions,
  computation: (newOptions, previous) => {
    // Preserve the user's current selection if it still exists in the new list
    return newOptions.find(opt => opt.id === previous?.value.id) ?? newOptions[0];
  },
});
```

### `source`

Any signal — `signal()`, `computed()`, `input()`, etc. When its value changes, the `computation` re-runs.

### `computation(newSourceValue, previous)`

| Parameter | Description |
|---|---|
| `newSourceValue` | The new value of `source` |
| `previous.source` | The previous value of `source` |
| `previous.value` | The previous value of the `linkedSignal` itself |

> **Note:** When using `previous`, you must provide explicit generic type arguments: `linkedSignal<SourceType, OutputType>({ ... })`.

### Full example

```ts
@Component({/* ... */})
export class ShippingMethodPicker {
  shippingOptions = signal<ShippingMethod[]>([
    { id: 0, name: 'Ground' },
    { id: 1, name: 'Air' },
    { id: 2, name: 'Sea' },
  ]);

  selectedOption = linkedSignal<ShippingMethod[], ShippingMethod>({
    source: this.shippingOptions,
    computation: (newOptions, previous) => {
      return newOptions.find(opt => opt.id === previous?.value.id) ?? newOptions[0];
    },
  });

  changeShipping(index: number) {
    this.selectedOption.set(this.shippingOptions()[index]);
  }

  changeShippingOptions() {
    this.shippingOptions.set([
      { id: 0, name: 'Email' },
      { id: 1, name: 'Sea' },
      { id: 2, name: 'Postal Service' },
    ]);
  }
}

// Usage:
// changeShipping(2)       → selectedOption = { id: 2, name: 'Sea' }
// changeShippingOptions() → selectedOption = { id: 2, name: 'Postal Service' } (id preserved)
```

---

## Custom Equality

Like any signal, `linkedSignal` can be configured with a custom equality function used by downstream dependencies to determine if the value changed:

```ts
// Shorthand form
const activeUserEditCopy = linkedSignal(() => activeUser(), {
  equal: (a, b) => a.id === b.id,
});

// Source + computation form
const activeUserEditCopy = linkedSignal({
  source: activeUser,
  computation: user => user,
  equal: (a, b) => a.id === b.id,
});
```

---

## Summary

| Feature | `signal()` | `computed()` | `linkedSignal()` |
|---|---|---|---|
| Writable | ✅ | ❌ | ✅ |
| Resets when source changes | ❌ | ✅ | ✅ |
| Access to previous value | ❌ | ❌ | ✅ (source+computation form) |
| Custom equality | ✅ | ✅ | ✅ |
