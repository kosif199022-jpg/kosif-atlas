# Resolving Zone Pollution

Source: https://v20.angular.dev/best-practices/zone-pollution

---

## What is Zone Pollution?

**Zone.js** is a signaling mechanism Angular uses to detect when app state might have changed. It patches async operations (`setTimeout`, network requests, event listeners) and triggers change detection after them.

**Zone pollution** = scheduled tasks/microtasks that don't change the data model but still trigger unnecessary change detection. Common sources:
- `requestAnimationFrame`, `setTimeout`, `setInterval`
- Third-party library initialization that registers event listeners or timers

---

## Identifying Zone Pollution

Use Angular DevTools profiler — look for consecutive bars in the timeline with source `setTimeout`, `setInterval`, `requestAnimationFrame`, or event handlers, especially from third-party libraries.

---

## Run Tasks Outside `NgZone`

Use `NgZone.runOutsideAngular()` to prevent change detection from triggering:

```ts
import { Component, NgZone, OnInit } from '@angular/core';

@Component(...)
class AppComponent implements OnInit {
  private ngZone = inject(NgZone);

  ngOnInit() {
    // setInterval runs outside Angular zone — no CD triggered after pollForUpdates
    this.ngZone.runOutsideAngular(() => setInterval(pollForUpdates, 500));
  }
}
```

### Third-Party Library Initialization

```ts
import * as Plotly from 'plotly.js-dist-min';

@Component(...)
class AppComponent implements OnInit {
  private ngZone = inject(NgZone);

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      Plotly.newPlot('chart', data);
      // All event listeners registered by Plotly also run outside the zone
    });
  }
}
```

### Re-Entering the Angular Zone When Needed

If event handlers initialized outside the zone need to trigger Angular updates:

```ts
private async createPlotly() {
  const plotly = await Plotly.newPlot('chart', data);

  plotly.on('plotly_click', (event: Plotly.PlotMouseEvent) => {
    // Re-enter Angular zone to trigger change detection
    this.ngZone.run(() => {
      this.plotlyClick.emit(event);
    });
  });
}
```

### Checking Zone Status

```ts
// Check whether current code is running inside Angular zone
console.log(NgZone.isInAngularZone());
```

---

## Key Rule

- Initialize third-party libraries with side effects (event listeners, timers) **outside** the Angular zone.
- Re-enter the zone via `ngZone.run()` only when the event handler needs to trigger view updates.
