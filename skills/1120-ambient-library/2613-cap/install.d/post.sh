#!/usr/bin/env bash
# Runs after install with TARGET (the folder) and CAP_DIR (.ailib/{{CAP}}). Writes the launcher.
set -euo pipefail
cat > "$TARGET/{{LAUNCHER}}" <<'SH'
#!/usr/bin/env bash
d="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
for r in "$d/.aai/skills/{{CAP}}/run.sh" "$d/.ailib/{{CAP}}/run.sh"; do
  [ -f "$r" ] && exec bash "$r" "$@"
done
echo "{{CAP}} is not installed here; re-run the install one-liner" >&2; exit 1
SH
chmod +x "$TARGET/{{LAUNCHER}}"
