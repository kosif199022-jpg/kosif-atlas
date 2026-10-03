# statusline

使用量が一目で分かる Claude Code ステータスライン。5h / 7d（全体・Fable）のレートリミットを、クォータ消化率をバーの塗り・窓の日程消化率をバー下端の細線と分母（例 25%/29%）で同時に表示し、「今のペースでリセットまで持つか」を色で示す。コンテキスト残量と ccusage 由来の API 換算月額ペース、このセッション（サブエージェント込み）の API 換算コストも表示。`/statusline:setup` で settings.json への配線まで行う。 複数の Claude アカウント（`CLAUDE_SECURESTORAGE_CONFIG_DIR` で認証だけ分けた運用）を使っている場合は、`accounts.json` にスロットを列挙するとアカウントごとに 2 行ずつ並べ、いま使っていないアカウントはセッション記録（`.usage-sessions/`）と snapshot の値と取得からの経過時間で表示する（Codex 無効でレジストリが無ければ従来の表示を維持）。 複数アカウント表示では、いま使っているアカウントの行に `▸` を付け label を明るく描いて区別する。

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/oratta/claude-harness/tree/bb2c104de5774e68780de24bbcdd2758123cdf8c/plugins/statusline
- Commit: `bb2c104de5774e68780de24bbcdd2758123cdf8c`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 5). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
