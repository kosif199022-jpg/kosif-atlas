# Claude Code Orchestration Guide

How to use Claude Code (Cowork mode) to orchestrate the TrelloAgents pipeline.

---

## Overview

**Claude Code is the orchestrator.** It's the entity that:

1. Reads your Trello board state
2. Spawns Claude Agent sub-agents for each pipeline stage
3. Attaches agent outputs as files to cards
4. Updates labels and moves cards forward
5. Repeats until the pipeline is complete

You direct Claude Code; Claude Code directs the agents.

---

## Setup

### Step 1: Permissions

Copy the template permissions file to your `.claude/` folder:

```bash
# From the TrelloAgents directory:
cp .claude/settings.local.example.json .claude/settings.local.json
```

This tells Claude Code which commands it's allowed to run.

### Step 2: Verify It Works

In Claude Code, ask:

```
Show me the current board status.
```

Claude Code should run `python3 trello_ops.py status` and show you the board state.

---

## Basic Commands

### Check Board Status

```
What's the current board status?
```

Claude Code will:
- Run `python3 trello_ops.py status`
- Show you how many cards are in each stage
- Report the board URL

Example response:
```
Intake: 1 card
Decompose: 0 cards
Spec Write: 5 cards
Spec Review: 2 cards
Assemble: 3 cards
Final Review: 0 cards
Done: 0 cards

Board: https://trello.com/b/abc123/...
```

### List Cards in a Stage

```
What cards are in the Spec Write stage?
```

Claude Code will list all cards and their IDs.

### Get Full Card Details

```
Show me the details of card <card_id>.
```

Claude Code will fetch the card's full information including attachments and comments.

### Read Card Comments

```
What comments are on card <card_id>?
```

Claude Code will show all feedback and reviews.

---

## Processing Pipeline Stages

### Stage: Intake (One at a Time)

```
Process all cards in Intake using the Intake Analyst.

For each card:
1. Read the card content (the raw idea)
2. Run the Intake Analyst (from agents/intake_analyst.md) to create an Idea Brief
3. Attach the Idea Brief to the card
4. Add "Approved" label
5. Move the card to Decompose
```

Claude Code will:
- Find all cards in Intake
- For each card, spawn an Intake Analyst agent
- Get back the structured Idea Brief
- Attach it to the card as `idea_brief.md`
- Move the card to Decompose

### Stage: Decompose (One at a Time)

```
Process all cards in Decompose using the Feature Decomposer.

For each card:
1. Read the Idea Brief (from the card attachment)
2. Run the Feature Decomposer (from agents/feature_decomposer.md) to break into features
3. Create N new cards in Spec Write (one per feature)
4. Mark the original card "Approved" and move to Done
```

Claude Code will:
- Find all cards in Decompose
- For each, fetch the attached Idea Brief
- Run the Feature Decomposer
- Parse the features from the agent output
- Create new cards in Spec Write with the feature names
- Archive the original idea card to Done

### Stage: Spec Write (Parallel)

```
Process all cards in Spec Write in parallel using Spec Writers.

For each card:
1. Read the feature request (from the card)
2. Find the parent Idea Brief
3. Run Spec Writer (from agents/spec_writer.md)
4. Attach the Feature Spec to the card
5. Add "Approved" label
6. Move the card to Spec Review
```

Claude Code will:
- Find all cards in Spec Write
- Spawn a Spec Writer for EACH card (parallel)
- Wait for all to complete
- Attach each spec to its card
- Move all to Spec Review

### Stage: Spec Review (Parallel)

```
Process all cards in Spec Review in parallel using Spec Reviewers.

For each card:
1. Read the Feature Spec (from the card attachment)
2. Find the parent Idea Brief
3. Run Spec Reviewer (from agents/spec_reviewer.md)
4. If approved: add "Approved" label, move to Assemble
5. If rejected: add "Needs Revision" label, move back to Spec Write, post comment with feedback
```

Claude Code will:
- Find all cards in Spec Review
- Spawn a Spec Reviewer for EACH card (parallel)
- Parse approval/rejection from the agent response
- Move cards accordingly (some to Assemble, some back to Spec Write)
- Post reviewer comments as Trello comments

### Stage: Assemble (Once All Features Ready)

```
Process Assemble stage using PRD Assembler.

Wait until all feature cards in Assemble are approved.
When ready:
1. Find all approved feature specs in Assemble
2. Find the parent Idea Brief
3. Run PRD Assembler (from agents/prd_assembler.md)
4. Attach the unified PRD to the ORIGINAL idea card
5. Move feature cards to Done
6. Move the idea card to Final Review
```

Claude Code will:
- Check if all features are in Assemble
- If not all ready, wait or report "Not all specs ready"
- If all ready, fetch all specs and the idea brief
- Run the PRD Assembler
- Get back a comprehensive PRD
- Attach it to the ORIGINAL idea card (not feature cards)
- Move everything forward

### Stage: Final Review (Once)

```
Process the Final Review stage using Final Reviewer.

For the card in Final Review:
1. Read the PRD (from the card attachment)
2. Read the Idea Brief (from metadata or original card)
3. Run Final Reviewer (from agents/final_reviewer.md)
4. If approved: add "Approved" label, move to Done
5. If needs changes: post comment with feedback
```

Claude Code will:
- Find the card in Final Review
- Fetch the PRD
- Run the Final Reviewer
- If approved, move to Done
- If revision needed, post comment and optionally bounce back to earlier stages

---

## Fully Autonomous Mode

Let Claude Code run the entire pipeline without interruption:

```
Process the TrelloAgents pipeline end-to-end.

Keep going through all stages until:
- All cards reach Done, OR
- The board has no more work to do

Report your progress after each stage.
```

Claude Code will:
1. Process Intake → Decompose → Spec Write → Spec Review → Assemble → Final Review → Done
2. Handle parallel processing where applicable
3. Bounce cards back if needed
4. Report status after each stage
5. Ask for help only if stuck

This is the "set it and forget it" approach. Typical time: 10-20 minutes for a complete idea.

---

## Step-by-Step Manual Mode

Let Claude Code process one stage at a time while you review:

```
1. Process all Intake cards.
2. Show me the board status.
3. Wait for my approval before proceeding.
```

After each stage, Claude Code will show you the results. You can:
- Review specs and provide feedback via comments
- Manually adjust cards before proceeding
- Stop and make changes
- Tell Claude Code to continue

This gives you control over the process.

---

## Handling Special Cases

### Bounced Cards (Needs Revision)

When a card gets bounced back:

```
The spec on card <card_id> needs revision. 

Read the reviewer's comment, then run the Spec Writer again 
with the feedback context to revise the spec.
```

Claude Code will:
- Fetch the comment
- Run Spec Writer with the feedback
- Update the spec attachment
- Move back to Spec Review

### Multiple Ideas in Parallel

```
Process the pipeline with all ideas in parallel.

Intake: Process all simultaneously
Decompose: Process all simultaneously
Spec Write: Process all specs simultaneously (across all ideas)
etc.
```

Claude Code will batch and parallelize efficiently.

### Restarting a Failed Idea

```
Reset the Hydration Tracker idea. Move all its cards back to Intake.

Then re-process it with improvements.
```

Claude Code can help you restart without clearing the entire board.

---

## Advanced Orchestration

### Custom Agent Versions

If you've edited an agent prompt:

```
I've updated agents/spec_writer.md to prefer data-driven specs.

Re-process all cards in Spec Write with the new agent.
```

Claude Code will use the updated prompt.

### Conditional Processing

```
Process only P0 (Must Have) cards in Spec Write.
Skip P1 and P2 cards for now.
```

Claude Code can filter by labels and process selectively.

### Integration with External Tools

```
After each PRD reaches Done, send me a summary of the key features.

Also check: does this PRD conflict with our existing roadmap?
```

Claude Code can:
- Generate summaries
- Export PRDs
- Check against external data
- Post to Slack (with the right tools)

---

## Monitoring & Debugging

### View Agent Responses

```
Show me what the Intake Analyst generated for card <card_id>.
```

Claude Code can fetch and display agent outputs.

### Check Processing Times

```
How long does each stage typically take?

Report:
- Intake: average time
- Spec Write: average time
- etc.
```

Claude Code can track and report metrics.

### Troubleshoot Stuck Cards

```
Card <card_id> has been "In Progress" for 30 minutes. 

Check its status, read any error messages, and either:
1. Fix the issue, or
2. Remove the "In Progress" label so we can try again
```

Claude Code can diagnose and recover from stuck states.

---

## Example Conversation Flow

### Setup
```
User: "I want to submit a product idea and process it through the pipeline."

Claude Code: "I can help! Here's what I'll do:
1. You submit an idea
2. I process Intake (structure it)
3. I process Decompose (break into features)
4. I process Spec Write (parallel specs)
5. I process Spec Review (check quality)
6. I process Assemble (build PRD)
7. I process Final Review (polish)
8. You get a final PRD

Ready?"

User: "Yes, let's do it."
```

### Execution
```
Claude Code: "What's your product idea?"

User: "A meditation app for busy professionals."

Claude Code: "Great! Submitting now..."
[Runs: python3 trello_ops.py submit "A meditation app for busy professionals"]

Claude Code: "Submitted! Card is in Intake. Now processing..."

[Runs Intake Analyst]

Claude Code: "✓ Intake complete. Created Idea Brief with:
- Problem: Busy professionals struggle to meditate
- Audience: Corporate workers aged 25-45
- Value Prop: 10-minute guided meditations built for work breaks
- Success: 100k users, 4.5+ star rating

Moving to Decompose..."

[Runs Feature Decomposer]

Claude Code: "✓ Decomposed into 6 features:
1. Core Meditation Library
2. Timer & Session Management
3. Progress Tracking
4. Offline Mode
5. Social Features
6. Integration with Calendar

Created 6 cards in Spec Write. Processing specs in parallel..."

[Spawns 6 parallel Spec Writers]

Claude Code: "✓ All specs written!
Moving to Spec Review..."

[Spawns 6 parallel Spec Reviewers]

Claude Code: "✓ Specs reviewed! 1 bounced back, 5 approved.
Revising the bounced spec..."

[Runs Spec Writer with feedback]

Claude Code: "✓ Revised spec approved.
All 6 specs ready. Running Assembler..."

[Runs PRD Assembler]

Claude Code: "✓ PRD assembled! Running Final Review..."

[Runs Final Reviewer]

Claude Code: "✓ DONE! Your complete PRD is attached to the original card.

Summary:
- 8 stages processed
- 6 feature specs generated
- 1 revision cycle
- Total time: 12 minutes
- PRD quality: Excellent

Board URL: https://trello.com/b/abc123/..."
```

---

## Best Practices

1. **Start with simple ideas** — Test the system with a basic app
2. **Let it run autonomously** — Most reliable and fastest
3. **Review intermediate specs** — Comment with feedback during Spec Write
4. **Check the PRD** — Always review the final output before sharing
5. **Iterate** — Use comments to refine; bounce cards back as needed
6. **Batch process** — Submit 3-5 ideas at once for parallel efficiency

---

## Troubleshooting

### Claude Code Stops Mid-Pipeline

```
Claude Code, the pipeline seems stuck. What's the current board status?
```

Claude Code will diagnose and either continue or report the issue.

### Agent Produces Bad Output

```
The spec from that writer is wrong. Let me manually fix it.

I've edited the spec file. Re-attach it to card <card_id>.
```

You can manually intervene and upload corrections.

### Cards Aren't Moving

Check permissions in `.claude/settings.local.json`. Make sure the commands are allowed.

### Need to Skip a Stage

```
Move card <card_id> directly to Final Review. We want to skip Assemble for this one.
```

Claude Code can manually move cards if needed.

---

## Next Steps

1. Set up permissions (copy settings.local.example.json)
2. Test with: "Show me the board status"
3. Submit an idea: "Submit this idea: [your idea]"
4. Process the pipeline: "Process the pipeline autonomously"
5. Review the final PRD on your Trello board

---

**Let the agents do the work. You focus on reviewing and refining.**
