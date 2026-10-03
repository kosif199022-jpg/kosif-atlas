#!/bin/bash
# ============================================================
# MCP Repo Security Auditor v4
# Usage: ./audit-mcp.sh <github-url> [branch]
# Example: ./audit-mcp.sh https://github.com/coreyepstein/advanced-gmail-mcp
# ============================================================

REPO_URL="${1}"
BRANCH="${2:-main}"
REPO_NAME=$(basename "$REPO_URL" .git)
AUDIT_DIR="$HOME/mcp-audits"
REPORT_FILE="$AUDIT_DIR/${REPO_NAME}-audit-$(date +%Y%m%d-%H%M%S).md"

RED="\033[0;31m"; YELLOW="\033[0;33m"; GREEN="\033[0;32m"
CYAN="\033[0;36m"; BOLD="\033[1m"; RESET="\033[0m"

info()    { echo -e "${CYAN}[INFO]${RESET} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET} $1"; }
danger()  { echo -e "${RED}[DANGER]${RESET} $1"; }
ok()      { echo -e "${GREEN}[OK]${RESET} $1"; }
section() { echo -e "\n${BOLD}━━━ $1 ━━━${RESET}"; }

if [[ -z "$REPO_URL" ]]; then
  echo "Usage: $0 <github-repo-url> [branch]"
  exit 1
fi

mkdir -p "$AUDIT_DIR"
CLONE_DIR="$AUDIT_DIR/${REPO_NAME}"

{
echo "# MCP Security Audit: ${REPO_NAME}"
echo "**Date:** $(date)"
echo "**Repo:** ${REPO_URL}"
echo "**Branch:** ${BRANCH}"
echo ""
} > "$REPORT_FILE"

# ── 1. Clone / Pull ──────────────────────────────────────────
section "1/7  Cloning / Pulling Repo"
if [[ -d "$CLONE_DIR/.git" ]]; then
  info "Repo exists — pulling latest..."
  git -C "$CLONE_DIR" pull --quiet && ok "Updated" || warn "Pull failed — using existing copy"
else
  info "Cloning ${REPO_URL}..."
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$CLONE_DIR" --quiet && ok "Cloned"
fi
{ echo "## 1. Repo"; echo "- Source: $REPO_URL (branch: $BRANCH)"; echo "- Cloned to: $CLONE_DIR"; echo ""; } >> "$REPORT_FILE"
cd "$CLONE_DIR"

# ── Spawn background jobs immediately after clone ────────────
SG_TMP=$(mktemp)
MCP_TMP=$(mktemp)
SG_PID=""
MCP_PID=""

if command -v semgrep &>/dev/null; then
  info "Semgrep: starting in background..."
  semgrep --config p/security-audit --no-git-ignore --quiet --json \
    --exclude node_modules --exclude .git . > "$SG_TMP" 2>&1 &
  SG_PID=$!
else
  echo '{"results":[]}' > "$SG_TMP"
  warn "semgrep not installed — skipping (brew install semgrep)"
fi

if command -v uvx &>/dev/null; then
  info "mcp-scan: starting in background..."
  uvx mcp-scan@latest --skills "$CLONE_DIR" > "$MCP_TMP" 2>&1 &
  MCP_PID=$!
else
  echo "" > "$MCP_TMP"
  warn "uvx not installed — mcp-scan skipped (brew install uv)"
fi

# ── 2. Dependency Manifest ───────────────────────────────────
section "2/7  Dependency Manifest"
echo "## 2. Dependency Manifest" >> "$REPORT_FILE"
if [[ -f "package.json" ]]; then
  ok "package.json found"
  DEPS=$(node -e "const p=require('./package.json'); console.log(Object.keys({...p.dependencies,...p.devDependencies}).join(', '))" 2>/dev/null || echo "parse error")
  echo "- **package.json** — deps: $DEPS" >> "$REPORT_FILE"
elif [[ -f "requirements.txt" ]]; then
  ok "requirements.txt found"
  { echo "- **requirements.txt**:"; echo '```'; cat requirements.txt; echo '```'; } >> "$REPORT_FILE"
else
  warn "No manifest found"
  echo "- No dependency manifest found" >> "$REPORT_FILE"
fi

# ── 3. Dependency CVEs ───────────────────────────────────────
section "3/7  Dependency CVE Scan"
echo ""; echo "## 3. Dependency Vulnerabilities" >> "$REPORT_FILE"
if [[ -f "package.json" ]]; then
  info "Running npm install + audit..."
  npm install --quiet --ignore-scripts 2>/dev/null || true
  VULN_COUNT=$(npm audit --json 2>/dev/null | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ try{ const j=JSON.parse(d); console.log(j.metadata?.vulnerabilities?.total||0); }catch(e){ console.log(0); } })" 2>/dev/null || echo "0")
  if [[ "$VULN_COUNT" == "0" ]]; then
    ok "No known vulnerabilities"; echo "- ✅ npm audit: 0 vulnerabilities" >> "$REPORT_FILE"
  else
    danger "$VULN_COUNT vulnerabilities found"
    { echo "- ⚠️ npm audit: **$VULN_COUNT vulnerabilities**"; echo '```'; npm audit 2>/dev/null | head -60 || true; echo '```'; } >> "$REPORT_FILE"
  fi
elif [[ -f "requirements.txt" ]] && command -v pip-audit &>/dev/null; then
  pip-audit -r requirements.txt >> "$REPORT_FILE" 2>&1 || true
else
  warn "pip-audit not installed — skipping"
  echo "- pip-audit not installed" >> "$REPORT_FILE"
fi

# ── 4. Secrets Scan ──────────────────────────────────────────
section "4/7  Secret / Credential Scan"
echo ""; echo "## 4. Secrets Scan" >> "$REPORT_FILE"
if command -v trufflehog &>/dev/null; then
  TH_OUT=$(trufflehog filesystem . --no-update 2>/dev/null | head -60 || true)
  if [[ -z "$TH_OUT" ]]; then
    ok "No secrets found"; echo "- ✅ TruffleHog: no secrets detected" >> "$REPORT_FILE"
  else
    danger "Potential secrets found!"
    { echo "- ⚠️ TruffleHog findings:"; echo '```'; echo "$TH_OUT"; echo '```'; } >> "$REPORT_FILE"
  fi
else
  warn "trufflehog not installed — running grep fallback"
  SECRET_HITS=$(grep -rn --include="*.js" --include="*.ts" --include="*.py" \
    -iE "(api_key|apikey|secret|password|hardcoded.*token|private_key)[[:space:]]*[=:][[:space:]]*['\"][^'\"]{8,}" \
    --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null | head -20 || true)
  if [[ -z "$SECRET_HITS" ]]; then
    ok "No obvious hardcoded secrets (grep)"; echo "- ✅ No obvious hardcoded secrets (grep fallback)" >> "$REPORT_FILE"
  else
    warn "Possible secrets — review manually"
    { echo "- ⚠️ Possible secrets:"; echo '```'; echo "$SECRET_HITS"; echo '```'; } >> "$REPORT_FILE"
  fi
fi

# ── 5. Code Execution Risk ───────────────────────────────────
section "5/7  Code Execution Risk"
echo ""; echo "## 5. Code Execution Risk" >> "$REPORT_FILE"
EXEC_HITS=$(grep -rn --include="*.js" --include="*.ts" --include="*.py" \
  -E "(eval\(|execSync|execFile|spawnSync|child_process|subprocess\.run|os\.system|os\.popen|__import__\()" \
  --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null | head -20 || true)
if [[ -z "$EXEC_HITS" ]]; then
  ok "No code execution patterns found"
  echo "- ✅ No eval/exec/child_process/subprocess usage" >> "$REPORT_FILE"
else
  danger "Code execution patterns found"
  { echo "- ⚠️ Code execution usage:"; echo '```'; echo "$EXEC_HITS"; echo '```'; } >> "$REPORT_FILE"
fi

# ── 6. Outbound Network Calls ────────────────────────────────
section "6/7  Outbound Network Calls"
echo ""; echo "## 6. Outbound Network Calls" >> "$REPORT_FILE"
FETCH_HITS=$(grep -rn --include="*.js" --include="*.ts" --include="*.py" \
  -E "(fetch\(|axios\.(get|post|put|delete|request|create)|requests\.(get|post|put|delete)|http(s)?\.request|urllib)" \
  --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null | head -30 || true)
if [[ -z "$FETCH_HITS" ]]; then
  ok "No outbound network calls found"
  echo "- ✅ No outbound network calls detected in source" >> "$REPORT_FILE"
else
  warn "Outbound calls detected — verify all destinations are expected"
  { echo "- ⚠️ Outbound calls (verify destinations):"; echo '```'; echo "$FETCH_HITS"; echo '```'; } >> "$REPORT_FILE"
fi

# ── 7. OAuth / Permission Scope Audit ───────────────────────
section "7/7  OAuth & Permission Scope Audit"
echo ""; echo "## 7. OAuth / Permission Scope Audit" >> "$REPORT_FILE"
SCOPE_HITS=$(grep -rn --include="*.js" --include="*.ts" --include="*.py" --include="*.json" \
  -iE "(scope|SCOPE|oauth|permission)" \
  --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null | head -30 || true)
BROAD_SCOPE=$(echo "$SCOPE_HITS" | \
  grep -iE "(mail\.google\.com|https://www\.googleapis\.com/auth/drive$|\.readonly\.all|admin\.directory|full.access|FULL_ACCESS|read_write_all|offline_access.*admin|sudo)" \
  || true)
if [[ -n "$BROAD_SCOPE" ]]; then
  danger "Overly broad scope detected"
  { echo "- ⚠️ **Broad/dangerous scope detected:**"; echo '```'; echo "$BROAD_SCOPE"; echo '```'; } >> "$REPORT_FILE"
else
  ok "No overly broad OAuth scopes detected"
  echo "- ✅ No broad OAuth scopes detected" >> "$REPORT_FILE"
fi
if [[ -n "$SCOPE_HITS" ]]; then
  { echo "- All scope/permission references:"; echo '```'; echo "$SCOPE_HITS"; echo '```'; } >> "$REPORT_FILE"
fi

# ── Collect background results ───────────────────────────────
echo ""
info "Waiting for background scans to finish..."

# Semgrep results
section "Semgrep Static Analysis"
echo ""; echo "## 8. Semgrep Static Analysis" >> "$REPORT_FILE"
if [[ -n "$SG_PID" ]]; then
  wait "$SG_PID"
  ok "Semgrep complete"
fi
SG_JSON=$(cat "$SG_TMP")
SG_COUNT=$(echo "$SG_JSON" | node -e \
  "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).results?.length||0)}catch(e){console.log(0)}})" \
  2>/dev/null || echo "0")
if [[ -z "$SG_PID" ]]; then
  echo "- ⚠️ semgrep not installed — skipped (brew install semgrep)" >> "$REPORT_FILE"
elif [[ "$SG_COUNT" == "0" ]]; then
  ok "Semgrep: 0 findings"; echo "- ✅ Semgrep p/security-audit: 0 findings" >> "$REPORT_FILE"
else
  danger "Semgrep: $SG_COUNT findings"
  SG_SUMMARY=$(echo "$SG_JSON" | node -e \
    "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{JSON.parse(d).results.slice(0,20).forEach(r=>console.log(r.path+':'+r.start.line+' ['+r.check_id+'] '+r.extra.message))}catch(e){}})" \
    2>/dev/null || true)
  { echo "- ⚠️ Semgrep: **$SG_COUNT findings**"; echo '```'; echo "$SG_SUMMARY"; echo '```'; } >> "$REPORT_FILE"
fi

# mcp-scan results
section "mcp-scan — Tool Poisoning & Prompt Injection"
echo ""; echo "## 9. mcp-scan" >> "$REPORT_FILE"
if [[ -n "$MCP_PID" ]]; then
  wait "$MCP_PID"
  ok "mcp-scan complete"
fi
MCP_OUT=$(cat "$MCP_TMP")
if [[ -z "$MCP_PID" ]]; then
  echo "- ⚠️ mcp-scan skipped — install uv to enable: brew install uv" >> "$REPORT_FILE"
elif [[ -z "$MCP_OUT" ]]; then
  ok "mcp-scan: no skill files found to scan"
  echo "- ℹ️ mcp-scan: no skill/prompt files found in repo" >> "$REPORT_FILE"
elif echo "$MCP_OUT" | grep -qiE "(DANGER|injection|poisoning|rug.pull|FAIL)"; then
  danger "mcp-scan flagged issues!"
  { echo "- ⚠️ **mcp-scan findings:**"; echo '```'; echo "$MCP_OUT"; echo '```'; } >> "$REPORT_FILE"
else
  ok "mcp-scan: no issues found"
  { echo "- ✅ mcp-scan: no tool poisoning or injection detected"; echo '```'; echo "$MCP_OUT"; echo '```'; } >> "$REPORT_FILE"
fi

# Cleanup temp files
rm -f "$SG_TMP" "$MCP_TMP"

# ── Done ──────────────────────────────────────────────────────
section "✅  Audit Complete"
{ echo ""; echo "---"; echo "*Audit generated by audit-mcp.sh v4 on $(date)*"; } >> "$REPORT_FILE"

echo ""
echo -e "${BOLD}${GREEN}Report saved to: $REPORT_FILE${RESET}"
echo ""
cat "$REPORT_FILE"
