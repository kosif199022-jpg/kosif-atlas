# delivery-schedule

The unattended lane, stacked on delivery: the twenty schedule-* skills that run with nobody watching, plus init and update, plus the catalog of triggers that fires them. Eighteen schedulable entry points that pick their own input and run a flow, a review, a check, a sweep, or a report — devbook validate, devbook sweep, devbook verify, devbook update, instruction review, issue sweep, merge review, morning brief, package update, performance review, review, security review, tech update, week starter, weekly cost analysis, weekly retro, weekly update, and what's new — and fifteen trigger definitions naming a target, a cadence, the plugins that target needs, and the prompt for a local routine that runs unattended on this machine, never a cloud session. delivery-schedule:init creates them through whatever scheduler the live session exposes and stamps the selection under components.schedule, and delivery-schedule:update keeps them level with it; schedule-status reads their runs and logs; schedule-run fires one now. One capability, two host names: Routines in Claude Code, Automations in the GitHub Copilot app. Depends on delivery and names devbook: a trigger whose target is not enabled is reported and skipped, never scheduled.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/jsdotnet/devbook/tree/585d8b881ae5011f1cf21caaeafb7bf876e04e25/plugins/delivery-schedule
- Commit: `585d8b881ae5011f1cf21caaeafb7bf876e04e25`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 8). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
