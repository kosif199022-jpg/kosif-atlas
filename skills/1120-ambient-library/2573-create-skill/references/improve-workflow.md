# --improve: audit and improve an existing skill

A dedicated pass for existing skills: score against the quality rubric, fix
only what's flagged, re-score, report before/after plus any generalizable
lesson. It is the quality gate (see SKILL.md) with an apply-fixes step in the
middle. Works on one skill or a whole folder of them.

## Protocol (per skill)

Run each skill's audit in a fresh subagent when subagents are available — a
blind read that judges only the artifacts, with no authoring context, scores
honestly. Give the subagent this file and the rubric path, nothing else.
Batch subagents in parallel when auditing a folder. Without subagents, audit
inline but re-read the skill top-to-bottom cold first.

1. Read `references/quality-rubric.md`. Score BEFORE: per-criterion (0/1/2 × 8),
   scaled /10.
2. Run the "Packaging & provenance checks" from SKILL.md mechanically —
   `ls` the folder, verify every referenced path resolves, check prose
   literals against bundled scripts. These defects are invisible to a
   prose-only read and are the most common real-world failures.
3. Improve — fix ONLY criteria scoring 0 or 1, plus any packaging-check
   failures. Rules:
   - Preserve the skill's name, folder name, intent, and voice. Surgical
     edits, not rewrites.
   - Cut bloat rather than add prose; token economy is a criterion.
   - Don't fabricate scripts or reference files to satisfy a criterion. If a
     step is genuinely inference-bound, one sentence saying why scores a 2.
     Only bundle a script when it's small, self-contained, and you write it
     fully and test it.
   - If a declared reference file doesn't exist, add an explicit "if absent"
     fallback rather than inventing the file's content.
   - A missing CONTEXT.md alone doesn't zero criterion 2 if the SKILL.md body
     declares inputs/outputs/preconditions.
   - Leave a criterion at 1 with a stated reason when the fix would cross
     into rewrite territory — honesty over score-chasing.
4. Score AFTER (fresh top-to-bottom re-read).
5. Report:

```
# <skill-name>
Before: N/10 (1:x 2:x 3:x 4:x 5:x 6:x 7:x 8:x)
After:  N/10 (1:x 2:x 3:x 4:x 5:x 6:x 7:x 8:x)
Changes: <bulleted, one line each>
Lesson: <ONE generalizable authoring lesson, or "none" if already covered
by the rubric or SKILL.md>
```

## Batch mode (a folder of skills)

- Write the per-skill report files to `<skills-folder>/.audit/results/<name>.md`
  and a `SCOREBOARD.md` (table of before/after, mean, gate failures) beside
  them — the ledger survives context loss and later sessions.
- After all audits, collect the Lessons. A lesson earns promotion into
  create-skill's own SKILL.md only when it recurs across independent audits
  or names a defect class the rubric can't see; single-skill quirks stay in
  that skill's result file.
- Offer, don't perform, the git commit.

## After improving

Description changes made during --improve alter routing for the whole skill
system — if you touched the description, offer to run the description
optimization loop (see SKILL.md) before calling it done. If the user wants
deeper validation, the eval loop (test prompts, baseline = pre-improvement
snapshot) is the next step; --improve's rubric pass is the cheap gate, not a
replacement for evals on production-bound skills.
