# fleet-propagate

Idempotent fleet-wide config propagation: enumerates host, dev containers, init scripts, and container-creator skills from a per-host manifest, applies changes as marker-delimited managed blocks (rerun-safe), verifies each target, bakes changes into creator skills so future containers inherit them, and reports a per-target changed/verified/needs-manual matrix.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/paat/claude-plugins/tree/e60ac1fa9cca11cdab467b0021e542ac0f94c56d/plugins/fleet-propagate
- Commit: `e60ac1fa9cca11cdab467b0021e542ac0f94c56d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
