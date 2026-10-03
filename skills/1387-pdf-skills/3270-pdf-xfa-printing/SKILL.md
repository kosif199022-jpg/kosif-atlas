---
name: pdf-xfa-printing
description: This skill should be used when an XFA form's real body text is needed, not just its field data — when the user asks to "convert this XFA form", "XFA konvertieren", "XFA-Formular in normales PDF umwandeln", "XFA-PDF ausdrucken und ersetzen", "make this XFA form a normal PDF", or "run pdf-xfa-printing", or when a pdf-xfa-extracting result lacks the body text. macOS only (Adobe Reader plus the PDFwriter virtual printer). Walks the user through printing, then verifies the result and replaces the original.
---

# pdf-xfa-printing

Dynamic XFA forms (Adobe LiveCycle) only render in Adobe Reader. `pdf-xfa-extracting` pulls the
XML data packet out of them, but that packet holds **only the filled-in field values**. The fixed
contract text lives in the form's layout template and is not part of it.

That difference is large. For a Sparkasse AGB the extract was 7.464 bytes of mostly archive numbers,
while the printed version yielded 43.008 characters covering all 56 clauses.

**Rule of thumb:** data-heavy forms (ESIS, Finanzierungsübersicht, Grundschuld) extract well.
Text-heavy documents (AGB, Erläuterungen, VVI, SEPA mandates, SCHUFA consent) need this skill.

## One-time setup

Check whether the virtual printer is already there:

```bash
lpstat -p | grep PDFwriter
```

If not, the user runs this in **Terminal.app** (it needs an admin password, which cannot be entered
through the agent's shell):

```bash
brew install --cask rwts-pdfwriter
```

The package installs the driver and the queue. Output lands in `/private/var/spool/pdfwriter/$USER/`
— not in `~/PDFwriter` or `/Users/Shared/PDFwriter`.

## Workflow

### 1. Confirm the file is XFA and worth printing

```bash
pdftotext -f 1 -l 1 "file.pdf" - | head -3        # → "Please wait..."
```

Check the extract if one exists. If `_extrahiert/<name>.md` is only a few KB and holds job and
filename metadata but no clause texts, the body text is missing and printing is worth it. (With
`--roh` such an extract consists mostly of `ARCHIVINFO`, `AttrId`, `Stapelname` and similar.)

### 2. Give the user these instructions verbatim

> 1. XFA-Datei in Acrobat öffnen.
> 2. `Datei > Drucken`.
> 3. Als Drucker **PDFwriter** auswählen.
> 4. Bei „Kommentare & Formulare" **Dokument** auswählen. Acrobat gibt dann Dokument und
>    Formulardaten an den Drucker aus.
> 5. Drucken.

Step 4 is the one people miss. Without it the field values can be dropped from the output.

Then wait. Do not poll the spool folder in a loop; the user says when they are done.

### 3. Collect and verify

```bash
ls -lt /private/var/spool/pdfwriter/$USER/*.pdf | head
```

⚠️ **The spool filename is unreliable.** Acrobat names the job after the document's internal title,
which sometimes equals the source filename and sometimes does not — `AGB.pdf` arrived as
`DMS AGB.pdf`, `Erläuterungen.pdf` kept its name. The modification time is the only dependable
marker. Match by time first, then confirm by page count and content.

For each printed file, before touching the original:

```bash
pdfinfo "printed.pdf" | grep -i pages          # plausible page count, not 1
pdftotext "printed.pdf" - | wc -c              # clearly more than the extract
```

Then cross-check identity against the original or its extract — customer number, contract number,
date, a distinctive passage. Never replace a file on the strength of the timestamp alone.

### 3a. Shrink the print if it is oversized

Acrobat rasterises the form template, so a visually rich form can come out enormous — a four-page
Finanzierungsübersicht arrived at 19,8 MB. Check the size and compress before filing:

```bash
gs -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -dPDFSETTINGS=/printer \
   -sOutputFile=small.pdf "printed.pdf"
pdftotext small.pdf - | wc -c      # must match the uncompressed count
```

`/printer` (300 dpi) took that file to 721 KB, `/ebook` (150 dpi) to 196 KB. This skill uses `/printer`, not the `/ebook` preset of `pdf-compressing`,
because the result replaces the original. Prefer `/printer` when
the document carries charts or a signature image; the text layer is identical either way. Always
re-check the character count afterwards.

### 3b. Compare against the extract — the print is not always the richer version

Usually the print wins, but not for tabular data. The ESIS-Merkblatt printed only the *number* of
instalments (376) while the XFA data held a 43-row amortisation table. Check for figures that exist
in `_extrahiert/<name>.md` but not in the print:

```bash
grep -oE '\*\*[A-Z_0-9]+:\*\* [0-9.]+,[0-9]{2}' "_extrahiert/<name>.md" | sort -u
# then grep each value in `pdftotext printed.pdf -`
```

If something is missing, build a supplement page and append it, rather than keeping two files:

```bash
# render plain text to PDF with macOS' own filter, then concatenate
cupsfilter -i text/plain -m application/pdf supplement.txt > supplement.pdf
gs -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sOutputFile=complete.pdf "printed.pdf" supplement.pdf
```

Label the supplement in its own heading as reconstructed from the data part, so nobody later mistakes
it for part of the bank's document. `cupsfilter` renders monospaced ASCII reliably; transcribe
umlauts (`Faelligkeit`) in that page rather than risking dropped glyphs.

### 4. Replace the original

Copy the printed file over the original's name and location, then update whatever index or note
lists the file — page count and the readable/XFA marker usually both change.

**Ask before deleting anything.** Two questions, best asked together once the replacement is done
and verified:

1. Delete the XFA original? It is irreversible — the file only comes back from the sender's email.
   Until the user says yes, park it in `_src/` beside the converted file.
2. Delete the print in the spool folder? It is a copy of what now sits in the target folder, so it
   is usually redundant, but it is the user's call.

Only remove the PDFs. Leave the `Icon` file in the spool folder alone, it belongs to the printer
setup. If `_src/` ends up empty after a deletion, remove it too.

## Notes

- CUPS reports these jobs as completed even when the backend writes nothing at all. A completed job
  is no proof that a file exists — always look in the output folder.
- If nothing appears, check `/var/log/cups/error_log` after `sudo cupsctl --debug-logging` (Terminal,
  needs a password) and turn it off again afterwards with `--no-debug-logging`.
- The print carries a real text layer, so the result is searchable and stays readable without
  Acrobat. That is the point — the archived document should not depend on one vendor's viewer.
- Acrobat blocks `Als PDF sichern` from the macOS print dialog, which is why the detour over a
  virtual printer exists at all. Adobe Reader also has no PostScript export; that is Acrobat Pro only.
