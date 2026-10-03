# Skill Brief — cognitive-mirror

## Purpose
Build and maintain a living, evidence-based model of how the user thinks,
decides, creates, and evaluates — extracted from conversation behavior, not
self-report. It is the **live extractor** in the mirror system: it observes the
current or recent conversations and owns the profile/directive/harvest data
formats. The sibling `deep-mirror` skill is the lifecycle manager (bulk raw-log
mining, scheduled maintenance, blind audits) and writes into the same data.

## Origin
Ported July 2026 from the standalone `cognitive-mirror-system` repo into the
canonical ambient-library, to sit alongside the already-ported `deep-mirror`
(whose catalog entry already referenced this skill as its sibling). The port
re-homed the mutable data onto the ambient ownership model:
- The skill *instructions + static doctrine* are a **vendored capability** — they
  live in `library/cognitive-mirror/` and re-sync freely.
- The *profile + directives* are **owned references** (learned constraints) →
  `~/.aai/references/`.
- The *harvest store, log, and run state* are **owned memory** (runtime state)
  → `~/.aai/memory/cognitive-mirror/`.
Every consumer resolves the data through a routing table at `~/.aai/context.md`
rather than filesystem symlinks, so the layout stays portable across
macOS/Linux/Windows. The global CLAUDE.md/AGENTS.md pointers and the standalone
install were repointed at `~/.aai/` directly.

## Invocation
- Inputs: mode (loms | mine | diff | query | harvest), inferred from phrasing;
  optional time range / conversation count.
- Preconditions: for write modes, file system access (Claude Code / Cowork) and
  a readable `~/.aai/` home. Profile Query works read-only on any surface.
- Outputs: observation reports, proposed profile/directive diffs (applied only
  on approval), harvest instances appended to the store.
- Side effects: writes ONLY under `~/.aai/references/` and
  `~/.aai/memory/cognitive-mirror/`; never edits the profile without approval.

## Trigger phrases
Positive: "/loms", "look over my shoulder", "cognitive mirror", "mine my
conversations", "update my cognitive profile", "diff my profile", "harvest my
decisions", "build my training data", "how do I typically approach X", "what's
my pattern when".
Near-miss negatives: "bootstrap the mirror" / "audit the mirror" / "mirror
status" / "deep mine my session logs" → deep-mirror (lifecycle). "Think through
this" / "run a pre-mortem" → cognitive-operations. "What's my moat vs AI" →
irreplaceable-edge. This skill observes the USER's own patterns, not a client's.

## Success criteria
- Every pattern assertion cites a specific moment/quote — evidence, not claims.
- No profile or directive write happens without a shown diff and approval.
- Harvest never fabricates reasoning; unclear reasons are marked explicitly.
- Writes always target the `~/.aai/` data home; static doctrine stays read-only.
- Formats stay compatible with what deep-mirror reads/writes.

## Known gotchas
- Don't load both dimension files unless running combined Mine+Harvest — they're
  different lenses (extraction vs. harvest) with different output shapes.
- The harvest store is sharded; read `store-index.json` for counts, never scan
  all shards.
- Always check `harvest-log.txt` before harvesting a conversation to avoid
  duplicate extraction across scheduled runs.
- Read-only surfaces (browser chat) can observe and propose but cannot apply —
  return paste-ready text instead of claiming the profile was updated.
