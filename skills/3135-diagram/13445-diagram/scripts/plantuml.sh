#!/usr/bin/env bash
# Run PlantUML with the arguments given. Uses the system `plantuml` CLI when it is on
# PATH; otherwise downloads a pinned PlantUML jar once into the user cache and runs it
# with Java.
# Usage: plantuml.sh <plantuml arguments...>

set -euo pipefail

VERSION="1.2026.8"
JAR_URL="https://github.com/plantuml/plantuml/releases/download/v${VERSION}/plantuml-${VERSION}.jar"
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/studykit-diagram"
JAR="$CACHE_DIR/plantuml-${VERSION}.jar"

if command -v plantuml &>/dev/null; then
  exec plantuml "$@"
fi

if ! command -v java &>/dev/null; then
  echo "Error: PlantUML needs the plantuml CLI (brew install plantuml) or Java to run the jar" >&2
  exit 1
fi

if [ ! -f "$JAR" ]; then
  if ! command -v curl &>/dev/null; then
    echo "Error: plantuml CLI not found and curl is unavailable to download $JAR_URL" >&2
    exit 1
  fi
  mkdir -p "$CACHE_DIR"
  echo "plantuml CLI not found; downloading PlantUML $VERSION to $JAR ..." >&2
  TMP_JAR="$(mktemp "$CACHE_DIR/plantuml.XXXXXX")"
  # A partial or corrupt download must never land at $JAR, or every later run would fail.
  if ! curl -fsSL --retry 2 -o "$TMP_JAR" "$JAR_URL" \
      || ! java -Djava.awt.headless=true -jar "$TMP_JAR" -version &>/dev/null; then
    rm -f "$TMP_JAR"
    echo "Error: failed to download a working PlantUML jar from $JAR_URL" >&2
    exit 1
  fi
  mv "$TMP_JAR" "$JAR"
fi

exec java -Djava.awt.headless=true -jar "$JAR" "$@"
