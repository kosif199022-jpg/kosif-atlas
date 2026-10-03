# wizard

Generate an interactive bash wizard that walks a human, step by step, through the manual procedures an agent cannot perform: provisioning infrastructure or credentials, setting CI secrets, clicking through third-party dashboards, one-off migrations and cutovers. Two skills. generate (/wizard:generate): the agent scopes the stages from the repo (reading key NAMES only from a live .env, never values), authors them onto a fixed hardened library (TTY-only fail-closed prompts, https-only URL opening, hidden secret entry, single-quoted 0600 .env upserts with a gitignore check, repo-confirmed gh secret/variable writes over stdin, names-only summary), prints the full STAGES block for explicit human approval BEFORE the script is made executable, and never runs the wizard itself. The human does, in their own terminal. Ephemeral by default: built for one run, committed only when the setup path should live in the repo. The generated script requires bash (Windows: Git Bash or WSL); gh is optional: CI-secret stages degrade to a visible warning plus a closing-summary entry when it is absent. unattended (/wizard:unattended) authors a PowerShell script the human launches once when the work is scriptable and the human is only the privilege or policy boundary; the script writes cutover.result/1 JSON and the agent does not run it.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/melodic-software/claude-code-plugins/tree/c8fa858c9059d3183cfc08f646e4a97f44b33973/plugins/wizard
- Commit: `c8fa858c9059d3183cfc08f646e4a97f44b33973`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 4). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
