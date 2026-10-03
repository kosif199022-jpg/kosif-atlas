# Configuration and manual setup

Requirements: Node.js 22+, Git, Backlog CLI 1.51.0, and npm/npx. The target root and every configured repository must
already be initialized Git repositories; an empty Git repository is fine. All paths below are examples, not required
names. No package.json, package manager, project node_modules, source folders, or framework is created.

```sh
node /path/to/setup-agent-workspace/scripts/init.mjs --help
node /path/to/setup-agent-workspace/scripts/init.mjs --example monorepo > /tmp/workspace-config.json
# Edit the configuration to name your project/agents and add actual project checks.
node /path/to/setup-agent-workspace/scripts/init.mjs \
  --target /path/to/project --config /tmp/workspace-config.json --dry-run
node /path/to/setup-agent-workspace/scripts/init.mjs \
  --target /path/to/project --config /tmp/workspace-config.json --apply
```

`--dry-run` is the default. It makes no target changes, but creates disposable files outside the target for native
Backlog initialization and schema validation. `--offline` prohibits npm network access; a missing cached Ajv package
fails clearly. Configuration is full `agent-workspace.json` data, validated by the bundled local JSON Schema and policy
checks. `$schema` is set to `./.agents/agent-workspace/schema.json` in the installed copy. Checks are literal
executable/argument arrays, never shell strings. Setup does not run project checks automatically.

| Example       | Repository configuration                        | Source behavior                                                                                                     |
| ------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `single-repo` | Root `.`                                        | Existing source layout is untouched.                                                                                |
| `monorepo`    | Root `.`                                        | `apps/` and `packages/` are suggested descriptions only; no folders or package files are created.                   |
| `multi-repo`  | Root plus `reference/` (read-only) and `app/`   | Each child must already have independent Git metadata. Only independent child paths are added to root ignore rules. |
| `submodules`  | Root plus `modules/library/` and `modules/app/` | Each child must already be initialized. Gitlinks remain visible in the superproject.                                |

The examples use `coordinator`, `builder`, and `reviewer` as editable example nicknames. Names/roles/default profiles
belong to each project, independent of provider or model. Change the roster, defaultAgent, repository checks, and
read-only boundaries before applying. The default assisted profile leaves changes uncommitted. Unattended is an
available explicit profile with independent review and guarded local commits; configuring it does not authorize a run.
Add relevant application checks before unattended source work: the sample root checks verify only coordination, tracker
consistency, and whitespace. Child repositories have no invented build/test commands and cannot pass guarded
verification until real checks are configured.

Setup copies schema/scripts/tests and a versioned installation manifest to `.agents/agent-workspace/`. The default
`--skills local` copies two operating skills to `.agents/skills/` and creates `.claude/skills -> ../.agents/skills`;
`--skills external` uses separately installed plugin/user skills instead. `agent-workspace.json` and
`AGENT-WORKSPACE.md` live at the root. Existing AGENTS.md, CLAUDE.md, and .gitignore receive only clearly delimited
additive blocks. Existing generated files must be identical; divergent files are reported as conflicts. If current Git
ignore rules hide a generated tracked file, setup refuses before writing. Deliberately narrow those rules while
retaining unrelated ignored files, then preview again; setup never broadly unignores `.agents` or `.claude`. Use the
separate [versioned updater](updates.md) for upgrades. There is no force overwrite or destructive rollback. A failed
apply preserves written files for inspection and rerun. Setup/update use the registry maintenance lock and refuse active
runs; do not edit target files concurrently.

`.agents/agent-workspace/runtime/` is ignored durable coordination data: current state, retained history, task
provenance, commit journals, and writer locks. It is not scratch. `.local/` is ignored scratch/capture work. Git commit
guards and native Git/Backlog locks stay in repository Git metadata.

For a fresh tracker, setup invokes the native Backlog initializer in an isolated temporary directory with Git and AI
integration disabled, then enables its normal Git integration while keeping native autoCommit disabled before copying
the new tracker. The target Git index, HEAD, hooks and config are never involved. An existing tracker is read through
its native CLI and left unchanged. Its three statuses must match the configuration; map `todoStatus`, `activeStatus`,
and `doneStatus` to existing names. Existing filesystem-only mode or autoCommit must be resolved deliberately before
setup; bypassing the coordination commit guards is not supported. This first bundle supports `backlog/config.yml` and
the standard `task` prefix (TASK IDs). Existing custom Backlog directory/root-config layouts or task prefixes fail
before writes and need explicit adaptation, since the visual-evidence helpers use `backlog/assets/` and TASK IDs.

Git submodules use separate child commits and superproject gitlink updates. Claims/checks/commits must name the intended
repository. A child commit does not commit the parent gitlink; an existing parent pointer needs a separate owned
snapshot in the parent, recording the exact child commit with clean initialized child, parent checks and current review.
Own the pointer from a clean baseline before changing the child; an inherited pointer change needs an explicit inspected
handoff. Read-only child pointers are protected. Setup never stages, commits, pushes, changes .gitmodules, or
initializes a missing submodule. It preserves an existing staged checkpoint. Publishing child commits is separate from
local verification.

Screenshot comparison is optional: the bundled `compare-ui.py` requires Python, Pillow 10.1+, and WebP support.
Browser/native/game capture is project-specific; screen capture may require user-granted OS permission. Read the
generated visual-evidence-review skill when doing UI work. Coordination itself uses only Node built-ins and the native
Backlog CLI.
