---
name: prompt-prep
description: "Turns a raw, half-formed task description into a high-quality Fable 5 prompt by first hunting the user's blind spots. Use when the user invokes /prompt-prep, asks to 'prepare/improve/refine a prompt', or hands over a task that is underspecified in ways they probably haven't noticed. Based on Thariq Shihipar's (Anthropic) Fable 5 prompting method: quality is limited by unfound unknowns, not by the model."
---

# /prompt-prep

Prepare a better prompt before doing the work. The premise (Thariq Shihipar, Anthropic): with Fable 5, output quality is limited by the user's ability to surface their own unknowns — not by the model. So the job of this skill is NOT to polish wording. It is to find what the user doesn't know they haven't told you, and only then write the prompt.

Converse in the user's language (Slovenian if they write Slovenian). The final refined prompt may be written in English or the user's language — ask if unclear, default to the language of the raw task.

## Usage

```
/prompt-prep <raw task description>     # refine this task into a proper prompt
/prompt-prep                            # ask for the raw task first
/prompt-prep --quick <task>             # skip the interview; blindspot pass + refined prompt only
/prompt-prep --run <task>               # after refinement, immediately execute the refined prompt
```

## The four quadrants (the map you are filling in)

For the given task, every relevant fact falls into one of four boxes:

| | User knows it | User doesn't know it |
|---|---|---|
| **Stated / recognized** | Known knowns — already in the prompt | Known unknowns — open questions the user is aware of |
| **Unstated / unrecognized** | Unknown knowns — "obvious" context the user would never think to write down, but would instantly recognize as important (house conventions, past decisions, taste) | Unknown unknowns — things nobody has considered yet (edge cases, conflicting subsystems, hidden constraints) |

The raw prompt only contains the first box. Your work targets the other three:
- **Known unknowns** → resolve by the interview (Step 3).
- **Unknown knowns** → resolve by showing options/prototypes and by asking recognition-style questions ("is it like X or like Y here?") — the user can't recall these, but can recognize them.
- **Unknown unknowns** → resolve by the blindspot pass (Step 2): YOU go look at the code/domain, because the user can't ask about what they haven't considered.

## Step 1 — Calibrate the starting point

Before anything else, establish (from context or one question):
- What is the user's experience level with this specific area? (Expert in the codebase but new to auth? New to the codebase entirely?)
- What already exists — is this greenfield, an extension, or a fix?
- What is the real goal behind the task (the "why now")?

State your read back in one or two sentences. Fable 5 responds strongly to knowing the user's starting point — this calibration goes verbatim into the final prompt.

## Step 2 — Blindspot pass (unknown unknowns)

Actively explore before asking anything. Use Explore/general-purpose agents or direct search on the codebase, docs, or domain:

- Which existing modules, conventions, or prior implementations does this task touch?
- What has been solved before in this repo that the task would duplicate or conflict with?
- Which constraints exist that the raw prompt is silently violating (architecture rules, security, data model, migrations)?
- What edge cases does the data or code reveal that the task description ignores?

Report findings as a short list titled **"Blind spots found"** — each item one sentence, with file references where relevant. If the task is not code-related, do the equivalent domain research (web, docs).

This phase is cheap; the same discovery after implementation is expensive. Do not skip it.

## Step 3 — Structured interview (known unknowns + unknown knowns)

Interview the user with AskUserQuestion, **one round at a time**, max ~5 questions total. Prioritize ruthlessly:

1. First, questions whose answer would **change the architecture or approach** — these gate everything else.
2. Then, questions that resolve ambiguity in scope or behavior.
3. Skip anything you can resolve from the code or with a sensible default — state the default instead of asking.

For unknown knowns, prefer **recognition over recall**: present 2–4 concrete options (with previews where useful) instead of open questions. For visually- or taste-heavy tasks (UI, report layout, API shape), offer to generate 2–3 radically different quick prototypes/sketches first — divergence is how the user discovers what they actually want.

With `--quick`, skip this step; convert would-be questions into explicit stated assumptions in the final prompt.

## Step 4 — Write the refined prompt

Produce the final prompt in a fenced code block, ready to paste (or execute with `--run`). Structure:

1. **Context & starting point** — who the user is relative to this task, what exists, why now (from Step 1).
2. **Goal** — the outcome, not the mechanism.
3. **References** — concrete file paths, prior implementations, docs. Point at source code, not descriptions of it — Fable reads the underlying code, not the presentation.
4. **Constraints & decisions** — everything resolved in Steps 2–3, plus repo rules that apply. Include a short "decisions made during prep" list so the executing session inherits them.
5. **Degrees of freedom** — explicitly mark what the model should decide itself. This is the specificity dial (see below).
6. **Plan-first instruction** — for non-trivial tasks, instruct: plan the changeable elements first (data models, interfaces, user-facing behavior) before mechanical work; keep a running note of decisions and edge cases hit during implementation, choosing the conservative option when surprised.
7. **Verification** — how the result will be judged (tests, manual flow, review criteria).

### The specificity dial

Calibrate deliberately, and say so in the prompt:
- **Over-specified** prompts cause rigid adherence even when pivoting mid-task would clearly help. Only pin down what you actually verified matters (in Steps 2–3).
- **Under-specified** prompts get industry-default choices that miss the user's real context. Everything that surfaced as a blind spot must be pinned.
- For the rest, write: "You may decide X, Y, Z yourself; flag the decision in your summary."

## Step 5 — Hand off

End with:
- The refined prompt (code block).
- A 3-line diff summary: what the refined prompt contains that the raw one didn't, and which blind spots it closes.
- Offer: run it now in this session, or the user pastes it into a fresh session (recommend fresh session for large tasks — clean context, no prep noise).

After the actual implementation (whether run here or elsewhere), optionally offer the post-implementation tools from the same method: an **explainer** (summary of what changed and why, for stakeholders) and a **quiz** (a few questions verifying the user understands the change before merging).
