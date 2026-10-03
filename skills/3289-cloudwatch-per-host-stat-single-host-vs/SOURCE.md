# cloudwatch-per-host-stat-single-host-vs-fleet

Decide whether a CloudWatch alarm on a per-host application metric (Micrometer, Dropwizard, StatsD) reflects a fleet-wide incident or ONE sick host, and stop misreading its magnitude. Use when: (1) a per-host gauge/timer alarm fires and the Average looks catastrophic (e.g. an "average latency" of 21,242 when baseline is 2), (2) you are about to call an incident fleet-wide based on a CloudWatch Average, (3) a latency/queue-depth/pool-saturation metric spikes but request throughput and error counts stay flat, (4) you need to know the UNIT of a metric and get-metric-data did not return one. Covers the unweighted-mean-across-hosts trap, the Maximum/Sum concentration ratio, and SampleCount as a host-census signal.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/cloudwatch-per-host-stat-single-host-vs-fleet
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
