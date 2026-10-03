# vibe

vibe is a build mode for local web apps and command-line apps. You tell the
agent what you want, and vibe tests, builds, runs, checks, and commits it.

You do two things for each request. You ask, and you accept the result.

## Requirements

- An AI coding agent that reads `.aai/` folders (Claude Code, Codex, or Gemini)
- git
- Node.js 20 or later, for web apps
- Python 3.10 or later, for the docs gate and for Python apps

## Install

vibe is an ambient-library capability. Use one of these procedures.

### Install into an app folder (folder mode)

Use this procedure to make vibe permanent for one folder.

1. Show the install plan. This command does not write files.

   ```bash
   bash "${CLAUDE_PLUGIN_ROOT}/library/ambient-folder/install.sh" vibe --check <app-folder>
   ```

2. Make sure that the target folder is correct.
3. Install vibe.

   ```bash
   bash "${CLAUDE_PLUGIN_ROOT}/library/ambient-folder/install.sh" vibe <app-folder>
   ```

vibe is not in the production library yet. Until it is, use the
ambient-library dev clone in place of `${CLAUDE_PLUGIN_ROOT}`:
`bash <ambient-library>/library/ambient-folder/install.sh vibe <app-folder>`.

### Use vibe without the installer (session mode)

1. Open your agent in the app folder.
2. Type `vibe on`.

The first build request writes the vibe stamp into the folder. To use vibe for
this conversation only, type `vibe on, just this session`.

## Quickstart

1. Open your agent in an empty folder.
2. Type `vibe on`.
3. Describe the app. For example, type `a page where I paste recipes and get a shopping list`.
4. Read the checks that vibe shows. If vibe asks questions, answer them.
5. Wait for the result message.
6. Look at the screenshots and try the app.
7. Type your next change, or type feedback about the result.

## More information

- `VIBE_USERGUIDE.md` — daily use, commands, and troubleshooting
- `CHANGELOG.md` — changes in each release
