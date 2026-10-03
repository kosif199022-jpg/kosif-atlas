---
name: reader-profile
description: 'Establish or update the reader profile guard''s clarity-auditor calibrates against — the user''s field, experience and vocabulary. Run once before relying on guard''s clarity audit, and again whenever the auditor over- or under-explains. Use when the user asks to set up, review, or correct what guard knows about them as a reader. Claude Code only.'
argument-hint: '[what to record or correct]'
disable-model-invocation: true
---

`clarity-auditor` judges whether an answer can be followed **by this user**. Without a
profile it cannot tell an unexplained term from one the user has known for ten years, so it
runs at reduced coverage and says so. This command fills that gap.

The profile lives in the agent's own `user`-scoped memory, so it follows the user across
every project and is written once, not per repository.

## What to do

1. **Ask, do not infer.** A profile guessed from the repository is worse than none: it
   becomes a fact the auditor calibrates against for months. Use `AskUserQuestion` so the
   user can pick rather than type, and keep it to what changes a calibration decision:

   - their **field and role** — what they build, and in what capacity;
   - **how long** they have worked in it, and what they studied if they offer it;
   - **adjacent areas they do not claim** — the useful half of the profile, and the half a
     user will not volunteer. "I do networking, not compilers" is what stops an answer
     assuming compiler internals are obvious.
   - anything they want **never explained again**, and anything they would rather have
     spelled out.

   Two or three questions is the whole interview. If the user gave the answer in their
   invocation of this command, do not re-ask it.

2. **Show them what will be recorded, and get their word on it.** This is a record about a
   person; they are the authority on whether it is right.

3. **Hand it to the agent to store.** Dispatch `guard:clarity-auditor` with the Agent tool,
   telling it to record the confirmed profile in its memory and to report nothing else. It
   owns that directory; do not write there yourself, and do not audit anything in this run.

4. **Confirm in one line** what was recorded and that the clarity audit will now
   calibrate against it.

## Updating

Same flow with the correction as the input: pass the user's actual words about what was
over- or under-explained. A "you did not need to explain X" correction is a vocabulary
entry, and it is the most valuable kind — it is how the auditor stops repeating a false
positive.

Do not turn a single correction into a rewrite of the whole profile. Change the entry the
user disputed and leave the rest alone.
