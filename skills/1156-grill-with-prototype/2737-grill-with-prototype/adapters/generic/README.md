# Generic harness (core behaviour)

This is the baseline every skill-app runs on. It assumes only:

- the harness loads `SKILL.md` (or equivalent markdown instructions), and
- the agent can run shell commands and read their output.

No hooks, no MCP, no subagents, no artifact runtime.

## How events reach the agent

1. **Every turn starts with `bridge.py drain`.** The skill body says so; the agent
   does it. Cost: one short tool call.
2. **Listen mode** when the agent has nothing else to do: `bridge.py wait --timeout 110`
   blocks inside a tool call and returns the moment the dashboard writes an event.
   Zero tokens while blocked. Each timeout costs one small turn to re-issue.

Keep `--timeout` under the harness's tool-call limit (Claude Code: 120 s default;
Codex: check `tool_timeout`; others vary). Raise it where the harness allows a longer
call to reduce re-issue overhead.

## Background processes

`bridge.py serve` and `run_task.py` detach with `setsid` (POSIX) or
`DETACHED_PROCESS` (Windows). Some sandboxes kill everything in the tool call's
process group or cgroup when the call returns; if the server disappears between
turns, the skill's boot step (`serve` is idempotent) brings it back, and tasks that
died show `status: failed`. If that happens routinely on your harness, note it in
that harness's adapter README.

## Nothing to install

If you're on a harness with no adapter folder, this is the whole story.
