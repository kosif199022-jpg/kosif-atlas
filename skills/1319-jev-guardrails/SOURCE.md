# jev-guardrails

Screens every prompt going into the conversation and every reply coming out of it with TypeSafe's Jev, a System One decision model, the way TypeSafe's guardrails cookbook does: one request per message asks a battery of hazard questions (jailbreak, harm or a crime, a diagnosis or a dosage, self-harm) and scores how much harm complying would do. The thresholds live here, in a named policy (strict or permissive), and turn the probabilities into pass, review (the user is asked), block (the prompt is dropped, or the reply withheld) or support. Falls back to the engine's built-in classifier when no key is set.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/davila7/claude-code-templates/tree/8b1f88342619330b6306ee318f57f2cd5b78789d/cli-tool/components/mods/security/jev-guardrails
- Commit: `8b1f88342619330b6306ee318f57f2cd5b78789d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
