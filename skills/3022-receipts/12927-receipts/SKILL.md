---
name: receipts
description: Show me the receipts. Answers "why is the code like this?" (design rationale, a threshold, a workaround, a regression, dead code) by sending one investigator per evidence source (git and PRs, ticket tracker, docs, team chat, monitoring, error tracking, analytics) in parallel, then a synthesizer that returns a cited answer with direct evidence kept apart from guesses. Use only when the user invokes /receipts by name, e.g. "/receipts why do we retry 3 times in fetchPrices?". For how code works, use /lore.
model: sonnet
disable-model-invocation: true
---

# /receipts <why question>

Find out why code is shaped the way it is, from the written record, not from reading the code and guessing. Read-only: never edit files, commit, push, post comments, or change anything outside this session.

## 1. Pin down the question

The **target** is a piece of code, a pattern, a value, or a named decision. The **question** is why it exists or looks like this. If the user was vague, take your best guess from the conversation, state it in one line so they can redirect, and carry on.

If the question carries a guess ("I assume it's for performance?"), treat that guess as one candidate to check, not the answer.

## 2. Build the code anchor

Before spawning anyone, collect concrete starting points yourself:

```bash
git blame -L <start>,<end> <file>          # last-touch commits for the lines
git log --follow --oneline -20 -- <file>   # recent history, PR numbers in subjects
git log -1 --format=%B <commit>            # full message: PR and ticket IDs
```

Pull the PR for each substantive commit (GitHub tools or `gh pr view <n> --json title,body,comments,reviews`).

The anchor is: file paths with line ranges, key symbols, the commit list (newest first), PR numbers, and any ticket keys found in commits or PR bodies.

## 3. Map the evidence sources

List the tools and MCP connectors this session actually has, and match each to one category:

1. Source control (git, PRs). Always available.
2. Issue / ticket tracker (Jira, Linear, GitHub Issues, ...)
3. Long-form docs (Confluence, Notion, Google Drive, ...)
4. Team chat (Slack, Teams, Discord, ...)
5. Infrastructure observability (Datadog, Grafana, CloudWatch, ...)
6. Error tracking (Sentry, Rollbar, ...)
7. Analytics / data warehouse (BigQuery, Snowflake, Databricks, ...)

A category with no connector is a **gap**, not a choice: record it for the final answer.

## 4. Spawn the investigators, all in one message

One `receipts:investigator` sub agent per category that has a connector, all launched in the same message so they run in parallel. Never give one investigator two sources.

Each investigator's prompt contains:
- The user's question, word for word
- The code anchor from step 2
- Its one assigned source and which tools or connector to use for it
- For the source control investigator: "Read `references/source-control.md` in this skill's directory" (give the absolute path)
- If the target looks defensive (retries, timeouts, null guards, rate limits, feature flags, fallbacks): "Also hunt incident history in your source: postmortems, incident tickets or channels, error spikes around the date this code landed."

Skip a category only for a written reason that goes in the final answer: no connector, or provably irrelevant (e.g. no runtime code path for error tracking). If the whole answer is already in one PR description, you may answer inline, but say so.

## 5. Synthesize

Spawn one `receipts:synthesizer` sub agent with: the question, the code anchor, every investigator's full findings (including empty ones), and the list of skipped sources with reasons.

## 6. Present

Show the synthesizer's answer. Light edits for clarity are fine; never strengthen its confidence wording.

If the user is asking "why" because they want to change this code, finish with a short **Preserve / Change / Avoid / Risk** list drawn from the findings.

## Rules

- Code is evidence of what it does, never of why. Intent needs someone having written it down.
- An honest "we don't know, and here is exactly what we searched" beats a confident guess.
- Cost: this can start up to 8 sub agents. For a quick lookup, just answer directly.
- Never put an em dash (the long dash) in the output. Use a comma, colon, full stop or brackets instead.

Adapted from the `why` skill in [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan (MIT, see `LICENSE-pstack`).
