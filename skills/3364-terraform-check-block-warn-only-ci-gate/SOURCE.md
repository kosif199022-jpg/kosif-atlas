# terraform-check-block-warn-only-ci-gate

Make Terraform `check` blocks actually fail CI. Use when: (1) you wrote a check block to guard an invariant (e.g. a set of secret values must be pairwise distinct) and discovered `terraform plan` prints the failure as a Warning and exits 0, so the CI plan step stays green, (2) you are reviewing a PR that encodes a safety guard as a check block and need to know whether anything enforces it, (3) you need a guard over sensitive values whose failure message must name the offending items without leaking them. Core facts: check blocks are advisory by design - failed assertions never affect plan/apply exit status, so a guard written as one is silent by construction; the working CI gate is `set -o pipefail` + `tee` the plan output + grep for "Check block assertion failed" and exit 1; write the error_message to name offenders via nonsensitive() applied to KEYS only, never values. Proven end to end: a forced collision exits 1 and names the colliding pair with no values leaked; the passing path leaves plan behavior unchanged.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/terraform-check-block-warn-only-ci-gate
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
