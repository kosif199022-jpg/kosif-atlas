---
name: markdown-proofreading
description:
  This skill should be used when the user asks to "proofread markdown", "check for typos", "fix grammar", "review markdown file", or requests proofreading
  markdown content for quality assurance.
---

# Markdown Proofreading

Proofread markdown files for typos, grammar, logic errors, and consistency issues.

## Workflow

### Step 1: Read the Markdown File

Read the provided markdown file completely to understand:

- Overall structure and organization
- Content quality and clarity
- Formatting consistency
- Link validity

### Step 2: Identify Issues

Check for the following categories of issues:

**Spelling and Grammar:**

- Typos and misspellings
- Grammar errors
- Punctuation issues
- Capitalization inconsistencies

**Consistency:**

- Formatting consistency (bold, italic, code blocks)
- Heading hierarchy
- Link formatting
- List formatting

**Logic and Clarity:**

- Unclear sentences or paragraphs
- Logical flow between sections
- Missing or incomplete information
- Confusing terminology

**Markdown Quality:**

- Properly formatted code blocks
- Correct link syntax
- Proper heading levels
- Table formatting (if present)

### Step 3: Propose Changes

Present identified issues to the user with:

- Location of the issue (section/line)
- Current text
- Suggested correction
- Reasoning for the change

### Step 4: Apply Corrections

After user approval, apply the proposed changes to the file.

## Important Rules

**Preserve file paths:** Never fix typos in filepaths, even if they appear incorrect:

- Image paths: `![image](/media/filename-with-typo.jpg)`
- URLs: `/rezepte/rezept-url-mit-typo/`
- Link references that point to existing files

These paths may be intentional and should not be modified without explicit user approval.

## What to Check

| Category    | Examples                                                        |
| ----------- | --------------------------------------------------------------- |
| Grammar     | Subject-verb agreement, tense consistency, proper article usage |
| Punctuation | Missing commas, incorrect apostrophes, bracket matching         |
| Spelling    | Typos, homophones, consistency of technical terms               |
| Formatting  | Inconsistent markdown, improper heading levels, broken links    |
| Clarity     | Ambiguous phrasing, incomplete sentences, confusing structure   |
| Consistency | Capitalization, terminology, date formats, number formatting    |
