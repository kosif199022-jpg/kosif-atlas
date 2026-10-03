# Retrieval Guide — the library, connected

> **Full version (Session 2b).** Supersedes the S1b walking-skeleton stub. All 8 role
> catalogues now exist (561 curated models), so this guide specifies **both** retrieval paths:
> (A) live CSV retrieval — the primary path in Claude Code; (B) the curated hot-set fallback
> via **domain-sliced reads** of the catalogues, for when live retrieval is unavailable.

## Principle: describe the operation, let the surface pick the tool

Retrieval is specified as **what to do**, not as a fixed command. This keeps the skill portable
across surfaces (terminal Claude Code, Desktop Claude Code, Cowork's VM) while letting each surface
run at its own ceiling. Locked decision — see `SESSION-LOG.md`, 2026-06-03. Any code below is one
surface's *how*, never the contract; another surface may use grep, awk, pandas, or hand-reading.

## Two-stage retrieval (S1a Refinement 1 — the core pattern)

Retrieval is **always two stages**, and the second is never skipped:

1. **Filter structurally** — narrow the library by `role × domain × viability` down to a small,
   readable candidate set (~tens of survivors, never the whole library).
2. **Read and select semantically** — Claude *reads* the survivors and chooses by understanding.

> **Hard rule (spec guardrail):** never select by keyword frequency or count score. S1a showed
> keyword ranking pulls domain-adjacent noise (finance models into a marketing question). The
> structural filter narrows the pool; **Claude's judgment is the only selector.**

---

## Path A — live CSV retrieval (primary)

The encyclopedia is `Mental_Models_Encyclopedia_FINAL_TAGGED_V3_PROCEDURE.csv` (2,375 rows; the
PROCEDURE-normalized derived copy — upstream `..._V3 (1).csv` stays pristine; see
`scripts/dev/normalize_csv.py`). **It ships bundled inside the skill at
`references/data/`** (self-contained — no parent folder needed), so Path A works from any
location on disk. Run live when the surface can execute code; otherwise use Path B.

**Inputs** (chosen by the router, steps 3–5):
- `roles` — the Tier-2 `Primary Role`(s) to keep (e.g. `{OPERATION}`, or `{PATTERN, MECHANISM}`).
- `domains` — the `Domain Tag`(s) to keep. **Default-include `cognitive`** for decision/diagnosis.
- `gate` — the viability set. Default **strict** `{high, llm-high}`; fallback adds `{medium, llm-medium}`.

**Procedure:**
1. Stream the CSV row by row with a **real CSV parser** (fields are quoted/multi-line — naive
   comma-splitting corrupts them).
2. Keep a row iff `Primary Role ∈ roles` **and** `Domain Tag ∈ domains` **and** `Confidence ∈ gate`.
3. For each survivor emit a **bounded, readable** record: name, short description, when-to-use,
   role, domain, confidence. Truncate long fields — the goal is a set Claude can read, not raw CSV.
4. Hand the survivors to Claude. **Claude reads them and selects by semantic judgment** (router
   step 6), recording what it rejected and why.

**Outputs:** the survivor set (for the recipe trace) and Claude's selection with rejections + reasons.

### Reference implementation (one surface's *how* — not the contract)

```python
import csv, os
# Bundled inside the skill — resolve relative to THIS file's skill root, never a
# bare CWD filename or a ../.. escape (keeps the skill runnable from any location).
_SKILL_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # references/ -> skill root
ENCYCLOPEDIA = os.path.join(_SKILL_ROOT, "references", "data",
                            "Mental_Models_Encyclopedia_FINAL_TAGGED_V3_PROCEDURE.csv")

def retrieve(roles, domains, gate, path=ENCYCLOPEDIA):
    out = []
    with open(path, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            if (row["Primary Role"].strip() in roles
                    and row["Domain Tag"].strip() in domains
                    and row["Confidence"].strip() in gate):
                out.append({
                    "name": row["Mental Model Name"].strip(),
                    "num":  row["Number"].strip(),
                    "what": (row["Mental Model Description"] or "").strip()[:200],
                    "when": (row["When To Use The Model"] or "").strip()[:200],
                    "role": row["Primary Role"].strip(),
                    "domain": row["Domain Tag"].strip(),
                    "confidence": row["Confidence"].strip(),
                })
    return out  # hand to Claude to READ and SELECT — never auto-rank by score
```

`scripts/dev/build_catalogue.py` is a working, more featureful version of this same operation (per-role
dump with the gate applied) — reuse it rather than rewriting if a script is handy.

---

## Path B — hot-set fallback via DOMAIN-SLICED catalogue reads

When live retrieval is unavailable (CSV not connected, or the surface can't execute), fall back to
the curated per-role **hot-set catalogues** in `references/catalogues/<ROLE>.md`. These hold full
six-field records and are the offline mirror of the live library.

> **Critical performance rule (spec guardrail + part-B handoff note #4):** **never load a catalogue
> whole.** `MECHANISM.md` alone is ~70k tokens; loading it blows the context budget the same way
> loading the full CSV would. Every catalogue is grouped under `#### domain: <name>` headings
> *precisely* so the fallback can read a single **role × domain slice** — the structural analogue of
> Path A's filter. Read only the slice(s) the router chose.

**Procedure:**
1. From the router's `roles`, open the matching `references/catalogues/<ROLE>.md` file(s).
2. Within each file, read **only** the section(s) under the chosen `#### domain:` heading(s) — i.e.
   extract from the chosen `#### domain: X` heading to the next `####`/`##`. Do not read the file body.
3. If the role is **thin** (a Tier-2 section exists — see table below), the domain slice may appear
   in both `## Tier 1` and `## Tier 2`; prefer Tier 1, reach into Tier 2 only if the slice is thin or
   problem specifics call for it, and scrutinize medium-confidence claims.
4. Hand the sliced records to Claude → **read and select semantically** (same stage 2 as Path A).

### Reference slice read (one surface's *how* — not the contract)

```bash
# Read only the `behavioral` slice of the PROPERTY catalogue (heading to next ####/##):
awk '/^#### domain: behavioral$/{f=1;print;next} /^(####|## )/{f=0} f' \
    references/catalogues/PROPERTY.md
```

(Any equivalent works — `sed` range, a Python heading-split, or simply reading the named section by
eye. The contract is "read the role×domain slice, not the whole file.")

### Which roles have a Tier-2 section

| Role | Models | Tiers present | Notes |
|---|---|---|---|
| MECHANISM | 144 | Tier 1 only (pure strict) | largest file — slice religiously |
| PROPERTY | 100 | Tier 1 only (pure strict) | |
| STRUCTURE | 81 | Tier 1 only (pure strict) | |
| PROCEDURE | 68 | Tier 1 only (pure strict) | existing named routines (SCAMPER, OODA…) |
| RULE | 55 | Tier 1 + **Tier 2** | thin on strict → std top-up opened |
| OPERATION | 41 | Tier 1 + **Tier 2** | single moves |
| TRAJECTORY | 39 | Tier 1 + **Tier 2** | |
| PATTERN | 33 | Tier 1 + **Tier 2** | |

Curated hot-set total: **561 models**. The cull log at the bottom of each catalogue (and
`scripts/dev/catalogue_config.json`) preserves every removed model by `#number` with a reason — so a
recipe can still reach a culled entry via the CSV (Path A) when needed.

---

## Viability gates (calibrated by S1a)

| Gate | Confidence set | Typical survivors after role×domain | Use |
|---|---|---|---|
| **strict** (default) | `high`, `llm-high` | ~60–150 | Default gate |
| **std** (fallback) | + `medium`, `llm-medium` | ~115–230 | When strict is too thin |
| **cut line** (excluded) | `low`, `llm-low`, Fuzzy | ~980 | Never retrieved |

The funnel reliably lands at a readable set: 2,375 → role-filter (~900–1,400) → +domain (~200–230) →
+strict (~60–70). The walking skeleton got **9 survivors** for one role×domain×strict slice — exactly
the scale stage-2 semantic reading needs.

## Funnel sizing — keep the candidate set readable

- **Filter per role, not as a multi-role union** (S1b insight #2). Single-role strict retrieval stays
  small; unioning roles balloons the set and reinvites the noise the structural filter exists to remove.
  If the router picks a primary + secondary role, retrieve and read them as separate slices.
- **Domain precision is the highest-leverage decision** (S1a Refinement 2). Over-broad domains drag in
  noise; default-include `cognitive` for decision/diagnosis, then add only the problem's subject domains.
- If a slice returns too many to read comfortably (> ~30–40), tighten domain first, then gate; if too
  few (< ~5), widen the gate to std before widening domains.

## Outputs feed the artifacts

The survivor set + Claude's selection (with rejections and reasons) become **Artifact 3 (recipe trace)**
— the observability layer. Retrieval is where "the router demonstrably changed *which* models were
selected" becomes visible and auditable.
