---
name: The Chat-to-Script Extractor
type: command
description: Extract a shareable narrative script and key decisions from a long AI work session — ready for NotebookLM, slides, or a team briefing.
source: Lou — 2026-04-23, cognitive twin pipeline / session-to-video workflow
trigger: /aimm:chat-to-script-extractor
location: wiki/mastermind/commands/
source-sessions:
  - 2026-04-23_Mastermind
---

# The Chat-to-Script Extractor

Extract a shareable narrative script and key decisions from a long AI work session — ready for NotebookLM, a slide deck, or a team briefing.

---

I'm going to give you a long conversation I had while building $ARGUMENTS

If no topic was provided above, ask me what the conversation was about before proceeding.

Read through it completely before responding. Then produce the following:

1. **Core Problem Statement** (2-3 sentences): What was I trying to solve, and why did it matter?

2. **Key Decisions** (3-5 bullets): The actual choices made — architectural, methodological, strategic. Be specific. Not "we discussed options" but "we chose X over Y because Z."

3. **The Architecture or Process** (1-2 paragraphs): How the solution actually works. Enough detail that someone could implement a version of it.

4. **The Insight Worth Sharing** (1 paragraph): The non-obvious discovery or reframe that came out of this work — the thing that would make a colleague say "I hadn't thought about it that way."

5. **Narrated Script** (400-600 words): Write this as a first-person narration, as if I'm walking someone through a short video presentation of this work. Present tense. Concrete specifics. No filler.

Here is the conversation:
[PASTE CHAT HERE]

---

## Source

From [[2026-04-23_Mastermind]]: Lou's cognitive twin pipeline — the cognitive mirror skill scans a session, extracts decisions and architecture, and produces a narrative script. That script feeds NotebookLM (which generates podcast-style audio) or goes directly into slides. A 6-to-8-hour development session becomes a 6-minute narrated video in roughly 30 minutes. "I now have a process I can use every single time." The command extracts the pipeline step that turns raw chat into structured, shareable narrative.
