#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Probe keyword candidates against live App Store search results — free, no API key.

    python3 keyword_probe.py "chord pad" "chord progression"
    python3 keyword_probe.py --from ../listing/en.md          # reads '## Target keywords'
    python3 keyword_probe.py "pad de acordes" --country br --lang pt_br
    python3 keyword_probe.py "chord pad" --competitors        # top titles + subtitles
    python3 keyword_probe.py --selftest

Uses Apple's public iTunes Search API. Three measured signals per term:

  DENSITY    share of top results carrying the term in their title. High means
             developers converge on it (evidence people search it) and the term is
             a commodity; ~zero means either a real gap or nobody searches it.
  DIFFICULTY median user-rating count of the top 10. A proxy for incumbent
             authority: you do not out-rank 100k-review apps on a new listing.
  INTENT     genre concentration of the top 20. Scattered genres mean the searcher
             wants different things than you offer, however high the traffic.

WHAT THIS DOES NOT GIVE YOU: search volume. Apple's autosuggest endpoint no longer
returns hints and Play has no free equivalent, so nothing here measures demand
directly. Density is a conviction signal, not a volume signal. Before betting an app
NAME on a term, validate volume with a real data tool (AppFigures, Sensor Tower,
AppTweak, Astro). This narrows the candidate list for cheap; it does not close it.

Play has no free search API. For Play, read competitor listings by hand or use a paid
tool; the method in SKILL.md is identical, only the data source changes.
"""
import argparse, json, re, statistics, sys, time, urllib.parse, urllib.request
from pathlib import Path

API = "https://itunes.apple.com/search"
UA = "aso-craft/1.0 (+keyword research)"
PAUSE = 1.2  # iTunes Search API is unauthenticated and rate-limited; be polite


def fetch(term, country="us", lang=None, limit=50, entity="software"):
    q = {"term": term, "entity": entity, "limit": limit, "country": country}
    if lang:
        q["lang"] = lang
    req = urllib.request.Request(f"{API}?{urllib.parse.urlencode(q)}",
                                 headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode("utf-8"))["results"]


def band(value, cuts, labels):
    for cut, label in zip(cuts, labels):
        if value < cut:
            return label
    return labels[-1]


def probe(term, country="us", lang=None):
    res = fetch(term, country, lang)
    n = len(res)
    if not n:
        return {"term": term, "n": 0}
    t = term.lower()
    hits = [a for a in res if t in (a.get("trackName") or "").lower()]
    ratings = sorted((a.get("userRatingCount") or 0 for a in res[:10]), reverse=True)
    genres = {}
    for a in res[:20]:
        g = a.get("primaryGenreName") or "?"
        genres[g] = genres.get(g, 0) + 1
    top_genre, top_count = max(genres.items(), key=lambda kv: kv[1])
    concentration = top_count / min(20, n)
    median_ratings = int(statistics.median(ratings)) if ratings else 0
    return {
        "term": term, "n": n,
        "density": len(hits) / n,
        "title_hits": len(hits),
        "median_ratings": median_ratings,
        "difficulty": band(median_ratings, [500, 5000, 50000],
                           ["low", "moderate", "high", "entrenched"]),
        "top_genre": top_genre,
        "concentration": concentration,
        "intent": ("focused" if concentration >= 0.70 else
                   "mixed" if concentration >= 0.40 else "scattered"),
        "competitors": [{"title": a.get("trackName"),
                         "genre": a.get("primaryGenreName"),
                         "ratings": a.get("userRatingCount") or 0,
                         "price": a.get("formattedPrice")}
                        for a in res[:5]],
    }


def verdict(r):
    """One-line read. Deliberately conservative: says 'check volume' rather than 'go'."""
    if r["intent"] == "scattered":
        return "CUT — searchers want other categories; traffic will not convert"
    if r["difficulty"] == "entrenched":
        return "CUT for now — incumbent authority too high for a young listing"
    if r["density"] > 0.60:
        return "COMMODITY — everyone titles on it; expect to lose without authority"
    if r["title_hits"] == 0 and r["difficulty"] == "high":
        # nobody titles on it AND the results are big apps: a head term too broad to
        # own, not an undiscovered gap. Density alone would have read this as opportunity.
        return "HEAD TERM — too broad to title on, space already dominated"
    if r["title_hits"] == 0:
        return "UNPROVEN — nobody titles on it; genuine gap or zero demand, verify volume"
    if r["difficulty"] == "high":
        return "LATER — right intent, needs authority you do not have yet"
    if r["intent"] == "focused":
        return "CANDIDATE — tight intent, winnable; verify volume before the name"
    return "MAYBE — mixed signals, keep as keyword-field filler not a name bet"


def targets_from(path):
    """Pull the '## Target keywords' section out of a listing file."""
    text = Path(path).read_text(encoding="utf-8")
    m = re.search(r"^##\s+Target keywords[^\n]*\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    if not m:
        return []
    out = []
    for line in m.group(1).splitlines():
        # bulleted lines only; the section may hold prose, and probing prose burns
        # rate limit on garbage
        if not re.match(r"^\s*[-*]\s+", line):
            continue
        line = re.sub(r"^\s*[-*]\s+", "", line).split("#")[0].strip()
        if line:
            out.extend(p.strip() for p in line.split(",") if p.strip())
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("terms", nargs="*")
    ap.add_argument("--from", dest="src", help="listing .md file with '## Target keywords'")
    ap.add_argument("--country", default="us", help="storefront, e.g. us br de jp")
    ap.add_argument("--lang", help="e.g. pt_br, de_de — pair with --country")
    ap.add_argument("--competitors", action="store_true", help="list top 5 per term")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()

    if a.selftest:
        return selftest()

    terms = list(a.terms) + (targets_from(a.src) if a.src else [])
    if not terms:
        ap.error("give terms, or --from a listing file with a '## Target keywords' section")

    rows = []
    for i, t in enumerate(terms):
        if i:
            time.sleep(PAUSE)
        try:
            rows.append(probe(t, a.country, a.lang))
        except Exception as e:                      # network, rate limit, bad storefront
            print(f"  !! {t!r}: {type(e).__name__}: {e}", file=sys.stderr)
            rows.append({"term": t, "n": 0, "error": str(e)})

    if a.json:
        print(json.dumps(rows, indent=2, ensure_ascii=False))
        return 0

    store = a.country.upper() + (f"/{a.lang}" if a.lang else "")
    print(f"\nApp Store {store} — {len(rows)} term(s). Density/difficulty/intent are "
          f"proxies, not volume.\n")
    print(f"  {'term':<26} {'dens':>5} {'top10 med':>10} {'difficulty':<11} "
          f"{'intent':<10} verdict")
    print("  " + "-" * 104)
    for r in rows:
        if not r["n"]:
            print(f"  {r['term']:<26} no results — too narrow, or wrong storefront")
            continue
        print(f"  {r['term']:<26} {r['density']*100:>4.0f}% {r['median_ratings']:>10,} "
              f"{r['difficulty']:<11} {r['intent']:<10} {verdict(r)}")
        if r["intent"] != "focused":
            print(f"  {'':<26} top genre {r['top_genre']} only "
                  f"{r['concentration']*100:.0f}% of top 20")
    if a.competitors:
        for r in rows:
            if not r["n"]:
                continue
            print(f"\n  {r['term']!r} — top 5:")
            for c in r["competitors"]:
                print(f"    {(c['ratings'] or 0):>8,}  {c['genre'] or '?':<18} "
                      f"{c['price'] or '':<8} {c['title']}")
    return 0


def selftest():
    import tempfile
    d = Path(tempfile.mkdtemp())
    f = d / "en.md"
    f.write_text("## App name\n\nX\n\n## Target keywords\n\n"
                 "Prose explaining the research — must NOT be parsed as a keyword.\n\n"
                 "- chord pad, midi looper\n- arpeggiator  # trailing comment\n\n"
                 "## Keywords\n\na,b\n", encoding="utf-8")
    got = targets_from(f)
    assert got == ["chord pad", "midi looper", "arpeggiator"], got
    assert targets_from(d / "en.md") == got
    assert band(0, [500, 5000], ["low", "mid", "high"]) == "low"
    assert band(600, [500, 5000], ["low", "mid", "high"]) == "mid"
    assert band(999999, [500, 5000], ["low", "mid", "high"]) == "high"
    # verdict wiring, no network
    assert "CUT" in verdict({"intent": "scattered", "difficulty": "low",
                             "density": 0.1, "title_hits": 3})
    assert "CUT" in verdict({"intent": "focused", "difficulty": "entrenched",
                             "density": 0.1, "title_hits": 3})
    assert "COMMODITY" in verdict({"intent": "focused", "difficulty": "low",
                                   "density": 0.9, "title_hits": 40})
    assert "UNPROVEN" in verdict({"intent": "focused", "difficulty": "low",
                                  "density": 0.0, "title_hits": 0})
    # zero density + high authority is a dominated head term, NOT an open gap
    assert "HEAD TERM" in verdict({"intent": "focused", "difficulty": "high",
                                   "density": 0.0, "title_hits": 0})
    assert "LATER" in verdict({"intent": "focused", "difficulty": "high",
                               "density": 0.2, "title_hits": 5})
    assert "CANDIDATE" in verdict({"intent": "focused", "difficulty": "moderate",
                                   "density": 0.2, "title_hits": 8})
    assert "MAYBE" in verdict({"intent": "mixed", "difficulty": "low",
                               "density": 0.2, "title_hits": 8})
    print("selftest OK (no network used)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
