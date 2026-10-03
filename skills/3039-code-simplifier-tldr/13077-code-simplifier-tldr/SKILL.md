---
name: code-simplifier-tldr
description: "TLDR-aware code simplifier that uses AST summaries for context and reads only target files in full. Achieves 80%+ token savings on large codebases. Use when user says /simplify, wants to reduce code complexity, remove dead code, eliminate redundant abstractions, or simplify over-engineered patterns. Merkle-integrated for O(1) cache lookups."
metadata:
  author: shihwesley
  version: 1.0.0
---

# TLDR-Aware Code Simplifier

This simplifier reads your codebase through AST summaries (TLDR) instead of raw source. It surveys file structures at ~5% token cost, identifies what actually needs changing, then requests only the specific line ranges it will modify. When mercator-ai is installed, the merkle manifest provides O(1) change detection — the agent skips files that haven't changed since the last mapping, cutting token usage by 96% on typical runs.

## Workflow

1. **Merkle check** — If `docs/.mercator.json` exists, diff against previous hashes to find changed files. Otherwise fall back to `git diff --name-only HEAD~3`.
2. **Survey via TLDR** — Read AST summaries (table of contents, constants, key terms) for each candidate file. This costs ~5% of reading the full file.
3. **Identify targets** — From the summaries, decide which files and which line ranges contain code worth simplifying.
4. **Read specific ranges** — Request only the sections that need work using offset/limit parameters.
5. **Simplify** — Apply the core principles: preserve functionality, follow project standards, improve clarity, maintain balance between brevity and readability.
6. **Verify** — Confirm changes with targeted reads of the modified sections.
7. **Log** — Append a session summary to `SIMPLIFICATION_LOG.md` in the project root with before/after comparisons and line savings.

## Usage

```
# Simplify recently modified files
/simplify

# Simplify a specific file
/simplify src/api/auth.ts

# Simplify by pattern
/simplify src/components/*.tsx
```

## Example

```
$ /simplify src/utils/parser.ts

# Agent reads TLDR summary of parser.ts (~50 tokens instead of ~1000)
# Identifies lines 45-80 as overly nested conditional chain
# Reads only lines 40-85 of the source
# Refactors to early-return pattern
# Logs: parser.ts — flattened nested conditionals, 35 → 22 lines
```

## Common Issues

- **"No TLDR summaries available"** — The TLDR hook must be installed for AST summaries to appear. Without it, the agent falls back to reading full files (still works, just uses more tokens).
- **Merkle manifest missing** — Install mercator-ai for O(1) change detection. Without it, the agent uses `git diff` which still works but doesn't cache across sessions.
- **SIMPLIFICATION_LOG.md not created** — The agent creates this file on first run. If it's missing after a session, the agent may have been interrupted before the logging step.
- **Changes too aggressive** — The agent follows "preserve functionality" as its first principle. If you see behavior changes, file a bug — the simplifier should only touch structure, not logic.

## Agent Reference

The full agent protocol is defined in `agents/code-simplifier.md`. It covers merkle integration, TLDR parsing, token budget management, and the five core simplification principles (preserve functionality, apply project standards, enhance clarity, maintain balance, focus scope).

The slash command entry point is `commands/simplify.md`.
