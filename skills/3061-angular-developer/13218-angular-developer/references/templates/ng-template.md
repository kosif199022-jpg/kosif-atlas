# ng-template — Template Fragments

Source: https://v20.angular.dev/guide/templates/ng-template

## Overview

`<ng-template>` declares a **template fragment** — content that is not rendered by default but can be rendered programmatically or dynamically. Inspired by the native HTML `<template>` element.

```html
<p>This is a normal element</p>
<ng-template>
  <p>This is a template fragment (not rendered)</p>
</ng-template>
```

Expressions in a fragment are evaluated against the component in which the fragment is declared, regardless of where it's rendered.

## Getting a Reference to a Fragment

Three ways to get a `TemplateRef` object:

### 1. Template reference variable

```html
<ng-template #myFragment>
  <p>This is a template fragment</p>
</ng-template>
```

### 2. Query (`viewChild`)

```ts
@Component({
  template: `
    <ng-template #fragmentOne><p>One</p></ng-template>
    <ng-template #fragmentTwo><p>Two</p></ng-template>
  `
})
export class MyComponent {
  fragmentOne = viewChild<TemplateRef<unknown>>('fragmentOne');
  fragmentTwo = viewChild<TemplateRef<unknown>>('fragmentTwo');
}
```

### 3. Inject in a directive applied to `<ng-template>`

```ts
@Directive({ selector: '[myDirective]' })
export class MyDirective {
  private fragment = inject(TemplateRef);
}
```
```html
<ng-template myDirective><p>Fragment</p></ng-template>
```

## Rendering a Fragment

### Via `NgTemplateOutlet` (declarative)

Renders the fragment as a **sibling** of the `<ng-container>`:

```html
<ng-template #myFragment>
  <p>This is a fragment</p>
</ng-template>
<ng-container *ngTemplateOutlet="myFragment"></ng-container>
```

Import `NgTemplateOutlet` from `@angular/common`.

### Via `ViewContainerRef` (imperative)

```ts
@Component({
  selector: 'my-outlet',
  template: `<button (click)="showFragment()">Show</button>`,
})
export class MyOutlet {
  private viewContainer = inject(ViewContainerRef);
  fragment = input<TemplateRef<unknown> | undefined>();

  showFragment() {
    if (this.fragment()) {
      this.viewContainer.createEmbeddedView(this.fragment()!);
    }
  }
}
```

Fragment is appended as the next sibling of the component that injected `ViewContainerRef`.

## Passing Parameters to Fragments

Declare parameters with `let-`:

```html
<ng-template let-pizzaTopping="topping">
  <p>You selected: {{ pizzaTopping }}</p>
</ng-template>
```

### With `NgTemplateOutlet`

```html
<ng-container
  [ngTemplateOutlet]="myFragment"
  [ngTemplateOutletContext]="{topping: 'onion'}"
/>
```

### With `ViewContainerRef`

```ts
this.viewContainer.createEmbeddedView(this.myFragment, { topping: 'onion' });
```

## Structural Directives

Any directive that injects `TemplateRef` and `ViewContainerRef` is a **structural directive**. The `*` prefix is shorthand:

```html
<!-- Shorthand -->
<section *myDirective>
  <p>This is a fragment</p>
</section>

<!-- Equivalent explicit form -->
<ng-template myDirective>
  <section>
    <p>This is a fragment</p>
  </section>
</ng-template>
```

See [Structural Directives guide](https://v20.angular.dev/guide/directives/structural-directives) for details.
