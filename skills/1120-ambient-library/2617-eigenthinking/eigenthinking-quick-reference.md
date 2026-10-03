# Eigenthinking: Quick Reference Card
### `UP → IP` — Unique Process → Intellectual Property

---

## The Nine Steps at a Glance

```
SIGNAL → DRILL → [Market Novelty Gate] → REFRAME → NAME → BUILD → STRESS TEST → COMPRESS → LIFT → TEACH
```

---

## Step-by-Step: Prompts, Gates, Outputs

### 1 — SIGNAL
*Find the structural friction worth following.*

**Key prompt:**
> "Describe what keeps bothering you — before you try to fix it. 
> What's the recurring gap between what you expected and what you got?"

**Completion signal:** The friction statement feels uncomfortably accurate — like naming something hiding in plain sight.

**Watch for:** Symptom descriptions ("clients don't implement") vs. structural friction ("there's a gap between information transfer and behavioral change"). Push until it's structural.

**Output:** One sentence — *"The real problem is ___."*

---

### 2 — DRILL
*Diagnose the mechanism, not the symptom.*

**Key prompt:**
> "Before we discuss solutions — what structural mechanism makes this friction 
> inevitable? What would have to be true at a system level for this to keep 
> happening regardless of what you try?"

**Stress-test prompt:**
> "What would have to be true for this diagnosis to be wrong?"

**Adjacent domain move:**
> "How would a [geologist / mathematician / ecologist / military strategist] 
> diagnose this same problem?"

**Completion signal:** A knowledgeable peer would say "I never thought of it that way — but that's exactly right."

**Watch for:** Stopping at common wisdom. If the diagnosis sounds familiar in the field, drill further.

**Output:** Structural explanation — *"X happens because of Y, and Y exists because of Z."*

---

### Gate: Market Novelty Checkpoint
*Run between DRILL and REFRAME. Not a step — a gate.*

> "Who are the top 5–10 voices, firms, or methodologies in your market? What do they claim? What language do they use?"

Map claimed territory. Test the user's diagnosis against each competitor: same thing in different words, or genuinely different mechanism? Supplement with web search when available.

**Completion signal:** User can articulate — in one sentence — what their diagnosis says that no competitor is saying.

**Watch for:** "My version is more nuanced" or "I do it better" — those are execution advantages, not structural novelty. If diagnosis overlaps with claimed territory, say so directly and find the divergence point before advancing.

---

### 3 — REFRAME
*Build the new lens.*

**Key prompt:**
> "Here's the conventional framing of this problem: [X]. Help me find framings
> that are structurally incompatible — where if the alternative is correct,
> the conventional approach is not just suboptimal but wrong."

**Candidate Protocol (mandatory):** Generate 4+ structurally incompatible candidate reframes. Use the full non-modal arsenal from `references/cognitive-patterns.md` — Structural Incompatibility, Shadow Harvest, Adjacent Domain Import, Boundary Probe, Faction Analysis. At least one candidate must reframe from the audience's perspective ("here's what you believe that's wrong") rather than the practitioner's ("here's what I do differently"). Present as a numbered set. Let the user select.

**Completion signal:** The reframe changes what you'd do next — not just how you'd describe what you're already doing.

**Watch for:** Reframes that only change language. The test is behavioral: does this shift your next action? Also check each candidate against the market novelty map.

**Output:** One sentence — *"Instead of [conventional approach], [reframe]."*

---

### 4 — NAME
*Make the concept portable and ownable.*

**Key prompt:**
> "Generate name candidates for this concept from five different metaphorical
> domains: mathematics, geology, navigation, biology, physics. Evaluate each:
> curiosity gap? mechanism hint? ownable? competitively durable? short enough
> to repeat naturally?"

**Selection test:** Say the name to someone unfamiliar with the concept.
- "What does that mean?" → you have a name
- "Oh, like [thing they know]" → keep looking

**Competitive durability test:** If a competitor adopted this name tomorrow, would the market still associate it with you? Does the name *require* the methodology to make sense, or could anyone claim it? Names coupled to structural mechanisms are durable. Names describing general qualities are slogans.

**Prior name:** If a name was confirmed in prior work, run verification (PASS/FAIL against seven criteria including speakability in user's working language). Do not regenerate.

**Completion signal:** Saying it out loud creates a mandatory explanation moment every time.

**Watch for:** Premature naming — hold this step until REFRAME is confirmed solid. Also watch for names that pass the curiosity test but are structurally detachable from the methodology.

**Output:** A name + one-sentence definition that follows it naturally.

---

### 5 — BUILD
*Make it followable.*

**Key prompt:**
> "I'm going to describe my process. As I do, help me identify the distinct 
> phases, name them, sequence them, and articulate what 'done' looks like 
> at each stage."

**Failure-mode pass:**
> "Where would a smart person following this get stuck? What's the most 
> common failure mode at each phase? What's missing?"

**Completion signal:** Someone with no access to your tacit knowledge could follow this and produce something recognizably yours.

**Watch for:** Steps that feel obvious from inside the expertise. Those are precisely the steps that need the most explicit articulation.

**Output:** Complete, named, sequenced methodology with quality gates at each step.

---

### 6 — STRESS TEST
*Break it before the market does.*

**Four moves — run all four:**

**Red Team:**
> "What's the strongest argument that this methodology is wrong?
> Under what conditions does it fail completely?"

**Edge Case:**
> "Where does this work well but not always? What context makes it inapplicable?"

**Honesty Check (most important):**
> "Where in this methodology could someone go through the motions and produce
> something that looks like output without doing the real thinking?"

**Falsifiability Check:**
> "What structural evidence would make a skeptic concede this produces
> different results than the standard approach? If no such evidence is
> designable, the methodology may be unfalsifiable."

**The Delta Report principle:** Every methodology needs a step that asks "did this process change anything? If not, say so." If an output looks the same whether the step was done or skipped, the step has no quality gate — add one.

**Completion signal:** You found at least one thing to add that you didn't know was missing before the stress test.

**Output:** Hardened methodology with failure modes documented and guardrails added.

---

### 7 — COMPRESS
*Prove the thinking with reduction.*

**Compression levels — work down sequentially:**
1. Full methodology (complete document)
2. One paragraph (practitioner navigation aid)
3. Three sentences (mechanism + output + why it matters)
4. One sentence (creates desire to know more)
5. A phrase (optional — name + verb)

**Key prompt:**
> "Help me compress this through five levels. At each level, test: does this 
> still point someone toward the right practice?"

**Completion signal:** The one-sentence version creates desire to know more AND hints at the mechanism.

**Watch for:** One-liners that are catchy but don't hint at the mechanism — those are taglines, not compressions.

**Output:** One-sentence version + one-paragraph version.

---

### 8 — LIFT
*Move one abstraction level up.*

**Key prompt:**
> "What is this methodology an example of? If I named the class of methods 
> it belongs to, what would that class be called? Does seeing it from that 
> level reveal anything the methodology is missing?"

**Examples of the lift in practice:**
- Latent Cartographer → *Map before move*
- UP → IP → *Process is more valuable than information*
- Eigenthinking → *Your cognitive patterns are your most leverageable asset*

**Completion signal:** The lifted principle is more broadly applicable than the methodology it came from.

**Meta-move:** If the lift reveals a gap in the methodology, return to BUILD and add it.

**Output:** The named principle the methodology instantiates, in one sentence.

---

### 9 — TEACH
*Produce the artifact that transfers it.*

**Five-role production pipeline:**

| Role | Key question |
|------|-------------|
| 🧠 Researcher | What angles matter most for this audience? |
| 🎯 Strategist | What's the central tension and how does it resolve? |
| ✍️ Writer | What voice serves this audience? |
| ✂️ Editor | Where does it drag, overreach, or bury the mechanism? |
| 📰 Publisher | What platform, packaging, headline? |

**Voice decision:**
- Third-person authoritative → credibility from expertise
- First-person personal → credibility from journey

**The Organic Insight Rule:** When new connections surface during production, don't dismiss them. Ask: "Where does this naturally belong?" Find its structural home before deciding.

**Completion signal:** The artifact demonstrates the methodology rather than just describing it. The reader experiences the thinking.

**Output:** A finished artifact — article, SOP, skill, course module, or workshop.

---

## The Eight Principles (Always Active)

| # | Principle |
|---|-----------|
| 1 | Friction is signal, not noise |
| 2 | Structural before tactical — every fix without a diagnosis is a patch |
| 3 | Diagnosis is expertise made visible — anyone describes symptoms, experts describe mechanisms |
| 4 | Name everything, twice — the concept and the principle it instantiates |
| 5 | Compression is proof — if it can't compress, it isn't fully understood yet |
| 6 | Stress test before publishing — find the honesty gap first |
| 7 | Organic fit is a quality signal — forced insertions break integrity |
| 8 | AI is the capture mechanism, never the source |

---

## The Loop

```
SIGNAL → DRILL → REFRAME → NAME → BUILD → STRESS TEST → COMPRESS → LIFT → TEACH
                                                                         ↓
                                                             New friction surfaces
                                                                         ↓
                                                             Loop restarts — sharper
```

**Cycle 1** extracts the IP. **Cycle 2** deploys it — positioning, niche selection,
and evidence design are second-cycle problems, not first-cycle steps. Common
second-cycle frictions: "well-articulated but not positioned," "applies everywhere
but resonates nowhere," "makes claims I can't prove yet." Don't try to do
everything in one session.

---

## One Line

*Find the natural axes of how you think. Name them. Build systems from them. Teach what can't be replicated without you.*
