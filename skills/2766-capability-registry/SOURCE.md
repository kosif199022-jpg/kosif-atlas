# capability-registry

外部サービスを操作する前に CLI とトークンの在処を教える発見層プラグイン。skills/capability-registry: サービス索引（CLI 名 / 認証確認コマンド / fmtoken.sh によるトークン取得 / ブラウザ必須の例外 / CLI が無いネガティブエントリ）を description トリガーで全セッションに常駐させ、CLAUDE.md 無編集で発火する。scripts/fmtoken.sh: 1Password の agents 保管庫からトークンを引く・登録するラッパー（読み取りは read-only SA でプロジェクトスコープ / --name で明示名参照 / --register は書き込み用 SA claude-agents-rw 経由で命名規約 <project>--<service> / <agent>--<SERVICE> を機械検証して登録。flatmate から移設、全プロジェクト共通の道具）。hooks: ブラウザ系 MCP ツールの PreToolUse でセッション初回のみ CLI 代替の検討を促す注意喚起を注入する（deny はしない）。

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/oratta/claude-harness/tree/bb2c104de5774e68780de24bbcdd2758123cdf8c/plugins/capability-registry
- Commit: `bb2c104de5774e68780de24bbcdd2758123cdf8c`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 2). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
