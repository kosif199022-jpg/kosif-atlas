# cost-ledger

issue / PR 単位の API 換算コストを、Claude Code の会話ログ（`${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects/**/*.jsonl`）から集計する。帰属はブランチと（リポジトリ識別子, issue 番号）の 2 本立てで、サブエージェント（isSidechain）の消費も同じブランチに寄せる。`/cost <番号>` で PR ならヘッドブランチの総額、issue なら投稿を境界に切った区間の合計を USD と円で返す。pr-review-gate が `agent-review:passed` を付けた直後に、PostToolUse の hook がその PR へ `/cost` の 1 行目を 1 本のコメントで貼る（環境変数 `COST_LEDGER_GATE_REPORT=off` で止まる）。実行時に python3（3.8 以上）と、番号の判別に認証済みの gh を必要とする。git は 2.31 以上（rev-parse --path-format=absolute を使う）。

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/oratta/claude-harness/tree/bb2c104de5774e68780de24bbcdd2758123cdf8c/plugins/cost-ledger
- Commit: `bb2c104de5774e68780de24bbcdd2758123cdf8c`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
