---
name: audit-plan
description: Review an existing plan file using only the agent or skill configured in Guard's plan_review setting.
argument-hint: '<path to the plan file>'
disable-model-invocation: true
---

# Review a plan

Use the plan file supplied in the user's invocation. If no path was supplied, ask for it;
do not reconstruct a plan from conversation history. This entry routes the review and records
completion. The configured reviewer owns the review criteria.

## Prepare

Resolve `scripts/review.py` relative to this `SKILL.md`. Run that concrete path through
`uv run --script` with the current host and the absolute target project root:

```text
uv run --script <review-script> prepare <plan-path> --host <claude|codex> --project <project-root>
```

Quote paths as shell arguments. The adapter uses `CLAUDE_CODE_SESSION_ID` on Claude Code and
`CODEX_THREAD_ID` on Codex. If unavailable, pass the calling session's known id with
`--session`; never invent one. Run both commands in the calling session, not in the reviewer.
Relative plan paths resolve from the supplied project root; resolve a user path relative to
another directory to an absolute path first.

Read the JSON result. `status: no_reviewer` means no reviewer is configured: tell the user
and stop. On an error, report it and stop. `status: review` supplies the resolved `plan_path`
and one `reviewer` with `kind` and `name`. An explicit request runs a fresh review even when
the automatic gate is off or the same plan was reviewed before.

## Review

Invoke exactly the returned agent or skill using the host's native invocation mechanism,
passing the resolved plan file path. Preserve the configured name; do not add a plugin prefix,
translate it into another agent name, add reviewers, or perform the review yourself. If it is
unavailable or cannot be invoked, report that and stop without recording completion.
Use only a named invocation supported by the current host. Do not invent mention syntax or
copy the reviewer's instructions into a generic agent to imitate it. A successful generic
spawn alone does not confirm that the configured reviewer was loaded.

Wait for its completed report. Apply findings to the plan within the user's authorized scope;
surface changes of approach or decisions belonging to the user before adopting them. If the
review fails, is interrupted, or leaves an unresolved blocking question, report that outcome
without recording completion. This request authorizes plan review, not implementation.

## Complete

After the review finishes and any agreed revisions are saved to the same plan file, run:

```text
uv run --script <review-script> complete <resolved-plan-path> --host <claude|codex> --project <project-root>
```

Use the same calling session id as in prepare. Complete records the final file's content hash;
only `status: recorded` confirms that it was saved. Do not edit the plan after recording it.
Summarize findings and changes briefly in the user's language, including any finding not
adopted and why. Do not create a separate report file or start implementation from this skill.
