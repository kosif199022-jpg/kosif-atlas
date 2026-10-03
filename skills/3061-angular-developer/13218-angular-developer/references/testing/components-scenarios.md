# Component Testing Scenarios

Source: https://v20.angular.dev/guide/testing/components-scenarios

## Component binding and `detectChanges()`

`createComponent()` does NOT trigger change detection. Always call `fixture.detectChanges()` explicitly:

```typescript
describe('BannerComponent', () => {
  let component: BannerComponent;
  let fixture: ComponentFixture<BannerComponent>;
  let h1: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(BannerComponent);
    component = fixture.componentInstance;
    h1 = fixture.nativeElement.querySelector('h1');
  });

  it('no title in the DOM after createComponent()', () => {
    expect(h1.textContent).toEqual('');  // No binding yet!
  });

  it('should display original title after detectChanges()', () => {
    fixture.detectChanges();
    expect(h1.textContent).toContain(component.title());
  });

  it('should display a different test title', () => {
    component.title.set('Test Title');
    fixture.detectChanges();
    expect(h1.textContent).toContain('Test Title');
  });
});
```

## Automatic change detection

Use `ComponentFixtureAutoDetect` to run change detection automatically (like production):

```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [{ provide: ComponentFixtureAutoDetect, useValue: true }],
  });
  fixture = TestBed.createComponent(BannerComponent);
});

it('should display original title', () => {
  // No fixture.detectChanges() needed!
  expect(h1.textContent).toContain(comp.title());
});

it('should update after signal change + whenStable', async () => {
  comp.title.set('Test Title');
  await fixture.whenStable();
  expect(h1.textContent).toContain('Test Title');
});
```

Also available: `fixture.autoDetectChanges()` to enable it mid-test. Automatic change detection is on by default with `provideZonelessChangeDetection`.

## Simulating user input with `dispatchEvent()`

Angular doesn't detect input value changes until a DOM event fires:

```typescript
it('should convert hero name to Title Case', async () => {
  const nameInput: HTMLInputElement = hostElement.querySelector('input')!;
  nameInput.value = 'quick BROWN  fOx';
  nameInput.dispatchEvent(new Event('input'));  // Required!
  await fixture.whenStable();
  expect(nameDisplay.textContent).toBe('Quick Brown  Fox');
});
```

## Component with external template files

When using `templateUrl`/`styleUrls` in non-CLI environments, call `compileComponents()`:

```typescript
beforeEach(waitForAsync(() => {
  TestBed.configureTestingModule({ imports: [BannerComponent] })
    .compileComponents();  // inline template + CSS compilation
}));
```

Not needed when using `ng test` (CLI compiles before running tests).

## Component with a dependency (service)

Use a stub/spy instead of the real service to avoid complex setup:

```typescript
const userServiceStub: Partial<UserService> = {
  isLoggedIn: () => true,
  user: signal({ name: 'Test User' }),
};

beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [WelcomeComponent],
    providers: [{ provide: UserService, useValue: userServiceStub }],
  });
  fixture = TestBed.createComponent(WelcomeComponent);
  userService = TestBed.inject(UserService);
  fixture.detectChanges();
});
```

Get the injected service from the component's injector (always works):
```typescript
// Safe - from component injector
const userService = fixture.debugElement.injector.get(UserService);
// Also works for root-provided services
const userService = TestBed.inject(UserService);
```

## Async service testing with `fakeAsync` and `tick()`

```typescript
it('should show quote after getQuote (fakeAsync)', fakeAsync(() => {
  fixture.detectChanges();     // ngOnInit → triggers async call
  expect(quoteEl.textContent).toBe('...');   // loading state

  tick();                      // flush the observable
  fixture.detectChanges();

  expect(quoteEl.textContent).toBe(testQuote);
  expect(errorMessage()).toBeNull('should not show error');
}));
```

## Async with `waitForAsync`

```typescript
it('should show quote after getQuote (waitForAsync)', waitForAsync(() => {
  fixture.detectChanges();
  fixture.whenStable().then(() => {
    fixture.detectChanges();
    expect(quoteEl.textContent).toBe(testQuote);
    expect(errorMessage()).toBeNull();
  });
}));
```

## Routing components (`RouterLink`)

For components that use `RouterLink`, provide a stub to avoid full router setup:

```typescript
@Directive({ selector: '[routerLink]' })
class RouterLinkDirectiveStub {
  @Input('routerLink') linkParams: any;
  navigatedTo: any = null;
  @HostListener('click') onClick() {
    this.navigatedTo = this.linkParams;
  }
}
```

Or use `provideRouter(routes)` for a real (but minimal) router in tests.

## Nested component tests

For components with child components, you have options:

### Option 1: Use real child component (integration test)
Import the child in `TestBed.configureTestingModule`.

### Option 2: Stub the child (unit test isolation)
```typescript
@Component({ selector: 'app-child', template: '' })
class StubChildComponent {}

beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [ParentComponent, StubChildComponent],
  }).overrideComponent(ParentComponent, {
    set: { imports: [StubChildComponent] }
  });
});
```

### Option 3: Use `NO_ERRORS_SCHEMA` (shallow testing)
```typescript
TestBed.configureTestingModule({
  declarations: [ParentComponent],
  schemas: [NO_ERRORS_SCHEMA]  // ignore unknown elements
});
```

## Using `overrideComponent`

Override any aspect of a component after `configureTestingModule`:

```typescript
TestBed.configureTestingModule({ imports: [HeroDetailComponent] })
  .overrideComponent(HeroDetailComponent, {
    set: { providers: [{ provide: HeroDetailService, useClass: HeroDetailServiceSpy }] }
  });
```

## Page object pattern

Encapsulate DOM queries in a Page object for cleaner tests:

```typescript
class Page {
  get buttons() { return this.queryAll<HTMLButtonElement>('button'); }
  get saveBtn() { return this.buttons[0]; }
  get nameInput() { return this.query<HTMLInputElement>('input'); }
  get nameDisplay() { return this.query<HTMLElement>('span'); }

  private query<T>(selector: string): T {
    return harness.routeNativeElement!.querySelector(selector)! as T;
  }
  private queryAll<T>(selector: string): T[] {
    return harness.routeNativeElement!.querySelectorAll(selector) as any as T[];
  }
}
```

## `waitForAsync` for async `beforeEach`

```typescript
beforeEach(waitForAsync(() => {
  TestBed.configureTestingModule({ imports: [AppComponent] })
    .compileComponents();
}));
```
