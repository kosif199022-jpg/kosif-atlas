# audit-mcp

Security audit a third-party MCP server repo before wiring it into Claude Desktop.

## What it checks

| # | Check | Tool |
|---|---|---|
| 1 | Clone / pull latest code | git |
| 2 | Dependency manifest | package.json / requirements.txt |
| 3 | Known CVEs | npm audit / pip-audit |
| 4 | Hardcoded secrets | TruffleHog (grep fallback) |
| 5 | Static analysis | Semgrep p/security-audit (skipped if not installed) |
| 6 | Code execution risk | grep for eval, exec, child_process, subprocess |
| 7 | Outbound network calls | grep for fetch, axios, requests (all destinations reported) |
| 8 | Tool poisoning, prompt injection, rug pull | mcp-scan by Invariant Labs (skipped if uvx not installed) |
| 9 | OAuth / permission scope creep | grep for broad scopes across providers |

## Usage

```
/audit-mcp https://github.com/author/some-mcp-server
/audit-mcp https://github.com/author/some-mcp-server dev
```

The skill clones the repo into `~/mcp-audits/<repo-name>/` and writes a timestamped report alongside it.

## Setup

No manual setup needed. On first run the skill bootstraps `assets/audit-mcp.sh` to `~/.claude/scripts/audit-mcp.sh`.

**Dependencies (install once):**
```bash
brew install trufflehog   # secrets scanner — falls back to grep if missing
brew install semgrep      # static analysis — check skipped if missing
brew install uv           # required for mcp-scan (uvx mcp-scan@latest)
```

## Output

Returns a table of all 7 checks with a **PASS / PASS WITH CAVEATS / FAIL** verdict and plain-English reasoning.
