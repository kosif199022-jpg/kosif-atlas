---
description: "On wrap-up, the Design Notes block is written to docs/intent with edge cases and Glossary."
tags: [grill-me, artifact]
max_turns: 14
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Write]
---

We already went through the interview. Here is where we landed, wrap it up. Slug: saved-carts.

- Only signed-in shoppers can save; guests never see the save control (won't support guests).
- Max 5 saved carts per shopper; saving at the limit is blocked with a message.
- Restore replaces the active cart after a confirm prompt, and reprices every line at today's prices.
- A discontinued SKU in a restored cart is dropped with a notice.
- Two tabs restoring different carts at once: deferred, single-session for now.
- Still undecided: whether saved carts expire. Product owner decides.
- Terms: "saved cart" is the canonical name (people also say "wishlist cart"); "active cart" is the one being checked out; "restore" means replace the active cart with a saved cart's lines, repriced.
