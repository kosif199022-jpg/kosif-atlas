# Wrap — session close-out ritual

Every substantial session produces **three products**, not one: the work itself
(committed), raw teaching material (the session is ore for audience-facing content),
and continuity state (so a stateless successor picks up without loss). A session
that ends without all three evaporates value. This skill makes sure none of it does.

## Gotchas (read first)

- **Never push without an explicit remote AND standing permission.** Some repos
  have no remote (the local copy is canonical). Check `git remote -v` first.
  If no remote: commit and merge to main, say "no remote — commit only." If a remote
  exists, ask before pushing unless this session already authorized it.
- **COPY, not MOVE.** When artifacts belong in a second location (shared repo, vault,
  library), copy them. Moving breaks the original location silently.
- **The narrative is not the transcript.** The export captures what was said; the
  narrative captures what it *means*. Don't pad the narrative with tool output.
- **Only save what earns it.** The memory-harvest step exists to filter, not to
  archive. "Nothing earned a memory" is a correct and common answer.

## The ritual

Run these steps in order. Skip a step only when it genuinely doesn't apply (e.g.,
no git repo → skip step 1), and say which steps were skipped and why.

### 1. Land the work

- `git status` + `git remote -v` to see what's uncommitted and whether a remote exists.
- Stage **specific files** (never `git add -A`), commit with a message that explains
  *why*, not what.
- If working on a feature branch or worktree whose work is complete: merge to main.
  If a worktree is fully merged and no longer needed, offer to delete it.
- Push only per the gotcha above.

### 2. Export the conversation

Target: `chat_exports/` at the project root (create if missing).

- If a conversation-export skill or script is available in the project, use it.
  Otherwise write a manual transcript from memory: every user turn verbatim,
  assistant turns summarized faithfully, key artifacts referenced by path.
- Filename: `YYYY-MM-DD-<slug>-conversation.md`.

### 3. Write the teaching narrative

This is raw material for teaching content — the audience is people who want to
learn to work this way themselves (community members, teammates, readers). File:
`chat_exports/YYYY-MM-DD-teaching-narrative-<slug>.md`, following this arc:

1. **The initial idea / need** — what problem walked in the door, and why it mattered.
2. **The journey** — what was done, why, and how. Include the wrong turns and
   corrections; the dead ends are often the most teachable part.
3. **The ultimate result** — what exists now that didn't before, concretely.
4. **Application & benefit** — how a reader would use this and what it buys them.

Write with real specifics (actual decisions, actual reasoning), but replace local
desktop paths with placeholders — readers don't have the author's filesystem, and
leaked paths break published versions.

### 4. Produce the handoff

If the project has a `.context/` store, run its session check-out protocol instead
of writing a separate file. Otherwise write `HANDOFF.md` at the project root
(overwrite the previous one — it describes *now*):

- **State**: what's done, what's in flight, exact resume point (file, phase, failing
  test).
- **Locked decisions**: choices already made, so the successor doesn't re-litigate them.
- **Next steps**: ordered, with the first one specific enough to start cold.
- **Open questions**: genuinely unresolved items only.
- **What NOT to do**: known dead ends and constraints (e.g., "no remote — don't push").

High-signal test: could a fresh agent with zero conversation memory read only this
file and continue correctly? Cut anything that doesn't serve that reader.

### 5. Harvest what earned it

Ask: *did anything in this session earn a permanent record?* The bar is high —
most sessions produce nothing here, and saying so is success, not failure.

- A skill failed or was corrected → append a gotcha to **that skill's** SKILL.md
  (don't restructure it).
- A durable fact about how the user works surfaced → save a memory.
- A reusable asset was born (script, prompt, pattern) → note it as a promotion
  candidate for the user's canonical library; don't promote unilaterally.

### 6. Report

Close with a checklist: each step, what was produced (clickable paths), what was
skipped and why. Lead with anything that needs the user's decision (e.g., "remote
exists — push?").
