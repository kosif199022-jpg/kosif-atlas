---
name: conversation-audit-codify
description: End-of-session audit command. Reviews the conversation for decisions, fixes, and discoveries made during an iterative work session, then updates the relevant skill, code, or documentation to reflect them as permanent root-cause changes. Prevents session insights from evaporating when the context window closes. Use after any iterative session involving debugging, skill refinement, prompt improvement, or document development.
type: command
source-session: "[[2026-04-09_Mastermind]]"
source-insight: "[[Insight - The Conversation Audit Technique — Never Let a Session's Fixes Evaporate]]"
---

# Conversation Audit & Codify

## The Problem This Solves

When you iterate with Claude — building a skill, debugging code, refining a prompt, developing a document — you make many micro-decisions: you fix an error, add a constraint, discover a missing requirement, adjust a format. The output improves. But the skill (or code, or document) doesn't automatically update. Those decisions live only in the chat. When the session ends, they evaporate.

This command closes that loop.

## The Command (Short Form)

Use at the end of any iterative session:

```
Audit and codify. Review our conversation, find everything we decided, fixed, or figured out, and make sure it's reflected in [the skill / the code / the document] as permanent root-cause changes — not workarounds.
```

## The Command (Full Form)

```
Audit our conversation and codify everything into [the skill / the code / the document]:

1. Read back through our full conversation
2. List every decision we made, every error we fixed, every constraint we discovered, every format or structure we updated
3. For each item: identify where it belongs in [the skill / the code / the document] and update it there as a root-cause fix
4. Do not just fix the current output — update the underlying instruction so this never needs fixing again
5. When done, confirm what was updated and where
```

## When to Use

Run this command after any session that included any of:
- An error found and fixed
- A decision about how something should work
- A new constraint or edge case identified
- A quality issue addressed
- A format or output structure updated
- A question answered that the skill/code didn't previously know to ask

If the session was purely generative (brainstorming, drafting, ideating) with no fixes or structural decisions, the audit adds less value.

## Target (specify what to update)

Be explicit about what you want updated:
- `...in the skill` → updates SKILL.md and any resource files in the skill folder
- `...in the code` → updates the relevant script or function files
- `...in the document` → updates the document you were developing
- `...in the prompt` → updates the prompt file
- `...in all of the above` → comprehensive update across all artifacts created or modified in the session

## Typical Output

Claude will:
1. List the items it found (decisions, fixes, discoveries)
2. Show what it updated and where
3. Note any items it flagged as outstanding (known issues not yet resolved)

Review the list. If something was missed or placed in the wrong location, correct it directly.

## Origin

Demonstrated live by Lou during the April 9, 2026 mastermind session while building the Brand Writing Team skill. The exact phrasing used: "Audit our conversation, and take everything that we decided, or we fixed, and make sure we reflect it in the skill in the appropriate place."
