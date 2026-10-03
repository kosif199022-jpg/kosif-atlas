# secretsmanager-prove-no-consumer-before-destroy

Prove nothing consumes an AWS Secrets Manager secret before a terraform plan destroys it: query CloudTrail per resource, classify GetSecretValue (a real consumer) against DescribeSecret/GetResourcePolicy (your own CLI and posture scanners), subtract your own terraform refresh, and check reversibility separately -- because a populated LastAccessedDate is not evidence of use.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/secretsmanager-prove-no-consumer-before-destroy
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
