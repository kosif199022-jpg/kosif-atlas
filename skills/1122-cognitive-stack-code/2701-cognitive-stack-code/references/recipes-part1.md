# Thinking Recipes — Part 1 (R1–R6)

> **Reading these recipes (v3).** A **recipe** is *this skill's* composed, ordered sequence of moves —
> the thing the router runs at execution. (It is **not** the `PROCEDURE` role, which is a pre-existing
> named routine like SCAMPER; see `SKILL.md`.) Each step reads **`[Operation] via [Move], through the
> lens of [Lens]`** and resolves against the v3 reference layer:
> - **Operation / Move** → `operations-moves.md` (9 operations × 84 moves). Every move citation across
>   all 40 recipes is machine-verified to resolve under its stated operation by
>   `scripts/dev/verify_recipe_refs.py` (165/165 clean).
> - **"through the lens of X"** → **lens-as-use** (`lenses.md`): a lens is a *use* of a model, not a
>   stored type. X is either one of the 10 **standing cross-cutting lenses** (Invert ≙ "Inversion",
>   Opportunity Cost, Reversibility, Skin in the Game, Second-order, Signal vs. noise, Map vs. territory,
>   Frame check ≙ "Frame Control") or **any encyclopedia model turned into an attention directive**
>   (model-as-lens — e.g. Goodhart's Law, Optionality, Legibility, Iatrogenics), reachable via the router.
>   There is no lens *catalogue* to load; v1's `lenses-catalogue.md` is superseded.
>
> Ported from v1 in Session 4a; cross-references reconciled. Audit: `references/recipes-reconciliation-log.md`.

## Table of Contents
- [R1: The Wrong-Problem Detector](#recipe-1-the-wrong-problem-detector)
- [R2: The Decision Clarifier](#recipe-2-the-decision-clarifier)
- [R3: The Bet Sizer](#recipe-3-the-bet-sizer)
- [R4: The Pivot Evaluator](#recipe-4-the-pivot-evaluator)
- [R5: The Timing Optimizer](#recipe-5-the-timing-optimizer)
- [R6: The Exit Strategist](#recipe-6-the-exit-strategist)

## Category 1: Strategic Decision-Making

*When you need to choose, commit, or change direction under uncertainty.*

---

### Recipe 1: The Wrong-Problem Detector

**Use when:** You've been working on something for weeks and progress has stalled. The analysis keeps getting more sophisticated but the breakthroughs aren't coming. You suspect you might be solving the wrong problem.

**When NOT to use:** When the problem is well-defined and progress has been steady. When the bottleneck is execution, not framing. When time pressure demands action over reframing. Simpler heuristic: "What's the next concrete action?"

**Step 1:** First Principles via the Zeroth Principle move, through the lens of Inversion.
"Before questioning my assumptions about the solution, question my assumptions about the problem itself. What am I assuming the problem IS — and what would I see if I looked at it from the direction of failure?"

**Step 2:** Abductive Reasoning via Anomaly Hunting, through the lens of Inversion.
"If the problem ISN'T what I think it is, what would explain the pattern of failure I'm seeing? What alternative problem, if it were the real one, would make my repeated failure non-surprising?"

**Step 3:** Counterfactual Analysis via Removal Test, through the lens of Chesterton's Fence.
"If the thing that appears to be blocking me were removed, would I actually make progress? Or does the 'blockage' exist for a reason I haven't understood?"

**Step 4:** Falsification via Crucial Experiment.
"How would I test whether the new framing is correct? What would I observe if it's right? What would I observe if it's wrong?"

**Abandon when surprised:** If at any point during this recipe you encounter genuine surprise — something you didn't expect and can't immediately explain — stop the recipe. The surprise IS the insight. Attend to it before continuing.

**The prompt:**
"I've been stuck on [X] for a while. I want to check if I'm solving the wrong problem. First, use the Zeroth Principle — question the assumptions BEHIND my assumptions about what the problem even is, looking at it from the direction of failure. Then, given my pattern of failure, what ALTERNATIVE problem would make that failure pattern non-surprising? Third, if the thing that seems to be blocking me were removed, would I actually progress — or does the blockage serve a function I haven't understood? Finally, design a test: what would I observe if the new framing is correct versus incorrect?"

**What makes this recipe unique:** It's the only recipe that attacks the problem DEFINITION rather than the problem itself. The combination of Zeroth Principle (questioning the question) + Anomaly Hunting (treating failure as diagnostic data) + Removal Test (checking whether the obstacle is actually load-bearing) is specifically designed for situations where competent analysis keeps producing mediocre results — a reliable signal that you're solving the wrong problem.

---

### Recipe 2: The Decision Clarifier

**Use when:** You face a consequential choice with incomplete information. The stakes are high enough that getting it wrong would be costly, and you have time to think before acting.

**When NOT to use:** When the decision is easily reversible. When you have a trusted expert's clear recommendation. When the time cost of analysis exceeds the value at stake. Simpler heuristic: "Is this a one-way or two-way door? If two-way, decide fast and adjust."

**Step 1:** Bayesian Updating via Base Rate Check, through the lens of Survivorship Bias.
"Before I look at my specific situation, what do the base rates say? What percentage of similar decisions in similar contexts turn out well — and am I only seeing the successes?"

**Step 2:** Perspective Simulation via Strongest Possible Objection, through the lens of Inversion.
"Build the strongest possible case for the option I like LEAST — but specifically from the angle of what could go wrong with my PREFERRED option."

**Step 3:** Counterfactual Analysis via Regret Minimization, through the lens of Temporal Discounting.
"In 10 years, which choice would I regret more — and which type of regret (action vs. inaction) am I systematically underweighting because of present-moment bias?"

**Step 4:** First Principles via Assumption Mapping.
"After all of that, what do I actually know for certain? Which of my assumptions are confirmed, which are unconfirmed, and which are critical?"

**Abandon when surprised:** If the base rate check in Step 1 reveals that your situation is far more common (or rare) than you assumed, stop and recalibrate before continuing. Your sense of the decision's uniqueness may itself be the error.

**The prompt:**
"I need to decide [X]. First, forget my specific case — what do base rates say about how this type of decision typically turns out, and am I only seeing survivors? Then build the absolute strongest case for my least-preferred option, specifically from the angle of what could go wrong with my preferred one. Then: in 10 years, which choice would I regret more, and am I underweighting long-term consequences? Finally, map every assumption in my reasoning — which are confirmed by evidence, which are critical but unconfirmed?"

**What makes this recipe unique:** It sequences four different TYPES of evaluation — statistical (base rates), adversarial (steelmanning against yourself), temporal (regret projection), and structural (assumption mapping) — specifically to counteract the four most common ways high-stakes decisions go wrong: ignoring base rates, motivated reasoning, short-termism, and hidden assumptions.

---

### Recipe 3: The Bet Sizer

**Use when:** You know WHAT to do but not how much to commit. The direction is right but the magnitude is unclear — how much money, time, reputation, or organizational capital should you wager on this?

**When NOT to use:** When the commitment is trivially small or trivially reversible. When someone with direct experience can tell you the standard allocation. Simpler heuristic: "What's the smallest bet that would still give me meaningful information?"

**Step 1:** Bayesian Updating via Confidence Calibration, through the lens of Asymmetric Upside/Convexity.
"How confident am I, really — stated as a percentage? And is the payoff structure symmetric or asymmetric? If I'm 60% confident and the upside is 10x the downside, I should bet more than my confidence alone suggests."

**Step 2:** Counterfactual Analysis via Sliding Scale, through the lens of Diminishing Returns.
"If I slide my commitment from minimum to maximum, where are the qualitative thresholds? At what level of commitment do I get 80% of the value? At what level do additional resources stop producing additional results?"

**Step 3:** Falsification via Pre-Mortem, through the lens of Fat Tails.
"If this bet fails, what's the maximum damage? Is the downside bounded or could it cascade? Am I risking ruin — the kind of loss I can't recover from?"

**Step 4:** Systems Thinking via Leverage Point Analysis, through the lens of Optionality.
"Is there a way to structure this commitment that preserves optionality — where I can increase the bet if early signals are positive and cut losses if they're negative? Where are the leverage points where a small initial commitment buys the most information?"

**Abandon when surprised:** If the Pre-Mortem in Step 3 reveals a ruin scenario — a loss you literally cannot recover from — stop the recipe. No expected value calculation justifies a bet that can destroy you. Restructure to eliminate the ruin risk before continuing.

**The prompt:**
"I've decided to [X] but need to figure out how much to commit. First, calibrate my actual confidence as a percentage and map the payoff structure — is the upside/downside symmetric or asymmetric? Second, slide my commitment level from minimum to maximum and identify where the diminishing returns kick in — where do I get 80% of the value? Third, run a pre-mortem on the worst case: is the downside bounded or could it cascade into ruin? Fourth, find the structure that maximizes optionality — how do I bet in stages where early results determine later commitment?"

**What makes this recipe unique:** Most decision recipes help you choose WHAT to do. This is the only recipe designed for calibrating HOW MUCH. The combination of Confidence Calibration (honest probability) + Sliding Scale (finding thresholds) + Pre-Mortem (testing for ruin) + Leverage Point Analysis (staging the commitment) produces a sizing strategy, not just a direction.

---

### Recipe 4: The Pivot Evaluator

**Use when:** You're torn between doubling down on the current path and changing direction entirely. Both options have genuine merit. You've been oscillating for weeks and the indecision itself is becoming costly.

**When NOT to use:** When you haven't given the current path enough time to show results. When the impulse to pivot is driven by boredom rather than evidence. Simpler heuristic: "Have I reached the point where the current approach has had a fair test?"

**Step 1:** Falsification via Crucial Experiment, through the lens of Sunk Cost Awareness.
"What evidence would conclusively tell me the current path is dead — not struggling, not slow, but structurally unable to succeed? Separate this from the emotional weight of everything I've already invested."

**Step 2:** Analogical Reasoning via Historical Analogy, through the lens of S-Curves.
"Where on the S-curve am I? Am I in the painful slow-start phase that precedes exponential growth — or am I on the flat top of a curve that's already peaked? What historical parallels suggest which phase I'm in?"

**Step 3:** Counterfactual Analysis via Substitution Test, through the lens of Opportunity Cost.
"If someone equally competent but with zero emotional attachment to the current path looked at my situation and my alternatives, what would they choose? What am I giving up every month I stay on this path?"

**Step 4:** Dialectical Synthesis via Both/And Reframe.
"Is this actually an either/or? Is there a version that preserves the best elements of the current path while incorporating the core insight driving the pivot impulse? What synthesis transcends the binary?"

**Abandon when surprised:** If the Crucial Experiment in Step 1 reveals that you cannot define what failure would look like for the current path, that's the insight. You're not evaluating a strategy — you're protecting an identity. Switch to Recipe 36 (The Identity Audit).

**The prompt:**
"I'm torn between staying on my current path of [X] and pivoting to [Y]. First, define the crucial experiment: what evidence would conclusively tell me the current path is structurally dead, ignoring sunk costs? Second, use historical analogy — am I in the painful start of an S-curve or on the flat top? Third, if someone with zero attachment looked at my situation, what would the opportunity cost analysis say? Finally, is this actually binary, or is there a Both/And synthesis that preserves the best of both?"

**What makes this recipe unique:** It's specifically designed for the oscillation trap — where someone keeps flip-flopping between options because both have genuine merit. The Crucial Experiment (defining what dead looks like) + S-Curve Analysis (diagnosing phase) + Substitution Test (removing emotional attachment) + Both/And Reframe (transcending the binary) addresses each of the four reasons pivots get stuck: unclear failure criteria, phase misidentification, sunk cost attachment, and false binaries.

---

### Recipe 5: The Timing Optimizer

**Use when:** The question isn't what to do but WHEN. You've identified the right move but the timing is uncertain — and moving too early is as costly as too late.

**When NOT to use:** When the cost of delay is clearly higher than the cost of premature action. When the environment is changing so fast that any delay compounds the disadvantage. Simpler heuristic: "The best time to plant a tree was 20 years ago. The second best time is now."

**Step 1:** Systems Thinking via Delay Mapping, through the lens of Phase Transitions.
"What are the key delays in this system? How long between action and visible result? And are there phase transition points — moments where the environment shifts qualitatively and the window opens or closes?"

**Step 2:** Bayesian Updating via Base Rate Check, through the lens of Planning Fallacy.
"Of people who faced similar timing decisions, how many moved too early versus too late? What's the base rate for each error — and which error is more costly in this domain?"

**Step 3:** Counterfactual Analysis via Temporal Counterfactual, through the lens of Path Dependence.
"If I act now versus in 3 months versus in 12 months, trace the full consequences of each timeline. What becomes possible or impossible at each point? Are there path-dependent lockouts — moments after which certain options disappear permanently?"

**Step 4:** Abductive Reasoning via Surprising Absence Detection, through the lens of Signal vs. Noise.
"What leading indicators should I be watching for? What signal would tell me the window is opening? And what signal SHOULD be present right now if the timing is right — and is it absent?"

**Abandon when surprised:** If Delay Mapping reveals that the delay between action and result is much longer than you assumed, recalculate immediately. Many timing errors come from underestimating system delays.

**The prompt:**
"I know I need to [X] but the timing is uncertain. First, map the delays in this system — how long between action and visible result, and are there phase transition points where the window opens or closes? Second, of people who faced similar timing decisions, what's the base rate for moving too early versus too late? Third, trace the full consequences of acting now versus in 3 months versus in 12 months — are there path-dependent lockout points? Fourth, what leading indicators should I watch, and what signal should be present NOW if the timing is right?"

**What makes this recipe unique:** Most decision recipes treat timing as secondary. This is the only recipe where timing IS the variable. The combination of Delay Mapping (understanding system lags) + Base Rate on timing errors (which direction do people usually err?) + Temporal Counterfactual (tracing timelines) + Surprising Absence Detection (identifying the trigger signal) is purpose-built for the "right move, uncertain timing" problem.

---

### Recipe 6: The Exit Strategist

**Use when:** You suspect you should quit something — a job, a project, a relationship, a strategy — but you can't tell if the impulse to quit is wisdom or weakness. Something needs to end, but the emotional and practical costs of ending it are clouding your judgment.

**When NOT to use:** When you haven't genuinely committed to the current path yet. When the difficulty is temporary and predictable (e.g., the hard middle of any worthwhile project). Simpler heuristic: "Am I in a dip or a dead end?" (Seth Godin's distinction.)

**Step 1:** First Principles via Assumption Mapping, through the lens of Sunk Cost Awareness.
"List every reason I'm still in this. Categorize each as: forward-looking (this will produce future value) or backward-looking (I've already invested too much to quit). Kill every backward-looking reason. What's left?"

**Step 2:** Perspective Simulation via Strongest Possible Objection, through the lens of Revealed Preferences.
"Build the strongest case that I should stay — not the comfortable case, the genuinely strongest one. Then check: does my behavior actually match this case? If I truly believed I should stay, what would I be doing differently?"

**Step 3:** Falsification via Crucial Experiment, through the lens of Reversibility.
"Can I design a clean test? A trial exit, a sabbatical, a pause? Something that lets me experience the exit without making it permanent — so I can gather data instead of agonizing?"

**Step 4:** Counterfactual Analysis via Regret Minimization, through the lens of Temporal Discounting.
"Project to age 80. Which haunts me more — having stayed too long or having left too soon? And crucially: am I overweighting the pain of leaving NOW relative to the cumulative cost of staying for years?"

**Abandon when surprised:** If Assumption Mapping in Step 1 reveals that EVERY reason you're still in this is backward-looking, you already have your answer. The recipe is complete.

**The prompt:**
"I'm considering quitting [X] but can't tell if that's wisdom or weakness. First, map every reason I'm still doing this — categorize each as forward-looking or backward-looking, and eliminate the sunk cost reasons. What survives? Second, build the strongest honest case for staying and check whether my actual behavior matches someone who believes that case. Third, is there a way to test the exit — a trial period, a pause — before committing permanently? Fourth, at age 80, which do I regret more: having stayed too long or having left too soon?"

**What makes this recipe unique:** Exit decisions are uniquely distorted by sunk costs, identity attachment, and loss aversion. This recipe sequences Assumption Mapping (stripping backward-looking reasons) + Revealed Preferences (checking if behavior matches stated beliefs) + Crucial Experiment (designing a reversible test) + Regret Minimization (long-horizon projection) — specifically because these four moves counter the four forces that keep people trapped: sunk costs, self-deception, fear of irreversibility, and short-termism.
