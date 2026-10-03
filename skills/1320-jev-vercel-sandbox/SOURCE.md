# jev-vercel-sandbox

A Vercel Sandbox Claude sends work to on purpose: long test runs in the background, someone else's repository, an installer of unknown origin, a bulk change to preview as a patch, a clean build. TypeSafe's Jev reads each Bash command and spots those jobs; by default you are asked whether it runs in the sandbox or locally (confirmSandbox), or it always goes to the sandbox with the question off. Claude also gets sandbox_run, sandbox_jobs, sandbox_result and sandbox_apply. Each job starts from the project as it is now (tracked files, credentials left out) in its own worktree, every result is marked remote, and a job's changes reach your disk only as a patch you apply after a question. /jev-vercel-sandbox starts it and opens a side pane with the jobs. Falls back to the engine's built-in classifier without a Jev key. Needs function hooks (early access).

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/davila7/claude-code-templates/tree/8b1f88342619330b6306ee318f57f2cd5b78789d/cli-tool/components/mods/security/jev-vercel-sandbox
- Commit: `8b1f88342619330b6306ee318f57f2cd5b78789d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 5). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
