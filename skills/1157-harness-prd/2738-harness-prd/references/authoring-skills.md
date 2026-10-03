# Authoring & promoting a skill

Read this when the interview needs a capability the library doesn't have — i.e. a phase has no
matching `skillRef`. You design a new **SkillPackage**; the backend in
`src/lib/compiler/skill-package.ts` validates, persists, and promotes it.

## When to generate vs reuse

Reuse first. Only author a new skill when nothing in the native or ambient library fits. A new
skill is a *promotion candidate* — flag it for the user. Keep it one coherent capability with a
tight I/O contract (a well-designed function), not a grab-bag.

## SkillPackage shape

```ts
SkillPackage {
  id, version,                         // id snake_case; id === definition.id
  definition: SkillDefinition,         // the capability contract (input/output schema, etc.)
  prompt: PromptSpec,                  // { kind:'template', template, injects } | { kind:'handAuthored' }
  defaults?: { model?, maxTokens? },
  provenance: { source: 'generated' }, // becomes 'native' on promotion
}
```

## Design the contract (the judgment part)

1. **Output schema.** A producer skill returns an artifact envelope — build it with
   `artifactEnvelope(artifactType, contentSchema)` so the `type` is pinned via const and the
   content sits under `content_json`. An evaluator returns a flat
   `{ passed, failure_classification, criteria_results, score }`.
2. **Input schema.** What the skill reads — its context keys as JSON Schema. Keep it minimal.
3. **Prompt as data.** Write a `template` with `{{placeholder}}` keys (list them in `injects`),
   or `handAuthored` if it needs real logic to fill later. Never inline free TypeScript.
4. **Metadata.** `allowedAgentTypes`, `sideEffects` (e.g. `['creates_artifact']`), `failureModes`.

## Persist and promote (the deterministic part)

```ts
import { validateSkillPackage, writeSkillPackage, promoteSkill } from '@/lib/compiler/skill-package'

const v = validateSkillPackage(pkg)            // fix errors before writing
writeSkillPackage(pkg, processLocalDir)        // keep it with the process while iterating

// After the USER approves contributing it back:
const r = promoteSkill(pkg)                     // → native library (src/canonical/skills/)
// r.ok === false if it already exists; pass { force: true } only on a deliberate version bump.
```

Promotion is **human-gated**: ask the user before calling `promoteSkill`. Once promoted, other
processes reference it by id via a `skillRef` — the next interview will find and reuse it.

## In the meantime, it still runs

An un-promoted new skill compiles and walks on its emitted stub (schema-derived). So the process
is runnable before the skill is real — fill the prompt/implementation later, or promote and
implement when it earns a place in the library.
