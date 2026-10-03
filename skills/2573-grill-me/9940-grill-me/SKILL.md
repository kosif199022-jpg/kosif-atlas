---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree, then emitting a Design Notes + Glossary + edge-case block and persisting it to docs/intent/NNNN-<slug>.md for handoff to /to-prd. Use when user wants to stress-test a plan, get grilled on their design, do a pre-PRD design review, challenge an idea before writing it up, or mentions "grill me" or runs /grill-me.
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the decision tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer (with brief reasoning); skip the recommendation only when the codebase or my prior answers haven't given you enough signal.

## Rules of engagement

- **One question at a time.** One decision per turn: no multi-part dumps, no trailing "Also: ...?", and no second decision folded into the closing line ("Which do you want, and should X...?"). A second question in the same turn splits the user's answer and one of them gets skipped. Before sending, count the decisions you are asking the user to make; if it is more than one, cut every one but the first and hold the rest for later turns.
- **Codebase first.** If a question can be answered by reading the repo, read it instead of asking.
- **ADR awareness.** Scan `docs/adr/` before grilling. Don't relitigate settled architectural decisions; treat ADRs as locked inputs and grill *around* them.
- **Converge.** Stop when every major branch of the decision tree has either a resolved decision or an explicit `OPEN` marker. Cap: ~20 questions per session unless I ask to keep going.
- **OPEN markers.** If a branch can't be resolved (I defer, codebase silent, needs external input), record it as `OPEN: <question>` and move on. Don't loop.
- **Edge cases survive the session.** Anything surfaced by lenses 6-7 goes in the `## Edge cases` output block with its decision, even when the decision is "won't". Discussed-then-dropped is how a case reaches production unhandled — the block is what `blueprint` turns into its Edge Cases table.

## Questioning lens

Drive questions through these angles, in roughly this order. Skip ones that don't apply.

1. **Scope** — what's in, what's out, what's deferred.
2. **Actors + user stories** — who triggers this, what do they expect.
3. **Domain vocabulary** — see "Capture the domain vocabulary" below.
4. **Data shape** — entities, relations, identity, lifecycle, persistence.
5. **Boundaries + integrations** — which subsystems / services / external APIs are touched, sync vs async.
6. **Failure modes** — what breaks, what's transient vs fatal, retry policy, idempotency.
7. **Edge cases** — empty states, max sizes, concurrency, race conditions, duplicates.
8. **Security + auth** — who's allowed, what they see, attack surface, PII handling.
9. **Performance + scale** — expected volume, p95 latency targets, hot paths.
10. **Observability** — what gets logged / metered / traced, alert thresholds.
11. **Rollback + migration** — how to undo, schema reversibility, feature-flag plan.
12. **Testability** — what's testable end-to-end, what needs mocks, prior test patterns to mirror.

## Capture the domain vocabulary

While interviewing, build a **ubiquitous language** for this feature — the shared terms used by the business, the user, and the code. Rules:

- When the user names an entity, action, or concept (e.g., "order", "checkout", "subscription"), note the exact word. Don't paraphrase.
- When generic words appear ("the thing", "this object", "the record"), ask: "What does the business call this?" Force a real term.
- When two terms seem to overlap ("user" vs "customer", "cart" vs "order"), ask which is which and where the boundary is — that's a bounded-context signal.
- Capture aliases too: if devs say `OrderItem` and the business says "line", record both and pick one as canonical.

## Output

At end of session (or when I say "wrap it up"), emit this block **and commit it to disk**:

- **Path**: `bash scripts/next-intent-index.sh <slug>` prints the zero-padded target (`docs/intent/NNNN-<slug>.md`) and creates the directory if missing. `<slug>` = short kebab feature name.
- **Also print the block in chat**, so the conversation can carry straight into `/to-prd` without a file read.

Writing it down is the point. The Glossary and the edge-case decisions are load-bearing for every stage after this one, and until now they lived only in conversation scrollback — one compaction or one closed session and `to-prd` is synthesizing from thinner context than the interview actually produced, or halting. A numbered file makes the interview an artifact the rest of the chain can read, diff, and review, the same way the PRD, ADR, and plan already are.

Skip the file only for a throwaway session the user says not to keep, and say that you skipped it.

```markdown
# Design Notes: <feature title>

- **Status**: draft | settled | superseded
- **Date**: YYYY-MM-DD
- **Slug**: <kebab-slug>

## Resolved decisions
- <decision>: <chosen option> — <one-line rationale>
- ...

## Open questions
- OPEN: <question> — <who/what needs to answer it>
- ...

## Edge cases
Every case raised by lenses 6 (failure modes) and 7 (edge cases), with the decision reached. `handle` = build it, `defer` = out of scope for now, `won't` = deliberately unsupported.

- <case> — handle | defer | won't. <one-line reason>
- ...

## Glossary
Term — definition. (aliases: <other names if any>)
...
```

This block is the handoff to `/to-prd`, which synthesizes it into a PRD and cites the intent file in its `Sources` line. Report the written path when you finish.

**Updating an existing intent.** If the user reopens a settled design, find the file by slug and amend it rather than minting a new index — a second file for the same feature splits the Glossary, which is exactly what this artifact exists to prevent. Edit-safe: `Status`, `Open questions`, adding resolved decisions or edge cases. Changing a `## Glossary` term after `to-prd` has consumed it needs an explicit OK, because blueprint and the implementing code are already using that word.

## When to skip grill-me

- Bug fix with obvious cause.
- Single-file change, no design tradeoffs.
- Spike / throwaway exploration.
- Design already settled in a PRD or ADR (read those instead).

## Pipeline placement

`grill-me → to-prd → compass → blueprint → code`

- **grill-me** (this skill) — stress-tests decision tree, extracts Glossary + OPEN questions.
- **to-prd** — synthesizes Design Notes into a PRD on disk + tracker.
- **compass** — locks architectural decisions in ADRs.
- **blueprint** — produces implementation plan.
- **code** — implement.

Skip earlier stages when the artifact already exists. grill-me is optional for small features but high-leverage for anything with non-obvious tradeoffs.

## Humanize the written prose (if available)

Before writing generated prose to a file, if the `humanizer` skill is installed, run it on the drafted text so the created document reads naturally and free of AI tells; skip silently if it is not available. Apply it to the human-facing document body only, never to code, frontmatter, file paths, IDs, or literal templates.
