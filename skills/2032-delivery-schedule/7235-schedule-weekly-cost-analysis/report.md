# Weekly cost analysis report

The frame and its rules are `../../resources/report-contract.md`. Follow this shape exactly.

```markdown
## Weekly cost analysis · <owner/repo> · <YYYY-MM-DD>

**<Verdict: the week's total and the one change that would save the most.>**

| Tokens | Top model | Top agent | Change on last week |
| --- | --- | --- | --- |
| <n> | <model> (<pct>%) | <agent> (<pct>%) | <+/-pct> or — |

### Needs you
| What | Where | Do |
| --- | --- | --- |
| <repository-specific action, own words> | `<skill or agent file>` | <the edit, one line> |

### Tips
| Tip | Expected saving |
| --- | --- |

### Breakdown
| Model or agent | Tokens | Share |
| --- | --- | --- |

### Run
| Outcome | What | Why |
| --- | --- | --- |

*`schedule-weekly-cost-analysis@<version>` · <since>..<now> · <ISO datetime UTC>*
```

*Breakdown* appears only in the `full` format; otherwise *Tips* holds the top N.
