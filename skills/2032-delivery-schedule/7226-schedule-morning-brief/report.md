# Morning brief report

The frame and its rules are `../../resources/report-contract.md`. Follow this shape exactly.

```markdown
## Morning brief · <owner/repo> · <YYYY-MM-DD>

**<Verdict: the one thing that makes today distinct, or the shape — "Quiet night: 3 merged, 2 opened, 2 waiting on a reviewer.">**

### Needs you
| What | Where | Do |
| --- | --- | --- |
| Nightly tests red on `<base>` | [run <id>](<url>) · `<sha7>` | `gh run rerun <id> --failed` |
| Waiting on your review, <n> days | [#<n>](<url>) | [review](<url>/files) |

### Landed
| What | Where | Kind |
| --- | --- | --- |
| <own words, 8 at most> | [#<n>](<url>) | `merged`, closes [#<n>](<url>) |
| <release name> | [<tag>](<url>) | `release` |

### In flight
| What | Where | State | Age |
| --- | --- | --- | --- |
| <own words> | [#<n>](<url>) | `draft` | <n>d |

### Schedules
| Schedule | Landed | State |
| --- | --- | --- |

### Run
| Outcome | What | Why |
| --- | --- | --- |

*`schedule-morning-brief@<version>` · <since>..<now> · <ISO datetime UTC>*
```

*Needs you* holds only what is still true now, per `../../resources/change-window-contract.md`.
A merged pull request and the issue it closed are one row.
