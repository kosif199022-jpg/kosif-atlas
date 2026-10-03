# repo-hygiene

Workspace tidying decided by the filesystem and git alone, with no source comprehension anywhere in it: filesystem garbage and shell-redirection artifacts, generated artifacts tracked in git (checked against publication conventions before anything is proposed for untracking), .gitignore completeness per ecosystem and archaeology over stale and overly-broad rules with git check-ignore provenance, scratch and pipeline-output directories, orphan doc-assets widened past literal Markdown links to configs, stylesheets and templates, and git auxiliary state. One check catalog with a full and a lite profile, so the diff-scoped pass inside a code review and the whole-tree pass share definitions and cannot drift. /repo-hygiene:tidy detects by default and applies under --fix or --commit; untracked removals are quarantined rather than deleted, git rm --cached is confirmed per item, and the git-state dimension is permanently detection-only because a dropped stash or a removed worktree leaves no diff for a per-phase commit to revert.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/acaprino/daodan/tree/39443d215d28fcbc32d651895b3cc45c64f24b6f/exports/codex/plugins/repo-hygiene
- Commit: `39443d215d28fcbc32d651895b3cc45c64f24b6f`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
