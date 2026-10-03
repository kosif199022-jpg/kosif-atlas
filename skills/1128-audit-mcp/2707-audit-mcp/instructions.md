# audit-mcp v1.0

## What this skill does

1. Bootstrap the audit script to `~/.claude/scripts/` if not already there
2. Clone (or update) the target repo into `~/mcp-audits/`
3. Run 7 automated security checks
4. Read the report and return a plain-English verdict with a findings table

---

## Step 1 — Parse arguments

Extract from the user's message:
- `REPO_URL` — GitHub URL of the MCP repo (required)
- `BRANCH` — branch name (optional, default: `main`)

If no URL is provided, ask for it before proceeding.

---

## Step 2 — Bootstrap the script

Check whether `~/.claude/scripts/audit-mcp.sh` exists:

```bash
ls ~/.claude/scripts/audit-mcp.sh 2>/dev/null && echo "exists" || echo "missing"
```

If missing:
1. Create the directory: `mkdir -p ~/.claude/scripts`
2. Read `${CLAUDE_PLUGIN_ROOT}/library/audit-mcp/scripts/audit-mcp.sh` using the Read tool, then write it to `~/.claude/scripts/audit-mcp.sh`
3. Make it executable: `chmod +x ~/.claude/scripts/audit-mcp.sh`

The `scripts/` path for this skill is relative to the skill folder. Resolve it by checking:
- `${CLAUDE_PLUGIN_ROOT}/library/audit-mcp/scripts/audit-mcp.sh`

---

## Step 3 — Run the audit

```bash
bash ~/.claude/scripts/audit-mcp.sh <REPO_URL> [BRANCH]
```

This runs 10 checks and writes a timestamped report to `~/mcp-audits/<repo-name>-audit-<timestamp>.md`.

The script will also print the report to stdout — capture it. If the script isn't found or fails, report the error clearly and stop.

---

## Step 4 — Find and read the report

After the script completes, find the latest report:

```bash
ls -t ~/mcp-audits/*-audit-*.md | head -1
```

Read that file. Use it as the authoritative source for the summary — not the stdout, which may be truncated.

---

## Step 5 — Summarise findings

Return a structured verdict:

```
## Audit — <repo-name>

**Verdict:** PASS / PASS WITH CAVEATS / FAIL

| Check | Result | Notes |
|---|---|---|
| Dependencies | ✅/⚠️ | e.g. "0 vulns" or "12 vulns in transitive deps not used by server" |
| Secrets | ✅/⚠️ | e.g. "no real secrets — placeholder URIs in type defs only" |
| Semgrep | ✅/⚠️ | e.g. "0 findings" or "2 findings — review" |
| Code execution | ✅/⚠️ | e.g. "no eval/exec/child_process in source" |
| Outbound calls | ✅/⚠️ | e.g. "fetch calls to googleapis only" |
| Tool poisoning | ✅/⚠️ | e.g. "mcp-scan: no issues" or "mcp-scan flagged prompt injection" |
| OAuth scopes | ✅/⚠️ | e.g. "no full-access scope" |
| Logging | ✅/⚠️ | e.g. "logs email during auth — expected behaviour" |

### Findings that need attention
[Real risks only. Skip false positives — see Gotchas below.]

### Verdict
[1–2 sentences: safe to install or not, and why.]

Report saved to: ~/mcp-audits/<filename>
```

---

## Verdict criteria

| Verdict | Conditions |
|---|---|
| **PASS** | No real secrets in source, no eval/exec, outbound to known APIs only, no full Gmail scope, dep vulns are in transitive packages not used by the server |
| **PASS WITH CAVEATS** | Minor issues that don't block install: logging of email addresses during OAuth, fixable vulns, non-Google fetch in a non-critical path |
| **FAIL** | Hardcoded secrets in source, eval/exec in server code, outbound to unknown hosts, full Gmail/mailbox scope requested |

---

## Gotchas

- **node_modules false positives:** TruffleHog findings in `node_modules/` are almost always placeholder credentials in README examples or type definition files (`@types/node`, `googleapis`). Only flag findings in `src/` or repo root.
- **npm audit inflation:** Vulnerability counts are often inflated by transitive deps (hono, ajv) that the MCP server itself doesn't use. Check whether the vulnerable package is in the server's own `dependencies` — if it's buried 3 levels deep in a dev tool's deps, it's not a real risk.
- **`--ignore-scripts`:** The audit script runs `npm install --ignore-scripts` to prevent malicious install hooks from executing during the audit. This is intentional.
- **Re-auditing:** Running the skill again on the same repo pulls the latest code (`git pull`) and generates a new timestamped report — previous reports are preserved.
- **Missing tools:** If `trufflehog`, `semgrep`, or `uvx` isn't installed, those checks are skipped with a note. Full coverage requires all three: `brew install trufflehog semgrep uv`.
- **mcp-scan is the highest-signal check.** It uses actual LLM-based analysis to detect tool poisoning, rug pulls, cross-origin escalation, and prompt injection — not regex. Any finding from mcp-scan is an automatic FAIL.
- **mcp-scan scans skill/prompt files** in the cloned repo with `--skills`. It won't catch poisoning buried in compiled TypeScript logic, but it catches it in any markdown or config files the repo ships.
- **Outbound calls are reported for all targets** (not just non-Google). The reviewer decides whether destinations are expected — this makes the check useful for any MCP, not just Gmail ones.
