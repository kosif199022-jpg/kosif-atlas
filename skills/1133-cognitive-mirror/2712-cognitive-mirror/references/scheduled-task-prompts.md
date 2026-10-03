# Scheduled Task Prompts for Cognitive Mirror

Copy the appropriate prompt into your Cowork or Claude Code scheduled task
configuration.

---

## Daily Harvest (recommended: end of day or overnight)

```
Read the cognitive-mirror skill at cognitive-mirror/SKILL.md and load
references/harvest-dimensions.md.

Run Harvest mode against my conversations from the last 24 hours.
Check ~/.aai/memory/cognitive-mirror/harvest-log.txt and skip any already harvested.

For each new conversation:
1. Scan for decision moments using the 7 harvest dimensions
2. Extract structured decision instances
3. Classify by domain and confidence level

Then:
- Auto-append HIGH-confidence instances to the active harvest store shard
- Save MEDIUM-confidence instances to ~/.aai/memory/cognitive-mirror/harvest-review-[today's date].md
  formatted as a checklist I can quickly approve/edit/discard
- Discard LOW-confidence instances (mention count in report only)
- Update ~/.aai/memory/cognitive-mirror/harvest-log.txt with conversations processed
- Update ~/.aai/memory/cognitive-mirror/harvest-store/store-index.json with new counts
- Produce a brief Harvest Report summary

If no conversations from the last 24 hours contain extractable decisions,
report "No decision instances found today" and stop. Do not produce a
review file for empty runs.

Do NOT auto-apply any changes to the cognitive profile — that's Mine mode's
job. Harvest mode only extracts decision instances.
```

---

## Weekly Mine + Harvest (recommended: Sunday or Monday morning)

```
Read the cognitive-mirror skill at cognitive-mirror/SKILL.md.
Load references/extraction-dimensions.md AND references/harvest-dimensions.md.

STEP 1 — HARVEST (catch any conversations missed by daily runs):
- Check ~/.aai/memory/cognitive-mirror/harvest-log.txt for gaps
- Run Harvest mode against any unharvested conversations from the past 7 days
- Auto-append HIGH-confidence instances to the active harvest store shard
- Save MEDIUM-confidence instances to ~/.aai/memory/cognitive-mirror/harvest-review-[today's date].md
- Update harvest-log.txt and store-index.json

STEP 2 — MINE:
- Run Mine mode against my conversations from the past 7 days
- Read ~/.aai/identity.md and the modules under ~/.aai/references/identity/,
  and compare new observations
- Produce a Mirror Report with confirmed, new, challenged, and fading patterns
- Save proposed profile updates to ~/.aai/memory/cognitive-mirror/mine-review-[today's date].md
  for my review (do NOT auto-apply profile changes)

STEP 3 — DIRECTIVE CHECK:
- Read ~/.aai/rules/operational.md and the modules under ~/.aai/rules/operational/
- If any Mine observations suggest new or modified directives, include
  proposed directive updates in the mine-review file

Save the combined report as:
~/.aai/memory/cognitive-mirror/weekly-mirror-report-[today's date].md

Report summary should include:
- Harvest: N new instances found, N conversations scanned, domain breakdown
- Mine: N patterns confirmed, N new, N challenged, N fading
- DSPy compilation readiness by domain (from store-index.json)
```

---

## Targeted Harvest (on demand, for a specific domain)

```
Read the cognitive-mirror skill at cognitive-mirror/SKILL.md and load
references/harvest-dimensions.md.

Search my conversation history for chats related to [DOMAIN KEYWORD].
Use conversation_search with queries like:
- "[domain keyword]"
- "[related terms]"

Run Harvest mode on the results, extracting ONLY decision instances in the
[TARGET DOMAIN] category. Check harvest-log.txt and skip already-harvested
conversations.

Report how many instances I now have total in this domain (from
store-index.json) and how many more I likely need to reach 40.
```

---

## Review Processor (after you review flagged instances)

```
Read ~/.aai/memory/cognitive-mirror/harvest-review-[DATE].md.

For each instance I marked as APPROVED: append to the active harvest store shard
For each instance I marked as EDITED: apply my edits and append to store
For each instance I marked as DISCARD: skip

Update ~/.aai/memory/cognitive-mirror/harvest-store/store-index.json with new counts.

Report: N approved, N edited, N discarded. New store total: N instances.
Domain breakdown of store after update.
```

---

## DSPy Export (when a domain reaches 40+ instances)

```
Read ~/.aai/memory/cognitive-mirror/harvest-store/store-index.json.
Identify which shard(s) contain instances for domain = "[TARGET DOMAIN]".
Read only those shards. Filter for confidence = "high".

Count: if fewer than 20, report that this domain isn't ready yet.
If 20-39, note that this is an experimental compilation (results may be thin).
If 40+, proceed with full export.

Generate a Python file at exports/[domain]_trainset.py containing:

1. Import statement for dspy
2. A trainset list of dspy.Example objects, one per decision instance
3. Each Example has fields: context, input_state, decision
4. Each Example has .with_inputs("context", "input_state") applied
5. A comment at the top noting: domain, instance count, date range,
   confidence distribution

Also generate a starter DSPy program file at exports/[domain]_program.py with:
1. A Signature class matching this domain's decision pattern
2. A Module wrapping it in dspy.ChainOfThought
3. A basic metric function stub that the user will customize
4. A compilation block using dspy.MIPROv2
5. Comments explaining what to customize
```

---

## Quick Reference: Recommended Schedule

| Task | Frequency | Approximate Duration | Manual Review Needed |
|---|---|---|---|
| Daily Harvest | Every day | 1–3 minutes | 5 min review of flagged items (skip empty days) |
| Weekly Mine + Harvest | Once per week | 5–10 minutes | 10 min review of profile updates + any missed harvests |
| Targeted Harvest | On demand | 2–5 minutes | Optional |
| Review Processor | After each review | Under 1 minute | None (just runs your approvals) |
| DSPy Export | When domain hits 40+ | 1–2 minutes | None |
