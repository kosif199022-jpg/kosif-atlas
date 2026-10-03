# Pipes

Source: https://v20.angular.dev/guide/templates/pipes

## Overview

Pipes transform data declaratively in templates using the `|` operator (inspired by Unix pipes). Angular's pipe syntax **does not** support bitwise OR — that operator is unsupported in template expressions.

```html
<h1>{{ company | titlecase }} on {{ purchasedOn | date }}</h1>
<p>Total: {{ amount | currency }}</p>
```

## Built-in Pipes (from `@angular/common`)

| Pipe | Description |
|---|---|
| `AsyncPipe` | Reads value from `Promise` or RxJS `Observable` |
| `CurrencyPipe` | Number → locale-formatted currency string |
| `DatePipe` | `Date` → locale-formatted string |
| `DecimalPipe` | Number → decimal string |
| `I18nPluralPipe` | Maps value to pluralized string |
| `I18nSelectPipe` | Maps key to custom selector |
| `JsonPipe` | Object → `JSON.stringify` string (debug) |
| `KeyValuePipe` | Object/Map → array of key-value pairs |
| `LowerCasePipe` | Text → lowercase |
| `PercentPipe` | Number → percentage string |
| `SlicePipe` | Subset of Array or String |
| `TitleCasePipe` | Text → Title Case |
| `UpperCasePipe` | Text → UPPERCASE |

All built-in pipes must be added to the component's `imports` array.

## Usage

```html
<!-- Basic -->
<p>{{ amount | currency }}</p>

<!-- Chaining (left to right) -->
<p>{{ scheduledOn | date | uppercase }}</p>

<!-- Parameters (colon-separated) -->
<p>{{ scheduledOn | date:'hh:mm' }}</p>
<p>{{ scheduledOn | date:'hh:mm':'UTC' }}</p>
```

## Operator Precedence

- Pipe `|` has **lower** precedence than `+`, `-`, `*`, `/`, `%`, `&&`, `||`, `??`
- Pipe `|` has **higher** precedence than the ternary `?:`

```html
<!-- firstName + lastName concatenated first, then piped -->
{{ firstName + lastName | uppercase }}

<!-- Requires parens to apply pipe to entire ternary result -->
{{ (isAdmin ? 'Access granted' : 'Access denied') | uppercase }}
```

## Change Detection (Pure vs Impure)

**Pure pipes** (default): Only re-execute when a primitive changes or object/array reference changes. Mutations to object properties or array items are **not** detected.

**Impure pipes**: Re-execute on every change detection cycle.

```ts
@Pipe({ name: 'joinNamesImpure', pure: false })
export class JoinNamesImpurePipe implements PipeTransform {
  transform(names: string[]): string {
    return names.join();
  }
}
```

> Avoid impure pipes unless absolutely necessary — significant performance cost.
> Convention: include `Impure` in the pipe name and class name to warn other developers.

## Creating Custom Pipes

```ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'kebabCase' })
export class KebabCasePipe implements PipeTransform {
  transform(value: string): string {
    return value.toLowerCase().replace(/ /g, '-');
  }
}
```

### Naming conventions

- `name`: camelCase (no hyphens)
- Class name: PascalCase + `Pipe` suffix (e.g., `KebabCasePipe`)

### With parameters

```ts
transform(value: string, format: string): string {
  const msg = `My custom transformation of ${value}.`;
  return format === 'uppercase' ? msg.toUpperCase() : msg;
}
```

Use in template:
```html
{{ myValue | myCustomTransformation:'uppercase' }}
```
