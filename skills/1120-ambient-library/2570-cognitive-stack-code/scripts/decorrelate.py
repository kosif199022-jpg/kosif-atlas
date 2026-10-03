#!/usr/bin/env python3
"""
Decorrelation engine — reference resolver + rival-fetcher.

Consumes the operative-paradigm name the Cognitive Signature names in its
Layer 3 ("The worldview underneath") and fetches that worldview's RIVAL
paradigms from the tensions table, so the skill can deliberately reach for a
rival lens instead of correlating every model to one worldview.

This is ONE SURFACE'S "how", not the contract. Per the locked retrieval-as-
operation decision (SESSION-LOG cross-session note), the skill specifies the
OPERATION (resolve worldview -> corpus paradigm -> fetch rival tensions); each
surface picks its own implementation (terminal Python here; awk/grep elsewhere;
a Cowork VM its own way). The reference doc is references/decorrelation-engine.md.

The resolution LADDER (grounded in the data, not the spec's one-hop sketch):
  1. worldview label -> encyclopedia paradigm   (semantic; done by Claude / --resolve hint here)
  2. encyclopedia paradigm -> direct tension rows
  3. if 0 direct rows -> nearest SAME-CLUSTER sibling that HAS tensions   (Option A fallback)
  4. if the cluster is also empty -> honest "no direct rivals in corpus"   (degrade to B)
Every hop is LABELLED in the output so the substitution is visible, never hidden.

Output weight is LEAN by default (top rivals + the blind-spot payload only),
matching the signature's locked "lean + evidence-bound" house style. --full
surfaces every rival and every tension field (deeper-on-request).

Usage:
    python3 decorrelate.py "Experimentalism"          # resolve + fetch (lean)
    python3 decorrelate.py "Neoclassical Economics" --full
    python3 decorrelate.py --selftest                 # run the doc's probes
"""
import csv, os, re, sys, argparse
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
# Skill-internal, __file__-relative paths (NO "../.." escapes). The runtime CSVs
# are bundled inside the skill at references/data/ so the skill runs from any
# location on disk with no parent project — the download/independence requirement
# (SESSION-LOG Session 11). Build-time dev scripts still read pristine upstream;
# only this runtime resolver points at the bundled copies.
DATA_DIR = os.path.join(HERE, "..", "references", "data")
ENC_CSV = os.path.join(DATA_DIR, "Paradigm_Encyclopedia.csv")
# Consume the DERIVED, swap-corrected tensions copy (see KNOWN-ISSUES.md #1 /
# scripts/fix_tension_swaps.py). 27 rows had their two payload cells reversed in
# the pristine upstream; reading those at face value would surface the user's OWN
# worldview as "what the rival sees you missing". The upstream Paradigm_Tensions.csv
# stays pristine; this points at the reproducible fixed derivative.
TEN_CSV = os.path.join(DATA_DIR, "Paradigm_Tensions_FIXED.csv")

TOP_N_LEAN = 3   # ceiling for the lean view; a ceiling, not a quota


# ---------- name handling -------------------------------------------------
def core(name):
    """Normalised core of a paradigm name: drop the parenthetical thinker
    attribution the corpus carries inconsistently ('Classical Pragmatism
    (Peirce/James/Dewey)' -> 'classical pragmatism') and lowercase. This is
    the bridge across the encyclopedia<->tensions name-form drift."""
    return re.sub(r"\([^)]*\)", "", name).strip().lower().rstrip(".")


def core_match(a, b):
    """Two paradigm names refer to the same paradigm if their cores are equal,
    or one core fully contains the other as a whole token-run (guards against
    'experimentalism' matching 'experimental economics': neither core is a
    substring of the other)."""
    ca, cb = core(a), core(b)
    if ca == cb:
        return True
    longer, shorter = (ca, cb) if len(ca) >= len(cb) else (cb, ca)
    if len(shorter) < 5:
        return False
    return re.search(r"\b" + re.escape(shorter) + r"\b", longer) is not None


def full_norm(name):
    """Full name normalised for an EXACT compare — collapse whitespace,
    lowercase, drop a trailing period. Unlike core(), this KEEPS the
    parenthetical qualifier, so 'Constructivism (Piaget)' and 'Constructivism
    (Wendt)' compare UNequal (C12: same-core, different-domain siblings)."""
    return re.sub(r"\s+", " ", name).strip().lower().rstrip(".")


def qualifier(name):
    """The parenthetical qualifier text, lowercased, or '' when there is none.
    'Constructivism (Piaget)' -> 'piaget'; 'Experimentalism' -> ''."""
    m = re.search(r"\(([^)]*)\)", name)
    return m.group(1).strip().lower() if m else ""


def _qual_tokens(q):
    return set(re.findall(r"[a-z0-9]+", q.lower()))


def qualifiers_compatible(qa, qb):
    """Do two parenthetical qualifiers point at the SAME paradigm? Equal ->
    yes. Either side empty (unqualified) -> not a conflict, defer to the core
    logic. Otherwise they must share at least one word: this keeps same-
    paradigm qualifier DRIFT together ('(deception, positioning, winning
    without fighting)' vs '(deception/positioning)' overlap on 'deception'),
    while holding genuinely different siblings APART ('piaget' vs 'wendt',
    'agamben' vs 'foucault', 'legal tradition' vs 'moral philosophy')."""
    if qa == qb:
        return True
    ta, tb = _qual_tokens(qa), _qual_tokens(qb)
    if not ta or not tb:
        return True
    return bool(ta & tb)


def name_match(a, b):
    """Qualifier-aware paradigm-name match. Tightens ONLY the qualified case;
    everything else falls straight through to core_match() so unqualified
    behavior and the encyclopedia<->tensions name drift are unchanged (C12):

      1. exact full-name match (incl. the parenthetical), case-insensitive;
      2. if BOTH names carry a qualifier AND share the same core, the
         qualifiers must be compatible (decisive — does NOT fall through to
         core_match, which would erase the distinction);
      3. otherwise defer to core_match()."""
    if full_norm(a) == full_norm(b):
        return True
    qa, qb = qualifier(a), qualifier(b)
    if qa and qb and core(a) == core(b):
        return qualifiers_compatible(qa, qb)
    return core_match(a, b)


# ---------- data ----------------------------------------------------------
def load_encyclopedia():
    rows = []
    with open(ENC_CSV, newline="") as f:
        for r in csv.DictReader(f):
            rows.append(r)
    return rows


def load_tensions():
    rows = []
    with open(TEN_CSV, newline="") as f:
        for r in csv.DictReader(f):
            rows.append(r)
    return rows


def resolve_paradigm(query, enc):
    """Hop 1->paradigm record. Returns the encyclopedia row whose name best
    matches `query`, or None.

    Preference order (C12 — qualifier-aware ahead of the core fallback):
      1. exact full-name match, case-insensitive, INCLUDING the parenthetical
         qualifier — so 'Constructivism (Piaget)' locks onto the Piaget row,
         never the earlier-in-CSV Wendt row;
      2. if the query carries a '(Qualifier)', among same-core candidates
         prefer the one whose qualifier is compatible (domain-disambiguate);
      3. only then fall back to the existing core()/core_match() logic
         (prefers exact core, then the shortest core that contains the query,
         e.g. 'Pragmatism' -> the shortest pragmatism paradigm). This branch is
         load-bearing for UNqualified queries and the enc<->tensions drift and
         is left exactly as it was."""
    # 1. exact full-name match including the qualifier.
    fq = full_norm(query)
    full_exact = [r for r in enc if full_norm(r["Paradigm Name"]) == fq]
    if full_exact:
        return full_exact[0]

    # 2. qualified query -> prefer a same-core candidate whose qualifier agrees.
    qq = qualifier(query)
    if qq:
        q_match = [r for r in enc
                   if core(r["Paradigm Name"]) == core(query)
                   and qualifier(r["Paradigm Name"])
                   and qualifiers_compatible(qualifier(r["Paradigm Name"]), qq)]
        if q_match:
            q_match.sort(key=lambda r: len(core(r["Paradigm Name"])))
            return q_match[0]

    # 3. original core()/core_match() fallback — UNCHANGED for unqualified names.
    q = core(query)
    exact = [r for r in enc if core(r["Paradigm Name"]) == q]
    if exact:
        return exact[0]
    cand = [r for r in enc if core_match(r["Paradigm Name"], query)]
    cand.sort(key=lambda r: len(core(r["Paradigm Name"])))
    return cand[0] if cand else None


def direct_rivals(paradigm_name, tensions):
    """Hop 2. Every tension row touching this paradigm, oriented so the payload
    is 'what the RIVAL sees that THIS worldview misses' (the blind-spot side)."""
    out = []
    for t in tensions:
        # C12: name_match (qualifier-aware) not core_match, so a Piaget anchor
        # picks up ONLY Piaget's tension rows, not Wendt's same-core IR rows.
        a_is = name_match(t["Paradigm_A"], paradigm_name)
        b_is = name_match(t["Paradigm_B"], paradigm_name)
        if a_is and not b_is:
            out.append({
                "tid": t["Tension_ID"],
                "rival": t["Paradigm_B"],
                "fault_line": t["Fault_Line"],
                "rival_sees_you_miss": t["What_B_Sees_That_A_Misses"],
                "you_see_rival_miss": t["What_A_Sees_That_B_Misses"],
                "productive_when": t["Most_Productive_When"],
            })
        elif b_is and not a_is:
            out.append({
                "tid": t["Tension_ID"],
                "rival": t["Paradigm_A"],
                "fault_line": t["Fault_Line"],
                "rival_sees_you_miss": t["What_A_Sees_That_B_Misses"],
                "you_see_rival_miss": t["What_B_Sees_That_A_Misses"],
                "productive_when": t["Most_Productive_When"],
            })
    return out


def cluster_siblings_with_tensions(paradigm, enc, tensions):
    """Hop 3 helper. Same-cluster paradigms (excluding the query itself) that
    DO carry tension rows, richest first."""
    cluster = paradigm["Cluster"]
    sibs = []
    for r in enc:
        if r["Cluster"] != cluster:
            continue
        if core(r["Paradigm Name"]) == core(paradigm["Paradigm Name"]):
            continue
        rv = direct_rivals(r["Paradigm Name"], tensions)
        if rv:
            sibs.append((r, rv))
    sibs.sort(key=lambda x: len(x[1]), reverse=True)
    return sibs


def decorrelate(query, enc, tensions):
    """Run the full ladder. Returns a dict with the resolution path (labelled)
    and the rival list, or a clean 'no rivals' verdict."""
    result = {"query": query, "path": [], "paradigm": None, "rivals": [],
              "source_paradigm": None, "verdict": None}

    paradigm = resolve_paradigm(query, enc)
    if paradigm is None:
        result["path"].append(f"'{query}' -> no encyclopedia paradigm matched")
        result["verdict"] = "unresolved"
        return result

    pname = paradigm["Paradigm Name"]
    result["paradigm"] = paradigm
    result["path"].append(f"'{query}' -> {pname} (#{paradigm['Number']})")

    rv = direct_rivals(pname, tensions)
    if rv:
        result["path"].append(f"{pname} -> {len(rv)} direct rival tensions")
        result["rivals"] = rv
        result["source_paradigm"] = pname
        result["verdict"] = "direct"
        return result

    # Hop 3 — cluster-sibling fallback (Option A), labelled.
    result["path"].append(f"{pname} -> 0 direct tensions; "
                          f"cluster fallback within '{paradigm['Cluster']}'")
    sibs = cluster_siblings_with_tensions(paradigm, enc, tensions)
    if sibs:
        sib, sib_rv = sibs[0]
        result["path"].append(
            f"nearest sibling with tensions: {sib['Paradigm Name']} "
            f"(#{sib['Number']}) -> {len(sib_rv)} rival tensions")
        result["rivals"] = sib_rv
        result["source_paradigm"] = sib["Paradigm Name"]
        result["verdict"] = "cluster_fallback"
        return result

    # Hop 4 — honest floor (degrade to B).
    result["path"].append(
        f"cluster '{paradigm['Cluster']}' also carries no tensions "
        f"-> no direct rivals in corpus")
    result["verdict"] = "no_rivals"
    return result


# ---------- rendering -----------------------------------------------------
def render(result, full=False):
    lines = []
    lines.append("Resolution path:")
    for step in result["path"]:
        lines.append(f"  {step}")
    lines.append("")

    v = result["verdict"]
    if v == "unresolved":
        lines.append("[Worldview did not resolve to a corpus paradigm — name "
                     "it by hand or pick the nearest cluster.]")
        return "\n".join(lines)
    if v == "no_rivals":
        lines.append("[No direct rivals in the corpus for this worldview.]")
        return "\n".join(lines)

    rivals = result["rivals"]
    if v == "cluster_fallback":
        lines.append(f"Rivals shown are for the cluster sibling "
                     f"'{result['source_paradigm']}' (the named worldview "
                     f"carries no tensions of its own):")
    else:
        lines.append(f"Rival worldviews to '{result['source_paradigm']}' "
                     f"(decorrelation):")
    lines.append("")

    shown = rivals if full else rivals[:TOP_N_LEAN]
    for r in shown:
        lines.append(f"- {r['rival']}  [tension #{r['tid']}]")
        if full:
            lines.append(f"    Fault line: {r['fault_line']}")
            lines.append(f"    What the rival sees you miss: {r['rival_sees_you_miss']}")
            lines.append(f"    What you see the rival miss:  {r['you_see_rival_miss']}")
            lines.append(f"    Most productive when: {r['productive_when']}")
        else:
            # lean: fault line (clipped) + the blind-spot payload (clipped)
            lines.append(f"    Fault line: {clip(r['fault_line'])}")
            lines.append(f"    Sees what you miss: {clip(r['rival_sees_you_miss'])}")
    if not full and len(rivals) > TOP_N_LEAN:
        lines.append("")
        lines.append(f"  (+{len(rivals) - TOP_N_LEAN} more rival tensions — "
                     f"run with --full for the complete table.)")
    return "\n".join(lines)


def clip(s, n=180):
    s = " ".join(s.split())
    return s if len(s) <= n else s[:n].rstrip() + "…"


# ---------- cli -----------------------------------------------------------
SELFTEST_PROBES = [
    "Neoclassical Economics",   # rich: direct hit, 28 rivals
    "Experimentalism",          # the worked example: 0 direct -> cluster fallback
    "Classical Pragmatism",     # direct hit via the cluster
    "Austrian Economics",       # direct
]

def main():
    ap = argparse.ArgumentParser(description="Decorrelation engine resolver/fetcher.")
    ap.add_argument("query", nargs="?", help="operative paradigm / worldview name")
    ap.add_argument("--full", action="store_true", help="all rivals, all fields")
    ap.add_argument("--selftest", action="store_true", help="run the doc's probes")
    args = ap.parse_args()

    enc = load_encyclopedia()
    tensions = load_tensions()

    if args.selftest:
        for p in SELFTEST_PROBES:
            print("=" * 70)
            print(render(decorrelate(p, enc, tensions), full=args.full))
            print()
        return
    if not args.query:
        ap.error("give a paradigm/worldview name, or --selftest")
    print(render(decorrelate(args.query, enc, tensions), full=args.full))


if __name__ == "__main__":
    main()
