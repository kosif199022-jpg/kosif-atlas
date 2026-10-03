# Skill Evals — running one skill's eval file

Makes an existing `evals/evals.json` executable. Same folder-holds-intent /
harness-executes pattern as `trigger-runner`: the eval file is inert data
until a session actually runs it. This is not an eval platform — no scores,
no levels, just per-case PASS/FAIL against the two shapes in
[`references/schema.md`](references/schema.md).

## Gotchas (read first)

- **You never grade your own triggering cases.** A triggering case's whole
  question is "does this skill load for a fresh session with no priming" —
  running it yourself, already primed on the skill, tells you nothing. Spawn
  a fresh session/subagent per triggering case, same discipline as
  `fresh-eyes`'s walker.
- **Quality cases run in your own context** — no fresh spawn needed, the
  case is testing output quality, not whether routing fires.
- **No scores.** Output a PASS/FAIL table per case. Don't invent a rubric,
  a percentage, or a level — that's the scorecard-levels machinery on the
  roadmap, deliberately not built here.
- **Read `references/schema.md` first** if the target skill's eval file
  shape is unfamiliar — it documents both case shapes and the field-name
  history (`expected_output` vs. `pass_criteria`).

## Procedure

1. **Load the target skill's eval file** — `library/<skill>/evals/evals.json`
   (or wherever it actually lives, e.g. `eigenthinking-evals.json` at the
   skill root; don't assume the path, read the skill's directory).
2. **Split cases by shape**: `should_trigger` present → triggering case;
   `expected_output`/`pass_criteria` present → quality case.
3. **Triggering cases**: for each, spawn a fresh general-purpose subagent
   with only the prompt (and the ambient trigger installed, so it can route
   normally) — no mention of which skill is being tested. Record whether it
   routed to the target skill. Compute the rate across all `should_trigger:
   true` cases (target >0.5 per skills.md §10) and separately across
   `should_trigger: false` cases (target <0.5 — should mostly NOT trigger).
4. **Quality cases**: run the prompt in your own context, then judge the
   actual output against the case's prose criteria (`expected_output` /
   `pass_criteria`, and any `expectations`/`assertions` breakout if present).
   PASS if the output satisfies the criteria, FAIL with the specific gap if
   not.
5. **Report**: one PASS/FAIL line per case (id, one-line reason on FAIL), the
   triggering rate summary, no aggregate score.

## Outputs

- A PASS/FAIL table, one row per case, printed to the conversation — this
  skill doesn't write a report file. If the user wants the results saved,
  they'll say so.
