# Extraction Prompts — Cowork & Claude.ai

Companion file to `SKILL.md`. These are the paste-ready prompts that populate `~/vault/weekly-briefing-inbox/` from sources outside Claude Code. The briefing skill reads that inbox during Step 2.

**Output filename convention** (all sources land here):
```
~/vault/weekly-briefing-inbox/[source]-[YYYY-MM-DD]-[kebab-slug].md
```

Where `[source]` is one of: `cowork`, `chat`.

**Shared record format** — every extraction produces this YAML+markdown structure:

```markdown
---
source: cowork | chat
date: YYYY-MM-DD
title: one-line description of session's intent
type: R&D | operational | exploratory
---

## Intent
[1-2 sentences — what was being attempted]

## Outputs / Artifacts (or: What Was Built / Decided / Discovered)
- [Concrete artifacts, decisions, insights — name them, don't gesture]

## Key Threads
[2-4 sentences naming substantive conceptual threads — feeds Big Themes]

## Open Threads
- [Unresolved questions, blockers, work signaled for later]

## Notable Verbatim
[2-3 short verbatim quotes that capture signal]
```

For throwaway sessions, the prompts output a single line: `SKIP — no compounding value`. The briefing skill ignores those files.

---

## 1. Cowork prompt (paste into a Cowork session)

Cowork has filesystem access, so this writes files directly to the inbox.

```
Extract my Cowork session history from the past 7 days into briefing-ready summaries.

Steps:

1. Find Cowork's local session store. Check in order:
   - ~/.cowork/projects/
   - ~/Library/Application Support/Cowork/
   - ~/.config/cowork/
   - Search: find ~ -maxdepth 4 -name "*.jsonl" -newermt "7 days ago" 2>/dev/null | grep -i cowork
   If none of those exist, report what you found and stop.

2. For every session transcript modified in the last 7 days, read it and decide:
   - Has compounding value? (built something, decided something, produced an artifact, surfaced an insight) → summarize
   - Throwaway (debugging, one-shot lookup, unfinished noodling)? → write SKIP file

3. For each session worth keeping, write a file to:
   ~/vault/weekly-briefing-inbox/cowork-[YYYY-MM-DD]-[kebab-slug].md

   Using this exact format:

   ---
   source: cowork
   date: [YYYY-MM-DD of session]
   title: [one-line description of session's intent]
   type: [R&D | operational | exploratory]
   ---

   ## Intent
   [1-2 sentences — what was being attempted at the start]

   ## Outputs / Artifacts
   - [Every file written or edited — full paths]
   - [Frameworks, decisions, prompt templates, named concepts]

   ## Key Threads
   [2-4 sentences naming the substantive conceptual threads — feeds Big Themes in the weekly briefing]

   ## Open Threads
   - [Unresolved questions, blockers, work signaled for later]

   ## Notable Verbatim
   [2-3 short verbatim quotes — Lou's framing or Claude's articulation that capture the signal]

4. For throwaway sessions, instead write a file containing only this line:
   SKIP — no compounding value

5. When finished, report: N sessions found, M summarized, K skipped. List the saved file paths.

Voice rules for the summaries:
- Practitioner-direct, no fluff, no "in this conversation we" framing
- Take positions — state conclusions as fact, not hedge
- Concrete over abstract — name the artifact, don't gesture at it
- If a session is mid-thought / unfinished, say so explicitly in Open Threads
```

For non-default windows, replace `past 7 days` and `last 7 days` with the explicit range (e.g., `April 24 through April 30`).

---

## 2. Claude.ai prompts (three flavors)

Claude.ai has no filesystem access. Output is text the user copies to the inbox.

### 2a. End-of-session capture (paste at end of any substantive chat)

Most reliable. Lowest friction. Recommended as a habit.

```
Summarize this conversation as a session record for my weekly intelligence briefing inbox.

Output format — exact, no preamble:

---
source: chat
date: [today's date YYYY-MM-DD]
title: [one-line description of session's intent]
type: [R&D | operational | exploratory]
---

## Intent
[1-2 sentences — what I was trying to accomplish at the start]

## What Was Built / Decided / Discovered
- [Concrete artifact, decision, or insight — bullet per item]
- [Name the framework, file, or output — don't gesture at it]

## Key Threads
[2-4 sentences naming the substantive conceptual threads — feeds Big Themes in the weekly briefing]

## Open Threads
- [Unresolved questions, blockers, work I signaled I'd return to]

## Notable Verbatim
[2-3 short verbatim quotes that capture the session's signal]

Rules:
- Practitioner-direct. No "in this conversation we" framing.
- Take positions. State conclusions as fact.
- Concrete over abstract.
- If this conversation had no compounding value (debugging, one-shot lookup), output only: SKIP — no compounding value
```

Copy the output and save to:
```
~/vault/weekly-briefing-inbox/chat-[YYYY-MM-DD]-[topic-slug].md
```

### 2b. Bulk processing from claude.ai data export

For full coverage of the week's chats.

**Step 1** — Export your data from claude.ai: Settings → Privacy → Export Data. Wait for the email, download the ZIP, extract `conversations.json`.

**Step 2** — Create a new claude.ai Project, upload `conversations.json` to it, then paste:

```
Process the uploaded conversations.json. For every conversation with an updated_at timestamp within the past 7 days (or [DATE RANGE] if I specify one), produce a session record.

For each qualifying conversation, output a markdown block in this exact format, separated by `=====` lines:

=====
filename: chat-[YYYY-MM-DD]-[kebab-slug-from-title].md
---
source: chat
date: [YYYY-MM-DD from updated_at]
title: [one-line description of intent — derive from first user turn]
type: [R&D | operational | exploratory]
---

## Intent
[1-2 sentences from the opening turns]

## What Was Built / Decided / Discovered
- [Bullets — concrete artifacts, decisions, insights]

## Key Threads
[2-4 sentences naming the substantive conceptual threads]

## Open Threads
- [Unresolved items]

## Notable Verbatim
[2-3 short verbatim quotes from either side]
=====

Skip conversations that have no compounding value (throwaway debugging, single-question lookups, unfinished noodling). At the end, report: N conversations in window, M summarized, K skipped.

Voice rules: practitioner-direct, no fluff, take positions, concrete over abstract.
```

**Step 3** — For each `=====` block, save the body to the filename shown, in `~/vault/weekly-briefing-inbox/`. Can be a quick paste-and-save loop, or hand the output to Claude Code with: *"Parse this output and write each block as the named file under ~/vault/weekly-briefing-inbox/."*

### 2c. Memory-based partial pull (best-effort)

If memory is enabled in claude.ai, this *might* surface recent conversations. Unreliable but zero setup.

```
Using your memory of our conversations, list every substantive chat we had in the past 7 days. For each one, produce a session record using this exact format:

[paste the format block from 2a here]

Skip conversations with no compounding value. At the end, list the conversations you remembered.
```

Treat the output as best-effort, not comprehensive. Verify against your actual claude.ai conversation list before trusting it as complete.

---

## Suggested workflow

1. **Sunday morning** — paste the Cowork prompt into a Cowork session. Inbox populates with the week's R&D sessions.
2. **As you go** — paste the 2a prompt at the end of any substantive claude.ai conversation. Save the output to the inbox.
3. **Optionally monthly** — run 2b against a fresh data export to catch anything 2a missed.
4. **Then run** `/weekly-intelligence-briefing` — it'll merge inbox + Claude Code transcripts and produce the briefing.
