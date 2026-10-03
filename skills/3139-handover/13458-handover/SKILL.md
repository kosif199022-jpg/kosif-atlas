---
name: handover
description: Create a self-contained session handover file. Use only when the user explicitly asks to hand off, wrap up, or prepare a handover before clearing the conversation.
argument-hint: "[--commit] [additional requirements]"
disable-model-invocation: true
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/handover-context.sh), Bash(handover-record:*)
---

# Session handover

Create a self-contained handover so a later session can resume this work from the file alone.

## Context

Run `scripts/handover-context.sh` next to this `SKILL.md` and read its output.

## What to do

- Commit nothing unless the arguments contain `--commit`.
- With `--commit`, commit this session's non-handover work first in meaningful commits. Leave unrelated changes unstaged and note them. Never commit the handover file.
- Write the handover to `<handover-dir>/<filename-timestamp>-<slug>.md`, with a short kebab-case slug. Never overwrite an existing handover.
- Leave the handover uncommitted.
- Last, run `handover-record <absolute handover-file path>` to record the handover for the next `/clear`. The transfer is single-use and expires five minutes after the session ends. If recording fails, do not improvise a replacement; the handover file remains the deliverable.

## Writing the handover

Write in English and make it self-contained. Link durable records where useful and point to `git show` or `git diff` instead of pasting large diffs. Record the goal, current state, changes and commits, key files, decisions, validation, risks, next steps, and open questions when they apply.

Apply any arguments other than `--commit` as additional requirements.

## Output

Report only the handover path, pre-handover commit SHA(s) (or `not requested` / `skipped`), and whether recording succeeded.
