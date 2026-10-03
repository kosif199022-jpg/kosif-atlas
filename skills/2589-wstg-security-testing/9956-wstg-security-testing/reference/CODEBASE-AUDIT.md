# Codebase Audit Protocol

The systematic procedure behind **mode 2 (self-review)**. Mode 2 without this file is a
category walk that samples; with it, the audit enumerates its surface first and judges
second, so "we found nothing" means something.

Use this when the target is a **repository**, not a diff. For a diff, use mode 4 or
`/security-audit`.

---

## Precedent overrides

`/security-audit` carries false-positive precedents tuned for change review. Three of them
invert here. **Do not apply them in this mode:**

| Precedent there | Why it is wrong here |
|---|---|
| "Review what the change newly introduces, not pre-existing issues" | Every finding in an audit is pre-existing |
| "Lack of hardening: flag concrete vulnerabilities, not the absence of defense-in-depth" | A missing tenant filter, absent RLS, and an unvalidated secret default are absences, and they are the finding |
| "Assume UUIDs are unguessable and do not need validation" | UUIDs leak through share links, exports, adjacent endpoints, and logs. An unowned-object fetch keyed by UUID is still a finding, note the guessability as a mitigating factor in severity, not as a reason to drop it |

Everything else in that file still holds, above all: **name the untrusted input, trace it to
the sink, describe the attack in a sentence.** Absence-shaped findings still need that
sentence, the input is just "any authenticated user" and the sink is "another tenant's row".

The remaining precedents that do carry over, unchanged: no DoS or rate limiting, no
framework-safe XSS, no memory safety in memory-safe languages, no findings in test files or
fixtures, no theoretical races, no low-impact web quirks without high confidence.

---

## Step 0 — Detect the stack, then map the categories

Before reading a single handler, establish what the project *is*. Read manifests, lockfiles,
config, and the entry point. Produce this table and put it in the report as the methodology
note. An audit that never states its mapping cannot be checked by the reader.

| Axis | What to determine | Where to look |
|---|---|---|
| Language / runtime | | `package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`, `mix.exs`, `composer.json` |
| Backend framework | routing style, middleware model | entry point, router files |
| Data access | ORM, query builder, raw SQL, BaaS | schema files, migrations, repository layer |
| **Isolation mechanism** | RLS policies, tenant middleware, manual `where user_id`, or **none** | migrations, middleware, a sample of read queries |
| Auth mechanism | session, JWT, BaaS auth, gateway-injected identity | login route, middleware, token verification |
| Frontend | framework, render model, sanitization libs present | `package.json` deps, component tree |
| Deploy surface | Docker, compose, Helm, Terraform, CI workflows | repo root, `.github/`, `infra/`, `charts/` |

Then map each sweep below to that stack's equivalent, explicitly. "Category A in this project
means RLS policies on Supabase tables" and "Category A in this project means a `tenantId`
predicate in every Drizzle query" are different audits.

**If an axis has no equivalent, say so and skip its sweep.** A backend-only service has no
category E frontend half. A single-tenant tool has no category A. Stating the skip is part of
the coverage claim, forcing findings into an inapplicable category is not.

---

## Step 1 — Build the inventory before judging

Four artifacts. Build all four before evaluating anything, because each sweep is a join
across two of them, and you cannot join against a list you have not written down.

1. **Route table.** Every handler the server exposes: method, path, handler location
   (`file:line`), middleware chain applied, and the identity it can see. Enumerate from the
   router definitions, not from a search for suspicious names. Include background jobs,
   webhooks, server actions, GraphQL resolvers, and RPC methods, they are routes with
   different syntax.
2. **Data-access sites.** Every place the app reads or writes persistent state, with the
   predicate it applies. Group by entity.
3. **Client-side privilege gates.** Every frontend branch on a role or capability
   (`isAdmin`, `canEdit`, `role ===`, `hasPermission`, feature flags gating admin UI), with
   the API call each gate protects.
4. **Secret surfaces.** Source, config, compose files, charts, CI workflows, scripts, docs,
   the frontend bundle, and git history.

**Do not sample.** If the route table is 200 handlers, the audit covers 200 handlers. If you
run out of budget, say which handlers were not reached and treat that as a coverage gap in
the report, never as a silent omission.

---

## Step 2 — The five sweeps

The default sweep set for an application audit. WSTG's other categories stay available in
`CATEGORIES.md`, run them when the target warrants it.

### A. Tenant and owner isolation (WSTG-ATHZ-02, APIT-02, "excessive data exposure")

The one most audits miss, because IDOR checks look at single-object fetches and this lives in
**collections**.

Join the route table against data-access sites. For every query that returns **more than one
row** (list, search, filter, count, aggregate, report, export, admin table, autocomplete,
CSV/PDF download, webhook fan-out), ask: what restricts this result set to the caller's
tenant or ownership scope?

Acceptable answers, in order of strength: a database-enforced policy (RLS) that the connection
cannot bypass; a mandatory framework-level scope that a handler cannot forget; a manual
predicate present in this specific query. The third is a finding waiting to happen but is not
itself a finding when present.

Findings here look like:

- A list endpoint with no scope predicate at all.
- A scope predicate taken from the **request** rather than the session (`?orgId=` trusted as
  given). This is the most common real-world variant, and it reads as filtered.
- RLS enabled on some tables but not others, or enabled with a permissive `USING (true)`.
- A service-role or admin database key used on a user-facing path, which bypasses RLS
  entirely. Check which client each query runs through, not just whether policies exist.
- Aggregates and counts that leak across tenants even when the row data does not.
- A search index, cache key, or report job that was never scoped although the primary query was.

Note the exploitability condition where one exists: a policy that only fires when a config
flag is on, a bypass only reachable with a role the signup flow can self-assign.

### B. Server-side enforcement of client-side privilege (WSTG-ATHZ-03, BFLA)

Join artifact 3 against artifact 1. For **every** client-side privilege gate, find the
endpoint it fronts and read that endpoint's middleware chain and body.

The finding is **never** "the frontend check can be bypassed", that is true by definition and
`/security-audit` precedent 2 correctly rejects it. The finding is: **this specific server
handler performs no equivalent privilege check**, and here is the request that reaches it.
Report it at the server location, cite the client gate as the discovery path.

Watch for: an auth middleware that proves *authentication* and is mistaken for
*authorization*; a role read from a JWT claim the user can influence at signup; role checks on
`GET` but not the matching `POST`/`PATCH`/`DELETE`; an admin router where the guard is applied
per-route and one route was added later without it; mass-assignment letting a normal user set
`role` or `isAdmin` on their own record.

### C. Object-level authorization / IDOR (WSTG-ATHZ-04, APIT-02)

Walk the route table. Every handler taking an object identifier from path, query, body, or
header, in **every** verb, is a row to check. Not a sample.

For each: is the object loaded with an ownership or tenant predicate in the same query, or
loaded first and checked after (fine, if the check exists and is not skippable), or never
checked?

Also flag: 403-vs-404 discrepancies that confirm existence across tenants; nested resources
where the parent is authorized but the child ID is trusted (`/orgs/:orgId/docs/:docId` with
`docId` looked up globally); bulk endpoints taking an array of IDs where only the first is
checked; and identifiers accepted from a header or cookie the client sets.

Per the override above, UUID keys do not exempt a handler.

### D. Secrets (WSTG-CONF, WSTG-CRYP, INFO-05)

Sweep artifact 4. Beyond literal keys in source:

- **Defaults that become production secrets.** `${JWT_SECRET:-dev-secret}`,
  `secret = os.getenv("X", "changeme")`, a committed `.env.example` whose values are real, a
  Helm `values.yaml` default, a compose file with an inline password. The finding pairs with
  the next one.
- **Missing startup validation.** No boot-time assertion that rejects the default or refuses
  to start without the variable. Without it, a deploy that forgets the variable ships the
  public default and looks healthy. Report the pair as one finding with two locations.
- **Git history.** `git log -p -S <pattern>`, `git log --diff-filter=D --name-only` for
  deleted config, and check whether any `.env` was ever tracked. A key removed in a later
  commit is still disclosed. If a scanner is available (`gitleaks detect`,
  `trufflehog filesystem`), run it and cite it; if not, do the targeted log search and say the
  sweep was manual.
- **The frontend bundle.** Anything reaching client code is public regardless of variable
  naming. Check the build output and the framework's public-prefix rules
  (`NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`, `EXPO_PUBLIC_`) for a value that should have stayed
  server-side. A BaaS anon key is fine by design, a service-role key is critical.
- **Deploy and CI.** Workflow files with inline tokens, `docker-compose.yml` credentials,
  Terraform variables with defaults, a `Dockerfile` `ARG` carrying a secret into a layer.
- Default credentials in seeds, fixtures used as prod bootstrap, or docs.

Severity turns on reachability: a live third-party key is critical, a signing secret is
critical, a local-only compose password for a dev database is low or informative. **Never
reproduce a live secret value in the report**, cite `file:line` and a redacted prefix.

### E. Untrusted input into render sinks (WSTG-INPV-01/02, CLNT-01/03)

**Frontend.** The framework's escape hatch, whatever it is called: `innerHTML`,
`outerHTML`, `insertAdjacentHTML`, `document.write`, `dangerouslySetInnerHTML`, `v-html`,
`[innerHTML]`, `@html`, `Html::from_html_unchecked`, a `WebView` `loadData`. Then: markdown or
rich-text rendered without sanitization, user-controlled values in `href`/`src`/`action`
(the `javascript:` and `data:` schemes), user input reaching `eval`, `new Function`,
`setTimeout(string)`, or a template compiler, and user data written into a `<script>` block
or a hydration payload.

For each hit, the question is whether the value can carry user input and whether a sanitizer
sits between. Determine first whether the project **has** a sanitizer (DOMPurify,
`sanitize-html`, `bleach`, `ammonia`, framework-native) and then whether each sink uses it. A
project with DOMPurify in `package.json` and three unsanitized sinks is a stronger finding
than one with no sanitizer at all, because the fix is already in the tree.

Framework auto-escaping holds, do not report ordinary interpolation.

**Backend.** User input into email HTML, PDF or document generation, server-rendered
templates with an explicit raw/unescaped marker, HTML in API error messages, admin
notification views (self-XSS against staff is still XSS), and any templating engine reached
by user input at all, which is SSTI (INPV-18) rather than XSS.

---

## Step 3 — Record what is correct, with evidence

Every sweep produces two lists. The clean list is not padding, it is the coverage proof, and
without it the reader cannot tell a thorough audit from a shallow one.

A strength needs the same evidence standard as a finding:

> ✅ **Object-level authorization, `src/routes/documents.ts`** — all 11 handlers load through
> `requireDocAccess()` (`:14`), which joins on `workspace_id` from the session. Verified per
> handler: `:31, :48, :66, :83, :97, :112, :130, :147, :161, :178, :195`.

Not: "authorization looks good". Name the file, the mechanism, and the lines checked.

Also record, as informative rather than as strengths: categories skipped because the stack has
no equivalent, and any surface the audit could not reach.

---

## Step 4 — Output

File by file, line by line, grouped by sweep. Per finding, use the `REPORTING.md` template
plus these fields:

- **Severity** — the `REPORTING.md` rubric, impact × likelihood.
- **Location** — `path/to/file.ts:42-48`, exact lines.
- **Code** — the actual snippet, unmodified.
- **Why exploitable** — the sentence: who, what request, what they get.
- **Preconditions** — feature flag, role obtainable at signup, config that must be insecure,
  or "none, default deployment".
- **Fix** — the specific control at the specific place, referencing the project's own existing
  pattern where one exists.

Close with severity counts, a per-sweep coverage line (`n handlers checked, n findings`), and
the explicit list of anything unreached.

To render this as a PDF report with charts and copy-ready GitHub issues, hand the findings to
**`/audit-report`**.

---

## Rules

- **Enumerate, then judge.** No sweep starts before its inventory artifact exists.
- **No sampling, and no silent truncation.** Unreached surface is a reported coverage gap.
- **Absence is a finding here**, unlike in change review. State the missing control and the
  request that exploits its absence.
- **Report server-side.** A client gate is a discovery path, not a location.
- **Never print a live secret.** Path, line, redacted prefix.
- **State the stack mapping** in the report, and state every category skipped as N/A with its
  reason.
- **Do not force findings to a target count.** Five categories does not mean five findings.
