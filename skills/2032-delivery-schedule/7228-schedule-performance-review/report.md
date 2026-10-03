# Performance review report

The frame and its rules are `../../resources/report-contract.md`. Follow this shape exactly.

```markdown
## Performance review · <owner/repo> · <YYYY-MM-DD>

**<Verdict: what was implemented and the pull request to validate, or why nothing was.>**

### Needs you
| What | Where | Do |
| --- | --- | --- |
| Validate <the implemented finding, own words> | [#<n>](<url>) | <what to measure> |

### Findings
| # | Where | Issue | Category | Impact | Effort | Score | State |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `<file>:<line>` | <own words> | <category> | <1-5> | <1-5> | <n> | `implemented` |
| 2 | `<file>:<line>` | <own words> | <category> | <1-5> | <1-5> | <n> | `next run` |

### Run
| Outcome | What | Why |
| --- | --- | --- |

*`schedule-performance-review@<version>` · <scope> · <ISO datetime UTC>*
```

The top ten, ranked. The implemented finding is row 1, or its row says why the next one was
taken instead.
