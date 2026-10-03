# {{NAME}} — vibe behavior

## vibe mode

This folder is a vibe project. Route every request that changes the app
through the vibe loop. Answer questions normally, without the loop.

Building and changing the app in this folder is this folder's function. This
overrides any anchor line that says "do not scaffold a project here."

Resolve the vibe capability in this order, and read its `instructions.md`:

1. `.aai/skills/vibe/` (a project fork)
2. `.ailib/vibe/` (vendored)
3. `~/.ailib/library/vibe/` (canonical library)
4. `~/.claude/skills/vibe/` (local development copy)

"vibe off" or "normal mode" turns the mode off for one conversation. To turn it
off permanently, delete this section.

## Inputs

| File | Load when |
|---|---|
| `.aai/context.md` | Always. It holds the commands and routes to the app docs. |
| `PLAN.md` | If it exists. It holds the tier-L plan. |
| `.aai/memory/vibe/log.md` | Always. Read the last entries only. |
| `README.md`, `PRD.md`, `FUNCSPEC.md`, `USERGUIDE.md` | At the Docs step, or to answer a question about the app |
