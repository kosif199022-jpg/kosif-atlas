#!/usr/bin/env bash
# One check: init a throwaway repo, validate must pass; break APP_FILES, validate must fail.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/app"; echo 'echo hi' > "$tmp/app/main.sh"
python3 "$here/distro_kit.py" init "$tmp/app" --name selfcheck-cap --purpose "Tests distro-kit" \
  --launcher sc.sh --app-files main.sh >/dev/null
grep -rl TODO "$tmp/app/distro" | xargs sed -i '' 's/TODO.*/filled/'
python3 "$here/distro_kit.py" validate "$tmp/app" >/dev/null || { echo "FAIL: clean package rejected"; exit 1; }
echo missing.txt >> "$tmp/app/distro/APP_FILES"
if python3 "$here/distro_kit.py" validate "$tmp/app" >/dev/null; then echo "FAIL: broken APP_FILES accepted"; exit 1; fi
echo "selfcheck ok"
