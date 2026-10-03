#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///
"""
Validate a SKILL.md against ~/.claude/rules/skills.md constraints.

Usage:
    uv run validate.py path/to/SKILL.md

Output: JSON report to stdout.
Exit code: 0 if no errors, 1 if errors found.
"""

import argparse
import json
import re
import sys
from pathlib import Path

RESERVED_PREFIXES = ("claude", "anthropic")
MAX_DESC_CHARS = 1024
MAX_NAME_CHARS = 64
MAX_BODY_TOKENS = 5000  # rough; ~4 chars/token


def parse_frontmatter(content: str):
    if not content.startswith("---"):
        return None, content
    end = content.find("\n---", 3)
    if end < 0:
        return None, content
    fm_text = content[3:end].strip()
    body = content[end + 4:].strip()
    fm = {}
    for line in fm_text.split("\n"):
        if ":" in line:
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm, body


def estimate_tokens(text: str) -> int:
    return len(text) // 4


def validate(skill_md_path: str):
    path = Path(skill_md_path)
    if not path.exists():
        return [{"severity": "error", "rule": "file-exists",
                 "message": f"File not found: {path}"}]

    content = path.read_text()
    fm, body = parse_frontmatter(content)
    violations = []

    if fm is None:
        violations.append({
            "severity": "error", "rule": "frontmatter",
            "message": "Missing YAML frontmatter (--- delimited block at top)",
        })
        return violations

    for field in ("name", "description"):
        if field not in fm or not fm[field]:
            violations.append({
                "severity": "error", "rule": f"frontmatter-{field}",
                "message": f"Missing required frontmatter field: {field}",
            })

    name = fm.get("name", "")
    if name:
        if not re.match(r"^[a-z0-9]+(-[a-z0-9]+)*$", name):
            violations.append({
                "severity": "error", "rule": "name-format",
                "message": f"Name must be kebab-case (lowercase, hyphens only): '{name}'",
            })
        for prefix in RESERVED_PREFIXES:
            if name.startswith(prefix):
                violations.append({
                    "severity": "error", "rule": "name-reserved",
                    "message": f"Name cannot start with reserved prefix '{prefix}': '{name}'",
                })
        if len(name) > MAX_NAME_CHARS:
            violations.append({
                "severity": "error", "rule": "name-length",
                "message": f"Name exceeds {MAX_NAME_CHARS} chars: {len(name)}",
            })

    desc = fm.get("description", "")
    if len(desc) > MAX_DESC_CHARS:
        violations.append({
            "severity": "error", "rule": "description-length",
            "message": f"Description exceeds {MAX_DESC_CHARS} chars: {len(desc)}",
        })
    if "<" in desc and ">" in desc:
        violations.append({
            "severity": "error", "rule": "description-no-xml",
            "message": "Description must not contain XML/angle brackets",
        })

    desc_lower = desc.lower()
    if not any(t in desc_lower for t in ("use this skill", "use when", "trigger")):
        violations.append({
            "severity": "warn", "rule": "description-trigger",
            "message": "Description should include explicit trigger language "
                       "('use this skill when...', 'trigger when...')",
        })

    body_tokens = estimate_tokens(body)
    if body_tokens > MAX_BODY_TOKENS:
        violations.append({
            "severity": "warn", "rule": "body-length",
            "message": f"Body ~{body_tokens} tokens exceeds {MAX_BODY_TOKENS}. "
                       "Move detail to references/.",
        })

    if not re.search(r"\((code|inference|hybrid)\)", body, re.IGNORECASE):
        violations.append({
            "severity": "warn", "rule": "step-classification",
            "message": "No step type classifications (code/inference/hybrid) "
                       "found in body. Per ~/.claude/rules/skills.md §6.",
        })

    if "gotcha" not in body.lower():
        violations.append({
            "severity": "warn", "rule": "no-gotchas",
            "message": "No gotchas section found. Per ~/.claude/rules/skills.md §5, "
                       "gotchas are the highest signal-to-noise content.",
        })

    return violations


def main():
    p = argparse.ArgumentParser(
        description="Validate a SKILL.md against ~/.claude/rules/skills.md."
    )
    p.add_argument("skill_md", help="Path to SKILL.md")
    args = p.parse_args()

    violations = validate(args.skill_md)
    has_errors = any(v["severity"] == "error" for v in violations)
    counts = {
        "errors": sum(1 for v in violations if v["severity"] == "error"),
        "warnings": sum(1 for v in violations if v["severity"] == "warn"),
    }

    result = {
        "skill_md": args.skill_md,
        "pass": not has_errors,
        "counts": counts,
        "violations": violations,
    }

    print(json.dumps(result, indent=2))
    sys.exit(1 if has_errors else 0)


if __name__ == "__main__":
    main()
