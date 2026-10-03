# Styling Components

Source: https://v20.angular.dev/guide/components/styling

Components can optionally include CSS styles that apply to that component's DOM.

```typescript
@Component({
  selector: 'profile-photo',
  template: `<img src="profile-photo.jpg" alt="Your profile photo">`,
  styles: ` img { border-radius: 50%; } `,
})
export class ProfilePhoto { }
```

Or in separate files:
```typescript
@Component({
  selector: 'profile-photo',
  templateUrl: 'profile-photo.html',
  styleUrl: 'profile-photo.css',
})
export class ProfilePhoto { }
```

When Angular compiles your component, styles are emitted with the component's JavaScript output — styles participate in the JS module system and are automatically included when a component renders (even when lazy-loaded).

Angular works with any CSS preprocessor: **Sass**, **Less**, **Stylus**.

## Style Scoping (View Encapsulation)

Every component has a **view encapsulation** setting with three modes:

```typescript
@Component({
  ...,
  encapsulation: ViewEncapsulation.None,
})
export class ProfilePhoto { }
```

### `ViewEncapsulation.Emulated` (Default)

Styles only apply to elements in the component's template. Angular generates a unique HTML attribute per component instance, adds it to template elements, and inserts it into CSS selectors.

- Component styles don't leak out and affect other components
- Global styles defined outside the component **can still affect** elements inside
- Supports `:host` pseudo-class
- Supports `:host-context()` (deprecated in browsers, but Angular compiler fully supports it)
- Does **not** support other Shadow DOM pseudo-classes (`::shadow`, `::part`)

#### `::ng-deep`

Custom pseudo-class that disables encapsulation for a rule, making it global. **Strongly discouraged for new use** — kept only for backwards compatibility.

### `ViewEncapsulation.ShadowDom`

Uses the web standard [Shadow DOM API](https://developer.mozilla.org/docs/Web/Web_Components/Using_shadow_DOM). Angular attaches a shadow root to the host element.

- Strictly guarantees **only** that component's styles apply to its template elements
- Global styles cannot affect shadow tree elements
- Shadow tree styles cannot affect outside elements
- Impacts event propagation, `<slot>` API behavior, and browser DevTools display

> Always understand full Shadow DOM implications before enabling this.

### `ViewEncapsulation.None`

Disables all style encapsulation. All associated styles behave as **global styles**.

> **NOTE:** In `Emulated` and `ShadowDom` modes, Angular doesn't 100% guarantee component styles always override external styles of the same specificity.

## Defining Styles in Templates

You can use `<style>` elements in a component template. The component's view encapsulation mode applies to these styles.

> Angular does **not** support bindings inside `<style>` elements.

## External Style References

Templates can use `<link>` elements to reference CSS files. CSS can use `@import` to reference CSS files. Angular treats these as **external styles** — external styles are **not affected** by emulated view encapsulation.
