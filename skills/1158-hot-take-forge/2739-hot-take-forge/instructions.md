# Hot-Take Forge — hardening a contrarian claim until it is both novel AND true

Most "contrarian" content is the same post wearing new stickers, because the
people writing it optimised for surprise and never checked whether the claim
survives attack. This skill does the opposite: it takes one catchy candidate and
hammers it through repeated self-attack until what remains is the rare thing —
a take that is **simultaneously novel and true**. It is a *convergence* engine:
`paradigm-collision-engine` generates candidate insights; this skill forges one
candidate into a defensible claim.

## Gotchas (read first)

- **Novelty and truth pull in opposite directions.** The catchier a take is, the
  more likely it's oversold. A take that survives every attack ends up *less*
  surprising than the first draft — that's the signature of the real thing, not
  a bug. The deliverable lives at the intersection: narrow, uncomfortable, and
  almost never the catchy first draft.
- **You supply your own adversary.** The skill's entire point is that a solo user
  gets the pressure-testing a skeptical reader would otherwise provide. Do not
  protect the draft — attack it and keep what survives. **What survives is the
  true part.**
- **The draft is a workshop, not the deliverable.** The reusable output is a
  *hardened claim* — a one-liner plus falsifiable sub-claims, each with its
  strongest objection on record and the corrected wording that survives it. The
  article writes itself once the claim stops wobbling; that's why the final
  output of this skill feeds a writer, not the reader.

## The loop — nine named moves

Run them in order; each builds on the last. Each is a *test*, and a take is done
only when it passes all nine without collapsing.

1. **Overshoot on surprise.** Draft the maximally catchy version first. Do not
   try to be balanced yet — you need heat to have something to forge.
2. **The Decomposition Test.** Turn the rhetoric into discrete falsifiable claims
   C1…Cn. A take you can't decompose isn't testable; it's vibes.
3. **The Tautology Tell.** Mount the strongest objections and watch what they
   collapse into. If every objection reduces the take to *"cheap X is
   commoditized, real X isn't"*, you've found a tautology, not an insight. This
   is the single most reliable over-claim detector.
4. **The Prescription-Completeness Test.** If you can't prescribe the fix, the
   diagnosis isn't finished. Go one level deeper until the cause *implies* the
   fix. This is the engine's heart: it's what moves a symptom ("the feeling was
   the product") to a cause ("there was never a product — the knowledge was the
   loss leader, the channel was the asset").
5. **The Caveat-Fold.** Verify empirical claims against sources. When the
   evidence contradicts the rhetorical claim, do **not** hide the caveat — fold
   it in and ask whether it makes the argument *stronger*.
6. **The Example-Audit.** Every concrete example must satisfy the framework's
   own definitions. If an example silently redefines a term (outcome → deliverable),
   that's where the framework is wrong.
7. **The Scope-Audit.** Does the claim survive the audience's *full* portfolio,
   or is it secretly shaped to one format? A course-shaped essay breaks against
   coaching, communities, and webinars.
8. **The Legs Rule.** Every prescriptive bullet carries **evidence + example +
   test** — never a bare imperative. A "what to do" without legs is a slogan.
9. **The Weakest-Leg Attack + Moat-Sharpening.** Find the bullet that secretly
   assumes its own conclusion, and correct it. Then, wherever a claim was
   attacked, refine to the *more precise* wording that survives — never retreat
   to a weaker one. ("Verifiable" → "redeemable." "Network" → "obligation-bearing
   network.")

## When to use

- "Give me a hot take on X", "I want a contrarian angle", "pressure test this
  idea", "is this take actually original".
- A draft exists but the author can't articulate why it's actually *true*, as
  opposed to catchy.
- A topic is hot and every existing take is oversold; you want the one claim
  that survives where they didn't.

Do **not** use when: the goal is pure novelty with no truth requirement (run
`paradigm-collision-engine` and stop before the forge); the question is settled
or empirical (run a search, not a forge); or you need both divergence *and*
convergence — in which case run collision first, then feed its survivors here.

## Expected output

A **hardened claim**, not an article:

1. A one-line thesis.
2. The decomposed falsifiable sub-claims (C1…Cn).
3. For each sub-claim: its strongest objection, and the corrected wording that
   survives it (or "rejected" if it doesn't survive).
4. The prescription, with every bullet carrying evidence + example + test.

That artifact is the input to `writer` / `editor` / `eigenthinking`. The final
essay is downstream; do not short-circuit to prose before the claim holds.

## Related

- `paradigm-collision-engine` — upstream: generates the candidate pool this skill
  hardens.
- `grill` — the question-led cousin: same serial convergence, but its object is a
  decision/spec, not an argument. The forge is the argument-domain version of the
  grill.
- `irreplaceable-edge` — the topical twin: the *coaching process* for "what's my
  moat against AI"; this skill's output argues that discovery into a thesis.
- `gauntlet` / `audit-fix` — adjacent: adversarial review of a *deliverable* or
  *plan* against criteria. This skill is adversarial hardening of a *claim*
  against the novelty-vs-truth tension specifically.
- `extract-codify-patterns` — the meta-skill: this skill *is* a codification of a
  session; that one packages the session as a teachable bundle.
- `eigenthinking` — downstream: turns the hardened claim into a branded framework.

## Worked trace

The session that produced this skill (a contrarian take on knowledge
entrepreneurs vs AI) hit these moves in this order:

| Move | Test that fired | What it corrected |
|---|---|---|
| Draft "sell liability not authenticity" | Tautology Tell | Reduced to "cheap X commoditized" — oversold, rejected |
| "Revealed demand: customer wanted the feeling" | Prescription-Completeness | Couldn't prescribe → diagnosis incomplete |
| Verify "AI beats warmth" | Caveat-Fold | "Only when labeled human" *became* the argument |
| "Done-for-you" examples | Example-Audit | Outcome silently became deliverable |
| "Sell the artifact" rebuild | Prescription-Completeness | "No product" was still a symptom → "loss leader vs channel" |
| "This is for experts, not just courses" | Scope-Audit | Course-shaped → portfolio-of-four |
| "AI can fake a track record" | Moat-Sharpening | "Verifiable" → "synthesize vs redeem" |
