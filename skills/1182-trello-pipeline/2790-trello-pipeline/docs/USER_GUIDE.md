# User Guide: How to Use TrelloAgents

This guide walks you through using the system with real examples. **Start here after installation.**

---

## Part 1: Basic Workflow

### The 5-Minute Version

1. **Submit an idea**
   ```bash
   python trello_ops.py submit "A meal planning app for busy parents"
   ```

2. **Watch your Trello board** — Card appears in Intake

3. **Tell Claude Code to process it** (open Claude Code/Cowork):
   ```
   Process the TrelloAgents pipeline. Keep reading the board and processing 
   cards until everything is done.
   ```

4. **Wait 2-5 minutes** — Claude Code runs all stages

5. **Check your Trello board** — Final PRD is attached to your original card!

---

## Part 2: Step-by-Step Walkthrough

Let's walk through a concrete example: **Building a "Hydration Tracker" app**.

### Stage 1: Intake (You Submit the Idea)

**What happens**: Your raw idea gets structured into a clear problem statement.

**Your action**:
```bash
python trello_ops.py submit "A mobile app that tracks daily water intake and reminds users to drink more water"
```

**On your Trello board**:
- A card appears in the **Intake** column
- Card title: "A mobile app that tracks daily water intake..."
- Status: Waiting for processing

**Behind the scenes** (when Claude Code processes):
- The Intake Analyst reads your idea
- Produces a structured Idea Brief with:
  - Problem Statement
  - Target Audience
  - Core Value Proposition
  - Success Criteria
  - Constraints & Assumptions
  - Scope Boundaries
- Attaches the brief to the card
- Moves card to **Decompose**

---

### Stage 2: Decompose (AI Breaks It Into Features)

**What happens**: One big idea becomes 3-7 focused feature cards.

**Your action**: Nothing — it's automatic.

**On your Trello board**:
- Original card moves to **Decompose** with "In Progress" label
- Claude Code processes it
- Original card moves to **Done** with "Approved" label (archived)
- New cards appear in **Spec Write**:
  - Feature 1: Core Hydration Tracking
  - Feature 2: Smart Reminder Scheduling
  - Feature 3: Progress Visualization
  - Feature 4: Social Challenges
  - Feature 5: Integration with Health Apps

Each feature card:
- Has the feature name as title
- Contains a brief description
- Links back to the original idea

---

### Stage 3: Spec Write (AI Writes Detailed Specs)

**What happens**: Each feature gets a detailed specification.

**Your action**: (Optional) Review specs as they're being written. Add comments if you want changes.

**On your Trello board**:
- All 5 feature cards move to **Spec Write**
- Each card gets "In Progress" label
- Claude Code spawns a **Spec Writer agent for each card** (parallel processing!)
- Each agent writes a detailed Feature Spec including:
  - Problem it solves
  - User stories
  - Acceptance criteria
  - Technical approach
  - Data models
  - API endpoints (if applicable)
  - Success metrics
- Specs are attached to cards
- Cards move to **Spec Review** with "Approved" label

**Example: Core Hydration Tracking spec includes:**
```
## User Stories
- As a user, I can log a drink intake (water, juice, coffee, etc.)
- As a user, I can see my daily hydration level as a percentage
- As a user, I can access intake history

## Data Models
- DrinkLog (user_id, drink_type, volume, timestamp)
- DailyIntake (user_id, date, total_ml, goal_ml)

## API Endpoints
- POST /api/logs (create drink entry)
- GET /api/logs/today (get today's entries)
- GET /api/summary/{date} (get daily summary)

## Success Metrics
- 80% of daily goal achieved by average user
- Users complete 90%+ of days in first month
```

---

### Stage 4: Spec Review (AI Checks Quality)

**What happens**: Each spec is reviewed for clarity, feasibility, and alignment with the idea.

**Your action**: (Optional) Read comments, request changes.

**On your Trello board**:
- Cards move to **Spec Review** with "In Progress" label
- Spec Reviewers check each spec
- Reviewers post comments with:
  - Approval ✓
  - Feedback or questions
  - Requests for revision

**Example feedback on a spec:**
```
✓ Clear user stories
✓ Good data models
? How will we handle offline logging? Add to Technical Approach
? Need to clarify: What counts as a "drink"? (just water or all beverages?)
→ Bounce back to Spec Write for clarification
```

**If feedback:**
- Spec Writer updates the spec
- Spec is moved back to **Spec Review**
- Reviewer approves
- Card moves to **Assemble**

**If approved:**
- Card moves to **Assemble** with "Approved" label

---

### Stage 5: Assemble (AI Builds the PRD)

**What happens**: All approved specs merge into a single, cohesive PRD.

**Your action**: Nothing — wait for the PRD.

**On your Trello board**:
- All feature cards wait in **Assemble** until **all are ready**
- Once all 5 feature specs are approved, the assembler runs
- Generates a unified PRD with:
  - Executive Summary
  - Target Audience
  - Feature Overviews (one per feature)
  - Integrated Data Models
  - Full API Reference
  - Success Criteria
  - Launch Criteria
  - Risk & Mitigation
  - Dependencies
- **Attaches PRD to the ORIGINAL idea card** (the one you submitted)

**Example PRD structure:**
```markdown
# Hydration Tracker PRD

## Executive Summary
A mobile-first hydration tracking application that helps users meet their 
daily water intake goals through intelligent reminders and progress visualization.

## Problem
Many people struggle to drink enough water daily, leading to dehydration-related 
health issues. Existing solutions are either too simple (basic counters) or too 
complex (full health apps).

## Solution
An elegant, focused app that:
1. Makes logging drinks frictionless (1-tap logging)
2. Provides personalized reminders based on activity
3. Celebrates progress with social challenges

## Features
[Details for each feature...]

## Success Criteria
- 50k active users in first 6 months
- 4.5+ star rating in app stores
- 80% of users hit daily goal on average
```

---

### Stage 6: Final Review (Human-Like Proofread)

**What happens**: The PRD gets a final review for polish and completeness.

**Your action**: (Optional) Read the PRD, provide final feedback.

**On your Trello board**:
- Original card (now in **Assemble**) moves to **Final Review**
- Final Reviewer checks:
  - Consistency across all sections
  - Clarity of language
  - Completeness (no missing details)
  - Alignment with original idea
- Posts a comment:
  - "✓ Approved — ready to share" OR
  - "Minor revisions needed: [feedback]"

**If approved:**
- Card moves to **Done**
- PRD is finalized and ready to use!

---

## Part 3: Real Commands & Examples

### Checking Status

```bash
# See how many cards in each stage
python trello_ops.py status

# Output:
# {
#   "Intake": 1,
#   "Decompose": 0,
#   "Spec Write": 5,
#   "Spec Review": 2,
#   "Assemble": 3,
#   "Final Review": 0,
#   "Done": 0
# }
```

### List Cards in a Stage

```bash
# See all cards in Spec Write
python trello_ops.py cards "Spec Write"

# Output:
# [
#   {
#     "id": "123abc",
#     "name": "Core Hydration Tracking",
#     "url": "https://trello.com/c/123abc"
#   },
#   {
#     "id": "124def",
#     "name": "Smart Reminder Scheduling",
#     "url": "https://trello.com/c/124def"
#   }
# ]
```

### View a Card's Details

```bash
# Get full details including attachments and comments
python trello_ops.py card_detail 123abc

# Output:
# {
#   "id": "123abc",
#   "name": "Core Hydration Tracking",
#   "description": "Feature for logging water intake...",
#   "attachments": [
#     {
#       "name": "spec_core_hydration.md",
#       "url": "https://..."
#     }
#   ],
#   "comments": [
#     {
#       "text": "Looks good! Approved.",
#       "author": "Claude (Spec Reviewer)"
#     }
#   ]
# }
```

### Read Card Comments

```bash
# See just the comments on a card
python trello_ops.py comments 123abc

# Output:
# [
#   {
#     "text": "✓ Clear requirements. Approved.",
#     "author": "Spec Reviewer"
#   },
#   {
#     "text": "Added offline logging to Technical Approach",
#     "author": "Spec Writer"
#   }
# ]
```

### Manually Move a Card (if needed)

```bash
# Move a card to a different stage
python trello_ops.py move 123abc "Spec Review"
```

### Add a Comment

```bash
# Add feedback to a card
python trello_ops.py comment 123abc "Great work! Just need to clarify the reminder frequency."
```

### Add a Label

```bash
# Mark a card with a priority label
python trello_ops.py add_label 123abc "P0 - Must Have"

# Or after you review it
python trello_ops.py add_label 123abc "Approved"
```

### Remove a Label

```bash
# Remove a label
python trello_ops.py remove_label 123abc "In Progress"
```

### Attach a File

```bash
# If you want to manually attach something
python trello_ops.py attach 123abc /path/to/your/file.md
```

### Find an Idea's Feature Cards

```bash
# Get all feature cards related to an idea
python trello_ops.py approved_specs idea-1234567

# Output:
# [
#   {
#     "name": "Core Hydration Tracking",
#     "id": "123abc"
#   },
#   ...
# ]
```

### Clear the Board (Destructive!)

```bash
# CAUTION: This deletes all cards. Use only to reset.
python trello_ops.py delete_all
```

---

## Part 4: Using Claude Code as Orchestrator

The power of TrelloAgents is automation. Claude Code reads your board and drives the pipeline.

### Option A: Fully Autonomous Mode

In Claude Code, tell it to run the whole pipeline:

```
Process the TrelloAgents pipeline autonomously. 

1. Read the board status
2. For each stage (Intake → Done):
   - Find cards that are ready
   - Spawn the appropriate agent
   - Attach the output
   - Update labels and move to next stage
3. Keep repeating until no cards remain or the board is stable
```

Claude Code will:
- Read `python trello_ops.py status`
- Process Intake cards with the Intake Analyst
- Process Decompose cards with the Feature Decomposer
- Process Spec Write in parallel
- Continue through all stages
- Report when done

This can take 5-15 minutes depending on idea complexity and API response times.

### Option B: Step-by-Step Manual Mode

Process one stage at a time:

```
What's the current board status?
```
Claude reads the status.

```
Process all cards in the Intake stage.
```
Claude spawns the Intake Analyst for each card.

```
Process all spec writers in parallel.
```
Claude spawns spec writers for all cards in Spec Write.

etc.

### Option C: Monitor & Intervene

Let Claude Code run, but check in periodically:

```
Process the next stage in the pipeline and report what you did.
```

Claude processes one stage, shows you the results, waits for your go-ahead.

---

## Part 5: Handling Feedback & Revisions

Sometimes specs need revision. Here's how to handle it.

### Scenario: A Spec Gets Bounced Back

1. **Spec Reviewer posts comment** with feedback
2. **Card moves back to Spec Write** with "Needs Revision" label
3. **You (or Claude Code) can**:
   - Edit the spec manually in Trello
   - Tell Claude Code to run Spec Writer again on that card
   - Move it back to Spec Review

### Tell Claude Code to Revise

```
Review the comment on card 123abc and revise the spec based on the feedback.
```

Claude Code will:
- Read the comment
- Fetch the current spec
- Run Spec Writer with the feedback context
- Attach the revised spec
- Move card to Spec Review

### Manual Revision

If you prefer to manually edit:

1. Download the spec from the Trello card
2. Edit it locally
3. Save it
4. Run: `python trello_ops.py attach 123abc /path/to/revised/spec.md`
5. Run: `python trello_ops.py move 123abc "Spec Review"`

---

## Part 6: Multiple Ideas in Parallel

One of the best features: You can process multiple ideas at once.

```bash
# Submit 3 ideas
python trello_ops.py submit "A meal planning app"
python trello_ops.py submit "A workout tracker"
python trello_ops.py submit "A meditation guide"
```

All three will be in Intake. Tell Claude Code:

```
Process the pipeline. Handle all three ideas in parallel where possible.
```

Claude Code will:
- Process all 3 Intake cards (run 3 Intake Analysts in parallel)
- Create feature cards for all 3 ideas
- Process all spec writers in parallel across all ideas
- Continue through the pipeline

This is much faster than serial processing.

---

## Part 7: Tips & Tricks

### Tip 1: Start with Simple Ideas
Your first idea should be simple: "A to-do list app" rather than "A complete enterprise resource planning system."

### Tip 2: Use Priority Labels
When you have multiple ideas, tag them:
```bash
python trello_ops.py add_label <card_id> "P0 - Must Have"
python trello_ops.py add_label <card_id> "P1 - Should Have"
python trello_ops.py add_label <card_id> "P2 - Nice to Have"
```

The PRD assembler will incorporate this into the final document.

### Tip 3: Comment with Feedback During Reviews
Don't wait for the final PRD. Comment with feedback as specs are being written:

```bash
python trello_ops.py comment 123abc "Love the approach! One question: how will we handle offline mode?"
```

### Tip 4: Export PRDs for Sharing
Once the PRD is done (in the Done column), download it from the Trello attachment and share it as a markdown file, PDF, or import into your docs system.

### Tip 5: Customize Agent Prompts
The agents live in `agents/` directory. You can edit them to match your style:

- Edit `agents/spec_writer.md` to change how specs are formatted
- Edit `agents/spec_reviewer.md` to change review criteria
- Tell Claude Code to use the updated prompts

### Tip 6: Batch Processing
Run multiple ideas through the pipeline, then batch-review specs:

```
1. Process intake for all 3 ideas
2. Process spec write for all 3 ideas (parallel)
3. STOP and let me review the specs
4. Then process spec review stage
```

This gives you time to provide feedback between stages.

---

## Part 8: Troubleshooting Usage

### "Cards aren't moving"
Check if Claude Code is running and has permissions. Check `.claude/settings.local.json`.

### "A spec looks wrong"
Read the comments on the card. The reviewer may have flagged issues. Move it back to Spec Write with feedback.

### "I want to manually edit a spec"
Download it from Trello, edit it, re-upload:
```bash
python trello_ops.py attach <card_id> /path/to/edited/spec.md
```

### "I want to skip a stage"
You can manually move cards:
```bash
python trello_ops.py move <card_id> "Final Review"
```

### "The PRD is incomplete"
Check that all feature specs are marked "Approved". The assembler only includes approved specs.

### "I want to start over"
```bash
# Clear the board
python trello_ops.py delete_all

# Then re-run setup
python setup_board.py
```

---

## Part 9: Next Steps

You're ready! Here's what to do:

1. **Submit your first idea** — Something simple like "A habit tracker"
2. **Let Claude Code process it** — Give it 5-10 minutes
3. **Review the PRD** — Check your Trello Done column
4. **Adapt the agents** — Edit `agents/spec_writer.md` to match your style
5. **Try with your real ideas** — Submit your actual product ideas

---

## Need Help?

- **Installation issues?** See INSTALLATION.md
- **Understanding the architecture?** See DISTRIBUTION_README.md
- **Claude Code integration?** See CLAUDE.md
- **Customizing agents?** Edit the files in `agents/` and read the comments

**Happy building!**
