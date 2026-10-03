#!/usr/bin/env bash
# Render a PlantUML, D2, or Structurizr DSL file next to the source file.
# The engine is chosen by extension: .puml .plantuml .pu .iuml .wsd / .d2 / .dsl
#
# Usage: render.sh <file> [--format F] [--theme ID] [--layout ENGINE] [--sketch]
#
#   --format   PlantUML: png (default), svg, pdf, txt
#              D2: png (default), svg, pdf, pptx
#              Structurizr: png (default), svg, plantuml, mermaid
#   --theme    D2 theme id (default 3, Flagship Terrastruct; `d2 themes` lists all)
#   --layout   D2 layout engine: elk (default), dagre
#   --sketch   D2 hand-drawn style
#
# Structurizr png/svg is rendered by exporting each view to PlantUML first.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USAGE="Usage: $0 <file> [--format F] [--theme ID] [--layout ENGINE] [--sketch]"

FILE="${1:?$USAGE}"
shift
FORMAT="png"
THEME="3"
LAYOUT="elk"
SKETCH=()
while [ $# -gt 0 ]; do
  case "$1" in
    --format) FORMAT="${2:?--format needs a value}"; shift 2 ;;
    --theme) THEME="${2:?--theme needs a value}"; shift 2 ;;
    --layout) LAYOUT="${2:?--layout needs a value}"; shift 2 ;;
    --sketch) SKETCH=(--sketch); shift ;;
    *) echo "Unknown option: $1"; echo "$USAGE"; exit 1 ;;
  esac
done

if [ ! -f "$FILE" ]; then
  echo "Error: File not found: $FILE"
  exit 1
fi

SRC_DIR="$(cd "$(dirname "$FILE")" && pwd)"
SRC_NAME="$(basename "$FILE")"
EXT="$(printf '%s' "${SRC_NAME##*.}" | tr '[:upper:]' '[:lower:]')"

require() {
  if ! command -v "$1" &>/dev/null; then
    echo "Error: $1 not found. Install with: brew install $1"
    exit 1
  fi
}

unsupported() {
  echo "Error: format '$FORMAT' is not supported for $1 (supported: $2)"
  exit 1
}

case "$EXT" in
  puml|plantuml|pu|iuml|wsd)
    case "$FORMAT" in png|svg|pdf|txt) ;; *) unsupported PlantUML "png, svg, pdf, txt" ;; esac
    # PlantUML names each output after its @startuml title, so collect whatever it wrote.
    WORK_DIR="$(mktemp -d)"
    trap 'rm -rf "$WORK_DIR"' EXIT
    "$SCRIPT_DIR/plantuml.sh" -t"$FORMAT" -o "$WORK_DIR" "$SRC_DIR/$SRC_NAME"
    echo "Rendered:"
    for out in "$WORK_DIR"/*; do
      [ -f "$out" ] || continue
      mv "$out" "$SRC_DIR/"
      echo "  $SRC_DIR/$(basename "$out")"
    done
    ;;
  d2)
    case "$FORMAT" in png|svg|pdf|pptx) ;; *) unsupported D2 "png, svg, pdf, pptx" ;; esac
    require d2
    OUTPUT="$SRC_DIR/${SRC_NAME%.*}.$FORMAT"
    d2 --theme "$THEME" --layout "$LAYOUT" ${SKETCH[@]+"${SKETCH[@]}"} "$SRC_DIR/$SRC_NAME" "$OUTPUT"
    echo "Rendered:"
    echo "  $OUTPUT"
    ;;
  dsl)
    require structurizr
    WORK_DIR="$(mktemp -d)"
    trap 'rm -rf "$WORK_DIR"' EXIT
    case "$FORMAT" in
      png|svg)
        structurizr export -workspace "$SRC_DIR/$SRC_NAME" -format plantuml -output "$WORK_DIR"
        if ! ls "$WORK_DIR"/*.puml &>/dev/null; then
          echo "Error: the workspace defines no views to render"
          exit 1
        fi
        "$SCRIPT_DIR/plantuml.sh" -t"$FORMAT" "$WORK_DIR"/*.puml
        PATTERN="*.$FORMAT"
        ;;
      plantuml)
        structurizr export -workspace "$SRC_DIR/$SRC_NAME" -format plantuml -output "$WORK_DIR"
        PATTERN="*.puml"
        ;;
      mermaid)
        structurizr export -workspace "$SRC_DIR/$SRC_NAME" -format mermaid -output "$WORK_DIR"
        PATTERN="*.mmd"
        ;;
      *) unsupported Structurizr "png, svg, plantuml, mermaid" ;;
    esac
    echo "Rendered:"
    for out in "$WORK_DIR"/$PATTERN; do
      [ -f "$out" ] || continue
      mv "$out" "$SRC_DIR/"
      echo "  $SRC_DIR/$(basename "$out")"
    done
    ;;
  *)
    echo "Error: unknown extension '.$EXT' (use .puml, .d2, or .dsl)"
    exit 1
    ;;
esac
