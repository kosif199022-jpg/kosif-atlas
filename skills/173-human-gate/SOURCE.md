# human-gate

The human-verification lane for an agent loop. Builds a single-file HTML review page for a Markdown or HTML artifact (opens over file://, makes no network request of its own, and sanitizes reviewed HTML -- on* handlers, javascript: URLs and iframes are dropped so a draft cannot execute inside the page), collects batched feedback as a structured batch.v1 artifact instead of chat prose, and runs a gate that refuses to close while a BLOCKER is open, the reviewer is unnamed, the sidecar changed after collection, the round carries unresolved integrity problems (a mistyped severity silently downgrades to NIT, so a real blocker can be lost to a typo), or nobody has reviewed at all. Non-blocking by design: no poll loop, a headless guard, a round cap, and escalation on exhaustion. Feedback lands in a hand-writable Markdown sidecar, so the loop still works over SSH and in CI where no browser exists. Use before shipping a plan, spec, RFC, report, or any irreversible action, or when the user says 'let me review that', 'get sign-off', or 'don't ship until I've seen it'. The human counterpart to agent-harness's machine verification -- NOT a content humanizer (see content-humanizer / behuman).

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/alirezarezvani/claude-skills/tree/19392f7a08264ed00486a251f5b2098321771f94/engineering/human-gate
- Commit: `19392f7a08264ed00486a251f5b2098321771f94`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
