---
name: pdf-xfa-extracting
description: This skill should be used when a PDF shows only a "Please wait — if this message is not eventually replaced…" placeholder instead of its content (an XFA form with /NeedsRendering), or when the user asks to "read this XFA form", "das PDF zeigt nur Please wait", "XFA-Formular auslesen", "XFA extrahieren", or "run pdf-xfa-extracting". Typical for forms from German banks, insurers and public authorities. First step for any XFA form: extracts the field data into searchable Markdown. Use pdf-xfa-printing afterwards only if the body text is needed.
---

# pdf-xfa-extracting

Dynamic XFA forms (Adobe LiveCycle) carry their real content as an XML packet inside a compressed
stream. The single visible page is only a placeholder telling the reader to install Adobe Reader.
**No viewer other than Adobe Reader renders these** — Preview, Chrome, Firefox/pdf.js and MuPDF all
show the placeholder. So don't try to convert them by printing or re-rendering; read the data
directly.

## Workflow

### 1. Confirm it is actually XFA

```bash
pdftotext -f 1 -l 1 "file.pdf" - | head -3        # → "Please wait..."
strings "file.pdf" | grep -c NeedsRendering       # → ≥1
```

`/NeedsRendering` marks it dynamic. A page count of 1 on a document that should be longer is
another tell. Note that `grep XFA` on the raw file usually finds nothing — the catalog sits in a
compressed object stream.

### 2. Extract

```bash
python3 <base_directory>/scripts/xfa_extract.py "file.pdf" [...] -o "<pdf-dir>/_extrahiert"
```

`<base_directory>` is the path shown as "Base directory for this skill"; the script is not in the
current directory. Always pass `-o` with a folder next to the source PDFs, the default
`_extrahiert` is relative to the current directory.

Writes one Markdown file per PDF, named after the PDF. Two PDFs with the same name overwrite each
other's output, so extract them into separate folders. Options:

- `--bilder` also writes embedded images. Off by default because they are almost always the
  sender's logos and stock photography, easily hundreds of KB of clutter.
- `--roh` keeps every field. By default a noise filter drops layout, institution master data,
  archive metadata (`ARCHIV*`) and debug fields, which are roughly two thirds of the payload.

Long text values such as clauses are kept; only long values without spaces (embedded binary data)
are skipped. "kein Datenpaket" for a file that is XFA means the stream is encrypted or not
FlateDecode-compressed, which the script does not handle.

Requires only the standard library, no dependencies.

### 3. Read the result, then summarise

The output is a field tree, not prose — field names in caps, no layout. Do not hand the raw dump to
the user. Read it and write up what matters, and put the summary where the user's notes already track
that topic rather than in a fresh orphan note.

Useful anchors in Sparkasse/OSPlus forms: `PMSDATA` holds the payload, `FINANZBAUSTEIN/_1`, `_2`
etc. the individual loan tranches, `KOSTEN/ADD` the itemised costs, `VEREINBARUNG/BV/TEXT*` the
free-text clauses (often the most interesting part), `BERATER*` the responsible clerk.

## Notes

- **Cross-check the numbers against what the user's notes already record.** These extracts are the
  authoritative contract data and have repeatedly differed slightly from earlier offer summaries.
  Report the deltas rather than silently overwriting.
- **Watch for template residue.** Unused form slots keep placeholder values such as `999.999,00`
  or dummy entries for a third or fourth loan tranche. Check the count field (`KRANZAHL*`) before
  treating such an entry as real.
- **Fields can be multi-line.** A value continues on the following indented lines without repeating
  the field name. `SICHERUNGSGEBER_NAME` held two borrowers this way, and reading only the first
  line produced a wrong note claiming the document named just one of them. When a field could carry
  several parties, read to the end of the block before summarising.
- **Watch for preview versions.** `FORMULAR_VERARB_ART: VORANSICHT` means the file is a draft; it
  may name only one of several parties. Find the operative version before acting on it.
- Keep the extracts next to the source PDFs (`_extrahiert/` beside them), so they stay searchable
  in the notes app and the link back to the original is obvious.
