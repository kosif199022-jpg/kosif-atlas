---
name: git-local-branch-cleaning
description: >
  Delete local (and their corresponding remote) branches that have been merged into main,
  have a deleted remote tracking ref, or whose PR is merged/closed. Use when the user asks
  to "clean up local branches", "delete merged branches", "prune local branches", or "git cleanup".
allowed-tools: Bash
invocation: user
---

# git-local-branch-cleaning

Clean up local branches that are no longer needed by running the bundled script.

## Workflow

Run the cleanup script:

```bash
bash <base_directory>/scripts/clean-branches.sh
```

Where `<base_directory>` is the path shown in "Base directory for this skill:" at the top of the skill invocation.

The script will:
1. Fetch and prune remote tracking refs
2. Find branches in any of these states:
   - Fully merged into `main`
   - Remote tracking ref gone (remote branch was deleted)
   - Corresponding PR is merged or closed (requires `gh` CLI)
3. Display the list of candidate branches and ask for confirmation
4. Delete confirmed branches locally with `git branch -d` / `git branch -D` and remove the matching remote branch if it still exists
5. Report what was deleted and what was skipped
