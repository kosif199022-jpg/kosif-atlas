# Production Pipeline: Multi-Role Artifact Creation

Reference for Step 9 (TEACH) — how to run the multi-role production 
pipeline to create world-class teaching artifacts from Eigenthinking outputs.

---

## The Core Principle

Original thinking packaged generically is wasted. The same AI that helped 
capture the methodology can serve as a full production team to communicate it.

Don't ask AI to "write about this." Assign roles. Run them sequentially. 
Require reflection at each stage.

---

## The Five Roles

### 🧠 Researcher
**Question:** What angles matter most for this specific audience? What's the 
freshest, most compelling entry point into this methodology?

**Produces:**
- 3–5 key insights with novelty ratings (1–5) and credibility ratings (1–5)
- The strongest angle for the target audience
- Data points, analogies, or examples that ground the methodology in reality

**Prompt:**
> "Research the most compelling angles for presenting [methodology name] to 
> [target audience]. Identify 3–5 insights that would be novel and credible 
> for this audience. Rate each for novelty (1–5) and credibility (1–5)."

---

### 🎯 Strategist
**Question:** What's the central tension? How does it resolve? What's the 
one-sentence thesis? What's the structural arc of the piece?

**Produces:**
- Central thesis (one sentence)
- Core tension and reframe
- Article outline with word allocations
- Platform and audience specification

**Prompt:**
> "Transform this research brief into a strategic outline for a [format] 
> targeting [audience]. Identify the central tension, the reframe that 
> resolves it, and outline the piece with word allocations. The thesis 
> should be: [one-sentence thesis]."

**Key strategic decisions:**
- Voice: Authoritative third-person vs. personal first-person?
  - Third-person: credibility from expertise; works for established authorities
  - First-person: credibility from journey; works for peers teaching peers
- Architecture: Build-up (sequential) vs. modular (standalone sections)?
- Entry point: Lead with the problem, the solution, the story, or the counterintuitive claim?

---

### ✍️ Writer
**Question:** What voice and form serve this audience at this moment?

**Produces:** Full draft at target length (±5%)

**Prompt:**
> "Draft this [format] using the strategic outline. Voice: [specified voice]. 
> Target length: [word count]. Use narrative tension → reframe → resolution flow. 
> Open with: [opening strategy based on audience starting belief]."

**Opening strategies by audience starting belief:**

| Belief | Opening strategy |
|--------|-----------------|
| Skeptical | Lead with their objection, then flip it |
| Curious | Lead with the outcome or the mystery |
| Overconfident | "Most people think X. They're wrong." |
| Neutral | Clear promise of specific, concrete value |
| Overwhelmed | "Ignore everything except this one thing." |

**Anti-patterns to avoid:**
- Chronological setup ("Last week I...")
- Definition leads ("X is defined as...")
- Throat-clearing ("In today's world...")
- Announcement language ("We're excited to share...")

---

### ✂️ Editor
**Question:** Where does it drag? Where does it overreach? Where is the 
mechanism buried when it should be surfaced?

**Produces:** Revised draft + reflection scores (1–5) on:
- Clarity
- Rhythm  
- Credibility
- Engagement
- Mechanism visibility

**Prompt:**
> "Edit this draft. Identify: (1) where the methodology's mechanism is 
> buried — surface it; (2) where the rhythm breaks — fix it; (3) where 
> the reader would lose momentum — add tension or cut. Score clarity, 
> rhythm, credibility, engagement (1–5). Revise any score below 4."

**The Organic Insight Check:**
> "During this edit, did any new connections surface — moments where the 
> artifact revealed something the methodology didn't fully capture? 
> If so, where does it naturally belong?"

---

### 📰 Publisher
**Question:** What platform? What packaging? What headline creates the 
curiosity gap that earns the click?

**Produces:**
- Primary headline + 2–3 alternatives
- Subhead
- Platform recommendation
- Summary (for preview text, newsletter intro)
- Optional: SEO tags, estimated read time

**Prompt:**
> "Package this article for [platform]. Produce: primary headline (curiosity 
> gap + mechanism hint), 2 alternatives, subhead, 100-word summary for preview. 
> Verify platform fit and alignment between headline promise and article delivery."

**Headline test:** Does the headline create a curiosity gap AND hint at the mechanism? 
A headline that's only catchy without hinting at the value inside is clickbait. 
A headline that's only descriptive without a curiosity gap won't earn the click.

---

## Running the Full Pipeline

### Sequential execution
Run each role in order. Pass the output of each role as the input to the next.

1. Researcher → Research brief
2. Strategist → Strategic outline (informed by brief)
3. Writer → Draft (informed by outline)
4. Editor → Revised draft (informed by draft + reflection)
5. Publisher → Final package (informed by revised draft)

### Reflection scores
Each role should score their output before passing it forward. Any score below 4 
triggers revision before advancing. This prevents downstream roles from polishing 
something that needs structural repair.

### The aggregate reflection
After all five roles complete, produce a summary:
- Average score across all roles and dimensions
- Top 3 improvements made
- Recurring weaknesses identified
- Specific things learned that would improve the next run

---

## Format Selection by Artifact Type

| Artifact | Best format | Voice | Architecture |
|----------|------------|-------|-------------|
| Thought-leadership article | Long-form prose | First-person personal OR third-person authoritative | Build-up |
| SOP / Framework document | Structured markdown | Second-person instructional | Modular |
| Workshop module | Layered (skim + depth) | First-person facilitative | Layered depth |
| LinkedIn article | Concise, punchy | First-person peer | Inverted pyramid |
| Skill (AI) | Imperative instructions | Direct instructional | Modular |
| Course module | Narrative + exercises | First-person teacher | Sequential build |

---

## The AIMM Skill Integration

If the AIMM writing team skill is available, invoke it explicitly:

> "Act as AIMM-Writing-Team to research, strategize, write, edit, and publish 
> a [format] on [methodology name] for [target audience]. Voice: [specified voice]. 
> Target length: [word count]. Run all five roles sequentially with reflection 
> scores at each stage."

The AIMM skill handles role coordination automatically. The Eigenthinking context 
(methodology, reframe, compressed versions, competitive framing) should be passed 
as input to the AIMM Researcher role to ground the production in the actual IP.
