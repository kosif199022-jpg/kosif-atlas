# Week starter report

The frame and its rules are `../../resources/report-contract.md`. Follow this shape exactly.

```markdown
## Week starter · <owner/repo> · <YYYY-MM-DD>

**<Verdict: the one release or announcement that could touch this repository this week.>**

### Needs you
| What | Where | Do |
| --- | --- | --- |
| <breaking change that touches this repository> | [<version>](<url>) | `flow-update-packages` |

### <Topic>
| Date | What | Change | Link |
| --- | --- | --- | --- |
| <YYYY-MM-DD> | <version or title> | `new`, `breaking`, `fixed`, or `announced`: <own words, 12 at most> | [notes](<url>) |

### Run
| Outcome | What | Why |
| --- | --- | --- |

*`schedule-week-starter@<version>` · topics <keys> · last <n> days · <ISO datetime UTC>*
```

One section per topic in the source map's order, one row per change: a release with three
highlights is three rows. The `timeline` format is a single table of every row, newest first,
with a *Topic* column in front.
