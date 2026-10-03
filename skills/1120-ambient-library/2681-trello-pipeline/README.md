# TrelloAgents: AI-Powered Product Development Pipeline

**For AIMM Members — Product Development Automation Toolkit**

A production-ready, AI-powered system that transforms product ideas into complete PRDs through an autonomous, stage-based pipeline. Built for product leaders and teams who want to accelerate ideation-to-specification cycles using Claude AI.

## What This Is

TrelloAgents is a **Trello-based agentic workflow** that:

- Takes a raw product idea
- Breaks it into concrete features via AI decomposition
- Writes detailed feature specifications using Claude
- Reviews specifications for quality and alignment
- Assembles everything into a professional PRD
- All while maintaining a real-time visual dashboard on your Trello board

**The key innovation**: Your Trello board becomes both your state engine AND your status dashboard. Every card movement, label, and artifact is visible in real-time.

## Who Should Use This

- **Product managers** looking to automate spec generation
- **Product teams** that want consistent, structured specifications
- **Startup founders** bootstrapping product documentation quickly
- **AIMM members** exploring AI-native product development workflows
- **Anyone** who wants to see AI agents work together on meaningful work

## What You Get

```
Product Idea
    ↓ (Claude: Intake Analyst)
Idea Brief (structured problem statement)
    ↓ (Claude: Feature Decomposer)
Feature Cards (one per capability)
    ↓ (Claude: Spec Writers, in parallel)
Feature Specifications
    ↓ (Claude: Spec Reviewers, in parallel)
Approved Specs
    ↓ (Claude: PRD Assembler)
Unified Product Requirements Document
    ↓ (Claude: Final Reviewer)
✓ Production-Ready PRD on your original card
```

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    YOUR TRELLO BOARD                     │
│                                                          │
│ Intake → Decompose → Spec Write → Spec Review →         │
│ Assemble → Final Review → Done                           │
│                                                          │
│ (Visual pipeline, real-time card updates)                │
└──────────────┬───────────────────────────────────────────┘
               │
               ↓
         ┌─────────────┐
         │ Claude Code │  (You — the orchestrator)
         │  (Cowork)   │
         │             │
         │ • Read board│
         │ • Spawn AI  │
         │ • Attach    │
         │   outputs   │
         │ • Move      │
         │   cards     │
         └─────────────┘
               │
               ↓
      ┌────────────────┐
      │  Agent Team    │
      │  (6 roles)     │
      │                │
      │ • Intake       │
      │ • Decomposer   │
      │ • Spec Writers │
      │ • Reviewers    │
      │ • Assembler    │
      │ • Final Rev.   │
      └────────────────┘
```

## Pipeline Stages Explained

| Stage | Role | Does | Output |
|-------|------|------|--------|
| **Intake** | Intake Analyst | Structures raw idea into a problem statement, audience, value prop, success criteria | Idea Brief (attached) |
| **Decompose** | Feature Decomposer | Breaks idea into 3-7 concrete features | N cards in Spec Write |
| **Spec Write** | Spec Writers (parallel) | Writes detailed spec for each feature | Feature Spec (attached per card) |
| **Spec Review** | Spec Reviewers (parallel) | Checks alignment, clarity, feasibility | Comment with approval or feedback |
| **Assemble** | PRD Assembler | Merges all approved specs + intro | Unified PRD (attached to idea) |
| **Final Review** | Final Reviewer | Final proofread + polish | Approval comment or revisions |
| **Done** | — | Terminal | PRD ready to ship |

## Quick Start

### 1. Install & Configure (15 min)

```bash
# Clone or download this repo
cd TrelloAgents

# Install dependencies
pip install anthropic python-dotenv

# Copy template and fill in your API keys
cp .env.example .env
# Edit .env with your Trello and Anthropic keys
```

See **docs/INSTALLATION.md** for detailed setup.

### 2. Create Your Trello Board (5 min)

```bash
python setup_board.py
# or with a custom name:
python setup_board.py --name "My Product Ideas"
```

This creates a board with all pipeline stages and saves config to `board_config.json`.

### 3. Submit an Idea

```bash
python trello_ops.py submit "A mobile app that helps busy parents meal-plan for the week"
```

Your idea appears in the Intake column on your Trello board.

### 4. Let Claude Code Drive the Pipeline

Open Claude Code (Cowork mode) and tell it to process the pipeline:

> "Process the TrelloAgents pipeline. Read board status, process any cards in Intake, and keep the board moving through the stages."

Claude Code will:
- Read the board
- Add "In Progress" label
- Spawn Claude agents for each stage
- Attach outputs as files
- Update labels and move cards
- Keep going until the PRD is done

### 5. Watch Your Trello Board Light Up

Check your Trello board in real-time. You'll see:
- Cards flowing through stages
- Labels indicating status (In Progress, Approved, Needs Revision)
- Attachments with specs, briefs, and the final PRD
- Comments with review feedback and decisions

## Key Features

✓ **Fully Autonomous** — Once you submit an idea, Claude Code orchestrates the entire pipeline
✓ **Parallel Processing** — Spec writers and reviewers work on multiple features simultaneously
✓ **Review-Driven** — Cards bounce back with feedback; you can refine specs without restarting
✓ **Production Output** — PRDs are human-readable, professional-grade documents
✓ **Real-Time Dashboard** — Your Trello board is the source of truth; no separate logs
✓ **Modular Agents** — Each stage is an independent Claude agent; easy to customize
✓ **No Code Required** — Submit ideas via CLI; let Claude Code orchestrate everything
✓ **Built for Scale** — Handle multiple ideas in parallel without conflicts

## File Structure

```
TrelloAgents/
├── README.md                    ← You are here
├── CLAUDE.md                    ← Auto-read by Claude Code (orchestration instructions)
├── .env.example                 ← Template environment variables
├── .claude/
│   └── settings.local.example.json  ← Template permissions
│
├── setup_board.py               ← Creates Trello board (run once)
├── trello_ops.py                ← CLI for all Trello operations
├── trello_client.py             ← Async Trello API wrapper
│
├── agents/                      ← AI agent system prompts
│   ├── intake_analyst.md
│   ├── feature_decomposer.md
│   ├── spec_writer.md
│   ├── spec_reviewer.md
│   ├── prd_assembler.md
│   └── final_reviewer.md
│
├── docs/                        ← All documentation
│   ├── INSTALLATION.md          ← Start here for setup
│   ├── USER_GUIDE.md
│   ├── CLAUDE_ORCHESTRATION.md
│   ├── QUICK_REFERENCE.md
│   ├── AIMM_TEACHING_BLOCK.md   ← Architecture deep-dive
│   └── MANIFEST.md
│
└── artifacts/                   ← Generated specs & PRDs (created on use)
    └── idea-{id}_*.md
```

## Configuration

All configuration lives in `.env`:

```bash
# Trello API
TRELLO_API_KEY=your_key           # From https://trello.com/power-ups/admin
TRELLO_API_TOKEN=your_token       # From Trello API dashboard

# Anthropic API
ANTHROPIC_API_KEY=your_key        # From https://console.anthropic.com/

# Model selection
ANTHROPIC_MODEL=claude-sonnet-4-6  # Or claude-opus-4-7, etc.

# Runtime tuning
MAX_ITERATIONS_PER_CARD=5         # Max bouncebacks before blocking card
POLL_INTERVAL_SECONDS=10          # Orchestrator cycle speed
LOG_LEVEL=INFO                    # DEBUG, INFO, WARNING, ERROR
```

## Common Commands

```bash
# Check board status (card counts per stage)
python trello_ops.py status

# List all cards in a stage
python trello_ops.py cards "Spec Write"

# Get full card details (including attachments)
python trello_ops.py card_detail <card_id>

# Get card comments
python trello_ops.py comments <card_id>

# Move a card to a different stage
python trello_ops.py move <card_id> "Spec Review"

# Add a comment
python trello_ops.py comment <card_id> "Looks good, moving to review"

# Add a label
python trello_ops.py add_label <card_id> "Approved"

# Remove a label
python trello_ops.py remove_label <card_id> "In Progress"

# Attach a file to a card
python trello_ops.py attach <card_id> /path/to/file.md

# Submit a new idea
python trello_ops.py submit "Your product idea here"

# Clear the board (DESTRUCTIVE)
python trello_ops.py delete_all
```

## Using Claude Code as Orchestrator

Claude Code (in Cowork mode) is your orchestrator. Here's the workflow:

### Option A: Let It Run Autonomously

```
You: "Process the TrelloAgents pipeline. Keep going until Done."

Claude Code:
1. Reads board status
2. Finds cards in Intake
3. Spawns Intake Analyst agent
4. Waits for output, attaches to card
5. Moves card to Decompose
6. Repeats for next stage...
```

### Option B: Manual Step-by-Step

```
You: "Show me the board status"
Claude Code: [Lists cards by stage]

You: "Process the Intake card"
Claude Code: [Spawns agent, attaches output, moves card]

You: "Process the Decompose stage"
Claude Code: [Creates feature cards]

etc.
```

### Option C: Set Up Scheduled Runs

Use Claude Code's scheduling to process the pipeline on a timer:

```
You: "Create a scheduled task that processes the pipeline every hour"
Claude Code: [Sets up recurring execution]
```

## Customization

### Change Agent Behavior

Edit the files in `agents/`:

```bash
# Customize the spec writer's style
vim agents/spec_writer.md
# Then tell Claude Code to use the new version
```

### Add Custom Stages

1. Add a new list to your board
2. Update `board_config.json` with the new stage
3. Create a new agent prompt in `agents/`
4. Tell Claude Code to handle the new stage

### Modify Board Labels

Edit the labels in `setup_board.py` and re-run, or manage labels directly in Trello.

## Troubleshooting

### "board_config.json not found"
Run `python setup_board.py` to initialize your board and config.

### API Key Errors
Check your `.env` file:
```bash
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print('Keys loaded:', bool(os.getenv('TRELLO_API_KEY')))"
```

### Cards Not Moving
Check the board status:
```bash
python trello_ops.py status
```
Verify the stage name matches exactly (case-sensitive).

### Agent Seems Stuck
Check the card's comments and "In Progress" label. If in progress for > 5 iterations, the card gets blocked. Clear the label manually or increase `MAX_ITERATIONS_PER_CARD` in `.env`.

### PRD Looks Wrong
Review the comments on each spec card to see feedback. You can manually edit attachments or bounce cards back to Spec Write for revision.

## Best Practices

1. **Start Small** — Try a simple idea first (e.g., "A habit tracker app")
2. **Review Intermediate Specs** — Check feature specs before the assembler runs; comment with feedback
3. **Use Priority Labels** — Tag cards with P0/P1/P2 to signal importance to the PRD assembler
4. **Reuse Approved Specs** — Copy good specs as templates for new features
5. **Archive Completed Ideas** — Move done cards to a Done section to keep the board clean
6. **Batch Ideas** — Submit 3-5 ideas at once; let agents process them in parallel

## Performance Tuning

### Faster Turnaround
```bash
# Edit .env
POLL_INTERVAL_SECONDS=5          # Check board every 5 seconds
ANTHROPIC_MODEL=claude-haiku...  # Faster, cheaper model
```

### Better Quality
```bash
ANTHROPIC_MODEL=claude-opus-4-7  # Slower, more thorough
MAX_ITERATIONS_PER_CARD=10       # Allow more refinement
```

## What's Next?

- Submit your first idea and watch it flow through the pipeline
- Review the generated PRD; compare to what you'd manually write
- Customize agent prompts in `agents/` to match your product style
- Integrate with your existing tools (Slack notifications, GitHub issues, etc.)
- Use this as a foundation for your own agentic workflows

## Support & Feedback

This is a **toolkit for AIMM members**. Use it, break it, improve it, and share what you learn.

Questions? Check `docs/INSTALLATION.md` and `docs/USER_GUIDE.md`. Review the agent prompts in `agents/` to understand each stage.

---

**Happy building!**

*Created for AIMM members — April 2026*
