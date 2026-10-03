---
name: audit-files
description: Audit the repository files accumulated in Guard's pending queue and clear only the revisions that were successfully checked.
disable-model-invocation: true
---

# Audit pending edited files

This is an explicit checkpoint. It replaces automatic file audits at every Stop event.
`file_review_rules` maps project-relative globs to agents or skills for any file type.
Matching rules need no per-agent switch. Do not add reviewers for unmatched files.

## Read the checkpoint

Resolve `scripts/checkpoint.py` relative to this `SKILL.md` and run that concrete path with
`show`, the current host, and the current session id. If the invoking user message includes
exactly `--token <token>`, add those two arguments to `show`; this identifies an immutable
subset prepared by Guard's selection UI. Do not derive a scope from paths or other prose in the
message. On Claude Code,
`${CLAUDE_SKILL_DIR}/scripts/checkpoint.py` is already the concrete script path. Use
`CLAUDE_CODE_SESSION_ID` on Claude Code and `CODEX_THREAD_ID` on Codex:

```text
<checkpoint-script> show [--token <token>] --host <claude|codex> --session <session-id>
```

Parse its one-line JSON result. If `files` is empty, report that there are no pending files
and stop. Do not inspect the worktree for extra candidates: the returned checkpoint is the
complete scope, including when it contains only files selected in Herdr.

## Dispatch

Dispatch every entry in `groups` concurrently. An entry with `kind: agent` names the agent;
an entry with `kind: skill` names the skill. Give it the listed absolute `paths` and NOTHING
else—not what was being changed, what seems risky, or what you want checked. If
`conditional` is true, dispatch only paths this session actually changed according to this
session's tool activity; a shared worktree diff alone is not ownership evidence.

If an action is unavailable or fails, report it and stop without completing the checkpoint.
Do not substitute another reviewer or claim those paths were reviewed.

Wait for all reports, then apply only findings their own disposition permits. Every listed
file has a matching audit rule. If `truncated` contains a positive count, say that
the checkpoint is partial.

## Complete safely

Run the same script with `complete`, passing the returned `token` and session id:

```text
<checkpoint-script> complete <token> --host <claude|codex> --session <session-id>
```

Completion removes only files whose contents still match the checkpoint snapshot. If its JSON
reports `remaining` greater than zero, files changed while the audits were running remain
pending; say so and leave them for another checkpoint. Never claim that those revisions were
audited.
