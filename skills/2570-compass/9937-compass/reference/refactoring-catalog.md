# Refactoring Catalog — Smell → Operation → Result

| Refactoring | Smell that triggers | Operation | Expected result |
|-------------|---------------------|-----------|------------------|
| **Extract Method** | Long methods; duplicated chunks; comments as crutch | Pull a logical block into a new well-named method; replace original with a call | Smaller, self-documenting, reusable methods |
| **Inline Method** | Methods too small / rarely called; no real abstraction benefit | Remove the declaration; expand body at call sites | Removes bureaucratic indirection; more direct code |
| **Move Method** | Feature Envy; method depends on another class more than its own | Relocate the method to the class with stronger affinity; update refs | Restored cohesion; cross-class deps eliminated |
| **Pull Up Method** | Same code duplicated across sibling subclasses | Move identical implementation up to the superclass | Centralized rule; tree-wide repetition gone |
| **Push Down Method** | Superclass method useful for only one subclass | Move method down to the specific subclass | Slim mother class; responsibility lands where it belongs |
| **Extract Class** | God Classes; many attributes + responsibilities; low cohesion | Carve a focused subset into a new class; inject as one field | Small classes per SRP; logical separation |
| **Rename** | Misleading / obsolete / cryptic names | Adjust identifier to true intent everywhere (sometimes deprecate old) | Instant clarity without explanatory comments |
| **Extract Variable** | Dense expressions; nested conditionals | Break sub-expressions into well-named local variables | Fluent line reads; clean syntax |
| **Remove Flags** | Long functions with chained boolean control vars in loops | Replace flag checks with `return` / `break` | Lean logic; less mental tracking |
| **Replace Conditional with Polymorphism** | `switch/case` on type; OCP violation | Move per-type behavior into subclass methods | "State ifs" gone; easy extension via inheritance |
| **Remove Dead Code** | Orphaned vars, params, classes after retirement | Delete unused symbols and ghost dependencies | Smaller repo; readers spared idle code |

## Application rules

- Never refactor without a green test baseline.
- Apply in baby steps; re-run tests after each.
- Prefer IDE-automated refactor commands over manual edits.
- Refactor opportunistically: clean nearby code while fixing a bug or adding a feature.
- For externally consumed APIs, deprecate (`@Deprecated` + delegation) before hard-renaming.
