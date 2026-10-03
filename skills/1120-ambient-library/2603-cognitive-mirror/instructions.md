# Cognitive Mirror

A self-observation system that builds and maintains a living model of how the
user thinks, decides, creates, and evaluates — extracted from actual conversation
evidence, not self-report.

---

## Data location (read first)

This skill separates **doctrine** (ships with the skill, read-only) from
**your data** (lives in the global ambient home, read/write). Route every path
accordingly:

| What | Where | Access |
|---|---|---|
| Concise identity contract + router | `~/.aai/identity.md` | read; write only when the concise contract changes |
| Detailed identity profile | `~/.aai/references/identity/` | read/write; write each approved observation to its owning module |
| Universal directives + domain router | `~/.aai/rules/operational.md` | read; write only when a universal directive or router changes |
| Domain operational directives | `~/.aai/rules/operational/` | read/write; write approved changes to the matching domain module |
| Harvest store (sharded) + index | `~/.aai/memory/cognitive-mirror/harvest-store/` | read/write |
| Harvest dedup log | `~/.aai/memory/cognitive-mirror/harvest-log.txt` | read/write |
| Extraction dimensions | `references/extraction-dimensions.md` (this skill dir) | read-only |
| Harvest dimensions | `references/harvest-dimensions.md` (this skill dir) | read-only |
| Blank profile template | `references/cognitive-profile-template.md` (this skill dir) | read-only |
| Scheduled-task prompts | `references/scheduled-task-prompts*.md` (this skill dir) | read-only |
| DSPy training exports | `~/.aai/memory/cognitive-mirror/exports/` | write |

If no identity exists, create the recognized roots and `references/identity/`.
Use `references/cognitive-profile-template.md` as source material for the
detailed modules; do not copy a full profile into `~/.aai/identity.md`. Create
that root as a concise, user-approved contract and router. Create `~/.aai/` and
`~/.aai/memory/cognitive-mirror/` if missing.

Routing note: the canonical map of these locations is `~/.aai/context.md` — the
routing table every consumer resolves through (no filesystem symlinks, so it's
portable across macOS/Linux/Windows). If `~/.aai/` doesn't exist yet, a
standalone install falls back to this skill's own `references/` dir. The sibling
`deep-mirror` skill reads and writes this same data; keep formats compatible.

---

## Philosophy

People cannot fully articulate how they think. The most valuable cognitive
patterns are tacit — they show up in what the person does, not what they say
they do. A person who consistently catches overengineering doesn't describe
themselves as "an overengineering detector." They just feel uncomfortable when
a proposal has too many moving parts, and they say something.

This skill watches for those patterns across conversations and names them.
The goal is not a personality profile. It is an operational model that the agent
can use to anticipate how the user will react, what they'll push back on, what
quality gates they apply, and what modes of thinking they activate in different
contexts.

The observation engine is adapted from the Irreplaceable Edge methodology and
uses the Cognitive Operations vocabulary for categorization.

**What this skill is NOT:**
- Not a personality test or psychometric instrument
- Not a self-improvement tool (doesn't prescribe what the user should change)
- Not the Cognitive Operations skill (that applies structured thinking; this
  observes the user's natural patterns)
- Not the Irreplaceable Edge skill (that finds a client's competitive moat;
  this maps the user's own cognitive fingerprint)
- Not the lifecycle manager. Bulk-mining raw session logs on disk, scheduled
  maintenance, and blind audits belong to **deep-mirror**. This skill extracts
  from conversations (current or recent) and owns the profile/harvest formats
  deep-mirror writes into.

---

## Relationship between Mine and Harvest dimensions

Mine dimensions and Harvest dimensions observe the same conversations through
different lenses. The same moment may yield both a pattern observation (for the
profile) AND a decision instance (for the harvest store). This is intentional —
style patterns and decision instances serve different layers of the cognitive
twin:

- Extraction dimensions → cognitive patterns → Layer 2 (how you reason)
- Harvest dimensions → decision instances → Layer 1 (what you decide)

When running combined Mine+Harvest, load both dimension files. Expect some
overlap. That overlap is a feature.

---

## Modes

### /loms — Look Over My Shoulder (live extraction)

**Trigger:** User types `/loms` during or at the end of a conversation.

**Behavior:**
1. Read the concise identity root (`~/.aai/identity.md`) and the detailed identity
   modules whose task triggers match the current conversation.
2. Read `references/extraction-dimensions.md` for the observation framework.
3. Analyze the CURRENT conversation (all messages in the active chat) through
   the extraction dimensions.
4. Maintain an internal SIGNAL MAP:

```
MIRROR SIGNAL MAP:
─────────────────
Mode detected:           [which operational mode is active in this conversation]
Patterns confirmed:      [existing profile patterns that showed up again]
Patterns challenged:     [existing profile patterns that were contradicted]
New patterns observed:   [behaviors not yet in the profile]
Quality gates applied:   [what the user accepted/rejected and why]
Decision heuristics:     [what tradeoffs were made and what was prioritized]
Energy markers:          [what the user engaged deeply with vs. went flat on]
Absent signals:          [expected patterns that didn't appear]
```

5. Present findings as a structured observation report:
   - **Confirmed patterns** — with specific evidence from this conversation
   - **New observations** — patterns not yet in the profile, with evidence
   - **Challenged patterns** — where this conversation contradicts the profile
   - **Proposed profile updates** — specific additions/modifications to the
     profile
   - **Proposed directive updates** — any new or modified operational directives

6. Ask: "Want me to apply these updates to the profile?"
7. If yes AND running with file system access (Claude Code / Cowork), write each
   profile observation to its owning file in `~/.aai/references/identity/` and
   each directive change to its owning module in `~/.aai/rules/operational/`.
   Change a concise root only when its own contract or router changes. If running
   read-only (browser chat), present the proposed updates as formatted text to
   apply manually.

**Critical behavior:** Show evidence, not just claims. Every pattern assertion
must point to a specific moment. "You caught the scope creep when you said [X]
in response to [Y]" — not "You tend to catch scope creep."

---

### Mine mode — batch extraction from past conversations

**Trigger:** "Mine my recent conversations," "update cognitive profile from
recent chats," "run the mirror on my last N conversations."

**Behavior:**
1. Read the concise identity root, the relevant detailed identity modules, and
   `references/extraction-dimensions.md` (do NOT load harvest-dimensions.md —
   that's Harvest mode).
2. Use `recent_chats` and/or `conversation_search` to pull conversation
   summaries from the specified time range.
3. For each conversation, run the extraction framework against the summary.
4. Aggregate observations, tracking pattern frequency, consistency across modes,
   evolution over time, and new emergent patterns.
5. Produce a **Mirror Report**: patterns confirmed with frequency count, new
   patterns with evidence, patterns that may be fading, proposed profile
   updates, proposed directive updates.
6. Wait for user approval before applying changes.

---

### Diff mode — compare and update

**Trigger:** "Diff my profile," "what's changed in how I work," or automatically
as step 2 after Mine mode.

**Behavior:**
1. Read `~/.aai/identity.md`, every detailed identity module, the concise
   operational router, and every domain-directive module before producing the
   full-profile diff.
2. If invoked standalone, run a lightweight Mine pass against the last 5
   conversations first to generate fresh observations. If invoked after Mine
   mode, use those observations.
3. Compare observations against the profile.
4. Produce a structured diff: **Stable / Strengthened / Weakened / New /
   Evolved**.
5. Propose specific line-level changes to the owning identity module; identify a
   root change separately when it is genuinely concise-contract material.
6. Propose any directive change against its owning universal or domain module.

---

### Profile Query mode

**Trigger:** "How do I typically approach X," "what's my pattern when I do Y,"
"what would I usually do here?"

**Behavior:**
1. Read the concise identity root, then only the detailed module needed to answer
   the question.
2. Answer from the profile, citing specific documented patterns.
3. If the profile doesn't cover the question, say so honestly and offer to run a
   Mine pass to gather evidence. (Read-only — works on every surface.)

---

### Harvest mode — decision instance extraction for DSPy compilation

**Trigger:** "Harvest my decisions," "extract decision instances," "run harvest
mode," "build my training data," "mine decisions from my chats."

Mine mode extracts *cognitive style patterns* — how you think in general.
Harvest mode extracts *specific decision instances* — moments where you made a
concrete judgment call that produced a different outcome than the default.

- A style pattern: "User reframes problems as structural before solving them."
- A decision instance: Input X → User decided Y (not the default Z) → for reason W.

These serve different layers: style patterns → Layer 2 (profile); decision
instances → Layer 1 (DSPy-compilable training examples).

**Behavior:**

1. Read the concise identity root and only the detailed modules relevant to the
   decision domain.
2. Read `references/harvest-dimensions.md` for the decision detection framework
   (do NOT load extraction-dimensions.md).
3. Read `~/.aai/memory/cognitive-mirror/harvest-log.txt` to check which
   conversations have already been harvested.
4. Use `recent_chats` and/or `conversation_search` to pull conversations from
   the specified range (default: last 10).
5. **Skip conversations already in harvest-log.txt** to prevent duplicate
   extraction across scheduled runs.
6. For each NEW conversation, scan for **decision moments** — points where the
   user overrode, corrected, rejected, redirected, reframed, selected between
   options on non-obvious criteria, applied a quality judgment, or made a
   strategic tradeoff.
7. For each decision moment, extract a structured record:

```json
{
  "id": "harvest-YYYY-MM-DD-NNN",
  "domain": "<domain category>",
  "context": "<what was happening — 2-3 sentences max>",
  "input_state": "<what the agent proposed before the user intervened>",
  "decision": "<what the user actually did — the correction, override, or reframe>",
  "reasoning_signals": ["<observable reasons or heuristics applied>"],
  "decision_type": "<override | correction | reframe | selection | rejection | quality_gate | scope_mgmt>",
  "confidence": "<high | medium | low>",
  "source_chat_date": "YYYY-MM-DD",
  "source_chat_title": "<conversation title if available>"
}
```

8. Classify each instance into a **domain category**: `content_strategy`,
   `system_architecture`, `client_assessment`, `ip_protection`,
   `framework_design`, `audience_calibration`, `quality_evaluation`,
   `scope_management`, `meta_cognitive`, or `other`.
9. Produce a **Harvest Report**:

```
HARVEST REPORT — [date range]
══════════════════════════════

Conversations scanned: N (N new, N previously harvested — skipped)
Decision instances found: N
Domain distribution:
  content_strategy:     ████████ 12
  system_architecture:  █████ 8
  ...

HIGH-CONFIDENCE INSTANCES (ready for training):
[list with brief summaries]

MEDIUM-CONFIDENCE INSTANCES (review recommended):
[list — user confirms, edits, or discards]

DSPy COMPILATION READINESS (from store-index.json):
  content_strategy:     52 instances — READY FOR COMPILATION
  system_architecture:  28 instances — ACCUMULATING (need ~12 more)
```

10. Auto-append high-confidence instances to the current harvest store shard in
    `~/.aai/memory/cognitive-mirror/harvest-store/`. Present medium-confidence
    instances for review. Show low-confidence but don't store unless promoted.
11. Update `~/.aai/memory/cognitive-mirror/harvest-log.txt` with the IDs/dates
    of conversations just processed.
12. Update `~/.aai/memory/cognitive-mirror/harvest-store/store-index.json` with
    new domain counts and date range.

**Confidence calibration:**
- **High:** clear override or correction with observable reasoning ("no, do X
  instead" / "that's wrong because Y").
- **Medium:** user redirected or reframed but reasoning is implicit.
- **Low:** something shifted that might be a decision or might just be moving on.

**Critical rules:**
- Never fabricate reasoning the user didn't demonstrate. If the reason isn't
  apparent, use `["reasoning not explicit"]`.
- Don't extract trivial decisions. Test: would this decision transfer to a
  future situation?
- Domain classification can be uncertain — list primary, note secondary.
- Deduplicate by pattern, not by instance. Recurrence IS signal.
- Always check harvest-log.txt before processing a conversation.

---

## Harvest store structure

Sharded to prevent unbounded growth, under
`~/.aai/memory/cognitive-mirror/harvest-store/`:

```
harvest-store/
├── store-index.json          # Domain counts, date ranges, shard map
├── store-001.jsonl           # First 200 instances
├── store-002.jsonl           # Next 200 instances
└── ...
```

**store-index.json format:**
```json
{
  "last_updated": "YYYY-MM-DD",
  "total_instances": 247,
  "active_shard": "store-002.jsonl",
  "shard_limit": 200,
  "domains": {
    "content_strategy": { "count": 52, "first_seen": "2026-04-22", "last_seen": "2026-06-15" },
    "system_architecture": { "count": 28, "first_seen": "2026-04-25", "last_seen": "2026-06-10" }
  }
}
```

When the active shard reaches 200 instances, create a new shard and update the
index. To check compilation readiness, read only store-index.json — never scan
all shards to count. When exporting for DSPy, use the index to read only the
shard(s) containing the target domain.

---

## Post-compilation evaluation

After compiling a DSPy module from harvested instances:

1. Hold out 10 instances from the training set (exclude from compilation).
2. Run the compiled module on each held-out `context` + `input_state`.
3. Compare its output against the user's actual `decision`.
4. Compute agreement: 70%+ → usable, keep refining; 50–70% → needs more volume
   or domain diversity; below 50% → too noisy or too broad, consider splitting.
5. Save results to `~/.aai/memory/cognitive-mirror/exports/[domain]_eval.md`.

---

## The observation framework

When running Mine mode or /loms, observe through these dimensions. Full details
and evidence criteria are in `references/extraction-dimensions.md`. (Harvest
mode uses `references/harvest-dimensions.md` — different lenses, different
output.)

1. **Mode Detection** — Which operational mode is active? What triggered it?
2. **Dominant Operation** — Which cognitive operation is driving thinking?
3. **Quality Gates** — What was accepted? Rejected? Why?
4. **Decision Heuristics** — What tradeoffs were made? What was prioritized?
5. **Interaction Choreography** — How does the user structure the work?
6. **Energy Markers** — What gets deep engagement vs. goes flat?
7. **Framework Instinct** — When does the user reach for structure?
8. **Absent Signals** — What expected patterns didn't appear?

---

## Surface requirements

- `/loms` works on all surfaces but can only auto-apply profile updates with
  file system access (Claude Code / Cowork). Read-only surfaces get formatted
  text to paste.
- Mine, Harvest, and Diff require file system access.
- Profile Query works everywhere (read-only).

---

## Scheduled task integration

Designed to run on surfaces with file system access. See
`references/scheduled-task-prompts.md` for ready-to-paste automation prompts.
Recommended cadence: Mine weekly/bi-weekly, Harvest every 3–5 days, combined
Mine+Harvest weekly. For lifecycle-level scheduling (bootstrap, quarterly blind
audit), hand off to **deep-mirror**.

---

## One line

*Watch how they work. Name what you see. Update how you serve them.*
