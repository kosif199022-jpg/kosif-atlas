# Thinking Recipes — Part 3 (R12–R16)

> **Reading convention:** see the header of `recipes-part1.md`. Each step is `[Operation] via [Move],
> through the lens of [Lens]` — operations/moves resolve to `operations-moves.md`; "through the lens of
> X" is **lens-as-use** per `lenses.md` (no lens catalogue). Ported/reconciled in S4a.

## Table of Contents
- [R12: The Blind Spot Finder](#recipe-12-the-blind-spot-finder)
- [R13: The Root Cause Excavator](#recipe-13-the-root-cause-excavator)
- [R14: The Stagnation Breaker](#recipe-14-the-stagnation-breaker)
- [R15: The Complexity Reducer](#recipe-15-the-complexity-reducer)
- [R16: The Pattern Interrupt](#recipe-16-the-pattern-interrupt)

## Category 3: Diagnosis & Problem Solving

*When something is wrong and you need to find the real cause — not the obvious one.*

---

### Recipe 12: The Blind Spot Finder

**Use when:** You suspect you're missing something important but don't know what. The metrics look fine but your gut says something's off. Other people seem to see something you can't.

**When NOT to use:** When the problem is clear and the path forward is obvious. When seeking blind spots would be procrastination disguised as thoroughness. Simpler heuristic: "What's the one thing I'm avoiding?"

**Step 1:** Systems Thinking via Unintended Consequences Tracing, through the lens of Second-Order Effects.
"Map every second-order effect, hidden incentive, and invisible feedback loop — especially the ones nobody is tracking."

**Step 2:** Perspective Simulation via Strongest Possible Objection, through the lens of shadow perspectives.
"Identify the perspective I'm most allergic to engaging with. Build its strongest case. The thing I most want to dismiss usually contains my biggest blind spot."

**Step 3:** Abductive Reasoning via Surprising Absence Detection, through the lens of Goodhart's Law.
"Are the metrics I'm watching actually measuring what matters? What would explain the gap between my metrics looking fine and my gut saying something's off? What's conspicuously absent that should be present?"

**Step 4:** Analogical Reasoning via Negative Analogy, through the lens of Historical Precedent.
"Has another field encountered this exact blind spot pattern? What did they learn that I can apply before I learn it the hard way?"

**Abandon when surprised:** If the Strongest Possible Objection in Step 2 generates genuine discomfort — the kind you want to argue against immediately — stop. That defensive reaction IS the signal. The blind spot lives wherever your resistance is highest.

**The prompt:**
"I'm working on [X] and suspect I'm missing something. First, trace every second-order effect, hidden incentive, and invisible feedback loop. Then identify the perspective I'm most tempted to dismiss and build its absolute strongest case. Then check: are my metrics actually measuring what matters, or could they look fine while the real situation deteriorates — and what should be present that isn't? Finally, find historical cases from other fields where this exact blind spot caused serious problems."

**What makes this recipe unique:** Blind spots are invisible by definition — you can't see them by looking harder at what you're already looking at. This recipe approaches from four different angles: the systemic (what's happening in the system you're not tracking), the psychological (what perspective you're avoiding), the diagnostic (what metrics are lying to you), and the historical (who's been here before). Each angle reveals a different class of blind spot.

---

### Recipe 13: The Root Cause Excavator

**Use when:** The same problem keeps returning despite repeated fixes. You've solved it before — maybe several times — and it comes back. The surface symptoms keep changing but the underlying pattern persists.

**When NOT to use:** When this is genuinely a new problem you haven't seen before. When the recurrence is due to poor execution of a known solution rather than a deeper cause. Simpler heuristic: "Did we actually implement the last fix properly?"

**Step 1:** First Principles via Five Whys, then Zeroth Principle, through the lens of Shifting Baseline Syndrome.
"Run the Five Whys to get below the surface. Then go one level deeper with the Zeroth Principle: the Five Whys found the root cause of the SYMPTOM — but what's the root cause of the root cause? Has the baseline shifted so gradually that the 'normal' you're trying to restore was already degraded?"

**Step 2:** Abductive Reasoning via Abductive Cascade, through the lens of Feedback Loops.
"Treat the recurrence itself as the primary data point. What would explain WHY this keeps coming back? Generate hypotheses at each level of the cascade. Look for self-reinforcing loops — is the problem creating conditions that regenerate the problem?"

**Step 3:** Systems Thinking via Archetypes Recognition, through the lens of Iatrogenics.
"Match this pattern to the system archetypes: is this 'Shifting the Burden' (where your fix undermines the fundamental solution)? 'Fixes that Fail' (where the fix works short-term but worsens long-term)? Is your repeated intervention itself making things worse?"

**Step 4:** Counterfactual Analysis via Absence Counterfactual, through the lens of Chesterton's Fence.
"What if the recurring problem serves a function you haven't recognized? What would go wrong if this problem truly disappeared? Sometimes recurring 'problems' are actually pressure valves protecting against worse failures."

**Abandon when surprised:** If Step 3 reveals that your previous fixes are the mechanism of recurrence — that you're in a 'Fixes that Fail' archetype — the recipe is complete. Stop fixing and start redesigning.

**The prompt:**
"[X] keeps recurring despite repeated fixes. First, run Five Whys to get below the surface, then Zeroth Principle to question the root cause of the root cause — has my baseline shifted so I don't even see the real normal anymore? Second, treat the RECURRENCE as the data point: what self-reinforcing loop would explain why this keeps coming back? Third, match the pattern to system archetypes — am I in a 'Shifting the Burden' or 'Fixes that Fail' pattern where my interventions are making it worse? Fourth, what if this recurring problem serves a hidden function — what would break if it truly disappeared?"

**What makes this recipe unique:** It treats recurrence as the problem, not the symptom. Where the Five Whys stops at root cause, this recipe goes to the Zeroth Principle (root cause of the root cause), checks for self-reinforcing loops (Abductive Cascade), identifies iatrogenic fixing patterns (Archetypes Recognition), and tests whether the "problem" is actually structural (Absence Counterfactual). It's the only recipe that asks whether your solutions are the cause.

---

### Recipe 14: The Stagnation Breaker

**Use when:** Progress has plateaued. You're working as hard or harder than before but results are flat. The strategies that got you here have stopped working, and doing more of the same produces diminishing returns.

**When NOT to use:** When you're in the natural dip phase of a new initiative (where things always get worse before they get better). When the plateau is due to external factors you can't control. Simpler heuristic: "Am I in a dip or at a ceiling?"

**Step 1:** Systems Thinking via Archetypes Recognition, through the lens of Limits to Growth.
"Identify which constraint has become binding. Every growth system eventually hits a limiting factor that was irrelevant at lower levels. What worked at Level 1 fails at Level 2 because a different factor is now the bottleneck."

**Step 2:** First Principles via Regressive Abstraction, through the lens of Local Optimum vs. Global Optimum.
"Am I at a local optimum — the best point reachable from where I am, but not the best overall? Strip my current approach to its abstract principle. Is there a fundamentally different approach to the same principle that starts lower but peaks much higher?"

**Step 3:** Analogical Reasoning via Cross-Industry Transfer, through the lens of S-Curves.
"What fields have broken through similar plateaus? Specifically: when they stagnated, what was the nature of the breakthrough — was it a new method, a new metric, a new market, or a fundamental reconception? Import the breakthrough mechanism."

**Step 4:** Counterfactual Analysis via Thought Experiment, through the lens of Adaptive Valley.
"If I were starting from zero today with everything I now know but none of my current infrastructure, what would I build? The gap between that thought experiment and my actual situation reveals what's legacy constraint versus genuine structure."

**Abandon when surprised:** If Step 1 reveals that the binding constraint is YOU — your skills, your identity, your capacity — rather than the strategy, switch to Recipe 37 (The Growth Edge Finder). Strategies don't stagnate; people do.

**The prompt:**
"I've hit a plateau in [X] — working harder but results are flat. First, identify which constraint has become binding: what limiting factor was irrelevant at lower levels but is now the bottleneck? Second, am I at a local optimum — strip my approach to its principle and check if a fundamentally different approach to the same principle could peak much higher. Third, what fields have broken through similar plateaus and what was the nature of the breakthrough — method, metric, market, or reconception? Fourth, if I started from zero today with everything I know, what would I build differently — and what does the gap between that and my actual situation reveal?"

**What makes this recipe unique:** Plateaus have a specific diagnosis problem: the thing that got you here is now the thing holding you back, but it feels like your greatest asset. Limits to Growth (finding the new binding constraint) + Local vs. Global Optimum (testing whether you're at the wrong peak) + Cross-Industry Transfer (importing breakthrough mechanisms) + Thought Experiment (comparing current state to ideal state) is designed specifically for the "success trap" — where competence at the current level prevents transcendence to the next.

---

### Recipe 15: The Complexity Reducer

**Use when:** A situation has become so tangled that no one can see clearly enough to act. Multiple stakeholders, interrelated variables, conflicting data, and everyone's analysis just adds more complexity. Paralysis by analysis is setting in.

**When NOT to use:** When the complexity is genuine and irreducible — when simplifying would mean ignoring factors that actually matter. Simpler heuristic: "This is genuinely complex. I need to act despite the complexity, not reduce it."

**Step 1:** First Principles via Via Negativa, through the lens of Signal vs. Noise.
"Before adding clarity, subtract confusion. What can be removed from this situation without losing anything essential? Which variables are noise rather than signal? Which stakeholder concerns are duplicates in different language? Strip to the minimum set of genuinely distinct elements."

**Step 2:** Systems Thinking via Leverage Point Analysis, through the lens of Pareto Principle.
"Of everything that remains after subtraction, which 20% drives 80% of the outcome? Where are the leverage points — the places where a small intervention would move the whole system? Ignore everything else for now."

**Step 3:** Counterfactual Analysis via Removal Test, through the lens of McNamara Fallacy.
"For each remaining element, ask: if this were removed, would the core problem change? If not, it's decoration, not structure. Also check: am I tracking this element because it matters, or because it's measurable?"

**Step 4:** Analogical Reasoning via Metaphorical Mapping.
"Find a simple metaphor that captures the essential structure of what remains. The right metaphor doesn't reduce complexity — it makes it navigable. A good map is simpler than the territory but preserves the relationships that matter."

**Abandon when surprised:** If Via Negativa in Step 1 strips away more than 70% of what you were tracking, the surprise IS the insight. You were managing complexity theater — the illusion of thoroughness that was actually preventing action.

**The prompt:**
"[X] has become so complex that nobody can see clearly. First, subtract: what can be removed without losing anything essential — which variables are noise, which concerns are duplicates? Second, of what remains, which 20% drives 80% of the outcome? Where are the leverage points? Third, for each remaining element, if it were removed, would the core problem actually change? Am I tracking things because they matter or because they're measurable? Fourth, find a simple metaphor that captures the essential structure — make the remaining complexity navigable."

**What makes this recipe unique:** Most problem-solving recipes ADD analysis. This is the only recipe that works primarily by SUBTRACTION. Via Negativa (removing what doesn't matter) + Leverage Point Analysis (finding the vital few) + Removal Test (testing each element's necessity) + Metaphorical Mapping (making what remains navigable) is designed for the specific failure mode where more thinking makes things worse.

---

### Recipe 16: The Pattern Interrupt

**Use when:** You or your organization keep falling into the same failure pattern despite being fully aware of it. You can describe the pattern, you know it's destructive, and you do it anyway. Awareness alone hasn't been enough to break the cycle.

**When NOT to use:** When this is the first time the pattern has appeared. When the pattern is functional and only seems problematic from an outside perspective. Simpler heuristic: "Is this actually a problem, or does it just look like one?"

**Step 1:** Systems Thinking via Causal Loop Diagramming, through the lens of Homeostasis.
"Map the complete loop: what triggers the pattern, what reinforces it, and — critically — what BENEFIT does the pattern provide? Every persistent behavior pattern is maintained by a hidden payoff. Homeostasis means the system is actively resisting change because the pattern serves a function."

**Step 2:** Abductive Reasoning via Diagnostic Reasoning, through the lens of Revealed Preferences.
"The pattern persists because it's solving a problem you haven't named. What is it solving? Generate a differential diagnosis: what need is being met by the dysfunctional behavior? Your revealed preferences (what you actually do) are more honest than your stated preferences (what you say you want)."

**Step 3:** Counterfactual Analysis via Substitution Test, through the lens of Functional Analogy.
"You can't just remove the pattern — you have to replace it with something that serves the same hidden function. What alternative behavior would meet the same underlying need without the destructive side effects?"

**Step 4:** Falsification via Crucial Experiment.
"Design the smallest possible experiment that tests whether the substitute actually satisfies the hidden need. Don't try to break the whole pattern at once — test one substitution in one context and observe what happens."

**Abandon when surprised:** If Step 2 reveals that the hidden benefit of the dysfunctional pattern is identity protection — the pattern keeps you safe from a threatening truth about yourself — switch to Recipe 36 (The Identity Audit). You're not dealing with a behavior problem but a developmental one.

**The prompt:**
"I keep falling into the same pattern of [X] despite knowing it's destructive. First, map the complete loop — trigger, behavior, reinforcement — and especially what HIDDEN BENEFIT the pattern provides. Why is the system actively maintaining this? Second, the pattern persists because it's solving a problem I haven't named — what need is it meeting? Third, I can't just remove the pattern — what alternative behavior would serve the same function without the destructive effects? Fourth, design the smallest experiment to test whether the substitute actually works."

**What makes this recipe unique:** It treats persistent patterns as functional, not irrational. Where most approaches focus on willpower or awareness, this recipe identifies the hidden payoff maintaining the pattern (Causal Loop Diagramming + Revealed Preferences), then designs a functional substitute (Substitution Test) and tests it (Crucial Experiment). It's the only recipe that treats "bad" habits as solutions to unnamed problems.
