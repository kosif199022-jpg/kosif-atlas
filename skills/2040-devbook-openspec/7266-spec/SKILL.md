---
name: spec
description: 'Return an approved change''s specification unchanged — its proposal, the deltas a step delivers, its solution, and the step itself — for a run to build from, and refuse a change whose proposal is not approved or whose approval has lapsed. The provider an engine binds at its spec point as "devbook-openspec:spec". Use when: a run builds one step of a change under openspec/changes/, "what does this step have to build", "hand me the approved spec for step N". Writes nothing.'
---

# devbook-openspec spec

Open the reply with `devbook-openspec@<version>`, `version` read from `../../.claude-plugin/plugin.json`, not recalled.

The specification a run builds is the change a person already approved. Return it as it
stands: derive nothing, summarise nothing, and supplement nothing. Write nothing.

1. **Resolve the item.** A work item from `devbook-openspec:tracker` is `<change>#step-<N>`; a
   bare change name means its first open step, per the tracker's states. No such folder under
   `openspec/changes/`, or no such step in its `tasks.md`: say which and stop.
2. **Refuse an unagreed change.** Read `proposal.md`'s file block. Refuse, naming the fix, when
   its `status` is neither `approved` nor `accepted`, or when `approved-hash` differs from
   `node .devbook/_tools/devbook-meta/chapter-hash.mjs openspec/changes/<name>` — the change was
   edited after it was approved, so run `devbook-collaboration:chapter-approve` on it again.
   Refuse too a step marked `owner: me`: a person builds that one.
3. **Return, verbatim and in this order:** `proposal.md`; every delta the step's `delivers:`
   line names, whole — the file, not the one chapter; `solution.md`; and the step's own block
   from `tasks.md`. Label each with its path. The chapters `solution.md` names under *Load
   first* are context the run loads by address — name them, never inline them.
4. **Say what else is open** in one line: the change's other steps and their states, so the run
   knows what it must not build.

A revise from a gate re-runs this skill with the person's notes; the notes are for the change,
through `/opsx:propose` or a hand edit and a fresh approval, never an edit made here.
