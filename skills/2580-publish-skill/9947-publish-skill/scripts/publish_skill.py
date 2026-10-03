#!/usr/bin/env python3
"""Publish one local skill to mqmalagris/agent-skills.

Mechanical pipeline: refresh a repo clone -> copy skills/<name> -> mint
.claude-plugin/plugin.json -> upsert marketplace.json entry -> bump the skill's
version -> log a CHANGELOG [Unreleased] entry -> validate JSON -> commit + push.

Idempotent. On UPDATE it preserves the existing category/keywords/description
and bumps the PATCH version by default (--bump minor|major or --version to
override, --no-bump to hold). On a NEW skill it uses --version (default 0.1.0).
Collection releases are cut separately with scripts/release.py in the repo.
"""
import argparse, json, re, shutil, subprocess, sys
from pathlib import Path

# Skill descriptions carry arrows and dashes; a cp1252 console (Windows default)
# raises UnicodeEncodeError when we echo them back. Only NEW skills hit this --
# updates reuse the already-stored description -- so it fails rarely and late.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

REPO = "https://github.com/mqmalagris/agent-skills"
OWNER_NAME = "mqmalagris/agent-skills"
AUTHOR = {"name": "Matheus Malagris", "url": "https://github.com/mqmalagris"}
DEFAULT_LOCAL = Path.home() / ".claude" / "skills"
DEFAULT_REPO_DIR = Path.home() / ".cache" / "agent-skills-publish"
SEMVER = re.compile(r"^(\d+)\.(\d+)\.(\d+)$")


def run(cmd, cwd=None, check=True):
    r = subprocess.run(cmd, cwd=cwd, text=True, capture_output=True)
    if check and r.returncode != 0:
        sys.exit(f"! `{' '.join(cmd)}` failed:\n{r.stdout}{r.stderr}")
    return r


def find_bash():
    """A working bash. On Windows, PATH's first `bash` is often System32's WSL
    launcher, which only prints an install prompt when WSL is absent, so prefer
    the Git for Windows bash that sits beside git.exe."""
    if sys.platform == "win32":
        git = shutil.which("git")
        if git:
            for cand in (Path(git).resolve().parent.parent / "bin" / "bash.exe",
                         Path(git).resolve().parent.parent.parent / "bin" / "bash.exe"):
                if cand.exists():
                    return str(cand)
        found = shutil.which("bash")
        return found if found and "system32" not in found.lower() else None
    return shutil.which("bash")


def bump_semver(v, part):
    m = SEMVER.match(v or "0.0.0")
    M, mi, p = (int(x) for x in m.groups()) if m else (0, 0, 0)
    return {"major": f"{M+1}.0.0", "minor": f"{M}.{mi+1}.0", "patch": f"{M}.{mi}.{p+1}"}[part]


def frontmatter_description(skill_md: Path) -> str:
    text = skill_md.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---", text, re.S)
    if not m:
        return ""
    desc, capturing = [], False
    for line in m.group(1).splitlines():
        dm = re.match(r"^description:\s*(.*)$", line)
        if dm:
            val = dm.group(1).strip()
            if val in ("|", ">", "|-", ">-", ""):
                capturing = True
                continue
            desc = [val.strip().strip('"').strip("'")]
            break
        if capturing:
            if re.match(r"^\S", line):
                break
            desc.append(line.strip())
    joined = re.sub(r"\s+", " ", " ".join(desc)).strip()
    first = re.split(r"(?<=[.!?])\s", joined)[0] if joined else ""
    return (first if 20 <= len(first) <= 240 else joined)[:240].strip()


def ensure_repo(repo_dir: Path):
    if (repo_dir / ".git").exists():
        run(["git", "fetch", "origin", "main"], cwd=repo_dir)
        run(["git", "checkout", "main"], cwd=repo_dir)
        run(["git", "reset", "--hard", "origin/main"], cwd=repo_dir)
        run(["git", "clean", "-fd"], cwd=repo_dir)  # drop stray untracked dirs (e.g. a prior dry-run's skill copy) that reset --hard leaves behind
    else:
        repo_dir.parent.mkdir(parents=True, exist_ok=True)
        run(["git", "clone", REPO + ".git", str(repo_dir)])


def changelog_add(repo_dir: Path, entry: str):
    cl = repo_dir / "CHANGELOG.md"
    if not cl.exists():
        return False
    text = cl.read_text(encoding="utf-8")
    i = text.find("## [Unreleased]")
    if i == -1:
        return False
    j = text.find("\n", i) + 1
    cl.write_text(text[:j] + f"- {entry}\n" + text[j:], encoding="utf-8")
    return True


def main():
    ap = argparse.ArgumentParser(description="Publish a local skill to " + OWNER_NAME)
    ap.add_argument("skill", help="skill name = dir under the local skills dir")
    ap.add_argument("--category", default=None,
                    help="marketplace category (required for a NEW skill; kept from existing on update)")
    ap.add_argument("--keywords", default=None, help="comma-separated keywords (kept from existing on update if omitted)")
    ap.add_argument("--description", default="", help="concise description (kept from existing, else derived from SKILL.md)")
    ap.add_argument("--version", default=None, help="set an explicit version X.Y.Z")
    ap.add_argument("--bump", choices=["major", "minor", "patch"], default=None,
                    help="on update, bump this part (default: patch)")
    ap.add_argument("--no-bump", action="store_true", help="on update, keep the existing version")
    ap.add_argument("--changelog", default=None, help="CHANGELOG [Unreleased] line (default auto)")
    ap.add_argument("--author-name", default=AUTHOR["name"])
    ap.add_argument("--local-skills-dir", type=Path, default=DEFAULT_LOCAL)
    ap.add_argument("--repo-dir", type=Path, default=DEFAULT_REPO_DIR)
    ap.add_argument("--push-main", action="store_true", help="push directly to main instead of opening a PR (legacy / release use)")
    ap.add_argument("--auto-merge", action="store_true", help="open the PR with squash auto-merge (merges when CI passes)")
    ap.add_argument("--merge", action="store_true", help="merge the PR immediately (squash, admin)")
    ap.add_argument("--no-push", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--skip-evals", action="store_true",
                    help="publish without running (and recording) the skill's eval suite")
    args = ap.parse_args()

    name = args.skill
    src = args.local_skills_dir / name
    if not (src / "SKILL.md").exists():
        sys.exit(f"! no SKILL.md at {src}")
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", name):
        sys.exit(f"! skill name '{name}' must be kebab-case")

    ensure_repo(args.repo_dir)
    mp_path = args.repo_dir / ".claude-plugin" / "marketplace.json"
    mp = json.loads(mp_path.read_text(encoding="utf-8"))
    existing = next((p for p in mp["plugins"] if p["name"] == name), None)

    category = args.category or (existing or {}).get("category")
    if not category:
        sys.exit("! --category is required for a new skill")
    kw = ([k.strip() for k in args.keywords.split(",") if k.strip()]
          if args.keywords is not None else list((existing or {}).get("keywords", [])))
    desc = (args.description.strip() or (existing or {}).get("description")
            or frontmatter_description(src / "SKILL.md"))
    if not desc:
        sys.exit("! no description given and none parseable from SKILL.md; pass --description")

    # version: explicit > (update: bump/keep) > (new: 0.1.0)
    prev = (existing or {}).get("version")
    if args.version:
        version = args.version
    elif existing and not args.no_bump:
        version = bump_semver(prev, args.bump or "patch")
    else:
        version = prev or "0.1.0"
    if not SEMVER.match(version):
        sys.exit(f"! version '{version}' not X.Y.Z")

    dst = args.repo_dir / "skills" / name
    if dst.exists():
        shutil.rmtree(dst)
    # never vendor build/editor droppings into the public repo
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns(
        "__pycache__", "*.pyc", "*.pyo", ".DS_Store", ".pytest_cache", "*.egg-info"))

    plugin = {
        "name": name, "version": version, "description": desc,
        "author": {"name": args.author_name, "url": AUTHOR["url"]},
        "homepage": f"{REPO}/tree/main/skills/{name}",
        "repository": REPO, "license": "MIT",
        "keywords": kw + [category],
    }
    (dst / ".claude-plugin").mkdir(parents=True, exist_ok=True)
    (dst / ".claude-plugin" / "plugin.json").write_text(json.dumps(plugin, indent=2) + "\n", encoding="utf-8")

    entry = {
        "name": name, "source": f"./skills/{name}", "description": desc,
        "version": version, "author": {"name": args.author_name},
        "category": category, "keywords": kw,
    }
    mp["plugins"] = [p for p in mp["plugins"] if p["name"] != name] + [entry]
    mp_path.write_text(json.dumps(mp, indent=2) + "\n", encoding="utf-8")

    action = "updated" if existing else "added"
    cl_line = args.changelog or f"`{name}` {version} — {'updated' if existing else 'new skill'}"
    logged = changelog_add(args.repo_dir, cl_line)

    # validate every manifest parses
    for p in [mp_path] + list((args.repo_dir / "skills").glob("*/.claude-plugin/plugin.json")):
        json.loads(p.read_text(encoding="utf-8"))

    print(f"{action} skills/{name} v{version} ({len(mp['plugins'])} plugins)" + ("" if logged else "  [no CHANGELOG]"))
    print(f'README row -> | [`{name}`](skills/{name}/) | {desc} |')

    if args.dry_run:
        print("dry-run: no commit/push. Repo prepared at", args.repo_dir)
        return

    # Eval gate + trend: run the skill's suite on the publisher's own Claude
    # login and record the result in evals-history/<name>.jsonl, which the
    # `git add -A` below commits alongside the skill. The pre-push hook sees
    # that passing entry for this exact content and doesn't run it twice.
    runner = args.repo_dir / "scripts" / "eval-run.sh"
    if (dst / "evals").is_dir() and runner.exists() and not args.skip_evals:
        bash = find_bash()
        if not bash:
            sys.exit("! bash not found to run evals; install Git Bash or pass --skip-evals")
        print(f"running {name} evals (recorded to evals-history/{name}.jsonl) ...", flush=True)
        if subprocess.run([bash, "scripts/eval-run.sh", name, "--record"], cwd=args.repo_dir).returncode != 0:
            sys.exit(f"! {name} evals below threshold; fix the skill, or pass --skip-evals to publish anyway")

    repo = args.repo_dir
    title = f"{action} skill: {name} v{version}"
    branch = f"publish/{name}-v{version}"
    if not args.push_main:
        run(["git", "checkout", "-b", branch], cwd=repo)  # carries the working-tree changes onto the branch
    run(["git", "add", "-A"], cwd=repo)
    if run(["git", "diff", "--cached", "--quiet"], cwd=repo, check=False).returncode == 0:
        print("no changes to commit (already in sync)")
        return
    run(["git", "commit", "-m", title], cwd=repo)
    sha = run(["git", "rev-parse", "HEAD"], cwd=repo).stdout.strip()

    if args.push_main:
        if args.no_push:
            print(f"committed {sha[:7]} on main locally (--no-push).")
            return
        run(["git", "push", "origin", "HEAD:main"], cwd=repo)
        remote = run(["git", "ls-remote", "origin", "-h", "refs/heads/main"], cwd=repo).stdout.split()[0]
        ok = sha == remote
        print(f"{'OK pushed' if ok else 'MISMATCH'} {sha[:7]} -> origin/main ({OWNER_NAME})")
        if not ok:
            sys.exit("! push did not land; check remote")
        return

    # PR mode (default)
    if args.no_push:
        print(f"committed {sha[:7]} on branch {branch} locally (--no-push).")
        return
    run(["git", "push", "-u", "origin", branch], cwd=repo)
    pr = run(["gh", "pr", "create", "--base", "main", "--head", branch, "--title", title,
              "--body", f"{cl_line}\n\nOpened by publish-skill. CI (`validate`) gates this PR."], cwd=repo)
    url = (pr.stdout.strip().splitlines() or [""])[-1]
    print(f"PR opened: {url}")
    if args.merge:
        run(["gh", "pr", "merge", branch, "--squash", "--admin", "--delete-branch"], cwd=repo)
        print(f"merged {branch} -> main (squash)")
    elif args.auto_merge:
        run(["gh", "pr", "merge", branch, "--squash", "--auto", "--delete-branch"], cwd=repo)
        print("auto-merge enabled; merges when CI passes")


if __name__ == "__main__":
    main()
