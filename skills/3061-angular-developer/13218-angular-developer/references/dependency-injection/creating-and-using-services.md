# Creating and Using Services

Source: https://v20.angular.dev/guide/di/creating-and-using-services

## Creating a Service

### Via CLI

```bash
ng generate service CUSTOM_NAME
```

Creates `src/app/CUSTOM_NAME.service.ts`.

### Manually

Add `@Injectable()` decorator to a TypeScript class:

```ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BasicDataStore {
  private data: string[] = [];

  addData(item: string): void {
    this.data.push(item);
  }

  getData(): string[] {
    return [...this.data];
  }
}
```

## How `providedIn: 'root'` Works

When you use `@Injectable({ providedIn: 'root' })`, Angular:

- **Creates a single instance** (singleton) for the entire application
- **Makes it available everywhere** without additional configuration
- **Enables tree-shaking** — the service is only included in the bundle if it's actually used

This is the recommended approach for most services.

## Injecting a Service

Once created with `providedIn: 'root'`, inject it anywhere using `inject()`:

### Into a Component

```ts
import { Component, inject } from '@angular/core';
import { BasicDataStore } from './basic-data-store';

@Component({
  selector: 'app-example',
  template: `
    <div>
      <p>{{ dataStore.getData() }}</p>
      <button (click)="dataStore.addData('More data')">Add more data</button>
    </div>
  `
})
export class ExampleComponent {
  dataStore = inject(BasicDataStore);
}
```

### Into Another Service

```ts
import { inject, Injectable } from '@angular/core';
import { AdvancedDataStore } from './advanced-data-store';

@Injectable({ providedIn: 'root' })
export class BasicDataStore {
  private advancedDataStore = inject(AdvancedDataStore);
  private data: string[] = [];

  addData(item: string): void {
    this.data.push(item);
  }

  getData(): string[] {
    return [...this.data, ...this.advancedDataStore.getData()];
  }
}
```

## Next Steps

`providedIn: 'root'` covers most use cases. Angular also offers:

- **Component-specific instances** — when components need isolated service instances
- **Manual configuration** — for services requiring runtime configuration
- **Factory providers** — for dynamic service creation based on runtime conditions
- **Value providers** — for providing configuration objects or constants

See [defining dependency providers](/guide/di/defining-dependency-providers) for these advanced patterns.
