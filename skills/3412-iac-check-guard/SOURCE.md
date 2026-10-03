# iac-check-guard

PreToolUse/Bash hook that blocks IaC write/destructive commands (ansible-playbook/ansible-pull without --check, ad-hoc ansible write modules, terragrunt/tofu/terraform apply-family including mise-wrapped forms), so agents never apply changes to real infrastructure.

- License: **MIT**
- Source: https://github.com/widnyana/eyay-toolkits/tree/50e222e396d3ea0b9a9cc65c4a5cf58d3c1cfa39/plugins/iac-check-guard
- Commit: `50e222e396d3ea0b9a9cc65c4a5cf58d3c1cfa39`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
