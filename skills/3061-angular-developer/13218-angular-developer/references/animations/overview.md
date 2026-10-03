# Animating your applications with `animate.enter` and `animate.leave`

Source: https://v20.angular.dev/guide/animations

Well-designed animations can make your application more fun and straightforward to use. Animations can improve your application and user experience in a number of ways:

* Without animations, web page transitions can seem abrupt and jarring
* Motion greatly enhances the user experience, so animations give users a chance to detect the application's response to their actions
* Good animations can smoothly direct the user's attention throughout a workflow

Angular provides `animate.enter` and `animate.leave` to animate your application's elements. These two features apply enter and leave CSS classes at the appropriate times or call functions to apply animations from third party libraries. `animate.enter` and `animate.leave` are **not directives** — they are special API supported directly by the Angular compiler. They can be used on elements directly and also as a host binding.

---

## `animate.enter`

Use `animate.enter` to animate elements as they *enter* the DOM. Define enter animations using CSS classes with either transitions or keyframe animations.

### enter.ts
```ts
import {Component, signal} from '@angular/core';
@Component({
  selector: 'app-enter',
  templateUrl: 'enter.html',
  styleUrls: ['enter.css'],
})
export class Enter {
  isShown = signal(false);
  toggle() {
    this.isShown.update((isShown) => !isShown);
  }
}
```

### enter.html
```html
<button type="button" (click)="toggle()">Toggle Element</button>
@if (isShown()) {
  <div class="enter-container" animate.enter="enter-animation">
    <p>The box is entering.</p>
  </div>
}
```

### enter.css
```css
.enter-animation {
  animation: slide-fade 1s;
}
@keyframes slide-fade {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

When the animation completes, Angular removes the class(es) specified in `animate.enter` from the DOM. Animation classes are only present while the animation is active.

**NOTE:** When using multiple keyframe animations or transition properties on an element, Angular removes all classes only *after* the longest animation has completed.

`animate.enter` accepts:
- A single class string (multiple classes separated by spaces)
- An array of class strings
- Dynamic binding: `[animate.enter]="enterClass()"`

**CSS Transitions note:** If using transitions instead of keyframe animations, the classes added represent the state the transition animates *to*. Pair with `@starting-style` for the *from* state.

### Dynamic binding example
```html
<div [animate.enter]="enterClass()">...</div>
```

---

## `animate.leave`

Use `animate.leave` to animate elements as they *leave* the DOM. When the animation completes, Angular automatically removes the animated element from the DOM.

### leave.html
```html
@if (isShown()) {
  <div class="leave-container" animate.leave="leaving">
    <p>Goodbye</p>
  </div>
}
```

### leave.css
```css
.leave-container {
  opacity: 1;
  transition: opacity 200ms ease-in;
  @starting-style { opacity: 0; }
}
.leaving {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 500ms ease-out, transform 500ms ease-out;
}
```

**NOTE:** Angular waits to remove the element only *after* the longest animation has completed.

`animate.leave` supports signals, bindings, single classes, or multiple classes (string with spaces or string array).

---

## Event Bindings, Functions, and Third-party Libraries

Both `animate.enter` and `animate.leave` support event binding syntax that allows function calls. Use this to call component code or third-party animation libraries like [GSAP](https://gsap.com/) or [anime.js](https://animejs.com/).

### leave-event.ts
```ts
import {AnimationCallbackEvent, Component, signal} from '@angular/core';
export class LeaveEvent {
  leavingFn(event: AnimationCallbackEvent) {
    // gsap.to(event.target, { duration: 1, x: 100, onComplete: () => event.animationComplete() });
    event.animationComplete();
  }
}
```

### leave-event.html
```html
<div class="leave-container" (animate.leave)="leavingFn($event)">
  <p>Goodbye</p>
</div>
```

The `$event` object is of type [`AnimationCallbackEvent`](/api/core/AnimationCallbackEvent). It includes:
- `target` — the element
- `animationComplete()` — function to notify Angular when the animation finishes

**IMPORTANT:** You **must** call `animationComplete()` when using `animate.leave` for Angular to remove the element.

If `animationComplete()` is never called, Angular calls it automatically after a **4-second delay**. Configure this via `MAX_ANIMATION_TIMEOUT`:
```ts
{ provide: MAX_ANIMATION_TIMEOUT, useValue: 6000 }
```

---

## Compatibility with Legacy Angular Animations

You **cannot** use legacy animations alongside `animate.enter`/`animate.leave` within the **same component**. Mixing within the same component results in enter classes remaining on the element or leaving nodes not being removed.

It is otherwise fine to use both within the same *application*. The only caveat is **content projection** — projecting content from a component with legacy animations into one with `animate.enter`/`animate.leave` (or vice versa) causes the same issues as using them together in the same component. This is not supported.

---

## Testing

`TestBed` disables animations by default in test environments (CSS animations require a browser). To test animations in a browser environment (e.g., e2e tests):

```ts
TestBed.configureTestingModule({ animationsEnabled: true });
```

**NOTE:** Some test environments do not emit animation events like `animationstart`, `animationend`, or their transition equivalents.
