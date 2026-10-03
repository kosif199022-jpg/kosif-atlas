# Component Selectors

Source: https://v20.angular.dev/guide/components/selectors

Every component defines a CSS selector that determines how the component is used.

```typescript
@Component({
  selector: 'profile-photo',
  ...
})
export class ProfilePhoto { }
```

**Key rules:**
- Angular matches selectors **statically at compile-time** — runtime DOM changes don't affect which components render
- An element can match **exactly one** component selector (multiple matches = error)
- Selectors are **case-sensitive**

## Types of Selectors

Angular supports a limited subset of CSS selector types:

| Selector type | Description | Examples |
|---------------|-------------|---------|
| Type selector | Matches elements based on HTML tag name | `profile-photo` |
| Attribute selector | Matches elements based on HTML attribute presence/value | `[dropzone]`, `[type="reset"]` |
| Class selector | Matches elements based on CSS class presence | `.menu-item` |

**Limitations:**
- Attribute values: only exact match with `=` operator (no `~=`, `|=`, `^=`, `$=`, `*=`)
- No combinators (no descendant `div p` or child `div > p`)
- No namespace support
- No pseudo-elements

### The `:not` Pseudo-class

Supported. Append to any selector to narrow matches:

```typescript
@Component({
  selector: '[dropzone]:not(textarea)',
  ...
})
export class DropZone { }
```

No other pseudo-classes or pseudo-elements are supported.

### Combining Selectors

Concatenate for AND logic:
```typescript
@Component({
  selector: 'button[type="reset"]',
  ...
})
export class ResetButton { }
```

Comma-separate for OR logic (Angular creates a component for each matching element):
```typescript
@Component({
  selector: 'drop-zone, [dropzone]',
  ...
})
export class DropZone { }
```

## Choosing a Selector

**Best practice:** Use a custom element name with a hyphen (required by HTML spec for custom elements):
```
yt-menu, yt-player, app-header
```

Angular reports an error for unknown custom tag names — prevents bugs from typos.

### Selector Prefixes

Use a short, consistent prefix for all custom components in a project:
- YouTube example: `yt-menu`, `yt-player`
- Angular CLI default: `app-`

> **IMPORTANT:** Never use `ng` as a selector prefix — Angular uses it for its own framework APIs.

### When to Use an Attribute Selector

Use when you want to enhance a standard native element:

```typescript
@Component({
  selector: 'button[yt-upload]',
  ...
})
export class YouTubeUploadButton { }
```

Benefits:
- Consumers get all standard element APIs for free
- Especially valuable for ARIA attributes like `aria-label`

**Caveat:** Angular does not report errors for unknown attributes — consumers may forget to import the component. Use lowercase, dash-case for attribute selectors.
