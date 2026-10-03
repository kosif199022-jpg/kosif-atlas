# Accessibility in Angular

Source: https://v20.angular.dev/best-practices/a11y

---

## Accessibility Attributes

Use `attr.` prefix for ARIA attribute *bindings* (ARIA spec depends on HTML attributes, not DOM properties):

```html
<!-- Dynamic binding — requires attr. prefix -->
<button [attr.aria-label]="myActionLabel">…</button>

<!-- Static ARIA attributes — no prefix needed -->
<button aria-label="Save document">…</button>
```

---

## Angular UI Components

- **[Angular Material](https://material.angular.dev)** — maintained by the Angular team, aims to be fully accessible.
- **[CDK `a11y` package](https://material.angular.dev/cdk/a11y/overview)** — accessibility tools including:
  - `LiveAnnouncer` — announces messages for screen-reader users via `aria-live` region
  - `cdkTrapFocus` — traps Tab-key focus within an element (use for modal dialogs)

### Augmenting Native Elements

Re-use native HTML elements directly when possible instead of re-implementing their behaviors.

**Preferred pattern** — use attribute selector with native `<button>`:
```ts
// Use native <button> with an attribute selector
@Component({ selector: 'button[myButton]', ... })
```

See Angular Material examples: `MatButton`, `MatTabNav`, `MatTable`.

### Using Containers for Native Elements

When native elements can't have children (e.g. `<input>`), use content projection to expose the native control:
- Example: `MatFormField` wraps `<input>` using content projection

---

## Case Study: Accessible Progress Bar

```ts
@Component({
  selector: 'app-example-progressbar',
  template: '<div class="bar" [style.width.%]="value()"></div>',
  host: {
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-valuenow]': 'value',
  },
})
export class ExampleProgressbarComponent {
  value = input(0);
}
```

```html
<!-- User provides aria-label to communicate what the progress means -->
<app-example-progressbar [value]="progress" aria-label="Example of a progress bar">
</app-example-progressbar>
```

---

## Routing & Accessibility

### Focus Management After Navigation

Track and control focus on route changes — don't rely solely on visual cues:

```ts
router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
  const mainHeader = document.querySelector('#main-content-header');
  if (mainHeader) {
    mainHeader.focus();
  }
});
```

Focused element should put users in position to immediately engage with the newly routed content. Avoid focus returning to `body` after route changes.

### Active Links Identification

Visual cues don't help blind users. Use `ariaCurrentWhenActive` on `RouterLinkActive`:

```html
<nav>
  <a routerLink="home"
     routerLinkActive="active-page"
     ariaCurrentWhenActive="page">
    Home
  </a>
  <a routerLink="about"
     routerLinkActive="active-page"
     ariaCurrentWhenActive="page">
    About
  </a>
</nav>
```

---

## Deferred Loading (@defer)

Screen readers may not automatically announce deferred content changes. Wrap `@defer` blocks in elements with appropriate ARIA live regions. See [defer guide accessibility section](https://v20.angular.dev/guide/templates/defer#keep-accessibility-in-mind).

---

## Resources

- [Google web.dev Learn Accessibility](https://web.dev/learn/accessibility/)
- [ARIA specification and authoring practices](https://www.w3.org/TR/wai-aria)
- [Angular CDK a11y overview](https://material.angular.dev/cdk/a11y/overview)
- [Angular ESLint](https://github.com/angular-eslint/angular-eslint#functionality) — linting rules for accessibility standards
- [W3C Web Accessibility Initiative](https://www.w3.org/WAI/people-use-web)
- [Inclusive Components](https://inclusive-components.design)
