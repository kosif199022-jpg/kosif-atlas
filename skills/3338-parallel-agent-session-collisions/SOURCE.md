# parallel-agent-session-collisions

Avoid duplicating, superseding, or clobbering work done by another agent session on the same repos: the three collision shapes, the pre-flight check for each, and how to reconcile without losing the better version. Also covers the collision that no artifact check can catch -- two sessions both about to do the same work, with nothing pushed for `gh pr list` to find -- detected by enumerating live peer sessions and asking directly, then split into named lanes with an explicit gate and the decision routed through the shared human. v1.2.0 moves the peer check earlier still: to the first act that CLAIMS shared state -- git worktree add / checkout -b -- because two sessions given the same issue derive the same branch name by default, and a live drill showed both colliding there an hour before either noticed. Adds the rule that you never `git add -A` in a tree you do not exclusively own (that is how one session's commit silently absorbed another's work under a wrong message), and how to read a peer's silence from its ListAgents state, where `waiting` means blocked on user input and your message will not be processed until a human interacts.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/parallel-agent-session-collisions
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
