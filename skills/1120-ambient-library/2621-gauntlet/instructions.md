# Gauntlet — exceptional work, earned by evidence

Use Gauntlet when the user wants a demanding quality bar, parallel specialists,
critical review, and repeated refinement. The mechanism is:

`criterion -> owner -> evidence -> critic -> correction`

It turns "make it perfect" into a quality bar that can be assessed honestly.
Never call work perfect, AAA-quality, production-ready, compliant, or better than
a benchmark without direct evidence supporting that exact claim.

## 1. Establish the contract before acting

Extract or ask for the following. Do not begin implementation if a material
unknown would change the work.

- **Artifact and goal:** What is being delivered, for whom, and what outcome must it create?
- **Scope:** Required capabilities, exclusions, source materials, technology, rights,
  security, budget, time, and compatibility constraints.
- **Benchmark:** The reference standard, plus the evidence that can actually be
  inspected. A benchmark that is inaccessible, proprietary, or subjective is an
  aspiration, not proof of parity.
- **Done criteria:** Functional behavior, quality attributes, performance/reliability
  targets, required delivery artifacts, and non-regressions.
- **Authority:** Decisions, credentials, paid tools, releases, or external actions
  that require the user's approval.

Translate each criterion into a pass/fail check and an evidence source. If the user
supplies only a superlative ("world-class", "flawless", "better than X"), preserve
the intent but propose observable proxies before claiming completion.

## 2. Build the work matrix

Split the objective into independent, bounded workstreams only when delegation
improves speed or review quality. Each workstream must name:

- its artifact and boundaries;
- its owner;
- the acceptance criteria it is responsible for;
- its verification method; and
- inputs or decisions it depends on.

Keep integration ownership with one coordinator. Do not let parallel agents alter
overlapping files, silently expand the brief, or treat their own work as verified.
Use the fewest agents that cover genuinely independent surfaces.

## 3. Execute and retain evidence

Implement the workstream, then collect raw evidence appropriate to the artifact:

- code/system: tests, logs, builds, diffs, performance measurements;
- visual/interactive: rendered states, device/viewport checks, interaction traces,
  accessibility and frame-time observations;
- research/writing: source checks, requirements traceability, reader-task review;
- operations: dry runs, before/after state, rollback and monitoring evidence.

Report facts, failed checks, and uncertainty separately. Never manufacture a
comparison, test result, or reviewer consensus.

## 4. Run the independent critic

After each substantive pass, have a reviewer who did not author the work inspect
the artifact and evidence. Give the reviewer the goal, criteria, artifact paths,
and benchmark material; do not give them the implementer's rationale or verdict.

The critic must return:

1. what was inspected;
2. the standard applied;
3. criteria that pass, with evidence;
4. criteria that fail, with a concrete defect and severity; and
5. the smallest correction likely to make each failure pass.

Reject unsupported praise. "Looks excellent" is not a result; "passes contrast,
layout, interaction, and frame-time checks shown in these captures" is.

## 5. Correct, re-check, and converge

For each accepted finding:

1. assign a targeted correction to the responsible owner;
2. preserve unrelated work and fix the underlying cause rather than a symptom;
3. re-run the affected verification; and
4. send the revised artifact to an independent critic again.

Continue only while the next iteration has a specific failing criterion and a
feasible, authorized correction. Escalate instead of looping when an asset,
decision, access right, or quality definition is missing; when the benchmark cannot
be tested; or when further iterations no longer address a stated criterion.

## 6. Integrate and hand off

Finish only when every agreed criterion has an evidence-backed pass, or has been
explicitly deferred by the user. Deliver:

- the artifact and changed files;
- a criterion-by-criterion evidence ledger;
- unresolved limits and unverified claims;
- known edge cases or residual risks; and
- the next release, monitoring, or user-validation step.

Do not substitute agent enthusiasm for acceptance. The deliverable is done because
the evidence satisfies the agreed contract.
