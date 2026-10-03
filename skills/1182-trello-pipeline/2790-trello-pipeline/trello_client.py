"""
Trello API Client
=================
Thin wrapper around Trello's REST API using curl subprocesses.
Handles auth, CRUD for boards/lists/cards, and card movement.
"""

import asyncio
import json
import logging
from typing import Optional, Union, List, Dict
from urllib.parse import urlencode

logger = logging.getLogger(__name__)

BASE_URL = "https://api.trello.com/1"


class TrelloClient:
    """Async Trello API client using curl."""

    def __init__(self, api_key: str, api_token: str):
        self.auth_params = {"key": api_key, "token": api_token}

    async def close(self):
        pass  # No persistent connection to close with curl

    # ── Generic request helpers ──────────────────────────────────────────

    async def _curl(
        self,
        method: str,
        path: str,
        params: Optional[Dict] = None,
        json_body: Optional[Dict] = None,
    ) -> Union[Dict, List]:
        """Execute a curl request and return parsed JSON."""
        all_params = {**(params or {}), **self.auth_params}
        url = f"{BASE_URL}{path}?{urlencode(all_params)}"

        cmd = ["curl", "-s", "-f", "-X", method, url]
        if json_body is not None:
            cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(json_body)]

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode != 0:
            err = stderr.decode().strip()
            raise RuntimeError(f"curl {method} {path} failed (rc={proc.returncode}): {err}")

        return json.loads(stdout.decode())

    async def _get(self, path: str, params: Optional[Dict] = None) -> Union[Dict, List]:
        return await self._curl("GET", path, params=params)

    async def _post(self, path: str, params: Optional[Dict] = None, json_body: Optional[Dict] = None) -> Dict:
        return await self._curl("POST", path, params=params, json_body=json_body)

    async def _put(self, path: str, json_body: Optional[Dict] = None) -> Dict:
        return await self._curl("PUT", path, json_body=json_body)

    async def _delete(self, path: str) -> Dict:
        return await self._curl("DELETE", path)

    async def _post_file(self, path: str, file_path: str, mime_type: str = "text/markdown") -> Dict:
        """Upload a file via multipart/form-data using curl."""
        all_params = {**self.auth_params}
        url = f"{BASE_URL}{path}?{urlencode(all_params)}"
        cmd = [
            "curl", "-s", "-f", "-X", "POST", url,
            "-F", f"file=@{file_path};type={mime_type}",
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        if proc.returncode != 0:
            err = stderr.decode().strip()
            raise RuntimeError(f"curl POST {path} file upload failed (rc={proc.returncode}): {err}")
        return json.loads(stdout.decode())

    # ── Board operations ─────────────────────────────────────────────────

    async def create_board(self, name: str, desc: str = "") -> Dict:
        """Create a new Trello board."""
        return await self._post("/boards", params={"name": name, "desc": desc, "defaultLists": "false"})

    async def get_board(self, board_id: str) -> Dict:
        return await self._get(f"/boards/{board_id}")

    # ── List operations ──────────────────────────────────────────────────

    async def create_list(self, board_id: str, name: str, pos: str = "bottom") -> Dict:
        """Create a list on a board."""
        return await self._post("/lists", params={"name": name, "idBoard": board_id, "pos": pos})

    async def get_lists(self, board_id: str) -> List[Dict]:
        """Get all lists on a board, ordered by position."""
        return await self._get(f"/boards/{board_id}/lists", {"filter": "open"})

    # ── Card operations ──────────────────────────────────────────────────

    async def create_card(
        self,
        list_id: str,
        name: str,
        desc: str = "",
        labels: Optional[List[str]] = None,
        pos: str = "bottom",
    ) -> Dict:
        """Create a card in a list."""
        body = {"idList": list_id, "name": name, "desc": desc, "pos": pos}
        if labels:
            body["idLabels"] = ",".join(labels)
        return await self._post("/cards", json_body=body)

    async def get_card(self, card_id: str) -> Dict:
        """Get a card by ID, including custom fields."""
        return await self._get(f"/cards/{card_id}", {"fields": "all"})

    async def get_cards_in_list(self, list_id: str) -> List[Dict]:
        """Get all cards in a list."""
        return await self._get(f"/lists/{list_id}/cards")

    async def update_card(self, card_id: str, **fields) -> Dict:
        """Update card fields (name, desc, idList, etc.)."""
        return await self._put(f"/cards/{card_id}", json_body=fields)

    async def move_card(self, card_id: str, target_list_id: str, pos: str = "bottom") -> Dict:
        """Move a card to a different list."""
        return await self._put(f"/cards/{card_id}", json_body={"idList": target_list_id, "pos": pos})

    async def add_comment(self, card_id: str, text: str) -> Dict:
        """Add a comment to a card."""
        return await self._post(f"/cards/{card_id}/actions/comments", json_body={"text": text})

    async def get_comments(self, card_id: str, limit: int = 50) -> List[Dict]:
        """Get comments on a card (most recent first)."""
        actions = await self._get(
            f"/cards/{card_id}/actions", {"filter": "commentCard", "limit": limit}
        )
        return [
            {
                "id": a["id"],
                "text": a["data"]["text"],
                "date": a["date"],
            }
            for a in actions
        ]

    # ── Attachment operations ──────────────────────────────────────────────

    async def get_attachments(self, card_id: str) -> List[Dict]:
        """List all attachments on a card."""
        return await self._get(f"/cards/{card_id}/attachments")

    async def delete_attachment(self, card_id: str, attachment_id: str) -> None:
        """Delete an attachment from a card."""
        await self._delete(f"/cards/{card_id}/attachments/{attachment_id}")

    async def download_attachment(self, url: str) -> Optional[str]:
        """Download an attachment's content as text. Returns None on failure."""
        all_params = {**self.auth_params}
        full_url = f"{url}?{urlencode(all_params)}" if "?" not in url else f"{url}&{urlencode(all_params)}"
        cmd = ["curl", "-s", "-f", "-L", full_url]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        if proc.returncode != 0:
            return None
        return stdout.decode()

    async def replace_attachment(self, card_id: str, file_path: str, mime_type: str = "text/markdown") -> Dict:
        """Replace all attachments on a card with a single new file."""
        existing = await self.get_attachments(card_id)
        for att in existing:
            await self.delete_attachment(card_id, att["id"])
        return await self._post_file(f"/cards/{card_id}/attachments", file_path, mime_type)

    # ── Label operations ─────────────────────────────────────────────────

    async def create_label(self, board_id: str, name: str, color: str) -> Dict:
        """Create a label on a board."""
        return await self._post(f"/boards/{board_id}/labels", params={"name": name, "color": color})

    async def add_label_to_card(self, card_id: str, label_id: str) -> None:
        """Add a label to a card."""
        await self._post(f"/cards/{card_id}/idLabels", params={"value": label_id})

    async def remove_label_from_card(self, card_id: str, label_id: str) -> None:
        """Remove a label from a card."""
        await self._delete(f"/cards/{card_id}/idLabels/{label_id}")

    async def get_labels(self, board_id: str) -> List[Dict]:
        """Get all labels on a board."""
        return await self._get(f"/boards/{board_id}/labels")

    # ── Batch helpers ────────────────────────────────────────────────────

    async def get_all_cards_on_board(self, board_id: str) -> List[Dict]:
        """Get every card on a board with list info."""
        return await self._get(f"/boards/{board_id}/cards", {"fields": "all"})

    async def count_cards_by_list(self, board_id: str) -> Dict[str, int]:
        """Return {list_name: card_count} for the board."""
        lists = await self.get_lists(board_id)
        counts = {}
        for lst in lists:
            cards = await self.get_cards_in_list(lst["id"])
            counts[lst["name"]] = len(cards)
        return counts
