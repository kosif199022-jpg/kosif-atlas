# Skill Brief — deep-mirror

## Purpose
Orchestrate the full lifecycle of the cognitive-mirror database so its three
data flows run at the right cadence with the right model economics: bootstrap
(one-time deep mine of raw agent session logs), weekly (conversation-level
Mine/Harvest via the cognitive-mirror skill), quarterly audit (blind
incremental re-mine of new raw logs, diffed against the profile).

## Origin
Distilled July 2026 from a working session comparing the public
"six-phase mirror prompt" (X/@EXM7777) against Lou's cognitive-mirror skill.
Conclusions that shaped the design:
- The prompt's one durable innovation is raw session logs as an evidence
  source; everything else cognitive-mirror already does more durably.
- Incremental-only maintenance drifts via confirmation anchoring, invisible
  slow patterns, and the unread raw-log source — hence the blind quarterly
  audit ("blind-then-diff" is the only mechanism that catches a *wrong*
  profile, not just a stale one).
- Phase-2-style mining is mechanical and must run on cheap subagents; measured
  ~10× cost difference and it keeps raw logs out of the main context entirely.
- Storage stays in cognitive-mirror's existing tiers (markdown profile /
  directives, JSONL harvest store + index); deep-mirror adds only evidence
  files and a state JSON alongside them.

## Invocation
- Inputs: mode (bootstrap | weekly | audit | status), inferred from phrasing.
- Preconditions: Claude Code with subagent support and filesystem access;
  cognitive-mirror capability available in the library and the global ambient
  home readable at ~/.aai/.
- Outputs: evidence markdown files, state JSON, proposed profile/directive
  diffs (applied only on approval), harvest-store appends via
  cognitive-mirror's machinery.
- Side effects: writes under the ambient home (~/.aai/references/ and
  ~/.aai/memory/cognitive-mirror/) only; never writes profile/CLAUDE.md without
  an approved diff.

## Trigger phrases
Positive: "bootstrap the mirror", "deep mine my session logs", "weekly
mirror", "audit the mirror", "blind re-mine", "mirror status", "is my profile
still accurate".
Near-miss negatives: "/loms" and "mine my conversations" (cognitive-mirror
directly), "harvest my decisions" (cognitive-mirror Harvest), "find my
irreplaceable edge" (irreplaceable-edge), generic "audit this" (audit-fix).

## Success criteria
- No raw session log content ever appears in the main-session context.
- Audit mining completes with zero profile reads before the reveal step.
- Every stored pattern claim carries 3+ dated receipts.
- State file makes all modes idempotent / resumable.

## Known gotchas
- Session logs contain credentials — subagents must be instructed not to quote
  secrets or third-party names.
- Extended-memory mirror on /Volumes/Extreme Pro may hold older session
  archives; check when mounted.
- Weekly mode is a dispatcher — reimplementing cognitive-mirror's Mine/Harvest
  logic here would fork the two skills.
