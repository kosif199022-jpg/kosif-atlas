# Trello Pipeline

Trello-based agentic product pipeline: takes a raw product idea through intake,
feature decomposition, spec writing, review, and PRD assembly — with the Trello
board as both state engine and live dashboard.

Everything ships in this folder; all paths below are relative to
`${CLAUDE_PLUGIN_ROOT}/library/trello-pipeline/`.

## How to run it

1. **First time / setup?** Read `docs/INSTALLATION.md` (Trello credentials,
   `pip install anthropic python-dotenv`, `python setup_board.py`).
2. **Orchestrating the pipeline?** Read `CLAUDE.md` for the `trello_ops.py`
   command surface, then `docs/CLAUDE_ORCHESTRATION.md` for the stage flow.
3. **Stage agents** live in `agents/` — each file is the prompt for one
   pipeline role (intake_analyst, feature_decomposer, spec_writer,
   spec_reviewer, prd_assembler, final_reviewer). Spawn a general-purpose
   subagent with the relevant file's content as its instructions; do not
   paste more than one role into a single agent.
4. **User-facing questions** ("how does this work?") → `docs/USER_GUIDE.md`
   or `docs/QUICK_REFERENCE.md`.

## Gotchas

- `python trello_ops.py delete_all` is destructive — never run it without
  explicit user confirmation.
- The scripts need Trello API credentials in `.env` and a
  `board_config.json` created by `setup_board.py`; if either is missing,
  walk the user through `docs/INSTALLATION.md` first.
