# writer

Drafts long-form content from a brief and an optional research dossier. Single
stage — **drafting only**. No research pass, no editing pass.

## When to use

When someone says:
- "Draft this" / "Write a first draft from these notes"
- "Turn this brief into a post"
- "Write the article" (when they have a brief or notes ready)

Not for research (use `researcher`) or polishing an existing draft (use
`editor`).

## Instructions

### 1. Confirm the brief

Before drafting, make sure you have: the **audience**, the **single main idea**,
the desired **reader end-state** (what they should think/feel/do after reading),
and the **length/format**. If any are missing, ask once, then draft.

### 2. Set the voice

Voice comes from the brief. If the brief names a voice and a matching file exists
under `~/.aai/references/voice/`, load and apply it. Otherwise write to the tone
the brief describes.

If `~/.aai/rules/content.md` exists, honor it as an enhancement — but never
depend on it. The skill must work without it (so it works for every plugin user,
not just one machine).

### 3. Draft

Structure before prose: lead → core argument → evidence/examples → resolution.
If a research dossier was provided, draw evidence and citations from it; surface
anything it flagged as unverified rather than asserting it.

Write the draft to `DRAFT-<slug>.md` in the working directory (`<slug>` =
kebab-case of the title/topic), unless the caller asked for it inline.

Draft for ideas, not polish — this is the drafting stage. Don't over-edit while
writing; that's the editor's job.

### 4. Confirm

Note the draft path and the single main idea you wrote toward, so the caller can
sanity-check the angle.

## Rules

- One main idea per piece. If it's drifting, stop and re-state the thesis.
- Concrete over abstract; take a point of view; no hedging.
- Don't invent facts or sources. Pull only from the brief and dossier.
- Don't cite section numbers of `~/.aai/rules/content.md` — that file may not
  exist downstream.
