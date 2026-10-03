# Software Development Factory — alpha

A controller that walks a spec through a governed software lifecycle: plan, red, green,
review. It drives *your* coding agent (Claude Code or Codex) as the labour, and owns the
parts an agent should not own — approvals, evidence, quality gates, and the two points
where it stops and asks you.

Zero dependencies. Node 22.12.0+ and git are the whole runtime.

**macOS only, by default.** Every project command and agent invocation runs confined
through `/usr/bin/sandbox-exec`, and there is no unconfined fallback — on another
platform the controller refuses to spawn anything and runs park at the baseline stage.
The installer checks this up front.

**Windows or Linux?** Install inside WSL2 (Windows) or use Linux/Git Bash directly, and
add `FACTORY_CONFINEMENT=none` before the install command, e.g.:

```sh
FACTORY_CONFINEMENT=none curl -fsSL https://raw.githubusercontent.com/coachlou/ambient-library/main/library/ambient-folder/bootstrap.sh \
  | bash -s -- software-dev-factory my-factory
```

This turns off the macOS sandbox that normally fences what a run can write to. It is
safe on a machine you trust running specs you wrote yourself, which is the intended use
here — it is not a general-purpose security boundary. Once installed, the setting lives
in `.aai/factory.env` and does not need to be repeated for `./factory run`.

## Install

Two levels, and most people want the first.

**A factory folder (the harness).** One command builds a folder that holds the factory,
its ambient `.aai/` behavior layer, and a `projects/` directory with one git repository
per product:

```sh
curl -fsSL https://raw.githubusercontent.com/coachlou/ambient-library/main/library/ambient-folder/bootstrap.sh \
  | bash -s -- software-dev-factory my-factory
cd my-factory && ./factory init my-product
```

That stamps `.aai/{identity,purpose,instructions,context,memory}.md`, vendors the factory
into `.ailib/`, writes a `.aai/factory.env` with your coding-agent CLI auto-detected from
PATH, adds a discovery anchor to `CLAUDE.md`/`AGENTS.md` (and to `GEMINI.md`,
`.cursorrules` and friends if the folder already has them), and drops the `./factory`
launcher. Re-running it is the update path: `.ailib/` refreshes, `.aai/` is left alone.

**A single repository.** To install into a repo you already have, run the bundle's
installer directly — this is also what `./factory init` calls per project:

```sh
bash install.sh /path/to/your/repo     # or: cd your/repo && bash /path/to/install.sh
```

Keep this bundle folder where it is — the installed `./factory` command points back at it.

The installer is non-destructive. It writes four files into your repo and refuses,
before writing anything, if a managed path already holds different contents:

| Path | What it is |
|---|---|
| `.aai/instructions.md` | ambient router — tells any agent where the factory config lives |
| `.aai/policy/factory.yaml` | your quality profile: test, coverage, and lint commands |
| `.aai/factory.env` | which coding-agent CLI the factory drives |
| `factory` | the command shim |

`.aai/` and `.ailib/` follow the ambient-agent folder convention: `.aai/` is yours to
edit and the factory never rewrites it; `.ailib/` is factory-managed.

### Install into the library

Keep one copy of the bundle in a stable place and stamp factory folders from it:

```sh
bash install.sh --library                 # default library: ~/.ailib
bash ~/.ailib/software-dev-factory/current/install.sh --factory /path/to/factory-folder
```

`install.sh --library [dir]` copies this bundle to `<dir>/software-dev-factory/<release>/`,
where `<release>` is the bundle's `RELEASE` file, and points the relative symlink
`<dir>/software-dev-factory/current` at that directory. Re-running the same bundle prints
`already installed: <dest>` and rewrites nothing. Any other bundle writes only its own
versioned directory and moves `current` to it — including an older bundle run again — so
`current` is the most recently installed release, not necessarily the newest.

Run `--factory` and per-repository installs through `current/install.sh`. The script
resolves its own location with `pwd -P` before copying, so the target vendors a full copy
of whatever release `current` pointed at, not a copy of the symlink. A later `--library`
install moves `current` but never changes what an existing factory folder vendored.

### Install as a factory folder

One folder can hold several projects instead of installing into each repository by hand:

```sh
bash install.sh --factory /path/to/factory-folder
cd /path/to/factory-folder
./factory init myapp                      # creates projects/myapp
./factory --project myapp approve specs/x.spec.md
```

`install.sh --factory <dir>` refuses if `<dir>/.aai/instructions.md` already exists, then writes:

| Path | What it is |
|---|---|
| `.aai/{instructions,identity,purpose,context,memory}.md` | the folder's ambient identity files |
| `.aai/factory.env` | factory-wide coding-agent CLI defaults |
| `.ailib/software-dev-factory/` | vendored copy of this bundle |
| `.ailib/manifest.yaml` | name, source, and version of what is vendored |
| `.gitignore` | gains `.ailib/` and `projects/` |
| `factory` | the shim, with exactly two commands |

`./factory init <name>` creates `projects/<name>`, runs `git init` there if it has no
`.git`, and installs the per-repository scaffold above into it. It never creates a remote.

`./factory --project <name> <command...>` runs the factory CLI inside `projects/<name>`,
loading `.aai/factory.env` from the factory folder first and then from the project, so
project values win.

`.ailib/` is a re-syncable cache, not source: it is gitignored in the factory folder and
in each project, and re-running `install.sh --factory` on a fresh folder replaces it.

## Set up (two files, five minutes)

**1. `.aai/policy/factory.yaml`** — the commands the controller actually runs. Defaults are
vitest-shaped; change them to whatever your repo uses. `test_unit` **must** print JUnit XML
on stdout and `coverage` must write `coverage/coverage-summary.json`, or runs park at the
baseline stage.

**2. `.aai/factory.env`** — uncomment `FACTORY_ADAPTER` and point
`FACTORY_ADAPTER_EXECUTABLE` at your agent CLI. Without it, `./factory run` refuses (exit 3)
instead of pretending to work.

## Use

```sh
./factory approve spec.md          # bind your approval to the spec's exact bytes
./factory run --spec spec.md       # walk the lifecycle, park at the review gate
./factory verdict .aai/runs/<run>/review-verdict.approval.json
./factory diagnose --spec spec.md  # explain what a parked run means — read-only
```

Every command prints one JSON record. Exit codes: `0` success or an honest park, `1` a
rejection, `2` a usage error, `3` a fail-closed refusal.

Full walkthrough — writing a spec, the four decisions you make, what each stage produces —
is in [`docs/user-guide.md`](docs/user-guide.md). Operations, adapters, and troubleshooting
are in [`docs/admin-guide.md`](docs/admin-guide.md).

## The Control Room (monitor)

A local page that shows your project's runs and lets you Approve or Reject a run waiting
for you. Start it **from your project folder**; it refuses to start anywhere without
`.aai/policy/factory.yaml`. `<bundle>` depends on how you installed:

| Layout | Command, run inside the project |
|---|---|
| plain `install.sh <repo>` | `node --experimental-strip-types --no-warnings <bundle>/scripts/monitor.ts`, where `<bundle>` is the extracted bundle, or `<library>/software-dev-factory/current` for `--library` |
| `install.sh --factory` | `node --experimental-strip-types --no-warnings <folder>/.ailib/software-dev-factory/scripts/monitor.ts` |
| ambient | `node --experimental-strip-types --no-warnings <folder>/.ailib/software-dev-factory/app/scripts/monitor.ts` |
| ambient fork | `node --experimental-strip-types --no-warnings <folder>/.aai/skills/software-dev-factory/app/scripts/monitor.ts` |

Then open `http://127.0.0.1:4600`. Two monitors on one machine collide on port 4600: set
`FACTORY_MONITOR_PORT=<port>` for the second.

- A verdict runs the bundle's CLI with the folder's `.aai/factory.env` (factory-folder and
  ambient layouts only), then the project's `.aai/factory.env` loaded, so the project wins.
- When a verdict is accepted, the remaining stages run before the page answers, so the page
  does not respond until that run finishes. A click made meanwhile is answered afterwards,
  and refused unless the run is waiting for you again.
- The monitor needs `pgrep`/`ps` (macOS/Linux). The factory install itself is macOS-only
  unless `FACTORY_CONFINEMENT=none`.
- Existing installs get the monitor by re-running the installer or the ambient bootstrap.
- In a factory development checkout, starting it from the repository root still works, and
  its verdicts now also load `<repo>/.aai/factory.env` if one exists.

## Alpha, honestly

- **macOS only** (above). Linux and Windows have no confinement backend, and the
  controller fails closed rather than running your commands unconfined.
- The lifecycle has been driven end to end against a real Claude Code CLI, including a
  review that rejected the factory's own output. It has *not* been driven against Codex.
- Hosted `factory/checks` publishes against a candidate SHA, but nothing publishes the
  candidate ref itself yet — you push it by hand (LIM-13).
- `scaffold`, `status`, and `resume` exist as functions but have no CLI wiring.
- The red gate requires every JUnit `<failure>`/`<error>` element to carry
  `type="AssertionError"`. `node --test` writes `type="testCodeFailure"` for every
  throw, so a bare `node --test` runner can never pass red — write your tests with
  `node:assert/strict` behind a runner that reports the thrown error's name, or use a
  framework that does (vitest, jest). The family is not yet configurable (OI-59).
- A rejected red stage tells you what failure types it saw, but the JUnit itself dies
  with the isolated worktree — nothing lands in `.aai/runs/`, so there is no artifact
  to inspect afterwards (OI-58).
- `factory verdict` refuses when two runs are parked and offers no flag to disambiguate;
  clearing the stale one currently needs `git update-ref -d`.
- Governance covers `run --spec`. Calling `runStage` directly is ungoverned (OI-8).

`VERSION` holds this bundle's content digest — the same digest stamped into your repo's
`.ailib/manifest.yaml`.
