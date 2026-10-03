---
name: commit-report
description: >-
  Generate a work report tunable to audience (dev / pm / client) and deliver it as a copy-ready channel block or a written doc. Two modes: `quick` (git-only, zero-config — prose + bullets from the current repo) and `standup` (multi-source — GitHub PRs/reviews/comments + git across repos + deploys + optional tracker, framed as an impact narrative). Use when the user asks for a standup, status update, work summary, "what did I ship today", commit recap, end-of-day report, PM/client update, a report to paste into a channel, or a standup doc — or runs /commit-report. Triggers on "write a report", "summarize commits", "standup", "report for the PM", "update for the client", "send a report", "what did I do today/yesterday". Default delivery is a copy-ready block; `--doc` writes the full report to a file; `--metrics` appends flow metrics (human review coverage, rework depth, artifact lag, spec churn, caught-vs-escaped defects, recurring fix classes) derived from git and gh. Quick mode default scope = `--since-mine` (current user's contiguous commit batch at HEAD); standup mode default window = last working day → now. Parses Conventional Commits prefixes and honors Co-Authored-By trailers.
---

# commit-report

One skill, two modes, two deliveries.

- **Modes** — `quick` (default): git log of the current repo → prose + bullets, zero config. `standup` (`--standup`): multi-source — GitHub PRs/reviews/comments, git across configured repos, deploys, optional tracker → impact narrative.
- **Deliveries** — every run ends with a **copy-ready channel block** (the paste-anywhere "send"). Add `--doc` to also write the full report to a file for bigger-scope handoffs.
- **Audience** — `dev` (tech-heavy) / `pm` (mid) / `client` (no jargon). Applies to both modes and to the channel block.

Guiding principle (both modes): **name work by what it was, not by its ID.** "Fixed the image cache eviction" beats "Merged PR #481." IDs live in refs/footnotes, never in the headline.

Voice (both modes, every audience): **formal and agentless.** The subject of a sentence is the change, the system, or the outcome. No personal pronoun in any of the three persons, and no human as a sentence subject. See [Voice and tone](#voice-and-tone).

## Quick start

```
/commit-report                          # quick mode, dev, --since-mine, prints channel block
/commit-report pm                       # PM-friendly summary of latest batch
/commit-report client --last 4h         # client-safe wording, last 4h
/commit-report dev --count 5            # last 5 commits by user
/commit-report pm --since a3f2c1d       # commits since this hash up to HEAD
/commit-report pm --range main..HEAD    # explicit range
/commit-report dev --path apps/web      # restrict to subdir
/commit-report dev --include-merges     # include merge commits (dev only)

/commit-report --standup                # multi-source standup, last working day → now
/commit-report pm --standup             # standup, PM-framed
/commit-report --standup --repos a,b,c  # override local repo roots for this run
/commit-report pm --standup --doc       # write full report to a doc AND print channel block
/commit-report pm --standup --doc ~/standups/today.md   # explicit doc path

/commit-report --metrics                # append flow metrics for the window
/commit-report dev --metrics --last week
```

Flag precedence: explicit scope flag > mode default window. `--doc`, `--metrics`, and audience compose with any mode.

## Modes

### quick (default)
Git log of the **current repo** only. Zero config. Produces `## Report` (prose) + `## Bullets`, then the channel block. This is the original commit-report behavior — unchanged.

### standup (`--standup` / `--full`)
Multi-source. Requires one-time [config](#first-run-config-standup-only). Produces the full [standup format](#standup-format) (Yesterday / Recap / Today / Channel / Refs), then the channel block. Default window = **last working day → now** (see [Time window](#time-window)).

If `--standup` is requested but config is missing, run [First-run config](#first-run-config-standup-only) first.

## Delivery

Both modes always end by printing the **copy-ready channel block** — a tight, paste-anywhere summary shaped for a chat channel:

```
## For the channel
<one line naming the day's / batch's theme>
- <outcome, not implementation>
- <outcome>
```

Rules for the block: outcome-focused, never a changelog. No SHAs, no file paths, no function names (even at `dev` — the channel block is the compact, human-facing cut). 2–5 bullets. This is the default "send."

`--doc [path]` — additionally write the **full report** (mode-appropriate format) to a Markdown file, for bigger-scope handoffs.
- Default path: `standups/YYYY-MM-DD.md` (relative to cwd). Create the `standups/` dir if it doesn't exist. Override per-run with `--doc <path>`, or set `docDir` in config.
- `YYYY-MM-DD` = the window's end date (today), from a real timestamp (`git log -1 --date=short` or system date) — never invented.
- After writing, print the file path AND the channel block (so the user can both paste and hand off).
- <!-- scope note: doc path is a default, not a law — one config key or one flag overrides it. Deliberately no chat/Slack/email auto-send; a paste-ready block + a file cover "send it" without any external auth. Add a real integration only if the user asks. -->

## First-run config (standup only)

Config lives at `~/.claude/skills/commit-report/config.json`. Quick mode ignores it entirely — never require config for a git-only report.

On first `--standup` run with no config, ask for and persist:

```json
{
  "githubLogin": "octocat",
  "displayName": "Matheus",
  "repoScope": "org:my-org",
  "localRepoRoots": ["C:/Users/malag/projects/work", "C:/Users/malag/projects/side"],
  "tracker": null,
  "docDir": "standups"
}
```

- `githubLogin` — for `gh` searches (`author:`, `reviewed-by:`, `commenter:`).
- `displayName`: the doc header only. Never a sentence subject in report prose.
- `voice`: **retired.** Voice is not configurable; it is always agentless ([Voice and tone](#voice-and-tone)). A persisted `voice` of any value, legacy `"first"` included, is read and ignored rather than erroring. Do not prompt for it during first-run setup.
- `repoScope` — `org:name`, `user:login`, or an explicit list of `owner/repo`.
- `localRepoRoots` — dirs to scan for local commits (walk one level for git repos).
- `tracker` — optional MCP for ticket titles (e.g. `linear`, `jira`), else `null`.
- `docDir` — default `--doc` directory. `null`/absent → use the delivery default above.

Keep setup to the minimum needed for the flags actually used; don't prompt for a tracker if none is configured and no ticket refs appear.

## Workflow

1. **Resolve mode**: `--standup`/`--full` → standup, else quick.
2. **Resolve identity**: `git config user.email`. In quick mode, bail with a clear error if unset. For author matching, scan both the `--author` field AND `Co-Authored-By:` trailers — pair-programming commits where the user is co-author must be included, not silently dropped.
3. **Resolve audience** (positional first arg, default `dev`): `dev` | `pm` | `client`.
4. **Resolve scope / window**:
   - **quick** (precedence: explicit flag > default `--since-mine`):
     - `--since-mine` *(default)*: contiguous commits at HEAD authored by user. Walk back via `git log --pretty='%H%x09%ae'`; stop at first commit whose author email ≠ user. If HEAD's author ≠ user → fall back to `--last today` and note the fallback in output.
     - `--since <hash>`: `git log <hash>..HEAD --author="$email"`. Hash = exclusive lower bound. Short or full SHA.
     - `--last <duration>`: `1h`, `4h`, `today`, `week` → `git log --author="$email" --since=<duration>`.
     - `--count <n>`: `git log --author="$email" -n <n>`.
     - `--range <ref..ref>`: `git log --author="$email" <range>`.
     - `--path <dir>`: append `-- <dir>` to any `git log`. Repo cwd is default.
   - **standup**: default window = [last working day → now](#time-window). Any explicit quick-scope flag overrides the window.
5. **Collect data**:
   - **quick** — per commit: subject, body, short SHA, files changed (`git show --stat --pretty=format:'%h%n%H%n%s%n%b' <sha>`). Skip merge commits unless `dev` + `--include-merges`.
   - **standup** — run these in parallel (see [Multi-source collection](#multi-source-collection-standup)).
6. **Parse Conventional Commits prefixes** (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `perf:`, `build:`, `ci:`) as the primary bucketing signal: features ship, fixes resolve, refactor/chore/test = "groundwork" for client audience. No prefix → content heuristics. Scope in parens (`feat(auth):`) is a `pm`/`client` framing hint.
7. **Synthesize** per audience + mode ([Audience map](#audience-map), [Voice and tone](#voice-and-tone), [Standup format](#standup-format)). Group related work; do not echo subjects 1:1. Name by outcome, not ID. Draft straight into the impersonal voice rather than writing first-person prose and stripping pronouns afterwards; the strip leaves "worked on" and "got it working" behind.
8. **Humanize**: when the `humanizer` skill is available, run it over the drafted prose, then re-check what comes back against [Voice and tone](#voice-and-tone) and [Discretion](#discretion-about-the-prior-state). See [Humanize the prose](#humanize-the-prose-always-when-available).
9. **Deliver**: render the mode's format, then always the channel block. If `--metrics`, insert the [flow-metrics](#flow-metrics---metrics) section before the channel block. If `--doc`, write the full report to file and print its path.

## Multi-source collection (standup)

Query in parallel, then merge and dedupe:

1. **Authored PRs** — `gh search prs --author={githubLogin} --merged` (and open/draft for Today) within the window, scoped by `repoScope`.
2. **Reviews given** — `gh search prs --reviewed-by={githubLogin}` in the window.
3. **Comments left** — `gh search issues --commenter={githubLogin}`, deduped against 1–2.
4. **Local commits** — `git log --author="$email" --since=<window> --date=format:'%a %Y-%m-%d %H:%M'` across each `localRepoRoots` entry (and its child repos). Use the real weekday from the timestamp; never infer it.
5. **Deploys** — release/deploy workflow runs after merge, matched by SHA or time proximity (`gh run list`). Note success/failure.
6. **Linked tickets** — extract Linear/Jira/etc. refs from PR titles/bodies; resolve titles via the `tracker` MCP if configured. If no tracker, keep the raw ref.
7. **Today's queue** — carry-overs (open/draft PRs, unpushed branches), pending review requests (`review-requested:{githubLogin}`), assigned tickets by priority. Cap at 5.

Any source that errors or is unconfigured is skipped silently — a partial report beats a failed one. Note in the report which sources were unavailable only if it materially changes the picture.

## Flow metrics (`--metrics`)

Opt-in. Appends a `## Flow metrics` section measuring **how the work moved**, not what shipped. `dev` audience only — these are engineering-process numbers; a PM or client report gets the outcomes, not the pipeline telemetry. If `--metrics` is combined with `pm`/`client`, compute it into the `--doc` body but keep it out of the channel block.

Every figure below is derived from git and `gh` alone — no new tooling, no instrumentation to install. That also means several are **proxies**, and a proxy reported as a fact is worse than no metric. Label them as marked, and when the window is too small for a number to mean anything (fewer than ~5 PRs), print the raw counts and skip the percentage rather than reporting "100% first-pass" off a sample of one.

**Leading** — cheap signals that move before quality does:

| Metric | How to derive | Note |
|---|---|---|
| **Review coverage** | Report it **three ways**: PRs with a human review, PRs with a bot review, PRs with neither. Filter on `.user.type=="User"` vs `"Bot"` — see [automated-reviewers](../review-pass/references/automated-reviewers.md) | Compute this **first** — it calibrates everything below |
| Rework signal | inline review comments per PR (`repos/{owner}/{repo}/pulls/{n}/comments`), median and worst. Where review coverage is high, also count commits pushed after the first review's `submittedAt` | The real "had to redo work" signal |
| First-pass merge rate | merged PRs with no `CHANGES_REQUESTED` ÷ all merged PRs — **but only report it when review coverage is meaningful and the state is actually in use** | See the trap below |

**The `CHANGES_REQUESTED` trap.** Plenty of teams review thoroughly and never touch that button; they approve and leave inline comments instead. On such a repo this metric reports a flawless 100% that means nothing, and it reports the same 100% for a repo that merges entirely unreviewed. Two opposite realities, one flattering number.

So: if zero PRs in the window carry a `CHANGES_REQUESTED`, do **not** print a first-pass rate. Print `not computable — team does not use the CHANGES_REQUESTED state` and lead with review coverage instead. Before blaming the data, confirm `gh` is returning reviews at all by spot-checking one PR you know was approved (`gh pr view <n> --json reviews`) — an empty array everywhere can mean a broken query rather than an unreviewed repo, and those need opposite responses.

**Never filter bots by login suffix.** Use `.user.type`. GitHub Copilot files its review under `copilot-pull-request-reviewer[bot]` but authors its inline comments as plain `Copilot`, which sails through a suffix check and gets counted as a person. That single mistake turned a real 9/25 human-review figure into a reassuring 21/25 on a repo whose review gap was the finding. `user.type` is `"Bot"` for both identities.

```bash
gh api "repos/$OWNER/$REPO/pulls/$N/comments" -q '[.[] | select(.user.type=="User")] | length'
```

Bot review is worth counting — separately, never folded into the human number. A repo where bots review everything and humans review little is a different situation from one with no review at all, and both differ from thorough human review; one figure cannot say which you're looking at. Deploy bots (`vercel[bot]`, `cloudflare-workers-and-pages[bot]`) are not reviewers at all and belong in neither column.

If a configured reviewer is paused, absent, or stale, give it a line. An automated reviewer reporting *"reviews are paused for this user"* on the repo with the highest fix share is a finding, not a footnote.
| Stage-artifact lag | `git log --diff-filter=A --format=%aI` over `docs/intent/`, `docs/prds/`, `docs/plans/`, then the first code commit citing that slug. Report the gaps | Measures the dev-flow chain itself; only meaningful on repos that use it |

**Lagging** — the ones that actually tell you whether the process is working:

| Metric | How to derive | Note |
|---|---|---|
| Spec churn after build | commits touching `docs/prds/NNNN-<slug>.md` dated **after** the first code commit for that slug | Proxy. High churn means to-prd ran on thin context |
| Caught vs escaped | `fix:` commits on a branch **before** its PR merged (caught) vs `fix:` commits landing after a merge that touch files the merge introduced (escaped) | Proxy, and the softest one — conventional-commit discipline is the only signal available. Say so |
| Repeat classes | run `sentinel`'s scanner — `py -3 ~/.claude/skills/sentinel/scripts/scan_git_signals.py --repo . --since <window>` — and report its `recurring` bucket | Proxy for "same incident twice". Don't hand-roll this: a raw fix-count ranking is dominated by locale catalogs and same-day iteration, which is why that scanner buckets against the repo's own distribution. A file recurring three windows running is the finding, not the count |

Output shape:

```
## Flow metrics
- Review coverage: human 9/25, bot 25/25, unreviewed 0/25
- Rework: median 3 inline comments/PR, worst #482 at 11
- First-pass merge: not computable — no PR used CHANGES_REQUESTED this window
- Artifact lag: intent → PRD 2h, PRD → plan 1d, plan → first commit 3h
- Spec churn after build: 1 PRD amended post-code (#0012 payments-retry)
- Caught vs escaped [proxy]: fix share 0.09, 0 reverts
- Repeat classes [proxy]: `src/api/orders.ts` 8x over 19d (sentinel, recurring)
```

Rules: never invent a figure to fill a row — drop the row and say which data was unavailable. Never present a proxy without its `[proxy]` tag. Trend beats level; a single window's number is close to meaningless, so when prior `--doc` reports exist in `docDir`, read the last one and show the delta.

## Time window

Used by standup mode (quick mode uses its scope flags). "Yesterday" = **last working day**, window ends **now** (captures work done earlier today):

- Monday → previous Friday 00:00
- Tue–Fri → previous calendar day 00:00
- Sat/Sun → most recent Friday 00:00

Every temporal claim must trace to a real timestamp from git / GitHub / MCP. Never invent a weekday or time.

## Voice and tone

A report is a formal record of work, not personal narration. The subject of every sentence is the change, the system, or the outcome. The author does not appear.

**Banned in report prose, bullets, and the channel block.** No grammatical person at all, in any of the three:

- **First person**, singular or plural: `I`, `me`, `my`, `mine`, `we`, `us`, `our`. This covers the soft forms that slip past a pronoun search: "worked on", "took a look at", "got it working", "spent the morning on".
- **Second person**, addressing the reader: `you`, `your`, `yours`. At `client`, name the capability rather than the reader.
- **Third person** standing in for a human: `he`, `she`, `they`, `him`, `her`, `them`, `his`, `their`, plus a person's name used as a sentence subject ("Matheus reviewed three PRs"). `they` referring to a system, a set of PRs, or a batch of commits is fine; `they` referring to people is not.
- Conversational filler and hedges: "just", "basically", "a bit of", "quick fix", "went ahead and", "some cleanup".
- Self-assessment: "solid progress", "good day", "happy with how this turned out". State what changed; the reader draws the conclusion.

Rewrites:

| Instead of | Write |
| --- | --- |
| "I fixed the JWT expiry off-by-one" | "Fixed the JWT expiry off-by-one" |
| "We shipped the exports endpoint" | "The exports endpoint shipped" |
| "I reviewed three PRs" | "Three PRs reviewed" |
| "Matheus reviewed three PRs" | "Three PRs reviewed" |
| "He left comments on the retry logic" | "The retry logic drew review comments" |
| "I'm still working on the cache rewrite" | "The cache rewrite remains open" |
| "I couldn't finish the migration, staging was down" | "The migration did not land; staging was unavailable" |
| "You can now export your data" | "Data export is now available" |

Three constructions carry the whole skill. Pick whichever reads cleanest per sentence:

1. **Verb-first, actor elided:** "Fixed the image cache eviction." The default for bullets.
2. **The change as subject:** "The exports endpoint now streams its response." The default for prose.
3. **Deliberate passive:** "Three PRs were reviewed." Passive voice is usually a smell, but here it is the right tool for keeping the author out of the sentence. Use it where an agentless active form would contort.

Paragraph prose (`## Report`, `## Yesterday`, `## Recap`) follows the same rule. An impact paragraph describes what changed about the system, so it rarely needs a human in it at all. Where a handoff or a dependency is the actual news, name the **team, role, or surface**, never an individual: "blocked on platform review", "the approach was settled with the API owner", "awaiting review from the design-system team". A person's name appears only where the report would be wrong without it, and is never followed by a pronoun.

Quoted material is data, not prose: a commit subject, ticket title, or PR title carried through verbatim is never rewritten to fit this voice.

## Discretion about the prior state

Every fix carries two facts: what is true now, and what was broken before. The second one is internal. A client who reads *"now it actually saves; before, it pretended to save but never really did"* has learned two things, and only one of them was the point. The other is that the product was broken, that someone knew, and that it is being narrated to them in a joking register.

**At `client`: state the current behavior. Never narrate the prior defect.**

| Do not write | Write |
| --- | --- |
| "Now it actually saves; before it pretended to save but never really did" | "Saving is reliable" |
| "Fixed the bug that was losing uploads" | "Uploads complete reliably" |
| "Totals had been wrong since launch, now corrected" | "Order totals are accurate" |
| "Login was broken for two days" | "Login is stable" |
| "Finally got the export working properly" | "Data export is available" |

Rules at `client`:

- **No before/after contrast.** One clause about the present, not a comparison against a broken past. "Saving is reliable" beats "saving works now, it didn't before".
- **No defect scope or duration.** Never state how long something was broken, how many users it reached, or that it shipped that way.
- **No informality about a failure, and never a joke about one.** "actually", "finally", "for real this time", "pretended to", "was a mess", "turns out" are all out. Dry beats funny: a defect is not a punchline, and the informal register is what makes the confession sting.
- **No apology or self-blame in the report body.** A bullet that apologizes raises a question the bullet cannot answer, and the report is the wrong channel for it.
- Consequently a fix and a new feature read alike at `client`, both as plain statements of present capability. That flattening is intended.

A soft comparative about a benefit the client actually feels is still fine: "orders load faster", "the dashboard runs more smoothly". What is banned is naming the defect, its duration, or its blast radius.

**At `pm`: name the prior state once, neutrally.** A PM has to triage and genuinely needs to know something was wrong. "Fixed a bug where saves failed silently" is right. "Saves were completely broken and had been for weeks" is not. One clause, no severity theatre, no duration unless asked.

**At `dev`: the prior state is the substance.** Root cause, the wrong behavior, and the mechanism all belong in the report.

None of this licenses hiding a fix or dropping a commit. Every commit still appears at every audience ([Audience map](#audience-map)); what changes is that the client cut names the outcome and leaves the postmortem inside.

## Audience map

| Concept                    | dev                                                     | pm                                              | client                              |
| -------------------------- | ------------------------------------------------------- | ----------------------------------------------- | ----------------------------------- |
| `useEffect` cleanup leak   | "fixed memory leak in `useEffect` cleanup on Dashboard" | "fixed memory leak in dashboard"                | "the dashboard runs more smoothly"  |
| DB index added             | "added btree index on `orders.user_id`"                 | "sped up order lookups"                         | "orders load faster"                |
| Pure refactor, no UX delta | "extracted `AuthGuard` HOC, dedup in 4 routes"          | "cleaned up auth code for maintainability"      | "ongoing work to keep the platform stable" |
| Auth bug                   | "fixed JWT expiry off-by-one in `validateToken`"        | "fixed login bug where sessions expired early"  | "login is more reliable"            |
| New endpoint               | "added `POST /api/exports` with stream response"        | "shipped exports endpoint for the export flow"  | "data export is now available"      |

Rules per level:

- **dev**: backticks for files/functions/symbols. Short SHAs in parens, e.g. `(a3f2c1d)`. May mention internals. *(Not the channel block — see Delivery.)*
- **pm**: no SHAs, no file paths, no function names. Frame as features / fixes / improvements / cleanup. Light tech terms OK ("API", "auth flow", "caching"). The prior state gets one neutral clause, no more ([Discretion](#discretion-about-the-prior-state)).
- **client**: outcomes only. No tech terms, no internal names. Name the capability rather than addressing the reader: "data export is now available", not "you can now export your data". State present behavior and never narrate what was broken before ([Discretion](#discretion-about-the-prior-state)). Include every commit; frame refactor/chore/test work as softened reliability statements ("ongoing improvements", "internal work to keep the platform stable", "groundwork for upcoming features"). Never drop commits silently.

## Output formats

### quick format
```
## Report
<prose, impersonal, level-appropriate. dev ≈ 2 short paragraphs; pm ≈ 1 paragraph (~120 words); client ≈ 1 paragraph (~80 words)>

## Bullets
- <shipped change, verb-first with the actor elided, level-vocab>   (5–8 items; 1–2 for a single commit)

## For the channel
<theme line>
- <outcome>
```

### standup format
```
# Standup: {DATE}
> Covering: {WINDOW} | {COUNTS}

## Yesterday
<2–3 sentence impact paragraph: what changed about the system, which teams are unblocked, what risk surfaced. No actor in the sentence.>

## Recap
<2–5 paragraphs, grouped by work thread (not by source). Lead with system impact, name root causes, reframe reviews as judgment calls, state what did not ship and why. Vary sentence openings: with the actor elided, the failure mode is every sentence starting with the same verb.>

## Today
<carry-overs → pending reviews → queue; capped at 5>

## For the channel
<theme line>
- <outcome>

## Refs
<footnote: ticket IDs and PR links>
```

The channel block is the only part printed when neither a doc nor the full body is wanted — but by default print the full mode format followed by the channel block. `--doc` writes the full body to file; the channel block is still printed to chat.

## Edge cases

- **No commits / no activity in window** → say so plainly ("quiet day, nothing landed in code" beats fabricated activity); suggest widening (`--last today`, `--last week`, or `--standup` for cross-repo work).
- **quick `--since-mine` + HEAD not user's** → fall back to `--last today`, prepend: *"HEAD is not authored by the configured user; showing today's commits instead."*
- **Mixed merge commits** → skip by default; include only with `dev --include-merges`.
- **Single commit** → still produce Report + Bullets + channel block (Bullets may be 1–2 items).
- **Repo not initialized / outside repo** → quick mode bails with a clear error; standup mode can still run from `localRepoRoots` + GitHub if configured.
- **standup with missing config** → run first-run setup, don't guess.
- **A standup source errors** → skip it silently; a partial report beats a failure.
- **Commit body / PR body contains secrets/tokens** → surface only subject + summarized intent, never raw body.
- **`--doc` target dir doesn't exist** → create it, then write.

## Output rules

- Every run ends with the `## For the channel` block. In quick and standup mode the full format precedes it.
- Channel block is outcome-only: no SHAs, no file paths, no function names, at any audience.
- Formal, agentless voice in every section at every audience: no personal pronoun in any of the three persons, no human as a sentence subject, no self-assessment. See [Voice and tone](#voice-and-tone).
- At `client`, state present behavior only: no before/after contrast, no defect duration or scope, no jokes about a failure. At `pm`, one neutral clause about the prior state. See [Discretion](#discretion-about-the-prior-state).
- Run the `humanizer` pass whenever that skill is available, then re-check its output against both voice rules. See [Humanize the prose](#humanize-the-prose-always-when-available).
- No emoji.
- Code/file refs in backticks at `dev` only, and never in the channel block.
- No commit hashes in `pm` / `client`.
- Never invent timestamps, weekdays, or activity. Every claim traces to real data.
- Caveman mode does NOT apply to report content — write full, formal prose. Commands/code stay verbatim.

## Humanize the prose (always, when available)

If the `humanizer` skill is installed, **always** run it on the drafted prose before delivering: both modes, both deliveries, every audience. That means the `## Report` / `## Yesterday` / `## Recap` paragraphs, the bullets, and the channel block, not only a `--doc` body. Skip silently when the skill is unavailable; never block a report on it.

Scope it to human-facing prose. Never run it over code, frontmatter, file paths, SHAs, ticket IDs, commit subjects or PR titles quoted verbatim, the flow-metrics figures, or the literal section headers.

**Both voice rules outrank it, and they are the reason it needs a leash.** A humanizing pass loosens stiff prose by reaching for contractions, a personal voice, and a conversational register, which is exactly the combination this report must not carry. Pass the constraints in with the text:

- No grammatical person, in any of the three ([Voice and tone](#voice-and-tone)).
- At `pm` and `client`, no added informality, and no restoring the prior-state narration the audience cut removed ([Discretion](#discretion-about-the-prior-state)). "It actually saves now" is the shape a humanizer will happily produce from "saving is reliable".

Then verify rather than trust: re-read the returned body and revert any pronoun, any joke, and any before/after contrast the pass introduced. A humanized report that reads warmly and says "we finally fixed it" has failed, not succeeded.
