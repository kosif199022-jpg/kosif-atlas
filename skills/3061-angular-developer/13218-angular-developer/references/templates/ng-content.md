# ng-content — Slotting Child Content

Source: https://v20.angular.dev/guide/templates/ng-content

## Overview

`<ng-content>` is a special element that accepts markup or a template fragment from a parent component and controls where it renders inside the child component's template. It does **not** render a real DOM element.

## Basic Usage

```ts
// base-button.component.ts
@Component({
  selector: 'button[baseButton]',
  template: `<ng-content />`,
})
export class BaseButton {}
```

```ts
// app.component.ts
@Component({
  imports: [BaseButton],
  template: `
    <button baseButton>
      Next <span class="icon arrow-right"></span>
    </button>
  `,
})
export class AppComponent {}
```

The content passed by the parent (`Next <span ...>`) is projected into the `<ng-content />` slot in `BaseButton`.

## Further Reading

For named slots, conditional projection, and advanced patterns, see the [Content Projection in-depth guide](https://v20.angular.dev/guide/components/content-projection).
