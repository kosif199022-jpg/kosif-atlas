#!/usr/bin/env python3
"""WSTG lookup — resolve test IDs, search by keyword, or list a category.

Reads data/wstg.json (the canonical 12-category / 109-test set).

Usage:
  python wstg_lookup.py <ID>            Resolve one test ID (e.g. WSTG-INPV-05)
  python wstg_lookup.py --cat <CODE>    List a category (e.g. INPV, ATHZ, SESS)
  python wstg_lookup.py --search <kw>   Search test names by keyword (e.g. "sql", "jwt", "csrf")
  python wstg_lookup.py --list          List all category codes + names + test counts
  python wstg_lookup.py --all           Dump every ID + name (flat)
  [--json]                              Emit machine-readable JSON instead of text

Examples:
  python wstg_lookup.py WSTG-ATHZ-04
  python wstg_lookup.py --search "server-side"
  python wstg_lookup.py --cat SESS --json
"""
import argparse
import json
import os
import sys

DATA = os.path.join(os.path.dirname(__file__), "..", "data", "wstg.json")

# Common acronyms -> phrase that appears in the official test name, so a search
# for "ssrf" still finds "Testing for Server-Side Request Forgery".
ALIASES = {
    "xss": "cross site scripting",
    "sqli": "sql injection",
    "ssrf": "server-side request forgery",
    "ssti": "server-side template injection",
    "csrf": "cross site request forgery",
    "idor": "insecure direct object",
    "xxe": "xml injection",
    "jwt": "json web token",
    "mfa": "multi-factor",
    "cors": "cross origin resource sharing",
    "lfi": "directory traversal file include",
    "rfi": "directory traversal file include",
    "rce": "command injection",
    "cmdi": "command injection",
    "hpp": "parameter pollution",
    "tls": "transport layer security",
    "ssl": "transport layer security",
    "csp": "content security policy",
    "hsts": "strict transport security",
    "bola": "broken object level authorization",
    "clickjack": "clickjacking",
}


def load():
    with open(DATA, encoding="utf-8") as f:
        return json.load(f)


def all_tests(db):
    for cat in db["categories"]:
        for t in cat["tests"]:
            yield cat, t


def emit(obj, as_json):
    if as_json:
        print(json.dumps(obj, indent=2, ensure_ascii=False))
    return obj


def main():
    p = argparse.ArgumentParser(description="WSTG lookup")
    p.add_argument("id", nargs="?", help="WSTG test ID, e.g. WSTG-INPV-05")
    p.add_argument("--cat", help="category code, e.g. INPV")
    p.add_argument("--search", help="keyword to match against test names")
    p.add_argument("--list", action="store_true", help="list categories")
    p.add_argument("--all", action="store_true", help="dump all tests")
    p.add_argument("--json", action="store_true", help="JSON output")
    a = p.parse_args()
    db = load()

    if a.list:
        rows = [
            {"code": c["code"], "name": c["name"], "tests": len(c["tests"])}
            for c in db["categories"]
        ]
        if a.json:
            emit(rows, True)
        else:
            for r in rows:
                print(f"  WSTG-{r['code']:<5} {r['name']}  ({r['tests']} tests)")
        return

    if a.all:
        rows = [{"id": t["id"], "name": t["name"]} for _, t in all_tests(db)]
        if a.json:
            emit(rows, True)
        else:
            for r in rows:
                print(f"  {r['id']:<16} {r['name']}")
        return

    if a.cat:
        code = a.cat.upper().replace("WSTG-", "")
        cat = next((c for c in db["categories"] if c["code"] == code), None)
        if not cat:
            sys.exit(f"Unknown category '{a.cat}'. Try --list.")
        if a.json:
            emit(cat, True)
        else:
            print(f"WSTG-{cat['code']}: {cat['name']}")
            for t in cat["tests"]:
                print(f"  {t['id']:<16} {t['name']}")
        return

    if a.search:
        kw = a.search.lower()
        terms = {kw}
        if kw in ALIASES:
            terms.add(ALIASES[kw])
        hits = [
            {"id": t["id"], "name": t["name"], "category": c["name"]}
            for c, t in all_tests(db)
            if any(term in t["name"].lower() for term in terms)
        ]
        if a.json:
            emit(hits, True)
        else:
            if not hits:
                print(f"No tests match '{a.search}'.")
            for h in hits:
                print(f"  {h['id']:<16} {h['name']}")
        return

    if a.id:
        wanted = a.id.upper()
        for c, t in all_tests(db):
            if t["id"].upper() == wanted:
                out = {"id": t["id"], "name": t["name"],
                       "category_code": c["code"], "category": c["name"]}
                if a.json:
                    emit(out, True)
                else:
                    print(f"{out['id']}  ({out['category']})")
                    print(f"  {out['name']}")
                return
        sys.exit(f"ID '{a.id}' not found. Try --search or --list.")

    p.print_help()


if __name__ == "__main__":
    main()
