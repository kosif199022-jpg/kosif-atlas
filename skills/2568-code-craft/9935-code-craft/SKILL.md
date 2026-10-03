---
name: code-craft
description: >-
  Language- and framework-specific code best practices and idioms — complementary to compass (stack-agnostic architecture coach). Two modes: reader (rule + reason + example for a topic) and reviewer (apply rules to user code, flag violations with fixes). Ships rules for TypeScript, Rust, CSS/SASS, Tailwind, Dart, Go, Python and frameworks React, Next.js, RN+Expo, Hono, Cloudflare Workers, Astro, Svelte, Drizzle, Supabase, AWS Lambda+SAM, Terraform, Flutter. Use when the user asks for language-specific best practices ("TS best practices", "is this idiomatic Rust", "/code-craft ts"), wants a code review focused on language idioms (not architecture — see compass), or asks how to do X the right way in a specific language/framework.
---

# code-craft

Language- and framework-specific code best practices and idiom reference. Complements `compass` (stack-agnostic architecture / design coach) — `code-craft` is tactical and per-language.

## Quick start

1. Detect the **language** or **framework** from the user's request — explicit (`ts`, `dart`, `flutter`) or inferred from file extension / pasted code.
2. Detect the **mode**:
   - **reader** — user asks "what is the best practice for X" or "how should I do Y in Z" → return matching rules from the language file (rule + reason + example).
   - **reviewer** — user pastes code or asks "review this" → load the relevant language file, scan for violations, report `location → rule → fix`.
3. Load only the relevant file from `languages/` (and a `frameworks/` file if applicable).
4. Match the topic the user asked about — do not dump the entire language file when the user asked one question.

## Supported

| Language / framework | File | Status |
|----|----|----|
| TypeScript | [languages/ts.md](languages/ts.md) | shipped |
| Rust | [languages/rust.md](languages/rust.md) | shipped |
| CSS / SASS | [languages/css-sass.md](languages/css-sass.md) | shipped |
| React (19) | [frameworks/react.md](frameworks/react.md) | shipped |
| Next.js (14 / 15) | [frameworks/nextjs.md](frameworks/nextjs.md) | shipped |
| React Native + Expo (SDK 53/54+) | [frameworks/react-native-expo.md](frameworks/react-native-expo.md) | shipped |
| Hono (4.x) | [frameworks/hono.md](frameworks/hono.md) | shipped |
| Cloudflare Workers | [frameworks/cloudflare-workers.md](frameworks/cloudflare-workers.md) | shipped |
| Astro (4 / 5 / 6) | [frameworks/astro.md](frameworks/astro.md) | shipped |
| Svelte 5 | [frameworks/svelte.md](frameworks/svelte.md) | shipped |
| Drizzle ORM | [frameworks/drizzle.md](frameworks/drizzle.md) | shipped |
| Tailwind CSS (v4) | [languages/tailwind.md](languages/tailwind.md) | shipped |
| Supabase | [frameworks/supabase.md](frameworks/supabase.md) | shipped |
| AWS Lambda + SAM | [frameworks/aws-lambda-sam.md](frameworks/aws-lambda-sam.md) | shipped |
| Terraform / OpenTofu | [frameworks/terraform.md](frameworks/terraform.md) | shipped |
| Dart 3 | [languages/dart.md](languages/dart.md) | shipped |
| Flutter (3.27+) | [frameworks/flutter.md](frameworks/flutter.md) | shipped |
| Go (1.21+) | [languages/go.md](languages/go.md) | shipped |
| Python (3.12+) | [languages/python.md](languages/python.md) | shipped |
| Angular, Vue 2, Ionic, Express, Strapi, LoopBack, BigCommerce, Miva | `frameworks/*.md` | legacy / on demand |

If the user asks for a language not yet supported, say so and offer to add a stub via the structure documented below.

## When to defer to compass

Defer to `compass` if the user asks about:

- Architecture / system design
- SOLID, GoF patterns, MVC, microservices
- Refactoring strategy across modules
- TDD / CI/CD / DevOps
- Stack selection or technology trade-offs
- Security model, threat surface, perf budget

`code-craft` is for **inside-the-file** decisions. `compass` is for **across-file / across-system** decisions. When a user request straddles both, route the language-idiom parts here and the architecture parts to compass.

## Reader-mode output format

For a single-rule ask:

> **Rule.** Reason. Wrong vs. right example (3–6 lines).

For a topic ask (e.g. "TS error handling"), return the 3–6 most relevant rules in the same compact format, ordered by importance. Cite the source when there is genuine community debate (enums, barrel files, etc.).

## Reviewer-mode output format

Flat numbered list, one violation per line:

```
1. <file>:<line> — <rule short name> — <one-sentence fix>
2. ...
```

If the list is long, group by severity:

- **must-fix** — correctness or safety bugs
- **should-fix** — idiom or maintainability
- **nice-to-have** — style only

Close with a one-sentence summary. Do not re-print the user's code.

## Adding a new language or framework file

1. Create `languages/<lang>.md` or `frameworks/<framework>.md`.
2. Group rules under buckets that fit the language — typical: **tactical** (day-to-day), **idioms** (ecosystem patterns), **anti-patterns** (smells).
3. Each rule:
   - Short name (1–6 words)
   - One-sentence rule
   - One-line reason
   - ≤ 6-line wrong + right example
   - Source citation if there is debate
4. Update the **Supported** table above.
5. Aim for 30–60 rules per language file. Quality over quantity.

## Confirmation discipline

- Reader mode: no confirmation needed; just answer.
- Reviewer mode: confirm scope before scanning ("idioms only, or include anti-patterns?"). Default to both. Security and performance reviews belong in `compass` — route there if asked.

## When to skip code-craft

- One-line tweaks (rename, fix typo, add import).
- Throwaway scripts / spikes.
- Generated code (migrations, codegen output, build artifacts).
- Language not in the Supported table — say so, don't fabricate rules from training data.
- User asks about architecture, security, or perf — route to compass instead.

## Pipeline placement

`grill-me → to-prd → compass → blueprint → code (+ code-craft) → compass (review)`

code-craft sits **during the code phase**, applied tactically per-file as code lands. Use cases:

- **Drafting** — when writing new code in a supported stack, apply rules silently to the just-written diff and self-correct before showing it.
- **PR review** — alongside compass's reviewer workflow, run code-craft on the diff for stack-specific idiom violations.

code-craft does NOT replace `compass`'s reviewer workflow. They run side-by-side at PR time: compass for cross-file architecture, code-craft for inside-file idioms.
