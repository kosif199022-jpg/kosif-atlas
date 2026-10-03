# Final Proposal Artifact Quality Checks

Use these checks before delivering proposal-development artifacts such as RFI/RFQ responses, technical proposal drafts, capability statements, cover letters, proposal rewrites, annotated outlines, compliance matrices, and proposal control workbooks.

## Source and compliance
- Confirm the artifact uses the latest known solicitation, amendment, Q&A, attachment, and GovTribe/customer context available.
- Preserve exact source wording for mandatory requirements, evaluation factors, submission instructions, page limits, formatting rules, and deliverable lists.
- Keep unsupported claims out of customer-ready text. Reframe them as assumptions, evidence gaps, or recommended proof points.
- Tie recommendations to source-linked evidence or clearly label them as proposal strategy.
- Carry partial-source limitations into the final summary instead of implying completeness.

## Proposal polish
- Use a professional section hierarchy that matches the expected customer workflow.
- Avoid raw prompt dumps, oversized matrices in portrait documents, default-template styling, and dense wall-of-text summaries.
- Keep tables narrow enough for rendered Markdown/PDF/DOCX output; move full row-level matrices to CSV/XLSX/JSON companions when needed.
- Check page-limit awareness before expanding content. Do not create drafts that would obviously violate known page or format controls.
- Remove placeholders, bracketed insert notes, temporary comments, internal paths, debug text, and model/tool identifiers.

## File-specific QA
- For workbook outputs, use the external host's spreadsheet render and visual QA capability.
- For Word-compatible outputs, use the external host's document render and visual QA capability.
- For PDF outputs, use the external host's PDF render and visual QA capability.
- For package outputs, review each file individually and then review the package as a whole for duplicate, stale, or contradictory artifacts.

When rendering or visual inspection is unavailable, deliver the validated source artifact plus a Markdown or CSV fallback, state what was not visually verified, and do not weaken the structural or content checks.

## Required outcome note
The final response should state the artifact type, the source basis, any known missing inputs, and the practical next action. It should not include internal QA mechanics.
