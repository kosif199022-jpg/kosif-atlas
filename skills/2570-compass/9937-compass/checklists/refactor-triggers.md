# Refactor Triggers Checklist

Smell → operation → expected outcome. Use during code review or when picking a refactor.

| Trigger smell | Refactoring | Outcome |
|---------------|-------------|---------|
| Method > 20 lines, mixed concerns | **Extract Method** | Smaller, named, reusable methods |
| Same logic in many places | **Extract Method** + reuse | Single source of truth |
| Class > 500 lines, many responsibilities | **Extract Class** | One class per concern |
| Method uses another class far more than its own | **Move Method** | Cohesion restored |
| Identical method across sibling subclasses | **Pull Up Method** | Centralized in superclass |
| Superclass method used by only one child | **Push Down Method** | Slim parent, focused child |
| Misleading or stale identifier | **Rename** | Self-explaining code |
| Dense expression, nested conditionals | **Extract Variable** | Readable line |
| `if/else` chain on object type | **Replace Conditional with Polymorphism** | OCP-safe extension |
| Comment explaining a block | **Extract Method** with comment-as-name | Self-documenting code |
| Dead branches, unreachable code | **Remove Dead Code** | Smaller surface area |
| Long method with control flags | **Remove Flags** + `return`/`break` | Linear logic |
| Train wreck `a.b().c().d()` | **Move Method** + Demeter fix | Direct collaboration |
| Primitive obsession (`String cep`) | **Introduce Parameter Object** / value type | Domain-meaningful types |
| Combinatorial subclass explosion | Replace inheritance with **Decorator** composition | Runtime stacking |
| Singleton-as-global | Inject as dependency, drop static access | Testable, explicit deps |

## Pre-flight

Never apply any of these without:

- [ ] Green test baseline (or characterization tests written first)
- [ ] Behavior preservation rule understood (no feature change inside the refactor commit)
- [ ] Plan to apply in baby steps with tests after each
