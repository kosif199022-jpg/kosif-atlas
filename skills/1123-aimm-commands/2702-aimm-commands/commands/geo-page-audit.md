---
name: The GEO Page Audit
type: command
description: Evaluate any web page for Generative Engine Optimization readiness — how likely a retrieval-augmented generation system is to select this page as a citation source.
source: multiple — Jan 8, 2026 AIMM session on GEARS and AI-optimized schema
trigger: /aimm:geo-page-audit
location: wiki/mastermind/commands/
source-sessions:
  - 2026-01-08_Mastermind
---

# The GEO Page Audit

Evaluate any web page for Generative Engine Optimization readiness — how likely a retrieval-augmented generation system is to select this page as a citation source. From the AIMM session on GEARS and AI-optimized schema (Jan 8, 2026).

---

You will evaluate a web page for GEO readiness — specifically, how likely a retrieval-augmented generation system is to select this page as a citation source when a user asks a question in this page's domain.

PAGE TO EVALUATE: $ARGUMENTS

If no page was provided above, ask me to paste the page content or URL before proceeding.

MY EXPERTISE DOMAIN: [YOUR NICHE — e.g., executive coaching for mid-career transitions. Say "you decide" to have the AI infer from the page content]
MY PRIMARY AUDIENCE: [WHO YOU SERVE — e.g., HR directors at Fortune 500 companies. Say "you decide" to have the AI infer from the page content]

If any parameter says "you decide," infer the most reasonable value from the page content provided, state your inference, and proceed. I'll correct if needed.

---

STEP 0 — ROLE SELECTION:
Assess the page type (landing page, article, about page, service page, resource page) and adopt the evaluation lens that matters most for that type:
- Conversion/sales page → evaluate as a CONTENT STRATEGIST focused on the tension between human persuasion copy and machine-readable authority signals. Key question: can an AI extract citable claims without being confused by marketing language?
- Article/blog → evaluate as a RETRIEVAL SYSTEMS ENGINEER focused on entity density, structural parsability, and answer-readiness. Key question: does this page beat competitors for citation selection?
- About/bio page → evaluate as an ENTITY RECOGNITION SPECIALIST focused on whether AI systems can construct a clear knowledge graph node for this person. Key question: would an AI know exactly what to say about you and when to recommend you?
State which lens and why.

---

STEP 1 — ENTITY & AUTHORITY SCAN:
Map every entity: people, organizations, frameworks, methodologies, credentials, outcomes, and relationships. Assess:
- How many are NAMED and SPECIFIC vs. generic? ("The Catalyst Framework" vs. "our unique approach")
- Which signal ORIGINAL intellectual property vs. commodity expertise?
- What entity relationships could an AI use to construct knowledge graph edges? (e.g., "[Person] created [Framework] which produces [Outcome] for [Audience]")

---

STEP 2 — STRUCTURAL PARSABILITY:
Evaluate how easily a language model can extract structured answers:
- Is there a clear primary claim within the first 150 words?
- Do headings function as matchable queries?
- Are there FAQ, definition, or claim-evidence-outcome patterns?
- Identify the single best paragraph for direct AI citation, and the worst. Explain each.

---

STEP 3 — CITATION COMPETITIVENESS:
For 3 realistic queries a potential client would ask an AI assistant in this domain:
- Generate the query as a user would actually phrase it
- Assess whether this page would be selected over generic competitors (Forbes, Wikipedia, well-known competitor pages)
- Name the specific signal deficit that costs the citation

---

STEP 4 — VERIFICATION:
Check your own work:
- Is each finding genuinely about AI retrieval, or general content marketing advice wearing a GEO label? Remove anything that only matters for human readers.
- Are you pattern-matching from generic SEO checklists rather than reasoning about RAG citation selection? Flag findings below 80% confidence.
- Did you evaluate writing quality when you should have evaluated machine-parsability? A beautifully written page with no extractable entities fails GEO.

---

STEP 5 — PRIORITY REMEDIATION:
5 fixes, rank-ordered by impact on citation probability. For each:
- THE GAP (one sentence)
- THE MECHANISM — how this gap reduces citation probability (the retrieval-system reason, not "it's important")
- DRAFT COPY — the actual replacement paragraph, heading, FAQ entry, or schema markup

Apply additional evaluation criteria you detect as relevant based on the specific page content — including but not limited to schema.org markup opportunities, llms.txt configuration, internal linking patterns, and answer-box formatting.

QUALITY GATE — before delivering, verify:
☐ Every finding is GEO-specific (not recycled SEO advice)
☐ Every fix includes draft copy, not vague guidance
☐ The 3 simulated queries are realistic AI-assistant questions
☐ Correct evaluation lens for this page type
Revise any that fail before delivering.

## Source

- [[wiki/mastermind/sessions/2026-01-08_Mastermind]] (multiple — GEARS and AI-optimized schema)
