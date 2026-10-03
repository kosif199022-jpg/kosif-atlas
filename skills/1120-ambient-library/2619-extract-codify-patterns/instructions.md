# Extract, Codify, Patterns

Package a working session into a structured, shareable teaching artifact the AIMM community can learn from — not just the polished conclusion but the actual working session: the prompts, the wrong turns, the moment the model emerged.

---

## What This Skill Produces

A folder under `look-over-my-shoulder/<session-slug>/` with these components:

| Artifact | Required | Description |
|---|---|---|
| `README.md` | Always | "How to read this" guide — 3 reading paths (5 min / 15 min / 1 hour), the core idea in one paragraph, what's in each subfolder |
| `chat-export/<date>-conversation-export.md` | Always | The full conversation transcript with no edits |
| `brief/Brief - <title>.md` | Always | The article brief: target reader, frustration/want/aspiration, before/after state, narrative arc, proposed structure, editorial notes |
| `teaching-block/<slug>.md` | Always | Publishable show-and-tell article — what happened, step by step, with named concepts and embedded diagrams |
| `teaching-block/<slug>.html` | Always | Self-contained HTML version — embedded SVGs, opens in any browser, no dependencies |
| `teaching-block/*.svg` | If diagrams needed | Diagrams for the teaching block (spectrum maps, 2×2s, before/after comparisons) |
| `vault-artifacts/*.md` | If session produced rules, demoted assets, or reference files | Operational outputs: classification rules, updated heuristics, demoted or promoted assets |
| `skills/<skill-name>/SKILL.md` | If session produced a packaged skill | Full SKILL.md extracted from the session |

---

## First-Time Setup: Intake Questions

Ask these before producing any artifacts. Adapt conversationally — don't present them as a form.

1. **What's the session title?** Aim for something that captures the insight, not just the topic. "I Started With Two Buckets. The Conversation Found Four." is better than "Command vs Skill Classification Session."

2. **What was the core question or problem you brought into the session?** One sentence — this becomes the hook for the teaching block.

3. **What did you discover that you didn't expect?** The inflection point. The moment where the model changed or the framing snapped into place.

4. **Who's the target reader?** Which AIMM members would benefit most? What do they already know? Where are they stuck?

5. **What did the session produce?**
   - Just insight + frameworks → `vault-artifacts/` with rule files, `brief/`, `teaching-block/`
   - A full article → `content pieces/` subfolder with the drafted article + HTML version
   - A skill → `skills/<name>/SKILL.md`
   - A brand voice, template, or reference file → named accordingly

6. **Is there a chat export?** If yes, save it as-is to `chat-export/<date>-conversation-export.md`. If no, confirm whether to produce the folder without it (not recommended — the raw conversation is what makes these sessions valuable to read).

Save the intake answers as context for subsequent artifact generation. On later runs, check if a session folder already exists and skip the intake for pre-existing sessions.

If you are running this skill on a session you participated in as the AI, answer the intake questions from your own context rather than asking the user — you have access to the full conversation.

---

## Production Sequence

Work through artifacts in this order. Each one builds on the previous.

### Step 1: Classify the session outputs

Read the chat export (or the user's description if no export is available). Using `asset-detection-heuristics.md` criteria, identify:
- What type of output did the session produce? (insight, framework, skill, rule, tool, combination)
- Does it meet the bar for a skill? (See `command-vs-skill.md` promotion triggers)
- Are there vault artifacts — rule files, updated heuristics, demoted/promoted assets — that belong in `vault-artifacts/`?

Declare what you plan to produce before writing anything. Give the user a chance to correct the classification.

### Step 2: Write the article brief

The brief is a planning artifact, not a public document. Write it to the standard AIMM brief format:

```markdown
---
title: "<full working title>"
date: <YYYY-MM-DD>
source-session: <slug>
scores: { timely: ?, insightful: ?, valuable: ?, actionable: ?, useful: ?, overall: ?, scale: "0-5" }
status: draft
---

## Topic
[What the article is about — one paragraph]

## Target Reader
[Who it's for, what they already know, what they're stuck on]

## The Fear / Frustration / Want / Aspiration
[Emotional arc in 2-4 sentences]

## Before State
[How the reader thinks before reading]

## After State
[How the reader thinks after reading]

## Narrative Arc
[How the argument unfolds — one paragraph]

## Core Argument
[The thesis, stated plainly]

## Key Evidence / Examples
[Specific examples, worked cases, concrete evidence]

## Proposed Structure (5–7 beats)
[Numbered beats with one-line descriptions]

## Related Insights
[Links to related vault entries if known]

## Editorial Notes
[Voice calibration, things to avoid, competing briefs, length target]
```

### Step 3: Write the teaching block (markdown)

The teaching block is a first-person show-and-tell: what you tried, what surprised you, what the conversation produced. It should read like "here's exactly what happened and why it matters" — not a summary of conclusions but a narrated working session.

**Structure:**
1. **Opening** — Start with what you brought into the session. One sentence. Then: what you got back wasn't what you expected.
2. **Numbered steps** — Each step is a phase of the conversation. Name it. What you asked, what came back, and the concept it crystallized. Pull quoted concepts out as named blockquotes (> **Concept #N:** *italicized insight*).
3. **Diagrams inline** — Reference any SVGs inline. Explain what the diagram shows before the reader sees it.
4. **Close** — The extraction or operational output. What actually changed: a new file, a demoted asset, a SKILL.md, a rule. Make the output concrete.

**Voice:** First person, specific, opinionated. Write as the practitioner who ran the session, not an observer. Assume the reader is at the same level — don't over-explain, don't under-explain.

**Length:** 1,000–2,000 words. Long enough to narrate the actual working session; short enough that someone can read it in one sitting and immediately try the technique.

### Step 4: Produce the SVG diagrams

If the session produced a model (spectrum, 2×2, before/after, process flow), produce the SVG as a standalone file alongside the markdown.

SVG requirements:
- Self-contained (no external fonts or dependencies)
- Readable at 600–900px width
- Use `font-family="Georgia, serif"` for display text, `font-family="system-ui, sans-serif"` for labels
- Background: `#fafaf8`
- Subtle grid or axis lines: `#e0e0da`
- Text: `#2d2d2d` primary, `#666660` secondary

Name diagrams descriptively: `ambient-intelligence-spectrum.svg`, `latent-cartographer-before-after.svg` — not `diagram-1.svg`.

### Step 5: Produce the self-contained HTML

Convert the teaching block to a self-contained HTML file:
- Embed all SVGs inline (not as `<img>` src references)
- Include all CSS inline in `<style>` tags
- No external dependencies — the file should open and render correctly without any network access
- Typography: Georgia serif for body, system-ui for labels and metadata
- Max content width: 720px, centered
- Background: off-white (`#fafaf8`)
- The HTML file is the "open in any browser" version. Test it mentally: if emailed as an attachment, should it render perfectly? Yes.

### Step 6: Write vault artifacts (if applicable)

If the session produced rule files, updated heuristics, or demoted/promoted assets:
- Write each as a standalone markdown file in `vault-artifacts/`
- Name them exactly as they would be named in the vault: `command-vs-skill.md`, `asset-detection-heuristics.md`
- Note at the top: these are the session-produced versions, not necessarily identical to the live vault file

### Step 7: Write the session README

The README is the entry point. Write it last, once you know what the session actually produced.

**Required sections:**
1. **One-sentence description** — What happened in this session and when.
2. **What's in this folder** — Subsection per subfolder, with what to expect inside and when to read it.
3. **The core idea (one paragraph)** — The insight, stated plainly. Someone who reads only this should understand what the session discovered.
4. **How to read this** — Three reading paths:
   - *5 minutes* → open the HTML teaching block
   - *15 minutes* → also skim the vault artifacts or skill
   - *1 hour* → read the full chat export to see how the model emerged

---

## Output Format

```
look-over-my-shoulder/<session-slug>/
├── README.md
├── chat-export/
│   └── <YYYY-MM-DD>-conversation-export.md
├── brief/
│   └── Brief - <title>.md
├── teaching-block/
│   ├── <slug>.md
│   ├── <slug>.html
│   └── <diagram-name>.svg          (one or more)
├── vault-artifacts/                 (if applicable)
│   └── <filename>.md
└── skills/                          (if applicable)
    └── <skill-name>/
        └── SKILL.md
```

---

## Common Pitfalls

- **Don't write the teaching block as a summary.** "The session covered X, Y, and Z" is not a teaching block. It's notes. The teaching block narrates what happened step by step — including the question that changed the framing, the wrong turn that produced the insight, the exact moment the model locked in.
- **Don't skip the brief.** It looks like overhead. It isn't. The brief forces you to name the target reader and the before/after state, which shapes every sentence in the teaching block.
- **Don't produce generic diagrams.** If the session produced a spectrum or a 2×2, the diagram should show the specific types, examples, and labels from that session — not a blank template.
- **Don't lose the chat export.** The raw conversation is the most valuable thing in the folder for readers who want to learn the actual working method, not just the output.
- **Don't classify everything as a skill.** Run the command-vs-skill quick test first. If the session produced a procedure that reduces to one prompt → one output, it's a command, not a skill. The classification should match the vault standards.
