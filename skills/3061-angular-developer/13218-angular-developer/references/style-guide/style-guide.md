# Angular Coding Style Guide

Source: https://v20.angular.dev/style-guide

## Introduction

This guide covers style conventions for Angular application code. These recommendations promote consistency across the Angular ecosystem. This guide does *not* cover TypeScript or general coding practices unrelated to Angular.

**When in doubt, prefer consistency**: Mixing different style conventions in a single file creates more confusion than diverging from recommendations.

---

## Naming

- **Separate words in file names with hyphens**: `UserProfile` → `user-profile.ts`
- **Unit test files end with `.spec.ts`**: `user-profile.spec.ts`
- **File names match the TypeScript identifier within**: A file containing `UserProfile` component → `user-profile.ts`
- **Use the same file name for a component's TypeScript, template, and styles**: `user-profile.ts`, `user-profile.html`, `user-profile.css`
- Avoid overly generic file names like `helpers.ts`, `utils.ts`, or `common.ts`

---

## Project Structure

- **All UI code goes in `src/`**: TypeScript, HTML, and styles live inside `src`. Config/scripts live outside.
- **Bootstrap in `main.ts`** directly inside `src`.
- **Group closely related files together**: Component `.ts`, template, and styles in the same directory. Unit tests live next to code-under-test.
- **Organize by feature areas**, not by code type:
  ```
  src/
  ├─ movie-reel/
  │ ├─ show-times/
  │ │ ├─ film-calendar/
  │ │ ├─ film-details/
  │ ├─ reserve-tickets/
  ```
  Avoid directories named `components`, `directives`, `services`.
- **One concept per file**: One component, directive, or service per file. Exception: small, tightly coupled classes.

---

## Dependency Injection

- **Prefer `inject()` function over constructor parameter injection**:
  - More readable, especially with many dependencies
  - Better type inference
  - Easier to comment injected dependencies
  - Avoids separating field declaration and initialization when targeting ES2022+ with `useDefineForClassFields`
  - Can be refactored automatically via Angular migration tool

---

## Components and Directives

- **Choosing component selectors**: See [Components guide](https://v20.angular.dev/guide/components/selectors#choosing-a-selector).
- **Naming component/directive members**: See Components guide for [inputs](https://v20.angular.dev/guide/components/inputs#choosing-input-names) and [outputs](https://v20.angular.dev/guide/components/outputs#choosing-event-names).
- **Directive selectors**: Use application-specific prefix + camelCase attribute name. Example: `[mrTooltip]`.
- **Group Angular-specific properties before methods**: Injected deps, inputs, outputs, and queries should come first in the class, before methods.
- **Keep components and directives focused on presentation**: Factor out form validation, data transformations, etc. into separate functions/classes.
- **Avoid overly complex logic in templates**: Refactor complex logic into TypeScript (typically using `computed`).

### Access Modifiers

- **Use `protected` for members only used by the template**:
  ```ts
  @Component({ template: `<p>{{ fullName() }}</p>` })
  export class UserProfile {
    firstName = input();
    lastName = input();
    protected fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
  }
  ```

- **Use `readonly` for properties initialized by Angular** (`input`, `model`, `output`, queries):
  ```ts
  @Component({/* ... */})
  export class UserProfile {
    readonly userId = input();
    readonly userSaved = output();
    readonly userName = model();
  }
  ```
  For decorator-based APIs (`@Input`, `@Output`), `readonly` applies to outputs and queries but not inputs.

### Class & Style Bindings

- **Prefer `class` and `style` bindings over `NgClass` and `NgStyle`**:
  ```html
  <!-- PREFER -->
  <div [class.admin]="isAdmin" [class.dense]="density === 'high'">
  <!-- OR -->
  <div [class]="{admin: isAdmin, dense: density === 'high'}">
  <!-- AVOID -->
  <div [ngClass]="{admin: isAdmin, dense: density === 'high'}">
  ```
  `NgClass`/`NgStyle` incur additional performance cost.

### Event Handlers

- **Name event handlers for what they *do*, not the triggering event**:
  ```html
  <!-- PREFER -->
  <button (click)="saveUserData()">Save</button>
  <!-- AVOID -->
  <button (click)="handleClick()">Save</button>
  ```
  Use Angular key event modifiers with specific names:
  ```html
  <textarea (keydown.control.enter)="commitNotes()" (keydown.control.space)="showSuggestions()">
  ```

### Lifecycle Hooks

- **Keep lifecycle methods simple**: Delegate complex logic to well-named methods:
  ```ts
  // PREFER
  ngOnInit() {
    this.startLogging();
    this.runBackgroundTask();
  }
  ```

- **Use lifecycle hook interfaces**: Import and `implement` the interface to ensure correct naming:
  ```ts
  import {Component, OnInit} from '@angular/core';
  @Component({/* ... */})
  export class UserProfile implements OnInit {
    ngOnInit() { /* ... */ }
  }
  ```
