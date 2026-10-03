# Control Flow

Source: https://v20.angular.dev/guide/templates/control-flow

Angular templates support built-in control flow blocks using `@` syntax.

## `@if` / `@else if` / `@else`

```html
@if (a > b) {
  <p>{{ a }} is greater than {{ b }}</p>
} @else if (b > a) {
  <p>{{ a }} is less than {{ b }}</p>
} @else {
  <p>{{ a }} is equal to {{ b }}</p>
}
```

### Save result with `as`

```html
@if (user.profile.settings.startDate; as startDate) {
  {{ startDate }}
}
```

Useful for avoiding repeated access to long expressions.

## `@for`

Loops over any JavaScript iterable; optimized for `Array`.

```html
@for (item of items; track item.id) {
  {{ item.name }}
}
```

### `track` is required

`track` maps data items to DOM nodes for efficient updates. Always use a unique identifier:
- Prefer `item.id` or `item.uuid`
- For static lists: `$index`
- Last resort: `identity` (uses `===`, slowest — avoid)

### Contextual variables in `@for`

| Variable | Meaning |
|---|---|
| `$count` | Total number of items |
| `$index` | Current item index |
| `$first` | Whether this is the first item |
| `$last` | Whether this is the last item |
| `$even` | Whether index is even |
| `$odd` | Whether index is odd |

Alias with `let`:

```html
@for (item of items; track item.id; let idx = $index, e = $even) {
  <p>Item #{{ idx }}: {{ item.name }}</p>
}
```

Aliasing is especially useful when nesting `@for` blocks.

### `@empty` fallback

```html
@for (item of items; track item.name) {
  <li>{{ item.name }}</li>
} @empty {
  <li>There are no items.</li>
}
```

### Limitations

- Does **not** support `continue` or `break`.

## `@switch`

```html
@switch (userPermissions) {
  @case ('admin') {
    <app-admin-dashboard />
  }
  @case ('reviewer') {
    <app-reviewer-dashboard />
  }
  @default {
    <app-viewer-dashboard />
  }
}
```

- Compares using `===`
- **No fallthrough** — no need for `break`
- `@default` is optional; if no match and no default, nothing renders
