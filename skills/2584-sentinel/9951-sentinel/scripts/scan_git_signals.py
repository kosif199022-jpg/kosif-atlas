#!/usr/bin/env python3
"""Tier-1 Maintain detector: post-ship trouble signals from git history alone.

No external service, no credentials, no instrumentation to install. It reads the
repo's own commit record and reports the things worth a human deciding about:

  repeat classes  a file that keeps needing fixes is usually a design problem
                  wearing a bug costume. The recurrence is the signal, never any
                  single commit -- which is exactly why a human notices it late.
  reverts         a change that had to be undone. Strongest available signal
                  that something reached users broken.
  fix share       fix commits as a fraction of all commits, for trend only.
                  Meaningless as a single reading, useful across windows.

Emits JSON on stdout and always exits 0. A detector that dies on a young repo
with no history is a detector nobody keeps scheduled.

Usage:
  py -3 scan_git_signals.py [--repo PATH] [--since GIT_DATE] [--min-fixes N]
"""

import argparse
import json
import math
import re
import subprocess
import sys
from collections import defaultdict
from datetime import datetime, timezone

# Conventional Commits, tolerating scope and the breaking-change bang.
FIX_RE = re.compile(r"^fix(\([^)]*\))?!?:", re.IGNORECASE)
REVERT_RE = re.compile(r'^revert(\([^)]*\))?!?:|^revert\s+"', re.IGNORECASE)

# A fix touching a lockfile says nothing about design. Everything else stays --
# over-filtering here hides the signal the whole script exists to find.
NOISE_RE = re.compile(
    r"(^|/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|"
    r"Cargo\.lock|poetry\.lock|composer\.lock|go\.sum)$"
)

# Separators are passed to git as the literal placeholders "%x1e"/"%x1f" and only
# come back as real bytes in git's output. Embedding the bytes in the argument
# itself is what NUL used to do here, and Windows CreateProcess rejects that.
# Files whose whole job is to change often. A locale catalog touched 37 times in
# a month is the translation workflow working, not a design problem, and letting
# it rank first buries the findings that are.
EXPECTED_CHURN_RE = re.compile(
    r"(^|/)(messages|locales?|lang|i18n|translations?)/[^/]+\.(json|ya?ml|po)$"
    r"|(^|/)__snapshots__/|\.snap$"
    r"|(^|/)(dist|build|generated)/|\.generated\.",
    re.IGNORECASE,
)

UNIT_SEP = "\x1f"
REC_SEP = "\x1e"
GIT_FORMAT = "--format=%x1e%H%x1f%at%x1f%s"


def percentile(sorted_values, p):
    """Linear-interpolated percentile over an already-sorted list."""
    if not sorted_values:
        return 0
    k = (len(sorted_values) - 1) * (p / 100.0)
    lo, hi = math.floor(k), math.ceil(k)
    if lo == hi:
        return float(sorted_values[int(k)])
    return sorted_values[lo] + (sorted_values[hi] - sorted_values[lo]) * (k - lo)


def git(repo, *args):
    return subprocess.run(
        ["git", "-C", repo, *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=".")
    ap.add_argument("--since", default="30 days ago")
    ap.add_argument("--min-fixes", type=int, default=2)
    # Three fixes to one file in a single afternoon is one bug being iterated,
    # not a design problem recurring. Only a gap between fixes distinguishes
    # them, so span is what promotes a cluster to a recurring class.
    ap.add_argument("--min-span-days", type=int, default=7)
    # An absolute fix count cannot serve both a side project at 250 lifetime
    # commits and a client repo at 400 a month with a 40% fix share: the same
    # bar is silent on the first and files 60 findings on the second. So the
    # real bar is relative -- a file is only interesting if it is an outlier
    # against the fix distribution of its own repo.
    ap.add_argument("--percentile", type=float, default=95.0)
    ap.add_argument("--max-report", type=int, default=15)
    args = ap.parse_args()

    probe = git(args.repo, "rev-parse", "--git-dir")
    if probe.returncode != 0:
        json.dump({"error": "not a git repository", "repo": args.repo}, sys.stdout)
        return

    log = git(
        args.repo,
        "log",
        f"--since={args.since}",
        "--no-merges",
        "--name-only",
        GIT_FORMAT,
    )
    if log.returncode != 0:
        json.dump({"error": log.stderr.strip()[:400], "repo": args.repo}, sys.stdout)
        return

    commits = []
    for record in log.stdout.split(REC_SEP)[1:]:
        lines = record.split("\n")
        header = lines[0].split(UNIT_SEP)
        if len(header) != 3:
            continue
        sha, ts, subject = header
        files = [f for f in (l.strip() for l in lines[1:]) if f and not NOISE_RE.search(f)]
        commits.append(
            {
                "sha": sha[:8],
                "date": datetime.fromtimestamp(int(ts), timezone.utc).strftime("%Y-%m-%d"),
                "subject": subject,
                "files": files,
            }
        )

    fixes = [c for c in commits if FIX_RE.match(c["subject"])]
    reverts = [c for c in commits if REVERT_RE.match(c["subject"])]

    per_file = defaultdict(list)
    for c in fixes:
        for f in c["files"]:
            per_file[f].append(c)

    # Percentile over files that took at least one fix -- "unusual for this
    # repo", not "unusual in the abstract".
    dist = sorted(len(cs) for cs in per_file.values())
    outlier_floor = percentile(dist, args.percentile)
    effective_floor = max(args.min_fixes, math.ceil(outlier_floor))

    repeat_classes = []
    for path, cs in per_file.items():
        if len(cs) < args.min_fixes:
            continue
        dates = sorted(c["date"] for c in cs)
        span = (
            datetime.strptime(dates[-1], "%Y-%m-%d")
            - datetime.strptime(dates[0], "%Y-%m-%d")
        ).days
        if EXPECTED_CHURN_RE.search(path):
            pattern = "expected-churn"      # its job is to change often
        elif span < args.min_span_days:
            pattern = "clustered"           # one bug, iterated in a sitting
        elif len(cs) < effective_floor:
            pattern = "common"              # normal wear for this repo
        else:
            pattern = "recurring"           # the only bucket worth filing

        repeat_classes.append(
            {
                "pattern": pattern,
                # The path doubles as the dedup key: the skill greps docs/intent
                # for it before filing, so a standing problem gets one amended
                # file rather than one new file per scheduled run.
                "signature": path,
                "file": path,
                "fix_count": len(cs),
                "first_fix": dates[0],
                "last_fix": dates[-1],
                "span_days": span,
                "subjects": [c["subject"] for c in cs],
                "shas": [c["sha"] for c in cs],
            }
        )
    rank = {"recurring": 0, "common": 1, "expected-churn": 2, "clustered": 3}
    repeat_classes.sort(key=lambda r: (rank[r["pattern"]], -r["fix_count"], r["file"]))

    bucket_counts = defaultdict(int)
    for r in repeat_classes:
        bucket_counts[r["pattern"]] += 1

    # Cap the payload, but never silently. A truncated list that reads as
    # complete is how a detector starts lying by omission.
    reported = repeat_classes[: args.max_report]
    dropped = len(repeat_classes) - len(reported)

    total = len(commits)
    json.dump(
        {
            "repo": args.repo,
            "window": args.since,
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "totals": {
                "commits": total,
                "fix_commits": len(fixes),
                "revert_commits": len(reverts),
                "fix_share": round(len(fixes) / total, 3) if total else 0.0,
            },
            "thresholds": {
                "min_fixes": args.min_fixes,
                "min_span_days": args.min_span_days,
                "percentile": args.percentile,
                "fix_count_distribution_p": round(outlier_floor, 2),
                "effective_floor": effective_floor,
            },
            "bucket_counts": dict(bucket_counts),
            "repeat_classes_reported": len(reported),
            "repeat_classes_dropped_from_payload": dropped,
            "repeat_classes": reported,
            "reverts": [
                {"sha": c["sha"], "date": c["date"], "subject": c["subject"]}
                for c in reverts
            ],
            "conventional_commit_coverage": round(
                sum(
                    1
                    for c in commits
                    if re.match(r"^\w+(\([^)]*\))?!?:", c["subject"])
                )
                / total,
                3,
            )
            if total
            else 0.0,
        },
        sys.stdout,
        indent=2,
    )


if __name__ == "__main__":
    main()
