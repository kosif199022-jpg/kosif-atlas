---
name: wstg-security-testing
description: Web application security testing using the OWASP Web Security Testing Guide (WSTG) methodology — its 12 categories and ~109 test cases (INFO, CONF, IDNT, ATHN, ATHZ, SESS, INPV, ERRH, CRYP, BUSL, CLNT, APIT). Four modes — guide an authorized pentest, self-review your own app, generate/score a coverage checklist, or review a code diff/PR against relevant WSTG tests. Mode 2 is the whole-codebase audit path and carries a systematic protocol (reference/CODEBASE-AUDIT.md) for stack detection, route-handler enumeration, tenant-isolation sweeps, frontend-gate-to-endpoint cross-referencing, and secret sweeps across git history and deploy configs. Bundles the full test reference, detection payloads, a reporting template, and scripts to look up WSTG IDs and build/score checklists. Use when the user mentions OWASP WSTG, web security testing, pentesting a web app or API, security review against WSTG, XSS/SQLi/SSRF/IDOR/auth/session/CSRF/JWT testing, multi-tenant or RLS isolation gaps, hardcoded secrets, a WSTG-XXXX-NN ID, or wants a security findings report. ALSO use for any codebase-wide security ask — "audit this repo", "is my app secure", "find every IDOR", "review the whole app for vulnerabilities", "auditoria de seguranca" — which /security-audit (diff-scoped) must not take. Pair with /audit-report to render findings as a PDF. Authorized/defensive/educational use only.
---

# WSTG Security Testing

OWASP **Web Security Testing Guide** methodology: 12 categories, ~109 tests, IDs in the
form `WSTG-<CAT>-<NN>`. Source of truth bundled in `data/wstg.json`; live: <https://owasp.org/www-project-web-security-testing-guide/latest/>.

## Authorization gate (always first)

Before suggesting or running any active test, confirm the user **owns the target or has
written permission** to test it (pentest engagement, CTF, their own app, staging). If scope
is unclear, ask. Default to **non-destructive** probes; never touch prod data that can't be
restored. Defensive self-review and code review need no external auth.

## Pick a mode

1. **Guide a test** — plan + walk an authorized engagement across WSTG categories. Scope → recon (INFO) → per-category tests → findings. Suggest probes from [reference/PAYLOADS.md](reference/PAYLOADS.md), map each result to a WSTG ID.
2. **Self-review my app** — defensive, whole codebase. Read the user's code/stack, walk the relevant categories, flag gaps with the **Fix** guidance from [reference/CATEGORIES.md](reference/CATEGORIES.md). No live attacking needed. For anything beyond a quick look, follow [reference/CODEBASE-AUDIT.md](reference/CODEBASE-AUDIT.md): it turns this mode into a systematic sweep (stack detection, route enumeration, tenant-isolation and secret sweeps, evidence-backed strengths) instead of a category walk that samples. **This is the mode a repo-wide ask lands in**, including asks phrased as "security audit", which `/security-audit` (diff-scoped) must decline.
3. **Checklist + reporting** — generate a coverage checklist, track verdicts, score it, emit findings. See scripts + [REPORTING.md](REPORTING.md).
4. **Code / PR review** — review a diff or codebase against the high-signal categories (INPV, ATHN, ATHZ, SESS, CRYP, CLNT, APIT). Flag risky sinks, cite the WSTG ID, give the fix.

## Workflow

1. Confirm authorization + scope; choose mode.
2. Scope which categories apply (an API → emphasize APIT/ATHZ/INPV/SESS; a static marketing site → INFO/CONF/CLNT).
3. Generate the checklist: `py scripts/wstg_checklist.py --cat <CODES> --out checklist.md` (omit `--cat` for all 12).
4. Work the categories using [reference/CATEGORIES.md](reference/CATEGORIES.md) (what-to-look-for + fix + tools per category) and [reference/PAYLOADS.md](reference/PAYLOADS.md) (detection probes).
5. Record each result `PASS|FAIL|N/A|INFO` in the checklist; promote FAILs to findings via [REPORTING.md](REPORTING.md).
6. Score coverage: `py scripts/wstg_checklist.py --score checklist.md`.

## Scripts

Run with Python 3 (`py` or `python3` — not `python`, which is 2.7 here):

```bash
py scripts/wstg_lookup.py WSTG-INPV-05        # resolve one ID
py scripts/wstg_lookup.py --cat ATHZ          # list a category
py scripts/wstg_lookup.py --search ssrf       # keyword search test names
py scripts/wstg_lookup.py --list              # all categories + counts
py scripts/wstg_checklist.py --cat INPV,ATHZ  # generate checklist (md; --format csv)
py scripts/wstg_checklist.py --score FILE     # coverage % + FAIL list
```

Add `--json` to lookup for machine-readable output.

## Notes

- Numbered IDs = stable v4.2 (citable). Tests flagged `[latest]` in the reference are v5.0 draft — verify the current ID at the live source before quoting.
- WSTG is the *how-to-test* methodology; pair with OWASP Top 10 (awareness), API Security Top 10 (APIT), and ASVS (verification requirements).
- Reference is one level deep: SKILL.md → CATEGORIES.md / PAYLOADS.md / REPORTING.md.
