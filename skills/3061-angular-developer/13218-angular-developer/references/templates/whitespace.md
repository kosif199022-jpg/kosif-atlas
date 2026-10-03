# Whitespace in Templates

Source: https://v20.angular.dev/guide/templates/whitespace

## Default Behavior

Angular **does not preserve** whitespace it considers unnecessary. This happens in two situations:

### 1. Whitespace Between Elements

Angular removes whitespace text nodes between elements:

```html
<!-- Template -->
<section>
  <h3>User profile</h3>
  <label>
    User name
    <input>
  </label>
</section>
```

The indentation and newlines between elements produce ~20 whitespace characters in raw HTML, but Angular discards them, reducing unnecessary text nodes and improving rendering performance.

### 2. Collapsible Whitespace Inside Text

Browsers collapse multiple consecutive spaces to a single space. Angular does this at compile time instead of leaving it to the browser:

```html
<!-- Template -->
<p>Hello         world</p>

<!-- Browser would show / Angular outputs -->
<p>Hello world</p>
```

## Preserving Whitespace

### Option 1: `preserveWhitespaces` decorator option

```ts
@Component({
  preserveWhitespaces: true,
  template: `<p>Hello         world</p>`
})
```

> Avoid unless absolutely necessary — produces significantly more DOM nodes, slowing rendering.

### Option 2: `&ngsp;` entity

An Angular-specific HTML entity that outputs a single preserved space character in the compiled output:

```html
<span>Hello&ngsp;World</span>
```

Use `&ngsp;` when you need one specific space preserved without enabling full whitespace preservation.
