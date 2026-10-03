# init-dev-project

A library skill that scaffolds a folder into the dev-and-deploy standard and
makes it a git repo. The standard is [references/standard.md](references/standard.md).

**Status:** released · **Kind:** skill · **Lane:** ambient-library (`library/init-dev-project/`); this folder is the source

## Run

```bash
python3 scripts/init_dev_project.py ~/GitHub/my-thing --kind web --description "One sentence."
```

Creates `README.md`, `VERSION`, `CHANGELOG.md`, `Makefile`, `.gitignore`, `spec/SPEC.md`, and
`.aai/` (instructions, identity, purpose, context, HANDOFF, checkpoint, and a
version-stamped copy of the standard). Then, unless the folder is already inside a
git repo, `git init -b main`, one commit, tag `v0.0.0`. Never overwrites, never
adds a remote.

```bash
make check      # self-test: scaffolds into a temp dir and checks the contract
```

## Deploy

Target: ambient-library `library/init-dev-project/` (already in `RELEASE.yaml`).
Release with its admin flow (`~/.ailib/.aai/skills/admin.md`): copy this folder
over, bump the skill and wrapper versions, audit, `scripts/publish-distro.sh`.
