#!/usr/bin/env python3
"""Verify the app's dependencies from manifest.json. Exit 0 when everything is
present; otherwise print plain-English install hints and exit 1.

  check_deps.py [--json]
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent.parent


def version_of(cmd, args=("--version",)):
    try:
        out = subprocess.run([cmd, *args], capture_output=True, text=True, timeout=10)
        return (out.stdout or out.stderr).strip().splitlines()[0] if (out.stdout or out.stderr).strip() else "present"
    except (OSError, subprocess.TimeoutExpired):
        return None


def parse_ver(s):
    import re
    m = re.search(r"(\d+)\.(\d+)(?:\.(\d+))?", s or "")
    return tuple(int(x or 0) for x in m.groups()) if m else None


def satisfies(have, spec):
    if not spec:
        return True
    op = ">=" if spec.startswith(">=") else "=="
    want = parse_ver(spec)
    got = parse_ver(have)
    if not want or not got:
        return False
    return got >= want if op == ">=" else got[:len(want)] == want


def pip_has(pkg):
    name = pkg.split("[")[0].split("==")[0].split(">=")[0].strip()
    try:
        from importlib.metadata import distribution
        distribution(name)
        return True
    except Exception:
        return False


def npm_has(pkg):
    node_modules = APP_ROOT / "node_modules" / pkg
    if node_modules.exists():
        return True
    return subprocess.run(["npm", "ls", "-g", pkg, "--depth=0"], capture_output=True, text=True).returncode == 0 if shutil.which("npm") else False


def main():
    as_json = "--json" in sys.argv
    manifest = json.loads((APP_ROOT / "manifest.json").read_text()) if (APP_ROOT / "manifest.json").exists() else {}
    deps = manifest.get("deps", {})
    problems, ok = [], []

    py = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    if satisfies(py, deps.get("python", ">=3.10")):
        ok.append(f"python {py}")
    else:
        problems.append(f"Python {deps.get('python')} required, found {py}. Install from https://python.org or your package manager.")

    if deps.get("node"):
        nv = version_of("node")
        if nv and satisfies(nv, deps["node"]):
            ok.append(f"node {nv}")
        else:
            problems.append(f"Node {deps['node']} required, found {nv or 'nothing'}. Install from https://nodejs.org (or use nvm/fnm).")

    for pkg in deps.get("pip", []):
        if pip_has(pkg):
            ok.append(f"pip:{pkg}")
        else:
            problems.append(f"Python package '{pkg}' missing. Run: {sys.executable} -m pip install '{pkg}'")

    for pkg in deps.get("npm", []):
        if npm_has(pkg):
            ok.append(f"npm:{pkg}")
        else:
            problems.append(f"npm package '{pkg}' missing. Run: cd {APP_ROOT} && npm install {pkg}")

    for cli in deps.get("cli", []):
        name = cli if isinstance(cli, str) else cli.get("name")
        hint = "" if isinstance(cli, str) else cli.get("install", "")
        if shutil.which(name):
            ok.append(f"cli:{name}")
        else:
            problems.append(f"Command '{name}' not found on PATH." + (f" Install: {hint}" if hint else ""))

    if as_json:
        print(json.dumps({"ok": not problems, "present": ok, "problems": problems}, indent=2))
    else:
        for line in ok:
            print(f"  ok  {line}")
        for line in problems:
            print(f"  !!  {line}")
        print("All dependencies present." if not problems else f"{len(problems)} problem(s). Fix the lines marked !! and re-run.")
    return 0 if not problems else 1


if __name__ == "__main__":
    sys.exit(main())
