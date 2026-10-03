#!/usr/bin/env python3
"""Self-check: scaffold into a temp dir and assert the contract holds."""
import json, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "init_dev_project.py")


def sh(*cmd, cwd=None, ok=True):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    assert (r.returncode == 0) == ok, f"{cmd}\n{r.stdout}\n{r.stderr}"
    return r.stdout


with tempfile.TemporaryDirectory() as tmp:
    p = os.path.join(tmp, "demo-app")
    out = json.loads(sh(sys.executable, SCRIPT, p, "--kind", "web", "--description", "Demo.", "--json"))
    for f in ["README.md", "VERSION", "CHANGELOG.md", "Makefile", ".gitignore",
              ".aai/instructions.md", ".aai/identity.md", ".aai/purpose.md", ".aai/context.md",
              ".aai/HANDOFF.md", ".aai/checkpoint.md", ".aai/references/dev-standard.md",
              "deploy/SHIPLIST", "spec/SPEC.md"]:
        assert os.path.isfile(os.path.join(p, f)), f
        assert "{{" not in open(os.path.join(p, f)).read(), f"unrendered placeholder in {f}"
    assert "demo-app" in open(os.path.join(p, "README.md")).read()
    assert open(os.path.join(p, ".aai/references/dev-standard.md")).read().startswith("<!-- init-dev-project v")
    assert sh("git", "tag", cwd=p).strip() == "v0.0.0"
    assert sh("git", "status", "--porcelain", cwd=p) == ""
    assert sh("git", "branch", "--show-current", cwd=p).strip() == "main"
    # idempotent: second run creates nothing, touches git nothing
    again = json.loads(sh(sys.executable, SCRIPT, p, "--json"))
    assert again["created"] == [] and "untouched" in again["git"]
    # the four verbs: help works, closed gates fail, deploy refuses when untagged
    help_out = sh("make", cwd=p)
    assert "make release" in help_out and "1 SPEC" in help_out and "4 SHIP" in help_out
    sh("make", "check", cwd=p, ok=False)
    sh("make", "run", cwd=p, ok=False)
    # build enforces SHIPLIST: nothing in src/ or docs/ yet, so it fails
    sh("make", "build", cwd=p, ok=False)
    os.makedirs(os.path.join(p, "src")); os.makedirs(os.path.join(p, "docs"))
    open(os.path.join(p, "src", "app.py"), "w").write("print('hi')\n")
    open(os.path.join(p, "docs", "help.md"), "w").write("# help\n")
    sh("make", "build", cwd=p)
    assert sorted(os.listdir(os.path.join(p, "build", "candidate"))) == ["VERSION", "docs", "src"]
    # the spec gate fails on the scaffold's TODO: lines and passes once they are filled
    r = subprocess.run(["make", "spec"], cwd=p, capture_output=True, text=True)
    assert r.returncode != 0 and "fill the TODO: lines" in r.stderr, r.stderr
    sp = os.path.join(p, "spec", "SPEC.md")
    assert "`grill-with-prototype`" in open(sp).read()  # UI projects are pointed at the prototype interview
    open(sp, "w").write(open(sp).read().replace("TODO: one observable", "- Prints hi. One observable").replace("TODO: input", "- run → hi. Input"))
    sh("make", "spec", cwd=p)
    # define check only; accept still fails, so release must restore VERSION and tag nothing
    mk = os.path.join(p, "Makefile")
    src = open(mk).read(); open(mk, "w").write(src.replace(
        '\t@echo "check: not defined yet — a gate with nothing behind it must fail" >&2; exit 1', '\t@true'))
    sh("git", "add", "-A", cwd=p); sh("git", "commit", "-qm", "define check", cwd=p)
    r = subprocess.run(["make", "release", "NOTE=first"], cwd=p, capture_output=True, text=True)
    assert r.returncode != 0 and "acceptance failed" in r.stderr, r.stderr
    assert open(os.path.join(p, "VERSION")).read().strip() == "0.0.0"
    assert sh("git", "status", "--porcelain", cwd=p) == ""
    assert sh("git", "tag", cwd=p).strip() == "v0.0.0"
    # define accept; it must see the bumped VERSION in the candidate
    src = open(mk).read(); open(mk, "w").write(src.replace(
        '\t@echo "accept: not defined yet — a gate with nothing behind it must fail" >&2; exit 1',
        '\t@cat build/candidate/VERSION > build/accepted'))
    sh("git", "commit", "-qam", "define accept", cwd=p)
    sh("make", "release", "NOTE=first", cwd=p)
    assert open(os.path.join(p, "VERSION")).read().strip() == "0.0.1"
    assert open(os.path.join(p, "build", "accepted")).read().strip() == "0.0.1", "accept ran on a stale VERSION"
    assert "## v0.0.1" in open(os.path.join(p, "CHANGELOG.md")).read().splitlines()[2]
    assert "v0.0.1" in sh("git", "tag", cwd=p)
    sh("make", "release", "BUMP=minor", cwd=p)
    assert open(os.path.join(p, "VERSION")).read().strip() == "0.1.0"
    assert sh("git", "status", "--porcelain", cwd=p) == ""
    # gitignored files under a shipped folder stay out of the candidate
    os.makedirs(os.path.join(p, "src", "__pycache__"))
    open(os.path.join(p, "src", "__pycache__", "app.pyc"), "w").write("x")
    sh("make", "build", cwd=p)
    assert not os.path.exists(os.path.join(p, "build", "candidate", "src", "__pycache__"))
    # deploy refuses a dirty tree even on a tagged HEAD: the tag must describe what ships
    open(os.path.join(p, "src", "app.py"), "a").write("# wip\n")
    r = subprocess.run(["make", "deploy"], cwd=p, capture_output=True, text=True)
    assert r.returncode != 0 and "uncommitted" in r.stderr, r.stderr
    sh("git", "checkout", "--", "src/app.py", cwd=p)
    # existing deploy/: a ship list the owner already wrote is kept, not overwritten
    e = os.path.join(tmp, "existing")
    os.makedirs(os.path.join(e, "deploy", "docker"))
    open(os.path.join(e, "deploy", "SHIPLIST"), "w").write("VERSION\nworker/\n")
    open(os.path.join(e, "deploy", "docker", "compose.yaml"), "w").write("services: {}\n")
    r = json.loads(sh(sys.executable, SCRIPT, e, "--json"))
    assert "deploy/SHIPLIST" in r["skipped"] and "deploy/SHIPLIST" not in r["created"]
    assert open(os.path.join(e, "deploy", "SHIPLIST")).read() == "VERSION\nworker/\n"
    assert open(os.path.join(e, "deploy", "docker", "compose.yaml")).read() == "services: {}\n"
    assert sh("git", "status", "--porcelain", cwd=e) == ""   # owner's files are in the first commit
    # ship list entries with spaces: one line is one path, never split on whitespace
    os.makedirs(os.path.join(p, "user guide"))
    open(os.path.join(p, "user guide", "intro.md"), "w").write("# intro\n")
    open(os.path.join(p, "deploy", "SHIPLIST"), "a").write("user guide/\n")
    sh("make", "build", cwd=p)
    assert os.path.isfile(os.path.join(p, "build", "candidate", "user guide", "intro.md"))
    # a listed path with spaces that does not exist still fails the build
    open(os.path.join(p, "deploy", "SHIPLIST"), "a").write("release notes.md\n")
    r = subprocess.run(["make", "build"], cwd=p, capture_output=True, text=True)
    assert r.returncode != 0 and "release notes.md is on SHIPLIST but missing" in r.stderr, r.stderr
    before = (sh("git", "tag", cwd=p), sh("git", "log", "--oneline", cwd=p))
    # kind picks the ship list and the BUILD row of the map; unknown kinds get the web layout
    k = os.path.join(tmp, "demo-skill")
    sh(sys.executable, SCRIPT, k, "--kind", "skill", "--json")
    ship = open(os.path.join(k, "deploy", "SHIPLIST")).read().split("\n")
    assert "SKILL.md" in ship and "references/" in ship and "src/" not in ship, ship
    assert "2 BUILD           root      make run" in sh("make", cwd=k)
    sh("make", "build", cwd=k, ok=False)   # SKILL.md etc. not written yet
    for f in ship:
        if f.endswith("/"): os.makedirs(os.path.join(k, f), exist_ok=True); open(os.path.join(k, f, ".keep"), "w").close()
        elif f and f != "VERSION": open(os.path.join(k, f), "w").write("x\n")
    sh("make", "build", cwd=k)
    t = os.path.join(tmp, "my-tool")
    sh(sys.executable, SCRIPT, t, "--kind", "tool", "--json")
    assert open(os.path.join(t, "deploy", "SHIPLIST")).read() == "VERSION\nmy_tool.py\n"
    assert open(os.path.join(p, "deploy", "SHIPLIST")).read().startswith("VERSION\nsrc/\ndocs/\n")
    # no --kind: detect from files already there, say why; explicit --kind always wins
    def seed(name, files):
        d = os.path.join(tmp, name); os.makedirs(d)
        for f in files:
            if f.endswith("/"): os.makedirs(os.path.join(d, f))
            else: open(os.path.join(d, f), "w").write("x\n")
        return d
    for name, files, kind in [("det-skill", ["SKILL.md"], "skill"),
                              ("det-app", ["SKILL.md", "manifest.json", "bridge/"], "skill-app"),
                              ("det-web", ["wrangler.toml"], "web"),
                              ("det-none", [], "project")]:
        r = json.loads(sh(sys.executable, SCRIPT, seed(name, files), "--no-git", "--json"))
        assert r["kind"] == kind and r["kind_reason"], (name, r["kind"], r.get("kind_reason"))
    r = json.loads(sh(sys.executable, SCRIPT, seed("det-forced", ["SKILL.md"]), "--kind", "web", "--no-git", "--json"))
    assert r["kind"] == "web" and r["kind_reason"] == "given", r
    assert "kind: skill (found SKILL.md)" in sh(sys.executable, SCRIPT, seed("det-text", ["SKILL.md"]), "--no-git")
    # inside an existing repo (incubator lane): never git init a nested repo, never commit for the owner
    n = os.path.join(p, "incubated")
    r = json.loads(sh(sys.executable, SCRIPT, n, "--json"))
    assert not os.path.exists(os.path.join(n, ".git")) and r["git"].startswith("inside existing repo"), r["git"]
    assert (sh("git", "tag", cwd=p), sh("git", "log", "--oneline", cwd=p)) == before
    d = json.loads(sh(sys.executable, SCRIPT, os.path.join(p, "not", "yet"), "--dry-run", "--json"))
    assert d["git"].startswith("inside existing repo"), d["git"]
    # dry run writes nothing
    q = os.path.join(tmp, "dry")
    d = json.loads(sh(sys.executable, SCRIPT, q, "--dry-run", "--json"))
    assert d["created"] and not os.path.exists(q)
print("ok")
