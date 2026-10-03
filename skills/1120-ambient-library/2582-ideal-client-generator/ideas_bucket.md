# Ideal Client Generator — Ideas Bucket

Deferred improvements to revisit later. Each includes the original reasoning and where it would fit.

---

## Content-to-Entity Mapping (Content Strategy Engine)
**Original idea:** Map every ontology entity to content recommendations — pain point → content topic → format → channel → hook. Each entity gets content type, channel, and messaging recommendations.
**Why deferred:** Better suited for a dedicated Content Engine skill that consumes the ontology as input.
**Dependency:** Requires completed ontology. Could be a "Phase 5" or a separate skill that reads the ontology JSON.
**When to revisit:** When building the content engine skill.

---

## AI Engine Prompt Library
**Original idea:** Generate ready-to-use system prompts for specific AI engine use cases:
- A chatbot that speaks in the ideal client's language
- An email writer that addresses pain points in priority order
- A content generator that uses aspiration language
- An objection handler that deploys counter-strategies with proof quotes
**Why deferred:** Out of scope for the research/analysis skill. Belongs in the AI engine construction phase.
**Dependency:** Requires completed ontology + messaging framework.
**When to revisit:** After the ontology-to-schema pipeline is built.

---

## Temporal VOC Analysis
**Original idea:** Track how pain points evolve over time using date metadata in VOC quotes. Identify which fears are growing vs. fading (e.g., "AI will take my job" 2023-2024 → "I'm falling behind" 2025-2026).
**Why deferred:** Requires larger VOC datasets with reliable date metadata to be statistically meaningful. Current 50-80 quote range is too small for temporal trends.
**Potential approach:** Could be added as an optional analysis when VOC bank exceeds 100+ quotes with date coverage across 2+ years.
**When to revisit:** Phase 3D now fulfills this dependency. Can be offered as a Phase 4 next step when the evidence bank exceeds 150+ quotes with date coverage across 2+ years.

---
