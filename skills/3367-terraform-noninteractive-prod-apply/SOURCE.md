# terraform-noninteractive-prod-apply

Apply terraform to production non-interactively when the repo's apply.sh/deploy.sh wrapper calls terraform apply without -auto-approve and hangs on the approval prompt. Covers why `echo yes | ./apply.sh prod` approves an unseen recomputed plan, the plan -out/apply <file> alternative that fails closed on stale state, reproducing a wrapper's auto-detected variables and init flags, and why a saved plan file is a secret.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/terraform-noninteractive-prod-apply
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
