---
name: handoff
description: "Wrap a workflow session: refresh in-flight issue Resume comments and capture residual session findings, gaps, or questions as review issues."
---

# Workflow Session Handoff

Leave durable continuation context for a fresh session that cannot see this conversation. Handoff state belongs at the issue provider; do not create a separate local handoff file.

## Core rules

- Refresh touched mid-flight issues before creating anything new. Each touched issue's current `Resume` comment should be enough for a fresh session to understand the current approach, waiting state, open questions, and next step.
- The `Resume` comment starts with the provider heading for Resume: `## Resume` on GitHub, `h2. Resume` on Jira. Refresh it with `spectrack issue comment resume`, which idempotently updates the existing Resume comment or creates it when missing — so repeated handoffs never leave duplicate Resume comments. Use separate comments only for narrative-worthy events such as decision pivots, blocker resolutions, or approach changes. Routine progress belongs in the refreshed `Resume` comment or nowhere.
- Publish `review` issues only for residual session-level findings, gaps, or questions that cannot be cleanly anchored to an existing issue body, comment, parent issue, or commit message.
- Resolve the relevant authoring contract from provider issue metadata before writing issue bodies or comments. Get user approval before provider mutations and respect freshness checks.
- Commit relevant non-handoff code changes only when they belong to this session, split by coherent meaning, and leave unrelated user changes untouched.

## Residual gate

Do not publish ceremonial review issues. Before creating one, ask whether a fresh session could continue from:

- the refreshed `Resume` comments and recent narrative comments for touched issues,
- related parent issue context, when a shared decision belongs there,
- `git status`, branch state, and relevant commit messages.

If that is enough, report that there is no session-level residual. If not, publish only the missing actionable concerns as `review` issues.

Non-triggers on their own:

- routine green validation,
- authoring contract reads,
- general guidance edits that future sessions auto-load,
- context rederivable from issue content and git history.

## Task

Wrap the session in this order: refresh touched issue Resume comments, add only necessary narrative comments, commit relevant non-handoff changes when appropriate, run the residual gate, publish review issues only for remaining residual concerns, and record verification outcomes.

When drafting provider content, keep it factual and durable. Do not paste or summarize issue bodies beyond what is needed for the new provider record. Reference related work with provider-native issue refs.

## Additional Requirements

Treat any extra constraints in the user's current request as part of the
handoff requirements.

## Output

Report only:

1. Pre-handoff commit SHA(s), or `skipped`.
2. Issue refs whose `Resume` comments and / or narrative comments were updated this session, or `none`.
3. Published review issue refs with one-line concern summaries, or `no session-level residual - no review issues published`.
4. One-line validation summary, or `none recorded`.

Do not restate review issue bodies or refreshed issue content in the output.
