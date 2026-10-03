#!/usr/bin/env python3
"""distro-kit — package an app repo as a canonical ambient capability.

  distro_kit.py init     <app-repo> --name <cap> --purpose "..." --launcher <cmd> \
                         --app-files a,b,c [--runtime "Node 22+"] [--src distro]
  distro_kit.py validate <app-repo> [--src distro]
  distro_kit.py publish  <cap> <app-repo> [--src distro] [--check] [--release]

init      writes <app-repo>/<src>/ from templates/distro/. Refuses if it exists.
validate  checks the packaging contract ambient-folder/install.sh and
          scripts/sync-distro.sh actually read. Exit 0 clean, 1 findings.
publish   validate -> sync-distro.sh -> catalog/marketplace/SKILLS.md entries
          -> audit-distribution.py. --release also adds RELEASE.yaml + builds
          production. --check prints the plan and writes nothing.

Stdlib only. Runs from the ambient-library dev workspace (finds it by walking
up from this file to a RELEASE.yaml).
"""

import argparse
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATES = os.path.join(HERE, "templates", "distro")
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")


def lib_root():
    d = HERE
    while d != "/":
        if os.path.isfile(os.path.join(d, "RELEASE.yaml")) and os.path.isdir(
            os.path.join(d, "library")
        ):
            return d
        d = os.path.dirname(d)
    sys.exit("distro-kit must run from inside the ambient-library dev workspace")


def read(p):
    with open(p) as f:
        return f.read()


def frontmatter(text):
    m = re.match(r"\A---\n(.*?)\n---", text, re.S)
    return (
        dict(re.findall(r"^(name|description): (.+?)\s*$", m.group(1), re.M))
        if m
        else {}
    )


# ── init ─────────────────────────────────────────────────────────────────────
def cmd_init(a):
    repo = os.path.abspath(a.repo)
    dest = os.path.join(repo, a.src)
    if not NAME_RE.match(a.name):
        sys.exit(f"name must match {NAME_RE.pattern}")
    if os.path.exists(dest):
        sys.exit(f"refusing: {dest} exists — edit it, or delete it first")
    files = [f.strip() for f in a.app_files.split(",") if f.strip()]
    missing = [f for f in files if not os.path.exists(os.path.join(repo, f))]
    if missing:
        sys.exit("app files not in repo: " + ", ".join(missing))
    subs = {
        "{{CAP}}": a.name,
        "{{PURPOSE}}": a.purpose,
        "{{LAUNCHER}}": a.launcher,
        "{{RUNTIME}}": a.runtime,
        "{{APP_FILES}}": "\n".join(files) + "\n",
        "{{ENTRY}}": files[0],
    }
    for root, _, names in os.walk(TEMPLATES):
        for n in names:
            src = os.path.join(root, n)
            rel = os.path.relpath(src, TEMPLATES)
            out = os.path.join(dest, rel)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            body = read(src)
            for k, v in subs.items():
                body = body.replace(k, v)
            with open(out, "w") as f:
                f.write(body)
            if n.endswith(".sh"):
                os.chmod(out, 0o755)
    print(f"wrote {dest}")
    print("next: edit instructions.md and templates/aai/*.md (search TODO), then:")
    print(f"  python3 {os.path.relpath(__file__)} validate {repo}")


# ── validate ─────────────────────────────────────────────────────────────────
def check(repo, src="distro"):
    """Return a list of findings. Empty means the contract holds."""
    d = os.path.join(repo, src)
    f = []
    if not os.path.isdir(d):
        return [f"no {src}/ in {repo}"]
    req = [
        "SKILL.md",
        "instructions.md",
        ".claude-plugin/plugin.json",
        "DEPENDS",
        "templates/aai/instructions.md",
        "templates/aai/identity.md",
        "templates/aai/context.md",
    ]
    for r in req:
        if not os.path.isfile(os.path.join(d, r)):
            f.append(f"missing {r}")
    if f:
        return f
    try:
        pj = json.load(open(os.path.join(d, ".claude-plugin/plugin.json")))
    except Exception as e:
        return [f"plugin.json unparseable: {e}"]
    cap = pj.get("name", "")
    if not NAME_RE.match(cap):
        f.append(f"plugin.json name {cap!r} must match {NAME_RE.pattern}")
    if not re.match(r"^\d+\.\d+\.\d+$", str(pj.get("version", ""))):
        f.append("plugin.json version must be semver x.y.z")
    fm = frontmatter(read(os.path.join(d, "SKILL.md")))
    if fm.get("name") != cap:
        f.append(f"SKILL.md name {fm.get('name')!r} != plugin.json name {cap!r}")
    if not fm.get("description"):
        f.append("SKILL.md has no description")
    if pj.get("description") != fm.get("description"):
        f.append(
            "plugin.json description must equal SKILL.md description verbatim (it becomes the catalog line)"
        )
    for t in ("instructions", "identity", "context"):
        if "{{NAME}}" not in read(os.path.join(d, "templates/aai", t + ".md")):
            f.append(f"templates/aai/{t}.md has no {{{{NAME}}}} placeholder")
    for root, _, names in os.walk(d):
        for n in names:
            p = os.path.join(root, n)
            if n.endswith((".md", ".sh", ".json")) and "TODO" in read(p):
                f.append(f"unfilled TODO in {os.path.relpath(p, d)}")
    deps = [
        ln.strip()
        for ln in read(os.path.join(d, "DEPENDS")).splitlines()
        if ln.strip() and not ln.startswith("#")
    ]
    if "ambient-folder" not in deps:
        f.append("DEPENDS must list ambient-folder (offline update path)")
    lib = os.path.join(lib_root(), "library")
    for dep in deps:
        if not os.path.isdir(os.path.join(lib, dep)):
            f.append(f"DEPENDS names {dep!r}, not in library/")
    af = os.path.join(d, "APP_FILES")
    if os.path.isfile(af):
        for line in read(af).splitlines():
            line = line.strip()
            if (
                line
                and not line.startswith("#")
                and not os.path.exists(os.path.join(repo, line))
            ):
                f.append(f"APP_FILES path not in repo: {line}")
    if os.path.isdir(os.path.join(d, "app")):
        f.append(
            "app/ must not be committed in the source package — sync-distro builds it from APP_FILES"
        )
    return f


def cmd_validate(a):
    findings = check(os.path.abspath(a.repo), a.src)
    for x in findings:
        print("  fail ", x)
    print("ok" if not findings else f"{len(findings)} finding(s)")
    sys.exit(1 if findings else 0)


# ── publish ──────────────────────────────────────────────────────────────────
def cmd_publish(a):
    root = lib_root()
    repo = os.path.abspath(a.repo)
    findings = check(repo, a.src)
    if findings:
        for x in findings:
            print("  fail ", x)
        sys.exit(1)
    pj = json.load(open(os.path.join(repo, a.src, ".claude-plugin/plugin.json")))
    cap, desc = pj["name"], pj["description"]
    if cap != a.cap:
        sys.exit(f"plugin.json name {cap!r} != requested {a.cap!r}")
    dest = (
        f"library/{cap}"
        if os.path.isdir(os.path.join(root, "library", cap))
        else f"in-progress/{cap}"
    )
    steps = [f"sync   {repo}/{a.src} -> {dest}"]
    if dest.startswith("in-progress"):
        steps.append(f"promote {dest} -> library/{cap}")
    steps += [
        f"entry  library/catalog.yaml ({cap})",
        f"entry  .claude-plugin/marketplace.json ({cap})",
        f"entry  SKILLS.md ({cap})",
        "bump   .claude-plugin/plugin.json + .codex-plugin/plugin.json minor",
        "audit  scripts/audit-distribution.py",
    ]
    if a.release:
        steps += [
            f"release RELEASE.yaml += {cap}",
            "build  scripts/build-production.sh",
        ]
    for s in steps:
        print(" ", s)
    if a.check:
        print("nothing written.")
        return

    def run(*c):
        subprocess.run(c, cwd=root, check=True)

    run("bash", "scripts/sync-distro.sh", cap, repo, a.src)
    if dest.startswith("in-progress"):
        run("bash", "scripts/promote.sh", cap)

    upsert_catalog(root, cap, desc)
    upsert_marketplace(root, cap, desc)
    upsert_skills_md(root, cap, desc)
    bump_root_version(root)
    run("python3", "scripts/audit-distribution.py")

    if a.release:
        rp = os.path.join(root, "RELEASE.yaml")
        txt = read(rp)
        if not re.search(rf"^  - {re.escape(cap)}$", txt, re.M):
            with open(rp, "a") as fh:
                fh.write(f"  - {cap}\n")
        run("bash", "scripts/build-production.sh")
    print(
        f"published {cap} {pj['version']} -> library/{cap}"
        + (" (released)" if a.release else released_note(root, cap))
    )
    print("still yours: review the diff, commit, push")


def released_note(root, cap):
    listed = re.search(rf"^  - {re.escape(cap)}$", read(os.path.join(root, "RELEASE.yaml")), re.M)
    return " (in RELEASE.yaml; rebuild production after commit)" if listed else " (not in RELEASE.yaml)"


def bump_root_version(root):
    """admin.md step 8: any library change bumps the plugin's minor version."""
    for rel in (".claude-plugin/plugin.json", ".codex-plugin/plugin.json"):
        p = os.path.join(root, rel)
        if not os.path.isfile(p):
            continue
        txt = read(p)
        m = re.search(r'"version": "(\d+)\.(\d+)\.(\d+)"', txt)
        new = f'"version": "{m[1]}.{int(m[2]) + 1}.0"'
        open(p, "w").write(txt[: m.start()] + new + txt[m.end():])


def upsert_catalog(root, cap, desc):
    p = os.path.join(root, "library", "catalog.yaml")
    lines = read(p).splitlines(keepends=True)
    line = f"  {cap}: {desc}\n"
    for i, ln in enumerate(lines):
        if ln.startswith(f"  {cap}: "):
            lines[i] = line
            break
    else:
        lines.append(line)
    open(p, "w").write("".join(lines))


def upsert_marketplace(root, cap, desc):
    p = os.path.join(root, ".claude-plugin", "marketplace.json")
    m = json.load(open(p))
    entry = {"name": cap, "source": f"./library/{cap}", "description": desc}
    plugins = [x for x in m["plugins"] if x["name"] != cap]
    head, rest = plugins[0], plugins[1:]
    rest.append(entry)
    rest.sort(key=lambda x: x["name"])
    m["plugins"] = [head] + rest
    with open(p, "w") as fh:
        json.dump(m, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def upsert_skills_md(root, cap, desc):
    p = os.path.join(root, "SKILLS.md")
    txt = read(p)
    short = desc.split("; use for")[0]
    quotes = (
        re.findall(r'"([^"]+)"', desc.split("; use for", 1)[1])
        if "; use for" in desc
        else []
    )
    trig = ", ".join(f'*"{q[0].upper() + q[1:]}"*' for q in quotes[:3])
    row = f"| **{cap}** | {short} | {trig} |\n"
    if re.search(rf"^\| \*\*{re.escape(cap)}\*\* \|", txt, re.M):
        txt = re.sub(rf"^\| \*\*{re.escape(cap)}\*\* \|.*\n", row, txt, flags=re.M)
    else:
        # ponytail: append after the last table row of the first table; good enough for a hand-read file
        rows = list(re.finditer(r"^\|.*\|\n", txt, re.M))
        i = rows[-1].end() if rows else len(txt)
        txt = txt[:i] + row + txt[i:]
    open(p, "w").write(txt)


# ── main ─────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sp = ap.add_subparsers(dest="cmd", required=True)
    i = sp.add_parser("init")
    i.add_argument("repo")
    i.add_argument("--name", required=True)
    i.add_argument(
        "--purpose", required=True, help="one sentence: what the folder becomes"
    )
    i.add_argument(
        "--launcher", required=True, help="root-level launcher name, e.g. wbs.sh"
    )
    i.add_argument(
        "--app-files",
        required=True,
        help="comma-separated repo paths vendored into app/; first is the entry point",
    )
    i.add_argument("--runtime", default="", help='e.g. "Node 22+" or "Python 3.10+"')
    i.add_argument("--src", default="distro")
    i.set_defaults(fn=cmd_init)
    v = sp.add_parser("validate")
    v.add_argument("repo")
    v.add_argument("--src", default="distro")
    v.set_defaults(fn=cmd_validate)
    p = sp.add_parser("publish")
    p.add_argument("cap")
    p.add_argument("repo")
    p.add_argument("--src", default="distro")
    p.add_argument("--check", action="store_true")
    p.add_argument("--release", action="store_true")
    p.set_defaults(fn=cmd_publish)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
