---
name: pdf-compressing
description: This skill should be used when the user asks to "compress a pdf", "shrink a pdf", "reduce pdf file size", "PDF komprimieren", "PDF verkleinern", or "run pdf-compressing". Uses Ghostscript to compress a given PDF, writing the output next to the original with a `_komprimiert.pdf` suffix.
---

# pdf-compressing

Compress a PDF file with Ghostscript's `/ebook` quality preset, which downsamples images and typically yields large size reductions with acceptable quality loss for screen/print use.

## Workflow

### 1. Resolve the input file

Take the PDF path from the user's request. If they didn't give one, ask which file to compress. Confirm the file exists before proceeding.

### 2. Derive the output filename

Output filename = input filename with the `.pdf` extension replaced by `_komprimiert.pdf`, in the same directory as the input.

Example: `Rechnung 2026.pdf` → `Rechnung 2026_komprimiert.pdf`

### 3. Run Ghostscript

```bash
gs \
  -sDEVICE=pdfwrite \
  -dCompatibilityLevel=1.4 \
  -dPDFSETTINGS=/ebook \
  -dNOPAUSE \
  -dQUIET \
  -dBATCH \
  -sOutputFile="<input>_komprimiert.pdf" \
  "<input>.pdf"
```

Quote both paths to handle spaces/special characters safely.

### 4. Report the result

Compare file sizes of input and output (`ls -lh` or `du -h`) and report the size before/after and percentage reduction to the user.

## Notes

- Never overwrite the original file.
- If the output ends up larger than the input (rare, e.g. already-compressed PDFs), delete the output and tell the user rather than keeping a worse result.
- `/ebook` downsamples images to 150 dpi. That is fine for screen reading but can make small print in scans hard to read. For scans that must stay legible, or a result that replaces an original, use `/printer` (300 dpi) instead and say so.
