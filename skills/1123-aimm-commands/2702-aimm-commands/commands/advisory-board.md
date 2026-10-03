---
name: The Advisory Board
type: command
description: Convene a multi-perspective AI advisory board — not generic "expert personas" but a structured hierarchy of advisors with different levels of authority, different domains, and genuine disagreement built in — to evaluate any decision, strategy, or challenge from angles your default thinking can't reach.
source: Kasimir Hedstrom — Oct 30, 2025 AIMM session on 5-level advisory board architecture
trigger: /aimm:advisory-board
location: wiki/mastermind/commands/
source-sessions:
  - 2025-10-30_Mastermind
---

# The Advisory Board

Convene a multi-perspective AI advisory board — not generic "expert personas" but a structured hierarchy of advisors with different levels of authority, different domains, and genuine disagreement built in — to evaluate any decision, strategy, or challenge from angles your default thinking can't reach. From Kasimir's 5-level advisory board architecture discussed in the Oct 30, 2025 AIMM session.

---

You will simulate a structured advisory board for a specific decision, challenge, or strategy. This is NOT "pretend to be five experts." It's an architecture with real hierarchy: advisors at different levels have different types of authority, different information access, and different incentives — and the disagreements between levels are often more valuable than any single advisor's opinion.

The mechanism: most "multiple persona" prompts fail because the personas agree too easily or disagree superficially. Real advisory boards have structural tensions — the domain expert conflicts with the financial advisor, the strategist conflicts with the operator, the contrarian conflicts with everyone. This architecture preserves those tensions by assigning each advisor a specific role, a specific decision weight, and a specific type of blindness.

THE DECISION/CHALLENGE: $ARGUMENTS

If no decision was provided above, ask me what I need advisory input on.

BOARD COMPOSITION: [WHICH DOMAINS MATTER MOST — e.g., strategy, finance, operations, marketing, technology, industry-specific. Say "you decide" to have me compose the optimal board for this decision]
DECISION STAKES: [LOW for tactical decisions, MEDIUM for significant business moves, HIGH for bet-the-company or career-defining decisions. Say "you decide" to have me assess from context]

If "you decide," assess and compose the board accordingly.

---

STEP 1 — BOARD COMPOSITION:
Assemble 5 advisors across 3 levels:

**Level 1 — The Chair** (1 advisor):
- The meta-perspective. Doesn't advocate for a specific answer — manages the process.
- Role: synthesize conflicting advice, identify what the other advisors can't see because they're inside their own frames, and make the final recommendation.
- Specific expertise: should match the highest-level challenge (strategic, existential, architectural).

**Level 2 — Domain Leads** (2 advisors):
- Deep expertise in the two most relevant domains for this decision.
- Role: provide authoritative analysis from their domain. They have strong opinions and they should state them directly.
- Built-in tension: the two Level 2 advisors should naturally disagree on at least one major aspect. If they don't, one of the domains is wrong for this board.

**Level 3 — Specialists** (2 advisors):
- One is a tactical operator — focused on execution, feasibility, and "how this actually works in practice."
- One is a designated contrarian — their job is to find the strongest case AGAINST the emerging consensus. Not devil's advocacy as performance, but genuine effort to break the argument.

For each advisor, state:
- Their specific domain expertise and what makes them credible
- Their natural bias (every expert has one — naming it makes the advice more useful)
- The one thing they'll see that no other board member will
- The one thing their perspective systematically misses

---

STEP 2 — INDIVIDUAL BRIEFINGS:
Each advisor independently analyzes the decision. No collaboration yet — isolated analysis prevents groupthink. Each advisor delivers:

- **Assessment** (2-3 paragraphs): Their analysis from their specific lens
- **Recommendation**: What they'd advise, stated directly
- **Confidence level**: How certain they are, and what would change their mind
- **Risk flag**: The one thing about this decision that concerns them most

Advisors should genuinely disagree where their frameworks predict different outcomes. Forced consensus is a signal of bad board design.

---

STEP 3 — THE COLLISION:
Now bring the advisors into conversation. Identify:

- **Points of agreement**: Where all advisors converge (these are likely true, but verify — groupthink at scale is still groupthink)
- **Sharp disagreements**: Where advisors reach opposite conclusions from the same evidence (these are the most valuable — the resolution reveals something none of them saw individually)
- **Blind spots**: What is NO advisor discussing? What falls between all their domains? (This is often the real risk)

For each sharp disagreement: trace the root cause. Is it different values, different time horizons, different risk tolerances, or different assumptions about the facts? Each root cause requires a different resolution approach.

---

STEP 4 — THE CHAIR'S SYNTHESIS:
The Chair delivers the integrated recommendation:

- What does the weight of evidence suggest?
- Which advisor's perspective should be weighted most heavily for THIS specific decision, and why?
- What's the residual risk that no amount of analysis can resolve? (The irreducible uncertainty)
- What decision would they recommend, with what caveats?

The Chair should NOT split the difference. "Do a little of each" is usually the worst possible advice. The Chair picks a direction and explains what's being traded off.

---

STEP 5 — DECISION BRIEF:
Deliver a structured decision brief:

- **Recommended action**: One clear recommendation
- **Key rationale**: The 2-3 strongest reasons, traced to specific advisor analyses
- **Primary risk**: What could go wrong, and what's the early warning signal
- **Minority report**: The strongest dissenting view and why it shouldn't be dismissed
- **Decision triggers**: What new information would warrant revisiting this decision
- **90-day check**: What should be true in 90 days if this was the right call

---

STEP 6 — VERIFICATION:
- Are the advisors genuinely different, or are they the same worldview wearing different hats? Test: if I removed the labels, could I tell which advisor said what? If not, the board isn't diverse enough.
- Did the contrarian find a real weakness, or did they perform dissent without substance? A contrarian who can be easily dismissed isn't doing their job.
- Does the Chair's synthesis actually integrate the perspectives, or does it just summarize them? Integration means the recommendation couldn't have been reached by any single advisor.
- Am I simulating a board, or am I simulating the appearance of one? Test: would a real board of this caliber produce a materially different recommendation? If I think they would, my simulation isn't sophisticated enough.

Revise what doesn't hold up.

## Source

- [[wiki/mastermind/sessions/2025-10-30_Mastermind]] (Kasimir Hedstrom — 5-level advisory board architecture)
