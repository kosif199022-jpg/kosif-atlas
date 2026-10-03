#!/usr/bin/env bash
# Detect the tech stack of the project rooted at the first argument (default: current directory).
# Output: human-readable summary consumed by the figma-implementing skill.
set -euo pipefail

ROOT="${1:-.}"
PKG="$ROOT/package.json"

echo "=== Tech Stack Detection ==="

if [ ! -f "$PKG" ]; then
  echo ""
  echo "No package.json found. Checking for other project markers:"
  [ -f "$ROOT/Cargo.toml" ]      && echo "  Rust (Cargo)"
  [ -f "$ROOT/go.mod" ]          && echo "  Go"
  { [ -f "$ROOT/pyproject.toml" ] || [ -f "$ROOT/requirements.txt" ]; } && echo "  Python"
  [ -f "$ROOT/composer.json" ]   && echo "  PHP"
  echo "  Inspect the root manually for component conventions."
  exit 0
fi

has_dep() {
  grep -q "\"$1\"" "$PKG"
}

echo ""
echo "FRAMEWORK:"
if   has_dep "next";            then echo "  Next.js"
elif has_dep "react";           then echo "  React (no Next.js)"
elif has_dep "nuxt";            then echo "  Nuxt"
elif has_dep "vue";             then echo "  Vue"
elif has_dep "@angular/core";   then echo "  Angular"
elif has_dep "svelte";          then echo "  Svelte"
elif has_dep "@remix-run/react"; then echo "  Remix"
else echo "  Unknown — check package.json manually"
fi

echo ""
echo "LANGUAGE:"
if has_dep "typescript" || [ -f "$ROOT/tsconfig.json" ]; then
  echo "  TypeScript"
  # Detect strict mode
  if [ -f "$ROOT/tsconfig.json" ] && grep -q '"strict": true' "$ROOT/tsconfig.json"; then
    echo "  (strict mode enabled)"
  fi
else
  echo "  JavaScript"
fi

echo ""
echo "STYLING:"
if   has_dep "tailwindcss";          then echo "  Tailwind CSS"
elif has_dep "styled-components";    then echo "  styled-components"
elif has_dep "@emotion/react" || has_dep "@emotion/styled"; then echo "  Emotion"
elif has_dep "@stitches/react";      then echo "  Stitches"
elif has_dep "vanilla-extract";      then echo "  vanilla-extract"
elif has_dep "sass" || has_dep "node-sass"; then
  # Distinguish CSS Modules + SCSS from plain SCSS
  if find "$ROOT" -maxdepth 6 -name "*.module.scss" ! -path "*/node_modules/*" 2>/dev/null | grep -q .; then
    echo "  CSS Modules + SCSS"
  else
    echo "  SCSS"
  fi
elif find "$ROOT" -maxdepth 6 -name "*.module.css" ! -path "*/node_modules/*" 2>/dev/null | grep -q .; then
  echo "  CSS Modules"
else
  echo "  Plain CSS"
fi

echo ""
echo "ICONS:"
if   has_dep "@heroicons/react" || has_dep "heroicons"; then echo "  Heroicons"
elif has_dep "lucide-react";    then echo "  Lucide"
elif has_dep "react-icons";     then echo "  react-icons"
elif has_dep "@phosphor-icons/react"; then echo "  Phosphor Icons"
elif has_dep "@radix-ui/react-icons"; then echo "  Radix Icons"
else echo "  None detected — inline SVG or unknown"
fi

echo ""
echo "DESIGN TOKENS:"
TOKEN_FILES=$(find "$ROOT" -maxdepth 5 \
  \( -name "tokens.ts" -o -name "tokens.js" -o -name "tokens.css" \
     -o -name "theme.ts" -o -name "theme.js" \
     -o -name "variables.css" -o -name "variables.scss" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" 2>/dev/null)
if [ -n "$TOKEN_FILES" ]; then
  echo "$TOKEN_FILES" | sed "s|$ROOT/||"
else
  echo "  None detected"
fi

echo ""
echo "COMPONENT FILES (first 8, for convention sampling):"
find "$ROOT" -maxdepth 8 \
  \( -name "*.tsx" -o -name "*.jsx" -o -name "*.vue" -o -name "*.svelte" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" \
  ! -name "*.test.*" ! -name "*.spec.*" ! -name "*.stories.*" \
  2>/dev/null | head -8 | sed "s|$ROOT/||"
