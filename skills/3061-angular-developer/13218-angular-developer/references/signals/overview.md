# Angular Signals — Overview

> Source: https://v20.angular.dev/guide/signals

---

## What are Signals?

A **signal** is a wrapper around a value that notifies interested consumers when that value changes. Signals can hold any value — primitives to complex data structures. You read a signal's value by calling its getter function, which allows Angular to track where the signal is used.

Signals are either *writable* or *read-only*.

---

## Writable Signals

Create with `signal()`, passing an initial value:

```ts
const count = signal(0);
console.log('The count is: ' + count()); // call it like a function to read
```

Update with `.set()` or `.update()`:

```ts
count.set(3);
count.update(value => value + 1); // compute from previous
```

Type: `WritableSignal<T>`

---

## Computed Signals

Read-only signals that derive their value from other signals. Defined with `computed()`:

```ts
const count: WritableSignal<number> = signal(0);
const doubleCount: Signal<number> = computed(() => count() * 2);
```

### Key behaviors

- **Lazily evaluated** — derivation doesn't run until first read
- **Memoized** — cached value returned on subsequent reads; only recalculates when a dependency changes
- **Not writable** — `doubleCount.set(3)` is a compile error
- **Dynamic dependencies** — only signals actually read during derivation are tracked

```ts
const showCount = signal(false);
const count = signal(0);
const conditionalCount = computed(() => {
  if (showCount()) {
    return `The count is ${count()}.`;
  } else {
    return 'Nothing to see here!'; // count() is NOT read, so not tracked as dependency
  }
});
```

---

## Reading Signals in OnPush Components

When you read a signal inside an `OnPush` component's template, Angular tracks it as a dependency of that component. When the signal changes, Angular automatically marks the component for update at the next change detection cycle.

---

## Effects

An **effect** is an operation that runs whenever one or more signal values change. Create with `effect()`:

```ts
effect(() => {
  console.log(`The current count is: ${count()}`);
});
```

### Behavior

- Always runs **at least once**
- Tracks signal reads dynamically (same as `computed`)
- Executes **asynchronously**, during the change detection process

### Use cases

- Logging/analytics when data changes
- Syncing to `window.localStorage`
- Custom DOM behavior not expressible in templates
- Rendering to `<canvas>` or third-party UI libraries

### When NOT to use effects

**Do not use effects for state propagation.** This can cause `ExpressionChangedAfterItHasBeenChecked` errors, infinite circular updates, or unnecessary change detection cycles. Use `computed()` instead.

### Injection context requirement

By default, `effect()` must be called within an injection context (component/directive/service constructor):

```ts
@Component({...})
export class EffectiveCounterComponent {
  readonly count = signal(0);

  constructor() {
    effect(() => {
      console.log(`The count is: ${this.count()}`);
    });
  }
}
```

Or assign to a field:

```ts
@Component({...})
export class EffectiveCounterComponent {
  readonly count = signal(0);
  private loggingEffect = effect(() => {
    console.log(`The count is: ${this.count()}`);
  });
}
```

To create outside the constructor, pass an `Injector`:

```ts
@Component({...})
export class EffectiveCounterComponent {
  readonly count = signal(0);
  private injector = inject(Injector);

  initializeLogging(): void {
    effect(() => {
      console.log(`The count is: ${this.count()}`);
    }, { injector: this.injector });
  }
}
```

### Destroying effects

Effects are auto-destroyed when their enclosing context is destroyed. To destroy manually:

```ts
const effectRef = effect(() => { ... });
effectRef.destroy();
```

Use the `manualCleanup: true` option to prevent auto-destroy.

### Effect cleanup functions

Register a callback that runs before the next effect execution or on destroy:

```ts
effect((onCleanup) => {
  const user = currentUser();
  const timer = setTimeout(() => {
    console.log(`1 second ago, the user became ${user}`);
  }, 1000);

  onCleanup(() => {
    clearTimeout(timer);
  });
});
```

---

## Advanced Topics

### Signal equality functions

Provide a custom equality function to control when a signal notifies consumers:

```ts
import _ from 'lodash';
const data = signal(['test'], { equal: _.isEqual });
data.set(['test']); // deep equal → no update triggered
```

Default is `Object.is()` (referential equality). Works for both writable and computed signals.

### Reading without tracking (`untracked`)

To read a signal inside `computed` or `effect` *without* creating a dependency:

```ts
effect(() => {
  // Only re-runs when currentUser changes, NOT when counter changes
  console.log(`User: ${currentUser()}, counter: ${untracked(counter)}`);
});
```

`untracked` also accepts a function:

```ts
effect(() => {
  const user = currentUser();
  untracked(() => {
    // Signals read inside here are not tracked as dependencies
    this.loggingService.log(`User set to ${user}`);
  });
});
```

---

## RxJS Interop

Use `toSignal()` and `toObservable()` from `@angular/core/rxjs-interop` to bridge between signals and RxJS. See the [RxJS interop guide](https://v20.angular.dev/ecosystem/rxjs-interop).
