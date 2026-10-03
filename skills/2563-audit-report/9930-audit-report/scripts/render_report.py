#!/usr/bin/env python3
"""Render an audit findings JSON into a paginated A4 PDF report.

Usage:
    python render_report.py findings.json -o report.pdf
    python render_report.py findings.json -o report.pdf --verify

--verify prints the page count and rasterizes every page to PNG next to the PDF
so the caller can look at what was actually produced.

Requires: reportlab, matplotlib. Optional for --verify: pypdf, pymupdf.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import textwrap
from xml.sax.saxutils import escape

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import matplotlib.ticker as mticker  # noqa: E402

from reportlab.lib import colors  # noqa: E402
from reportlab.lib.enums import TA_CENTER, TA_LEFT  # noqa: E402
from reportlab.lib.pagesizes import A4  # noqa: E402
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet  # noqa: E402
from reportlab.lib.units import cm  # noqa: E402
from reportlab.pdfgen import canvas as rl_canvas  # noqa: E402
from reportlab.platypus import (  # noqa: E402
    HRFlowable,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    XPreformatted,
)

# --------------------------------------------------------------------------
# Palette. Severity keys are canonical (Portuguese spellings, for historical
# reasons); English and Portuguese severity names both map onto them via
# SEVERITY_ALIASES, so a findings file can use either.
#
# Report language comes from the JSON's "lang" key and defaults to "en".
# --------------------------------------------------------------------------

PALETTE = {
    "critica": "#B91C1C",
    "alta": "#EA580C",
    "media": "#D97706",
    "baixa": "#2563EB",
    "informativa": "#64748B",
    "forte": "#059669",
}

SEVERITY_ORDER = ["critica", "alta", "media", "baixa", "informativa"]

SEVERITY_ALIASES = {
    "critical": "critica", "crit": "critica", "critica": "critica", "crítica": "critica",
    "high": "alta", "alta": "alta",
    "medium": "media", "med": "media", "media": "media", "média": "media",
    "low": "baixa", "baixa": "baixa",
    "info": "informativa", "informational": "informativa", "informativa": "informativa",
}

INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#6B7280")
RULE = colors.HexColor("#E5E7EB")
PANEL = colors.HexColor("#F9FAFB")

LABELS = {
    "pt-BR": {
        "report": "Relatório de Auditoria de Segurança",
        "scope": "Escopo auditado",
        "methodology": "Nota metodológica",
        "stack": "Stack detectada",
        "exec": "Resumo executivo",
        "by_severity": "Achados por severidade",
        "by_category": "Achados por categoria",
        "total": "Total",
        "strengths": "Pontos fortes",
        "weaknesses": "Pontos fracos",
        "na": "Categorias não aplicáveis",
        "findings": "Achados detalhados",
        "detail": "Detalhamento dos achados",
        "recs": "Recomendações priorizadas",
        "issues": "Issues para o GitHub",
        "coverage": "Cobertura da auditoria",
        "col_sev": "Severidade",
        "col_loc": "Arquivo:linha",
        "col_desc": "Descrição",
        "evidence": "Evidência",
        "why": "Por que é explorável",
        "precond": "Pré-condições",
        "impact": "Impacto",
        "fix": "Correção sugerida",
        "page": "Página",
        "of": "de",
        "none": "Nenhum achado registrado.",
        "issue_open": "--- ISSUE {n} ---",
        "issue_close": "--- FIM ISSUE {n} ---",
        "sev": {"critica": "Crítica", "alta": "Alta", "media": "Média",
                "baixa": "Baixa", "informativa": "Informativa"},
        "cov_checked": "verificado",
        "cov_findings": "achados",
    },
    "en": {
        "report": "Security Audit Report",
        "scope": "Audited scope",
        "methodology": "Methodology note",
        "stack": "Detected stack",
        "exec": "Executive summary",
        "by_severity": "Findings by severity",
        "by_category": "Findings by category",
        "total": "Total",
        "strengths": "Strengths",
        "weaknesses": "Weaknesses",
        "na": "Non-applicable categories",
        "findings": "Detailed findings",
        "detail": "Finding details",
        "recs": "Prioritized recommendations",
        "issues": "GitHub issues",
        "coverage": "Audit coverage",
        "col_sev": "Severity",
        "col_loc": "File:line",
        "col_desc": "Description",
        "evidence": "Evidence",
        "why": "Why it is exploitable",
        "precond": "Preconditions",
        "impact": "Impact",
        "fix": "Suggested fix",
        "page": "Page",
        "of": "of",
        "none": "No findings recorded.",
        "issue_open": "--- ISSUE {n} ---",
        "issue_close": "--- END ISSUE {n} ---",
        "sev": {"critica": "Critical", "alta": "High", "media": "Medium",
                "baixa": "Low", "informativa": "Informational"},
        "cov_checked": "checked",
        "cov_findings": "findings",
    },
}


def norm_sev(value: str) -> str:
    return SEVERITY_ALIASES.get(str(value).strip().lower(), "informativa")


def esc(value) -> str:
    return escape(str(value if value is not None else ""))


def wrap_block(text: str, width: int = 100) -> str:
    """Hard-wrap preformatted text so it cannot overflow the frame."""
    out = []
    for line in str(text).replace("\t", "    ").splitlines() or [""]:
        if len(line) <= width:
            out.append(line)
        else:
            out.extend(textwrap.wrap(
                line, width=width, subsequent_indent="  ",
                break_long_words=True, break_on_hyphens=False,
            ) or [""])
    return "\n".join(out)


# --------------------------------------------------------------------------
# Styles
# --------------------------------------------------------------------------

def build_styles():
    ss = getSampleStyleSheet()
    s = {}
    s["cover_title"] = ParagraphStyle(
        "cover_title", parent=ss["Title"], fontName="Helvetica-Bold",
        fontSize=26, leading=31, textColor=INK, alignment=TA_LEFT, spaceAfter=4)
    s["cover_sub"] = ParagraphStyle(
        "cover_sub", parent=ss["Normal"], fontName="Helvetica",
        fontSize=13, leading=17, textColor=MUTED, alignment=TA_LEFT)
    s["h1"] = ParagraphStyle(
        "h1", parent=ss["Heading1"], fontName="Helvetica-Bold",
        fontSize=16, leading=20, textColor=INK, spaceBefore=2, spaceAfter=8)
    s["h2"] = ParagraphStyle(
        "h2", parent=ss["Heading2"], fontName="Helvetica-Bold",
        fontSize=12, leading=15, textColor=INK, spaceBefore=10, spaceAfter=5)
    s["h3"] = ParagraphStyle(
        "h3", parent=ss["Heading3"], fontName="Helvetica-Bold",
        fontSize=9.5, leading=12, textColor=INK, spaceBefore=6, spaceAfter=2)
    s["body"] = ParagraphStyle(
        "body", parent=ss["Normal"], fontName="Helvetica",
        fontSize=9.5, leading=13.5, textColor=INK, spaceAfter=5)
    s["small"] = ParagraphStyle(
        "small", parent=ss["Normal"], fontName="Helvetica",
        fontSize=8.5, leading=11.5, textColor=MUTED)
    s["cell"] = ParagraphStyle(
        "cell", parent=ss["Normal"], fontName="Helvetica",
        fontSize=8.5, leading=11, textColor=INK)
    s["cell_mono"] = ParagraphStyle(
        "cell_mono", parent=ss["Normal"], fontName="Courier",
        fontSize=8, leading=10.5, textColor=INK)
    s["chip"] = ParagraphStyle(
        "chip", parent=ss["Normal"], fontName="Helvetica-Bold",
        fontSize=8, leading=10, textColor=colors.white, alignment=TA_CENTER)
    s["th"] = ParagraphStyle(
        "th", parent=ss["Normal"], fontName="Helvetica-Bold",
        fontSize=8.5, leading=11, textColor=colors.white)
    s["code"] = ParagraphStyle(
        "code", parent=ss["Code"], fontName="Courier",
        fontSize=7.2, leading=9.2, textColor=INK,
        leftIndent=6, rightIndent=6, spaceBefore=3, spaceAfter=3)
    return s


# --------------------------------------------------------------------------
# Charts
# --------------------------------------------------------------------------

def donut_chart(counts: dict, path: str, labels: dict) -> str | None:
    live = [(k, counts.get(k, 0)) for k in SEVERITY_ORDER if counts.get(k, 0) > 0]
    if not live:
        return None
    total = sum(v for _, v in live)
    fig, ax = plt.subplots(figsize=(4.1, 3.0), dpi=200)
    ax.pie(
        [v for _, v in live],
        colors=[PALETTE[k] for k, _ in live],
        startangle=90, counterclock=False,
        wedgeprops=dict(width=0.40, edgecolor="white", linewidth=2.0),
    )
    ax.text(0, 0.06, str(total), ha="center", va="center",
            fontsize=23, fontweight="bold", color="#111827")
    ax.text(0, -0.26, labels["total"].upper(), ha="center", va="center",
            fontsize=7.5, color="#6B7280")
    ax.legend(
        [f"{labels['sev'][k]}  ({v})" for k, v in live],
        loc="center left", bbox_to_anchor=(0.98, 0.5),
        frameon=False, fontsize=8.5, handlelength=0.9, handleheight=0.9,
    )
    ax.set(aspect="equal")
    fig.subplots_adjust(left=0.0, right=0.62, top=0.98, bottom=0.02)
    fig.savefig(path, facecolor="white", bbox_inches="tight", pad_inches=0.06)
    plt.close(fig)
    return path


def category_chart(by_cat: dict, path: str, labels: dict) -> str | None:
    """Horizontal stacked bars: one row per category, segments by severity."""
    if not by_cat:
        return None
    cats = sorted(by_cat, key=lambda c: -sum(by_cat[c].values()))
    height = max(2.2, 0.52 * len(cats) + 1.35)
    fig, ax = plt.subplots(figsize=(6.6, height), dpi=200)
    ypos = range(len(cats))
    left = [0] * len(cats)
    for sev in SEVERITY_ORDER:
        vals = [by_cat[c].get(sev, 0) for c in cats]
        if not any(vals):
            continue
        ax.barh(list(ypos), vals, left=left, color=PALETTE[sev],
                height=0.58, label=labels["sev"][sev], edgecolor="white", linewidth=0.8)
        left = [a + b for a, b in zip(left, vals)]
    ax.set_yticks(list(ypos))
    ax.set_yticklabels([textwrap.fill(c, 34) for c in cats], fontsize=8.5, color="#111827")
    ax.invert_yaxis()
    ax.tick_params(axis="x", labelsize=8, colors="#6B7280", length=0)
    ax.tick_params(axis="y", length=0)
    for side in ("top", "right", "left", "bottom"):
        ax.spines[side].set_visible(False)
    ax.xaxis.grid(True, color="#E5E7EB", linewidth=0.8)
    ax.set_axisbelow(True)
    maxv = max(left) if left else 1
    ax.set_xlim(0, max(1, maxv) * 1.08)
    ax.xaxis.set_major_locator(mticker.MaxNLocator(integer=True))
    for i, v in enumerate(left):
        if v:
            ax.text(v + maxv * 0.015, i, str(int(v)), va="center",
                    fontsize=8, color="#374151", fontweight="bold")
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.12 - 0.30 / height),
              ncol=5, frameon=False, fontsize=8, columnspacing=1.4,
              handlelength=0.9, handleheight=0.9)
    fig.tight_layout(pad=0.4)
    fig.savefig(path, facecolor="white", bbox_inches="tight", pad_inches=0.06)
    plt.close(fig)
    return path


# --------------------------------------------------------------------------
# Canvas with header / footer
# --------------------------------------------------------------------------

class NumberedCanvas(rl_canvas.Canvas):
    header_text = ""
    label_page = "Page"
    label_of = "of"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved = []

    def showPage(self):
        self._saved.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved)
        for state in self._saved:
            self.__dict__.update(state)
            if state.get("_pageNumber", 1) > 1:
                self._decorate(total)
            super().showPage()
        super().save()

    def _decorate(self, total):
        w, h = A4
        self.setFont("Helvetica", 7.5)
        self.setFillColor(MUTED)
        self.drawString(2 * cm, h - 1.25 * cm, self.header_text)
        self.setStrokeColor(RULE)
        self.setLineWidth(0.5)
        self.line(2 * cm, h - 1.42 * cm, w - 2 * cm, h - 1.42 * cm)
        self.line(2 * cm, 1.45 * cm, w - 2 * cm, 1.45 * cm)
        self.drawRightString(
            w - 2 * cm, 1.05 * cm,
            f"{self.label_page} {self._pageNumber} {self.label_of} {total}",
        )


# --------------------------------------------------------------------------
# Flowable builders
# --------------------------------------------------------------------------

def chip(sev: str, s: dict, labels: dict) -> Table:
    t = Table([[Paragraph(labels["sev"][sev], s["chip"])]],
              colWidths=[2.05 * cm], rowHeights=[0.52 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(PALETTE[sev])),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 1),
        ("RIGHTPADDING", (0, 0), (-1, -1), 1),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    return t


def loc_markup(finding: dict) -> str:
    """`dir/` on one line, `file.ext:lines` on the next, so paths never break mid-token."""
    path = str(finding.get("file", ""))
    lines = finding.get("lines")
    if "/" in path:
        head, tail = path.rsplit("/", 1)
        base = f"{tail}:{lines}" if lines else tail
        return f"<font color='#6B7280'>{esc(head)}/</font><br/>{esc(base)}"
    return esc(f"{path}:{lines}" if lines else path)


def scaled_image(path: str, max_width: float) -> Image:
    """Embed a PNG at max_width, preserving its aspect ratio."""
    from reportlab.lib.utils import ImageReader

    iw, ih = ImageReader(path).getSize()
    return Image(path, width=max_width, height=max_width * ih / float(iw), hAlign="LEFT")


def kv_panel(rows, s, width):
    t = Table(rows, colWidths=[3.1 * cm, width - 3.1 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), 0.5, RULE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def build_story(data: dict, s: dict, labels: dict, width: float, tmpdir: str):
    story = []
    findings = data.get("findings", [])
    for f in findings:
        f["_sev"] = norm_sev(f.get("severity", "informativa"))

    counts = {k: 0 for k in SEVERITY_ORDER}
    by_cat: dict = {}
    for f in findings:
        counts[f["_sev"]] += 1
        cat = f.get("category", "—")
        by_cat.setdefault(cat, {}).setdefault(f["_sev"], 0)
        by_cat[cat][f["_sev"]] += 1

    # ---------------- Cover ----------------
    title = data.get("report_title") or labels["report"]
    project = data.get("project", "")
    story.append(Spacer(1, 3.4 * cm))
    story.append(Paragraph(esc(f"{title} — {project}" if project else title), s["cover_title"]))
    story.append(Spacer(1, 0.25 * cm))
    story.append(HRFlowable(width="28%", thickness=3,
                            color=colors.HexColor(PALETTE["critica"]),
                            spaceBefore=2, spaceAfter=10, hAlign="LEFT"))
    story.append(Paragraph(esc(data.get("date", "")), s["cover_sub"]))
    story.append(Spacer(1, 1.1 * cm))

    if data.get("stack"):
        story.append(Paragraph(labels["stack"], s["h2"]))
        rows = [[Paragraph(f"<b>{esc(k)}</b>", s["cell"]), Paragraph(esc(v), s["cell"])]
                for k, v in data["stack"]]
        story.append(kv_panel(rows, s, width))
        story.append(Spacer(1, 0.55 * cm))

    if data.get("scope"):
        story.append(Paragraph(labels["scope"], s["h2"]))
        story.append(Paragraph(esc(data["scope"]), s["body"]))
    if data.get("methodology"):
        story.append(Paragraph(labels["methodology"], s["h2"]))
        story.append(Paragraph(esc(data["methodology"]), s["body"]))
    story.append(PageBreak())

    # ---------------- Executive summary ----------------
    story.append(Paragraph(labels["exec"], s["h1"]))

    total = len(findings)
    head = [Paragraph(labels["sev"][k], s["th"]) for k in SEVERITY_ORDER]
    head.append(Paragraph(labels["total"], s["th"]))
    vals = [Paragraph(f"<b>{counts[k]}</b>", s["cell"]) for k in SEVERITY_ORDER]
    vals.append(Paragraph(f"<b>{total}</b>", s["cell"]))
    colw = width / (len(SEVERITY_ORDER) + 1)
    t = Table([head, vals], colWidths=[colw] * (len(SEVERITY_ORDER) + 1))
    style = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.white),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("BACKGROUND", (0, 1), (-1, 1), PANEL),
    ]
    for i, k in enumerate(SEVERITY_ORDER):
        style.append(("BACKGROUND", (i, 0), (i, 0), colors.HexColor(PALETTE[k])))
    style.append(("BACKGROUND", (len(SEVERITY_ORDER), 0), (-1, 0), INK))
    t.setStyle(TableStyle(style))
    story.append(t)
    story.append(Spacer(1, 0.5 * cm))

    donut = donut_chart(counts, os.path.join(tmpdir, "_donut.png"), labels)
    if donut:
        story.append(Paragraph(labels["by_severity"], s["h2"]))
        story.append(scaled_image(donut, width * 0.72))
        story.append(Spacer(1, 0.35 * cm))

    bars = category_chart(by_cat, os.path.join(tmpdir, "_cats.png"), labels)
    if bars:
        story.append(Paragraph(labels["by_category"], s["h2"]))
        story.append(scaled_image(bars, width))

    # ---------------- Strengths / weaknesses ----------------
    if data.get("strengths") or data.get("weaknesses") or data.get("not_applicable"):
        story.append(PageBreak())
    if data.get("strengths"):
        story.append(Paragraph(labels["strengths"], s["h1"]))
        for item in data["strengths"]:
            story.append(KeepTogether([
                Paragraph(f"<font color='{PALETTE['forte']}'>&#9679;</font> "
                          f"<b>{esc(item.get('title', ''))}</b>", s["body"]),
                Paragraph(esc(item.get("evidence", "")), s["small"]),
                Spacer(1, 0.22 * cm),
            ]))
    if data.get("weaknesses"):
        story.append(Paragraph(labels["weaknesses"], s["h1"]))
        for item in data["weaknesses"]:
            story.append(Paragraph(
                f"<font color='{PALETTE['critica']}'>&#9679;</font> {esc(item)}", s["body"]))
    if data.get("not_applicable"):
        story.append(Paragraph(labels["na"], s["h2"]))
        for item in data["not_applicable"]:
            story.append(Paragraph(
                f"<b>{esc(item.get('category', ''))}</b> — {esc(item.get('reason', ''))}",
                s["small"]))
            story.append(Spacer(1, 0.12 * cm))

    # ---------------- Findings tables ----------------
    story.append(PageBreak())
    story.append(Paragraph(labels["findings"], s["h1"]))
    if not findings:
        story.append(Paragraph(labels["none"], s["body"]))
    else:
        order = {k: i for i, k in enumerate(SEVERITY_ORDER)}
        for cat in sorted(by_cat, key=lambda c: -sum(by_cat[c].values())):
            story.append(Paragraph(esc(cat), s["h2"]))
            rows = [[Paragraph(labels["col_sev"], s["th"]),
                     Paragraph(labels["col_loc"], s["th"]),
                     Paragraph(labels["col_desc"], s["th"])]]
            group = sorted((f for f in findings if f.get("category", "—") == cat),
                           key=lambda f: order[f["_sev"]])
            for f in group:
                desc = f.get("title", "")
                if f.get("id"):
                    desc = f"<b>[{esc(f['id'])}]</b> {esc(desc)}"
                else:
                    desc = esc(desc)
                if f.get("wstg"):
                    desc += f" <font color='#6B7280'>({esc(f['wstg'])})</font>"
                rows.append([
                    chip(f["_sev"], s, labels),
                    Paragraph(loc_markup(f), s["cell_mono"]),
                    Paragraph(desc, s["cell"]),
                ])
            t = Table(rows, colWidths=[2.35 * cm, 5.4 * cm, width - 7.75 * cm],
                      repeatRows=1)
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), INK),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.5, RULE),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PANEL]),
            ]))
            story.append(t)
            story.append(Spacer(1, 0.4 * cm))

        # ---------------- Finding detail cards ----------------
        story.append(PageBreak())
        story.append(Paragraph(labels["detail"], s["h1"]))
        for f in sorted(findings, key=lambda f: order[f["_sev"]]):
            loc = f.get("file", "")
            if f.get("lines"):
                loc = f"{loc}:{f['lines']}"
            block = [
                Table([[chip(f["_sev"], s, labels),
                        Paragraph(f"<b>{esc(f.get('id', ''))} {esc(f.get('title', ''))}</b>"
                                  f"<br/><font face='Courier' size='8' color='#6B7280'>"
                                  f"{esc(loc)}</font>", s["cell"])]],
                      colWidths=[2.35 * cm, width - 2.35 * cm],
                      style=TableStyle([
                          ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                          ("LEFTPADDING", (0, 0), (0, 0), 0),
                          ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                      ])),
            ]
            if f.get("code"):
                block.append(Paragraph(labels["evidence"], s["h3"]))
                block.append(Table(
                    [[XPreformatted(esc(wrap_block(f["code"], 96)), s["code"])]],
                    colWidths=[width],
                    style=TableStyle([
                        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
                        ("BOX", (0, 0), (-1, -1), 0.5, RULE),
                        ("LEFTPADDING", (0, 0), (-1, -1), 6),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                        ("TOPPADDING", (0, 0), (-1, -1), 5),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ])))
            for key, lbl in (("why", "why"), ("preconditions", "precond"),
                             ("impact", "impact"), ("fix", "fix")):
                if f.get(key):
                    block.append(Paragraph(labels[lbl], s["h3"]))
                    block.append(Paragraph(esc(f[key]), s["body"]))
            block.append(HRFlowable(width="100%", thickness=0.5, color=RULE,
                                    spaceBefore=8, spaceAfter=10))
            story.append(KeepTogether(block) if len(block) <= 6 else block[0])
            if len(block) > 6:
                story.extend(block[1:])

    # ---------------- Coverage ----------------
    if data.get("coverage"):
        story.append(Paragraph(labels["coverage"], s["h1"]))
        rows = [[Paragraph(esc(c.get("sweep", "")), s["cell"]),
                 Paragraph(esc(c.get("checked", "")), s["cell"]),
                 Paragraph(str(c.get("findings", 0)), s["cell"])]
                for c in data["coverage"]]
        t = Table([[Paragraph("Sweep", s["th"]),
                    Paragraph(labels["cov_checked"], s["th"]),
                    Paragraph(labels["cov_findings"], s["th"])]] + rows,
                  colWidths=[width * 0.34, width * 0.51, width * 0.15], repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), INK),
            ("GRID", (0, 0), (-1, -1), 0.5, RULE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PANEL]),
        ]))
        story.append(t)

    # ---------------- Recommendations ----------------
    if data.get("recommendations"):
        story.append(PageBreak())
        story.append(Paragraph(labels["recs"], s["h1"]))
        rows = []
        for r in data["recommendations"]:
            refs = ", ".join(r.get("refs", []))
            rows.append([
                Paragraph(f"<b>{esc(r.get('priority', ''))}</b>", s["cell"]),
                Paragraph(esc(r.get("text", "")) +
                          (f" <font color='#6B7280'>[{esc(refs)}]</font>" if refs else ""),
                          s["cell"]),
            ])
        t = Table(rows, colWidths=[1.6 * cm, width - 1.6 * cm])
        t.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, RULE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 0), (0, -1), PANEL),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t)

    # ---------------- GitHub issues ----------------
    if data.get("issues"):
        story.append(PageBreak())
        story.append(Paragraph(labels["issues"], s["h1"]))
        for i, issue in enumerate(data["issues"], start=1):
            n = issue.get("n", i)
            body = "\n".join([
                labels["issue_open"].format(n=n),
                wrap_block(issue.get("markdown", ""), 96).rstrip(),
                labels["issue_close"].format(n=n),
            ])
            story.append(Table(
                [[XPreformatted(esc(body), s["code"])]],
                colWidths=[width],
                style=TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), PANEL),
                    ("BOX", (0, 0), (-1, -1), 0.5, RULE),
                    ("LEFTPADDING", (0, 0), (-1, -1), 7),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ])))
            story.append(Spacer(1, 0.4 * cm))

    return story


# --------------------------------------------------------------------------
# Verify
# --------------------------------------------------------------------------

def verify(pdf_path: str) -> int:
    pages = None
    try:
        from pypdf import PdfReader
        pages = len(PdfReader(pdf_path).pages)
        print(f"[verify] pages: {pages}")
    except Exception as exc:  # noqa: BLE001
        print(f"[verify] pypdf unavailable or failed ({exc}); skipping page count")
    try:
        import pymupdf as fitz
    except Exception:  # noqa: BLE001
        try:
            import fitz  # older pymupdf exposes only this name
        except Exception as exc:  # noqa: BLE001
            print(f"[verify] pymupdf unavailable ({exc}); skipping rasterization")
            return pages or 0
    outdir = os.path.join(os.path.dirname(os.path.abspath(pdf_path)), "_verify")
    os.makedirs(outdir, exist_ok=True)
    doc = fitz.open(pdf_path)
    for i, page in enumerate(doc, start=1):
        png = os.path.join(outdir, f"page-{i:02d}.png")
        page.get_pixmap(dpi=110).save(png)
        print(f"[verify] rasterized {png}")
    doc.close()
    return pages or len(os.listdir(outdir))


# --------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="Render an audit findings JSON to PDF.")
    ap.add_argument("findings", help="path to findings JSON")
    ap.add_argument("-o", "--out", default="report.pdf", help="output PDF path")
    ap.add_argument("--verify", action="store_true",
                    help="report page count and rasterize pages to PNG")
    args = ap.parse_args()

    with open(args.findings, encoding="utf-8") as fh:
        data = json.load(fh)

    lang = data.get("lang", "en")
    labels = LABELS.get(lang, LABELS["en"])
    s = build_styles()

    out = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    tmpdir = os.path.dirname(out)

    title = data.get("report_title") or labels["report"]
    project = data.get("project", "")
    header = f"{title} — {project}" if project else title

    NumberedCanvas.header_text = header
    NumberedCanvas.label_page = labels["page"]
    NumberedCanvas.label_of = labels["of"]

    doc = SimpleDocTemplate(
        out, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title=header, author=data.get("author", "audit-report"),
        subject=labels["report"],
    )
    width = doc.width
    story = build_story(data, s, labels, width, tmpdir)
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[ok] wrote {out}")

    for name in ("_donut.png", "_cats.png"):
        p = os.path.join(tmpdir, name)
        if os.path.exists(p):
            os.remove(p)

    if args.verify:
        verify(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
