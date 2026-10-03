# Factory user guide

For developers and product owners who use the factory to build software in their own
repository. The normative source is `specs/factory-spec-final.md`; this guide describes
what is implemented today and is honest about what is not. Status: the controller is a
TypeScript library under `src/controller/` with a six-command CLI in `src/cli.ts` —
`approve`, `start --spec`, `run --spec`, `verdict`, `abandon --spec [--force]`, and
`diagnose --spec`. `run --spec` walks the Red/Green/Review
lifecycle to the review pause and is the governed path (section 6). Everything the CLI does
not expose — scaffold, doctor, status, resume — is still a function you call from Node
22.18+ (native `.ts` execution) or from a test harness.

## 1. Quick start

This section is for the person who wants to *build something* and does not want to read
the other eleven. It assumes the factory is installed (see the README) and that you have
a coding agent — Claude Code, Codex — open in this repository with its own login working.

**One thing must exist before anything works:** a `.aai/policy/factory.yaml` quality
profile in the repository you are building in. Every CLI command checks it first and
refuses outright without it. Section 6 has the required shape; this repository's own file
is the worked example.

**You do not drive the factory by hand.** There is no `factory build` command, the CLI
commands in section 6 are the plumbing rather than the interface, and the functions the
rest of this guide documents are not meant for you to call. You drive it by talking to the
agent, which reads `AGENTS.md`, follows the process, and reports back at the points where
a decision is yours. Your whole job is four decisions.

**If you keep several projects, use a factory folder.** `install.sh --factory <dir>`
stamps one folder as the factory; `./factory init <name>` creates `projects/<name>` as its
own git repository with the factory installed; `./factory --project <name> <command...>`
runs any CLI command inside that project. Each project still needs its own
`.aai/policy/factory.yaml`. Install the bundle once with `install.sh --library`, then stamp
each factory folder with `~/.ailib/software-dev-factory/current/install.sh --factory <dir>`.
The shortest path is the ambient-library one-liner in the README, which creates the
folder, vendors the controller and wires `CLAUDE.md`/`AGENTS.md` in one step.
The README in the bundle has the full command reference.

### Step 1 — say what you want, in one or two sentences

Plain language. No format. For example, roughly what produced the worked example in
`examples/writeroom/`:

> "A simple app to brainstorm an article idea that then goes through a real-life
> simulation of a world-class writing team, to produce the publish-ready product."

That is enough to start. Do not try to write a specification — that is the next step's
job, and doing it yourself usually produces a worse one.

### Step 2 — answer the grilling *(decision 1)*

The agent interviews you one question at a time, each with its recommendation, and waits.
Expect questions like: who is this for, what must they be able to *do* start to finish,
what is explicitly out of scope, where does the behaviour get observed, which files may
be changed.

This is the part that most determines whether you get something you can use, so spend
your attention here rather than later. One rule is worth knowing because it protects you:
**at least one acceptance criterion must exercise the thing you actually touch** — the
page, the CLI, the button — not just the logic underneath. A spec that only tests
internals will pass every gate and still leave you with nothing you can open. If the
agent proposes scoping out "the UI" or "a way to run it", push back.

At the end you get a spec file and a plain-language statement of the journey it will
build. Correct it now; correcting it later is expensive.

### Step 3 — approve the spec *(decision 2)*

You approve exact bytes. The agent gives you a spec file and its digest; approving binds
to that digest, so if a single character changes afterwards the approval no longer
matches and you will be asked again. That is deliberate — it means nothing can quietly
edit the agreement after you signed it.

Nothing runs before this. Say no and the run does not start.

### Step 4 — wait

Now the machine works, and the shape of it is:

1. **Red** — a worker writes tests that fail, and *only* tests. Nothing is implemented.
2. **Green** — a different worker, with no memory of the first, writes the smallest code
   that makes those tests pass, touching only the files your spec allowed.
3. **Review** — a third worker, who wrote none of it, tries to find what is wrong.

Each hand-off is checked by code reading real artifacts — the actual diff, the actual
test output. A worker claiming "done, tests pass" proves nothing and advances nothing.
This is why the roles are kept separate and why none of them can approve their own work.

You will see progress reported; there is nothing for you to do until the review lands.

### Step 5 — decide on the findings *(decision 3)*

Review comes back with a list, each item marked `blocking`, `major`, or `minor`. Anything
`blocking` stops the run automatically — you cannot accept it even if you want to. For
the rest you choose: fix now, or record and move on.

Take this seriously; it is where the factory earns its keep. In the writeroom run the
reviewer found that the app was binding to every network interface while telling the user
it was local-only — an unauthenticated, key-spending server exposed to the whole network.
No test would ever have caught it. The gate refused the factory's own output, and it took
two rounds of fixes and independent re-verification before it cleared. The full record is
in `examples/writeroom/evidence/lifecycle.md`.

If you send it back, the fix goes through Green and Review again with fresh reviewers.

### Step 6 — merge *(decision 4)*

The factory produces a reviewed candidate. It never merges, pushes to your branches,
releases, or deploys — not as a setting you can turn on, but as a property of the design.
Shipping is your explicit act.

### What you actually get

A working thing plus the record of how it got there: the spec, the commits at each stage,
what each gate checked, what review found, and what you decided. `examples/writeroom/`
ships in this repository with exactly that layout — read its `evidence/lifecycle.md` to
see what a finished run looks like before you start your own.

### When it stops and asks

The run parks and escalates rather than guessing: three failed Red attempts, five failed
gate attempts, a budget ceiling, or anything that would change the scope you approved. An
agent is never permitted to edit your spec to get past a gate. If you are asked an
unexpected question, that is the system working.

### If something looks wrong

Three failure modes account for most confusion. If every command comes back
`.aai/policy/factory.yaml: missing policy file`, add the quality profile (section 6). If
nothing seems to progress, check the agent's own CLI is logged in — an authentication
failure looks like a stalled lifecycle rather than an error. If a run stops at `green`
even though the tests passed, the usual cause is coverage: under `run --spec` the
controller runs your profile's own `coverage` command on the green commit and refuses if
lines or branches fall under `coverage_floor`. Section 11 has the rest.

The remainder of this guide is the technical detail behind all of the above, in the same
order.

## 2. Concepts

- **Spec** — a Markdown file with YAML-style front matter describing one work unit. Its
  identity is the **spec digest**: the git blob OID of the canonical payload, which
  excludes all approval metadata. Change a byte, get a new digest, and any old approval
  stops matching.
- **Run** — one execution of one approved spec digest. `run_id` is an opaque UUID, never
  reused. Re-triggering the same approved digest is idempotent: same run, same candidate.
  All run state lives in your repository's Git refs under `refs/factory/*`, never on the
  product branch or in the PR diff.
- **Packet** — the unit of work inside a run: an allowed-paths set, the criterion ids it
  covers, and the test command bound to each criterion. A single-module spec derives one
  packet with zero model calls (`planMode: "derive"`).
- **Red → Green → Review** — the TDD contract. Red: a test-only commit that fails by
  assertion. Green: the minimum change, committed on top of Red, inside allowed paths,
  making the suite pass. Review: a human reads the integrated diff and signs a verdict.
- **Predicates** — machine checks the controller computes (exit codes, diffs, digests,
  ref comparisons). Every gate is a conjunction of predicates (P), agent attestations (A),
  and human approvals (H). Code decides every gate; a human never "just says go".
- **Evidence manifest** — `artifacts/manifest.json` in the run ref: name, digest,
  sensitivity, retention, and location of every stage's evidence. Missing
  approval-critical evidence at candidate time withdraws readiness.
- **Approvals / HITL** — a signed-looking JSON *approval envelope* per decision subject
  (spec, plan exception, waiver, review verdict, override). Labels, comments, and
  workflow dispatches are never approvals.
- **Fail-closed** — any malformed input, unverifiable state, or unknown condition
  produces a `rejected` or `parked` result. Nothing guesses, repairs, or retries silently.

## 3. Lifecycle stages and what you must approve

Stages are defined in `SDLC_LIFECYCLE` (`src/controller/sdlc/lifecycle.ts`):

| Stage | Effect | Your decision (H) |
|---|---|---|
| intake | validate approved handoff, acquire lease | `owner.spec-approved` (the spec envelope) |
| plan | derive packet map or agent DAG | scope/waiver exception, only if required |
| baseline | run `test_unit` + coverage on base SHA | baseline exception, only if a regression |
| red | test-writer produces failing tests | none (A: test-writer attestation) |
| green | implementer makes tests pass | none |
| quality | full quality profile | none |
| reconcile | target-branch freshness and drift class | plan-invalidating drift, only if detected |
| review | human review of the integrated diff | `reviewer.review-verdict-approved` |
| candidate | controller marks the PR ready | none |

Terminal states: `draft_green` (parked awaiting your review), `reviewed_candidate` (the
only "production-ready candidate"), `merge_eligible` (a post-candidate predicate).
Halt-and-escalate: three consecutive Red failures, five failed gate attempts, an
invariant violation, or budget exhaustion parks the run with evidence and freezes the
spec. An agent never edits the spec to pass a gate.

## 4. Writing a spec

Do not hand-write one cold. Ask your agent to interview you field by field, one question
at a time, against the contract below, and write the result to a `.md` file — that is
what `.aai/instructions.md` in an installed factory folder already directs it to do. (If
you are developing the factory itself in this repository, the `factory-spec` skill under
`.agents/skills/factory-spec/` automates the same interview with sub-agent fan-out; it is
not part of the installed bundle.)

The gate that matters most is **intent fidelity**: a spec must build a *usable instance*
of what you asked for. At least one acceptance criterion must exercise the
`primary_journey` through the outermost surface the primary user actually touches — a
person reaches a UI or CLI, a calling module reaches a public API. If that surface does
not exist yet, it goes `in_scope`; scoping it out is how you get a spec that goes fully
green and still cannot be used. The skill states this back to you for confirmation
before drafting. `primary_user`, `primary_journey`, and `definition_of_done` live in the
spec body as prose (the parser rejects unknown front-matter keys), but the digest still
covers them.

`deriveApprovedSpecPlan` (`src/controller/sdlc/spec.ts`) parses a deliberately strict
front-matter subset: no YAML library, exact two-space indentation, no quoting, no
comments. All of these fields are required, in any order, none repeated:

```
---
spec_id: billing-rounding          # ^[a-z0-9][a-z0-9._-]{0,63}$
version: 1                         # digits only
problem: Totals drift by a cent on split invoices
outcome: Invoice totals round half-up to the cent
in_scope:
  - rounding helper
out_of_scope: []
constraints: []
production_readiness_requirements: []
risks: []
allowed_paths:
  - src/billing/round.ts           # at least one, repository-relative, no ../
interfaces_touched: []             # required; must be [] to derive without a planner
acceptance_criteria:
  - id: AC-1
    outcome: 1.005 rounds to 1.01
    verification:
      kind: test                   # only "test" is accepted today
      command: pnpm vitest run tests/billing/round.test.ts
---
Body text is free Markdown and is part of the digest.
```

The plan is derived (no model call) only when all `allowed_paths` sit in one first-level
group under a configured module root, `interfaces_touched` is empty, and the criterion
count is within `singlePacketCriteriaCeiling`. Otherwise you get
`Approved spec requires an agent-authored plan` — and nothing accepts one. There is no
non-`derive` plan mode in `drive.ts` and no seam that validates an agent-authored
multi-packet DAG (LIM-20), so such specs cannot run today, through `run --spec` or
otherwise. Keep the spec inside one module group.

## 5. Approving a spec

The envelope lives at `.aai/specs/<spec_id>.approval.json`. The CLI writes it for you —
`approve <spec.md>` (section 6) computes the digest of the exact spec bytes and stamps the
sidecar; commit it on the default branch. `validateApproval`
(`src/controller/kernel/approval.ts`) requires exactly these keys:

```json
{
  "subject_digest": "<40-hex git blob OID of the spec payload>",
  "subject_kind": "spec",
  "decision": "approve",
  "principal": "local_operator",
  "auth_source": "machine_possession",
  "timestamp": "2026-08-21T10:00:00Z",
  "event_id": "<unique, single-use per repository>",
  "canonicalization_version": 1,
  "policy_version": "<must equal policy.policyVersion>"
}
```

`principal` must equal `policy.localOperatorPrincipal`. v1 accepts possession of the
machine as owner authentication; signing is a v2 seam. Note: the `refs/factory/approvals`
replay index from spec §5 is not enforced by `validateApproval` today — do not rely on
`event_id` reuse being rejected (see LIM-14).

## 6. Starting a run

### Prerequisite: the quality profile

`.aai/policy/factory.yaml` must exist and parse, or every CLI command rejects before
anything runs — `{"disposition":"rejected","reason":".aai/policy/factory.yaml: missing
policy file"}`, exit 1. `scaffold` writes it; if you are adding it by hand, all six keys
under a top-level `quality_profile:` line are required — `runtime`, `test_unit`,
`test_selector`, `coverage`, `brownfield_policy` as strings and `coverage_floor` as a
number from 0 to 100. Six more are optional: `lint`, `types`, `sca`, `secrets`, `sast`,
`build`. **Since P38, `test_unit` and every declared optional capability are commands the
controller executes**, so `test_unit` must emit JUnit on stdout or a governed run parks at
baseline. Declare an optional capability deliberately absent with an explicit YAML null
(`null`, `Null`, `NULL`, `~`, or leave the value blank); §8 asks for a rationale, and a
trailing `#` comment is the place to write it:

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

# Top-level, not under `quality_profile:` — see "Agent review and `review_requirement`" below.
review_requirement: both
```

That is this repository's own profile, copied from `.aai/policy/factory.yaml`. **Do not drop
`--reporter=junit`**: without it the command runs clean and prints no `<testcase>` elements,
`runSuiteCommand` returns nothing, and the run parks at baseline with `governed run: no
controller result for stage baseline`. `doctor` cannot catch that — the value is a non-empty
string either way.

Neither `test_unit` nor `coverage` is decoration: under `run --spec` the controller runs
**four** commands of its own — `test_unit` on the base commit and again at quality, and
`coverage` twice, once at baseline (since P40) and once on the green commit, grading the
resulting `coverage/coverage-summary.json` against `coverage_floor` at green. Each runs under a
120-second budget by default; **set `FACTORY_STAGE_TIMEOUT_MS` (milliseconds) to change it**
(P41). A suite that exceeds the budget is killed and parks the run. Each spawn prints one line to
**stderr** naming the budget and this variable — but the parked run record does not, so if you
are reading the run JSON rather than watching the terminal, a timeout looks like any other empty
result. When a command succeeds by hand but parks a governed run, raise this first.

**No pre-run setup is needed.** Since P40 baseline runs the profile's `coverage` command
itself and grades the summary that run produced, so a repository that has never run coverage
— the state of every repo `scaffold` creates — completes its first governed run (OI-14, closed).
Baseline deletes any summary already at the path before running, so a stale or planted file is
never what gets graded.

### Agent review and `review_requirement`

`review_requirement` is an optional **top-level** key in `.aai/policy/factory.yaml` — a
sibling of `quality_profile:`, not a key inside it. It selects who has to sign off at the
review gate:

| Value | Effect |
|---|---|
| unset | Same as `human`. Byte-identical to the behaviour before the key existed. |
| `human` | The owner's verdict alone resumes the run. The default. |
| `both` | The controller mints its own `review_agent` verdict at the review park, and the owner still signs. |
| `independent_agent` | **Reserved, not implemented.** Reads as `invalid`. |

Any value other than `human` or `both` — including `independent_agent`, and including a
typo — resolves to `invalid`, which fails **every** verdict closed rather than quietly
falling back to `human`. That is deliberate: a misspelled requirement must never leave you
believing the gate is stricter than it is. An absent or unreadable policy file reads as
`human`.

**What `both` adds at the review park.** Alongside the parked `review` field, the
controller appends one entry to the run record's `verdicts` array with
`principal: "review_agent"`. Each entry carries:

- `principal` — `review_agent` for the minted verdict, your operator principal for yours.
- `decision` — `approve` when the parsed review has no `blocking` or `major` finding;
  `reject` when it has one, **or when the reviewer's reply was unparseable at all**
  (`findings: null`). An unreadable review is not an approval.
- `event_id` — `verdict-<uuid>`, unique per entry and rejected if replayed.
- `timestamp` — ISO 8601, when the entry was minted.

The agent verdict is **recorded, not decisive**. Under `both` the owner remains final — it
does not resume the run, and it does not block you. What it does is put a standing decision
on the record that your own verdict is then measured against, which is what `--contest`
below is for.

```sh
git show <run-ref>:run.json | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin)["verdicts"], indent=2))'
```

### The CLI

`package.json` declares no `bin`, so there is no `factory` on your `PATH`. Run
`src/cli.ts` as a script, with the repository you are building in as the working
directory — the CLI operates on `process.cwd()`:

```sh
export FACTORY=/path/to/software-dev-factory
cd /path/to/your/repo
node "$FACTORY/src/cli.ts" --help
```

On Node 22.6–22.17 add `--experimental-strip-types`; from 22.18 type stripping is the
default. Each of the four commands writes one JSON record to stdout.

| Command | What it does |
|---|---|
| `approve <spec.md>` | Stamps the digest-bound approval envelope to `.aai/specs/<spec_id>.approval.json`. |
| `start --spec <spec.md>` | Intake spine only: validates, takes the lease, produces a simulated candidate. **Does not walk the lifecycle.** |
| `run --spec <spec.md>` | Drives the approved spec through the lifecycle to the review pause. Controller-governed. |
| `verdict <envelope.json>` | Accepts an owner review verdict and resumes the parked run. |

Exit codes: `0` success or an honest park, `1` a seam rejection, `2` a usage error (the
usage banner goes to stderr), `3` a fail-closed refusal because no stage workers are
configured — deliberately distinct from `2`, because a refusal is not a typo.

### A run, end to end

```sh
cd /path/to/your/repo
node "$FACTORY/src/cli.ts" approve spec.md
# {"disposition":"approved","specId":"invoice-rounding",
#  "sidecarPath":".aai/specs/invoice-rounding.approval.json","envelope":{...}}

node "$FACTORY/src/cli.ts" run --spec spec.md
# {"trail":[...],"status":{"disposition":"needs_owner","stage":"review",
#  "decision":"approve_review",...}}
```

`run` parks at the review gate and exits `0` — waiting for you is not a failure. It never
reaches the `candidate` stage on its own.

**Where the workers come from.** `run` and `verdict` need a stage worker for every
lifecycle stage. `resolveStages()` fails closed at every step, in this order:

1. `FACTORY_ADAPTER=claude|codex` builds the real role packages through `buildRoleStages`,
   using `FACTORY_ADAPTER_EXECUTABLE` (absolute path to the vendor CLI),
   `FACTORY_ADAPTER_CONFIG_DIR` (becomes `CLAUDE_CONFIG_DIR` or `CODEX_HOME`) and
   `FACTORY_ADAPTER_TIMEOUT_MS` (default `120000`). `FACTORY_ADAPTER_MODEL` and
   `FACTORY_ADAPTER_REASONING_EFFORT` pin the model and effort for every prompt
   invocation and are named in the run record; unset, each leaves the vendor CLI's own
   default and the record reports it as `null`. A misconfigured adapter is caught
   earlier, by the policy check, as `{"disposition":"rejected","reason":"policy: Claude
   adapter options are invalid"}` with exit `1`.
2. Otherwise `FACTORY_WORKERS_MODULE`, a dynamic-import specifier (a `file://` URL in the
   fixtures) for a module exporting `buildStages()`. A module that cannot be loaded, or
   whose `buildStages` returns anything but a record, refuses rather than falling through.
3. Otherwise a bounded refusal naming the missing source:
   `{"disposition":"refused","reason":"run requires stage workers: no worker source
   configured (set FACTORY_ADAPTER, or FACTORY_WORKERS_MODULE)"}`, exit `3`.

Be honest about what has been demonstrated: `run --spec` has been driven to the review
pause with injected workers, with a fake-binary adapter, and — as of 2026-08-28 — with a
real vendor CLI (`FACTORY_ADAPTER=claude`, `claude-opus-5`) all the way to
`status: "complete"` at candidate. That run built `src/controller/sdlc/diagnose.ts` from
`specs/run-diagnosis.spec.md` and closed LIM-18. One demonstrated run is not a proven
route: it took six attempts, two of which its own reviewer rejected on substance.

**What `governance: "controller"` means.** `run --spec` is the only `driveRun` call site
and it passes `governance: "controller"`. Under that mode a worker's `baseline.*`,
`quality.*` and `reconcile.*` tokens are stripped — they never reach the trail or the
persisted satisfied set — and the controller produces those results itself. Green coverage
is controller-owned unconditionally, so it can never fall back to a token a worker minted
or a `coverage-summary.json` an agent wrote.

This covers **every `run --spec`**, not every run. Direct `runStage` calls — retired as a
documented path in P39, still exported — and the post-verdict `candidate` re-run inside
`verdict` are ungoverned (OI-8), and governance strips three stages plus
`green.coverage-passed`, not `red.*` broadly (OI-9).

### Recording the verdict

`verdict` finds the parked run itself by scanning `refs/factory/runs/*` for a
`needs_owner` park at `review`; more than one and it refuses rather than guessing. The
operand is the path to the review-verdict envelope, and it must be exactly where the
controller derives it: `.aai/runs/<run_name>/review-verdict.approval.json`, relative to
the working directory (`<run_name>` is the `run_id` up to any `:` suffix). It is a
`validateApproval` envelope of the section 5 shape with `subject_kind: "review_verdict"`
and `subject_digest` set to the sha1 of the integrated diff. The diff is recomputed from
the run's **recorded green commit** (`git diff <green_sha>^ <green_sha>`), not from live
HEAD — so commits made while the run waits for its verdict do not strip signability
(OI-20, closed). A recorded green commit that no longer resolves refuses with a reason
that says so. The envelope carries no `run_id`; the CLI supplies run identity from the
parked run it discovered.

```sh
node "$FACTORY/src/cli.ts" verdict .aai/runs/<run_name>/review-verdict.approval.json
```

Exit `0` when the run completes, `1` otherwise.

**Read the review before you sign (OI-19, closed).** The park record now retains the
review: `run.json` carries a `review` field with the reviewer's parsed findings (all
severities — `findings: []` means *reviewed, nothing found*; `findings: null` means the
reply had no parseable record) and `agent_reply`, a bounded copy of the raw reviewer
reply for diagnosis. A blocking refusal's reason also names each finding's `reason`, not
just its path. Read it before signing:

```sh
git show <run-ref>:run.json | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin)["review"], indent=2))'
```

The diff itself is still worth your own eyes — the run record names both commits:

```sh
git diff $(git show <run-ref>:run.json | grep -o '"red_sha": "[^"]*"' | cut -d'"' -f4)^ \
         $(git show <run-ref>:run.json | grep -o '"green_sha": "[^"]*"' | cut -d'"' -f4)
```

`decision: "reject"` is a first-class outcome, not an error path — it parks the run failed at
review rather than resuming it.

**Overriding the agent verdict: `--contest "<reason>"`.** Only relevant under
`review_requirement: both`, and only for your own (operator-principal) verdict. The
*standing* decision is the last `review_agent` entry in the record's `verdicts` array.

- **Required when you disagree.** If a standing agent decision exists and your decision
  differs from it, the verdict is refused until you supply a non-empty reason:
  `owner verdict "approve" disagrees with the standing review_agent decision "reject";
  pass --contest "<reason>" to record the override`.
- **Refused when there is nothing to contest.** Passing `--contest` with no standing agent
  decision, or one that already agrees with you, is refused with `--contest given but there
  is nothing to contest`. A refusal leaves the run record byte-identical — nothing is
  written on either path.
- **What it records.** An honoured contest writes `review_contest` onto the run record:
  `{reason, contested_event_id, decision}` — your reason verbatim, the `event_id` of the
  agent entry you overrode, and your own decision. It is a permanent note that a human
  overruled the agent, and why.

```sh
node "$FACTORY/src/cli.ts" verdict .aai/runs/<run_name>/review-verdict.approval.json \
  --contest "the reviewer flagged a path the packet never touches"
```

`--contest` with no following reason (or with another `--flag` next) is a usage rejection:
`verdict: --contest requires a reason`.

**Reading it back.** `diagnose --spec <spec.md>` adds two fields to its JSON output: `verdicts`
(each entry reduced to `principal`, `decision`, `event_id`, `timestamp`) and `review_contest`,
which is `null` when no contest was recorded. Use it to read the
minted decision *before* you sign, so you know whether `--contest` will be required.

### The Control Room (monitor)

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

### Programmatic entry: `start()`

`start(request)` in `src/controller/sdlc/start.ts` is what `start --spec` calls. It is the
intake spine, not the lifecycle — reach for it only when you are embedding the factory,
not when you want to build something.

```ts
import { start } from "./src/controller/sdlc/start.ts";

const result = await start({
  repositoryPath: "/path/to/your/repo",
  holderId: "my-controller-uuid",      // stable per controller instance
  surface: "cli",
  canonicalSpecPayload: specText,      // exact bytes of the spec file
  approvalSidecar: { path: ".aai/specs/billing-rounding.approval.json", envelope },
  policy: {
    approver: "you@example.com",
    localOperatorPrincipal: "local_operator",
    policyVersion: "1",
    moduleRoots: ["src"],
    singlePacketCriteriaCeiling: 5,
  },
  candidateEndpoint: { kind: "simulated" }, // the only endpoint that exists
});
```

`start` validates, in order: the spec front matter, the digest-bound approval envelope,
single-packet scope, process-safe strings, then acquires the repo-global lease
(`refs/factory/active`) and creates or reuses `refs/factory/specs/<spec_id>` and
`refs/factory/runs/<run_id>`. `StartResult` is one of:

- `{ disposition: "candidate_ready", runId, candidate }` — success.
- `{ disposition: "run_in_progress", runId, holderId }` — another controller holds the lease.
- `{ disposition: "rejected", reason }` — anything else; the reason is the thrown message.

Be aware of what `start` does **not** do, and has never done: it runs no plan, baseline,
red, green, quality, reconcile, or review stage. It jumps from intake straight to the
simulated candidate effect and reports `candidate_ready`. The stage predicates in
`SDLC_PREDICATES` still throw `... is unavailable until its owning packet`. A
`start()`-only run therefore reaches a terminal status having executed two stages — and
the status record will nonetheless claim all nine (section 7).

To execute the stages, use `run --spec`, which calls `driveRun`: the same validation and
lease acquisition, then a strictly sequential loop that dispatches one lifecycle stage at
a time through `runStage` and parks fail-closed at the first unmet gate. `start()` is not
going to grow into that; `driveRun` already is it.

## 7. Status, chat, and resume

**Status** — `renderStatus({ repositoryPath, runId })` in `src/controller/sdlc/chat.ts`
is a pure read — of the refs and, since OI-7 closed, of the run's event mirror under
`docs/runs/` — and returns the spec §12.1 chat record:
`run_id, spec_id, spec_digest, status, current_stage, completed[], active_jobs[],
decision_needed, recommended_action, evidence_links[], allowed_commands[], lease,
candidate?, transitions[]`. A chat host (Claude Code, Codex, etc.) renders this record;
it never runs its own state machine. Today `decision_needed` is always `null` and
`evidence_links` is always `[]`; `allowed_commands` is `["status"]` when complete, else
`["status", "resume"]`. There is no `status` CLI command — `renderStatus` is a function
call only.

**`completed` and `transitions` report what the run actually did** (OI-7, closed by the
`honest-run-status` packet — the first spec the factory built through `run --spec` itself).
Both are derived from the run's event mirror at `docs/runs/<run_id>/events.jsonl`, counting
only `stage-advanced` entries, rather than from slicing the static `SDLC_LIFECYCLE` table by
`run.status`. Before the change, a run that reached `candidate_ready` through `start()` alone
reported **nine completed stages for two executed**.

**The log is a floor, never a ceiling.** It is written best-effort and every write error is
swallowed by design, so it can be short but never long — which is what makes it safe to
report from. An absent, unreadable, or malformed log yields an **empty** `completed` and
`transitions`, never a fallback to the table, because falling back is the bug. Two
consequences worth knowing:

- A status rendered where the log is not present — a different worktree or checkout, or after
  `docs/runs/` is cleaned — shows `completed: []` even for a genuinely complete run, alongside
  a `status` and `current_stage` that still come from the durable record. The object can
  therefore look self-contradictory. Under-reporting is the deliberate choice; the old render
  was self-consistent but wrong.
- Runs recorded before this change have no mirror and report nothing completed. They were not
  backfilled.

This is a read of the refs **and** of `docs/runs/` in the working tree. `renderStatus` is
still a pure read that writes nothing and decides nothing — no gate, predicate, or transition
reads the mirror, which keeps P25's constraint intact.

**Resume** — `resumeRun(request)` in `src/controller/kernel/resume.ts`:

```ts
import { resumeRun } from "./src/controller/kernel/resume.ts";
import { SDLC_LIFECYCLE } from "./src/controller/sdlc/lifecycle.ts";
import { verifyCandidate, TERMINAL_STATUS } from "./src/controller/sdlc/chat.ts";

await resumeRun({
  repositoryPath, runId, holderId, surface,
  expected: { specDigest },
  stages: SDLC_LIFECYCLE.map((s) => s.stage),
  terminalStatus: TERMINAL_STATUS,
  verifyCandidate,
});
```

Results: `already_complete`, `resumed` (with the next incomplete `stage`),
`run_in_progress`, `parked` (`state_invalid`), or `rejected`. Resume reacquires a lease
it already holds (same `run_id` + `holder_id`); a different live holder is rejected and
needs an owner `factory unlock`, which does not exist yet (LIM-14). Resume currently
only *positions* the run at the next stage; it executes nothing and replays nothing.
Only the spec digest is verified on resume, not the factory pin or base SHA (LIM-05).

**Lease** — one repo-global lease, no TTL, no heartbeat, no auto-break. A crash while
holding it leaves `refs/factory/active` set; the same `holderId` can resume through it.

## 8. Red and Green proofs, the run loop, and stage grades

### The proofs

`src/controller/sdlc/tdd.ts` exposes two pure evaluators returning
`{ accepted, failedPredicates[] }`:

- `evaluateRedProof({ repositoryPath, baseSha, redSha, testPathPrefixes, junitXml,
  assertionFailureTypes, attestedCause })` checks `red.failed-by-assertion` (every JUnit
  failure/error has a `type` in your assertion family, and at least one exists) and
  `red.test-only-tree-committed` (every path changed base→red is under a test prefix).
- `evaluateGreenProof({ repositoryPath, redSha, greenSha, allowedPaths })` checks
  `green.red-commit-is-ancestor` and `green.allowed-paths-valid` (every changed path is
  exactly listed in `allowedPaths`; prefixes are not expanded).

Any malformed input fails every predicate of that proof. SHAs must be full 40-hex.

**Red must fail by assertion, and on a greenfield spec that takes care.** A test that
imports a module which does not exist yet fails with `ERR_MODULE_NOT_FOUND`, not an
`AssertionError`, and `red.failed-by-assertion` rejects it. The test file must check
`existsSync(modulePath)` and wrap the dynamic `import()` so absence becomes an ordinary
failed assertion (learning L-011). The shipped `test-writer` role carries this in its
procedure (`.ailib/factory/roles/test-writer/ROLE.md` step 4). Node's
`--test` JUnit reporter emits assertion failures as `type="testCodeFailure"`; that is
the string to pass in `assertionFailureTypes` when the product runs on `node --test`.

### Did the suite actually pass?

`src/controller/sdlc/suite-run.ts` answers the question the Green proof does not:

- `runSuiteCommand({ repositoryPath, command, timeoutMs })` spawns the test command
  (`command` is argv, e.g. `["node", "--test", "--test-reporter=junit", ...]`) and returns
  the JUnit XML it wrote to stdout, or `null`. It never throws. A nonzero exit *with*
  output is a red verdict, not an execution failure — only spawn failure, timeout, or a
  nonzero exit with no output gives `null`.
- `evaluateSuite(junitXml)` returns `{ ran, passed, total, failures }`. Zero testcases is
  never a pass: absence of failures is not proof of execution.
- `gradeGreenSuite(junitXml)` turns that into the `green.suite-passed` token, and
  distinguishes `"suite failed: N/M failing"` from `"suite did not run"`.

### Walking the lifecycle

`walkLifecycle(satisfied)` (`src/controller/sdlc/lifecycle-walk.ts`) takes a `Set` of
satisfied **gate tokens** and walks `SDLC_LIFECYCLE` in order, returning
`{ reached, blockedAt, missing[] }`. It stops fail-closed at the first stage whose gate
is not fully covered. Token spellings:

| Requirement | Token |
|---|---|
| predicate (`requirements.P`) | the predicate name, e.g. `green.allowed-paths-valid` |
| agent (`requirements.A`) | `agent:<role>`, e.g. `agent:implementer` |
| human (`requirements.H`) | the gate name, e.g. `owner.spec-approved` |

`redProofTokens(proof)` and `greenProofTokens(proof)` convert a `tdd.ts` evaluation into
the tokens the walker consumes.

### Running one stage

`runStage(request)` (`src/controller/sdlc/run-stage.ts`) is the connector between a role
and the walker. It assembles the prompt from the role procedure plus your job context,
invokes the adapter, grades the reply, and returns
`{ outcome, agentText, grade, satisfied[], walk }`. A non-`success` adapter outcome
yields no tokens at all — the prior token set passes through unchanged.

**Composing `runStage` calls by hand is retired — use `run --spec` (section 6).** Until
P39 this guide told you to build a product by calling `runStage` once per role and feeding
each result's `satisfied` token set into the next call. That is how the shipped examples
under `examples/` were built, and it was never governed. It stopped being the documented
path once `run --spec` could drive a real packet.

`runStage` is still exported and still callable, so the ungoverned path still exists — it
is no longer *designated* (OI-8). If you call it directly, know what you give up: it never
enters `driveRun`, so nothing strips a worker's `baseline.*` / `quality.*` / `reconcile.*`
tokens and no controller-run check replaces them. Two green gates also depend on inputs
only the driver threads — `gradeGreen` emits `green.coverage-passed` only when you pass
`coverageSummary` and `coverageFloor`, and `green.ref-snapshot-valid` only when you pass
`baseRefAtRed` and `baseRefAtGreen`. Omit them by hand and the green gate is never fully
covered.

Crucially, the grade is computed from **artifacts, not claims**: the graders run real
`git diff` and `git merge-base` and read real JUnit output. An agent asserting that its
tests pass contributes nothing.

| Grader | Tokens it can emit | Accepted when |
|---|---|---|
| `gradeRedProof(agentText)` | `red.failed-by-assertion`, `red.test-only-tree-committed` | both |
| `gradeGreen({ ... })` | `green.red-commit-is-ancestor`, `green.allowed-paths-valid`, `green.suite-passed`, plus `green.coverage-passed` and `green.ref-snapshot-valid` when the driver supplies their inputs | structural proof, suite verdict, and any supplied coverage/ref gate |
| `gradePlan(agentText, criterionIds)` | `plan.dag-schema-valid`, `plan.total-criterion-coverage` | both |
| `gradeReview(agentText)` | `review.no-unresolved-blocking-finding` | no finding at severity `blocking` |

`gradePlan` checks the packet DAG is acyclic with no dangling dependency, no duplicate
id, and disjoint `allowedPaths` between packets, and that every spec criterion id is
covered by some packet. `plan.classifier-rule-valid` is deliberately *not* graded yet —
it needs a classifier schema that does not exist.

`gradeReview` is a mechanical safety check, not a judgment. "Is this good enough to
ship?" remains your human gate (`reviewer.review-verdict-approved`); the grader only
refuses to let a blocking finding through. Findings must be JSON:
`{ findings: [{ severity: "blocking"|"major"|"minor", axis, path, reason }] }`.
Malformed output is a refusal, not a pass.

`examples/writeroom/evidence/lifecycle.md` is a recorded end-to-end run in this shape,
including a review that rejected the factory's own output on a security finding no test
would have caught.

## 9. Reading evidence and review output

- **Quality** — `evaluateQuality({ baseline, candidate, profile })` in
  `src/controller/sdlc/predicates/quality.ts` returns per-capability `records[]` with
  `passed` and a plain `reason` (`"... required capability missing"`, `"... malformed
  report"`, `"... N failing test(s)"`, coverage below floor), plus a coverage `ratchet`
  that only rises on an overall pass.
- **Security** — `evaluateUntrustedResult` in `predicates/security.ts` scans an agent's
  diff and proposed commands; findings are `secret.detected`, `authority.command-proposed`,
  `authority.oversized-command`, `effect.unreadable-diff`, `security.invalid-input`. All
  are `redacted: true` — the matched secret value is never written anywhere.
- **Review** — the `review-guide` role (`.ailib/factory/roles/review-guide/ROLE.md`)
  structures a human review record: spec fidelity first, then correctness,
  readability/simplicity, architecture, security, performance; one severity-ranked
  finding per defect with path, failure scenario, and whether it blocks candidacy. The
  guide never approves; you do, via a `review_verdict` envelope. The reviewer must not be
  the implementer of the packet.
- **Roles** — `plan-author`, `test-writer`, `implementer`, `review-guide` under
  `.ailib/factory/roles/`. Each has a `role.json` contract and a `ROLE.md` summary.
  `spec-draft` and `diagnose` are not shipped (LIM-10).

## 10. Pull requests and what is never automatic

The candidate effect `candidate.mark-pr-ready` (`src/controller/sdlc/effects/pull-request.ts`)
is idempotent: `key = sha256([run_id, spec_id, "candidate", attempt])`. Only
`{ kind: "simulated" }` exists; any other endpoint is rejected with
`Only the simulated candidate endpoint is available`. No GitHub PR is opened today
(LIM-13). When a real endpoint lands, the design is: a draft PR opens once the accepted
Red commit is reachable on `factory/<spec-id>`; the controller marks it ready at stage 9.

The factory never, on any surface: pushes to your product branches, merges, releases,
deploys, creates issues outside the documented halt path, or chains skills on its own.
`merge_authority: owner` is an unconfigurable v1 invariant. Merge is your explicit act.

## 11. Troubleshooting

**Doctor** — `doctor({ repositoryPath })` in `src/controller/sdlc/doctor.ts` is read-only
and returns `{ ok, findings[] }` with kinds: `manifest` (`.ailib/manifest.yaml` missing;
run scaffold), `quality_profile` (`.aai/policy/factory.yaml` invalid), `custom_ref`
(something under `refs/factory/*` the factory does not own), `invalid_input`.

Common rejection reasons and what they mean:

| Reason / predicate | Plain English |
|---|---|
| `.aai/policy/factory.yaml: missing policy file` | No quality profile in this repository. Every CLI command checks it first; add it (section 6). |
| `policy: <vendor> adapter options are invalid` | `FACTORY_ADAPTER` is set but its executable path or config dir is wrong. Surfaces as a policy rejection (exit 1), not a worker refusal, because `doctor` preflights the configured adapter. |
| `run requires stage workers: no worker source configured` | Exit `3`. Set `FACTORY_ADAPTER` (plus its executable path) or `FACTORY_WORKERS_MODULE`. |
| `coverage below floor N (lines X, branches Y)` | The controller ran your profile's `coverage` command on the green commit and the result is under `coverage_floor`. |
| `more than one run awaits a review verdict; disambiguate: ...` | Two parked runs. `verdict` will not guess; resolve one first. |
| `no run awaiting a review verdict under refs/factory/runs` | Nothing is parked `needs_owner` at `review` — `run --spec` has not reached the review pause. |
| `Canonical spec must begin with front matter` / `... is malformed` | Front matter is not the exact shape in section 4 (indentation, quoting, unknown field). |
| `Missing required spec field: X` | Every field is mandatory; use `[]` for empty lists. |
| `At least one machine-checkable criterion is required` | Add a criterion with `kind: test`. |
| `Approval sidecar path is not authoritative` | Path must be `.aai/specs/<spec_id>.approval.json`. |
| `Approval envelope is invalid for this subject and policy` | Digest, principal, policy version, or decision does not match; re-approve the current bytes. |
| `Approved spec requires an agent-authored plan` | Spec spans modules or touches interfaces; not runnable yet. |
| `A different spec digest already owns this spec_id` | You edited the spec after a run started; `spec_superseded` parking is not implemented, so start a new `spec_id`. |
| `run_in_progress` | Lease held by another holder; wait or (when it exists) unlock. |
| `state_invalid` / `parked` | `run.json` or its candidate failed revalidation; state is not repaired. |
| `run ref advanced concurrently; reload and retry` | CAS lost a race; call again. |
| `red.test-only-tree-committed` | The Red commit touched non-test paths. |
| `red.failed-by-assertion` | Tests failed for another reason (compile error, timeout) or did not fail. |
| `green.red-commit-is-ancestor` | Green was not built on top of Red. |
| `green.allowed-paths-valid` | Green changed a path outside the packet's exact allow-list. |
| `suite did not run` | The test command produced no JUnit report — wrong `reportPath`, or the runner never started. Not the same as failing. |
| `suite failed: N/M failing` | The suite ran and N tests failed. Green is not done. |
| `plan DAG has a cycle, dangling dependency, duplicate id, or overlapping paths` | The plan is not executable; packets must be a DAG with disjoint write scopes. |
| `criteria not covered by any packet: ...` | Every spec criterion must land in some packet. |
| `N unresolved blocking finding(s): <path: reason; ...>` | Review refused. Each blocking finding's own reason is in the string (OI-19), so the record says what was wrong, not only where. Fix the blockers and re-review with a fresh reviewer. |
| `... output was not valid JSON` / `... record is malformed` | The role returned prose or a wrong shape. Graders refuse rather than guess. The review grader adds where the reply went: `review output was not valid JSON; a bounded copy of the raw reply is retained at review.agent_reply in the run record`. Read that before paying for the review again. |

## 12. Known limitations (see `docs/gauntlet/README.md`)

The authoritative table is in `scripts/run-gauntlet.ts` and is copied into every gauntlet
report. It holds 20 entries, LIM-01 through LIM-22; **LIM-02 (no CLI) and LIM-11 (the
reference workflow never run through `start()`) are closed and no longer in it.** The ones
that change what you can do:

- LIM-05: resume verifies only the spec digest, not the factory pin or base SHA.
- LIM-10: `spec-draft` and `diagnose` roles are not shipped; request-first intake is unavailable.
- LIM-12: FR-K3 is part-evidenced. Spec equivalence (identical bytes → identical digest,
  derived plan and stage sequence) is proven; there is no request-first drafting component
  and no recorded "discovery skipped" reason.
- LIM-13: no GitHub repository; PRs and hosted checks are simulated.
- LIM-14: no `factory unlock`; the approval replay index is not enforced; resume is not proven from a fresh clone.
- LIM-15: role invocations do not record the role version/digest.
- LIM-17: status `completed` / `transitions` come from the static lifecycle table, so a
  `start()`-only run over-reports (section 7).
- LIM-18: **closed 2026-08-28.** `run --spec` drove `specs/run-diagnosis.spec.md` from
  argv through all nine stages to `status: "complete"` with a real vendor CLI, the owner
  signing the review verdict. `start --spec` still reaches a candidate without walking
  the lifecycle; that shortcut is not a governed route and never was.
- LIM-19: the reference-workflow fixture covers intake → `candidate_ready` in both
  repository shapes, not the full nine-stage walk.
- LIM-20: FR-K14 is evidenced for the single-packet derive and for the refusal of a
  multi-module spec. No seam accepts an agent-authored multi-packet plan, and
  `packet_too_large` does not exist in `src/`; two fixture tests asserting those contracts
  are `test.skip`.
- LIM-21: run governance covers `run --spec` only — direct `runStage` calls and the
  post-verdict `candidate` re-run are ungoverned (OI-8), and governance owns three
  stages plus `green.coverage-passed`, not `red.*` broadly (OI-9). P39 retired the
  hand-composed loop as the documented path; it did not remove the path.
- LIM-22: the adapter-auth half was closed by P36 (OI-11) and both shipped adapters now
  authenticate. What is left is that no run has driven every stage through a real adapter.
  OI-14 blocked that until P40; nothing blocks it now except the run not having been done.

Infrastructural, less likely to reach you: LIM-01 (Node must be 22.18+), LIM-03 (1 MiB
diff ceiling in the security scan), LIM-04 (regex JUnit parsing, duplicated), LIM-06 /
LIM-07 (unverified workflow action pins; hosted-checks auth and cache), LIM-08 (Codex CLI
output wording assumed), LIM-09 (upgrade rollback and GC edge cases), LIM-16 (`pnpm test`
is timing-sensitive under CPU load).

Beyond the limitations, the factory's own defect backlog lives one-per-file under `issues/`,
indexed by `issues/INDEX.md`. **As of 2026-08-28 it is empty** — 55 closed, 0 open, and 2
dormant (OI-2 and OI-6, two gates that are tautological until a mutable base or target ref
exists; they are disclosed and cannot mislead a run today).

**None of them will stop your first run.** OI-14 used to — a repository that had never
produced coverage parked at baseline, because baseline read `coverage/coverage-summary.json`
out of the tree and nothing wrote it until green. **P40 closed it**: baseline runs the
profile's `coverage` command itself. No hand-run setup step is required any more.

(Do not confuse that with `governed run: no controller result for stage baseline`. Section 6
covers that string under a different cause — a `test_unit` that runs clean but emits no
`<testcase>` elements — with a different remedy. It was also OI-13's symptom, which P38 fixed.)

**First: a parked run is re-enterable, and you usually need to delete nothing.** Run the same
spec again and the factory picks up the same `run_id` where it left off:

```bash
factory run --spec specs/your-spec.md
```

Reach for the command below only when a re-run will not do — a run wedged beyond re-entry, or a
spec you want to start over from scratch. It destroys state that a re-run would have kept.

```bash
factory abandon --spec specs/your-spec.md
```

It discards that spec's run ref and its index entry together, prints one JSON record naming what
it discarded, and exits 0. It **refuses** rather than proceeding when a live lease holds the run,
and when the run carries an accepted review verdict. It also requires the same approval as
`start` and `run`, so a file that merely names a real `spec_id` cannot delete that spec's state.

`--force` overrides **only** the accepted-verdict refusal. It does **not** override the lease
check or the approval check — you cannot force your way past a running controller. The full
refusal table is in `docs/admin-guide.md` section 11 ("Limitations that affect administrators").

Prefer it over deleting refs by hand. A hand-run `git update-ref -d` sweep takes no lease, so it
can pull `refs/factory/active` out from under a running controller, and it clears **every** spec's
state rather than the one you meant.

The closed issue that most changes how you should read this guide is OI-7 (section 7): a run's
reported status comes from the static lifecycle table, not the event log, so do not read a
status record as execution evidence.

The gauntlet `pass` verdict means the fixtures pass against one digest. Kernel v1 was
accepted by the owner on 2026-08-25, and the bootstrap process is deliberately still **not**
retired — but its gate, the factory driving its own packet through `run --spec` with no human
hand-composing `runStage` calls, has been met repeatedly since. Retiring the bootstrap route
is now an owner decision rather than a blocked one.
