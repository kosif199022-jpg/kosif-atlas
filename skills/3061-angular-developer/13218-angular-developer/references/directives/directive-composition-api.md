# Directive Composition API

Source: https://v20.angular.dev/guide/directives/directive-composition-api

The directive composition API lets you apply directives to a component's host element from within the component TypeScript class, using `hostDirectives`.

## Adding Directives to a Component

```ts
@Component({
  selector: 'admin-menu',
  template: 'admin-menu.html',
  hostDirectives: [MenuBehavior],
})
export class AdminMenu { }
```

Angular creates an instance of each host directive when the component renders. Host directive bindings apply to the component's host element.

**Key rules:**
- Host directive inputs and outputs are **not** exposed as part of the component's public API by default.
- Angular applies host directives **statically at compile time** — no dynamic addition at runtime.
- Directives used in `hostDirectives` may **not** specify `standalone: false`.
- Angular **ignores the `selector`** of directives applied via `hostDirectives`.

## Including Inputs and Outputs

Explicitly include inputs/outputs to expose them in the component's API:

```ts
@Component({
  selector: 'admin-menu',
  template: 'admin-menu.html',
  hostDirectives: [{
    directive: MenuBehavior,
    inputs: ['menuId'],
    outputs: ['menuClosed'],
  }],
})
export class AdminMenu { }
```

Template usage:
```html
<admin-menu menuId="top-menu" (menuClosed)="logMenuClosed()">
```

### Aliasing Inputs and Outputs

```ts
hostDirectives: [{
  directive: MenuBehavior,
  inputs: ['menuId: id'],       // expose menuId as 'id'
  outputs: ['menuClosed: closed'],  // expose menuClosed as 'closed'
}]
```

```html
<admin-menu id="top-menu" (closed)="logMenuClosed()">
```

## Adding Directives to Another Directive

`hostDirectives` works on directives too, enabling transitive composition:

```ts
@Directive({...})
export class Menu { }

@Directive({...})
export class Tooltip { }

@Directive({
  hostDirectives: [Tooltip, Menu],
})
export class MenuWithTooltip { }

@Directive({
  hostDirectives: [MenuWithTooltip],
})
export class SpecializedMenuWithTooltip { }
```

When `SpecializedMenuWithTooltip` is used, Angular creates instances of `Menu`, `Tooltip`, and `MenuWithTooltip` — all their host bindings apply to the same host element.

## Execution Order

Host directives execute **before** the component or directive they're applied to:

1. `MenuBehavior` instantiated
2. `AdminMenu` instantiated
3. `MenuBehavior` receives inputs (`ngOnInit`)
4. `AdminMenu` receives inputs (`ngOnInit`)
5. `MenuBehavior` applies host bindings
6. `AdminMenu` applies host bindings

This means the component can **override** any host bindings specified by a host directive.

For nested chains, the deepest directive in the chain instantiates first; bindings apply in the same innermost-first order.

## Dependency Injection with Host Directives

- A component with `hostDirectives` can **inject instances** of those host directives and vice versa.
- Both the component and its host directives can define providers.
- If both provide the same injection token, the **component's providers take precedence** over the host directives' providers.
