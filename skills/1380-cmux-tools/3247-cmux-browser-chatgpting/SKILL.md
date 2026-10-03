---
name: cmux-browser-chatgpting
description: This skill should be used when the user asks to "ask ChatGPT", "frag ChatGPT", "send a question to ChatGPT", "schick das an ChatGPT", "frag GPT ob", "ask GPT something", or wants to type a question into the ChatGPT browser surface open in cmux and read the response.
---

# cmux Browser ChatGPT

Send a question to the ChatGPT browser surface open in cmux and capture the response as a screenshot.

## Workflow

**Discovery:** Find the ChatGPT surface across all workspaces by scanning the cmux tree for `chatgpt.com`.

**Interaction:** Fill the prompt input, submit, wait for the response, screenshot.

Run the bundled script, passing the question as a single quoted argument:

```bash
bash <skill_base_dir>/scripts/ask-chatgpt.sh "<question>"
```

The script prints the surface ref it found and the path to the response screenshot.

After the script completes, read the screenshot and relay ChatGPT's answer to the user.

## Key Implementation Notes

- ChatGPT uses a `contenteditable` div with id `#prompt-textarea` — use `cmux browser fill`, not `type`
- `cmux browser eval` and `cmux browser press Enter` raise a JS exception on chatgpt.com — use the send-button click fallback chain instead
- `cmux browser snapshot` returns almost nothing on chatgpt.com (heavy JS app) — screenshots are the only reliable way to read the response
- Surface refs change between sessions — always discover fresh via `cmux tree --all`, never hardcode
