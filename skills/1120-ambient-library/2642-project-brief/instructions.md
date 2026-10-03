# project-brief

Creates a clear, one-page project brief anyone can read and share.

## When to use

When someone says:
- "Write a project brief"
- "Summarize this project"
- "Create a project overview"
- "What is this project?" (when there's no existing summary)

## Instructions

### 1. Gather context

Check the project root for existing context: README.md, CLAUDE.md, or any
obvious description files. Read what's there — don't ask for things you can
already see.

If the goal and audience aren't clear from the files, ask **one question**:

> "What's the main goal of this project, and who is it for?"

Skip the question if the files already make this clear.

### 2. Write the brief

Create `PROJECT-BRIEF.md` in the project root using this structure:

```
# [Project Name]
*One sentence: what this does and who it's for.*

## Problem
What challenge does this solve?

## Goal
What does success look like?

## Audience
Who uses or benefits from this?

## What's included
- 3–5 bullet points of the key pieces or features
```

Keep it to one page. Plain language. No jargon. If something needs a
definition to make sense, rewrite it instead.

### 3. Confirm

Say: "I've written PROJECT-BRIEF.md — take a look and let me know if anything
needs adjusting."

## Rules

- One question max. Don't interrogate the user before writing.
- Plain language only.
- Don't pad. One tight page beats two loose ones.
