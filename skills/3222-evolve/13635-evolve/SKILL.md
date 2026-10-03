---
name: evolve
description: "Find a better implementation of a function with OpenEvolve (code evolution driven by the Claude Code CLI, no API key needed). For hot, pure functions where 'better' is a number: speed, memory, result quality. Trigger: /evolve, 'run openevolve', 'find a faster implementation', 'optimize this function with evolution'."
---

# /evolve — OpenEvolve over a piece of code

This skill assumes [OpenEvolve](https://github.com/codelion/openevolve) is installed
somewhere on the machine (referred to below as `<OPENEVOLVE_DIR>`, with a virtualenv
in `.venv`). The backend is the Claude Code CLI, so **no API key is needed** — usage
is billed through the existing `claude` login. Keep a shared config at
`<OPENEVOLVE_DIR>/configs/claude-code.yaml`.

The working area lives **outside the target repository**: `<LAB_DIR>/<target-name>/`
(e.g. `~/openevolve-lab/`). Once you have one working target, reuse its structure as
the template for the next.

## 0. First: is this task even a fit for evolution

Refuse and explain why if it isn't. OpenEvolve is expensive (every iteration is a
model call) and blind — it sees only the number you give it.

A good fit:
- a **pure function** with no side effects that can be run in isolation;
- **"better" is a number** a program can measure (ns per call, memory use,
  output length, solution score);
- **the meaning is frozen** — a reference implementation or tests exist that say
  what the correct answer is;
- **evaluation takes seconds**, not minutes.

A bad fit (do it as regular work instead):
- anything involving UI, filesystem, network, or state;
- where "better" is a matter of taste (readability, architecture);
- where you already know the solution — then just write it; evolution is not a
  substitute for thinking;
- a one-off bug fix.

## 1. Setup (four files)

```
<LAB_DIR>/<name>/
  initial_program.<ext>   # only the thing being evolved — the current implementation
  harness/main.<ext>      # the judge: frozen reference + test cases + measurement
  evaluator.py            # compiles, runs, reads JSON, returns metrics
  config.yaml             # provider claude_code + system message
```

Copy the templates from a previous working target and replace the contents; the
structure stays the same.

### The iron rule of the judge

The `harness` must contain a **frozen copy of today's implementation**, and the
score is zero until the candidate's answers match it on every single case. Without
this, evolution doesn't find a faster function — it finds a function that does less
work: always returning `false` is very fast.

The judge needs three things:
1. **a specification** — cases taken from the existing tests with hard-coded
   expected answers (not checked against the reference, so a wrong reference is
   also caught);
2. **fuzzing** — a few thousand random cases with the **same seed** for every
   candidate; include non-ASCII input if the code is Unicode-sensitive;
3. **measurement of both in the same process** — score the ratio (`speedup`),
   never absolute nanoseconds: those only tell you how busy the machine was.

`evaluator.py` returns `EvaluationResult(metrics=..., artifacts=...)`:
- `combined_score` is the only number selection uses — set it to `speedup` when
  the answers match, and to `0.0` when they don't;
- put the **compiler output** and the first mismatching case into `artifacts`;
  with `prompt.include_artifacts: true` this flows back into the prompt and is
  the best hint the model gets.

For compiled languages: compile with the **same flags and language mode as the
target project** — a candidate that wins under a different mode is useless. In
`config.yaml`, set `language` and `file_suffix` explicitly; otherwise OpenEvolve
may guess the language from the source (e.g. treat a Swift file as Python) and
write that into the prompt.

## 2. Before you run: test the judge on the original

```bash
cd <LAB_DIR>/<name>
<OPENEVOLVE_DIR>/.venv/bin/python -c "
import sys; sys.path.insert(0,'.')
from evaluator import evaluate
print(evaluate('initial_program.<ext>').metrics)"
```

Expected: `correctness: 1.0` and `speedup` around **1.0** (the original against
itself). Any deviation from 1.0 is measurement noise — remember it, because it is
the threshold below which no "improvement" is real. If the noise is more than a
few percent, increase the repetitions in the measurement before spending a single
model call.

## 3. The run

```bash
cd <LAB_DIR>/<name>
<OPENEVOLVE_DIR>/.venv/bin/openevolve-run \
  initial_program.<ext> evaluator.py -c config.yaml -i 20 -o out
```

- start with `-i 10` to `20`; if the best result doesn't move twice in a row,
  more iterations won't help — a better system message will;
- run it **in the background** with a log (`> run.log 2>&1`), because it takes
  minutes;
- read progress from the log: `New best program`, `Metrics:`;
- results: `out/best/best_program.<ext>` + `best_program_info.json`,
  intermediate stops in `out/checkpoints/`.

The system message (`prompt.system_message`) is the strongest lever you have:
say **where the time goes today** (e.g. "`Array(name.lowercased())` allocates
twice per call"), what must not change, and which input shape is most common in
practice. A generic message yields generic proposals.

## 4. What to do with the winner

**Never paste the output straight into the repository and never commit it
yourself.** The procedure:

1. read `out/best/best_program.<ext>` and **understand** why it is faster;
   if there is no explanation, the result is noise — discard it;
2. repeat the measurement — run the evaluator once more on the winner, on a
   quiet machine;
3. port it into the source file **in the repository's style**: comments explain
   *why*, not a diary of the evolution;
4. the project's full test suite must be green — the judge is no substitute for
   test cases it never saw;
5. show the user the diff and the number (ns per call before/after) and **let
   them decide** whether it goes in; commit following the project's conventions.

## 5. Cost

Every iteration is one model call (~15–30 s). Twenty iterations cost from a few
tens of cents up to about a euro. `max_budget_usd` in the config limits a
**single call**, not the total — for large runs, state the cost up front and ask.
