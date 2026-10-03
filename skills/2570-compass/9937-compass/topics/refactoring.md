# Raw — Refactoring

## 1. Concepts

### Refactoring
- **Definition**: source-code transformations that improve maintainability and structure without changing external behavior.
- **Solves**: counters natural aging and structural decay from continuous maintenance (Lehman's 2nd Law).

### Extract Method
- **Definition**: pull a chunk of logic from a long method into a new isolated method; replace the original with a call.
- **Solves**: cuts oversized methods; eliminates duplication when the chunk repeats elsewhere.

### Move Method
- **Definition**: relocate a method to the class it relates to most (uses or depends on its attributes).
- **Solves**: kills low cohesion; restores high cohesion; corrects logic placed in the wrong class.

### Extract Class
- **Definition**: split a tightly related subset of attributes/methods out of a big class into a new independent class.
- **Solves**: deflates God / Large classes carrying scattered responsibilities.

### Rename
- **Definition**: change the name of a variable, method, or class to reflect actual intent or new responsibility.
- **Solves**: removes mental confusion from misleading or ambiguous identifiers.

### Code Smells
- **Definition**: structural and syntactic indicators of low-quality design.
- **Solves**: act as fast alarms for developers to investigate and apply preventive refactorings.

## 2. When to Use

- **Extract Method** — methods past the threshold (e.g., > 20 lines), or when you feel the urge to add a comment to explain a block.
- **Rename** — module scope/requirements changed and the original name no longer communicates real purpose.
- **Pull Up / Push Down** — sibling subclasses repeat the same logic (Pull Up) or a superclass method serves only one child (Push Down).
- **Opportunistic Refactoring** — fix design while you're in the file fixing a bug or adding a feature (Boy Scout rule).

## 3. When NOT to Use

- **No test coverage** — without a reliable unit-test safety net, regression risk is too high.
- **Behavioral change** — refactoring strictly preserves semantics; never use it as cover to add logic or fix bugs.
- **Dead code** — don't extract or move dead logic; delete it (separate "Remove Dead Code" refactoring).
- **Big-Bang refactoring sprints** — full-team weeks-long stops are exceptional (severe tech debt only); default is opportunistic.

## 4. Smells

- **Duplicated Code** — identical or near-identical clones (types 1–4) forcing repeat maintenance. Sign: visible copy-paste.
- **Long Method** — colossal logic mixing many flows. Sign: extensive scrolling within one function.
- **Large Class (Blob)** — accumulates everything. Sign: generic names like `System`, `Manager` attracting whole-system responsibilities.
- **Feature Envy** — method excessively reads getters/setters of another class. Sign: alien call trains (`B.getX(); B.getY()`).
- **Primitive Obsession** — raw arrays / ints / Strings as rule containers. Sign: `String cep` instead of `new CEP(value)`.
- **Excessive explanatory comments** — comments propping up cryptic logic ("don't comment bad code, rewrite it"). Sign: paragraphs explaining a single `if`.

## 5. Operational Checklist

- [ ] Run the module's test suite first to confirm a green baseline.
- [ ] Use IDE automated refactor tools (Refactor → Rename / Extract).
- [ ] Let the IDE check preconditions (compile breaks, visibility issues) before applying.
- [ ] Apply transformations in baby steps to isolate side effects.
- [ ] For externally consumed methods, deprecate (`@Deprecated`, delegate to new) before cutting.
- [ ] Clean obvious traces — extract local variables; remove confusing flags/counters.
- [ ] Promote variables to `final`; make objects immutable via final fields and constructors.
- [ ] Replace large `switch/case` on primitive types with polymorphism.
- [ ] Replace explanatory comments with extracted methods named after the comment's idea, then delete the comment.
- [ ] Re-run tests as formal verification of the refactor.

## 6. Examples

- **Extract Variable** for legibility — name a sub-expression to convey intent.
- **Replace Conditional with Polymorphism** — turn type-switching into a class hierarchy.

## 7. Trade-offs

- **Opportunistic vs Planned** — Opportunistic: tiny minute-level cost, low pain, high recommended cadence. Planned: stops Sprints to restructure design (only justified for heavy tech debt).
- **API Deprecation vs Hard Break** — Hard rename forces all clients to update immediately. `@Deprecated` wrapper preserves backwards compatibility at the cost of residual code until later removal.
- **IDE Auto-Refactor vs Manual Edit** — Auto-refactor tracks scattered usages and avoids semantic compile breaks; manual edits hide subtle bugs until tests fail end-to-end.

## 8. Cross-references

- **Testing** — refactoring is paralyzed without unit-test safety; it's the third leg of TDD (Red-Green-Refactor).
- **Design Principles** — code smells signal direct violations: long methods break SRP; global coupling breaks information hiding → refactorings restore them.
- **Tech Debt** — skipping continuous refactoring accumulates maintainability debt ("interest"), eventually producing the Big Ball of Mud anti-pattern.
