---
name: answer
description: Write an answer document, review it with the agent or skill configured in Guard's answer_review setting, and deliver the corrected file.
argument-hint: '<question>'
disable-model-invocation: true
---

# Answer as a reviewed document

Use the question supplied in the user's invocation. If it is missing, ask for it. This
workflow creates a document the user can keep; an ordinary response does not enter it.
The configured reviewer owns all review criteria.

## 1. Check the reviewer before writing

Resolve `scripts/review.py` relative to this `SKILL.md`. Run its concrete path through
`uv run --script`, passing the current host and absolute target project root:

```text
uv run --script <review-script> --host <claude|codex> --project <project-root>
```

Quote paths as shell arguments. Read the JSON result. On `status: no_reviewer`, explain that
`answer_review` must name the user's installed agent or skill, and stop before drafting.
On an error, report it and stop. `status: review` supplies the exact reviewer and `answer_dir`.
If that named reviewer cannot be invoked on this host, report it and stop.

## 2. Write the answer in English

Create a Markdown file in the returned `answer_dir`, named `<YYYY-MM-DD>-<short-slug>.md`.
Use a short lowercase, hyphenated slug from the question. Add `-2`, `-3`, and so on if the
name already exists; never overwrite an earlier answer.

Write the full substance: findings, evidence, recommendations and uncertainty. Cite sources
as you write and verify repository claims against the code. Use the available research tools
to verify external claims. The file is the answer, not a record or summary of one.

English is the drafting language; the existing translation step follows review. Do not
present the draft as the finished deliverable.

## 3. Run the configured review

Run the helper again with the answer file's absolute path:

```text
uv run --script <review-script> <answer-path> --host <claude|codex> --project <project-root>
```

Stop on an error or a missing reviewer. Invoke exactly the returned `reviewer.name` as its
returned `reviewer.kind`, using the host's supported named invocation mechanism. Pass the
resolved `document_path`. Explain that this is a standalone document and findings must be
returned in the reviewer's reply without modifying the file. The reviewer supplies the
criteria; do not add a built-in checklist or other auditors.

Preserve the configured name. Do not add a prefix, substitute a built-in reviewer, invent
mention syntax, or copy its instructions into a generic agent. Do not review the document
yourself if the named reviewer is unavailable. Wait for the completed report. If review
fails or is interrupted, report that the draft remains unreviewed; do not claim completion.

## 4. Apply findings

Apply findings within the user's requested scope to the English document. Identify any
finding left unapplied and why. Surface decisions belonging to the user before adopting
them. Do not implement project changes as part of an answer review.

If you applied findings, ask the same configured reviewer to check the revised document
once more, then apply that report within the same scope. Stop after this second round;
there is no additional automatic review loop. If a blocking question or failed review
remains, report it and the draft's status rather than claiming a completed review.

## 5. Translate for a Korean reader

When the user reads Korean, invoke the installed user-level `korean-translator` agent with
the corrected English file and a sibling destination with `.ko` before the extension.
Use its native name without a `guard:` prefix and follow its report. Translate only after
review so the user receives a translation of the corrected document.

If that named translator is unavailable, deliver the reviewed English file and explain
that translation was not completed. Do not substitute another agent or silently translate
it yourself. For a reader using another non-English language, state that this workflow
provides only the English document and the Korean translation path.

## 6. Deliver

Reply in the user's language with the file path and a brief account of the review's findings
and corrections. A clean review needs one short confirmation. Do not paste or summarize the
whole document, write a separate findings file, or claim any review that did not finish.

Open the completed reader-facing file once with the platform's usual file-opening command.
