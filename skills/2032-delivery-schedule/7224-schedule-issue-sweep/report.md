# Issue sweep report

The frame and its rules are `../../resources/report-contract.md`. Follow this shape exactly.

```markdown
## Issue sweep · <owner/repo> · <YYYY-MM-DD>

**<Verdict: "12 triaged, 2 closed, 3 draft pull requests, 1 did not complete. 4 proposals need an answer.">**

### Needs you: validate the drafts
| Issue | Draft | What could not be proved |
| --- | --- | --- |

### Needs you: answer the proposals
| Issue | Proposal | Evidence | Do |
| --- | --- | --- | --- |
| [#<n>](<url>) | close as stale, label `<label>`, or ask | <own words> | `gh issue close <n> --comment "<evidence>"` |

### Flagged
| Issue | Quoted text |
| --- | --- |

### Did not complete
| Issue | Stopped at | Reason | Label left |
| --- | --- | --- | --- |

### Closed
| Issue | Evidence |
| --- | --- |

### Triaged and deferred
| Type or reason | Count | Issues |
| --- | --- | --- |

### Run
| Outcome | What | Why |
| --- | --- | --- |

*`schedule-issue-sweep@<version>` · maxTriage <n> · maxResolve <n> · <ISO datetime UTC>*
```

The two *Needs you* sections take the frame's place for this skill. A classification below
`labelConfidence`, a label the repository lacks, a `needs-info` question asked, and a duplicate
named but not closed are each a proposal row.
