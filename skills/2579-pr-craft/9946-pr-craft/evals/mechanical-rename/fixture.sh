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
# A mechanical rename across 30 files: large file count, one seam.
mkdir -p src/features
for i in $(seq 1 30); do printf 'import { total } from "../cart/total";\nexport const f%s = () => total([]);\n' "$i" > "src/features/f$i.ts"; done
git add -A && git commit -qm "feat: initial shop"
sed -i 's/export function total(/export function cartTotal(/' src/cart/total.ts
for i in $(seq 1 30); do sed -i 's/{ total }/{ cartTotal }/; s/=> total(/=> cartTotal(/' "src/features/f$i.ts"; done
