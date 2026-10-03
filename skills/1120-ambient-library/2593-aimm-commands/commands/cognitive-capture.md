---
name: Cognitive Capture
type: command
description: Dual-capture prompt that extracts both operational knowledge (what you did) and cognitive knowledge (how you think) from a conversation or work session. Powers the cognitive twin — stores not just information but intelligence. Use at the end of any productive AI session to capture thinking patterns alongside task outputs.
trigger: /aimm:cognitive-capture
location: wiki/mastermind/commands/
source-sessions:
  - 2026-04-16_Mastermind
---

# Cognitive Capture

## The Problem This Solves

Most knowledge capture stops at the operational layer: what was done, what tools were used, what outputs produced. This is useful but shallow. The real value — especially for coaches, consultants, and knowledge entrepreneurs — lives in the *cognitive* layer: why decisions were made, what frameworks informed them, what questions were asked and what they reveal about thinking patterns. Without deliberate cognitive capture, your knowledge base stores information but not intelligence.

## The Command

Use at the end of any productive work session:

```
I want you to produce a dual-layer capture of this session.

**Layer 1 — Operational:**
- What we did, step by step
- What tools and resources were used
- What outputs were produced
- What decisions were made and what was decided

**Layer 2 — Cognitive:**
- Imagine you're documenting this process for someone else to learn — not just the steps, but the thinking behind them
- Pay specific attention to the feedback I gave, to try to get a sense of my perspectives, my frameworks, my thought patterns
- What patterns do you see in how I approach problems like this?
- What questions did I ask, and what do those questions reveal about my mental models?
- Where did I push back or redirect, and what does that tell you about my standards or values?
- What judgment calls did I make that someone else might have made differently?

Format the cognitive layer as insights about my thinking style, not as a narrative of what happened. The goal is to capture HOW I think, not just WHAT I did.
```

## Why Both Layers Matter

| Layer | What it captures | What it enables |
|---|---|---|
| Operational | Steps, tools, outputs, decisions | Reproducing the task |
| Cognitive | Frameworks, patterns, standards, judgment | Reproducing the *thinking* |

The operational layer lets you (or AI) redo the task. The cognitive layer lets you (or AI) approach *new* tasks the way you would. That's the difference between a knowledge base and a cognitive twin.

## Advanced: Blind Spot Detection

After the dual capture, add:

```
Now, based on the cognitive patterns you've identified, tell me:
- What are my blind spots? Where might my frameworks be limiting me?
- What patterns am I exhibiting that might be constraining my clients?
- Where could I improve based on what you've observed?
```

Don Back used this pattern with Opus analyzing his coaching interviews — it surfaced moments where he was unconsciously coaching during interviews that should have been purely diagnostic. The AI caught what his self-awareness missed.

## When to Use

- End of any productive AI conversation (minimum viable capture)
- After coaching or consulting sessions (especially recorded/transcribed ones)
- After problem-solving sessions where you made non-obvious judgment calls
- When building your knowledge vault or cognitive twin system

## Source

- [[wiki/mastermind/sessions/2026-04-16_Mastermind]] (Lou — cognitive twin directive, Don Back — blind spot detection in coaching interviews)
