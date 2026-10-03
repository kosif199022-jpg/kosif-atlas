# Browser Bug Catalog

50 cross-browser bugs from [Fifty Problems with Standard Web APIs in 2025](https://zerotrickpony.com/articles/browser-bugs/). Organized by detection method.

## Table of Contents

1. [CSS Patterns](#css-patterns) — bugs detectable by scanning stylesheets
2. [JavaScript Patterns](#javascript-patterns) — bugs detectable in script files
3. [HTML Patterns](#html-patterns) — bugs detectable in markup
4. [Design Patterns](#design-patterns) — bugs requiring judgment

---

## CSS Patterns

### #1, #2: Viewport Units Break on iOS

**Detect**: `100vh`, `height: Xvh`, `width: Xvw`
**Problem**: iOS Safari's auto-hiding nav bar changes the viewport height. `100vh` includes the hidden nav bar area, causing content to overflow or get clipped.
**Severity**: P0
**Affected**: Safari iOS, Firefox iOS
**Fix**:
```css
/* Before */
height: 100vh;

/* After — use dvh with vh fallback */
height: 100vh;
height: 100dvh;
```
Note: `svh`/`lvh` are broken on Firefox iOS (#26), so prefer `dvh` which has better support.

### #17: Flex Gap Unsupported on Older Safari

**Detect**: `gap:`, `row-gap:`, `column-gap:` inside a `display: flex` context
**Problem**: Safari didn't support gap with flexbox until 14.1 (April 2021).
**Severity**: P2 (if targeting modern browsers) or P1 (if supporting Safari < 14.1)
**Affected**: Safari and Safari iOS < 14.1
**Fix**: If supporting older Safari, use margins instead:
```css
/* Before */
.container { display: flex; gap: 8px; }

/* After */
.container { display: flex; }
.container > * + * { margin-left: 8px; }
```

### #18: Safari Aggressively Shrinks Flex Items

**Detect**: `flex-grow` on scrollable child without `flex-shrink: 0` on siblings
**Problem**: Safari shrinks text in non-scrollable flex siblings when one sibling is scrollable with flex-grow.
**Severity**: P1
**Affected**: Safari (all)
**Fix**:
```css
/* Add to non-scrollable flex siblings */
flex-shrink: 0;
```

### #19: `lh` Unit Unsupported on Older Safari

**Detect**: values using `lh` unit (e.g., `5lh`, `2.5lh`)
**Problem**: Line-height unit wasn't supported until recent Safari.
**Severity**: P2
**Affected**: Safari iOS (older)
**Fix**: Use `em` or calculated `px` values instead.

### #20: Scale Transform Percentage Syntax

**Detect**: `transform: scale(` followed by a `%` character
**Problem**: Safari iOS 12 doesn't understand percentage syntax for scale.
**Severity**: P1 (if targeting iOS 12)
**Affected**: Safari iOS 12
**Fix**:
```css
/* Before */
transform: scale(50%);

/* After */
transform: scale(0.5);
```

### #22: CSS Custom Properties Don't Propagate to ::backdrop

**Detect**: CSS variable (e.g., `var(--bg)`) used in `background-image` on `::backdrop` or `body::backdrop`
**Problem**: Safari doesn't update backdrop pseudo-element when CSS custom property changes.
**Severity**: P1
**Affected**: Safari (macOS and iOS)
**Fix**: Use inline styles or hardcoded values for backdrop backgrounds instead of CSS variables.

### #23: Smooth Scrolling Ignored

**Detect**: `scroll-behavior: smooth`
**Problem**: Older Safari iOS ignores this property — scrolling is instant.
**Severity**: P2
**Affected**: Safari iOS (older)
**Fix**: Accept graceful degradation, or use JS-based smooth scrolling as fallback.

### #24: Safari Button Padding

**Detect**: `<button>` elements without explicit `padding` in CSS
**Problem**: Safari's user-agent stylesheet adds extra padding to buttons.
**Severity**: P2
**Affected**: Safari (all)
**Fix**:
```css
button {
  padding: 0; /* or your desired value */
}
```

### #26: `svh`/`lvh` Units Broken on Firefox iOS

**Detect**: `svh`, `lvh` unit usage
**Problem**: Firefox iOS doesn't support these newer viewport units.
**Severity**: P1
**Affected**: Firefox iOS
**Fix**: Use `dvh` with `vh` fallback, or JavaScript-based measurement:
```css
height: 100vh; /* fallback */
height: 100dvh;
```

### #27: Firefox iOS Bottom Cutoff

**Detect**: Missing `env(safe-area-inset-bottom)` in padding/margin on body or root containers
**Problem**: Firefox iOS doesn't account for the home indicator safe area on newer iPhones.
**Severity**: P0
**Affected**: Firefox iOS (notched devices)
**Fix**:
```css
body {
  padding-bottom: env(safe-area-inset-bottom);
}
```
Also requires in HTML: `<meta name="viewport" content="..., viewport-fit=cover">`

### #30: `::selection` Ignored on Safari iOS

**Detect**: `::selection` pseudo-class with functional styling (color, background)
**Problem**: Safari iOS doesn't apply `::selection` styles.
**Severity**: P2
**Affected**: Safari iOS
**Fix**: Don't rely on selection styling for critical UX. Use JavaScript-based highlighting if needed.

### #31: Blur Filter Broken on SVG in Safari

**Detect**: `filter: blur(` or `backdrop-filter: blur(` applied to `<svg>` elements
**Problem**: Safari sometimes fails to render blur filters on SVG content.
**Severity**: P1
**Affected**: Safari (macOS and iOS, older)
**Fix**: Apply blur to a wrapper `<div>` instead of the SVG directly. Use `-webkit-backdrop-filter` for older Safari.

### #40: Scrollbar Styling on Dark Themes

**Detect**: Dark theme (dark `background-color` on body/html) without `scrollbar-color` or `::-webkit-scrollbar` styles
**Problem**: Windows shows white scrollbars that clash with dark themes.
**Severity**: P2
**Affected**: Chrome/Edge on Windows
**Fix**:
```css
/* Standard */
html { scrollbar-color: #555 #1a1a1a; }

/* Fallback for Safari < 26.2 */
::-webkit-scrollbar { background: #1a1a1a; }
::-webkit-scrollbar-thumb { background: #555; }
```

### #42: Double-Tap Zoom on Interactive Elements

**Detect**: `<button>`, `<a>`, or elements with click handlers missing `touch-action: manipulation`
**Problem**: Double-tapping buttons/links triggers browser zoom on mobile.
**Severity**: P1
**Affected**: All mobile browsers
**Fix**:
```css
button, a, [role="button"] {
  touch-action: manipulation;
}
```

### #44: Hover-Dependent Critical Interactions

**Detect**: `:hover` used to show/hide menus, tooltips with essential content, or trigger actions without a click/tap alternative
**Problem**: Touch devices can't hover. Interactions hidden behind `:hover` are inaccessible on mobile.
**Severity**: P1
**Affected**: All mobile/touch browsers
**Fix**: Make hover an enhancement, not a requirement. Use click/tap to toggle visibility:
```css
/* Scope hover to devices that support it */
@media (hover: hover) {
  .element:hover { /* hover styles */ }
}
/* Touch feedback */
.element:active { /* same visual feedback */ }
/* Keyboard focus */
.element:focus-visible { /* focus ring for keyboard users */ }
```
`:focus-visible` is baseline in all browsers (Chrome 86+, Safari 15.4+, Firefox 104+).

---

## JavaScript Patterns

### #3–6: Fullscreen API Broken on iOS

**Detect**: `requestFullscreen()`, `requestFullScreen()`, `webkitRequestFullscreen()`
**Problem**: Fullscreen is disabled on iPhone (#3), wastes space on iPad (#4), exits on scroll (#5), blocks keyboard (#6).
**Severity**: P0
**Affected**: Safari iOS
**Fix**:
```javascript
// Detect iOS — user agent alone misses iPads (they report as macOS since 2019)
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
}

function canFullscreen() {
  return document.fullscreenEnabled && !isIOS();
}

// Use CSS-based full-screen alternative on iOS
async function enterFullscreen(element) {
  if (canFullscreen()) {
    try {
      await element.requestFullscreen();
    } catch (e) {
      element.classList.add('pseudo-fullscreen');
    }
  } else {
    element.classList.add('pseudo-fullscreen');
  }
}
```

### #7, #8: Drag-and-Drop Broken on iOS

**Detect**: `draggable="true"`, `ondragstart`, `addEventListener('dragstart'`, `addEventListener('drag'`
**Problem**: iOS Safari intercepts drag gestures for scrolling. Press-hold-drag selects text instead.
**Severity**: P0
**Affected**: Safari iOS
**Fix**: Use an established library instead of hand-rolling touch events:
- **SortableJS** (`npm install sortablejs`) — vanilla JS, framework-agnostic, built-in touch support
- **dnd-kit** (`npm install @dnd-kit/core`) — React-focused, best touch support in React ecosystem

If hand-rolling: implement `touchstart`/`touchmove`/`touchend` alongside mouse events. Apply `user-select: none` to draggable elements.

### #12: Audio .play() Blocked Without User Gesture

**Detect**: `.play()` called outside of event handler, in `setTimeout`, `setInterval`, `DOMContentLoaded`, `load`, `fetch().then()`
**Problem**: iOS blocks audio playback not initiated by direct user interaction.
**Severity**: P0
**Affected**: Safari iOS
**Fix**: Only call `.play()` inside click/touchend handlers. Prime audio elements during first user interaction:
```javascript
document.addEventListener('click', function initAudio() {
  audioElement.play().then(() => audioElement.pause());
  document.removeEventListener('click', initAudio);
}, { once: true });
```

### #13: Audio Replay Skips First 300ms on Safari

**Detect**: Audio elements played more than once (`.play()` called multiple times on same element)
**Problem**: Safari unloads audio after playback. Replay starts with ~300ms silence while rebuffering.
**Severity**: P1
**Affected**: Safari iOS
**Fix**: Preload audio, or accept 300ms leading silence in sound files. Alternatively, use AudioContext for latency-sensitive sounds.

### #14: Audio .volume Non-Functional on iOS

**Detect**: `.volume =` on HTMLAudioElement
**Problem**: iOS ignores volume changes — the value appears to set but reverts after the event loop.
**Severity**: P1
**Affected**: Safari iOS
**Fix**:
```javascript
// Detect broken volume
function supportsVolume(audio) {
  audio.volume = 0.5;
  return audio.volume === 0.5; // false on iOS
}

// Offer mute toggle instead of volume slider on iOS
```

### #21: ResizeObserver Missing on Older Safari

**Detect**: `new ResizeObserver(` without feature check
**Problem**: Not supported on older Safari iOS.
**Severity**: P2
**Affected**: Safari iOS (older)
**Fix**:
```javascript
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(callback).observe(element);
} else {
  // Fallback: poll with setInterval or use window resize
}
```

### #28: Firefox iOS Fullscreen Crashes

**Detect**: `requestFullscreen()` without try-catch
**Problem**: Firefox iOS overrides the API with a buggy script that throws errors.
**Severity**: P0
**Affected**: Firefox iOS
**Fix**:
```javascript
try {
  await element.requestFullscreen();
} catch (e) {
  // Fallback to CSS-based fullscreen
  element.classList.add('pseudo-fullscreen');
}
```

### #32: Animation API Missing on Older Safari

**Detect**: `element.animate(` without feature check
**Problem**: Web Animations API not available on older Safari iOS.
**Severity**: P2
**Affected**: Safari iOS (older)
**Fix**: Check `typeof element.animate === 'function'` before use; fall back to CSS animations.

### #33: Chrome Audio Promise Rejection

**Detect**: `.pause()` or `.currentTime =` after `.play()` without awaiting the promise
**Problem**: Chrome throws unhandled promise rejection if you interrupt a pending play() call.
**Severity**: P1
**Affected**: Chrome (all)
**Fix**:
```javascript
let playPromise = audio.play();
if (playPromise !== undefined) {
  playPromise.then(() => {
    audio.pause(); // Safe to pause now
  }).catch(() => {
    // Autoplay was prevented or interrupted
  });
}
```

### #34: Firefox AudioContext Pops and Artifacts

**Detect**: `OscillatorNode`, `createOscillator()` used with Firefox as target
**Problem**: Firefox produces popping/clicking sounds with oscillator nodes.
**Severity**: P1
**Affected**: Firefox (macOS and Android)
**Fix**: Add gain ramps at start/end of sounds to avoid abrupt transitions:
```javascript
gain.gain.setValueAtTime(0, ctx.currentTime);
gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01);
// ... sound ...
gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration - 0.01);
```

### #35: AudioContext Requires Webkit Prefix on Older iOS

**Detect**: `new AudioContext()` without `webkitAudioContext` fallback
**Problem**: Older Safari iOS only exposes the prefixed version.
**Severity**: P2 (legacy only — Safari dropped the prefix in 14.1, April 2021)
**Affected**: Safari iOS < 14.1
**Fix**:
```javascript
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const ctx = new AudioCtx();
```
Only flag this if the project targets Safari < 14.1.

### #37: `inert` Attribute Ignored on Older Safari

**Detect**: `inert` attribute or `.inert = true` without polyfill
**Problem**: Older Safari ignores the `inert` attribute entirely. Native support since Safari 15.5 (May 2022), Chrome 102, Firefox 112 (Apr 2023).
**Severity**: P1 (if targeting older browsers)
**Affected**: Safari < 15.5, Firefox < 112
**Fix**: Use the **wicg-inert** polyfill (`npm install wicg-inert`) — it properly traps focus and hides elements from the accessibility tree. A CSS-only hack (`pointer-events: none; user-select: none`) does NOT properly trap focus or hide from screen readers:
```javascript
import 'wicg-inert'; // polyfill for older browsers
element.inert = true;
```

### #39: Clipboard API Missing on Older Safari iOS

**Detect**: `navigator.clipboard` without feature detection
**Problem**: Not available on older iPads.
**Severity**: P1
**Affected**: Safari iOS (older)
**Fix**:
```javascript
if (navigator.clipboard?.writeText) {
  await navigator.clipboard.writeText(text);
} else {
  // Fallback: document.execCommand('copy')
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}
```

### #45: Shift-Click Unavailable on Mobile

**Detect**: `event.shiftKey` or `event.ctrlKey` or `event.metaKey` checked in click/touch handlers for mobile-accessible features
**Problem**: Soft keyboards don't provide modifier key state with taps.
**Severity**: P1
**Affected**: All mobile browsers
**Fix**: Provide alternative interaction (long-press, dedicated button, toggle mode) for mobile users.

### #48: focus() Triggers Soft Keyboard

**Detect**: `.focus()` called on `<input>` or `<textarea>` programmatically (not from user tap on the element itself)
**Problem**: Automatically shows the soft keyboard, consuming 50%+ of the screen.
**Severity**: P2
**Affected**: All mobile browsers
**Fix**: Only call `.focus()` when the input is the user's intended next action. To detect mobile, use `matchMedia('(hover: none) and (pointer: coarse)')` — NOT `'ontouchstart' in window` which triggers on touchscreen laptops too:
```javascript
const isMobile = matchMedia('(hover: none) and (pointer: coarse)').matches;
if (!isMobile) {
  element.focus();
}
```

---

## HTML Patterns

### #25: Missing Viewport Meta Tag

**Detect**: No `<meta name="viewport"` in `<head>`
**Problem**: Mobile browsers apply default scaling, making the page look like a zoomed-out desktop site.
**Severity**: P0
**Affected**: All mobile browsers
**Fix**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

### #15: System Fonts Without Custom Font Fallback

**Detect**: `font-family` using only system font names (Arial, Helvetica, Courier, Times, etc.) without a loaded `@font-face`
**Problem**: Different OSes render system fonts with different weights, sizes, and character sets.
**Severity**: P2
**Affected**: All browsers (cross-platform)
**Fix**: Load custom `woff2` fonts for consistent rendering:
```css
@font-face {
  font-family: 'MyFont';
  src: url('font.woff2') format('woff2');
}
```

### #16: Material Icons Ligatures Broken on Older Safari

**Detect**: Material Icons font usage without `font-feature-settings: "liga"`
**Problem**: Safari's default ligature settings don't match the spec.
**Severity**: P2 (legacy only — Safari handles ligatures correctly since Safari 13, 2019)
**Affected**: Safari iOS < 13
**Fix**:
```css
.material-icons {
  font-feature-settings: "liga";
}
```
Alternative: **Material Symbols** (variable font, no ligatures needed) is Google's successor to Material Icons.

### #38: Draggable Span That Wraps Lines

**Detect**: `<span draggable="true">` containing text that could wrap (long text, no `white-space: nowrap`)
**Problem**: Safari garbles the drag image when inline elements wrap.
**Severity**: P2
**Affected**: Safari iOS
**Fix**: Use `display: inline-block` or `display: block` on draggable elements.

---

## Design Patterns

These require reading component logic, not just pattern matching.

### #9: Invisible Scrollbars

**Problem**: iOS overlay scrollbars disappear when not actively scrolling. Users can't tell what's scrollable.
**Severity**: P1
**Fix**: Add visual scroll indicators — shadows at overflow edges, custom scrollbar styling, or "scroll for more" hints.

### #10: Small Touch Targets

**Problem**: iOS requires finger center on element. Targets under 44x44px are hard to hit.
**Severity**: P1
**Fix**: Ensure minimum 44x44px touch targets. For small visual elements, add invisible hit area:
```css
.small-button::before {
  content: '';
  position: absolute;
  inset: -12px; /* expand hit area */
}
```

### #11: AudioContext Routes to Ring Volume on iOS

**Problem**: OscillatorNode output goes to ring volume, not media volume. Users think sound is broken.
**Severity**: P1
**Fix**: Use `<audio>` tags instead of AudioContext for sound effects on iOS. If AudioContext is required, instruct users to check ring volume.

### #29: Pinch-Zoom Missing Pixels

**Problem**: After pinch-zooming, pixels disappear from top of screen. No event fires.
**Severity**: P1
**Fix**: Apply `position: fixed; top: 0; left: 0;` to root element.

### #36: iPad GainNode Linear Ramp Broken (iOS 12)

**Problem**: `linearRampToValueAtTime` produces wrong gain curve on iOS 12 — sounds become slide whistles.
**Severity**: P2
**Fix**: Use `setValueAtTime` with manual steps instead of linear ramps on iOS 12, or accept degraded audio.

### #41: Touch Gestures Reserved by Browser

**Problem**: Mobile browsers claim swipe, edge-swipe, and drag for navigation/scrolling. Web apps don't receive these events reliably.
**Severity**: P1
**Fix**: Use `touch-action` CSS to opt out of browser gestures where appropriate. Implement `touchstart`/`touchmove`/`touchend` handlers with `preventDefault()`.

### #43: "Click" vs "Tap" Terminology

**Problem**: "Click" is confusing on touch-only devices.
**Severity**: P3
**Fix**: Detect input type and show appropriate verb:
```javascript
// 'ontouchstart' in window is wrong here — touchscreen laptops expose it too
const isTouch = matchMedia('(hover: none) and (pointer: coarse)').matches;
const verb = isTouch ? 'Tap' : 'Click';
```

### #46, #47: Soft Keyboard Covers Content

**Problem**: Soft keyboard consumes 50%+ of screen (even more in landscape), hiding important context.
**Severity**: P1
**Fix**: Scroll the focused input into view. Keep critical context above the input. Consider redesigning to avoid text input on mobile where possible.

### #49: No Responsive Layout

**Problem**: Desktop-only layouts are unusable on phones. Need at least two breakpoints.
**Severity**: P3
**Fix**: Implement responsive design with `@media` queries. Mobile-first approach recommended.

### #50: CSS Absolute Units Don't Match Physical Size

**Problem**: `1cm` in CSS doesn't equal 1 physical centimeter. Varies by device and zoom.
**Severity**: P3
**Fix**: Don't rely on CSS absolute units for physical accuracy. Design using relative units and breakpoints.
