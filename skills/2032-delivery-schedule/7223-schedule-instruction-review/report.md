# Instruction review report

The frame and its rules are `../../resources/report-contract.md`. Follow this shape exactly.

```markdown
## Instruction review · <owner/repo> · <YYYY-MM-DD>

**<Verdict: lines cut across how many files, and the draft pull request to re-read.>**

| Read | Edited | Skipped | Lines removed | Standard |
| --- | --- | --- | --- | --- |

### Needs you
| What | Where | Do |
| --- | --- | --- |
| Re-read the tightened files | [#<n>](<url>) | [files](<url>/files) |

### Reported, not edited
| File | Why |
| --- | --- |
| `<path>` | over budget by <n> lines, an unresolved pointer, or protected text |

### Run
| Outcome | What | Why |
| --- | --- | --- |

*`schedule-instruction-review@<version>` · <scope> · <ISO datetime UTC>*
```

The per-file ledger lives in the pull request body; the report links it and does not repeat it.
