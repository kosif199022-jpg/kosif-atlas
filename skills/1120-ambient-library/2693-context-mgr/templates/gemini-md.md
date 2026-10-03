# Gemini Instructions — multi-agent-context

This project uses a shared continuity protocol at `.context/`. Multiple agents,
models, and CLI windows work on the same project. The store is the truth; your
private conversation history is not enough.

**Read `.context/CHARTER.md` now for the full protocol.** What follows is the
minimum you need to act correctly.

---

## On every session start

1. Read `.context/STATE.md` in full.
2. Read the top ~5 entries of `.context/LOG.md` (newest first).
3. Skim `.context/DECISIONS.md` — flag any `proposed-supersede` block to the
   user.
4. Check for stale tasks: any task in `Doing` with a `started:` timestamp
   older than 4h that isn't yours → add a "Needs Lou" line in STATE flagging
   it for reclaim or reassign.
5. Select a task using this priority:
   - Explicit `@you` assignee → take it.
   - Top Todo whose `#focus` matches your specialty → take it.
   - User instruction overrides both.
   - Else → report idle; do not invent work.
6. Move the task to `Doing` in STATE, stamp `worker:` and `started:`.

**Acquire the lock before mutating STATE.** Write `{"agent": "<id>",
"started": "<ISO>"}` to `.context/lock`. Release it (delete the file)
immediately after the mutation. Hold time: seconds, not the session.

If `.context/lock` already exists and is <5min old → wait, retry once.
If >5min old → break it and note the break in your LOG entry at check-out.

---

## On every session end

1. Commit any source changes first. Note the SHA.
2. Determine task outcome:
   - Finished and self-verified → `Done`
   - Finished, needs review → `Ready-for-Review` (requires commit SHA)
   - Interrupted mid-task → leave in `Doing`, update handoff note
   - Wrong approach → `Needs-Rework` with reason
3. Acquire the lock. Update STATE. If `Ready-for-Review`, append a paired
   review task: `T-<N>-R Review T-<N> @ <SHA> — #review`
4. Append to `.context/LOG.md` at the top (newest first):

   ```
   ## <ISO date> · <agent-id> · session

   **Worked:** T-<N>
   **Did:** <what happened>
   **Changed:** <files; commit SHA>
   **Learned:** <anything surprising; else "nothing notable">
   **Handoff / next:** <exactly where to resume, or what's next>
   **Raised:** <new decisions, proposed-supersedes, Needs-Lou items>

   ---
   ```

5. Ask yourself: *"Did this session produce any durable decision?"* If yes,
   append to `.context/DECISIONS.md`. See CHARTER for the template.
6. Release the lock.
7. Commit `.context/` separately: `git commit -m "context: <agent> check-out T-<N> <status>"`

---

## If .context/ is missing

Ask the user before creating it. Do not silently bootstrap.

---

## Review tasks (#review)

Read the parent task definition in STATE first. Then `git show <SHA>` to read
the diff **blind** — do not read the doer's LOG entry yet. Form your own
findings. Then read the LOG. Note any "anchoring check" if it shifted your
view. See CHARTER for the finding template (severity / location / evidence /
suggested fix).
