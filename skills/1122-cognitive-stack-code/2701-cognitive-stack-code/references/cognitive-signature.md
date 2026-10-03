# Cognitive Signature 2.0

**This is the spec for Artifact 2** of the 4-artifact protocol (see `SKILL.md` → "Execution → the 4 artifacts"). It upgrades the thin S1b/S3 signature (a 4-layer profile + a couple of bias flags) into a full **cognitive mirror**: it reads the user's *own* thinking from the conversation, names where that thinking is vulnerable and what worldview it sits inside, names the move that would cover its blind spot, and records the route the skill took to answer.

Read this when producing Artifact 2, or when wiring the signature into a new surface.

---

## What the signature is — and is not

The signature points in **two directions at once**:

- **The cognitive mirror** — reads the *user's* thinking, revealed by how they framed the problem (their question + the un-routed natural answer, Artifact 1). This is the half that reflects a person's own thinking back to them.
- **The route fingerprint** — reads what the *skill* did: the compressed profile of the cognitive object the router reached for. This is the observability half (the full step-by-step trace is Artifact 3).

It is **not** decoration. The signature exists to (a) make the router's work visible and (b) feed Artifact 4 — every vulnerability and counter-model it names should change the recipe answer. A signature whose flags don't influence the answer is theater (see Anti-theater rules).

It is **not** the decorrelation engine. The signature *names* the operative paradigm; it does **not** fetch that paradigm's rivals. The paradigm-level rival-check (via `Paradigm_Tensions.csv`) and the systematic worldview→corpus-name resolver are the **decorrelation engine** — now built (`references/decorrelation-engine.md`, impl `scripts/decorrelate.py`), landing beneath Layer 3 and consuming the hook this layer prints. The seam is the model/paradigm altitude line — see "Scope seam" below.

---

## The five layers (in output order)

The signature reads as a short narrative — your thinking, its weak points, the water it swims in, the fix, then what the skill did about it:

1. **Models you're thinking with** *(the mirror)* — up to **3** mental models the user's framing reveals they are reasoning *with*, explicitly or implicitly. The positive read of their toolkit (the legitimate twin of the bias scan).
2. **Where it's vulnerable** *(the mirror)* — the **biases** and **logical fallacies** in play, each with the textual evidence and a real library record.
3. **The worldview underneath** *(the mirror)* — the operative **paradigm** the reasoning sits inside, named with its core assumption. (Names it; does not fetch rivals.)
4. **What would cover the blind spot** *(the mirror)* — up to **2 counter-models** whose strength is exactly the structural blind spot of the demonstrated models / operative paradigm. A model-level decorrelation.
5. **The route the skill took** *(the fingerprint)* — the 4-layer profile: **operation / role / domain / collection**, recording the *use* (lens / operation / content-read), not just the model.

Layers 1 and 5 are deliberately opposite-facing and must not be muddled: **Layer 1 = the user's input mindset; Layer 5 = the skill's output toolkit.**

---

## Anti-theater rules (these govern every layer)

1. **Evidence-bound.** Every flag in Layers 1–4 must cite **where in the conversation** it shows up (a phrase, an assumption, a move). A bias, model, or paradigm with no textual evidence is **dropped, not guessed**. This is the signature's version of the "no router theater" guardrail.
2. **Resolves to the library.** Each named bias / fallacy / model / counter names a real `#record` (via collection-tag filter-then-fetch), so the signature is traceable and the user can pull the source. Paradigms resolve to the `Paradigm_Encyclopedia.csv` name where one fits.
3. **Serves the answer (Layer → Artifact 4).** The vulnerabilities and counter-models must steer the recipe answer. If confirmation bias is flagged, Artifact 4 must actively counter it. State the link.
4. **Lean by default, deeper on request.** Up to 3 demonstrated models, up to 2 counters, only evidenced biases/fallacies, usually one paradigm. Counts are **ceilings, not quotas** — surface 1 if only 1 is real. Offer a deeper full scan rather than padding. (This is the locked S5 detector-weight decision: *lean + evidence-bound*.)

---

## Detection method (the runtime procedure)

Run this against the user's framing + Artifact 1 (the un-routed natural answer), in order:

1. **Read for the toolkit (Layer 1).** What frameworks / reasoning postures does the framing reveal? Where a posture maps to a library model, name it + `#`. Where it's a posture with no clean library match, name the posture and say "no exact library model." Keep the clearest ≤3.
2. **Scan for distortion (Layer 2).** Pass the framing against the **bias anchor set** and **fallacy anchor set** below (filter-then-fetch the long tail by the `cognitive-bias` / `logical-fallacy` collection tags if needed). Keep only evidence-bound hits. State the evidence inline.
3. **Name the worldview (Layer 3).** Identify the operative paradigm cluster, name the paradigm (resolve to a `Paradigm_Encyclopedia.csv` name by semantic judgment), and state its **core assumption** — the thing it treats as obviously true. Add the one-line rival-check hook (see Scope seam). Do **not** fetch tensions.
4. **Derive the counter (Layer 4).** Take the structural blind spot of the demonstrated models / paradigm (read their `Model Limits` field in the catalogues, or the operation's "structural blind spot"). Find ≤2 library models whose **core value is that blind spot**. Name + `#`.
5. **Record the route (Layer 5).** Summarize the router's selection as operation / role / domain / collection, annotating the *use* of each selected model per `lenses.md` ("where lens-use appears downstream").
6. **Debiasing counterfactuals (from Layer 2 → Artifact 4).** A bias distorts not only the *answer* but the *question the user asked*. From the **evidenced** Layer-2 flags, generate **up to 3** questions the user *would have asked without those biases*. Silently answer each. Keep only the ones that **materially change Artifact 4** — fold that specific nuance into the single recipe answer; **drop** the rest. This is convergent, not divergent: the counterfactuals are an internal pressure-test, **never an output branch**, and never become separate answers. Surface the kept-vs-dropped split in **Artifact 3** (the trace), labeled "materially changed the answer" vs "didn't"; Artifact 4 notes what it absorbed. Ceilings, not quotas — generate 1 if only 1 is real; if none change the answer, honestly surface none. (This is the no-theater gate of rule 3, applied a second time — to the *question* instead of the answer.)
7. **Check the links.** Confirm each Layer 2–4 flag — and each kept counterfactual — changes Artifact 4. Drop any that don't earn their place.

### The gate exemption (important)

The bias/fallacy anchor sets **deliberately include medium- and low-confidence records.** Most canonical biases (Confirmation #750, Anchoring #708, Loss Aversion #784, IKEA #766, Dunning-Kruger #671) are tagged below the strict viability gate — not because the concept is weak, but because the tagging pipeline scored them low. **The strict gate governs which models the router offers as *answers* (Layers 5 / the recipe); it does not govern the bias detector,** which is a *naming / recognition vocabulary*, not an answer-retrieval. So Layer 2 may cite a `medium`/`low` record freely. This exemption applies only to the bias/fallacy/paradigm *detection* layers, never to the answer-producing layers.

---

## Anchor sets

These are the detector's starting vocabulary — the most recognizable distortions, with their library records, for fast naming. They are **not exhaustive**: for the long tail, filter the encyclopedia by the `cognitive-bias` (~220 records) or `logical-fallacy` (~36 records) collection tags. Confidence shown so the gate-exemption is visible.

### Bias anchor set (cognitive-bias collection)

| Bias | # | Conf | The tell (what to look for in the framing) |
|---|---|---|---|
| Confirmation / Falsification Bias | 750 | medium | Seeking/weighting evidence that fits the held belief; not trying to disprove it |
| Disconfirmation Bias | 738 | medium | Extra scrutiny applied *only* to disliked conclusions |
| Anchoring (& Adjustment) | 708 | medium | A first number / frame dominates the estimate |
| Loss Aversion | 784 | medium | Losses loom larger than equivalent gains; clinging to avoid a write-off |
| Sunk Cost Fallacy | 857 | **high** | "We've already invested so much" justifies continuing |
| IKEA Effect | 766 | medium | Overvaluing what you built *because* you built it |
| Survivorship Bias | 858 | **high** | Reasoning only from successes/visible cases; the failures are absent |
| Availability Heuristic | 715 | low | Judging likelihood by what comes to mind easily / recently |
| Motivated Reasoning (Spiral) | 2202 | **high** | The conclusion is fixed first; the reasoning is recruited to defend it |
| Dunning-Kruger Effect | 671 | medium | Confidence outrunning demonstrated competence |
| Hindsight Bias | 763 | medium | "I knew it all along"; the outcome reframed as predictable |
| Halo Effect | 760 | low | One strong trait coloring the whole judgment |
| Fundamental Attribution Error | 1302 | low | Others' behavior blamed on character; one's own on circumstance |
| Planning Fallacy | 821 | medium | Timelines/costs estimated as the best case, ignoring base rates |
| Status Quo Bias | 852 | medium | Defaulting to the current option; treating change as the risky move |
| Self-Serving Bias | 844 | medium | Crediting self for wins, externalizing losses |
| Curse of Knowledge | 731 | low | Assuming others share what you know; can't model the novice |
| Base Rate Neglect | 717 | low | Ignoring the prior / population rate in favor of the vivid case |
| Narrative Fallacy | 794 | medium | Imposing a tidy causal story on noise |
| Groupthink | 759 | llm-high | Consensus prized over dissent; options narrowed to preserve harmony |
| Social-Proof Tendency | 902 | **high** | "Everyone's doing it" stands in for a reason |
| Framing | 755 | llm-high | The same facts land differently by how they're worded |
| Commitment & Consistency Bias | 728 | **high** | Staying consistent with a past stance over updating on new facts |
| Regression to the Mean (misread) | 507 | **high** | Treating a return-to-average as if an intervention caused it |

### Fallacy anchor set (logical-fallacy collection)

| Fallacy | # | Conf | The tell |
|---|---|---|---|
| Ad Hominem | 103 | llm-high | Attacking the arguer instead of the argument |
| Straw Man | 122 | llm-high | Refuting a weakened caricature of the position |
| Steel Man *(the antidote, not a fallacy)* | 121 | low | The corrective move: argue the strongest version first |
| False Cause | 114 | medium | Correlation read as causation; "after, therefore because" |
| Slippery Slope | 120 | low | One step assumed to force an extreme chain |
| False Dichotomy / Black-or-White | 1319 / 109 | medium | Only two options presented when more exist |
| Appeal to Emotion | 105 | low | Feeling substituted for evidence |
| Appeal to Authority | 709 | low | "An expert said so" as the whole case |
| Argument from Ignorance | 106 | low | "Not disproven" treated as proven (or vice versa) |
| Burden of Proof (misplaced) | 110 | low | Demanding others disprove an unsupported claim |
| Cherry Picking | 723 | low | Citing only the data that fits |
| Texas Sharpshooter | 868 | low | Drawing the target around the cluster after the fact |
| Motte-and-Bailey | 127 | medium | Defending an easy claim, then acting on a stronger one |
| Moving the Goalposts | 1320 | llm-medium | The standard of proof shifts once it's met |
| No True Scotsman | 1321 | low | Redefining the category to exclude counterexamples |
| Whataboutism (Tu Quoque) | 2233 | low | Deflecting a critique by pointing at the critic |

---

## Worked example — "The Misfire Diagnosis" (Signature 2.0)

*Query: "I keep shipping features nobody uses. How do I figure out what's actually going wrong?"*

This is the **reader-facing output** — the plain version the user actually sees. The internal grounding (each named bias/model resolving to a real library record, the route fingerprint, the confidence gate) happens per the Detection method above but is **never shown to the reader**; it lives in the skill's reasoning and, where a trace is wanted, in Artifact 3.

**Audience — a smart layman who knows what a mental model IS, but not which ones** *(this restates the Artifact voice contract in `SKILL.md`, which governs all five artifacts).* They understand the *idea* of a mental model, a cognitive bias, a worldview — you never have to justify the genre or talk down. But do **not** assume they know any *particular* one. Every time you name a model / bias / fallacy / worldview (Jobs To Be Done, survivorship bias, structural functionalism, the attention economy), **explain how it works** — briefly, plainly — *then* connect it to *their* situation. The move is always **name → explain how it works → apply**, in the same breath; never name-and-move-on. What you strip is **this skill's machinery** (record IDs, role labels, "Tier / viability gate / decorrelation engine," "Layer N," artifact-numbering) — *never* the explanation of the model itself. Plain ≠ dumbed-down: those plain how-it-works explanations ARE the teaching payload.

> ### Artifact 2 — Your Cognitive Signature
>
> **The thinking tools you're using**
>
> - **Build-Measure-Learn (strong):** You reach for iteration by instinct: ship something, watch what happens, adjust. Evidence: *"I keep shipping… then figure out what's going wrong."* The catch is you're treating *shipping itself* as the measurement step.
> - **Root-cause instinct (consistent):** You don't want a patch, you want the real cause. Evidence: *"what's actually going wrong."* That's the right altitude for the question.
>
> **Where your own thinking might be steering you wrong**
>
> - **Confirmation bias** — reasoning that protects a belief instead of testing it. Every build quietly assumes you already know what users want; the build *is* the untested belief. The answer below forces a step where you try to *disprove* the next feature before you build it.
> - **Sunk cost** — the pull to keep going *because* you've already put in so much. "Keep shipping" despite repeated misses is each past build making the next one feel justified. The answer makes the real cost of continuing visible instead of letting it hide.
>
> *(No logical fallacy showed up with clear evidence, so none is named. This stays honest, not padded.)*
>
> **The belief underneath your question**
>
> You're standing inside what's often called the **Lean Startup, or experimentalist, worldview**: *the way to learn what people want is to build it, ship it, and measure.* Often true. But it quietly assumes shipping is the *cheapest* way to learn, when testing demand *before* you build is frequently cheaper.
>
> A rival worldview worth holding it up against: **structural functionalism** — the view that some parts of a system are load-bearing, holding everything else up, so they shouldn't be endlessly tinkered with. It sees what build-and-measure misses: not every feature is an experiment. A few are the structure your users actually rely on, and constantly testing *those* destabilizes the whole thing. (Worth a check in the answer: which of your features are load-bearing and should stay *out* of the test pile?)
>
> **What would cover the blind spot**
>
> - **Customer Development:** moves the learning to *before or alongside* the build instead of after it, closing the "validate after shipping" gap.
> - **Jobs To Be Done:** reframes from "what features?" to "what is the user actually trying to get done?", closing the "features aren't outcomes" gap.
>
> **Pattern worth noting**
>
> Your instincts are sound: you iterate, and you want the true cause, not a quick fix. The gap isn't perception or judgment. It's *when* the learning happens: it's all landing downstream of the build, after the cost is already sunk. The single most useful move here isn't a new framework. It's pulling one test upstream of the next thing you ship.

**What the biases made you not ask** *(internal pressure-test → surfaces in Artifact 3, folds into Artifact 4; never a separate answer, never shown as part of Artifact 2)*

From the two biases above, the skill asks what the user *would have asked without them*, answers each silently, and keeps only what changes the final answer:

- *(from confirmation bias)* "What would I have to see to conclude this next feature will **flop** — and have I written that down before building?" → **changed the answer:** adds a **kill criterion** committed to writing *before* the build, so it can't be explained away afterward. Folded into recipe step 3.
- *(from sunk cost)* "If I were arriving fresh today with no shipped history, would I keep shipping at this pace **at all**?" → **changed the answer:** adds the **option to freeze new builds** until a real validation bar exists, instead of treating the next build as a given. Folded into Artifact 4's framing.
- *(from confirmation bias, a second angle)* "Whose job is it to disagree with me before a build?" → **didn't change the answer:** it just restates the red-team step already in the recipe. **Dropped.**

Two of three folded a *specific* nuance into the one answer; the third was dropped. The skill converges — these never become separate directions.

Notice this signature mirrors the user's *own* models and worldview, and hands Artifact 4 two concrete counter-moves (Customer Development, Jobs To Be Done) the un-routed answer would never have surfaced — all without a single record number or internal label reaching the reader.

### Artifact 5 — Your next move in Claude Code *(optional)*

Reader-facing, in the warm "specific, do-able proposal" voice of the contract (not the gate's internal vocabulary). Artifact 4's absorbed move was the **kill criterion** (write the disconfirming signal *before* you build); the Code edition can do more than describe it:

> Here's a concrete next step, and one Claude Code can actually *do* rather than just recommend: before you build the next feature, let's write its kill criterion together and save it where you'll actually see it. Point me at the feature you're about to start, and I'll help you commit one line to writing — the single signal that would tell you to *stop* (for example, "if fewer than 5 of the 20 people I show the rough version ask 'when can I use this?', I shut it down") — and save it as a `kill-criteria.md` you open before every build.
>
> It's specific enough to use on your *next* build, not someday. And because "did I write the disconfirming signal first?" is a habit you want every time rather than once, it's worth making it a small reusable check instead of a one-off file, so it fires before each build automatically.
>
> *(One move, grounded in the answer above. The actual "go show it to 20 people" stays with you. In plain chat I'd just write you the criterion to keep; here in Claude Code I can save it and make it recur — that's the Code edition's distinct value.)*

**Gate (internal):** one move, grounded in an Artifact 4 step, no new direction; rendered at the highest Claude-Code-exclusive tier that genuinely fits (here: persist + make recurring). If the gate finds no doable move, Artifact 5 is omitted, not manufactured.

---

## Output format template

This is the **reader-facing** shape. Names stay (models, biases, fallacies, worldviews — the teaching payload); the internal bookkeeping (record IDs, role labels, the rival-check machinery, the route fingerprint) stays in the skill's reasoning and out of the reader's eyeline. There is **no fingerprint / route line** in Artifact 2 — the signature ends on the user's side, with the closing pattern. (If a "how the skill worked" trace is wanted, it belongs in Artifact 3, in plain named operations/lenses.)

```
### Artifact 2 — Your Cognitive Signature

**The thinking tools you're using**
- **[Model / posture] ([strong / emerging / consistent]):** [plain read of what it's doing for them] — evidence: "[their own words]"

**Where your own thinking might be steering you wrong**
- **[Bias / fallacy, named]** — [its plain meaning in one line]. [Where it shows up, and how the answer counters it.]

**The belief underneath your question**
[The worldview, named plainly, + its core assumption in their terms.] [One rival worldview, named + cashed out: what it sees that theirs misses, and the check it hands the answer.]

**What would cover the blind spot**
- **[Counter-model, named]:** [the gap it closes, in plain terms].

**Pattern worth noting**
[A warm, constructive synthesis: what's genuinely working, and the single move that matters most.]
```

---

## Scope seam — what this layer does NOT do (handed to the decorrelation engine)

| | Cognitive Signature (this layer) | Decorrelation engine (`decorrelation-engine.md`) |
|---|---|---|
| Altitude | **Model** + **paradigm-naming** | **Paradigm rivals** |
| Layer 3 | *Names* the operative paradigm + its core assumption | Resolves worldview → corpus name *systematically*, then **fetches rival paradigms** from `Paradigm_Tensions.csv` (338 tensions) and surfaces the fault lines |
| Layer 4 | Names ≤2 model-level counter-models (from `Model Limits` fields) | — |
| The hook | Layer 3 prints **"[Rival-check pending — decorrelation engine.]"** | Consumes that hook and replaces it with the actual rival tensions |

The model-level blind-spot counter (Layer 4) lives here because it uses fields the catalogues already carry. The paradigm-level rival check (the tensions table + the repeatable resolver) is genuinely separate work and is now **built** — `references/decorrelation-engine.md` (spec) + `scripts/decorrelate.py` (impl). It slots in beneath Layer 3, consuming the hook this layer leaves. Layer 3 still **prints** the hook (that's this layer's job); the engine fills it.
