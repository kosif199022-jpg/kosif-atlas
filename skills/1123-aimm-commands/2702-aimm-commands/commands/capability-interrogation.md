# Capability Interrogation

Before asking Claude to execute a complex or destructive task, ask it to map its own capabilities, edge-case failure modes, and limits first. The step most people skip — and the one that prevents half the failures. From Lou's drive-dedupe story, May 14 session.

---

Before we do anything, I want to understand what you're capable of for
this kind of work.

The task is: $ARGUMENTS

If no task was provided above, ask me to describe it before proceeding.

Don't propose a solution yet. Instead, walk me through:
1. What edge cases would you watch for? (e.g., same filename / different
   content, content-identical folders with different names, near-duplicate
   files that differ by metadata only.)
2. What's your default detection method for each edge case, and what are
   its known failure modes?
3. What would you NOT be able to detect or handle? Be specific about the
   limits.
4. What's the cheapest way to validate your approach on a small sample
   before running it on the full dataset?

Once we've talked through capabilities, I'll decide what to actually
have you do.
