"""
Board Setup
============
Creates a Trello board with the proper lists (stages) and labels
for the agentic workflow. Saves board config to board_config.json.

Usage:
    python setup_board.py
    python setup_board.py --name "My Product Pipeline"
"""

import asyncio
import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from trello_client import TrelloClient

load_dotenv()

# Workflow stages in order (these become Trello lists)
STAGES = [
    "Intake",
    "Decompose",
    "Spec Write",
    "Spec Review",
    "Assemble",
    "Final Review",
    "Done",
]

# Labels for card status
LABELS = [
    {"name": "P0 - Must Have", "color": "red"},
    {"name": "P1 - Should Have", "color": "orange"},
    {"name": "P2 - Nice to Have", "color": "yellow"},
    {"name": "Needs Revision", "color": "purple"},
    {"name": "Blocked", "color": "black"},
    {"name": "Approved", "color": "green"},
    {"name": "In Progress", "color": "blue"},
]

CONFIG_FILE = Path(__file__).parent / "board_config.json"


async def setup_board(board_name: str) -> dict:
    """Create the board, lists, and labels. Return config."""
    api_key = os.getenv("TRELLO_API_KEY")
    api_token = os.getenv("TRELLO_API_TOKEN")

    if not api_key or not api_token:
        print("ERROR: Set TRELLO_API_KEY and TRELLO_API_TOKEN in .env")
        sys.exit(1)

    client = TrelloClient(api_key, api_token)

    try:
        # Create board
        print(f"Creating board: {board_name}")
        board = await client.create_board(
            name=board_name,
            desc="Agentic product development pipeline. Cards flow left-to-right through AI agents.",
        )
        board_id = board["id"]
        print(f"  Board ID: {board_id}")
        print(f"  URL: {board['url']}")

        # Create lists in forward order; pos="bottom" appends each to the right
        list_ids = {}
        for stage in STAGES:
            lst = await client.create_list(board_id, stage)
            list_ids[stage] = lst["id"]
            print(f"  Created list: {stage} ({lst['id']})")

        # Create labels
        label_ids = {}
        for label_def in LABELS:
            label = await client.create_label(board_id, label_def["name"], label_def["color"])
            label_ids[label_def["name"]] = label["id"]
            print(f"  Created label: {label_def['name']} ({label['id']})")

        # Save config
        config = {
            "board_id": board_id,
            "board_url": board["url"],
            "list_ids": list_ids,
            "label_ids": label_ids,
            "stages": STAGES,
        }

        CONFIG_FILE.write_text(json.dumps(config, indent=2))
        print(f"\nConfig saved to {CONFIG_FILE}")
        print(f"\nBoard ready: {board['url']}")

        return config

    finally:
        await client.close()


def main():
    parser = argparse.ArgumentParser(description="Set up the Trello workflow board")
    parser.add_argument(
        "--name",
        default="Agentic PRD Pipeline",
        help="Board name (default: 'Agentic PRD Pipeline')",
    )
    args = parser.parse_args()
    asyncio.run(setup_board(args.name))


if __name__ == "__main__":
    main()
