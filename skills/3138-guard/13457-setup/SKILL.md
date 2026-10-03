---
name: setup
description: Install Guard's read-only Codex audit agents in the current project's .codex/agents directory. Use when Guard is installed in Codex and file review needs its named subagents.
disable-model-invocation: true
---

# Guard setup

Turn reviews use the user's own agent or skill registered in `turn_review`; this setup does
not install a turn reviewer. Existing user files are left in place.

This setup is needed only for Codex. It installs the project-local agents
`guard_doc_auditor`, `guard_agents_md_auditor`, and
`guard_ext_docs_auditor`; it does not change any user-level Codex configuration.

First identify the current project's Git root. Explain that installation will
create those three TOML files under `.codex/agents/`, then obtain the user's
explicit confirmation before making that change. A direct request to install it
counts as that confirmation.

Run the installer next to this skill with an absolute path, passing the project
root:

```sh
uv run --script <absolute-path-to-this-skill>/scripts/install_agent.py --project <git-root>
```

If the destination already exists, leave it unchanged and report that fact.
Replace it only when the user explicitly requests replacement, using `--force`.
Tell the user to start a new Codex session after installation so the named agent
is discovered.

For file-review rules, users may keep the portable Guard action names
`guard:doc-auditor`, `guard:agents-md-auditor`, and `guard:ext-docs-auditor`; the Codex hook
maps them to the installed underscore-named agents. A matching `file_review_rules` entry
selects the file; no agent switch is required. Unmatched files are not reviewed.
For source review, choose an installed Codex agent or
skill; the bundled `guard:comment-corrector` remains Claude Code only.

Also tell them that guard's hooks are separate from this, and that installing and
enabling the plugin does not switch them on: Codex skips plugin-bundled hooks until
the user reviews and trusts the hook definition, and it does so silently. If guard
appears to do nothing under Codex while `codex plugin list` reports it installed and
enabled, untrusted hooks are the first thing to check — this skill cannot affect them. Dispatch this named agent in a fresh context, not with the
parent's full conversation history.
