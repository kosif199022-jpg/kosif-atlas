# Context — {{NAME}}

**Purpose:** (one sentence)

This file routes to the app docs. It does not copy them. Read a doc only
when the task needs it.

## Commands

| Task | Command |
|---|---|
| dev | |
| build | |
| test | |
| e2e | |

## Files

| Path | What it is | Read when |
|---|---|---|
| `.aai/instructions.md` | vibe mode stamp | always, first |
| `.aai/identity.md` | project identity and ground rules | always |
| `.aai/memory/vibe/log.md` | one entry for each request | start of each session (last entries) |
| `PLAN.md` | tier-L plan: locked decisions, components, status | start of each session, if it exists |
| `FUNCSPEC.md` | stack, key files, data, behavior | before you change code you have not read |
| `PRD.md` | numbered requirements | step 1 (next number) and the Docs step |
| `README.md` | install and quickstart | setup questions and the Docs step |
| `USERGUIDE.md` | tasks in the app | usage questions and the Docs step |
| `.aai/skills/vibe/` | project fork of vibe, if present | resolving the capability |
| `.ailib/vibe/` | vendored vibe capability | resolving the capability |
