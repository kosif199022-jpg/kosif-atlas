---
name: The Meta-Prompt Move
type: command
description: Give Claude the goal instead of the method — and have it design the optimal prompting strategy, interaction structure, and output format before producing any content. Turns you from a prompt writer into a prompt commissioner.
source: Kasimir Hedstrom — Jun 19, 2025 AIMM session on infinite prompt engine, principle-first approach
trigger: /aimm:meta-prompt
location: wiki/mastermind/commands/
source-sessions:
  - 2025-06-19_Mastermind
---

# The Meta-Prompt Move

Give Claude the goal instead of the method — and have it design the optimal prompting strategy, interaction structure, and output format before producing any content. Turns you from a prompt writer into a prompt commissioner. From Kasimir's infinite prompt engine and the principle-first approach discussed in the Jun 19, 2025 AIMM session.

---

You will NOT answer my request directly. Instead, you will first design the best possible approach to answering it — then execute that approach. The difference matters: when I write a prompt, I'm constrained by what I already know about how to ask. When you design the approach, you can apply structural knowledge about what actually produces the best output for this type of request.

The cognitive mechanism: most prompts over-specify the method and under-specify the goal. This inverts that. I'll give you the goal with high precision. You design the method — including what questions to ask me, what structure to use, what roles to adopt, what quality checks to run, and what format to deliver.

MY GOAL: $ARGUMENTS

If no goal was provided above, ask me what I'm trying to accomplish.

MY CONSTRAINTS: [ANY HARD REQUIREMENTS — length, format, audience, deadline, tools available. Say "none" if flexible on everything. Say "you decide" to have me infer reasonable constraints from the goal]

If "you decide," state the inferred constraints and proceed.

---

STEP 1 — GOAL DECOMPOSITION:
Before designing anything, make sure you understand the goal precisely:
- What is the actual outcome I need? (Not "what did I ask for" but "what would make this successful")
- What's the context this output will be used in?
- What are the implicit quality criteria I probably care about but didn't state?

If any of these are ambiguous, ask me — but limit yourself to 3 clarifying questions maximum. Don't turn this into an interrogation.

---

STEP 2 — STRATEGY DESIGN:
Design the optimal approach for this specific goal. Explicitly state:

**Approach architecture:**
- What method or framework will produce the best result for this type of goal?
- Should this be done in one pass or multiple passes? If multiple, what does each pass accomplish?
- Are there intermediate outputs that should be generated before the final deliverable?

**Role selection:**
- What expertise or perspective should I adopt? (Be specific — not "expert" but the specific type of expert whose knowledge structure matches this goal)
- Should multiple perspectives be applied? If so, in what sequence?

**Quality criteria:**
- What does "good enough" look like for this output?
- What are the 2-3 most common failure modes for this type of request, and how will I avoid them?
- What should I check before delivering?

**Output format:**
- What structure, length, and format best serves the goal?
- What should be included and — equally important — what should be left out?

---

STEP 3 — INFORMATION GAP CHECK:
Before executing, identify what additional information from me would materially improve the output. Distinguish between:
- **Must-have**: information without which the output will be wrong or useless
- **Nice-to-have**: information that would upgrade quality but isn't blocking

Ask for must-haves. Proceed without nice-to-haves (and note what you assumed).

---

STEP 4 — EXECUTE:
Now produce the output using the strategy you designed. Follow your own plan — don't revert to default behavior midway through.

---

STEP 5 — SELF-AUDIT:
After producing the output, audit it against your own strategy:
- Did I actually follow the approach I designed, or did I default to standard patterns?
- Does the output meet the quality criteria I set in Step 2?
- Which failure modes did I successfully avoid, and which ones crept in anyway?

If the audit reveals gaps, fix them before delivering. Don't just flag them — revise.

---

CONSTRAINTS:
- The strategy design (Step 2) should be visible to me — don't hide your reasoning. Seeing your approach is part of the value, because it teaches me how to think about prompting.
- Don't over-engineer the strategy for simple goals. If the best approach is "just answer the question directly," say so and do it. The meta-step should add value, not ceremony.
- If the goal is creative (writing, ideation, brainstorming), the strategy should emphasize non-obvious angles and specify what "surprising but valid" looks like for this domain.
- Adapt the number of passes, the depth of the strategy, and the formality of the output to match the actual complexity of the goal — including but not limited to: quick tactical requests (1 pass, lightweight strategy), medium-complexity projects (2 passes, explicit quality criteria), and deep strategic work (3+ passes, multiple roles, verification layer).

## Source

- [[wiki/mastermind/sessions/2025-06-19_Mastermind]] (Kasimir Hedstrom — infinite prompt engine, principle-first approach)
