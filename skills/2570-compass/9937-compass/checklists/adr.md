# Architecture Decision Record (ADR) Template

Use to capture each non-trivial architectural decision. Lightweight. One file per decision.

## Template

```markdown
# ADR <NNN>: <Decision title>

- **Status**: proposed | accepted | superseded by ADR-NNN
- **Date**: YYYY-MM-DD
- **Deciders**: <names / roles>

## Context

<What problem are we solving? What constraints (perf, team, regulation, stack)?>
<What is the system class — A / B / C? Quality targets?>

## Decision

<The chosen path, in one paragraph.>

## Alternatives considered

- **Option A** — <description>. Rejected because <reason>.
- **Option B** — <description>. Rejected because <reason>.

## Consequences

### Positive
- <gain 1>
- <gain 2>

### Negative
- <cost / risk 1>
- <cost / risk 2>

### Neutral
- <implication that's neither win nor loss>

## Follow-ups

- [ ] Spike / proof-of-concept needed?
- [ ] Migration plan if this replaces existing approach?
- [ ] Quality metric to monitor whether the decision plays out as expected?
```

## Tips

- Keep ADRs short (1 page). If it's longer, the decision probably hides multiple sub-decisions.
- Don't delete superseded ADRs — supersede them with a new one and link both ways. History is part of the value.
- Use ADRs to record decisions on stack, paradigm, integration style, persistence model, deployment strategy, auth model, observability stack, error-handling philosophy.
- Don't write an ADR for trivial choices. Write one when the decision is hard to reverse.
