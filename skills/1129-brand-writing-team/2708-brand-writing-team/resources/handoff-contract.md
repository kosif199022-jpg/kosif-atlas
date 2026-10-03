# Handoff Contract

Every role in the brand-writing-team produces output in a fixed markdown format so the orchestrator can stitch artifacts together reliably. This file is the single source of truth for those formats. Every role file references it; do not invent new formats inside role files.

## General rules

- **Markdown only.** No JSON, no YAML, no code blocks unless the content is literal code.
- **Lead with the headers below, in order, even if a section is short.** Empty sections are fine (`(none)`); missing sections break downstream stitching.
- **Be specific. Avoid hedging.** Roles are paid to make calls, not survey options.
- **Stay in your lane.** A Strategist doesn't draft prose. A Skeptic doesn't rewrite. A Line Editor doesn't reorder sections. If you find yourself doing another role's job, stop and return what you have.
- **Every output ends with a `## Self-evaluation` block.** This is non-negotiable. The block reports the role's per-criterion scores against its rubric, the overall (minimum) score, the number of revisions used, and any notes on weaknesses that could not be fixed within scope. See the bottom of this file for the universal Self-evaluation format.

## Strategist output

```markdown
## Thesis
<one paragraph — the single argument or promise the piece makes>

## Why this, why now
<2–3 sentences — the cultural/personal/market reason this matters this week, not in the abstract>

## Piece type
<one of: blog | newsletter | thought-leadership-article | personal-story | how-to-tutorial — must match the orchestrator-supplied writing-type filename>

## What this piece is NOT
<bulleted list — scope guardrails to prevent drift>

## Working title
<a placeholder title — the Drafter and Line Editor will replace it>

## Self-evaluation
<see universal format at the bottom of this file>
```

## Researcher output

```markdown
## Core claims with evidence
- **Claim:** <claim>
  **Evidence:** <fact, stat, quote, or example>
  **Source:** <full citation — URL, publication name + date, book title + author + page, study DOI, or named primary source>
  **Verified:** <yes / no — see Researcher rubric for what "verified" means>

## Stories and examples
- **Example:** <vivid example, anecdote, or case study with enough detail to actually use>
  **Source:** <full citation>
  **Verified:** <yes / no>

## Quotes worth borrowing
- "<exact quote>" — <attribution>
  **Source:** <full citation, including where the quote was published>
  **Verified:** <yes / no>

## Counter-evidence (things that complicate the thesis)
- **Counter:** <fact or argument that pushes back on the thesis>
  **Source:** <full citation>
  **Verified:** <yes / no>

## Open questions
- <anything you couldn't verify or that the Drafter should be careful about — be explicit about what's missing>

## Self-evaluation
<see universal format at the bottom of this file>
```

## Avatar Reviewer output

```markdown
## Pass
<one of: 1st pass on thesis | 2nd pass on draft>

## Gut reaction
<2–3 sentences in the persona's voice — what they actually feel reading this>

## What lands
- <specific things that resonate with the persona's fears/wants/aspirations — quote the line>

## What doesn't land
- <specific things that feel off, generic, or irrelevant to the persona — quote the line>

## Objections the persona would raise
- <the strongest pushback the persona would give>

## What's missing for the persona
- <emotional beats, examples, or reassurances the persona needs that aren't there>

## Verdict
<one of: angle is strong | angle needs sharpening | angle is wrong for this persona>

## Self-evaluation
<see universal format at the bottom of this file>
```

## Outliner output

```markdown
## Spine
<one sentence — the through-line that connects every section>

## Sections
1. **<Section name>**
   - **Job:** <what this section accomplishes for the reader>
   - **Beats:** <bulleted list of the points/moves in order>
   - **Evidence to use:** <reference to specific items from the research dossier>

2. **<Section name>**
   - **Job:** ...
   - **Beats:** ...
   - **Evidence to use:** ...

(continue for all sections)

## Cut list
<things from the research dossier that are good but don't fit — explicitly excluded so the Drafter doesn't shoehorn them in>

## Self-evaluation
<see universal format at the bottom of this file>
```

## Drafter output

```markdown
## Headline options
1. <option 1>
2. <option 2>
3. <option 3>

## Draft
<the full piece as continuous prose, ready to read>

## Voice notes
<2–3 sentences — places the Drafter made a deliberate voice choice the Line Editor should preserve>

## Self-evaluation
<see universal format at the bottom of this file>
```

## Skeptic output

```markdown
## Strongest objection
<the single best counter-argument a smart, hostile reader would make>

## Other objections
- <next strongest>
- <next strongest>

## Source verification
- **Source from dossier:** <citation>
  **Status:** <verified / broken / not found / contradicted>
  **Note:** <what you found when you checked — e.g., "URL resolves and quote matches", "URL 404s", "study exists but says the opposite of what the draft claims">

## Fact-check flags
- **Claim in draft:** <quoted from the draft>
  **Status:** <verified / unverified / contradicted>
  **Note:** <what the dossier and verified sources say, or what's missing>

## Logical gaps
- <places where the argument skips a step the reader needs — quote the line>

## What the piece does well (don't lose these in editing)
- <things worth preserving — be specific, quote the line>

## Self-evaluation
<see universal format at the bottom of this file>
```

## Line Editor output

```markdown
## Final headline
<the chosen headline>

## Runners-up
1. <second choice>
2. <third choice>

## Final piece
<the polished, publishable prose>

## Changelog
- <what changed and why — keep terse, one line per change>

## Self-evaluation
<see universal format at the bottom of this file>
```

---

## Universal Self-evaluation format

Every role appends this block as the last section of its output. It reports the role's self-scoring against its rubric, per `resources/quality-gates.md`.

```markdown
## Self-evaluation
**Revisions used:** <0 / 1 / 2 / 3>

**Per-criterion scores:**
- <Criterion 1 name>: <1–10> — <one-sentence justification>
- <Criterion 2 name>: <1–10> — <one-sentence justification>
- <Criterion 3 name>: <1–10> — <one-sentence justification>
- (continue for all criteria in the role's rubric)

**Overall score (minimum across criteria):** <1–10>

**Ship decision:** <ship / shipping with known weakness>

**Weakness notes:** <if overall < 9, explain what the weakest criteria are, why they couldn't be fixed within scope, and what upstream input would be needed to fix them. If overall ≥ 9, write "(none)".>
```
