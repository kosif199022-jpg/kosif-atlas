# targetgroupbinding-unattached-tg-readiness-wedge

Diagnose and unwedge Kubernetes rollouts stuck because an AWS Load Balancer Controller TargetGroupBinding points at a target group no listener rule forwards to. Use when: (1) `helm upgrade` / a Deployment rollout times out with "context deadline exceeded" while every container in the new pods is healthy, (2) new pods show `Ready=False` with reason `ReadinessGatesNotReady` and a readiness gate named `target-health.elbv2.k8s.aws/<name>`, (3) `aws elbv2 describe-target-health` shows every target `unused` / `Target.NotInUse`, (4) a PodDisruptionBudget reports `ALLOWED DISRUPTIONS: 0` and node drains or consolidation (e.g. Karpenter) are blocked by a service that serves no traffic, (5) you staged a target group ahead of its listener rule "so it's ready for the cutover" and want to know why that wedges every future rollout. Core facts: the controller injects a target-health readiness gate into every pod a TargetGroupBinding matches; a target group attached to no load balancer listener keeps its targets permanently `Target.NotInUse`, so the gate can never pass. Unwedge with `kubectl delete targetgroupbinding`; durable fix is gating the binding separately from the target group and attaching the listener rule before the binding.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/targetgroupbinding-unattached-tg-readiness-wedge
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
