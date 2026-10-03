# Referencing Component Children with Queries

Source: https://v20.angular.dev/guide/components/queries

A component can define **queries** that find child elements and read values from their injectors. Commonly used to retrieve references to child components, directives, DOM elements, and more.

All query functions **return signals** reflecting the most up-to-date results. Read by calling the signal, including in reactive contexts (`computed`, `effect`).

Two categories: **view queries** and **content queries**.

## View Queries

Retrieve results from elements in the component's own template.

### `viewChild` — single result

```typescript
@Component({
  selector: 'custom-card',
  template: '<custom-card-header>Visit sunny California!</custom-card-header>',
})
export class CustomCard {
  header = viewChild(CustomCardHeader);
  headerText = computed(() => this.header()?.text);
}
```

- Returns `undefined` if not found (e.g., hidden by `@if`)
- Angular keeps the result up to date as state changes

### `viewChildren` — multiple results

```typescript
@Component({
  selector: 'custom-card',
  template: `
    <custom-card-action>Save</custom-card-action>
    <custom-card-action>Cancel</custom-card-action>
  `,
})
export class CustomCard {
  actions = viewChildren(CustomCardAction);
  actionsTexts = computed(() => this.actions().map(action => action.text));
}
```

Returns a signal with an `Array` of results.

> **Queries never pierce through component boundaries.** View queries only retrieve results from the component's own template.

## Content Queries

Retrieve results from the component's *content* — elements nested inside the component where it's used.

### `contentChild` — single result

```typescript
@Component({ selector: 'custom-expando' })
export class CustomExpando {
  toggle = contentChild(CustomToggle);
  toggleText = computed(() => this.toggle()?.text);
}
```

- Returns `undefined` if not found
- By default, traverses into **descendants** (unlike `contentChildren`)
- Angular keeps result up to date

### `contentChildren` — multiple results

```typescript
@Component({ selector: 'custom-menu' })
export class CustomMenu {
  items = contentChildren(CustomMenuItem);
  itemTexts = computed(() => this.items().map(item => item.text));
}
```

Returns a signal with an `Array` of results.

- By default, finds only **direct children** — does not traverse into descendants
- Set `descendants: true` to traverse all descendants in the same template

> **Queries never pierce into components** — they never traverse into other component templates.

## Required Queries

When you're certain a child will always be present:

```typescript
@Component({ /* ... */ })
export class CustomCard {
  header = viewChild.required(CustomCardHeader);
  body = contentChild.required(CustomCardBody);
}
```

- Angular reports an error if not found
- The signal's value type does **not** include `undefined`

## Query Locators

The first parameter is the **locator**. Options:

1. **Component or directive class** (most common)
2. **Template reference variable string:**
   ```typescript
   @Component({
     template: `
       <button #save>Save</button>
       <button #cancel>Cancel</button>
     `
   })
   export class ActionBar {
     saveButton = viewChild<ElementRef<HTMLButtonElement>>('save');
   }
   ```
   If multiple elements share the same template reference variable, the query retrieves the **first** matching element.

3. **`ProviderToken`** (advanced — locate via DI token):
   ```typescript
   const SUB_ITEM = new InjectionToken<string>('sub-item');

   @Component({
     providers: [{ provide: SUB_ITEM, useValue: 'special-item' }],
   })
   export class SpecialItem { }

   @Component({/*...*/})
   export class CustomList {
     subItemType = contentChild(SUB_ITEM);
   }
   ```

> Angular does **not** support CSS selectors as query locators.

## Query Options

All query functions accept an options object as a second parameter.

### `read` — retrieve a different value from the matched element

```typescript
@Component({/*...*/})
export class CustomExpando {
  toggle = contentChild(ExpandoContent, { read: TemplateRef });
}
```

Commonly used to retrieve `ElementRef` or `TemplateRef`.

### `descendants` (for `contentChildren` only)

```typescript
// Default: finds only direct children
items = contentChildren(CustomMenuItem);

// Traverse all descendants in the same template
items = contentChildren(CustomMenuItem, { descendants: true });
```

View queries always traverse into descendants (no option needed).

## Decorator-Based Queries (Legacy, Still Supported)

### View Queries

```typescript
export class CustomCard {
  @ViewChild(CustomCardHeader) header: CustomCardHeader;

  ngAfterViewInit() {
    console.log(this.header.text); // available here
  }
}
```

- Result available in `ngAfterViewInit` (before that: `undefined`)
- `@ViewChildren` returns a `QueryList<T>` — subscribe to `.changes` for updates

### Content Queries

```typescript
export class CustomExpando {
  @ContentChild(CustomToggle) toggle: CustomToggle;

  ngAfterContentInit() {
    console.log(this.toggle.text); // available here
  }
}
```

- Result available in `ngAfterContentInit`
- `@ContentChildren` returns a `QueryList<T>` — subscribe to `.changes` for updates

### Static Queries

```typescript
@Component({
  template: '<custom-card-header>...</custom-card-header>',
})
export class CustomCard {
  @ViewChild(CustomCardHeader, { static: true }) header: CustomCardHeader;

  ngOnInit() {
    console.log(this.header.text); // available earlier, in ngOnInit
  }
}
```

- `static: true` makes results available in `ngOnInit`
- Static results **do not update** after initialization
- Not available on `@ViewChildren` or `@ContentChildren`

### `QueryList` API

Both `@ViewChildren` and `@ContentChildren` provide `QueryList<T>` with:
- Array-like APIs: `map`, `reduce`, `forEach`
- `toArray()` — get a snapshot array
- `changes` observable — subscribe for updates

## Common Pitfalls

- Always maintain a **single source of truth** for shared state — avoid duplicating state across components
- **Avoid writing state directly to child components** — leads to brittle code and `ExpressionChangedAfterItHasBeenChecked` errors
- **Never write state directly to parent/ancestor components** — same risks
