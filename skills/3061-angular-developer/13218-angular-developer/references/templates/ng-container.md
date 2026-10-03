# ng-container — Grouping Without DOM Elements

Source: https://v20.angular.dev/guide/templates/ng-container

## Overview

`<ng-container>` groups elements or marks a location in a template **without adding a real DOM element**. Angular ignores all attribute bindings and event listeners applied to `<ng-container>` (including those from directives).

```html
<!-- Template -->
<section>
  <ng-container>
    <h3>User bio</h3>
    <p>Here's some info about the user</p>
  </ng-container>
</section>

<!-- Rendered DOM -->
<section>
  <h3>User bio</h3>
  <p>Here's some info about the user</p>
</section>
```

## Rendering Dynamic Content

### Dynamic Components with `NgComponentOutlet`

```html
<ng-container [ngComponentOutlet]="profileComponent()" />
```

```ts
profileComponent = computed(() => this.isAdmin() ? AdminProfile : BasicUserProfile);
```

### Dynamic Template Fragments with `NgTemplateOutlet`

```html
<ng-container [ngTemplateOutlet]="profileTemplate()" />
<ng-template #admin>This is the admin profile</ng-template>
<ng-template #basic>This is the basic profile</ng-template>
```

```ts
profileTemplate = computed(() => this.isAdmin() ? this.adminTemplate() : this.basicTemplate());
```

## With Structural Directives

Apply structural directives to `<ng-container>` to avoid adding unnecessary wrapper elements:

```html
<ng-container *ngIf="permissions == 'admin'">
  <h1>Admin Dashboard</h1>
  <admin-infographic></admin-infographic>
</ng-container>

<ng-container *ngFor="let item of items; index as i; trackBy: trackByFn">
  <h2>{{ item.title }}</h2>
  <p>{{ item.description }}</p>
</ng-container>
```

## For Dependency Injection

Directives applied to `<ng-container>` can be injected by descendant elements. Use this to declaratively provide a value to a specific part of the template:

```ts
@Directive({ selector: '[theme]' })
export class Theme {
  mode = input<'light' | 'dark'>('light');
}
```

```html
<ng-container theme="dark">
  <profile-pic />
  <user-bio />
</ng-container>
```

Both `ProfilePic` and `UserBio` can inject `Theme` and react to its `mode`.
