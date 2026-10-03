# Testing Attribute Directives

Source: https://v20.angular.dev/guide/testing/attribute-directives

An attribute directive modifies the behavior of an element, component, or another directive.

## The problem with component-by-component testing

Testing a directive in each component that uses it is tedious, brittle, and unlikely to achieve full coverage. A better approach: create an artificial test component that exercises all the ways the directive can be applied.

## Create a dedicated test component

```typescript
@Component({
  template: `
    <h2 highlight="yellow">Something Yellow</h2>
    <h2 highlight>The Default (Gray)</h2>
    <h2>No Highlight</h2>
    <input #box [highlight]="box.value" value="cyan" />
  `,
  imports: [HighlightDirective],
})
class TestComponent {}

describe('HighlightDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let des: DebugElement[];   // elements with the directive
  let bareH2: DebugElement;  // element WITHOUT the directive

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      imports: [HighlightDirective, TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();

    // All elements with the HighlightDirective
    des = fixture.debugElement.queryAll(By.directive(HighlightDirective));
    // h2 without the directive
    bareH2 = fixture.debugElement.query(By.css('h2:not([highlight])'));
  });

  it('should have three highlighted elements', () => {
    expect(des.length).toBe(3);
  });

  it('should color 1st <h2> background "yellow"', () => {
    const bgColor = des[0].nativeElement.style.backgroundColor;
    expect(bgColor).toBe('yellow');
  });

  it('should color 2nd <h2> background w/ default color', () => {
    const dir = des[1].injector.get(HighlightDirective) as HighlightDirective;
    const bgColor = des[1].nativeElement.style.backgroundColor;
    expect(bgColor).toBe(dir.defaultColor);
  });

  it('should bind <input> background to value color', () => {
    const input = des[2].nativeElement as HTMLInputElement;
    expect(input.style.backgroundColor).withContext('initial').toBe('cyan');

    input.value = 'green';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input.style.backgroundColor).withContext('changed').toBe('green');
  });

  it('bare <h2> should not have a customProperty', () => {
    expect(bareH2.properties['customProperty']).toBeUndefined();
  });

  it('can inject `HighlightDirective` in 1st <h2>', () => {
    const dir = des[0].injector.get(HighlightDirective);
    expect(dir).toBeTruthy();
  });

  it('cannot inject `HighlightDirective` in 3rd <h2>', () => {
    const dir = bareH2.injector.get(HighlightDirective, null);
    expect(dir).toBe(null);
  });

  it('should have `HighlightDirective` in 1st <h2> providerTokens', () => {
    expect(des[0].providerTokens).toContain(HighlightDirective);
  });
});
```

## Key techniques

- **`By.directive(DirectiveClass)`** — get elements that have a specific directive attached, even when you don't know their element types
- **`:not` pseudo-class** — `By.css('h2:not([highlight])')` finds elements WITHOUT the directive
- **`DebugElement.injector.get(DirectiveClass)`** — access the directive instance from the element it's applied to
- **`DebugElement.styles`** — access styles even without a real browser (platform-safe)
- **`DebugElement.properties`** — access artificial custom properties set by the directive
- **`DebugElement.providerTokens`** — check which directives/providers are attached to an element
