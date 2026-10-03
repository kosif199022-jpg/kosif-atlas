# devbook-openspec

The change lane: installs and configures the OpenSpec CLI so a change to a repository is proposed, agreed, built step by step, and archived as deltas against its devbook chapters — never a copy of OpenSpec's skills. init checks the CLI against the stamped range, runs openspec init at the repository root, writes the managed devbook schema (proposal → devbook-delta → solution → tasks) and a seeded config.yaml, removes the specs/ folder the CLI scaffolds, installs the change-folder rule with a wrapper per host, and stamps components.openspec; update runs openspec update and refreshes what it manages. Four providers an engine can bind by name: spec returns an approved change's specification unchanged, tracker keeps tasks.md as the work items with read_item, update_item, and comment, status reports steps, verdicts, and both gates, and archive checks the gates, merges every delta through devbook's delta.mjs, and lets openspec archive move the folder. onboard walks a first change through. An L1 extension over devbook.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/jsdotnet/devbook/tree/585d8b881ae5011f1cf21caaeafb7bf876e04e25/plugins/devbook-openspec
- Commit: `585d8b881ae5011f1cf21caaeafb7bf876e04e25`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
