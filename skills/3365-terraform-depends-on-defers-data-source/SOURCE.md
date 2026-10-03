# terraform-depends-on-defers-data-source-forced-replacement

A terraform plan proposes `delete, create` (or "must be replaced") on a resource nothing in your diff touched, and the forcing attribute reads `(known after apply)`. Use when: (1) a plan shows `# forces replacement` on `name`, `bucket`, `identifier` or similar for a resource you did not edit, (2) the value is built from a `data` source such as `data.aws_region.current.id`, `data.aws_caller_identity.current.account_id` or `data.aws_availability_zones`, (3) the module declaring it has a module-level `depends_on`, (4) an apply already happened and a workload now fails with `The security token included in the request is invalid` or `The AWS Access Key Id you provided does not exist in our records` on a policy you can prove is correct. Covers why a module `depends_on` makes every data source inside it unknown at plan time, why that silently escalates to resource replacement, and why a replaced IAM role breaks running pods for up to an hour with errors that misdirect to IAM.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/terraform-depends-on-defers-data-source-forced-replacement
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
