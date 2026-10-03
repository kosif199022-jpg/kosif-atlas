# Testing Pipes

Source: https://v20.angular.dev/guide/testing/pipes

Pipes can be tested without the Angular testing utilities since they are typically pure, stateless functions.

## Testing a pipe in isolation

A pipe class has one method, `transform`, that manipulates the input value. Most pipes have no dependence on Angular other than the `@Pipe` metadata:

```typescript
// title-case.pipe.ts
@Pipe({ name: 'titlecase', pure: true })
export class TitleCasePipe implements PipeTransform {
  transform(input: string): string {
    return input.length === 0
      ? ''
      : input.replace(/\w\S*/g, txt => txt[0].toUpperCase() + txt.slice(1).toLowerCase());
  }
}
```

```typescript
// title-case.pipe.spec.ts
import { TitleCasePipe } from './title-case.pipe';

describe('TitleCasePipe', () => {
  // Pure, stateless function — no need for beforeEach
  const pipe = new TitleCasePipe();

  it('transforms "abc" to "Abc"', () => {
    expect(pipe.transform('abc')).toBe('Abc');
  });

  it('transforms "abc def" to "Abc Def"', () => {
    expect(pipe.transform('abc def')).toBe('Abc Def');
  });

  it('leaves "Abc Def" unchanged', () => {
    expect(pipe.transform('Abc Def')).toBe('Abc Def');
  });

  it('transforms "abc-def" to "Abc-def"', () => {
    expect(pipe.transform('abc-def')).toBe('Abc-def');
  });

  it('transforms "   abc   def" to "   Abc   Def" (preserves spaces)', () => {
    expect(pipe.transform('   abc   def')).toBe('   Abc   Def');
  });
});
```

## Writing DOM tests to support a pipe test

Isolated pipe tests don't verify that the pipe is working correctly when applied in actual component templates. Add component tests that exercise the pipe in context:

```typescript
it('should convert hero name to Title Case', async () => {
  harness.fixture.autoDetectChanges();
  const hostElement: HTMLElement = harness.routeNativeElement!;
  const nameInput: HTMLInputElement = hostElement.querySelector('input')!;
  const nameDisplay: HTMLElement = hostElement.querySelector('span')!;

  nameInput.value = 'quick BROWN  fOx';
  nameInput.dispatchEvent(new Event('input'));

  await harness.fixture.whenStable();
  expect(nameDisplay.textContent).toBe('Quick Brown  Fox');
});
```

This test verifies that:
1. The pipe is correctly applied in the template
2. The binding between the input and the display works
3. The pipe's transform runs on the bound value
