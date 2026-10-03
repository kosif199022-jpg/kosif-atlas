# pr-amend-force-push-lost-to-racing-merge

A review-fix amend + force-push that lands after the reviewer's squash-merge succeeds silently and never reaches the default branch: the merge snapshots the head GitHub had when the merge ran, the later force-push still updates the branch ref without any warning, and the default branch keeps the pre-review version. Use when: (1) you force-pushed to a PR branch while the PR was under active review or had auto-merge armed, (2) a merged PR's requested change is mysteriously absent from the default branch though your branch has it, (3) a stacked follow-up branch starts failing validation after a rebase on something the amendment fixed (e.g. terraform's `Error: Reference to undeclared resource`), (4) `git show origin/<default>:<file>` shows the pre-amendment shape of a file you know you fixed. Covers the post-push detection check, the tree-diff test that works despite squash-merge ancestry breakage, and the carry-the-fix-forward recovery.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/pr-amend-force-push-lost-to-racing-merge
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
