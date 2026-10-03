# Folder-as-Source Reconciler

Point Claude Code at a folder of source documents, spawn parallel sub-agents per subfolder, and return only structured CSV results to main context — keeping files on disk instead of loading them into the conversation. The fix for "Claude hit limits at 10 receipts." From Lou's live tax demo for Joanna, May 14 session.

---

I have a folder of source documents at $ARGUMENTS

If no folder path was provided above, ask me for the path and document type before proceeding.

The folder contains [DESCRIBE — e.g., bank CSVs, scanned receipts, PDF
statements from multiple vendors] organized into subfolders by source.

Do this work directly against the filesystem. Do NOT load the source files
into our conversation context.

Step 1 — Survey the folder. Tell me what subfolders exist, how many files
in each, and what file types you see.

Step 2 — Spawn one sub-agent per subfolder. Each sub-agent should extract
the following fields into a CSV: [LIST FIELDS — e.g., date, merchant,
pre-tax amount, tax, total, source-file-name].

Step 3 — Return to main context ONLY: (a) a per-source row count,
(b) any rows that failed extraction with the reason, (c) the path to each
output CSV.

Step 4 — Consolidate the per-source CSVs into one master CSV at
[OUTPUT PATH]. Then group by merchant and propose a category for each
merchant. I'll classify each merchant once, not each transaction.
