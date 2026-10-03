# Angular Elements (Custom Elements)

Source: https://v20.angular.dev/guide/elements

*Angular elements* are Angular components packaged as *custom elements* (Web Components) — a web standard for defining new HTML elements in a framework-agnostic way.

The `@angular/elements` package exports a `createCustomElement()` API that bridges Angular's component interface and change detection to the built-in DOM API.

## Installation

```bash
npm install @angular/elements --save
```

## How It Works

`createCustomElement()` converts a component into a class registerable with the browser as a custom element. After registration, use the new element like any built-in HTML element:

```html
<my-popup message="Use Angular!"></my-popup>
```

When placed on a page, the browser creates an instance of the registered class and adds it to the DOM. The component's template, Angular template syntax, and data binding all work normally.

**Input properties** → corresponding input attributes on the element.

## Transforming Components to Custom Elements

```typescript
@Component({
  selector: 'app-root',
  template: `
    <input #input value="Message" />
    <button (click)="popup.showAsElement(input.value)">Show as element</button>
  `,
  providers: [PopupService],
  imports: [PopupComponent],
})
export class AppComponent {
  constructor(injector: Injector, public popup: PopupService) {
    // Convert `PopupComponent` to a custom element.
    const PopupElement = createCustomElement(PopupComponent, { injector });
    // Register the custom element with the browser.
    customElements.define('popup-element', PopupElement);
  }
}
```

> **IMPORTANT:** Avoid using the component's selector as the custom element tag name — it causes Angular to create two component instances for a single DOM element.

## Mapping: Angular → Custom Element

| Angular | Custom Element |
|---------|---------------|
| `input({ alias: 'myInputProp' })` | `my-input-prop` attribute (dash-separated lowercase) |
| `output()` named `valueChanged` | Custom event named `"valueChanged"` (emitted data on `event.detail`) |
| `output({ alias: 'myClick' })` | Custom event named `"myClick"` |

## Custom Elements vs Dynamic Components (Popup Service Example)

### Dynamic component approach (more boilerplate):
```typescript
showAsComponent(message: string) {
  const popup = document.createElement('popup-component');
  const popupComponentRef = createComponent(PopupComponent, {
    environmentInjector: this.injector,
    hostElement: popup,
  });
  this.applicationRef.attachView(popupComponentRef.hostView);
  popupComponentRef.instance.closed.subscribe(() => {
    document.body.removeChild(popup);
    this.applicationRef.detachView(popupComponentRef.hostView);
  });
  popupComponentRef.instance.message = message;
  document.body.appendChild(popup);
}
```

### Custom element approach (simpler):
```typescript
showAsElement(message: string) {
  const popupEl: NgElement & WithProperties<PopupComponent> =
    document.createElement('popup-element') as any;
  popupEl.addEventListener('closed', () => document.body.removeChild(popupEl));
  popupEl.message = message;
  document.body.appendChild(popupEl);
}
```

## Typings for Custom Elements

Custom elements extend `NgElement` (which extends `HTMLElement`) and have properties for each component input.

### Option 1: Cast on each use

```typescript
const aDialog = document.createElement('my-dialog') as NgElement & WithProperties<{ content: string }>;
aDialog.content = 'Hello, world!';
aDialog.content = 123; // ERROR: must be string
```

### Option 2: Augment `HTMLElementTagNameMap` (define once, works everywhere)

```typescript
declare global {
  interface HTMLElementTagNameMap {
    'my-dialog': NgElement & WithProperties<{ content: string }>;
    'my-other-element': NgElement & WithProperties<{ foo: 'bar' }>;
  }
}
```

Now TypeScript infers the correct type automatically:
```typescript
document.createElement('my-dialog')         // → NgElement & WithProperties<{content: string}>
document.querySelector('my-other-element')  // → NgElement & WithProperties<{foo: 'bar'}>
```

## Limitations

Be careful when destroying and re-attaching custom elements created with `@angular/elements` due to issues with the `disconnect()` callback. Affected scenarios:
- Rendering in `ng-if` or `ng-repeat` in AngularJS
- Manually detaching and re-attaching an element to the DOM
