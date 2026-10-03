---
name: Tool Diagnostic
type: command
description: When AI fails at a task, shift from complaining to solving by asking what tools, connectors, MCPs, scripts, or APIs it would need to do the job properly. Diagnoses tooling gaps rather than blaming model intelligence. Extracted from Lou's live troubleshooting of Dirk's domain-search failures.
trigger: /aimm:tool-diagnostic
location: wiki/mastermind/commands/
source-sessions:
  - 2026-04-16_Mastermind
---

# Tool Diagnostic

## The Problem This Solves

When AI produces wrong, confabulated, or incomplete results, the natural response is frustration: "Why can't you do this simple thing?" But the failure is often a *tooling gap*, not an intelligence gap. Claude Chat without web access will confabulate domain availability data. Claude Co-work with Fire Crawl will check real registrar APIs. Same model. Different tools. This command shifts the diagnosis from "the AI is broken" to "the AI is missing a capability."

## The Command

When AI fails at a task or produces suspicious results:

```
I need you to do [TASK] properly, not approximately.

Before attempting it again, answer these questions:

1. What tools, connectors, MCPs, scripts, or APIs would you need to do this task with real data (not guesses or cached knowledge)?
2. Which of those do you currently have access to in this session?
3. What's the gap between what you have and what you need?
4. For each missing capability, what's the simplest way to add it? (MCP server, script, API key, different interface mode, etc.)

Make a plan to close the gap, then execute. If you can't close the gap in this session, tell me exactly what I need to set up.
```

## The Reframe

| Instead of... | Ask... |
|---|---|
| "Why can't you find this?" | "What tool would you need to find this properly?" |
| "Your answer is wrong" | "Did you use real data or generate a plausible guess?" |
| "This AI is useless" | "Am I in the right interface mode for this task?" |

## Quick Mode Check

| Task needs | Use |
|---|---|
| Discussion, brainstorming, writing | Claude Chat (Talk) |
| File access, web tools, task execution | Claude Co-work (Do) |
| Full construction, skills, scripts | Claude Code (Build) |

Most "Claude is broken" experiences happen in Chat when the task actually needs Co-work or Code capabilities.

## Evidence

Dirk asked Claude to find and check domain name availability. Claude confidently returned results that turned out to be fabricated — the domains were either taken or didn't exist at the prices quoted. Lou diagnosed the problem: Claude Chat has no domain registrar API access. He switched to Claude Co-work with Fire Crawl enabled and successfully checked 5 of 6 domains with real availability and pricing data on the first attempt.

## Source

- [[wiki/mastermind/sessions/2026-04-16_Mastermind]] (Lou — Dirk troubleshooting, tools vs intelligence diagnosis)
