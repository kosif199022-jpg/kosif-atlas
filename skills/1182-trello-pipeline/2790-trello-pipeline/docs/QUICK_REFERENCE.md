# TrelloAgents — Quick Reference Card

**One-page cheat sheet for common tasks.**

---

## Installation (5 min)

```bash
# Install dependencies
pip install anthropic python-dotenv

# Set up config
cp .env.example .env
# Edit .env with your API keys

# Create Trello board
python setup_board.py

# Verify it works
python trello_ops.py status
```

---

## Submitting Ideas

```bash
# Submit a single idea
python trello_ops.py submit "Your product idea here"

# Submit multiple ideas (do this in sequence)
python trello_ops.py submit "Idea 1"
python trello_ops.py submit "Idea 2"
python trello_ops.py submit "Idea 3"
```

---

## Checking Status

```bash
# See board overview (cards per stage)
python trello_ops.py status

# List all cards in a stage
python trello_ops.py cards "Spec Write"

# Get full card details (attachments, comments)
python trello_ops.py card_detail <card_id>

# Read just the comments on a card
python trello_ops.py comments <card_id>
```

---

## Managing Cards

```bash
# Move a card to a different stage
python trello_ops.py move <card_id> "Spec Review"

# Add a comment (feedback, notes, etc.)
python trello_ops.py comment <card_id> "Your feedback here"

# Add a label
python trello_ops.py add_label <card_id> "Approved"
python trello_ops.py add_label <card_id> "P0 - Must Have"

# Remove a label
python trello_ops.py remove_label <card_id> "In Progress"

# Manually attach a file
python trello_ops.py attach <card_id> /path/to/file.md
```

---

## Using Claude Code

### Get Board Status
```
What cards are in each stage?
```

### Process One Stage
```
Process all cards in Intake using the Intake Analyst.
```

### Process Everything Automatically
```
Process the entire TrelloAgents pipeline autonomously until Done.
```

### Process Step-by-Step
```
Process the next stage and tell me what you did.
```

### Revise a Bounced Spec
```
Read the feedback on card <card_id> and revise the spec.
```

---

## Configuration Options

Edit `.env` to tune behavior:

```bash
# Use faster (cheaper) model
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

# Use better quality (slower, expensive) model
ANTHROPIC_MODEL=claude-opus-4-7

# Check board more frequently
POLL_INTERVAL_SECONDS=5

# Allow more revision cycles
MAX_ITERATIONS_PER_CARD=10

# Enable detailed logging
LOG_LEVEL=DEBUG
```

---

## Typical Workflow

```
1. python trello_ops.py submit "Your idea"
2. [In Claude Code] "Process the pipeline autonomously"
3. [Wait 5-15 minutes]
4. Check your Trello board
5. Download PRD from the Done column
6. Share the PRD with stakeholders
```

---

## Pipeline Stages

```
Intake → Decompose → Spec Write → Spec Review → Assemble → Final Review → Done
```

| Stage | Agent | Input | Output |
|-------|-------|-------|--------|
| Intake | Analyst | Raw idea | Structured brief |
| Decompose | Decomposer | Brief | Feature cards |
| Spec Write | Writers | Features | Detailed specs |
| Spec Review | Reviewers | Specs | Approval/feedback |
| Assemble | Assembler | Specs | Complete PRD |
| Final Review | Reviewer | PRD | Polished PRD |
| Done | — | PRD | ✓ Ready |

---

## Labels & Meanings

- **In Progress** = Agent is currently working on this card
- **Approved** = Card passed review, ready to move forward
- **Needs Revision** = Bounced back for changes
- **Blocked** = Exceeded max iteration limit
- **P0 - Must Have** = High priority
- **P1 - Should Have** = Medium priority
- **P2 - Nice to Have** = Low priority

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "board_config.json not found" | Run `python setup_board.py` |
| API key errors | Check `.env` file; verify values are correct |
| Cards not moving | Verify Claude Code has permissions in `.claude/settings.local.json` |
| Agent stuck in progress | Remove "In Progress" label manually; increase `MAX_ITERATIONS_PER_CARD` |
| Spec looks wrong | Read comments on card; move back to Spec Write with feedback |

---

## File Structure

```
TrelloAgents/
├── README.md                 ← Start here (overview)
├── docs/INSTALLATION.md      ← Setup instructions
├── docs/USER_GUIDE.md        ← How to use
├── docs/CLAUDE_ORCHESTRATION.md  ← Claude Code integration
├── docs/QUICK_REFERENCE.md   ← This file
│
├── .env.example              ← Copy & fill with your keys
├── .claude/settings.local.example.json  ← Copy to .claude/
│
├── setup_board.py            ← Create Trello board (run once)
├── trello_ops.py             ← CLI for Trello operations
├── trello_client.py          ← Trello API wrapper
│
├── agents/                   ← AI agent prompts
│   ├── intake_analyst.md
│   ├── feature_decomposer.md
│   ├── spec_writer.md
│   ├── spec_reviewer.md
│   ├── prd_assembler.md
│   └── final_reviewer.md
│
└── artifacts/                ← Generated specs & PRDs (git-ignored)
```

---

## Next Steps

1. **Install** — Follow INSTALLATION.md
2. **Try it** — Submit a simple idea
3. **Process it** — Let Claude Code run the pipeline
4. **Review** — Check the Trello board and final PRD
5. **Iterate** — Customize agent prompts in `agents/`

---

## Need Help?

- **Installation issues?** → INSTALLATION.md
- **How to use?** → USER_GUIDE.md
- **Claude Code setup?** → CLAUDE_ORCHESTRATION.md
- **Understanding the system?** → DISTRIBUTION_README.md

---

**Ready to build?** Start with: `python setup_board.py`

Created for AIMM members — April 2026
