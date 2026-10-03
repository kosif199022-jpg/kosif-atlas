---
name: audit-report
description: Render audit findings as a designed, paginated A4 PDF report with a cover page, severity donut and category bar charts, colored severity chips, evidence-backed strengths, prioritized recommendations, and copy-ready GitHub issue blocks. English by default, with a pt-BR label pack for when the user is working in Portuguese. Self-verifying (page count plus page rasterization before delivery), and it leaves a re-runnable generator script beside the report. Use when the user asks for a security audit report as a PDF, a findings report with charts, a formatted deliverable from a code review or audit, GitHub issue text generated from findings, or says "gere um relatório em PDF" / "relatório de auditoria". Pairs with /wstg mode 2 (which produces the findings) and works for any audit, not only security. Runs in an isolated venv, installs nothing globally.
---

# audit-report

Turns a findings list into a document someone will actually read. This skill owns **report
production only**: it does not find anything. The findings come from `/wstg` mode 2 (see its
`reference/CODEBASE-AUDIT.md`), from `/security-audit` on a diff, or from any other review.

The contract is a **JSON file**. You write the JSON, the bundled script renders the PDF. That
split is the point: re-running the report after a fix means editing JSON and re-running one
command, not regenerating a document by hand.

---

## Protocol

1. **Confirm the findings exist.** If the user asked for a report without an audit having run,
   run the audit first (`/wstg` mode 2) or ask for the findings. Never invent findings to fill
   a template, and never soften a severity to make a chart look better.
2. **Pick the output directory.** Default `docs/security-audit/` for security audits,
   `docs/audits/<topic>/` otherwise. Everything lands there: the JSON, the script, the PDF.
3. **Write `findings.json`** per the schema below. **Write it in English unless the user is
   working in another language**, in which case match theirs and set `lang` accordingly. The
   script ships `en` (default) and `pt-BR` label packs.
4. **Copy the generator** from this skill's `scripts/render_report.py` into the output
   directory, so the report is reproducible without the skill.
5. **Bootstrap the venv** (below) and render with `--verify`.
6. **Look at the pages.** `--verify` writes `_verify/page-NN.png`. Read them. Check: charts
   present and not overlapping, no text overflowing a cell, no path broken mid-token, code
   blocks not clipped at the right margin, header and footer on every page except the cover,
   accented characters rendering.
7. **Fix defects and re-render** before handing anything over. A report delivered without
   looking at it is not verified, whatever the script printed.
8. **Report the paths**: PDF, JSON, script, and the page count.

---

## Environment

Isolated venv, nothing global.

```bash
# Windows (python on PATH here is 2.x, so use the py launcher)
py -3 -m venv docs/security-audit/.venv
docs/security-audit/.venv/Scripts/python.exe -m pip install --quiet reportlab matplotlib pypdf pymupdf
docs/security-audit/.venv/Scripts/python.exe docs/security-audit/render_report.py \
    docs/security-audit/findings.json -o docs/security-audit/report.pdf --verify

# POSIX
python3 -m venv docs/security-audit/.venv
docs/security-audit/.venv/bin/pip install --quiet reportlab matplotlib pypdf pymupdf
docs/security-audit/.venv/bin/python docs/security-audit/render_report.py \
    docs/security-audit/findings.json -o docs/security-audit/report.pdf --verify
```

`reportlab` and `matplotlib` are required. `pypdf` and `pymupdf` power `--verify` only, and the
script degrades with a printed notice if they are missing, which means **you lose the visual
check**, so install them unless something blocks it.

Add `.venv/` and `_verify/` to the project's `.gitignore`. Commit the JSON, the script, and
the PDF.

---

## findings.json schema

Only `project` and `findings` are required. Every other key is optional and its section is
omitted when absent.

```jsonc
{
  "lang": "en",                       // "en" (default) | "pt-BR"
  "project": "Acme Console",
  "report_title": "Security Audit Report",   // optional, defaults per lang
  "date": "28 August 2026",
  "scope": "What was audited, in one paragraph.",
  "methodology": "How each category was mapped to the detected stack.",
  "stack": [["Linguagem", "TypeScript 5.4"], ["Auth", "JWT HS256"]],

  "findings": [{
    "id": "F1",
    "severity": "critical",           // critical|high|medium|low|informational
                                      // (pt-BR names also accepted: critica|alta|...)
    "category": "Missing tenant isolation",
    "title": "Short description, one line",
    "file": "src/routes/reports.ts",
    "lines": "88-104",
    "wstg": "WSTG-ATHZ-02",           // optional
    "code": "the actual snippet, unmodified",
    "why": "Who sends what request and what they get.",
    "preconditions": "Feature flag, role, config. Or 'Nenhuma.'",
    "impact": "What the attacker achieves.",
    "fix": "The specific control at the specific place."
  }],

  "strengths": [{ "title": "...", "evidence": "file, mechanism, lines verified" }],
  "weaknesses": ["The central risks, in prose."],
  "not_applicable": [{ "category": "...", "reason": "why this category has no equivalent" }],
  "coverage": [{ "sweep": "IDOR", "checked": "47 handlers, all verbs", "findings": 1 }],
  "recommendations": [{ "priority": "P1", "text": "...", "refs": ["F1", "F3"] }],
  "issues": [{ "n": 1, "markdown": "full issue body, see below" }]
}
```

**Severity drives the palette**, which is fixed in the script: crítica `#B91C1C`, alta
`#EA580C`, média `#D97706`, baixa `#2563EB`, informativa `#64748B`, ponto forte `#059669`.
Change it in `PALETTE` only if the user asks.

**A finding with no `code` renders without an evidence block.** Include the snippet, it is what
makes the report checkable.

---

## Writing the sections

**Strengths need evidence, not adjectives.** "Autorização parece correta" is worthless.
"`src/routes/documents.ts` — all 9 GET handlers load through `requireDocAccess()` (`:14`),
verified at `:31, :48, :66, ...`" is the coverage proof that makes the whole report credible.

**Weaknesses are the two or three sentences a lead reads.** Not a restatement of the findings
list: the systemic shape behind it. "Isolation depends on a manual predicate repeated in 63
places, correct in 62" says more than any individual finding.

**not_applicable is a feature.** A skipped category with a stated reason is a stronger report
than a forced finding. Say which categories the stack has no equivalent for.

**Recommendations are ordered work, not a restatement.** P1 is what someone does today.
Group findings that share one fix into one recommendation and list the refs.

---

## GitHub issue blocks

The `issues` array holds full Markdown bodies. The script wraps each in
`--- ISSUE n ---` / `--- END ISSUE n ---` delimiters (`FIM` under `pt-BR`) and renders it
monospaced, so the reader selects between the markers and pastes into GitHub.

Every issue carries:

- **Title** `# [Security] <short description>` (`[Segurança]` under `pt-BR`).
- **Labels** line: `security` plus the severity label.
- **Problem** — what is wrong and why it is exploitable.
- **Evidence** — `file:line` and the fenced snippet.
- **Impact** — what the attacker achieves.
- **Suggested fix** — the fix, with a code block when the fix is code.
- **Acceptance criteria** — a verifiable checklist. Each box must be something a reviewer can
  confirm by looking. "Fix the handler" fails that test, "an integration test with two tenants
  confirms A cannot see B's invoices" passes.

Issue bodies are written in the report's language, so they match the surrounding document.

**Group related trivia into one issue.** Four secret defaults across compose, env, CI, and a
chart are one issue titled for the theme, not four. Group when the fix is one change or one
sitting of work; split when they touch different subsystems or different owners.

**Not every finding earns an issue.** Informative findings and confirmed non-issues stay in
the report. Actionable ones become issues.

Keep code lines in the Markdown under ~90 characters. The renderer hard-wraps at 96 with a
continuation indent, which is safe but reads worse than lines that already fit.

---

## Rules

- **Never print a live secret value.** `file:line` plus a redacted prefix. This applies to the
  `code` field, which is copied verbatim into the PDF.
- **Verify before delivering.** Read the rasterized pages. Report the page count.
- **Leave the generator behind.** The script goes in the output directory, not just the venv.
  A report nobody can regenerate is a dead end after the first fix.
- **Do not restyle per report.** The layout and palette are fixed so two reports on the same
  project are comparable. User request overrides this.
- **English by default.** Write the report in English unless the user is working in another
  language, then mirror theirs and set `lang` to match. Do not infer a language from the
  codebase, the client, or a previous report. To add a language, add a key to `LABELS` in the
  script.
- **The script renders, it does not judge.** Severity, wording, and grouping are decided in the
  audit and written into the JSON.
- **Obey CLAUDE.md conventions** (`rtk` prefix on shell commands, no attribution trailers in
  issue text or commits).

---

## Files

| Path | Purpose |
|---|---|
| `scripts/render_report.py` | The generator. Copy into the output directory per run. |
| `assets/findings.example.json` | A complete worked example, all sections populated. |
