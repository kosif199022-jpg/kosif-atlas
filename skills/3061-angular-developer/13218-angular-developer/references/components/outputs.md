# Custom Events with Outputs

Source: https://v20.angular.dev/guide/components/outputs

Angular components define custom events by assigning a property to the `output()` function:

```typescript
@Component({/*...*/})
export class ExpandablePanel {
  panelClosed = output<void>();
}
```

```html
<expandable-panel (panelClosed)="savePanelState()" />
```

- `output()` returns an `OutputEmitterRef`
- Emit an event by calling `.emit()` on it
- **Angular custom events do not bubble up the DOM**
- **Output names are case-sensitive**
- **Outputs are inherited** by child classes
- `output` can **only** be called in component and directive property initializers

## Emitting Event Data

```typescript
// Primitive value
this.valueChanged.emit(7);

// Custom event object
this.thumbDropped.emit({
  pointerX: 123,
  pointerY: 456,
});
```

Access event data in a template via `$event`:
```html
<custom-slider (valueChanged)="logValue($event)" />
```

```typescript
@Component({ /*...*/ })
export class App {
  logValue(value: number) { ... }
}
```

## Customizing Output Names (Aliases)

```typescript
@Component({/*...*/})
export class CustomSlider {
  changed = output({ alias: 'valueChanged' });
}
```
```html
<custom-slider (valueChanged)="saveVolume()" />
```

Alias doesn't affect TypeScript usage. Generally avoid aliasing, but useful for renaming or avoiding native DOM event name collisions.

## Subscribing to Outputs Programmatically

When creating components dynamically, use the `subscribe` method on `OutputRef`:

```typescript
const someComponentRef: ComponentRef<SomeComponent> = viewContainerRef.createComponent(/*...*/);
someComponentRef.instance.someEventProperty.subscribe(eventData => {
  console.log(eventData);
});
```

- Angular auto-cleans up subscriptions when the component is destroyed
- Manual unsubscribe: `subscribe()` returns `OutputRefSubscription` with `.unsubscribe()`

```typescript
const eventSubscription = someComponent.someEventProperty.subscribe(eventData => {
  console.log(eventData);
});
// ...
eventSubscription.unsubscribe();
```

## Naming Guidelines

- Avoid names that collide with DOM element events (e.g., `HTMLElement` events)
- Don't add component selector prefixes to output names
- Always use **camelCase**
- Avoid prefixing with "on" (bad: `onPanelClosed`, good: `panelClosed`)

## RxJS Interop

See [RxJS interop with component and directive outputs](https://v20.angular.dev/ecosystem/rxjs-interop/output-interop) for interoperability between outputs and RxJS Observables.

## Decorator-Based Outputs (Legacy, Still Supported)

```typescript
@Component({/*...*/})
export class ExpandablePanel {
  @Output() panelClosed = new EventEmitter<void>();
}
```

### Aliases with `@Output`

```typescript
@Component({/*...*/})
export class CustomSlider {
  @Output('valueChanged') changed = new EventEmitter<number>();
}
```

### Declaring in `@Component` decorator (for inheritance)

```typescript
// `CustomSlider` inherits the `valueChanged` property from `BaseSlider`.
@Component({
  /*...*/
  outputs: ['valueChanged'],
  // outputs: ['valueChanged: volumeChanged'],  // with alias
})
export class CustomSlider extends BaseSlider {}
```
