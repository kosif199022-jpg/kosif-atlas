# Factory administrator guide

For the person who installs, configures, upgrades, secures, and operates the software
development factory for a team. Everything here is grounded in
`specs/factory-spec-final.md` (sections 7, 9, 11, 13, 14) and the current controller
sources; where the implementation is narrower than the spec, this guide says so and
names the limitation (`LIM-xx`, defined in `docs/gauntlet/README.md`).

Important framing: the **run** surface is a CLI; the **install and maintenance** surface is
still programmatic.

`src/cli.ts` ships six commands — `approve`, `start --spec`, `run --spec`, `verdict`,
`abandon --spec [--force]`, and `diagnose --spec`. There
is no `bin` entry in `package.json`, so nothing named `factory` lands on your `PATH`; the
real invocation is

```
cd <target-repository>
node --experimental-strip-types <factory-checkout>/src/cli.ts <command>
```

The CLI takes the repository it operates on from `process.cwd()`, not from an argument, so
the working directory is the target repo and the script path points back at the factory
checkout. The flag is a no-op from Node 22.18 on, where type stripping is the default; keep
it for 22.6–22.17 (LIM-01).

Everything else — `scaffold`, `doctor`, `upgrade`, `rollback`, `gc` — has no argv wiring and
is a TypeScript function you call from a script or the test harness. The function names and
option names below are the real ones.

Three operational prerequisites gate the CLI, in the order you will hit them: a valid §8
quality profile (section 0, and it refuses before anything runs without one), a
subscription-eligible adapter per operator (sections 5 and 6), and a JUnit-emitting test
command in the product repository (section 6).

## 0. The §8 quality profile is a hard prerequisite

**Read this before anything else. It is the most likely first failure.**

Every CLI command begins by checking that the working directory is a git repository, then
calls `doctor` and refuses on a `quality_profile` or `invalid_input` finding
(`policyProblem()` in `src/cli.ts`). Without a readable, valid profile at
`.aai/policy/factory.yaml`, `approve`, `start`, `run` and `verdict` all reject before doing
any work — exit 1, with the reason on stdout as JSON. Manifest and custom-ref findings do
not block: those are install hygiene, not policy.

The file is a top-level `quality_profile:` line followed by two-space-indented `key: value`
scalars. Required keys:

| Key | Type | Notes |
|---|---|---|
| `runtime` | non-empty identifier (`[A-Za-z0-9._-]+`) | validated, not yet consumed |
| `test_unit` | non-empty string | **consumed (P38)** — argv-split and run by the controller at BASELINE and again at QUALITY on a governed run |
| `test_selector` | non-empty string | validated, not yet consumed |
| `coverage` | non-empty string | **consumed** — argv-split and run by the controller on a governed run |
| `lint`, `types`, `sca`, `secrets`, `sast`, `build` | optional; command string, or an explicit YAML null (`null`/`Null`/`NULL`/`~`, or a blank/absent value, which are treated identically) to declare it deliberately absent | **consumed (P38)** — each declared, non-null capability is argv-split and run by the controller at QUALITY. §8 asks for a recorded rationale on an explicit null; write it as a trailing comment, which the parser strips. Nothing validates the rationale itself. |
| `coverage_floor` | number in `[0, 100]` | **consumed** — the floor `green.coverage-passed` is graded against |
| `brownfield_policy` | exactly `no_regression_and_ratchet` | the only accepted value (`BROWNFIELD_POLICIES` in `doctor.ts`) |

This repository's own profile is the worked example:

```yaml
quality_profile:
  runtime: node
  test_unit: "pnpm vitest run --testTimeout=60000 --reporter=junit"
  test_selector: "pnpm vitest run --testTimeout=60000 --reporter=junit {{selector}}"
  coverage: "pnpm vitest run --testTimeout=60000 --coverage.enabled --coverage.reporter=json-summary"
  # OI-15: quality grades every capability except `coverage` as a JUnit report, so the
  # typecheck is wrapped in a script that emits one.
  types: "node scripts/typecheck-junit.mjs"
  coverage_floor: 80
  brownfield_policy: no_regression_and_ratchet
```

Two things that bite:

- **The `coverage` command must actually write `coverage/coverage-summary.json`** — the
  istanbul JSON summary, at that fixed path. That usually means installing a coverage
  provider: this repository had to add `@vitest/coverage-v8` before the command above
  produced a summary. A profile that parses but whose coverage command emits nothing leaves
  a governed run **parked at green**, with `green coverage run produced no readable summary`
  as the reason. Test the command by hand first and confirm the file appears.
- **`scaffold`'s proposed defaults are vitest-shaped.** Since P38 it writes
  `test_unit: "pnpm vitest run --reporter=junit"` and
  `coverage: "pnpm vitest run --coverage.enabled --coverage.reporter=json-summary"` —
  commands that emit what the controller reads back. They are still only a proposal: if your
  project is not vitest, or your coverage provider is not installed, edit them before the
  first governed run and test each by hand.
- **A freshly scaffolded repository completes its first governed run** (OI-14, closed in
  P40). Baseline runs the profile's `coverage` command itself and grades the summary that
  run produced, deleting anything already at the path first — so neither a missing summary
  nor a stale or planted one decides the gate. Before P40 baseline only READ that path while
  green (two stages later) was the only thing that ran the command, so `scaffold`'s output
  parked at baseline with `baseline coverage value missing or malformed`. **The hand-run
  workaround this checklist used to prescribe is no longer needed.** Note the cost: a
  governed run now spawns the suite four times, not three.

The controller gives every one of those four spawns a **120 s budget by default**, which
**`FACTORY_STAGE_TIMEOUT_MS` overrides** (P41 — it was not configurable before). A suite that
needs longer is killed and writes no report or summary, so the stage parks.

**Where the timeout is and is not visible.** All four spawns write one line to **stderr** naming
the elapsed budget and this variable. The **parked run record does not** — its JSON still says
only "suite did not run or produced no readable report" (carried in
`.factory-bootstrap/open-issues.md`). So if you are reading run JSON rather than watching a
terminal, a timeout looks like any other empty result: when a command works by hand but parks a
governed run, suspect the budget first. Time your suite and set the variable before you rely on
it.

A blank `coverage_floor:` is rejected rather than read as zero — `Number("")` is `0`, which
would silently disable the gate.

## 1. Install the factory layout

Function: `scaffold({ repositoryPath, factoryDigest, mode })` in
`src/controller/sdlc/scaffold/index.ts`. `mode` is `"preview"` or `"apply"`;
`factoryDigest` must be 64 lowercase hex.

What lands (three files, nothing else in the current build):

| Path | Class | Content |
|---|---|---|
| `.aai/instructions.md` (`ROUTER_PATH`) | owned | minimal router pointing at policy and manifest |
| `.aai/policy/factory.yaml` (`POLICY_PATH`) | owned | proposed quality profile (`runtime`, `test_unit`, `test_selector`, `coverage`, `coverage_floor`, `brownfield_policy`) |
| `.ailib/manifest.yaml` (`MANIFEST_PATH`) | vendored | `source`, `version`, `digest` |

The spec's full layout (vendored `.ailib/factory/` runtime, `bin/factory`, the two
workflows projected into the target repo) is not yet produced by `scaffold`; the
workflows ship in this repository's `.github/workflows/` and must be copied by hand.

Guarantees you can rely on:

- **Preview writes nothing.** Always run `mode: "preview"` first and read `planned[]`
  (`create | keep | conflict`) and `conflicts[]`.
- **Owner bytes are never overwritten.** `.aai/` paths that already exist are `keep`,
  byte-for-byte, regardless of content. Scaffold does not append rows to an existing
  router (that is deferred to P13 per the source comment).
- **Factory-managed paths fail closed.** An existing `.ailib/manifest.yaml` with
  different bytes is a `conflict`; the result is `disposition: "incompatible"` and no
  write happens. Identical bytes count as a re-run (`keep`).
- **Symlinks and odd nodes are conflicts.** Every path segment is `lstat`ed from the
  repository root down. A symlink anywhere in the chain, a non-directory parent, or a
  non-regular leaf is reported as `conflict` in preview, before any write.
- **Partial apply rolls back.** Files are written with `flag: "wx"` (refuse to
  overwrite even on a race). If any write fails, files written by this run are
  unlinked and `disposition` is `"incompatible"`; `written[]` is the disk truth of what
  could not be removed.
- Invalid input (empty/NUL path, bad digest, missing directory) returns
  `incompatible` with empty arrays; the function never throws.

After apply, edit `.aai/policy/factory.yaml` to match the project's real test and coverage
commands (section 0 — the proposed `coverage` value is a placeholder), then run doctor.

## 2. Run doctor and read its findings

Function: `doctor({ repositoryPath })` in `src/controller/sdlc/doctor.ts`. Read-only;
returns `{ ok, findings[] }` with `kind`, optional `path`, and `reason`.

| `kind` | Meaning | Fix |
|---|---|---|
| `invalid_input` | `repositoryPath` empty, NUL-containing, or not a directory; or an unexpected error | pass a real absolute path |
| `manifest` | `.ailib/manifest.yaml` missing | run `scaffold` with `mode: "apply"` |
| `quality_profile` | policy file missing, or the `quality_profile:` section fails the strict parse | see rules below |
| `custom_ref` | a ref under `refs/factory/` does not match a factory-owned shape, or `git for-each-ref` failed | delete or rename the foreign ref |
| `adapter` | an adapter is configured via `FACTORY_ADAPTER*` and its `preflight()` reports the executable unavailable or the session not subscription-eligible | fix the path or log the operator in (section 5) |

Quality profile rules (stdlib line parser, no YAML library): the strict shape and key list
are in section 0. Duplicate keys and unparseable lines are reasons. Nested maps, anchors,
and multi-line strings are not supported here; keep the section flat.

Which keys actually drive behaviour — **this changed in P38, and the old answer was the
opposite.** `coverage` and `coverage_floor` are read by `green-suite.ts` and decide
`green.coverage-passed`. `test_unit` is read by `green-suite.ts` too and is the command the
controller runs at **baseline** (on the base tree) and again at **quality** (on the green
tree). The six optional capability keys are the commands quality runs alongside it. Before
P38 the baseline and quality commands came from the approved packet's verification bindings
and this file was inert for them; that inverted what each stage means and is what OI-13 and
OI-4 record. `runtime` and `test_selector` are validated and unread. `coverage_floor` **is
read** — green grades `green.coverage-passed` against it (above) — but the QUALITY stage ignores
it, along with `brownfield_policy`, because quality's own policy literal hardcodes a floor of 80
and `"strict"`. That split is OI-4's remaining half; its §10 evidence half was closed in P42.

So: **changing `test_unit` now changes what a governed run executes.** It must emit JUnit on
stdout — `runSuiteCommand` returns a report only when stdout contains `<testcase`, and a
command that runs clean but prints nothing parks the run at baseline.

A trailing `#` comment is stripped from every value — but only a `#` that starts the value or
follows whitespace, which is YAML's own rule. `--tag=v1#2` is part of the command, and
`sast: null# rationale` declares a required capability whose command is `null#`, not an absent
one. A `#` inside a quoted value is likewise ordinary. A quoted value must be closed, and only a
comment may follow the closing quote; anything else is a `quality_profile` finding rather than a
silent truncation. Comment-stripping is how §8 records the rationale an
explicit null requires. A `#` inside a quoted value is an ordinary character. Nested maps,
anchors, and multi-line strings are still unsupported (stated once in section 0; repeated here
only because this is where hand-authoring is described).

The `adapter` finding is the reason `doctor` is `async` and can spawn a process: with
`FACTORY_ADAPTER` set it runs that adapter's real preflight. With no adapter configured it
adds no finding at all — an unconfigured adapter is not a doctor failure, but it *is* a
`run` failure (section 6).

Owned ref shapes: `refs/factory/runs/<uuid>`, `refs/factory/specs/<id>`,
`refs/factory/candidates/<uuid>/<n>`, `refs/factory/approvals`, `refs/factory/active`.
Anything else under `refs/factory/` is reported.

## 3. Upgrade

Functions in `src/controller/sdlc/upgrade/index.ts`:
`upgrade({ repositoryPath, toDigest, mode, previewToken? })` and
`rollback({ repositoryPath, token })`.

Procedure:

1. `upgrade({ ..., mode: "preview" })` returns `disposition: "previewable"` with a
   `token` and a `report[]` of `{ path, class: owned|projected|vendored, action:
   keep|update|merge_conflict }`.
2. Commit or stash everything (apply enforces a clean tree).
3. `upgrade({ ..., mode: "apply", previewToken: token })` returns `applied`, the
   `written[]` paths, and `rollback.token`. Keep that token.

What it changes: today only `.ailib/manifest.yaml` (a digest rewrite). Owned `.aai/`
files are always `keep`. The three-way rule for the manifest: bytes equal to the target
are `keep`; bytes equal to what the recorded digest would have produced are `update`;
anything else is an owner edit and a `merge_conflict` refusal.

Refusal kinds (`refusals[].kind`) and what to do:

- `nonterminal_run`: a run under `refs/factory/runs/` is not at the terminal status
  (`candidate_ready`) or is unreadable. Finish, park-and-resolve, or prune it first.
  Parked runs pin their factory bytes; this refusal protects them.
- `not_installed`: no manifest; run `scaffold` instead.
- `path_conflict`: a managed path is a symlink or non-regular node.
- `merge_conflict`: owner-modified vendored file; resolve by hand, never forced.
- `missing_preview` / `stale_preview`: apply needs the token from a preview of the same
  target digest against the same tree bytes. Any change to a managed file invalidates it.
- `dirty_tree`: uncommitted changes present.
- `write_failed`: pre-apply bytes were restored automatically.

Rollback scope: the snapshot stored at `<git-dir>/factory-upgrade/<token>.json`
contains exactly the paths apply wrote. `rollback` verifies the token is the sha256 of
the stored bytes, that every entry is one of the three managed paths, that none is a
symlink, and that the tree is clean apart from those paths; then restores bytes (or
deletes a file that did not exist before) and removes the snapshot. Spec-level rollback
(vendored plus projected files via `git revert`) applies once those files are
projected. Caveat LIM-09: rollback will overwrite a manifest the owner edited after
apply, and a no-op re-apply can hit `EEXIST` on the snapshot file.

**Upgrading the bundle in the library.** Run the newer bundle's `install.sh --library`
(same `<dir>` as before). It lands at `<dir>/software-dev-factory/<release>/` and moves
`current` to it; older versioned directories stay. Existing factory folders keep their
vendored copy until you re-stamp them from `current/install.sh --factory`. A folder's
`.ailib/manifest.yaml` `source` always names its own local `.ailib/software-dev-factory`
path, never the library; `version` is what identifies which release was vendored.

**Upgrading a factory folder created from the ambient library.** Re-run the same
bootstrap one-liner (README, Installation) against the same folder. `.ailib/` is
re-vendored from the library's current `software-dev-factory` capability; `.aai/`,
`projects/` and the anchor sections in `CLAUDE.md`/`AGENTS.md` are left as they are.

## 4. Retention and pruning of runs

Eligibility is pure and clock-free: `gcEligibility({ runs, policy, now })` in
`src/controller/kernel/retention.ts`. `policy` is `{ keepTerminalDays, keepApprovalCritical }`;
`now` and each `completedAt` must be ISO-8601 with an explicit offset or `Z`. Keep
reasons: `nonterminal`, `approval_critical` (when `retentionClass ===
"approval-critical"` and `keepApprovalCritical !== false`), `invalid_timestamp`,
`within_retention`, `invalid_input` (bad `now` or policy keeps everything).

Execution: `gc({ repositoryPath, policy, now, mode })` in the upgrade module. Preview
lists `pruned[]`/`kept[]` without touching refs. Apply deletes
`refs/factory/runs/<id>` by compare-and-swap on the OID read at listing time (a race
shows as `kept` with reason `cas_mismatch`), and deletes `refs/factory/specs/<spec>`
only when its `index.json` points at the pruned run. Unreadable run state is kept.
Caveat LIM-09: `refs/factory/candidates/<run>/*` are not pruned with the run; remove
them manually or expect doctor to keep listing them as owned shapes.

## 4a. Run state does not travel with the repository (OI-32)

Run records and the spec index live in `refs/factory/*`, a custom git ref namespace. **Git moves
it for no default operation**, and nothing warns you:

- `git clone` and `git fetch` use `+refs/heads/*:refs/remotes/origin/*`, so a fresh clone has
  **zero** run state and no indication any exists.
- `git push origin main` pushes `refs/heads/main` alone.

On every clone that needs run state, add the fetch refspec once:

```
git config --add remote.origin.fetch 'refs/factory/*:refs/factory/*'
```

Local repository config is not part of the repository, so this cannot be shipped in-tree — it is
a per-clone setup step.

**Write it WITHOUT a leading `+`, and do not "fix" a rejection by adding one.** The `+` forces
non-fast-forward updates. Without it, a fetch can only advance a local ref, so a stale remote can
never overwrite run state this machine has moved on from. Verified: with a local run ref one
commit ahead, `git fetch` reports

```
! [rejected] refs/factory/runs/<id> -> refs/factory/runs/<id>  (non-fast-forward)
```

and leaves the local ref untouched. With `+`, that same fetch silently replaces newer local
evidence with the older remote copy.

To publish run state by hand, name the namespace explicitly:

```
git push origin 'refs/factory/*:refs/factory/*'
```

**`run --spec` and `verdict` now do this for you** (`publishFactoryRefs` in
`src/controller/sdlc/publish-refs.ts`). It is best-effort and opt-**out**: set
`FACTORY_PUBLISH_REFS=0` (or `false`) to disable it. It runs after the status record is
printed and after the exit code is set, so a failed push never changes a run's outcome — a
run does not fail because a network did. It is skipped silently when the repository has no
`origin`. The push is spawned with `GIT_TERMINAL_PROMPT=0` and `GIT_ASKPASS=true` so a
credential prompt cannot hang an unattended run, under a 15 s budget you can raise with
`FACTORY_PUBLISH_TIMEOUT_MS`. Rejected refs are reported, not retried.

Run refs are written by compare-and-swap with the previous commit as parent, so they chain and push
fast-forward. Spec refs are created with **no parent**, so `abandon` followed by a re-run yields
an unrelated root commit — that push is rejected, and `--force` there rewrites approval-critical
evidence. Understand why it diverged before reaching for it.

## 5. Adapters (Claude, Codex)

Both adapters implement the same `Adapter` interface (`preflight()` and `invoke()`),
and `tests/adapters/conformance.test.ts` proves they produce identical normalized
outcomes for one fixture set and fail closed without fallback (FR-K12).

Construction:

- `createClaudeAdapter({ executablePath, processTimeoutMs, runtimeEnvironment: { HOME, PATH, CLAUDE_CONFIG_DIR?, USER? } })`
- `createCodexAdapter({ executablePath, processTimeoutMs, runtimeEnvironment: { HOME, PATH, CODEX_HOME?, USER? } })`

`executablePath` must be absolute and `processTimeoutMs` a positive integer. `HOME` and
`PATH` are required; `CLAUDE_CONFIG_DIR`/`CODEX_HOME` and `USER` are **optional, and an
optional key that is not configured must be ABSENT — never an empty string.** An empty
`CLAUDE_CONFIG_DIR` fails validation and takes the whole run down at the policy gate with
a message that blames policy for an adapter bug (P36).

The environment the vendor CLI actually sees is built by an **explicit pick** of those four
names inside each adapter, not by spreading what it was handed. That is the enforcement
point: an extra key added anywhere upstream cannot reach the vendor. It stays the entire
environment the CLI sees (scrubbed, spec section 11): no `GITHUB_TOKEN`, no controller
credentials. Each team member runs their own subscription; the factory never proxies a
session (owner decision 2).

**`USER` is required in practice on macOS.** The Claude CLI reports `loggedIn: false`
without it even when the operator is logged in — measured, not assumed (P36 / OI-11).

### Configuring the adapter for the CLI

The spawned vendor CLI cannot be handed in-memory options, so the CLI builds the adapter
from environment variables. Since P36 there is ONE builder,
`buildConfiguredAdapter` in `src/controller/kernel/adapters/configured.ts`, imported by both
`src/cli.ts` and `src/controller/sdlc/doctor.ts`. It used to be copy-pasted into both, and
doctor's copy runs first (`policyProblem` calls `doctor` before `resolveStages`) — so a fix
applied to one caller was invisible:

| Variable | Meaning |
|---|---|
| `FACTORY_ADAPTER` | `claude` or `codex`. Absent or any other value means "no adapter configured". |
| `FACTORY_ADAPTER_EXECUTABLE` | Absolute path to the vendor CLI. |
| `FACTORY_ADAPTER_CONFIG_DIR` | **Optional, and often best left unset.** When set it becomes `CLAUDE_CONFIG_DIR` or `CODEX_HOME` in the scrubbed environment; when unset the key is omitted entirely. **Setting it for `claude` on a macOS box whose credentials live in the Keychain BREAKS auth** — it switches the CLI to a file-based credential store, and if `<dir>/.credentials.json` does not exist the CLI reports `loggedIn: false`. Measured: `HOME PATH USER` → logged in; add `CLAUDE_CONFIG_DIR=~/.claude` → logged out. Set it only when you genuinely keep vendor credentials in that directory. |
| `FACTORY_ADAPTER_MODEL` | Optional. Pins the model for every *prompt* invocation — `--model <value>` for both vendors. Unset leaves the vendor CLI's own default, which is the pre-pin behaviour. The value is recorded in the durable run record as `adapter_model` (`null` when unset), so a finished run names the model that produced it. Preflight calls (`--version`, auth status) are never pinned: they ask the CLI about itself, not a model. |
| `FACTORY_ADAPTER_REASONING_EFFORT` | Optional. Pins reasoning effort for every prompt invocation. The two vendors take it differently — `claude` as `--effort <value>`, `codex` as `-c model_reasoning_effort="<value>"` — and the controller handles that; you set one variable. Unset leaves the CLI default, **including whatever your `~/.codex/config.toml` already specifies**, which is exactly the unreproducible arrangement pinning is meant to end. Recorded as `adapter_reasoning_effort`. Preflight calls are never pinned. |
| `FACTORY_ADAPTER_TIMEOUT_MS` | Optional integer `processTimeoutMs`. **Defaults to 120000.** A value of `0` or less is **rejected**, not treated as unlimited: the run fails with `policy: … adapter options are invalid`, exit 1. |
| `FACTORY_STAGE_TIMEOUT_MS` | Optional positive integer, milliseconds, for the controller's own suite spawns — baseline `test_unit`, baseline `coverage`, green `coverage`, quality `test_unit`. **Defaults to 120000.** Anything that is not a positive integer (including `0`, blank, decimals, or a `12s`-style suffix) falls back to the default rather than producing a nonsense budget. Distinct from `FACTORY_ADAPTER_TIMEOUT_MS`, which bounds the *agent* invocation. |

`HOME` and `PATH` are taken from the controller process's own environment; nothing else
crosses.

**Raise the timeout.** 120 s is short for real agent work — a single Red or Green stage that
writes tests and runs a suite can exceed it, and the adapter reports the overrun as
`transient_failure`, which `runStage` turns into no tokens and the run into a park. Set
`FACTORY_ADAPTER_TIMEOUT_MS` deliberately for your slowest stage.

Resolution order for stage workers is: a configured adapter, then the
`FACTORY_WORKERS_MODULE` fallback seam (a dynamic-import specifier exporting `buildStages`,
used by the test fixtures), then refusal. With neither set, `run` and `verdict` refuse
fail-closed with exit **3** — distinct from the usage exit 2, and with no usage banner,
because a refusal is not a typo. Invalid adapter config and a broken workers module produce
distinct refusal messages that name the environment variable but never its value.

Login-status detection in `preflight()`:

- Claude: runs `<exe> --version`, then `<exe> auth status` and parses JSON;
  `loggedIn === true` with exit 0 is available, and only `authMethod === "claude.ai"`
  is `subscriptionEligible`.
- Codex: runs `<exe> --version` (expects `X.Y.Z` in the output), then
  `<exe> login status` as text; only a first line reading "Logged in using ChatGPT"
  is subscription-eligible; "Not logged in", nonzero exit, or a NUL byte in stdout is
  unavailable. Wording is assumed, not verified against a real binary (LIM-08).

`invoke()` runs the preflight once per adapter instance and caches the eligible
facts, so a multi-stage run pays the two preflight spawns once rather than per
invocation. The mid-run-logout behaviour is unchanged: any process-level
invocation failure invalidates the cache and re-preflights before classifying,
so a login revoked mid-run still surfaces as `auth_failure`.

Invocation: Claude runs `<exe> -p <prompt> --output-format json`; Codex runs
`<exe> exec --json -- <prompt>` and reads NDJSON, succeeding only if the stream ends in
`turn.completed`. Output is capped at 64 KiB, diagnostics at 512 characters.

Fail-closed envelope (`InvocationResult.outcome`): `fatal_failure` for an invalid
request, unavailable executable, unsupported surface (both declare `chat` and `cli`
only; `autonomousEligible: false`), malformed output, or a crashed process;
`auth_failure` when not logged in or not subscription-eligible; `transient_failure`
only on `ETIMEDOUT`; `success` otherwise. There is no silent failover between adapters;
switching is an explicit recorded decision. Claude preflight also contributes the
`sk-ant-` secret pattern to the controller's redaction table.

## 6. Running stages: what the loop needs from you

There are two ways stages get executed, and they are not held to the same standard.

**`run --spec` — the governed path.**

```
cd <target-repository>
node --experimental-strip-types <factory-checkout>/src/cli.ts approve <spec.md>
node --experimental-strip-types <factory-checkout>/src/cli.ts run --spec <spec.md>
```

`run --spec` calls `driveRun` with `governance: "controller"`. It walks the lifecycle one
stage at a time and stops at the first unmet gate. Exit **0** means it reached the review
human gate and parked there awaiting the owner (`disposition: "needs_owner"`) — that is
success, not failure; `verdict <envelope.json>` then resumes it. Exit **1** means a
fail-closed park anywhere earlier, and the JSON on stdout names the stage and the missing
tokens. Read that record rather than the run's status transitions, which overreport (LIM-17).

Expect the earlier park until the prerequisites below are right. A governed run parks at
green whenever the §8 `coverage` command does not produce a readable summary — the most
common early park, and the one that must be right before a real adapter run is worth
launching (LIM-18, closed 2026-08-28).

This is the only `driveRun` call site in the repository, so it is the only governed path.

**Direct `runStage` calls — ungoverned.** `runStage` is exported, so an operator can call
it once per role and thread the tokens by hand; `examples/writeroom` was built that way, and
`docs/user-guide.md` section 8 documented it as *the* product-build path until P39 retired
that designation. Retiring the designation did not remove the path. It still never enters
`driveRun`: nothing is stripped, and no controller stage module runs. `start()` also still
jumps intake straight to a simulated candidate without walking the lifecycle.

So: **"every `run --spec` is governed" is accurate; "every run is governed" is not** (OI-8).
The `verdict` resume is in the same position — it re-runs the post-review `candidate` stage
from the injected worker with no governance argument.

Three things must be configured before either path works: the §8 quality profile (section 0),
a JUnit-emitting test command, and an eligible adapter.

### A test command that emits JUnit on stdout

`runSuiteCommand({ repositoryPath, command, timeoutMs })` spawns `command` as argv and
reads the JUnit XML from **stdout**. It never throws, and it returns `null` on spawn
failure, timeout, or a nonzero exit with no output. That `null` is graded as
`"suite did not run"` — deliberately distinct from `"suite failed: N/M failing"`, because
a suite that never ran must never look like a pass. `evaluateSuite` treats zero testcases
as a failure for the same reason.

So the product repository needs a runner invocation that writes JUnit to stdout, for
example:

- Node: `["node", "--test", "--test-reporter=junit", "--test-reporter-destination=stdout"]`
- Vitest: `["pnpm", "vitest", "run", "--reporter=junit"]`

**P38 changed where this comes from.** On a governed run the controller's baseline and
quality stages now take that argv from `.aai/policy/factory.yaml`'s `test_unit` — the seam is
wired, and the previous instruction here (pin the argv per invocation; `test_unit` is
validated and unused) is obsolete. Put the JUnit-emitting command in `test_unit` and it is
what runs. You still pass an argv per invocation when you call `runSuiteCommand` or `runStage`
directly, and those callers are not governed; keep the two consistent by hand.

Match `assertionFailureTypes` to the runner too: `node --test` reports assertion failures
as `type="testCodeFailure"`, and `red.failed-by-assertion` rejects anything outside the
family you configure. A greenfield packet whose tests import a not-yet-existing module
fails as `ERR_MODULE_NOT_FOUND` and is correctly refused as Red; the test must guard the
import so absence surfaces as an assertion instead.

### One eligible adapter per operator

Adapter eligibility is no longer only a preflight nicety — it now gates stage execution.
`runStage` treats any non-`success` adapter outcome as producing **no tokens at all**:
the prior token set passes through and the walk does not advance. An `auth_failure` from
an unauthenticated or non-subscription CLI therefore looks like a stalled lifecycle, not
an error. Confirm `preflight().auth.subscriptionEligible === true` for every operator
before blaming the loop.

### What grading guarantees

Every gate token is minted from an artifact the controller read itself — `git diff`,
`git merge-base`, the JUnit report — never from an agent's claim. An agent that reports
success without changing anything advances nothing. Preserve that property in any
extension you write; a token minted from a self-report defeats the design.

On a governed run the controller goes further for four gates. `baseline`, `quality` and
`reconcile` are run by the controller's own stage modules; if a module cannot produce a
result — no base commit, an unrunnable command, no capability executed — the run parks at
that stage rather than falling back to the worker. `green.coverage-passed` is produced by
`green-suite.ts`, which **deletes any file at `coverage/coverage-summary.json` before
spawning your `coverage` command**, so the graded number is provably the one that run
produced and not one an agent planted. Worker-minted tokens for any of those four are
stripped: they appear neither in the recorded trail nor in the persisted token set.

What that still leaves worker-minted, even under governance: all four `red.*` tokens and the
other four `green.*` tokens (OI-9). Reaching them requires substituting a hostile stage-worker
module, which the spec section 11 threat model excludes — it is the honest boundary, not a
live hole.

## 7. GitHub workflows

Two files in `.github/workflows/`, both `workflow_dispatch` with inputs
`candidate_ref` (`refs/...`), `candidate_sha` (40 hex), `run_key` (64 hex). Inputs are
regex-validated before anything is checked out. Each checks out the trusted workflow
ref (`github.ref`) with `persist-credentials: false`, fetches the candidate ref
manually, asserts it resolves to `candidate_sha`, and checks out that SHA detached.

`factory-dispatch.yml` (agent job): `runs-on: self-hosted`, `timeout-minutes: 360`,
top-level and job-level `permissions: {}`. No `GITHUB_TOKEN` is issued at all, so no
secret needs configuring. Concurrency group `factory-dispatch-<run_key>` suppresses
duplicates. The "Run agent stages" step currently exits 1 ("hosted execution
deferred"); the controller job that imports the bundle and CAS-pushes is not shipped
(LIM-13). Set up a self-hosted runner the owner controls before enabling this.

`factory-checks.yml` (hosted): `runs-on: ubuntu-24.04`, `timeout-minutes: 30`,
`permissions: { checks: write, contents: read }`. Runs `pnpm install --frozen-lockfile`,
then `pnpm typecheck` and `pnpm test`. Both carry `continue-on-error: true` so the check
run is always published; the job's last step fails if either outcome was not `success`,
and the check run's conclusion is `success` only when both were. The typecheck step exists
because `tsconfig.json` covers `scripts/` but nothing in CI compiled it (OI-50). Then it
always publishes the check run `factory/checks` with
`head_sha: candidate_sha` and `external_id: run_key`. Make `factory/checks` the
required branch-protection check. Action `uses:` are SHA-pinned but unverified against
upstream (LIM-06). Private repositories: the manual `git fetch` of `refs/factory/*`
has no explicit auth and `cache: pnpm` exposes the Actions cache to candidate code
(LIM-07); fix both before the first hosted run on private code.

Why no tokens: `pull_request_target` is forbidden, fork content never runs with write
credentials, and the agent job is a credential-issuance boundary, not process
isolation, because both jobs share the self-hosted machine.

## 8. Security model in admin terms

Trusted inputs are the pinned factory digest, the policy snapshot, approved spec/plan
digests, and owner decisions. Repository content, tests, issues, PR text, and agent
prose are data. Enforcement lives in two predicates and, since P31–P34, in run governance.

### Run governance: what it covers

`run --spec` is governed. In that mode the controller owns the `baseline.*`, `quality.*` and
`reconcile.*` token families plus `green.coverage-passed`, produces each from a command it
ran itself, strips any worker mint of them, and parks fail-closed when it cannot produce a
result. An explicit governance value that is neither `"controller"` nor `"fixture"` is
rejected before the run record is created rather than downgraded to the permissive mode.

Two things it does **not** cover. Both are closed issues — closed as accepted scope
boundaries rather than as fixes, so they are still true of the running system:

- Direct `runStage` calls and the `verdict` resume's `candidate` stage run with no
  governance at all (OI-8). P39 retired the hand-composed loop as the documented
  product-build path, which narrows who is likely to take it but does not close it. Use the
  phrase "every `run --spec` is governed", not "every run is governed", in anything you
  tell your team.
- `red.*` and four of five `green.*` tokens are still worker-minted (OI-9).
- (OI-4's third clause, the quality policy literal that hardcoded a coverage floor of 80 and
  `brownfieldPolicy: "strict"` instead of reading §8's `coverage_floor` and `brownfield_policy`,
  was closed in `45af5d6` — the declared values are threaded through. Note the honest limit:
  green's coverage gate reads the same floor and runs first, so quality's copy of it is not
  independently observable through a governed run. Its *selection* was fixed in P38
  (quality runs the §8 declared capabilities plus `test_unit`, not the acceptance criteria — see
  section 2's key table), and its §10 **evidence** in P42: a parked run record now carries
  `quality_evidence` with one entry per capability.)
- (OI-14, the fourth item this list used to carry, was closed in P40: baseline runs the §8
  `coverage` command itself, so a freshly scaffolded repository completes its first governed
  run with no hand-run setup.)

Two gates are tautological in v1 and must be revisited before any mutable base or target ref
is wired: `green.ref-snapshot-valid` and reconcile's drift check both compare the run-start
base snapshot against itself (OI-2, OI-6). Sound by construction today because no such ref
exists; live the moment one does.

### Two-party review (`review_requirement`)

`review_requirement` is an optional top-level key in `.aai/policy/factory.yaml`. Absent or
`human` is the pre-C5 behaviour: the owner's verdict is the only one at the review park.
Set it to `both` and the review park additionally carries a controller-minted `review_agent`
verdict, appended to the run record's `verdicts` array. Any other value — including a typo —
is `invalid` and fails the gate closed for *every* verdict, owner included, so a misspelled
key never silently leaves the gate at `human`.

What changes for you as the operator:

- Under `both`, a parked review record gains a standing agent decision (`approve` or
  `reject`; an unparseable review or any blocking/major finding is a `reject`). It does not
  advance the run — the owner is still final.
- If the owner's decision disagrees with that standing decision, `factory verdict` refuses
  unless the owner passes `--contest "<reason>"`; `--contest` with nothing to contest is
  refused too. An honored override is recorded on the run record as `review_contest`
  (`reason`, `contested_event_id`, `decision`), so every disagreement leaves a durable trace.
- `factory diagnose` prints `verdicts` and `review_contest`, which is where you look when
  someone asks why a run was accepted over an agent rejection.

This is an additional check at an existing gate, not a widening of governance: the
boundaries above (OI-8, OI-9) are unchanged.

### The two predicates

**Where they run.** `evaluateUntrustedResult` is wired into the green stage of a governed,
role-bound run (2026-08-27; before that date it had no production caller). The controller
calls it through `evaluateGreenSecurity` in `drive.ts`, after the green commit exists and
before the green grade can accept. It checks three things: the base→green packet diff, the
agent's reply text, and the ref delta of the agent's turn (`refsBefore` at turn start,
`refsAfter` at turn end — the controller's own commit is not blamed). Quarantine parks the
run at green, fail-closed; the park reason names redacted finding kinds only.

Three operational facts:

- **Paths red integrated do not count as stray.** Red's controller already policed them as
  test-only, and real runs commit red tests outside `allowed_paths`.
- **Fixture-governed runs skip this gate.** A fixture worker commits its own tree, which
  moves refs; the gate polices real agent turns only.
- **There is no exemption knob.** A packet whose diff must legitimately contain a
  secret-shaped byte string (for example, a fixture testing secret detection) parks for the
  owner. The recovery is an owner decision — amend the spec or abandon — not an override
  flag. This is deliberate: fail-closed on a trust boundary until a real case forces a
  recorded exception mechanism.

- `observeEffectViolations` (`src/controller/kernel/invariants/observed-effects.ts`),
  pure: compares `refsBefore`/`refsAfter` snapshots (`git for-each-ref` text) and
  `changedPaths` against `allowedPaths` and `protectedPaths`. Violation kinds:
  `effect.write-outside-allowed-paths`, `effect.protected-path-touched`,
  `effect.unauthorized-ref-change`, `effect.invalid-input`. Prefix matching is
  segment-bounded (`tests` matches `tests/x`, not `tests-x`); any path containing a
  `.` or `..` segment is treated as traversal and rejected.
- `evaluateUntrustedResult` (`src/controller/sdlc/predicates/security.ts`): runs
  `git diff --no-renames --name-only -z base..result` so a protected file moved under a
  new name still shows as touched (rename-hidden moves); bounds each proposed command
  at `MAX_COMMAND_LENGTH = 4096` before any regex runs (ReDoS cap; oversized commands
  are their own finding); flags authority families `git push|merge|tag|commit|update-ref`,
  `gh pr merge`, `gh release`, `gh pr review --approve`; scans diff and outputs (never
  prose) for GitHub, AWS, Slack, private-key, and generic-assignment secret shapes.
  Findings persist only `kind`, shape, length, and a sha256 prefix, never the value.

NUL guards: every path, prompt, token, and provider stdout is rejected if empty or
containing `\0` before reaching `spawnSync` or the filesystem. Protected paths for a
job are supplied by the controller from policy; keep `.aai/policy/` and
`.ailib/manifest.yaml` in that set.

Residual risks you own (spec section 11, owner-accepted): no OS sandbox; filesystem
reads, network, child processes, and writes outside the repository are neither
observed nor prevented; the vendor CLI's own session is available to the adapter
process. Diffs over 1 MiB are quarantined unscanned as `effect.unreadable-diff`
(LIM-03).

## 9. Roles

Packages live at `.ailib/factory/roles/<name>/{role.json,ROLE.md}`; shipped names are
`plan-author`, `test-writer`, `implementer`, `review-guide` (`spec-draft` and
`diagnose` are not shipped, LIM-10). Each `role.json` declares eligibility triggers and
anti-triggers, typed `io.inputs/outputs`, `allowed.{tools,paths,sideEffects}`,
`authorityExclusions`, an ordered procedure, completion conditions, evidence, and
failure/handoff. Upstream provenance resolves against
`.agents/skills/factory-bootstrap/source-lock.yaml`.

Conformance gate (`src/controller/sdlc/roles/conformance.ts`):
`validateRolePackage({ packagePath })`, `validateRoleCorpus({ rolesRoot })`, and
`validateRoleResult(...)` return findings of kind `eligibility`, `authority`,
`provenance`, `identity`, `malformed_result`, `undeclared_effect`. The directory name
must equal `name`, the name must be in `SDLC_ROLES`, and `REQUIRED_AUTHORITY_EXCLUSIONS`
(`git_write`, `github_write`, `approval`, `policy_change`) must all be present. Run
`pnpm vitest run tests/roles-conformance.test.ts` after editing any role. Per-invocation
recording of role version/digest is not yet wired (LIM-15).

## 10. Operations checklist

1. Node >= 22.12, `pnpm install --frozen-lockfile`, then `pnpm test` green on the factory
   checkout. Expect 99 files / 710 tests, 2 skipped at v0.3.0-alpha (LIM-20 placeholders). `vitest.config.ts`
   sets a 60 s `testTimeout` for every caller; without it `tests/adapters/` is flaky under
   load (LIM-16).
2. `scaffold` preview, review conflicts, then apply.
3. Edit `.aai/policy/factory.yaml` (section 0) and verify by hand that its `coverage`
   command writes `coverage/coverage-summary.json`. Install a coverage provider if it does
   not. Skipping this parks every governed run at green.
4. `doctor` returns `ok: true`; resolve every finding before the first run.
5. Configure one adapter per operator with that operator's own login
   (`FACTORY_ADAPTER`, `FACTORY_ADAPTER_EXECUTABLE`, `FACTORY_ADAPTER_CONFIG_DIR`, and a
   `FACTORY_ADAPTER_TIMEOUT_MS` larger than the 120 s default); confirm
   `preflight().auth.subscriptionEligible === true`. Without it the loop stalls silently
   rather than erroring (section 6).
6. Put the product repository's JUnit-emitting test command in the policy file's `test_unit`
   and pin its assertion-failure type before the first run (section 6). Since P38 that key is
   what a governed baseline and quality actually execute, and since P40 baseline runs
   `coverage` itself — so no hand-run coverage step is needed (OI-14, closed).
7. Copy both workflows, create the self-hosted runner, require `factory/checks`.
8. Set a retention policy and schedule `gc` preview reviews; apply deliberately.
9. Before any upgrade: no nonterminal runs, clean tree, preview then apply, keep the
   rollback token until the upgrade commit lands.
10. Treat `pnpm gauntlet` (`docs/gauntlet/README.md`) as the release gate. It runs the
    default suite plus the two `tests/gauntlet/` fixtures and writes a report bound to the
    HEAD tree digest, so it reflects committed content only.
11. If `abandon`, `verdict` or `run` fail with "Authority ref does not point to a controller
    state commit", the ref was written by the old reconcile path with the wrong commit
    message. `sh scripts/repair-snapshot-refs.sh` rewrites such refs in place with the
    canonical message (same tree, same parents); read its header first.

## 11. Limitations that affect administrators

**Read this section before your first real run.** The two issues that used to stop every run —
adapter authentication (LIM-22 / OI-11) and the bricked `spec_id` (OI-10) — are both fixed. What
follows is what an administrator still has to work around, starting with the recovery procedure
that replaced the old manual one.

**LIM-22 / OI-11 — FIXED in P36.** Both vendor adapters now authenticate against their real CLIs
(verified against codex-cli 0.149.1 and claude 2.1.245). Two things that bit us are worth keeping
in mind when a future CLI version breaks it again: `codex login status` writes its result to
**stderr**, not stdout (probing by hand with `2>&1` hides that), and the claude CLI on macOS keeps
credentials in the Keychain, so a spawn environment that pins `CLAUDE_CONFIG_DIR` reports
`loggedIn: false` while the ambient environment reports true. If `factory doctor` reports
`auth_failure`, check those two before anything else. `FACTORY_WORKERS_MODULE` remains the
fixture-driven fallback worker source.

**OI-10 — recovering a run whose state blocks its spec. FIXED in P37; here is what to do now.**

A run that parks is **re-enterable**: run the same spec again and the factory picks up the same
`run_id` where it left off. You do not need to delete anything for the ordinary retry.

```bash
factory run --spec specs/your-spec.md
```

When you genuinely want the run's state gone — a run wedged beyond re-entry, or a spec you want to
start over from scratch — `abandon` is the supported escape hatch. It replaces the two hand-run
`git update-ref -d` commands this section used to prescribe:

```bash
factory abandon --spec specs/your-spec.md
```

When it succeeds it discards the run ref and the spec index together, prints one JSON record
naming what it discarded, and exits 0. Both refs go because leaving the index behind re-binds the
next run to the abandoned id. It does not always succeed — read the refusals below before you rely
on it.

Five things it will refuse to do, each on purpose:

| Refusal | Exit | Why |
|---|---|---|
| The spec is not approved, or its digest does not match its sidecar | `rejected`, exit 1 | Same authorization `start` and `run` apply. A file that merely *names* a real `spec_id` cannot delete that spec's state. |
| No run is recorded for the spec | `rejected`, exit 1 | Nothing to abandon. |
| A live lease holds the run | `refused`, exit 3 | Discarding state out from under a running controller is worse than the state you are clearing. |
| The run carries an accepted review verdict | `refused`, exit 3 | That is approval-critical evidence. Pass `--force` if you really mean to destroy it. |
| The run is parked `needs_owner` and nobody has decided yet (OI-22, closed) | `refused`, exit 3 | Nobody has decided is not the same as nothing here matters. Pass `--force` if you mean to discard it without deciding. |

```bash
factory abandon --spec specs/your-spec.md --force
```

`--force` overrides the two decision-pending refusals — an accepted review verdict, or an
undecided `needs_owner` park — and (OI-18, closed) covers one lease case: a lease whose recorded
holder process is **provably dead**. It never overrides the approval check or a lease whose
holder is alive or unprovable.

**Read the park before you decide what to do with it — `diagnose --spec`.**

```bash
factory diagnose --spec specs/your-spec.md
```

It resolves the spec's recorded run, reads `run.json` and the run's event log, and prints one
JSON diagnosis — which stage parked, why, and what the disposition means — at exit 0. It writes
nothing. It takes the same authorization as `abandon`: an unapproved spec, or one whose digest
does not match its sidecar, is refused (OI-36), so a decoy file carrying only a `spec_id:` line
cannot read another spec's run state. It also refuses when no run is recorded for the spec, or
when the recorded state is unreadable — a refusal rather than a fabricated diagnosis.

**A `needs_owner` park is not only a review gate.** `plan`, `baseline`, and `reconcile` can each
park `needs_owner` on their own conditional owner token (a scope exception, a baseline
regression, a plan-invalidating drift) — only review has a `factory verdict` path back into it.
For the others, `abandon --force` is the only documented way forward: decide by hand, then
discard and re-run.

**An interrupted run strands its lease — `abandon --force` clears it (OI-18, closed).**
`driveRun` holds `refs/factory/active` for the whole stage loop and releases it on every
*graceful* exit. A run killed mid-stage — Ctrl-C, a crashed host, a terminated background job —
never reaches that release, so the lease outlives its holder and the next run fails at intake
with `run <id> is already held by <holder>`.

Every lease now records its holder's pid. `abandon` probes it (signal 0) and the refusal tells
you which case you are in:

- *holder process (pid N) is dead; rerun with `--force` to clear it* — the lease is provably
  stale. `factory abandon --spec specs/your-spec.md --force` clears it, completes the abandon,
  and records the outcome in its output as `stale_lease_cleared` (run id, holder id, pid).
- *holder process (pid N) is still alive* — a live run holds it. `--force` refuses too; wait or
  kill the holder first. (Pid reuse after a reboot also reads as alive — the safe direction; a
  refusal here on a lease you know is stale means clear it by hand as below.)
- *records no holder pid* — a lease written before this field existed. Staleness cannot be
  proven, so `--force` refuses; recover by hand — **check both things first, because clearing
  this ref under a live run lets two controllers write the same refs**: `pgrep -fl "cli.ts run"`
  must show no live holder, and `git cat-file -p refs/factory/active` must show an `acquired_at`
  matching the run you interrupted. Only then `git update-ref -d refs/factory/active`.

**The lease check is not a complete mutual exclusion.** `factory verdict` advances a run's state
without taking the lease, so a verdict accepted at the same moment can change the run under
`abandon`. That is handled by failing closed rather than by waiting: every delete is bound to the
object id read a moment earlier, and if either ref moved, `abandon` refuses (exit 3) and tells you
exactly what it did and did not discard. It never reports a clean abandon over a ref it did not
delete. Read the message and run it again:

- *"nothing was discarded"* — the state is untouched. Run `abandon` again, or add `--force` if the
  message asks for it.
- *"discarded … but … was left in place"* — part of the state is already gone. Run `abandon` again;
  it clears the remainder, including a spec index whose run has gone and orphan run refs no index
  names.

**Read the message, not just the word `refused`.** Every refusal names exactly what was and was not
discarded. Most fire with nothing touched — including every approval-critical refusal that can be
made before a delete. But a ref that moves under `abandon` mid-sequence, or that becomes
approval-critical while it is running, produces a refusal *after* part of the state is gone. Those
messages say so explicitly, and re-running `abandon` finishes the job.

The record it prints names the spec, the run it discarded, and the refs it removed. `run_id` is
`null` when the spec index carried no resolvable run id — a dangling index, which `abandon` clears
the same way.

**It also sweeps orphans.** After clearing the pair the index names, `abandon` removes any other
`refs/factory/runs/*` whose record names this `spec_id` and which no index points at. Two ordinary
things leave one: a run interrupted (Ctrl-C, a crash) between the two refs being created, and a run
that was waiting on the lease when you abandoned the spec. Neither is visible through the spec
index, so before the sweep they were unreachable by `abandon` and never pruned by `gc` — a worse
state than the bug OI-10 describes. Swept refs get the same approval-critical refusal as the named
run — an orphan can be the only surviving copy of an accepted verdict.

`abandon` reports `rejected` — "no state is recorded for spec …" — only when the sweep found
nothing either.

**What `abandon` does not remove.** The read-only event mirror at `docs/runs/<run_id>/events.jsonl`
is left in place on purpose — it is append-only observability, not run state, and it is the record
of what the abandoned run actually did. Delete it yourself if you want it gone.

`run` never discards state implicitly — abandoning is always something you asked for. If you want
to see what state exists before deciding:

```bash
git for-each-ref refs/factory --format='%(refname)'
```

**LIM-21 — governance covers `run --spec` only.** See section 8; narrowed but not closed by
P39, which retired the hand-composed loop as the documented path. Note that since P38 a
governed run executes commands from `.aai/policy/factory.yaml` at baseline and quality, so
that file is now part of the trusted surface: whoever can edit it can choose what the
controller runs. It is owner-authored and `scaffold` never overwrites it, which is the
control that matters.

The table in `scripts/run-gauntlet.ts` carries 18 limitations. These are the ones an
administrator feels. (LIM-02 is gone — the CLI is wired. LIM-11 is gone, superseded by
LIM-19.)

| Id | Admin impact |
|---|---|
| LIM-01 | Node range in `package.json` is broader than what actually runs; use 22.18+. |
| LIM-03 | Diffs over 1 MiB skip the secret scan and quarantine. |
| LIM-06 | Action SHA pins unverified; check them before the first hosted run. |
| LIM-07 | Private-repo fetch auth and `cache: pnpm` exposure in `factory-checks.yml`. |
| LIM-08 | Codex login-status wording and event names assumed; verify against a real binary. |
| LIM-09 | Rollback overwrites a post-apply manifest edit; no-op re-apply `EEXIST`; candidate refs orphaned by gc. |
| LIM-10 | `spec-draft` and `diagnose` roles absent. |
| LIM-13 | No configured GitHub test repository; hosted dispatch exits 1 by design. |
| LIM-14 | Resume is proven across processes, not across checkouts; owner-only unlock is unproven (`releaseLease` is OID-bound only). |
| LIM-15 | Role version/digest not recorded per invocation. |
| LIM-16 | Adapter fixtures are timing-sensitive under CPU load; `vitest.config.ts` carries the 60 s `testTimeout` that keeps them green (OI-24). |
| LIM-17 | A run's reported status transitions come from the static lifecycle table, not the event log, so a `start()`-only run overreports completed stages. Do not read the status record as execution evidence. |
| LIM-18 | **Closed 2026-08-28.** `run --spec` + `verdict` drove one approved spec through all nine stages to `complete` with a real vendor CLI. `start --spec` still reaches a candidate without walking the lifecycle; it is not a governed route. |
| LIM-19 | The proven reference workflow is `start()`-scoped (scaffold → doctor → start → doctor), not a full nine-stage walk. |

Acceptance state: Kernel v1 is accepted by the owner as of 2026-08-25 with these limitations
and the issue backlog recorded under `issues/`. That backlog is **empty as of 2026-08-28**:
55 closed, 0 open, 2 dormant (OI-2 and OI-6). The bootstrap route is deliberately **not**
retired, but its stated exit condition — the factory driving one of its own packets end to end
through `run --spec` with no human composing `runStage` calls — **has been met, repeatedly**;
most of that backlog was closed by packets the factory drove itself. Retiring the route is now
an owner decision. A gauntlet `pass` is a release gate, not that decision.
