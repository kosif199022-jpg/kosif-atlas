# Lenses — a runtime *use* of a model, not a kind of object

> **Reframe (Session 2b).** Supersedes v1's `lenses-catalogue.md` (the ~100-entry static catalogue).
> In v3 a "lens" is **not a separate type of thing the skill stores**. It's a *way of using* a model
> at runtime. Most of v1's lenses (Pareto, Optionality, Goodhart's Law, Network Effects, Ergodicity…)
> are already encyclopedia models we now retrieve by role — keeping them in a second catalogue would
> duplicate the library and reintroduce version drift. So we drop the catalogue and keep the *pattern*.

## The pattern: one model, several uses

A retrieved model affords more than one use. The Primary Role tag hints at the *natural* use, but it
doesn't restrict it. The same model can be:

- **used as a LENS** — to direct attention: *"look for where X is operating."* (What to notice.)
- **used as an OPERATION** — to perform a move: *"run X on the problem."* (What to do — see `operations-moves.md`.)
- **read for CONTENT** — to understand: *"this is how/why X works."* (What's true — mechanism, structure, trajectory, property.)

"Lens" is simply the *first* of these verbs. Selecting a model in router step 6 includes deciding
**how** to use it, not just **which** one. This is why retrieval returns models by role and Claude
then reads and selects: the role narrows the pool; the *use* is chosen at the moment of application.

## Turning any retrieved model into a lens

The conversion is mechanical: take the model's core claim and restate it as an **attention directive**.

> **Core dynamic of the model → "Look for where [that dynamic] is operating / being violated / hidden."**

Worked examples, drawn from models already in the curated library:

| Model (role) | Used as a lens |
|---|---|
| **Optionality** · #1211 (PROPERTY) | "Look for where preserving a future choice is worth more than committing now." |
| **Ergodicity** · #189 (PROPERTY) | "Look for where a positive-*average* bet still hides personal ruin over repeated plays." |
| **Goodhart's Law** · #913 (RULE) | "Look for where a metric became a target and stopped measuring what it was meant to." |
| **Regression to the Mean** · #507 (MECHANISM) | "Look for where an extreme recent result is likely to be followed by a more average one." |
| **Legibility (Scott)** · #953 (PROPERTY) | "Look for where the drive to standardize is destroying local knowledge." |

Any of the 561 curated models (or any CSV survivor) can be turned into a lens this way. There is no
lens *list* to maintain — there is a lens *move*, applied to whatever the router retrieved.

## Standing cross-cutting lenses (the short, deliberate exception)

A handful of frames are **lens-first and universal**: they tell you *how to look* regardless of the
problem's domain, and they don't reduce to one retrievable domain model. These are worth running as a
habit — a "did you look from these angles?" checklist — *in addition to* the domain-specific models the
router retrieves. This list is intentionally short. It is **not** a revived catalogue; if a frame is
really just a domain model, it belongs in the library and is reached by retrieval, not here.

1. **Invert** — "What would *guarantee failure* here? Are we doing any of it?" (Solve the opposite.)
2. **Zoom** — "Change altitude: what does this look like at the component level vs. the whole-system level?"
3. **Outside view** — "How often does *this kind of thing* actually go the way we're assuming? (base rate, not this case)"
4. **Second-order** — "And then what? What does the obvious move cause downstream / on the next move?"
5. **Map vs. territory** — "Where might our model of the situation be distorting the situation itself?"
6. **Frame check** — "Who set the frame of this question, and what becomes visible if we reframe it?"
7. **Signal vs. noise** — "Is this a real signal, or variance we're over-reading?"
8. **Opportunity cost** — "What can't we do *because* we're doing this?"
9. **Reversibility** — "Is this a one-way door or a two-way door? Calibrate caution to that."
10. **Skin in the game** — "Who bears the consequences of this decision — and is that the same person making it?"

(Several of these *also* exist as encyclopedia models. They earn a standing slot here because their
value is as a universal **angle to run by reflex**, not as a model you'd only reach if the router
routed to it. Keep this list lean — adding domain-specific entries here is how the static catalogue
crept back in v1.)

## Where lens-use appears downstream

- **Router step 6 (semantic selection):** when Claude selects a survivor, it also notes the *use*
  (lens / operation / content). A model chosen as a lens reframes what the answer attends to.
- **Recipes (Session 4):** a recipe step may say "apply [model] as a lens" as one move in the sequence.
- **Cognitive Signature (Session 5):** the signature's operation/role layer records *which use* was
  applied, not just which model — part of making the router's work visible (Artifact 2).
