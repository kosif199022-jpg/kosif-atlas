# Strategic Compass

A Tree of Thought reasoning skill for AIMM members facing strategic business decisions.
It thinks through multiple paths internally and delivers one clear recommendation — no hedging, no "it depends."

---

## How to Trigger It

Just describe your decision naturally. The skill activates on decision language — you don't need to invoke it by name.

**Phrases that trigger it:**
- "Should I hire a COO or promote my ops manager?"
- "What's my best move here — go direct or use channel partners?"
- "My biggest client wants exclusivity. Do I take it or walk away?"
- "Help me decide whether to raise now or wait."
- "What would you do in this situation?"
- "I'm stuck between two options..."

**What won't trigger it:**
- Factual questions ("what is a channel partner model?")
- Creative requests with no decision involved ("write me a proposal")
- Open-ended exploration without a fork ("tell me about negotiation strategies")

---

## What You Get

Every response delivers exactly five sections:

```
RECOMMENDED PATH
  The chosen approach named in 3–5 words, with the reason it wins
  in this specific situation.

WHY NOT THE ALTERNATIVE
  One sentence on the key weakness of the path not taken.

NEXT 30 DAYS
  • Three executable actions — who does what, by when.

WATCH FOR
  The one signal that would change the recommendation.
  If it happens: what to do instead.

CONFIDENCE: High / Medium / Low
  What's driving the confidence level, and what information
  would raise it if Medium or Low.
```

---

## Tips for Better Results

**Give context, not just the question.**
The recommendation quality scales with situation detail. Include: what you've already tried, what constraints you're operating under, what success looks like, and who else is involved.

- Weak: "Should I raise prices?"
- Strong: "Should I raise prices 15% across the board or only on new clients? We're at 85% capacity, margins are thin on legacy accounts, and I've had zero pushback on three recent proposals."

**State your constraints upfront.**
If time, capital, team size, or relationships are limiting factors, say so. The skill weights its scoring against what you actually have to work with.

**If the problem is vague, expect one question back.**
When the decision isn't clear enough to reason from, the skill will ask a single clarifying question before proceeding. Answer it and it will run the full analysis.

---

## Getting the Reasoning

The internal Tree of Thought process (branch generation, scoring, expansion) is hidden by design — the output is the recommendation, not the workbook.

If you want to see the reasoning, ask explicitly:
- "Why did you pick that path over the alternative?"
- "Show me how you compared the options."
- "Walk me through your thinking."

The skill will then surface the branch comparison on request. It won't offer this proactively.

---

## Negotiation Decisions

When your decision involves another party — a negotiation, partnership discussion, hiring offer, or conflict — the skill automatically loads additional scoring criteria:

- BATNA strength (your outside option)
- Leverage asymmetry (who needs this more)
- Relationship capital cost
- Information advantage
- Timeline pressure

It also adds to each branch: their most likely counter-move, the information gap between parties, and your walk-away trigger.

Just describe the situation naturally — if another party is involved, the skill detects it and adjusts.

---

## Confidence Levels

| Level | Meaning |
|---|---|
| **High** | Strong context, clear decision, constraints are known |
| **Medium** | Some ambiguity in the situation or gaps in what you shared |
| **Low** | Significant unknowns — recommendation is directional, not definitive |

Medium and Low confidence outputs always tell you what specific information would raise the confidence level. That's your next question to answer before acting.

---

## What the Skill Won't Do

- Give you "it depends" — it always picks a path
- Show its internal reasoning unless you ask
- Recommend based on generic strategy rather than your specific situation
- Ask more than one clarifying question before proceeding
- Add domain-specific overlays (legal, medical, financial) — it's intentionally domain-agnostic
