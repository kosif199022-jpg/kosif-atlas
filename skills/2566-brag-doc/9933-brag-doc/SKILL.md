---
name: brag-doc
description: >-
  Maintain a monthly brag document (accomplishment log) and roll it up into a promo packet, self-review, or CV material. Blends Lucas Faria's 4-field monthly template with Julia Evans' impact-first categories. Use when the user wants to log what they shipped, prep for a performance or promotion cycle, write a self-review, remember work from months ago, feed achievements to cv-craft, or runs /brag-doc. Modes: draft, example, review, compile. Targets: work (employment, any employer), side (public / side-project work).
---

# Brag Doc

Two living docs the user maintains:
- `projects/side/brag/<employer>.md` — employment, one file per employer (e.g. `acme.md`). For perf/promo cycles; shared with the manager.
- `projects/side/brag/side-projects.md` — public work (OSS, content, shipped apps). Feeds the 2026 job search and cv-craft.

Invocation: `/brag-doc <mode> [target]`. `target` is `work` or `side` — ask if the mode needs one and it's unclear. For `work`, resolve to the employer file in `projects/side/brag/`; ask which if more than one exists. (Personal skills take space-separated args, so `/brag-doc draft work`, not `:draft`.)

## Modes

### draft
Add this month's entry to the target doc. **Pull real signal first — never invent accomplishments.**
1. Gather evidence: `git log --author=<user> --since="1 month ago"`, recent PRs/tickets, this conversation, and for `side` the career plan at `projects/side/career-plan-90d.md`.
   **Also read `~/.claude/state/periscope/contributions.log.md` when it exists.** One line per approved contribution: `- <date> | <lens> | <link> | <what changed> | mandate: <behavior>`. These are *influence* entries — weighing in on someone else's PR, unblocking a stalled decision, proposing a convention across teams. **They have no commit behind them by design**, so `git log` cannot see them. Do not try to reconcile them against git history: nothing will match, and dropping them removes the highest-leverage work in the month. The approval gate that wrote each line already vetted it, so take it at face value and convert it to impact like any other item.
2. Fill the monthly template (see [TEMPLATE.md](TEMPLATE.md)) — four fields: shipped+impact, challenges, "would be much better if", next-month focus.
3. **Impact rule (Julia):** state it *exactly as good as it is* — no inflation, no hedging. Every "shipped" line names an outcome (who uses it, metric, $, time saved), not a task. For fuzzy work: goal → actions taken → observable effect. Mark any unverified number `[ESTIMADO]`.
4. Prepend the entry under a `## <Month Year>` header. Never overwrite past months.

### example
Show a filled monthly entry so the user sees the shape and bar. Read [EXAMPLE.md](EXAMPLE.md), display it, then offer to turn it into a real draft for their chosen target.

### review
Sharpen an existing entry the user points at. Line by line: task or impact? vague or specific? number or hand-wave? inflated or honest? Rewrite task→impact, flag unsupported claims, cut anything that oversells. Report the diffs and reasons — don't silently edit.

### compile
Roll N monthly entries into one output. Ask which and the date range, then produce:
- `promo` → promo packet / self-review organized by Julia's full categories (projects & impact, collaboration & mentorship, design & docs, company building, what I learned, outside of work). Pull the `periscope` contribution log for this range too. Influence entries land mostly under **collaboration & mentorship** and **company building** — the two categories a packet built only from commits leaves conspicuously empty, which is the gap that sinks a promo case.
- `cv` → hand the impact bullets to **cv-craft** as achievement source material.

## Method & sources
- **Lucas Faria** — monthly cadence (first of the month), the 4 fields, the "would be much better if…" unblock field, and *share it with your manager and ask for feedback on what's written* (makes their perf-review job easier, anchors the conversation on what happened).
- **Julia Evans** — impact over tasks, the category taxonomy, "make it sound exactly as good as it is", and that a running doc beats memory six months later. Original: https://jvns.ca/blog/brag-documents/

## Cadence
Monthly. For `work`, share with the manager after each entry. For `side`, the log is CV/portfolio source — keep it publishable.

## Humanize the written prose (if available)

Before writing generated prose to a file, if the `humanizer` skill is installed, run it on the drafted text so the created document reads naturally and free of AI tells; skip silently if it is not available. Apply it to the human-facing document body only, never to code, frontmatter, file paths, IDs, or literal templates.
