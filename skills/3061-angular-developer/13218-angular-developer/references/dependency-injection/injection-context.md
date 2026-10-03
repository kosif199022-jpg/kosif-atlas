# Injection Context

Source: https://v20.angular.dev/guide/di/dependency-injection-context

The DI system relies on a runtime context where the current injector is available. Injectors only work when code executes in such a context.

## Valid Injection Contexts

`inject()` can be called in:

- During construction (`constructor`) of a class instantiated by DI (`@Injectable`, `@Component`, etc.)
- In field initializers of such classes
- In the factory function specified for `useFactory` of a `Provider` or `@Injectable`
- In the `factory` function of an `InjectionToken`
- Within a stack frame that runs in an injection context (e.g., route guards)

## Stack Frame in Context

Some APIs run in an injection context, allowing `inject()` usage within them:

```ts
// Route guard — runs in an injection context
const canActivateTeam: CanActivateFn = (route, state) => {
  return inject(PermissionsService).canActivate(inject(UserToken), route.params.id);
};
```

## Running Code in an Injection Context

Use `runInInjectionContext` to run arbitrary code in an injection context:

```ts
@Injectable({ providedIn: 'root' })
export class HeroService {
  private environmentInjector = inject(EnvironmentInjector);

  someMethod() {
    runInInjectionContext(this.environmentInjector, () => {
      inject(SomeService); // Works because we're in an injection context
    });
  }
}
```

`inject()` returns an instance only if the injector can resolve the required token.

## Asserting Injection Context

Use `assertInInjectionContext` to validate context and throw a clear error if not in one:

```ts
import { ElementRef, assertInInjectionContext, inject } from '@angular/core';

export function injectNativeElement<T extends Element>(): T {
  assertInInjectionContext(injectNativeElement);  // Pass calling function for clear error
  return inject(ElementRef).nativeElement;
}
```

Calling from a valid context:
```ts
@Component({ /* … */ })
export class PreviewCard {
  // ✅ Field initializer = injection context
  readonly hostEl = injectNativeElement<HTMLElement>();

  onAction() {
    // ❌ Fails: runs outside injection context
    const anotherRef = injectNativeElement<HTMLElement>();
  }
}
```

## Using DI Outside of a Context

Calling `inject()` or `assertInInjectionContext()` outside an injection context throws **error NG0203**.
