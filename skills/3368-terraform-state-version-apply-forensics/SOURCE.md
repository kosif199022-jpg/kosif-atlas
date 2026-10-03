# terraform-state-version-apply-forensics

Prove whether a terraform change was actually applied to an environment: census the versioned S3 tfstate objects over time (serial + resource-type counts) and cross-check CloudTrail, to tell a real apply from a reverted one, identify which variant of a stacked change ran, and separate untracked orphans from failed destroys.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/terraform-state-version-apply-forensics
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
