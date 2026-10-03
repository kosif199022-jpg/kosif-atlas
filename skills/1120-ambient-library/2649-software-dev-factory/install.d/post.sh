#!/usr/bin/env bash
# post.sh — software-dev-factory install steps; run by ambient-folder/install.sh
# with TARGET and CAP_DIR set (CAP_DIR = <target>/.ailib/software-dev-factory).
set -euo pipefail

# The bundle's own install.sh expects to sit at the bundle ROOT: it resolves
# $FACTORY from its own directory and hands out $FACTORY/src/cli.ts. APP_FILES is
# a flat path list (rsync --files-from cannot rename), so the two files that
# build-distro.mjs relocates are relocated here instead. Idempotent — app/ is
# re-synced on every install, so this runs again each time.
# ponytail: copy, not move, so a re-sync never leaves app/ half-normalised.
cp "$CAP_DIR/app/scripts/distro/install.sh" "$CAP_DIR/app/install.sh"
cp "$CAP_DIR/app/scripts/distro/README.md"  "$CAP_DIR/app/README.md"
chmod +x "$CAP_DIR/app/install.sh"
# The bundle installer stamps app/VERSION into each project's .ailib/manifest.yaml,
# and scaffold() validates it as a bare sha256 (/^[0-9a-f]{64}$/) — it rejects the
# human-readable provenance line sync-distro.sh writes there. Restamp it the way
# scripts/build-distro.mjs does: sha256 over every bundled file's relative path and
# bytes, walked in sorted order, so identical bundles digest identically. The
# provenance line survives in the folder's .ailib/manifest.yaml `app:` field.
node -e '
const {createHash}=require("node:crypto"),fs=require("node:fs"),path=require("node:path");
const root=process.argv[1];
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:1)
  .flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const h=createHash("sha256");
for(const f of walk(root)){
  const rel=path.relative(root,f).split(path.sep).join("/");
  if(rel==="VERSION")continue;
  h.update(rel);h.update(fs.readFileSync(f));
}
fs.writeFileSync(path.join(root,"VERSION"),h.digest("hex")+"\n");
' "$CAP_DIR/app"

mkdir -p "$TARGET/projects"

# Folder-wide adapter defaults. Owned like the rest of .aai/ — written once,
# never overwritten, so a re-install cannot revert a hand-edited adapter. Each
# project gets its own factory.env from the bundle installer, sourced second so
# project values win. Without an adapter `run` refuses with exit 3, so the value
# is looked up rather than asked for: first id on PATH wins, in this order.
if [ ! -f "$TARGET/.aai/factory.env" ]; then
  mkdir -p "$TARGET/.aai"
  for id in claude codex; do
    if found="$(command -v "$id" 2>/dev/null)"; then
      {
        echo "# Written by the installer: $id was found on PATH at install time."
        echo "FACTORY_ADAPTER='$id'"
        echo "FACTORY_ADAPTER_EXECUTABLE='$found'"
      } > "$TARGET/.aai/factory.env"
      break
    fi
  done
  cat >> "$TARGET/.aai/factory.env" <<'ENV'
# Sourced by ./factory for every project, before the project's own factory.env.
# Uncomment and point at your coding agent's CLI.
# FACTORY_ADAPTER=claude              # claude | codex
# FACTORY_ADAPTER_EXECUTABLE=/absolute/path/to/claude
# FACTORY_ADAPTER_CONFIG_DIR=
# FACTORY_ADAPTER_MODEL=
# FACTORY_ADAPTER_TIMEOUT_MS=120000
# FACTORY_STAGE_TIMEOUT_MS=120000
ENV
fi

# ponytail: root-level launcher so nobody types the .ailib path; always rewritten,
# it only delegates. Resolves .aai/skills first so a personalised fork wins.
cat > "$TARGET/factory" <<'SH'
#!/usr/bin/env bash
# factory — the software development factory for this folder.
#   ./factory init <name>                  create projects/<name>
#   ./factory --project <name> <cmd...>    approve | run | verdict | abandon | diagnose
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN="$HERE/.aai/skills/software-dev-factory/factory.sh"
[ -f "$RUN" ] || RUN="$HERE/.ailib/software-dev-factory/factory.sh"
exec bash "$RUN" "$@"
SH
chmod +x "$TARGET/factory"

# .ailib/ is a re-syncable cache and projects/ are their own repositories.
gitignore_add() {
  grep -qx -- "$2" "$1" 2>/dev/null && return 0
  if [ -s "$1" ] && [ "$(cat "$1"; echo x)" = "$(cat "$1")x" ]; then echo >> "$1"; fi
  echo "$2" >> "$1"
}
gitignore_add "$TARGET/.gitignore" ".ailib/"
gitignore_add "$TARGET/.gitignore" "projects/"

# Prerequisites are warnings, not refusals: the scaffold is still worth writing.
# 22.12.0, not 22 — the major-only check waves through a Node that fails later.
[ "$(uname -s)" = "Darwin" ] || echo "  warn  macOS is required — the confinement backend is /usr/bin/sandbox-exec (found $(uname -s))"
if command -v node >/dev/null; then
  node -e 'const [a,b,c]=process.versions.node.split(".").map(Number);process.exit((a>22||(a==22&&(b>12||(b==12&&c>=0))))?0:1)' \
    || echo "  warn  node $(node -p 'process.versions.node') is below 22.12.0 — the factory will not run until it is upgraded"
else
  echo "  warn  node 22.12.0+ not found on PATH — the factory will not run until it is installed"
fi
echo "next:   cd '$TARGET' && ./factory init <name>"
