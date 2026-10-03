# alb-per-rule-traffic-attribution

Determine which caller sends traffic to which ALB listener rule, and how much, before flipping or retiring that rule. Use when: (1) you need to prove a listener rule is safe to change and are looking for a CloudWatch metric per rule — there isn't one, (2) you grouped ALB access logs by `matched_rule_priority` and the numbers look wrong or a single endpoint appears under two priorities, (3) several services share one credential so the ALB cannot tell them apart, (4) you must identify an unknown HTTP client seen only as a User-Agent in access logs, (5) `SHOW PARTITIONS` on an ALB-logs Athena table returns nothing, (6) a windowed total looks low, or the "same" query returns different counts on different days — the log bucket's S3 lifecycle expiry (often 3 days) silently truncates any longer window, so a "weekly" total is really a retention-window total. Core trap: `matched_rule_priority` is a POSITION, not an identity — inserting a listener rule renumbers every rule below it, so the same priority means different rules on either side of that deploy, and a query spanning the change silently mislabels everything. Attribute by `request_url` + `user_agent` instead, quote per-day rates, and report the window the data has (min/max date), not the one the WHERE clause asked for.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/alb-per-rule-traffic-attribution
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
