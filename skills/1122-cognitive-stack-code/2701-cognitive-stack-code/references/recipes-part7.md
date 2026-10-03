# Thinking Recipes — Part 7 (R41–R50)

> **Reading these recipes (v3).** A **recipe** is *this skill's* composed, ordered sequence of moves —
> the thing the router runs at execution. (It is **not** the `PROCEDURE` role, which is a pre-existing
> named routine like SCAMPER; see `SKILL.md`.) Each step reads **`[Operation] via [Move], through the
> lens of [Lens]`** and resolves against the v3 reference layer:
> - **Operation / Move** → `operations-moves.md` (9 operations × 84 moves). Every move citation is
>   machine-verified to resolve under its stated operation by `scripts/dev/verify_recipe_refs.py`.
> - **"through the lens of X"** → **lens-as-use** (`lenses.md`): a lens is a *use* of a model, not a
>   stored type. X is either one of the 10 **standing cross-cutting lenses** (Invert ≙ "Inversion",
>   Opportunity Cost, Reversibility, Skin in the Game, Second-order, Signal vs. noise, Map vs. territory,
>   Frame check ≙ "Frame Control") or **any encyclopedia model turned into an attention directive**
>   (model-as-lens — e.g. Goodhart's Law, Leverage Points), reachable via the router. There is no lens
>   *catalogue* to load; v1's `lenses-catalogue.md` is superseded.
>
> **R41–R60 are the Session-4b expansion** (mined from the 414 PROCEDURE-primary pool against the
> 10-stuckness-family gap map; see `references/recipes-candidates-s4b.md`). They *extend* the existing
> categories rather than opening new ones, so the headers below read "(continued)". Authored S4b part 2.

## Table of Contents
- [R41: The Option Widener](#recipe-41-the-option-widener)
- [R42: The Search Stopper](#recipe-42-the-search-stopper)
- [R43: The Polarity Manager](#recipe-43-the-polarity-manager)
- [R44: The Creative Unblocker](#recipe-44-the-creative-unblocker)
- [R45: The Analogy Engine](#recipe-45-the-analogy-engine)
- [R46: The Differential Diagnoser](#recipe-46-the-differential-diagnoser)
- [R47: The Scenario Planner](#recipe-47-the-scenario-planner)
- [R48: The Outside-View Estimator](#recipe-48-the-outside-view-estimator)
- [R49: The Steelman Decoder](#recipe-49-the-steelman-decoder)
- [R50: The Claim Verifier](#recipe-50-the-claim-verifier)

## Category 1: Strategic Decision-Making (continued)

*When you need to choose, commit, or change direction under uncertainty.*

---

### Recipe 41: The Option Widener

**Use when:** You feel stuck between two options and the choice feels impossible. The deadlock itself is the signal — a felt binary almost always means the real problem is a choice set that's too narrow, not a decision that's too hard.

**When NOT to use:** When you genuinely have a rich set of options already and the difficulty is choosing among them (that's R2, The Decision Clarifier). When the binary is real and externally fixed — a yes/no offer with a deadline. Simpler heuristic: "Am I struggling to decide, or struggling because I only see two doors?"

**Step 1:** First Principles via Assumption Mapping, through the lens of Frame check.
"Why exactly two options? Write down the assumption that produced the binary. Who framed it this way — me, a deadline, an authority, a default? The phrase 'I have to choose between X and Y' contains a hidden 'only,' and that 'only' is usually unexamined."

**Step 2:** Abductive Reasoning via Lateral Provocation, through the lens of Inversion.
"Disrupt the frame on purpose. Pick a random constraint ('what if neither X nor Y were allowed?') or state a deliberate provocation ('what if I had to satisfy this need without deciding anything at all?') and trace where it leads. Then invert: what would I do if the goal were the opposite of what I assume it is?"

**Step 3:** Counterfactual Analysis via Substitution Test, through the lens of Opportunity Cost.
"Replace each option with a structurally different category of solution rather than tweaking X or Y. If X is 'hire someone' and Y is 'do it myself,' substitute: partner, automate, delete the requirement, change who needs it. For each new candidate, what does it cost me that the original binary didn't?"

**Step 4:** Bayesian Updating via Probabilities and Possible Outcomes, through the lens of Reversibility.
"Now reality-test the widened set. For the three or four strongest candidates, sketch best/base/worst outcomes with rough probabilities. Mark which are one-way doors and which are reversible. The goal isn't to decide yet — it's to confirm the widened set is real before narrowing."

**Abandon when surprised:** If Assumption Mapping in Step 1 reveals the binary was genuinely imposed from outside and is truly fixed — a take-it-or-leave-it offer expiring today — stop widening. There is no hidden third door, and the real work is deciding fast. Switch to R2.

**The prompt:**
"I feel stuck between [X] and [Y]. First, surface the hidden assumption that there are only these two options — who framed it this way, and why exactly two? Second, disrupt the frame with a provocation and an inversion to force fresh possibilities. Third, substitute entirely different categories of solution for X and Y, not variations of them, and name what each new option costs. Fourth, reality-test the widened set with rough best/base/worst outcomes and mark which choices are reversible. Don't decide yet — just confirm I now have a real set, not a false binary."

**What makes this recipe unique:** Every other decision recipe helps you *choose well among options*. This is the only one that attacks the *size of the option set itself*, before any choosing happens. Assumption Mapping (exposing the hidden "only") + Lateral Provocation (breaking the frame) + Substitution Test (generating structurally different candidates) + Probabilities and Possible Outcomes (reality-testing the new set) is purpose-built for the specific trap where the agony of a hard choice is actually the symptom of an impoverished menu.

---

### Recipe 42: The Search Stopper

**Use when:** You're sampling options that arrive one at a time over a search — hiring a candidate, choosing an apartment, weighing a vendor, fielding offers — and you can't tell whether to commit to the current one or keep looking. Each "no" might forfeit the best you'll ever see; each "yes" might be premature.

**When NOT to use:** When all options are available simultaneously and you can compare them side by side (that's a straightforward ranking, or R2). When the timing question is about *external* events rather than *your own* stopping rule (that's R5, The Timing Optimizer). Simpler heuristic: "Is this the best I've seen, and have I seen enough to know?"

**Step 1:** First Principles via Skill Decomposition, through the lens of Opportunity Cost.
"You can't know when to stop until you define what you're stopping *for*. Decompose 'good enough' into the few dimensions that actually matter and set a threshold on each. What does continued searching cost me per round — in time, money, and options that expire while I deliberate?"

**Step 2:** Bayesian Updating via Base Rate Check, through the lens of Outside view.
"Use the optimal-stopping structure. In a search of expected length N, the math says sample roughly the first 37% purely to calibrate (commit to none), then take the first option that beats everything seen so far. Where am I in that sequence — still calibrating, or past the threshold and looking at a leader?"

**Step 3:** Bayesian Updating via Confidence Calibration, through the lens of Signal vs. noise.
"Is this option genuinely better than the field I've calibrated against, or am I just tired of looking? State it as a percentage. Search fatigue masquerades as conviction — name the difference before you commit."

**Step 4:** Counterfactual Analysis via Regret Minimization Framework, through the lens of Reversibility.
"If I commit now and a clearly better option appears next week, how much will I regret it — and can I reverse the commitment if it does? If the door is two-way, bias toward stopping now; if it's one-way, the cost of one more sample is usually worth paying."

**Abandon when surprised:** If the Base Rate Check reveals the options aren't actually serial — you *can* revisit ones you passed on — this isn't an optimal-stopping problem at all. The clock you thought you were racing doesn't exist. Switch to R2 and compare the full set at leisure.

**The prompt:**
"I'm searching for [X] and options are arriving one at a time. I can't tell whether to commit to the current one or keep looking. First, define what 'good enough' means on the few dimensions that matter, and what each additional round of searching costs me. Second, apply the optimal-stopping rule: roughly how long should I calibrate before committing to the first option that beats everything seen so far, and where am I in that sequence? Third, calibrate honestly — is this option truly best-of-field, or am I just exhausted? Fourth, weigh the regret of stopping too early against the reversibility of committing, and decide."

**What makes this recipe unique:** It targets the *optimal-stopping* problem specifically — where the cost isn't picking the wrong option but mistiming the commitment in a serial search. Skill Decomposition (defining the stopping criterion) + Base Rate Check (the 37% calibration structure) + Confidence Calibration (separating conviction from fatigue) + Regret Minimization (weighting the irreversibility) addresses the four ways serial searches go wrong: undefined criteria, stopping before calibration, fatigue-driven commitment, and ignoring whether the door is one-way.

---

### Recipe 43: The Polarity Manager

**Use when:** You keep flip-flopping between two genuine goods — stability vs. change, structure vs. autonomy, centralize vs. decentralize, work vs. rest — and no choice ever sticks. You "solve" it, feel relief, then months later the same tension is back. (This recipe lives in decision-making but doubles as a systems-change tool: many organizational tensions are polarities, not problems.)

**When NOT to use:** When the tension is a one-time decision you can make and move past (use R1–R6). When one side genuinely has no upside and you're just avoiding a hard call. Simpler heuristic: "Have I 'solved' this before only to have it return? If yes, it's a polarity."

**Step 1:** Dialectical Synthesis via Both/And Reframe, through the lens of Frame check.
"First, diagnose the type. Is this a *problem to solve* (it has a solution, then it's done) or a *polarity to manage* (two interdependent goods you oscillate between indefinitely)? The tell is recurrence — if you've resolved it before and it came back, you've been treating a polarity as a problem, which guarantees the swing."

**Step 2:** Dialectical Synthesis via Polarity Mapping, through the lens of Second-order.
"Map the upside and downside of each pole as four quadrants. The core dynamic: over-pursuing one pole's upside eventually delivers the *other* pole's downside. Over-stabilize and you get stagnation, which makes you crave change; over-change and you get chaos, which makes you crave stability. Trace your own loop through the four quadrants."

**Step 3:** Systems Thinking via Delay Mapping, through the lens of Map vs. territory.
"The oscillation has a period. How long passes between over-correcting toward one pole and feeling the pain that drives you back? Long delays make the swings violent and the cause hard to see — by the time the downside arrives, you've forgotten the over-correction that caused it."

**Step 4:** Dialectical Synthesis via Paradox Integration, through the lens of Opportunity Cost.
"You manage a polarity by tending the balance, not by choosing a side. Design two things: the early-warning signals that tell you you've ridden one pole too far (before the downside forces a violent swing), and the small corrective moves to make at those signals. Name what staying balanced costs you, so you choose it deliberately rather than lurching."

**Abandon when surprised:** If Polarity Mapping in Step 2 reveals that one pole has only downsides and no genuine good, this isn't a polarity at all — it's a decision you've been avoiding by pretending both sides have merit. Choose the good pole and switch to a decision recipe.

**The prompt:**
"I keep flip-flopping between [X] and [Y] and neither ever sticks. First, diagnose: is this a problem to solve or a polarity to manage? (If I've 'solved' it before and it returned, it's a polarity.) Second, map the upside and downside of each pole, and trace how over-pursuing one side's upside eventually produces the other side's downside. Third, identify the delay — how long between over-correcting one way and feeling the pain that swings me back? Fourth, design the early-warning signals that tell me I've gone too far one way, plus the small corrections to make at those signals, so I tend the balance instead of lurching."

**What makes this recipe unique:** It is the only recipe built for tensions that *have no solution by design* — the both/and goods you're meant to manage forever, not resolve once. Both/And Reframe (diagnosing polarity vs. problem) + Polarity Mapping (the four-quadrant dynamic) + Delay Mapping (explaining why the swings are violent) + Paradox Integration (designing the balancing discipline) reframes the exhausting flip-flop from a failure to decide into a system to steward — which is why every prior "decision" only bought temporary relief.

## Category 2: Innovation & Creation (continued)

*When you need to generate something new, escape a creative rut, or build novelty systematically.*

---

### Recipe 44: The Creative Unblocker

**Use when:** Blank page. The well is dry and you need to generate *now*. Nothing is coming, or everything that comes feels instantly stupid. This is the acute, in-the-moment block — distinct from a long plateau (R14) or the absence of a novelty *system* (R7, The Innovation Engine).

**When NOT to use:** When the problem isn't generating ideas but choosing among too many (that's R2 or R41). When the block is really a motivation or belief problem in disguise. Simpler heuristic: "Can I produce ten deliberately bad versions in the next five minutes? If I won't even try, the block isn't creative."

**Step 1:** Abductive Reasoning via Three-Phase Creative Cycle, through the lens of Frame check.
"You've collapsed the roles. Right now you're being Dreamer and Critic at the same instant, which is exactly why nothing survives long enough to exist. Forbid the Critic. Enter pure Dreamer mode — generate freely, abundantly, badly, with zero evaluation allowed. The Realist and Critic get their turn later, never now."

**Step 2:** Abductive Reasoning via Lateral Provocation, through the lens of Inversion.
"Inject disruption. Pick a random word and force a connection to your problem. Or state something deliberately absurd ('what if this had to be boring on purpose?' / 'what if the user paid *not* to use it?') and trace where it leads. Then invert: what would the worst possible version look like, and what does that reveal about the good one?"

**Step 3:** Analogical Reasoning via Distant Domain Import, through the lens of Map vs. territory.
"How is a problem shaped like this solved in a field with zero surface similarity to yours — cooking, geology, stand-up comedy, immune systems? Import the *structure* of their solution, not its content. The greater the surface distance, the more novel the result when the structure actually maps."

**Step 4:** Counterfactual Analysis via Parallel Universe Test, through the lens of Opportunity Cost.
"In how many parallel versions of starting this would I have opened differently? Generate three openings I'd never normally pick, and start one of them badly on purpose. The block is almost always fear of the bad first version, not the absence of ideas — a deliberately bad start dissolves it because there's nothing left to protect."

**Abandon when surprised:** If forced generation produces *nothing* even with the Critic fully suspended, the block probably isn't creative. You may not actually believe in the project, or you're depleted — that's R36 (The Identity Audit) or R6 (The Exit Strategist), not a creative unblock.

**The prompt:**
"I'm staring at a blank page on [X] and nothing is coming. First, separate the roles I've collapsed — forbid all criticism and let me generate freely and badly, with no evaluation. Second, disrupt the pattern with a random word and a deliberately absurd provocation, then invert to imagine the worst version. Third, show me how a field with zero surface similarity to mine solves a structurally similar problem, and import the structure. Fourth, give me three openings I'd never normally choose and let me start one badly on purpose. The point is volume and disruption, not quality — quality comes later."

**What makes this recipe unique:** It treats the blank page as a *role-collapse* problem (Dreamer and Critic firing simultaneously) plus a *pattern-lock* problem, not a talent problem. Three-Phase Creative Cycle (separating generation from judgment) + Lateral Provocation (breaking the groove) + Distant Domain Import (borrowing foreign structure) + Parallel Universe Test (defeating fear of the bad first draft) is the fast, acute unstick — distinct from R7's systematic novelty program and R14's slow plateau, both of which assume you can already generate at all.

---

### Recipe 45: The Analogy Engine

**Use when:** You suspect someone, somewhere, has already solved a problem shaped like yours — but in a completely different field — and you want to find and import their solution rather than reinvent it.

**When NOT to use:** When the transfer you need is of *your own* expertise from one area to another (that's R28, The Transfer Engine, which moves what *you* already know A→B). When the problem is genuinely unprecedented and no prior solution exists in any field. Simpler heuristic: "Has anyone, anywhere, faced the same *function* under harder constraints?"

**Step 1:** Analogical Reasoning via Functional Analogy, through the lens of Frame check.
"Stop asking 'what looks like my problem?' Ask 'what *does what my problem needs done*?' Abstract the function above the surface — not 'I need to onboard users faster' but 'I need to compress a slow trust-building process.' The abstracted function is the search key, and getting it right is the whole game."

**Step 2:** Analogical Reasoning via Cross-Industry Transfer, through the lens of Map vs. territory.
"Which industry has already solved this exact function, ideally under tighter constraints than yours? Emergency rooms compress trust-building with strangers in minutes; aviation compresses safety-critical onboarding. Study the underlying *principle* they use, not the surface implementation — that won't port."

**Step 3:** Analogical Reasoning via Distant Domain Import, through the lens of Signal vs. noise.
"Push past the obvious neighbors. The most *distant* field that still shares your function yields the most novel import — and also the highest false-analogy risk. Cast deliberately wide (biology, music, logistics, ecology), then filter hard for the ones where the structure genuinely matches rather than just sounds poetic."

**Step 4:** Analogical Reasoning via Isomorphic Transfer, through the lens of Second-order.
"Map the borrowed solution back element by element. Which parts of theirs correspond to which parts of mine? And critically — *where does the analogy break*? Every analogy is true in some respects and false in others; the break point is exactly where a literal copy will fail. Adapt around it."

**Abandon when surprised:** If no foreign domain shares your problem's underlying structure, the problem may be genuinely novel rather than merely unsolved-by-you. Drop analogy and switch to First Principles — R1 (The Wrong-Problem Detector) or R7 (The Innovation Engine).

**The prompt:**
"I think my problem with [X] has already been solved somewhere, in a totally different field. First, abstract the *function* my problem needs performed, above its surface details. Second, find an industry that solves that exact function — ideally under harder constraints — and extract the underlying principle, not the surface method. Third, push to the most distant field that still shares the structure, casting wide then filtering for real structural matches. Fourth, map the borrowed solution back element by element and tell me precisely where the analogy breaks, so I adapt around the break instead of copying literally."

**What makes this recipe unique:** It is a pure ride through the full Analogical Reasoning operation — function abstraction → near transfer → distant transfer → precise mapping-back — built for *importing a stranger's solution from a foreign domain*. That makes it the mirror image of R28, which exports *your own* expertise across your own domains. The discipline that distinguishes them is Step 1: R45 forces you to abstract the function before searching, so you find solutions invisible from inside your field rather than just reapplying what you already know.

## Category 3: Diagnosis & Problem Solving (continued)

*When something is wrong and you need to find out what and why before acting.*

---

### Recipe 46: The Differential Diagnoser

**Use when:** Something is clearly wrong and you have two or three competing theories of why, each plausible. You need to *disambiguate* among rival explanations, not just dig deeper into one. Acting on the wrong theory would be costly.

**When NOT to use:** When there's one obvious recurring problem and you need its root cause (that's R13, The Root Cause Excavator, which digs down a single chain). When the symptoms are mild and a cheap fix would work regardless of cause. Simpler heuristic: "What single observation would most cleanly tell my top two theories apart?"

**Step 1:** Abductive Reasoning via Diagnostic Reasoning, through the lens of Outside view.
"List *every* plausible explanation as a ranked differential, not just your favorite. Then apply base rates: which of these causes is simply *common* for symptoms like these? The frequent, boring explanation deserves the top slot until specific evidence dislodges it — exactly the discipline that stops you chasing the exotic theory."

**Step 2:** Abductive Reasoning via Anomaly Hunting, through the lens of Signal vs. noise.
"For each candidate explanation, hunt the observation that *doesn't fit* it. The anomaly that one theory cannot explain but another can is your most valuable data — it discriminates. Separate genuine anomalies from noise you're over-reading."

**Step 3:** Bayesian Updating via Likelihood Ratio Assessment, through the lens of Signal vs. noise.
"For the discriminating evidence, ask of each rival theory: how likely is this observation if THIS theory is true versus if it's false? Weigh the evidence by quality too — an anecdote and a controlled measurement are not equal. The theory under which the strong evidence is least surprising rises; the others fall."

**Step 4:** Abductive Reasoning via Inference to Best Explanation, through the lens of Outside view.
"Score the survivors on explanatory scope, simplicity, mechanism, and fit with what you already know. Then name the single cheapest test that would most separate your top two — and run it *before* committing to a fix. Don't act on the leading theory until you've tried to break the tie."

**Abandon when surprised:** If Anomaly Hunting in Step 2 reveals that all your theories are *partly* true — multiple causes operating at once — stop trying to disambiguate. This isn't a differential, it's a systems problem with interacting drivers. Switch to R13 or a dedicated systems recipe.

**The prompt:**
"Something is wrong with [X] and I have a few competing theories of why. First, list every plausible explanation as a ranked differential and apply base rates — what's simply common for symptoms like these? Second, for each theory, find the observation that doesn't fit it, separating real anomalies from noise. Third, for the discriminating evidence, assess how likely it is under each theory if true versus false, weighting by evidence quality. Fourth, score the survivors on scope, simplicity, and mechanism, then name and run the single cheapest test that separates my top two before I commit to any fix."

**What makes this recipe unique:** Most diagnostic recipes assume a single problem and excavate downward (R13). This one assumes *several live hypotheses* and works to rule out — the way medicine runs a differential. Diagnostic Reasoning with base rates (ranking the field) + Anomaly Hunting (finding discriminating misfits) + Likelihood Ratio Assessment (scoring rivals on the evidence) + Inference to Best Explanation (picking the discriminating test) is built specifically for the situation where the danger isn't depth but *confident commitment to the wrong one of several plausible causes*.

## Category 4: Risk & Uncertainty (continued)

*When you can't predict the future and must act anyway.*

---

### Recipe 47: The Scenario Planner

**Use when:** You can't predict which future you'll get, and the uncertainty is paralyzing your planning. You need a strategy that holds up across multiple plausible futures rather than a bet on one forecast.

**When NOT to use:** When you must decide *right now* under missing information and there's no time to model futures (that's R18, The Uncertainty Navigator). When one variable dominates everything and the rest is noise — just resolve or hedge that one variable. Simpler heuristic: "What are the two things I can't predict that would most change my world?"

**Step 1:** Counterfactual Analysis via Thought Experiment, through the lens of Frame check.
"Identify the two uncertainties that would most reshape your world and that you genuinely cannot control or predict. Cross them into a 2×2: four coherent futures. Build each as a vivid, specified *place* you could describe in detail, not a one-line label — scenarios you can't picture, you can't plan for."

**Step 2:** Counterfactual Analysis via Parallel Universe Test, through the lens of Reversibility.
"Step into each of the four futures and ask: what decision would I wish I had made? Look for the move that shows up as wise across *multiple* scenarios. A strategy robust across several futures beats a brilliant bet on one — and reversible moves let you adapt as the real future declares itself."

**Step 3:** Bayesian Updating via Probabilities and Possible Outcomes, through the lens of Outside view.
"Assign rough probabilities to the four futures, using base rates rather than gut feel. Then compute which strategies have the best probability-weighted outcome *and* survive the worst plausible scenario without ruin. A high expected value that includes a small chance of catastrophe is not actually a good bet."

**Step 4:** Systems Thinking via Unintended Consequences Tracing, through the lens of Second-order.
"Stress your chosen robust strategy inside each scenario: what does it trigger downstream, and on adjacent systems? Then name the early signals — the leading indicators — that would tell you *which* scenario you're actually entering, so you can pre-commit your response now and act fast when the future shows its hand."

**Abandon when surprised:** If one uncertainty turns out to dominate all the others, you don't need four scenarios — you need to resolve or hedge that single variable. Collapse the exercise and switch to R18 or R3 (The Bet Sizer).

**The prompt:**
"I can't predict which future I'll face on [X], and it's stalling my planning. First, pick the two biggest uncertainties I can't control and cross them into four vivid, fully-described futures. Second, step into each and find the decision I'd wish I'd made, looking for moves that are wise across multiple futures and stay reversible. Third, assign rough base-rate probabilities and find the strategy with the best weighted outcome that also survives the worst case without ruin. Fourth, trace the downstream consequences of that strategy in each future and name the early signals that tell me which scenario is actually arriving."

**What makes this recipe unique:** It *models the space of futures* rather than deciding within one — which separates it from R18 (decide now under missing info). Thought Experiment (building the 2×2 of futures) + Parallel Universe Test (finding cross-scenario-robust moves) + Probabilities and Possible Outcomes (weighting while screening for ruin) + Unintended Consequences Tracing (stress-testing plus trigger signals) produces a strategy designed to be *robust across* uncertainty plus a set of tripwires, instead of a forecast that's wrong the moment reality diverges.

---

### Recipe 48: The Outside-View Estimator

**Use when:** You need a number — how long, how likely, how big, how much — and you keep generating it from the inside, by imagining your specific case step by step. Inside-view estimates are systematically optimistic (the planning fallacy); you want a calibrated estimate instead.

**When NOT to use:** When the estimate is low-stakes and a rough guess is fine. When you've already built a reference-class estimate and just need to decide (move to a decision recipe). Simpler heuristic: "How did this go for everyone else who did something like this?"

**Step 1:** Bayesian Updating via Prior Elicitation, through the lens of Frame check.
"Before any analysis, write down your gut estimate and your confidence in it. This makes your starting point honest and prevents you from later pretending the final number is what you 'knew all along.' Name the inside-view story you're tempted to tell."

**Step 2:** Bayesian Updating via Base Rate Check, through the lens of Outside view.
"Find the reference class. How long, how likely, or how big has *this kind of thing* been for everyone else who did it? Start from their distribution, not your specific case. This is the direct correction for the planning fallacy — your project is far more like other projects than your inside view believes."

**Step 3:** Falsification via Fermi Estimation, through the lens of Signal vs. noise.
"Decompose the quantity into factors you can each estimate to an order of magnitude, multiply them, and sanity-check the result. Does the implied magnitude square with observable reality? Fermi estimation won't catch subtle errors but it reliably catches the gross ones — the answer that's off by 10×."

**Step 4:** Bayesian Updating via Confidence Calibration, through the lens of Signal vs. noise.
"Give a *range*, not a point estimate, and make it wide enough that you'd be genuinely surprised (about 90% confident) to land outside it. If the range feels comfortable, it's too narrow — well-calibrated ranges almost always feel uncomfortably wide."

**Abandon when surprised:** If Step 2 reveals no usable reference class exists — the thing is genuinely unprecedented — the outside view can't anchor you. Lean entirely on Fermi decomposition and deliberately wide ranges, and distrust any precise-looking number you or anyone else produces.

**The prompt:**
"I need to estimate [how long / how likely / how big] for [X], and I keep guessing from the inside. First, have me write down my gut estimate and confidence up front. Second, find the reference class — how this has gone for everyone else who did something similar — and start from their distribution, not my case. Third, decompose the quantity into order-of-magnitude factors, multiply, and sanity-check whether the implied size matches reality. Fourth, give me a range wide enough that I'd be 90% surprised to fall outside it, not a single comfortable number."

**What makes this recipe unique:** It is the dedicated cure for the planning fallacy and inside-view overconfidence — the systematic error where we estimate from the imagined specifics of our own case. Prior Elicitation (anchoring honestly) + Base Rate Check (the outside-view correction) + Fermi Estimation (order-of-magnitude sanity check) + Confidence Calibration (forcing an honest range) produces a *calibrated magnitude or likelihood* — distinct from R47, which structures the *shape* of possible futures rather than estimating a single quantity.

## Category 6: Learning & Understanding (continued)

*When the constraint is comprehension — you need to genuinely understand something before you can act on it.*

---

### Recipe 49: The Steelman Decoder

**Use when:** You genuinely cannot understand how an intelligent, informed person believes the opposite of what you believe. You're not trying to win — you're trying to *understand* the other view well enough to pass its own adherents' test.

**When NOT to use:** When you're preparing to argue and need to strengthen *your own* case (that's R21, The Argument Strengthener). When the opposing position is held in transparent bad faith and there's nothing to decode. Simpler heuristic: "Could I state their view so well that they'd say 'yes, exactly'?"

**Step 1:** Perspective Simulation via Charitable Interpretation, through the lens of Frame check.
"Assume the person is intelligent, informed, and acting in good faith — the opposite of the default. What would have to be true about their experience, information, or incentives for their belief to be the *rational* conclusion from where they stand? Build that version, not the caricature your mind reaches for first."

**Step 2:** Perspective Simulation via Opposite Expertise Test, through the lens of Map vs. territory.
"Find the most credentialed, most thoughtful person who holds the opposing view, and engage their actual argument directly — not a summary by someone who disagrees with them. What do they know, or weight differently, that leads them somewhere you don't go? Their map differs from yours for reasons; find the reasons."

**Step 3:** Perspective Simulation via Ideological Turing Test, through the lens of Signal vs. noise.
"Now state their position so faithfully that a genuine advocate couldn't tell you actually disagree. If you can't yet pass this test, you don't understand their view — you understand your straw version of it. Keep going until the steelman is airtight."

**Step 4:** Dialectical Synthesis via Steel Dialectics, through the lens of Second-order.
"Hold your steelmanned version of *their* view beside the strongest version of *yours*. What becomes visible only when both are at full strength at once? The disagreement almost always narrows to a single real crux — a specific fact, value, or weighting where you genuinely diverge — rather than the broad clash it first appeared to be."

**Abandon when surprised:** If the Ideological Turing Test reveals you can pass it easily and *still* disagree, the difference is probably about values, not facts. No amount of further decoding will resolve a genuine values gap — name it as a values difference and stop trying to argue the other person out of it.

**The prompt:**
"I genuinely don't understand how a smart, informed person believes the opposite of me about [X]. First, assume they're rational and in good faith: what would have to be true about their experience or information for their view to be the sensible conclusion? Second, take me to the most credentialed advocate of their position and engage their real argument, not a hostile summary. Third, help me state their view so faithfully that an advocate couldn't tell I disagree. Fourth, set my strongest view beside their strongest view and find the single real crux where we actually diverge."

**What makes this recipe unique:** It runs almost entirely inside Perspective Simulation but points the operation *outward* (understand the other) rather than inward (stress-test the self). Charitable Interpretation (rational reconstruction) + Opposite Expertise Test (engaging the best advocate) + Ideological Turing Test (the comprehension proof) + Steel Dialectics (locating the crux) is built for the failure mode where you've only ever encountered the *weak* version of a view — which makes the believers look stupid and the disagreement look bigger than it is. The Turing Test is the recipe's bar: you haven't understood until you can pass it.

---

### Recipe 50: The Claim Verifier

**Use when:** You're drowning in conflicting information and need to assess what's actually *true* before acting — a contested news story, a vendor's claims, a piece of due diligence, a rumor that keeps circulating. The cost of believing something false is high.

**When NOT to use:** When the gap is in *your own* understanding rather than the *quality of external information* (that's R12, The Blind Spot Finder). When the stakes are trivial and a quick gut check is fine. Simpler heuristic: "How many genuinely independent sources confirm this, and would I notice if they were all repeating one origin?"

**Step 1:** Bayesian Updating via Source Triangulation, through the lens of Signal vs. noise.
"Does the claim have independent confirmation from *different types* of source — human, documentary, observational? The crucial test: three people repeating one original source are one source wearing three coats, not three confirmations. Identify what kind of evidence you actually have and what's missing."

**Step 2:** Bayesian Updating via Evidence Weighting, through the lens of Skin in the game.
"Rank each piece of evidence by quality — anecdote below expert opinion below observational study below replicated experiment. And ask who *benefits* from your believing each source: does anyone asserting it bear real consequences if it turns out false? Costless claims from interested parties deserve the steepest discount."

**Step 3:** Bayesian Updating via Likelihood Ratio Assessment, through the lens of Signal vs. noise.
"For the strongest evidence, ask: how likely is this to exist if the claim is TRUE versus if it's FALSE? Evidence that's roughly equally likely either way is decoration, not information — however vivid it feels. Keep only the evidence that actually discriminates between true and false."

**Step 4:** Falsification via Disconfirmation Search, through the lens of Frame check.
"Deliberately hunt for the evidence that would *disprove* the claim, and check whether anyone credible has seriously tried to debunk it and failed. A claim that has survived honest disconfirmation attempts is far stronger than one that's merely been widely repeated by people who wanted it to be true."

**Abandon when surprised:** If Source Triangulation in Step 1 traces every source back to a single origin, you don't have a verified claim — you have one unverified claim echoed many times. No amount of further weighting changes that; treat it as a single unconfirmed source and act with corresponding caution.

**The prompt:**
"I'm getting conflicting information about [X] and need to figure out what's actually true. First, check for independent confirmation from *different types* of source and flag whether apparent confirmations all trace to one origin. Second, rank the evidence by quality and ask who benefits from my believing each source, and whether they bear any cost if it's false. Third, for the strongest evidence, assess how likely it is to exist if the claim is true versus false, and discard anything equally likely either way. Fourth, deliberately search for what would disprove the claim and whether credible debunking attempts have failed."

**What makes this recipe unique:** It is an *epistemics* recipe, aimed at the quality of external information — which separates it from R12 (your own blind spots). Source Triangulation (independence by type) + Evidence Weighting (quality and skin-in-the-game) + Likelihood Ratio Assessment (keeping only discriminating evidence) + Disconfirmation Search (surviving debunking) targets the four ways false claims propagate: fake independence (one source echoed), low-quality evidence dressed up, vivid-but-non-diagnostic detail, and the absence of any serious attempt to disprove.
