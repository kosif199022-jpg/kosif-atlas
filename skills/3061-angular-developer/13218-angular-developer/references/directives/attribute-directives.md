# Attribute Directives

Source: https://v20.angular.dev/guide/directives/attribute-directives

Attribute directives change the appearance or behavior of DOM elements and Angular components.

## Building an Attribute Directive

Generate with CLI:
```bash
ng generate directive highlight
```

Minimal scaffold:
```ts
import { Directive } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
})
export class HighlightDirective {}
```

### Inject ElementRef for DOM access
```ts
import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
})
export class HighlightDirective {
  private el = inject(ElementRef);

  constructor() {
    this.el.nativeElement.style.backgroundColor = 'yellow';
  }
}
```

> Directives do **not** support namespaces. `<p app:Highlight>` is invalid.

## Applying the Directive

```html
<p appHighlight>Highlight me!</p>
```

Angular creates an instance of the directive class and injects a reference to the host element.

## Handling User Events via `host`

Bind to host element events using the `host` property in `@Directive`:

```ts
@Directive({
  selector: '[appHighlight]',
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
  },
})
export class HighlightDirective {
  private el = inject(ElementRef);

  onMouseEnter() { this.highlight('yellow'); }
  onMouseLeave() { this.highlight(''); }

  private highlight(color: string) {
    this.el.nativeElement.style.backgroundColor = color;
  }
}
```

## Passing Values into the Directive (Inputs)

Use `input()` to accept values from the template:

```ts
import { Directive, ElementRef, inject, input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
  },
})
export class HighlightDirective {
  private el = inject(ElementRef);
  appHighlight = input('');       // matches selector name — enables [appHighlight]="color"
  defaultColor = input('');       // secondary input

  onMouseEnter() {
    this.highlight(this.appHighlight() || this.defaultColor() || 'red');
  }
  onMouseLeave() { this.highlight(''); }

  private highlight(color: string) {
    this.el.nativeElement.style.backgroundColor = color;
  }
}
```

### Template usage
```html
<!-- Static value -->
<p appHighlight="orange">Highlighted in orange</p>

<!-- Bound value -->
<p [appHighlight]="color">Highlight me!</p>

<!-- With default color (static — no square brackets) -->
<p [appHighlight]="color" defaultColor="violet">Highlight me too!</p>
```

The `[appHighlight]` attribute binding both applies the directive and sets the highlight color.

## Multiple Directive Property Bindings

You can add multiple directive property bindings to a single host element, just like with components.

## Deactivating Angular Processing with `NgNonBindable`

Prevent expression evaluation in a section of the template:

```html
<p ngNonBindable>This should not evaluate: {{ 1 + 1 }}</p>
```

- Stops interpolation, directives, and binding for the element's **children**.
- Directives on the element where `ngNonBindable` is applied still work.
- Applying to a parent disables all binding for its children.

```html
<!-- appHighlight still active; {{ 1 +1 }} not evaluated -->
<div ngNonBindable [appHighlight]="'yellow'">
  This should not evaluate: {{ 1 +1 }}, but will highlight yellow.
</div>
```
