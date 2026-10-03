#!/usr/bin/env python3
"""docs_gate.py — gate G6: docs move with the code, and follow STE-100 limits.

    python3 docs_gate.py [--root DIR] [--docs a.md,b.md] [--no-touch-check]
    python3 docs_gate.py --selftest

Checks, in order:
  1. touch: if staged changes (git diff --cached) include code, at least one doc
     is staged too. Skipped when nothing is staged or with --no-touch-check.
  2. style, on every doc (numbered items in *PRD.md are descriptive): ordered-list sentences <= 20 words (procedural),
     other sentences <= 25 words (descriptive), paragraphs <= 6 sentences,
     no semicolons in prose, no template placeholders "(...)" left in.

Docs default to whichever exist in --root: README.md PRD.md FUNCSPEC.md
USERGUIDE.md CHANGELOG.md VIBE_*.md.

Output: JSON on stdout. Exit 0 = pass, 1 = findings, 2 = usage error.
Stdlib only.
"""

import argparse
import glob
import json
import os
import re
import subprocess
import sys

DEFAULT_DOCS = ["README.md", "PRD.md", "FUNCSPEC.md", "USERGUIDE.md", "CHANGELOG.md"]
PROC_MAX, DESC_MAX, PARA_MAX = 20, 25, 6
# Paths that are neither code nor docs for the touch rule.
NOT_CODE = re.compile(
    r"(^|/)(tests?|e2e|__tests__|\.aai|\.ailib|evals)/|\.(test|spec)\.[a-z]+$|"
    r"(^|/)(test_[^/]+\.py|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|uv\.lock|\.gitignore)$"
)
LIST_ITEM = re.compile(r"^\s*(\d+[.)]|[-*+])\s+")


def default_docs(root):
    found = [d for d in DEFAULT_DOCS if os.path.isfile(os.path.join(root, d))]
    found += sorted(
        os.path.basename(p) for p in glob.glob(os.path.join(root, "VIBE_*.md"))
    )
    return found


def clean(text):
    text = re.sub(r"`[^`]*`", "CODE", text)  # inline code = one word
    text = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", text)  # links -> link text
    text = re.sub(r"<[^>]+>", "", text)  # inline html
    return text.replace("**", "").replace("__", "")


def sentences(text):
    # ponytail: regex splitter; abbreviations like "e.g." split early (only ever shortens a sentence).
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'(*])", clean(text).strip())
    return [p for p in parts if re.search(r"[A-Za-z0-9]", p)]


def words(s):
    return len([w for w in s.split() if re.search(r"[A-Za-z0-9]", w)])


def blocks(md):
    """Yield (line_no, kind, text); kind in para|proc|desc_item|cell."""
    lines = md.splitlines()
    i, n = 0, len(lines)
    if lines and lines[0].strip() == "---":  # frontmatter
        i = next((k + 1 for k in range(1, n) if lines[k].strip() == "---"), n)
    cur, cur_kind, cur_line = [], None, 0

    def flush():
        nonlocal cur, cur_kind
        if cur:
            yield_ = (cur_line, cur_kind, " ".join(cur))
            cur, cur_kind = [], None
            return [yield_]
        return []

    out, fence, comment = [], False, False
    while i < n:
        raw = lines[i]
        s = raw.strip()
        ln = i + 1
        i += 1
        if s.startswith("```") or s.startswith("~~~"):
            out += flush()
            fence = not fence
            continue
        if fence:
            continue
        if "<!--" in s:
            comment = "-->" not in s.split("<!--", 1)[1]
            out += flush()
            continue
        if comment:
            comment = "-->" not in s
            continue
        s = re.sub(r"^(>\s?)+", "", s)
        if not s or s.startswith("#") or re.fullmatch(r"[-*_ ]{3,}", s):
            out += flush()
            continue
        if s.startswith("|"):
            out += flush()
            if re.fullmatch(r"[|:\- ]+", s):
                continue
            for cell in s.strip("|").split("|"):
                if cell.strip():
                    out.append((ln, "cell", cell.strip()))
            continue
        m = LIST_ITEM.match(raw)
        if m:
            out += flush()
            cur, cur_line = [raw[m.end() :].strip()], ln
            cur_kind = "proc" if m.group(1)[0].isdigit() else "desc_item"
            continue
        if cur_kind in ("proc", "desc_item") and raw[:1] in (" ", "\t"):
            cur.append(s)  # wrapped list item
            continue
        if cur_kind != "para":
            out += flush()
            cur_kind, cur_line = "para", ln
        cur.append(s)
    out += flush()
    return out


def style_findings(path, md):
    f = []
    # PRD requirements are numbered statements, not instructions.
    is_prd = os.path.basename(path).upper().endswith("PRD.MD")
    for ln, kind, text in blocks(md):
        if kind == "proc" and is_prd:
            kind = "desc_item"
        if re.fullmatch(r"\(.*\)\.?", clean(text).strip()):
            f.append(
                {
                    "file": path,
                    "line": ln,
                    "rule": "placeholder",
                    "detail": f"template placeholder left in: {text[:60]}",
                }
            )
            continue
        limit = PROC_MAX if kind == "proc" else DESC_MAX
        sents = sentences(text)
        for s in sents:
            if words(s) > limit:
                rule = (
                    "procedural_sentence" if kind == "proc" else "descriptive_sentence"
                )
                f.append(
                    {
                        "file": path,
                        "line": ln,
                        "rule": rule,
                        "detail": f"{words(s)} words > {limit}: {s[:80]}",
                    }
                )
        if kind == "para" and len(sents) > PARA_MAX:
            f.append(
                {
                    "file": path,
                    "line": ln,
                    "rule": "paragraph_length",
                    "detail": f"{len(sents)} sentences > {PARA_MAX}",
                }
            )
        if ";" in clean(text):
            f.append(
                {
                    "file": path,
                    "line": ln,
                    "rule": "semicolon",
                    "detail": "use two sentences",
                }
            )
    return f


def touch_check(root, docs):
    try:
        out = subprocess.run(
            ["git", "-C", root, "diff", "--cached", "--name-only"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.split()
    except (OSError, subprocess.CalledProcessError):
        return {"status": "skipped", "reason": "not a git repo"}, []
    if not out:
        return {"status": "skipped", "reason": "nothing staged"}, []
    doc_set = set(docs) | set(DEFAULT_DOCS)
    code = [
        p
        for p in out
        if p not in doc_set
        and not p.startswith("VIBE_")
        and not p.endswith(".md")
        and not NOT_CODE.search(p)
    ]
    staged_docs = [p for p in out if p in doc_set or p.startswith("VIBE_")]
    if code and not staged_docs:
        return {"status": "fail", "code": code[:10]}, [
            {
                "file": "(staged)",
                "line": 0,
                "rule": "docs_not_updated",
                "detail": f"code changed ({len(code)} files) but no doc is staged",
            }
        ]
    return {"status": "pass", "code": len(code), "docs": staged_docs}, []


def run(root, docs, touch):
    findings = []
    touched = {"status": "skipped", "reason": "--no-touch-check"}
    if touch:
        touched, tf = touch_check(root, docs)
        findings += tf
    for d in docs:
        p = os.path.join(root, d)
        if os.path.isfile(p):
            findings += style_findings(d, open(p, encoding="utf-8").read())
    return {"ok": not findings, "docs": docs, "touch": touched, "findings": findings}


def selftest():
    long_step = "1. " + " ".join(["word"] * 21) + "."
    assert [f["rule"] for f in style_findings("x", long_step)] == [
        "procedural_sentence"
    ]
    assert style_findings("x", "1. " + " ".join(["word"] * 20) + ".") == []
    assert style_findings("x", " ".join(["word"] * 25) + ".") == []
    assert [f["rule"] for f in style_findings("x", " ".join(["w"] * 26) + ".")] == [
        "descriptive_sentence"
    ]
    assert [
        f["rule"]
        for f in style_findings("x", "One. Two. Three. Four. Five. Six. Seven.")
    ] == ["paragraph_length"]
    assert [f["rule"] for f in style_findings("x", "Do this; do that.")] == [
        "semicolon"
    ]
    assert style_findings("x", "Run `a; b` now.") == []  # code is not prose
    assert style_findings("x", "```\n" + "a; " * 40 + "\n```") == []  # fences skipped
    assert style_findings("x", "| a | b |\n|---|---|\n| short cell | ok |") == []
    wrapped = "- " + " ".join(["w"] * 13) + "\n  " + " ".join(["w"] * 13) + "."
    assert [f["rule"] for f in style_findings("x", wrapped)] == ["descriptive_sentence"]
    req = "1. " + " ".join(["w"] * 22) + "."
    assert style_findings("PRD.md", req) == []  # PRD items are descriptive
    assert [f["rule"] for f in style_findings("USERGUIDE.md", req)] == [
        "procedural_sentence"
    ]
    assert [f["rule"] for f in style_findings("x", "1. (Requirement)")] == [
        "placeholder"
    ]
    assert style_findings("x", "Run it (see below).") == []
    assert NOT_CODE.search("tests/test_app.py") and NOT_CODE.search("src/a.test.ts")
    assert not NOT_CODE.search("src/app.ts")
    print(json.dumps({"selftest": "pass"}))


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--root", default=".")
    ap.add_argument("--docs", help="comma-separated doc paths relative to --root")
    ap.add_argument("--no-touch-check", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        selftest()
        return 0
    if not os.path.isdir(a.root):
        print(json.dumps({"error": f"no such dir: {a.root}"}))
        return 2
    docs = a.docs.split(",") if a.docs else default_docs(a.root)
    res = run(a.root, docs, not a.no_touch_check)
    print(json.dumps(res, indent=1))
    return 0 if res["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
