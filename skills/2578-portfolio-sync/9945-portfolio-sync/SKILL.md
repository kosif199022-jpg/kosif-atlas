---
name: portfolio-sync
description: >-
  Sync the current project into a central project-portfolio Markdown archive — a comprehensive log of every project the user has worked on (stack, role, scope). Path-agnostic: the user picks where the archive lives, the skill remembers it. Gathers project signals (git log, manifests, README, structure), matches existing entries by folder name, proposes add/amend for user confirmation before writing. Use when user asks to update their portfolio, log a project, sync the archive, document the current project, or runs /portfolio-sync. Distinct from cv-craft (which produces actual CVs from this archive as source).
---

# portfolio-sync

Update the user's central **project-portfolio Markdown archive** with the state of the project in the current working directory.

## Quick start

1. Resolve the **portfolio file path** (see [Path resolution](#path-resolution) below).
2. Read the portfolio file and gather project signals (git log, manifest, README).
3. Match the project against existing entries by folder name.
4. Show diff-style preview + rationale, wait for confirmation, then `Edit`.

## Path resolution

The skill is path-agnostic. Resolve in this order before any read or write:

1. **Check memory** for a `reference`-type entry naming the user's portfolio file (look for an entry with `portfolio-sync` or `portfolio file` in its name/description).
2. If found, use the path directly.
3. **If not in memory, ask the user**:
   *"Where is your project-portfolio archive? (paste an absolute path to the `.md` file, or to the folder it should live in — I'll create it if missing.)"*
4. After the user answers, **save a memory reference entry** so future runs do not re-prompt. Format:
   ```markdown
   ---
   name: portfolio-sync file
   description: Where portfolio-sync stores the user's project-portfolio archive
   type: reference
   ---

   Portfolio file: `<absolute-path>.md`
   ```
   And add a one-line pointer to `MEMORY.md`.
5. If the portfolio file does not exist at the resolved path, ask the user whether to create it (with the structure documented in [REFERENCE.md](REFERENCE.md)) — do not create silently.

## Constants

- **Project root:** `pwd` unless the user names a different folder.

## Flow

Four phases. Do not skip confirmation.

### 1. Identify the project

- Resolve project name from basename of `pwd`.
- If `pwd` is inside a monorepo (child of folder with own `package.json`/`Cargo.toml`), ask user whether they mean inner package or outer repo.

### 2. Gather signals (in parallel)

- `git log --oneline -30` — recent commit subjects. Skip if not git repo.
- Primary manifest if present: `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `pubspec.yaml`, `Gemfile`.
- `README.md` if present (first ~80 lines).
- Top-level dir + one level of `src/` (or equivalent).

Skip `node_modules`, `target`, `dist`, `.next`, `build`, `vendor`, `__pycache__`, lockfiles.

### 3. Match against the portfolio

Read the resolved portfolio file in full. Match by folder name against existing entries (e.g. folder `v0-acme-portal` → entry `**v0-AcmePortal**`, casing only; folder `bluebird-app` → `### skylark.io (Bluebird App)`, where the product was renamed after the repo was). Expect renames: match on loose similarity, confirm with user before treating as the same entry.

Three outcomes:

- **Existing entry found** → prepare *amended* version, preserving section, tone, bullet style. Only change lines where state moved.
- **No match, but project belongs in existing section** (Professional / Client / Side Projects) → propose new entry there.
- **Ambiguous** → ask user where it belongs before drafting.

### 4. Propose, then write

Show user before editing:

- Which entry matched (or "new entry in *Side Projects*").
- Diff-style preview: current bullet(s) and proposed replacement, or new entry block.
- One-line rationale per change ("added because commit `abc123` introduced X").

Wait for explicit confirmation. Apply with `Edit` (preferred) or `Write` only for full rewrite. Confirm change in one sentence — do not re-print the full file.

## Writing rules + after-write checks

See [REFERENCE.md](REFERENCE.md) for writing style, what to include, Technical Skills table updates, and after-write verification.

## Humanize the written prose (if available)

Before writing generated prose to a file, if the `humanizer` skill is installed, run it on the drafted text so the created document reads naturally and free of AI tells; skip silently if it is not available. Apply it to the human-facing document body only, never to code, frontmatter, file paths, IDs, or literal templates.
