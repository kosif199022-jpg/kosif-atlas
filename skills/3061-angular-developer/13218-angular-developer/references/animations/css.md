# Animating your Application with CSS

Source: https://v20.angular.dev/guide/animations/css

CSS offers a robust set of tools for creating beautiful and engaging animations within your Angular application.

---

## Creating Reusable Animations

Define `@keyframes` animations in a shared CSS file to reuse them across your application:

```css
/* shared animations.css */
@keyframes sharedAnimation {
  to { height: 0; opacity: 1; background-color: 'red'; }
}
.animated-class {
  animation: sharedAnimation 1s;
}
```

Adding the class `animated-class` to an element triggers the animation on that element.

---

## Animating State and Styles

Animate between two states (e.g., open/closed) using CSS classes:

```css
.open {
  height: 200px;
  opacity: 1;
  background-color: yellow;
  transition: all 1s;
}
.closed {
  height: 100px;
  opacity: 0.8;
  background-color: blue;
  transition: all 1s;
}
```

Toggle these classes in your component template using Angular's class bindings. See the [template binding guide](guide/templates/binding#css-class-and-style-property-bindings).

---

## Transitions, Timing, and Easing

### Keyframe animations
```css
.example-element {
  animation-duration: 1s;
  animation-delay: 500ms;
  animation-timing-function: ease-in-out;
}
/* or shorthand */
.example-shorthand {
  animation: exampleAnimation 1s ease-in-out 500ms;
}
```

### Transitions (non-keyframe)
```css
.example-element {
  transition-duration: 1s;
  transition-delay: 500ms;
  transition-timing-function: ease-in-out;
  transition-property: margin-right;
}
/* or shorthand */
.example-shorthand {
  transition: margin-right 1s ease-in-out 500ms;
}
```

---

## Triggering an Animation

Toggle classes to trigger animations. Once a class is present, the animation fires. Removing the class reverts to the base CSS.

### open-close.component.ts
```ts
import {Component, signal} from '@angular/core';
@Component({
  selector: 'app-open-close',
  templateUrl: 'open-close.component.html',
  styleUrls: ['open-close.component.css'],
})
export class OpenCloseComponent {
  isOpen = signal(true);
  toggle() { this.isOpen.update((isOpen) => !isOpen); }
}
```

### open-close.component.html
```html
<button type="button" (click)="toggle()">Toggle Open/Close</button>
<div class="open-close-container" [class.open]="isOpen()">
  <p>The box is now {{ isOpen() ? 'Open' : 'Closed' }}!</p>
</div>
```

### open-close.component.css
```css
.open-close-container {
  height: 100px;
  opacity: 0.8;
  background-color: blue;
  transition-property: height, opacity, background-color, color;
  transition-duration: 1s;
}
.open {
  transition-duration: 0.5s;
  height: 200px;
  opacity: 1;
  background-color: yellow;
}
```

---

## Animating Auto Height

Use CSS Grid to animate to `auto` height:

```css
.container {
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  transition: grid-template-rows 1s;
}
.container.open {
  grid-template-rows: 1fr;
}
.container .content {
  min-height: 0;
  visibility: hidden;
}
.container.open .content {
  visibility: visible;
}
```

For modern browsers only, `calc-size()` is the true solution. See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/CSS/calc-size).

---

## Animate Entering and Leaving a View

Use `animate.enter` and `animate.leave` (see the [Enter and Leave guide](guide/animations)):

### Enter
```html
@if (isShown()) {
  <div class="insert-container" animate.enter="enter-animation">
    <p>The box is inserted</p>
  </div>
}
```
```css
.enter-animation {
  animation: slide-fade 1s;
}
@keyframes slide-fade {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Leave
```html
@if (isShown()) {
  <div class="insert-container" animate.leave="deleting">
    <p>The box is inserted</p>
  </div>
}
```
```css
.deleting {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 500ms ease-out, transform 500ms ease-out;
}
```

---

## Animating Increment and Decrement

```ts
export class IncrementDecrementComponent implements OnInit {
  num = signal(0);
  el = viewChild<ElementRef<HTMLParagraphElement>>('el');

  ngOnInit() {
    this.el()?.nativeElement.addEventListener('animationend', (ev) => {
      if (ev.animationName.endsWith('decrement') || ev.animationName.endsWith('increment')) {
        this.animationFinished();
      }
    });
  }

  modify(n: number) {
    const targetClass = n > 0 ? 'increment' : 'decrement';
    this.num.update((v) => (v += n));
    this.el()?.nativeElement.classList.add(targetClass);
  }

  animationFinished() {
    this.el()?.nativeElement.classList.remove('increment', 'decrement');
  }
}
```

```css
.increment { animation: increment 300ms; }
.decrement { animation: decrement 300ms; }

@keyframes increment {
  33% { color: green; transform: scale(1.3, 1.2); }
  66% { color: green; transform: scale(1.2, 1.2); }
  100% { transform: scale(1, 1); }
}
@keyframes decrement {
  33% { color: red; transform: scale(0.8, 0.9); }
  66% { color: red; transform: scale(0.9, 0.9); }
  100% { transform: scale(1, 1); }
}
```

---

## Disabling Animations

Three options:

1. **Custom no-animation class:**
   ```css
   .no-animation {
     animation: none !important;
     transition: none !important;
   }
   ```
   Note: This prevents animation events from firing. If awaiting events for element removal, set durations to `1ms` instead.

2. **`prefers-reduced-motion` media query** — respects user OS preferences.

3. **Prevent adding animation classes programmatically.**

---

## Animation Callbacks

Listen to native browser animation/transition events:

| Event | API |
|-------|-----|
| `animationstart` | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/animationstart_event) |
| `animationend` | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/animationend_event) |
| `animationiteration` | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/animationiteration_event) |
| `animationcancel` | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/animationcancel_event) |
| `transitionstart` | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/transitionstart_event) |
| `transitionrun` | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/transitionrun_event) |
| `transitionend` | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/transitionend_event) |
| `transitioncancel` | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/transitioncancel_event) |

**NOTE on bubbling:** Events bubble up from children to parents. Use `stopPropagation()` or check `animationName`/transition properties to target the correct element.

---

## Complex Sequences

### Staggering Animations in a List

Use `animation-delay` or `transition-delay` with CSS custom properties to create cascade effects:

```html
@if (show()) {
  <ul class="items">
    @for(item of items; track item) {
      <li class="item" style="--index: {{ item }}">{{item}}</li>
    }
  </ul>
}
```

```css
.items .item {
  transition-property: opacity, transform;
  transition-duration: 500ms;
  transition-delay: calc(200ms * var(--index));
  @starting-style {
    opacity: 0;
    transform: translateX(-10px);
  }
}
```

### Parallel Animations

Apply multiple animations to one element using the `animation` shorthand:
```css
.target-element {
  animation: rotate 3s, fade-in 2s;
}
```
`rotate` and `fade-in` fire simultaneously with different durations.

### Animating Items of a Reordering List

Items in a `@for` loop that are removed and re-added fire `@starting-style` entry animations. Use `animate.leave` to animate removal:

```html
<ul class="items">
  @for(item of items; track item) {
    <li class="item" animate.leave="fade">{{ item }}</li>
  }
</ul>
```

```css
.items .item {
  transition-property: opacity, transform;
  transition-duration: 500ms;
  @starting-style {
    opacity: 0;
    transform: translateX(-10px);
  }
}
.items .item.fade {
  animation: fade-out 500ms;
}
@keyframes fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
```

---

## Programmatic Control of Animations

Retrieve animations off an element using [`Element.getAnimations()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAnimations). Returns an array of [`Animation`](https://developer.mozilla.org/en-US/docs/Web/API/Animation) objects with full control:

- `cancel()`, `play()`, `pause()`, `reverse()`, and more

This native API replaces the legacy `AnimationPlayer` from `@angular/animations`.
