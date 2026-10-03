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
