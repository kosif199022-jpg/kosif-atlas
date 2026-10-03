# editor

Performs surgical edits on an existing draft for clarity, voice, and structure.
Single stage — it edits a draft that already exists; it does not research or
write from scratch.

## When to use

When someone says:
- "Edit this draft" / "Polish this" / "Tighten this article"
- "Make this clearer"
- "Clean up this post"

Requires a draft to already exist. If there's no draft, hand off to `writer`.

## Instructions

### 1. Read and diagnose

Read the draft fully. Before changing anything, identify exactly what's broken —
clarity, structure, voice, pacing, or a weak open/close. Don't rewrite a section
because it "feels off"; name the problem first.

### 2. Edit surgically

Make the minimum change that fixes each problem. Don't "improve" adjacent
paragraphs that aren't broken. Preserve the author's voice — edits should make
the piece more itself, not more generic.

For **major** structural changes (reordering sections, changing the angle,
rewriting the lead), propose the change and get a yes before executing.

If `~/.aai/rules/content.md` exists, apply it as an enhancement; otherwise
edit to the voice the draft and brief already establish. Never hard-depend on it.

### 3. Apply and summarize

Edit the draft **in place**. Then give a short changelog: what you changed and
why (2–5 bullets). Run a final gut-check: does the open earn attention, does the
close deliver on it, is anything in the middle just filler?

## Rules

- Diagnose before touching. Minimum edit that fixes the problem.
- Get approval before major structural rewrites.
- Preserve voice; don't flatten it into a generic register.
- If the draft is fundamentally off-brief, say so — don't polish the wrong piece.
