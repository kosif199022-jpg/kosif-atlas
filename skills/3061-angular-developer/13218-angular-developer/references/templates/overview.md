# Template Syntax — Overview

Source: https://v20.angular.dev/guide/templates

## What is a Template?

Every Angular component has a **template** that defines the DOM rendered onto the page. Templates are based on HTML syntax with additional Angular-specific features. Angular compiles templates into JavaScript and applies rendering optimizations automatically.

Templates are defined via:
- `template` property in `*.component.ts`
- A separate `*.component.html` file

## Differences from Standard HTML

| Feature | Notes |
|---|---|
| Comments | Not included in rendered output |
| Self-closing elements | `<UserProfile />` is valid |
| `[]` and `()` attributes | Special meaning for bindings and events |
| `@` character | Used for control flow (`@if`, `@for`, etc.); escape with `&commat;` or `&#64;` |
| Whitespace | Unnecessary whitespace is ignored/collapsed |
| `<script>` | Not supported in templates |
| Comment nodes | Angular may insert them as placeholders for dynamic content |

## Template Topics

| Topic | What it covers |
|---|---|
| Binding | Dynamic text, properties, attributes |
| Event listeners | Respond to events |
| Two-way binding | Sync value and propagate changes |
| Control flow | `@if`, `@for`, `@switch` |
| Pipes | Declarative data transformation |
| `ng-content` | Slot/project child content |
| `ng-template` | Declare reusable template fragments |
| `ng-container` | Group elements without adding DOM nodes |
| Variables | `@let` and template reference variables (`#`) |
| `@defer` | Deferred/lazy loading of template sections |
| Expression syntax | What JS is/isn't supported in expressions |
| Whitespace | How Angular handles whitespace in templates |
