---
name: parallel-worktrees
description: "Playbook for running work in parallel across git worktrees, so several agents (or one agent dispatching many) edit the same repo at once without colliding. Covers the go/no-go decision, partitioning files so agents don't touch the same file, which isolation mechanism to use (Agent isolation:worktree, Workflow isolation:worktree, EnterWorktree, or manual git worktree), and integrating + cleaning up afterward. Use when the user says 'work in parallel', 'multiple agents', 'fan out', 'dispatch agents', 'git worktree', 'parallelize this across worktrees', or wants concurrent work on one codebase."
---

# Parallel worktrees

Run independent slices of work concurrently, each in its own git worktree on its own branch, then integrate. The mechanism already exists in the harness (see the table below); this skill is the discipline that decides *whether* to parallelize and *how to partition* so it does not turn into merge hell.

## Rung 0: should this even be parallel?

Parallel worktrees pay off only when **all three** hold. If any fails, work sequentially and say so:

1. The slices are genuinely independent (no slice needs another's output).
2. The slices touch **disjoint files** (see partitioning below). Overlap means conflicts at integration, which usually costs more than the parallelism saved.
3. The wall-clock saving is real (each slice is substantial, not a two-line edit).

Works with or without formal planning docs. When plans / PRDs / ADRs exist, read their files-touched sections to build the conflict graph; otherwise partition straight from the change surface.

## Rung 1: partition the work

This is the step that makes or breaks it. Split the task so **no two slices write the same file**. Partition by directory, module, feature, or layer, whichever gives clean disjoint sets. Reads may overlap freely; only writes collide.

- Write the partition down explicitly before dispatching: `slice-a: src/auth/**`, `slice-b: src/billing/**`, `slice-c: docs/**`.
- A file two slices must both edit (a shared registry, a barrel `index`, a lockfile) is a **seam**. Either assign the whole seam to one slice, or do the seam edit yourself before/after the fan-out. Never let two slices both edit it.
- Cannot partition cleanly? Do not parallelize that part. Serialize the overlapping edits; parallelize only the disjoint remainder.

## Rung 2: pick the isolation mechanism (laziest that fits)

| You are... | Use | Why |
|---|---|---|
| one agent dispatching N subagents that each edit files | **`Agent` tool with `isolation: "worktree"`** | each subagent gets a fresh worktree, auto-removed if it changed nothing |
| running a deterministic fan-out / pipeline over many items that mutate files | **`Workflow` with `opts.isolation: 'worktree'`** | same isolation, inside orchestrated stages |
| the current session, isolating your own work | **`EnterWorktree`** (leave with `ExitWorktree`) | switches this session into `.claude/worktrees/<name>`; branch is auto-named `worktree-<name>` — no override (see Branch naming below) |
| outside the harness helpers, or need explicit control | **manual `git worktree`** | full control, you own cleanup |

Prefer the harness helpers: they clean up automatically and keep the worktree under `.claude/worktrees/`. Reach for manual only when you need a worktree the harness will not manage.

**Branch naming:** `EnterWorktree name:` has no branch override — it always mints `worktree-<name>`, which reads badly as a PR title. For a clean conventional branch (`<type>/<slug>` — `feat/`, `fix/`, `chore/`, `refactor/`, etc. by what the work is), create it manually and enter by path: `git worktree add -b feat/<slug> .claude/worktrees/<slug> "$BASE"` then `EnterWorktree path:.claude/worktrees/<slug>`. A path-entered worktree is kept by `ExitWorktree` (it won't auto-remove one you didn't create via `name:`).

## Rung 3: dispatch

Each slice runs on its **own branch off the same base**. Give each subagent: its slice's file set, the base branch, an instruction to commit its own work, and an explicit "do not touch files outside your set."

Dispatch all slices in **one message** (multiple Agent tool calls in a single turn) so they run concurrently, not one after another.

Manual recipe (when not using the harness helpers), base off the default branch:

```bash
BASE=origin/production   # this repo's default; use origin/main elsewhere
git fetch origin
git worktree add -b feat/slice-a .worktrees/slice-a "$BASE"
git worktree add -b feat/slice-b .worktrees/slice-b "$BASE"
# ...agents work inside each .worktrees/<slice> on its branch...
```

## Rung 4: integrate

An isolated worktree only proved its own slice compiles/tests. Integration is a separate, sequential step you own:

1. Merge each slice branch back into an integration branch, in a sensible order.
2. Resolve conflicts, minimal if partitioning was clean; a flood of conflicts means the partition was wrong, fix that not the symptoms.
3. Run the **full** build + test suite once on the integrated result. Green slices in isolation do not prove they are green together.
4. Then open the PR (`/pr-craft`).

## Rung 5: clean up

```bash
git worktree remove .worktrees/slice-a       # per manual worktree
git worktree prune                            # drop stale registrations
git branch -d feat/slice-a                    # after it is merged
```

Harness-created worktrees (`Agent`/`Workflow` isolation, `EnterWorktree`) are auto-cleaned when unchanged or on exit; you only hand-clean manual ones.

## Pitfalls

- **Same branch in two worktrees** — git forbids it. One branch per worktree.
- **`node_modules` / build artifacts** — worktrees share `.git` but NOT working files; deps do not carry over. Each worktree may need its own install (costly). Prefer partitioning so only one slice needs a heavy install, or accept the duplicate.
- **Dev servers / ports / DBs** — if slices each run a server, assign distinct ports and isolated data, or they collide.
- **Base drift** — branch all slices off the same fetched base so integration is a clean three-way merge.
- **Over-parallelizing** — three slices that each conflict on the same seam file are slower than doing it sequentially. Rung 0 exists to catch this.

## Relationship to other skills

- **`/dev-flow`** — the single-track chain. This skill is what you reach for when one of its stages fans out.
