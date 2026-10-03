# Codex CLI adapter

Codex has no hook equivalent to Claude Code's `Stop`, so the core drain/listen loop is
the whole mechanism here. This folder holds only integration notes.

## Making the skill visible

Codex reads `AGENTS.md` from the working directory. Add a pointer:

```
## Skill-apps
- <app name>: read <APP>/SKILL.md before acting on anything about <topic>.
```

## Tool timeouts

`bridge.py wait --timeout 110` assumes a ~120 s shell limit. If your Codex config
allows longer tool calls, raise the timeout to cut re-issue turns.

## Running Codex *as a provider* from another harness

`models.py` registers Codex as `codex exec --skip-git-repo-check "<prompt>"`. The
`exec` subcommand's flags have changed between releases; if `run_task.py` reports a
failed task with a usage error, update the `headless` list for `codex` in
`scripts/models.py` (or in `runtime/models.json` for a local override) to match your
installed version. Confirm with `codex exec --help`.
