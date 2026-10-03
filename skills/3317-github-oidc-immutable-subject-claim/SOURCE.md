# github-oidc-immutable-subject-claim

Diagnose a GitHub Actions job that fails to assume an AWS role by OIDC with "Not authorized to perform sts:AssumeRoleWithWebIdentity" even though the trust policy allows the whole org and every sibling repo works: GitHub is migrating the OIDC subject claim to the immutable form repo:ORG@ORG_ID/REPO@REPO_ID, which a repo:ORG/* StringLike cannot match. Covers reading the real sub claim without printing the token, the sub_claim_prefix API that finds it with no CI round trip, and the forward-compatible trust-policy patch.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/github-oidc-immutable-subject-claim
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
