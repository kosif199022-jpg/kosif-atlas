# Expression Syntax

Source: https://v20.angular.dev/guide/templates/expression-syntax

Angular template expressions are a subset of JavaScript. This page documents what's supported, what's not, and key differences.

## Supported Value Literals

| Type | Examples |
|---|---|
| String | `'Hello'`, `"World"` |
| Boolean | `true`, `false` |
| Number | `123`, `3.14` |
| Object | `{name: 'Alice'}` |
| Array | `['Onion', 'Cheese']` |
| null | `null` |
| Template string | `` `Hello ${name}` `` |

## Unsupported Literals

| Type | Example |
|---|---|
| RegExp | `/\d+/` |
| BigInt | `1n` |

## Globals

Only the following globals are supported:
- `undefined`
- `$any` (TypeScript escape hatch)

**Not supported:** `Number`, `Boolean`, `NaN`, `Infinity`, `parseInt`, and other standard globals.

## Local Variables

Angular makes special `$`-prefixed variables available in specific contexts (e.g., `$index`, `$first`, `$last` in `@for` blocks).

## Supported Operators

| Operator | Example |
|---|---|
| Arithmetic | `1 + 2`, `52 - 3`, `41 * 6`, `20 / 4`, `17 % 5`, `10 ** 3` |
| Parenthesis | `9 * (8 + 4)` |
| Ternary | `a > b ? true : false` |
| Logical | `&&`, `\|\|`, `!` |
| Nullish coalescing | `val ?? 'default'` |
| Comparison | `<`, `<=`, `>`, `>=`, `==`, `===`, `!==`, `!=` |
| Unary | `-x`, `+y` |
| Property accessor | `person['name']` |
| Assignment | `a = b` |
| Compound assignment | `+=`, `-=`, `*=`, `/=`, `%=`, `**=`, `&&=`, `\|\|=`, `??=` |
| Pipe | `{{ total \| currency }}` |
| Optional chaining\* | `someObj?.nestedProp` |
| Non-null assertion (TS) | `someObj!.someProp` |

> **Note on optional chaining:** Angular's version returns `null` (not `undefined`) when the left side is `null` or `undefined`.

## Unsupported Operators

| Operator | Example |
|---|---|
| Bitwise operators | `&`, `&=`, `~`, `\|=`, `^=`, etc. |
| Object destructuring | `const { name } = person` |
| Array destructuring | `const [first] = items` |
| Comma operator | `x = (x++, x)` |
| `instanceof` | `car instanceof Automobile` |
| `new` | `new Car()` |

## Lexical Context

Expressions are evaluated in the context of the **component class** plus any active template variables, locals, and globals.

- `this` is implied when referencing class members
- Template variables shadow class members with the same name
- Use `this.memberName` to unambiguously reference a class member when it's shadowed (e.g., when narrowing a signal with `@let`)

## Declarations Are Not Supported

```
let label = 'abc'         // ❌
const item = 'apple'      // ❌
function myFn() { }       // ❌
() => { }                 // ❌
class Rectangle { }       // ❌
```

## Event Handler Statements vs Expressions

Event handlers are **statements**, not expressions. Key differences:

| Feature | Expressions | Statements |
|---|---|---|
| Assignment operators | ✅ | ✅ |
| Destructuring assignments | ❌ | ❌ |
| Pipes | ✅ | ❌ |
