# Purpose

Turn an approved specification into a reviewed candidate change in one of the
repositories under `projects/`, with every stage's evidence recorded in that
repository's git refs, so the owner decides on evidence rather than on trust.

The factory owns the parts a coding agent should not own: the approval bound to
exact bytes, the separation of red, green and review across workers with no
shared memory, the gates that read real artifacts instead of a worker's claim,
and the two points where it stops and asks the owner. It does not own shipping.
