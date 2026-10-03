#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-.obsidian/snippets/bases.css}"
ASSET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/assets"
SOURCE_FILE="${ASSET_DIR}/bases-glassy-dark.css"

mkdir -p "$(dirname "$TARGET")"
cp "$SOURCE_FILE" "$TARGET"

echo "Installed Bases snippet: $TARGET"
