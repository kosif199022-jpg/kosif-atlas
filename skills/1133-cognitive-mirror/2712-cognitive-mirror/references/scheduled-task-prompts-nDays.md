# Scheduled Task Prompts for Harvest Mode

Copy the appropriate prompt into your Cowork or Claude Code scheduled task
configuration.

---

## Standard Harvest (every 3–5 days)

```
Read the cognitive-mirror skill at cognitive-mirror/SKILL.md and load
references/harvest-dimensions.md.

Run Harvest mode against my last 10 conversations.

For each conversation:
1. Scan for decision moments using the 7 harvest dimensions
2. Extract structured decision instances
3. Classify by domain and confidence level

Then:
- Auto-append HIGH-confidence instances to the active shard in ~/.aai/memory/cognitive-mirror/harvest-store/
  (named in store-index.json)
- Save MEDIUM-confidence instances to ~/.aai/memory/cognitive-mirror/harvest-review-[today's date].md
  formatted as a checklist I can quickly approve/edit/discard
- Discard LOW-confidence instances (mention count in report only)
- Produce a Harvest Report summary

Do NOT auto-apply any changes to the cognitive profile — that's Mine mode's
job. Harvest mode only extracts decision instances.
```

---

## Combined Mine + Harvest (weekly)

```
Read the cognitive-mirror skill at cognitive-mirror/SKILL.md.
Load references/extraction-dimensions.md AND references/harvest-dimensions.md.

Run both Mine mode and Harvest mode against my last 15 conversations.

MINE MODE OUTPUT:
- Produce a Mirror Report with confirmed, new, and challenged patterns
- Save proposed profile updates to ~/.aai/memory/cognitive-mirror/mine-review-[today's date].md
  for my review (do not auto-apply)

HARVEST MODE OUTPUT:
- Extract decision instances using the 7 harvest dimensions
- Auto-append HIGH-confidence instances to the active shard in ~/.aai/memory/cognitive-mirror/harvest-store/
  (named in store-index.json)
- Save MEDIUM-confidence instances to ~/.aai/memory/cognitive-mirror/harvest-review-[today's date].md
- Produce a Harvest Report with domain distribution and compilation readiness

Save both reports as a single combined file:
~/.aai/memory/cognitive-mirror/weekly-mirror-report-[today's date].md
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
[TARGET DOMAIN] category. I'm trying to build up enough training data
to compile a DSPy module for this domain.

Report how many instances I now have total in this domain (check existing
harvest-store.jsonl) and how many more I likely need to reach 40.
```

---

## Review Processor (after you review flagged instances)

```
Read ~/.aai/memory/cognitive-mirror/harvest-review-[DATE].md.

For each instance I marked as APPROVED: append to the active shard in ~/.aai/memory/cognitive-mirror/harvest-store/
  (named in store-index.json)
For each instance I marked as EDITED: apply my edits and append to store
For each instance I marked as DISCARD: skip

Report: N approved, N edited, N discarded. New store total: N instances.
Domain breakdown of store after update.
```

---

## DSPy Export (when a domain reaches 40+ instances)

```
Read ~/.aai/memory/cognitive-mirror/harvest-store/store-index.json.
Filter for domain = "[TARGET DOMAIN]" and confidence = "high".

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
