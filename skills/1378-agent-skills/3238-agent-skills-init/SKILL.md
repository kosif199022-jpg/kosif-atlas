---
name: agent-skills-init
description: This skill should be used when the user asks to "set up agent-skills", "migrate .claude/skills", "move skills to agent-skills", "Skills in agent-skills verschieben", "Obsidian does not sync .claude/skills", or "run agent-skills-init". One-time migration of the skills in a hidden agent folder (.claude/skills, .agents/skills, .codex/skills) into a visible agent-skills/ folder, removing the old folder and updating .gitignore. Linking follows with agent-skills-share.
---

# agent-skills-init

Hidden folders such as `.claude/skills` are not reliably synced by note apps like Obsidian, and
per-agent copies drift apart. This skill makes a visible `agent-skills/` folder at the project root
the single source of project skills. `agent-skills-share` then replaces the hidden folders with
symlinks to it.

```text
agent-skills/                        # canonical source, visible and synced
.claude/skills -> ../agent-skills    # Claude Code
.agents/skills -> ../agent-skills    # Codex
```

## Workflow

### 1. Find the candidates

Run the script without `--source` from the project root. It lists every real skills folder and
its skill count on stderr. Exit code 1 is expected in this discovery mode:

```bash
bash <base_directory>/scripts/init.sh
```

`<base_directory>` is the path shown as "Base directory for this skill".

- No candidates: there is nothing to migrate. If `agent-skills/` already exists, continue with
  `agent-skills-share`.
- One candidate: use it.
- Several candidates: ask the user which one is the source. Do not guess, the folders may have
  drifted apart. Another folder can be migrated in a later run: identical skills are skipped, but
  a single skill that differs from its copy in `agent-skills/` aborts that whole run with `CONFLICT`.

### 2. Dry run

```bash
bash <base_directory>/scripts/init.sh --source .claude/skills
```

Show the plan to the user. The lines mean:

| Line | Meaning |
| --- | --- |
| `copy` | skill will be copied into `agent-skills/` |
| `identical` | already in `agent-skills/` with the same content, skipped |
| `ignore` | file such as a manifest, not copied; it is deleted with the source |
| `BLOCKED` | directory without `SKILL.md` (grouped layout, lowercase `skill.md`); the run aborts |
| `CONFLICT` | same name in `agent-skills/` with different content; the run aborts |
| `delete` | the source folder is removed after the copies are verified |
| `gitignore` | entry to be appended to an existing `.gitignore` |
| `NOTE` | another real skills folder exists and stays untouched |

On `CONFLICT`, show the difference (`diff -r`) and let the user decide which version wins. Never
resolve it silently. On `BLOCKED`, show the directory to the user; deleting the source would lose
it, so it has to be flattened or moved out first.

### 3. Apply

After the user agrees:

```bash
bash <base_directory>/scripts/init.sh --source .claude/skills --apply
```

The script copies, verifies each copy with `diff -rq`, and only then deletes the source. If
verification fails, it stops before the deletion and nothing is lost. No backup is kept.

### 4. Link the agents

Invoke `agent-skills-share` to create the symlinks. Until then, the agent whose folder was
removed no longer sees the project skills.

### 5. Fix hard-coded paths

Skills that call their own scripts via `.claude/skills/<name>/...` keep working through the
symlink. Still, point them at `agent-skills/<name>/...` so the visible folder is the documented
path:

```bash
rg -n '\.(claude|agents|codex)/skills' -g '*.md' -g '*.sh' -g '*.py' .
```

Report these hits to the user and update them when asked.

### 6. Report

State how many skills were copied, which folder was removed, and the `.gitignore` changes. If the
script printed a `NOTE` about non-Markdown files, pass it on: when `agent-skills/` is synced with a
note app, scripts only reach other devices if the app syncs all file types (Obsidian Sync: "Sync
all other types" on every device).

## Notes

- The source folder is deleted, but only after every copy has been verified byte for byte.
  Files listed as `ignore` go with it; point them out in the dry run.
- Only the source folder is touched. A second real skills folder stays as it is and blocks its
  symlink until it is migrated or removed.
- `.gitignore` is only edited if it exists.
  `agent-skills/` itself must never be ignored.
- If the source was tracked by git, the script prints a note: stage the removal with
  `git rm -r --cached <source>`.
- Restart the agents afterwards so they pick up the new location.
