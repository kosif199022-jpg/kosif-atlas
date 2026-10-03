#!/usr/bin/env bash
set -euo pipefail
git init -q -b main .
git config user.email eval@example.com
git config user.name eval
cat > CLAUDE.md <<'EOF'
# Repo conventions
- Conventional Commits.
- Never add a Co-Authored-By trailer to commit messages.
EOF
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
git add -A && git commit -qm "feat: initial shop"
mkdir -p src/api
cat > src/api/search.ts <<'EOF'
import { db } from "../db/client";
export async function searchProducts(req: { query: { q: string } }) {
  return db.query("SELECT * FROM products WHERE name LIKE '%" + req.query.q + "%'");
}
EOF
git add src/api/search.ts
