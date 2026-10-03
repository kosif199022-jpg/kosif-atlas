# The Decorrelation Engine

**This is the spec for the paradigm rival-check** — the operation that slots beneath the Cognitive Signature's **Layer 3** ("The worldview underneath"). The signature *names* the operative paradigm and prints a literal hook: `[Rival-check pending — decorrelation engine.]`. This engine **consumes that hook**: it takes the named worldview, resolves it to a corpus paradigm, fetches that paradigm's **rival worldviews** from the tensions table, and surfaces — leanly — what each rival sees that the user's worldview is structurally blind to.

Read this when producing Artifact 2's Layer 3 (the rival-check), or when wiring decorrelation into a new surface.

The point is **decorrelation**: a turn whose selected models all sit inside one worldview will produce a confidently one-eyed answer. The signature's Layer 4 already decorrelates at the *model* level (counter-models from `Model Limits`). This engine decorrelates one altitude up — at the *paradigm* level — by naming the rival worldviews the user's framing can't see from where it stands.

---

## Where this sits (the altitude seam)

| | Cognitive Signature (Layer 3) | Decorrelation engine (this) |
|---|---|---|
| Job | *Names* the operative paradigm + its core assumption | *Fetches* that paradigm's rival worldviews |
| Altitude | Paradigm-**naming** | Paradigm-**rivals** |
| Data | `Paradigm_Encyclopedia.csv` (name + core assumption) | `Paradigm_Tensions.csv` (338 rival tensions) |
| The hook | Prints `[Rival-check pending — decorrelation engine.]` | **Replaces** that hook with the actual rivals |

This is **not** the first-class **paradigm lens** (the Code-only S7 ceiling — running a whole turn *through* a chosen rival paradigm). That is a later, bigger build. This engine is the **decorrelation floor**: name the rivals so the answer can be checked against them. (Spec: decorrelation floor = both versions; paradigm-lens ceiling = Code-only S7.)

---

## The resolution ladder (grounded in the data)

The spec sketched **one** hop — "worldview → corpus-paradigm name, then fetch tensions" (S1a Refinement 3). Grounding it in the actual two CSVs showed the real path is a **four-hop ladder**, because two independent name gaps and one coverage gap sit between an everyday worldview and a tension row:

> **The gaps, measured:** everyday labels ("Lean Startup", "Techno-Optimism") return **0** verbatim hits in the 389-paradigm encyclopedia. And even *within* the corpus, only **272 / 389** paradigms have an exact name in the tensions table — ~30% (including the worked example's own **Experimentalism #125**) carry **0** tension rows. So a flat "look it up and fetch" fails almost a third of the time. The ladder closes both gaps.

**Hop 1 — worldview label → encyclopedia paradigm (semantic; Claude's judgment).**
The everyday worldview rarely matches a corpus name verbatim. Claude reads the conversation's operative worldview and resolves it to the nearest `Paradigm_Encyclopedia.csv` name by *meaning*, not string match. (The signature already does this in Layer 3 — e.g. "Lean Startup" → **Experimentalism #125 / Classical Pragmatism #121**. This engine inherits that resolved name.)

**Hop 2 — encyclopedia paradigm → direct tension rows.**
Fetch every tension where the paradigm is `Paradigm_A` or `Paradigm_B`. Name-form drift between the two CSVs (the encyclopedia carries thinker parentheticals — "Classical Pragmatism (Peirce/James/Dewey)") is bridged by **core-name matching**: strip the parenthetical, lowercase, match the core. If this returns rivals, **done**.

**Hop 3 — cluster-sibling fallback (Option A; the ~30% rescue).**
If the named paradigm has **0** tension rows, drop to the **nearest same-`Cluster` sibling that does have tensions**, richest first, and **label the substitution explicitly**. Cluster siblings share an intellectual family (Experimentalism #125 and Classical Pragmatism #121 are both "Pragmatism, Process & American Philosophy"), so the sibling's rivals are almost always the user's rivals too. The labeled path keeps the move honest and auditable — never a hidden substitution.

**Hop 4 — honest floor (degrade to "no rivals").**
If the cluster *also* carries no tensions, say so plainly: `[No direct rivals in the corpus for this worldview.]`. Better to name the absence than to climb to the broad `Category` level and decorrelate against a strawman three shelves away. (This is why the engine builds the cluster step and *stops* — the category climb buys little coverage at a real precision cost.)

> **Verified coverage (whole-corpus scan, `decorrelate.py` over all 389 paradigms):** **288 resolve directly, 101 via the cluster-sibling fallback, 0 fall through to Hop 4.** The labeled cluster fallback closes **100%** of the ~26% no-tension gap in this corpus — Hop 4 never fires here, but it stays as the honest floor so the engine degrades gracefully on any future corpus (or a sparser cluster). This is the measured payoff of Option A over "stop at Hop 2" (which would have left 101 paradigms — including the worked example's own Experimentalism — rival-less).

> **Locked decision (Session 5 part 2, via Q&A):** Hop 3 = cluster-sibling fallback **with a labeled resolution path**; Hop 4 = honest "no direct rivals" floor (no category climb). Chosen over (b) stop-at-hop-2 (leaves the worked example's own worldview rival-less) and (c) climb-to-category (precision degrades as you climb).

---

## The rival-fetch operation (orientation matters)

Each tension row carries four fields: `Fault_Line`, `What_A_Sees_That_B_Misses`, `What_B_Sees_That_A_Misses`, `Most_Productive_When`. The decorrelation payload is **"what the RIVAL sees that YOUR worldview misses"** — so the fetch must **orient** by which side the user's paradigm sits on:

- user's paradigm is `Paradigm_A` → payload = `What_B_Sees_That_A_Misses`
- user's paradigm is `Paradigm_B` → payload = `What_A_Sees_That_B_Misses`

Get this backwards and the engine hands the user a flattering mirror ("what you see that they miss") instead of the blind-spot it exists to surface. The reference impl orients automatically.

---

## Output weight — lean by default (deeper on request)

Matches the signature's locked **lean + evidence-bound** house style:

- Surface the **top 2–3 sharpest rivals**, each as: **rival name + the fault line (clipped) + "what it sees you miss"** (the blind-spot payload only).
- Some worldviews are rivalry-rich (**Neoclassical Economics has 28** rivals); never dump all 28. Note the count and offer the full table.
- `--full` (or "give me the full rival table") surfaces every rival and all four fields. Counts are **ceilings, not quotas** — show 1 if only 1 is sharp.

### No viability gate here (a detection layer, like the bias scan)

The paradigm corpus has no `Confidence` column and is **not** gated by the model viability gate. Decorrelation is a **naming / recognition** operation (which rival worldviews exist), not an answer-retrieval — the same gate-exemption logic the signature applies to its bias/fallacy detector. The strict gate governs which *models* the router offers as answers (Artifact 4 / the recipe), never the paradigm rival-check.

---

## Anti-theater rule (the one that governs this engine)

**The rival must change Artifact 4, or it's decoration.** Naming a rival worldview is only worth the ink if the recipe answer is then *checked against it* — "your framing assumes "what works" is the test; the Kantian rival asks what should hold even when violating it is expedient — does your answer survive that?". State the link to Artifact 4 explicitly, exactly as Layers 2–4 of the signature must. A rival that doesn't pressure the answer is dropped.

This is the decorrelation guardrail made operational: the engine exists so the turn doesn't hand back a confidently one-worldview answer.

---

## Reference implementation (one surface's *how*, not the contract)

Per the locked **retrieval-as-operation** decision (SESSION-LOG cross-session note), this engine is specified as an **operation** — *resolve the worldview → corpus paradigm → fetch oriented rival tensions, with the cluster fallback* — and each surface implements it however it can (terminal → Python/grep/awk; Cowork VM → Python; Chat → a curated rival subset, S6). The script below is the terminal surface's implementation, **not** a baked contract.

`scripts/decorrelate.py`:

```
python3 scripts/decorrelate.py "Experimentalism"          # resolve + fetch (lean)
python3 scripts/decorrelate.py "Neoclassical Economics" --full
python3 scripts/decorrelate.py --selftest                 # the 4 probes below
```

It runs the full ladder, orients the payload, applies the lean ceiling, and prints the **labeled resolution path** so every hop (and every fallback substitution) is visible. Verified self-test:

| Probe | Path | Rivals |
|---|---|---|
| Neoclassical Economics | direct hit #1 | **28** (matches the S1a spike's "28 rival tensions") |
| **Experimentalism** | #125 → **0 direct → cluster fallback** → Classical Pragmatism #121 | 4 |
| Classical Pragmatism | direct hit #121 | 4 |
| Austrian Economics | direct hit #2 | 7 |

---

## Worked example — consuming the signature's hook

Continuing the build's running example (the "Misfire Diagnosis" query, where the signature's Layer 3 named the worldview **Experimentalism / Classical Pragmatism** and printed `[Rival-check pending — decorrelation engine.]`). The engine consumes that hook:

```
### Artifact 2 — Layer 3 (rival-check, decorrelation engine)

**Resolution path** — "Lean Startup" → Experimentalism #125 (0 tensions of its own)
→ cluster sibling Classical Pragmatism #121 → 4 rival worldviews.

**Rival worldviews** (what your "build-ship-measure" worldview is blind to):
- **Kantian Deontology** [#104] — fault line: pragmatism judges ideas by practical
  consequences; Kant insists on a-priori principles independent of consequences.
  Sees what you miss: "what works" gives no basis for a principle that should hold
  even when breaking it is expedient. → Artifact 4 check: does shipping-to-learn have
  a line it won't cross to "validate"? (e.g. dark-pattern engagement that "works").
- **Structural Functionalism** [#105] — sees that endless experimentalism
  underestimates systemic interdependencies — you can't just tinker with everything;
  some structures hold the system up. → Artifact 4 check: which "features" are load-
  bearing and should NOT be A/B-thrashed?

[+2 more rival tensions — full table on request.]
```

Notice the rival-check is **not** decoration: each rival hands Artifact 4 a concrete pressure-test the un-routed answer would never have surfaced. The labeled path makes the cluster substitution honest — the user sees that Experimentalism itself carries no rivals and the rivals shown are its cousin's.

---

## Scope — what this engine is NOT

- **Not the first-class paradigm lens** (Code-only **S7** ceiling): running the whole turn *through* a chosen rival worldview. This engine only *names* the rivals (the floor).
- **Not the Chat decorrelation subset** (**S6**): the Chat mirror is self-contained and can't run a live tensions fetch, so it carries a curated rival subset. Deriving that subset is S6's job; this is the Code engine.
- **Not a re-tag or edit of the paradigm CSVs** (negative constraint): consumed as-is.
