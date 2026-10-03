---
name: security-audit
description: "Focused security review of a CHANGE (a diff, a branch, a PR), layered on the wstg-security-testing skill. Finds HIGH-CONFIDENCE, concretely exploitable vulnerabilities the change newly introduces (injection, broken authn/authz, secrets and data exposure, unsafe deserialization, crypto misuse, SSRF) and audits dependencies when a lockfile moved, using the repo's own package manager. Runs as Check 7 of /implementation-review, and standalone when the user says 'review this diff for security', 'is this change safe', 'security-check my PR', 'threat check this branch', or before shipping something that touches auth, user input, secrets, or untrusted data. NOT for whole-codebase or posture audits ('audit this repo', 'is my app secure', 'find every IDOR', 'auditoria de seguranca') — this skill is diff-scoped and its precedents suppress absence-shaped findings, so on a codebase-wide ask it can report clean on a vulnerable repo; route those to /wstg mode 2. Maps findings to WSTG IDs via /wstg, then reports only findings with a concrete exploit path, never theoretical noise."
---

# Security Audit

> **No em-dashes.** Nothing this skill writes may contain an em-dash; use a comma, colon, or parentheses instead.

A focused security pass over a change. The job is narrow on purpose: find the vulnerabilities a senior security engineer would confidently raise in review, and stay silent about everything else. A review that flags twenty theoretical issues gets ignored; one that flags the two real ones gets acted on. Noise is the enemy, not thoroughness.

**This skill layers on top of `wstg-security-testing` (`/wstg`).** That skill carries the full OWASP WSTG map: 12 categories, ~109 test cases, detection payloads, and a diff-review mode. This skill adds the two things WSTG alone does not give you: the **confidence gate** and the **false-positive precedents** that keep the report credible. Use WSTG for coverage (what to look for and its ID), use this skill's gate to decide what actually gets reported.

It runs two ways:

- **As Check 7 of `/implementation-review`**, a parallel subagent whose brief pulls in this skill's content. Diff-scoped, fast.
- **Standalone** (`/security-audit`), a deliberate pass on demand.

---

## When this is the wrong skill

**This skill reviews a change. It does not audit a codebase.** If the ask is repo-wide ("audit this project", "is my app secure", "find every IDOR", "auditoria de segurança"), stop and run **`/wstg` mode 2** instead, which carries the systematic protocol in `reference/CODEBASE-AUDIT.md`.

The distinction is not cosmetic, three things here actively break on a codebase-wide ask:

| This skill | Why it fails a posture audit |
|---|---|
| Scope resolves to a diff | No diff to resolve, so it reviews nothing and reports clean on a vulnerable repo |
| "Not pre-existing issues the diff merely sits near" | Every finding in an audit is pre-existing, that is the point |
| Precedent 9, "not the absence of defense-in-depth" | Missing RLS, a missing tenant filter, and an unvalidated secret default are all absences |

Those rules are correct **for change review**, where noise trains the reader to skip the report. They are wrong for a posture audit, where absence is the finding. `CODEBASE-AUDIT.md` states its own overrides explicitly; do not carry this file's precedents into it.

---

## The one rule that matters

**Only report a finding you can attach a concrete exploit path to, and only when you are over 80% confident it is actually exploitable.** Everything else here serves that rule.

A finding is worth reporting when you can name the untrusted input, trace it to the dangerous sink, and describe the attack in a sentence. If you cannot do that, it is a hunch, and a hunch in a security report is noise that trains the reader to skip the whole thing.

Score every candidate before reporting it:

| Confidence | Meaning | Action |
|---|---|---|
| 0.9 to 1.0 | Certain exploit path, you could write the payload | Report |
| 0.8 to 0.9 | Clear known-bad pattern with a real trigger | Report |
| 0.7 to 0.8 | Suspicious, needs specific conditions to fire | Report only if HIGH impact |
| below 0.7 | Speculative | Drop it, do not mention it |

---

## What to examine

**Resolve the scope first, it differs by how the skill was invoked:**

- **As Check 7 of `implementation-review`** (a commit gate): the **staged diff**, `git diff --staged`. That is exactly what is about to be committed.
- **Standalone** (`/security-audit`): the change under review, rarely staged yet. Resolve in this order, use the first non-empty result: an explicit target the user named (a file, a path, "the auth changes"); the **branch diff against its base**, `git diff $(git merge-base HEAD origin/HEAD)...HEAD` plus uncommitted work (`git diff HEAD`); or, failing a base, the full working-tree diff. Never review an empty `git diff --staged` and report "no vulnerabilities" when the real change is sitting unstaged. If you truly cannot find a change, say so rather than reporting clean.

Whichever scope resolves, extend it to the **trust boundary it lands in**: a one-line change to an authorization check pulls in the surrounding auth path, not just the changed line, because the bug is usually in the code the diff assumes rather than the line it edits. Review what the change **newly introduces**, not pre-existing issues it merely sits near.

**Threat taxonomy comes from WSTG.** Rather than re-list it here, run `/wstg` in its diff/PR-review mode to map the change to relevant WSTG test IDs (INPV for injection and XSS, ATHN/ATHZ for authn/authz and IDOR, SESS for session and JWT, CRYP for crypto, CONF for exposure, APIT for API surface). The categories most likely to fire on a change:

- **Input validation / injection (INPV):** SQL/NoSQL injection, command injection, path traversal, template injection, XXE, XSS (reflected, stored, DOM).
- **Authn / authz (ATHN, ATHZ):** authentication bypass, IDOR, tenant-leak (the 403-vs-404 case), missing ownership check, privilege escalation.
- **Session (SESS):** session fixation, JWT flaws.
- **Secrets and data exposure (CONF):** hardcoded keys/tokens/passwords, secrets or PII in logs, sensitive data in an API response or debug output.
- **Crypto and code execution (CRYP):** `Math.random()` for tokens, static IV, ECB mode, weak password hashing, cert-validation bypass, unsafe deserialization, `eval` on dynamic input, SSRF where the attacker controls host or protocol.

---

## Methodology

Three phases. The first two separate a real review from keyword pattern-matching.

**Phase 1: Understand the repo's security model.** Before judging the diff, see how the codebase already defends itself. What validation and sanitization helpers exist? What auth middleware wraps the endpoints? Is there an ORM that parameterizes queries, or raw SQL? A finding only makes sense relative to the existing model: raw string interpolation is damning in a codebase that parameterizes everywhere, and expected in one with its own escaping layer you have not read yet.

**Phase 2: Compare the change against that model.** Where does the diff deviate from the established secure pattern? New code that rolls its own auth check instead of using the middleware, or hand-builds a query where everything else uses the query builder, is where vulnerabilities enter. Deviation is the signal.

**Phase 3: Trace the data flow.** For each modified file, follow untrusted input from where it enters (request params, headers, uploaded files, external API responses) to where it does something dangerous (a query, a shell, a file path, an HTML render, a deserializer). A vulnerability is a path from a source to a sink with no adequate sanitization between. If you cannot draw that path, you do not have a finding.

You do not need to run the code to confirm a code-vuln; read it. This pass is read-only except for the dependency audit below.

---

## Dependency audit

When the diff touches a lockfile or manifest and a dependency was added or bumped, a bump can pull in a version with a published CVE. Detect the package manager from the lockfile and run its native auditor. This is the one place the skill shells out.

| Ecosystem | Lockfile | Command |
|---|---|---|
| npm | `package-lock.json` | `npm audit` |
| pnpm | `pnpm-lock.yaml` | `pnpm audit` |
| yarn | `yarn.lock` | `yarn npm audit` |
| Python | `poetry.lock`, `uv.lock`, `requirements*.txt` | `pip-audit` |
| Rust | `Cargo.lock` | `cargo audit` |
| Go | `go.sum` | `govulncheck ./...` |
| Ruby | `Gemfile.lock` | `bundle audit` |
| PHP | `composer.lock` | `composer audit` |
| Elixir | `mix.lock` | `mix hex.audit` (retired deps) / `mix deps.audit` (mix_audit) |

Detect the ecosystem from the lockfile present rather than assuming one; a repo can carry more than one.

**Degrade gracefully.** If the detected auditor is not installed, do not fail the review and do not guess. Report a single advisory finding: "lockfile `<name>` changed and `<tool>` is not available; run your dependency auditor," and name the packages the diff added or bumped.

Inside `implementation-review` Check 7, scope the audit to the packages the diff actually changed so the commit gate stays fast. The full-tree audit is what a standalone run surfaces.

---

## False-positive precedents

The calls a security engineer makes automatically and a checklist gets wrong. Applying them is most of what keeps this review credible. Do **not** report:

1. **Denial of service, resource exhaustion, rate limiting.** Out of scope.
2. **Client-side auth or validation gaps.** Client-side code is untrusted by design; the server owns validation. A missing check in the browser (or any client that sends data to a backend) is not a vulnerability, the backend is where the guard must live.
3. **React XSS** unless the code uses `dangerouslySetInnerHTML` or a similar explicit escape hatch. React auto-escapes.
4. **SSRF that only controls the URL path.** SSRF matters when the attacker controls host or protocol, not a path segment.
5. **Env vars and CLI flags treated as attacker-controlled.** In a normal deployment these are trusted.
6. **Log spoofing / logging non-secret data.** Logging URLs and IDs is assumed safe; logging secrets, passwords, or PII is a finding.
7. **Memory-safety issues in memory-safe languages** (JS, TS, Rust, Go, Python).
8. **Findings in test files or documentation.** Not attack surface.
9. **Lack of hardening.** Flag concrete vulnerabilities, not the absence of defense-in-depth.
10. **Theoretical race conditions and timing attacks.** Report only when concretely exploitable.
11. **Low-impact web quirks** (tabnabbing, open redirects, prototype pollution, XS-Leaks) unless extremely high confidence.

Assume UUIDs are unguessable and do not need validation.

We keep **dependency CVEs** in scope (the audit above) because they are a real and common way vulnerabilities ship and the audit is cheap and deterministic.

---

## Output format

Findings, most severe first:

```
# Vuln 1: SQL injection: `api/users.ts:42` (WSTG-INPV-05)
- Severity: HIGH
- Confidence: 0.9
- Category: sql_injection
- Description: `userId` from the request query is interpolated directly into the SQL string, no parameterization.
- Exploit: GET /users?id=1 OR 1=1 returns every user; a UNION payload reads adjacent tables.
- Fix: use the parameterized query builder already used in `api/orders.ts:88`.
```

For the commit-gate synthesis inside `implementation-review`, collapse to the house line format:

```
Check 7 · Security
  ✓ No vulnerabilities in the diff
  ✗ `api/users.ts:42` SQL injection (HIGH, WSTG-INPV-05): `userId` interpolated into query, use the parameterized builder
  ⚠ lockfile changed, `pip-audit` unavailable, run your dependency auditor (added: requests 2.19.1)
```

**Severity:** HIGH is directly exploitable (RCE, data breach, auth bypass). MEDIUM needs specific conditions but has real impact. LOW is lower-impact or defense-in-depth. In the commit gate, HIGH and MEDIUM block; LOW is advisory. Report MEDIUM only when it is obvious and concrete.

---

## Anti-patterns

- Do not report a finding without a concrete exploit path. If you cannot describe the attack in a sentence, it does not go in the report.
- Do not audit pre-existing issues the diff merely sits near.
- Do not fail the review when the dependency auditor is missing. Degrade to an advisory flag.
- Do not flag client-side auth, framework-safe XSS, or trusted env vars, the precedents exist so the review stays credible.
- Do not run the auditor's full-tree output inside the commit gate, scope it to changed packages.
- Do not pad the report to look thorough. Two real findings beat twelve maybes.
