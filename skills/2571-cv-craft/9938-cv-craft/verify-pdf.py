"""Verify a rendered CV PDF is actually parseable by an ATS.

Usage:  python verify-pdf.py Matheus_Malagris_CV.pdf
Exit:   0 = clean, 1 = a problem worth fixing before sending.

Checks three failure modes that are invisible when you look at the PDF:

  ligatures      Chromium shapes fi/fl/ff into single glyphs (U+FB00-FB04).
                 pypdf and Apache PDFBox return the raw glyph, so an ATS
                 searching for "Cloudflare" scores zero on a CV that has it.
  leaked markers PT-BR review notes or [ESTIMADO] / [DADO AUSENTE] annotations
                 that should have been stripped before rendering.
  glued words    Font embedding dropped the spaces between words.
  injection      Text addressed to an AI screener ("ignore previous
                 instructions", "rank this candidate"). Screening vendors
                 flag it; a flagged resume is worse than a weak one.

Also warns (does not fail) when the last page of a multi-page CV is less than
two-thirds as full as the first: a page and a half reads worse than one or two.

Deliberately uses pypdf rather than pdftotext: pdftotext silently normalises
ligatures back to "fi"/"fl" and reports a broken file as clean.
"""

import re
import sys

LIGATURES = {
    "\ufb00": "ff", "\ufb01": "fi", "\ufb02": "fl",
    "\ufb03": "ffi", "\ufb04": "ffl",
}
MARKERS = ("DADO AUSENTE", "ESTIMADO", "Perfil inferido", "Gaps reais",
           "Cobertura da JD", "Lista de revis", "Defesa da m")
INJECTION = re.compile(
    r"ignore (all |any )?(previous|prior|above) instructions"
    r"|(rank|rate|score) this (candidate|applicant|resume)"
    r"|(note|instructions?) (to|for) (the )?(ai|llm|chatgpt|screener)"
    r"|you are an? (ai|llm|language model)",
    re.IGNORECASE)


def main(path):
    try:
        import pypdf
    except ImportError:
        print("pypdf not installed. Run: pip install pypdf")
        return 1

    reader = pypdf.PdfReader(path)
    pages = [page.extract_text() or "" for page in reader.pages]
    text = "\n".join(pages)

    found = {lig: text.count(lig) for lig in LIGATURES if lig in text}
    leaks = [m for m in MARKERS if m.lower() in text.lower()]
    glued = re.findall(r"[A-Za-z]{25,}", text)
    injected = sorted({m.group(0) for m in INJECTION.finditer(text)})

    print("%-16s %d" % ("pages", len(pages)))
    print("%-16s %d" % ("words", len(text.split())))

    if len(pages) > 1:
        first, last = len(pages[0].split()), len(pages[-1].split())
        if first and last < first * 2 / 3:
            print("%-16s WARN last page %d%% full" % ("page fill", 100 * last // first))
            print("%-16s   fill the page or cut back to %d" % ("", len(pages) - 1))
        else:
            print("%-16s ok" % "page fill")

    if found:
        total = sum(found.values())
        print("%-16s FAIL (%d)" % ("ligatures", total))
        words = {m.group(0) for m in
                 re.finditer(r"[A-Za-z\ufb00-\ufb04]*[\ufb00-\ufb04][A-Za-z\ufb00-\ufb04]*", text)}
        for w in sorted(words)[:8]:
            plain = w
            for lig, sub in LIGATURES.items():
                plain = plain.replace(lig, sub)
            # ascii() escapes the glyph; printing it raw crashes a cp1252 console.
            print("%-16s   stored as %s, an ATS searching %r finds nothing"
                  % ("", ascii(w), plain))
        print("%-16s   fix: add font-variant-ligatures:none to cv-style.css"
              % "")
    else:
        print("%-16s ok" % "ligatures")

    if leaks:
        print("%-16s FAIL %s" % ("leaked markers", leaks))
        print("%-16s   the strip step did not run. Do not send this file."
              % "")
    else:
        print("%-16s ok" % "leaked markers")

    if glued:
        print("%-16s FAIL %s" % ("glued words", glued[:3]))
        print("%-16s   spaces were lost. Try font-family: Arial, sans-serif."
              % "")
    else:
        print("%-16s ok" % "glued words")

    if injected:
        print("%-16s FAIL %s" % ("injection", injected[:3]))
        print("%-16s   remove text addressed to an AI screener." % "")
    else:
        print("%-16s ok" % "injection")

    bad = bool(found or leaks or glued or injected)
    print()
    print("SEND IT" if not bad else "FIX BEFORE SENDING")
    return 1 if bad else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
