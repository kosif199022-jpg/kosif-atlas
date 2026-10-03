# .context/ Charter — Project Continuity Protocol

This directory is the **shared brain** for every agent, model, or human
working on this project. Every session begins by reading it and ends by
updating it. The store is the truth; open terminals are just doors into it.

## The store

```
.context/
  CHARTER.md      ← static — you are here
  STATE.md        ← live board (active objective, task queue, blockers, needs-lou)
  LOG.md          ← append-only handoff journal, newest first
  DECISIONS.md    ← append-only ADR-lite
  lock            ← short-held advisory mutex during STATE/DECISIONS mutations
  archive/        ← rolled-off LOG entries when LOG.md grows
```

## The ritual

Every session must:

1. **Check-in on entry** — read CHARTER (once per agent), STATE, top of LOG,
   DECISIONS; select a task; mark it `Doing`.
2. **Checkpoint (optional, mid-session)** — save progress without closing the
   task. Updates the task's `progress:` note in STATE, appends a checkpoint
   block to LOG, commits `.context/`. Task stays `Doing`; session continues.
   Trigger: "checkpoint", "save where I am", "quick save".
3. **Check-out on exit** — update STATE, append LOG, append DECISIONS if any,
   commit `.context/`.

Use the `session` skill — it automates all three. Skip the ritual and
continuity breaks.

### Checkpoint LOG format

```markdown
## <ISO date> · <agent-id> · checkpoint

**Task:** T-<N>
**Progress:** <what's done so far>
**Next:** <exactly where to resume — file:line if applicable>
**Blockers:** <if any; else "none">

---
```

Checkpoints are progress notes, not decision records. Never append to
DECISIONS.md during a checkpoint.

## Task progression

```
Todo → Doing → Ready-for-Review → Done
```

Sidecar statuses:
- `Needs-Rework` — review failed; doer picks it up again.
- `Stale-Doing` — auto-flagged when a Doing task is >4h old (likely crashed
  session). Surfaced to Lou in Needs-Lou for reclaim/reassign.

## Focus tags

Tasks may carry one or more focus tags. Agents self-select by focus match.

| Tag | Meaning |
|---|---|
| `#code` | Implementation work |
| `#review` | Code/content review of finished work |
| `#content` | Writing or editing |
| `#research` | Investigation, no production output |
| `#adversarial` | Stress test, security audit, red-team |
| `#plan-review` | Review of an approach before implementation |
| `#edit` | Editorial revision pass |

Extend freely — keep this table current.

## Routing rules

1. **Explicit assignee wins.** A task tagged `@<agent>` is taken by that agent.
2. **Else focus match.** Take the top Todo whose focus tag matches your
   specialty. If the project has an `agents.yaml` at its root, use it as the
   routing source of truth — match the task's `#focus` against each agent's
   `focus:` list. When multiple agents match, prefer lower `cost_tier`.
3. **Else report idle.** Do not invent work.
4. **User override always wins.** Direct instruction from Lou supersedes
   routing.

The `agents.yaml` is consulted by the dispatcher (Lou or an orchestrator
script). Workers don't need to read it — they just need to know their own
specialty.

## Review against commits, not working trees

When a task moves to `Ready-for-Review`, record the **commit SHA** containing
the change. Reviewers diff that SHA — never the live working tree of another
worktree. This eliminates "is this WIP or final?" ambiguity.

## Auto-paired review tasks

When you mark a task `Ready-for-Review`, the session skill auto-appends a
paired review task:

```
T-<N>-R Review T-<N> @ <SHA> — #review
```

The next `#review`-focused agent picks it up. If the review passes, the
reviewer marks both `Done`. If it fails, the reviewer marks T-`<N>` as
`Needs-Rework` with findings inline.

## Worktrees

When multiple agents work concurrently, each lives in its own worktree.
`.context/` is the shared truth: it lives in the **main repo** and is
**symlinked** into every worktree:

```bash
# from inside a worktree, once:
ln -s ../../.context .context
```

All agents read/write the same `.context/`. Code lives in each worktree
independently.

## Lock semantics

The `lock` file is an advisory mutex protecting STATE/DECISIONS mutations
only. It is held for **seconds, not sessions**. The session skill handles
acquire/release automatically.

- If the lock is held by someone else and is <5min old → wait briefly, retry.
- If the lock is >5min old → presumed stale; may be broken with a logged note.

Lock contention is near-zero in practice because hold time is so short.

## Decisions: append-only

DECISIONS.md is append-only. To overturn a prior decision:

1. Append a new block titled `proposed-supersede of D-<N>`.
2. Add a "Needs Lou" line in STATE flagging the proposal.
3. Wait for Lou's ratification before acting on the new direction.

**Never silently contradict a recorded decision.** Surface it.

## Review finding template

Reviewers must record findings in this shape so multi-model output stays
comparable:

```markdown
**Finding:** <one-line claim>
**Severity:** blocker | major | minor | nit
**Location:** <file:line or section>
**Evidence:** <what the code/text actually does>
**Suggested fix:** <if obvious; else "needs discussion">
```

## Reviewer discipline (blind-first read)

If your task is `#review`:

1. Read the parent task's definition in STATE **first**.
2. Run `git show <SHA>` to read the diff **blind** — do not read the doer's
   LOG entry yet.
3. Form your own findings using the template above.
4. **Then** read the doer's LOG entry. If it changes your reading, note
   "anchoring check" in your review.

This protects against silently inheriting the doer's framing.

## Promotion: durable decisions must be written down

A decision that lives only in one window's conversation is invisible to every
other window. At check-out, the session skill prompts:

> "Did this session produce any durable decision worth recording?"

If yes, append it to DECISIONS.md. If overturning a prior decision, use
`proposed-supersede`.

## Known limitations (v1 — deferred for later consideration)

These are real gaps. They are accepted for now; revisit when the friction
becomes concrete.

1. **No real-time interrupts.** A reviewer's findings on in-progress work
   won't reach the working agent until that agent's next check-in. For urgent
   course corrections, intervene directly in the working window. The context
   manager is a **handoff system, not a real-time bus** — by design.

2. **No cross-window chat memory.** Each window's conversation history is
   private. Durable insight must be promoted to DECISIONS or LOG; otherwise
   it is lost. The promotion prompt at check-out is the only safeguard.

3. **Reviewer anchoring risk.** A reviewer who reads the doer's LOG before
   the diff may anchor on the doer's framing. The blind-first-read discipline
   above is a discipline gate, not enforced.

4. **Advisory lock, not atomic.** Two agents writing simultaneously could
   race. Window is sub-second; contention is near-zero. If it becomes a
   real problem, escalate to git-commit-as-lock semantics.

## Bootstrapping a fresh project

The session skill can scaffold this store in any repo. Invoke it in a
project without `.context/`; it will create the four files, an empty
`archive/`, and seed STATE with "Define the active objective" as the first
task.
