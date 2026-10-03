# Terraform / OpenTofu — code-craft reference

~70 rules across three buckets. Terraform 1.6+ and its OpenTofu fork (99% identical idioms). Covers HCL, providers, state, modules, variables, outputs, lifecycle, data sources, dynamic blocks, validation, testing. AWS examples because that's the target stack; rules are provider-agnostic where possible. AWS-resource-specific rules live in `aws-lambda-sam.md`.

Sources: [developer.hashicorp.com/terraform/docs](https://developer.hashicorp.com/terraform/docs), [Terraform recommended practices](https://developer.hashicorp.com/terraform/cloud-docs/recommended-practices), [opentofu.org/docs](https://opentofu.org/docs/), Brikman *Terraform: Up & Running* (4th ed., 2024), Anton Babenko / `terraform-aws-modules`, HashiCorp blog 2024–2025, env0 / Spacelift posts on stack tools.

Loaded by `code-craft` when the user asks about Terraform, OpenTofu, HCL, modules, state, or pastes `*.tf` / `*.tftest.hcl` for review.

---

## A — Tactical (day-to-day patterns)

### A1. Standard file layout
**Rule.** Split into `main.tf`, `variables.tf`, `outputs.tf`, `versions.tf`, `locals.tf`, `data.tf`; in larger configs split further by domain (`vpc.tf`, `iam.tf`).
**Reason.** Predictable file names; a 2000-line `main.tf` is unreviewable.
```text
versions.tf variables.tf outputs.tf locals.tf data.tf
vpc.tf eks.tf iam.tf rds.tf
```

### A2. Pin Terraform and providers
**Rule.** Every root module declares `required_version` and `required_providers` in the `terraform {}` block.
**Reason.** A teammate on a newer Terraform or provider can rewrite state in incompatible ways.
```hcl
terraform {
  required_version = "~> 1.9"
  required_providers { aws = { source = "hashicorp/aws", version = "~> 5.60" } }
}
```

### A3. Commit the lock file
**Rule.** Check `.terraform.lock.hcl` into git; do not `.gitignore` it.
**Reason.** Without it, providers resolve differently per machine and CI run.
```gitignore
.terraform/
*.tfstate*
# wrong: .terraform.lock.hcl
```

### A4. Variable hygiene: type, description, validation
**Rule.** Every `variable` has explicit `type`, `description`, sensible `default` if applicable, and `validation { condition; error_message }` for known constraints; group related fields into `object({...})` with `optional(type, default)`.
**Reason.** Untyped vars surface as cryptic provider errors; validation fails at plan instead of mid-apply; object types document grouped relationships.
```hcl
variable "log" {
  type        = object({ bucket = string, retention = optional(number, 30) })
  description = "Log destination."
  validation { condition = var.log.retention >= 1, error_message = "retention >= 1." }
}
```

### A5. Mark sensitive variables
**Rule.** `sensitive = true` on any variable carrying a secret.
**Reason.** Without the flag, secrets appear in plan and CI logs.
```hcl
variable "db_password" { type = string, sensitive = true }
```

### A6. Outputs: description always, sensitive for secrets
**Rule.** Every `output` has `description`; flag secrets with `sensitive = true`.
**Reason.** Outputs are the public API of a module; undocumented outputs are guesswork.
```hcl
output "db_endpoint" { value = aws_db_instance.main.endpoint, description = "DB endpoint." }
output "db_password" { value = aws_db_instance.main.password, sensitive = true, description = "DB master password." }
```

### A7. Locals for derived values
**Rule.** Use `locals` for values computed from variables/data; never as a stand-in for inputs.
**Reason.** Locals aren't overridable; per-env values must be variables.
```hcl
locals {
  name_prefix = "${var.project}-${var.env}"
  common_tags = { Project = var.project, Environment = var.env, ManagedBy = "terraform" }
}
```

### A8. snake_case, role-not-type labels
**Rule.** snake_case for resource labels, locals, variables, outputs; the resource label is the *role*, not the type.
**Reason.** Predictable naming makes refactors and `state` commands obvious.
```hcl
# wrong
resource "aws_s3_bucket" "myBucket" {}
# right
resource "aws_s3_bucket" "logs" {}
```

### A9. `default_tags` on the AWS provider
**Rule.** Set common tags once via `provider "aws" { default_tags { tags = local.common_tags } }`.
**Reason.** Cost allocation depends on every resource carrying `Environment`, `Project`, `Owner`, `ManagedBy`.
```hcl
provider "aws" { region = var.region, default_tags { tags = local.common_tags } }
```

### A10. Read existing infra via `data`
**Rule.** Prefer `data` sources (`aws_caller_identity`, `aws_region`, `aws_ssm_parameter`) over hardcoded IDs.
**Reason.** Configs become portable across accounts/regions without find-and-replace.
```hcl
data "aws_caller_identity" "current" {}
locals { account_id = data.aws_caller_identity.current.account_id }
```

### A11. `for_each` over `count` for keyed sets
**Rule.** Use `for_each = toset([...])` or `for_each = { k = v }` whenever resources have stable identity.
**Reason.** `count` indexes by position; removing one element shifts the rest and recreates them.
```hcl
# wrong
resource "aws_iam_user" "u" { count = length(var.users), name = var.users[count.index] }
# right
resource "aws_iam_user" "u" { for_each = toset(var.users), name = each.key }
```

### A12. `count` only for conditional creation
**Rule.** Use `count = var.create ? 1 : 0` for an optional resource; access via `[0]` with `try()`.
**Reason.** Canonical idiom for a single optional resource.
```hcl
resource "aws_kms_key" "encrypt" { count = var.encrypt ? 1 : 0 }
output "kms_arn" { value = try(aws_kms_key.encrypt[0].arn, null) }
```

### A13. `terraform fmt` and `validate` in CI
**Rule.** Run `terraform fmt -check -recursive` and `terraform validate` on every PR; fail on diff.
**Reason.** Style drift creates noisy diffs; missing validation hides typos.
```yaml
- run: terraform fmt -check -recursive
- run: terraform init -backend=false && terraform validate
```

### A14. `terraform plan` on every PR
**Rule.** CI runs `plan` against the target environment and posts the diff; a human approves before `apply`.
**Reason.** Plan is the only contract between intent and reality.
```yaml
- run: terraform plan -out=tfplan
- run: terraform show -no-color tfplan > plan.txt
```

### A15. `apply -auto-approve` only in CI/CD
**Rule.** Auto-approve runs only behind a branch gate after a reviewed plan; never from a laptop.
**Reason.** Auto-approve from a laptop skips the only safety check.
```bash
# right (CI on main)
terraform apply -auto-approve tfplan
```

### A16. Lifecycle: prevent_destroy / create_before_destroy / targeted ignore_changes
**Rule.** Use `prevent_destroy = true` on irrecoverable stores; `create_before_destroy = true` on resources whose replacement causes downtime (LBs, launch templates, SGs); `ignore_changes = [<attr>]` listing specific attributes — never `ignore_changes = all`.
**Reason.** Each flag deliberately addresses a known disaster mode; `all` silently swallows every diff including security-relevant ones.
```hcl
resource "aws_security_group" "app" {
  name_prefix = "app-"
  lifecycle { create_before_destroy = true, prevent_destroy = true, ignore_changes = [description] }
}
```

### A17. `terraform import` workflow
**Rule.** Write the resource block first, commit, then import (or use an `import` block — see B14).
**Reason.** Import without a matching block leaves orphaned state and the next plan tries to destroy it.
```hcl
resource "aws_s3_bucket" "legacy" { bucket = "legacy-prod" }
# terraform import aws_s3_bucket.legacy legacy-prod
```

### A18. `state mv` over hand-editing
**Rule.** Renaming uses `terraform state mv` (or a `moved` block — see B13); never edit `terraform.tfstate`.
**Reason.** Hand-edited state corrupts checksums and desyncs from cloud reality.
```bash
terraform state mv aws_s3_bucket.old aws_s3_bucket.logs
```

### A19. `destroy` only in non-prod
**Rule.** `terraform destroy` runs only against dev/preview workspaces; prod has policy guards.
**Reason.** Destroy against prod is the most expensive Ctrl+C in the world.

### A20. Split files past ~300 lines
**Rule.** Past ~300–500 lines, split by domain: `network.tf`, `compute.tf`, `iam.tf`.
**Reason.** PR review breaks down on giant single files; merge conflicts compound.

### A21. Resource label is the role
**Rule.** `resource "aws_s3_bucket" "logs"` not `"bucket"`; the label answers "what is this for?"
**Reason.** State addresses become self-documenting.
```hcl
# wrong: resource "aws_lb" "lb" {}
# right: resource "aws_lb" "public_api" {}
```

---

## B — Modern Terraform / OpenTofu idioms

### B1. Remote state with locking
**Rule.** Use a remote backend with locking: S3 + DynamoDB (or S3 native lockfile, TF 1.10+), GCS, Azure Blob, Terraform Cloud, Spacelift, env0.
**Reason.** Local state plus concurrent runs corrupts state.
```hcl
terraform {
  backend "s3" {
    bucket = "tf-state-prod", key = "platform/network.tfstate"
    region = "us-east-1", dynamodb_table = "tf-locks", encrypt = true
  }
}
```

### B2. One state per environment
**Rule.** `prod`, `staging`, `dev` live in separate state files, ideally separate backends with separate IAM.
**Reason.** A single state means a `dev` apply can blast `prod`, and prod creds are needed for a dev plan.

### B3. Workspaces vs separate backends
**Rule.** Workspaces are fine for parameterized variations of identical infra; for environments with different access controls, prefer separate backends.
**Reason.** Workspaces share a single backend bucket and IAM scope, so prod/dev access isn't actually isolated.
*Source: [Terraform recommended practices](https://developer.hashicorp.com/terraform/cloud-docs/recommended-practices/part1); Brikman, *Up & Running* 4th ed. ch. 3.*

### B4. Pin module sources
**Rule.** Module `source` includes a version: registry `version = "~> 5.0"` or git `?ref=v1.2.3` (tag, not branch).
**Reason.** Tracking `main` lets upstream changes break the next apply silently.
```hcl
module "vpc" { source = "terraform-aws-modules/vpc/aws", version = "~> 5.8" }
```

### B5. Module structure with terraform-docs
**Rule.** Every module ships `main.tf`, `variables.tf`, `outputs.tf`, `versions.tf`, and a `README.md` with auto-generated input/output tables (`terraform-docs`).
**Reason.** Hand-maintained docs drift; module without README forces consumers to read source.
```bash
terraform-docs markdown table --output-file README.md .
```

### B6. Composition over uber-modules
**Rule.** Build small, focused modules that compose; reject modules with 50+ inputs.
**Reason.** A module with 50 knobs is a leaky abstraction.
```hcl
module "vpc" { source = "./modules/vpc" }
module "eks" { source = "./modules/eks", subnet_ids = module.vpc.private_subnets }
```

### B7. No `provider {}` inside modules
**Rule.** Modules accept a configured provider via `configuration_aliases`; they don't declare `provider "aws" { region = ... }` themselves.
**Reason.** Embedded provider config makes a module unusable with multiple regions, accounts, or aliases.
```hcl
# right (in module)
terraform { required_providers { aws = { source = "hashicorp/aws", configuration_aliases = [aws.primary] } } }
```

### B8. Pre-commit + static analysis
**Rule.** `pre-commit-terraform` runs `fmt`, `validate`, `tflint`, `tfsec`/`checkov`, `terraform-docs`; mirror the same in CI.
**Reason.** Catches lint, security, and doc drift locally before CI.
```yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    hooks: [{id: terraform_fmt}, {id: terraform_validate}, {id: terraform_tflint}, {id: terraform_tfsec}]
```

### B9. Drift detection on a schedule
**Rule.** Run `terraform plan` nightly and alarm on a non-empty diff.
**Reason.** Out-of-band changes cause silent drift the next apply will revert.

### B10. `dynamic` blocks for repeating sub-blocks
**Rule.** Use `dynamic "ingress" { for_each = ...; content { ... } }` for repeated nested blocks.
**Reason.** Cleaner than chained `count`/`merge` and works with lists or maps.
```hcl
dynamic "ingress" {
  for_each = var.allowed_ports
  content { from_port = ingress.value, to_port = ingress.value, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
}
```

### B11. `for` expressions, `try`, `merge`
**Rule.** Derive lists/maps with `for ... if`; pair with `try()` for graceful access and `merge()` for tag composition.
**Reason.** Replaces ad-hoc `null_resource` and external scripts with pure HCL.
```hcl
locals {
  prod_subnets = [for s in var.subnets : s.id if s.tier == "prod"]
  tags         = merge(local.common_tags, { Name = try(var.name, "default") })
}
```

### B12. `moved` blocks for refactors
**Rule.** Renaming a resource is declared with `moved { from; to }` so plan shows a no-op.
**Reason.** Without it, a rename is destroy + create — downtime or data loss.
```hcl
moved { from = aws_s3_bucket.old, to = aws_s3_bucket.logs }
```

### B13. `import` blocks (TF 1.5+)
**Rule.** Adopt existing infra via `import { to; id }` blocks reviewed in PR; remove after first apply.
**Reason.** Reviewable and CI-friendly compared to `terraform import` from a laptop.
```hcl
import { to = aws_s3_bucket.legacy, id = "legacy-prod" }
resource "aws_s3_bucket" "legacy" { bucket = "legacy-prod" }
```

### B14. `removed` blocks (TF 1.7+)
**Rule.** Stop managing a resource without destroying it via `removed { from; lifecycle { destroy = false } }`.
**Reason.** Hands a resource off to another stack without losing data.
```hcl
removed { from = aws_s3_bucket.legacy, lifecycle { destroy = false } }
```

### B15. Native Terraform tests (TF 1.6+)
**Rule.** Cover modules with `*.tftest.hcl`: `run "name" { command = plan; assert { ... } }`.
**Reason.** Native, no extra runtime, runs in CI; replaces ad-hoc Terratest for most cases.
```hcl
run "vpc_has_three_azs" {
  command = plan
  assert { condition = length(module.vpc.azs) == 3, error_message = "VPC must span 3 AZs." }
}
```

### B16. Policy-as-code on plans
**Rule.** Gate `apply` on Sentinel (TFC/HCP) or OPA / Conftest policies that inspect plan JSON.
**Reason.** Mechanical guardrails (no public S3, no `0.0.0.0/0`, mandatory tags) catch what reviewers miss.
```bash
terraform show -json tfplan | conftest test -p policies/ -
```

### B17. OIDC for cloud auth in CI
**Rule.** GitHub Actions / GitLab CI assume an AWS role via OIDC; never store long-lived keys.
**Reason.** OIDC is short-lived and scoped to repo + branch; long-lived keys leak.
```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with: { role-to-assume: arn:aws:iam::123:role/tf-prod, aws-region: us-east-1 }
```

### B18. Aliased providers for multi-region / multi-account
**Rule.** Define `provider "aws" { alias = "..." }` (with `assume_role` for cross-account) and pass `provider = aws.alias` per resource.
**Reason.** ACM certs for CloudFront need `us-east-1`; cross-account resources need least-privilege role assumption.
```hcl
provider "aws" { alias = "us_east_1", region = "us-east-1" }
provider "aws" { alias = "shared", assume_role { role_arn = "arn:aws:iam::222:role/tf" } }
resource "aws_acm_certificate" "cf" { provider = aws.us_east_1 }
```

### B19. `terraform_data` and `replace_triggered_by`
**Rule.** Use `resource "terraform_data" "x"` (TF 1.4+) for managed lifecycle hooks, and `lifecycle { replace_triggered_by = [...] }` to force replacement on upstream changes.
**Reason.** Built-in, no extra provider, replaces the `null_resource` + script pattern for cross-resource invariants.
```hcl
resource "terraform_data" "deploy" { triggers_replace = [var.image_tag] }
resource "aws_instance" "x" { lifecycle { replace_triggered_by = [terraform_data.deploy] } }
```

### B20. `optional()` in object types
**Rule.** Mark backward-compatible fields with `optional(type, default)`.
**Reason.** Adding a field doesn't break callers.
```hcl
variable "bucket" {
  type = object({ name = string, versioned = optional(bool, true) })
}
```

### B21. Terraform vs OpenTofu — pick one
**Rule.** Choose Terraform (BSL) or OpenTofu (MPL fork) at project level and stick to it; OpenTofu is drop-in up to TF 1.5 and adds state encryption.
**Reason.** Mixing CLIs across the team causes lock-file and state drift.
*Source: [opentofu.org/docs](https://opentofu.org/docs/intro/), HashiCorp BSL announcement (Aug 2023).*

### B22. Stack tools — earn them
**Rule.** Reach for Terragrunt or Terramate once you have ~5+ stacks with shared backend wiring.
**Reason.** They solve real DRY problems but add a layer; introducing them at one stack is over-engineering.
*Source: env0 + Spacelift 2024 blog comparisons; Brikman ch. 8.*

### B23. Publish module outputs over remote state
**Rule.** Prefer consuming a sibling stack via SSM parameter or a published module output; reach for `terraform_remote_state` only when those don't fit.
**Reason.** `terraform_remote_state` couples consumers to the producer's backend layout.

### B24. Splat for `count`, `for` for `for_each`
**Rule.** `aws_x.y[*].arn` works for `count`; for `for_each` use `[for k, v in aws_x.y : v.arn]` or `values(aws_x.y)[*].arn`.
**Reason.** Splat doesn't apply directly to for_each maps.
```hcl
output "all_arns" { value = [for u in aws_iam_user.u : u.arn] }
```

---

## D — Anti-patterns / smells

### D1. Unpinned versions and lock file ignored
**Rule.** Missing `required_version` / `required_providers`, ignoring `.terraform.lock.hcl`, or pinning `~> X.Y` without committing the lock file.
**Reason.** Provider and TF drift across machines; `~> X` only protects you with the lock file's exact checksum.

### D2. Local or committed state with secrets
**Rule.** No `terraform.tfstate*` in the repo, no `.terraform/`, no `*.tfvars` with secrets; never `vim terraform.tfstate`.
**Reason.** Concurrent runs corrupt local state; state is plaintext for passwords; hand-edits desync from cloud.
```gitignore
.terraform/
*.tfstate
*.tfstate.*
*.tfvars
!example.tfvars
```

### D3. `count` misuse
**Rule.** Naked `count = 1`, or `count` over a list of items with identity, is a smell.
**Reason.** Wastes a `[0]` indirection; `count` indexes by position so removing one item recreates the rest.

### D4. Hardcoded account IDs / regions / endpoints
**Rule.** Don't hardcode `"123456789012"`, `"us-east-1"`, or env URLs in `*.tf`.
**Reason.** Configs become single-account, single-region; use `data` sources or variables.
```hcl
# wrong: "arn:aws:iam::123456789012:role/x"
# right: "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/x"
```

### D5. Duplicated env directories
**Rule.** Copy-pasted `dev/`, `staging/`, `prod/` with 95% identical `*.tf` is a smell; extract a module.
**Reason.** Drift across copies is inevitable.

### D6. Provisioners as escape hatch
**Rule.** Avoid `local-exec`/`remote-exec` and `null_resource` workarounds for things a real provider supports.
**Reason.** Not idempotent, invisible to plan, and don't roll back on failure.
```hcl
# wrong: provisioner "local-exec" { command = "aws s3 cp ..." }
# right: resource "aws_s3_object" "x" {}
```

### D7. `ignore_changes = all`
**Rule.** Never `ignore_changes = all`; list specific attributes.
**Reason.** Silently swallows every drift, including security-relevant changes.

### D8. No `prevent_destroy` on prod stateful resources
**Rule.** RDS, Aurora, S3 data buckets, DynamoDB in prod without `prevent_destroy = true` is a footgun.
**Reason.** A rename, destroy, or removed `for_each` key wipes the data.

### D9. `terraform destroy` on prod without a gate
**Rule.** Production state must reject `destroy` via Sentinel/OPA, IAM deny, or required approval.
**Reason.** Single-keystroke disasters.

### D10. Long-lived or hardcoded credentials
**Rule.** No personal IAM user keys for prod, no static `AWS_ACCESS_KEY_ID` in CI secrets, no `access_key`/`secret_key` in `provider {}`.
**Reason.** Long-lived keys leak; personal creds bypass audit; hardcoded keys check into git and state.
```hcl
# wrong: provider "aws" { access_key = "AKIA..." }
# right: OIDC + assume_role; env vars; named profiles
```

### D11. Giant `main.tf`, single state for everything
**Rule.** A `main.tf` past ~500 lines, or one state spanning network + compute + IAM + data, is a smell.
**Reason.** PR review collapses; blast radius on any change is platform-wide.

### D12. Workspaces as env boundaries with shared IAM
**Rule.** Using workspaces as the only prod/staging/dev separation when backend bucket and IAM are shared is a smell.
**Reason.** `terraform workspace select prod` from a dev shell is one keystroke from disaster; per-env backends + IAM denial enforce isolation.
*Source: [Terraform recommended practices](https://developer.hashicorp.com/terraform/cloud-docs/recommended-practices/part1).*

### D13. CI without plan, fmt, or security scan
**Rule.** CI must run `fmt -check`, `validate`, `plan`, `tflint`, and `tfsec`/`checkov`; commit→merge→apply with none of these is a smell.
**Reason.** Plan is the audit trail; lint/sec scans catch public S3, open SGs, unencrypted volumes; fmt prevents whitespace noise.

### D14. Plaintext secret in output
**Rule.** `output { value = aws_db.x.password }` without `sensitive = true` echoes it to logs.
**Reason.** Plan and apply output appear in CI logs.
```hcl
output "db_password" { value = aws_db.x.password, sensitive = true }
```

### D15. Untyped, unvalidated, undocumented inputs/outputs
**Rule.** Every `variable` and `output` needs a `type`, `description`, and (for known value sets) a `validation` block.
**Reason.** Untyped vars surface as cryptic provider errors; undocumented outputs are guesswork; missing validation defers errors to apply time.

### D16. Module embedded provider, 50+ inputs
**Rule.** Don't `provider "aws" { region = ... }` inside a reusable module, and reject 50-input "uber-modules".
**Reason.** Embedded providers block multi-region/multi-account use; giant input surfaces signal the module does too much.

### D17. Deprecated provider syntax
**Rule.** Migrate `aws_alb*` to `aws_lb*`; review the AWS provider upgrade guide on every major bump.
**Reason.** Deprecated names stop receiving features and silently fall through.

### D18. `terraform_remote_state` for tightly coupled stacks
**Rule.** Heavy `terraform_remote_state` use signals stacks that should be one, or coupling that should be SSM/secret-manager.
**Reason.** Hard-couples consumers to the producer's backend path.

### D19. `for_each` over an unknown set
**Rule.** `for_each = toset(aws_x.y[*].id)` against resources from the same apply fails because the set isn't known at plan time.
**Reason.** `for_each` keys must be known at plan time; split applies or use known sets.
```hcl
# wrong: for_each = toset(aws_subnet.s[*].id)
# right: pass IDs via a variable, or split applies
```

### D20. State surgery to "fix" plans
**Rule.** Avoid `terraform state rm` to silence stuck plans, hand-edited state files, renames without a `moved` block, and `import` against an unwritten address.
**Reason.** Papers over real bugs; rename without `moved` is destroy + create; import without a block leaves orphaned state.

### D21. Wildcard IAM policies
**Rule.** `Resource = "*"` and `Action = "*"` in TF-managed IAM is a smell; scope to ARNs and action prefixes.
**Reason.** Privilege escalation by default.
```hcl
# right: actions = ["s3:GetObject"], resources = ["${aws_s3_bucket.x.arn}/*"]
```

### D22. No tagging strategy
**Rule.** Resources without `Environment`, `Project`, `Owner`, `ManagedBy` can't be allocated by cost or owned in incidents.
**Reason.** Cost reports and on-call escalation depend on tags.

### D23. Cyclic modules, output type churn
**Rule.** Modules with cyclic dependencies, or outputs whose type changes across versions, break consumers.
**Reason.** Terraform's graph won't apply cycles; downstream consumers break silently when a string output becomes a list.

### D24. `terraform graph` as documentation
**Rule.** Don't paste `terraform graph` DOT output into a README; use `terraform-docs` and proper architecture diagrams.
**Reason.** Graph output is unreadable past ~10 nodes and goes stale immediately.

### D25. Conditional resource without explanation
**Rule.** A `count = var.feature_flag ? 1 : 0` resource with no comment is a smell.
**Reason.** Optional resources are read most often when something is broken; readers need the context.

---

## Sources

- Terraform Documentation: <https://developer.hashicorp.com/terraform/docs>
- Terraform Recommended Practices: <https://developer.hashicorp.com/terraform/cloud-docs/recommended-practices>
- Terraform Language Reference: <https://developer.hashicorp.com/terraform/language>
- OpenTofu Documentation: <https://opentofu.org/docs/>
- Terraform AWS Provider: <https://registry.terraform.io/providers/hashicorp/aws/latest/docs>
- Yevgeniy Brikman, *Terraform: Up & Running*, 4th ed. (O'Reilly, 2024)
- Anton Babenko, `terraform-aws-modules`: <https://github.com/terraform-aws-modules>
- HashiCorp Blog: <https://www.hashicorp.com/blog>
- pre-commit-terraform: <https://github.com/antonbabenko/pre-commit-terraform>
- tflint: <https://github.com/terraform-linters/tflint>
- tfsec / Trivy: <https://aquasecurity.github.io/tfsec/>
- Checkov: <https://www.checkov.io/>
- Terragrunt: <https://terragrunt.gruntwork.io/>
- Terramate: <https://terramate.io/docs/>
- env0 / Spacelift blog posts on stack tools, 2024–2025
