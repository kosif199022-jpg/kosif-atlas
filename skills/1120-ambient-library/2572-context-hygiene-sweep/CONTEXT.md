# Skill Brief — context-hygiene-sweep

**Provenance:** authored 2026-07-06 from a real sweep of
`/Volumes/Extreme Pro/users/loudalo/GitHub` (64 CLAUDE.md files reviewed,
25 edited, ~3,300 lines removed, 6 skills promoted to ambient-library
commit 917cff2), including one real failure and its correction.

**Purpose:** keep project AI-instruction files high-signal and route reusable
capabilities into the canonical ambient-library, without breaking standalone
client repos.

**Invocation schema**
- Required input: root folder to sweep (defaults to cwd).
- Preconditions: global rules at `~/.claude/CLAUDE.md` + `~/.claude/rules/`;
  ambient-library clone with `docs/MANAGEMENT.md` and `library/catalog.yaml`.
- Outputs: edited CLAUDE.md files, new CONTEXT.md files, a sweep log at the
  root, an ambient-library commit (not pushed), `.canonical`-renamed source
  folders.
- Side effects: file edits in many repos — hence the recoverability check.

**Trigger positives:** "clean up the claude.md files", "reconcile with my
global rules", "which of these skills belong in the library", "audit my repos'
instructions".
**Near-miss negatives:** "/init a CLAUDE.md for this project" (single-project
authoring, not a sweep); "audit this MCP server" (audit-mcp); "clean up this
codebase" (code refactoring, not instruction files); editing the
ambient-library's own docs.

**Success criteria:** no standalone repo touched; every edit recoverable;
every promotion logged with source; library commit validates and is not
pushed; net line reduction with zero loss of project-specific facts.

**Known failure (the reason gotcha #1 exists):** the first run stripped
"global-rule duplicates" from Jansen and GEARS CLAUDE.md files. Those repos
ship to clients and must be self-contained; the edits were reverted from the
hot-cache mirror (`/Users/loudalo/ambience-claude/jansen/`), git, and the
GEARS archive copy. A memory (`client-shipped-standalone-repos`) now records
the exemption.

**Eval note:** outputs are whole-repo mutations — not cheaply benchmarkable
with subagent runs. Validate qualitatively: dry-run the scoping step and the
classification table on a small fixture folder before a real sweep.
