#!/usr/bin/env bash
# factory.sh — the factory command surface for the ambient folder this capability
# is vendored into.
#
#   bash factory.sh init <name>                 create projects/<name> and install into it
#   bash factory.sh --project <name> <cmd...>   run the factory CLI inside that project
#                                               (approve, run, verdict, abandon, diagnose)
#
# Resolves the folder by walking up to the nearest .aai/, so it works from
# .ailib/software-dev-factory/ and from a fork in .aai/skills/software-dev-factory/ alike.
# Adapter settings load from the folder's .aai/factory.env first, then the
# project's, so project values win.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$HERE"
while [ ! -d "$ROOT/.aai" ]; do
  [ "$ROOT" = "/" ] && { echo "no .aai/ above $HERE — run install.sh first" >&2; exit 1; }
  ROOT="$(dirname "$ROOT")"
done
BUNDLE="$HERE/app"
[ -f "$BUNDLE/src/cli.ts" ] || { echo "no factory bundle at $BUNDLE — re-run the installer" >&2; exit 1; }
usage() { echo "usage: factory init <name> | factory --project <name> <command...>" >&2; exit 2; }
case "${1:-}" in
  init)
    [ $# -eq 2 ] || usage
    PROJECT="$ROOT/projects/$2"
    mkdir -p "$PROJECT"
    [ -d "$PROJECT/.git" ] || git init -q "$PROJECT"
    exec bash "$BUNDLE/install.sh" "$PROJECT"
    ;;
  --project)
    [ $# -ge 3 ] || usage
    PROJECT="$ROOT/projects/$2"
    [ -d "$PROJECT" ] || usage
    shift 2
    cd "$PROJECT"
    [ -f "$ROOT/.aai/factory.env" ] && { set -a; . "$ROOT/.aai/factory.env"; set +a; }
    [ -f "$PROJECT/.aai/factory.env" ] && { set -a; . "$PROJECT/.aai/factory.env"; set +a; }
    exec node --experimental-strip-types --no-warnings "$BUNDLE/src/cli.ts" "$@"
    ;;
  *) usage ;;
esac
