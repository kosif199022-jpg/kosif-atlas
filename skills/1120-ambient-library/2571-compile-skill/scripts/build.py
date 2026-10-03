#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///
"""
Build a Claude skill from a complete specification.

Unlike scaffold.py (which produces stubs and lets the user fill them in),
build.py expects a fully-specified spec — every file's content is inline.
The builder is deterministic: same spec in, same skill out.

Usage:
    python3 build.py --spec spec.json --out ./skill-name/
    python3 build.py --spec spec.json --out ./skill-name/ --dry-run

Spec format (v2.0):
    {
      "spec_version": "2.0",
      "identity": {"name": "kebab-case", "description": "Use this skill when..."},
      "gotchas": ["...", "..."],
      "steps": [
        {"n": 1, "name": "...", "type": "code|inference|hybrid",
         "rationale": "...",
         "script": "scripts/foo.py",            // optional, code/hybrid only
         "contract": {"input": "...", "output": "...", "justification": "..."}}
      ],
      "files": [
        {"path": "scripts/foo.py", "content": "...", "kind": "script"},
        {"path": "references/foo.md", "content": "..."}
      ],
      "evals": {
        "trigger": {
          "should_trigger": [{"prompt": "...", "rationale": "..."}],
          "should_not_trigger": [{"prompt": "...", "rationale": "..."}]
        }
      }
    }

Exit codes:
  0 = success, validate.py exited 0, all script smoke checks passed
  1 = built successfully but validate.py reported errors OR a script smoke check failed
  2 = bad input (spec invalid, file IO error, etc.)
"""

import argparse
import json
import stat
import subprocess
import sys
from pathlib import Path

SPEC_VERSION = "2.0"
VALIDATE_SCRIPT = Path(__file__).resolve().parent / "validate.py"

SKILL_MD_TEMPLATE = """---
name: {name}
description: {description}
---

# {title}

{gotchas_section}

## Steps

{steps_rendered}
"""


def render_gotchas(gotchas):
    if not gotchas:
        return ""
    lines = ["## Gotchas", ""]
    for g in gotchas:
        lines.append(f"- {g}")
    return "\n".join(lines) + "\n"


def render_step(step):
    n = step["n"]
    name = step["name"]
    type_ = step["type"]
    rationale = step.get("rationale", "")
    block = [f"### Step {n}: {name} ({type_})", "", rationale]
    if type_ in ("inference", "hybrid"):
        c = step.get("contract", {})
        if c:
            block.extend([
                "",
                "**Inference contract:**",
                f"- **Input:** {c.get('input', '')}",
                f"- **Output:** {c.get('output', '')}",
                f"- **Why not code:** {c.get('justification', '')}",
            ])
    if type_ in ("code", "hybrid"):
        script = step.get("script")
        if script:
            block.extend(["", f"**Script:** `{script}`"])
    return "\n".join(block)


def title_case(s):
    return " ".join(w.capitalize() for w in s.replace("-", " ").split())


def validate_spec(spec):
    """Returns a list of error messages. Empty list = valid."""
    errors = []
    if not isinstance(spec, dict):
        return ["spec must be a JSON object"]
    if spec.get("spec_version") != SPEC_VERSION:
        errors.append(f"spec_version must be {SPEC_VERSION!r}, got {spec.get('spec_version')!r}")
    identity = spec.get("identity")
    if not isinstance(identity, dict):
        errors.append("identity must be an object")
    else:
        if not identity.get("name"):
            errors.append("identity.name is required")
        if not identity.get("description"):
            errors.append("identity.description is required")
        name = identity.get("name", "")
        if name and not all(c.islower() or c.isdigit() or c == "-" for c in name):
            errors.append(f"identity.name must be kebab-case (lowercase letters, digits, hyphens): {name!r}")
    steps = spec.get("steps", [])
    if not isinstance(steps, list):
        errors.append("steps must be an array")
    else:
        for i, s in enumerate(steps):
            if not isinstance(s, dict):
                errors.append(f"steps[{i}] must be an object")
                continue
            for field in ("n", "name", "type"):
                if field not in s:
                    errors.append(f"steps[{i}].{field} is required")
            if s.get("type") not in (None, "code", "inference", "hybrid"):
                errors.append(f"steps[{i}].type must be code|inference|hybrid, got {s.get('type')!r}")
    files = spec.get("files", [])
    if not isinstance(files, list):
        errors.append("files must be an array")
    else:
        for i, f in enumerate(files):
            if not isinstance(f, dict):
                errors.append(f"files[{i}] must be an object")
                continue
            if "path" not in f:
                errors.append(f"files[{i}].path is required")
            if "content" not in f:
                errors.append(f"files[{i}].content is required")
            path = f.get("path", "")
            if path.startswith("/") or path.startswith("..") or "/../" in path:
                errors.append(f"files[{i}].path must be relative and stay inside the skill dir: {path!r}")
            kind = f.get("kind")
            if kind not in (None, "static", "script"):
                errors.append(f"files[{i}].kind must be static|script if present, got {kind!r}")
    evals = spec.get("evals")
    if evals is not None and not isinstance(evals, dict):
        errors.append("evals must be an object")
    return errors


def write_skill_md(out_dir, spec):
    identity = spec["identity"]
    gotchas = spec.get("gotchas", [])
    steps = spec.get("steps", [])
    skill_md = SKILL_MD_TEMPLATE.format(
        name=identity["name"],
        description=identity["description"],
        title=title_case(identity["name"]),
        gotchas_section=render_gotchas(gotchas),
        steps_rendered="\n\n".join(render_step(s) for s in steps),
    )
    path = out_dir / "SKILL.md"
    path.write_text(skill_md)
    return path


def write_file(out_dir, file_spec):
    rel_path = file_spec["path"]
    target = out_dir / rel_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(file_spec["content"])
    if file_spec.get("kind") == "script":
        st = target.stat()
        target.chmod(st.st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)
    return target


def write_evals(out_dir, evals):
    if not evals or "trigger" not in evals:
        return None
    evals_dir = out_dir / "evals"
    evals_dir.mkdir(exist_ok=True)
    path = evals_dir / "trigger.json"
    path.write_text(json.dumps(evals["trigger"], indent=2) + "\n")
    return path


def run_validate(skill_md_path):
    if not VALIDATE_SCRIPT.exists():
        return {"skipped": True, "reason": f"validate.py not found at {VALIDATE_SCRIPT}"}
    try:
        result = subprocess.run(
            ["python3", str(VALIDATE_SCRIPT), str(skill_md_path)],
            capture_output=True, text=True, timeout=30,
        )
        try:
            parsed = json.loads(result.stdout)
        except json.JSONDecodeError:
            parsed = {"raw": result.stdout}
        return {
            "exit_code": result.returncode,
            "report": parsed,
            "stderr": result.stderr if result.stderr else None,
        }
    except Exception as e:
        return {"error": f"failed to run validate.py: {e}"}


def smoke_check_script(out_dir, script_path):
    rel = script_path.relative_to(out_dir)
    try:
        result = subprocess.run(
            ["python3", str(script_path), "--help"],
            capture_output=True, text=True, timeout=10,
        )
        return {
            "script": str(rel),
            "exit_code": result.returncode,
            "ok": result.returncode == 0,
            "stderr_first_line": (result.stderr.splitlines()[0] if result.stderr else None) if result.returncode != 0 else None,
        }
    except Exception as e:
        return {"script": str(rel), "ok": False, "error": str(e)}


def build(spec, out_dir, dry_run=False):
    out = Path(out_dir).resolve()

    if dry_run:
        would_write = ["SKILL.md"]
        for f in spec.get("files", []):
            would_write.append(f["path"])
        if spec.get("evals", {}).get("trigger"):
            would_write.append("evals/trigger.json")
        return {
            "dry_run": True,
            "skill_dir": str(out),
            "would_write": would_write,
        }

    out.mkdir(parents=True, exist_ok=True)

    skill_md_path = write_skill_md(out, spec)

    written_files = []
    written_scripts = []
    for f in spec.get("files", []):
        target = write_file(out, f)
        written_files.append(str(target.relative_to(out)))
        if f.get("kind") == "script":
            written_scripts.append(target)

    evals_path = write_evals(out, spec.get("evals"))

    validate_result = run_validate(skill_md_path)
    script_smoke = [smoke_check_script(out, s) for s in written_scripts]

    type_breakdown = {"code": 0, "inference": 0, "hybrid": 0}
    for s in spec.get("steps", []):
        t = s.get("type")
        if t in type_breakdown:
            type_breakdown[t] += 1

    validate_ok = (validate_result.get("exit_code") == 0)
    smoke_ok = all(r.get("ok") for r in script_smoke) if script_smoke else True

    return {
        "skill_dir": str(out),
        "skill_md": str(skill_md_path.relative_to(out)),
        "files_written": written_files,
        "evals_written": str(evals_path.relative_to(out)) if evals_path else None,
        "step_count": len(spec.get("steps", [])),
        "type_breakdown": type_breakdown,
        "validate": validate_result,
        "script_smoke": script_smoke,
        "all_checks_passed": validate_ok and smoke_ok,
    }


def main():
    p = argparse.ArgumentParser(description="Build a Claude skill from a complete spec.")
    p.add_argument("--spec", required=True, help="Path to JSON spec file")
    p.add_argument("--out", required=True, help="Output directory for the skill")
    p.add_argument("--dry-run", action="store_true",
                   help="Report what would be written without writing anything")
    args = p.parse_args()

    try:
        spec = json.loads(Path(args.spec).read_text())
    except FileNotFoundError:
        print(json.dumps({"error": f"Spec file not found: {args.spec}"}), file=sys.stderr)
        return 2
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON in spec: {e}"}), file=sys.stderr)
        return 2

    errors = validate_spec(spec)
    if errors:
        print(json.dumps({"error": "spec validation failed", "violations": errors}, indent=2),
              file=sys.stderr)
        return 2

    result = build(spec, args.out, dry_run=args.dry_run)
    print(json.dumps(result, indent=2))

    if args.dry_run:
        return 0
    return 0 if result.get("all_checks_passed") else 1


if __name__ == "__main__":
    sys.exit(main())
