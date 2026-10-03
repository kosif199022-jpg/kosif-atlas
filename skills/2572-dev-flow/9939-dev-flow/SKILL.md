---
name: dev-flow
description: Route a dev task through the right subset of the canonical skill chain (adhd → grill-me → to-prd → compass → blueprint → code → review-pass → pr-craft), matching ceremony to stakes. Detects the task tier (bug / feature / architecture / design / client), shows the exact chain it will run and what it skips, confirms, then drives the sub-skills in order — pausing where each needs user input. Use when the user says "start a feature", "new feature", "kickoff", "route this through the workflow", "run the chain", "which skills for this", "design this but do not build it", "spec it out, no code", or /dev-flow. NOT for tasks already mid-chain (a PRD/plan exists) — invoke the specific next skill instead.
---

# dev-flow

Conductor for the canonical dev chain. It does NOT re-implement the sub-skills — each one owns its own logic and its own "when to skip" rules. This skill only picks the tier, orders the stages, and drives them. Match ceremony to stakes: a bug gets three steps, a new subsystem gets ten.

Executor note: this is a prompt, not a script. Sub-skills still pause for user input (grill-me interrogates, pr-craft wants approval). Drive one stage, wait for it to finish, then start the next. Never fire the whole chain blind.

## Protocol

1. **Isolate** — a dev-flow run dirties the working tree and makes commits across many stages. If another agent might touch this repo concurrently (the default assumption on a shared machine), call `EnterWorktree` before driving any stage so this whole run gets its own working tree + branch and the main checkout stays free for that other agent. This is the parallel-worktrees "isolating your own work" path (see that skill). **Name the branch `<type>/<slug>`, where `<type>` follows the detected tier: `fix/` for the bug tier, `feat/` for feature/architecture (use `chore/`/`refactor/`/`docs/` when that describes the work better), and `<slug>` = short kebab task description — e.g. `fix/distributor-bar`, `feat/cv-pv-pdp`.** Caveat: `EnterWorktree name:` has no branch override — it always mints `worktree-<name>`, which makes ugly PR titles. For a clean branch, create it yourself and enter by path instead: `git worktree add -b feat/<slug> .claude/worktrees/<slug> "$BASE"` then `EnterWorktree path:.claude/worktrees/<slug>` (a path-entered worktree is kept by ExitWorktree, which is what Close wants anyway). Skip only if already in a worktree session, or it's a throwaway one-liner on a repo you're certain is yours alone; when skipping, say so in the plan so the user can override.
2. **Detect tier** from the task description (table below). If ambiguous, ask one question: which tier.
3. **Print the plan** — the ordered stage list for that tier, each stage marked RUN or SKIP with a one-line reason. Honor each sub-skill's own skip rules (e.g. grill-me skips single-file changes; to-prd skips bug fixes). Reflect those in the SKIP reasons. Lead with the isolation decision (worktree name, or why skipped).
4. **Confirm** — user says go / edit / abort. Accept partial edits ("skip the PRD", "add adhd", "no worktree"). Record exactly what they approved.
5. **Drive** — invoke each RUN stage via the Skill tool, in order. After each returns, checkpoint: report what it produced (file path, decision, diff), then start the next. Stop and surface if a stage can't proceed (fuzzy scope → route back to grill-me; unsettled architecture → route to compass).
6. **Close** — after the last stage, one-line summary of artifacts produced (intent path, PRD path, ADR path, plan path, PR URL). Every stage that ran should have left a numbered file behind; a stage that ran and produced nothing readable is a gap worth naming here. If you entered a worktree in step 1, `ExitWorktree` with `keep` (never `remove` — the branch holds your commits and the pushed PR).

## Tiers

Detect from the task. When in doubt, pick the lower-ceremony tier and let the user upgrade.

| Tier | Signal | Chain |
|------|--------|-------|
| **bug** | obvious cause, single-file, spike, throwaway | code → review-pass `quick` → pr-craft |
| **feature** | multi-file, some design surface, user-visible | grill-me → to-prd → blueprint → code → review-pass → pr-craft |
| **architecture** | new subsystem, public API, hard-to-reverse decision, schema, "how should I structure X" | adhd → grill-me → to-prd → compass → blueprint → code → review-pass → pr-craft |
| **design** | design only, no implementation: "design this", "don't build it yet", "spec it out", "architecture only", "no code" | adhd → grill-me → to-prd → compass → blueprint → pr-craft (docs-only) |
| **client** | client-services work, delivery for a paying stakeholder | wrap the feature/architecture chain in cagan-check: kickoff (before) + review (before PR) |

### Design tier

Ends at artifacts, never at a diff. Use it when the goal is to settle *what* and *how* and then
stop: a subsystem nobody is building this sprint, an approach that needs sign-off before anyone
commits to it, a scoping exercise for a client.

- **Terminates after `blueprint`.** No `code`, no `review-pass`, no implementation. If the user
  starts asking for code mid-run, that is a tier change: say so and re-confirm rather than drifting.
- **`pr-craft` runs docs-only**, so the PRD, ADR and plan get reviewed before anyone builds against
  them. `review-pass` stays SKIP: there is no diff to review, only prose. Drop the PR only if the
  user says to.
- **`blueprint` is gated.** RUN when the design is settled and meant to be built, so the plan is the
  handoff. SKIP when the run is deciding *whether* to build at all, where a task breakdown is
  premature. Print which, and why.
- **Worktree isolation is optional here.** A design run touches `docs/` only, so it cannot collide
  with another agent's code. Skip Protocol step 1 unless the repo is genuinely contended, and say so.
- **Close names the resume point.** End with the artifact paths plus the sentence that picks the work
  back up: the feature or architecture tier SKIPs every stage whose artifact already exists, so a
  build run months later starts at `code` and re-derives nothing.

### Stage gates (only RUN when the gate is true)

- **adhd** — only if the approach is open-ended / you're stuck. Skip if the approach is obvious or the user used closed phrasing ("quick", "standard", "just").
- **grill-me** — only if scope has non-obvious tradeoffs. Skip single-file / obvious.
- **to-prd** — only if a spec adds value. Skip bug/spike (commit message is enough).
- **compass** (architect/ADR) — only if an architectural decision is unsettled and hard-to-reverse. Skip if convention already dictates the shape.
- **parallel-worktrees** — two uses here, both governed by that skill: (a) **run-level isolation** — the `EnterWorktree` step 1 above, so this run doesn't collide with a separately-launched agent on the same repo; (b) **intra-stage fan-out** — when a stage (usually **code**) splits into independent slices on disjoint files, it handles the go/no-go, file partitioning, subagent isolation, and integration. Not a chain stage itself; a primitive any stage can invoke.
- **review-pass** — the whole review tail as ONE stage. It owns the run / code-review / implementation-review / security-audit gates and returns a single merged, deduped, ranked go/no-go verdict instead of four separate reports. **Don't restate its gates here** — they used to be duplicated in this file and the two copies drifted (this file said "SKIP implementation-review on the bug tier", review-pass said "always"). One owner, one policy. Pass the depth: `quick` for the bug tier (verify + code-review; a one-file fix has no plan for the coverage checks to read), default for feature/architecture (adds implementation-review, and security-audit only when the diff sits on a trust boundary). RUN whenever the chain produced a diff; SKIP only for a docs-only or throwaway change with nothing to review.
- **sentinel** — the Maintain stage, and deliberately **not** a chain stage: it runs on a clock, not in a build. After the PR merges, nothing in this chain is watching, and `sentinel` is what closes that loop — it scans shipped work for recurring fix classes, reverts, and (where configured) prod threshold breaches, then files what it finds as `docs/intent/NNNN-<slug>.md`, which re-enters this chain from the top as ordinary work. Never invoke it as part of a run; point the user at `/schedule` for a weekly sweep once a repo has shipped something worth watching.
- **commit-report** — optional, at the end, if the user wants a standup/PM/client note. `--metrics` adds the flow numbers (first-pass merge rate, rework cycles, artifact lag) if the user wants to see whether the chain itself is working.

## Rules

- **Never skip a stage silently.** Print SKIP + the reason, so the user can override.
- **Never expand past what the user approved.** Partial OK is valid — honor it exactly.
- **Artifacts flow forward, on disk.** Each stage commits a file the next stage reads: `docs/intent/` (grill-me) → `docs/prds/` (to-prd) → `docs/adr/` (compass) → `docs/plans/` (blueprint) → the diff → the PR. That chain is the audit trail; it is also what lets a stage resume in a later session instead of re-deriving what an earlier one already settled. grill-me's Glossary → to-prd → blueprint, verbatim. Don't paraphrase domain terms between stages. Same for the edge-case ledger: grill-me's `## Edge cases` → blueprint's `## Edge Cases` → implementation-review Check 3 (reached via review-pass), which reconciles shipped reality against it. When grill-me is SKIPped, blueprint still owns the sweep — the ledger is not optional on the feature/architecture tiers, it's the only thing that distinguishes a case you *decided* not to handle from one you never saw.
- **Respect existing artifacts.** If a PRD/ADR/plan already exists for this work, mark that stage SKIP (done) and start from the next.
- **This skill drives; it doesn't decide inside a stage.** Once a sub-skill is invoked, follow that skill's own instructions — don't second-guess its internals.
- **Large layered change → stacked PR.** When the work is built as ordered *dependent* layers (e.g. blueprint phases that each stand alone as a reviewable slice: schema → API → UI), tell pr-craft to open a **stack** — one PR per layer — instead of one giant PR. This complements parallel-worktrees, which parallelizes *independent* slices; stacking chains *dependent* layers so each stays small to review and lower layers can merge first.
- **Test the sharp edge as you cut it.** Tests are a post-code gate here (the whole review-pass stage), which is right for trivial glue (CRUD, UI wiring) — leave those gate-only. But for high-risk logic (a parser, money math, a state machine, an auth/permission path), have the `code` stage write the critical assertion *before or alongside* implementation, not deferred to the gate: a retrospective "missing test scenarios" check catches coverage but arrives too late to apply design pressure to a bad interface. Let the risk of the code, not its position in the chain, decide how early the test appears — but *what* that early test is still follows **testing-philosophy**: behavior-first at the right Testing Trophy tier (integration by default, unit only for pure tricky logic, e2e for a user-facing critical path), never a unit test welded to internals just because it landed early. Note auth/permission is a behavior case — assert what the client observes (403 vs 200), not an internal call. The floor: non-trivial logic leaves one runnable check behind.
- **Instrument what you can't see after ship.** The chain gates correctness *at* ship (review-pass) but goes blind *after* it — the `/run` check inside review-pass is a one-time demo, not a feedback loop. For feature/architecture tiers, close the loop: `to-prd`/`blueprint` name the **outcome metric** the feature exists to move (feature observability — acceptance criteria made measurable in prod, not just "done"), and `code` adds the **telemetry** to answer questions you didn't pre-plan (code observability — structured logs / RED / traces / error capture, behind a flag when the rollout wants cohort comparison). Defer the *how* to whatever the stack already uses; the rule only forces the *what* and *when* — before `pr-craft`, not after an incident. What *reads* those signals afterward is `sentinel`, running on a schedule outside this chain; naming the metric here is what gives it something to watch. Skip for bug/spike (a one-line fix has nothing to observe) and for non-runtime artifacts (docs, or a prompt/skill with no telemetry surface).
- **Obey CLAUDE.md conventions** (shell-command wrappers, commit-message trailers, etc.) — sub-skills that touch the shell already honor these; don't override them.

## When to skip dev-flow entirely

- Task is already mid-chain (a plan or PRD exists) — invoke the specific next skill directly, no need to route.
- One-line edit, typo, rename — just do it.
- Non-dev task (CV, content, research) — those have their own skills.
