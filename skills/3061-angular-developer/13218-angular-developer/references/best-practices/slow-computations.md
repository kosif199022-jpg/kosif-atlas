# Slow Computations

Source: https://v20.angular.dev/best-practices/slow-computations

---

## What Angular Does On Every Change Detection Cycle

Angular synchronously:
- Evaluates all template expressions in all components (unless using `OnPush`)
- Executes `ngDoCheck`, `ngAfterContentChecked`, `ngAfterViewChecked`, and `ngOnChanges` lifecycle hooks

A single slow computation in a template or lifecycle hook slows down the **entire** change detection cycle (they run sequentially).

---

## Identifying Slow Computations

Use Angular DevTools profiler:
1. Click a bar in the performance timeline to preview a specific change detection cycle
2. A bar chart shows how long Angular spent in each component
3. Click a component to see time spent on template evaluation vs. lifecycle hooks

---

## Optimizing Slow Computations

| Technique | Description |
|---|---|
| **Optimize the algorithm** | Best approach — fix the root cause |
| **Pure pipes** | Angular only re-evaluates when inputs change. Good for single-result caching. |
| **Memoization** | Like pure pipes but can store multiple cached results. Higher memory overhead. |
| **Avoid repaints/reflows in lifecycle hooks** | Some operations force the browser to recalculate layout — don't do this in every CD cycle |

### Pure Pipe Example

```ts
@Pipe({ name: 'expensiveTransform', pure: true })
export class ExpensiveTransformPipe implements PipeTransform {
  transform(value: string): string {
    // Only called when `value` changes
    return expensiveOperation(value);
  }
}
```

### Trade-offs

- **Pure pipes**: Angular built-in, only caches the *last* result
- **Memoization**: General technique, can cache *multiple* results but may have significant memory overhead if called frequently with different arguments
