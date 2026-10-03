# Template Event Listeners

Source: https://v20.angular.dev/guide/templates/event-listeners

## Listening to Native Events

Wrap the event name in parentheses `()` and provide a handler statement:

```html
<input type="text" (keyup)="updateField()" />
```

Works with any native event: `click`, `keydown`, `mouseover`, etc.

## Accessing the Event Object

Angular provides `$event` in every event listener:

```html
<input type="text" (keyup)="updateField($event)" />
```

```ts
updateField(event: KeyboardEvent): void {
  console.log(`The user pressed: ${event.key}`);
}
```

## Key Modifiers

Filter keyboard events to specific keys using `.` notation:

```html
<!-- Only fires on Enter -->
<input type="text" (keyup.enter)="updateField($event)" />

<!-- Shift + Enter -->
<input type="text" (keyup.shift.enter)="updateField($event)" />
```

Supported modifiers: `alt`, `control`, `meta`, `shift`.

### Key vs Code

By default Angular uses `key` values. To use physical key codes (useful for cross-OS consistency), add the `code` suffix:

```html
<!-- Alt + Left Shift (physical key) -->
<input type="text" (keydown.code.alt.shiftleft)="updateField($event)" />
```

This matters on macOS where Alt modifies the character reported by `key` (e.g., Alt+S → `'ß'`).

## Preventing Default Behavior

Call `event.preventDefault()` explicitly:

```html
<a href="#overlay" (click)="showOverlay($event)">
```

```ts
showOverlay(event: PointerEvent): void {
  event.preventDefault();
}
```

> If the handler statement evaluates to `false`, Angular auto-calls `preventDefault()`. Prefer explicit calls for clarity.

## Custom Event Plugins

Angular's event system is extensible via `EVENT_MANAGER_PLUGINS`.

### 1. Implement `EventManagerPlugin`

```ts
import { Injectable } from '@angular/core';
import { EventManagerPlugin } from '@angular/platform-browser';

@Injectable()
export class DebounceEventPlugin extends EventManagerPlugin {
  constructor() { super(document); }

  override supports(eventName: string) {
    return /debounce/.test(eventName);
  }

  override addEventListener(element: HTMLElement, eventName: string, handler: Function) {
    const [event, , delay = 300] = eventName.split('.');
    let timeoutId: number;
    const listener = (e: Event) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handler(e), delay);
    };
    element.addEventListener(event, listener);
    return () => {
      clearTimeout(timeoutId);
      element.removeEventListener(event, listener);
    };
  }
}
```

### 2. Register with `EVENT_MANAGER_PLUGINS`

```ts
bootstrapApplication(AppComponent, {
  providers: [{
    provide: EVENT_MANAGER_PLUGINS,
    useClass: DebounceEventPlugin,
    multi: true
  }]
});
```

### 3. Use in templates or `host`

```html
<input (input.debounce.500)="onSearch($event.target.value)" />
```

```ts
@Component({
  host: { '(click.debounce.500)': 'handleDebouncedClick()' }
})
```
