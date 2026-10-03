---
name: The Prompt Abstraction Ladder
type: command
description: Climb from task-level prompting to meta-level to meta-meta-level — three distinct altitudes of prompt design, each producing fundamentally different outputs. Most people stay on the ground floor. This takes you to the roof.
source: multiple — Jul 31, 2025 AIMM session on three levels of prompt abstraction
trigger: /aimm:prompt-abstraction-ladder
location: wiki/mastermind/commands/
source-sessions:
  - 2025-07-31_Mastermind
---

# The Prompt Abstraction Ladder

Climb from task-level prompting to meta-level to meta-meta-level — three distinct altitudes of prompt design, each producing fundamentally different outputs. Most people stay on the ground floor. This takes you to the roof. From the Jul 31, 2025 AIMM session on the three levels of prompt abstraction and context engineering.

---

You will take a prompt or task and reconstruct it at three levels of abstraction — each level generating a categorically different type of output. This isn't about making prompts "better." It's about recognizing that the altitude at which you prompt determines the ceiling of what you can get back.

The mechanism: Level 1 (task) asks AI to do something specific. Level 2 (meta) asks AI to design the approach to doing it. Level 3 (meta-meta) asks AI to examine the assumptions behind the approach itself. Most people operate exclusively at Level 1 and wonder why AI output feels shallow. Each level up trades directness for leverage — you get less immediate output but more strategic value per interaction.

THE PROMPT OR TASK TO CLIMB: $ARGUMENTS

If no prompt or task was provided above, ask me to share a prompt I've been using or a task I want AI to help with.

MY CURRENT LEVEL: [WHERE I THINK I'M OPERATING NOW — Level 1 (task), Level 2 (meta), or "not sure." Say "you decide" to have me assess from the prompt]

If "you decide," assess the current level and explain why before proceeding.

---

STEP 1 — LEVEL ASSESSMENT:
Analyze the provided prompt or task and identify its current abstraction level:

**Level 1 — Task Prompt** ("Do this thing"):
- Specifies the output directly ("Write me a LinkedIn post about X")
- Contains the topic, format, and often the tone
- Gets exactly what's asked for — no more, no less
- Failure mode: ceiling is bounded by the prompter's imagination

**Level 2 — Meta Prompt** ("Design how to do this thing"):
- Asks AI to design the approach before executing ("What's the best way to write content about X for my audience?")
- Generates strategy, frameworks, or methodology as the primary output
- The output is a PROCESS, not a product
- Failure mode: can produce elegant strategies that never get executed

**Level 3 — Meta-Meta Prompt** ("Examine why we're doing this thing and whether the frame is right"):
- Questions the assumptions behind the task ("Am I even asking the right question? What would I be doing if I weren't anchored to X?")
- Generates reframes, paradigm shifts, or fundamental redirections
- The output changes the QUESTION, not the answer
- Failure mode: infinite regression — climbing so high you never come back down to do anything

State the current level and explain what signals place it there.

---

STEP 2 — RECONSTRUCT AT ALL THREE LEVELS:
Take the original prompt/task and produce three versions:

**Level 1 Reconstruction** — The best possible task-level prompt:
- Optimized for clarity, specificity, and output quality
- Includes context, constraints, audience, and format
- This is what most "prompt engineering" teaches
- Expected output: a direct deliverable

**Level 2 Reconstruction** — The meta-level version:
- Asks AI to analyze the problem space, design the approach, and THEN execute
- Includes strategic questions: what are the options? What's the best framework? What would an expert do differently?
- Expected output: a methodology that can be applied repeatedly, plus one execution of it

**Level 3 Reconstruction** — The meta-meta-level version:
- Questions the frame: is this the right problem? What assumptions am I making about what "success" looks like? What would change if I started from the audience's actual need instead of my current framing?
- Expected output: a reframe that might redirect the entire effort — or confirm that the original direction was right (which is also valuable)

For each level: write the actual prompt text AND describe what kind of output it would produce.

---

STEP 3 — LEVEL SELECTION GUIDANCE:
Not every task benefits from climbing. Recommend the right level for this specific situation:

- **Stay at Level 1 when**: The task is well-defined, the approach is obvious, and execution speed matters more than strategic depth. (Example: "Write a meeting summary" — just do it)
- **Go to Level 2 when**: The task is important enough to warrant designing the approach first, or when you'll repeat this type of task many times and want a reusable method. (Example: "Build a content strategy" — the how matters as much as the what)
- **Go to Level 3 when**: You suspect you might be solving the wrong problem, or when the stakes are high enough that a wrong frame wastes significant resources. (Example: "Redesign our onboarding" — are you sure onboarding is the problem?)

State which level you'd recommend for this specific task and why.

---

STEP 4 — THE LADDER IN PRACTICE:
Demonstrate the practical workflow: show how to start at Level 3, use the insight to inform Level 2, then execute at Level 1 — all in one interaction. This cascading approach gets the benefits of all three levels without the infinite regression problem.

Produce a single combined prompt that walks through all three levels in sequence for the user's specific task.

---

STEP 5 — VERIFICATION:
- Are the three levels genuinely different in kind, or just different in length? (Level 2 is not "a longer Level 1." It must produce a different TYPE of output)
- Does the Level 3 reconstruction actually challenge the frame, or does it just add the word "assumptions" to the same task?
- Is the level selection guidance honest, or am I defaulting to "always go higher"? Some tasks genuinely belong at Level 1.

Revise any level that doesn't hold up to scrutiny.

## Source

- [[wiki/mastermind/sessions/2025-07-31_Mastermind]] (multiple — three levels of prompt abstraction)
