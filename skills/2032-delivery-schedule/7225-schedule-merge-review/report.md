# Merge review report

The frame and its rules are `../../resources/report-contract.md`. Follow this shape exactly.

```markdown
## Merge review · <owner/repo> · <YYYY-MM-DD>

**<Verdict: how many are ready, how many are blocked, and the one to merge first.>**

### Needs you
| What | Where | Do |
| --- | --- | --- |
| Ready to merge | [#<n>](<url>) | [review comment](<url>) |
| Blocked: <the blocking finding, own words> | [#<n>](<url>) | [review comment](<url>) |

### Reviewed
| Pull request | Author | Verdict | Blocking | Comment |
| --- | --- | --- | --- | --- |

### Conflict hotspots
| File | Conflicts | Open PRs touching it | Suggestion |
| --- | --- | --- | --- |

### Run
| Outcome | What | Why |
| --- | --- | --- |

*`schedule-merge-review@<version>` · <n> open · last <n> merges · <ISO datetime UTC>*
```

A pull request skipped as already reviewed at its head, or cut by the per-run maximum, is a
`skipped` row under *Run*. No hotspot over the threshold: omit the section.
