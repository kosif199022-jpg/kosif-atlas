# Plan: Add Iterative Gap-Filling Phase to Ideal Client Generator Skill

## Context

The ideal-client-generator skill currently runs linearly: research → handbook → ontology → messaging → audit → close. Phase 3C (Evidence Audit) identifies gaps — in the latest run, 29 of 70 entities (41%) were rated FRAGILE or THIN. Critically, the audit found that **evidence is thinnest exactly where Loudalo's competitive differentiation depends on strong evidence** (identity crisis, age-related anxiety, revenue model redesign).

The skill currently offers "fill gaps" as a manual next-step in Phase 4, but there is no automated loop. The user wants a self-driving iterative phase that:
1. Assesses which gaps are **strategically important** (not just evidence-thin)
2. Runs targeted parallel research to fill them
3. Integrates new quotes and re-scores
4. Repeats until quality is acceptable or max iterations are hit

## Approach

Add a new **Phase 3D: Iterative Gap Filling** between Phase 3C and Phase 4. Minor updates to Phase 3C, Phase 4, and Execution Notes.

## Files to Modify

1. `/Users/loudalo/.claude/skills/ideal-client-generator/SKILL.md` — main skill file (insert Phase 3D after line 1020, modify Phase 3C at ~1015, modify Phase 4 at ~1041, add execution notes after 1063)
2. `/Users/loudalo/.claude/skills/ideal-client-generator/ideas_bucket.md` — annotate Temporal VOC Analysis dependency as fulfilled

## Changes

### 1. Insert Phase 3D (after line 1020, before Phase 4)

**~220 lines of new content.** The phase has 8 steps inside a loop:

#### 3D Overview
- Purpose statement: automatically strengthen weakest evidence using targeted research loops
- Optional but recommended: skip if user wants to proceed directly to Phase 4
- Configuration:
  - `MAX_ITERATIONS` = 3 (default, configurable)
  - `QUALITY_THRESHOLD` = no CRITICAL or HIGH-SIS gaps remain at FRAGILE or INFERRED
  - `MIN_QUOTES_PER_GAP` = 1 (diminishing returns: fewer than 1 new quote per targeted gap = stop)

#### 3D-1: Strategic Importance Scoring (SIS)
Every FRAGILE and THIN entity gets scored on 4 dimensions (0-3 each, weighted):

| Dimension | Weight | What it measures | How to look it up |
|-----------|--------|-----------------|-------------------|
| Differentiation Centrality | 3x | Does this entity support an unoccupied competitive position? | Check `positioning_gaps` array in ontology and Section 27 of handbook |
| Causal Chain Position | 3x | How many causal chains include this entity? Is it an intervention point? | Count occurrences in `causal_chains` array in ontology |
| Segment Reach | 2x | How many behavioral segments does it affect? | Check `segments[].pain_hierarchy` and `segments[].exemplar_quotes` in ontology |
| Messaging Dependency | 2x | How many messaging framework assets reference this entity? | Grep the messaging framework file for the entity ID/label |

**SIS = (Diff x 3) + (Chain x 3) + (Segment x 2) + (Messaging x 2)**. Max 30. Tiers:
- CRITICAL (21-30): Must fill — undermines positioning strategy
- HIGH (11-20): Should fill — weakens important sections
- MODERATE (6-10): Nice to fill — affects depth not direction
- LOW (0-5): Optional — improves completeness only

**Default for entities with no relationship links in the ontology:** Score as MODERATE (6). Absence of links may mean under-analyzed, not unimportant.

Include a worked example in the SKILL.md showing how to score 2-3 entities.

#### 3D-2: Gap Triage
- Rank all FRAGILE/THIN entities by SIS tier, then by evidence rating ascending within tier
- Select targets for this iteration: all CRITICAL gaps + HIGH gaps (aim for 5-8 total gaps per iteration)
- Pull recommended search queries from Phase 3C gap report for each target
- **Separate audience VOC gaps from competitive intelligence gaps** — these use different research strategies (broad searching vs. targeted page scraping)
- Present triage as a compact table:
  ```
  ITERATION [N] TRIAGE — [X] gaps targeted

  Entity              | Current | SIS   | Tier     | Searches
  --------------------|---------|-------|----------|----------
  Identity Crisis     | THIN(3) | 26    | CRITICAL | 3 queries
  Age-Related Anxiety | FRAG(1) | 16    | HIGH     | 3 queries
  ...

  Proceed? [Y/continue/stop]
  ```
- Wait for user confirmation. If user says stop, skip to final audit step.

#### 3D-3: Targeted Research (parallel sub-agents)

**Audience VOC gaps:** Group by platform affinity (not by entity). One search often yields quotes for multiple gaps.
- Dispatch one sub-agent per platform batch (Reddit, LinkedIn, Community/Forum, YouTube)
- All audience batches run in parallel

**Competitive intelligence gaps:** Separate batch — requires targeted page scraping, not broad searching.
- Dispatch one sub-agent for competitor pages (testimonials, reviews, case studies)
- Runs in parallel with audience batches

**Each sub-agent receives a compact brief:**
```
TARGET GAPS: [entity ID, label, current quote count] × N
SEARCH QUERIES: [the 3 recommended queries per gap from Phase 3C]
NUMBERING: Start at VOC-[next available number]
EXISTING IDS: [list of all current VOC-### IDs to skip duplicates]
QUOTE FORMAT:
  [VOC-###]
  Quote: "exact verbatim text"
  Source: Platform
  URL: full URL
  Date: approximate
  Context: 1-sentence
  Author Context: role/experience/industry or "Unknown"
  Theme Tags: [tags]
  Supports: [entity IDs this quote strengthens]
QUALITY BAR: Full sentences only. No fragments. Verbatim — do not clean grammar. Reject if <10 words or no clear attribution.
DEDUP RULE: Skip any quote that substantially overlaps with an existing quote (same author, same point, same thread). When in doubt, include it — parent will dedup.
```

**Each sub-agent returns:** Structured quote objects only. Not raw scrape data. Not search result lists. Just quotes that passed the quality bar.

**Tool fallback:** If firecrawl credits are exhausted, sub-agents fall back to `WebSearch` + `WebFetch`. If both fail for a platform, note it and move on — do not block the iteration on one source.

#### 3D-4: Evidence Integration
- Parent agent reviews returned quotes for duplicates (same person/thread/point as existing bank)
- Merge approved quotes into evidence bank with sequential numbering
- **Append to a new section** in the evidence bank file: `# GAP FILL ROUND [N]` — preserves the original organization by source type
- Map each new quote to the entities it supports (using the `Supports` field from sub-agents)
- Update entity quote counts and platform diversity
- First iteration only: also integrate high-value orphaned quotes identified in Phase 3C audit (move from "orphaned" to an appropriate entity)
- Write updated evidence bank to file immediately

#### 3D-5: Re-Score & Assess
- Re-compute evidence strength ratings for all targeted entities
- Generate iteration delta table:
  ```
  ITERATION [N] RESULTS — [X] new quotes from [Y] platforms

  Entity              | Before  | After   | Change
  --------------------|---------|---------|--------
  Identity Crisis     | THIN(3) | SOLID(5)| +2 quotes, +1 platform
  Age-Related Anxiety | FRAG(1) | THIN(3) | +2 quotes, +2 platforms
  ...
  ```
- Evaluate stop conditions (see 3D-8)

#### 3D-6: Update Artifacts (conditional, batched at loop end)

**Per-iteration:** Only update the evidence bank file (done in 3D-4). All other artifact updates are deferred to loop termination to avoid compounding errors from incremental edits.

**At loop end (after final iteration):** For entities that improved from the original Phase 3C baseline:
- **Handbook:** Use the entity → section mapping below. Read the target section by heading, add new blockquote citations, write back. Do NOT re-read or modify unrelated sections.
- **Ontology:** Regenerate the full ontology JSON (Phase 3 process) rather than surgically editing. The JSON is too large and interconnected for safe partial updates. This adds time but prevents structural corruption.
- **Messaging framework:** Add new VOC-echo headlines or objection-handling proof points for entities that are now SOLID+. Do not modify existing messaging — append new assets.

**Entity → Handbook Section Mapping:**

| Entity Type | Primary Section(s) | Secondary Sections |
|-------------|-------------------|-------------------|
| Fears | 6 (Pain Points), 7 (Verbatim) | 10 (Client Statements), 25 (Triggers) |
| Frustrations | 6, 7 | 10, 19 (Performance Gaps) |
| Limiting Beliefs | 6, 7 | 16 (False Beliefs) |
| False Beliefs | 16 | 6, 11 (Objections) |
| Objections | 11 | 12 (Client Journey) |
| Needs (emotional) | 15 | 9 (What I Really Want to Say) |
| Needs (immediate) | 15 | 8 (Solutions), 23 (Priorities) |
| Needs (unmet) | 15 | 27 (Positioning Gaps), 29 (Blue Ocean) |
| Trigger Events | 25 | 12 (Client Journey), 26 (Segments) |
| Behavioral Segments | 26 | 27 (Competitive Landscape) |

#### 3D-7: Iteration Report
Present to user: new quotes found, entity improvements (delta table from 3D-5), remaining gaps with SIS tiers, stop condition status.

If loop is not terminating, ask: "Continue to iteration [N+1], or stop here?"
If user says stop at any point, proceed directly to the final audit step (same as loop termination).

#### 3D-8: Stop Conditions (evaluated in order after each iteration)
1. **Quality threshold met:** No CRITICAL or HIGH-SIS gaps remain at FRAGILE or INFERRED → STOP
2. **Diminishing returns:** New quotes this iteration < (number of targeted gaps × `MIN_QUOTES_PER_GAP`) → STOP. Report which gaps appear unfillable via web research and recommend user-provided data instead (interviews, surveys, intake forms, sales call notes).
3. **Iteration limit:** iteration == `MAX_ITERATIONS` → STOP. Report remaining gaps.

**On loop termination:**
1. Run the artifact updates described in 3D-6
2. Generate a **final Evidence Audit** as a new file `[name]-evidence-audit-final.md` (do NOT overwrite the original Phase 3C audit — keep both for comparison)
3. The final audit includes: updated heat map, a "Gap Fill Summary" section showing before/after for all targeted entities, remaining gaps with explanation of why they couldn't be filled, and updated Overall Confidence Summary

### 2. Modify Phase 3C (line ~1015-1019)

Add to end of Overall Confidence Summary section:

```
### Phase 3D Decision Point

After presenting the audit, ask the user:

"The evidence audit identified [X] FRAGILE and [Y] THIN entities. Would you like to run
iterative gap filling (Phase 3D) to automatically strengthen the weakest evidence?
This runs up to [MAX_ITERATIONS] targeted research rounds. Or proceed directly to Phase 4?"

If the user chooses Phase 3D, proceed to the iterative loop.
If they decline, skip to Phase 4.
```

### 3. Modify Phase 4 (line ~1041-1047)

Update the "Next Steps" list:
- Item 1 ("Fill gaps"): Change to: "**Fill remaining gaps** — If Phase 3D was run, most web-researchable gaps have been addressed. Remaining gaps likely require user-provided data (interview transcripts, survey responses, intake forms, sales call notes). Provide this data and re-run targeted analysis."
- Add item 6: "**Run Temporal VOC Analysis** — With 150+ dated quotes accumulated across research rounds, temporal trend analysis is now viable. Identify which fears are emerging vs. fading."

### 4. Add to Execution Notes (after line 1063)

Add 5 execution notes:
- **Iterative gap filling context management:** Phase 3D sub-agents carry all search/scrape context. The parent holds only: the SIS-ranked gap list, the iteration delta table, and the evidence bank file path. All raw data lives in files, not in context.
- **SIS scoring lookups:** Score Differentiation from the ontology's `positioning_gaps` and the competitive analysis. Score Causal Chain Position by counting entity occurrences in `causal_chains`. Score Segment Reach from `segments[].pain_hierarchy`. Score Messaging Dependency by grepping the messaging framework file. Default to MODERATE (6) for entities with no relationship data.
- **Quote quality in iterations:** Later iterations target narrower topics and may yield lower-quality results. Sub-agents must maintain the same quality bar as Phase 1: full sentences (not fragments), verbatim (no grammar cleanup), with source attribution. Reject quotes under 10 words. Prefer quotes with discernible author context.
- **Ontology regeneration:** At loop end, regenerate the full ontology rather than surgically editing the JSON. The 200KB+ file with 400+ cross-references is too interconnected for safe partial updates.
- **Tool budget awareness:** Each iteration dispatches 3-5 parallel sub-agents, each making 3-8 web searches. Budget ~20-40 web searches per iteration, ~60-120 across 3 iterations. If search tools hit rate limits or credit exhaustion, the sub-agent should fall back gracefully and report what it could not access.

### 5. Update ideas_bucket.md

Annotate the "Temporal VOC Analysis" entry:
- Change "When to revisit" to: "Phase 3D now fulfills this dependency. Can be offered as a Phase 4 next step when the evidence bank exceeds 150+ quotes with date coverage across 2+ years."

## Verification

1. Read the modified SKILL.md end-to-end and verify:
   - Phase 3D is correctly positioned between 3C and 4
   - The SIS algorithm includes the lookup instructions and a worked example
   - Stop conditions are unambiguous (especially diminishing returns formula)
   - Sub-agent briefs match the existing Phase 1 delegation pattern
   - Entity → section mapping table is complete for all entity types
2. Grep SKILL.md for "Phase 3D" to confirm all cross-references are consistent
3. Verify ideas_bucket.md annotation is accurate
4. Dry-run test: mentally trace through one iteration using the actual audit data (29 gaps, top priorities being identity crisis and age-related anxiety) to confirm the flow makes sense
