# The 9 Operations and Their Moves

Each operation is a reasoning procedure that transforms observations into specific types of insight. Each operation has moves — specific techniques for executing that operation. Operations are the **general-purpose reasoning procedures** that the skill's recipes (composed sequences) are built from. They are deliberately distinct from the situation-specific tools the router retrieves from the role catalogues (e.g. NPV, ZOPA, Kelly Criterion) and from the standing framing lenses in `lenses.md` (e.g. Inversion, Second-order, Opportunity cost): an operation is a move you *run on* a problem, broadly applicable across domains.

> **Encyclopedia anchors.** Where an operation or move corresponds to a curated model in `references/catalogues/OPERATION.md`, its record `#number` is cited as an *Encyclopedia anchor*. This is the traceability link between the reasoning layer and the tagged library — and the dedup record (a catalogue model already represented here is anchored, not double-listed). The full fold-in audit is the **Decision log** at the end of this file.

---

## Table of Contents
1. [First Principles (DECONSTRUCT)](#op-1) — 10 moves
2. [Falsification (EVALUATE)](#op-2) — 11 moves
3. [Analogical Reasoning (GENERATE)](#op-3) — 8 moves
4. [Abductive Reasoning (GENERATE)](#op-4) — 9 moves
5. [Counterfactual Analysis (GENERATE)](#op-5) — 10 moves
6. [Dialectical Synthesis (INTEGRATE)](#op-6) — 8 moves
7. [Systems Thinking (INTEGRATE)](#op-7) — 9 moves
8. [Bayesian Updating (EVALUATE)](#op-8) — 10 moves
9. [Perspective Simulation (INTEGRATE)](#op-9) — 9 moves

*(v3: 84 moves across 9 operations — 9 new moves promoted from the curated OPERATION catalogue this session; see Decision log.)*

---

<a id="op-1"></a>
## Operation 1: First Principles

**Function:** DECONSTRUCT
**Core operation:** Strip away assumptions, conventions, and inherited beliefs until you reach foundational truths that cannot be further decomposed.
**What it does that nothing else can:** Reveals when the entire framing of a problem is wrong — when the assumptions everyone shares are the ones nobody questions. Every other operation works WITHIN a frame. First Principles questions the frame itself.
**Structural blind spot:** Can deconstruct endlessly without rebuilding. Excellent at revealing what's false but doesn't generate new possibilities on its own. Can also miss emergent properties — the foundations don't contain the behavior of the whole.
**Signature question:** "What would I believe about this if I had zero prior knowledge and could only work from what's directly observable?"
**Encyclopedia anchor:** #251 (First Principles Thinking, `high`, cognitive).

### Move 1: Five Whys
**Origin:** Toyota Production System (Taiichi Ohno)
**Procedure:** Ask "why?" iteratively (typically 5 times) to move from surface symptoms to root causes.
**Best for:** Operational problems with causal chains. Manufacturing defects, process failures, recurring bugs.
**Limitation:** Assumes linear causation. Struggles with problems that have multiple interacting causes rather than a single chain.

### Move 2: Socratic Questioning
**Origin:** Plato's Dialogues
**Procedure:** Probe with targeted questions designed to expose contradictions, unstated assumptions, and logical gaps in a position — including your own. Six types: clarification, probing assumptions, probing evidence, questioning viewpoints, probing implications, questioning the question.
**Best for:** Examining beliefs, testing coherence of arguments, teaching through inquiry.
**Limitation:** Can feel adversarial. Works better for examining existing beliefs than generating new ones.

### Move 3: Cartesian Doubt (Method of Doubt)
**Origin:** René Descartes, Meditations on First Philosophy
**Procedure:** Systematically doubt EVERYTHING that can possibly be doubted. Whatever survives radical doubt is genuinely foundational.
**Best for:** Philosophical analysis, examining foundations of an entire belief system, starting from absolute zero.
**Limitation:** Can lead to radical skepticism that paralyzes action. In practice, you need "good enough" foundations, not Cartesian certainty.

### Move 4: Zeroth Principle
**Origin:** Emerged in frontier prompting conversations (named by analogy to the Zeroth Law of Thermodynamics)
**Procedure:** Before questioning your assumptions about the problem, question your assumptions about WHAT THE PROBLEM IS. Examine the meta-assumptions — the assumptions behind the assumptions.
**Best for:** Situations where conventional first-principles analysis keeps producing unsatisfying results, suggesting the frame itself is wrong.
**Limitation:** Can be destabilizing. Questioning the question itself sometimes undermines the ability to take action.

### Move 5: Physics-Style Reasoning (Musk Method)
**Origin:** Elon Musk's approach to engineering problems
**Procedure:** Identify the physical constraints (not economic, not conventional, not regulatory — physical). What do the laws of physics permit? Work backward from there.
**Best for:** Engineering, hardware, manufacturing, and cost-reduction problems where convention has drifted far from physical limits.
**Limitation:** Only applicable where physical constraints are the binding constraint. Most business, social, and creative problems are constrained by psychology, incentives, and coordination — not physics.

### Move 6: Assumption Mapping
**Origin:** Design thinking / strategic planning practice
**Procedure:** Explicitly list every assumption embedded in a plan, strategy, or belief. Categorize each as: confirmed (evidence-based), unconfirmed (plausible but untested), or critical (if wrong, everything collapses). Attack the critical unconfirmed ones first.
**Best for:** Business plans, strategies, investment theses — anywhere there's a chain of reasoning with hidden links.
**Limitation:** You can only map assumptions you're aware of. The most dangerous assumptions are often the ones so deeply embedded they don't appear on any list.

### Move 7: Regressive Abstraction
**Origin:** Mathematical logic / philosophical analysis
**Procedure:** Take any concept and ask "what is this an instance of?" repeatedly until you reach the most abstract, general principle. Then check whether the abstraction reveals something invisible at the specific level.
**Best for:** Finding hidden connections between seemingly different problems. What looks like three different problems at the surface may be one problem at a deeper level of abstraction.
**Limitation:** Over-abstraction can lose the details that matter. "Everything is an instance of entropy" is true but useless.

### Move 8: Via Negativa (Subtractive Knowledge)
**Origin:** Nassim Taleb (drawing on apophatic theology)
**Procedure:** Instead of asking "what should I add?", ask "what should I remove?" Knowledge grows more reliably by eliminating what's false than by asserting what's true.
**Best for:** Decision-making, health, lifestyle design, product design — anywhere subtraction creates more value than addition.
**Limitation:** Pure subtraction can't generate novelty. At some point you need to build, not just strip away.

### Move 9: Skill Decomposition
**Origin:** Cognitive task analysis / deliberate-practice research (Anderson's ACT-R; Ericsson; Gallwey's inner game). *(Encyclopedia anchor: #2089.)*
**Procedure:** Break a complex capability into component sub-skills, then sort them: which are prerequisite, which run in parallel, which are procedural vs. strategic, and where integration itself becomes a distinct skill. Target the weakest sub-skill for isolated practice rather than trying to improve the whole at once. ("Improve my presentations" → content organization / slide design / vocal delivery / body language / audience reading / Q&A / anxiety management — each a separate practice target.)
**Best for:** Diagnosing a plateau (which sub-skill is the bottleneck?), designing training or curricula, giving precise actionable feedback. Decomposing a *skill* rather than a belief or a problem.
**Limitation:** Some skills are genuinely holistic and resist decomposition. Over-decomposition produces learners who master components but can't integrate them. Different experts decompose the same skill differently.

### Move 10: Double-Loop Learning
**Origin:** Chris Argyris & Donald Schön, action science (rooted in Bateson's levels of learning). *(Encyclopedia anchor: #1114.)*
**Procedure:** Distinguish single-loop learning (adjust actions to better hit the existing goal — a thermostat correcting temperature) from double-loop learning (question whether the goal itself is right — whether *this* is the temperature to target). After any outcome, don't only ask "how do we do this better?"; also ask "are we pursuing the right goal, solving the right problem?" Schedule reviews that interrogate the governing assumptions and frameworks, not just performance against them.
**Best for:** When optimization is producing diminishing returns (you may be efficient at the wrong thing); when metrics look strong but progress doesn't feel real; when growth has plateaued inside the current frame. The organizational-learning cousin of the Zeroth Principle (Move 4): both attack the frame, but Double-Loop targets the *goal*, where Zeroth targets the *problem definition*.
**Limitation:** Constant double-loop questioning produces instability — you need enough single-loop execution to actually ship. Not every framework is wrong; some genuinely need optimization, not interrogation.

---

<a id="op-2"></a>
## Operation 2: Falsification

**Function:** EVALUATE
**Core operation:** Actively attempt to prove a belief, hypothesis, or plan wrong by deriving observable consequences and checking whether they hold.
**What it does that nothing else can:** Delivers decisive refutation. Other operations can weaken confidence or raise questions. Falsification can kill an idea — cleanly and permanently. Its structure (if H then O; not-O; therefore not-H) is the only operation that produces a definitive "this is wrong."
**Structural blind spot:** Can only destroy — cannot generate. Requires a clear, testable prediction, which many important beliefs don't readily provide.
**Signature question:** "What evidence would prove this wrong? Does that evidence exist?"
**Encyclopedia anchor:** #1258 (Falsifiability — Popper's demarcation criterion, `medium`, philosophical) is the principle this operation enacts: a claim that risks nothing against evidence earns no credibility.

### Move 1: Pre-Mortem
**Origin:** Gary Klein, research psychologist *(Encyclopedia anchor: #925.)*
**Procedure:** Before executing a plan, imagine it has already failed. Then work backward: "What went wrong?" Generate as many failure causes as possible.
**Best for:** Project planning, strategy launch, investment decisions — anything with significant commitment where failure is costly.
**Limitation:** Prospective — works with imagined failure, not actual evidence. Can generate paranoia if not balanced with action.

### Move 2: Reductio ad Absurdum
**Origin:** Ancient Greek logic (Euclid, Aristotle)
**Procedure:** Assume the proposition is true. Follow its logical implications rigorously. If the implications lead to a contradiction or absurdity, the original proposition must be false.
**Best for:** Testing logical consistency of arguments, policies, or beliefs.
**Limitation:** Requires the proposition to have derivable logical consequences. Doesn't work well on vague claims.

### Move 3: Crucial Experiment (Experimentum Crucis)
**Origin:** Francis Bacon, refined by Karl Popper
**Procedure:** Design a single experiment whose outcome would decisively distinguish between two competing hypotheses.
**Best for:** Scientific disputes, A/B testing decisions, any situation where two explanations compete.
**Limitation:** Requires that the two hypotheses make different predictions about an observable outcome. Many real-world situations have more than two explanations.

### Move 4: Devil's Advocate
**Origin:** Catholic Church practice (advocatus diaboli)
**Procedure:** Deliberately and systematically argue against a position — especially one you agree with — to expose weaknesses.
**Best for:** Group decision-making, strategy review, anywhere groupthink is a risk.
**Limitation:** Can become performative. Distinct from Steelmanning — Devil's Advocate tries to DESTROY your position; Steelmanning tries to STRENGTHEN the opposing position.

### Move 5: Disconfirmation Search
**Origin:** Cognitive debiasing research (Klayman & Ha)
**Procedure:** After forming a belief, deliberately search for evidence that would disprove it. Specifically seek out: data you haven't looked at, people who disagree, cases where the pattern breaks.
**Best for:** Fighting confirmation bias in any belief.
**Limitation:** Psychologically difficult — the brain actively resists searching for evidence against its beliefs.

### Move 6: Black Swan Hunting
**Origin:** Nassim Taleb, The Black Swan
**Procedure:** Identify the single observation that, if it existed, would destroy your entire thesis. Then actively look for it. Also: identify what LOW-PROBABILITY, HIGH-IMPACT events your plan is most vulnerable to.
**Best for:** Risk assessment, investment analysis, strategic planning under uncertainty.
**Limitation:** By definition, Black Swans are hard to imagine before they happen.

### Move 7: Stress Testing
**Origin:** Engineering and financial risk management *(Encyclopedia anchor: #928.)*
**Procedure:** Subject your idea, plan, or system to extreme conditions and observe where it breaks. Don't test for normal conditions — test for the worst plausible conditions.
**Best for:** Systems design, financial planning, strategy robustness.
**Limitation:** Only tests conditions you can imagine. The stress test is only as good as the scenarios you construct.

### Move 8: Fermi Estimation as Falsification
**Origin:** Enrico Fermi (physicist) *(Encyclopedia anchor: #487.)*
**Procedure:** Estimate the rough magnitude of what your belief implies. If the implied magnitude is wildly inconsistent with observable reality, the belief is likely wrong.
**Best for:** Quick sanity checks on claims, business projections, market size estimates.
**Limitation:** Rough estimates can be wrong by an order of magnitude — catches gross errors but not subtle ones.

### Move 9: Survivorship Audit
**Origin:** Wald's WWII aircraft analysis / survivorship bias research
**Procedure:** Before accepting a success pattern, explicitly identify who/what DIDN'T survive to be studied. Ask whether the pattern you're seeing is real or an artifact of only looking at winners.
**Best for:** Learning from case studies, evaluating business strategies, studying success factors.
**Limitation:** Requires access to failure data, which is often unavailable or unrecorded.

### Move 10: Red Team Analysis (Adversarial Thinking)
**Origin:** Military / intelligence structured-analytic practice (the Army's UFMCS; the intelligence community's "Red Cell" units after the Iraq WMD failure). *(Encyclopedia anchor: #2058.)*
**Procedure:** Deliberately adopt the adversary's perspective to stress-test your own plan, assumptions, and defenses — assign a team (or yourself) to *build the opponent's plan against you* and find where it succeeds. In security this is penetration testing; in strategy it is constructing the competitor's move; in analysis it is challenging the consensus. Effective red-teaming requires genuine independence and organizational protection, or it degrades into rubber-stamping.
**Best for:** Before committing to any major plan; when strong consensus feels suspiciously comfortable; when assessing the robustness of a system (physical, digital, organizational). The institutionalized, perspective-based cousin of **Devil's Advocate** (Move 4): Devil's Advocate is an individual arguing against a position; Red Team is a sanctioned, independent process adopting the *adversary's* full viewpoint.
**Limitation:** Red teams can become cynical critics with no constructive alternative. Poor red-teaming manufactures false confidence. Findings are routinely ignored by leaders already committed. Requires genuine willingness to hear bad news.

### Move 11: Fault Tree Analysis
**Origin:** Systems-safety engineering / probabilistic risk assessment (Vesely's NRC handbook; nuclear industry). *(Encyclopedia anchor: #2017.)*
**Procedure:** Work backward from an undesirable "top event" to map the combinations of failures that could cause it, using Boolean logic gates. **AND gates** require multiple simultaneous failures (redundancy helps — relatively safe); **OR gates** are triggered by any single failure (single points of failure — prioritize these). For "loss of major client": service decline AND competitor offering (AND — redundant quality checks help) OR a single data breach (OR — the vulnerability to fix first). The AND/OR structure tells you whether to invest in redundancy or in prevention.
**Best for:** Finding single points of failure, designing redundancy into critical systems, prioritizing reliability investment by failure pathway. The rigorous structural formalization of the **Pre-Mortem** (Move 1): pre-mortem brainstorms failure causes; fault tree maps their logical combination.
**Limitation:** Assumes static system states; handles time- and sequence-dependent failures poorly. Building complete trees for complex systems is resource-intensive. Only as good as the team's ability to imagine failure modes — it can't surface ones no one considered.

---

<a id="op-3"></a>
## Operation 3: Analogical Reasoning

**Function:** GENERATE
**Core operation:** Recognize structural similarity between two domains and import solutions, patterns, or insights from one to the other.
**What it does that nothing else can:** Accesses solutions that are invisible from inside your domain. Analogy is the only operation that crosses domain boundaries.
**Structural blind spot:** Analogies can be seductive but structurally false. Must always be followed by evaluation to check whether the structural parallel actually holds.
**Signature question:** "What field has already solved a structurally similar problem?"

### Move 1: Biomimicry
**Origin:** Janine Benyus
**Procedure:** Look for how nature has solved the structural equivalent of your problem. Evolution has been running experiments for 3.8 billion years.
**Best for:** Product design, engineering, organizational design, infrastructure.
**Limitation:** Nature optimizes for survival and reproduction, not for human goals like profit or efficiency.

### Move 2: Historical Analogy
**Origin:** Historians' method / Neustadt & May, Thinking in Time
**Procedure:** Find a historical situation structurally similar to your current one. Study what happened, why, and what lessons transfer. Critically: identify where the analogy BREAKS.
**Best for:** Strategic decision-making, geopolitics, market analysis.
**Limitation:** History doesn't repeat, it rhymes. Must always ask: "In what specific ways does this historical case DIFFER from my situation?"

### Move 3: Cross-Industry Transfer
**Origin:** Innovation research (Hargadon & Sutton, IDEO)
**Procedure:** Identify an industry that faces a structurally similar challenge and study how they solved it. Import the principle, not the specific solution.
**Best for:** Product innovation, business model design, process improvement.
**Limitation:** Surface-level copying fails. You must identify the underlying PRINCIPLE and adapt it.

### Move 4: Metaphorical Mapping
**Origin:** Lakoff & Johnson / Hofstadter
**Procedure:** Use a metaphor as a structural bridge — map the relationships in one domain onto another and see what the mapping reveals.
**Best for:** Understanding complex systems, communicating insights, reframing problems.
**Limitation:** Metaphors highlight some features and hide others. Every metaphor is simultaneously illuminating and distorting.

### Move 5: Distant Domain Import
**Origin:** Research on creative analogies (Dunbar, Gentner)
**Procedure:** Deliberately search for parallels in the MOST DISTANT domains possible — fields that share zero surface similarity. The greater the surface distance, the more novel the insight (when the structural parallel holds).
**Best for:** Breakthrough innovation, generating genuinely novel solutions, escaping local optima.
**Limitation:** The more distant the domain, the more likely the analogy is false. High reward, high risk.

### Move 6: Isomorphic Transfer
**Origin:** Mathematics / formal systems theory
**Procedure:** Identify a formal/mathematical structure that maps precisely onto your problem. Not a loose analogy but an exact structural correspondence.
**Best for:** Problems that can be formally modeled — network effects, game theory dynamics, information cascades.
**Limitation:** Requires mathematical literacy. The formal model may leave out qualitative factors that matter enormously.

### Move 7: Functional Analogy
**Origin:** Engineering design methodology
**Procedure:** Instead of asking "what looks like this?", ask "what DOES what this does?" Focus on function, not form.
**Best for:** Product design, institutional design, finding alternatives.
**Limitation:** Functional equivalence doesn't mean equal effectiveness.

### Move 8: Negative Analogy (Anti-Pattern Import)
**Origin:** Adapted from software engineering's "anti-patterns"
**Procedure:** Find a domain where a structurally similar approach FAILED. Study the failure mechanism. Check whether your plan has the same structural vulnerability.
**Best for:** Risk assessment, strategy design, avoiding known failure modes.
**Limitation:** The failure in another domain may have been caused by context-specific factors that don't apply to yours.

---

<a id="op-4"></a>
## Operation 4: Abductive Reasoning

**Function:** GENERATE
**Core operation:** Given a surprising or unexplained observation, generate the hypothesis that, if true, would make the observation non-surprising.
**What it does that nothing else can:** Creates genuinely novel hypotheses. It's the only operation that produces new explanatory frameworks.
**Structural blind spot:** Generates plausible explanations but doesn't verify them. Must always be followed by falsification or Bayesian evaluation.
**Signature question:** "What would have to be true to make this observation non-surprising?"

### Move 1: Anomaly Hunting
**Origin:** Thomas Kuhn, The Structure of Scientific Revolutions
**Procedure:** Deliberately scan for data points, observations, or results that DON'T FIT the current explanation. Anomalies are where new understanding hides.
**Best for:** Scientific research, market analysis, organizational diagnosis.
**Limitation:** Anomalies can be noise rather than signal.

### Move 2: Inference to Best Explanation (IBE)
**Origin:** Charles Sanders Peirce / Gilbert Harman
**Procedure:** Generate multiple possible explanations. Evaluate each against: explanatory scope, simplicity, consistency with known facts, predictive power, and mechanism. Select the best.
**Best for:** Diagnosis of any kind — medical, organizational, technical, strategic.
**Limitation:** "Best explanation" is relative to explanations you've generated. If the true explanation isn't among your candidates, IBE will confidently select a wrong answer.

### Move 3: Retroduction
**Origin:** Charles Sanders Peirce
**Procedure:** Work backward from an observed result to a possible rule and case. Formally: "Result + Rule → Case."
**Best for:** Hypothesis generation in research, detective reasoning, root cause analysis.
**Limitation:** Multiple rules can explain the same result — always produces multiple competing hypotheses.

### Move 4: Diagnostic Reasoning
**Origin:** Medical diagnosis methodology
**Procedure:** Given a set of symptoms/observations, generate a differential diagnosis ranked by likelihood. Then identify the discriminating test.
**Best for:** Any troubleshooting scenario — technical debugging, organizational problems, customer behavior analysis.
**Limitation:** Requires recognizing the relevant symptoms, which depends on expertise.

### Move 5: Pattern Completion
**Origin:** Gestalt psychology / connectionist cognitive science
**Procedure:** When you have a partial pattern, identify what the COMPLETE pattern would look like. What's missing?
**Best for:** Market trend analysis, gap identification, creative insight.
**Limitation:** Human brains sometimes complete patterns that aren't really there (apophenia). The completed pattern must be tested.

### Move 6: Surprising Absence Detection
**Origin:** Sherlock Holmes — "the curious incident of the dog in the nighttime"
**Procedure:** Look for what SHOULD be present but ISN'T. The absence of an expected observation is itself a powerful data point.
**Best for:** Fraud detection, competitive analysis, organizational diagnosis, investigative reasoning.
**Limitation:** Absences are hard to notice. You have to know what SHOULD be there to recognize it's missing.

### Move 7: Abductive Cascade
**Origin:** Emergent practice in complex problem-solving
**Procedure:** Generate a first-level explanation for a surprise. Then treat THAT explanation as a new observation and ask: "What would explain THIS?" Repeat. Each level produces a deeper hypothesis.
**Best for:** Getting beyond surface explanations to structural root causes.
**Limitation:** Each level introduces more speculation. Verify each level independently if possible.

### Move 8: Lateral Provocation
**Origin:** Edward de Bono, Lateral Thinking (1967) *(Encyclopedia anchor: #144, Lateral Thinking — its Random Entry / Reversal / Assumption-Challenge techniques are this move's core; not double-listed.)*
**Procedure:** Introduce a deliberately absurd, random, or provocative statement into the problem space — not because it's true but because it disrupts the default pattern of thought and forces the mind to build new connections. Three techniques: (1) Random Entry — pick a random word/concept and force a connection to the problem; (2) Provocation ("Po") — state something obviously wrong and trace where it leads ("Po: customers should pay us NOT to use the product"); (3) Challenge — take any element of the current approach and ask "why does it have to be this way?" without assuming a reason.
**Best for:** Situations where all conventional approaches have been exhausted and the team is stuck in the same thought grooves. Product innovation, creative problem-solving, breaking out of industry orthodoxy.
**Limitation:** Generates many dead ends for every breakthrough. Requires willingness to explore absurdity without premature judgment. Works best in combination with convergent evaluation afterward — provocation generates; falsification filters.

### Move 9: Three-Phase Creative Cycle (Disney Technique)
**Origin:** Walt Disney's creative process, formalized by Robert Dilts (NLP modeling, 1994)
**Procedure:** Cycle through three distinct cognitive roles, keeping them strictly separated: (1) The Dreamer — generate freely without constraint or criticism. Ask "what if anything were possible?" No evaluation allowed. (2) The Realist — take the Dreamer's output and ask "how would this actually work?" Plan, sequence, resource, and prototype. No new ideas, no killing ideas — only implementation thinking. (3) The Critic — evaluate the Realist's plan for weaknesses, risks, and flaws. "What could go wrong? What's missing? What won't work?" Then cycle back: the Critic's concerns become new inputs for the Dreamer.
**Best for:** Innovation sessions where the team oscillates unproductively between generating ideas and shooting them down. Product development, strategy formulation, creative projects, any situation where premature criticism is killing generativity — or where insufficient criticism is producing unvetted plans.
**Limitation:** Requires disciplined role separation — most people default to running all three phases simultaneously, which is exactly the problem this technique solves. Works best with explicit facilitation or strict time-boxing for each phase. The cycling can be slow for simple decisions.

---

<a id="op-5"></a>
## Operation 5: Counterfactual Analysis

**Function:** GENERATE
**Core operation:** Vary one condition while holding others constant to isolate the structural contribution of specific factors.
**What it does that nothing else can:** Reveals the structural role of individual variables in situations where everything happens together. The only operation that performs controlled experiments in the mind.
**Structural blind spot:** Counterfactuals are imaginary — you never know for certain what WOULD have happened. Quality depends entirely on the quality of your causal model.
**Signature question:** "What would change — and what wouldn't — if this one factor were different?"
**Encyclopedia anchor:** #254 (Counterfactual Thinking, `high`, cognitive).

### Move 1: Removal Test
**Procedure:** Imagine completely removing one factor. What collapses? What survives? What changes? What remains identical?
**Best for:** Determining the real contribution of any element.
**Limitation:** Assumes you can accurately predict consequences of removal.

### Move 2: Sliding Scale
**Origin:** Sensitivity analysis in modeling
**Procedure:** Take a key variable and slide it across its full range. At what point does the outcome change qualitatively? Where are the thresholds?
**Best for:** Identifying sensitivity and finding non-obvious thresholds.
**Limitation:** Assumes smooth variation when reality may have discontinuities.

### Move 3: Temporal Counterfactual
**Origin:** Historical counterfactual analysis (Niall Ferguson)
**Procedure:** Ask "what if this had happened at a different time?" Vary TIMING rather than the event.
**Best for:** Strategic timing decisions, understanding path dependence.
**Limitation:** Changing timing ripples through everything else — maximum speculation.

### Move 4: Substitution Test
**Origin:** Economic reasoning / fungibility analysis
**Procedure:** Replace one element with an alternative and trace what changes. Don't remove — replace. Reveals whether the specific element matters or any equivalent would do.
**Best for:** Personnel decisions, vendor evaluations, assessing uniqueness.
**Limitation:** "Equally competent" is difficult to operationalize.

### Move 5: Thought Experiment
**Origin:** Einstein, Galileo, Maxwell *(Encyclopedia anchor: #274.)*
**Procedure:** Construct a simplified, idealized scenario that isolates the variable you care about. Doesn't need to be realistic — needs to be REVEALING.
**Best for:** Understanding deep principles, resolving paradoxes, clarifying conceptual confusion.
**Limitation:** Oversimplification can remove factors that matter most.

### Move 6: Parallel Universe Test
**Origin:** Decision quality methodology (Strategic Decisions Group)
**Procedure:** Imagine 100 parallel versions of yourself making this same decision. In how many does it work out? Separates decision quality from outcome quality.
**Best for:** Evaluating decisions after the fact without hindsight bias.
**Limitation:** Requires honest estimation of probabilities.

### Move 7: Absence Counterfactual
**Origin:** Historiography / contribution analysis
**Procedure:** Ask "what would NOT have happened without this?" Look for contributions invisible in normal operation but whose absence would be catastrophic.
**Best for:** Valuing invisible contributions, understanding prevention and maintenance.
**Limitation:** Proving the value of prevention is inherently difficult.

### Move 8: Regret Minimization Framework
**Origin:** Jeff Bezos
**Procedure:** Project yourself to age 80. In which scenario do you experience more regret — taking the action or not?
**Best for:** High-stakes decisions where analysis reaches a limit.
**Limitation:** Optimizes for avoiding regret, not necessarily for outcomes.

### Move 9: Ceteris Paribus Isolation
**Origin:** Economic methodology (Marshall)
**Procedure:** Explicitly hold ALL other variables constant and vary only one. State "all else equal" assumptions out loud.
**Best for:** Rigorous analysis of any causal claim.
**Limitation:** In the real world, "all else" is never actually equal.

### Move 10: Backcasting
**Origin:** Scenario-planning / futures studies (Dreborg, 1996; Shell planning methodology). *(Encyclopedia anchor: #1041.)*
**Procedure:** Invert forecasting. Instead of projecting forward from the present, start from a vividly specified *desired* end state and reason backward: what conditions must hold immediately before it, and before that, down to the next action available today? Starting from the destination surfaces necessary preconditions, obstacles, and intermediate milestones that forward-planning skips over. (Counterfactual reasoning's planning-direction variant: where the other moves vary a factor and trace consequences, backcasting fixes the *outcome* and solves for the path.)
**Best for:** Ambitious goals where the destination is clear but the path isn't; strategy and roadmap design; reverse-engineering the milestones of a hard objective.
**Limitation:** The chosen end state can be wrong or unreachable, and backcasting won't tell you so — it assumes the destination is valid. Long backward chains accumulate speculation the further they get from the present. Pairs best with a forward viability check.

---

<a id="op-6"></a>
## Operation 6: Dialectical Synthesis

**Function:** INTEGRATE
**Core operation:** Hold two opposing positions simultaneously. Allow the tension to produce a higher-order insight that transcends both.
**What it does that nothing else can:** Produces insights that NEITHER position contains alone. Not compromise. Genuine synthesis — a new position at a higher level of integration.
**Structural blind spot:** Can get trapped in endless dialectics without conclusion. Needs a stopping point and has no internal mechanism for that.
**Signature question:** "What becomes visible ONLY when I take both sides seriously at the same time?"

### Move 1: Hegelian Triad (Thesis → Antithesis → Synthesis)
**Procedure:** State the thesis. State the antithesis (strongest opposing position). Hold both simultaneously. Identify the synthesis that preserves truth in both while resolving the contradiction.
**Best for:** Philosophical analysis, resolving seemingly binary choices.
**Limitation:** Synthesis can be superficial — combining elements without genuine transcendence.

### Move 2: Both/And Reframe
**Origin:** Barry Johnson / Jim Collins *(Encyclopedia anchor: #1222, Both-And Options — the strategy-domain framing of this move; not double-listed.)*
**Procedure:** When facing either/or, ask: "Is this a polarity to manage rather than a problem to solve?"
**Best for:** Recurring organizational tensions.
**Limitation:** Not all tensions are polarities. Some are genuine either/or decisions.

### Move 3: Polarity Mapping
**Origin:** Barry Johnson
**Procedure:** Map upside and downside of each pole. Over-focusing on one pole's upside eventually produces the other pole's downside.
**Best for:** Organizational change, leadership development, strategy.
**Limitation:** Reveals the dynamic but doesn't prescribe specific ratio or timing.

### Move 4: Paradox Integration
**Origin:** Smith & Lewis
**Procedure:** Identify a genuine paradox — BOTH true AND contradictory. Learn to operate within it rather than resolving it.
**Best for:** Leadership, personal development, existential questions.
**Limitation:** Requires tolerance for ambiguity.

### Move 5: Dialectical Negation (Determinate Negation)
**Origin:** Hegel's actual method
**Procedure:** Identify WHAT SPECIFICALLY is wrong with the thesis. Let that specific wrongness generate its own specific correction. The antithesis isn't just "the opposite" — it's the specific shape of what the thesis gets wrong.
**Best for:** Philosophical rigor, developing arguments with genuine depth.
**Limitation:** Requires significant philosophical sophistication.

### Move 6: Constructive Disagreement Protocol
**Origin:** Deliberative democracy
**Procedure:** Each side must: present strongest case, listen, identify what's TRUE in opposing case, propose solution addressing at least two other concerns.
**Best for:** Team decision-making, strategy sessions, organizational conflict.
**Limitation:** Requires good faith participants.

### Move 7: Steel Dialectics
**Procedure:** STEELMAN BOTH SIDES before attempting synthesis. Build each position as strong as possible. Synthesize from the strongest versions.
**Best for:** High-stakes decisions requiring robust synthesis.
**Limitation:** Time-intensive. Worth it for consequential decisions, overkill for routine ones.

### Move 8: Janusian Thinking
**Origin:** Albert Rothenberg, psychiatrist and creativity researcher (named for Janus, the Roman god who simultaneously faces opposite directions)
**Procedure:** Actively conceive of two or more opposite ideas as simultaneously true and operational — not sequentially (first one, then the other) but at the same instant. Hold the contradiction without resolving it prematurely, and use the tension as a generative force. The key distinction from Paradox Integration: Janusian Thinking uses the simultaneity specifically to produce a creative breakthrough or novel concept, not merely to tolerate the tension. Einstein's key insight came from simultaneously conceiving that a man falling from a roof is both in motion and at rest.
**Best for:** Creative breakthroughs, scientific insight, artistic innovation, reframing problems that appear to have only binary solutions. Especially powerful when a field has calcified around an either/or that might be a both/and at a deeper level.
**Limitation:** Psychologically demanding — the mind naturally wants to resolve contradictions rather than sustain them. Requires high tolerance for cognitive dissonance and the discipline to sit with discomfort until a synthesis crystallizes. Not every opposition conceals a creative breakthrough; sometimes things really are either/or.

---

<a id="op-7"></a>
## Operation 7: Systems Thinking

**Function:** INTEGRATE
**Core operation:** Map relationships, feedback loops, delays, and emergent properties within a complex system.
**What it does that nothing else can:** Reveals unintended consequences, emergent properties, and counterintuitive dynamics from interconnection.
**Structural blind spot:** Can see everything connecting to everything without prioritizing. Can struggle to produce actionable recommendations.
**Signature question:** "What does this connect to that nobody is tracking, and what feedback loops are operating invisibly?"
**Encyclopedia anchor:** #1151 (Systems Thinking, `high`, systems).

### Move 1: Causal Loop Diagramming
**Origin:** Jay Forrester / Donella Meadows
**Procedure:** Draw relationships as arrows. Label as positive (same direction) or negative (opposite). Identify reinforcing and balancing loops.
**Best for:** Organizational dynamics, market behavior, policy analysis.
**Limitation:** Focus on 3-5 most important loops to avoid spaghetti.

### Move 2: Stock and Flow Analysis
**Origin:** System dynamics (Forrester)
**Procedure:** Distinguish STOCKS (accumulations) from FLOWS (rates). Most people confuse them.
**Best for:** Financial modeling, resource planning, understanding delays.
**Limitation:** Qualitative stocks (trust, culture) are real but hard to measure.

### Move 3: Leverage Point Analysis
**Origin:** Donella Meadows
**Procedure:** Find where small intervention produces largest change. Leverage points from weakest to strongest: Numbers → Buffer sizes → Structure → Delays → Negative feedback → Positive feedback → Information flows → Rules → Power to change rules → Goals → Paradigm → Transcending paradigms.
**Best for:** Policy design, organizational change, choosing WHERE to push.
**Limitation:** Higher leverage = harder to change. Trade-off between leverage and feasibility.

### Move 4: Boundary Analysis
**Origin:** Critical systems heuristics (Werner Ulrich)
**Procedure:** Examine where you drew the system boundary. What's excluded? What happens if you redraw?
**Best for:** Strategy, policy, stakeholder analysis.
**Limitation:** Can't expand indefinitely. Skill is drawing wisely.

### Move 5: Emergence Scanning
**Origin:** Complexity science (Holland, Kauffman)
**Procedure:** Look for system-level properties not present at the component level.
**Best for:** Organizational culture, market dynamics, community behavior.
**Limitation:** Emergent properties are observable but difficult to predict in advance.

### Move 6: Delay Mapping
**Origin:** System dynamics / Senge
**Procedure:** Identify time delays between actions and consequences. Short delays → stability. Long delays → oscillation and overreaction.
**Best for:** Understanding oscillation, intervention failure, organizational overshoot.
**Limitation:** Delays are often unknown or variable.

### Move 7: Archetypes Recognition
**Origin:** Peter Senge
**Procedure:** Match behavior to common archetypes: Shifting the Burden, Limits to Growth, Tragedy of the Commons, Fixes that Fail, Escalation, Success to the Successful, Growth and Underinvestment.
**Best for:** Quick diagnosis of organizational and market dynamics.
**Limitation:** Don't force-fit every situation into an archetype.

### Move 8: Unintended Consequences Tracing
**Origin:** Robert Merton
**Procedure:** For any intervention, trace: first-order intended effects, first-order unintended effects, second-order effects of both, effects on adjacent systems. Who changes their behavior in response?
**Best for:** Policy analysis, product changes, organizational restructuring.
**Limitation:** Can't trace ALL consequences. Aim for the most likely and severe.

### Move 9: Bottleneck Analysis (Theory of Constraints)
**Origin:** Eliyahu Goldratt, Theory of Constraints (operations research; queueing theory). *(Encyclopedia anchor: #1103.)*
**Procedure:** Find the single constraint that limits the throughput of the whole system. The core insight: improving any step that *isn't* the bottleneck produces zero improvement in system output — so concentrate all attention and resource on the one binding constraint. Once relieved, a new bottleneck emerges elsewhere, making this a continuous cycle. Distinct from **Leverage Point Analysis** (Move 3): Meadows ranks *where to push* across a 12-level hierarchy; Bottleneck finds the *one throughput constraint* to relieve right now. The adversarial/strategic variant is **Center of Gravity analysis** (Clausewitz's *Schwerpunkt*, Encyclopedia anchor #2056) — the single hub of an opponent's power or a problem's persistence, kept as role-catalogue content and reachable when the frame is competitive rather than throughput.
**Best for:** Throughput and flow problems; explaining why past interventions produced no gain (they improved a non-bottleneck); concentrating scarce resource on the point of maximum leverage.
**Limitation:** Assumes a single dominant constraint; some systems have several interacting ones. The bottleneck moves once relieved, so the analysis must be re-run. Identifying structure doesn't guarantee you can control the outcome.

---

<a id="op-8"></a>
## Operation 8: Bayesian Updating

**Function:** EVALUATE
**Core operation:** Assign explicit probabilities to beliefs and update them as evidence arrives.
**What it does that nothing else can:** Answers "how much should this evidence change my mind?" with precision rather than vibes. Prevents both overconfidence and underconfidence.
**Structural blind spot:** Requires a prior (often subjective). Struggles with unprecedented events where no prior exists.
**Signature question:** "Given this new evidence, precisely how much should my confidence change?"
**Encyclopedia anchor:** #472 (Bayesian Updating, `medium`, mathematical).

### Move 1: Base Rate Check
**Origin:** Kahneman & Tversky
**Procedure:** Find how often this type of thing happens in general. Use as starting point, then adjust for specifics.
**Best for:** Any prediction where you're tempted to rely on specifics while ignoring general rates.
**Limitation:** Base rates often unavailable or from non-matching reference classes.

### Move 2: Likelihood Ratio Assessment
**Procedure:** For evidence, ask: "How likely if hypothesis TRUE? How likely if FALSE?" The ratio tells you how much to update.
**Best for:** Evaluating diagnostic value of evidence.
**Limitation:** Requires honest likelihood estimation.

### Move 3: Confidence Calibration
**Origin:** Tetlock, Superforecasting
**Procedure:** State belief AND numerical confidence. Track calibration over time — of things you're 70% confident about, are ~70% true?
**Best for:** Developing epistemic accuracy.
**Limitation:** Requires volume of predictions and time to verify.

### Move 4: Evidence Weighting
**Origin:** Evidence-based medicine
**Procedure:** Assess evidence quality before updating. Hierarchy: anecdote → expert opinion → case study → observational study → controlled experiment → systematic review → meta-analysis.
**Best for:** Knowing how much to trust presented "evidence."
**Limitation:** Hierarchies are domain-dependent.

### Move 5: Prior Elicitation
**Procedure:** Make prior belief EXPLICIT before encountering evidence. Write it down. Prevents hindsight bias.
**Best for:** Decision-making under uncertainty, investment analysis.
**Limitation:** Hard when you have no relevant experience.

### Move 6: Update Bracketing
**Origin:** Forecasting methodology
**Procedure:** Before encountering evidence, define how MUCH different types should move you. Prevents emotional overreaction to vivid but low-quality evidence.
**Best for:** Investing, hiring, strategic decisions.
**Limitation:** Requires knowing which evidence dimensions matter in advance.

### Move 7: Probability Decomposition
**Origin:** Decision analysis
**Procedure:** Break complex probabilities into estimable components. Combine them.
**Best for:** Complex predictions with multiple dependencies.
**Limitation:** Assumes component independence, which is often wrong.

### Move 8: Adversarial Collaboration
**Origin:** Kahneman's proposal
**Procedure:** Find someone who disagrees. Together design a test both agree would move beliefs. Commit to update in advance. Run the test.
**Best for:** Resolving genuine disagreements with evidence.
**Limitation:** Requires willing counterpart and testable question.

### Move 9: Source Triangulation (Multi-Source Verification)
**Origin:** Journalism / epistemology (convergent validity; Woodward & Bernstein's Watergate method). *(Encyclopedia anchor: #2068.)*
**Procedure:** Verify a claim by obtaining independent confirmation from at least three sources of *different types* — ideally human, documentary, and observational. The "different types" requirement is the crux: three people repeating one original source look like confirmation but provide none. Identify what evidence type you actually have, what's missing, and whether each source has motivations coloring its account. Where the other Bayesian moves weigh evidence you already hold, this move governs *gathering* it — confirmation by volume of one type is the failure mode it prevents.
**Best for:** Any consequential claim before acting on it — due diligence on investments, hires, partnerships; assessing news or intelligence where the cost of being wrong is high.
**Limitation:** Truly independent sources may not exist for some claims, and three sources can still all be wrong. Full triangulation is often impractical under time pressure. In some domains source access is inherently limited.

### Move 10: Probabilities and Possible Outcomes
**Origin:** Decision theory / expected-utility reasoning (Bevelin, Munger). *(Encyclopedia anchor: #1291.)*
**Procedure:** Think in distributions, not point predictions. For any uncertain decision, map at minimum three scenarios — best case, base case, worst case — each with an estimated probability and value, then compute the probability-weighted expected value across all of them. This surfaces what single-scenario planning hides: a strategy "likely to work" (90% modest gain) can carry negative expected value if its 10% tail is catastrophic. Don't only ask "will this probably work?" — ask "what happens in the cases where it doesn't?"
**Best for:** Decisions with uncertain outcomes where you're tempted to plan only for the most likely case; surfacing tail risk; turning binary "work / not-work" thinking into a distribution.
**Limitation:** Probability estimation is hard and humans are poor at it, especially for rare events. Expected value misleads when an outcome includes ruin — a 1% chance of bankruptcy is qualitatively different from a 1% chance of a missed target. True (unmeasurable) uncertainty needs different tools than probabilistic ones.

---

<a id="op-9"></a>
## Operation 9: Perspective Simulation (Steelmanning)

**Function:** INTEGRATE
**Core operation:** Build the strongest possible version of a position you disagree with — stronger than its own advocates typically make it.
**What it does that nothing else can:** Forces genuine engagement with perspectives your mind instinctively dismisses. The constraint of charitable maximization prevents subtle weakening.
**Structural blind spot:** Can lead to excessive epistemic humility. Not every position deserves maximal charity.
**Signature question:** "What would the smartest, most informed advocate of this position say — and what do they see that I'm missing?"

### Move 1: Ideological Turing Test
**Origin:** Bryan Caplan
**Procedure:** State the opposing position so accurately that an advocate couldn't tell you disagree.
**Best for:** Political disagreements, ideological conflicts.
**Limitation:** Requires genuine understanding, not projection.

### Move 2: Perspective Adoption (Full Role Entry)
**Origin:** Method acting / empathy research *(Encyclopedia anchor: #1363, Perspective-Taking — constructing another's knowledge/incentives/constraints, distinct from empathy and sympathy.)*
**Procedure:** Temporarily BECOME a person who holds the position. Adopt their values, constraints, experiences, worldview.
**Best for:** Interpersonal conflicts, negotiations, customer understanding.
**Limitation:** Emotionally challenging with morally objectionable perspectives.

### Move 3: Strongest Possible Objection
**Procedure:** Against your own position, formulate the single most devastating objection. Not the most common — the most devastating.
**Best for:** Stress-testing your own ideas, intellectual honesty.
**Limitation:** Most people unconsciously pull their punches.

### Move 4: Charitable Interpretation (Principle of Charity)
**Origin:** Quine / Davidson *(Encyclopedia anchor: #1254, Most Respectful Interpretation — the relationship/communication application: default to the most generous plausible reading of ambiguous behavior.)*
**Procedure:** Choose the interpretation that makes them MOST rational, not least.
**Best for:** Communication, conflict resolution, team dynamics.
**Limitation:** Some positions are genuinely held in bad faith. Charity is a default, not absolute.

### Move 5: Taboo Your Words
**Origin:** Eliezer Yudkowsky / LessWrong
**Procedure:** FORBID the key disputed term. Explain using only concrete language. Often reveals the disagreement is about word meaning, not reality.
**Best for:** Resolving debates where people talk past each other.
**Limitation:** Some concepts genuinely resist decomposition.

### Move 6: Steelman the Data
**Procedure:** When data contradicts your position, first build the strongest case that THE DATA IS TELLING THE TRUTH.
**Best for:** Data-driven decisions, fighting confirmation bias.
**Limitation:** Data can genuinely be flawed. Steelman first, then evaluate quality.

### Move 7: Stakeholder Voice Simulation
**Origin:** Design thinking
**Procedure:** For each stakeholder, simulate their perspective at full fidelity. What would they say? What do they know? What do they fear?
**Best for:** Product decisions, policy design, organizational change.
**Limitation:** Your simulation is limited by your knowledge of each stakeholder.

### Move 8: Opposite Expertise Test
**Origin:** Meta-science
**Procedure:** Find the most credentialed expert who DISAGREES with you. Study their argument. What do they know that leads to a different conclusion?
**Best for:** Any strong opinion on a topic where experts disagree.
**Limitation:** Experts can be wrong. Purpose is understanding, not deference.

### Move 9: Dragonfly Eye (Aggregating Perspectives)
**Origin:** Philip Tetlock, superforecasting research (named for the dragonfly's compound eye). *(Encyclopedia anchor: #1042.)*
**Procedure:** Rather than commit to one framework, actively gather many analytical perspectives and integrate them into a single judgment — weighting each by track record and relevance — the way a compound eye fuses thousands of lenses into one image. Where the other moves in this operation build *one* opposing or alternative view at full fidelity, Dragonfly Eye is the *aggregation* move: it synthesizes across many partial views (including the steelmanned ones the other moves produce) into a judgment richer than any single lens.
**Best for:** Forecasting and high-uncertainty judgment; decisions where multiple stakeholders or frameworks each hold part of the truth; the synthesis step after several perspectives have been generated.
**Limitation:** Aggregating low-quality perspectives just averages noise — diversity helps only when the views are genuinely independent and at least partly informed. Weighting by track record assumes you can assess it. Can slide into indecision if no view is ever privileged.

---

## Decision log — OPERATION catalogue fold-in (Session 2b part 2)

Auditable record of how each of the 41 curated models in `references/catalogues/OPERATION.md` was handled. The locked approach was **selective promotion, not fold-everything**: the operations layer holds *general-purpose reasoning procedures* (what recipes compose), so domain-specific tools stay in the role catalogue (reachable by the router) and models already represented here or in `lenses.md` are anchored/deduped, never double-listed. Every model is accounted for; none is deleted (all stay in the catalogue, reachable by `#number`).

### Promoted — 9 genuinely new moves
| # | Model | Promoted to | Why it was missing |
|---|---|---|---|
| #2089 | Skill Decomposition | First Principles · Move 9 | Decomposes a *capability*, not a belief/assumption — a DECONSTRUCT move v1 lacked. |
| #1114 | Double-Loop Learning | First Principles · Move 10 | Questions the *goal* itself (Argyris); frame-attacking cousin of Zeroth Principle. |
| #2058 | Red Team Analysis | Falsification · Move 10 | Institutional adversarial-perspective testing; distinct from individual Devil's Advocate. Used live in the walking skeleton. |
| #2017 | Fault Tree Analysis | Falsification · Move 11 | AND/OR failure-causation logic; structural formalization of Pre-Mortem. |
| #1041 | Backcasting | Counterfactual · Move 10 | Fixes the outcome and solves for the path (inverts forecasting); no v1 equivalent. |
| #1103 | Bottleneck Analysis (ToC) | Systems · Move 9 | Single throughput constraint (Goldratt); distinct from Meadows' Leverage hierarchy. |
| #2068 | Source Triangulation | Bayesian · Move 9 | Governs *gathering* evidence by independent type; v1's Bayesian moves only weighed evidence already held. |
| #1291 | Probabilities & Possible Outcomes | Bayesian · Move 10 | Scenario/expected-value distribution thinking; no v1 move covered it. |
| #1042 | Dragonfly Eye | Perspective Simulation · Move 9 | Aggregates many views into one judgment; v1 moves only built one opposing view. |

### Deduped — already represented, anchored not double-listed
- **Operations already in v1 (anchored on the operation):** #251 First Principles → Op 1 · #254 Counterfactual → Op 5 · #1151 Systems Thinking → Op 7 · #472 Bayesian Updating → Op 8.
- **Moves already in v1 (anchored on the move):** #274 Thought Experiment → Op 5 M5 · #487 Fermi → Op 2 M8 · #925 Pre-Mortem → Op 2 M1 · #928 Stress Testing → Op 2 M7 · #1222 Both-And Options → Op 6 M2 · #144 Lateral Thinking → Op 4 M8 (de Bono cluster) · #1363 Perspective-Taking → Op 9 M2 · #1254 Most Respectful Interpretation → Op 9 M4.
- **Principle behind an operation:** #1258 Falsifiability → anchored as the criterion enacted by Op 2.

### Kept as lens — not promoted (would duplicate `lenses.md`)
- #211 Opportunity Cost and #269 Second-Order Thinking are already two of the 10 standing cross-cutting lenses in `lenses.md`. Promoting them as operations would violate the no-version-drift guardrail. They surface as *framing lenses* (router step 6), not as operations.

### Kept as role-catalogue content — situation-specific tools, not general operations
Per the locked decision (leave in the role catalogue, reachable by router via role × domain; logged here, not deleted). These are real and valuable but are *applied tools for a specific situation*, not broadly-composable reasoning moves:
- **Finance/decision:** #1324 Net Present Value · #203 Kelly Criterion · #1430 Energy ROI Analysis · #404 Heuristics-Model Thinking.
- **Negotiation/communication:** #1647 ZOPA Analysis · #1651 Mirroring & Labeling · #1673 Power Mapping · #1216 Third Story.
- **Ethics/philosophical:** #1675 Utilitarian Calculus · #634 Memento Mori · #1973 Seventh Generation Thinking.
- **Performance/security/clinical:** #2096 Mental Rehearsal & Visualization · #237 Affect Labeling · #1769 Personal Threat Model.
- **Strategy:** #1318 Burning Bridges — a commitment device (eliminate retreat to force commitment), an *action* tactic rather than a reasoning procedure; kept as content. · #2056 Center of Gravity — cited under Bottleneck (Op 7 M9) as the adversarial variant, kept as content.

### Noted as meta-frame — not a move
- #258 Latticework of Mental Models is Munger's premise for *the entire skill* (a connected structure of cross-disciplinary models), not a single operation. It is the rationale for having an operations layer at all, reflected in this file's intro, not listed as a move.

**Reconciliation:** 9 promoted + 13 deduped (4 operations + 8 moves + 1 principle) + 2 kept-as-lens + 16 kept-as-content + 1 meta = **41.** ✓ Every catalogue model accounted for; none deleted; all reachable by `#number`.
