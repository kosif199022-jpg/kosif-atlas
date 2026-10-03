#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lint per-locale app store listing Markdown against App Store + Google Play rules.

    python3 check_listing.py <listing-dir> [--store apple|play|both]
                             [--source en] [--atom '.sf2']... [--quiet]
    python3 check_listing.py --selftest

Reads <listing-dir>/<locale>.md, one section per field (see TEMPLATE.md).
Exits 1 if any FAIL. No third-party dependencies.
"""
import argparse, re, sys, unicodedata
from pathlib import Path

# field key -> (heading aliases, apple limit, play limit)
FIELDS = {
    "name":        (["app name", "title"],                              30,   30),
    "short":       (["short description"],                              None, 80),
    "subtitle":    (["subtitle"],                                       30,   None),
    "promo":       (["promotional text", "promo text"],                 170,  None),
    "description": (["long description", "full description", "description"], 4000, 4000),
    "keywords":    (["keywords", "keyword field"],                      100,  None),
}
# longest alias first so "short description" wins over "description"
ALIASES = sorted(
    ((a, k) for k, (al, _, _) in FIELDS.items() for a in al),
    key=lambda t: -len(t[0]),
)
TRANSLATABLE = {"subtitle", "short", "promo", "description", "keywords", "targets"}

# a literal keyword list dumped at the end of the description: Play keyword spam,
# and Apple does not index the description at all, so it is pure downside.
STUFF_LABELS = ["keywords", "mots-clés", "mots cles", "palabras clave", "palavras-chave",
                "palavras chave", "schlüsselwörter", "parole chiave", "trefwoorden",
                "キーワード", "关键词", "키워드"]
STUFF_RE = re.compile(r"^\s*(?:%s)\s*[:：]" % "|".join(map(re.escape, STUFF_LABELS)),
                      re.I | re.M)

URL_RE = re.compile(r"https?://[^\s<>()\[\]\"'`]+")
MAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
WORD_RE = re.compile(r"[^\W_]+", re.UNICODE)
TIGHT = 0.93


def sections(text):
    """'## Heading' -> body. Later duplicate headings win (last one authored)."""
    out, cur, buf = {}, None, []
    for line in text.splitlines():
        m = re.match(r"^##\s+(.+?)\s*$", line)
        if m:
            if cur is not None:
                out[cur] = "\n".join(buf).strip()
            cur, buf = m.group(1), []
        elif cur is not None:
            buf.append(line)
    if cur is not None:
        out[cur] = "\n".join(buf).strip()
    return out


def field_of(heading):
    h = heading.lower().lstrip("#").strip()
    for alias, key in ALIASES:
        if h.startswith(alias):
            return key
    return None


def parse(path):
    """-> {field_key: value}, ignoring headings that are not known fields.
    '## Target keywords' is captured as 'targets' (a raw block, not a limited field)."""
    got = {}
    for heading, body in sections(path.read_text(encoding="utf-8")).items():
        if not body:
            continue
        if heading.lower().lstrip("#").strip().startswith("target keyword"):
            got["targets"] = body
            continue
        key = field_of(heading)
        if key:
            got[key] = body
    return got


def targets_list(block):
    """'- a, b\\n- c  # note' -> ['a','b','c'].

    Bulleted lines ONLY — the section is allowed to hold explanatory prose, and
    parsing that prose as keywords produces confident nonsense (learned the hard way).
    """
    out = []
    for line in (block or "").splitlines():
        if not re.match(r"^\s*[-*]\s+", line):
            continue
        line = re.sub(r"^\s*[-*]\s+", "", line).split("#")[0].strip()
        if line:
            out.extend(p.strip() for p in line.split(",") if p.strip())
    return out


def words(s):
    return {unicodedata.normalize("NFKD", w).lower() for w in WORD_RE.findall(s or "")}


def atoms_in(text, extra):
    trim = ".,;:)!?"
    found = {u.rstrip(trim) for u in URL_RE.findall(text)}
    found |= {m.rstrip(trim) for m in MAIL_RE.findall(text)}
    found |= set(extra)
    # a bare origin is implied by any deeper URL on the same host; keep both,
    # the deeper one is the one that 404s when someone "translates" a path.
    return sorted(found)


class Report:
    def __init__(self, quiet=False):
        self.fails = self.warns = 0
        self.quiet = quiet

    def ok(self, msg):
        if not self.quiet:
            print(f"  ok   {msg}")

    def info(self, msg):
        if not self.quiet:
            print(f"  info {msg}")

    def warn(self, msg):
        self.warns += 1
        print(f"  WARN {msg}")

    def fail(self, msg):
        self.fails += 1
        print(f"  FAIL {msg}")


def check_locale(locale, got, src, stores, extra_atoms, rep):
    print(f"\n=== {locale} ===")

    # 1. character limits, per store that actually has the field
    for key, (_, apple, play) in FIELDS.items():
        if key not in got:
            continue
        n = len(got[key])
        applicable = {s: lim for s, lim in (("apple", apple), ("play", play))
                      if s in stores and lim is not None}
        if not applicable:
            if key in got and stores == {"play"} and key in ("subtitle", "promo", "keywords"):
                rep.info(f"{key:<12} present but Apple-only — ignored for Play")
            continue
        lim = min(applicable.values())
        tag = "+".join(sorted(applicable))
        if n > lim:
            rep.fail(f"{key:<12} {n:>5}/{lim} [{tag}] OVER by {n - lim}")
        elif n / lim > TIGHT:
            rep.ok(f"{key:<12} {n:>5}/{lim} [{tag}]  <- tight, no room for a future word")
        else:
            rep.ok(f"{key:<12} {n:>5}/{lim} [{tag}]")

    # 2. Apple keyword budget spent on words the name/subtitle already index
    if "apple" in stores and got.get("keywords"):
        indexed = words(got.get("name", "")) | words(got.get("subtitle", ""))
        flat = re.sub(r"[^\w]", "", (got.get("name", "") + got.get("subtitle", "")).lower())
        phrases = [p.strip() for p in got["keywords"].split(",") if p.strip()]
        dead = [p for p in phrases if words(p) and words(p) <= indexed]
        if dead:
            saved = sum(len(p) + 1 for p in dead)
            rep.warn(f"keywords    {saved} chars reclaimable — already in name/subtitle: "
                     + ", ".join(repr(p) for p in dead))
        sub = [p for p in phrases if p not in dead
               and re.sub(r"[^\w]", "", p.lower()) in flat]
        if sub:
            rep.info("keywords    substring of the name, likely redundant: "
                     + ", ".join(repr(p) for p in sub))
        if re.search(r",\s+", got["keywords"]):
            n_sp = len(re.findall(r",\s+", got["keywords"]))
            rep.warn(f"keywords    {n_sp} space(s) after commas waste {n_sp} of 100 chars")

    # 2b. ASO coverage: does every target keyword land on an INDEXED surface?
    #     Apple indexes name + subtitle + keyword field (never the description).
    #     Play indexes title + short description + description body.
    if got.get("targets"):
        parsed = targets_list(got["targets"])
        if not parsed:
            rep.warn("Target keywords section has no bulleted lines — targets must be "
                     "'- term' bullets, prose is ignored (see TEMPLATE.md)")
        for term in parsed:
            t = term.lower()
            apple = [s for s in ("name", "subtitle", "keywords")
                     if t in (got.get(s) or "").lower()]
            play = [s for s in ("name", "short", "description")
                    if t in (got.get(s) or "").lower()]
            want_a, want_p = "apple" in stores, "play" in stores
            if (want_a and not apple) and (want_p and not play):
                rep.fail(f"target {term!r} is indexed on NEITHER store — it cannot rank")
            elif want_a and not apple:
                rep.warn(f"target {term!r} not on any Apple-indexed surface "
                         f"(name/subtitle/keywords)")
            elif want_p and not play:
                rep.warn(f"target {term!r} not on any Play-indexed surface "
                         f"(title/short/description)")
            elif want_a and len(apple) > 1:
                rep.warn(f"target {term!r} on {len(apple)} Apple surfaces "
                         f"({'+'.join(apple)}) — indexed once, paid for twice")
            else:
                rep.info(f"target {term!r:<24} apple:{'+'.join(apple) or '-':<18} "
                         f"play:{'+'.join(play) or '-'}")

    # 3. keyword stuffing at the end of the description
    if got.get("description") and STUFF_RE.search(got["description"]):
        rep.warn("description ends with a literal keyword list — Play keyword-spam "
                 "risk, and Apple never indexes the description")

    # 4. verbatim atoms survived translation
    if src is not None:
        blob = "\n".join(got.values())
        missing = [a for a in atoms_in("\n".join(src.values()), extra_atoms)
                   if a not in blob]
        if missing:
            rep.warn("atoms absent (a translated URL 404s, a localized mailto is dead): "
                     + ", ".join(missing))

    # 5. locale left identical to the source
    if src is not None:
        same = sorted(k for k in TRANSLATABLE
                      if got.get(k) and got[k] == src.get(k))
        if same:
            rep.warn(f"identical to source, untranslated?: {', '.join(same)}")


def run(listing_dir, stores, source, extra_atoms, quiet=False):
    base = Path(listing_dir)
    files = sorted(base.glob("*.md"))
    files = [f for f in files if f.stem.lower() not in ("readme", "template")]
    if not files:
        print(f"no <locale>.md files in {base}", file=sys.stderr)
        return 2
    src_path = base / f"{source}.md"
    src = parse(src_path) if src_path.exists() else None
    if src is None:
        print(f"note: no source locale '{source}.md' — skipping atom and "
              f"same-as-source checks", file=sys.stderr)

    rep = Report(quiet)
    for f in files:
        got = parse(f)
        if not got:
            rep.warn(f"{f.name}: no recognised field headings — check TEMPLATE.md")
            continue
        check_locale(f.stem, got, None if f == src_path else src, stores, extra_atoms, rep)

    print(f"\n{rep.fails} FAIL, {rep.warns} WARN across {len(files)} locale(s) "
          f"[stores: {'+'.join(sorted(stores))}]")
    return 1 if rep.fails else 0


def selftest():
    import tempfile
    d = Path(tempfile.mkdtemp())
    (d / "en.md").write_text(
        "## App name `[<=30]`\n\nChordPad: Chord Pad & MIDI\n\n"
        "## Subtitle\n\nChord pad in any key\n\n"
        "## Short description\n\nChord pad and looper.\n\n"
        "## Target keywords\n\n- chord pad, looper\n- ghost term  # nowhere\n\n"
        "## Long description\n\nGet it at https://x.dev/privacy or mail a@x.dev.\n\n"
        "Keywords: chord pad, midi, looper\n\n"
        "## Keywords\n\nchord pad, midi,looper,arpeggiator\n", encoding="utf-8")
    (d / "de.md").write_text(
        "## App name\n\nChordPad: Akkord-Pad und MIDI-Sequenzer XL\n\n"
        "## Subtitle\n\nChord pad in any key\n\n"
        "## Short description\n\nAkkord-Pad und Looper.\n\n"
        "## Long description\n\nHol es dir.\n\n"
        "## Keywords\n\nakkord pad,looper\n", encoding="utf-8")

    got_en = parse(d / "en.md")
    assert got_en["name"] == "ChordPad: Chord Pad & MIDI", got_en["name"]
    assert got_en["short"] == "Chord pad and looper.", got_en["short"]
    assert "Keywords: chord pad" in got_en["description"]
    assert field_of("Short description (Play Store)") == "short"
    assert field_of("Long description") == "description"
    assert field_of("Keywords (App Store only)") == "keywords"
    assert field_of("Content rating") is None
    assert STUFF_RE.search(got_en["description"])
    assert not STUFF_RE.search(parse(d / "de.md")["description"])
    assert atoms_in(got_en["description"], []) == ["a@x.dev", "https://x.dev/privacy"]
    # 'chord pad' and 'midi' are both fully carried by the name -> reclaimable
    indexed = words(got_en["name"]) | words(got_en["subtitle"])
    assert words("chord pad") <= indexed and words("midi") <= indexed
    assert not words("arpeggiator") <= indexed
    # target-keyword parsing + coverage wiring
    assert targets_list(got_en["targets"]) == ["chord pad", "looper", "ghost term"]
    assert "chord pad" in got_en["name"].lower()          # apple: name AND keywords -> 2x
    surfaces = " ".join(got_en.get(k, "") for k in
                        ("name", "subtitle", "keywords", "short", "description")).lower()
    assert "ghost term" not in surfaces, "fixture must have one uncovered target"

    print("--- selftest fixture run ---")
    rc = run(d, {"apple", "play"}, "en", [])
    assert rc == 1, "de name over limit + 'ghost term' indexed nowhere, must FAIL"
    print("\nselftest OK")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("listing_dir", nargs="?", help="directory of <locale>.md files")
    ap.add_argument("--store", choices=["apple", "play", "both"], default="both")
    ap.add_argument("--source", default="en", help="source locale stem (default: en)")
    ap.add_argument("--atom", action="append", default=[],
                    help="extra must-survive-verbatim string; repeatable")
    ap.add_argument("--quiet", action="store_true", help="only print WARN and FAIL")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if not a.listing_dir:
        ap.error("listing_dir is required (or use --selftest)")
    stores = {"apple", "play"} if a.store == "both" else {a.store}
    return run(a.listing_dir, stores, a.source, a.atom, a.quiet)


if __name__ == "__main__":
    sys.exit(main())
