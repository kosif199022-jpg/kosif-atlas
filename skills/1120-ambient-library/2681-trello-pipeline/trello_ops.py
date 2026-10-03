"""
Trello Operations CLI
=====================
Simple CLI wrapper around TrelloClient for use by Claude Code orchestrator.
Outputs JSON to stdout for easy parsing.

Usage:
    python trello_ops.py status
    python trello_ops.py cards <stage>
    python trello_ops.py card_detail <card_id>
    python trello_ops.py comments <card_id>
    python trello_ops.py move <card_id> <stage>
    python trello_ops.py comment <card_id> <text>
    python trello_ops.py create <stage> <name> <desc_json>
    python trello_ops.py update_desc <card_id> <desc>
    python trello_ops.py add_label <card_id> <label_name>
    python trello_ops.py remove_label <card_id> <label_name>
    python trello_ops.py attach <card_id> <file_path>
    python trello_ops.py submit <idea_text>
    python trello_ops.py delete_all
"""

import asyncio
import json
import sys
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from trello_client import TrelloClient

load_dotenv()

CONFIG_FILE = Path(__file__).parent / "board_config.json"
METADATA_PREFIX = "<!-- workflow:"
METADATA_SUFFIX = " -->"


def load_config():
    if not CONFIG_FILE.exists():
        print(json.dumps({"error": "board_config.json not found"}))
        sys.exit(1)
    return json.loads(CONFIG_FILE.read_text())


def get_client():
    api_key = os.getenv("TRELLO_API_KEY")
    api_token = os.getenv("TRELLO_API_TOKEN")
    if not all([api_key, api_token]):
        print(json.dumps({"error": "TRELLO_API_KEY/TOKEN not set"}))
        sys.exit(1)
    return TrelloClient(api_key, api_token)


def get_metadata(desc):
    if METADATA_PREFIX in desc:
        start = desc.index(METADATA_PREFIX) + len(METADATA_PREFIX)
        end = desc.index(METADATA_SUFFIX, start)
        try:
            return json.loads(desc[start:end])
        except json.JSONDecodeError:
            return {}
    return {}


def set_metadata(desc, metadata):
    if METADATA_PREFIX in desc:
        start = desc.index(METADATA_PREFIX)
        end = desc.index(METADATA_SUFFIX, start) + len(METADATA_SUFFIX)
        desc = desc[:start].rstrip() + desc[end:]
    block = f"\n\n{METADATA_PREFIX}{json.dumps(metadata)}{METADATA_SUFFIX}"
    return desc.strip() + block


def clean_desc(desc):
    if METADATA_PREFIX in desc:
        start = desc.index(METADATA_PREFIX)
        return desc[:start].strip()
    return desc.strip()


async def cmd_status():
    config = load_config()
    client = get_client()
    try:
        counts = await client.count_cards_by_list(config["board_id"])
        result = {stage: counts.get(stage, 0) for stage in config["stages"]}
        result["board_url"] = config["board_url"]
        print(json.dumps(result))
    finally:
        await client.close()


async def cmd_cards(stage):
    config = load_config()
    client = get_client()
    try:
        list_id = config["list_ids"].get(stage)
        if not list_id:
            print(json.dumps({"error": f"Unknown stage: {stage}"}))
            return
        cards = await client.get_cards_in_list(list_id)
        result = []
        for c in cards:
            meta = get_metadata(c.get("desc", ""))
            result.append({
                "id": c["id"],
                "name": c["name"],
                "desc": clean_desc(c.get("desc", "")),
                "metadata": meta,
                "labels": [l["name"] for l in c.get("labels", [])],
            })
        print(json.dumps(result))
    finally:
        await client.close()


async def cmd_card_detail(card_id):
    config = load_config()
    client = get_client()
    try:
        card = await client.get_card(card_id)
        comments = await client.get_comments(card_id)
        meta = get_metadata(card.get("desc", ""))
        print(json.dumps({
            "id": card["id"],
            "name": card["name"],
            "desc": clean_desc(card.get("desc", "")),
            "metadata": meta,
            "labels": [l["name"] for l in card.get("labels", [])],
            "comments": comments,
        }))
    finally:
        await client.close()


async def cmd_comments(card_id):
    client = get_client()
    try:
        comments = await client.get_comments(card_id)
        print(json.dumps(comments))
    finally:
        await client.close()


async def cmd_move(card_id, stage):
    config = load_config()
    client = get_client()
    try:
        list_id = config["list_ids"].get(stage)
        if not list_id:
            print(json.dumps({"error": f"Unknown stage: {stage}"}))
            return
        await client.move_card(card_id, list_id)
        print(json.dumps({"ok": True, "moved_to": stage}))
    finally:
        await client.close()


async def cmd_comment(card_id, text):
    client = get_client()
    try:
        await client.add_comment(card_id, text)
        print(json.dumps({"ok": True}))
    finally:
        await client.close()


async def cmd_create(stage, name, desc_json):
    config = load_config()
    client = get_client()
    try:
        list_id = config["list_ids"].get(stage)
        if not list_id:
            print(json.dumps({"error": f"Unknown stage: {stage}"}))
            return
        desc = desc_json  # Already a string
        card = await client.create_card(list_id=list_id, name=name, desc=desc)
        print(json.dumps({"ok": True, "id": card["id"], "name": card["name"], "url": card.get("shortUrl", "")}))
    finally:
        await client.close()


async def cmd_update_desc(card_id, desc):
    client = get_client()
    try:
        await client.update_card(card_id, desc=desc)
        print(json.dumps({"ok": True}))
    finally:
        await client.close()


async def cmd_add_label(card_id, label_name):
    config = load_config()
    client = get_client()
    try:
        label_id = config.get("label_ids", {}).get(label_name)
        if not label_id:
            print(json.dumps({"error": f"Unknown label: {label_name}"}))
            return
        await client.add_label_to_card(card_id, label_id)
        print(json.dumps({"ok": True}))
    finally:
        await client.close()


async def cmd_remove_label(card_id, label_name):
    config = load_config()
    client = get_client()
    try:
        label_id = config.get("label_ids", {}).get(label_name)
        if not label_id:
            print(json.dumps({"error": f"Unknown label: {label_name}"}))
            return
        try:
            await client.remove_label_from_card(card_id, label_id)
        except Exception:
            pass  # Label might not be on card
        print(json.dumps({"ok": True}))
    finally:
        await client.close()


async def cmd_submit(idea_text):
    config = load_config()
    client = get_client()
    try:
        idea_id = f"idea-{int(time.time())}"
        metadata = {"idea_id": idea_id, "iteration": 0, "type": "idea"}
        desc = set_metadata(idea_text, metadata)
        card = await client.create_card(
            list_id=config["list_ids"]["Intake"],
            name=f"IDEA: {idea_text[:80]}...",
            desc=desc,
        )
        print(json.dumps({
            "ok": True,
            "card_id": card["id"],
            "idea_id": idea_id,
            "url": card.get("shortUrl", ""),
        }))
    finally:
        await client.close()


async def cmd_delete_all():
    config = load_config()
    client = get_client()
    try:
        cards = await client.get_all_cards_on_board(config["board_id"])
        for c in cards:
            await client._delete(f"/cards/{c['id']}")
        print(json.dumps({"ok": True, "deleted": len(cards)}))
    finally:
        await client.close()


async def cmd_attach(card_id, file_path):
    """Attach a file to a card, replacing any existing attachments."""
    client = get_client()
    try:
        result = await client.replace_attachment(card_id, file_path)
        print(json.dumps({"ok": True, "id": result.get("id", ""), "name": result.get("name", ""), "url": result.get("url", "")}))
    finally:
        await client.close()


async def cmd_find_idea_brief(idea_id):
    """Find the original idea brief for a given idea_id.

    Looks for the idea card's artifact attachment first, then falls back
    to comments and card description.
    """
    config = load_config()
    client = get_client()
    try:
        for stage in config["stages"]:
            list_id = config["list_ids"][stage]
            cards = await client.get_cards_in_list(list_id)
            for card in cards:
                meta = get_metadata(card.get("desc", ""))
                if meta.get("idea_id") == idea_id and meta.get("type") == "idea":
                    # Try attachment first (preferred artifact storage)
                    attachments = await client.get_attachments(card["id"])
                    for att in attachments:
                        if att.get("url"):
                            content = await client.download_attachment(att["url"])
                            if content:
                                print(json.dumps({"found": True, "brief": content, "source": "attachment"}))
                                return
                    # Fall back to comments (legacy)
                    comments = await client.get_comments(card["id"])
                    for c in comments:
                        if "## Problem Statement" in c["text"] or "## Core Value Proposition" in c["text"]:
                            print(json.dumps({"found": True, "brief": c["text"], "source": "comment"}))
                            return
                    print(json.dumps({"found": True, "brief": clean_desc(card.get("desc", "")), "source": "desc"}))
                    return
        print(json.dumps({"found": False}))
    finally:
        await client.close()


async def cmd_approved_specs(idea_id):
    """Find all approved feature specs for an idea_id in the Assemble list.

    Reads specs from card attachments first, then falls back to comments (legacy).
    """
    config = load_config()
    client = get_client()
    try:
        assemble_list_id = config["list_ids"]["Assemble"]
        cards = await client.get_cards_in_list(assemble_list_id)
        specs = []
        for card in cards:
            meta = get_metadata(card.get("desc", ""))
            if meta.get("idea_id") == idea_id and meta.get("type") == "feature":
                # Try attachment first (preferred artifact storage)
                attachments = await client.get_attachments(card["id"])
                spec_found = False
                for att in attachments:
                    if att.get("url"):
                        content = await client.download_attachment(att["url"])
                        if content:
                            specs.append({"card_id": card["id"], "name": card["name"], "spec": content, "source": "attachment"})
                            spec_found = True
                            break
                if not spec_found:
                    # Fall back to comments (legacy)
                    comments = await client.get_comments(card["id"])
                    for c in comments:
                        if "Feature Spec:" in c["text"] or "## 1. Overview" in c["text"]:
                            specs.append({"card_id": card["id"], "name": card["name"], "spec": c["text"], "source": "comment"})
                            spec_found = True
                            break
                if not spec_found:
                    specs.append({"card_id": card["id"], "name": card["name"], "spec": clean_desc(card.get("desc", "")), "source": "desc"})
        print(json.dumps(specs))
    finally:
        await client.close()


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python trello_ops.py <command> [args]"}))
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "status":
        asyncio.run(cmd_status())
    elif cmd == "cards":
        asyncio.run(cmd_cards(sys.argv[2]))
    elif cmd == "card_detail":
        asyncio.run(cmd_card_detail(sys.argv[2]))
    elif cmd == "comments":
        asyncio.run(cmd_comments(sys.argv[2]))
    elif cmd == "move":
        asyncio.run(cmd_move(sys.argv[2], sys.argv[3]))
    elif cmd == "comment":
        asyncio.run(cmd_comment(sys.argv[2], sys.argv[3]))
    elif cmd == "create":
        asyncio.run(cmd_create(sys.argv[2], sys.argv[3], sys.argv[4]))
    elif cmd == "update_desc":
        asyncio.run(cmd_update_desc(sys.argv[2], sys.argv[3]))
    elif cmd == "add_label":
        asyncio.run(cmd_add_label(sys.argv[2], sys.argv[3]))
    elif cmd == "remove_label":
        asyncio.run(cmd_remove_label(sys.argv[2], sys.argv[3]))
    elif cmd == "submit":
        asyncio.run(cmd_submit(sys.argv[2]))
    elif cmd == "delete_all":
        asyncio.run(cmd_delete_all())
    elif cmd == "find_idea_brief":
        asyncio.run(cmd_find_idea_brief(sys.argv[2]))
    elif cmd == "attach":
        asyncio.run(cmd_attach(sys.argv[2], sys.argv[3]))
    elif cmd == "approved_specs":
        asyncio.run(cmd_approved_specs(sys.argv[2]))
    else:
        print(json.dumps({"error": f"Unknown command: {cmd}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
