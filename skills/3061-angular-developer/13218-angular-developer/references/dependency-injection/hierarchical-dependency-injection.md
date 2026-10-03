# Hierarchical Dependency Injection

Source: https://v20.angular.dev/guide/di/hierarchical-dependency-injection

## Two Injector Hierarchies

| Hierarchy | Configuration |
|---|---|
| `EnvironmentInjector` | Via `@Injectable({ providedIn })` or `ApplicationConfig.providers` |
| `ElementInjector` | Created implicitly at each DOM element; configured via `providers` in `@Component` or `@Directive` |

## EnvironmentInjector

Configure via:
- `@Injectable({ providedIn: 'root' })` — available app-wide
- `@Injectable({ providedIn: 'platform' })` — shared across multiple apps
- `ApplicationConfig.providers` array

```ts
@Injectable({ providedIn: 'root' })
export class ItemService { name = 'telephone'; }
```

## Injector Tree (top to bottom)

```
NullInjector (always throws unless @Optional)
    └── platform EnvironmentInjector
          └── root EnvironmentInjector (from bootstrapApplication/AppConfig)
                └── ElementInjector tree (mirrors component tree)
```

`bootstrapApplication` creates the root `EnvironmentInjector`. The platform injector is created by `platformBrowserDynamic()`.

### @Injectable() vs. ApplicationConfig

If you configure the same token in both, `ApplicationConfig` overrides `@Injectable` metadata. Use this to configure non-default providers:

```ts
providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }]
```

## ElementInjector

Created implicitly for each DOM element. `@Component` and `@Directive` configure it via `providers` or `viewProviders`:

```ts
@Component({
  providers: [{ provide: ItemService, useValue: { name: 'lamp' } }]
})
export class TestComponent { }
```

When the component instance is destroyed, so is the service instance.

## Resolution Rules

When resolving a token, Angular uses two phases:

1. Walk up the `ElementInjector` hierarchy from the component
2. If not found, look in the `EnvironmentInjector` hierarchy

The first matching provider wins. If nothing is found, Angular throws (unless `optional: true`).

## Resolution Modifiers

Import from `@angular/core`, pass as second argument to `inject()`:

### `optional`

Returns `null` instead of throwing if the dependency can't be resolved:

```ts
export class OptionalComponent {
  public optional? = inject(OptionalService, { optional: true });
}
```

### `self`

Only look in the current element's `ElementInjector` — don't walk up the tree:

```ts
export class SelfNoDataComponent {
  public leaf = inject(LeafService, { optional: true, self: true });
}
```

Use case: inject a service only if it's provided on the current host element.

### `skipSelf`

Start the search at the **parent** `ElementInjector`, skipping the current element:

```ts
@Component({
  providers: [{ provide: LeafService, useValue: { emoji: '🍁' } }]
})
export class SkipselfComponent {
  public leaf = inject(LeafService, { skipSelf: true }); // Gets parent's value, not 🍁
}
```

With `optional` to avoid errors when the parent value doesn't exist:
```ts
class Person {
  parent = inject(Person, { optional: true, skipSelf: true });
}
```

### `host`

Stop searching at the current component's view boundary — don't look further up the tree:

```ts
@Component({
  providers: [{ provide: FlowerService, useValue: { emoji: '🌷' } }]
})
export class HostComponent {
  flower = inject(FlowerService, { host: true, optional: true });
}
```

### Combining Modifiers

Valid combinations:
- `optional` + `self`
- `optional` + `skipSelf`
- `host` + `optional`
- `skipSelf` + `optional`

Invalid combinations:
- `host` + `self`
- `skipSelf` + `self`

### Constructor injection equivalents

```ts
export class SelfNoDataComponent {
  constructor(@Self() @Optional() public leaf?: LeafService) { }
}
```

## `providers` vs. `viewProviders`

Both configure the `ElementInjector`, but differ in visibility:

- `providers`: service visible to the component's view AND projected content (`<ng-content>`)
- `viewProviders`: service visible ONLY to the component's own view — not to projected content

```ts
@Component({
  providers:     [{ provide: FlowerService, useValue: { emoji: '🌻' } }],
  viewProviders: [{ provide: AnimalService, useValue: { emoji: '🐶' } }]
})
export class ChildComponent { }
```

Projected content (via `<ng-content>`) can see `FlowerService` (🌻) but NOT `AnimalService` (🐶). Child components rendered inside the view can see both.

## Logical Template Tree

Angular uses a logical tree with `<#VIEW>` boundaries for injection resolution:

```
<app-root>
  <#VIEW>
    <app-child>
      <#VIEW>
        ...content...
      </#VIEW>
    </app-child>
  </#VIEW>
</app-root>
```

- `providers` provides values at the element level (visible to element + descendants)
- `viewProviders` provides values inside `<#VIEW>` (not visible to projected content)
- `skipSelf` / `host` control where in this tree the search starts/stops

## Real-World Use Cases

### Service isolation

Prevent accidental access by scoping a service to its component tree:

```ts
@Component({
  selector: 'app-villains-list',
  providers: [VillainsService]  // Only this component tree can access it
})
export class VillainsListComponent { }
```

### Multiple independent sessions

Each component instance gets its own service instance:

```ts
@Component({
  selector: 'app-hero-tax-return',
  providers: [HeroTaxReturnService]  // Each return component manages its own state
})
export class HeroTaxReturnComponent { }
```

### Specialized providers at depth

Child components can provide more specialized implementations of a service, overriding what parents provide:

```
root: CarService (generic)
  └── ComponentB: CarService2, EngineService2 (specialized)
        └── ComponentC: CarService3 (more specialized)
```

Resolving `Car` in ComponentC gets:
- `Car` from injector C
- `Engine` from injector B
- `Tires` from root injector
