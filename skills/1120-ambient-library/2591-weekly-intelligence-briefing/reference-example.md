# Reference Example — Week of April 24–30, 2026

This is a verbatim copy of an existing Weekly Intelligence Briefing, used as a stylistic and structural anchor when generating new ones. Match this voice, depth, and shape.

**Source URL:** https://www.notion.so/353be0e844bb8193afd3ffb6af85d5a6

---

# Week of April 24–30, 2026 — Intelligence Briefing

> **For AIMM Members** — This report covers Lou's active R&D sessions from the past week. Emphasis on projects that produced tools, frameworks, and assets you can put to work immediately. Sessions marked ⭐ have high direct member value.

---

## 🗂 At a Glance

| Session | Topic | Member Relevance |
|---|---|---|
| Apr 24 | Folder as Harness — Concept Articulation + Memory | ⭐ Foundational ambient intelligence architecture |
| Apr 24 | Ambient Intelligence Framework (AIF) v0.1 Spec | Architecture specification — 16 sections |
| Apr 24 | AgentLibrary / Resource Library Build | AI capability management infrastructure |
| Apr 24 | AIMM Teaching Block Orientation | ⭐ Teaching series kickoff for AIMM members |
| Apr 24–30 | Ambient Folder Template — Deployable Scaffold | ⭐ Ready-to-use harness template |
| Apr 25 | robots.txt AI Bot Reference | GEO / AI visibility infrastructure |
| Apr 29–30 | /teaching-block Skill Build + Article | ⭐ Content production methodology |

---

## 🔑 This Week's Big Themes

**1. The "Folder as Harness" is the implementation pattern behind ambient intelligence.** The concept that crystallized this week: a harness is everything an LLM needs except the LLM itself — identity, memory, skills, tools, governance, data. When a folder is intentionally built with this architecture, dropping an LLM into it produces a domain-aware agent immediately. Do this for every folder on your system and intelligence becomes *ambient* — structural, not session-bound.

**2. Portability forces you to find the true core.** When you ask "what if this folder needs to work on OpenAI, Gemini, or a local model, not just Claude?" — the exercise forces precision. The answer this week: intelligence lives in universal plain-text files; runtimes are thin adapter shims. This separation produced the cleanest version of the scaffold yet.

**3. AGENTS.md is the open standard — and that matters for your builds.** Confirming that AGENTS.md (agents.md.org) is a vendor-neutral, cross-tool convention — recognized natively by OpenAI Codex, Cursor, Aider, and others — means the operational driver you put in your folders works across every agentic tool without adaptation. The Claude-specific CLAUDE.md becomes a thin shim, not the brain.

**4. Show-and-tell beats narrative for teaching.** The /teaching-block skill took three iterations to land, and the gap between iteration 1 and iteration 3 is a transferable insight: optimizing for narrative quality works against replicability. The format that produces teaching with transfer value is first-person past tense, wrong-path-first structure, and verbatim artifacts over description.

---

## 📦 Project Deep Dives

### 1. Folder as Harness + Ambient Intelligence Framework ⭐ HIGH MEMBER VALUE

**Session:** Ambient Intelligence — Founding Session + multiple iterations
**Output:** `AmbientIntelligence/Ambient-Intelligence-Framework-v0.1.md` (v0.1.1, 16 sections)

The session started from a question: *"Do you remember my ambient intelligence concept?"* — and the answer was scattered across memory. This week, the concept was formally articulated, named, and stored.

**The core logic chain:**

- A **harness** = everything but the LLM (context, memory, tools, skills, identity, data)
- A **folder** built intentionally = a harness for a specific domain
- Drop an LLM into it → it becomes a capable, domain-aware agent immediately
- Apply this pattern to **every folder** → intelligence is no longer session-bound
- The computer itself becomes the cognitive architecture — intelligence is **ambient** because it lives in the filesystem structure, not in any single conversation

This is distinct from "organized folders" by intentionality: you're designing for LLM instantiation from the start.

[... full deep dive continues with bulleted principles, tables, and concrete artifact references ...]

---

### 2. Ambient Folder Template — Deployable Scaffold ⭐ HIGH MEMBER VALUE

**Session:** Ambient Intelligence — multiple iterations through Apr 30
**Output:** `ambient-folder-template/` — 21 files, fully documented and deployable

This is the *usable artifact* — not a spec, but an actual folder template you can copy-paste and inhabit immediately.

**What's in the template:**

| File | Purpose |
|---|---|
| `README.md` | Human-facing guide: concept, architecture, quick start |
| `ARCHITECTURE.md` | Full technical spec: layer model, interface schema, cascade resolution |
| `harness.yaml` | Manifest — name, version, layers, runtimes, memory-curation mode |
| ... | ... |

[Each deep dive: 400–800 words, opens with session + output, then narrative + tables + concrete examples + actionable "to use" closer.]

---

## 🔧 Operational Sessions

### GEARS Client Work

**Don Back — PhD Career Academy** — Ongoing. Brand guidelines, content strategy, core search queries, ideal client handbook, URL structure, keyword topic map, testimonials collection all in place.

**Kasimir Hedström — MindMastery / Sovereign Performance** — Phase B continuation. Canonical brand copy assets at four length tiers (150w, 300w, long-form, story asset system). MindMastery ontology activation pending Kasimir's final term approvals from prior week.

**James Wheaton** — Platform setup templates from the prior week in place. Ongoing.

[Operational sessions: 2–3 sentences each. Grouped by client. No fluff.]

---

## 🧰 Assets Available This Week

| Asset | Description | Status |
|---|---|---|
| Ambient Intelligence Framework v0.1.1 | 16-section spec — full architecture | In AmbientIntelligence/ folder |
| Ambient Folder Template (21 files) | Deployable harness scaffold — copy + run | In ambient-folder-template/ |
| AgentLibrary | 5 agents, 5 skills, registry | In AgentLibrary/ |
| compoundingArchitectureSeries.zip | AIMM teaching series (orientation + 3 blocks) | Ready to distribute |
| /teaching-block skill | Converts any session into a teaching article | Live command |

---

## 🔭 Watch List — Developing Threads

- **AIF v0.2** — Deferred items: background/event-driven invocation, multi-user/shared folders, worked end-to-end example, A2A pipeline communication design
- **AGENT_LIBRARY_PATH global placement** — Needs manual edit to `~/.claude/CLAUDE.md`; blocked by write permissions in session, requires user action
- **AIMM Teaching Block Series** — Orientation done, 3 blocks ready as zip. Potential to run as a structured AIMM release sequence
- **MindMastery Phase B** — Awaiting Kasimir's approval on 11 term definitions + 7 proposed psych nodes before any database activation
- **Cognitive Twin** — Run 3 calibration at ~0.78. Run 4+ unlocks consultative mode

---

*Generated from active Cowork sessions — April 24–30, 2026.*
*Compiled for AIMM members.*

---

# Style Notes (extracted from this example)

- **Practitioner-direct.** No "in this report we will" framing. Open with substance.
- **Point of view.** Take positions. "Show-and-tell beats narrative" — not "show-and-tell may be effective."
- **Concrete artifacts everywhere.** Every deep dive names the actual file path or output name.
- **⭐ markers** signal high member value. Use sparingly — typically 3–5 per week.
- **Themes are claims, not summaries.** Each Big Theme should be a transferable insight, written as an assertion.
- **Deep dives open with Session + Output**, then narrative, then end with "how to use" / "to start" — actionable closer.
- **Operational sessions are deliberately brief** — 2–3 sentences each. Client name bolded.
- **Assets table is the goods.** This is what members scan first. Be specific about status.
- **Watch List names blockers and next moves.** Not aspirations — concrete developing threads.
- **Footer is fixed format.** Two lines, italic. Date range + "Compiled for AIMM members."
