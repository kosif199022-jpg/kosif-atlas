#!/usr/bin/env bash
# Installs this factory bundle into a target repository.
#   bash install.sh [target-repo]      (default: current directory)
#   bash install.sh --factory <dir>    stamp <dir> as an ambient factory folder
#   bash install.sh --library [dir]    keep this bundle at <dir>/software-dev-factory/<release>/
#                                      (default: ~/.ailib) and point `current` at it
# Non-destructive: it never overwrites a file you own.
set -euo pipefail

# -P: invoked through the library's `current` symlink, a logical path would make
# --factory's cp -R vendor the symlink instead of the bundle.
FACTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
MODE=repo
if [ "${1:-}" = "--factory" ]; then
  [ $# -eq 2 ] || { echo "usage: install.sh --factory <dir>" >&2; exit 2; }
  MODE=factory
  # Resolved after the preflight below, so a refused install creates nothing.
  TARGET="$2"
elif [ "${1:-}" = "--library" ]; then
  [ $# -le 2 ] || { echo "usage: install.sh --library [dir]" >&2; exit 2; }
  MODE=library
  TARGET="${2:-$HOME/.ailib}"
  case "$TARGET" in /*) ;; *) TARGET="$PWD/$TARGET" ;; esac
else
  TARGET="$(cd "${1:-$PWD}" && pwd)"
fi

# 22.12.0, not 22, because the locked vite requires it; a major-only check waves
# through a Node that fails much later with an error naming neither.
NODE_FLOOR=22.12.0
# macOS only by default. Every project command and agent invocation runs confined
# through /usr/bin/sandbox-exec; on another platform runs park at the baseline
# stage with no result. Refuse here rather than let that surface as a mysterious
# park on the first run. FACTORY_CONFINEMENT=none opts out explicitly (trusted
# distribution only, e.g. WSL2/Git Bash) — never inferred, must be set by the
# installing user, and it carries into the written .aai/factory.env so runs
# stay unconfined without the flag being re-passed every time.
if [ "$(uname -s)" != "Darwin" ] && [ "${FACTORY_CONFINEMENT:-}" != "none" ]; then
  echo "install: macOS is required — the confinement backend is /usr/bin/sandbox-exec (found $(uname -s))." >&2
  echo "  To install anyway on a trusted machine with no sandboxing, re-run with FACTORY_CONFINEMENT=none" >&2
  exit 1
fi
command -v node >/dev/null || { echo "install: node $NODE_FLOOR or newer is required" >&2; exit 1; }
NODE_FOUND="$(node -p 'process.versions.node')"
IFS=. read -r n_major n_minor n_patch <<<"${NODE_FOUND%%-*}"
IFS=. read -r f_major f_minor f_patch <<<"$NODE_FLOOR"
if [ "$n_major" -lt "$f_major" ] ||
   { [ "$n_major" -eq "$f_major" ] && [ "$n_minor" -lt "$f_minor" ]; } ||
   { [ "$n_major" -eq "$f_major" ] && [ "$n_minor" -eq "$f_minor" ] && [ "$n_patch" -lt "$f_patch" ]; }; then
  echo "install: node $NODE_FLOOR or newer is required (found $NODE_FOUND)" >&2
  exit 1
fi
if [ "$MODE" = factory ]; then
  mkdir -p "$TARGET"
  TARGET="$(cd "$TARGET" && pwd)"
fi

if [ "$MODE" = library ]; then
  # RELEASE names the versioned dir, so it is validated (same shape build-distro.mjs
  # enforces) before anything is created or removed; a missing or escaping value
  # could otherwise delete or write outside the library.
  RELEASE="$(cat "$FACTORY/RELEASE" 2>/dev/null || true)"
  RELEASE="${RELEASE%%$'\n'*}"
  if [ -z "$RELEASE" ]; then
    echo "install: refused — $FACTORY/RELEASE is missing or empty; this is not a complete bundle" >&2
    exit 1
  fi
  if ! printf '%s' "$RELEASE" | grep -Eq '^[A-Za-z0-9][A-Za-z0-9._-]*$'; then
    echo "install: refused — RELEASE '$RELEASE' is not a safe directory name" >&2
    exit 1
  fi
  LIB="$TARGET/software-dev-factory"
  DEST="$LIB/$RELEASE"
  if [ -f "$DEST/VERSION" ] && [ "$(cat "$DEST/VERSION")" = "$(cat "$FACTORY/VERSION")" ]; then
    # Same bytes already there (possibly this very copy) — never touch it.
    echo "already installed: $DEST"
  else
    mkdir -p "$LIB"
    rm -rf "$DEST"
    cp -R "$FACTORY" "$DEST"
    find "$DEST" -name .DS_Store -delete
    echo "installed: $DEST"
  fi
  # Relative target so the library dir can move as a whole. BSD ln reads -n as -h.
  ln -sfn "$RELEASE" "$LIB/current"
  echo
  echo "Next, stamp a factory folder from the stable path:"
  echo "  bash $LIB/current/install.sh --factory <folder>"
  exit 0
fi

# The file is *sourced* by the shim under `set -euo pipefail`, so a value it
# cannot survive is fatal at every later run, in an error naming neither this
# installer nor the adapter. Single quotes, with any embedded quote closed and
# re-opened, survive spaces and apostrophes alike.
SQ_QUOTE="'"
SQ_ESCAPED="'\\''"
sq() { printf "'%s'" "${1//$SQ_QUOTE/$SQ_ESCAPED}"; }
# Double-quoted YAML scalar for the manifest: a plain scalar breaks on `: ` or
# ` #`. Escapes only `\` and `"` -- enough for a filesystem path, not a YAML encoder.
yaml_dq() { local v="${1//\\/\\\\}"; printf '"%s"' "${v//\"/\\\"}"; }

# Adapter settings live next to the rest of the ambient config. Without an adapter
# `factory run` refuses (exit 3) rather than pretending to work — so look the CLI
# up instead of asking for it. First id on PATH wins, in this order.
ADAPTER_IDS="claude codex"
ADAPTER_ID=""
ADAPTER_EXECUTABLE=""
for id in $ADAPTER_IDS; do
  # `command -v` failing is the supported "nothing installed" outcome, so it has
  # to be a condition and not a bare statement under `set -e`.
  if found="$(command -v "$id" 2>/dev/null)"; then
    ADAPTER_ID="$id"
    ADAPTER_EXECUTABLE="$found"
    break
  fi
done

# Writes <dir>/.aai/factory.env when absent.
write_env() {
  [ -f "$1/.aai/factory.env" ] && return 0
  if [ -n "$ADAPTER_ID" ]; then
    {
      echo "# Written by the installer: $ADAPTER_ID was found on PATH at install time."
      echo "FACTORY_ADAPTER=$(sq "$ADAPTER_ID")"
      echo "FACTORY_ADAPTER_EXECUTABLE=$(sq "$ADAPTER_EXECUTABLE")"
    } > "$1/.aai/factory.env"
  else
    : > "$1/.aai/factory.env"
  fi
  if [ "${FACTORY_CONFINEMENT:-}" = "none" ]; then
    echo "# Installed with FACTORY_CONFINEMENT=none: runs are unconfined, no sandbox-exec." >> "$1/.aai/factory.env"
    echo "FACTORY_CONFINEMENT=none" >> "$1/.aai/factory.env"
  fi
  cat >> "$1/.aai/factory.env" <<'ENV'
# Sourced by ./factory. Uncomment and point at your coding agent's CLI.
# FACTORY_ADAPTER=claude              # claude | codex
# FACTORY_ADAPTER_EXECUTABLE=/absolute/path/to/claude
# FACTORY_ADAPTER_CONFIG_DIR=
# FACTORY_ADAPTER_MODEL=
# FACTORY_ADAPTER_TIMEOUT_MS=120000
# FACTORY_STAGE_TIMEOUT_MS=120000
# FACTORY_CONFINEMENT=none            # opt out of sandbox-exec confinement (trusted machines only)
ENV
  echo "wrote:
  .aai/factory.env"
}

# Appends a line to a .gitignore when absent, creating the file if needed.
gitignore_add() {
  grep -qx -- "$2" "$1" 2>/dev/null && return 0
  # A last line without a newline would otherwise be glued to ours.
  if [ -s "$1" ] && [ "$(cat "$1"; echo x)" = "$(cat "$1")x" ]; then echo >> "$1"; fi
  echo "$2" >> "$1"
}

if [ "$MODE" = factory ]; then
  if [ -f "$TARGET/.aai/instructions.md" ]; then
    echo "install: refused — $TARGET/.aai/instructions.md already exists; this folder is already a factory" >&2
    exit 1
  fi
  VERSION="$(cat "$FACTORY/VERSION")"
  mkdir -p "$TARGET/.aai" "$TARGET/.ailib"
  cat > "$TARGET/.aai/instructions.md" <<'MD'
# Software development factory

This folder is the factory. An agent landing here acts only through `./factory`:

- `./factory init <name>` creates `projects/<name>` as a git repository with the
  factory installed in it.
- `./factory --project <name> <command...>` runs the factory CLI inside that
  project (`approve`, `run`, `verdict`, ...); see
  `.ailib/software-dev-factory/docs/user-guide.md`.

Never write under `.ailib/`: it is a vendored, regenerable copy of the runtime
at the version pinned in `.ailib/manifest.yaml`. Re-run the bundle's
`install.sh --factory` on a fresh folder to upgrade.
MD
  cat > "$TARGET/.aai/identity.md" <<'MD'
# Identity

The software development factory: a governed software lifecycle that walks an
approved specification through plan, red, green, verify and review, and stops
for the owner at approval and at the review gate. It never commits, pushes or
releases on its own authority.
MD
  cat > "$TARGET/.aai/purpose.md" <<'MD'
# Purpose

Turn an approved spec into a reviewed candidate change in one of the projects
under `projects/`, with every stage's evidence recorded in that project's git
refs, so the owner decides on evidence rather than on trust.
MD
  cat > "$TARGET/.aai/context.md" <<'MD'
# Context

- `.aai/` — this folder's own identity, purpose, memory and `factory.env`
  (factory-wide adapter defaults, overridden per project).
- `.ailib/software-dev-factory/` — the vendored runtime bundle (gitignored).
- `.ailib/manifest.yaml` — name, source and version of what is vendored.
- `projects/<name>/` — one git repository per product (gitignored here; each
  carries its own `.aai/policy/factory.yaml` and `.aai/factory.env`).
- `factory` — the shim: `init <name>` and `--project <name> <command...>`.
MD
  cat > "$TARGET/.aai/memory.md" <<'MD'
# Memory

Append dated entries below: decisions about projects, adapter changes, upgrades.
MD
  write_env "$TARGET"
  cp -R "$FACTORY" "$TARGET/.ailib/software-dev-factory"
  find "$TARGET/.ailib/software-dev-factory" -name .DS_Store -delete
  cat > "$TARGET/.ailib/manifest.yaml" <<YAML
# Ambient manifest: what is vendored under .ailib/. Never edit inside .ailib/.
capabilities:
  - name: software-dev-factory
    source: $(yaml_dq "$TARGET/.ailib/software-dev-factory")
    version: $VERSION
YAML
  gitignore_add "$TARGET/.gitignore" ".ailib/"
  gitignore_add "$TARGET/.gitignore" "projects/"
  cat > "$TARGET/factory" <<SHIM
#!/usr/bin/env bash
# Generated by the software-dev-factory installer (--factory). Regenerate by
# re-running install.sh --factory on a fresh folder.
set -euo pipefail
ROOT=$(sq "$TARGET")
usage() { echo "usage: factory init <name> | factory --project <name> <command...>" >&2; exit 2; }
case "\${1:-}" in
  init)
    [ \$# -eq 2 ] || usage
    PROJECT="\$ROOT/projects/\$2"
    mkdir -p "\$PROJECT"
    [ -d "\$PROJECT/.git" ] || git init -q "\$PROJECT"
    exec bash "\$ROOT/.ailib/software-dev-factory/install.sh" "\$PROJECT"
    ;;
  --project)
    [ \$# -ge 3 ] || usage
    PROJECT="\$ROOT/projects/\$2"
    [ -d "\$PROJECT" ] || usage
    shift 2
    cd "\$PROJECT"
    [ -f "\$ROOT"/.aai/factory.env ] && set -a && . "\$ROOT/.aai/factory.env" && set +a
    [ -f "\$PROJECT"/.aai/factory.env ] && set -a && . "\$PROJECT/.aai/factory.env" && set +a
    exec node --experimental-strip-types --no-warnings "\$ROOT/.ailib/software-dev-factory/src/cli.ts" "\$@"
    ;;
  *) usage ;;
esac
SHIM
  chmod +x "$TARGET/factory"
  echo "wrote:
  .aai/{instructions,identity,purpose,context,memory}.md
  .ailib/manifest.yaml
  .ailib/software-dev-factory/
  .gitignore
  factory"
  echo
  echo "Factory folder ready. Next:"
  echo "  cd $TARGET"
  echo "  ./factory init <name>"
  echo "  ./factory --project <name> --help"
  exit 0
fi

[ -d "$TARGET/.git" ] || echo "install: warning — $TARGET is not a git repository; the factory stores run state in git refs" >&2

# .aai/instructions.md, .aai/policy/factory.yaml, .ailib/manifest.yaml — written by
# the factory's own scaffold, which refuses before any write if a managed path
# already holds foreign bytes.
# The bundle path travels as an argument, not spliced into the import string:
# a quote or space in it would otherwise be a syntax error in this eval.
node --experimental-strip-types --no-warnings --input-type=module -e '
import { pathToFileURL } from "node:url";
const { scaffold } = await import(pathToFileURL(process.argv[3] + "/src/controller/sdlc/scaffold/index.ts").href);
const r = await scaffold({ repositoryPath: process.argv[1], factoryDigest: process.argv[2], mode: "apply" });
if (r.disposition === "incompatible") {
  console.error("install: refused — these paths already exist with different contents:\n  " + (r.conflicts.join("\n  ") || "(invalid request)"));
  process.exit(1);
}
console.log(r.written.length ? "wrote:\n  " + r.written.join("\n  ") : "already installed: .aai/ and .ailib/ are in place");
' "$TARGET" "$(cat "$FACTORY/VERSION")" "$FACTORY"

write_env "$TARGET"
gitignore_add "$TARGET/.gitignore" ".ailib/"

# The command surface: ./factory approve|start|run|verdict|abandon|diagnose
cat > "$TARGET/factory" <<SHIM
#!/usr/bin/env bash
# Generated by the software-dev-factory installer. Runs the factory CLI against
# this repository. Regenerate by re-running the bundle's install.sh.
set -euo pipefail
FACTORY=$(sq "$FACTORY")
cd "\$(dirname "\${BASH_SOURCE[0]}")"
[ -f .aai/factory.env ] && set -a && . ./.aai/factory.env && set +a
exec node --experimental-strip-types --no-warnings "\$FACTORY/src/cli.ts" "\$@"
SHIM
chmod +x "$TARGET/factory"
echo "wrote:
  factory"

# What the file says, not what detection found: the file is only written when
# absent, so on a re-install the two disagree. Read back with the ambient
# FACTORY_* cleared -- they are configuration channels of their own, and an
# exported one would otherwise be reported as though the file carried it.
ENV_CLAIM="$(
  unset FACTORY_ADAPTER FACTORY_ADAPTER_EXECUTABLE
  set -a
  . "$TARGET/.aai/factory.env"
  set +a
  if [ -n "${FACTORY_ADAPTER:-}" ] && [ -n "${FACTORY_ADAPTER_EXECUTABLE:-}" ]; then
    printf '%s at %s' "$FACTORY_ADAPTER" "$FACTORY_ADAPTER_EXECUTABLE"
  else
    printf 'no adapter configured'
  fi
)"

echo
echo "Installed. Next:"
echo "  cd $TARGET"
echo "  ./factory --help"
echo "  edit .aai/policy/factory.yaml   # your test/coverage commands"
if [ "$ENV_CLAIM" = "no adapter configured" ]; then
  echo "  edit .aai/factory.env           # your coding-agent CLI (looked for: ${ADAPTER_IDS// /, }, found neither on PATH)"
fi
echo ".aai/factory.env: $ENV_CLAIM"
echo "Read $FACTORY/README.md, then docs/user-guide.md."
