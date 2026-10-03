# Profiling with Chrome DevTools

Source: https://v20.angular.dev/best-practices/profiling-with-chrome-devtools

Angular integrates with the [Chrome DevTools extensibility API](https://developer.chrome.com/docs/devtools/performance/extension) to show framework-specific data directly in the Chrome DevTools performance panel.

---

## Enabling Profiling

**Note:** Angular profiling works exclusively in development mode.

**Option 1 — Chrome console:**
```js
ng.enableProfiling()
```

**Option 2 — Application startup code** (captures all events including bootstrap):
```ts
import { enableProfiling } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { MyApp } from './my-app';

// Must be called BEFORE bootstrapApplication
enableProfiling();
bootstrapApplication(MyApp);
```

---

## Recording a Profile

Use the **Record** button in the Chrome DevTools performance panel. See [Chrome DevTools docs](https://developer.chrome.com/docs/devtools/performance#record).

---

## Reading the Profile

The profiler shows two correlated tracks:
- **Standard Chrome track** — browser-level function/method calls
- **Angular custom track** — framework-specific data (components, change detection, lifecycle hooks)

### Color Coding

| Color | Meaning |
|---|---|
| 🟦 Blue | TypeScript code written by the developer (services, constructors, lifecycle hooks) |
| 🟪 Purple | Template code written by the developer, compiled by Angular |
| 🟩 Green | Entry points to application code — identifies *reasons* for executing code |

### Common Scenarios

#### Application Bootstrap
- Blue: `bootstrapApplication` call, root component instantiation, initial CD
- Green: DI services instantiated during bootstrap

#### Component Execution
- Blue entry point → Purple template execution → Green directive instantiation + lifecycle hooks

#### Change Detection
- Blue synchronization passes traversing component subsets
- Skipped `OnPush` components are visually absent

**Watch for multiple synchronization passes in one CD cycle** — indicates state is being updated *during* change detection. This slows updates and can cause infinite loops.

---

## Use Cases

- Determine if slow code is Angular app code vs. third-party scripts (other scripts have no Angular track data)
- Identify performance bottlenecks by component
- Understand change detection cycle structure visually
- Count CD synchronization passes (multiple passes = state mutating during CD)
