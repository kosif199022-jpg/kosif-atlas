---
name: pdf-ocr-adding
description: This skill should be used when a PDF has no text layer and cannot be searched or grepped — when the user asks to "make this pdf searchable", "run OCR", "PDF durchsuchbar machen", "Texterkennung", "das PDF lässt sich nicht durchsuchen", "warum findet die Suche nichts", or "run pdf-ocr-adding". Adds an invisible text layer with ocrmypdf while leaving the page images untouched. Complements pdf-compressing, which changes the images instead.
---

# pdf-ocr-adding

Scanned PDFs carry no text. Every `grep`, `pdftotext` and full-text search over them silently returns
nothing — not an error, just no hits, which is the dangerous part. This skill adds an invisible OCR
text layer so the document becomes searchable, without touching how it looks.

## When this matters

Run the check **before** concluding that something is not in a document. A search that finds nothing
in a text-free PDF proves nothing at all.

```bash
pdftotext -layout "file.pdf" - | wc -c
```

A 12-page document returning a handful of bytes is a pure image scan. Real text runs to thousands of
characters per page.

## Workflow

### 1. Check the prerequisites

```bash
which ocrmypdf
tesseract --list-langs
```

If `ocrmypdf` is missing or `deu` is not among the languages, install both. Tell the user first, the
language pack is large:

```bash
brew install ocrmypdf tesseract-lang          # macOS
sudo apt install ocrmypdf tesseract-ocr-deu    # Debian/Ubuntu, one package per language
```

`tesseract-lang` is about 686 MB because it carries every language. Reversible with
`brew uninstall ocrmypdf tesseract-lang`.

### 2. Run the OCR into a scratchpad file

Never write directly over the original.

```bash
ocrmypdf -l deu --output-type pdf "input.pdf" "<scratchpad>/ocr_out.pdf"
```

- Set `-l` to the document's language: `deu` for German, `deu+eng` for mixed, `fra`, `ita` and so
  on. The default is English, which breaks umlauts and accents on other languages.
- ⚠️ **Do not use `--deskew` or `--rotate-pages` on documents that are already straight.** They force
  a re-encode of every page image. On a 842 KB contract this produced an 8.5 MB output, ten times the
  original. Without them, ocrmypdf's image optimisation usually makes the file *smaller*.
- If ocrmypdf reports that a page already has text, the file may be partly digital. `--force-ocr`
  rasterises everything and loses existing real text, `--redo-ocr` is the safer repair. Neither is
  needed for a plain scan.

### 2b. Pages with bad existing text: `--redo-ocr`

`--skip-text` silently leaves a page alone if it already carries text — including text from a *bad*
earlier OCR. Symptom: German words full of mangled characters, `FŠttigkeitsmitteilungen` instead of
`Fälligkeitsmitteilungen`. Such a file will not appear in a "no text layer" scan at all, because it
technically has one.

```bash
ocrmypdf -l deu --redo-ocr --output-type pdf "input.pdf" "<scratchpad>/ocr_out.pdf"
```

`--redo-ocr` strips the existing OCR layer and redoes it, while leaving genuine digital text alone.
Prefer it over `--force-ocr`, which rasterises the whole page and destroys real text.

### 3. Verify before replacing

Two checks, both cheap:

```bash
pdftotext -layout "<scratchpad>/ocr_out.pdf" - | wc -c
```

and a content spot check on terms that must occur — names, street names, amounts, special
characters (the examples below are placeholders, take real terms from the page image):

```bash
for t in 'Straße' 'Müller' '1.250,00'; do
  printf '%-16s %s\n' "$t" "$(pdftotext "<scratchpad>/ocr_out.pdf" - | grep -ci "$t")"
done
```

Special characters are the telltale: if `ß`, `ä` or `é` come out wrong, the wrong language was set.

### 4. Replace the original

Keep a backup in the scratchpad, then overwrite in place so all existing links keep working:

```bash
cp "input.pdf" "<scratchpad>/backup.pdf"
cp "<scratchpad>/ocr_out.pdf" "input.pdf"
```

Overwriting in place is the point — a `_ocr.pdf` sibling would leave every existing link pointing at
the unsearchable version. This differs from `pdf-compressing`, which writes a new file because it
degrades the images.

### 5. Report

Give before and after for file size and character count, and name the backup path.

## Batch runs over many files

⚠️ **A shell loop that OCRs and replaces in one pass is not atomic.** If it is interrupted — by the
user, an error, a timeout — the files already processed are *already replaced*, while the rest are
untouched. The result is a half-converted archive that nobody asked for, and the interruption message
will suggest nothing happened.

Two rules:

1. **Never exceed the user's approval.** A survey finding 34 candidates is not permission to touch 34
   files. Report the list, let the user pick, process exactly that set. Approval for five files is
   approval for five files.
2. **Split the loop in two passes.** First OCR everything into the scratchpad and verify. Only then,
   in a second pass, replace the originals. An interruption during pass one changes nothing at all.

Always back up every original into the scratchpad before replacing, preserving the relative path, so
an unwanted change can be reverted byte-exactly:

```bash
mkdir -p "$SCRATCH/$(dirname "$f")" && cp -p "$f" "$SCRATCH/$f"      # backup
cp "$SCRATCH/$f" "$f" && cmp -s "$f" "$SCRATCH/$f" && echo "reverted $f"  # revert
```

⚠️ **Scratchpad backups are session-temporary.** Say so when reporting, so the user knows the
pre-OCR version will not be around tomorrow and their own versioning or backup is the
real safety net.

## Notes

- The page images are untouched, only an invisible text layer is added. The document looks identical
  and prints identically.
- OCR text is a machine guess. It is good enough for finding a passage, **not** for quoting one
  verbatim. For anything that matters legally, read the passage off the page image.
- Worth running proactively on incoming scans in an archive that is searched later: letters,
  invoices, contracts, official notices.
