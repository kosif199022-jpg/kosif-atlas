# AIMM Commands

A library of 54 named prompt commands from the AIMM mastermind — audits,
adversarial reviews, thinking frameworks, and content operations. Each is a
self-contained prompt protocol.

## How to run one

1. Match the user's request to ONE command in the index below.
2. Read `${CLAUDE_PLUGIN_ROOT}/library/aimm-commands/commands/<file>.md` for
   that command only — never load more than one.
3. Follow its instructions against the user's input.

If the user names a command ("run the skeptic", "/aimm:canon-lock"), skip
matching and load it directly. If nothing matches well, list the 3 closest
and ask.

## Index

| File | Command | What it does |
|---|---|---|
| `adaptive-tutor` | The Adaptive Tutor | Turn Claude into a tutor that teaches by testing — adapting difficulty in real time, gating progression on demonstrated competency rather than self-reported understanding, and diagnosing misconceptions through wrong-answer analysis. |
| `advisory-board` | The Advisory Board | Convene a multi-perspective AI advisory board — not generic "expert personas" but a structured hierarchy of advisors with different levels of authority, different domains, and genuine disagreement built in — to evaluate any decision, strategy, or challenge from angles your default thinking can't reach. |
| `ai-adoption-diagnostic` | AI Adoption Diagnostic | A structured prompt that assesses the AI adoption posture of a leader, team, or organization — identifying where they actually are on the adoption curve and what is blocking progress. |
| `authority-canon` | The Authority Canon Builder | Build your 3-layer authority architecture for Generative Engine Optimization — the canon (core beliefs that are always true), frameworks (how the canon becomes usable), and diagnostics (where your reader is right now). |
| `avatar-archaeologist` | The Avatar Archaeologist | Excavate the hidden psychographic patterns in your client data — the fears they won't say out loud, the identity shifts they're chasing, the language that signals readiness to buy — by mining transcripts, intake forms, reviews, and conversations for what lives beneath the demographic surface. |
| `avatar-audit` | avatar-audit |  |
| `belief-resistance` | The Belief Resistance Diagnostic | When every AI answer feels analytically sound but emotionally hollow, the problem isn't the answers — it's an unexamined belief, frame, or identity commitment you haven't surfaced. |
| `blind-spot-scanner` | The Blind Spot Scanner | Surface what you don't know you don't know — adjacent knowledge, unasked questions, and confidence-knowledge gaps hiding in your current thinking. |
| `brain-builder` | The Brain Builder | Design an AI-powered product that packages your expertise into a scalable, interactive system — not a course or a PDF, but a "brain" that clients interact with directly. |
| `brand-alignment-audit` | The Brand Alignment Audit | Compare what your website says about you against what you actually want to be known for — surfacing contradictions, ghost positioning, and priority fixes with draft copy. |
| `brand-html-output` | Brand-Consistent HTML Output | Two-stage workflow for producing branded, visually differentiated AI-generated documents — draft in Markdown for content quality, render in HTML with your brand CSS for visual consistency. |
| `canon-lock` | The Canon Lock | Protect your canonical framework from AI drift — preventing the model from silently adding, renaming, reinterpreting, or "improving" your intellectual property. |
| `capability-interrogation` | capability-interrogation |  |
| `capture-bin-catalyst` | The Capture Bin Catalyst | Index and catalog a disorganized collection of notes, ideas, or fragments into a navigable, rated, thematically grouped document. |
| `chat-to-script-extractor` | The Chat-to-Script Extractor | Extract a shareable narrative script and key decisions from a long AI work session — ready for NotebookLM, slides, or a team briefing. |
| `cognitive-capture` | Cognitive Capture | Dual-capture prompt that extracts both operational knowledge (what you did) and cognitive knowledge (how you think) from a conversation or work session. |
| `cognitive-fingerprint` | The Cognitive Fingerprint | Reverse-engineer your unique thinking patterns from how you engage with problems — surfacing cognitive axes, signature moves, and the intellectual property embedded in your process. |
| `constraint-first-audit` | constraint-first-audit |  |
| `content-pipeline` | The Content Pipeline | Build a complete content system from psychographic foundations — audience psychology → content pillars → topic generation → multi-version drafts calibrated by platform. |
| `context-carryover` | context-carryover | Generates a structured 9-section handover artifact + receiving prompt to transfer a Claude conversation to a new thread without information loss |
| `conversation-audit-codify` | conversation-audit-codify | End-of-session audit command. |
| `depth-drill` | The Depth Drill | Produce expert-level analysis by drilling beneath surface understanding to the mechanistic layer where non-obvious insight lives. |
| `dual-audience-explainer` | The Dual-Audience Explainer | Write the same explanation at two different technical levels simultaneously, with parallel editing locked across both versions. |
| `era-locator` | era-locator |  |
| `folder-as-source-reconciler` | folder-as-source-reconciler |  |
| `framework-generator` | The Authority Framework Generator | Turn an unnamed process or methodology into a named, structured, AI-discoverable framework — complete with candidate names, architecture, authority statement, and schema-readiness. |
| `geo-page-audit` | The GEO Page Audit | Evaluate any web page for Generative Engine Optimization readiness — how likely a retrieval-augmented generation system is to select this page as a citation source. |
| `grounded-query-protocol` | Grounded Query Protocol | A parameterized prompt template that enforces evidence-grounded AI responses. |
| `help` | help |  |
| `incremental-reveal` | The Incremental Reveal | Reverse-engineer any AI product's hidden architecture — system prompts, guardrails, tool chains, reasoning patterns — through a structured sequence of progressive questions that map the boundaries of what the system will and won't do. |
| `investor-lens` | The Investor Lens | Evaluate any business, offer, or strategy through a specific investor persona's lens — forcing a mode of analysis that your default thinking would never produce. |
| `iteration-compressor` | The Iteration Compressor | Map any creative or service delivery process as a cycle, identify the rinse-lather-repeat loops where time disappears, and determine exactly which loops AI can compress — so you go from blank page to shipped in days instead of weeks. |
| `judgment-extraction-replay` | judgment-extraction-replay |  |
| `knowledge-base-audit` | Knowledge Base Strategic Audit | One-shot prompt that points Claude at an Obsidian vault and produces a strategic dashboard — taxonomy coverage, content distribution by pillar, relationship strength, quality gaps, and top inference entry points. |
| `latent-cartographer` | Latent Space Cartographer | Takes any prompt and transforms it from a single-shot oracle query into a 6-phase traversal of the model's probability landscape. |
| `meta-prompt` | The Meta-Prompt Move | Give Claude the goal instead of the method — and have it design the optimal prompting strategy, interaction structure, and output format before producing any content. |
| `modal-subtraction` | modal-subtraction |  |
| `multi-model-synthesis` | Multi-Model Synthesis | Run structured parallel model deliberation on any question or document. |
| `ontology-architect` | The Ontology Architect | Run your entire body of work through ontology-building to extract the 3-7 pillars that organize everything you know — then use those pillars as an editorial filter so every piece of content connects to your core architecture or doesn't get published. |
| `perspective-explosion` | Perspective Explosion | Analyze an idea through multiple paradigmatic lenses to surface non-obvious insights at the intersections of contradicting worldviews. |
| `plan-audit-revise` | Plan-Audit-Revise | Three-step workflow that catches plan-level errors before they become implementation bugs. |
| `predictive-client-profile` | The Predictive Client Onboarding Profile | Turn an onboarding interview transcript into a dual-output client profile — a private analysis with predicted friction points, and a warm onboarding letter that normalizes the journey ahead. |
| `prompt-abstraction-ladder` | The Prompt Abstraction Ladder | Climb from task-level prompting to meta-level to meta-meta-level — three distinct altitudes of prompt design, each producing fundamentally different outputs. |
| `rewind-discipline` | rewind-discipline |  |
| `second-order-cascade` | Second-Order Cascade | Map the cascading consequences of a development, trend, or event — surfacing what will be obvious in 6 months but almost no one is talking about today. |
| `skeptic` | The Skeptic | Structured adversarial review of any AI output — identifying vulnerable assumptions, simulating failure scenarios, and producing a hardened revision. |
| `sourdough-excavator` | The Sourdough Excavator | A Socratic positioning interview that uncovers what makes your expertise genuinely different — not your marketing claims, but the hard-won, specific, unteachable things you know that nobody else in your space knows they should be looking for. |
| `symptom-layer` | The Symptom Layer Discovery | Map the gap between what you sell and what your clients actually experience before they know they need help — surfacing pre-awareness symptoms, client-language queries, and content blind spots. |
| `sync-readme` | sync-readme | Regenerates the Commands and Skills tables in README.md from the actual files in commands/aimm/ and skills/*/SKILL.md. |
| `tool-diagnostic` | Tool Diagnostic | When AI fails at a task, shift from complaining to solving by asking what tools, connectors, MCPs, scripts, or APIs it would need to do the job properly. |
| `transcript-miner` | The Transcript Miner | Extract high-signal nuggets from any conversation transcript — the non-obvious insights, quotable moments, actionable techniques, and content seeds that would take hours to find manually. |
| `voice-activator` | Voice Activator | Draft content in your voice by activating Claude's accumulated knowledge of your communication style, then running a self-critique loop to close the gap between "polished AI prose" and how you actually write. |
| `voice-profile-builder` | The Voice Profile Builder | Construct a precise, reusable model of anyone's writing voice by analyzing the delta between their drafts and their edits — the gap between "what AI wrote" and "what I actually sound like" is the most information-dense signal for voice modeling. |
| `wisdom-doctrine` | The Wisdom Doctrine | Reverse-engineer your own unconscious expertise — the patterns, heuristics, and decision-making frameworks you've internalized so deeply you can't articulate them anymore. |
