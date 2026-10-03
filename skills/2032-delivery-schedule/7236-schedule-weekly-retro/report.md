# Weekly retro report

The frame and its rules are `../../resources/report-contract.md`. Follow this shape exactly.

```markdown
## Weekly retro · <owner/repo> · <YYYY-MM-DD>

**<Verdict: ran or stopped, and why — the window that stopped it, or how many recommendations landed.>**

| Window | Used | Resets |
| --- | --- | --- |
| <weekly all models, the reviewer's weekly window, the short rolling window> | <n>% | <ISO datetime UTC> |

| Reviewer model | From | Window | Sessions | Surface runs | Pull requests |
| --- | --- | --- | --- | --- | --- |

| Lens | Finding |
| --- | --- |
| Bottlenecks | <where turns went without progress, or none found> |
| Context | <what loaded unused or was missing, or none found> |
| Model and effort | <the mismatch, or none found> |

### Needs you
| What | Where | Do |
| --- | --- | --- |
| Keep or drop each recommendation | [#<n>](<url>) | [commits](<url>/commits) |

### For you
| Model, effort, setting, or habit | Set to | Evidence |
| --- | --- | --- |

### Run
| Outcome | What | Why |
| --- | --- | --- |

*`schedule-weekly-retro@<version>` · <since>..<now> · <ISO datetime UTC>*
```

A run the gate stops is the heading, the verdict, the window table, and *Run*. The
recommendation ledger lives in the pull request body; the report links it and does not repeat it.
