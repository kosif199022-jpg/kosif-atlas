---
name: review-pass
description: Single review-only entry point for an existing diff — runs a live-run check (`/run`) → code-review → implementation-review (and security-audit only when the change touches a trust boundary), then consolidates every finding into one go/no-go verdict. Use when you have a change ready and want it reviewed without running the whole dev-flow build chain. Triggers on /review-pass, "review this diff", "review my changes", "is this ready to commit", "give this a once-over". NOT for reviewing a remote GitHub PR (use /code-review) or for a task still being built (use /dev-flow).
---

# review-pass

Thin orchestrator over the review stages of the canonical chain. It does NOT re-implement any check — each sub-skill owns its own logic and its own skip rules. This skill only scopes the diff, orders the stages, drives them, and merges their output into one verdict. Point it at a change that's already written; it decides nothing about how the change was built.

Executor note: this is a prompt, not a script. Drive one stage via the Skill tool, wait for it to finish, checkpoint, then start the next. Never fire all four blind.

## Protocol

1. **Scope** — determine what's under review. Default: the local working-tree diff (staged + unstaged) vs the merge-base. Accept an explicit target (`--staged`, a commit range, a path). From the diff note two things that drive the plan: (a) does it have **runtime surface** (product source, not docs/test-only) — gates the live-run check (`/run`); (b) does it touch a **trust boundary** (auth/authz, input parsing, secrets, file upload, external calls, SQL) — gates `security-audit`.
2. **Harvest existing review** — if a PR exists for this branch, check what already reviewed it before running anything. `gh pr view <n> --json reviews` plus the inline comments; see [references/automated-reviewers.md](references/automated-reviewers.md) for the discovery command and, importantly, for why you must discriminate bots by `user.type` rather than by an `[bot]` login suffix. Two outcomes matter: findings a bot already posted go into the merged verdict with attribution instead of being rediscovered by a stage, and a configured reviewer that is paused, absent, or stale is itself worth reporting. Skip when there's no PR — a local-only diff has nothing to harvest.
3. **Print the plan** — the four stages, each marked RUN or SKIP with a one-line reason (table below). Never skip silently. Note anything the harvest already covered.
4. **Confirm** — user says go / edit / abort. Accept partial edits ("skip the run check", "add security-audit"). **Skip this step when an orchestrator drove you here** — dev-flow runs this as one chain stage and already had the user approve the whole chain; a second confirm inside an approved run is friction, not safety. Print the plan as a notice and proceed.
5. **Drive** — invoke each RUN stage in order. After each returns, checkpoint: report its findings (blockers vs nits) in one line, then start the next. A blocker from an early stage doesn't halt the pass — collect everything, decide at the end.
   - **code-review runs in a fresh context whenever this session wrote the diff.** The agent that wrote a change should not be the one that approves it: it carries the build conversation's assumptions, its rejected alternatives, its sense of what "obviously" works — exactly the blind spots a reviewer exists to catch. So when review-pass is reached from inside a build (dev-flow drove it, or this session produced the diff), dispatch code-review through the Agent tool (`general-purpose`) instead of invoking it inline. The brief carries **only** the review target (the diff range or `--staged`), the paths of the plan / PRD / intent the change was built against, and the instruction to run `/code-review` on that target and return its findings verbatim. Nothing from the build conversation — no summary of what you did, no "note that X is intentional". If something really is intentional, it belongs in the plan or a code comment, where the reviewer will find it; a reviewer told what not to flag is not independent. When review-pass is invoked cold in a session that didn't write the diff, the context is already clean — run it inline.
   - `/run` stays inline (it needs the environment this session set up), and implementation-review already fans out to its own subagents.
6. **Verdict** — merge all findings into ONE list, deduped, ranked blocker → nit. Bot findings from step 2 merge in here too, attributed to their source; where you disagree with one, say so and why — a reasoned disagreement is worth more to the reader than either verdict alone. Close with a go/no-go: **ship** (no blockers), **fix-first** (blockers listed), or **needs-a-human** (findings you can't adjudicate). This consolidated verdict is the whole point of the skill — don't just concatenate the sub-skill outputs.
7. **Learn** — a finding caught once is a bug; the same finding caught twice is a missing rule. Record each **confirmed** blocker or should-fix (not nits, not bot findings you rejected) in the repo's review ledger at `~/.claude/review-ledger/<repo>.md`, where `<repo>` is the basename of `git rev-parse --show-toplevel`. Create the file if missing. It lives outside the repo on purpose: a log of a client codebase's recurring mistakes is not something to commit into their history.
   - **One row per mistake class, not per instance.** The class is a short kebab slug naming the *pattern* (`unawaited-promise-in-handler`, `auth-check-after-side-effect`), never the file or line. Read the existing rows first and reuse a class when it's the same mistake in a new place; a ledger with near-duplicate classes never reaches a count of two.
   - Row format: `| <class> | <count> | <first seen> | <last seen> | <one-line example: file + what went wrong> | <status> |`, status `watching` or `promoted`.
   - **Count ≥ 2 → propose the rule.** When a class reaches its second occurrence (from a separate review-pass run, not two hits in one diff), draft a single imperative line for the repo's `CLAUDE.md` that would have prevented both, show it with the two examples, and ask. Write it only on a yes, then mark the row `promoted`. A rule in CLAUDE.md is read before the next change is written; a ledger row is only read after.
   - **Same class in ≥ 2 repos' ledgers → propose it upstream** as a rule in the skill that owns that area (a language idiom → `code-craft`; a review blind spot → `implementation-review`). Name the target file and draft the line; don't edit the skill in this run.
   - Print one line: `ledger: recorded N, promoted-candidates M`. Skip the whole step only when the verdict had no confirmed findings.
8. **Act** — if there are actionable findings, ask how to apply them (skip this if the verdict is clean; when orchestrator-driven, a clean verdict returns straight to the conductor with no prompt):
   - **Post as PR comments** — re-run `/code-review --comment` so findings land as inline comments on the PR. Only offer this when a PR actually exists for the branch; if none does, say so and drop the option.
   - **Fix directly** — re-run `/code-review --fix` to apply the findings to the working tree. Then re-verify the touched paths.
   - **Just report** — leave the verdict as-is; the user handles it.

   Don't pick for the user — ask, then do exactly what they choose.

## Stages

Run in this order — cheapest signal and hardest gate first.

**Depth.** Default runs all four gates. `quick` runs stages 1–2 only, and exists for one case: a single-file fix with no plan, where implementation-review's plan and coverage checks have nothing to read against and code-review already covers a diff that small. dev-flow passes `quick` on its bug tier and the default everywhere else. Anything beyond a one-file fix uses the default — when unsure, use the default.

| Stage | Order | Gate (RUN only when true) |
|-------|-------|---------------------------|
| **`/run`** (live check) | 1 | Diff has runtime surface. SKIP for docs/test-only diffs — nothing to drive. |
| **code-review** | 2 | Anything beyond a trivial one-liner. Hunts correctness bugs in the diff. |
| **implementation-review** | 3 | Always at default depth, for a real change. SKIP at `quick`. Seven parallel checks; **its check 7 already runs security-audit**, so this covers the baseline security pass. |
| **security-audit** | 4 | SKIP by default — implementation-review already ran it. RUN standalone ONLY when the change sits squarely on a trust boundary and you want the full WSTG pass, not the summary check. On a plain UI/CRUD diff this is pure double-pay. |

## Rules

- **Orchestrate, don't decide inside a stage.** Once a sub-skill is invoked, follow its instructions — don't second-guess its internals.
- **This skill owns the review gates.** dev-flow delegates its entire review tail here and deliberately does not restate these gates. They were duplicated in both files once and drifted — dev-flow said "SKIP implementation-review on the bug tier" while this file said "always". A gate policy changes here, and only here.
- **Never skip silently.** Print SKIP + reason so the user can override.
- **Don't double-pay security.** implementation-review → security-audit is redundant unless the diff is genuinely security-shaped. Say so in the SKIP reason.
- **One verdict, not four.** The value is the merged, deduped, ranked finding list + a single go/no-go — not a wall of concatenated reports.
- **The writer doesn't grade its own work.** code-review gets a fresh context whenever this session built the diff (step 5). Don't leak build rationale into the reviewer's brief.
- **Repeat mistakes become rules.** The ledger (step 7) exists so the second occurrence of a mistake class produces a CLAUDE.md line, not just a second finding.
- **Review first, act second.** The four stages are read-only; only the step-8 Act phase touches the working tree, and only with the user's pick. (Step 7 writes the ledger, which lives outside the repo, and touches the repo's CLAUDE.md only on an explicit yes.) Fixing is `/code-review --fix`, PR comments are `/code-review --comment` — this skill routes to them, it doesn't re-implement either. Committing is still pr-craft's job.
- **Obey CLAUDE.md conventions** (shell wrappers, etc.) — sub-skills that touch the shell already honor these.

## When to skip review-pass entirely

- Reviewing a remote GitHub PR — use `/code-review <pr-number>` (it takes a PR number, branch, or path, and supports `--comment` / `--fix`).
- Mid-build task with no diff yet — use /dev-flow (it builds first, then drives this skill as its review stage).
- One-line edit, typo, rename — just eyeball it.
