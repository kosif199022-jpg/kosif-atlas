# Design Brief — <Process Name>

The reviewable midpoint between the interview and the ProcessSpec. Write this in plain language,
get the user's sign-off, THEN formalize to a spec. One brief per process.

## Outcome
One sentence: what a completed run produces, and for whom.

## Triggers
What a user says to start this process (→ `intentPatterns`).

## Run inputs
| Field | Required? | Notes |
|---|---|---|
| <field> | yes/no | |

## Phases
Ordered. Each non-gate phase becomes an action state.

| # | Phase | Agent (role) | Skill | Reuse or new? | Produces (artifact) |
|---|---|---|---|---|---|
| 1 | <phase> | <role> | <skill_id> | reuse `lib:<id>` / **new** | <artifact_type> |

## Gates (human approval)
- `confirm_run_spec` — entry (always).
- <other gates: mid-process checkpoints, final deliverable>.

## Flow & loops
- Happy path: confirm → … → complete.
- Failure / revision: which phases loop back, on what, and the retry bound.

## Skills: reuse vs build
- **Reused from library:** <ids> (native / ambient).
- **New (to design inline, promotion candidates):** <ids> — one line each on what they do.

## Context & memory
- Per skill: prior artifacts it reads; memory it needs (rubrics, voice, brand).

## Open questions / risks
- <anything unresolved that the user should confirm before formalizing>
