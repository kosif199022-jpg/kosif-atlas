# git-worktree-add-relative-path-nests-inside-repo

Fix a git worktree that landed INSIDE the repo instead of the sibling worktrees directory. Use when: (1) you ran `git worktree add <relative/path> <branch>` from within the repo and the worktree appeared at `<repo>/<relative/path>` instead of a sibling like `<repo>.worktrees/<name>`, (2) your convention keeps worktrees in a sibling dir (e.g. `project.worktrees/feature/x`) but a new one nested under the repo root, (3) a nested worktree is now polluting `git status` / risks being tracked. Root cause: `git worktree add` resolves a RELATIVE path against the current working directory (the repo root when run from inside), not against the repo's parent. Fix with an absolute path, or relocate a mistaken one with `git worktree move`.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/git-worktree-add-relative-path-nests-inside-repo
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
