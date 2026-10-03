# {{NAME}} — Behavior

## When this applies

Any request to specify, build, review or inspect a software product in this
folder: "build me an app that…", "write the spec", "approve this spec", "run the
factory", "what is this run waiting on", "record the verdict", "show me the
review findings". The factory is this folder's agentic function; the
repositories under `projects/` are its output.

## Inputs

| File | Kind | Load when |
|------|------|-----------|
| `~/.aai/identity.md`, `purpose.md`, `context.md`, `memory.md` | reference — the owner's global ambient home | always, **if `~/.aai/` exists**; then `~/.aai/rules/core.md`. Skip silently if absent. |
| `.aai/references/*.md` | reference — folder-level rules | always, if present |
| `.ailib/software-dev-factory/` | vendored — resolve `.aai/skills/software-dev-factory/` first (shadowing) | any factory operation |
| `.ailib/software-dev-factory/app/docs/user-guide.md` | reference — specs, the owner's four decisions, the CLI surface | before writing a spec or starting a run |
| `.ailib/software-dev-factory/app/docs/admin-guide.md` | reference — adapters, policy, parks and refusals | troubleshooting |
| `projects/<name>/.aai/policy/factory.yaml` | working — that project's quality profile | before any run in it |
| `git -C projects/<name> show <run-ref>:run.json` | working — one run's state, stages, review, verdicts | when the request names or implies that run |

## Process

1. **Create a project**: `./factory init <name>` at the folder root. It creates
   `projects/<name>` as a git repository and installs the factory scaffold into
   it: `.aai/instructions.md`, `.aai/policy/factory.yaml`, `.aai/factory.env`,
   and the project's own `factory` shim.
2. **Set the quality profile** (owner decision): edit
   `projects/<name>/.aai/policy/factory.yaml`. `test_unit` must emit JUnit XML on
   stdout and `coverage` must write `coverage/coverage-summary.json`, or every
   run parks at baseline. The user guide's section 6 has the required shape.
3. **Write the spec** (inference — this is the leverage point): interview the
   owner one question at a time. **At least one acceptance criterion must
   exercise the primary journey through the surface the owner actually touches**
   — the page, the CLI, the button — or the factory ships something green and
   unusable. Push back on scoping out "the UI" or "a way to run it".
4. **Approve** (owner decision, deterministic):
   `./factory --project <name> approve <spec.md>` binds the approval to the
   spec file's exact bytes. Nothing runs before this. Never approve on the
   owner's behalf.
5. **Run**: `./factory --project <name> run --spec <spec.md>` walks plan → red →
   green → review under controller governance and parks at the review gate.
   Every command prints one JSON record. Exit codes: `0` success or an honest
   park, `1` a rejection, `2` a usage error, `3` a fail-closed refusal.
6. **Review** (owner decision): read the parked run's `review` field and report
   the findings in plain language, marked `blocking`, `major` or `minor`. Any
   `blocking` finding stops the run and cannot be accepted. Then record the
   owner's decision with `./factory --project <name> verdict
   .aai/runs/<run-id>/review-verdict.approval.json`. `reject` is a first-class
   outcome — sending it back re-runs green and review with fresh workers.
7. **Merge** (owner decision): the factory produces a reviewed candidate and
   stops. Do not commit, push, merge, tag or deploy it.
8. **Update the factory**: re-run the installer from the library; it re-syncs
   `.ailib/` and leaves `.aai/` and `projects/` alone.

## Outputs

- `projects/<name>/` → one product repository, with the candidate change
- `git refs/factory/runs/<run-id>:run.json` in that repository → the run record:
  stages, evidence, `review`, `verdicts`
- `projects/<name>/.aai/specs/<spec-id>.approval.json` → the digest-bound approval
- `.aai/memory.md` → dated decisions about projects, adapters and upgrades

## Rules

- macOS and Node 22.12.0+ are prerequisites. Every project command and agent
  invocation runs confined through `/usr/bin/sandbox-exec` and there is no
  unconfined fallback; on another platform runs park with no result.
- Without `FACTORY_ADAPTER` and `FACTORY_ADAPTER_EXECUTABLE` in `.aai/factory.env`,
  `run` refuses with exit 3 rather than pretending to work. Check this before
  diagnosing anything else.
- Never write to a project repository while a run holds the lease. Check
  `git -C projects/<name> show refs/factory/active:lease.json` first;
  `fatal: invalid object name` means no lease is held.
- Rejected at review? Fix the stage that let it through, not the reviewer and
  not the spec.
- One operation per request: init, spec, approve, run, verdict, or inspect.
- Calling the controller's `runStage` directly is ungoverned and unsupported.
