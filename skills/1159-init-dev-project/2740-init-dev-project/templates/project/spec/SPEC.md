# {{name}} spec

{{description}}

`make check` fails until no line starts with `TODO:`. Each example below gets a
test in `tests/`; a spec change without a test change is a review flag. For a
bigger project, run the `grill` or `harness-prd` skill first and put the result here.
For a project with screens, run `grill-with-prototype` with workspace `spec/` and
project `prototype`: you click a live prototype while it interviews you, and its
`prd` step replaces this file while the `TODO:` lines are still here.

## What it must do

TODO: one observable behavior per line, as a user would see it.

## Examples

TODO: input → expected result, one per behavior, plus the main error case.

## Decisions

- {{date}}: scaffolded with init-dev-project. Add a dated line whenever the spec changes.
