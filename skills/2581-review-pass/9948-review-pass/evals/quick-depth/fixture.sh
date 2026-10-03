#!/usr/bin/env bash
set -euo pipefail
git init -q -b main .
git config user.email eval@example.com
git config user.name eval
mkdir -p src/middleware docs
cat > README.md <<"EOF"
# shop-api
Small HTTP API for the shop.
EOF
cat > src/middleware/auth.ts <<"EOF"
export function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).end();
  if (req.user.role !== "admin") return res.status(403).end();
  next();
}
EOF
cat > src/cart.ts <<"EOF"
export function total(items: { price: number; qty: number }[]) {
  return items.reduce((s, i) => s + i.price * i.qty, 0);
}
EOF
git add -A && git commit -qm "feat: initial api"
cat > src/cart.ts <<"EOF"
export function total(items: { price: number; qty: number }[]) {
  return items.reduce((s, i) => s + i.price * Math.max(0, i.qty || 0), 0);
}
EOF
