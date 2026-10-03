# Component Lifecycle

Source: https://v20.angular.dev/guide/components/lifecycle

A component's **lifecycle** is the sequence of steps between creation and destruction. Implement **lifecycle hooks** as methods on your component class to run code during these steps.

Angular walks the application tree top-to-bottom checking template bindings for changes. The lifecycle hooks run during this traversal. Each component is visited **exactly once** per traversal — avoid making further state changes mid-traversal.

## Lifecycle Hooks Summary

| Phase | Method | Summary |
|-------|--------|---------|
| Creation | `constructor` | Standard JS class constructor. Runs when Angular instantiates the component. |
| Change Detection | `ngOnInit` | Runs **once** after Angular initializes all component inputs. |
| | `ngOnChanges` | Runs every time the component's inputs change. |
| | `ngDoCheck` | Runs every time this component is checked for changes. |
| | `ngAfterContentInit` | Runs **once** after the component's *content* (projected) has been initialized. |
| | `ngAfterContentChecked` | Runs every time this component's content has been checked for changes. |
| | `ngAfterViewInit` | Runs **once** after the component's *view* has been initialized. |
| | `ngAfterViewChecked` | Runs every time the component's view has been checked for changes. |
| Rendering | `afterNextRender` | Runs **once** the next time **all** components are rendered to the DOM. |
| | `afterEveryRender` | Runs **every time** all components are rendered to the DOM. |
| Destruction | `ngOnDestroy` | Runs **once** before the component is destroyed. |

## Lifecycle Hook Details

### `ngOnInit`
- Runs exactly **once** after all inputs are initialized with their initial values
- Runs **before** the component's own template is initialized
- You can update component state based on initial input values

### `ngOnChanges`
- Runs after any inputs have changed
- Runs before the component's template is checked
- First `ngOnChanges` runs **before** `ngOnInit` during initialization

Receives a `SimpleChanges` argument:
```typescript
@Component({ /* ... */ })
export class UserProfile {
  name = input('');

  ngOnChanges(changes: SimpleChanges) {
    for (const inputName in changes) {
      const inputValues = changes[inputName];
      console.log(`Previous ${inputName} == ${inputValues.previousValue}`);
      console.log(`Current ${inputName} == ${inputValues.currentValue}`);
      console.log(`Is first ${inputName} change == ${inputValues.firstChange}`);
    }
  }
}
```
> `SimpleChanges` keys use **TypeScript property names**, not aliases.

### `ngOnDestroy`
- Runs once just before the component is destroyed
- Component is destroyed when hidden by `@if` or when navigating away

#### `DestroyRef` alternative
```typescript
@Component({ /* ... */ })
export class UserProfile {
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      console.log('UserProfile destruction');
    });
  }
}
```
- Can be passed to functions/classes outside the component
- Keeps cleanup code close to setup code
- Has a `destroyed` property to check if instance is already destroyed

### `ngDoCheck`
- Runs before every change detection check
- Use to manually check state outside Angular's normal change detection
- Runs very frequently — **avoid unless no alternative**
- First `ngDoCheck` runs after `ngOnInit`

### `ngAfterContentInit`
- Runs once after all projected content children are initialized
- Access [content queries](https://v20.angular.dev/guide/components/queries#content-queries) here
- **Do not change state** here → causes `ExpressionChangedAfterItHasBeenCheckedError`

### `ngAfterContentChecked`
- Runs every time projected content is checked for changes
- Very frequent — **avoid unless no alternative**
- Do not change state here

### `ngAfterViewInit`
- Runs once after all children in the component's template are initialized
- Access [view queries](https://v20.angular.dev/guide/components/queries#view-queries) here
- Do not change state here

### `ngAfterViewChecked`
- Runs every time the component's view is checked for changes
- Very frequent — **avoid unless no alternative**
- Do not change state here

### `afterNextRender` and `afterEveryRender`

These are **standalone functions** (not class methods) that accept a callback. Not tied to a specific component instance — application-wide hooks.

- Must be called in an **injection context** (typically the constructor)
- Use for manual DOM operations
- Do **not** run during SSR or build-time pre-rendering

```typescript
@Component({...})
export class UserProfile {
  constructor() {
    private elementRef = inject(ElementRef);
    afterNextRender({
      write: () => {
        const padding = computePadding();
        const changed = padding !== this.prevPadding;
        if (changed) {
          nativeElement.style.padding = padding;
        }
        return changed;
      },
      read: (didWrite) => {
        if (didWrite) {
          this.elementHeight = nativeElement.getBoundingClientRect().height;
        }
      }
    });
  }
}
```

#### Render Phases (in order)

| Phase | Description |
|-------|-------------|
| `earlyRead` | Read layout-affecting DOM properties strictly necessary for subsequent calculation. Avoid if possible. |
| `mixedReadWrite` | Default phase. For operations that must both read and write layout-affecting properties. Avoid if possible. |
| `write` | Write layout-affecting DOM properties and styles. |
| `read` | Read layout-affecting DOM properties (after all writes). |

A phase function may return a value accessible in the next phase.

## Lifecycle Interfaces

```typescript
@Component({ /* ... */ })
export class UserProfile implements OnInit {
  ngOnInit() { /* ... */ }
}
```

Each interface matches the method name minus the `ng` prefix: `ngOnInit` → `OnInit`.

## Execution Order

### During Initialization
`constructor` → `ngOnChanges` → `ngOnInit` → `ngDoCheck` → `ngAfterContentInit` → `ngAfterContentChecked` → `ngAfterViewInit` → `ngAfterViewChecked` → `afterNextRender` / `afterEveryRender`

### Subsequent Updates
`ngOnChanges` → `ngDoCheck` → `ngAfterContentChecked` → `ngAfterViewChecked` → `afterEveryRender`

### Ordering with Directives

Angular does **not guarantee** any ordering of lifecycle hooks between a component and directives on the same element. Never depend on observed ordering.
