#!/usr/bin/env python3
"""Render a clickable, finished-looking prototype from <project>/spec.json + theme.json.

  render_proto.py <project-dir> [--kit PATH]     writes <project>/prototype/*.html, kit.css,
                                                 proto.js and manifest.json (screens, unspecified
                                                 controls = the interviewer's question queue)

Stdlib only. Everything on a screen comes from the spec: archetype decides layout, entities
decide sample data (seeded, so the same names and prices appear on every screen), theme.json
decides look. Every control carries data-action="<screen>.<control>"; proto.js posts clicks
to the parent window as {type:"proto_click", screen, control, target}. A control whose
target is not a known screen gets an "unspecified" tag and lands in the question queue.

Screens marked "custom": true are left alone (agent-written HTML escape hatch).
"""

import argparse
import html
import json
import random
import shutil
import sys
from datetime import date, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
KIT = HERE / "proto_kit.css"
E = html.escape

# ---------- sample data ----------
FIRST = [
    "Amara",
    "Noah",
    "Priya",
    "Lucas",
    "Mei",
    "Jonas",
    "Sofia",
    "Kwame",
    "Elena",
    "Mateo",
    "Hana",
    "Oliver",
    "Zara",
    "Felix",
    "Ines",
    "Rafael",
]
LAST = [
    "Okafor",
    "Lindqvist",
    "Sharma",
    "Moreau",
    "Tanaka",
    "Weber",
    "Rossi",
    "Mensah",
    "Petrova",
    "Alvarez",
    "Kimura",
    "Bennett",
    "Haddad",
    "Novak",
    "Silva",
    "Duarte",
]
CITIES = [
    "Lisbon",
    "Austin",
    "Berlin",
    "Kyoto",
    "Toronto",
    "Cape Town",
    "Oslo",
    "Mexico City",
    "Melbourne",
    "Dublin",
    "Seoul",
    "Porto",
]
WORDS = [
    "Quiet",
    "North",
    "Harbor",
    "Cedar",
    "Meridian",
    "Slate",
    "Juniper",
    "Atlas",
    "Ember",
    "Willow",
    "Copper",
    "Fjord",
    "Lumen",
    "Basil",
    "Orchard",
    "Tide",
]
LOREM = (
    "The kind of place you remember for the light in the mornings. Everything is within reach, "
    "nothing is in the way, and the details were chosen by someone who cared. "
    "Built to be used every day and to look better for it."
)
HUES = [12, 32, 160, 190, 210, 260, 290, 340]


def slug(s):
    return "".join(c if c.isalnum() else "-" for c in str(s).lower()).strip("-")


PHOTO_MODE = None  # set from theme.photos; None = offline SVG art


def art(seed, w=800, h=600, hue=None):
    # ponytail: network-dependent stock photos; swap for a local folder when a project brings its own imagery
    if PHOTO_MODE == "picsum":
        return f"https://picsum.photos/seed/{slug(str(seed))[:40] or 'x'}/{w}/{h}"
    """Deterministic abstract image as an inline SVG data URI. Reads as photography or
    product art in a comp without pretending to be a specific picture."""
    r = random.Random(seed)
    h1 = hue if hue is not None else r.choice(HUES)
    h2 = (h1 + r.choice([25, 40, 300])) % 360
    circles = "".join(
        f'<circle cx="{r.randint(0, w)}" cy="{r.randint(0, h)}" r="{r.randint(h // 6, h // 2)}" fill="hsl({(h1 + r.randint(-30, 30)) % 360} {r.randint(40, 70)}% {r.randint(45, 75)}%)" opacity=".55"/>'
        for _ in range(4)
    )
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="hsl({h1} 55% 62%)"/><stop offset="1" stop-color="hsl({h2} 50% 40%)"/></linearGradient></defs>'
        f'<rect width="{w}" height="{h}" fill="url(#g)"/>{circles}</svg>'
    )
    return "data:image/svg+xml;utf8," + svg.replace("#", "%23").replace('"', "'")


def avatar(name, size=""):
    ini = "".join(p[0] for p in name.split()[:2]).upper()
    hue = sum(map(ord, name)) % 360
    return f'<span class="avatar {size}" style="background:hsl({hue} 45% 48%)">{E(ini)}</span>'


def money(v, cur="$"):
    return f"{cur}{v:,.0f}" if v >= 100 else f"{cur}{v:,.2f}"


class Data:
    """Rows per entity, generated once per render from the spec seed."""

    def __init__(self, spec):
        self.spec = spec
        self.cur = spec.get("currency", "$")
        self.rows = {}
        for name, ent in (spec.get("entities") or {}).items():
            r = random.Random(f"{spec.get('seed', 1)}:{name}")
            self.rows[name] = [
                self._row(ent, r, i) for i in range(int(ent.get("count", 8)))
            ]

    def _row(self, ent, r, i):
        row = {}
        for f in ent.get("fields", []):
            row[f["name"]] = self._value(f, r, i, row)
        return row

    def _value(self, f, r, i, row):
        t = f.get("type", "text")
        ex = f.get("examples")
        if ex and t not in ("money", "int", "date", "bool", "rating"):
            return ex[i % len(ex)]
        if t == "name":
            return f"{r.choice(FIRST)} {r.choice(LAST)}"
        if t == "email":
            n = next(
                (
                    v
                    for v in row.values()
                    if isinstance(v, str) and " " in v and len(v) < 30
                ),
                f"user{i}",
            )
            return n.lower().replace(" ", ".") + "@example.com"
        if t == "money":
            lo, hi = f.get("range", [20, 900])
            return round(r.uniform(lo, hi) / (5 if hi > 100 else 1)) * (
                5 if hi > 100 else 1
            ) - (0.01 if f.get("cents") else 0)
        if t == "int":
            lo, hi = f.get("range", [1, 120])
            return r.randint(lo, hi)
        if t == "rating":
            return round(r.uniform(3.6, 5.0), 1)
        if t == "date":
            # ponytail: a later date field follows the row's earlier one (from → to, created → updated)
            prev = [v for v in row.values() if isinstance(v, str) and len(v) == 10 and v[4] == v[7] == "-"]
            if prev:
                return (date.fromisoformat(prev[-1]) + timedelta(days=r.randint(1, int(f.get("days", 14))))).isoformat()
            return (
                date.today() - timedelta(days=r.randint(0, int(f.get("days", 60))))
            ).isoformat()
        if t == "bool":
            return r.random() < 0.6
        if t in ("status", "category", "enum"):
            return r.choice(f.get("options") or ["Active", "Pending", "Closed"])
        if t == "city":
            return r.choice(CITIES)
        if t == "paragraph":
            return LOREM
        if t == "image":
            return art(f"{i}:{f['name']}:{r.random()}")
        if t == "title":
            return f"{r.choice(WORDS)} {r.choice(WORDS)}".replace("  ", " ")
        return f"{r.choice(WORDS)} {r.choice(WORDS).lower()}"

    def field(self, entity, name):
        for f in self.spec.get("entities", {}).get(entity, {}).get("fields") or []:
            if f["name"] == name:
                return f
        return {"name": name, "type": "text"}

    def fmt(self, entity, name, v):
        t = self.field(entity, name).get("type", "text")
        if t == "money":
            return money(v, self.cur)
        if t == "bool":
            return (
                '<span class="badge" data-tone="ok">Yes</span>'
                if v
                else '<span class="badge">No</span>'
            )
        if t == "status":
            tone = {
                "active": "ok",
                "paid": "ok",
                "live": "ok",
                "published": "ok",
                "open": "brand",
                "pending": "warn",
                "review": "warn",
                "draft": "warn",
                "overdue": "bad",
                "failed": "bad",
                "cancelled": "bad",
                "closed": "",
                "archived": "",
            }.get(str(v).lower(), "brand")
            return f'<span class="badge" data-tone="{tone}">{E(str(v))}</span>'
        if t == "rating":
            return f'<span title="{v}">{"★" * round(v)}{"☆" * (5 - round(v))} <span class="muted small">{v}</span></span>'
        if t == "name":
            return f'<span class="row">{avatar(v)}<span>{E(v)}</span></span>'
        if t == "date":
            d = date.fromisoformat(v)
            return d.strftime("%b %-d, %Y")
        if t == "image":
            return f'<img src="{v}" alt="" style="width:44px;height:44px;border-radius:8px;object-fit:cover">'
        return E(str(v))

    def label(self, entity, name):
        return self.field(entity, name).get("label") or name.replace("_", " ").title()


# ---------- renderer ----------
class Renderer:
    def __init__(self, spec, theme, out):
        self.spec, self.theme, self.out = spec, theme, out
        self.data = Data(spec)
        self.screens = {s["id"]: s for s in spec.get("screens", [])}
        self.unspecified = []  # (screen, control, target)
        self.actions = {}  # (screen, control) → specified control, for the PRD
        self.nav_style = (spec.get("nav") or {}).get("style", "topbar")
        self.nav_items = (spec.get("nav") or {}).get("items") or [
            s["id"]
            for s in spec.get("screens", [])
            if s.get("archetype") not in ("auth", "form")
        ][:6]
        # Scenario names across every simulated action, in first-seen order; the bar offers them.
        self.scenarios = list(
            dict.fromkeys(
                o["name"]
                for s in spec.get("screens", [])
                for sim in (s.get("simulate") or {}).values()
                for o in sim.get("outcomes", [])
                if o.get("name")
            )
        )
        self.vmeta, self.vkey = (
            [],
            None,
        )  # variant switcher data for the screen being rendered

    # -- helpers
    def action(self, screen, control, target, label, cls="btn", extra=""):
        """A control. Unknown target and no simulate block => unspecified tag + queue entry."""
        sim = ((self.screens.get(screen) or {}).get("simulate") or {}).get(
            slug(control)
        )
        known = target in self.screens or sim is not None
        outs = None
        if sim is not None:
            # Resolve each outcome's destination here so proto.js never guesses: stay, or a known screen.
            outs = []
            for o in sim.get("outcomes") or [{"name": "ok"}]:
                to = None if o.get("stay") else o.get("target", target)
                if to and to not in self.screens:
                    self.unspecified.append(
                        {
                            "screen": screen,
                            "control": f"{slug(control)}@{o.get('name')}",
                            "target": to,
                            "label": label,
                        }
                    )
                    to = None
                outs.append({**o, "go": f"{to}.html" if to else None})
            extra += f' data-sim="{E(json.dumps({**sim, "outcomes": outs}))}"'
        if known:
            self.actions.setdefault(
                (screen, slug(control)),
                {
                    "screen": screen,
                    "control": slug(control),
                    "label": label,
                    "target": target if target in self.screens else None,
                    **(
                        {"simulate": {**sim, "outcomes": outs}}
                        if outs is not None
                        else {}
                    ),
                },
            )
        else:
            self.unspecified.append(
                {
                    "screen": screen,
                    "control": control,
                    "target": target or None,
                    "label": label,
                }
            )
        tag = "" if known else '<span class="unspec">? not specified</span>'
        href = f'href="{target}.html"' if target in self.screens else 'href="#"'
        return f'<a class="{cls}" {href} data-action="{E(screen)}.{E(slug(control))}" data-target="{E(target or "")}" {extra}>{E(label)}{tag}</a>'

    def target_of(self, obj, default=None):
        return (obj or {}).get("target", default) if isinstance(obj, dict) else default

    def crumbs(self, screen):
        home = self.nav_items[0] if self.nav_items else None
        parts = []
        if home and home != screen["id"]:
            parts.append(
                f'<a href="{home}.html" data-action="{screen["id"]}.crumb-home">{E(self.screens[home].get("title", home))}</a>'
            )
        parts.append(E(screen.get("title", screen["id"])))
        return f'<div class="crumbs">{" / ".join(parts)}</div>'

    def head(self, screen):
        t = self.theme
        tokens = {
            "brand": t.get("brand"),
            "brand-ink": t.get("brand_ink"),
            "accent": t.get("accent"),
            "bg": t.get("bg"),
            "surface": t.get("surface"),
            "surface-2": t.get("surface_2"),
            "ink": t.get("ink"),
            "ink-2": t.get("ink_2"),
            "muted": t.get("muted"),
            "rule": t.get("rule"),
            "radius": t.get("radius"),
            "radius-sm": t.get("radius_sm"),
            "font": t.get("font"),
            "heading": t.get("heading_font"),
        }
        css = ";".join(f"--{k}:{v}" for k, v in tokens.items() if v)
        font_link = (
            f'<link rel="stylesheet" href="{E(t["font_url"])}">'
            if t.get("font_url")
            else ""
        )
        return (
            f'<!doctype html><html lang="en" data-density="{E(t.get("density", "comfortable"))}"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width, initial-scale=1"><title>{E(screen.get("title", screen["id"]))} · {E(self.spec["name"])}</title>'
            f'{font_link}<link rel="stylesheet" href="kit.css"><style>:root{{{css}}}</style></head><body data-screen="{E(screen["id"])}" data-slug="{E(self.spec.get("slug", ""))}"{self.bar_attrs()}>'
        )

    def bar_attrs(self):
        """Body data the prototype bar reads: this screen's variants and the scenario names."""
        a = ""
        if len(self.vmeta) > 1:
            a += f' data-variants="{E(json.dumps(self.vmeta))}" data-variant="{self.vkey}"'
        if self.scenarios:
            a += f' data-scenarios="{E(json.dumps(self.scenarios))}"'
        return a

    def nav(self, screen):
        links = "".join(
            f'<a href="{i}.html" data-action="{screen["id"]}.nav-{i}" {"aria-current=page" if i == screen["id"] else ""}>{E(self.screens[i].get("title", i))}</a>'
            for i in self.nav_items
            if i in self.screens
        )
        logo = f'<a class="logo" href="{self.nav_items[0] if self.nav_items else "index"}.html" data-action="{screen["id"]}.logo"><span class="mark"></span>{E(self.spec["name"])}</a>'
        auth = next(
            (s for s in self.spec.get("screens", []) if s.get("archetype") == "auth"),
            None,
        )
        acct = (self.spec.get("nav") or {}).get("account")
        right = ""
        if acct == "signed-in" or (acct is None and self.nav_style == "sidebar"):
            right = f'<span class="row">{avatar("Amara Okafor")}<span class="small"><b>Amara Okafor</b><br><span class="muted">Admin</span></span></span>'
        elif auth:
            right = f'<a class="btn btn-sm btn-ghost" href="{auth["id"]}.html" data-action="{screen["id"]}.nav-signin">Sign in</a><a class="btn btn-sm btn-primary" href="{auth["id"]}.html" data-action="{screen["id"]}.nav-signup">Get started</a>'
        if self.nav_style == "sidebar":
            return f'<div class="layout"><aside class="sidebar">{logo}<nav class="nav">{links}</nav><div class="foot">{right}</div></aside><div class="content">'
        return (
            f'<header class="topbar"><div class="wrap">{logo}<nav class="nav">{links}</nav><div class="right row">{right}</div>'
            f'<button class="menu-btn" data-action="{screen["id"]}.menu">☰</button></div></header><main class="page"><div class="wrap">'
        )

    def foot(self, screen):
        if self.nav_style == "sidebar":
            return "</div></div>"
        cols = "".join(
            f"<span>{E(x)}</span>"
            for x in [
                f"© {date.today().year} {self.spec['name']}",
                *(self.spec.get("footer") or ["Privacy", "Terms", "Contact"]),
            ]
        )
        return (
            f'</div></main><footer class="foot"><div class="wrap">{cols}</div></footer>'
        )

    def page(self, screen, body, chrome=True):
        inner = (self.nav(screen) + body + self.foot(screen)) if chrome else body
        return (
            self.head(screen)
            + inner
            + '<div class="proto-toast" id="proto-toast"></div><script src="proto.js"></script></body></html>'
        )

    def rows(self, entity, n=None):
        rows = self.data.rows.get(entity) or []
        return rows[:n] if n else rows

    def title_field(self, entity):
        fields = self.spec.get("entities", {}).get(entity, {}).get("fields", [])
        for f in fields:
            if f.get("type") in ("title", "name") or f.get("title"):
                return f["name"]
        return fields[0]["name"] if fields else "id"

    def image_field(self, entity):
        return next(
            (
                f["name"]
                for f in self.spec.get("entities", {}).get(entity, {}).get("fields", [])
                if f.get("type") == "image"
            ),
            None,
        )

    # -- archetypes
    def landing(self, s):
        sid = s["id"]
        hero = s.get("hero") or {}
        cta = hero.get("cta") or {"label": "Get started"}
        sec = hero.get("secondary")
        out = ["</div></main>"] if False else []
        out.append(
            f'<section class="hero"><div class="wrap"><div><h1>{E(hero.get("headline", self.spec.get("tagline", self.spec["name"])))}</h1>'
            f'<p class="sub">{E(hero.get("sub", LOREM[:120]))}</p><div class="cta">{self.action(sid, "cta", cta.get("target"), cta["label"], "btn btn-primary btn-lg")}'
            f"{self.action(sid, 'secondary', sec.get('target'), sec['label'], 'btn btn-lg') if sec else ''}</div></div>"
            f'<img class="art" alt="" src="{art(self.spec["name"] + "hero", 1000, 800, self.theme.get("hue"))}"></div></section>'
        )
        if s.get("stats"):
            out.append(
                '<div class="stats"><div class="wrap row" style="gap:40px">'
                + "".join(
                    f'<div class="stat"><div class="v">{E(x["value"])}</div><div class="l">{E(x["label"])}</div></div>'
                    for x in s["stats"]
                )
                + "</div></div>"
            )
        for sec_ in s.get("sections") or []:
            kind = sec_.get("kind", "features")
            items = sec_.get("items") or []
            if kind == "features":
                cards = "".join(
                    f'<div class="card feature"><div class="icon">{i + 1}</div><h3>{E(it["title"])}</h3><p class="muted" style="margin-top:6px">{E(it.get("text", ""))}</p></div>'
                    for i, it in enumerate(items)
                )
                out.append(
                    f'<section class="section"><div class="wrap"><h2>{E(sec_.get("title", ""))}</h2><p class="lead">{E(sec_.get("lead", ""))}</p><div class="grid grid-{min(len(items) or 3, 4)}">{cards}</div></div></section>'
                )
            elif kind == "showcase":
                ent = sec_.get("entity")
                cards = "".join(
                    self.product_card(sid, ent, r, i, sec_.get("target"))
                    for i, r in enumerate(self.rows(ent, sec_.get("count", 3)))
                )
                out.append(
                    f'<section class="section"><div class="wrap"><div class="row"><div><h2>{E(sec_.get("title", ""))}</h2><p class="lead" style="margin:0">{E(sec_.get("lead", ""))}</p></div>'
                    f'<span class="right">{self.action(sid, "see-all", sec_.get("see_all"), "See all", "btn")}</span></div><div class="grid grid-3" style="margin-top:24px">{cards}</div></div></section>'
                )
            elif kind == "quotes":
                cards = "".join(
                    f'<div class="card quote">“{E(it["text"])}”<div class="who">{avatar(it["who"])}<div><b>{E(it["who"])}</b><div class="muted small">{E(it.get("role", ""))}</div></div></div></div>'
                    for it in items
                )
                out.append(
                    f'<section class="section" style="background:var(--surface)"><div class="wrap"><h2>{E(sec_.get("title", "What people say"))}</h2><div class="grid grid-3" style="margin-top:24px">{cards}</div></div></section>'
                )
            elif kind == "cta":
                out.append(
                    f'<section class="section"><div class="wrap"><div class="cta-band"><div class="grow"><h2>{E(sec_.get("title", ""))}</h2><p style="opacity:.85;margin-top:6px">{E(sec_.get("lead", ""))}</p></div>'
                    f"{self.action(sid, 'band-cta', self.target_of(sec_.get('button')), (sec_.get('button') or {}).get('label', 'Start now'), 'btn btn-lg')}</div></div></section>"
                )
        # landing owns its own width: drop the page wrap the shell opened
        body = "".join(out)
        return body

    def product_card(self, sid, ent, r, i, target):
        tf, imf = self.title_field(ent), self.image_field(ent)
        img = r.get(imf) if imf else art(f"{ent}{i}", 640, 400)
        fields = [
            f
            for f in self.spec["entities"][ent]["fields"]
            if f["name"] not in (tf, imf)
        ][:3]
        meta = " · ".join(
            self.data.fmt(ent, f["name"], r[f["name"]])
            for f in fields
            if f.get("type") not in ("money", "paragraph", "image")
        )
        price = next(
            (
                self.data.fmt(ent, f["name"], r[f["name"]])
                for f in fields
                if f.get("type") == "money"
            ),
            "",
        )
        return (
            f'<a class="card product" href="{target}.html" data-action="{sid}.card-{i}" data-target="{E(target or "")}"><img class="media" alt="" src="{img}"><div class="body"><h3>{E(str(r[tf]))}</h3>'
            f'<p class="muted small">{meta}</p>{f"<p class=price>{price}</p>" if price else ""}</div></a>'
        )

    def auth(self, s):
        sid = s["id"]
        signup = s.get("mode", "signin") == "signup"
        fields = s.get("fields") or (
            [{"name": "name", "label": "Full name"}] if signup else []
        ) + [
            {"name": "email", "label": "Email", "type": "email"},
            {"name": "password", "label": "Password", "type": "password"},
        ]
        inputs = "".join(
            f'<div class="field"><label>{E(f.get("label", f["name"]))}</label><input class="input" type="{E(f.get("type", "text"))}" placeholder="{E(f.get("placeholder", ""))}"></div>'
            for f in fields
        )
        sub = {
            "label": "Create account" if signup else "Sign in",
            **(s.get("submit") or {}),
        }
        alt = s.get("alt") or {}
        body = (
            f'<div class="auth"><div class="card"><div class="body stack"><div class="logo"><span class="mark"></span>{E(self.spec["name"])}</div>'
            f'<h2 style="text-align:center">{E(s.get("title", "Create your account" if signup else "Welcome back"))}</h2><p class="muted small" style="text-align:center">{E(s.get("sub", ""))}</p>{inputs}'
            f"{self.action(sid, 'submit', sub.get('target'), sub['label'], 'btn btn-primary btn-lg', 'data-busy="Signing in…"')}"
            f"{self.action(sid, 'sso', s.get('sso_target'), 'Continue with Google', 'btn btn-lg') if s.get('sso', True) else ''}"
            f'<p class="small muted" style="text-align:center">{E(alt.get("text", "Already have an account?" if signup else "New here?"))} {self.action(sid, "alt", alt.get("target"), alt.get("label", "Sign in" if signup else "Create one"), "")}</p></div></div></div>'
        )
        return self.page(s, body, chrome=False)

    def list(self, s):
        sid, ent = s["id"], s["entity"]
        view = s.get("view", "table")
        cols = (
            s.get("columns")
            or [
                f["name"]
                for f in self.spec["entities"][ent]["fields"]
                if f.get("type") not in ("paragraph", "image")
            ][:6]
        )
        rows = self.rows(ent)
        target = self.target_of(s.get("row_action"))
        primary = s.get("primary")
        head = (
            f'{self.crumbs(s)}<div class="page-head"><div><h1>{E(s.get("title", ent + "s"))}</h1><p class="muted">{E(s.get("sub", f"{len(rows) * 13} {ent.lower()}s"))}</p></div>'
            f'<div class="actions">{self.action(sid, "primary", self.target_of(primary), primary["label"], "btn btn-primary") if primary else ""}</div></div>'
        )
        filters = "".join(
            f'<span class="chip" aria-pressed="{"true" if i == 0 else "false"}" data-action="{sid}.filter-{slug(f)}">{E(f)}</span>'
            for i, f in enumerate(["All", *(s.get("filters") or [])])
        )
        toolbar = f'<div class="toolbar"><span class="search">⌕ Search {E(ent.lower())}s…</span>{filters}<span class="right chip" data-action="{sid}.sort">Sort: {E(s.get("sort", "Newest"))}</span></div>'
        if view in ("cards", "grid"):
            cards = "".join(
                self.product_card(sid, ent, r, i, target) for i, r in enumerate(rows)
            )
            if target not in self.screens:
                self.unspecified.append(
                    {
                        "screen": sid,
                        "control": "card",
                        "target": target,
                        "label": "open item",
                    }
                )
            body = head + toolbar + f'<div class="grid grid-3">{cards}</div>'
        else:
            ths = "".join(
                f'<th class="{"num" if self.data.field(ent, c).get("type") in ("money", "int", "rating") else ""}">{E(self.data.label(ent, c))}</th>'
                for c in cols
            )
            trs = ""
            for i, r in enumerate(rows):
                tds = "".join(
                    f'<td class="{"num" if self.data.field(ent, c).get("type") in ("money", "int", "rating") else ""}">{self.data.fmt(ent, c, r[c])}</td>'
                    for c in cols
                )
                trs += (
                    f'<tr data-action="{sid}.row-{i}" data-target="{E(target or "")}" data-href="{target}.html">{tds}'
                    f'<td class="num">{self.action(sid, "open", target, (s.get("row_action") or {}).get("label", "Open"), "btn btn-sm")}</td></tr>'
                )
            body = (
                head
                + toolbar
                + f'<div class="card"><table class="tbl"><thead><tr>{ths}<th></th></tr></thead><tbody>{trs}</tbody></table><div class="pager"><span>Showing 1–{len(rows)} of {len(rows) * 13}</span><span class="row"><span class="btn btn-sm">‹</span><span class="btn btn-sm">›</span></span></div></div>'
            )
        return self.page(s, body)

    def detail(self, s):
        sid, ent = s["id"], s["entity"]
        # "row": {"status": "Requested"} shows the first sample row that fits the screen's actions
        want = s.get("row") or {}
        r = next((x for x in self.rows(ent) if all(x.get(k) == v for k, v in want.items())), self.rows(ent)[0])
        if want and not all(r.get(k) == v for k, v in want.items()):
            r = {**r, **want}  # no sample row matches: force the fields rather than show a contradiction
        tf, imf = self.title_field(ent), self.image_field(ent)
        fields = s.get("fields") or [
            f["name"]
            for f in self.spec["entities"][ent]["fields"]
            if f["name"] not in (tf, imf) and f.get("type") != "paragraph"
        ]
        para = next(
            (
                r[f["name"]]
                for f in self.spec["entities"][ent]["fields"]
                if f.get("type") == "paragraph"
            ),
            None,
        )
        kv = "".join(
            f"<dt>{E(self.data.label(ent, f))}</dt><dd>{self.data.fmt(ent, f, r[f])}</dd>"
            for f in fields
        )
        actions = "".join(
            self.action(
                sid,
                a["label"],
                a.get("target"),
                a["label"],
                f"btn {'btn-primary' if a.get('tone') == 'primary' else 'btn-danger' if a.get('tone') == 'danger' else ''}",
            )
            for a in s.get("actions") or []
        )
        media = ""
        if imf or s.get("media") is True:  # no image field → no stock photos posing as the record
            main = r.get(imf) if imf else art(f"{ent}-hero", 1000, 640)
            media = f'<div class="gallery"><img class="media" alt="" src="{main}"><div class="side"><img class="media tall" alt="" src="{art(ent + "a", 400, 300)}"><img class="media tall" alt="" src="{art(ent + "b", 400, 300)}"></div></div>'
        tabs = "".join(
            f'<a href="#" data-action="{sid}.tab-{slug(t)}" {"aria-current=page" if i == 0 else ""}>{E(t)}</a>'
            for i, t in enumerate(s.get("tabs") or [])
        )
        price = next(
            (
                self.data.fmt(ent, f["name"], r[f["name"]])
                for f in self.spec["entities"][ent]["fields"]
                if f.get("type") == "money"
            ),
            None,
        )
        side = (
            f'<div class="card"><div class="body stack">{f"<div class=price style=font-size:26px>{price}</div>" if price else ""}<div class="stack" style="gap:8px">{actions}</div>'
            f'<p class="help">{E(s.get("side_note", ""))}</p></div></div>'
        )
        related = ""
        if s.get("related"):
            rel = s["related"]
            related = f'<section style="margin-top:36px"><h2>{E(s.get("related_title", "You may also like"))}</h2><div class="grid grid-3" style="margin-top:16px">{"".join(self.product_card(sid, rel, rr, i + 1, sid) for i, rr in enumerate(self.rows(rel)[1:4]))}</div></section>'
        body = (
            f'{self.crumbs(s)}<div class="page-head"><div><h1>{E(str(r[tf]))}</h1><p class="muted">{E(s.get("sub", ""))}</p></div></div>'
            f'<div class="split"><div class="stack">{media}{f"<div class=tabs>{tabs}</div>" if tabs else ""}<div class="card"><div class="body"><dl class="kv">{kv}</dl>{f"<p class=prose style=margin-top:18px;font-size:15px>{E(para)}</p>" if para else ""}</div></div></div>{side}</div>{related}'
        )
        return self.page(s, body)

    def article(self, s):
        sid, ent = s["id"], s["entity"]
        r = self.rows(ent)[0]
        tf = self.title_field(ent)
        author = next(
            (
                r[f["name"]]
                for f in self.spec["entities"][ent]["fields"]
                if f.get("type") == "name"
            ),
            "Amara Okafor",
        )
        body = (
            f'<article style="max-width:760px;margin:0 auto">{self.crumbs(s)}<h1 style="font-size:40px;letter-spacing:-.03em">{E(str(r[tf]))}</h1>'
            f'<div class="byline">{avatar(author)}<span><b>{E(author)}</b> · {date.today().strftime("%b %-d, %Y")} · 6 min read</span></div>'
            f'<img class="media tall" alt="" src="{art(sid, 1200, 700)}" style="margin-bottom:28px"><div class="prose"><p>{E(LOREM)} {E(LOREM)}</p><h2>Why it matters</h2><p>{E(LOREM)}</p><p>{E(LOREM)}</p></div>'
            f'<div class="row" style="margin-top:32px;gap:10px">{"".join(self.action(sid, a["label"], a.get("target"), a["label"], f"btn {"btn-primary" if a.get("tone") == "primary" else ""}") for a in s.get("actions") or [])}</div></article>'
        )
        return self.page(s, body)

    def form(self, s):
        sid = s["id"]
        fields = s.get("fields") or []

        def inp(f):
            t = f.get("type", "text")
            lab = f"<label>{E(f.get('label', f['name'].replace('_', ' ').title()))}</label>"
            if t == "textarea":
                ctl = f'<textarea class="input ta" placeholder="{E(f.get("placeholder", ""))}"></textarea>'
            elif t in ("select", "enum", "status", "category"):
                ctl = f'<select class="input">{"".join(f"<option>{E(o)}</option>" for o in f.get("options") or ["Option A", "Option B"])}</select>'
            elif t == "bool":
                return f'<div class="field"><label>&nbsp;</label><span class="check"><span class="box on"></span>{E(f.get("label", f["name"]))}</span></div>'
            else:
                ctl = f'<input class="input" type="{E({"money": "text", "int": "number"}.get(t, t))}" placeholder="{E(f.get("placeholder", ""))}">'
            return f'<div class="field {"full" if t == "textarea" or f.get("full") else ""}">{lab}{ctl}{f"<span class=help>{E(f["help"])}</span>" if f.get("help") else ""}</div>'

        sub = {"label": "Save", **(s.get("submit") or {})}
        summary = ""
        if s.get("summary_entity"):
            ent = s["summary_entity"]
            r = self.rows(ent)[0]
            tf = self.title_field(ent)
            price = next(
                (
                    r[f["name"]]
                    for f in self.spec["entities"][ent]["fields"]
                    if f.get("type") == "money"
                ),
                120,
            )
            summary = (
                f'<div class="card"><div class="head"><h3>Summary</h3></div><div class="body stack" style="gap:10px"><div class="row"><img alt="" src="{r.get(self.image_field(ent)) if self.image_field(ent) else art(ent + "0", 200, 150)}" style="width:64px;height:48px;border-radius:8px;object-fit:cover"><div><b>{E(str(r[tf]))}</b><div class="muted small">{E(s.get("summary_note", ""))}</div></div></div>'
                f'<dl class="kv" style="grid-template-columns:1fr auto"><dt>Subtotal</dt><dd>{money(price, self.data.cur)}</dd><dt>Fees</dt><dd>{money(price * 0.12, self.data.cur)}</dd><dt><b>Total</b></dt><dd><b>{money(price * 1.12, self.data.cur)}</b></dd></dl></div></div>'
            )
        body = (
            f'{self.crumbs(s)}<div class="page-head"><div><h1>{E(s.get("title", "New"))}</h1><p class="muted">{E(s.get("sub", ""))}</p></div></div>'
            f'<div class="{"split" if summary else ""}"><div class="card"><div class="body"><div class="form-grid">{"".join(inp(f) for f in fields)}</div>'
            f'<div class="form-actions">{self.action(sid, "cancel", s.get("cancel"), "Cancel", "btn btn-ghost")}{self.action(sid, "submit", sub.get("target"), sub["label"], "btn btn-primary", f'data-busy="{E(s.get("busy", "Saving…"))}"')}</div></div></div>{summary}</div>'
        )
        return self.page(s, body)

    def chart_svg(self, kind, seed, n=12):
        r = random.Random(seed)
        vals = [r.randint(30, 100) for _ in range(n)]
        W, H, pad = 600, 190, 24
        bw = (W - pad * 2) / n
        grid = "".join(
            f'<line class="grid" x1="{pad}" x2="{W - pad}" y1="{pad + i * (H - pad * 2) / 4:.0f}" y2="{pad + i * (H - pad * 2) / 4:.0f}"/>'
            for i in range(5)
        )
        if kind == "bars":
            bars = "".join(
                f'<rect class="bar" x="{pad + i * bw + 4:.0f}" y="{H - pad - v * (H - pad * 2) / 100:.0f}" width="{bw - 8:.0f}" height="{v * (H - pad * 2) / 100:.0f}" rx="3"/>'
                for i, v in enumerate(vals)
            )
            return f'<svg class="chart" viewBox="0 0 {W} {H}">{grid}{bars}</svg>'
        pts = [
            (pad + i * (W - pad * 2) / (n - 1), H - pad - v * (H - pad * 2) / 100)
            for i, v in enumerate(vals)
        ]
        path = " ".join(
            f"{'M' if i == 0 else 'L'}{x:.0f},{y:.0f}" for i, (x, y) in enumerate(pts)
        )
        area = path + f" L{pts[-1][0]:.0f},{H - pad} L{pad},{H - pad} Z"
        return f'<svg class="chart" viewBox="0 0 {W} {H}">{grid}<path class="area" d="{area}"/><path class="line" d="{path}"/></svg>'

    def dashboard(self, s):
        sid = s["id"]
        r = random.Random(sid)
        kpis = "".join(
            f'<div class="card kpi"><div class="l">{E(k["label"])}</div><div class="v">{E(k.get("value") or f"{r.randint(120, 9800):,}")}</div><div class="d" data-tone="{"ok" if (d := k.get("delta", r.choice(["+12.4%", "+3.1%", "-1.8%", "+8.0%"]))).startswith("+") else "bad"}">{E(d)} vs last month</div></div>'
            for k in s.get("kpis") or []
        )
        charts = "".join(
            f'<div class="card"><div class="head"><h3>{E(c["title"])}</h3><span class="right chip">{E(c.get("range", "Last 30 days"))}</span></div><div class="body">{self.chart_svg(c.get("kind", "bars"), c["title"])}</div></div>'
            for c in s.get("charts") or []
        )
        table = ""
        if s.get("table"):
            t = s["table"]
            ent = t["entity"]
            cols = (
                t.get("columns")
                or [
                    f["name"]
                    for f in self.spec["entities"][ent]["fields"]
                    if f.get("type") not in ("paragraph", "image")
                ][:5]
            )
            trs = "".join(
                f'<tr data-action="{sid}.row-{i}" data-target="{E(t.get("target") or "")}" data-href="{t.get("target")}.html">{"".join(f"<td>{self.data.fmt(ent, c, row[c])}</td>" for c in cols)}</tr>'
                for i, row in enumerate(self.rows(ent, t.get("count", 6)))
            )
            table = f'<div class="card"><div class="head"><h3>{E(t.get("title", "Recent " + ent.lower() + "s"))}</h3><span class="right">{self.action(sid, "table-all", t.get("see_all"), "View all", "btn btn-sm")}</span></div><table class="tbl"><thead><tr>{"".join(f"<th>{E(self.data.label(ent, c))}</th>" for c in cols)}</tr></thead><tbody>{trs}</tbody></table></div>'
        acts = "".join(
            self.action(
                sid,
                a["label"],
                a.get("target"),
                a["label"],
                f"btn {'btn-primary' if a.get('tone') == 'primary' else ''}",
            )
            for a in s.get("actions") or []
        )
        body = (
            f'<div class="page-head"><div><h1>{E(s.get("title", "Overview"))}</h1><p class="muted">{E(s.get("sub", date.today().strftime("%A, %B %-d")))}</p></div><div class="actions">{acts}</div></div>'
            f'<div class="stack"><div class="grid grid-{min(len(s.get("kpis") or []), 4) or 4}">{kpis}</div><div class="grid grid-{min(len(s.get("charts") or []), 2) or 2}">{charts}</div>{table}</div>'
        )
        return self.page(s, body)

    def settings(self, s):
        sid = s["id"]
        secs = s.get("sections") or []
        menu = "".join(
            f'<a href="#" data-action="{sid}.menu-{slug(x["title"])}" {"aria-current=page" if i == 0 else ""}>{E(x["title"])}</a>'
            for i, x in enumerate(secs)
        )

        def row(it):
            ctl = (
                '<span class="toggle on"></span>'
                if it.get("type", "bool") == "bool"
                else f'<select class="input" style="width:auto">{"".join(f"<option>{E(o)}</option>" for o in it.get("options") or ["Default"])}</select>'
                if it.get("type") == "select"
                else f'<span class="btn btn-sm" data-action="{sid}.{slug(it["label"])}">{E(it.get("button", "Change"))}</span>'
            )
            return f'<div class="setting"><div class="grow"><div class="t">{E(it["label"])}</div><div class="s">{E(it.get("help", ""))}</div></div>{ctl}</div>'

        panels = (
            "".join(
                f'<div class="card"><div class="head"><h3>{E(x["title"])}</h3></div>{"".join(row(it) for it in x.get("items") or [])}</div>'
                for x in secs[:1]
            )
            if secs
            else ""
        )
        body = f'<div class="page-head"><div><h1>{E(s.get("title", "Settings"))}</h1></div></div><div class="settings"><nav class="menu">{menu}</nav><div class="stack">{panels}<div class="form-actions">{self.action(sid, "save", s.get("save_target", sid), "Save changes", "btn btn-primary")}</div></div></div>'
        return self.page(s, body)

    def empty(self, s):
        body = f'<div class="empty-screen"><div class="box"><div class="q">?</div><h1>{E(s.get("title", s["id"]))}</h1><p class="muted" style="margin-top:10px">{E(s.get("note", "This screen is reached from the prototype but not specified yet. Say what should happen here and it will appear."))}</p></div></div>'
        return self.page(s, body)

    # -- drive
    def screen_html(self, s):
        fn = getattr(self, s.get("archetype", "empty"), self.empty)
        if s.get("archetype") != "landing":
            return fn(s)
        return (
            self.page(s, self.landing(s))
            .replace(
                '<main class="page"><div class="wrap">',
                '<main class="page" style="padding:0">',
            )
            .replace("</div></main><footer", "</main><footer")
        )

    def render(self):
        self.out.mkdir(parents=True, exist_ok=True)
        shutil.copy2(self.kit, self.out / "kit.css")
        (self.out / "proto.js").write_text(PROTO_JS, encoding="utf-8")
        written = []
        for s in self.spec.get("screens", []):
            if s.get("custom"):
                written.append({"id": s["id"], "custom": True})
                continue
            # Variant A is the screen itself; B and C override parts of it. Same id, so nav and
            # clicks are unchanged. ponytail: capped at 3 — past that they stop being different.
            extra = (s.get("variants") or [])[:2]
            if len(s.get("variants") or []) > 2:
                print(
                    f"render_proto: {s['id']} has more than 3 variants; extras ignored",
                    file=sys.stderr,
                )
            names = [s.get("variant_name") or "Current"] + [
                v.get("name") or k.upper() for k, v in zip("bc", extra)
            ]
            files = [("a", s)] + [(k, {**s, **v}) for k, v in zip("bc", extra)]
            self.vmeta = [
                {
                    "key": k,
                    "name": n,
                    "file": f"{s['id']}{'--' + k if k != 'a' else ''}.html",
                }
                for (k, _), n in zip(files, names)
            ]
            for (k, v), m in zip(files, self.vmeta):
                self.vkey = k
                (self.out / m["file"]).write_text(self.screen_html(v), encoding="utf-8")
            self.vmeta, self.vkey = [], None
            row = {
                "id": s["id"],
                "archetype": s.get("archetype"),
                "title": s.get("title", s["id"]),
            }
            if extra:
                row["variants"] = names
            written.append(row)
        entry = (self.spec.get("nav") or {}).get("items", [None])[0] or (
            self.spec.get("screens") or [{"id": "index"}]
        )[0]["id"]
        (self.out / "index.html").write_text(
            f'<!doctype html><meta http-equiv="refresh" content="0; url={entry}.html">',
            encoding="utf-8",
        )
        # de-dup queue
        seen, queue = set(), []
        for u in self.unspecified:
            k = (u["screen"], u["control"])
            if k not in seen:
                seen.add(k)
                queue.append(u)
        manifest = {
            "name": self.spec["name"],
            "entry": f"{entry}.html",
            "screens": written,
            "unspecified": queue,
            "journeys": self.spec.get("journeys", []),
            "scenarios": self.scenarios,
            "actions": list(self.actions.values()),
        }
        (self.out / "manifest.json").write_text(
            json.dumps(manifest, indent=2), encoding="utf-8"
        )
        return manifest


PROTO_JS = r"""// Click shim: every [data-action] click is reported to the dashboard that embeds this
// page; known targets navigate, unspecified ones toast. Works standalone too.
(function () {
  const body = document.body, screen = body.dataset.screen, slug = body.dataset.slug;
  const q = new URLSearchParams(location.search);
  const ss = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (_) { return null; } };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const toast = (m) => { const t = document.getElementById("proto-toast"); if (!t) return; t.textContent = m; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 1800); };

  // Variants (?variant=b) and scenario (?scenario=declined) stick for the session, so the
  // static links between screens keep them.
  const variants = JSON.parse(body.dataset.variants || "[]"), cur = body.dataset.variant || "";
  const vkey = "proto-variant-" + screen;
  if (q.get("variant")) ss(vkey, q.get("variant"));
  if (q.has("scenario")) ss("proto-scenario", q.get("scenario"));
  const want = ss(vkey), hop = variants.find((v) => v.key === want && v.key !== cur);
  if (hop) { location.replace(hop.file); return; }
  let scenario = ss("proto-scenario") || "";
  const scenarios = JSON.parse(body.dataset.scenarios || "[]");
  const carried = ss("proto-toast"); if (carried) { ss("proto-toast", ""); toast(carried); }

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const target = el.dataset.target || null;
    const href = el.getAttribute("href") || el.dataset.href || "";
    const known = target && href && !href.startsWith("#") && href !== "None.html";
    const msg = { type: "proto_click", slug, screen, control: el.dataset.action, target, variant: cur || undefined, scenario: scenario || undefined, label: [...el.childNodes].filter(n => !(n.classList && n.classList.contains("unspec"))).map(n => n.textContent).join("").trim().slice(0, 60) };
    try { if (window.parent !== window) window.parent.postMessage(msg, "*"); } catch (_) {}
    if (el.dataset.sim) { // simulated call: busy, wait, then the outcome the scenario picks (first = default)
      e.preventDefault();
      const sim = JSON.parse(el.dataset.sim), outs = sim.outcomes;
      const o = outs.find((x) => x.name === scenario) || outs[0], was = el.innerHTML;
      el.textContent = el.dataset.busy || "Working…"; el.style.opacity = ".7"; el.style.pointerEvents = "none";
      setTimeout(() => {
        if (o.go) { if (o.toast) ss("proto-toast", o.toast); location.href = o.go; return; }
        el.innerHTML = was; el.style.opacity = ""; el.style.pointerEvents = "";
        if (o.toast) toast(o.toast);
      }, o.delay ?? sim.delay ?? 900);
      return;
    }
    if (!known) { e.preventDefault(); toast(target ? `“${target}” is not specified yet` : "Not specified yet — tell the interviewer what should happen"); return; }
    if (el.dataset.busy) { // ponytail: async stub without a simulate block — busy label, then navigate
      e.preventDefault(); el.textContent = el.dataset.busy; el.style.opacity = ".7"; el.style.pointerEvents = "none";
      setTimeout(() => { location.href = href; }, 900); return;
    }
    if (el.tagName !== "A") { e.preventDefault(); location.href = href; }
  });

  // Prototype bar: variant arrows and the scenario picker. Outside the design being judged.
  if (variants.length > 1 || scenarios.length) {
    const bar = document.createElement("div"), v = variants.find((x) => x.key === cur);
    bar.className = "proto-bar";
    bar.innerHTML = '<span class="tag">Prototype</span>'
      + (v ? `<button data-step="-1" aria-label="Previous variant">‹</button><span class="v">${esc(cur.toUpperCase())} · ${esc(v.name)}</span><button data-step="1" aria-label="Next variant">›</button>` : "")
      + (scenarios.length ? `<select aria-label="Scenario"><option value="">Default outcomes</option>${scenarios.map((s) => `<option${s === scenario ? " selected" : ""}>${esc(s)}</option>`).join("")}</select>` : "");
    body.appendChild(bar);
    const step = (d) => { const i = variants.findIndex((x) => x.key === cur), n = variants[(i + d + variants.length) % variants.length]; ss(vkey, n.key); location.replace(n.file); };
    bar.addEventListener("click", (e) => { const b = e.target.closest("[data-step]"); if (b) step(+b.dataset.step); });
    bar.querySelector("select")?.addEventListener("change", (e) => { scenario = e.target.value; ss("proto-scenario", scenario); });
    if (v) document.addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") step(-1); else if (e.key === "ArrowRight") step(1);
    });
  }

  // Local behaviour so the app feels live: chips/tabs/menus select, toggles and checks flip,
  // selects and inputs just work natively. No state survives navigation (ponytail: add
  // sessionStorage when a journey needs it).
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip && chip.hasAttribute("aria-pressed")) { chip.parentElement.querySelectorAll(".chip[aria-pressed]").forEach(c => c.setAttribute("aria-pressed", "false")); chip.setAttribute("aria-pressed", "true"); }
    const tab = e.target.closest(".tabs a, .settings .menu a");
    if (tab) { e.preventDefault(); tab.parentElement.querySelectorAll("a").forEach(a => a.removeAttribute("aria-current")); tab.setAttribute("aria-current", "page"); }
    const tg = e.target.closest(".toggle"); if (tg) tg.classList.toggle("on");
    const ck = e.target.closest(".check"); if (ck) ck.querySelector(".box")?.classList.toggle("on");
  });
})();
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--kit", default=str(KIT))
    a = ap.parse_args()
    proj = Path(a.project).expanduser().resolve()
    spec = json.loads((proj / "spec.json").read_text(encoding="utf-8"))
    theme = (
        json.loads((proj / "theme.json").read_text(encoding="utf-8"))
        if (proj / "theme.json").exists()
        else {}
    )
    global PHOTO_MODE
    PHOTO_MODE = theme.get(
        "photos"
    )  # "picsum" = seeded stock photos (random subjects; keyword services need API keys now)
    r = Renderer(spec, theme, proj / "prototype")
    r.kit = Path(a.kit)
    m = r.render()
    print(
        json.dumps(
            {
                "prototype": str(proj / "prototype"),
                "entry": m["entry"],
                "screens": len(m["screens"]),
                "unspecified": m["unspecified"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
