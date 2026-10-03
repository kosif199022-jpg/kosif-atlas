# capture-chat Changelog

## v1.1 (2026-09-11) — skill doc only, script unchanged
- Default destination changed from vault `inbox/` to
  `~/.aai/projects/<slug>/sessions/` (cross-harness session archive;
  `~/.aai/projects/README.md` contract). Vault ingest remains an explicit
  destination-prompt option.
- No `export-conversation.py` change — no vault script upgrade required.

## v1.2 (2026-04-18)
- `find_latest_jsonl()` now also searches Cowork/hostloop session paths:
  `/private/var/folders/*/*/T/claude-hostloop-plugins/*/projects/**/*.jsonl`
- Better error message when no JSONL found (includes Cowork path hint)
- Docstring updated to v1.2

## v1.1 (2026-04-18)
- `--artifacts` flag: folder output with conversation.md + artifacts/ subdirectory
- `--version` flag: prints current script version
- `VERSION` constant for upgrade detection
- Artifact extraction via Write tool_use blocks in JSONL

## v1.0 (2026-04-18)
- Initial release
- `export-conversation.py` v1.1 — first versioned release
  - `--artifacts` flag: folder output with conversation.md + artifacts/ subdirectory
  - `--version` flag: prints current script version
  - `VERSION` constant at top of script for upgrade detection
  - Artifact extraction: scans JSONL for Write tool_use blocks, copies referenced files
- Standalone skill extracted from alv-scaffold v0.2 integration
- Canonical source established; alv-scaffold/templates/ is a maintained copy
