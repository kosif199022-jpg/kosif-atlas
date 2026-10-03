# specguard

v0.2.52: shard 監査 subagent の「並列で同時に起動してよい」を最大 3 体ずつの波に変更 (run と spec-audit の両方)。shard は間引かない。 仕様↔実装 整合監査ハーネスを Claude Code から subscription-native に実行する。各 shard を read-only な in-session subagent で監査し (nested claude --print なし)、決定的ハーネス (scope/render/parse/report) は specguard バイナリに委譲する。

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/yukineko/claude-harnesses/tree/b0f626e4124af2e40becc1e1d2a52d0eb38cb1a7/crates/specguard
- Commit: `b0f626e4124af2e40becc1e1d2a52d0eb38cb1a7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
