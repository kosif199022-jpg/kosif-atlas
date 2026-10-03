# Ground Protocol — Live Research & Evidence Collection

## Purpose

GROUND is the research phase. It runs after angles are selected but before any drafting begins. This sequencing is deliberate and non-negotiable: researching before angle generation biases the evolutionary search toward what's already been written. Hypotheses first, evidence second — the same principle Sakana's AI Scientist uses.

GROUND transforms angles from promissory notes into fundable propositions. The drafting personas need raw material — concrete examples, current data, real names, counterarguments — to produce articles that are grounded in reality rather than floating in abstraction.

---

## Timing

GROUND executes at the start of Turn 2, before any drafting begins. It produces a research brief per angle that feeds directly into the drafting personas. The user does not see the raw research — it is intermediate material, not a deliverable.

---

## Four Research Functions

For each selected angle, run all four functions. Use web search for each. Spend the most effort on Function 1 (Evidence Hunting) and Function 3 (Complication Discovery) — these produce the material that most directly improves draft quality.

### Function 1: Evidence Hunting

**Goal:** Find concrete examples, data points, case studies, and recent developments that support or illustrate the angle's thesis.

**Search strategy:**
- Search for the *phenomenon* the thesis describes, not the thesis itself. If the thesis is "expertise compounds like interest when systematized," search for examples of experts who systematized their knowledge and what happened — not for articles arguing the same thesis.
- Prioritize primary sources: company announcements, published research, specific events with dates and names. Secondary sources (blog posts, opinion pieces) are less valuable.
- Find at least **3 concrete examples** per angle. Each must have at least 2 of: a name, a number, a date, a place, a specific action taken.
- Look for one example that the audience would **not expect** — from an adjacent industry, a different era, or a domain the audience doesn't follow. Unexpected evidence is high-Novelty fuel.

**Output per angle:**
```
EVIDENCE BRIEF — Angle [n]

Example 1: [name/entity] — [what happened] — [specific data/date]
  Relevance: [how this supports the thesis]
  Surprise factor: [low/medium/high]

Example 2: ...
Example 3: ...

Key statistics: [any quantitative data points that ground the thesis]
```

### Function 2: Novelty Validation

**Goal:** Determine whether the angle's thesis has already been articulated elsewhere. This is the external check on the internal Novelty score from the evolution phase.

**Search strategy:**
- Search for the thesis as closely as possible. Use the key claim as a search query.
- Search for the borrowed lens + topic combination. Has anyone else used this cross-domain mapping?
- Check for recent articles (last 6 months) on the same topic aimed at the same audience. What are they saying?

**Evaluation:**
- **Novel:** No existing article makes this specific claim through this specific lens. The angle stands.
- **Partially anticipated:** The thesis has been hinted at or partially articulated, but not through this lens or with this level of specificity. The angle stands but should acknowledge the precursor and go deeper.
- **Pre-empted:** A substantially similar article exists. Flag for the user. Options: (a) pivot the angle to address what the existing article missed, (b) swap in the next-best angle from the evolution pool, (c) proceed but with the explicit goal of surpassing the existing treatment.

**Output:**
```
NOVELTY CHECK — Angle [n]

Status: [Novel / Partially Anticipated / Pre-empted]
Closest existing treatment: [title, source, date] or "none found"
Key difference from existing treatment: [what this angle adds]
Recommendation: [proceed / pivot / swap]
```

### Function 3: Complication Discovery

**Goal:** Deliberately find counterevidence, edge cases, and opposing perspectives. This is adversarial research — actively searching for reasons the thesis might be wrong.

**Search strategy:**
- Search for failures, exceptions, and critics of the position the thesis advocates.
- Search for the strongest version of the opposing view. What would an intelligent skeptic say?
- Look for edge cases where the thesis breaks down. What are the boundary conditions?

**Why this matters:**
Counterevidence doesn't weaken the article — it strengthens it. The Prosecutor persona uses counterarguments as objections to dismantle. The Storyteller uses complications as plot tension. The Cartographer uses edge cases to refine the map's boundaries. An article that anticipates and addresses the strongest objections is dramatically more credible than one that pretends they don't exist.

**Output:**
```
COMPLICATION BRIEF — Angle [n]

Counterargument 1: [the strongest version of the opposing view]
  Source: [who argues this, or what evidence supports it]
  How the thesis survives it: [initial assessment]

Counterargument 2: ...

Edge case: [situation where the thesis might not apply]
  Implication: [does this limit the thesis, or does it actually refine it?]
```

### Function 4: Freshness Injection

**Goal:** Find developments from the last 30-90 days that the audience may not have fully processed yet. These become high-Residue elements — the reader thinks "this writer is ahead of me."

**Search strategy:**
- Search for recent news, announcements, research publications, or market shifts related to the topic.
- Prioritize developments that the audience would find relevant but may have missed (niche publications, adjacent-industry events, new research from non-obvious fields).
- Look for one development that recontextualizes the thesis — makes it more urgent, more surprising, or more inevitable in light of recent events.

**Output:**
```
FRESHNESS BRIEF — Angle [n]

Recent development 1: [what happened] — [date] — [source]
  Relevance to thesis: [how this makes the thesis more timely]

Recent development 2: ...

Recontextualizing event: [development that makes the thesis feel urgent or inevitable right now]
```

---

## Compiled Research Brief

After running all four functions, compile a single research brief per angle:

```
RESEARCH BRIEF — Angle [n]: "[angle short name]"
================================================

EVIDENCE (3+ concrete examples):
[from Function 1]

NOVELTY STATUS: [Novel / Partially Anticipated / Pre-empted]
[from Function 2]

COMPLICATIONS (2+ counterarguments, 1+ edge case):
[from Function 3]

FRESH DEVELOPMENTS (1-3 recent events):
[from Function 4]

PERSONA ROUTING NOTES:
- For Prosecutor: strongest evidence = [example], strongest objection to dismantle = [counterargument]
- For Storyteller: most narrative-ready example = [example], best tension source = [complication]
- For Cartographer: best landmark = [example], best boundary case = [edge case]
```

The persona routing notes are the bridge between GROUND and DRAFT — they tell each persona which research material is most useful for their specific mode of argument.

---

## Research Quality Standards

- **No hypothetical examples.** Everything in the evidence brief must be real — verifiable names, dates, events.
- **Primary sources over secondary.** A company's own announcement over a blog post about the announcement. A published paper over a journalist's summary of the paper.
- **Recency matters for freshness, not for evidence.** A powerful example from 2018 is better than a weak one from last week — except in Function 4, where recency is the point.
- **One surprising source per angle.** At least one piece of evidence should come from a domain or publication the audience wouldn't normally encounter. This is where research creates Novelty.
