---
name: lore
description: The lore of a subsystem. Explains how code works (runtime flow, architecture, where things live, gotchas) at the level of a senior engineer onboarding onto it. For big questions, parallel explorers each trace one slice, then an explainer merges them into one walkthrough. Use only when the user invokes /lore by name, e.g. "/lore how does the price refetch job work?". For why code is shaped a certain way, use /receipts.
model: sonnet
disable-model-invocation: true
---

# /lore <how question>

Explain how something in the codebase works: enough for a senior engineer to build a working mental model and start changing it, not an annotated dump of the source. Read-only: never edit files, commit or push.

## 1. Size the question

If the scope is unclear, state your reading in one line and carry on.

- **Simple** (one module, one function, a narrow question): go to step 2b.
- **Big** (a subsystem across several files or services, a cross-cutting feature, a whole architecture): go to step 2a.

When in doubt, take the simple path.

## 2a. Big: explore in parallel, then explain

Split the question into 2 to 4 distinct angles (for example: entry points and triggers, the data model, the external boundaries, error handling). Spawn one `lore:explorer` sub agent per angle, **all in one message** so they run in parallel. Each gets the user's question word for word and its one angle.

When they are all back, spawn one `lore:explainer` sub agent with the question and every explorer's full findings. Go to step 3.

## 2b. Simple: explain directly

Spawn one `lore:explainer` sub agent with the question and the note "no explorer findings: explore the code yourself first".

## 3. Present

Show the explainer's answer. Light edits for clarity or context from the conversation are fine; don't rewrite it.

## Rules

- If `graphify-out/graph.json` exists, tell the sub agents they can use `graphify query` to find their way around.
- Cost: a big question starts up to 5 sub agents. For a one-line answer, just answer directly.
- Never put an em dash (the long dash) in the output. Use a comma, colon, full stop or brackets instead.

Adapted from the `how` skill in [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan (MIT, see `LICENSE-pstack`).
