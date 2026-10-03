---
type: llm
---

The reply opens a design interview about a saved-carts feature. Judge how many separate DECISIONS it asks the user to make.

Counts as ONE question, not several: a single question offered with answer options (a/b/c or 1/2/3), and a closing prompt that asks the user to pick among those same options ("Which do you want?"). Context notes about the repo before the question do not count.

PASS if the reply asks the user to resolve exactly one decision AND gives its own recommended answer with brief reasoning.
FAIL if it asks the user to resolve two or more different decisions (for example a main question plus an "Also: should X...?" follow-up about a different topic), or gives no recommendation.
