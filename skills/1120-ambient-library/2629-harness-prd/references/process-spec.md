# ProcessSpec — synthesis reference

The Phase 2 target. Source of truth: `src/lib/compiler/spec.ts` (types + `validateProcessSpec`).
A spec compiles via `compileProcess` → `resolveSkillRefs` → `validateProcessSpec` → `emitProcess`.

## Top-level shape

```ts
ProcessSpec {
  id            // snake_case identifier (also the export name, camelCased)
  name, version, description, outcome, owner
  status        // 'draft' | 'active' | 'deprecated'
  intentPatterns: string[]            // what users say to trigger this process
  requiredRunSpecFields: string[]     // run inputs that must be present
  optionalRunSpecFields: string[]
  states: StateDefinition[]
  transitions: TransitionDefinition[]
  actions?: ActionDefinition[]        // usually []
  agents: AgentDefinition[]
  skills: SkillDefinition[]           // inline (newly designed) skills
  artifactSchemas: { id, schema }[]   // content schema per artifact type
  memoryPolicies: { namespace, key, approvalRequired }[]
  orchestratorStrategy: { type: 'deterministic'|'agentic'|'hybrid', allowedToRequestProcessAmendments }
  governance: { owner, version, changelog: string[] }
  skillBindings: SkillBinding[]       // skill → agent → model → prompt
  skillRefs?: SkillRef[]              // references to LIBRARY skills (resolved at compile)
}
```

## States (`StateDefinition`)

```ts
{ id, name, type, description, terminal, transitions: string[] /* transition ids */,
  action?: { agentId, skillId },         // required for action states
  contextPolicy?: { artifacts: [], memory: [] },  // what the skill reads
  acceptanceCriteria?: [{ id, description, required }],
  evaluator?: { agentId, skillId } }
```

`type` (StateCategory): `action` | `evaluation` | `approval` | `orchestration` | `skill_gap`
| `terminal_success` | `terminal_error`. Set `terminal: true` only on the two terminal types.

## Transitions (`TransitionDefinition`)

```ts
{ id, fromState, toState, label, requiresApproval, description, maxUsesPerRun?, condition? }
```

**Routing (deterministic orchestrator):** on a passing validation it takes the transition
labeled **`pass`**; on failure it takes the transition whose label equals the
`failure_classification`, else `ambiguous_failure`, else falls back to `orchestrator_review`
then `error`. So: give every action state a `pass` transition, and a failure transition per
classification (or a generic loop-back / `ambiguous_failure`). Use `maxUsesPerRun` to bound
revision loops.

## Agents (`AgentDefinition`)

```ts
{ id, name, version, description, instructions, allowedSkills: string[],
  qualityRubric: string[], toolPermissions: string[], memoryPermissions: { read:[], write:[] } }
```

## Skills — library refs vs inline

Prefer a **ref** to a library skill:
```ts
SkillRef { skillId, agentId, version? }   // resolveSkillRefs vendors it into skills + bindings
```
Design **inline** only when nothing in the library fits:
```ts
SkillDefinition { id, name, version, description, inputSchema, outputSchema,
  sideEffects: string[], failureModes: string[], allowedAgentTypes: string[],
  requiredTools: string[], memoryWritePermissions: { read:[], write:[] } }
SkillBinding { skillId, agentId, model?, maxTokens?, prompt }
PromptSpec = { kind:'template', template, injects:string[] } | { kind:'handAuthored' }
```

**Output schema shape.** A producer skill returns an artifact envelope (pin the type via `const`):
```json
{ "type":"object", "required":["artifact"], "properties": {
  "artifact": { "type":"object", "required":["type","content_json"], "properties": {
    "type": { "const": "<artifact_type>" },
    "content_json": { /* the artifact's content schema */ } } } } }
```
An evaluator skill returns a flat shape: `{ passed, failure_classification, criteria_results, score }`.

## Validation rules (must pass `validateProcessSpec`)

- `id`, every skill id, every agent id: snake_case (`^[a-z][a-z0-9_]*$`) — they become TS identifiers.
- Unique state / transition / skill / agent / artifactSchema ids.
- A state `confirm_run_spec` of type `approval` exists (the runtime enters here).
- At least one `terminal_success` state.
- Every transition `fromState`/`toState` is a real state id.
- Every id in a state's `transitions` is a real transition whose `fromState` is that state.
- Every binding references a real skill and a real agent; template prompts are non-empty.

## Minimal worked example (one approval + one action + terminal)

```ts
{
  id: 'summarize_doc', name: 'Summarize Doc', version: '0.1.0',
  description: 'Summarize a document into key points.', outcome: 'summary', owner: 'me',
  status: 'active', intentPatterns: ['summarize this', 'tl;dr this doc'],
  requiredRunSpecFields: ['document'], optionalRunSpecFields: [],
  states: [
    { id:'confirm_run_spec', name:'Confirm', type:'approval', description:'', terminal:false, transitions:['t_go','t_no'] },
    { id:'summarize', name:'Summarize', type:'action', description:'', terminal:false,
      action:{ agentId:'summarizer', skillId:'summarize' }, contextPolicy:{ artifacts:[], memory:[] }, transitions:['t_pass'] },
    { id:'complete', name:'Done', type:'terminal_success', description:'', terminal:true, transitions:[] },
    { id:'error', name:'Error', type:'terminal_error', description:'', terminal:true, transitions:[] },
  ],
  transitions: [
    { id:'t_go', fromState:'confirm_run_spec', toState:'summarize', label:'approved', requiresApproval:false, description:'' },
    { id:'t_no', fromState:'confirm_run_spec', toState:'error', label:'rejected', requiresApproval:false, description:'' },
    { id:'t_pass', fromState:'summarize', toState:'complete', label:'pass', requiresApproval:false, description:'' },
  ],
  agents: [{ id:'summarizer', name:'Summarizer', version:'0.1.0', description:'', instructions:'',
    allowedSkills:['summarize'], qualityRubric:[], toolPermissions:[], memoryPermissions:{ read:[], write:[] } }],
  skills: [], artifactSchemas: [], memoryPolicies: [],
  orchestratorStrategy: { type:'deterministic', allowedToRequestProcessAmendments:false },
  governance: { owner:'me', version:'0.1.0', changelog:['0.1.0 — initial'] },
  skillBindings: [],
  skillRefs: [{ skillId:'summarize', agentId:'summarizer' }],  // resolved from the library
}
```
