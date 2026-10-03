# Installation & Setup Guide

A step-by-step guide to getting TrelloAgents up and running in 30 minutes.

## Prerequisites

You need four things installed before starting. Check each one below.

---

### 1. Python 3.9+

**Check if you have it:**
```bash
python3 --version
```
Should show `Python 3.9.x` or higher. If you get "command not found", install it:

- **macOS**: Download from [python.org/downloads](https://www.python.org/downloads/) and run the installer. Or with Homebrew: `brew install python3`
- **Windows**: Download from [python.org/downloads](https://www.python.org/downloads/). During install, check **"Add Python to PATH"**.
- **Linux (Ubuntu/Debian)**: `sudo apt update && sudo apt install python3 python3-pip`
- **Linux (RHEL/CentOS)**: `sudo yum install python3`

After installing, verify: `python3 --version`

---

### 2. curl

The system uses `curl` to communicate with the Trello API. Check if it's installed:

```bash
curl --version
```

Should show `curl 7.x.x` or higher.

- **macOS**: Pre-installed. If missing: `brew install curl`
- **Linux**: Usually pre-installed. If missing: `sudo apt install curl` or `sudo yum install curl`
- **Windows**: Available in Windows 10 (build 1803+) and Windows 11. Open PowerShell and run `curl --version`. If missing, download from [curl.se/windows](https://curl.se/windows/) and add to PATH.

---

### 3. Claude Code

Claude Code is the AI orchestrator that drives the pipeline. Install it via npm:

```bash
npm install -g @anthropic-ai/claude-code
```

If you don't have npm, install Node.js first from [nodejs.org](https://nodejs.org) (choose the LTS version — it includes npm).

Verify Claude Code is installed:
```bash
claude --version
```

Then sign in: `claude` (follow the browser-based auth flow).

For full setup instructions, see the [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code).

---

### 4. Accounts

- **Trello account** — free tier works fine: [trello.com](https://trello.com)
- **Anthropic API account** — you need API access (not just Claude.ai): [console.anthropic.com](https://console.anthropic.com)

---

Once all four are in place, continue below.

---

## Step 1: Get Your API Keys

### 1a. Trello API Key and Token

1. Go to [https://trello.com/power-ups/admin](https://trello.com/power-ups/admin)
2. Click **"Create a Power-Up"** (or use existing if you have one)
3. Go to the **API** tab
4. **Generate API Key** — Copy the key shown in blue
5. Click the **Token** link → "Allow" → Copy the token

You now have:
- `TRELLO_API_KEY` (the blue key from step 4)
- `TRELLO_API_TOKEN` (from the token link)

**Keep these safe** — treat them like passwords.

### 1b. Anthropic API Key

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign in with your account
3. Click **API Keys** in the left sidebar
4. Click **Create Key**
5. Copy the key (it starts with `sk-ant-`)

You now have:
- `ANTHROPIC_API_KEY`

**Keep this safe** — it's your API credential.

---

## Step 2: Download and Set Up the Project

### 2a. Clone or Download

**If you received a ZIP file** (most common for AIMM members):
- Unzip the file
- Open Terminal (macOS/Linux) or PowerShell (Windows) and navigate to the folder:
```bash
cd /path/to/TrelloAgents
```

**If you're cloning from Git:**
```bash
git clone <repo-url>
cd TrelloAgents
```

### 2b. Create Your `.env` File

```bash
# Copy the template
cp .env.example .env

# Open in your editor and fill in your keys
# macOS / Linux:
nano .env

# Windows (PowerShell):
notepad .env
```

Edit `.env` to include your API keys:

```
# Trello API credentials (from Step 1a)
TRELLO_API_KEY=your_trello_api_key_here
TRELLO_API_TOKEN=your_trello_api_token_here

# Anthropic API key (from Step 1b)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Model selection (optional — default is fine)
ANTHROPIC_MODEL=claude-sonnet-4-6

# Runtime settings (optional — defaults work fine)
MAX_ITERATIONS_PER_CARD=5
POLL_INTERVAL_SECONDS=10
LOG_LEVEL=INFO
```

**Save the file.** Do NOT commit `.env` to git — it's already in `.gitignore`.

### 2c. Verify Keys Are Loaded

```bash
python -c "from dotenv import load_dotenv; import os; load_dotenv(); \
print('✓ TRELLO_API_KEY:', bool(os.getenv('TRELLO_API_KEY'))); \
print('✓ TRELLO_API_TOKEN:', bool(os.getenv('TRELLO_API_TOKEN'))); \
print('✓ ANTHROPIC_API_KEY:', bool(os.getenv('ANTHROPIC_API_KEY')))"
```

Should print:
```
✓ TRELLO_API_KEY: True
✓ TRELLO_API_TOKEN: True
✓ ANTHROPIC_API_KEY: True
```

If any show `False`, double-check your `.env` file.

---

## Step 3: Install Python Dependencies

```bash
# Install required packages
pip install anthropic python-dotenv
```

Verify installation:
```bash
python -c "import anthropic, dotenv; print('✓ All dependencies installed')"
```

Should print: `✓ All dependencies installed`

---

## Step 4: Create Your Trello Board

This creates a new Trello board with all pipeline stages.

```bash
python setup_board.py
```

You'll see output like:
```
Creating board 'TrelloAgents Pipeline'...
✓ Board created: https://trello.com/b/abc123/trelloa...
✓ Config saved to board_config.json

Board stages:
  - Intake
  - Decompose
  - Spec Write
  - Spec Review
  - Assemble
  - Final Review
  - Done
```

**Optional: Create with a custom name**
```bash
python setup_board.py --name "My Product Ideas"
```

Go check your Trello board — it should now have 7 columns!

---

## Step 5: Verify Everything Works

### 5a. Check Board Status

```bash
python trello_ops.py status
```

Should output:
```json
{
  "Intake": 0,
  "Decompose": 0,
  "Spec Write": 0,
  "Spec Review": 0,
  "Assemble": 0,
  "Final Review": 0,
  "Done": 0,
  "board_url": "https://trello.com/b/abc123/..."
}
```

### 5b. Submit a Test Idea

```bash
python trello_ops.py submit "A mobile app that helps users track their daily reading"
```

Go check your Trello board — you should see a new card in **Intake** with the title "A mobile app that helps users track their daily reading".

### 5c. Verify Anthropic API Works

```bash
python -c "import anthropic; client = anthropic.Anthropic(); \
message = client.messages.create(model='claude-haiku-4-5-20251001', max_tokens=100, \
messages=[{'role': 'user', 'content': 'Say hello'}]); \
print('✓ Anthropic API working:', message.content[0].text[:50])"
```

Should print something like: `✓ Anthropic API working: Hello! How can I help you today?`

---

## Step 6: Set Up Claude Code (Optional but Recommended)

To let Claude Code orchestrate the pipeline, you need to give it permissions.

### 6a. Create `.claude/settings.local.json`

Claude Code looks for a `settings.local.json` file in the `.claude/` folder to allow certain commands.

```bash
# The .claude/ directory is already included in this package.
# Just copy the example template:
cp .claude/settings.local.example.json .claude/settings.local.json
```

This creates your `settings.local.json` from the included template:

```json
{
  "permissions": {
    "allow": [
      "Bash(python3 trello_ops.py status)",
      "Bash(python3 trello_ops.py cards *)",
      "Bash(python3 trello_ops.py card_detail *)",
      "Bash(python3 trello_ops.py comments *)",
      "Bash(python3 trello_ops.py move *)",
      "Bash(python3 trello_ops.py comment *)",
      "Bash(python3 trello_ops.py add_label *)",
      "Bash(python3 trello_ops.py remove_label *)",
      "Bash(python3 trello_ops.py attach *)",
      "Bash(python3 trello_ops.py submit *)",
      "Bash(python3 trello_ops.py create *)",
      "Bash(python3 trello_ops.py find_idea_brief *)",
      "Bash(python3 trello_ops.py approved_specs *)",
      "Read(./agents/*.md)",
      "Read(./CLAUDE.md)"
    ]
  }
}
```

This tells Claude Code which commands it's allowed to run.

### 6b. Test Claude Code Integration

In Claude Code (Cowork mode), run:

```
Check the board status for me.
```

Claude Code should run `python3 trello_ops.py status` and show you the board state.

---

## Troubleshooting Installation

### "curl: command not found" or API calls failing silently
The system uses curl for all Trello API calls. Install it following the Prerequisites section, then verify with `curl --version`.

### Python Not Found
Install Python 3.9+ following the steps in the Prerequisites section above. Then use `python3` explicitly:
```bash
python3 -m pip install anthropic python-dotenv
python3 setup_board.py
```

### "ModuleNotFoundError: No module named 'anthropic'" or similar
Dependencies weren't installed. Run:
```bash
pip install --upgrade pip
pip install anthropic python-dotenv
```

### "board_config.json not found"
You haven't run `setup_board.py` yet. Do that now:
```bash
python setup_board.py
```

### "TRELLO_API_KEY/TOKEN not set"
Your `.env` file isn't being read. Check:
1. The `.env` file exists in the project root
2. It has the correct keys (with `TRELLO_API_KEY=` not `TRELLO_API_KEY =`)
3. There are no quotes around values (unless they contain spaces)

### "API request failed: 401 Unauthorized"
Your Trello API key or token is wrong. Go back to Trello and re-generate them.

### "API request failed: 429 Too Many Requests"
You're hitting Trello's rate limit. Wait a few seconds and try again. Adjust `POLL_INTERVAL_SECONDS` in `.env` to a higher value.

### Claude Code Can't Run Commands
Check that `.claude/settings.local.json` exists and has the right permissions.

---

## Model Selection (Optional)

By default, the system uses `claude-sonnet-4-6`. You can change it in `.env`:

**For Faster, Cheaper Results:**
```bash
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

**For Better Quality (Slower, More Expensive):**
```bash
ANTHROPIC_MODEL=claude-opus-4-7
```

Check [console.anthropic.com](https://console.anthropic.com) for available models.

---

## Next Steps

✓ You're installed and ready!

1. **Try it out** — Submit a test idea: `python trello_ops.py submit "A fitness tracking app"`
2. **Read the USER_GUIDE.md** — Learn how to use the system
3. **Check your agents** — Review the prompts in `agents/` to understand each stage
4. **Set up Claude Code orchestration** — Read CLAUDE.md to let AI drive the pipeline

---

## Quick Reference

```bash
# Check board status
python trello_ops.py status

# Submit a new idea
python trello_ops.py submit "Your idea here"

# See cards in a stage
python trello_ops.py cards "Spec Write"

# Add a comment to a card
python trello_ops.py comment <card_id> "Your feedback"

# View full card details
python trello_ops.py card_detail <card_id>

# Clear the entire board (warning: destructive)
python trello_ops.py delete_all
```

---

**Ready to go?** Head to the [USER_GUIDE.md](USER_GUIDE.md) to start using the system.
