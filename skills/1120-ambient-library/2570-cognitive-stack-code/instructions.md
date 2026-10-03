# Cognitive Stack (Code edition): The right mental model for the problem, not a pile of frameworks

> **Artifact 5 (the optional "next move") is the newest piece** — a convergence-gated handoff that turns Artifact 4's single most useful move into something you can act on (in the Code edition, a Claude Code action: run-it-on-your-real-data / build-a-reusable-skill / save-a-file).

## What this skill does

Most "mental model" help throws a pile of frameworks at a problem. This skill instead matches the
problem to the **right kind of cognitive object** first, then retrieves only models of that kind,
then runs a **recipe** (an ordered sequence of moves) and shows its work.

The library is the tagged encyclopedia (`Mental_Models_Encyclopedia_FINAL_TAGGED_V3_PROCEDURE.csv`,
2,375 models — a PROCEDURE-normalized copy of the upstream `..._V3 (1).csv`, which is kept pristine;
see `scripts/dev/normalize_csv.py`) plus the paradigm tables. **All three runtime CSVs ship bundled in
`references/data/`, so the skill is self-contained and runs from any location.** Models are classified
on axes the router steers by:

- **Tier1** — `CLAIM` (asserts what is *true*) vs `INSTRUCTION` (prescribes what to *do*). In the
  data this almost perfectly partitions the 8 roles (see Step 2).
- **Primary Role** — one of **8 Tier-2 roles**: `MECHANISM` (how something works causally),
  `STRUCTURE` (how parts relate), `PROPERTY` (a quality something has), `TRAJECTORY` (how something
  changes over time), `PATTERN` (a recurring shape) — these five are CLAIM roles; and `OPERATION` (a
  single move you perform), `PROCEDURE` (an existing named, ordered routine — e.g. SCAMPER, OODA; the
  role the upstream encyclopedia tagged `RECIPE`), `RULE` (a constraint/heuristic/named-law) — these
  three are INSTRUCTION roles. *The word "recipe" is reserved for this skill's own composed sequences
  of moves, never the role.*
- **Domain Tag** — 29 domains (largest: `cognitive` 333, `mathematical` 172, `strategy` 162,
  `cross-cultural` 152, `health` 127, `economics` 123, …).
- **Confidence** — viability gate: `high`, `llm-high`, `medium`, `llm-medium`, `low`, `llm-low`.
- **Collection Tags** — 171 secondary labels (`cognitive-bias`, `decision-heuristic`, `named-law`, …).

---

## The 6-Step Cognitive Stack Router

Run these in order. They narrow from "a stuck human" to "the specific cognitive object(s) this problem
needs." Steps 2–6 decide *which kind of object* gets retrieved (the role spine); Steps 1 and the recipe
layer below decide *which recipe (sequence)* runs. They converge at execution.

### Step 1 — Intent / stuckness

Name what the person is actually stuck on. Diagnosis here drives everything downstream. Classify into
one of the **10 stuckness families** (these are also the recipe-map categories below):

| Stuckness family | The felt experience |
|---|---|
| Can't choose | A decision they can't make; options that won't resolve. |
| Can't create | Out of ideas; the obvious approaches are exhausted. |
| Can't diagnose | Something's wrong but they can't see *why*. |
| Can't predict | Facing uncertainty/risk; can't tell how it will go. |
| Can't persuade | They understand it but it won't land for others. |
| Can't understand | They want to grasp how/why something works. |
| Can't execute | They know what to do but throughput is stuck. |
| Can't align | People/parties out of sync; conflict or non-agreement. |
| Can't grow | Personal/identity plateau; values–behavior conflict. |
| Can't change the system | Smart people, bad outcomes; the structure resists change. |

A query can carry more than one. Pick the **primary** stuckness; note secondaries (they justify a
secondary role in Step 3).

### Step 2 — CLAIM vs INSTRUCTION (Tier1)

Does the problem primarily need an object that **asserts what is true** (`CLAIM`) or one that
**prescribes what to do** (`INSTRUCTION`)? This is a coarse cut that pre-partitions the 8 roles:

- **CLAIM →** `MECHANISM` · `STRUCTURE` · `PROPERTY` · `TRAJECTORY` · `PATTERN` (the descriptive/causal
  objects — they tell you how reality *is*).
- **INSTRUCTION →** `OPERATION` · `PROCEDURE` · `RULE` (the prescriptive objects — they tell you what
  to *do* or what constraint to honor).

> **Grammar misleads — judge by the *useful object*, not the question's verb.** A "how do I…?" question
> reads like an INSTRUCTION but often needs CLAIM objects (you must first understand *why* something
> happens). Conversely, a "why does this keep happening?" diagnosis is best served by INSTRUCTION-role
> OPERATIONS — diagnostic *moves you run* — with a CLAIM-role MECHANISM as backup. Many problems need a
> **primary from one side and a secondary from the other** (walking-skeleton case: primary OPERATION to
> run, secondary MECHANISM to understand). Decide which side the *answer's load* sits on.

### Step 3 — Role mix (the core move)

Pick the **primary** Tier-2 role (the kind of object that carries the answer) plus an optional
**secondary** role. This is the decision that determines *which kind of object gets retrieved* — the
skill's whole north star. Use the stuckness family from Step 1:

| Stuckness | Tier1 lean | Primary role | Secondary role | Why |
|---|---|---|---|---|
| Can't choose | INSTRUCTION | `OPERATION` (decision moves) | `RULE` / `PROPERTY` | Decision tools + heuristics (Kelly, opportunity cost) + optionality/reversibility. |
| Can't create | INSTRUCTION | `OPERATION` / `PROCEDURE` | `PATTERN` | Generative moves + named routines (SCAMPER); patterns reveal the unworked angle. |
| Can't diagnose | INSTRUCTION | `OPERATION` (diagnostic moves) | `MECHANISM` / `PATTERN` | Moves to run, plus the causal mechanism / recurring shape behind the failure. |
| Can't predict | CLAIM | `TRAJECTORY` | `MECHANISM` / `PROPERTY` | How it evolves + the drivers + antifragility/optionality properties. |
| Can't persuade | mixed | `OPERATION` / `STRUCTURE` | `PROCEDURE` | Perspective/reframe moves + argument/narrative structure + protocols (NVC). |
| Can't understand | CLAIM | `MECHANISM` | `STRUCTURE` / `OPERATION` | How it works + how parts relate + extraction moves. |
| Can't execute | INSTRUCTION | `OPERATION` / `PROCEDURE` | `MECHANISM` | Bottleneck-finding + named routines; the system constraint underneath. |
| Can't align | mixed | `STRUCTURE` / `PROCEDURE` | `OPERATION` | Relational structures (drama triangle, stakeholder map) + negotiation protocols. |
| Can't grow | mixed | `STRUCTURE` / `TRAJECTORY` | `PROCEDURE` / `OPERATION` | Identity structures + developmental stages + reflective protocols. |
| Can't change the system | CLAIM | `MECHANISM` / `STRUCTURE` | `OPERATION` | Feedback loops + incentives + org structure; leverage-point-finding moves. |

This table is a **starting hypothesis, not a lookup**. Override it when the specific query points
elsewhere, and record the override in the recipe trace. **Retrieve the primary and secondary roles as
separate slices, never as a union** (unioning roles balloons the set and reintroduces noise).

### Step 4 — Domain retrieval (the highest-leverage decision)

Choosing the domain set is the single most consequential retrieval decision — over-broad domains drag
in noise; too-narrow misses the best tools.

1. **Default-include `cognitive`** for any decision / diagnosis / prediction / reasoning problem. It is
   the largest domain (333 models) and the most transferable; under-selecting it loses the best general
   thinking tools.
2. **Add the problem's *subject* domains** — pick from the real 29, grouped here as a selection aid:
   - *decision / strategy:* `strategy` · `economics` · `business` · `risk`
   - *diagnosis / systems:* `systems` · `organizational` · `behavioral`
   - *people / communication:* `communication` · `negotiation` · `social` · `identity`
   - *growth / meaning:* `contemplative` · `philosophical` · `identity` · `health` · `career`
   - *making / creating:* `design` · `creativity` · `technology`
   - *culture / ethics / society:* `cross-cultural` · `ethics` · `sociopolitical` · `legal` · `environment`
   - *formal / natural:* `mathematical` · `physics` · `biology`
   - *teaching:* `pedagogy` · *throughput:* `productivity`
3. **Start narrow** (`cognitive` + 1–2 subject domains). Widen only if the slice is too thin. If a
   slice returns too many to read (> ~30–40), **tighten the domain first**, then the gate (Step 5).

### Step 5 — Collection filter + viability gate

- **Viability gate (default strict):** keep `Confidence ∈ {high, llm-high}`. After role × domain this
  typically lands ~60–150, narrowing to ~tens for a single role × domain slice — readable. Widen to
  **std** (also include `{medium, llm-medium}`) **only if strict is too thin** (< ~5 survivors). The
  `low` / `llm-low` / Fuzzy tail (~980 entries) is the cut line — never retrieved.
- **Collection filter (optional refinement):** when the query clearly wants a *kind* of object, filter
  by collection tag — e.g. "what bias is this?" → `cognitive-bias`; "is there a law for this?" →
  `named-law`; "give me a rule of thumb" → `decision-heuristic`. This is a narrowing aid, not required.

### Step 6 — Semantic selection + decorrelation check

1. **Claude reads the survivors and selects by understanding** — *never* by keyword frequency or count
   score (hard rule: keyword ranking pulls domain-adjacent noise — finance models into a marketing
   question). Record what was **selected and what was rejected, with reasons** → this becomes Artifact 3.
2. For each selected model, note its **use** (lens / operation / content — see `references/lenses.md`):
   selecting a model includes deciding *how* to apply it, not just which one.
3. **Decorrelation check:** before committing, ask "are my selected models all from one
   worldview/paradigm?" If they're correlated, deliberately reach for a rival lens. The light check
   here (do the models cluster in one worldview?) is backed by the **full paradigm rival-check** — the
   **decorrelation engine** (`references/decorrelation-engine.md`, impl `scripts/decorrelate.py`): it
   resolves the operative worldview → corpus paradigm → fetches its rival worldviews from
   `Paradigm_Tensions.csv` (with a labeled cluster-sibling fallback when the named paradigm carries no
   tensions of its own), oriented to surface *what each rival sees that this worldview misses*. It runs
   at output time beneath the signature's **Layer 3** (Artifact 2), consuming the `[Rival-check pending]`
   hook that layer prints, and must change Artifact 4 (no decoration).

### Step 6.5 — Depth-of-use check (gated: `Can't grow` / `Can't change the system` only)

**Fires ONLY when the *primary* stuckness (Step 1) is `Can't grow` or `Can't change the system`.** For
every other family, skip this step — it does not apply, and running it elsewhere is sprawl.

A model can be applied at three **depths** (Michael's *Three Levels of Framework Use* — the depth-of-use
axis; orthogonal to *which* model and *which* recipe):

- **On the task** — the immediate problem. *(Pareto on today's to-do list.)*
- **On your own thinking** — how you use your own models and habits. *(Pareto on which of your habitual
  tools you actually invoke.)*
- **On the domain itself** — the structure/substrate of your whole field. *(Pareto on which 20% of your
  clients / articles / modules drive 80% of the value.)*

These two stuck-states are usually a **depth mismatch, not a missing tool** — the person already holds the
right model but is running it one level too shallow:

- **`Can't grow`** plateaus when thinking tools stay *on the task* while the growth edge is *on your own
  thinking* (one depth up — the stuck move is meta-cognitive: examine the pattern, not the instance).
- **`Can't change the system`** resists when effort lands *on the task / on individuals* while the
  leverage is *on the domain's structure itself* (one depth up — the substrate, not the symptom).

**The gated move:** read the depth at which the user is currently applying their thinking. If it is too
shallow for the stuck-state, **lift the *same* model up one depth** in the recipe/answer — do not add a
new model. Lead with **one** lift; never lay out all three depths as a menu. Like every other check, it
**must change Artifact 4** (the lift shows up in the answer) or it is theater — drop it.

**Optional signature line (Artifact 2):** when the lift fires, you may add **one** plain line naming the
depth shift (e.g. "You're applying this to the task; your growth edge is applying it to how you work").
At most one line; omit if it adds nothing.

**Anti-sprawl invariant:** gated to two families · one model lifted one level · leads with a single move ·
must change the answer. It is a *depth adjustment to the existing selection*, never a new artifact or a
new direction.

---

## Recipe selection — v1's problem-type map, wired beneath the role spine

The role spine (Steps 2–6) decides *which models* are retrieved. The **recipe** is the ordered sequence
of moves the answer runs. Selecting the recipe uses the stuckness family from Step 1 against v1's
problem-type→recipe map (retained per Approach L1):

> **Running a recipe:** the map below is wired into the router, and **all 61 recipe bodies (R1–R61)
> exist**. To run one, load its part-file (R1–R6 → part1, R7–R11 → part2, R12–R16 → part3,
> R17–R24 → part4, R25–R32 → part5, R33–R40 → part6, **R41–R50 → part7, R51–R61 → part8**) and execute
> its steps. Each step reads `[Operation] via [Move], through the lens of [Lens]` against
> `operations-moves.md` + `lenses.md`; all 249 move citations are machine-verified clean by
> `scripts/dev/verify_recipe_refs.py`. When the query matches no named recipe, **compose ad hoc** (see
> `## When no recipe fits`).

| Stuckness family | Signal in the query | Recipe |
|---|---|---|
| **Can't choose** | Stuck for weeks, analysis sophisticated, no breakthrough | R1: Wrong-Problem Detector |
| | High-stakes choice, incomplete info, must decide | R2: Decision Clarifier |
| | Knows *what* to do, unsure *how much* to commit | R3: Bet Sizer |
| | Torn between doubling down and pivoting | R4: Pivot Evaluator |
| | Right move identified, timing uncertain | R5: Timing Optimizer |
| | Considering quitting; wisdom or weakness? | R6: Exit Strategist |
| | Stuck in a felt binary; choice set too narrow | R41: Option Widener |
| | When to stop sampling serial options and commit | R42: Search Stopper |
| | Flip-flopping between two genuine goods that won't resolve | R43: Polarity Manager *(also serves Can't change the system)* |
| **Can't create** | Exhausted obvious approaches, needs genuine novelty | R7: Innovation Engine |
| | Wants new understanding, not retrieval of the known | R8: Knowledge Creation Engine |
| | Crowded space, needs to redefine the game | R9: Category Creator |
| | A "fixed" limitation that might be an advantage | R10: Constraint Alchemist |
| | Conventional wisdom feels wrong, can't say why | R11: Paradigm Breaker |
| | Blank page, acute block, need to generate now | R44: Creative Unblocker |
| | Wants to import a solution from a distant field | R45: Analogy Engine |
| **Can't diagnose** | Metrics fine but gut says something's missing | R12: Blind Spot Finder |
| | Same problem keeps returning despite fixes | R13: Root Cause Excavator |
| | Progress plateaued; working harder, results flat | R14: Stagnation Breaker |
| | Too tangled to see; paralysis by analysis | R15: Complexity Reducer |
| | Keeps falling into a known bad pattern | R16: Pattern Interrupt |
| | Competing theories of why; which is it? | R46: Differential Diagnoser |
| **Can't predict** | Must prepare for unpredictable catastrophic events | R17: Black Swan Preparedness |
| | Must decide now; key info won't arrive in time | R18: Uncertainty Navigator |
| | Upside attractive, downside could be fatal | R19: Downside Limiter |
| | Wants to benefit from volatility | R20: Antifragility Designer |
| | Can't predict which future; needs a robust strategy | R47: Scenario Planner |
| | Needs a calibrated estimate, not an inside-view guess | R48: Outside-View Estimator |
| **Can't persuade** | Has a position, it keeps failing to persuade | R21: Argument Strengthener |
| | Understands deeply, can't make it land | R22: Audience Translator |
| | About to face a critical/skeptical audience | R23: Objection Anticipator |
| | Has data/evidence but no compelling narrative | R24: Narrative Constructor |
| | Clear case keeps getting resisted; *why* is it refused? | R61: Resistance Diagnoser |
| **Can't understand** | Expert does it brilliantly, can't explain how | R25: Mental Model Extractor |
| | Needs functional competence in a new domain fast | R26: Expertise Accelerator |
| | Suspects deep unexamined assumptions constrain them | R27: Assumption Archaeologist |
| | Has expertise in A, wants to apply to B | R28: Transfer Engine |
| | Can't grasp why a smart person believes the opposite | R49: Steelman Decoder |
| | Drowning in conflicting info; what's actually true? | R50: Claim Verifier |
| **Can't execute** | High effort, low throughput; something constrains it | R29: Bottleneck Finder |
| | Overwhelmed; needs the simplest viable version | R30: Minimum Viable Path |
| | Major change ahead; needs to see cascading effects | R31: Unintended Consequences Scanner |
| | Plan looks good, nagging sense something will break | R32: Implementation Stress Test |
| | Re-doing the same manual task; can't delegate it | R51: Systemizer |
| | Know what to do, can't do it consistently (self-execution) | R52: Behavior Change Designer |
| **Can't align** | Entering a high-stakes negotiation | R33: Negotiation Mapper |
| | Two parties locked in opposition, compromise rejected | R34: Conflict Resolver |
| | Multiple parties, different priorities, need agreement | R35: Stakeholder Aligner |
| | Need genuine group buy-in, not a resentful vote | R53: Consensus Builder |
| | Trust broken after a rupture; rebuild it (fight is over) | R54: Relationship Repairer |
| | Meetings produce talk not decisions; who decides, how? | R55: Decision Forum Designer *(also serves Can't change the system)* |
| **Can't grow** | Outdated identity constraining growth | R36: Identity Audit |
| | Competent but not growing; mastered current level | R37: Growth Edge Finder |
| | Stated values and actual behavior in conflict | R38: Values Clarifier |
| | Just failed; turn the setback into durable learning | R56: Setback Metabolizer |
| | Mid-transition, feel *between selves* | R57: Transition Navigator |
| | Keep getting emotionally hijacked and reacting badly | R58: Reactivity Interrupter |
| **Can't change the system** | Smart people consistently doing counterproductive things | R39: Incentive Auditor |
| | Good ideas keep dying inside the organization | R40: Org Immune System Detector |
| | Pushing on the system, nothing moves; where to push? | R59: Leverage Point Finder |
| | A behavior keeps amplifying/self-correcting; render the structure | R60: Feedback Loop Mapper |

If several recipes fit, choose the one matching the **primary** stuckness; note alternatives in the
recipe trace.

### When no recipe fits

Some queries don't map cleanly to any of the named R1–R61 recipes but still benefit from the framework.
For those, this is the **execution path** (also how every recipe was originally composed):

1. Take the role-router survivors selected in Step 6.
2. Identify the 2–3 operations/moves that fit (from `references/operations-moves.md`), plus any standing
   lens (`references/lenses.md`).
3. Compose them into an ad-hoc ordered sequence, and document the reasoning in the recipe trace.

This is valid: recipes are *named* sequences, but the operations compose independently. (The "Misfire
Diagnosis" worked example in `references/cognitive-signature.md` was composed exactly this way.)

---

## Retrieval is an OPERATION, not a baked command

**Locked decision (see `SESSION-LOG.md`, 2026-06-03).** The skill describes retrieval as *what to do*,
and lets each surface choose *how*:

> **Retrieval operation:** From the encyclopedia CSV, keep only rows whose `Primary Role` is in the
> chosen role set, whose `Domain Tag` is in the chosen domain set, and whose `Confidence` is in the
> active viability gate. Emit each survivor's name, description, when-to-use, role, domain, and
> confidence — bounded and readable. Then read the survivors and select by semantic judgment.

- In **terminal / Desktop Claude Code**, execute it with whatever is fastest (bash, grep, pandas).
- In **Cowork's VM**, execute it with whatever that environment provides (Python).
- **Never** hardcode a single lowest-common-denominator command — that needlessly caps the terminal,
  which has the higher ceiling.

**Guardrails:** never load the full CSV into context (filter-then-fetch only). If live retrieval is
unavailable, fall back to the curated **hot-set** catalogues via **domain-sliced reads** (never load a
catalogue whole — `MECHANISM.md` alone is ~70k tokens). Full spec, both paths, in
`references/retrieval-guide.md`.

---

## Execution → the 5 artifacts (the 5th optional)

### Artifact voice contract (ported verbatim from v1 — governs ALL FIVE artifacts)

Every artifact a user reads obeys these. They are v1's own rules; v1's artifacts were plain by construction, and this is how we keep v5's richer artifacts plain too.

- **Specific and actionable, not generic.** "You tend toward First Principles thinking" is weak. "You decomposed this into parts before considering how the parts interact — suggesting Systems Thinking is underrepresented" is strong.
- **Anchor every flag in evidence.** Point to the specific thing the user said or implied. A bias named in the abstract is a horoscope. If you cannot point to where it shows up, do not raise it.
- **Be selective.** At most the 2 to 3 most consequential items. If the framing is clean this turn, say "nothing notable stands out" rather than manufacturing flaws. A clean run is a valid run.
- **Keep the three kinds distinct.** A bias is a distortion in judgment (sunk cost, availability). A fallacy is an error in inference (false cause, false dilemma). An assumption is an unstated premise the conclusion rests on and that could be tested.
- **Be charitable.** These are normal features of cognition, not failings. Name them as places the thinking may be costing accuracy, not as proof the user is irrational.
- **Honest about thin data.** Don't overstate confidence when you have limited conversation history.
- **Artifact 4 must be qualitatively different from Artifact 1** — not a more polished version but a fundamentally reframed answer that reveals dimensions the natural answer could not access. Lead with a one-line headline reframe carried by a plain metaphor; name the recipe and moves by their plain handles (R-numbers stay in Artifact 3); end on what's genuinely going well.
- **Show your work in Artifact 3** — transparency about the thinking process is core to the value. The user learns the framework by watching it operate.
- **Artifact 5 is a specific, do-able proposal** — concrete enough that someone could poke holes in it, warm and plain, never a menu.

**Audience + the one v5-only rule (v1 had no machinery to leak).** Write for a smart layman who knows what a mental model *is* but not which ones — they get the genre; they don't know the inventory. So every time you name a model / bias / fallacy / worldview, **explain how it works** in plain terms and tie it to *their* situation (name → explain → apply, never name-and-move-on). But the skill's internal bookkeeping — `#record` IDs, role-caps, "Tier / viability gate / decorrelation engine," "Layer N," tension IDs, the route fingerprint — **never reaches the reader**, not even in Artifact 3 (which stays on named recipes/operations/lenses + R-numbers). Plain ≠ dumbed-down: those plain how-it-works explanations ARE the teaching payload.

**Write the artifacts to disk as SEPARATE markdown files — do not dump all five inline.** Claude Code has no canvas, so each artifact is its own file, written to the current working directory. A query produces four files (Artifact 1–4), plus a fifth (Artifact 5) only when it earns its place — see its gate. So write **four files, or five when Artifact 5 fires.**

**CRITICAL — give each file its own name, with a turn number** so repeat runs never overwrite earlier ones. Track which turn you are on; the first time the skill fires this conversation use `01`, the second `02`, and so on. Filenames:

- `natural-answer-01.md`, `cognitive-signature-01.md`, `recipe-trace-01.md`, `recipe-answer-01.md`, `next-move-01.md`
- `natural-answer-02.md`, `cognitive-signature-02.md`, `recipe-trace-02.md`, `recipe-answer-02.md`, `next-move-02.md`
- ...and so on for each subsequent exchange.

NEVER reuse a turn number; NEVER overwrite a previous turn's files. If you are unsure what turn you are on, count the sets already written this conversation and increment by one.

**Deliver the artifacts progressively — surface each one the moment its file is written, not all at once at the end.** Produce and write the artifacts in order (1 → 5); as each file lands, present it *before* moving on to produce the next, so the user can open and read each one while the remaining artifacts are still being generated. Specifically:

- **All five artifacts (1 → 5):** as each file is written, present it as a **single clickable link** to the file (e.g. `Cognitive signature → cognitive-signature-{NN}.md`) — **do not paste any artifact's full text inline, not even Artifact 1.** The link appears the instant the file exists, so the reader can click into it while the next artifact is still being written.
- **Label the natural-answer link as the baseline** (e.g. `Natural answer (baseline, for comparison) → natural-answer-{NN}.md`) so the reader doesn't mistake the control for the real answer — the deeper answer is **Artifact 4 (the recipe answer)**. The natural answer is shown as a link like every other artifact, never inline in full.

Never batch all the links at the end, and never re-dump a full artifact into the conversation body — each lives in its own file, reached by its link. Close with a one-line confirmation once the final artifact is written.

The five artifacts, each written as its own file, in order (Artifact 5 only when it earns its place — see its gate):

1. **Natural answer** (`natural-answer-{NN}.md`) — what you'd say *without* the router. The baseline / control. (Makes router value
   visible.)
2. **Cognitive Signature** (`cognitive-signature-{NN}.md`) — the **cognitive mirror** (Signature 2.0): a short, plain-language read of the
   user's *own* thinking, written so a non-technical reader absorbs it without decoding anything. Reader-facing
   sections: (1) **The thinking tools you're using** — ≤3 models the framing reveals they're reasoning with;
   (2) **Where your own thinking might be steering you wrong** — the biases + logical fallacies in play;
   (3) **The belief underneath your question** — the operative worldview + its core assumption (and, beneath it,
   the rival worldview the decorrelation step surfaces); (4) **What would cover the blind spot** — ≤2
   counter-models; then a closing **Pattern worth noting**. **Obeys the Artifact voice contract above** (name →
   explain how it works → tie to their situation; evidence-anchored; charitable; show NO record IDs / role labels /
   "decorrelation engine" / "Tier" / "Layer N" / route fingerprint to the reader). The route fingerprint (operation
   / role / domain / collection, recording the *use* per `lenses.md`) is computed and recorded **internally**, not
   printed in Artifact 2.
   **Lean + evidence-bound:** every flag cites where in the conversation it appears, resolves internally to a real
   library `#record`, and must change Artifact 4 (no theater); counts are ceilings, not quotas. Full spec,
   anchor sets, and the plain worked example + output template in `references/cognitive-signature.md`. *(The
   worldview section names the worldview; the **decorrelation engine** then fetches its rival worldviews and
   lands them beneath it — resolve worldview → corpus paradigm → oriented rival tensions, lean, with a labeled
   cluster-sibling fallback; surfaced to the reader in plain terms only. Spec: `references/decorrelation-engine.md`;
   impl: `scripts/decorrelate.py`.)* *(When the primary stuckness is `Can't grow` / `Can't change the system`,
   Step 6.5's gated depth-of-use check may add **one** optional plain line — see Step 6.5. Omit otherwise.)*
3. **Recipe trace** (`recipe-trace-{NN}.md`) — the 6-step router run with the filter counts and the semantic selection (including
   what was rejected and why), then the recipe (named or ad-hoc) and each step. It also surfaces the
   **debiasing counterfactuals** generated from the signature's bias scan — the questions the user would have
   asked *without* their biases — split into "changed the answer" vs "didn't." The observability layer, and the
   **most technical artifact** — that's allowed (it's "show your work"). But it still stays **above the plumbing
   floor:** name recipes (R#), operations, and lenses as readable handles and run their steps; **no raw
   `#record` IDs, no role-caps (`INSTRUCTION → OPERATION`…), no "Tier / viability gate / decorrelation engine /
   tension #" jargon** — those are internal-only, never reader-facing even here. Give it a plain top-line so a
   curious reader can skim it.
4. **Recipe answer** (`recipe-answer-{NN}.md`) — the answer produced by *running the recipe*. The **warmest** artifact, and it
   **obeys the voice contract:** lead with a one-line **headline reframe carried by a plain metaphor**, name
   the recipe and its moves by their **plain handles (R-numbers stay in Artifact 3)**, and end on **what's
   genuinely going well**. **Must be qualitatively different from Artifact 1** (no router theater — the router
   must change *which* models drive the answer). Where a debiasing counterfactual changed the answer, this is
   where its nuance is **absorbed** — folded into the single focused recipe, never split into separate directions.
5. **Next action in Claude Code** (`next-move-{NN}.md`) *(optional — v4's addition)* — turns Artifact 4's single most useful move into
   something the user can *do*, not just read. Reader-facing, it **obeys the voice contract: a specific, do-able
   proposal — concrete enough that someone could poke holes in it, warm and plain, never a technical menu.** It's
   a **handoff/translation layer, not new thinking**: it only re-expresses a move already in Artifact 4, under the
   same convergence discipline. Full spec below; a worked example is in `references/cognitive-signature.md`.

### Artifact 5 — the next-action handoff (spec)

*The gate and flavor logic below is **internal reasoning** — how you pick the move. What the **reader sees** obeys the voice contract: a specific, do-able proposal in plain, warm language (like v1's "by June 30 a concrete revenue map exists — specific enough that someone could poke holes in it"). Keep the paste-ready block, but frame it as a concrete next move, not a "flavor/tier" menu, and never show the gate's internal vocabulary.*

**The gate (fires only when all hold — else omit Artifact 5 honestly; do NOT manufacture one):**
1. **Operationalizable in Claude Code.** The move must be doable here — a file/scaffold, a skill, a
   paste-ready prompt, a scheduled task, or running the recipe on the user's real data. Moves that are
   *not* Claude Code actions (e.g. "talk to your users," "have the conversation with your cofounder") are
   **dropped, not dressed up.** Naming a dropped move in one line is fine; turning it into fake CC work is theater.
2. **Grounded in Artifact 4.** Every suggestion traces to a *specific* move already in Artifact 4 (ideally
   an absorbed counterfactual nuance). No new directions — this is the anti-sprawl guarantee applied one
   more time, to the *handoff* instead of the answer.
3. **Ceiling, not quota.** Lead with the **single** highest-leverage action. At most **2**. If only the
   recipe-level move is operationalizable, surface 1. Convergent, never a menu.

**Flavor — rank by Claude-Code exclusivity; lead with the most exclusive tier the move genuinely supports.**
The Code handoff earns its keep only when it does something the Chat edition *can't*. So don't just pick a
flavor by shape — pick the **highest tier that fits**:

1. **Run the move on the user's REAL files / data** (execution + file access) — strongest; impossible in
   Chat. *(e.g. "point me at your customer-data export and I'll segment your actual active vs. lapsed
   accounts now," not "draft a survey.")*
2. **Build a persistent, reusable skill** (a paste-ready prompt for `skill-creator`) for a **recurring**
   move — persists across sessions; Chat can't. *(e.g. a `retention-diagnostic` skill that re-runs the
   recipe on demand; a recurring prioritization skill.)*
3. **Automate / schedule** a recurring run (a routine / scheduled task / hook).
4. **Create a persistent deliverable file** (a scaffold, e.g. `kill-criteria.md`, a pre-pass template) — the
   floor; only mildly CC-exclusive (Chat can *show* text but not save it).

Don't lead with anything the Chat edition also does ("here's a prompt to paste back," "I'll draft it here") —
that's Chat's job. If only a weak move fits, **elevate it** ("…and save it as a file / make it a reusable
skill"). **Honesty caveat — "ideally," not a hard gate:** never *manufacture* fake exclusivity or sprawl.
It's still the **same Artifact-4 move, lead with one, grounded** — just rendered at the highest
CC-capability tier that genuinely fits. *(This is the Code edition's distinct value: act on your real world /
persist it / automate it. The Chat edition's Artifact 5 does the thinking-move in the conversation instead.)*

**Form:** a fenced, paste-ready block, plus one line naming the move it came from and (optionally) one line
naming any move the gate dropped. Keep the prompt self-contained and convergent ("one focus decision, no
branching") so the thing it builds/runs inherits this skill's anti-sprawl north star.

The reader-facing worked examples (Artifact 2 + Artifact 5, in the current plain voice) are in
`references/cognitive-signature.md`.

---

## Reference-usage map

Read these **lazily** — only the slice you need, only when you need it. Never load a catalogue whole;
never load the full CSV.

| File | Contains | Read when |
|---|---|---|
| `references/retrieval-guide.md` | The two-stage filter→read→select operation; Path A (live CSV) + Path B (domain-sliced hot-set fallback); viability gates; funnel sizing | Setting up Step 4–6 retrieval, or live retrieval is unavailable |
| `references/catalogues/OPERATION.md` | 41 single-move models (Tier 1 + Tier 2) | Role mix includes `OPERATION` and you're on Path B / want curated set |
| `references/catalogues/PROCEDURE.md` | 68 named routines (SCAMPER, OODA, NVC…) | Role mix includes `PROCEDURE` |
| `references/catalogues/RULE.md` | 55 heuristics / named-laws / constraints (Tier 1 + Tier 2) | Role mix includes `RULE` |
| `references/catalogues/MECHANISM.md` | 144 causal-mechanism models (largest — slice by domain) | Role mix includes `MECHANISM` |
| `references/catalogues/STRUCTURE.md` | 81 part-relation models | Role mix includes `STRUCTURE` |
| `references/catalogues/PROPERTY.md` | 100 quality/property models | Role mix includes `PROPERTY` |
| `references/catalogues/TRAJECTORY.md` | 39 change-over-time models (Tier 1 + Tier 2) | Role mix includes `TRAJECTORY` |
| `references/catalogues/PATTERN.md` | 33 recurring-shape models (Tier 1 + Tier 2) | Role mix includes `PATTERN` |
| `references/operations-moves.md` | 9 operations × 84 moves (the recipe building blocks) | Running a recipe step, or composing ad hoc |
| `references/lenses.md` | Lens-as-use pattern + 10 standing cross-cutting lenses | Deciding *how* to use a selected model (Step 6), or running a habitual angle |
| `references/cognitive-signature.md` | Signature 2.0 spec: the 5 layers, detection method, bias + fallacy anchor sets (with `#records`), the worked example | Producing **Artifact 2** |
| `references/decorrelation-engine.md` | The paradigm rival-check that lands beneath signature Layer 3: the 4-hop resolution ladder, oriented rival-fetch, lean output, cluster-sibling fallback, worked example | Producing **Artifact 2 / Layer 3** (the rival-check), or a Step 6 decorrelation check |
| `references/recipes-part1..8.md` | The R1–R61 recipe bodies (step-by-step procedures). part1: R1–6 · part2: R7–11 · part3: R12–16 · part4: R17–24 · part5: R25–32 · part6: R33–40 · **part7: R41–50 · part8: R51–61** | Running a named recipe selected from the map above — load only the matching part-file |
| `references/recipes-reconciliation-log.md` | Audit of the R1–R40 recipe port (the 2 cross-ref reconciliations, lens-as-use confirmation, verification) | Tracing why a recipe step reads as it does, or before refreshing recipes |
| `references/recipes-candidates-s4b.md` | The R41–R61 expansion scaffold: gap map, 20 vetted shells (R41–R60) + bench R61, distinctness notes (R41–R50 → part7, R51–R61 → part8) | Checking a recipe's distinctness rationale, or before any further expansion |

---

## Scope notes (what this version does and doesn't do)

This is the Claude Code edition — the **higher-ceiling** build. By design it:

- **Retrieves live over the full 2,375-model encyclopedia** (gated at query time by role × domain ×
  viability), not a pre-curated subset. The curated 561-model library still ships as a fast Path-B
  fallback (see `retrieval-guide.md`).
- **Runs a live decorrelation engine** (`scripts/decorrelate.py`): worldview → corpus-paradigm-name →
  oriented paradigm rivals, with a labeled cluster-sibling fallback for the ~30% of paradigms that carry
  no tensions of their own. (The Chat edition carries a baked subset of this instead.) Spec:
  `references/decorrelation-engine.md`.
- **Produces the full five-artifact answer**, including the optional Artifact 5 "next move" as a real
  Claude Code action (run-it-on-your-real-data / build-a-reusable-skill / save-a-file).
- **Is self-contained** — all three runtime CSVs ship bundled in `references/data/`, so it runs from any
  location with no external data files.

Possible later additions: a first-class **paradigm lens** (running a whole turn *through* a rival
worldview, not just naming it), a compressed teaching layer, and a canon-audit module.
