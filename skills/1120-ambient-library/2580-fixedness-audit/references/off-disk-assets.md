# Off-disk assets

Read this when the archive isn't only files — which is most real businesses. The scan cannot
see these, and they are frequently the highest-scoring substrate in the audit.

Add them to `judgments.json` by hand with ids `M001`, `M002`, … and run `rank` **without**
`--inventory` (or after appending matching stub entries to the inventory's `assets` list, if you
want the labels and paths in the report). Ids not present in the inventory fail validation when
`--inventory` is passed — that check is deliberate, so choose one mode and stay in it.

## Where to look, and what the substrate usually is

| Store | The artifact | The substrate underneath |
|---|---|---|
| Zoom / Riverside cloud, YouTube unlisted | Session recordings | Hours of real client language, objections raised in the moment, the questions people actually ask before they know the vocabulary |
| Course platform (Kajabi, Teachable, Circle) | Modules nobody buys now | The sequence — what had to be understood before what. Ordering is judgment; content is commodity |
| CRM / email | Contact records | Won/lost reasons, the objection log, which framing closed and which didn't |
| Client files | Deliverables | Intake forms, diagnostics, the before/after pairs. A hundred filled-in intakes is a labelled dataset nobody else has |
| Support inbox / community | Threads | Failure taxonomy — every way the method breaks in the field |
| Your own head | "How I do it" | Undocumented method: the calls you make that you never wrote down because they felt obvious |
| Relationships | A contact list | Standing permission to ask. Distinct from an audience and far scarcer |

## Scoring them

Same rubric, two adjustments:

- **substrate_depth**: for a store you can't count, require an estimated count and span before
  scoring above 3 ("roughly 90 sessions, 2019-2024"). An unquantified store gets 3 max — the
  discipline is what keeps this from becoming a vision exercise.
- **distance**: add the extraction cost. Recordings that must be transcribed and cleaned are
  further from shipped than the same content already sitting in text files. Be honest; this is
  the dimension people flatter themselves on.

Anything that requires client consent to use — recordings, intake data, testimonials — gets that
named in `evidence`. A high-scoring asset you're not permitted to use is a zero.
