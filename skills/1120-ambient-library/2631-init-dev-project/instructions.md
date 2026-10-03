# init-dev-project

Scaffolds a folder into the dev-and-deploy standard and makes it a git repo.
The standard itself is `references/standard.md`; every scaffolded project gets a
version-stamped copy at `.aai/references/dev-standard.md` and is governed by it
from then on.

## Important

- The script never overwrites. It fills missing files only, so re-running on an
  existing folder is safe. If a file looks wrong, edit it; do not delete and
  re-scaffold.
- It does `git init -b main`, one commit, and tag `v0.0.0` only when the folder
  is not already inside a git repo (its own or a parent's). Inside one, git is
  left untouched and the report names the repo; commit there. It never adds a
  remote and never pushes.
- Only the root files, `Makefile`, `deploy/SHIPLIST`, `spec/SPEC.md`, and `.aai/`
  are created. `src/`, `tests/`, `docs/`, `tools/` appear on first use, by hand. An empty
  folder is the first sign of a template that is too heavy.

## Process

1. **Resolve the target and the three values** — *hybrid*. Target path is the
   folder the user names (created if missing) or the current folder. Defaults:
   `--name` = folder basename, `--description` = one sentence from the user's
   request. `--kind`: pass it only when the request names one ("a skill" →
   `skill`, "a skill with a dashboard" → `skill-app`, "a CLI tool" → `tool`,
   "a web app / site / API" → `web`). Otherwise omit it: the script detects the
   kind from files already in the folder and falls back to the web layout.
   Ask nothing; the user edits `.aai/` later.
2. **Scaffold** — *code*.
   ```
   python3 scripts/init_dev_project.py <path> --name <n> --kind <k> --description "<d>" [--dry-run] [--no-git] [--json]
   ```
   Run with `--dry-run` first only when the folder already has files.
3. **Report** — *code*. Print the script's summary: the kind and why
   (`given`, `found SKILL.md`, or `nothing to detect`), files created, files
   skipped, git state. If the kind looks wrong for what the user asked, say so
   now; the ship list is the one file to fix. Then tell the user the next command is `make` inside
   the folder.
4. **`--interview` (opt-in only)** — *inference*. If the user asked for an
   interview, or says the one-line description is not enough, run the
   `ambient-folder` skill's **Incept** operation against the new folder *after*
   step 2. It rewrites `.aai/identity.md` and `.aai/purpose.md` in place; it must
   not touch `.aai/references/` or `.aai/instructions.md`.

## Outputs

```
<path>/
├── README.md  VERSION (0.0.0)  CHANGELOG.md  Makefile  .gitignore
├── deploy/SHIPLIST          picked by --kind (standard §4); edit to match the real layout
├── spec/SPEC.md             TODO: placeholders; `make check` fails until they are filled
└── .aai/
    ├── instructions.md      behavior of a project under the standard
    ├── identity.md          general development harness (edit as the build progresses)
    ├── purpose.md
    ├── context.md           routing map of the standard layout
    ├── checkpoint.md  HANDOFF.md
    └── references/dev-standard.md   stamped copy of the standard
```

## Rules

- Kind picks two things only: the ship list in `deploy/SHIPLIST` and the
  BUILD row of the `make` map. `skill`, `skill-app` and `tool` get their §4
  lists; any other word (`web`, `service`, `project`) gets `VERSION src/ docs/`.
  Without `--kind`, detection is: `SKILL.md` + `manifest.json` + `bridge/` →
  skill-app; `SKILL.md` → skill; `wrangler.*`, `Dockerfile` or `vercel.json` →
  web; nothing → project (web layout). Tools are never detected.
  The Makefile verbs and gates are the same for every kind; recipe bodies are
  filled in by hand when `make run` is first needed.
- `make check` fails until the project defines it. A gate that passes with
  nothing behind it is a false green; do not "fix" the stub to exit 0.
- Do not run the ambient-folder **Stamp** operation on a scaffolded folder. It
  would try to write a second `.aai/instructions.md`.
