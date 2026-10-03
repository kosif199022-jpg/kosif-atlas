---
title: Prior User File Context
description: When and how to use prior user files as reusable context for workflow outputs.
---

# Prior User File Context

Use this reference when prior user-visible files can materially improve a workflow output. Prior files are context, examples, templates, or source material. They are not proof of current GovTribe facts unless refreshed against current GovTribe or government records.

## Use prior files when they clearly help
- The user asks to reuse, adapt, remix, compare, or continue from an earlier file, deliverable, template, proposal, deck, workbook, or generated output.
- The task needs company-specific language, approved boilerplate, capability statements, past performance summaries, pricing notes, BOE templates, proposal outlines, debrief notes, market analyses, certifications, or reusable charts.
- The user asks for the same format, style, section structure, table layout, voice, or visual treatment as a previous deliverable.
- The workflow needs internal company fit evidence, past performance examples, or reusable proposal/capture/pricing material that GovTribe records alone cannot provide.

## Do not search prior files by default
- Do not use user files for ordinary GovTribe record lookup, quick factual answers, simple market searches, status checks, or smalltalk.
- Do not use user files just because the task uses GovTribe search or returns a list, ranking, summary, or chart.
- Do not use stale user files as the source of current opportunity status, award values, due dates, amendments, or government record facts.
- Do not search broadly when current conversation files or explicit attachments are already enough.

## Provenance and expansion
- Prefer files from the current user, current conversation, explicit attachments, or files clearly named by the user.
- Broaden to workspace-visible or team-created files only when shared prior work is useful for the task, such as account boilerplate, team proposal templates, or reusable past performance libraries.
- Make the provenance distinction clear when it affects trust, authorship, style, or whether the user should confirm reuse rights.
- If multiple plausible files match, ask one focused clarification or present the best candidates before remixing.

## How to use retrieved files
- For workspace-visible prior files, start with `Search_User_Files` metadata and `content_snippet`. For explicit current-conversation attachments, use the external host's ordinary attachment capability when available.
- When exact wording, section structure, or source language materially changes the result, stage the smallest supported file set with `Add_To_Vector_Store`, wait until it is ready, and query it with `Search_Vector_Store`.
- Cite returned source metadata with the external host's native citation format. If a material spreadsheet or unsupported attachment is skipped, use the host's spreadsheet or attachment capability; when none exists, provide a labeled Markdown table, CSV, or partial result and disclose the gap.
- Refresh material facts with current GovTribe or government-record retrieval before presenting them as current.
- If no relevant file is found, continue from current evidence and say that no prior reusable file was found when that matters to the answer.
