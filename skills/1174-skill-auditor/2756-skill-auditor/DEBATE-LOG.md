# Skill Auditor — Debate Spec (shared file)

**Brief:** A new domain skill for the ambient-library plugin. It audits another skill's `instructions.md` against the library's schema — frontmatter correctness, `catalog.yaml` sync, resolvable references, evals presence — and reports actionable fixes.

**Goal:** Produce a complete, publishable spec for this skill: what it does, when it triggers, its workflow steps, outputs, and edge cases.

---

*Debate protocol: Claude drafts → Gemini critiques/adds → Codex critiques/adds → Synthesis (attributed final).*

---

## Claude's draft

### 1. What this skill does

**Skill Auditor** is a read-only, non-destructive domain skill for the ambient-library plugin that inspects a single target skill's `instructions.md` and verifies it against the library's publishing schema. It checks four things in a fixed, dependency-ordered sequence — **frontmatter**, **catalog.yaml sync**, **resolvable references**, and **evals presence** — and emits a structured, actionable audit report. The auditor never edits the target skill itself; it reports *findings* (what is wrong), *severity* (how wrong), and *suggested fixes* (exactly what to change and where). Its value is making a skill publishable and self-consistent, and it is designed to run both interactively (on the skill a user names) and in batch (across the library or a staging folder).

### 2. When it triggers / how to invoke

The skill is **on-demand**, not ambient-triggered. It fires when a user asks to audit, review, lint, check, or validate a skill against the library schema. The invocation is a natural-language command plus a target.

Example phrases:

- "Audit the `git-commit-helper` skill."
- "Run a skill audit on `skills/notion-sync`."
- "Does `weekly-planner` follow the library schema?"
- "Lint `image-classifier` against catalog.yaml."
- "Validate every skill in `_staging/`." (batch mode)
- "Check this skill before I publish it."

If no target is given, the auditor asks which skill (or whether to batch-audit a directory) rather than guessing.

### 3. Inputs

| Input | Required | Description |
|-------|----------|-------------|
| Target skill name | Yes (or path) | The skill to audit, e.g. `git-commit-helper`, or a path like `skills/git-commit-helper`, or a directory for batch mode. |
| Target scope | No | Defaults to a single skill. `--batch <dir>` switches to directory mode. |
| Severity threshold | No | Optional filter, e.g. "only show blockers and warnings." |

Resolution order for the target: (1) exact skill name in the library's skill registry, (2) a path that resolves to an `instructions.md`, (3) fuzzy name match with a confirmation prompt. If the target cannot be resolved to an `instructions.md`, the audit stops with a **blocker** finding: *"target skill not found."*

### 4. Audit workflow (check order is significant)

The auditor runs checks in this order, because each later check depends on earlier facts: frontmatter supplies the skill's canonical `name` and `id`, which are needed to look up the correct `catalog.yaml` entry, which in turn names the files whose references must resolve.

#### Check 1 — Frontmatter correctness

**What it verifies** (on the YAML frontmatter block at the top of `instructions.md`):

- The block exists and is well-formed YAML (no parse errors, tabs, or indentation bugs).
- Required keys are present: `name`, `description` (and any library-required keys such as `version`).
- `name` is a valid, slug-style identifier (lowercase kebab-case, no spaces or illegal characters).
- `name` matches the containing directory name (when a directory convention applies).
- `description` is a single, non-empty, plain-language sentence.
- No duplicate keys; optional keys conform to allowed types.

**Pass:** the frontmatter parses, all required keys are present and well-typed, and `name` is a valid slug matching the directory.

**Fail:** any missing/duplicate/malformed key, unparseable YAML, an invalid `name`, or a `description` that is empty or structurally wrong. Failures here are reported as **blocker** or **error** severity, and the auditor may still continue to later checks using best-effort values, flagging any checks it had to run with degraded input.

#### Check 2 — catalog.yaml sync

**What it verifies:**

- The skill has an entry in `catalog.yaml` (located via the frontmatter `name`).
- The entry's `name`/`id` matches the frontmatter exactly (case-sensitive).
- Key mirrored fields (`description`, `version`, `path`) agree between `instructions.md` and `catalog.yaml` — the catalog must not drift from the instruction file.
- The entry's `path` points at the directory that actually contains `instructions.md`.

**Pass:** a catalog entry exists, its identifiers match the frontmatter, mirrored fields agree, and its path is correct.

**Fail:** missing entry, identifier mismatch, field drift, or a wrong path. A missing entry is a **blocker** (the skill is unpublished/unregistered); a field drift is an **error** or **warning** depending on whether the mismatch would break resolution or just produce stale metadata.

#### Check 3 — Resolvable references

**What it verifies:** every reference inside `instructions.md` resolves. This covers:

- **Relative file links/paths** referenced in the body (sibling docs, examples, templates) — each must exist at the referenced location.
- **Cross-skill references** — a referenced skill name must exist in the library and, if the reference implies one, that skill must expose the expected entry point.
- **Asset references** (images, data files) — must resolve relative to the skill directory.
- **Catalog/registry links** — any IDs mentioned must be present in their registries.

**Pass:** every resolvable-by-design reference points at an existing target; relative paths resolve; no dangling links.

**Fail:** a broken path, a reference to a skill/file that does not exist, or a link that resolves to the wrong target. Severity is usually **error** for references that gate runtime behavior and **warning** for informational/soft links.

#### Check 4 — Evals presence

**What it verifies:**

- An evals artifact is present for the skill (e.g. an `evals/` directory, an `eval.md`/`evals.yaml`, or the library's canonical eval location).
- Each eval references the skill's entry point correctly and is runnable/well-formed.
- (If the library schema requires it) a documented pass bar or expected-result set exists.

**Pass:** evals exist, are non-empty, and reference the skill correctly.

**Fail:** no evals (a **warning** or **error** per library policy — new skills typically must ship with at least a smoke eval), empty eval files, or evals that target a non-existent entry point.

### 5. Output format — the audit report

The auditor returns a single structured report. Interactive output is Markdown; batch mode also emits the same shape as JSON (one object per skill) for downstream tooling.

```markdown
# Audit Report — `git-commit-helper`

**Result:** ❌ FAIL — 1 blocker, 2 errors, 1 warning
**Audited:** instructions.md, catalog.yaml, references, evals

| # | Check | Severity | Finding | Suggested fix |
|---|-------|----------|---------|---------------|
| 1 | Frontmatter | error | `description` is empty | Add a one-sentence description under the `description:` key |
| 2 | catalog.yaml | blocker | No entry for `git-commit-helper` | Add an entry; copy `name`/`description` from frontmatter and set `path` to the skill dir |
| 3 | References | error | `examples/prompt.md` does not exist | Create the file or fix the link in §Examples |
| 4 | Evals | warning | `evals/` is empty | Add a smoke eval that invokes the skill's entry point |

**Summary:** 4 findings. Fix blockers and errors before publish; warnings recommended.
```

**Severity levels:** `blocker` (must fix — skill is broken/unpublishable), `error` (should fix — incorrect or inconsistent), `warning` (recommended — quality/robustness), `info` (advisory). A skill with zero blocker/error/warning findings reports **✅ PASS**.

Every finding carries a **specific, copy-editable suggested fix** (the exact key to change, the file to add, or the path to correct), never a vague "fix this."

### 6. Edge cases and gotchas

- **Target not found / no `instructions.md`:** stop with a blocker — "target skill not found or has no `instructions.md`" — and do not fabricate a partial report.
- **New skill not yet in `catalog.yaml`:** report as a blocker under Check 2, and clearly mark that Check 2's field-drift comparison was skipped (nothing to compare against) rather than silently passing.
- **Missing or unparseable frontmatter:** Check 1 fails, and later checks run in *degraded mode* (name inferred from directory), with each affected check tagged "degraded input."
- **Broken reference paths / case-sensitivity:** flag case mismatches explicitly, since some filesystems are case-insensitive and the bug hides locally; recommend the canonical casing.
- **Symlinked or nested skills:** resolve the real path before checking so the `name`↔directory match isn't a false failure.
- **Stale catalog entries (skill deleted but catalog row remains):** if auditing by catalog, report orphaned entries as an *extra* finding ("catalog references a skill that does not exist").
- **Evals in a non-standard location:** if no evals are found in the canonical location, search one level of conventional alternatives before declaring "no evals," and state which locations were checked.
- **Batch mode partial failure:** never abort the whole batch on one broken skill; emit per-skill results plus a batch summary.
- **Self-reference / recursion:** the auditor must be able to audit itself and must not recurse into other skills while auditing (references are *verified*, not *audited*).

### 7. Design decisions (notable)

- **Read-only by contract.** The auditor only reports; it never mutates the target, so it is safe to run in CI and on published skills. Suggested fixes are plain text, applied by the user or a separate fixer.
- **Dependency-ordered checks.** Frontmatter → catalog → references → evals is deliberate: each stage's inputs come from the prior stage, which avoids duplicate name/path resolution and makes failures cascade predictably.
- **Degraded-mode continuation.** A broken frontmatter should not blind the auditor to catalog or reference problems, so later checks run on best-effort values but are explicitly tagged as degraded.
- **Severity + concrete fix as the atomic finding.** Every finding pairs a severity with an exact, actionable fix, making the report machine-actionable and human-fixable in one pass.
- **Dual output shape.** Markdown for humans, JSON for batch/CI, from one canonical internal result model.

---

## Gemini's additions

### Critique of Claude's draft

1. **Wrong file for the frontmatter — and the brief repeats the error.** The draft (and the brief's first line) says the auditor checks the frontmatter of `instructions.md`. It does not. The frontmatter lives in **`SKILL.md`**. Verified: `library/deep-mirror/SKILL.md` opens with the `---` YAML block (`name`, `description`, `metadata.summary`, `metadata.status`) and its body is just "Read `instructions.md`… and follow it"; `library/deep-mirror/instructions.md` opens with `# Deep Mirror — cognitive-data lifecycle manager` and has **no frontmatter at all**. SCHEMA.md line 3 is explicit: "Each library skill's `SKILL.md` frontmatter is the **single source of truth**," and `build-catalog.py` line 95 reads `d / "SKILL.md"`, never `instructions.md`. The audit target is therefore the skill **directory** — `SKILL.md` for metadata (Checks 1–2), `instructions.md` for the body and its references (Check 3).

2. **The required field set is exactly two fields — `name` and `description` — and the draft invents more.** SCHEMA.md's Fields table lists `name` (yes) and `description` (yes) as required; `metadata.summary` (no) and `metadata.status` (no) as optional. The draft invents `version` (line 53: "any library-required keys such as `version`") and `id` (lines 46, 68). Neither is required. `version` appears in SCHEMA.md only under "**Reserved fields (not populated yet)**" — "`role`, `requires`, `inputs`/`outputs`, `side_effects`, `version` (git SHA + path, resolved at scan time) — all under `metadata:` … These are **deliberately unpopulated**." An auditor that flags a missing `version` (or any reserved field) fails every healthy skill in the library. The auditor must *tolerate* unpopulated reserved fields as a non-finding, not a defect.

3. **`description` is not "a single sentence."** Draft Check 1 (line 56) requires "a single, non-empty, plain-language sentence." SCHEMA.md line 15 says `description` is "the full trigger — Agent Skills spec field; may be rich (up to 1024 chars)." `deep-mirror`'s real description is a four-clause paragraph; `cognitive-mirror`'s is deliberately long for load-bearing disambiguation (SCHEMA.md lines 48–50). A "single sentence" rule would false-fail both. The one-line discipline belongs to `metadata.summary`, not `description`. Correct check: non-empty, any length ≤ 1024 chars, and it must fold to one line when projected.

4. **`catalog.yaml` has no `path`, `version`, or `id` to compare — it is not a data store.** A catalog entry is literally one line: `<name>: <one flattened line>` (catalog.yaml header lines 7–8; the entire file is 60 one-liners under `skills:`). Draft Check 2 compares "mirrored fields (`description`, `version`, `path`)" (line 69) and checks "the entry's `path` points at the directory" (line 70). None of those fields exist. SCHEMA.md lines 5–6: catalog is "a **derived projection** … regenerated by `scripts/build-catalog.py`, never hand-edited."

5. **The catalog check is the wrong operation — it must verify the *projection rule*, not "field agreement."** The only catalog assertion that means anything is: the line equals `metadata.summary` if present, else `description`, flattened to one physical line, with entries sorted by name and `_staging/` skipped (SCHEMA.md lines 40–42; `build-catalog.py` lines 92–109: `line = meta.get("summary") or fm.get("description")`, `" ".join(line.split())`, `sorted(entries)`, `if d.name == "_staging": continue`). And the *fix* for a mismatch is one command — `python3 scripts/build-catalog.py` (SCHEMA.md workflow step 2; `aai-check.sh` check 6's own failure message, line 196: "stale — run scripts/build-catalog.py"). The draft's sample fix (line 114: "Add an entry; copy `name`/`description` … and set `path`") instructs the user to **hand-edit a derived file**, which is precisely what the catalog header forbids ("DERIVED — … do NOT hand-edit").

6. **`aai-check.sh` already owns catalog↔frontmatter drift at the repo level — the draft doesn't know it exists.** Check 1 of `aai-check.sh` verifies catalog↔library sync in *both* directions (every catalog key has a directory + `instructions.md`; every non-`_staging` directory has a key), and check 6 shells to `build-catalog.py --check` and fails on any drift (lines 190–196). SCHEMA.md workflow step 3: "`scripts/aai-check.sh` (check 6) fails if they ever diverge." The auditor's added value cannot be re-verifying check 6; it must be the *per-skill, on-demand, deeper* checks the script never does — reference resolution, evals shape, degraded-mode reporting, per-finding copy-editable fixes (see §3 below).

7. **Evals presence is not a schema requirement at all.** SCHEMA.md never mentions evals; only `name` + `description` gate publishability. Empirically, 5 of ~55 skills ship `evals/evals.json` (enrich-prompt, fresh-eyes, audit-fix, grill, wrap) and `eigenthinking` ships `eigenthinking-evals.json` at the skill *root*, not in `evals/`. Draft Check 4 treats absence as "warning or error per library policy" and assumes a canonical `evals/` location. Absence should be an **info** note, never a schema gate, and the check must recognize both the `evals/evals.json` and `<skill>-evals.json` (root) shapes — the exact "don't assume the path, read the skill's directory" rule `skill-evals` instructions.md (lines 27–29) already states.

8. **Fake skill names throughout (Gap 3).** `git-commit-helper`, `notion-sync`, `weekly-planner`, `image-classifier` appear in the trigger phrases (lines 25–28), the inputs table (line 38), and the worked report (line 106). None is in `catalog.yaml`. The library's real names include `deep-mirror`, `cognitive-mirror`, `eigenthinking`, `skill-evals`, `audit-fix`, `audit-mcp`, `meeting-nuggets`, `polyglot-language-coach`, `gmail-triage`, `trello-pipeline`, `voice-crm-pipeline`, `project-brief`, `writing-team`.

9. **No boundary against existing skills (Gap 2).** `skill-evals`, `audit-mcp`, and `audit-fix` all already exist in the catalog and all plausibly answer "audit this." The draft never distinguishes them, so the router (which matches on one-line descriptions and loads exactly ONE skill) cannot disambiguate "audit this skill" from "audit this plan" from "audit this MCP repo." See §3.

### Revised audit-checks spec

**Target:** a skill directory `library/<name>/`. Read `SKILL.md` (frontmatter — source of truth) and `instructions.md` (body + references). Never mutate either.

#### Check 1 — Frontmatter (reads `SKILL.md`)

| Criterion | Pass | Fail |
|---|---|---|
| `SKILL.md` and `instructions.md` both exist | both present | missing either → **blocker** |
| Frontmatter parses (balanced `---`, no duplicate top-level keys) | well-formed | unparseable → **blocker**; duplicate key → **error** |
| `name` | present, kebab-case, **== directory name** | missing/mismatch → **blocker** |
| `description` | present, non-empty, ≤ 1024 chars (may be rich) | missing/empty → **error** |
| `metadata.summary` (optional) | if present: one line, non-empty | multi-line/empty → **warning** |
| `metadata.status` (optional) | if present: one of `stable` · `experimental` · `deprecated` | other value → **error**; **absent = `stable`, not a finding** |
| Reserved fields (`metadata.role/requires/inputs/outputs/side_effects/version`) | present or absent — both fine | **never** a failure (forward-compatible, deliberately unpopulated) |

#### Check 2 — catalog projection (reads `catalog.yaml` against `SKILL.md`)

- **Pass:** catalog contains a line `  <name>: <X>` where `X` == `" ".join((metadata.summary or description).split())` — i.e. summary-if-present-else-description, flattened to one physical line.
- **Fail:** entry missing → **error** (not blocker — the fix is one command); line ≠ projection → **error**, fix = "run `python3 scripts/build-catalog.py`", **never** "edit catalog.yaml".
- **Batch-only extras:** entries sorted by `name`; no `_staging/` entry present. Either violation → **error** (projector invariant).

#### Check 3 — Reference resolution (reads `instructions.md` body, plus `SKILL.md` body)

- Resolve, relative to the skill directory: relative Markdown links/paths; `${CLAUDE_PLUGIN_ROOT}/library/<name>/<file>` path-note forms and bare `<file>` forms (per the `SKILL.md` "Path note" convention in `deep-mirror`); asset/template/image references; cross-skill names (must be a key in `catalog.yaml` `skills:`).
- **Pass:** every resolvable-by-design reference points at an existing target; no dangling links.
- **Fail:** dangling relative link → **error**; missing asset/template → **error**; reference to a skill absent from catalog → **error**; case-only mismatch → **warning** (name the canonical casing, since case-insensitive filesystems hide the bug).

#### Check 4 — Evals presence & shape (read-only; does NOT execute)

- **Locations to check, in order:** `evals/evals.json`, `evals/*.json`, `<skill>-evals.json` (skill root) — per `skill-evals`' "don't assume the path" rule.
- **Absent evals → `info`** ("no evals shipped; optional"). This is **not** a schema failure.
- **Present evals:** JSON parses; every case has `should_trigger` **or** `expected_output`/`pass_criteria` (the two shapes in `skill-evals/references/schema.md`).
- **Fail/warn:** malformed JSON → **error**; a case with neither shape → **error**; `evals/` present but empty → **warning**.

### Relationship to existing capabilities

- **vs `aai-check.sh`** — a repo-level CI gate that runs all checks across the whole library and reports binary pass/fail with no per-finding fixes, no reference-resolution, no evals-shape check. The auditor is a *skill* (conversationally invoked), runs **per-skill and on-demand**, and does what the script cannot: reference resolution, evals shape, degraded-mode continuation, and one copy-editable fix per finding. Their overlap is exactly one cell — catalog freshness (check 6) — and the auditor should treat that cell as "already covered by CI, verified again here per-skill," then go further. Not a replacement; the script stays the merge gate, the auditor is the pre-publish or on-demand deep pass.
- **vs `skill-evals`** — `skill-evals` **executes** evals: spawns fresh subagents for `should_trigger` cases, judges `expected_output`/`pass_criteria` quality cases, and emits a PASS/FAIL table with no scores. The auditor **checks** that evals *exist and are well-formed*; it never runs a case. Boundary: "does this skill have well-formed evals?" → auditor; "do those evals actually pass?" → `skill-evals`.
- **vs `audit-mcp`** — a different target class entirely: security-audits a third-party **MCP server repo** before install (trufflehog/semgrep/mcp-scan, secrets/exec/outbound/OAuth checks). It does not touch library skills. The only collision is the word "audit"; trigger text should disambiguate ("audit this skill's schema" vs "audit this MCP/repo").
- **vs `audit-fix`** — `audit-fix` audits a **plan / diff / reasoning artifact** through six adversarial lenses (errors, omissions, oversights, blind spots, conflicts, duplications) and then **fixes at root cause** (it mutates). The auditor audits a **skill's structural conformance to the library schema**, is strictly **read-only**, and its "actionable fixes" are *suggestions the user applies*, not edits it performs. Overlap is the word "audit" again: object type disambiguates — a skill directory routes to the Skill Auditor, a plan/diff routes to `audit-fix`.

### Real worked examples

**Trigger phrases (real catalog names):**

- "Audit the `gmail-triage` skill against the library schema."
- "Does `deep-mirror` follow the schema? Check its catalog entry."
- "Lint `project-brief` before I publish it."
- "Run a skill audit on `eigenthinking`." *(exercises the `<skill>-evals.json`-at-root path)*
- "Validate `cognitive-mirror`'s SKILL.md frontmatter."
- "Check `skill-evals`'s evals are well-formed." *(existence/shape only — running them is `skill-evals`' job)*
- "Batch-audit every skill in the library." / "Audit `_staging/`."

**Sample PASS report (shows a rich description, absent status, and absent evals are all *correct*, not findings):**

```markdown
# Audit Report — `deep-mirror`

**Result:** ✅ PASS
**Audited:** SKILL.md (frontmatter), instructions.md (body + references), catalog.yaml (projection), evals

- Frontmatter: `name: deep-mirror` == directory ✓; `description` present and rich (≤1024 chars) ✓;
  `metadata.summary` present ✓; `metadata.status` absent (= stable) ✓; no reserved fields required ✓.
- Catalog: line == flattened `metadata.summary` ✓ (regenerated, not hand-edited).
- References: `${CLAUDE_PLUGIN_ROOT}/library/deep-mirror/<file>` path note resolves ✓.
- Evals: none shipped — info only, not a schema failure.
```

**Sample FAIL report (illustrative, real name):**

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

---

## Codex's additions

### 1. Critique of Claude's and Gemini's contributions (technical / structural / measurable)

Gemini's core corrections are **correct** and I verified each against the sources: frontmatter lives in `SKILL.md` (SCHEMA.md line 3; `build-catalog.py` line 95 reads `SKILL.md`, never `instructions.md`); the required set is exactly `name` + `description`; `catalog.yaml` is a derived one-line projection with no `path`/`version`/`id`. I will not re-litigate those. The remaining defects are the *measurable/mechanical* ones:

1. **Claude — no machine contract.** §5 defines severities and a report shape, and line 121 even states the PASS rule ("zero blocker/error/warning"), but nothing is *deterministic*: no finding ordering, no deduplication rule, no exit-code convention, no guarantee that two runs over the same skill yield identical findings. A CI caller cannot build on it. (Fixed in §4 below.)

2. **Claude — batch mode is under-specified.** `--batch <dir>` (line 39) and "never abort the batch" (line 134) are stated with no iteration order, no per-skill isolation rule, no fast-checks-first ordering, and no batch-summary shape. (Fixed in §6.)

3. **Both — the catalog fix command is asserted, not verified.** Gemini's fix ("run `python3 scripts/build-catalog.py`") is only correct in the canonical checkout, because `build-catalog.py` hardcodes `REPO = Path(__file__).resolve().parent.parent` and `LIB = REPO / "canonical-library" / "library"` (lines 23–25). In an installed-plugin layout there is **no** `scripts/` and **no** `canonical-library/` under `${CLAUDE_PLUGIN_ROOT}`, so the projection check *and its one-command fix* are unavailable there. Neither draft states that degradation. (Fixed in §2.)

4. **Gemini — Check 2's projection predicate is slightly incomplete against the real projector.** Gemini writes `X == " ".join((metadata.summary or description).split())`. The real rule (build-catalog.py line 104) is `meta.get("summary") or fm.get("description")`, then `" ".join(line.split())`. Two differences matter: (a) an *empty-but-present* `summary:` falls through to `description` (falsy fallback, not "summary if present"); (b) `" ".join(line.split())` collapses **all** internal whitespace — including the folded `>`/`|` scalars the parser flattens at lines 72–82 — to single spaces, so the auditor's own flattening must be byte-identical or it false-fails on any description that legally spans folded lines. (Fixed in §3.)

5. **Gemini — "entry missing → error" vs Claude's "blocker" is unresolved, and both miss a sharper fact.** `build-catalog.py` line 100 defaults a *missing* `name:` key to the directory name (`fm.get("name") or d.name`), and line 107 *omits the skill entirely* when it has no non-empty description+summary — so `--check` silently tolerates an absent `name:` and (when a summary exists) an absent `description`, even though SCHEMA.md calls `description` required. The auditor is therefore deliberately stricter than the projector, which is correct — but the spec must label which invariants have a script backstop vs which are auditor-only, or readers will assume `--check` catches everything. (§7 tables this.)

6. **Gemini — Check 4's eval field name is subtly off.** Gemini says a case has "`should_trigger` OR `expected_output`/`pass_criteria`". `library/skill-evals/references/schema.md` (lines 39–59) makes `expected_output` the **only** actual quality field; `pass_criteria` is generic terminology from skills.md, not a field any of the six eval files uses. `aai-check.sh` check 5 (line 173) greps all three only because it is a loose count heuristic, not a per-case validator. The auditor's per-case check should require `expected_output` and treat `pass_criteria` as a tolerated legacy alias. (§7.)

### 2. Gap 1 — Root resolution

The auditor must never assume it runs from the canonical repo. Resolve the **library root** in this order, and record *which mode* was used in the report:

1. **Plugin root.** If `${CLAUDE_PLUGIN_ROOT}` is set and `${CLAUDE_PLUGIN_ROOT}/library/` exists, `ROOT = ${CLAUDE_PLUGIN_ROOT}/library`. References of the form `${CLAUDE_PLUGIN_ROOT}/library/<name>/<file>` resolve by stripping the prefix and appending to `ROOT`.
2. **Canonical repo (walk up).** Otherwise, walk up from the target skill path (or cwd), looking for a directory that contains **both** `library/catalog.yaml` **and** `scripts/build-catalog.py`. The nearest such ancestor is the repo root; its `library/` is `ROOT`. (Require *both* markers: `library/catalog.yaml` alone does not guarantee the projector exists.)
3. **Explicit/ask.** Otherwise accept an explicit `--root <path>`, or ask the user for the library root. Do not guess.

**Availability matrix — what each check does when its dependency is missing:**

| Check | Depends on | Canonical repo (`build-catalog.py` + `catalog.yaml` present) | Installed plugin (`catalog.yaml` present, `build-catalog.py` absent) | Neither present |
|---|---|---|---|---|
| 1 Frontmatter | `SKILL.md`/`instructions.md` only | full | full | full |
| 2 Catalog projection | `catalog.yaml` + `build-catalog.py` (to *re-derive* the expected line) | **full** — invoke `<repo>/scripts/build-catalog.py --check` | **degraded best-effort** — parse the committed `catalog.yaml`, verify a `  <name>:` key exists and equals the auditor's own computed flattening (no `--check`, no regeneration); every finding tagged `degraded` | **skip with an explicit `info` finding "not checkable here — catalog.yaml/build-catalog.py not reachable"** |
| 3 References | skill dir + root | full | full (`ROOT` = plugin root) | full (`ROOT` = target dir) |
| 4 Evals | skill dir only | full | full | full |

**Non-negotiable rule:** "not checkable here" is a *distinct finding state* with its own marker, never folded into PASS. A run that skips Check 2 emits an `info` finding whose `check` = `catalog`, whose text = `not checkable here — catalog.yaml/build-catalog.py not reachable`, so the summary is honest. A degraded best-effort comparison that disagrees still yields an `error` (tagged `degraded`); it never silently passes.

### 3. Gap 2 — Implementation mechanics (no heavy dependencies)

**Frontmatter parser (dependency-free, mirrors `build-catalog.py` exactly):**

- Delimiter split: require the file to *start* with `---`; take `text.split("---", 2)` (exactly line 44) and require ≥ 3 parts, else "no frontmatter".
- Top-level key regex, identical to the projector's: `^(\w[\w-]*):\s?(.*)$` (line 52). Use it to read `name`, `description`, `metadata`, and to detect **duplicate top-level keys** (the projector overwrites silently — the auditor must flag).
- `metadata:` nesting exactly one level (lines 59–71); folded/literal scalars (`>`, `|`, `>-`, `|-`, `>+`, `|+`, and empty-value-then-indented) flattened with `" ".join(...)` (lines 72–82).
- **Fallback rule:** the above naive parser *is* the fallback (zero deps). If `python3` is available you *may* use a strict YAML parse, but you must then **re-flatten with the identical projector rules** before comparing to `catalog.yaml` — the catalog on disk was produced by the naive parser, not PyYAML, so the comparison target is the naive output. The correctness invariant is: *the auditor's projection predicate is byte-identical to `build-catalog.py`'s.*

**Reference scanner:**

- Markdown links: `\[[^\]]*\]\(([^)]+)\)` → capture group. Skip `http://`, `https://`, `mailto:`, `#`-only anchors, and `<...>` autolinks.
- Bare relative paths: match path-shaped tokens `(^|[\s`"'(\[{])([A-Za-z0-9_./-]+\.(?:md|json|ya?ml|txt|png|jpe?g|svg|html|csv|sh|py|tsx?|jsx?))(?:[\s`"')\]}.,;]|$)` and resolve the captured path against the skill directory. Keep it conservative (only flag clearly path-shaped tokens).
- Plugin-root forms: `\$\{CLAUDE_PLUGIN_ROOT\}/[A-Za-z0-9_./-]+` (exactly the regex `aai-check.sh` check 4 uses at line 143). Strip the prefix, resolve against the library root.
- Cross-skill names: a backticked token or `${CLAUDE_PLUGIN_ROOT}/library/<name>/...` whose `<name>` is a directory under `ROOT`. Existence is checked against the **directories on disk**, not `catalog.yaml` (a skill can exist pre-catalog).

**Exact commands (verified against the script):**

- Catalog check (canonical repo): `python3 <repo>/scripts/build-catalog.py --check`. Exit codes and outputs, confirmed from `build-catalog.py`:
  - `0` — up to date. stdout: `catalog.yaml up to date (N skills)` (line 127).
  - `1` — stale. stderr: a unified diff, then `catalog.yaml is STALE — run scripts/build-catalog.py` (line 138). **Fix = run `python3 scripts/build-catalog.py`; never hand-edit catalog.yaml.**
  - `2` — structural error. stderr: one `ERROR ...` line per problem — `ERROR <dir>: no SKILL.md` (line 97), `ERROR <dir>: frontmatter name 'X' != directory name` (line 102), `ERROR <dir>: SKILL.md has no description` (line 106). The auditor maps exit 2 to per-skill Check 1/2 findings, not a generic "check failed".
- Repo cross-check (optional, canonical repo): `scripts/aai-check.sh` — exit `0` all pass / `1` any fail (lines 24, 199). Its check 6 skips with `NOTE catalog freshness check skipped (python3 not found)` (line 192) and does **not** fail in that case. The auditor may cite it but must not substitute its binary pass for per-finding output.
- **Safety:** the auditor never runs `build-catalog.py` *without* `--check` — that form rewrites `catalog.yaml` (line 140), a mutation that violates the read-only contract. The fix command is always *suggested*, never *executed*.

### 4. Gap 3 — Measurable output contract

- **(a) Ordering.** Findings sorted by (check number ascending, then severity rank descending: `blocker`=4 > `error`=3 > `warning`=2 > `info`=1), then stable tiebreakers (file path → line number → literal finding text).
- **(b) Deduplication.** One finding per root cause. Two candidates are the same root cause iff they share (check number, file path, offending token/field name, canonical fix action). A stale catalog line that also fails `--check` is **one** Check 2 finding; a missing `name:` reported under Check 1 is not re-reported as a Check 2 mismatch. On collapse, keep the highest severity.
- **(c) PASS.** Exactly zero blocker/error/warning findings. `info` findings (including "not checkable here" and "no evals") do not affect the result: a skill whose only findings are `info` reports ✅ PASS with N info notes.
- **(d) Exit codes (CI/script mode).** `0` = PASS (zero blocker/error/warning); `1` = FAIL (≥1 blocker/error/warning); `2` = usage/operational error (target not resolvable, no `SKILL.md` at target, unrecoverable I/O); `3` = indeterminate (a check was skipped that prevents PASS/FAIL determination). Batch: `0` all skills pass, `1` any skill fails, `2` usage, `3` any skill indeterminate with none failing. (This is stricter than `aai-check.sh`, which is binary 0/1.)
- **(e) Determinism.** For a fixed skill state and fixed environment, the finding set, its order, severities, and PASS/FAIL/exit-code are deterministic. No randomness, and no model judgment in the *findings* — the model's judgment is confined to the copy-editable **suggested-fix wording**. The finding's `{check, severity, file, path/token, canonical fix action}` is data, not prose.

Severity mapping (machine-enforceable): `blocker` = missing `SKILL.md`/`instructions.md`, unparseable frontmatter, missing `name`, `name`≠directory, invalid `name` slug; `error` = missing/empty `description`, invalid `metadata.status` value, catalog entry missing/mismatched, dangling relative/asset/cross-skill reference, malformed evals JSON, eval case missing its shape field; `warning` = multi-line/empty `metadata.summary`, case-only reference mismatch, `evals/` present but empty; `info` = no evals, not-checkable-here, advisory notes.

### 5. Gap 4 — The skill's own publishable form

**(a) `SKILL.md` frontmatter:**

```yaml
---
name: skill-auditor
description: Audits a library skill directory against the publishing schema — SKILL.md frontmatter (name, description, metadata.summary, metadata.status), catalog.yaml projection sync, resolvable references (relative paths and ${CLAUDE_PLUGIN_ROOT}/library/... forms), and evals presence/shape — and reports ordered, deduplicated, actionable findings with copy-editable fixes. Read-only; never edits the target. Use for "audit this skill", "does X follow the schema", "lint X against the catalog", "check X before I publish it", "validate X's SKILL.md", or batch-auditing a directory.
metadata:
  summary: Audits a skill's SKILL.md frontmatter, catalog.yaml projection, references, and evals shape against the library schema, reporting ordered actionable findings; use for "audit this skill", "does X follow the schema", "lint X against the catalog", "check X before I publish it".
  status: experimental
---
```

Body (after the frontmatter): the standard two-line body — `Read `instructions.md` in this skill's directory and follow it.` plus the `Path note` block every other skill ships (resolves `${CLAUDE_PLUGIN_ROOT}/library/skill-auditor/<file>` → `<file>` in this directory).

**(b) Computed `catalog.yaml` line.** Projection = `meta.get("summary") or fm.get("description")` → summary is present and non-empty → summary wins → `" ".join(summary.split())`. Since the summary is already one physical line with single spaces, the flattened line equals it verbatim:

```
  skill-auditor: Audits a skill's SKILL.md frontmatter, catalog.yaml projection, references, and evals shape against the library schema, reporting ordered actionable findings; use for "audit this skill", "does X follow the schema", "lint X against the catalog", "check X before I publish it".
```

(Verify before commit by running `python3 scripts/build-catalog.py --check` — it must report up to date.)

**(c) Directory layout:**

```
library/skill-auditor/
├── SKILL.md              # the frontmatter above (source of truth)
├── instructions.md       # the audit workflow, root-resolution, and output contract
└── references/
    └── schema-checks.md  # the machine-enforceable check table + availability matrix (§2) + severity map (§4)
```

**(d) Routing disambiguation.** The router reads **one** catalog line and loads **one** skill. Three neighbors already claim the word "audit": `audit-fix` ("audit this", "pressure test", "poke holes" — object is a *plan/diff*, and it mutates), `audit-mcp` ("audit this MCP" — object is a *third-party repo*), and `skill-evals` ("run the evals for X" — *executes* evals). The Skill Auditor's load-bearing discriminator is **object = a library skill directory** + **subject = schema conformance**, carried by the words "schema", "SKILL.md", "catalog", "before I publish". Its trigger must contain one of those; it must avoid bare "audit this" (routes to `audit-fix`), "audit this MCP/repo" (`audit-mcp`), and "run the evals for X" (`skill-evals`). `metadata.status: experimental` keeps it loadable but marks it pre-stable.

### 6. Gap 5 — Recursion guard & batch scale

**Recursion guard.** Cross-skill references are **verify-only, always**: a reference to another skill is checked for *existence* (name resolves to a directory under `ROOT`); the auditor never opens that skill's `SKILL.md`/`instructions.md` to audit it, and never emits findings about its internals. When the resolved target is `skill-auditor` itself, this rule is absolute: Check 3 runs in verify-only mode on every reference, including `${CLAUDE_PLUGIN_ROOT}/library/<other>/<file>` forms — a valid reference to another skill is a pass with no further action; a *dangling* reference is still an `error` finding **on skill-auditor itself**. "Recursion" only ever means re-entering the audit on a second skill, which the auditor refuses by construction — including in batch.

**Batch scale (~55 skills).**

- **Ordering:** alphabetical by directory name (`sorted()`, matching `build-catalog.py` line 92). `_staging/` is always skipped (line 93), unless explicitly named as the target.
- **Partial failure:** never abort the batch on one broken skill. Each skill yields an independent result object; the batch continues past blockers/errors/IO failures. A skill that cannot be opened (no `SKILL.md`, unreadable dir) produces a single blocker finding for that skill, not a batch abort.
- **Fast checks first:** two phases. **Phase A** (cheap; one pass over all skills): Check 1 existence + frontmatter-parse + `name`/`description` presence, and Check 2 catalog-line presence/flattening. **Phase B** (on demand): Check 3 reference resolution and Check 4 evals shape, run per-skill only when the user asks for a deep audit or when a Phase-A result is non-pass. Reference scanning + JSON evals parsing is the O(files × skills) cost; most pre-publish questions are answered by Phase A.
- **Batch summary shape** (JSON, one object): `{ "skills_audited": N, "pass": Np, "fail": Nf, "indeterminate": Ni, "exit_code": 0|1|2|3, "per_skill": [ { "name", "result": pass|fail|indeterminate, "finding_count_by_severity": {...}, "findings": [...] }, ... ] }`, `per_skill` sorted alphabetically to match iteration order.

### 7. Hardening notes (verified against the scripts — the spec must not get these wrong)

1. **`build-catalog.py --check` exit codes are 0 / 1 / 2** with distinct meanings (up-to-date / stale / structural error). Map exit 2 to per-skill `ERROR` lines, not a blanket "check failed".
2. **The projector does NOT enforce `name` presence** (line 100 defaults it to the directory name) **and drops a skill with no non-empty description+summary** (line 107 `continue`). Consequence: `--check` will *not* catch a missing `name:`, and a skill with a missing `description` but a present `summary` still produces a catalog entry that passes `--check` — contradicting SCHEMA.md's "description required". The auditor is the only thing enforcing that rule; state that explicitly.
3. **`meta.get("summary") or fm.get("description")` is a falsy fallback** — an empty-but-present `summary:` falls back to `description`. Replicate exactly, including in the degraded no-projector mode.
4. **The parser requires the file to start with `---`** (line 43). A BOM or a leading blank line makes it return `{}`, which surfaces downstream as "no description". The auditor should report "SKILL.md does not begin with `---`" as its own frontmatter finding, not a mysterious catalog drop.
5. **Backstop split.** Only two invariants have a script backstop today: catalog↔library sync and catalog freshness (`aai-check.sh` checks 1 and 6). The `metadata.status` enum, `metadata.summary` one-line, `name` presence, and `description` presence are **auditor-only** invariants. Label each row of the check table with its backstop so nobody assumes `--check` covers everything.
6. **Eval field name is `expected_output`**, not `pass_criteria` (`skill-evals/references/schema.md` lines 39–45). `aai-check.sh` line 173 greps all three only as a loose count heuristic; the auditor's per-case check must require `expected_output`.
7. **`aai-check.sh` is binary 0/1 and its check 6 skips (NOTE) when python3 is absent** — it does not fail in that case. The auditor's "not checkable here" finding is the per-skill analog and must be surfaced, not silently skipped.
8. **`README.md`'s Layout diagram (lines 9–15) is stale** — it lists only `instructions.md` + `references/` and omits `SKILL.md`, even though every skill now ships one and it is the schema source of truth. Out of auditor scope, but flag if the README is ever touched.
