# software-dev-factory

Turns a folder into a software development factory and operates it. The factory
is a governed SDLC controller: it takes a specification the owner has approved by
its exact bytes and walks it through plan, red, green and review, driving the
owner's own Claude Code or Codex CLI as the labour. Each stage hand-off is
checked by code reading real artifacts — the actual diff, the actual test output
— so a worker claiming "done, tests pass" advances nothing. Evidence lands in git
refs. The controller never commits, pushes, merges, releases or deploys.

The capability ships the controller itself in `app/` (a vendored bundle — see
`app/VERSION`), so a folder that installs it works with no network and no library
reachable. One git repository per product, under `projects/<name>/`.

## Important

- **macOS and Node 22.12.0+ are required by default.** Every project command
  and agent invocation runs confined through `/usr/bin/sandbox-exec`, with no
  unconfined fallback — elsewhere runs park at the baseline stage with no
  result. The installer warns but still writes the scaffold. On Windows
  (inside WSL2) or Linux, add `FACTORY_CONFINEMENT=none` before the install
  command to opt out of that sandbox — a reasonable trade only on a machine
  the owner trusts, running specs they wrote themselves.
- **A signed-in `claude` or `codex` CLI is required.** Without
  `FACTORY_ADAPTER` and `FACTORY_ADAPTER_EXECUTABLE` set, `run` refuses with
  exit 3 instead of pretending to work.
- **Running spends the owner's subscription quota.** Never start a run on the
  owner's behalf without an explicit go-ahead, and never approve a spec for them.
- Never edit `.ailib/software-dev-factory/` in a target folder — the next install
  re-syncs it. Personalise by copying to `.aai/skills/software-dev-factory/`.

## Install — make a folder a software development factory

**Installing for a non-technical owner?** Read `INSTALL.md` next to this file and follow
it instead of this section. It is a step-by-step runbook covering both macOS and Windows
(WSL2), with dependency detection, copy/paste blocks written for a beginner, and
remediation for every known failure. This section assumes the prerequisites are already
in place; `INSTALL.md` does not.

Without the library plugin (member one-liner, same result):

```bash
curl -fsSL https://raw.githubusercontent.com/coachlou/ambient-library/main/library/ambient-folder/bootstrap.sh | bash -s -- software-dev-factory <target>
```

With the plugin installed:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/library/ambient-folder/install.sh" software-dev-factory --check <target>   # plan only
bash "${CLAUDE_PLUGIN_ROOT}/library/ambient-folder/install.sh" software-dev-factory <target>           # default: cwd
```

1. Confirm the target path with the user; show the `--check` plan.
2. Run the installer. It writes:

```
<target>/
├── .aai/                            # OWNED — written once, never overwritten
│   ├── identity.md                  #   the folder's identity
│   ├── purpose.md                   #   what it is for, and what it will not do
│   ├── instructions.md              #   behavior: init/spec/approve/run/verdict/inspect
│   ├── context.md                   #   routing map
│   ├── memory.md                    #   dated decisions
│   └── factory.env                  #   adapter defaults, auto-detected from PATH
├── .ailib/                          # VENDORED — re-synced on every install
│   ├── manifest.yaml
│   ├── ambient-folder/              #   generic install/update script (dependency)
│   └── software-dev-factory/        #   this capability: factory.sh, app/ (the bundle)
├── factory                          #   root-level launcher → .ailib/software-dev-factory/factory.sh
├── projects/                        # one git repository per product
├── CLAUDE.md, AGENTS.md             # discovery anchors (appended, never replaced;
│                                    #   GEMINI.md, .cursorrules etc. too if present)
```

3. Verify: `ls <target>/.aai <target>/.ailib/software-dev-factory <target>/projects`
   and `<target>/factory` with no arguments, which prints the usage line. Do **not**
   verify with `factory init --help` — `init` takes exactly one argument and parses no
   flags, so that creates a project literally named `--help`.
4. Tell the user: `cd <target> && ./factory init <name>` creates the first
   product repository; then set its `.aai/policy/factory.yaml` and
   `.aai/factory.env`, write a spec, approve it, and run.

Re-running the installer (or `bash <target>/.ailib/ambient-folder/install.sh software-dev-factory <target>`)
is the **update** path: `.ailib/` is refreshed, `.aai/` and `projects/` are untouched.

## Operate — inside an installed folder

The folder's own `.aai/instructions.md` governs; it was written from
`templates/aai/instructions.md` here. In short, from the folder root:

```bash
./factory init <name>                                   # projects/<name>, git-initialised, scaffolded
./factory --project <name> approve specs/x.spec.md      # bind approval to exact bytes
./factory --project <name> run --spec specs/x.spec.md   # walk the lifecycle, park at review
./factory --project <name> verdict .aai/runs/<id>/review-verdict.approval.json
./factory --project <name> diagnose --spec specs/x.spec.md
```

`.aai/factory.env` at the folder root holds adapter defaults; the project's own
file overrides it. Inspect a run with
`git -C projects/<name> show <run-ref>:run.json`. The full walkthrough is in
`app/docs/user-guide.md`; adapters and troubleshooting are in
`app/docs/admin-guide.md`.

## Maintain — refresh the library copy (library maintainers)

This capability is owned by the software-dev-factory repo (`ambient-distro/` +
`APP_FILES`). `library/software-dev-factory/` is a build output — never
hand-edit it. Note the source folder is `ambient-distro/`, not `distro/`: that
name is already taken in the app repo by the release bundles
`scripts/build-distro.mjs` produces. After an app change is committed there:

```bash
scripts/sync-distro.sh software-dev-factory /path/to/software-dev-factory ambient-distro
```

Then audit, commit, and rebuild production. Bump
`ambient-distro/.claude-plugin/plugin.json` when the install contract changes so
installed folders can see they are behind.

## Rules

- One operation per request: install, update, init, approve, run, verdict, inspect, or sync.
- Never install into the library repo itself.
- Never approve a spec, record a verdict, or merge on the owner's behalf.
- Report in plain language: which folder, which project, what parked, what to run next.
