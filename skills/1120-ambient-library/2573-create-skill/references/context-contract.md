# Skill Brief — the context contract

The Skill Brief is the contract between a skill and whoever invokes it (a human
typing a prompt, another agent, or a scheduled task). Fill it before drafting;
save the completed brief as `CONTEXT.md` inside the new skill's folder so it
ships with the skill and future sessions have provenance.

Fill from cheapest source first: conversation history → filesystem
(`CLAUDE.md`, `.context/`, sibling skills, example files) → targeted HITL
questions for the remaining holes, batched.

## Template

```markdown
# Skill Brief: <skill-name>

## Purpose
<One sentence: what class of work this skill does. If it takes two sentences,
the scope is probably two skills.>

## Invoker & invocation schema
- Who/what invokes it: <human prompt | another agent | slash command | schedule>
- Required inputs: <args, files, selections — with formats. "none" is valid.>
- Optional inputs: <with defaults>
- Preconditions: <what must be true before it runs — env, tools, auth,
  files that must exist. The skill should verify these and fail loudly, not
  guess.>
- Outputs: <files written (where), messages returned, state changed>
- Side-effects: <anything external — sends, publishes, deletes. Flag anything
  irreversible; the skill must confirm those with the user.>

## Triggering
- Should-trigger phrasings: <3–6 realistic user utterances, varied register>
- Near-miss negatives: <2–4 adjacent requests that should NOT trigger it>

## Environment
- Where it runs: <Claude Code / Claude.ai / Cowork / any>
- Dependencies: <CLIs, Python packages, MCPs — pinned where possible>

## Success criteria
<How the user knows a run succeeded. Objectively checkable where possible —
these become the eval assertions.>

## Known gotchas
<Environment-specific facts and mistakes the model will make without being
told. Seed from the conversation that motivated the skill; grows over time.>

## Workflow steps (classified)
| # | Step | code / inference / hybrid | If inference: in → out, and why not code |
|---|------|---------------------------|------------------------------------------|
```

## Field guide

- **Invocation schema** is the highest-leverage section. A skill without a
  declared input contract silently guesses at missing context; a skill with one
  checks its preconditions and asks (or reads `CONTEXT.md` / project files)
  before doing work. Put the contract in the produced skill's body too — a
  short "Inputs" section near the top — so the executing model honors it.
- **Preconditions vs. HITL**: prefer having the produced skill *find* context
  (files, conversation, project config) over asking. Asking is the fallback,
  and the skill should batch its questions.
- **Success criteria** double as eval assertions later — write them
  objectively checkable when the skill's output allows it.
- **Near-miss negatives** double as should-not-trigger eval queries for
  description optimization.
