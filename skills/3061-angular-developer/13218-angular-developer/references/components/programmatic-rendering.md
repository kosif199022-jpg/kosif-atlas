# Programmatically Rendering Components

Source: https://v20.angular.dev/guide/components/programmatic-rendering

Two main ways to render components programmatically:
1. In a template using `NgComponentOutlet`
2. In TypeScript using `ViewContainerRef`

> For lazy-loading, prefer the built-in [`@defer` feature](https://v20.angular.dev/guide/templates/defer) — it automatically code-splits and loads components only when needed.

## Using `NgComponentOutlet`

A structural directive that dynamically renders a given component in a template:

```typescript
@Component({
  ...,
  template: `
    <p>Profile for {{user.name}}</p>
    <ng-container *ngComponentOutlet="getBioComponent()" />
  `
})
export class CustomDialog {
  user = input.required<User>();

  getBioComponent() {
    return this.user().isAdmin ? AdminBio : StandardBio;
  }
}
```

See [NgComponentOutlet API reference](https://v20.angular.dev/api/common/NgComponentOutlet) for full capabilities.

## Using `ViewContainerRef`

A **view container** is a node in Angular's component tree that can contain content. Inject `ViewContainerRef` to get a reference to a view container at that component/directive's DOM location.

```typescript
@Component({
  selector: 'inner-item',
  template: `<button (click)="loadContent()">Load content</button>`,
})
export class InnerItem {
  private viewContainer = inject(ViewContainerRef);

  loadContent() {
    this.viewContainer.createComponent(LeafContent);
  }
}
```

`createComponent` appends the new component as the **next sibling** of the component that injected `ViewContainerRef`.

## Lazy-Loading Components

```typescript
@Component({
  ...,
  template: `
    <ng-container *ngComponentOutlet="advancedSettings" />
    <button (click)="loadAdvanced()">Load advanced settings</button>
  `
})
export class AdminSettings {
  advancedSettings: {new(): AdvancedSettings} | undefined;

  async loadAdvanced() {
    const { AdvancedSettings } = await import('path/to/advanced_settings.js');
    this.advancedSettings = AdvancedSettings;
  }
}
```

## Binding Inputs, Outputs and Host Directives at Creation

Use `inputBinding()`, `outputBinding()`, and `twoWayBinding()` helpers in the `bindings` array. Use `directives` array to apply host directives:

### `ViewContainerRef.createComponent` (inline in view hierarchy)

Use when the dynamic component should become part of the container's logical and visual structure:

```typescript
@Component({ template: `<ng-container #container />` })
export class HostComponent {
  private vcr = inject(ViewContainerRef);
  readonly canClose = signal(true);
  readonly isExpanded = signal(true);

  showWarning() {
    const compRef = this.vcr.createComponent(AppWarningComponent, {
      bindings: [
        inputBinding('canClose', this.canClose),
        twoWayBinding('isExpanded', this.isExpanded),
        outputBinding<boolean>('close', (confirmed) => {
          console.log('Closed with result:', confirmed);
        })
      ],
      directives: [
        FocusTrap,
        { type: ThemeDirective, bindings: [inputBinding('theme', () => 'warning')] }
      ]
    });
  }
}
```

### Standalone `createComponent` with `hostElement` (overlays, popups)

Use when rendering outside the current view hierarchy (e.g., `document.body`). The `hostElement` becomes the component's host in the DOM:

```typescript
@Injectable({ providedIn: 'root' })
export class PopupService {
  private readonly injector = inject(EnvironmentInjector);
  private readonly appRef = inject(ApplicationRef);

  show(message: string) {
    const host = document.createElement('popup-host');

    const ref = createComponent(PopupComponent, {
      environmentInjector: this.injector,
      hostElement: host,
      bindings: [
        inputBinding('message', () => message),
        outputBinding('closed', () => {
          document.body.removeChild(host);
          this.appRef.detachView(ref.hostView);
          ref.destroy();
        }),
      ],
    });

    // Register with change detection
    this.appRef.attachView(ref.hostView);
    // Insert into DOM
    document.body.appendChild(host);
  }
}
```

### Key Differences

| Method | Use case |
|--------|----------|
| `ViewContainerRef.createComponent` | Inline in view hierarchy — component becomes sibling in the component tree |
| `createComponent` + `hostElement` | Outside view hierarchy (overlays, modals) — full control over DOM placement |
