---
name: rule
description: Add a standing rule to CLAUDE.md, CLAUDE.local.md, AGENTS.md, or the global CLAUDE.md
license: MIT
disable-model-invocation: true
argument-hint: '[rule text, optionally prefixed with local: or global:]'
---

Files present: !`ls CLAUDE.md CLAUDE.local.md AGENTS.md .claude/CLAUDE.md 2>/dev/null || true`

Add this rule: $ARGUMENTS

1. Target. A `global:` prefix means `~/.claude/CLAUDE.md`. A `local:` prefix means `CLAUDE.local.md`
   (create it and add it to `.gitignore` when missing; when the repository has only AGENTS.md, say
   that Claude Code now reads CLAUDE.local.md instead of AGENTS.md unless its Project instructions
   setting is `claude-md-and-agents-md`). Otherwise the repository's `CLAUDE.md` or
   `.claude/CLAUDE.md`, whichever exists. When only AGENTS.md exists, or CLAUDE.md is a symlink to
   AGENTS.md or contains only `@AGENTS.md`, edit AGENTS.md and do not create a CLAUDE.md. When both
   exist as separate files, mirror the rule into AGENTS.md unless it is Claude Code specific.
2. Rewrite the rule as one imperative line in the file's existing voice. Put it under the section it
   belongs to; create a section only when none fits.
3. A rule that contradicts an existing line: replace the old line and say so.
4. Show the added line and the file path. Do not commit.
