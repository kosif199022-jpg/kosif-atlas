# terraform-iac

Terraform & IaC team — agents (iac-architect, terraform-module-engineer, iac-policy-and-state-engineer) for cloud-agnostic infrastructure-as-code: module design (composable, versioned, registry-published, the root-vs-child split), remote state and backend safety (locking, isolation by blast radius, no secrets in state), environment promotion (workspaces vs directories vs Terragrunt), drift detection, and policy-as-code guardrails (OPA/Sentinel/Conftest) in the plan pipeline. Terraform + OpenTofu. skills, a decision-tree knowledge bank (state-isolation + module-boundary trees + a dated 2026 tooling map), best-practices, templates, commands, an advisory hook. Seams: per-cloud resources -> azure-cloud (Bicep too)/aws-cloud/gcp-cloud, plan in CI -> devops-cicd, posture verdicts -> security-engineering. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/terraform-iac
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
