# Runtime Performance Optimization

Source: https://v20.angular.dev/best-practices/runtime-performance

---

## Overview

**Change detection** is the process through which Angular checks whether application state has changed and updates the DOM accordingly. Angular walks components top-to-bottom, looking for changes.

Change detection triggers:
- Manually via `ChangeDetectorRef`
- Asynchronous events (user interactions, XHR completions, etc.)

Change detection is highly optimized but can cause slowdowns if triggered too frequently.

## Performance Subtopics

- **[Zone Pollution](zone-pollution.md)** — Identifying and fixing unnecessary change detection triggered by `setTimeout`, `setInterval`, `requestAnimationFrame`, or third-party libraries
- **[Slow Computations](slow-computations.md)** — Profiling and optimizing expensive template expressions and lifecycle hooks
- **[Skipping Component Subtrees](skipping-subtrees.md)** — Using `OnPush` change detection strategy to skip subtrees
- **[Profiling with Chrome DevTools](profiling-with-chrome-devtools.md)** — Angular's integration with Chrome DevTools performance panel
- **[Zoneless](zoneless.md)** — Removing ZoneJS entirely for maximum performance

## Tools

- **[Angular DevTools](https://angular.dev/tools/devtools)** — Browser extension for profiling change detection cycles
- **Chrome DevTools Performance Panel** — Framework-aware profiling via Angular's integration with the Chrome DevTools extensibility API
