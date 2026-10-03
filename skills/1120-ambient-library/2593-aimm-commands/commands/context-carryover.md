---
name: context-carryover
type: command
description: Generates a structured 9-section handover artifact + receiving prompt to transfer a Claude conversation to a new thread without information loss
source: Elizabeth Stief — shared at 2026-02-19 AIMM session, protocol at github.com/coachlou/aimm/prompts/Handover_Protocol_Universal (AIMM)/
trigger: /context-carryover
location: wiki/mastermind/commands/
source-sessions:
  - 2026-02-19_Mastermind
---

# Context Carryover (Handover Protocol)

## Origin

Elizabeth Stief introduced this at the 2026-02-19 PowerUp AI Mastermind session. Lou's reaction: "I need that yesterday." The full protocol is published at [github.com/coachlou/aimm](https://github.com/coachlou/aimm/tree/main/prompts/Handover_Protocol_Universal%20(AIMM)).

This command is Elizabeth's exact protocol, lightly formatted for vault consistency.

---

## The Core Problem

Claude has no memory between sessions. Long conversations also degrade in quality as the context window fills up — the model starts forgetting earlier decisions, repeating itself, or contradicting earlier work.

**Signals you're overdue for a handover:**
- Claude contradicts something it said 20 messages ago
- Responses lose precision or start hedging on things already decided
- You're about to switch devices, projects, or days

---

## When to Trigger

- End of any working session you intend to continue later
- When the conversation is getting long and response quality starts to slip
- Before switching to a different Claude instance or project
- Mid-session if you've made decisions you can't afford to lose
- When shifting between distinct work modes (e.g., research → building)

---

## Setup (Recommended)

**Option A — Claude Project:**
Add this protocol as a project file, then add to your project instructions:
```
"/handover" = Read and execute the Handover Protocol (in project files)
```

**Option B — Paste in chat:**
Paste the prompt below into the conversation with: "Execute this handover protocol now."

---

## The Prompt

````
## HANDOVER ARTIFACT

Name the artifact: `Handover: [descriptive label] - [DD-MONTH]`

Produce a structured session handover as a markdown artifact. This must capture everything a fresh Claude instance needs to resume work without loss. Follow this structure exactly:

### 1. SESSION IDENTITY (2-3 sentences)
- Descriptive label for the work
- Work mode (exploration / synthesis / build / validation / refinement)
- Session status: MID-PROCESS or END-OF-SESSION

### 2. OBJECTIVE & SCOPE
- What we set out to do this session (1-2 sentences)
- What was actually accomplished vs. what remains
- Any scope changes that occurred and why

### 3. DECISIONS MADE (numbered list, max ~200 words)
For each decision:
- The decision itself
- Key evidence or reasoning (not just "we decided X" but WHY)
- Alternatives considered and rejected (brief)
- Confidence level: HIGH / MEDIUM / LOW

### 4. CURRENT STATE OF WORK
- Where exactly we stopped (be precise: "mid-way through section 3 analysis" not "working on analysis")
- What the next immediate action would be if we continued right now
- Any constraints or dependencies for that next action

### 5. ACTIVE TENSIONS & UNRESOLVED QUESTIONS (bulleted)
- Contradictions, trade-offs, or open debates not yet resolved
- Questions deferred intentionally (with reason for deferral)
- Hypotheses still under validation (state what evidence would confirm/disconfirm)

### 6. ARTIFACT INVENTORY
For each artifact produced this session:
- Artifact title / filename
- Purpose (1 sentence)
- Key content summary (2-4 sentences, enough to understand without re-reading)
- Status: DRAFT / FINAL / SUPERSEDED
- Flag: CRITICAL (full content must be available to the new session: upload as file or paste in full) or REFERENCE-ONLY (summary in this handover is sufficient)

### 7. ORPHANED INSIGHTS
Ideas, observations, or connections that surfaced but were not integrated into the main work or captured in any artifact.
- The insight itself
- Why it matters (potential relevance)
- Priority: HIGH (may affect existing decisions) / LOW (interesting, park for later)
- Suggested integration point

### 8. ASSUMPTIONS vs. FACTS
Only list items NOT already captured in artifacts. Focus on load-bearing assumptions and facts that, if wrong, would change work direction. Max 5-7 items total.
- Working assumptions (label confidence: HIGH / MEDIUM / LOW)
- Verified facts the work depends on (source if relevant)

### 9. CONTEXT A NEW SESSION NEEDS BUT MIGHT MISS
- Terminology or shorthand established during this session
- Frameworks or mental models built or modified
- Anything the receiving Claude might misinterpret without explicit framing

## GENERATION RULES
- Budget: 1,000-2,000 words total (compress ruthlessly; every word must earn its place)
- No filler, no summaries of summaries
- Use shorthand where meaning is unambiguous
- Prioritize decision rationale and active tensions over descriptive recaps
- If mid-process: weight toward "where we are and what's next"
- If end-of-session: weight toward "what was accomplished and what carries forward"

## SECOND OUTPUT: RECEIVING PROMPT

After producing the handover artifact, output a session-specific receiving prompt as a markdown code block in the chat body. Follow this template, filling bracketed sections with session-specific content:

~~~
## SESSION CONTINUATION: [descriptive label + mode]

[1-3 sentences: what we were doing, where we stopped, and the most important things to know to avoid misinterpretation of the handover.]

Please:
1. Parse the handover artifact [name]
2. Locate any artifacts flagged as CRITICAL in section 6 (uploaded to this session or available in project files)
3. Flag anything ambiguous or contradictory in the handover (only if genuine)
4. Proceed directly into the next action indicated in section 4
~~~
````

---

## Using the Output

You get **two things** every time:

1. **The handover artifact** — structured markdown document (9 sections). Save it as a file, add to project, or copy to a doc.
2. **The receiving prompt** — session-specific text block. This is the key mechanism. Paste it at the start of the new thread *before* uploading the artifact. It tells Claude to actively resume work rather than passively read.

**In the new thread, in this order:**
1. Paste the **receiving prompt**
2. Upload or paste artifacts flagged **CRITICAL** in section 6
3. Claude reads and resumes — REFERENCE-ONLY artifacts don't need uploading

---

## Tips (from Elizabeth)

- **Don't skip the receiving prompt.** Without it, Claude reads the handover passively. The prompt is what activates resumption.
- **Don't flag everything CRITICAL.** Only flag artifacts whose full content is genuinely needed. Section 6 summaries handle the rest.
- **Earlier is better.** A handover at message 20 is more accurate than one at message 40.
- **You can chain handovers.** Each session ends with its own handover; the new session only needs the most recent.
- **Counterintuitive:** A new thread loaded with the compressed handover often outperforms the original long thread. The compression removes noise.

---

## Related

- `wiki/mastermind/commands/grounded-query-protocol.md` — context-lock the new thread to your handover before it acts
- `wiki/mastermind/commands/multi-model-synthesis.md` — if continuing a multi-model deliberation

## Source

- [[wiki/mastermind/sessions/2026-02-19_Mastermind]] (Elizabeth Stief — context-carryover protocol)
