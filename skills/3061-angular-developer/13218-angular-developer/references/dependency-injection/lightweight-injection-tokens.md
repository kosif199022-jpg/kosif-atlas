# Optimizing with Lightweight Injection Tokens

Source: https://v20.angular.dev/guide/di/lightweight-injection-tokens

This pattern is primarily for **library developers** to enable proper tree-shaking of optional components.

## The Problem: Token Retention

When a component is used as an injection token (e.g., for `@ContentChild`), the compiler keeps a reference to it at runtime, preventing tree-shaking — even when the component isn't used.

```ts
@Component({ selector: 'lib-card', ... })
class LibCardComponent {
  @ContentChild(LibHeaderComponent) header: LibHeaderComponent | null = null;
  //             ^^^ value position — prevents tree-shaking of LibHeaderComponent
  //                                   header: LibHeaderComponent  ← type position (erased by TS, safe)
}
```

- **Type position** (`header: LibHeaderComponent`) — erased by TypeScript compiler, no runtime impact
- **Value position** (`@ContentChild(LibHeaderComponent)`) — kept at runtime, **blocks tree-shaking**

## When This Pattern Is Needed

Tree-shaking problem arises when a component is used as an injection token in:
1. Value position of a content query (`@ContentChild`, `@ContentChildren`)
2. Type specifier for constructor injection

```ts
class MyComponent {
  constructor(@Optional() other: OtherComponent) {}  // value position at runtime
  @ContentChild(OtherComponent) other: OtherComponent | null;  // value position
}
```

## The Solution: Lightweight Injection Token

Use a small **abstract class** as the token instead of the full component:

```ts
// Small abstract class — retained but minimal code impact
abstract class LibHeaderToken {}

@Component({
  selector: 'lib-header',
  providers: [{ provide: LibHeaderToken, useExisting: LibHeaderComponent }],
  // ...
})
class LibHeaderComponent extends LibHeaderToken {}

@Component({
  selector: 'lib-card',
  // ...
})
class LibCardComponent {
  @ContentChild(LibHeaderToken) header: LibHeaderToken | null = null;
  //             ^^^ now references the lightweight token, not the full component
}
```

**Result:** `LibCardComponent` no longer references `LibHeaderComponent` in either type or value position. `LibHeaderComponent` can be fully tree-shaken if not used. `LibHeaderToken` is retained but is tiny.

## Pattern Summary

1. Create a lightweight abstract class as the injection token
2. Have the component implement (extend) the abstract class
3. Use the abstract class with `@ContentChild` / `@ContentChildren`
4. Provide the implementation via `useExisting` in the component's `providers`

## Defining API Methods on the Token

If the parent needs to call methods on the child via the token, declare abstract methods on the abstract class:

```ts
abstract class LibHeaderToken {
  abstract doSomething(): void;
}

@Component({
  selector: 'lib-header',
  providers: [{ provide: LibHeaderToken, useExisting: LibHeaderComponent }],
  // ...
})
class LibHeaderComponent extends LibHeaderToken {
  doSomething(): void {
    // Concrete implementation — only included if LibHeaderComponent is used
  }
}

@Component({ selector: 'lib-card', ... })
class LibCardComponent implements AfterContentInit {
  @ContentChild(LibHeaderToken) header: LibHeaderToken | null = null;

  ngAfterContentInit(): void {
    if (this.header !== null) {
      this.header?.doSomething();  // Type-safe call via abstract class
    }
  }
}
```

The method implementation lives in the tree-shakeable component, not in the lightweight token.

## Naming Convention

Follow Angular style guide: use component base name + `Token` suffix.

- Component: `LibHeaderComponent`
- Token: `LibHeaderToken`

## Key Principle

Library authors should also use [tree-shakable providers](guide/di/dependency-injection#providing-dependency) for all services — `providedIn: 'root'` rather than providing in components or modules.
