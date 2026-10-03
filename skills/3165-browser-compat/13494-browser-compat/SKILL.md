---
name: browser-compat
description: Audit frontend code for 50 cross-browser bugs and mobile compatibility pitfalls
license: MIT
disable-model-invocation: true
---

# Browser Compatibility Audit

Scan a frontend codebase for 50 documented cross-browser bugs and produce a prioritized fix report. Based on [Fifty Problems with Standard Web APIs in 2025](https://zerotrickpony.com/articles/browser-bugs/).

## Step 1: Determine Scope

Infer the scope from context when you can:

| Trigger | Scope |
|---------|-------|
| Specific file or component | That file/component and its styles |
| "check my app" / "audit the frontend" | Scan all HTML, CSS, JS/TS in the project |
| Specific symptom ("audio broken on iOS") | Targeted scan for related bug patterns |

When no trigger fits, ask with `AskUserQuestion` and offer those three scopes as
the options rather than a free-text question.

For project-wide scans, list the frontend files first: every tracked file with
one of these extensions, skipping `node_modules`, build output, and anything
gitignored:

```
html css scss less js jsx ts tsx vue svelte
```

## Step 2: Scan for Bug Patterns

Read `references/bug-catalog.md` for the full catalog of 50 bugs with detection patterns and fixes.

Scan code in four passes, checking each file against the relevant patterns. The
passes share no data, so for a project-wide scan dispatch all four as parallel
subagents in one message and have each return only its findings. This keeps the
file contents out of the context that writes the report. A subagent starts
without this skill in context, so put three things in each delegation message:
the file list from Step 1, the pass's pattern list below, and the absolute path
of `references/bug-catalog.md` with the instruction to read it before scanning.

### Pass 1: CSS / Styling

Search for these high-signal patterns across all stylesheets and style blocks:

- `100vh` or `100vw` without `dvh` fallback — **viewport units break on iOS** (#1, #2)
- `svh` or `lvh` usage — **broken on Firefox iOS** (#26). Prefer `dvh` instead
- `flex-grow` in scrollable containers without `flex-shrink: 0` on siblings — **Safari shrinks text** (#18)
- `::selection` for critical UI — **ignored on Safari iOS** (#30)
- `filter: blur()` on `<svg>` elements — **broken on Safari** (#31)
- Dark theme without `scrollbar-color` — **white scrollbars on Windows** (#40). Safari gained `scrollbar-color` in 26.2; add `::-webkit-scrollbar` only when the project targets earlier Safari
- `:hover` for critical interactions (menus, tooltips with content) — **unavailable on touch** (#44). Fix with `@media (hover: hover)` scoping, add `:active` for touch feedback and `:focus-visible` for keyboard users
- Missing `touch-action: manipulation` on interactive elements — **double-tap zoom** (#42)
- `<button>` without explicit padding reset — **Safari adds extra padding** (#24)
- CSS custom properties in `background-image` on `::backdrop` — **Safari doesn't propagate** (#22). No fixed version is known; verify against current Safari before reporting
- Missing `env(safe-area-inset-bottom)` — **Firefox iOS cuts off bottom** (#27). Requires `viewport-fit=cover` in meta tag to work

Also check (older browsers — still report these, but at lower severity with a note about which versions are affected):
- `gap` with `display: flex` — unsupported on Safari < 14.1 (April 2021) (#17)
- `scroll-behavior: smooth` — ignored on Safari < 15.4 (#23)
- `transform: scale(%)` with percentage — breaks on Safari iOS 12 (#20)
- `lh` unit usage — unsupported on Safari < 16.4; use `em` fallback (#19)

### Pass 2: JavaScript / TypeScript

Search for these patterns in script files:

- `requestFullscreen()` without iOS detection/fallback — **disabled on iPhone, buggy on iPad** (#3–6). For iOS detection, the user agent string alone is unreliable — iPads report as macOS since iPadOS 13 (2019). Use:
  ```js
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  ```
- `.play()` called outside user event handler — **blocked on iOS** (#12). The play-then-pause priming pattern inside a click handler is still the standard fix
- `.volume =` on audio elements — **non-functional on iOS** (#14). No fixed version is known; feature-detect at runtime. Use `.muted = true/false` for muting; use GainNode for volume control
- `.pause()` or `.currentTime =` during pending `.play()` promise — **Chrome throws rejection** (#33). The MDN-recommended pattern: check if `.play()` returns a promise, `.then()` before pausing
- `navigator.clipboard` without feature detection — **missing on older Safari iOS** (#39). Fallback to `document.execCommand('copy')` (deprecated but still the only synchronous alternative)
- `element.focus()` on input in mobile context — **triggers soft keyboard** (#48). Don't use `'ontouchstart' in window` to detect mobile — touchscreen laptops expose it too. Use `matchMedia('(hover: none) and (pointer: coarse)')` or avoid programmatic focus on inputs universally
- HTML5 drag-and-drop (`draggable="true"`) without touch fallback — **broken on iOS** (#7, #8). Recommend established libraries: **SortableJS** (vanilla/framework-agnostic) or **dnd-kit** (React). Hand-rolling touch events is error-prone
- `MouseEvent.shiftKey` in mobile interaction paths — **never true on mobile** (#45)
- OscillatorNode without gain envelope — **pops on Firefox** (#34). Still valid; use `linearRampToValueAtTime` for fade-in/out

Also check (older browsers — still report these, but at lower severity with a note about which versions are affected):
- `new AudioContext()` without `webkitAudioContext` fallback — Safari dropped the prefix in 14.1 (Apr 2021) (#35)
- `element.animate()` without fallback — Web Animations API is native since Safari 13.1 (2020) (#32)
- `ResizeObserver` without fallback — native since Safari 13.1 (2020) (#21)
- `inert` attribute without fallback — native since Safari 15.5 (2022), Firefox 112 (2023) (#37). If supporting older browsers, use the **wicg-inert** polyfill (`npm install wicg-inert`) rather than a CSS hack — `pointer-events: none` doesn't trap focus or hide from the accessibility tree
- Material Icons via ligatures without `font-feature-settings: "liga"` — only needed for Safari < 13 (2019). Consider recommending Material Symbols (variable font, no ligatures) as the modern alternative (#16)

### Pass 3: HTML / Structure

Check HTML files and templates:

- Missing `<meta name="viewport" content="width=device-width, initial-scale=1">` — **mobile rendering breaks** (#25)
- System font names (Arial, Courier, etc.) without `woff2` fallback — **inconsistent rendering** (#15)
- Draggable `<span>` that can wrap lines — **garbled drag image on Safari** (#38)
- UI text using "click" without touch-aware alternatives — **confusing on mobile** (#43)

### Pass 4: Design Review (judgment-based)

These aren't grep-able — assess by reading component logic:

- Scrollable containers without visible scroll indicators — **invisible scrollbars on iOS** (#9). CSS scroll shadows (`background-attachment: local`) are the best pure-CSS approach (works on iOS 15+)
- Small touch targets (< 44px) without invisible hit-area expansion — **iOS miss-taps** (#10). Minimum 44px per Apple HIG and WCAG 2.2 AAA; 48dp for Material apps
- AudioContext with OscillatorNode — **routes to ring volume on iOS, pops on Firefox** (#11, #34)
- Audio elements played more than once — **first 300ms cut on Safari replay** (#13)
- Soft keyboard overlapping important context — **50%+ screen consumed** (#46, #47)
- Desktop-only layout without responsive breakpoints — **unusable on phone** (#49)
- Reliance on CSS absolute units (`cm`, `mm`) — **don't match real measurements** (#50)
- Pinch-zoom without `position: fixed` root — **missing pixels after zoom** (#29)
- Fullscreen + scroll — **exits fullscreen on Safari** (#5)
- Fullscreen + keyboard input — **keyboard blocked on Safari** (#6)

## Step 3: Generate Report

Produce a severity-ranked report. Group findings by severity, then by file.

### Severity Levels

| Level | Meaning | Criteria |
|-------|---------|----------|
| **P0 — Broken** | Feature silently fails | Audio won't play, fullscreen crashes, API missing, content cut off |
| **P1 — Degraded** | Feature works but poorly | Text shrinks, scrollbars invisible, 300ms audio skip, wrong font |
| **P2 — Cosmetic** | Visual glitch only | Extra button padding, white scrollbars, drag image garbled |
| **P3 — Design** | Design anti-pattern | Hover-dependent UI, click vs tap wording, no responsive layout |

### Report Format

```markdown
# Browser Compatibility Audit

## Summary
- **X issues found**
  - P0 — N
  - P1 — N
  - P2 — N
  - P3 — N
- Most affected platforms: [list]
## P0 — Broken (N)

### [Bug title] (#N)
- **File**: path/to/file.ext:LINE
- **Pattern found**: `code snippet`
- **Impact**: What breaks, on which browser/platform
- **Fix**:
  ```diff
  - problematic code
  + fixed code
  ```
- **Library/polyfill** (if applicable): package name and install command

## P1 — Degraded (N)
...

## P2 — Cosmetic (N)
...

## P3 — Design (N)
...
```

For each finding, provide a concrete diff showing the fix — not just a description. When a well-known library or polyfill exists for a problem, recommend it by name with an install command.

## Step 4: Offer to Apply Fixes

After presenting the report, offer to apply fixes grouped by severity:

> "Found X issues. Want me to fix all P0s now? I can also fix P1s and P2s — P3s require design decisions so I'll just flag those."

Apply fixes carefully — some are one-line changes, others require restructuring. For fixes that need design decisions (like replacing hover menus with click-to-toggle), explain the tradeoff and let the user choose.

## Notes

- Always report all issues found, including ones that only affect older browsers. For legacy issues, note which browser versions are affected so the user can decide relevance. Don't omit them — the user may be targeting older browsers or kiosk devices. Do assign them lower severity (P2/P3) when they only affect browsers with < 1% market share.
- Some fixes conflict — e.g., `svh` fixes viewport on Safari but breaks on Firefox iOS. The report should note when a fix introduces a different bug.
- The bug numbers (#N) reference the original article for context. Include them so the user can read more.
- For iOS detection, never rely solely on user agent strings — iPads report as macOS since 2019. Use `navigator.maxTouchPoints` combined with user agent.
- For mobile detection (e.g., avoiding focus()), use `matchMedia('(hover: none) and (pointer: coarse)')` instead of `'ontouchstart' in window` — the latter triggers on touchscreen laptops too.

### Recommended Libraries & Polyfills

When a bug has a well-known library/polyfill solution, recommend it over hand-rolled fixes:

| Problem | Library | Install | Notes |
|---------|---------|---------|-------|
| Drag-and-drop touch support | SortableJS | `npm install sortablejs` | Vanilla JS, framework-agnostic |
| Drag-and-drop (React) | dnd-kit | `npm install @dnd-kit/core` | Best touch support for React |
| `inert` polyfill (Safari < 15.5) | wicg-inert | `npm install wicg-inert` | Proper focus trapping + a11y |

Most other APIs (ResizeObserver, Clipboard, Web Animations, smooth scroll) shipped in Safari 13.1 to 15.4 and need no polyfill for any browser at or above those versions.
