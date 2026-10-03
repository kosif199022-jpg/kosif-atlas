# Weekly update report

The frame and its rules are `../../resources/report-contract.md`. Follow this shape exactly.

```markdown
## Weekly update · <owner/repo> · <YYYY-MM-DD>

**<Verdict: the thing that made the week distinct, or what shipped.>**

<Three sentences, no list: what shipped, what is open, what waits on a decision.>

| Commits | Merged | Opened | Open PRs | Issues closed | Issues opened | Open issues | Releases | Failed runs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

### Needs you
| What | Where | Do |
| --- | --- | --- |

### Landed
| Theme | What | Where | Release |
| --- | --- | --- | --- |
| <label or area> | <own words, 8 at most> | [#<n>](<url>) | [<tag>](<url>) or — |

### In flight
| What | Where | State | Age |
| --- | --- | --- | --- |

### Schedules
| Schedule | Landed | State |
| --- | --- | --- |

### Carry-over
| What | Where | Waiting since |
| --- | --- | --- |

### Run
| Outcome | What | Why |
| --- | --- | --- |

*`schedule-weekly-update@<version>` · <since>..<now> · <ISO datetime UTC>*
```

One row per pull request under *Landed*, sorted by *Theme* — never a theme packed into one
cell. *In flight* is oldest first. *Carry-over* is what under *Needs you* was already waiting
before the window began.
