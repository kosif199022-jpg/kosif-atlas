# Skipping Component Subtrees

Source: https://v20.angular.dev/best-practices/skipping-subtrees

---

## Why Skip Subtrees?

Angular runs change detection over the entire component tree by default. For large trees this can cause performance issues. `OnPush` lets you skip entire subtrees when their state hasn't changed.

---

## Using OnPush

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent {}
```

`OnPush` components only run change detection when:
1. The root of the subtree receives **new inputs** from a template binding (Angular compares with `==`)
2. Angular handles an **event** in the subtree's root component or any of its children

---

## Common Change Detection Scenarios

### Default Component Handles Event
- Angular runs CD on the entire component tree
- Skips `OnPush` subtrees that haven't received new inputs

### OnPush Component Handles Event
- Angular runs CD on the entire tree
- Ignores `OnPush` subtrees outside the component that handled the event

### Descendant of OnPush Handles Event
- Angular runs CD in the entire subtree **including ancestors** of the OnPush component
- Even parent `OnPush` components are checked because the child is part of their view

### New Inputs to OnPush Component
- Angular runs CD within that `OnPush` component
- Does NOT run CD in nested `OnPush` components unless they also receive new inputs

---

## Edge Cases

### Manually Modified @Input via ViewChild/ContentChild

When you modify an `@Input` property directly in TypeScript (not via template binding), Angular won't auto-run CD for OnPush components. Fix:

```ts
private changeDetectorRef = inject(ChangeDetectorRef);

updateValue() {
  this.childRef.someInput = newValue;
  this.changeDetectorRef.markForCheck(); // Explicitly schedule CD
}
```

### Mutating Object References

If an input receives a mutable object and you mutate it without changing the reference, `OnPush` won't trigger CD — the current and previous values point to the same reference. This is expected behavior.

**Fix**: Create a new object reference:
```ts
// WRONG — OnPush won't detect this
this.data.value = newValue;

// CORRECT — new reference triggers OnPush
this.data = { ...this.data, value: newValue };
```
