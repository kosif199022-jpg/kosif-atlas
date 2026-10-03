# Similar Systems Research

Use this procedure when at least three use cases have been confirmed
in the session and the user wants to ground further discovery in how
similar systems handle the same problem. The output is a workflow
`research` issue, optionally followed by a curated knowledge research
report once findings stabilize. The skill never drafts the curated
report itself — that flow lives in a separate session per the
`research` knowledge authoring contract.

## When to dispatch

Trigger this procedure when the user explicitly asks for similar-
system evidence (e.g., "what do existing tools do for this?",
"compare X and Y", "find prior art"). Do **not** trigger
automatically. Research is time-boxed investigation; the use cases
must already be concrete enough that the research question is
specific.

Skip this procedure when the next step is exploratory code (use a
`spike` issue) or when the answer is already known (write a `spec`).
The **When research is warranted** section of the `research`
authoring contract is the contract.

## Procedure

1. **Frame the research question with the user.** One question per
   research issue. Decide whether it compares alternatives:

   - Comparing two or more named options — capture the option list.
   - Investigating one topic in depth — no option list needed.

2. **Resolve `research` authoring.** Call:

   ```bash
   spectrack mustread --type research --side issue
   ```

   The resolver returns the issue-side body shape (`Description`,
   `Research Question`, `Options` when comparing alternatives, optional
   `Scope`, `Sources To Check`).

3. **Publish the research issue.** Draft the body under
   `$(spectrack project-dir .spectrack-cache/usecase-research/<slug>.md)` and publish via
   `spectrack issue new --type research`. Pass:

   - `--title` — short question phrase ("Compare meeting-summary
     tools for 5-person teams").
   - `--body-file` — the temp body file.
   - `--assignee me` by default.
   - Relate the research to every use case it informs — via the
     backend's related link where it exposes one (`--related
     <usecase-ref>`, repeat per ref; run `spectrack issue new --help`),
     otherwise by listing the use case refs in the research issue's
     Related body section.

4. **Decide whether this session runs the research.** Two paths:

   - **Defer** — leave the `research` issue open with `Sources To
     Check` populated. The user picks it up in a separate session
     using whichever entry point fits their flow (the workflow
     plugin does not currently ship a dedicated research-execution
     skill). Add a task `"Research: <topic>"` and mark it completed
     once the issue is published; the work continues elsewhere.
   - **Run inline** — fall through to step 5. Only do this when the
     user explicitly asks the skill to drive the investigation
     itself.

5. **Run inline (optional).** When running inline, use `WebSearch`
   and `WebFetch` to gather evidence. Append each batch of findings
   as a comment on the `research` issue via `spectrack issue comment`. Keep raw
   notes in comments, not in the body — the body stays scoped to the
   research question and current state. **Stay decision-neutral**:
   record evidence, not prescriptions. See **Decision neutrality**
   in the `research` authoring contract.

6. **Reflect findings back into use cases.** When the research
   surfaces a pattern the use cases should adopt (a new actor, a
   different flow shape, an unstated NFR), do **not** edit the use
   case bodies silently. Re-open the discovery loop with the user
   and let progressive extraction produce the updated draft.

## Anti-patterns

- Dispatching research before three use cases exist. The research
  question is rarely concrete enough before then.
- Letting the research issue make decisions ("therefore we should
  use X"). Decisions go in `spec` issues; research records evidence.
- Drafting the curated knowledge research report in this session.
  The publishing rule in the `research` knowledge authoring contract
  keeps the report separate from the discovery flow.
- Stuffing all option evidence into a single comment. Split by
  option or by source so the timeline reads cleanly.
