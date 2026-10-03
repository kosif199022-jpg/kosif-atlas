# terraform-ecs-capacity-provider-staged-teardown

Tear down an ECS-on-EC2 capacity-provider stack when a single terraform apply deadlocks with ResourceInUseException: destroy order is the reverse of the dependency graph, so compute tears down before the workload; split into two sequential untargeted applies, workload first, infra second.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/terraform-ecs-capacity-provider-staged-teardown
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
