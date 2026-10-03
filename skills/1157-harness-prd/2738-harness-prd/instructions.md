# Harness PRD

Designs a stateful-agent-harness application from intent: relentlessly interviews
the user one question at a time, then synthesizes a design brief and a runnable
ProcessSpec (state machine with agents, skills, gates, artifacts). NOT for code
work-breakdowns — that is wbs-prd.

## Gotchas

- **The synthesis target is a `ProcessSpec`, not a WBS.** You are designing the *running app's
  state machine* (states / transitions / agents / skills / gates / artifacts), not a list of
  dev tasks. If you catch yourself writing work packages, you are in the wrong skill (wbs-prd).
- **The ProcessSpec schema IS the interview agenda.** Read `references/process-spec.md` before
  grilling. Every required field must be fillable without uncertainty before you synthesize.
- **Entry state must be `confirm_run_spec` (type `approval`).** The runtime always enters there —
  every process opens with a human confirming the run spec. There must also be ≥1
  `terminal_success` state.
- **Skills are state-machine-blind capabilities. Resolve against the library FIRST.** For each
  capability a phase needs, look it up in the canonical library (native + ambient at
  `$AMBIENT_LIBRARY_ROOT`) and reuse it via a `skillRef`. Only invent a new inline skill when
  nothing fits — and flag it as a promotion candidate. This is the draws-upon / contributes-to loop.
- **Prompts are data, never code.** A skill's prompt is a `{ template, injects }` (placeholders
  `{{key}}`) or `handAuthored`. The emitter turns templates into interpolating functions.
- **Evaluators don't route; the orchestrator does.** A phase that judges output produces a
  validation report; transitions (with `pass` / failure-classification labels) decide the path.
- **Don't blend grilling and synthesis.** Phase 1 extracts; Phase 2 writes. Finish the interview
  before writing the brief.
- **One question at a time, each with your recommended answer.** Reacting to a concrete proposal
  is faster than generating from scratch. If a question can be answered by reading the repo or
  the library, do that instead of asking.


## Phase 1: Grill

Interview the user until you can populate every ProcessSpec field without guessing. Walk the
hierarchy in order. Give a recommended answer with each question.

**Outcome & intent** → identity fields
- One sentence: what does a completed run produce, and for whom?
- What would a user *say* to start this? (→ `intentPatterns`)

**Run spec** → `requiredRunSpecFields` / `optionalRunSpecFields`
- What inputs must a run supply? Which are required vs optional?

**Phases** → action `states`
- What are the ordered phases of work (typically 3–10)? Each becomes an action state.

**Gates** → `approval` states
- Besides the mandatory `confirm_run_spec` entry, where must a human approve (mid-process
  checkpoints, a final-deliverable gate)?

**Flow** → `transitions`
- For each phase: the `pass` path, and the failure path(s). Any revision loops? Retry limits?

**Agents** → `agents`
- What roles perform the phases? One agent may own several skills.

**Skills** → `skillRefs` (library) + inline `skills` (new)
- For each action state, what capability runs it? Resolve against the library — reuse by id, or
  mark "generate". Bind each skill to an agent (and a model, if non-default).

**Artifacts** → `artifactSchemas` + each producer skill's output envelope
- What does each phase produce, and what is its content shape?

**Context & memory** → state `contextPolicy`, `memoryPolicies`
- What does each skill need as input (prior artifacts; memory like rubrics, voice, brand)?

**Stop when** every field in `references/process-spec.md` is fillable. If one would be blank or
vague, ask one more targeted question.


## Phase 2: Synthesize

Do not re-interview. Synthesize only from the grilling.

1. **Write the design brief** — `references/design-brief-template.md`. This is the reviewable
   midpoint (markdown). Get the user's sign-off before formalizing.
2. **Formalize** — write the `ProcessSpec` object (per `references/process-spec.md`). Use
   `skillRefs` for library skills; inline newly-designed skills. When a phase needs a capability
   the library lacks, design a new skill per `references/authoring-skills.md` (and offer to
   promote it into the library once the user approves).
3. **Compile** — call `compileProcess(spec, { outDir, library })` from
   `src/lib/compiler/compile.ts`. Build `library` from `loadNativeLibrary(...)` and/or
   `importAmbientAgents($AMBIENT_LIBRARY_ROOT/...)` composed via `CompositeLibrary`. It resolves
   refs → validates → emits. If it returns `ok: false`, fix the reported `stage` errors and re-run.
4. **Verify the walking skeleton** — register the emitted template + import its `stubs/`, create
   a run, and drive it to a terminal state on stubs (approve gates, execute action states).
5. **Report** — emitted location; which skills were reused vs newly designed (promotion
   candidates for the canonical library); any `handAuthored` prompts still to be filled.

The compiler is deterministic — your judgment goes into the brief and the spec, not the emission.
