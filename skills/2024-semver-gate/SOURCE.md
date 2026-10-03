# semver-gate

Classify a candidate action as PATCH/MINOR/MAJOR (semver-style blast-radius test) before acting — act silently on PATCH, flag-and-stage MINOR, stop for explicit human sign-off on MAJOR. Use whenever you're mid-task and unsure how much autonomy to take on the next action: which of several implementation paths to pick, whether to overwrite unreviewed state, whether to disable a safety toggle, or any judgment call settings.json's autoMode patterns don't enumerate.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/jrichlen/agent-plugins/tree/013353ad6ae0efb71384e0e14a0196b1be1884f6/plugins/semver-gate
- Commit: `013353ad6ae0efb71384e0e14a0196b1be1884f6`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
