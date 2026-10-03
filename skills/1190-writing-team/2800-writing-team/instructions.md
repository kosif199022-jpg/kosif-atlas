# writing-team

Runs the full **research → draft → edit** pipeline to take a topic from idea to
a publish-ready piece. This is the orchestrator: it composes the `researcher`,
`writer`, and `editor` skills in sequence.

This single file is the canonical pipeline. It runs the same whether executed
in the current conversation or inside a spawned subagent — the router decides
which based on the request (see "Execution context" below).

## When to use

When someone says:
- "Write me an article on X end to end"
- "Take this from idea to finished post"
- "Research, draft, and edit a piece on Y"

For a single stage only, use `researcher`, `writer`, or `editor` directly.

## Execution context

- **In-context (default):** run the three stages here, in this conversation.
- **Spawned (on request):** if the user asks to run it "in its own context",
  "in the background", or "separately", the router spawns a general-purpose
  subagent and passes it the absolute path to this file. The subagent then
  follows these same steps. Nothing about the pipeline changes.

## Instructions

### 1. Intake the brief

Gather, in one pass:
- Topic / thesis
- Audience and desired reader end-state (what they should think/feel/do)
- Voice (from the brief; a named `~/.aai/references/voice/` file if it exists,
  else the brief's stated tone)
- Length / format target
- Source constraints (must-cite, must-not-cite, recency)

Ask once if any are missing, then proceed. Pick a short kebab-case `<slug>` from
the topic — all three stages share it so outputs line up and re-runs don't
collide.

### 2. Research

Read and follow `${CLAUDE_PLUGIN_ROOT}/library/researcher/instructions.md`
against the brief. Have it write `RESEARCH-<slug>.md`. Carry the dossier and its
open-questions list forward.

### 3. Draft

Read and follow `${CLAUDE_PLUGIN_ROOT}/library/writer/instructions.md`,
feeding it the brief and the dossier. Have it write `DRAFT-<slug>.md`. Anything
the researcher flagged as unverified must be surfaced, not asserted.

### 4. Edit

Read and follow `${CLAUDE_PLUGIN_ROOT}/library/editor/instructions.md`
against `DRAFT-<slug>.md`. It edits in place.

> **Resolving the three stages:** they are named capabilities, not fixed paths.
> The `${CLAUDE_PLUGIN_ROOT}` form above is the bundled-plugin case. Resolve
> each name — `researcher`, `writer`, `editor` — by taking the first that
> exists: `.aai/skills/<name>/`, then `.ailib/<name>/`, then
> `${CLAUDE_PLUGIN_ROOT}/library/<name>/`, then a sibling folder next to this
> file. This is what lets the pipeline work when vendored into a folder's
> `.ailib/`, where no plugin root exists. If a stage can't be resolved, say
> which one is missing — never improvise the stage inline.

### 5. Deliver

Return:
- The final draft path (`DRAFT-<slug>.md`)
- A 3-bullet changelog — one bullet per stage (what research found, what the
  draft argued, what the edit changed)
- Any still-unverified claims carried from the researcher

## Rules

- Never skip the editor pass.
- Surface every fact the researcher couldn't source — never silently drop it.
- Run the stages in order; each consumes the previous stage's output.
- Outputs use the shared `<slug>` so a second run doesn't overwrite the first
  unintentionally.
