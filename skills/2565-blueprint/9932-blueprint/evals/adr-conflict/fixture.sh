#!/usr/bin/env bash
set -euo pipefail
mkdir -p src/cart src/api src/db
cat > src/cart/total.ts <<'EOF'
export type Line = { sku: string; price: number; qty: number };
export function total(lines: Line[]): number {
  return lines.reduce((s, l) => s + l.price * l.qty, 0);
}
EOF
cat > src/api/routes.ts <<'EOF'
import { Router } from "./router";
export const routes = new Router();
routes.get("/cart", (req) => req.session.cart);
EOF
cat > src/db/schema.ts <<'EOF'
// Postgres schema (see docs/adr/0001)
export const tables = { users: "users", carts: "carts" };
EOF
mkdir -p docs/adr
cat > docs/adr/0001-postgres-for-all-persistence.md <<'EOF'
# ADR 0001: Postgres for all persistence

- **Status**: accepted
- **Date**: 2026-03-02

## Decision
All durable application state lives in the existing Postgres database. No new datastores (Redis, DynamoDB, document stores) without a superseding ADR.

## Consequences
New features add tables or columns in `src/db/schema.ts`, migrated with the existing migration tool.
EOF
mkdir -p docs/intent
cat > docs/intent/0001-saved-carts.md <<'EOF'
# Design Notes: Saved carts

- **Status**: settled
- **Date**: 2026-09-20
- **Slug**: saved-carts

## Resolved decisions
- Who can save: signed-in shoppers only — guests have no account page to restore from.
- Limit: at most 5 saved carts per shopper — keeps the account page scannable.
- Restore semantics: restoring replaces the active cart after a confirm prompt — merging caused duplicate-line confusion in user tests.
- Prices: a restored saved cart reprices every line at current prices — stale prices are a support burden.

## Open questions
- OPEN: should saved carts expire? — product owner to decide.

## Edge cases
- Restoring a saved cart that contains a discontinued SKU — handle. Drop the line and show a notice.
- Saving when already at 5 saved carts — handle. Block with a message naming the limit.
- Two tabs restoring different saved carts at once — defer. Single-session feature for now.
- Guest tries to save — won't. The save control is not rendered for guests.

## Glossary
Saved cart — a named snapshot of cart lines a signed-in shopper keeps on their account. (aliases: wishlist cart; canonical: saved cart)
Active cart — the one cart the shopper is currently checking out with.
Restore — replace the active cart with a saved cart's lines, repriced.
EOF
mkdir -p docs/prds
cat > docs/prds/0001-saved-carts.md <<'EOF'
# PRD: Saved carts

- **Status**: approved
- **Sources**: docs/intent/0001-saved-carts.md, docs/adr/0001-postgres-for-all-persistence.md

## Problem Statement
Signed-in shoppers lose carts they build for later; support gets requests to "get my cart back".

## Glossary
- **Saved cart** — a named snapshot of cart lines a signed-in shopper keeps on their account.
- **Active cart** — the cart currently being checked out.
- **Restore** — replace the active cart with a saved cart's lines, repriced at current prices.

## Solution
A "Save cart" action on the cart page and a "Saved carts" list on the account page with Restore and Delete. Stored in a new `saved_carts` table in Postgres.

## User Stories
1. As a signed-in shopper, I save my active cart under a name.
2. As a signed-in shopper, I restore a saved cart, replacing my active cart after confirming.
3. As a signed-in shopper, I delete a saved cart.

## Implementation Decisions
- Max 5 saved carts per shopper, enforced server-side.
- Restore reprices every line; discontinued SKUs are dropped with a notice.

## Edge cases (from design notes)
- Discontinued SKU on restore — handle.
- Saving at the 5-cart limit — handle.
- Two tabs restoring at once — defer.
- Guest save — won't.

## Out of Scope
Sharing saved carts; expiry (open question).
EOF
