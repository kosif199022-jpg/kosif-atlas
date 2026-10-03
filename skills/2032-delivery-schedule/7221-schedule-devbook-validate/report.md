# Devbook validate report

The frame and its rules are `../../resources/report-contract.md`. Follow this shape exactly.

```markdown
## Devbook validate · <owner/repo> · <YYYY-MM-DD>

**<Verdict: clean, repaired in a pull request, or needs a person.>**

### Needs you
| What | Where | Do |
| --- | --- | --- |
| <what doctor found, own words> | <component or file> | `<the one skill that fixes it>` |

### Repaired
| Chapter | Fix |
| --- | --- |

### Run
| Outcome | What | Why |
| --- | --- | --- |

*`schedule-devbook-validate@<version>` · folders <list> · <ISO datetime UTC>*
```

A clean run is the heading, `Nothing to fix.`, and *Run*.
