# Paradigm Collision Engine

## What This Skill Does

Most thinking happens inside a single paradigm — and inherits that paradigm's blind spots. This skill is the operational implementation of Michael Simmons' Paradigm Collision framework: a multi-agent workflow that takes a topic, dispatches parallel sub-agents across a curated encyclopedia of 400+ paradigms (economics schools, behavioral perspectives, ecological economics, market critics, mental models, councils, developmental stages, time-horizons, AQAL quadrants, and more), generates a large pool of candidate insights from each lens, runs them through a structured elimination tournament, and synthesizes the survivors into the kind of counterintuitive, actionable insight that no single perspective could produce alone. The underlying principle, from *The Wisdom of Crowds*: under the right conditions, diverse perspectives produce results that no individual perspective can match — what Simmons calls "hybrid vigor."

**Source attribution:** This skill codifies the workflow Michael Simmons demonstrated live in the PowerUp AI Mastermind on **2026-03-19**, using Jack Dorsey's Block layoffs as the worked example. See [[2026-03-19_Mastermind]] and [[Insight - Paradigm Collision Is the Engine of Non-Obvious Insight]] for the full session context.

> *"Most of the time, these paradigms are invisible to us. We're just in a paradigm, and we feel like that's reality."* — Michael Simmons

---

## When to Use

Use this skill when:

- You're writing a blockbuster article and need an angle no one else in your space has published
- You're stuck inside one frame and suspect the interesting insight is on the boundary of frames you haven't loaded
- A topic is being widely covered and you need to find what every existing take is missing
- You want to pressure-test a strategic decision against a wide spread of disciplinary critiques
- You're producing a "Hot Take" layer on top of a group conversation (e.g., a mastermind recap) and want the participants to encounter a perspective they didn't generate themselves
- You want to demonstrate to a client or audience that a question they think is settled has at least four legitimate answers depending on which paradigm you stand inside
- You're prototyping insight generation as a system rather than as a one-off act of cleverness

Do **not** use this skill when:

- The question is genuinely settled or empirical (run a search, not a paradigm collision)
- You need a fast answer in under 10 minutes — this workflow takes ~1 hour minimum
- The topic is so narrow that only one paradigm could plausibly apply

---

## Prerequisites / Setup

### 1. The Paradigm CSV

The core asset is a CSV file containing **400+ paradigms** organized by discipline and tension. Each row should include, at minimum:

| Column | Purpose |
|---|---|
| `id` | Stable identifier so sub-agent results can be merged |
| `name` | The paradigm's name (e.g., "Austrian economics," "Ecological economics," "Behavioral finance") |
| `discipline` | The parent field (economics, sociology, biology, systems theory, etc.) |
| `tension_axis` | The axis it sits on (e.g., market critics vs. market apologists, individual vs. systemic, short-horizon vs. long-horizon) |
| `core_claim` | A 1–2 sentence statement of what this paradigm sees as primary |
| `blind_spot` | What this paradigm reliably hides or under-weights |
| `representative_thinkers` | 2–5 names so sub-agents can ground the lens |

Simmons' current category set (from the 2026-03-19 chat): **Paradigms, Mental Models, Councils, Other Types of Perspectives, Time, AQAL (Ken Wilber), Developmental Perspectives.** The taxonomy is explicitly extensible — add categories as new lenses earn their place.

Store the CSV at:
`wiki/mastermind/skills/paradigm-collision-engine/paradigms.csv`

### 2. A Sub-Agent Runner

The skill assumes a Claude Code environment (or equivalent) capable of dispatching parallel sub-agents. Each sub-agent receives a slice of the paradigm CSV (typically 30–50 rows) plus the topic, and runs independently.

### 3. The Three Tournament Criteria

Hard-code these as the elimination tournament's scoring rubric (Simmons' formulation):

1. **Is it counterintuitive?** Does it contradict the default story everyone already tells?
2. **Does it change how you think?** Would a thoughtful reader update a belief or model after encountering it?
3. **Is it actionable?** Does it imply a different decision, prompt, workflow, or move?

### 4. The Synthesis Instruction

The non-negotiable phrase for the final synthesis pass:

> *"Pick perspectives that optimize for a wisdom of crowds effect / hybrid vigor."*

This is Simmons' exact language and should be preserved verbatim in the synthesis prompt.

---

## Step-by-Step Workflow

### Step 1 — Topic Intake

Capture the topic in a single sharp sentence. Push back if it's vague. Good examples:

- "Jack Dorsey's Block just announced major layoffs framed as becoming AI-forward — what's actually going on?"
- "The 'AI curator' as an emerging knowledge entrepreneur archetype — what is it really?"
- "Why are most 'AI strategy' consulting engagements failing to produce durable change?"

Bad examples (too broad to collide paradigms productively):

- "AI and the future of work"
- "Thought leadership"

Also capture: who the output is for, what decision or piece of writing it will feed, and any paradigms the user already knows they want included or excluded.

### Step 2 — Paradigm Loading and Slicing

Load `paradigms.csv`. Slice it into **N subsections** (typically 8–12), each containing 30–50 paradigms. Slicing strategy matters:

- **Default slicing:** by discipline cluster (economics-adjacent, sociology-adjacent, biology/systems, philosophy/ethics, developmental/AQAL, time-horizon, mental-model toolkits, etc.). This maximizes within-slice coherence so each sub-agent can think inside a family.
- **Diversity slicing (alternative):** randomize so each slice contains one paradigm from every discipline. Use when the topic is so cross-disciplinary that family clustering would suppress collisions inside a single sub-agent.

Record which slicing strategy was used so the run is reproducible.

### Step 3 — Parallel Relevance Scoring and Candidate Generation

Dispatch one sub-agent per slice. Each sub-agent runs the same prompt against its slice:

> *"For the topic [TOPIC], evaluate each paradigm in your slice for relevance (0–10). For any paradigm scoring 6 or higher, generate 1–3 candidate insights of the form: 'Through the lens of [paradigm], the non-obvious thing about [topic] is [claim], because [paradigm's core machinery]. The default story misses this because [blind spot of the dominant frame].' Return your relevance scores plus all candidate insights."*

Sub-agents run independently — no cross-talk. Expected runtime: ~30–60 minutes for the parallel batch, depending on model and slice size. Simmons reports ~1 hour for the full run on a typical topic.

Merge all sub-agent outputs into a single candidate pool. A healthy run produces **40+ candidate insights** at this stage. If the pool is under 25, the topic is probably too narrow or the paradigm CSV is under-built for this domain — note it and either widen the topic or extend the CSV.

### Step 4 — Elimination Tournament

Run the candidate pool through structured rounds. Each round applies the three criteria from the Setup section.

**Round 1 — Triage (40+ → ~20):**
For each candidate, score 0–2 on each of the three criteria (counterintuitive, changes-thinking, actionable). Drop anything scoring 3 or below total. Drop near-duplicates (keep the strongest formulation).

**Round 2 — Head-to-head (20 → ~10):**
Pair survivors. For each pair, ask: "If I could only publish one of these, which earns the slot, and why?" Carry forward the winner. Note the loser's distinctive contribution in case it folds back into the winner during synthesis.

**Round 3 — Stress test (10 → 5–8 survivors):**
For each remaining candidate, run an adversarial pass: "What's the strongest objection to this insight from a paradigm *not* on the list it came from? Does the insight survive?" Drop anything that collapses under the cross-paradigm objection. The 5–8 that survive are the ones worth developing.

Log the full bracket. The eliminated candidates are themselves a valuable artifact — they show the shape of the topic's idea space and often resurface in future runs on adjacent topics.

### Step 5 — Synthesis With the Hybrid Vigor Instruction

Take the 5–8 survivors and run a final synthesis pass with this exact instruction (Simmons' verbatim language preserved):

> *"Here are the surviving candidate insights from a paradigm collision run on [TOPIC]. **Pick perspectives that optimize for a wisdom of crowds effect / hybrid vigor.** Synthesize them into the 1–3 deepest insights — the ones that no single paradigm on the list could have produced alone. For each synthesized insight, name (a) which paradigms it draws from, (b) what each contributing paradigm sees that the others miss, (c) the specific blind spot in the default discourse on this topic that the synthesis exposes, and (d) the action, decision, or reframe it implies for the reader."*

The output of this step is the actual deliverable — the insights worth writing about, building on, or feeding to the next stage of a content pipeline.

### Step 6 — Capture and Route

Save the run as a dated artifact at:
`wiki/mastermind/skills/paradigm-collision-engine/runs/[YYYY-MM-DD]-[topic-slug].md`

Include: the topic statement, slicing strategy, full candidate pool, the bracket, the surviving 5–8, and the final 1–3 synthesized insights. This run record is reusable as input to other skills (see Related, below).

---

## Expected Output

A single run produces:

1. **A scored candidate pool** — 40+ paradigm-grounded candidate insights, each tagged to its source paradigm
2. **A documented elimination bracket** — three rounds with reasoning at each cut
3. **5–8 tournament survivors** — counterintuitive, actionable, change-your-thinking candidates
4. **1–3 synthesized hybrid-vigor insights** — the deliverables, each naming its contributing paradigms and the blind spot it exposes in the default discourse
5. **A reproducible run record** — saved to `runs/` for later reuse

The 1–3 synthesized insights are the asset. Everything else is the workshop floor that produced them.

---

## Variants and Extensions

**Worked example variant — the Block layoffs run.** Simmons demonstrated the workflow live on Jack Dorsey's Block layoffs. Wall Street's lens saw a leaner, AI-forward company. The AI research community's lens saw something else. The employee lens saw something else again. The synthesis was the insight that no single lens could produce. Use this as the canonical reference run when teaching the skill to a new user.

**Hot Take variant (Lou's vision).** Run the engine over a mastermind transcript or working session to generate a "Hot Take" — a paradigm-collided perspective that the participants didn't think of themselves. The topic intake becomes the session's central question rather than an article topic. Output gets folded into the session recap as an editorial layer. See [[2026-03-19_Mastermind]] for Lou's framing.

**Domain-specific paradigm pack variant.** Open thread from the session: does the paradigm encyclopedia need to be domain-specific to be useful for coaches who work in one field? Build a domain-specific CSV (e.g., "100 paradigms in executive coaching," "80 paradigms in B2B SaaS pricing") as a sibling to the master CSV. Sub-agents draw from the domain pack first and the master CSV second.

**RAG-backed variant (Simmons' next development phase).** Simmons flagged in the session that his next move is building a RAG database behind the paradigm encyclopedia, so each paradigm's "core_claim" and "blind_spot" can be backed by retrievable source material rather than a static CSV cell. Lou is the named collaborator on this architecture work. Until that's built, the CSV remains the canonical store.

**Try-it-yourself micro-variant.** For a 10-minute version that produces a taste of the effect without the full workflow, see the "Try This Before Next Session" prompt in [[2026-03-19_Mastermind]]: a single Claude turn that runs 5 paradigms instead of 400, no sub-agents, no tournament. Useful for deciding whether the full skill is worth running on a given topic.

---

## Related Commands and Skills

- [[Insight - Paradigm Collision Is the Engine of Non-Obvious Insight]] — the canonical insight write-up of the framework, from the same session
- [[Insight - Multi-Model Debate as a Decision-Making Accelerator]] — sibling pattern: instead of paradigms inside one model, dispatch the same question across multiple models and synthesize at the top
- [[Insight - Run Your Prompt Through Multiple Models and Synthesize at the Top]] — the multi-model analog to this skill's multi-paradigm structure
- [[Insight - The Process Prompt Hierarchy - From Conversation to Reusable AI Systems]] — the meta-pattern this skill is an instance of (conversation → reusable AI system)
- [[Insight - Build a Living Prompt Library Behind an MCP Server]] — relevant if the paradigm CSV graduates from a flat file to a queryable service
- [[Insight - RAG Is Raw Material, Not Answers — Design for the Right Retrieval Architecture]] — directly relevant to the RAG-backed variant Simmons flagged as his next development phase
- [[Insight - The Blockbuster Strategy — Quality Concentration Over Volume as a Thought Leadership Moat]] — the strategic context this skill serves: fewer, deeper articles, each carrying a non-obvious insight worth the depth
- [[Insight - Ideas Are the Currency of Thought Leadership, Content Is Just the Catalyst]] — the principle that justifies the cost of an hour-long paradigm collision run per insight
- [[Insight - AI as Questioning Machine Not Answer Machine]] — companion stance: the engine surfaces better questions as much as better answers
- **`conversation-ip-extractor`** — natural downstream skill: once a paradigm collision run produces a synthesized insight worth developing, run an extraction pass over the run record to formalize the insight into a publishable framework
- **`voice-profile-trainer`** — natural downstream skill: apply the practitioner's voice profile when turning a synthesized insight into a draft article
- **`transcript-to-content-pipeline`** — the run record from this skill is a valid input
- **`anthropic-skills:aimm-writing-team`** — the survivors from Step 4 can be handed to the writing team as content seeds
- **`aimm:perspective-explosion`** — a lighter-weight relative; useful as the micro-variant warm-up before running the full engine

## Source

- [[wiki/mastermind/sessions/2026-03-19_Mastermind]] (Michael Simmons guest session)
