---
name: Voice Activator
type: command
description: Draft content in your voice by activating Claude's accumulated knowledge of your communication style, then running a self-critique loop to close the gap between "polished AI prose" and how you actually write. Based on Lou Dallo's "knowing what you know about me" technique.
source: Lou Dallo — Mar 19, 2026 AIMM session on "knowing what you know about me" technique
trigger: /aimm:voice-activator
location: wiki/mastermind/commands/
source-sessions:
  - 2026-03-19_Mastermind
---

# Voice Activator

Draft content in your voice by activating Claude's accumulated knowledge of your communication style, then running a self-critique loop to close the gap between "polished AI prose" and how you actually write. Based on Lou Dallo's "knowing what you know about me" technique.

---

Knowing what you know about me — my communication style, how I frame problems, the language I use, the stances I tend to take — here is what I need:

$ARGUMENTS

If no content request was provided above, ask me what I'd like drafted.

After you produce the draft, do not stop. Continue with this self-critique sequence:

**Step 1 — Honest assessment.** Pause and review what you know about me from our conversation history, memory, and custom instructions. Ask yourself: does this draft sound like me, or does it sound like polished AI prose? Be specific about where the gaps are.

**Step 2 — Name the differences.** List 3-5 concrete differences between how I'd actually write this and how this draft reads. Consider: how I open (do I set the stage or walk in swinging?), sentence density (do I pack or unpack?), tone (do I hedge or stake claims?), transitions (smooth or abrupt?), and vocabulary (formal or conversational?). Don't be diplomatic.

**Step 3 — Rewrite.** Produce a second draft that incorporates those differences. This version should feel like it came from me, not from a writing assistant who studied my style guide.

**Step 4 — Flag residual gaps.** Tell me which aspects of the rewrite you're least confident about matching to my voice, so I can correct them and sharpen your model of how I communicate.

## Source

- [[wiki/mastermind/sessions/2026-03-19_Mastermind]] (Lou Dallo — "knowing what you know about me" technique)
