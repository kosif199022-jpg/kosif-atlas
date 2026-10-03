# handoff-self-monitoring

Structured-handoff discipline for the final message of a turn. Bundles the handoff-self-monitoring skill (the 'what': a close modelled on the SBAR / I-PASS handoff protocols - Status first, Situation in the reader's terms, the fork as Options with a default, one Next action - so a reader who has the message and not the trace can act on it) with per-host hooks (the 'when') that inject the format on the first closing-shaped tool call of a turn and scan the final message for a decision named but not handed off - an offer, a fork, a closing question, a returned coverage part - and for the [HANDOFF] block. Non-blocking by default; HANDMON_STRICT=1 blocks once. Codex: the same hooks/ adapter as Claude Code - same events, same payload, same output envelope; the hooks run once you trust them with /hooks.

- License: **Apache-2.0** (no license file shipped; see the source repository)
- Source: https://github.com/3dgiordano/agent-plugins/tree/06dd34daca8144c5b2cf754a0dfff54d86f17b66/plugins/handoff-self-monitoring
- Commit: `06dd34daca8144c5b2cf754a0dfff54d86f17b66`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 12, MCP servers: 0, scripts: 17). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
