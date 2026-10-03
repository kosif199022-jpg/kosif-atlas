# distro-kit

One tool, three commands, one install standard. Every capability packaged with it installs
the same way: the curl one-liner in `docs/CAPABILITY-INSTALL-STANDARD.md`.

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/coachlou/ambient-library/main/library/ambient-folder/bootstrap.sh \
  | bash -s -- distro-kit [target-folder]
```

Re-run to update. Runs only from the ambient-library dev workspace (it needs `scripts/` and `library/`):

```sh
python3 library/distro-kit/distro_kit.py --help
```

## Package a new app

```sh
python3 library/distro-kit/distro_kit.py init /path/to/app-repo \
  --name my-cap --purpose "Turns a folder into X" --launcher my-cap.sh \
  --app-files main.py,VERSION,README.md --runtime "Python 3.10+"
```

Writes `app-repo/distro/`. Then fill every `TODO` in `distro/instructions.md`,
`distro/run.sh`, `distro/templates/aai/*.md`. `validate` refuses while any remain.

## Check it

```sh
python3 library/distro-kit/distro_kit.py validate /path/to/app-repo
```

Exit 0 means the package satisfies what `library/ambient-folder/install.sh` and
`scripts/sync-distro.sh` actually read: the required files, semver in plugin.json,
SKILL.md name/description matching plugin.json, `{{NAME}}` in the aai templates,
every APP_FILES path present, DEPENDS resolvable and including `ambient-folder`.

## Publish to the library

```sh
python3 library/distro-kit/distro_kit.py publish my-cap /path/to/app-repo --check   # plan only
python3 library/distro-kit/distro_kit.py publish my-cap /path/to/app-repo           # write
```

Does validate → sync-distro → promote (first time) → catalog.yaml, marketplace.json,
SKILLS.md entries → audit. The description in plugin.json becomes the catalog line
verbatim, so write it once there. Does **not** release: pass `--release` to append to
`RELEASE.yaml` and run `build-production.sh`. Never commits.

Re-running publish for a new app version is the whole update flow: bump
`distro/.claude-plugin/plugin.json` version in the app repo, publish again.

## Rules

- `distro/app/` is never hand-written; sync-distro builds it from `APP_FILES`.
- Alternate source folder name (e.g. `ambient-distro/`): pass `--src`.
- Warnings from sync-distro about a dirty app repo are real: the synced `app/VERSION`
  records a sha that does not match the files.
- Self-check: `bash selfcheck.sh` in this directory. Fails if validate stops catching a
  broken APP_FILES.
