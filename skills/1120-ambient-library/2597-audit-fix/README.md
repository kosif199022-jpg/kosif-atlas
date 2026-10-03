# audit-fix — adversarial audit through to root cause

The full audit motion in one skill: attack the artifact, keep only findings that
**earn their place**, fix survivors at the **root cause**, and leave every
touched doc consistent. An audit that stops at findings is half a job; a pile of
symptom patches is the other failure mode. This skill does neither.

## What it does

1. **Target & mode** — plan/spec, change (diff), or reasoning; full mode
   (audit → fix → verify) or **report-only** ("just audit, don't act").
2. **Six-lens adversarial pass** — errors · omissions · oversights · blind
   spots · conflicts · duplications, worked lens by lens as a hostile expert
   reviewer. For changes, also audits what the diff *assumes* about untouched
   neighbors.
3. **The earn filter** — every finding sorted into survivors (acting on it
   changes the outcome — with the concrete failure it prevents) and discards
   (each with a one-line reason). **Discards are shown**, not hidden — the
   visible filter is what makes the survivor list trustworthy.
4. **Root-cause fixes** — trace each survivor to the shared choke point (grep
   all callers/references/copies first — evidence, not intuition), one fix where
   all paths route through. Duplications collapse to one canonical source.
5. **Ripple** — update every doc, script, skill, and comment the fixes touched.
   A fix that leaves the docs lying is a new defect.
6. **Verify & report** — re-run tests/build/render; failures go in the report,
   not under the rug. Output: finding → root cause → fix, discards with reasons,
   ripple updates, verification evidence.

## How to trigger

"audit", "audit your thinking", "adversarial review", "pressure test", "poke
holes", "blind spots", "what did we miss", "find and fix the root cause" — or
proactively after any significant plan/spec/multi-file change. Say "report only"
to audit without fixing.

## Guardrails

- Never weakens a verify/test to make a fix pass — fixes the code instead.
- Re-reads the actual artifact before attacking it (auditing from memory
  reproduces the blind spots that created the defects).
- Scope decisions (new dependency, design change, destructive op) get surfaced,
  not decided unilaterally.

## Files

- `SKILL.md` — the skill
- `evals/evals.json` — draft test prompts for the skill-creator eval loop

Provenance: distilled from 60 days of real working sessions — the audit litany
appeared ~40 times, with ~10 explicit "find and fix the root cause" directives.
