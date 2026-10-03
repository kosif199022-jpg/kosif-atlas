# Template Binding — Dynamic Text, Properties, and Attributes

Source: https://v20.angular.dev/guide/templates/binding

## Text Interpolation

Use `{{ expression }}` to render dynamic text. Angular evaluates the expression and keeps it updated.

```html
<p>Your color preference is {{ theme }}.</p>
```

**Prefer signals** — Angular tracks signal reads in templates and re-renders when signal values change:

```ts
theme = signal('dark');
```
```html
<p>Your color preference is {{ theme() }}.</p>
```

Non-signal properties may not trigger updates. All expression values are converted to string via `toString()`.

## Property Bindings

Use `[property]="expression"` to bind to DOM properties, component inputs, or directive properties.

```html
<!-- Native DOM property -->
<button [disabled]="isFormValid()">Save</button>

<!-- Component input -->
<my-listbox [value]="mySelection()" />

<!-- Directive property -->
<img [ngSrc]="profilePhotoUrl()" alt="...">
```

## Attribute Bindings

For HTML attributes without DOM property equivalents (e.g., ARIA, SVG), use `[attr.name]`:

```html
<ul [attr.role]="listRole()">
```

- If value is `null`, Angular calls `removeAttribute`.

## Text Interpolation in Properties/Attributes

You can use `{{ }}` syntax in attribute values — Angular treats this as a property binding:

```html
<img src="photo.jpg" alt="Profile photo of {{ firstName() }}">
<button attr.aria-label="Save changes to {{ objectType() }}">
```

## CSS Class Bindings

```html
<!-- Single class toggle -->
<ul [class.expanded]="isExpanded()">

<!-- Multiple classes -->
<ul [class]="listClasses">
```

`[class]` accepts:
| Type | Example |
|---|---|
| `string` | `'full-width outlined'` |
| `string[]` | `['expandable', 'elevated']` |
| `Record<string, any>` | `{ highlighted: true, embiggened: false }` |

- Angular intelligently merges static `class`, `[class]`, and `[class.x]` bindings.
- Uses `===` to detect object/array changes — must create new instances to trigger updates.
- Does **not** support space-separated class names in a single object key; use `NgClass` for that.
- Angular does not guarantee CSS class order on rendered elements.

## CSS Style Bindings

```html
<!-- Single property -->
<section [style.display]="isExpanded() ? 'block' : 'none'">

<!-- With unit -->
<section [style.height.px]="sectionHeightInPixels()">

<!-- Multiple styles -->
<ul [style]="listStyles()">
```

`[style]` accepts:
| Type | Example |
|---|---|
| `string` | `'display: flex; margin: 8px'` |
| `Record<string, any>` | `{ border: '1px solid black' }` |

- Uses `===` for object change detection — must create new instances to trigger updates.
- When multiple bindings target the same style property, Angular follows its style precedence order.
