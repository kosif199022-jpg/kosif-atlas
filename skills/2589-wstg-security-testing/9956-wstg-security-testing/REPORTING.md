# WSTG Reporting

How to record findings and assemble an engagement report. Every finding ties
back to a WSTG ID so coverage is traceable.

## Severity

Use CVSS 3.1/4.0 for a defensible score, or this quick rubric when a full vector is overkill:

| Severity | Meaning | Typical examples |
|----------|---------|------------------|
| Critical | Trivial unauth compromise / full data exposure | Unauth RCE, SQLi dumping all data, auth bypass |
| High     | Significant impact, low barrier | Stored XSS, IDOR on sensitive objects, SSRF to metadata |
| Medium   | Real risk, needs conditions | Reflected XSS, CSRF on state change, missing HSTS on auth |
| Low      | Limited impact / hardening | Verbose headers, missing security header, info leak |
| Info     | No direct risk, note it | Tech fingerprint, best-practice deviation |

Score on **impact × likelihood**, not payload novelty. Note any preconditions (auth required, specific role, user interaction).

## Finding template

```md
### [SEVERITY] <Short title>

- **WSTG ID:** WSTG-XXXX-NN — <test name>
- **Affected:** <URL / endpoint / parameter / component>
- **CWE / OWASP:** <e.g. CWE-89, A03:2021-Injection>  (optional)
- **CVSS:** <score + vector>  (optional)

**Summary**
<One paragraph: what the issue is and why it matters here.>

**Steps to reproduce**
1. <request / action>
2. <request / action>
3. <observed result>

**Evidence**
<request/response snippet, screenshot ref, or PoC. Redact real secrets/PII.>

**Impact**
<What an attacker achieves. Concrete, scoped to this app.>

**Remediation**
<Specific fix — control + where to apply it. Reference the CATEGORIES.md "Fix" line.>

**References**
- https://owasp.org/www-project-web-security-testing-guide/latest/...
```

## Report structure

1. **Executive summary** — scope, dates, headline risk, finding counts by severity. Non-technical.
2. **Scope & methodology** — targets/URLs in scope, what was excluded, "tested against the OWASP WSTG methodology", credentials/roles used, dates.
3. **Findings** — one block per finding (template above), ordered by severity.
4. **WSTG coverage** — the checklist with per-test verdicts (`wstg_checklist.py` output). Shows what was tested, not just what failed.
5. **Appendices** — tool versions, raw output, retest notes.

## Workflow tie-in

- Generate the tracking checklist: `py scripts/wstg_checklist.py --out checklist.md`
- Mark each row `PASS|FAIL|N/A|INFO` as you test; put a one-line note in Notes.
- Score coverage before writing the report: `py scripts/wstg_checklist.py --score checklist.md`
- Promote every `FAIL` row into a full finding block.

## Defensive / self-review mode

When reviewing your own app (not a formal pentest), drop the exec summary and
just emit prioritized findings (FAIL rows → template), each with the **Remediation**
line pointing at the exact code/config to change. Severity still applies so the
team triages highest-impact first.
