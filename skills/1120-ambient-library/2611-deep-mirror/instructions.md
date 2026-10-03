# Deep Mirror — cognitive-data lifecycle manager

Manages the full lifecycle of Lou's cognitive database: the profile, directives,
and harvest store maintained by the `cognitive-mirror` skill. Three cadences,
three jobs:

| Cadence | Mode | Job |
|---|---|---|
| Once | **bootstrap** | Deep mine ALL raw agent session logs into the base evidence layer |
| Weekly | **weekly** | Delegate to cognitive-mirror Mine + Harvest (conversation-level maintenance) |
| Quarterly | **audit** | Blind incremental re-mine of raw logs; diff cold findings against the profile |

The one-line theory: *bootstrap is the census, weekly is the news, the audit is
the thing that keeps the other two honest.* Weekly maintenance alone drifts —
the profile becomes a lens that finds what it expects, slow patterns are
invisible at daily granularity, and raw session logs go unread. The blind
quarterly audit is the only mechanism that can catch the profile being wrong
rather than merely stale.

## Gotchas (read first)

- **Raw session logs never enter the main context.** All file mining goes
  through cheap-model subagents that return structured findings only. The
  archives total hundreds of MB; the main session holds evidence, never logs.
- **Split the models by job: cheap extracts, strong synthesizes.** Cheap
  subagents (Haiku) are fine for decision instances, because every quote is
  grep-verified against the source before storing and errors get caught.
  They are NOT fine for cognitive patterns: in 2026-09 runs they misattributed
  assistant text to Lou, mislabeled receipts, and — because each batch sees
  only a slice — could not see a pattern spread thinly across batches. So
  pattern-finding runs as ONE strong-model pass (Opus) over the whole filtered
  corpus at once, blind to the profile. Discard per-batch pattern notes. If
  the corpus is too large for one context (bootstrap, audit), cheap batches
  return dated verbatim receipts only, and the strong pass synthesizes
  patterns across all of them.
- **The audit runs BLIND.** Do not read the cognitive profile before or during
  audit mining. Loading it first is the exact contamination the audit exists to
  detect. Profile comparison happens only after cold findings are complete.
- **A pattern needs 3+ dated occurrences.** Once is noise; eleven times is
  character. Subagents must return dated receipts, not impressions.
- **Absence is data.** What never appears in the logs (shipping, delegating,
  finishing) is as diagnostic as what recurs.
- **Never write a concise root, detailed identity module, directive module, or
  CLAUDE.md without showing a diff and getting approval.** Evidence files and
  the state file are yours to write; profile and directive context are Lou's.
- **Session logs contain secrets.** Instruct every mining subagent: never quote
  API keys, credentials, or third-party names into findings. Everything stays
  on this machine.
- **Check the state file before running anything** — it prevents duplicate
  mining and tells you which mode is actually due.

## Data location

This skill reads and writes the cognitive-mirror data in the global ambient
home `~/.aai/`, the same home the `cognitive-mirror` skill owns:

- Concise routers (owned context): `~/.aai/identity.md`, `~/.aai/rules/operational.md`
- Detailed identity + directives (owned context): `~/.aai/references/identity/`, `~/.aai/rules/operational/`
- Run state + evidence + harvest (owned memory): `~/.aai/memory/cognitive-mirror/`

The canonical map of these locations is the routing table at
`~/.aai/context.md` (no filesystem symlinks — portable across
macOS/Linux/Windows). Always **write** to the `~/.aai/` paths.
Cognitive-mirror's static doctrine (dimensions, scheduled-task prompts) ships
read-only in `library/cognitive-mirror/references/`.

## State file

`~/.aai/memory/cognitive-mirror/deep-mirror-state.json` — lives with the
cognitive-mirror data it manages. Create on first run:

```json
{
  "bootstrap_completed": null,
  "last_weekly": null,
  "last_audit": null,
  "last_mined_mtime": null,
  "audits": []
}
```

`last_mined_mtime` is the newest file-modification timestamp covered by the
last raw-log mine (bootstrap or audit). The next audit mines only files newer
than this — that's what makes audits incremental and cheap.

## Mode routing

- "bootstrap the mirror", "deep mine my session logs", "run the full excavation" → **bootstrap**
- "weekly mirror", "run mirror maintenance", "update my cognitive profile" → **weekly**
- "audit the mirror", "blind re-mine", "quarterly audit", "is my profile still accurate" → **audit**
- "mirror status", "what's due", bare "run deep mirror" → **status**, then offer to run whatever is due

**Status logic:** no `bootstrap_completed` → bootstrap is due. `last_weekly`
older than 7 days → weekly is due. `last_audit` (or `bootstrap_completed`)
older than ~90 days → audit is due. Report all three with dates; run the one
Lou picks.

---

## Mode: bootstrap (once)

### 1. Excavate — inventory the archives

Search for agent session archives. Check at minimum:
`~/.claude/projects/` (Claude Code JSONL), `~/.claude/history.jsonl`,
`~/.codex/sessions/`, `~/.config/opencode/`, `~/.local/share/opencode/`,
plus any `*.jsonl` or session-shaped directories under `~/.config/` and
`~/.local/share/`. Also check the extended-memory mirror
(`/Volumes/Extreme Pro/users/loudalo/`) for the same paths if mounted.

For each source: tool name, path, file count, total size, date range (oldest →
newest mtime). Present the inventory table and your mining plan (which sources,
what sampling, how many subagent batches). **Wait for Lou's go before reading
any file contents.**

### 2. Distill — subagent mining

Sampling: the 30 most recent sessions, the 15 oldest, and 40 spread across the
middle, proportioned across sources by volume. Cap ~200 files total, ~150 lines
read per file.

Partition sampled files into batches of ~25. Dispatch one subagent per batch —
**cheap model (Haiku if available, else Sonnet), in parallel**. Each subagent
prompt must contain: its file list, the read caps, the secrecy rule from
Gotchas, and the six evidence categories:

1. **Recurring themes** — what Lou returns to again and again
2. **Abandonment graveyard** — started, never finished (appears 3+ times then vanishes)
3. **Correction patterns** — what he fixes in AI output, and what that says he cares about
4. **Repetition tax** — asked repeatedly, should have been automated the second time
5. **Rhythm** — timestamps of best work vs. spirals
6. **Blind spots** — conspicuously absent from the logs

Each subagent returns ONLY structured findings: short verbatim quotes, dates,
counts per category — no raw log text. Meanwhile, run grep/rg sweeps yourself
from the main session (grep output is cheap; reading files is not): correction
phrases ("no, I meant", "that's not what", "again", "stop"), repeated identical
requests across weeks, time-of-day distribution.

Merge everything into
`~/.aai/memory/cognitive-mirror/deep-mine-evidence.md`, every
claim carrying at least one dated receipt, sections marked "insufficient data"
rather than padded. Do not interpret while collecting — evidence gathered
under a conclusion is contaminated.

### 3. Integrate — feed the cognitive-mirror pipeline

Now (and only now) read the concise identity root, every detailed identity
module, the concise operational router, and the domain directive modules. Run the
equivalent of cognitive-mirror's Diff mode using the deep-mine evidence as the
observation source: Stable / Strengthened / Weakened / New / Evolved. Propose
line-level updates against the owning detailed module, reserving a concise-root
edit for a true contract/router change. Apply only what Lou approves.

Decision-shaped findings (input → Lou's choice → reasoning, with receipts) go
to the harvest store using cognitive-mirror's Harvest record format and
confidence rules — via its normal store/index/log machinery.

### 4. Close out

Update the state file: `bootstrap_completed`, `last_mined_mtime` (newest mtime
among mined files). Summarize: patterns found, profile changes applied vs.
declined, harvest instances stored, and when the first weekly and audit runs
are due.

---

## Mode: weekly (maintenance)

This mode is a thin dispatcher — the work belongs to `cognitive-mirror`.

1. Read the state file. If bootstrap has never run, say so and offer it
   instead — weekly maintenance on an empty base layer builds the profile from
   conversation data alone, which is exactly the thin foundation this system
   exists to avoid.
2. Invoke the `cognitive-mirror` skill: run **Mine mode** over the past week's
   conversations, then **Harvest mode** (it deduplicates via its own
   harvest-log). Follow that skill's own procedures — do not reimplement them.
   Model split for this step (see Gotchas): Haiku batches produce Harvest
   decision instances only; one Opus subagent reads the whole week's filtered
   turns, without the profile, and produces the Mine observations. Only then
   read the profile and diff against it.
3. Cognitive-mirror presents its Mirror Report and proposed updates; Lou
   approves or declines per its normal flow.
4. Update `last_weekly` in the state file.

If Lou asks for weekly runs on a schedule, point him at cognitive-mirror's
`library/cognitive-mirror/references/scheduled-task-prompts.md` and add
"run deep-mirror weekly mode" as the scheduled prompt — the state file makes
repeated firings idempotent within a week (if `last_weekly` is under 6 days
old, report "not due" and stop).

---

## Mode: audit (quarterly, blind)

The audit answers one question the other modes can't: **is the profile still
true?** Agreement between a cold read and the profile is validation.
Disagreement is either drift (Lou changed) or anchoring (the profile
calcified). Both are findings.

### 1. Scope — incremental only

Read the state file. Mine only session files with mtime newer than
`last_mined_mtime`. Inventory them (same sources as bootstrap), present the
scope, get Lou's go.

### 2. Blind mine

**Do not read the profile, directives, or prior evidence files.** Run the same
subagent mining as bootstrap §2 (cheap models, batches of ~25, six categories,
dated receipts) over the new files only. Write cold findings to
`~/.aai/memory/cognitive-mirror/audit-evidence-YYYY-MM-DD.md`.

### 3. Reveal and diff

Now read the profile and compare. Classify every cold finding and every
profile pattern into:

- **Validated** — cold read independently re-derived a profile pattern
- **Drift** — the logs show new behavior the profile lacks, or a profile
  pattern that has faded from recent behavior (check: was it present in the
  bootstrap evidence? if yes → faded; if no → possibly never real)
- **Anchoring suspect** — a profile pattern with no support in this period's
  raw logs *and* weak receipts in its history; flag for Lou's judgment rather
  than auto-deleting

Produce the audit report: validation rate, drift list, anchoring suspects,
proposed profile diffs. Apply approved changes; route decision instances to the
harvest store as in bootstrap §3.

### 4. Close out

Update state: `last_audit`, `last_mined_mtime`, and append to `audits[]`:
`{"date": ..., "files_mined": N, "validated": N, "drift": N, "anchoring": N}`.
The audits array is the profile's long-term health record — if validation rate
falls across consecutive audits, say so; the profile is losing touch with the
data.

---

## Cost discipline

Subagent delegation is the economics of this skill, not an optimization.
Mining on the frontier model costs roughly 10× the same run on Haiku, and raw
logs in the main context inflate every subsequent turn's cache reads. If you
notice yourself reading a session file directly in the main session, stop and
dispatch a subagent instead. Expected order of magnitude: bootstrap ≈ a
mid-double-digit-dollar API-equivalent run with delegation (triple without);
audits a small fraction of that; weekly runs are conversation-level and cheap.

On a subscription the real cost is weekly usage allowance, not dollars.
Spend it where judgment happens: the one strong-model pattern pass is worth
roughly one long session of usage; the extraction around it stays cheap.
