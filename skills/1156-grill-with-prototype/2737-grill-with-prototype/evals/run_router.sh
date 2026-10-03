#!/bin/bash
# $1 model, $2 catalog file; prints expected<TAB>got<TAB>prompt
cd "$(dirname "$0")"
python3 -c 'import json;[print(e["prompt"]+"\t"+e["route"]) for e in json.load(open("trigger.json"))["evals"]]' | while IFS=$'\t' read -r p want; do
  got=$(printf 'Catalog:\n%s\n\nUser request: %s\n' "$(cat "$2")" "$p" | claude -p --model "$1" --setting-sources "" --max-turns 1 --system-prompt "You are a skill router. Pick the ONE catalog skill that best fits the user's request. Reply with only the skill name, or NONE." 2>/dev/null | tr -d '[:space:]`')
  echo -e "$want\t$got\t$p"
done
