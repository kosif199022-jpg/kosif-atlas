#!/usr/bin/env python3
"""Inhalt aus dynamischen XFA-PDFs holen.

Formulare aus Bank- und Behördensystemen (Adobe LiveCycle, erkennbar an
/NeedsRendering) zeigen außerhalb des Adobe Readers nur einen Platzhalter.
Der Inhalt liegt als XML-Paket in einem komprimierten Stream. Dieses Skript
liest das Datenpaket aus und schreibt es als Markdown.

    python3 xfa_extract.py datei.pdf [...] -o zielordner
    python3 xfa_extract.py datei.pdf --bilder      # Bilder mitschreiben
    python3 xfa_extract.py datei.pdf --roh         # ungefiltert, alle Felder
"""
import argparse
import base64
import json
import re
import sys
import zlib
import xml.etree.ElementTree as ET
from pathlib import Path

# Felder, die nur Layout, Institutsstammdaten oder Debug-Kram enthalten.
# Ohne diesen Filter besteht die Ausgabe zu rund zwei Dritteln aus Rauschen.
NOISE = re.compile(
    r'^(DEBUG_|FUSS\d|KIZEILE|ARTIKEL_INST|MARKE|HSC|TBX|BARCODE|DSV|'
    r'INSTITUTS|ABSENDER|SPARKASSEN?S?$|AGB$|CARD|KASSEN|RIESTER|SKMINUS|'
    r'WEBSERVICE_|FDBNAME|FDVNAME|ANWDKZNAME|HILFSFELD|VIRT_|ARCHIV|'
    r'TARGETURL|Datamerge_)'
)
BINARY_TAGS = {'BILD', 'DIAGRAMM', 'LOGO'}
# Längere Werte ohne Leerzeichen sind eingebettete Binärdaten und werden
# übersprungen. Lange Texte (Klauseln) bleiben erhalten.
MAX_FIELD = 4000


def datasets_packet(pdf):
    """Größtes <xfa:datasets>-Paket aus den Streams des PDFs."""
    data = pdf.read_bytes()
    found = []
    for m in re.finditer(rb'stream\r?\n', data):
        start = m.end()
        end = data.find(b'endstream', start)
        if end < 0:
            continue
        try:
            raw = zlib.decompress(data[start:end])
        except zlib.error:
            continue
        if b'<xfa:datasets' in raw:
            found.append(raw)
    return max(found, key=len) if found else None


def is_xfa(pdf):
    """Grobe Vorprüfung, ohne die Streams zu entpacken."""
    return b'/NeedsRendering' in pdf.read_bytes()


def extract_images(root, dest, stem):
    """Base64-Bilder aus den Daten in Dateien schreiben.

    Meist Logos und Werbebilder des Absenders, deshalb nur auf Wunsch.
    """
    written = []
    nodes = (n for n in root.iter() if n.tag.split('}')[-1] in BINARY_TAGS)
    for i, node in enumerate(nodes):
        text = (node.text or '').strip()
        if len(text) < 2000:
            continue
        try:
            blob = base64.b64decode(text)
        except Exception:
            continue
        ext = ('jpg' if blob[:2] == b'\xff\xd8'
               else 'png' if blob[:4] == b'\x89PNG' else 'bin')
        path = dest / f'{stem}_bild{i:02d}.{ext}'
        path.write_bytes(blob)
        written.append(path)
    return written


def is_blob(text):
    return len(text) >= MAX_FIELD and ' ' not in text[:500]


def render(node, depth=0, lines=None, keep_all=False, counter=None):
    """Datenbaum als eingerückte Markdown-Liste."""
    lines = [] if lines is None else lines
    counter = [0] if counter is None else counter
    tag = node.tag.split('}')[-1]
    if tag in BINARY_TAGS or (not keep_all and NOISE.match(tag)):
        return lines
    children = [c for c in node
                if keep_all or not NOISE.match(c.tag.split('}')[-1])]
    text = (node.text or '').strip()
    pad = '  ' * depth
    if not children:
        if text and not is_blob(text):
            lines.append(f'{pad}- **{tag}:** ' + text.replace('\n', f'\n{pad}  '))
            counter[0] += 1
    else:
        lines.append(f'{pad}- **{tag}**')
        for child in children:
            render(child, depth + 1, lines, keep_all, counter)
    return lines


def convert(pdf, dest, want_images=False, keep_all=False):
    packet = datasets_packet(pdf)
    if packet is None:
        note = (' (XFA, aber kein lesbares Datenpaket: verschlüsselt oder nicht'
                ' FlateDecode-komprimiert)' if is_xfa(pdf) else ' (kein XFA-PDF)')
        print(f'  {pdf.name}: kein Datenpaket gefunden{note}')
        return False
    root = ET.fromstring(packet.decode('utf-8', 'replace'))
    images = extract_images(root, dest, pdf.stem) if want_images else []
    counter = [0]
    body = '\n'.join(render(root, keep_all=keep_all, counter=counter))
    out = dest / f'{pdf.stem}.md'
    header = (
        f'---\ntitle: {json.dumps(pdf.stem, ensure_ascii=False)}\n'
        f'quelle: {json.dumps(pdf.name, ensure_ascii=False)}\n'
        f'hinweis: "Aus den XFA-Daten extrahiert, ohne Layout"\n---\n\n'
        f'# {pdf.stem}\n\n'
        f'Extrahiert aus `{pdf.name}`, einem dynamischen XFA-Formular, das '
        f'sich außerhalb des Adobe Readers nicht anzeigen lässt.\n\n'
    )
    if images:
        header += ('Eingebettete Bilder: '
                   + ', '.join(f'`{p.name}`' for p in images) + '\n\n')
    out.write_text(header + body + '\n', encoding='utf-8')
    print(f'  {pdf.name} → {out.name}  ({counter[0]} Felder'
          + (f', {len(images)} Bilder' if images else '') + ')')
    return True


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('pdfs', nargs='+', type=Path)
    ap.add_argument('-o', '--out', type=Path, default=Path('_extrahiert'),
                    help='Zielordner (Standard: _extrahiert)')
    ap.add_argument('--bilder', action='store_true',
                    help='Eingebettete Bilder mitschreiben')
    ap.add_argument('--roh', action='store_true',
                    help='Ungefiltert, auch Layout- und Stammdatenfelder')
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    ok = sum(convert(p, args.out, args.bilder, args.roh) for p in args.pdfs)
    print(f'\n{ok} von {len(args.pdfs)} konvertiert.')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
