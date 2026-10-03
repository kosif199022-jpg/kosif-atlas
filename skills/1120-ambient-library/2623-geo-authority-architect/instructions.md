# GEO Authority Architect

## What This Skill Does

GEO (Generative Engine Optimization) is the practice of making your intellectual authority legible to AI engines — so that when someone asks ChatGPT, Claude, or Perplexity for a recommendation or explanation in your domain, your name and framework appear.

This skill guides practitioners through the **upstream strategic architecture** for GEO authority: the work that happens before you deploy pages, generate schema, or publish optimized content. It takes you from a practitioner with intuitive expertise to one with a named, structured, machine-readable body of knowledge.

**The core finding from 13 months of reverse-engineering** (July 2025 – March 2026, 8 mastermind sessions): AI engines cite practitioners who have a consistent, named point of view expressed across multiple content assets. They do not reward the most recent post, the most viral piece, or the most technically optimized page. They reward coherent thinking expressed repeatedly. As Don Back put it on December 19: *"GEO rewards coherent thinking expressed repeatedly, not clever posts."*

The content topology metaphor from January 29 is the most useful frame: think of your authority as a tree. The trunk is your Canon — your always-true beliefs about how your domain works. The main branches are your named Frameworks — structured approaches you teach and operationalize. The leaves are your content. Without the trunk and branches, the leaves blow away. This skill builds the trunk and branches.

**What this skill is not:**
- It is not a page-level audit (use `aimm:geo-page-audit` for that)
- It is not schema generation or GEO monitoring (use `anthropic-skills:gears` for that)
- It is not a one-step Canon definition exercise (use `aimm:canon-lock` for that)
- It is not a symptom vocabulary deep-dive (use `aimm:symptom-layer` for that)

**What this skill covers:** the strategic architecture gap between those tools — Canon through Frameworks, Diagnostics, and a content topology — as a guided discovery conversation.

---

## Before You Start

This skill is a **guided strategic conversation**, not a form to fill out. The practitioner should be talking through their thinking; the skill asks clarifying questions and synthesizes the answers into structured outputs.

The full process takes 3–6 hours spread across multiple sessions. You do not need to complete all phases in one sitting. Each phase produces a standalone output that has value on its own.

**If you have already run `aimm:canon-lock`:** import that output and begin at Phase 2. Phase 1 is a streamlined version of the same process.

---

## The 6-Phase Workflow

### Phase 1 — Canon Extraction

**Time estimate: 45–90 minutes**

*(Skip to Phase 2 if you have already completed `aimm:canon-lock`.)*

Canon is the set of statements you believe are permanently and unconditionally true in your domain. Not opinions. Not trends. Not tactical advice. Foundational premises — the kind of thing you would stake your professional reputation on being true in 10 years.

**The process:**

Start by asking the practitioner: *"What do you believe about your domain that most practitioners in your field would disagree with, or have not yet named?"* This is often a faster path to Canon than asking "what do you believe?" — because the contrast to conventional wisdom forces specificity.

Work toward 3–7 Canon statements. For each candidate, apply the test: *"Would I stake my professional reputation on this being true in 10 years?"* If yes, it belongs in the Canon. If it depends on current technology, market conditions, or client preferences — it is not Canon.

**Common mistakes to catch in this phase** (see full section below): most practitioners initially surface opinions, observations, or tactics, not Canon. Push back gently but persistently.

**Output:** A numbered Canon document.

**Example Canon statements (from group sessions):**

> 1. Practitioners who own their expertise outlast those who rent it.
> 2. Trust is built through a track record of repeated accurate prediction, not through credentials.
> 3. The client's symptom vocabulary is always different from the practitioner's root-cause vocabulary — bridging this gap is not marketing, it is epistemological work.

---

### Phase 2 — Framework Inventory

**Time estimate: 60–90 minutes**

For each Canon element, identify: what is the framework or methodology that operationalizes this belief?

A framework is a **named, repeatable approach**. It has a name, a clear domain, a sequence or structure, and produces a defined output. It is teachable. You can hand it to a junior practitioner and they can follow it.

For each framework the practitioner identifies, assess:
- **Named or unnamed?** (Unnamed frameworks are the most important moment of IP crystallization in this process — naming is the work)
- **Documented or undocumented?**
- **Fully developed, in progress, or just intuited?**
- **Associated Canon element?**

**A note on unnamed frameworks:** The Framework Inventory often reveals that practitioners have 3–5 methodologies they use instinctively but have never named. They describe them as "how I approach X" or "the process I use when Y." These are your most valuable raw material. Naming them is not branding — it is IP crystallization. A named framework can be cited by an AI engine; an unnamed intuition cannot.

**Output:** A Framework Registry.

**Example Framework Registry (partial):**

| Framework Name | One-sentence description | Status | Canon Element |
|---|---|---|---|
| The Trust Stack Audit | A 4-step diagnostic that measures a practitioner's credibility architecture across four trust layers. | Documented, in progress | Canon #2 |
| The Operator-to-Strategizer Model | A transition framework for practitioners moving from execution to advisory roles. | Named, undocumented | Canon #1 |
| The Three Returns | A decision framework for evaluating AI investment across financial, reputational, and capability returns. | Documented | Canon #3 |

---

### Phase 3 — Diagnostic Identification

**Time estimate: 45–60 minutes**

A diagnostic is a tool that helps a potential client assess their current state relative to a framework's ideal outcome. It answers the question: *"Where am I in this transformation?"*

For each key framework, identify or design a diagnostic: a set of 5–10 questions whose answers reveal where the client sits in the practitioner's transformation map.

The diagnostic is critical for GEO because it creates a distinct, citable artifact — a specific named assessment that no other practitioner has. AI engines can reference "Take the Trust Stack Audit" as a next step recommendation. They cannot reference "think about whether you trust yourself."

**For each diagnostic candidate, capture:**
- The central self-assessment question (the one question that, answered honestly, reveals the most)
- The associated framework
- The current state of development (exists / needs building / exists under a different name)
- The form it would take (self-scored questionnaire, interview protocol, scored assessment, etc.)

The December 12 session demonstrated this in practice: Lou's GEO app generates an ICH (Ideal Client Handbook) as the diagnostic layer, using verbatim VOC (Voice of Customer) quotes to make the pain recognition visceral. The diagnostic works because it uses the client's own language to describe the problem — before prescribing the framework's solution.

**Output:** A Diagnostic Candidate List with framework links and central self-assessment questions.

---

### Phase 4 — Symptom Vocabulary Map

**Time estimate: 30–45 minutes**
*(For deep work on this phase, use `aimm:symptom-layer`)*

Clients search using symptom language, not root-cause language. A practitioner who publishes only root-cause content — the solution, the framework, the methodology — is invisible to the client who hasn't yet diagnosed their own problem.

This phase maps the gap between the practitioner's expert vocabulary and the client's pre-diagnosis vocabulary.

**For each key framework, generate:**
- 5–10 questions a potential client would type into Google or ask an AI engine BEFORE knowing the practitioner's framework existed
- A coverage check: which of these symptom questions has an existing content asset?
- A gap list: which symptom questions have no coverage?

**Example (for a leadership coaching practice):**

Framework: The Operator-to-Strategizer Model

| Symptom-level question | Coverage status |
|---|---|
| "Why do I feel exhausted even when results are good?" | No coverage |
| "How do I stop being the bottleneck in my own business?" | Draft article exists |
| "Why do my team members keep coming to me for decisions?" | No coverage |
| "Am I ready to hire a second-in-command?" | LinkedIn post, thin |
| "What does it mean to work on the business not in it?" | No coverage |

**Output:** A symptom vocabulary map with coverage status by framework.

---

### Phase 5 — Content Topology Design

**Time estimate: 60–90 minutes**

With the Framework Registry and Symptom Map in hand, design a content topology — the full architecture of content assets that will make your authority machine-readable.

**The four content types:**

1. **Canonical articles** (1 per framework): The definitive treatment of each framework. 2,000+ words. Evergreen. This is the piece that gets cited. It explains the framework from first principles, names the problem it solves, walks through the structure, and provides a worked example. Priority: highest.

2. **Diagnostic articles** (1–2 per framework): "Are you [problem]? Here's how to tell." These take the diagnostic from Phase 3 and present it as an article. They use the self-assessment questions as the structure. They serve clients who are looking for a way to evaluate their current state.

3. **Symptom articles** (1 per symptom cluster): Entry-level content for clients who don't yet know the framework name. Written in symptom vocabulary, not expert vocabulary. These are the top-of-funnel content that makes the practitioner findable before the client knows what they're looking for.

4. **Evolution posts** (weekly): Shorter pieces that show the framework developing, responding to real cases, or incorporating new evidence. These generate the temporal activity signal — AI engines weight recency, and showing a framework evolving publicly signals active authority. The January 29 session established this: publish unfinished frameworks now and evolve them publicly. You do not have to wait until the framework is perfect.

**For each content asset, specify:**
- Type (canonical / diagnostic / symptom / evolution)
- Associated framework
- Target query (what question should this asset answer for an AI engine?)
- Current status (exists / needed / draft)
- Estimated word count
- Priority tier (1 = canonical articles; 2 = diagnostics; 3 = symptom articles; 4 = evolution posts)

**Produce a 24-week publishing plan**, sequenced by authority impact:
- Weeks 1–8: Canonical articles (1 per framework, highest-priority frameworks first)
- Weeks 9–16: Diagnostic articles and highest-gap symptom articles
- Weeks 17–24: Remaining symptom articles + ongoing evolution posts throughout

**Output:** A content topology table and a 24-week publishing plan with priorities.

---

### Phase 6 — GEO Authority Blueprint

**Time estimate: 30–45 minutes**

Synthesize all five phases into a single 1-page GEO Authority Blueprint: the practitioner's complete GEO strategy on one document.

**The blueprint contains:**

1. **Canon** — Numbered list of 3–7 Canon statements
2. **Framework Registry** — Table: name, one-sentence description, status, Canon element
3. **Diagnostic List** — Framework link, central question, development status
4. **Top 3 symptom vocabulary gaps** — The three highest-impact uncovered symptom questions
5. **24-week content plan** — First 8 weeks in detail (title, type, target query, word count, priority); weeks 9–24 summarized by tier
6. **Next step for GEARS** — A brief note on what schema generation needs from this blueprint: the canonical article URLs (once published), the framework names (for structured data markup), and the diagnostic names (for FAQ schema)

**Output:** A complete GEO Authority Blueprint, ready to share with a content team or hand off to `anthropic-skills:gears` for schema deployment.

---

## How This Connects to Existing Tools

| Tool | What it covers | Relationship to this skill |
|---|---|---|
| `aimm:canon-lock` | Defines the practitioner's Canon beliefs — the foundational, always-true statements | Replaces Phase 1 if already completed. Import its output and start at Phase 2. |
| `aimm:symptom-layer` | Deep-dives on the vocabulary clients use before they know they need the practitioner | Extends Phase 4. Use symptom-layer for thorough symptom vocabulary generation; this skill uses the output to map coverage and identify gaps. |
| `aimm:geo-page-audit` | Audits individual GEO pages that already exist | Downstream from this skill. Once canonical articles are published, run geo-page-audit to assess their GEO performance. |
| `anthropic-skills:gears` | Schema deployment, GEO monitoring, full GEARS system | The logical next step after this skill. The GEO Authority Blueprint (Phase 6) feeds directly into GEARS schema generation. |

**Sequencing recommendation:**
1. Run this skill (geo-authority-architect) to build the strategic architecture
2. Publish canonical articles (the content topology from Phase 5)
3. Run `anthropic-skills:gears` to deploy schema and begin GEO monitoring
4. Run `aimm:geo-page-audit` on published canonical articles to audit and refine

---

## Common Canon Mistakes

### Mistake 1: Surfacing opinions as Canon

**What it looks like:** "I believe AI is transforming every industry." "Clients today expect faster results than they did five years ago."

**Why it's not Canon:** These statements are time-dependent. They may be true today and false in three years. Canon has to be permanently, unconditionally true — the kind of claim that holds regardless of market conditions, technology shifts, or client preferences.

**The fix:** Ask: "Would this have been true 20 years ago? Will it be true 20 years from now?" If the answer to both is yes, it is closer to Canon. If it depends on "today" or "currently," it is an observation, not a principle.

---

### Mistake 2: Confusing tactics with frameworks

**What it looks like:** "My framework is to always start a coaching engagement with a 360 assessment." "I use a discovery call process with 7 questions."

**Why it's not a framework:** A tactic is a specific action. A framework is a structured, reusable approach with a name, a domain, a sequence, and a defined output. Tactics can live inside frameworks, but they are not frameworks themselves.

**The fix:** Ask: "If someone else followed this process with a different client, would they get the same type of outcome — even if the specific content was different?" If yes, it may be a framework. If not, it is a tactic.

---

### Mistake 3: Treating values as Canon

**What it looks like:** "I believe in treating every client with respect." "My Canon is integrity, excellence, and service."

**Why it's not Canon:** Values are not domain beliefs. Canon is specific to how the practitioner's domain works — what causes what, what works and what doesn't, what the client's real problem is versus the stated problem. Values are the operating system; Canon is the domain expertise.

**The fix:** Ask: "What do I know about [my specific domain] that most people in my field have not yet named or proven?" This question reliably surfaces domain-specific Canon rather than generic professional values.

---

### Mistake 4: Making Canon too narrow

**What it looks like:** "My Canon statement is: The 7-step framework I developed in 2019 is the most effective way to onboard new executive coaching clients."

**Why it's too narrow:** This is a description of a specific product, not a foundational belief. Canon should be broad enough to generate multiple frameworks. If a Canon statement only generates one tactic, it is probably a framework element, not a Canon statement.

**The fix:** Ask: "What is the more general principle behind this?" Move up one level of abstraction until the statement describes a mechanism, not a product.

---

## Example: Partial GEO Authority Blueprint

The following is a partial example showing what Phase 6 output looks like for a leadership coaching practice. (Abbreviated for illustration.)

---

**GEO Authority Blueprint — Alex Chen, Executive Leadership Coach**

**Canon:**
1. Leaders who build systems that run without them are the only ones who can scale their impact.
2. Trust between leaders and their teams is destroyed faster by inconsistency than by any single mistake.
3. The transition from operator to strategist is the hardest and most commonly botched shift in a leader's career.

**Framework Registry:**

| Framework | Description | Status | Canon |
|---|---|---|---|
| The Operator-to-Strategizer Model | A 5-stage transition framework for leaders moving from execution to advisory roles | Documented | #3 |
| The Trust Stack Audit | A diagnostic that measures credibility architecture across 4 trust layers | Named, partial doc | #2 |
| The System Dependency Score | A scorecard for measuring how much a business depends on the founder's presence | Undocumented | #1 |

**Top 3 symptom vocabulary gaps:**
1. "Why do I feel like I can never take a vacation without things falling apart?" (maps to System Dependency Score — no content asset)
2. "How do I stop being the smartest person in every meeting?" (maps to Operator-to-Strategizer Model — no content asset)
3. "Why does my team keep waiting for me to make decisions?" (maps to Trust Stack Audit — thin coverage only)

**First 8 weeks (canonical articles):**

| Week | Title | Type | Target query | Word count |
|---|---|---|---|---|
| 1 | The Operator-to-Strategizer Model: A Field Guide | Canonical | "how to transition from operator to strategist as a leader" | 2,200 |
| 2 | The Trust Stack Audit: Four Layers of Leader Credibility | Canonical | "how leaders build credibility with their teams" | 2,000 |
| 3 | The System Dependency Score: How to Measure Your Own Replaceability | Canonical | "how to build a business that runs without you" | 2,100 |
| 4–5 | Diagnostic: Are You Still Operating When You Should Be Strategizing? | Diagnostic | "signs you're a bottleneck in your own business" | 1,400 |
| 6 | Why Vacations Reveal Your Real Leadership Problem | Symptom | "can't take a vacation without things falling apart" | 900 |
| 7 | How to Stop Being the Smartest Person in Every Meeting | Symptom | "leader always in every decision" | 950 |
| 8 | Evolution: What the Operator-to-Strategizer Model Looks Like in Practice | Evolution | "leadership transition real examples" | 800 |

**Next step for GEARS:** Once canonical articles are published, run `anthropic-skills:gears` with the following inputs: canonical article URLs (3), framework names (The Operator-to-Strategizer Model, The Trust Stack Audit, The System Dependency Score), and diagnostic name (The Trust Stack Audit) for FAQ schema markup.

---

*Score: 75/100 across 8 sessions spanning July 2025 to March 2026. Key contributors: Lou, Don Back, Dirk (whose organic ChatGPT citation in July 2025 initiated the group's 13-month GEO research project), PowerUp Coaching mastermind group.*
