# Anti-patterns Catalog

## Architectural / Design

- **Big Ball of Mud** — system without structured architecture; modules talk arbitrarily → spaghetti dependencies, dangerous maintenance.
- **Patternitis** — adopting design patterns where flexibility gain is minimal → academic complexity for no benefit.
- **God Class / Blob** — single class monopolizing system intelligence; SoC failure.
- **Singleton-as-global-variable** — Singleton used as a disguise for mutable globals; destroys isolation, breaks tests.
- **Over-engineering** — heavy architecture on small/casual systems → "cannon for ants".

## Process / DevOps

- **Integration Hell** — long-lived feature branches → cascading manual merge conflicts.
- **Big Design Up Front (BDUF)** — full upfront architecture and specs (waterfall style) → docs go obsolete before code is proven.
- **CI Theater** — robust CI server building local commits, but no actual integration into mainline → false sense of agility.
- **Mini-waterfalls** — agile branding but Sprint splits into "requirements week → code week → test week".
- **Committee Product Owner** — multiple people sharing the role → decision paralysis, bloated products.

## Requirements / Product

- **Gold plating** — devs add unrequested complex features; wastes time on no-customer-value work.
- **Vanity metrics** — surface stats (raw pageviews) that flatter the team but aren't actionable.

## Code / Quality

- **Flaky tests** — non-deterministic; pass/fail randomly. Caused by concurrency or amateur `sleep` use in async methods.
- **Duplicated code (clones)** — most damaging maintainability indicator; forces repetitive incomplete fixes.
- **Primitive obsession** — failing to wrap valuable concepts (Money, ZIP, Date) into domain objects; raw int/String thrown around.
- **Obscure tests with conditional logic** — `if`, loops inside test bodies → masks paths the asserts never reach.
- **Comments as crutch** — natural-language paragraphs propping up cryptic code instead of refactoring it.
- **Train wrecks** — `a.getB().getC().do()` → Demeter violation; brittle to intermediate changes.
- **Feature Envy** — method excessively reads getters/setters of another class.
