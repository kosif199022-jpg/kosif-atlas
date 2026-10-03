# Anatomy of a Component

Source: https://v20.angular.dev/guide/components

Every component must have:
- A TypeScript class with behaviors (handling user input, fetching data)
- An HTML template that controls what renders into the DOM
- A CSS selector that defines how the component is used in HTML

## Basic Structure

```typescript
@Component({
  selector: 'profile-photo',
  template: `<img src="profile-photo.jpg" alt="Your profile photo">`,
})
export class ProfilePhoto { }
```

The object passed to `@Component` is the component's **metadata** (includes `selector`, `template`, etc.).

### Optional styles
```typescript
@Component({
  selector: 'profile-photo',
  template: `<img src="profile-photo.jpg" alt="Your profile photo">`,
  styles: `img { border-radius: 50%; }`,
})
export class ProfilePhoto { }
```

### Separate template and style files
```typescript
@Component({
  selector: 'profile-photo',
  templateUrl: 'profile-photo.html',
  styleUrl: 'profile-photo.css',
})
export class ProfilePhoto { }
```
`templateUrl` and `styleUrl` are relative to the directory in which the component resides.

## Using Components

### Imports in `@Component` decorator

To use a component, directive, or pipe, add it to the `imports` array:

```typescript
import { ProfilePhoto } from './profile-photo';

@Component({
  imports: [ProfilePhoto],
  /* ... */
})
export class UserProfile { }
```

**Default: components are standalone** (can be added directly to `imports`). Components with `standalone: false` require importing their `NgModule` instead.

> **Important:** In Angular versions before 19.0.0, `standalone` defaults to `false`.

### Showing components in a template

Every component defines a CSS selector. You use a component by creating a matching HTML element in another component's template:

```typescript
@Component({ selector: 'profile-photo' })
export class ProfilePhoto { }

@Component({
  imports: [ProfilePhoto],
  template: `<profile-photo />`
})
export class UserProfile { }
```

Angular creates an instance of the component for every matching HTML element it encounters.

- **Host element**: The DOM element that matches a component's selector
- **View**: The DOM rendered by a component, corresponding to its template
- Angular applications are a **tree of components**

## Key Concepts

| Term | Definition |
|------|-----------|
| Host element | DOM element matching the component's selector |
| View | DOM rendered by the component's template |
| Content | Children passed into a component (projected content) |
| Metadata | Object passed to `@Component` decorator |
