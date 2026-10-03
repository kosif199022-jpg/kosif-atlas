# DI in Action

Source: https://v20.angular.dev/guide/di/di-in-action

Additional DI features and patterns for real-world use.

## Inject the Component's DOM Element

Access the host DOM element via `ElementRef`:

```ts
import { Directive, ElementRef, inject } from '@angular/core';

@Directive({ selector: '[appHighlight]' })
export class HighlightDirective {
  private element = inject(ElementRef);

  update() {
    this.element.nativeElement.style.color = 'red';
  }
}
```

Avoid direct DOM access when possible, but `ElementRef` is the correct Angular mechanism when needed.

## Resolve Circular Dependencies with `forwardRef`

TypeScript requires class declarations before use. When circular references are unavoidable (class A references class B which references class A), use `forwardRef()` to create an indirect reference Angular resolves later.

Also needed when a class references **itself** in its own `providers` array (which must appear before the class definition):

```ts
import { forwardRef } from '@angular/core';

@Component({
  providers: [
    {
      provide: PARENT_MENU_ITEM,
      useExisting: forwardRef(() => MenuItem),  // MenuItem isn't defined yet
    },
  ],
})
export class MenuItem { }
```

`forwardRef(() => ClassName)` defers the reference resolution until after the class is defined.
