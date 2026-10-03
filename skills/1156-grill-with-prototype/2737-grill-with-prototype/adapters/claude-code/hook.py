#!/usr/bin/env python3
"""Claude Code hook: deliver pending dashboard events to the agent.

Usage (from settings.json): python3 <APP>/adapters/claude-code/hook.py
Reads the hook JSON on stdin, drains <APP>/runtime/queue/inbox.jsonl, and:
  UserPromptSubmit → prints the events as additional context
  Stop             → blocks the stop with the events as the reason
No pending events → exits 0 silently.
"""
import json
import sys
from pathlib import Path

APP = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(APP / "bridge"))
import bridge  # noqa: E402


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        payload = {}
    event = payload.get("hook_event_name", "")
    events = bridge.drain()
    if not events:
        return 0
    text = (f"Dashboard events from {APP.name} (already drained; handle them now):\n"
            + json.dumps(events, indent=2))
    if event == "Stop":
        print(json.dumps({"decision": "block", "reason": text}))
    else:
        print(json.dumps({"hookSpecificOutput": {"hookEventName": event or "UserPromptSubmit", "additionalContext": text}}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
