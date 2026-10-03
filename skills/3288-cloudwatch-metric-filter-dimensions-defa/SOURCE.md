# cloudwatch-metric-filter-dimensions-default-value-exclusive

Catch the CloudWatch Logs metric-filter constraint that terraform cannot: a metric transformation may carry dimensions OR a default_value, never both - and the AWS provider has no plan-time guard, so the mistake sails through validate and plan and detonates only at apply. Use when: (1) an apply (often a merge-to-main auto-apply in CI) fails with "InvalidParameterException: Invalid metric transformation: dimensions and default value are mutually exclusive properties", (2) you are reviewing an aws_cloudwatch_log_metric_filter whose metric_transformation sets both default_value and dimensions, (3) you are deciding which of the two to drop and several environments publish the same metric name into one account+region. Core facts: the provider (verified on hashicorp/aws 6.56.0) declares no ConflictsWith between the arguments; the constraint can be settled empirically in seconds with `aws logs put-metric-filter` on a scratch log group; keep the dimension and drop default_value when the dimension is what separates environments - dropping the dimension instead blends their series into one.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/cloudwatch-metric-filter-dimensions-default-value-exclusive
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
