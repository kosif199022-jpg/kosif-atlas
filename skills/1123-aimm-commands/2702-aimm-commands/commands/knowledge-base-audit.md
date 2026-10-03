---
name: Knowledge Base Strategic Audit
type: command
description: One-shot prompt that points Claude at an Obsidian vault and produces a strategic dashboard — taxonomy coverage, content distribution by pillar, relationship strength, quality gaps, and top inference entry points.
source: Kasimir Hedström — 2026-05-07 Mastermind, Obsidian knowledge graph demo
trigger: /aimm:knowledge-base-audit
location: wiki/mastermind/commands/
source-sessions:
  - 2026-05-07_Mastermind
---

# Knowledge Base Strategic Audit

## Purpose

Produces a one-shot strategic audit of an Obsidian vault (or any structured Markdown knowledge base). Instead of searching for specific topics, this prompt tells Claude to analyze the knowledge base as a whole — surfacing what's well-represented, what's missing, where relationships are weak, and which notes are the highest-value inference entry points.

Originated in Kasimir Hedström's May 7 live demo. Kasimir described opening Claude Code in his vault root and prompting it to "look at my world here" — the result was a structural analysis that confirmed 78% of his tagged content fell under his first two pillars, which validated his ontology and revealed the remaining pillars as underdeveloped.

## When to Use

- Quarterly review of your knowledge base
- Before starting a new content sprint (identify which pillar is thin)
- After a major ingest to confirm the new material landed in the right places
- When you feel like your knowledge base is "full but shallow" — this surfaces why

## The Prompt

Copy and paste this into Claude Code when your working directory is your Obsidian vault root (or the equivalent folder for your knowledge base):

---

```
You are analyzing this knowledge base from the inside. Read the folder structure, frontmatter, tags, and wikilinks across all Markdown files. Do not search for specific topics — instead, produce a strategic audit with the following sections:

1. **Taxonomy Coverage** — What are the primary categories/pillars/tags in use? How many notes fall under each? Which are overrepresented and which are thin?

2. **Content Distribution** — Break down the notes by type (raw sources, synthesis, insights, session extracts, commands/skills, etc.). What proportion is raw vs. processed? Are there large pools of unprocessed material?

3. **Relationship Strength** — Which notes have the most inbound links? Which have zero? Flag orphan notes (no inbound or outbound links) and hub notes (>10 inbound). Are the hubs actually load-bearing or are they artificial concentrators?

4. **Quality Score Distribution** (if quality scores are present in frontmatter) — What is the score distribution? Are there clusters of high-quality material that haven't been cross-referenced or surfaced?

5. **Connection Gaps** — Identify 3–5 pairs or clusters of notes that are thematically related but not linked. These are missing edges in your knowledge graph.

6. **Top Inference Entry Points** — Which 5 notes would be the best starting points for inference sessions? These are notes that are well-linked, well-scored, and sit at the intersection of multiple themes.

7. **Recommended Next Actions** — Based on the above, what are the 3 highest-leverage maintenance actions? (e.g., "Develop pillar 3 — only 4 notes vs. 47 in pillar 1", "Link the procurement framework cluster to the client retention cluster — 6 notes in each with no cross-links")

Be specific and use actual note titles, tag names, and counts from what you find. This is an operational audit, not a summary.
```

---

## Usage Notes

- Run from the vault root so Claude has access to all subfolders
- Works best when your vault has consistent frontmatter (tags, quality scores, categories)
- The "connection gaps" section often surfaces the most actionable insights — these are relationships your vault knows about but hasn't made explicit
- If your vault has a `_backlinks.json` index, point Claude to it explicitly: add "A pre-computed backlink index is at `_backlinks.json` — use it for inbound link counts" to the prompt

## Source

Derived from Kasimir Hedström's live Obsidian demo, May 7, 2026 AIMM Mastermind.

→ [[2026-05-07_Mastermind]]
→ [[Insight - Your Second Brain Isn't a Search Engine — It's an Inference Engine]]
→ [[Insight - The Three-Layer Knowledge Architecture — Keyword, Graph, and Semantic Retrieval]]
→ [[Insight - Build Your Ontology First, Then Let Content Follow]]
