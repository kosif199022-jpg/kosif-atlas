# Skill Auditor — Skill Spec (FINAL, synthesized)

A new **read-only, on-demand** domain skill for the ambient-library plugin. It audits a single target skill *directory* against the library's publishing schema and reports ordered, deduplicated, actionable findings with copy-editable fixes. It never edits the target.

> Sources synthesized: Claude (structure, output examples, read-only contract, edge cases), Gemini (schema fact-corrections, boundaries vs existing skills, real examples), Codex (root resolution, implementation mechanics, measurable output contract, publishable form). Every factual assertion below was re-verified against `SCHEMA.md`, `build-catalog.py`, `aai-check.sh`, `skill-evals/references/schema.md`, and real skills.

---

## 1. Title & purpose

**Skill Auditor** inspects one skill directory and verifies it against the library schema in a fixed, dependency-ordered sequence of four checks — **frontmatter**, **catalog projection**, **reference resolution**, **evals presence/shape** — and emits a structured audit report. Each finding pairs a **severity** with a **specific, copy-editable suggested fix** (the exact key to change, the file to add, or the path to correct), never a vague "fix this."

> *Kept from Claude: the four-check dependency-ordered frame, the read-only/non-destructive contract, and the "severity + concrete fix" atomic finding. Kept from Gemini: the correction that the audit target is the skill **directory** (frontmatter lives in `SKILL.md`, the body in `instructions.md`), not "the frontmatter of `instructions.md`."*

---

## 2. When it triggers (invocation phrases)

**On-demand, never ambient.** It fires when a user asks to audit / review / lint / check / validate a skill against the library schema, *plus a target*.

Real catalog names (the library has no `git-commit-helper` / `notion-sync` / `weekly-planner` / `image-classifier`):

- "Audit the `gmail-triage` skill against the library schema."
- "Does `deep-mirror` follow the schema? Check its catalog entry."
- "Lint `project-brief` before I publish it."
- "Validate `cognitive-mirror`'s SKILL.md frontmatter."
- "Run a skill audit on `eigenthinking`." *(exercises the `<skill>-evals.json`-at-root path)*
- "Check `skill-evals`'s evals are well-formed." *(existence/shape only — running them is `skill-evals`' job)*
- "Batch-audit every skill in the library." / "Audit `_staging/`."

If no target is given, the auditor asks which skill (or whether to batch-audit a directory) rather than guessing.

**Routing discriminator (load-bearing).** Three neighbor skills already claim "audit": `audit-fix` (object = a *plan/diff*, and it *mutates*), `audit-mcp` (object = a *third-party MCP repo*), `skill-evals` (*executes* evals). The Skill Auditor's discriminator is **object = a library skill directory** + **subject = schema conformance**, carried by the words "schema", "SKILL.md", "catalog", "before I publish". It must avoid bare "audit this" (→ `audit-fix`), "audit this MCP/repo" (→ `audit-mcp`), and "run the evals for X" (→ `skill-evals`).

> *Kept from Gemini: the real trigger phrases and the three-way boundary. Kept from Codex: the routing discriminator and the warning against bare "audit this."*

---

## 3. Inputs & root resolution

| Input | Required | Description |
|---|---|---|
| Target skill name or path | Yes | A skill name (`gmail-triage`), a path (`library/gmail-triage`), or a directory (batch mode). |
| Scope | No | Defaults to one skill; a directory (or "batch-audit …") switches to batch mode. |
| Severity threshold | No | Optional filter, e.g. "only show blockers and warnings." |

**Target resolution order:** (1) exact skill name in the library, (2) a path that resolves to a skill directory, (3) fuzzy name match with a confirmation prompt. If the target cannot be resolved to a skill directory, stop with a **blocker**: *"target skill not found."*

**Library-root resolution — never assume the canonical repo.** Resolve `ROOT` in this order and record which mode was used in the report:

1. **Plugin root.** If `${CLAUDE_PLUGIN_ROOT}` is set and `${CLAUDE_PLUGIN_ROOT}/library/` exists, `ROOT = ${CLAUDE_PLUGIN_ROOT}/library`. References of the form `${CLAUDE_PLUGIN_ROOT}/library/<name>/<file>` resolve by stripping the prefix and appending to `ROOT`.
2. **Canonical repo (walk up).** Otherwise walk up from the target path (or cwd) for a directory containing **both** `library/catalog.yaml` **and** `scripts/build-catalog.py`. The nearest such ancestor is the repo root; its `library/` is `ROOT`. (Require *both* markers: `catalog.yaml` alone does not guarantee the projector exists — `build-catalog.py` hardcodes `REPO = …/canonical-library/library`, so it exists only in the canonical checkout.)
3. **Explicit / ask.** Otherwise accept an explicit `--root <path>`, or ask. Do not guess.

**Availability matrix** — what each check does when its dependency is missing:

| Check | Depends on | Canonical repo (both present) | Installed plugin (`catalog.yaml`, no `build-catalog.py`) | Neither |
|---|---|---|---|---|
| 1 Frontmatter | `SKILL.md`/`instructions.md` only | full | full | full |
| 2 Catalog projection | `catalog.yaml` + projector (to *re-derive* the line) | **full** — run `<repo>/scripts/build-catalog.py --check` | **degraded best-effort** — parse committed `catalog.yaml`, verify a `  <name>:` key exists and equals the auditor's own computed flattening; every finding tagged `degraded` | **skip** with an explicit `info` finding |
| 3 References | skill dir + `ROOT` | full | full | full |
| 4 Evals | skill dir only | full | full | full |

**Non-negotiable rule:** "not checkable here" is a *distinct finding state* with its own marker, never folded into PASS. A skipped Check 2 emits an `info` finding whose `check` = `catalog`, text = `not checkable here — catalog.yaml/build-catalog.py not reachable`. A degraded best-effort comparison that disagrees still yields an `error` (tagged `degraded`); it never silently passes.

> *Kept from Claude: the inputs table and target-resolution order. Kept from Codex: the three-mode root resolution, the availability matrix, and the "not checkable here" state (verified against `build-catalog.py` lines 23–25, which hardcode the canonical `REPO`/`LIB` paths).*

---

## 4. The four audit checks

Check order is significant: frontmatter supplies the canonical `name`, which locates the correct `catalog.yaml` line, which in turn names the files whose references must resolve.

**Target:** the skill directory `library/<name>/`. Read `SKILL.md` (frontmatter — the source of truth) and `instructions.md` (body + references). Never mutate either.

### Check 1 — Frontmatter (reads `SKILL.md`)

| Criterion | Pass | Fail |
|---|---|---|
| `SKILL.md` and `instructions.md` both exist | both present | missing either → **blocker** |
| Frontmatter parses (file starts with `---`, balanced block, no duplicate top-level keys) | well-formed | unparseable → **blocker**; duplicate key → **error** |
| `name` | present, kebab-case, **== directory name** | missing/mismatch/invalid → **blocker** |
| `description` | present, non-empty, ≤ 1024 chars (may be rich) | missing/empty → **error** |
| `metadata.summary` (optional) | if present: one line, non-empty | multi-line/empty → **warning** |
| `metadata.status` (optional) | if present: `stable` · `experimental` · `deprecated` | other value → **error**; **absent = `stable`, not a finding** |
| Reserved fields (`metadata.role/requires/inputs/outputs/side_effects/version`) | present or absent — both fine | **never** a failure (forward-compatible, deliberately unpopulated) |

Two corrections the auditor must encode:

- **`description` is not "a single sentence."** `SCHEMA.md` says it is "the full trigger … may be rich (up to 1024 chars)." `deep-mirror`'s real description is a four-clause paragraph; `cognitive-mirror`'s is deliberately long for disambiguation. The one-line discipline belongs to `metadata.summary`, not `description`.
- **There is no `version` and no `id` field.** `version` appears only under "Reserved fields (not populated yet)" — deliberately unpopulated. An auditor that flags a missing `version` false-fails every healthy skill. Reserved fields are tolerated as a non-finding, never a defect.

### Check 2 — Catalog projection (reads `catalog.yaml` against `SKILL.md`)

`catalog.yaml` is a **derived projection**, regenerated by `scripts/build-catalog.py`, **never hand-edited** (its own header says so). It is a one-line index — `skills:` → `<name>: <one line>` — and has **no `path`, `version`, or `id`** to compare. The only meaningful assertion is the **projection rule**, byte-identical to the projector:

```
line = meta.get("summary") or fm.get("description")   # falsy fallback: empty summary → description
catalog_line = " ".join(line.split())                  # collapse ALL whitespace to single spaces
```

- **Pass:** `catalog.yaml` contains `  <name>: <X>` where `X` equals the auditor's own computed flattening above.
- **Fail:** entry missing → **error** (the fix is one command, not a blocker); line ≠ projection → **error**, fix = **"run `python3 scripts/build-catalog.py`"** — *never* "edit catalog.yaml".
- **Batch-only extras (projector invariants):** entries sorted by `name`; no `_staging/` entry present. Either violation → **error**.

The falsy fallback matters: an *empty-but-present* `summary:` falls through to `description` (`meta.get("summary") or …`), and `" ".join(line.split())` collapses **all** internal whitespace — including the folded `>`/`|` scalars the parser flattens — to single spaces. The auditor's flattening must be byte-identical to `build-catalog.py`'s or it false-fails on any description that legally spans folded lines.

### Check 3 — Reference resolution (reads `instructions.md` body, plus `SKILL.md` body)

Resolve, relative to the skill directory: relative Markdown links/paths; `${CLAUDE_PLUGIN_ROOT}/library/<name>/<file>` path-note forms and bare `<file>` forms (the `SKILL.md` "Path note" convention); asset/template/image references; cross-skill names (must resolve to a directory under `ROOT` — checked against **directories on disk**, not `catalog.yaml`, since a skill can exist pre-catalog).

- **Pass:** every resolvable-by-design reference points at an existing target; no dangling links.
- **Fail:** dangling relative link → **error**; missing asset/template → **error**; reference to a skill absent from disk → **error**; case-only mismatch → **warning** (name the canonical casing — case-insensitive filesystems hide the bug).

### Check 4 — Evals presence & shape (read-only; never executes)

Evals are **not a schema requirement** — `SCHEMA.md` never mentions them, and only ~6 of ~55 skills ship any. Absence is an `info` note, never a publishability gate.

- **Locations, in order** (per `skill-evals`' "don't assume the path" rule): `evals/evals.json`, `evals/*.json`, `<skill>-evals.json` (skill root — `eigenthinking`'s shape).
- **Absent → `info`** ("no evals shipped; optional").
- **Present:** JSON parses; every case has `prompt` plus a shape field. The quality field is **`expected_output`** — `pass_criteria` is generic terminology from `skills.md`, not a field any eval file uses; treat it as a tolerated legacy alias, not the canonical requirement. (`aai-check.sh` check 5 greps all three only as a loose count heuristic, not a per-case validator.)
- **Fail/warn:** malformed JSON → **error**; a case missing its shape field → **error**; `evals/` present but empty → **warning**.

> *Kept from Gemini: the entire Check 1 table (SKILL.md target, `name`+`description` only, rich description, reserved-field tolerance), the Check 2 projection-rule reframe with "never hand-edit", the Check 4 locations + `info`-not-gate. Kept from Codex: the byte-identical flattening including the falsy fallback and full-whitespace collapse, the cross-skill existence check against directories-on-disk, and the `expected_output`-vs-`pass_criteria` correction (verified: `schema.md` line 58 requires exactly `should_trigger` or `expected_output`).*

---

## 5. Output contract

One structured report per skill. Interactive output is Markdown; batch/CI also emits the same shape as JSON (one object per skill).

**Severity levels:** `blocker` (must fix — broken/unpublishable), `error` (should fix — incorrect/inconsistent), `warning` (recommended — quality/robustness), `info` (advisory). Machine-enforceable mapping:

- **blocker** = missing `SKILL.md`/`instructions.md`, unparseable frontmatter, missing `name`, `name`≠directory, invalid `name` slug.
- **error** = missing/empty `description`, invalid `metadata.status` value, catalog entry missing/mismatched, dangling relative/asset/cross-skill reference, malformed evals JSON, eval case missing its shape field.
- **warning** = multi-line/empty `metadata.summary`, case-only reference mismatch, `evals/` present but empty.
- **info** = no evals, not-checkable-here, advisory notes.

**Deterministic ordering:** findings sorted by (check number ascending, then severity rank descending — `blocker` > `error` > `warning` > `info`), then stable tiebreakers (file path → line number → literal finding text).

**Deduplication:** one finding per root cause. Two candidates are the same root cause iff they share (check number, file path, offending token/field name, canonical fix action). A stale catalog line that also fails `--check` is **one** Check 2 finding; a missing `name:` reported under Check 1 is not re-reported as a Check 2 mismatch. On collapse, keep the highest severity.

**PASS:** exactly zero blocker/error/warning findings. `info` findings (including "not checkable here" and "no evals") do not affect the result — a skill whose only findings are `info` reports ✅ PASS with N info notes.

**Exit codes (CI/script mode):**
- `0` = PASS (zero blocker/error/warning).
- `1` = FAIL (≥1 blocker/error/warning).
- `2` = usage/operational error (target not resolvable to a skill directory — name/path matches no directory, resolves to a non-directory, or unrecoverable read error).
- `3` = indeterminate (a check was skipped per the availability matrix in a way that prevents PASS/FAIL determination, with nothing worse).

Clarification: a directory that *resolves* but is missing `SKILL.md`/`instructions.md` is **not** exit 2 — it is a Check 1 blocker (exit 1), because we can still audit what exists. Exit 2 is only for targets that never resolve to a directory at all.

Batch: `0` all pass; `1` any fail; `2` usage; `3` any indeterminate with none failing.

**Determinism:** for a fixed skill state and environment, the finding set, order, severities, and exit code are deterministic. No randomness, and no model judgment in the *findings* — the model's judgment is confined to the copy-editable **suggested-fix wording**. The finding's `{check, severity, file, path/token, canonical fix action}` is data, not prose.

**Sample report:**

```markdown
# Audit Report — `trello-pipeline`

**Result:** ❌ FAIL — 1 blocker, 2 errors, 1 warning, 1 info
**Audited:** SKILL.md (frontmatter), instructions.md (body + references), catalog.yaml (projection), evals

| # | Check | Severity | Finding | Suggested fix |
|---|-------|----------|---------|---------------|
| 1 | Frontmatter | blocker | `SKILL.md` has no `name:` field | Add `name: trello-pipeline` (must equal the directory name) |
| 2 | Frontmatter | error | `metadata.status: beta` | Use one of `stable` · `experimental` · `deprecated`, or drop the key (absent = stable) |
| 3 | Catalog | error | catalog line ≠ projection (`metadata.summary` changed but catalog is stale) | Run `python3 scripts/build-catalog.py` — do not hand-edit catalog.yaml |
| 4 | References | warning | `assets/board-template.json` link is case-mismatched (`Board-Template.json` on disk) | Fix the link to the canonical casing |
| 5 | Evals | info | No evals shipped | Optional — add `evals/evals.json` (or `<skill>-evals.json`) for `skill-evals` coverage |

**Summary:** 5 findings. Fix the blocker and errors before publish; the catalog fix is one command, not an edit.
```

> *Kept from Claude: the report skeleton, severity definitions, and the "specific copy-editable fix" rule. Kept from Gemini: the sample FAIL report with real name + correct fixes. Kept from Codex: ordering, deduplication, the info-doesn't-affect-PASS rule, exit codes 0/1/2/3, and determinism.*

---

## 6. Edge cases & gotchas

- **Target not found / not a directory:** stop with a blocker; do not fabricate a partial report.
- **Missing or unparseable frontmatter:** Check 1 fails; later checks run in **degraded mode** (`name` inferred from the directory), each affected check tagged "degraded input." A broken frontmatter must not blind the auditor to catalog or reference problems.
- **New skill not yet in `catalog.yaml`:** `error` under Check 2, and clearly mark the projection comparison as *skipped* (nothing to compare) rather than silently passing.
- **`SKILL.md` does not begin with `---`** (a BOM or leading blank line): the projector's `parse_frontmatter` returns `{}` (line 43–44), which surfaces downstream as a mysterious "no description." Report "SKILL.md does not begin with `---`" as its own Check 1 finding, not a catalog drop.
- **Broken reference paths / case-sensitivity:** flag case mismatches explicitly; recommend the canonical casing.
- **Symlinked or nested skills:** resolve the real path before checking, so the `name`↔directory match isn't a false failure.
- **Stale catalog entries (skill deleted but catalog row remains):** report orphaned entries as an extra finding ("catalog references a skill that does not exist").
- **Evals in a non-standard location:** if nothing is found in the canonical locations, search the two conventional alternatives before declaring "no evals," and state which locations were checked.
- **Batch partial failure:** never abort the batch on one broken skill. Each skill yields an independent result; a skill that cannot be opened produces a single blocker finding for that skill, not a batch abort.
- **Self-reference / recursion:** cross-skill references are **verify-only, always**. A reference to another skill is checked for *existence*; the auditor never opens that skill to audit it and never emits findings about its internals. When the resolved target is `skill-auditor` itself this rule is absolute — a valid self-reference is a pass with no further action; a dangling one is an `error` *on skill-auditor itself*. The auditor refuses to re-enter the audit on a second skill, including in batch.

> *Kept from Claude: target-not-found, degraded mode, symlinks, stale-catalog, evals-location, batch-isolation, recursion. Kept from Codex: the BOM/leading-blank-line projector behavior (verified against `build-catalog.py` lines 43–47) and the verify-only recursion guard.*

---

## 7. Relationship to existing capabilities

- **vs `aai-check.sh`** — a repo-level CI gate: binary pass/fail, no per-finding fixes, no reference resolution, no evals-shape *semantics*, no per-skill invocation. The auditor is a conversational, per-skill, on-demand deep pass that does what the script cannot: reference resolution, evals shape, degraded-mode continuation, and one copy-editable fix per finding. Overlap is exactly one cell — catalog freshness (check 6) — treated as "already covered by CI, re-verified per-skill," then go further. Not a replacement: the script stays the merge gate; the auditor is the pre-publish or on-demand deep pass.
- **vs `skill-evals`** — `skill-evals` **executes** evals (fresh subagents for `should_trigger`, judges quality output); the auditor only **checks that evals exist and are well-formed**. Boundary: "does this skill have well-formed evals?" → auditor; "do those evals actually pass?" → `skill-evals`.
- **vs `audit-mcp`** — different target class: security-audits a third-party MCP repo before install. It does not touch library skills. Collision is the word "audit" only.
- **vs `audit-fix`** — audits a *plan/diff/reasoning artifact* through six adversarial lenses and then **mutates** (root-cause fix). The auditor audits a *skill directory's schema conformance*, is strictly read-only, and its "fixes" are suggestions the user applies. Object type disambiguates.

> *Kept from Gemini: all four boundaries and the "one cell of overlap" framing for `aai-check.sh`.*

---

## 8. The skill's own publishable form

**(a) `SKILL.md` frontmatter** (source of truth; body is the standard two-line form + Path note):

```yaml
---
name: skill-auditor
description: Audits a library skill directory against the publishing schema — SKILL.md frontmatter (name, description, metadata.summary, metadata.status), catalog.yaml projection sync, resolvable references (relative paths and ${CLAUDE_PLUGIN_ROOT}/library/... forms), and evals presence/shape — and reports ordered, deduplicated, actionable findings with copy-editable fixes. Read-only; never edits the target. Use for "audit this skill", "does X follow the schema", "lint X against the catalog", "check X before I publish it", "validate X's SKILL.md", or batch-auditing a directory.
metadata:
  summary: Audits a skill's SKILL.md frontmatter, catalog.yaml projection, references, and evals shape against the library schema, reporting ordered actionable findings; use for "audit this skill", "does X follow the schema", "lint X against the catalog", "check X before I publish it".
  status: experimental
---
```

Body: `Read `instructions.md` in this skill's directory and follow it.` plus the `Path note` block every other skill ships.

**(b) Computed `catalog.yaml` line** — `summary` is present and non-empty → summary wins → `" ".join(summary.split())` (verbatim, since it is already one line):

```
  skill-auditor: Audits a skill's SKILL.md frontmatter, catalog.yaml projection, references, and evals shape against the library schema, reporting ordered actionable findings; use for "audit this skill", "does X follow the schema", "lint X against the catalog", "check X before I publish it".
```

Verify before commit: `python3 scripts/build-catalog.py --check` must report up to date.

**(c) Directory layout:**

```
library/skill-auditor/
├── SKILL.md              # frontmatter above (source of truth)
├── instructions.md       # audit workflow, root resolution, output contract
└── references/
    └── schema-checks.md  # machine-enforceable check table + availability matrix + severity map
```

> *Kept from Codex: the frontmatter, computed catalog line, directory layout, and the `experimental` status (loadable but pre-stable).*

---

## 9. Design decisions (notable)

- **Read-only by contract.** Reports only; never mutates the target. Safe in CI and on published skills. Suggested fixes are plain text the user applies.
- **Dependency-ordered checks.** Frontmatter → catalog → references → evals: each stage's inputs come from the prior stage, avoiding duplicate name/path resolution and making failures cascade predictably.
- **Degraded-mode continuation.** A broken frontmatter does not blind later checks; they run on best-effort values, explicitly tagged.
- **Severity + concrete fix as the atomic finding.** Machine-actionable and human-fixable in one pass.
- **Dual output shape.** Markdown for humans, JSON for batch/CI, from one canonical internal result model.
- **The catalog check is a projection check, not a field-agreement check.** There are no mirrored fields to compare — only the one-line projection rule — and the fix is always one command, never a hand-edit.
- **The auditor is deliberately stricter than the projector.** `build-catalog.py` defaults a missing `name:` to the directory name (line 100) and *omits* a skill with no non-empty description+summary (line 107), so `--check` silently tolerates a missing `name:` and (when a summary exists) a missing `description` — contradicting `SCHEMA.md`'s "description required." The auditor is the only thing enforcing that rule. Label each check with its backstop: only two invariants (catalog↔library sync, catalog freshness) have a script backstop (`aai-check.sh` checks 1 and 6); the `status` enum, `summary` one-line, `name` presence, and `description` presence are **auditor-only**.
- **Safety:** never run `build-catalog.py` *without* `--check` — that form rewrites `catalog.yaml` (line 140), violating the read-only contract. The fix command is always *suggested*, never *executed*.

> *Kept from Claude: read-only, dependency-ordered, degraded-mode, dual-output. Kept from Gemini: the projection-not-agreement reframe. Kept from Codex: stricter-than-projector (verified: lines 100, 107) and the "never run without `--check`" safety rule (verified: line 140).*

---

## 10. Cut during synthesis

- **Claude's "frontmatter of `instructions.md`"** — factually wrong; frontmatter lives in `SKILL.md`. *Cut (replaced by Gemini's directory/SKILL.md target, verified against `SCHEMA.md` line 3 and `deep-mirror/`).*
- **Claude's invented required fields `version` and `id`** — not in the schema; `version` is a deliberately unpopulated reserved field. *Cut (replaced by Gemini's `name`+`description`-only rule).*
- **Claude's "description is a single sentence"** — contradicts `SCHEMA.md` (rich, up to 1024 chars) and would false-fail `deep-mirror`/`cognitive-mirror`. *Cut (one-line discipline moved to `metadata.summary`).*
- **Claude's Check 2 field-drift comparison (`description`/`version`/`path` mirrored in catalog)** — none of those fields exist in `catalog.yaml`; it's a one-line projection. *Cut (replaced by the projection-rule check).*
- **Claude's sample fix "add an entry … and set `path`"** — instructs hand-editing a derived file the header forbids. *Cut (replaced by "run `build-catalog.py`").*
- **Claude's fake skill names** (`git-commit-helper`, `notion-sync`, `weekly-planner`, `image-classifier`) — none exist in `catalog.yaml`. *Cut (replaced by real names).*
- **Claude's "missing catalog entry is a blocker"** — Gemini and Codex both treat it as `error` (the fix is one command; the skill itself is intact). *Cut, downgraded to `error`.*
- **Gemini's `pass_criteria` as a first-class eval shape field** — `pass_criteria` is generic terminology from `skills.md`, not a field any eval file uses; `expected_output` is the canonical quality field. *Cut (replaced by Codex's `expected_output` requirement, verified against `schema.md` line 58).*
- **Codex's exit-code wording listing "no `SKILL.md` at target" under exit 2** — ambiguous with the Check 1 blocker; resolved to: exit 2 only for targets that never resolve to a directory, blocker for a directory missing its files. *Cut/refined.*
- **Redundant re-statements** across drafts (Codex's re-listing of Gemini's verified corrections, repeated projection formulas, both sample reports where one suffices) — *Cut for tightness.*

**Out of scope (flagged, not built):** `README.md`'s Layout diagram (lines 9–15) omits `SKILL.md` even though every skill now ships one — stale, but touching it is outside the auditor's remit. *(Noted from Codex's hardening note 8.)*
