---
title: Draft Response and Fill Template
description: Draft source-grounded RFI, RFQ, capability, project-plan, and other proposal responses, then populate user-provided templates without losing structure or prior edits.
---

# Draft Response and Fill Template

Use this reference for asks such as "create an RFI response based on the attached," "how do I respond to this," "draft a project plan," "use this template," or "fill this out too."

## Goal

- Recover the active solicitation, RFI, RFQ, request, or pursuit from the current thread and attached files.
- Determine the exact response package the buyer expects.
- Draft a persuasive but source-grounded response using known company context.
- Populate the requested Word, spreadsheet, PDF, survey, or other template while preserving its required structure.
- Support iterative follow-ups without restarting the analysis or discarding accepted user edits.

## Context recovery

Before asking the user to repeat information, inspect:

- the active GovTribe record or pursuit in the conversation
- attached solicitation, PWS/SOW, survey, instructions, amendments, and Q&A files
- company context already provided in the thread or available from permitted user context
- prior draft artifacts and templates in the same workflow
- requested delivery format and any previous formatting decisions

A terse prompt is sufficient when "this," the target record, and the source files resolve cleanly. Ask one bounded clarification only when multiple possible targets or output formats remain.

Use `Search_GovTribe`, `Search_Federal_Contract_Opportunities`, or `Search_Pursuits` to resolve the active record. Use `Search_Government_Files` and `Search_User_Files` for source and reusable files. When exact file text controls the response, call `Add_To_Vector_Store`, wait for readiness, and use focused `Search_Vector_Store` queries. Cite returned source metadata through the external host's native citation format.

## Source priority

Use this order when sources conflict:

1. latest conformed solicitation, RFI/RFQ, amendment, and Q&A
2. buyer-provided response form, survey, workbook, or template
3. PWS, SOW, SOO, attachments, exhibits, and submission instructions
4. verified GovTribe opportunity, pursuit, agency, vehicle, and vendor context
5. company-provided facts, approved boilerplate, capability statements, and past performance
6. clearly labeled assumptions or drafting recommendations

Do not invent company capabilities, past performance, certifications, staffing, pricing, or commitments to complete a template.

## Workflow

### 1. Resolve the artifact intent

Classify the request as one or more of:

- response strategy or "how should we respond"
- RFI or sources-sought response
- RFQ or capability response
- cover letter or submission email
- project or management plan
- questionnaire, survey, information sheet, or form completion
- buyer-provided template population
- revision of an existing draft

### 2. Build the response requirement map

Extract:

- questions and requested topics
- page, word, file, and formatting constraints
- required forms, attachments, and representations
- evaluation or market-research signals
- submission instructions and deadlines
- company evidence needed for each response section
- unresolved questions, assumptions, and approval points

Use exact source language where compliance depends on wording.

### 3. Draft the response package

- Match the buyer's requested order and terminology.
- Lead with direct answers before supporting narrative.
- Tailor the response to the user's company, role, market, and known differentiators without overstating them.
- Keep claims traceable to company-provided or retrieved evidence.
- Include caveats or placeholders for information the user must confirm.
- When useful, deliver a coordinated package such as cover letter, narrative, survey answers, information sheet, checklist, and submission email.

### 4. Populate the template faithfully

- Preserve required headings, tables, fields, sheet names, page layout, and file type.
- Fill existing fields rather than recreating a different document unless the source template is unusable.
- Keep blank or uncertain fields visibly marked for review instead of fabricating answers.
- Retain previously accepted user edits during follow-up revisions.
- Use the external host's provider-neutral document, spreadsheet, PDF, or presentation capability for artifact construction and render validation. If unavailable, deliver the validated Markdown, CSV, or JSON source artifact and state what was not rendered or visually verified.

### 5. Support iterative completion

Treat follow-ups such as "provide this as a Word document," "use this template," or "fill this out too" as continuation of the same proposal workflow. Reuse the established source inventory, response requirements, company context, and approved draft language.

## Output contract

Return:

1. completed response artifact or artifacts
2. concise submission-readiness summary
3. assumptions and user-confirmation items
4. missing evidence or source files
5. final compliance and formatting checks

For advisory-only asks, return a prioritized response strategy and section outline rather than forcing a full document.

## Boundary rules

- Route capture-only qualification or bid/no-bid questions to an appropriate capture workflow.
- Route unresolved staffing, rates, FTEs, wrap assumptions, or price evidence to an appropriate pricing workflow.
- A request to extract one fact from a document is file retrieval, not this workflow.
- A generic solicitation summary is not enough when the user requested a completed response or populated template.
