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
echo "lockfile-v1" > bun.lock
git add -A && git commit -qm "feat: initial shop"
# The task: a NaN guard in one file. Plus noise that is NOT this task.
cat > src/cart/total.ts <<'EOF'
export type Line = { sku: string; price: number; qty: number };
export function total(lines: Line[]): number {
  return lines.reduce((s, l) => s + l.price * Math.max(0, Number(l.qty) || 0), 0);
}
EOF
echo "lockfile-v2 regenerated" >> bun.lock
mkdir -p scratch && echo "debug notes, do not commit" > scratch/notes.txt
