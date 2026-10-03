# Thinking Recipes — Part 5 (R25–R32)

> **Reading convention:** see the header of `recipes-part1.md`. Each step is `[Operation] via [Move],
> through the lens of [Lens]` — operations/moves resolve to `operations-moves.md`; "through the lens of
> X" is **lens-as-use** per `lenses.md` (no lens catalogue). Ported/reconciled in S4a.

## Table of Contents
- [R25: The Mental Model Extractor](#recipe-25-the-mental-model-extractor)
- [R26: The Expertise Accelerator](#recipe-26-the-expertise-accelerator)
- [R27: The Assumption Archaeologist](#recipe-27-the-assumption-archaeologist)
- [R28: The Transfer Engine](#recipe-28-the-transfer-engine)
- [R29: The Bottleneck Finder](#recipe-29-the-bottleneck-finder)
- [R30: The Minimum Viable Path](#recipe-30-the-minimum-viable-path)
- [R31: The Unintended Consequences Scanner](#recipe-31-the-unintended-consequences-scanner)
- [R32: The Implementation Stress Test](#recipe-32-the-implementation-stress-test)

## Category 6: Learning & Understanding

*When the bottleneck is comprehension — you need to understand something at a deeper structural level.*

---

### Recipe 25: The Mental Model Extractor

**Use when:** An expert does something brilliantly but can't explain how. A master practitioner has implicit knowledge that you need to make explicit and transferable.

**When NOT to use:** When the expert's knowledge is already well-documented. When the skill is purely physical and not cognitive. Simpler heuristic: "Is there already a book about how they do what they do?"

**Step 1:** Abductive Reasoning via Diagnostic Reasoning, through the lens of the Curse of Knowledge.
"Observe the expert in action. What decisions do they make that a novice wouldn't? Where do they look, what do they ignore, and when do they deviate from the standard approach? The expert can't tell you this — their competence has become invisible to them. You have to infer the model from the behavior."

**Step 2:** First Principles via Regressive Abstraction.
"Take each observed decision and ask: 'what is this an instance of?' repeatedly. The expert's specific moves in specific situations are instances of deeper principles. Abstract until you find the principle that explains multiple seemingly different decisions."

**Step 3:** Counterfactual Analysis via Substitution Test, through the lens of Comparative Advantage.
"Test each extracted principle: if a novice followed this principle, would they make decisions that look like the expert's? If not, you've extracted a surface pattern, not the real model. The gap reveals what's still missing."

**Step 4:** Analogical Reasoning via Isomorphic Transfer, through the lens of Pattern Recognition.
"Does the extracted model map onto any known framework? Sometimes the expert has independently discovered a known principle (they're doing Bayesian updating without knowing the term). Connecting their implicit model to explicit frameworks makes it teachable."

**Step 5:** Falsification via Crucial Experiment.
"Find a case where the extracted model would predict one thing and common wisdom would predict another. Show it to the expert. If they agree with the model's prediction, you've captured something real. If they disagree, the model is missing a key element — and their disagreement reveals what it is."

**Abandon when surprised:** If Regressive Abstraction reveals that the expert's decisions are driven by a single deep principle you hadn't considered — rather than multiple surface rules — you've found the core.

**The prompt:**
"[Expert/person] does [X] brilliantly but can't explain how. First, observe their decisions: what do they do that a novice wouldn't, and where do they deviate from standard approaches? Second, abstract each decision upward — what principle explains multiple seemingly different choices? Third, test the extraction: if a novice followed this principle, would they make expert-like decisions? What's still missing? Fourth, does this extracted model map onto any known framework? Fifth, design a crucial experiment: find a case where the model predicts one thing and common wisdom predicts another, and check it against the expert's intuition."

**What makes this recipe unique:** It makes the invisible visible. Diagnostic Reasoning (inferring from behavior) + Regressive Abstraction (finding deeper principles) + Substitution Test (verifying transferability) + Isomorphic Transfer (connecting to known frameworks) + Crucial Experiment (validating against expert intuition) is the only sequence designed to extract knowledge that the person holding it can't articulate.

---

### Recipe 26: The Expertise Accelerator

**Use when:** You need to reach functional competence in a new domain faster than normal learning allows. You don't need world-class expertise — you need "dangerous competence" quickly enough to make good decisions and avoid critical mistakes.

**When NOT to use:** When surface-level knowledge is sufficient. When you have access to a trusted domain expert who can make decisions for you. Simpler heuristic: "Do I need to understand this myself, or do I need to find someone who does?"

**Step 1:** First Principles via Assumption Mapping, through the lens of Pareto Principle.
"What are the 20% of concepts that generate 80% of the field's explanatory power? Every domain has a small number of foundational principles that everything else builds on. Identify them. Ignore the rest for now."

**Step 2:** Analogical Reasoning via Cross-Industry Transfer, through the lens of Functional Analogy.
"What do I already know from other domains that transfers? The fastest learning happens when you can map new knowledge onto existing frameworks. Find the structural bridges between what I know and what I need to learn."

**Step 3:** Perspective Simulation via Opposite Expertise Test, through the lens of Dunning-Kruger Effect.
"What do the best practitioners in this field think the beginners get most wrong? Not the technical mistakes — the conceptual ones. The errors that come from applying the wrong mental model entirely. Learn what NOT to think before learning what to think."

**Step 4:** Falsification via Crucial Experiment, through the lens of Circle of Competence.
"After initial learning, test my understanding against real problems. Where does my framework break? The breakdowns reveal the gaps between my analogical understanding and the domain's actual structure. These gaps are what I study next."

**Abandon when surprised:** If Step 2 reveals that NOTHING you already know transfers cleanly — the new domain operates on entirely different principles — slow down. You're in a domain that resists analogical learning, and rushing will produce dangerous overconfidence.

**The prompt:**
"I need to become functionally competent in [domain] quickly. First, what are the 20% of concepts that generate 80% of the field's explanatory power? Second, what do I already know from other domains that transfers structurally? Third, what do the best practitioners think beginners get most conceptually wrong — not technical errors, but wrong mental models? Fourth, test my understanding against real problems: where does my framework break, and what do the breakdowns reveal?"

**What makes this recipe unique:** It's designed for speed without sacrificing depth. Assumption Mapping/Pareto (learning the vital few) + Cross-Industry Transfer (leveraging existing knowledge) + Opposite Expertise Test (avoiding the biggest beginner errors) + Crucial Experiment (testing and revealing gaps) is optimized for reaching functional competence rather than exhaustive expertise.

---

### Recipe 27: The Assumption Archaeologist

**Use when:** You suspect deep, unexamined assumptions are constraining your thinking but you can't identify them. Your conclusions feel solid but rest on foundations you've never inspected.

**When NOT to use:** When your assumptions have been recently tested and validated. When the constraint is practical, not conceptual. Simpler heuristic: "Have I tested my assumptions lately?"

**Step 1:** First Principles via Cartesian Doubt, through the lens of Legibility.
"Doubt EVERYTHING you take for granted about this domain. Not just your conclusions — your definitions, your categories, your metrics, your implicit ontology. What have you been making 'legible' in ways that flatten essential complexity?"

**Step 2:** Abductive Reasoning via Surprising Absence Detection, through the lens of Streetlight Effect.
"What should be here that isn't? What questions is nobody asking? What data is nobody collecting? The absences often reveal the deepest assumptions — the things so taken for granted that their absence can't even be noticed without deliberate effort."

**Step 3:** Analogical Reasoning via Historical Analogy, through the lens of Shifting Baseline Syndrome.
"What did practitioners in this field believe 50 years ago that they've since abandoned? What will practitioners 50 years from NOW likely abandon that we currently take for granted? Historical perspective makes current assumptions visible."

**Step 4:** Dialectical Synthesis via Paradox Integration, through the lens of Map vs. Territory.
"Hold two contradictory assumptions simultaneously: the assumption as you've been using it, and its negation. Don't resolve the contradiction — sit with it. The discomfort of holding both often reveals a deeper truth that transcends the assumption entirely."

**Abandon when surprised:** If Cartesian Doubt in Step 1 produces genuine vertigo — the feeling that the ground beneath your reasoning is less solid than you assumed — you've hit an assumption that MATTERS. Stay with the vertigo.

**The prompt:**
"I suspect deep assumptions are constraining my thinking about [X]. First, doubt everything I take for granted — not just conclusions but definitions, categories, and metrics. What would look different without the standard framework? Second, what should be here that isn't — what questions is nobody asking, what data is nobody collecting? Third, what did practitioners believe 50 years ago that's since been abandoned — and what do we believe now that future practitioners will likely abandon? Fourth, hold my deepest assumption and its negation simultaneously — what becomes visible in the tension?"

**What makes this recipe unique:** Assumptions are invisible by design — they're the water the fish can't see. Cartesian Doubt (questioning everything) + Surprising Absence Detection (finding what's not being asked) + Historical Analogy (using time as a lens) + Paradox Integration (using contradiction as revelation) is specifically designed to make visible the things you've never thought to question.

---

### Recipe 28: The Transfer Engine

**Use when:** You have hard-won expertise in one domain and want to apply its deep structure to a new domain. You suspect your knowledge is more portable than it seems — but direct application fails because the surface features don't match.

**When NOT to use:** When the new domain's fundamentals are genuinely different from your expertise. When specific technical knowledge can't be replaced by structural insight. Simpler heuristic: "Is this really the same problem in different clothes, or actually a different problem?"

**Step 1:** First Principles via Regressive Abstraction.
"Take your deepest expertise and abstract it repeatedly. 'I'm good at X' → 'I'm good at the PRINCIPLE underlying X' → 'I'm good at the META-PRINCIPLE underlying that principle.' Keep going until you reach a level of abstraction that could apply across multiple domains."

**Step 2:** Analogical Reasoning via Isomorphic Transfer, through the lens of Functional Analogy.
"Map the formal structure of your expertise onto the new domain. Not the content — the STRUCTURE. What in the new domain plays the same functional role as the elements you understand deeply? Where does the mapping hold and where does it break?"

**Step 3:** Falsification via Disconfirmation Search, through the lens of Halo Effect.
"Actively look for where the transfer DOESN'T work. Your expertise can create a dangerous halo effect — confidence that transfers without justification. Where specifically does your existing mental model lead you astray in the new domain?"

**Step 4:** Dialectical Synthesis via Determinate Negation.
"Hold the failure points from Step 3 in tension with the successful transfers from Step 2. The breakdowns reveal the specific ways the new domain differs. Integrate these differences to produce a hybrid model informed by your expertise but adapted to the new territory."

**Abandon when surprised:** If Disconfirmation Search reveals that the transfer breaks in more places than it holds, your domains may share surface similarity but not deep structure. Learn the new domain on its own terms.

**The prompt:**
"I'm expert in [Domain A] and want to apply that expertise to [Domain B]. First, abstract my expertise repeatedly until I find the meta-principles that could apply across domains. Second, map the formal structure: what in Domain B plays the same functional role as elements I understand in Domain A? Where does the mapping hold and break? Third, actively search for where the transfer fails — where does my Domain A intuition lead me astray? Fourth, hold the successes and failures together — what hybrid model emerges?"

**What makes this recipe unique:** Most people either transfer too aggressively or too timidly. Regressive Abstraction (finding meta-principles) + Isomorphic Transfer (mapping structure) + Disconfirmation Search (finding where it breaks) + Determinate Negation (creating the hybrid) is designed for calibrated transfer — maximizing what carries over while respecting what's genuinely different.

---

## Category 7: Execution & Implementation

*When the thinking is done and the bottleneck is making it real.*

---

### Recipe 29: The Bottleneck Finder

**Use when:** Effort is high but throughput is low. The system is busy but not productive. Resources are being consumed but results aren't proportional. Something is constraining the system but nobody can see what.

**When NOT to use:** When the problem is clearly a resource shortage rather than a structural constraint. When you haven't tried the obvious optimizations. Simpler heuristic: "What's the one thing that, if improved, would make everything else easier?"

**Step 1:** Systems Thinking via Stock and Flow Analysis, through the lens of Pareto Principle.
"Map the flow: what comes in, what goes out, and where does it accumulate? Every bottleneck creates a visible accumulation upstream — work piling up, people waiting, inventory growing. Follow the accumulation to find the constraint."

**Step 2:** First Principles via Five Whys, through the lens of Goodhart's Law.
"Once you've found where things are piling up, ask why five times. But also check: are you measuring what matters? If you're measuring output rather than throughput, you might be optimizing a non-bottleneck while the real constraint is elsewhere."

**Step 3:** Counterfactual Analysis via Removal Test, through the lens of Diminishing Returns.
"If you removed or doubled capacity at the suspected bottleneck, would total system throughput change? This is the definitive test. If doubling capacity at one point doesn't change total output, that point isn't the bottleneck — no matter how busy it looks."

**Step 4:** Abductive Reasoning via Surprising Absence Detection, through the lens of Iatrogenics.
"What if the bottleneck isn't where things are jammed, but where things should be happening and aren't? And is it possible that a previous intervention — a process change, a reorganization — is itself the bottleneck?"

**Abandon when surprised:** If the Removal Test reveals that the suspected bottleneck isn't actually the constraint, the recipe has already succeeded — you've avoided the most common error (optimizing the wrong step). Return to Step 1 with the false bottleneck eliminated.

**The prompt:**
"Effort is high but results are low in [X]. First, map the flow — what comes in, what goes out, where does work accumulate? Follow the pile-up. Second, ask why five times at the accumulation point, and check whether metrics are tracking the right thing. Third, the definitive test: if I doubled capacity at the suspected bottleneck, would total output change? Fourth, what if the bottleneck is where things SHOULD be happening but aren't — and could a previous intervention itself be the constraint?"

**What makes this recipe unique:** It uses Theory of Constraints as backbone but extends it with cognitive operations. Stock and Flow Analysis (finding accumulations) + Five Whys with Goodhart's check (preventing metric blindness) + Removal Test (verifying the constraint) + Surprising Absence Detection (finding invisible bottlenecks) catches both visible bottlenecks (where things pile up) and invisible ones (where things should be happening but aren't).

---

### Recipe 30: The Minimum Viable Path

**Use when:** You're overwhelmed by complexity and need the simplest version of your plan that still achieves the core objective. Every version requires more than you have.

**When NOT to use:** When you have the resources to execute the full plan. When simplifying would compromise the core value proposition. Simpler heuristic: "Is the full version actually necessary, or am I overbuilding?"

**Step 1:** First Principles via Via Negativa, through the lens of Pareto Principle.
"What is the CORE OBJECTIVE — the one outcome that, if achieved, makes everything else secondary? Subtract everything that doesn't directly serve that core. What's the minimum feature set, minimum team, minimum timeline, minimum investment?"

**Step 2:** Counterfactual Analysis via Removal Test, through the lens of Reversibility.
"For each remaining element, if I removed this, would the core objective still be achievable? Keep removing until the next removal would compromise the objective. Also check: which elements are reversible (can be added later) and which are irreversible (must be included now)?"

**Step 3:** Systems Thinking via Leverage Point Analysis, through the lens of Gall's Law.
"Of the minimum set that remains, which element has the most leverage — the one that, if done exceptionally well, carries the most weight? Concentrate limited resources there. Remember Gall's Law: complex systems that work always evolved from simple systems that worked."

**Step 4:** Falsification via Crucial Experiment, through the lens of Critical Mass.
"Design the smallest experiment that tests whether the minimum viable path actually WORKS. What's the quickest way to find out if the core objective is achievable with the simplified approach?"

**Abandon when surprised:** If the Removal Test in Step 2 reduces the plan to something so simple you feel embarrassed by it, that's probably the right version. The embarrassment is your complexity bias talking.

**The prompt:**
"I'm overwhelmed trying to execute [X]. First, what's the absolute core objective — the one thing that matters? Subtract everything that doesn't directly serve it. Second, for each remaining element, would the core still be achievable without it? Remove everything removable. Which must be included now versus added later? Third, of the minimum set, which single element has the most leverage? Fourth, design the smallest experiment that tests whether this minimal version actually works."

**What makes this recipe unique:** It works entirely by subtraction. Via Negativa (stripping to core) + Removal Test (testing each element's necessity) + Leverage Point Analysis (concentrating resources) + Crucial Experiment (testing the minimum) is designed for the specific failure mode of overplanning — where the attempt to be thorough prevents execution entirely.

---

### Recipe 31: The Unintended Consequences Scanner

**Use when:** You're about to implement a major change — a new policy, a product launch, a restructuring — and you need to anticipate the cascading effects before they hit.

**When NOT to use:** When the change is small, reversible, and low-stakes. When the environment is simple enough that consequences are predictable. Simpler heuristic: "What's the worst that could happen? Can I live with it?"

**Step 1:** Systems Thinking via Unintended Consequences Tracing, through the lens of Second-Order Effects.
"Map all first-order effects (what changes directly), then second-order (what changes because of the direct changes), then third-order. At each level, ask: who changes their behavior in response, and what does THEIR changed behavior cause?"

**Step 2:** Perspective Simulation via Stakeholder Voice Simulation, through the lens of Cobra Effect.
"For every stakeholder affected, simulate their response — not their intended response but their self-interested response. People optimize for their own incentives, and perverse incentives produce perverse outcomes. Where will people game the new system?"

**Step 3:** Analogical Reasoning via Negative Analogy, through the lens of Hysteresis.
"Find historical cases where similar changes produced surprising consequences. Import the specific MECHANISM by which the surprise occurred. Also check: are any of the potential negative consequences irreversible?"

**Step 4:** Counterfactual Analysis via Thought Experiment, through the lens of Iatrogenics.
"Imagine the change has been implemented for 12 months. What PROBLEMS exist now that didn't exist before? Not just failures of the change but new problems CREATED by the change. The intervention itself may produce harm exceeding the problem it was solving."

**Abandon when surprised:** If Stakeholder Voice Simulation reveals that a key group will game the new system in a way that undermines the entire change, stop. Redesign before implementing.

**The prompt:**
"I'm about to implement [X change]. First, trace all consequences through three orders: what changes directly, what changes because of those changes, and who changes their behavior in response? Second, for every stakeholder, simulate their SELF-INTERESTED response — where will people game the new system? Third, find historical cases where similar changes produced surprises and import the surprise mechanism. Are any consequences irreversible? Fourth, imagine it's 12 months later — what new problems exist that didn't exist before the change?"

**What makes this recipe unique:** It's designed for the pre-implementation moment when you can still redesign. Consequence Tracing + Stakeholder Voice Simulation + Negative Analogy + Iatrogenic Thought Experiment checks for all four types of unintended consequences: cascading effects, gaming behavior, historical pattern repetition, and iatrogenic harm.

---

### Recipe 32: The Implementation Stress Test

**Use when:** Your plan looks good on paper. The strategy is sound, the logic is tight, the team is aligned. But you have a nagging sense that something will break in execution that wasn't visible in planning.

**When NOT to use:** When you're still in early strategy phase and execution details are premature. When the plan has been tested in smaller iterations. Simpler heuristic: "What's the smallest version I can test right now?"

**Step 1:** Falsification via Pre-Mortem, through the lens of Planning Fallacy.
"It's 12 months from now and the implementation has failed. Write the postmortem. What went wrong? Generate at least 10 specific failure modes — not abstract risks but concrete scenes: 'On week 6, the engineering team couldn't integrate with the legacy system because...'"

**Step 2:** Counterfactual Analysis via Ceteris Paribus Isolation, through the lens of Sensitivity Analysis.
"For each failure mode, how sensitive is the plan to that variable? Slide each critical variable to its worst plausible value. Which ones break the plan and which ones just dent it? Focus on the plan-breakers."

**Step 3:** Systems Thinking via Delay Mapping, through the lens of Compounding.
"Map every delay in the execution timeline: hiring delays, approval delays, learning-curve delays, vendor delays. Delays compound — a 2-week delay in hiring causes a 4-week delay in development causes an 8-week delay in launch. Where does a small delay cascade catastrophically?"

**Step 4:** Perspective Simulation via Full Role Entry, through the lens of Execution Gap.
"Become each person responsible for a critical step. From THEIR perspective, with THEIR priorities and constraints, is this step actually executable? Not 'could someone do this?' but 'would THIS specific person, with everything else on their plate, do this by this date?'"

**Abandon when surprised:** If the Pre-Mortem generates a failure mode that is both highly likely and highly damaging — and you didn't see it coming — pause the entire implementation to address it.

**The prompt:**
"My plan for [X] looks good on paper but I want to stress-test the implementation. First, write the postmortem from 12 months in the future — generate 10 specific failure scenes. Second, for each failure mode, how sensitive is the plan to that variable at its worst plausible value? Which break the plan? Third, map every delay and trace how they compound — where does a small delay cascade catastrophically? Fourth, become each person responsible for a critical step: from THEIR perspective, with THEIR priorities, is this step actually executable on time?"

**What makes this recipe unique:** It bridges the gap between strategy and execution. Pre-Mortem (imagining specific failures) + Sensitivity Analysis (testing which failures matter) + Delay Mapping (compound delay effects) + Full Role Entry (testing human executability) stress-tests not just whether the plan CAN work in theory, but whether it WILL work given real delays, real sensitivities, and real humans with real constraints.
