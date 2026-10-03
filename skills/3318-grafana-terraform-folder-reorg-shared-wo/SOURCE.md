# grafana-terraform-folder-reorg-shared-workspace

Reorganise Grafana folders with the terraform provider when several terraform states deploy into one workspace, without losing a live dashboard: API-create then `import` shared folders (one state creating them 412s the others), in-place moves (only `uid` is ForceNew), retire a folder in two applies (a same-apply destroy runs first and Grafana cascade-deletes the dashboards), `-target` skips import blocks, and pin data-source uids so dependent dashboards do not plan as replaced.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/grafana-terraform-folder-reorg-shared-workspace
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
