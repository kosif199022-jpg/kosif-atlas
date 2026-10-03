# Cognitive Operations Architecture

## Core Concept

Every thinking tool falls into one of three functional categories:

1. **Lenses** — Direct attention. Tell you WHAT to notice. (e.g., Pareto Principle, Second-Order Effects, Goodhart's Law)
2. **Operations** — Transform observations. Tell you what to DO with what you notice. (e.g., First Principles, Falsification, Analogical Reasoning)
3. **Recipes** — Combine operations through lenses in specific sequences for specific problem types.

Most people have many lenses, a few default operations, and zero recipes. This skill provides all three layers and chains them deliberately.

## The 9 Operations (Summary)

Each operation has a unique function no other operation can perform:

### GENERATE — Create new possibilities
| Operation | Function | Signature Question |
|-----------|----------|-------------------|
| **Analogical Reasoning** | Import structures from distant domains | "What field has already solved a structurally similar problem?" |
| **Abductive Reasoning** | Generate hypotheses for surprising observations | "What would have to be true to make this observation non-surprising?" |
| **Counterfactual Analysis** | Isolate variable contributions via mental experiments | "What would change — and what wouldn't — if this one factor were different?" |

### EVALUATE — Test against reality
| Operation | Function | Signature Question |
|-----------|----------|-------------------|
| **Falsification** | Actively prove ideas wrong | "What evidence would prove this wrong? Does that evidence exist?" |
| **Bayesian Updating** | Calibrate confidence to evidence | "Given this new evidence, precisely how much should my confidence change?" |

### DECONSTRUCT — Strip to foundations
| Operation | Function | Signature Question |
|-----------|----------|-------------------|
| **First Principles** | Remove assumptions to reach bedrock truths | "What would I believe about this if I had zero prior knowledge?" |

### INTEGRATE — Combine across boundaries
| Operation | Function | Signature Question |
|-----------|----------|-------------------|
| **Dialectical Synthesis** | Hold opposing positions to find higher-order truth | "What becomes visible ONLY when I take both sides seriously?" |
| **Systems Thinking** | Map relationships, feedback loops, emergent properties | "What does this connect to that nobody is tracking?" |
| **Perspective Simulation** | Model others' knowledge, beliefs, and experience with fidelity | "What would the smartest advocate of this position say — and what do they see that I'm missing?" |

Every operation has a structural blind spot. First Principles can deconstruct without rebuilding. Falsification can destroy but not generate. Analogical Reasoning can seduce with false parallels. This is why recipes chain operations — each compensates for the blind spot of the one before it.

## Reference Files

Before executing any recipe or detailed operation, read the relevant reference file:

- **`references/operations.md`** — Full 9 operations with all 72 moves, procedures, examples, and limitations. Read the relevant operation section when executing any recipe step.
- **`references/lenses.md`** — ~90 lenses across 10 categories. Read when you need to select the right lens for a recipe step or when analyzing cognitive signatures.
- **`references/recipes.md`** — All 40 recipes with complete procedures, prompts, and routing logic. Read when matching the user's situation to a recipe.

## How to Use This Skill

### Mode 1: Recipe Execution (Default for complex problems)

When the user presents a problem, decision, or challenge:

1. **Read `references/recipes.md`** to identify which recipe matches their situation
2. **Read the relevant sections of `references/operations.md`** for each operation the recipe calls
3. **Execute the recipe step by step**, naming each operation, move, and lens as you go
4. Show your reasoning trace — which recipe you selected, why, and what each step revealed

### Mode 2: Cognitive Signature Analysis

When the user asks about their thinking patterns, blind spots, or cognitive defaults:

1. Analyze their message history for patterns in how they frame problems
2. Identify which operations they reach for instinctively (their defaults)
3. Identify which operations are consistently absent (their blind spots)
4. Map consequences — where have defaults produced wins, and where have blind spots produced losses
5. Recommend the single highest-leverage operation to add to their repertoire

**Cognitive Signature Detection Framework:**
- Does the user instinctively decompose? → First Principles default
- Does the user instinctively find parallels? → Analogical Reasoning default
- Does the user instinctively stress-test? → Falsification default
- Does the user instinctively map systems? → Systems Thinking default
- Does the user instinctively generate hypotheses? → Abduction default
- Does the user instinctively take other perspectives? → Perspective Simulation default
- Does the user instinctively hold tensions? → Dialectical Synthesis default
- Does the user instinctively update on evidence? → Bayesian default
- Does the user instinctively vary conditions? → Counterfactual default

Every default has a shadow blind spot:
| Default Operation | Structural Blind Spot |
|---|---|
| First Principles | Misses emergent properties; deconstructs without rebuilding |
| Falsification | Can destroy but cannot generate alternatives |
| Analogical Reasoning | Seduced by false parallels; imports without verifying |
| Abductive Reasoning | Generates plausible explanations without testing them |
| Counterfactual Analysis | Quality depends on causal model; imaginary experiments |
| Dialectical Synthesis | Endless dialectics without reaching actionable conclusions |
| Systems Thinking | Sees everything connecting to everything; paralysis by complexity |
| Bayesian Updating | Garbage priors produce garbage posteriors; struggles with unprecedented events |
| Perspective Simulation | Excessive epistemic humility; can legitimize genuinely bad positions |

### Mode 3: Direct Operation Execution

When the user asks to run a specific operation (e.g., "stress test this", "run a pre-mortem", "steelman this position"):

1. Read the relevant operation from `references/operations.md`
2. Select the appropriate move within that operation
3. Execute it, showing the reasoning trace

### Mode 4: Full Four-Output Analysis

When the user wants the complete treatment or explicitly asks for it, produce four outputs:

1. **Natural Answer** — What you'd say without the skill (baseline)
2. **Cognitive Signature** — Analysis of how the user framed their question, including likely defaults and blind spots
3. **Reasoning Trace** — Which recipe was selected, what each step revealed
4. **Recipe-Enhanced Answer** — The deeper answer that surfaces dimensions the natural answer missed

The comparison between outputs 1 and 4 is where the value lives.

## Recipe Routing Guide

Match the user's situation to the right recipe category:

| User is stuck because they... | Category | Recipe Range |
|---|---|---|
| Can't choose | Strategic Decision-Making | Recipes 1-6 |
| Can't create | Innovation & Creation | Recipes 7-11 |
| Can't diagnose | Diagnosis & Problem-Solving | Recipes 12-16 |
| Can't predict | Risk & Uncertainty | Recipes 17-20 |
| Can't persuade | Communication & Persuasion | Recipes 21-24 |
| Can't understand | Learning & Understanding | Recipes 25-28 |
| Can't execute | Execution & Implementation | Recipes 29-32 |
| Can't align with others | Relationships & Negotiation | Recipes 33-35 |
| Can't grow | Personal Development | Recipes 36-38 |
| Can't change the system | Systems & Organizational | Recipes 39-40 |

**Quick-match signals:**
- "I've been stuck on X for weeks" → Recipe 1 (Wrong-Problem Detector)
- "I need to decide between..." → Recipe 2 (Decision Clarifier)
- "How much should I commit to..." → Recipe 3 (Bet Sizer)
- "Should I pivot or stay the course?" → Recipe 4 (Pivot Evaluator)
- "When should I..." → Recipe 5 (Timing Optimizer)
- "Should I quit..." → Recipe 6 (Exit Strategist)
- "I need a novel approach" → Recipe 7 (Innovation Engine)
- "I want to create new understanding" → Recipe 8 (Knowledge Creation Engine)
- "How do I redefine the category?" → Recipe 9 (Category Creator)
- "This constraint might be an advantage" → Recipe 10 (Constraint Alchemist)
- "The conventional wisdom feels wrong" → Recipe 11 (Paradigm Breaker)
- "I suspect I'm missing something" → Recipe 12 (Blind Spot Finder)
- "This keeps coming back despite fixes" → Recipe 13 (Root Cause Excavator)
- "Progress has plateaued" → Recipe 14 (Stagnation Breaker)
- "Everything is too tangled to act" → Recipe 15 (Complexity Reducer)
- "I keep falling into the same pattern" → Recipe 16 (Pattern Interrupt)
- "What if something unpredictable hits?" → Recipe 17 (Black Swan Preparedness)
- "I must decide now without full info" → Recipe 18 (Uncertainty Navigator)
- "The upside is great but the downside could kill me" → Recipe 19 (Downside Limiter)
- "I want to benefit from volatility" → Recipe 20 (Antifragility Designer)
- "My argument keeps failing to persuade" → Recipe 21 (Argument Strengthener)
- "I can't make this land for my audience" → Recipe 22 (Audience Translator)
- "I'm presenting to skeptics" → Recipe 23 (Objection Anticipator)
- "I have data but no story" → Recipe 24 (Narrative Constructor)
- "How does this expert do what they do?" → Recipe 25 (Mental Model Extractor)
- "I need to learn this domain fast" → Recipe 26 (Expertise Accelerator)
- "What assumptions am I not seeing?" → Recipe 27 (Assumption Archaeologist)
- "How do I transfer my expertise to a new domain?" → Recipe 28 (Transfer Engine)
- "Effort is high but output is low" → Recipe 29 (Bottleneck Finder)
- "I'm overwhelmed — what's the simplest version?" → Recipe 30 (Minimum Viable Path)
- "What could go wrong with this change?" → Recipe 31 (Unintended Consequences Scanner)
- "The plan looks good on paper but..." → Recipe 32 (Implementation Stress Test)
- "I'm entering a high-stakes negotiation" → Recipe 33 (Negotiation Mapper)
- "Two sides are locked in opposition" → Recipe 34 (Conflict Resolver)
- "I need alignment from multiple stakeholders" → Recipe 35 (Stakeholder Aligner)
- "An outdated identity is holding me back" → Recipe 36 (Identity Audit)
- "I've mastered my level but I'm not growing" → Recipe 37 (Growth Edge Finder)
- "My stated values and behavior are in conflict" → Recipe 38 (Values Clarifier)
- "Smart people keep doing dumb things" → Recipe 39 (Incentive Auditor)
- "Good ideas keep dying in the organization" → Recipe 40 (Organizational Immune System Detector)

## Execution Principles

1. **Abandon when surprised.** Every recipe has an "abandon when surprised" signal. If genuine surprise emerges during execution, stop the recipe — the surprise IS the insight. Attend to it before continuing.

2. **Name your moves.** Always state which operation, which move within that operation, and which lens you're applying. This makes the reasoning transparent and teachable.

3. **Diagnose before prescribing.** Before running a recipe, diagnose which TYPE of stuck the user is experiencing. "Am I missing a lens, an operation, or a recipe?" is the first-order question.

4. **Chain to compensate.** Each operation compensates for the blind spot of the one before it. This is why recipes work — the sequence matters.

5. **Match depth to stakes.** Simple questions get a single operation. Complex decisions get a full recipe. Don't deploy a 5-step recipe for a question that needs one signature question.

## Source

- [[wiki/mastermind/sessions/2025-12-19_Mastermind]] (multiple — thinking practices, framework sessions)
- [[wiki/mastermind/sessions/2026-01-22_Mastermind]] (multiple — thinking practices, framework sessions)
- [[wiki/mastermind/sessions/2026-02-19_Mastermind]] (multiple — thinking practices, framework sessions)
