#!/usr/bin/env bash
# Launcher target. Walks up from cwd to the ambient folder, then runs the vendored app.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$PWD"
while [ "$root" != "/" ] && [ ! -d "$root/.aai" ]; do root="$(dirname "$root")"; done
[ -d "$root/.aai" ] || { echo "{{CAP}}: no .aai/ found above $PWD" >&2; exit 1; }
cd "$root"
# TODO: replace with the real entry point if {{ENTRY}} is not directly runnable.
exec "$here/app/{{ENTRY}}" "$@"
