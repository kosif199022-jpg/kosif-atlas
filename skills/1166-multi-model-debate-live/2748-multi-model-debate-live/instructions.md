# Multi-Model Live Debate

## What This Skill Does

This skill captures Lou's live multi-model debate workflow: a three-pane Ghostty terminal running Claude, Gemini, and Codex in parallel, all writing to the same markdown file, with Marked auto-refreshing the rendered view so every contribution is visible the moment it lands. A human conductor steers between turns — reading what each model just added and tailoring the next model's instructions to address what is missing, weak, or questionable. After all three models have contributed, a synthesis model (Lou used Opus) reads the full file, keeps the best of each contribution, cuts the weak material, and explains every decision with attribution.

**Important distinction — orchestration vs. deliberation:** A `/multi-model-synthesis` command already exists in this vault as a *deliberation prompt protocol* — copy-paste templates and a golden-nugget synthesis rule for running structured parallel deliberation across model tabs. **This skill is different.** It is the *live orchestration layer*: terminal setup, headless CLI invocation, the shared-file write protocol, and the human-in-the-loop steering pattern that makes the debate actually happen on your desk in real time. Use `/multi-model-synthesis` when you need the prompt scaffolding. Use this skill when you want to conduct the live workflow.

**Source:** Lou's live demo, PowerUp Coaching mastermind session, 2026-02-26.

> *"The perspective and training that comes from using the other models, I find, is usually additive, as opposed to just editive."*
> — Lou, 2026-02-26

---

## When to Use

Use the live debate workflow when:

- You are designing a high-stakes spec (a new skill, a methodology, a system prompt, a proposal) and a single-model first draft is not good enough
- You want models to *correct each other* on technical or factual ground — Codex catching what Claude got wrong, Claude acknowledging and incorporating
- You want to actively steer the conversation between turns rather than fire-and-forget a parallel deliberation
- The artifact is small enough to fit comfortably in one shared markdown file (a skill, a spec, a prompt, a framework — not a 50-page document)
- The visible "this changed under my eyes" feedback of Marked auto-refresh actually changes how you think about the artifact

Do **not** use this skill when:

- You only need one extra perspective (a single counterparty model in a chat tab is sufficient)
- The artifact is too long for shared-file editing (use `/multi-model-synthesis` document-improvement template instead)
- You don't have time to steer turn-by-turn — the value of this workflow lives in the human conductor

---

## Prerequisites / Setup

**Hardware/OS:** macOS (the demo was on Mac; Marked is Mac-only — the workflow can be approximated on Linux with a different markdown previewer).

**Terminal:**
- **Ghostty** — terminal emulator with native split-pane support. Lou uses three panes side by side: one for Claude, one for Gemini, one for Codex. ([ghostty.org](https://ghostty.org/))

**Markdown viewer (live refresh):**
- **Marked 2** — markdown previewer that auto-refreshes the rendered view whenever the source file changes on disk. Available via SetApp or standalone. ([marked2app.com](https://marked2app.com/) — also in SetApp at [setapp.com/apps/marked](https://setapp.com/apps/marked))
- Open Marked on the shared spec file *before* starting the debate. The auto-refresh is the feedback loop that makes the workflow tangible.

**Model CLIs (one per pane):**
- **`claude` CLI** — Anthropic's official Claude Code CLI, running interactively in pane 1
- **`gemini` CLI** — Google's headless Gemini CLI, running interactively in pane 2
- **`codex` CLI** — OpenAI's Codex CLI, running interactively in pane 3
- **Synthesis model** — Lou used Claude Opus (a fourth invocation in any pane — typically pane 1) for the final synthesis pass. Any model with strong long-context reasoning can play this role.

**Shared spec file:**
- Decide on an absolute path for the markdown file before the session starts (e.g., `~/specs/article-writer-skill.md`).
- All three CLI sessions need read+write access to that path. The path is the *only* coordination mechanism — there is no message bus, no queue. The file is the bus.

> **Gap in source material:** The demo did not show the exact CLI flags used to invoke each model headlessly, nor whether any of the panes were running in scripted (non-interactive) mode. Treat the model CLI invocations as interactive sessions where you paste the prompt manually each turn unless/until a more automated pattern is documented.

---

## Step-by-Step Workflow

The protocol is five steps. The human conductor reads and steers between every step — that human-in-the-loop pause is where the quality comes from.

### Step 1 — Create the shared spec file

Decide what artifact you are debating. For Lou's demo, it was *"a skill that takes an article idea, fleshes it out, and writes the article."*

Create the file at the agreed absolute path. It can start empty or with a one-sentence brief at the top describing the goal.

Open Marked on the file. Verify auto-refresh is active. Open the three Ghostty panes with Claude, Gemini, and Codex CLIs running.

**Steering moment (before Step 2):** Decide what the *initial* spec should contain. Are you giving Claude a blank canvas, or seeding it with constraints? The initial framing biases everything downstream — be deliberate.

### Step 2 — Claude writes the initial spec

In the Claude pane, prompt Claude to:

1. Read the brief at the top of the shared file (or take the brief from your message if the file is empty).
2. Draft the initial version of the spec.
3. **Save it directly to the shared file path** — Claude should write the file, not return the spec in chat.

Watch Marked auto-refresh as Claude writes. Read the result.

**Steering moment (before Step 3):** What did Claude get right? What feels generic, hand-wavy, or unreliable? What is missing that you specifically want Gemini to address? Draft Gemini's prompt to push on those gaps — not as a generic "improve this", but as a directed instruction.

### Step 3 — Gemini reads and adds

In the Gemini pane, prompt Gemini to:

1. Read the current state of the shared file from disk.
2. Critique what is there and contribute new ideas, additions, or corrections.
3. **Append its contributions to the shared file** — clearly attributed (e.g., a `## Gemini's additions` section, or inline edits with comments). The exact attribution convention is up to the conductor, but consistency matters for the synthesis step.

Watch Marked refresh. Read what Gemini added.

**Steering moment (before Step 4):** Where did Gemini go beyond Claude? Where did it duplicate? Did it surface anything that contradicts Claude — a factual correction, a different framing? Tailor Codex's prompt to push on whatever neither Claude nor Gemini covered well. Codex tends to be strong on technical precision and measurable quality criteria — point it at those gaps.

### Step 4 — Codex reads and adds

In the Codex pane, prompt Codex to:

1. Read the full current state of the shared file.
2. Critique both prior contributions and add what is missing — particularly anything technical, structural, or measurable.
3. **Append its contributions to the shared file** with the same attribution convention.

Watch Marked refresh. Read what Codex added. In Lou's demo, Codex caught things Claude had gotten wrong; Claude later acknowledged the corrections in synthesis. That cross-model correction is the high-value moment of the workflow.

**Steering moment (before Step 5):** Read the *whole file* now. What is the strongest idea from each model? What is over-engineered, unreliable, or over-explained? Draft the synthesis prompt with these in mind — be specific about what you want kept and what you want cut, but leave room for the synthesis model's judgment.

### Step 5 — Synthesis model reads everything and writes the final version

In any pane (Lou used Claude Opus), prompt the synthesis model to:

1. Read the complete shared file with all three contributions.
2. Think deeply about what each model contributed.
3. Write the final version of the spec — keeping the best ideas from all sources, cutting the weak ones.
4. **Explain every significant decision** — for each kept element, attribute it to the model that contributed it; for each cut, briefly say why.
5. Save the final version back to the shared file (typically replacing the prior contents, with the prior version archived if you want a record).

In Lou's demo, Opus explicitly kept the *"extraction interview"* idea from Gemini (strong on the human DNA problem), kept the *"operating modes"* from Codex (strong on measurable quality), and cut the things that were over-engineered or unreliable. Each kept element was attributed to its source model.

Read the final version against your original intent. If it still has gaps, run another targeted turn — this protocol is not strictly five steps, it's "as many steps as the artifact needs, with steering between every one."

---

## Expected Output

A single markdown spec file that:

- Contains the strongest version of the artifact your model set could produce
- Has visible attribution for which model contributed which element (in the synthesis pass)
- Is genuinely better than any single model would have produced alone — the test is whether you can point to specific elements and say "no single model produced this"
- Took approximately 15–30 minutes of active conducting for a skill-sized artifact

The intermediate states (Claude's draft, Gemini's additions, Codex's additions) are also outputs — they show *where each model was strong and weak* on this class of problem, which is information you can use to assign roles in future debates.

---

## Variants and Extensions

**Two-model lite:** If you don't have all three CLIs installed, run Claude + one other model in two panes. The workflow is identical; you lose Codex's technical-correction strength or Gemini's recency strength, depending on which you drop.

**Synthesis model = same as a debater:** Lou used Opus as the synthesis model, which is also Claude. This works because the synthesis pass is reading the *whole file* (a different cognitive task than the original drafting), but if you want stricter independence, use a fourth model for synthesis.

**Manual fallback (no GhostTTY/Marked):** As Lou noted in the session, *"You don't need the full GhostTTY setup; you can do this manually across browser tabs."* Open three browser tabs (claude.ai, gemini.google.com, chatgpt.com), copy the shared spec between them by hand, and steer the same way. You lose the auto-refresh feedback loop but the protocol still works.

**Extended chains:** Add a fourth model turn (e.g., Perplexity for sourced claims) before synthesis. Add a second synthesis pass after a steering correction. The five-step protocol is the floor, not the ceiling.

**Pair with `/multi-model-synthesis` prompts:** Use the prompt templates from the `/multi-model-synthesis` command (Decision Deliberation Template A, Document Improvement Template B) as the *content* of what you paste into each pane in this live workflow. The two systems compose: this skill is the orchestration layer, that command is the prompt layer.

---

## Related Commands, Skills, and Insights

**Commands:**
- [[multi-model-synthesis]] — the deliberation prompt protocol (golden-nugget synthesis rule, model assignment guidance, copy-paste templates). This skill is the live-orchestration counterpart; that command is the prompt scaffolding.

**Insights:**
- [[Insight - Multi-Model Debate as a Quality Control System for High-Stakes Work]] — the full architecture and rationale for why multi-model debate produces additive (not editive) quality gains. The 2026-02-26 session's highest-scoring insight.
- [[Insight - Multi-Model Debate as a Decision-Making Accelerator]] — the decision-deliberation variant of the same pattern.
- [[Insight - Spec-First Vibe Coding - Multi-Model Architecture Review Before Writing a Line of Code]] — applying multi-model debate to architecture specs before any code is written.
- [[Insight - Skill Chaining — Build Modular AI Pipelines Instead of Monolithic Prompts]] — the broader principle of composing AI workflows from steerable steps rather than monolithic prompts.

**Related skills:**
- `conversation-ip-extractor` — useful for harvesting the *resulting* spec into a published framework or article after the debate concludes.

---

*Source: Lou, PowerUp Coaching mastermind, 2026-02-26 live demo. Gaps noted inline where the demo did not specify CLI flags or attribution conventions.*

## Source

- [[wiki/mastermind/sessions/2026-02-26_Mastermind]]
