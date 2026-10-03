---
name: skill-teaching
description: Deprecated. Use this skill only to tell the user that skill synchronization has moved to the agent-skills plugin.
---

# Skill Teaching Deprecated

The `skill-teaching` plugin is deprecated. Do not run its sync script, do not copy skills, and do
not modify agent skill folders through this skill.

When this skill is invoked, respond in English with this guidance:

```text
The skill-teaching plugin is deprecated.

Use the agent-skills plugin instead:

- Run agent-skills-init to migrate existing hidden agent skill folders into the visible agent-skills/ folder.
- Run agent-skills-share to create local symlinks from agent-specific skill folders to agent-skills/.
```

## Replacement

Use `agent-skills-init` for the one-time migration into `agent-skills/`.
Use `agent-skills-share` to link agent-specific skill folders to `agent-skills/` on each device.
