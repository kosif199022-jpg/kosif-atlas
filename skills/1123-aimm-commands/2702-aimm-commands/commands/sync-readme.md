---
name: sync-readme
type: command
description: Regenerates the Commands and Skills tables in README.md from the actual files in commands/aimm/ and skills/*/SKILL.md. Run after any batch of new or updated assets to keep the README in sync. Trigger on "update the readme", "sync the readme", "the readme is out of date", or any time new commands or skills have been added.
trigger: /aimm:sync-readme
location: commands/aimm/
---

# Sync README

Regenerate the Commands and Skills tables in `README.md` from the actual files on disk. Prevents README drift after batch asset additions.

## The Command

```
Read all files in commands/aimm/*.md and skills/*/SKILL.md.

For each command file, extract:
- name (from frontmatter `name:` field, or filename if absent)
- description (first sentence of the frontmatter `description:` field, truncated to ~120 characters)

For each skill folder, read its SKILL.md and extract:
- name (from frontmatter `name:` field)
- description (first sentence of the frontmatter `description:` field, truncated to ~120 characters)

Regenerate the two markdown tables in README.md:
1. The Commands table (| Command | What it does |), sorted alphabetically by command name
2. The Skills table (| Skill | Description |), sorted alphabetically by skill name

Replace the existing table content between the table headers and the next --- divider.
Preserve all other README content exactly.

Confirm: how many commands and skills were found, and list any files that were skipped due to missing frontmatter.
```

## When to Run

- After any commit that adds or renames commands or skills
- Before opening a pull request that includes new assets
- Whenever the README table looks stale or a new member asks "where is X?" and the README doesn't show it

## What It Does Not Do

- Does not add, remove, or reorganise README sections — only the two tables
- Does not update the TrelloPipelineAgent or Prompts sections
- Does not validate skill quality or check classification — use `asset-detection-heuristics.md` for that

## Related

- `commands/aimm/help.md` — lists commands for in-session use; separate from the README
- `look-over-my-shoulder/ambient-intelligence-four-types/vault-artifacts/command-vs-skill.md` — classification criteria
