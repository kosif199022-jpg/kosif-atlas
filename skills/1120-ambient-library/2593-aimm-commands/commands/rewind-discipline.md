# Rewind Discipline

Use this to recover cleanly from a Claude misinterpretation — explains why correcting forward makes it worse and gives you the exact steps to rewind to the last good instruction and re-run clean. From Kasimir's interjection during the May 14 live tax demo.

---

$ARGUMENTS

If a specific situation was described above, apply the rewind diagnosis to it. Otherwise, explain the discipline and how to apply it in the current session.

---

**The discipline:**

When Claude does something you didn't intend:

1. STOP. Do not type a correction into the next message.
2. Use the rewind feature (esc + arrow keys in Claude Code; equivalent in
   your interface) to delete everything after your last good instruction.
3. Now edit the original instruction itself. The reason Claude went
   sideways is almost always that the instruction was ambiguous, not that
   Claude was wrong. Make the instruction unambiguous.
4. Re-run. Claude is now starting clean from a corrected instruction, with
   no contaminated context from the wrong attempt.

The wrong move — and the one everyone defaults to — is appending
"actually I meant…" to a thread that's already gone off the rails. That
burns tokens, pollutes context, and almost never recovers cleanly.

**How to diagnose what went wrong before rewriting:**

Ask yourself: was the ambiguity in (a) the goal, (b) the scope, (c) the
output format, or (d) a constraint I forgot to state? Fix exactly that
dimension in the rewritten instruction. Don't rewrite the whole thing.
