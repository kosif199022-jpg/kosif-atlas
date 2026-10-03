# Eval file schema

Derived from the six eval files that already existed in the library
(`grill`, `wrap`, `audit-fix`, `enrich-prompt`, `fresh-eyes`, `eigenthinking`)
rather than invented — this is the smallest superset that covers what they
already do plus the one gap they're missing (triggering cases), per
`~/.aai/rules/capability-authoring.md` §10's two eval categories.

## File shape

```json
{
  "skill_name": "<skill-name>",
  "evals": [ <case>, <case>, ... ]
}
```

Location: `library/<skill>/evals/evals.json` (the convention five of the six
existing files use). `eigenthinking-evals.json` at the skill root is the one
exception — leave it there; don't move working data to normalize a path.

## Case shapes — two kinds, by which field is present

**Triggering case** — does the skill load when it should (and stay quiet
when it shouldn't)?

```json
{ "id": 1, "prompt": "...", "should_trigger": true }
```

`should_trigger: true` — this prompt should route to the skill.
`should_trigger: false` — a near-miss prompt that should NOT route here
(shares keywords with a neighbor skill but needs something else). No
existing eval file has this shape yet; it's new capacity for skills whose
routing is ambiguous enough to be worth testing.

**Quality case** — does the output meet the bar?

```json
{ "id": 1, "prompt": "...", "expected_output": "<prose pass criteria>" }
```

`expected_output` is the field name every existing file already uses for
plain-prose pass criteria (skills.md calls this `pass_criteria` generically —
same concept, existing field name kept as-is here to avoid renaming six
files' worth of working data for no functional gain). A case may also carry:

- `"files": []` — optional, paths for context the case needs (all six files
  include this, always empty so far).
- `"expectations": [...]` or `"assertions": [...]` — optional, a bulleted
  breakout of the prose criteria into individually-checkable claims
  (`enrich-prompt` and `eigenthinking` use these; `grill`/`wrap`/`audit-fix`/
  `fresh-eyes` don't). Either name is fine; both mean the same thing.

## What makes a case valid

Every case needs `prompt` plus exactly one of `should_trigger` (triggering)
or `expected_output` (quality). No numeric rubrics, no scored levels — a
quality case's bar is prose a human or a judging model applies, not a
number.

## What the validator checks

`scripts/aai-check.sh` checks structurally (grep/awk, not a JSON parser,
per this repo's plain-bash script rule): every `evals/evals.json` (or
`*-evals.json`) file has at least one `prompt` per case and a matching
should_trigger/expected_output/pass_criteria count. It does not check
semantic correctness — a human reviewing a new eval file should confirm the
prose criteria are actually falsifiable. Absence of an evals file for a
skill is not a failure; most skills have none.
