# Content Projection with ng-content

Source: https://v20.angular.dev/guide/components/content-projection

Use `<ng-content>` as a placeholder to mark where projected content should go:

```typescript
@Component({
  selector: 'custom-card',
  template: '<div class="card-shadow"> <ng-content/> </div>',
})
export class CustomCard {/* ... */}
```

```html
<!-- Usage -->
<custom-card>
  <p>This is the projected content</p>
</custom-card>

<!-- Rendered DOM -->
<custom-card>
  <div class="card-shadow">
    <p>This is the projected content</p>
  </div>
</custom-card>
```

- Similar to the native `<slot>` element but with Angular-specific functionality
- Angular refers to passed children as the component's **content** (distinct from its **view**)
- `<ng-content>` is **not** a component or DOM element — it's a special placeholder
- Angular processes all `<ng-content>` at **build-time**
- You **cannot** insert, remove, or modify `<ng-content>` at runtime
- You **cannot** add directives, styles, or attributes to `<ng-content>`

> **IMPORTANT:** Do not conditionally include `<ng-content>` with `@if`, `@for`, or `@switch`. Angular always instantiates and creates DOM nodes for content rendered to an `<ng-content>` placeholder, even if hidden. Use [Template fragments](https://v20.angular.dev/api/core/ng-template) for conditional rendering instead.

## Multiple Content Placeholders

Use the `select` attribute to project different elements into different slots. Supports the same CSS selectors as [component selectors](https://v20.angular.dev/guide/components/selectors).

```typescript
@Component({
  selector: 'custom-card',
  template: `
    <div class="card-shadow">
      <ng-content select="card-title"></ng-content>
      <div class="card-divider"></div>
      <ng-content select="card-body"></ng-content>
    </div>
  `,
})
export class CustomCard {}
```

```html
<custom-card>
  <card-title>Hello</card-title>
  <card-body>Welcome to the example</card-body>
</custom-card>
```

### Catch-all slot

An `<ng-content>` **without** a `select` attribute captures all elements that didn't match any other `select`:

```html
<!-- Component template -->
<div class="card-shadow">
  <ng-content select="card-title"></ng-content>
  <div class="card-divider"></div>
  <!-- captures anything except "card-title" -->
  <ng-content></ng-content>
</div>
```

If there's no unselected `<ng-content>`, elements that don't match any selector are **not rendered** into the DOM.

## Fallback Content

Provide default content inside `<ng-content>` to show when no matching child content is provided:

```html
<!-- Component template -->
<div class="card-shadow">
  <ng-content select="card-title">Default Title</ng-content>
  <div class="card-divider"></div>
  <ng-content select="card-body">Default Body</ng-content>
</div>
```

```html
<!-- Usage: no card-body provided -->
<custom-card>
  <card-title>Hello</card-title>
</custom-card>

<!-- Rendered: shows "Default Body" -->
<custom-card>
  <div class="card-shadow">
    <card-title>Hello</card-title>
    <div class="card-divider"></div>
    Default Body
  </div>
</custom-card>
```

## Aliasing Content with `ngProjectAs`

The `ngProjectAs` attribute lets you specify a CSS selector on any element. Angular matches against the `ngProjectAs` value instead of the element's identity:

```html
<!-- Component template -->
<div class="card-shadow">
  <ng-content select="card-title"></ng-content>
  <div class="card-divider"></div>
  <ng-content></ng-content>
</div>
```

```html
<!-- Usage: h3 projected as if it were card-title -->
<custom-card>
  <h3 ngProjectAs="card-title">Hello</h3>
  <p>Welcome to the example</p>
</custom-card>

<!-- Rendered -->
<custom-card>
  <div class="card-shadow">
    <h3>Hello</h3>
    <div class="card-divider"></div>
    <p>Welcome to the example</p>
  </div>
</custom-card>
```

> `ngProjectAs` supports only **static values** — cannot be bound to dynamic expressions.
