# Basics of Testing Components

Source: https://v20.angular.dev/guide/testing/components-basics

A component combines an HTML template and a TypeScript class working together. To test properly, you need to test them working together, which requires creating the component's host element in the browser DOM.

`TestBed` facilitates this kind of testing.

## Component DOM testing

Classes alone can't tell you if the component renders properly, responds to user input, or integrates with parent/child components. You need DOM testing for that.

### CLI-generated test structure

```typescript
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BannerComponent } from './banner.component';

describe('BannerComponent', () => {
  let component: BannerComponent;
  let fixture: ComponentFixture<BannerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BannerComponent] });
    fixture = TestBed.createComponent(BannerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should contain "banner works!"', () => {
    const bannerElement: HTMLElement = fixture.nativeElement;
    expect(bannerElement.textContent).toContain('banner works!');
  });

  it('should have <p> with "banner works!"', () => {
    const bannerElement: HTMLElement = fixture.nativeElement;
    const p = bannerElement.querySelector('p')!;
    expect(p.textContent).toEqual('banner works!');
  });
});
```

## `createComponent()`

`TestBed.createComponent(BannerComponent)` creates a component instance, adds its element to the test-runner DOM, and returns a `ComponentFixture`.

**Important:** Do not re-configure `TestBed` after calling `createComponent`. The method freezes the current `TestBed` definition.

## `ComponentFixture`

The `ComponentFixture` is a test harness for interacting with the created component and its element.

```typescript
const fixture = TestBed.createComponent(BannerComponent);
const component = fixture.componentInstance;
expect(component).toBeDefined();
```

## `nativeElement`

`fixture.nativeElement` returns the component's root DOM element (type `any`, but in browser tests it's always an `HTMLElement`).

```typescript
const bannerElement: HTMLElement = fixture.nativeElement;
const p = bannerElement.querySelector('p')!;
expect(p.textContent).toEqual('banner works!');
```

`fixture.nativeElement` is actually shorthand for `fixture.debugElement.nativeElement`.

## `DebugElement`

Angular wraps native elements in `DebugElement` to work safely across all supported platforms. Use it for platform-safe queries.

```typescript
import { DebugElement } from '@angular/core';

const bannerDe: DebugElement = fixture.debugElement;
const bannerEl: HTMLElement = bannerDe.nativeElement;
const p = bannerEl.querySelector('p')!;
expect(p.textContent).toEqual('banner works!');
```

## `By.css()`

For platform-safe element selection, use `DebugElement.query()` with `By.css()`:

```typescript
import { By } from '@angular/platform-browser';

const bannerDe: DebugElement = fixture.debugElement;
const paragraphDe = bannerDe.query(By.css('p'));
const p: HTMLElement = paragraphDe.nativeElement;
expect(p.textContent).toEqual('banner works!');
```

`By.css()` selects `DebugElement` nodes with a standard CSS selector. When filtering by CSS and only testing browser-native properties, `querySelector()` is often simpler and clearer.
